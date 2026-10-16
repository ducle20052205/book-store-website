// Bộ đo accessibility (Edge headless qua CDP). Xem scripts/a11y/README.md.
//   node scripts/a11y/run.mjs control            đối chứng (phải chạy trước mọi lượt đo; thoát 1 nếu có ca trượt)
//   node scripts/a11y/run.mjs tokens             B.2: tỉ lệ của mọi token màu với trắng và paper
//   node scripts/a11y/run.mjs survey [--out=f]   đo 21 route; ghi JSONL
//   node scripts/a11y/run.mjs report <f>         in bảng từ file JSONL
// Cần: app đang chạy ở BASE (mặc định http://127.0.0.1:3100, bản `next start` trỏ stack Supabase cục bộ), và
// API_URL, SECRET_KEY (xem README). Từ chối chạy nếu BASE hoặc API_URL không phải loopback.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { launch, sleep } from "./cdp.mjs";
import { ADMIN_EMAIL, API_URL, BASE, SECRET_KEY, USER_EMAIL, assertLocal, baseline, psql } from "./common.mjs";
import { runControls } from "./controls.mjs";
import { measureState } from "./measure.mjs";
import { printReport } from "./report.mjs";
import { tokenReport } from "./tokens.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB = readFileSync(join(HERE, "lib.js"), "utf-8");
const arg = (name, def) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? def;

/** 12 route của lượt đo bản 1.4 (20 trạng thái): dùng cho phép đối chiếu "9 liên kết giữa câu". */
const OLD12 = new Set([
  "admin-thong-ke", "admin-sach-danh-sach", "admin-sach-moi", "admin-sach-moi-co-loi", "admin-sach-slug",
  "quen-mat-khau", "quen-mat-khau-het-han", "quen-mat-khau-da-gui", "dang-nhap", "dang-nhap-co-loi", "dang-ky", "dang-ky-co-loi",
  "tu-sach-slug-van-hoc", "tai-khoan", "tai-khoan-co-loi", "tai-khoan-da-luu", "hoan-tat-don", "don-hang-chi-tiet",
  "dat-lai-mat-khau", "dat-lai-mat-khau-co-loi",
]);

/** Cấp phiên cho `email` mà không cần mật khẩu: liên kết `recovery` do Auth cục bộ phát (không gửi thư), đổi lấy phiên ở /auth/callback. */
async function recoveryLogin(b, email) {
  const r = await fetch(`${API_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "recovery", email }),
  });
  const j = await r.json();
  const token = j.hashed_token ?? j.properties?.hashed_token;
  if (!token) throw new Error(`generate_link không trả hashed_token (HTTP ${r.status})`);
  await b.goto(`${BASE}/auth/callback?token_hash=${encodeURIComponent(token)}&type=recovery`, 2500);
  return b.waitFor(`location.pathname==='/dat-lai-mat-khau'`, 12000);
}

async function control() {
  assertLocal();
  const b = await launch("ctl");
  let res;
  try { res = await runControls(b, LIB); } finally { await b.close(); }
  for (const r of res) console.log(`${r.pass ? "ĐẠT  " : "TRƯỢT"} ${r.id}\n        mong đợi: ${r.expect}\n        đo được : ${r.observed}`);
  const bad = res.filter((r) => !r.pass).length;
  console.log(`\nĐỐI CHỨNG: ${res.length - bad}/${res.length} đạt`);
  process.exit(bad ? 1 : 0);
}

function tokens() {
  const t = tokenReport();
  console.log(`paper=${t.paper} · ${t.rows.length} token hex · token ghi nhiều lần: ${t.dupes.join(", ") || "không"} · không phải hex: ${t.nonHex.map((x) => `${x.name}=${x.value}`).join(", ") || "không"}`);
  console.log("token | hex | ↔#FFFFFF | ↔paper | ≥3 cả hai");
  for (const r of t.rows) console.log(`${r.name} | ${r.hex} | ${r.vsWhite} | ${r.vsPaper} | ${r.both ? "CÓ" : "không"}`);
  console.log(`\nĐạt ≥3:1 với CẢ trắng và paper: ${t.rows.filter((r) => r.both).length}/${t.rows.length}: ${t.rows.filter((r) => r.both).map((r) => r.name).join(", ")}`);
}

async function survey() {
  assertLocal();
  const out = arg("out", join(tmpdir(), "a11y-survey.jsonl"));
  const restore = !process.argv.includes("--no-restore");
  writeFileSync(out, "");
  const emit = (o) => appendFileSync(out, JSON.stringify(o) + "\n");

  const titles = psql("select title from public.books").split("\n").filter(Boolean);
  const before = baseline();
  const startTs = psql("select clock_timestamp()");
  const uid = psql(`select id from auth.users where email='${USER_EMAIL}'`);
  const profileHash = () => psql(`select md5((to_jsonb(p) - 'updated_at')::text) from public.profiles p where id='${uid}'`);
  const profileBefore = profileHash();
  emit({ setup: { before, profileBefore } });

  // dữ liệu để dựng URL (đều từ DB cục bộ)
  const slugFirst = psql("select slug from public.books order by slug limit 1");
  const slugNormal = psql("select slug from public.books where discount_price is null and stock_quantity>0 order by slug limit 1");
  const slugSale = psql("select slug from public.books where discount_price is not null and stock_quantity>0 order by slug limit 1");
  const slugOos = psql("select slug from public.books where stock_quantity=0 order by slug limit 1");
  const shelves = psql("select slug from public.collections order by slug").split("\n").filter(Boolean);
  const orderCode = psql(`select order_code from public.orders where user_id='${uid}' order by created_at desc limit 1`);

  // giỏ của khách thử: /thanh-toan chuyển đi nếu giỏ trống. Nếu trống, thêm 2 dòng bằng SQL và gỡ đúng 2 dòng đó ở cuối.
  let cartRowsAdded = [];
  if (Number(psql(`select count(*) from public.cart_items where user_id='${uid}'`)) === 0) {
    // `psql -At` in cả thẻ lệnh ("INSERT 0 2") lẫn các id, nên chỉ nhận dòng đúng dạng uuid.
    cartRowsAdded = psql(`insert into public.cart_items(user_id, book_id, quantity) select '${uid}', id, 1 from public.books where discount_price is null and stock_quantity>1 order by slug limit 2 returning id`)
      .split("\n").filter((x) => /^[0-9a-f-]{36}$/.test(x));
  }
  emit({ setup: { slugFirst, slugNormal, slugSale, slugOos, shelves, orderCodeFound: !!orderCode, cartRowsAdded: cartRowsAdded.length } });

  const run = async (b, name, route, fn) => {
    try { await fn(); emit(await measureState(b, LIB, titles, name, route, { old12: OLD12.has(name) })); console.log(`  ✓ ${name}`); }
    catch (e) { emit({ name, route, error: String(e.message ?? e) }); console.log(`  ✗ ${name}: ${e.message ?? e}`); }
  };
  const to = (b, path) => () => b.goto(`${BASE}${path}`);

  try {
    // ───── ẩn danh ─────
    const A = await launch("anon");
    try {
      console.log("ẩn danh");
      await run(A, "home", "/", to(A, "/"));
      await run(A, "home-chao", "/?chao=1", to(A, "/?chao=1"));
      await run(A, "home-mk", "/?mk=1", to(A, "/?mk=1"));
      await run(A, "sach", "/sach", to(A, "/sach"));
      await run(A, "sach-slug-thuong", "/sach/[slug]", to(A, `/sach/${slugNormal}`));
      await run(A, "sach-slug-giam-gia", "/sach/[slug]", to(A, `/sach/${slugSale}`));
      await run(A, "sach-slug-het-hang", "/sach/[slug]", to(A, `/sach/${slugOos}`));
      await run(A, "tu-sach", "/tu-sach", to(A, "/tu-sach"));
      for (const s of shelves) await run(A, s === "van-hoc-nhat-cho-nguoi-moi-bat-dau" ? "tu-sach-slug-van-hoc" : `tu-sach-slug-${s}`, "/tu-sach/[slug]", to(A, `/tu-sach/${s}`));
      await run(A, "gio-hang-khach", "/gio-hang", to(A, "/gio-hang"));
      await run(A, "dang-nhap", "/dang-nhap", to(A, "/dang-nhap"));
      await run(A, "dang-nhap-co-loi", "/dang-nhap", async () => {
        await A.setInput('input[name="email"]', "khong-ton-tai-xyz@example.com"); await A.setInput('input[name="password"]', "sai-mat-khau-" + Date.now());
        await A.click('button[type="submit"]'); await A.waitFor(`!!document.querySelector('[role=alert]')`, 8000);
      });
      await run(A, "dang-ky", "/dang-ky", to(A, "/dang-ky"));
      await run(A, "dang-ky-co-loi", "/dang-ky", async () => { await A.click('form button[type="submit"]'); await sleep(800); });
      await run(A, "quen-mat-khau", "/quen-mat-khau", to(A, "/quen-mat-khau"));
      await run(A, "quen-mat-khau-het-han", "/quen-mat-khau", to(A, "/quen-mat-khau?loi=het-han"));
      await run(A, "quen-mat-khau-da-gui", "/quen-mat-khau", async () => {
        await A.goto(`${BASE}/quen-mat-khau`); await A.setInput('input[name="email"]', "khong-ton-tai-xyz@example.com");
        await A.click('button[type="submit"]'); await A.waitFor(`!!document.querySelector('[role=status]')`, 6000);
      });
    } finally { await A.close(); }

    // ───── khách có đơn ─────
    const C = await launch("user");
    try {
      console.log("khách");
      const ok = await recoveryLogin(C, USER_EMAIL);
      emit({ setup: { userSession: ok } });
      await run(C, "dat-lai-mat-khau", "/dat-lai-mat-khau", async () => {});
      await run(C, "dat-lai-mat-khau-co-loi", "/dat-lai-mat-khau", async () => { await C.setInput('input[name="password"]', "ngan"); await C.click('button[type="submit"]'); await sleep(900); });
      await run(C, "tai-khoan", "/tai-khoan", to(C, "/tai-khoan"));
      await run(C, "tai-khoan-co-loi", "/tai-khoan", async () => { await C.setInput('input[name="fullName"]', ""); await C.click('form button[type="submit"]'); await sleep(900); });
      // "đã lưu": gửi lại ĐÚNG giá trị đang có, không đổi dữ liệu (băm hồ sơ trước/sau được so ở cuối)
      await run(C, "tai-khoan-da-luu", "/tai-khoan", async () => {
        await C.goto(`${BASE}/tai-khoan`); await C.click('form button[type="submit"]');
        await C.waitFor(`[...document.querySelectorAll('[role=status]')].some(e=>e.textContent.includes('đã lưu'))`, 8000);
      });
      await run(C, "tai-khoan-don-hang", "/tai-khoan/don-hang", to(C, "/tai-khoan/don-hang"));
      await run(C, "don-hang-chi-tiet", "/tai-khoan/don-hang/[code]", to(C, `/tai-khoan/don-hang/${orderCode}`));
      await run(C, "hoan-tat-don", "/thanh-toan/hoan-tat/[code]", to(C, `/thanh-toan/hoan-tat/${orderCode}`));
      await run(C, "gio-hang-khach-co-don", "/gio-hang", to(C, "/gio-hang"));
      await run(C, "thanh-toan", "/thanh-toan", to(C, "/thanh-toan"));
    } finally { await C.close(); }

    // ───── admin ─────
    const D = await launch("admin");
    try {
      console.log("admin");
      const ok = await recoveryLogin(D, ADMIN_EMAIL);
      emit({ setup: { adminSession: ok } });
      await D.goto(`${BASE}/admin`);
      await D.waitFor(`!!document.querySelector('[data-testid="admin-stats"]')`, 10000);
      await run(D, "admin-thong-ke", "/admin", async () => {});
      await run(D, "admin-don-hang", "/admin/don-hang", to(D, "/admin/don-hang"));
      await run(D, "admin-don-hang-chi-tiet", "/admin/don-hang/[code]", to(D, `/admin/don-hang/${orderCode}`));
      await run(D, "admin-sach-danh-sach", "/admin/sach", to(D, "/admin/sach"));
      await run(D, "admin-sach-moi", "/admin/sach/moi", to(D, "/admin/sach/moi"));
      await run(D, "admin-sach-moi-co-loi", "/admin/sach/moi", async () => { await D.click('form button[type="submit"]'); await sleep(900); });
      await run(D, "admin-sach-slug", "/admin/sach/[slug]", to(D, `/admin/sach/${slugFirst}`));
    } finally { await D.close(); }
  } finally {
    // ───── khôi phục dữ liệu thử ─────
    // Mỗi bước độc lập: một bước hỏng không được chặn các bước còn lại, và không bước nào được bỏ qua mà không báo.
    const step = (what, fn) => { try { return fn(); } catch (e) { console.log(`  KHÔI PHỤC LỖI (${what}): ${e.message}`); return null; } };
    if (cartRowsAdded.length) step("giỏ", () => psql(`delete from public.cart_items where id in (${cartRowsAdded.map((x) => `'${x}'`).join(",")})`));
    const eventsNew = step("đếm sự kiện", () => Number(psql(`select count(*) from public.events where created_at > '${startTs}'`))) ?? -1;
    if (restore && eventsNew > 0) step("xoá sự kiện", () => psql(`delete from public.events where created_at > '${startTs}'`));
    const after = step("mốc", () => baseline());
    const unchanged = step("băm hồ sơ", () => profileHash() === profileBefore);
    emit({ restore: { cartRowsRemoved: cartRowsAdded.length, eventsCreatedByRun: eventsNew, eventsDeleted: restore ? eventsNew : 0, profileUnchanged: unchanged, after } });
    console.log(`\nmốc sau lượt đo: ${after?.text}  (kỳ vọng 40 | 4 | 737 | 42 | 84 | 26 | 1897)\nsự kiện do lượt đo tạo: ${eventsNew}${restore ? " (đã xoá)" : ""} · hồ sơ khách không đổi: ${unchanged}\nghi vào: ${out}`);
  }
  process.exit(0);
}

const cmd = process.argv[2];
if (cmd === "control") await control();
else if (cmd === "tokens") tokens();
else if (cmd === "survey") await survey();
else if (cmd === "report") printReport(process.argv[3]);
else { console.log("Dùng: node scripts/a11y/run.mjs <control|tokens|survey|report <file>>"); process.exit(2); }

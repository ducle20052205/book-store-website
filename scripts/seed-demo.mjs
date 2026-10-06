#!/usr/bin/env node
/**
 * Seed dữ liệu demo cho NA Books (spec: docs/specs/dot-seed-du-lieu-demo.md, v1.8).
 *
 *   node scripts/seed-demo.mjs --dry-run | --apply | --teardown | --verify
 *
 * Node thuần, không dependency mới (NFR-S.1): chỉ `node:crypto`, `fetch`, `@supabase/supabase-js`.
 * Mọi con số nằm ở scripts/seed-demo/plan.json và stock-vector.json; file này chỉ ĐỌC chúng.
 * Biến môi trường (không có mặc định trong mã, không bao giờ in giá trị):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SECRET_KEY,
 *   SEED_DEMO_PASSWORD (chỉ --apply cần).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const HERE = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(HERE, "seed-demo", "plan.json"), "utf8"));
const vector = JSON.parse(readFileSync(join(HERE, "seed-demo", "stock-vector.json"), "utf8"));

const MODES = ["--dry-run", "--apply", "--teardown", "--verify"];
const HELP = `Dùng: node scripts/seed-demo.mjs <chế độ>
  --dry-run    không ghi gì; in kế hoạch và các phép tự kiểm
  --apply      dựng 25 tài khoản, 42 đơn, 1.897 sự kiện; đặt tồn kho = vector (chỉ lần đầu)
  --teardown   gỡ dữ liệu demo theo bốn bước, đặt lại tồn kho = vector
  --verify     chỉ đọc; in số đo của các tiêu chí
Biến môi trường: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SECRET_KEY, SEED_DEMO_PASSWORD (--apply).`;

const NAMESPACE = "7f3c9a52-4e1b-4d8a-9c36-2b5e8d1a0f47";
const EMAIL_RE = /^nguoi-dung-\d{2}@example\.com$/;
const emailOf = (i) => `nguoi-dung-${String(i).padStart(2, "0")}@example.com`;
const TZ = "+07:00";
const HOUR = 3600 * 1000;

class Stop extends Error {}
const stop = (msg) => {
  throw new Stop(msg);
};
const log = (...a) => console.log(...a);

// ───────────────────────────── tiện ích thuần ─────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fmtUuid(bytes) {
  const h = Buffer.from(bytes).toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

function uuidv5(name, ns) {
  const h = createHash("sha1").update(Buffer.from(ns.replace(/-/g, ""), "hex")).update(name).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  return fmtUuid(h.subarray(0, 16));
}

function uuidv4From(rand) {
  const b = Array.from({ length: 16 }, () => Math.floor(rand() * 256));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return fmtUuid(b);
}

const orderKey = (n) => uuidv5(`na-books-seed:order:${n}`, NAMESPACE);
const planTime = (o) => Date.parse(`${o.date}T${o.time}${TZ}`);
const unitPrice = (b) => (b.discount_price != null && b.discount_price < b.price ? b.discount_price : b.price);
const monthOf = (ms) => new Date(ms + 7 * HOUR).toISOString().slice(0, 7); // theo giờ Việt Nam
const count = (arr, f) => arr.reduce((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ───────────────────────────── môi trường ─────────────────────────────
function readEnv(needPassword) {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SECRET_KEY", ...(needPassword ? ["SEED_DEMO_PASSWORD"] : [])];
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    console.error(`Thiếu biến môi trường: ${missing.join(", ")}. Script không có giá trị mặc định.`);
    process.exit(2);
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, ""),
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    secret: process.env.SUPABASE_SECRET_KEY,
    password: process.env.SEED_DEMO_PASSWORD,
  };
}

let ENV;
let db;
const authHeaders = (key) => (key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key });

async function http(method, url, { headers = {}, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* thân không phải JSON */
  }
  return { status: res.status, ok: res.ok, json, text };
}

const unwrap = ({ data, error }, what) => {
  if (error) stop(`${what}: ${error.message}`);
  return data;
};

async function fetchAll(build) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const data = unwrap(await build(from, from + 999), "đọc phân trang");
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

// ───────────────────────────── Admin API ─────────────────────────────
async function listDemoUsers() {
  const map = new Map();
  for (let page = 1; ; page++) {
    const r = await http("GET", `${ENV.url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: authHeaders(ENV.secret) });
    if (!r.ok) stop(`Admin API liệt kê tài khoản: HTTP ${r.status}`);
    const users = r.json?.users ?? [];
    for (const u of users) if (EMAIL_RE.test(u.email ?? "")) map.set(u.email, u.id);
    if (users.length < 200) break;
  }
  return map;
}

async function createUser(email, fullName) {
  const r = await http("POST", `${ENV.url}/auth/v1/admin/users`, {
    headers: authHeaders(ENV.secret),
    body: { email, password: ENV.password, email_confirm: true, user_metadata: { full_name: fullName } },
  });
  if (!r.ok) stop(`Admin API tạo ${email}: HTTP ${r.status} ${r.json?.msg ?? r.json?.message ?? ""}`);
  return r.json.id;
}

async function deleteUser(id) {
  const r = await http("DELETE", `${ENV.url}/auth/v1/admin/users/${id}`, { headers: authHeaders(ENV.secret) });
  if (!r.ok) stop(`Admin API xoá tài khoản ${id}: HTTP ${r.status}`);
}

async function signIn(email) {
  const r = await http("POST", `${ENV.url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: ENV.anon },
    body: { email, password: ENV.password },
  });
  if (!r.ok || !r.json?.access_token) stop(`đăng nhập ${email}: HTTP ${r.status}`);
  return r.json.access_token;
}

// ───────────────────────────── tự kiểm plan.json ─────────────────────────────
function checkPlan() {
  const fails = [];
  const check = (name, ok, detail = "") => {
    if (!ok) fails.push(`${name}${detail ? ` (${detail})` : ""}`);
  };
  const ex = plan.expected;
  const orders = plan.orders;
  const sellable = Object.keys(vector).filter((s) => vector[s] > 0);
  const zeroSlugs = Object.keys(vector).filter((s) => vector[s] === 0).sort();
  const cutoff = Date.parse(plan.window.refuseIfNowBefore);
  const winStart = Date.parse(`${plan.window.start}T00:00:00${TZ}`);

  const perMonth = count(orders, (o) => o.date.slice(0, 7));
  const byStatus = count(orders, (o) => o.status);
  const byPay = count(orders, (o) => o.payment_method);
  const conf = count(orders, (o) => String(o.has_confirmation));
  const perAcc = count(orders, (o) => o.account);
  const nonC = orders.filter((o) => o.status !== "cancelled");
  const units = {};
  const unitsNc = {};
  for (const o of orders) for (const l of o.lines) units[l.slug] = (units[l.slug] ?? 0) + l.qty;
  for (const o of nonC) for (const l of o.lines) unitsNc[l.slug] = (unitsNc[l.slug] ?? 0) + l.qty;
  const touched = Object.keys(units);
  const touchedNc = Object.keys(unitsNc);
  const cap = (s) => Math.min(ex.sales.maxUnitsPerBook, vector[s] - ex.sales.reserveUnits);
  const zeroAfter = Object.keys(vector).filter((s) => vector[s] - (unitsNc[s] ?? 0) === 0).sort();
  const atCap = sellable.filter((s) => (units[s] ?? 0) === cap(s));
  const totalUnits = Object.values(units).reduce((a, b) => a + b, 0);
  const unitsNcTotal = Object.values(unitsNc).reduce((a, b) => a + b, 0);

  check("số đơn", orders.length === ex.ordersTotal, `${orders.length}≠${ex.ordersTotal}`);
  check("n = 1..42 liên tục", orders.every((o, i) => o.n === i + 1));
  check("7 nhóm tháng × ordersPerMonth", Object.keys(perMonth).length === 7 && Object.values(perMonth).every((v) => v === ex.ordersPerMonth), JSON.stringify(perMonth));
  check("trạng thái khớp expected", eq(Object.fromEntries(Object.entries(byStatus).sort()), Object.fromEntries(Object.entries(ex.byStatus).sort())), JSON.stringify(byStatus));
  check("payment khớp expected", eq(Object.fromEntries(Object.entries(byPay).sort()), Object.fromEntries(Object.entries(ex.paymentMethod).sort())), JSON.stringify(byPay));
  check("has_confirmation khớp expected", conf.true === ex.hasConfirmation.true && conf.false === ex.hasConfirmation.false, JSON.stringify(conf));
  check("mọi mốc đơn nằm trong cửa sổ và trước 2026-10-06 00:00", orders.every((o) => planTime(o) >= winStart && planTime(o) < cutoff));
  check("tài khoản 1..25 đều có đơn, mỗi tài khoản trong khoảng cho phép", Object.keys(perAcc).length === ex.accounts.count && Object.values(perAcc).every((v) => v >= ex.accounts.minOrdersPerAccount && v <= ex.accounts.maxOrdersPerAccount));
  check("mỗi đơn 1–3 dòng, qty 1|2, slug khác nhau trong đơn", orders.every((o) => o.lines.length >= ex.linesPerOrder.min && o.lines.length <= ex.linesPerOrder.max && o.lines.every((l) => l.qty >= ex.quantityPerLine.min && l.qty <= ex.quantityPerLine.max) && new Set(o.lines.map((l) => l.slug)).size === o.lines.length));
  check("vector: số khoá/tổng/số 0", Object.keys(vector).length === ex.vector.keys && Object.values(vector).reduce((a, b) => a + b, 0) === ex.vector.total && zeroSlugs.length === ex.vector.zeros);
  check("mọi slug trong lines nằm trong vector", touched.every((s) => s in vector));
  check("không dùng slug V = 0", !touched.some((s) => vector[s] === 0));
  check("trần min(5, V−1) mỗi slug", touched.every((s) => units[s] <= cap(s)));
  check("slug khác nhau được chạm", touched.length >= ex.sales.distinctSlugsMin && touched.length === ex.sales.distinctSlugs, `${touched.length}`);
  check("slug khác nhau trong đơn không hủy", touchedNc.length >= ex.sales.distinctSlugsInNonCancelledMin && touchedNc.length === ex.sales.distinctSlugsInNonCancelled, `${touchedNc.length}`);
  check("đúng 4 slug về 0 sau khi trừ kho và là 4 slug V=0", zeroAfter.length === ex.sales.zeroSlugsAfterApply && eq(zeroAfter, zeroSlugs), zeroAfter.join(","));
  check("tổng đơn vị khớp expected", totalUnits === ex.sales.totalUnits && unitsNcTotal === ex.sales.unitsNonCancelled, `${totalUnits}/${unitsNcTotal}`);
  check("slug chạm trần khớp expected", atCap.length === ex.sales.slugsAtCap, `${atCap.length}`);
  check("emailOffsetSeconds null ⇔ has_confirmation = false", orders.every((o) => (o.emailOffsetSeconds === null) === !o.has_confirmation));
  check("orderPlacedOffsetSeconds là số nguyên", orders.every((o) => Number.isInteger(o.orderPlacedOffsetSeconds)));
  check("tổng sự kiện theo loại", Object.values(plan.events.byType).reduce((a, b) => a + b, 0) === plan.events.total);
  check("phễu giảm dần", ["page_view", "search", "add_to_cart", "checkout_started", "order_placed"].every((k, i, a) => i === 0 || plan.events.byType[a[i - 1]] > plan.events.byType[k]));

  return {
    fails,
    stats: { perMonth, byStatus, byPay, conf, touched: touched.length, touchedNc: touchedNc.length, atCap, zeroAfter, totalUnits, unitsNcTotal, units, unitsNc, accMin: Math.min(...Object.values(perAcc)), accMax: Math.max(...Object.values(perAcc)) },
  };
}

async function loadBooks() {
  const rows = await fetchAll((f, t) => db.from("books").select("*").order("slug").range(f, t));
  if (rows.length !== 40) stop(`bảng books có ${rows.length} dòng, cần đúng 40`);
  const bySlug = new Map(rows.map((b) => [b.slug, b]));
  const missing = Object.keys(vector).filter((s) => !bySlug.has(s));
  if (missing.length) stop(`slug trong vector không tồn tại trong books: ${missing.join(", ")}`);
  return { rows, bySlug };
}

function timeGuards() {
  const now = Date.now();
  const refuse = Date.parse(plan.window.refuseIfNowBefore);
  const end = new Date(`${plan.window.end}T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + plan.window.warnIfNowLaterThanEndByMonths);
  if (now > end.getTime()) console.warn("CẢNH BÁO: dữ liệu demo đang già hơn một năm, sửa cửa sổ và sinh lại mảng đơn trong plan.json.");
  return { tooEarly: now < refuse, refuse: plan.window.refuseIfNowBefore };
}

async function commonChecks({ forApply }) {
  const g = timeGuards();
  if (forApply && g.tooEarly) stop(`now() sớm hơn ${g.refuse}: cửa sổ cố định chỉ an toàn khi mọi mốc đã nằm trong quá khứ.`);
  const books = await loadBooks();
  const { fails, stats } = checkPlan();
  if (fails.length) stop(`plan.json / stock-vector.json lệch khối expected:\n  - ${fails.join("\n  - ")}`);
  return { books, stats, tooEarly: g.tooEarly };
}

// ───────────────────────────── dữ liệu tài khoản ─────────────────────────────
const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng"];
const DEM = ["Văn", "Thị", "Minh", "Quốc", "Ngọc"];
const TEN = ["An", "Bình", "Châu", "Dũng", "Giang", "Hà", "Hải", "Hiền", "Hưng", "Khánh", "Lan", "Linh", "Long", "Mai", "Nam", "Ngân", "Phong", "Phúc", "Quân", "Quỳnh", "Sơn", "Thảo", "Trang", "Tuấn", "Yến"];
const accountName = (i) => `${HO[(i - 1) % HO.length]} ${DEM[(i - 1) % DEM.length]} ${TEN[i - 1]}`;
const accountPhone = (i) => `028800${String(i).padStart(4, "0")}`;
const accountAddress = (i) => `Số ${10 + i}, đường số ${i}`;

async function loadGeo() {
  const provinces = unwrap(await db.from("provinces").select("code").order("code"), "đọc provinces");
  const picks = [];
  for (let i = 1; i <= plan.accounts.count; i++) {
    const p = provinces[(i - 1) % 10].code;
    const wards = unwrap(await db.from("wards").select("code").eq("province_code", p).order("code").limit(1000), "đọc wards");
    if (!wards.length) stop(`tỉnh ${p} không có phường/xã`);
    picks.push({ province_code: p, ward_code: wards[((i - 1) * 7) % wards.length].code });
  }
  return picks;
}

// ───────────────────────────── --dry-run ─────────────────────────────
async function dryRun() {
  const { stats, tooEarly } = await commonChecks({ forApply: false });
  const users = await listDemoUsers();
  log("[dry-run] không ghi gì.");
  log(`cửa sổ: ${plan.window.start} → ${plan.window.end}; now() ${tooEarly ? "SỚM hơn" : "không sớm hơn"} ${plan.window.refuseIfNowBefore} (--apply ${tooEarly ? "sẽ DỪNG" : "được phép"})`);
  log(`tài khoản demo đang có: ${users.size}/25 → --apply ${users.size === 0 ? "SẼ" : "sẽ KHÔNG"} đặt lại tồn kho = vector`);
  log(`đơn: 42 | tháng ${JSON.stringify(stats.perMonth)} | trạng thái ${JSON.stringify(stats.byStatus)} | payment ${JSON.stringify(stats.byPay)} | has_confirmation ${JSON.stringify(stats.conf)}`);
  log(`đơn mỗi tài khoản: min ${stats.accMin}, max ${stats.accMax}`);
  log(`tồn kho dự kiến sau khi chạy: ${stats.zeroAfter.length} slug ở mức 0 (${stats.zeroAfter.join(", ")})`);
  log(`slug khác nhau được chạm: ${stats.touched} (trong đơn không hủy: ${stats.touchedNc}); tổng đơn vị: ${stats.totalUnits} (không hủy: ${stats.unitsNcTotal})`);
  log(`slug chạm trần min(5, V−1): ${stats.atCap.length} → ${stats.atCap.join(", ")}`);
  const kw = await keywordCounts();
  log(`từ khoá tìm kiếm: ${kw.length}; số từ khoá 0 kết quả: ${kw.filter((k) => k.count === 0).length} (${kw.filter((k) => k.count === 0).map((k) => k.q).join(" | ")})`);
  log("các phép tự kiểm plan.json: ĐẠT toàn bộ (lệch thì đã dừng ở trên).");
}

// ───────────────────────────── từ khoá tìm kiếm thật ─────────────────────────────
const KEYWORDS = ["nhà giả kim", "sapiens", "tâm lý", "cha giàu", "manga", "conan", "khởi nghiệp", "higashino", "nguyễn nhật ánh", "murakami", "kinh tế", "lịch sử", "vũ trụ", "thói quen", "tuổi trẻ", "đắc nhân tâm", "spy x family", "overlord", "harry potter", "blockchain", "nấu ăn"];
const SORTS = ["newest", "price_asc", "price_desc", "bestseller"];

async function keywordCounts() {
  const out = [];
  for (let i = 0; i < KEYWORDS.length; i++) {
    const sort = SORTS[i % SORTS.length];
    const r = await http("POST", `${ENV.url}/rest/v1/rpc/search_books`, { headers: { apikey: ENV.anon, Authorization: `Bearer ${ENV.anon}` }, body: { p_q: KEYWORDS[i], p_sort: sort } });
    if (!r.ok) stop(`search_books "${KEYWORDS[i]}": HTTP ${r.status}`);
    out.push({ q: KEYWORDS[i], sort, count: r.json[0]?.total_count ?? 0 }); // 0 dòng ⇒ 0 kết quả, như lib/queries.ts
  }
  if (out.filter((k) => k.count === 0).length < plan.events.search.zeroResultKeywordsMin) stop("ít hơn 2 từ khoá cho 0 kết quả");
  return out;
}

// ───────────────────────────── --apply ─────────────────────────────
async function setStockVector() {
  for (const [slug, v] of Object.entries(vector)) unwrap(await db.from("books").update({ stock_quantity: v }).eq("slug", slug), `đặt tồn kho ${slug}`);
}

async function apply() {
  const t0 = Date.now();
  const { books } = await commonChecks({ forApply: true });
  const checksumBefore = booksChecksum(books.rows);
  log(`checksum books (trừ stock_quantity) trước: ${checksumBefore}`);

  // 1. tồn kho = vector, chỉ khi chưa có tài khoản demo nào
  let users = await listDemoUsers();
  if (users.size === 0) {
    await setStockVector();
    log("[1] đã đặt tồn kho = vector cho 40 slug");
  } else log("[1] đã có dữ liệu demo, bỏ qua bước đặt tồn kho");

  // 2. tài khoản + hồ sơ
  const geo = await loadGeo();
  let createdUsers = 0;
  const ids = new Map(); // account → id
  for (let i = 1; i <= plan.accounts.count; i++) {
    const email = emailOf(i);
    let id = users.get(email);
    if (!id) {
      id = await createUser(email, accountName(i));
      createdUsers++;
    }
    ids.set(i, id);
    unwrap(await db.from("profiles").update({ full_name: accountName(i), phone: accountPhone(i), address_line: accountAddress(i), ward_code: geo[i - 1].ward_code, province_code: geo[i - 1].province_code }).eq("id", id), `cập nhật hồ sơ ${email}`);
  }
  log(`[2] tài khoản: tạo mới ${createdUsers}, dùng lại ${plan.accounts.count - createdUsers}`);

  // 3. đơn qua place_order
  const bySlug = new Map((await loadBooks()).rows.map((b) => [b.slug, b]));
  const keys = plan.orders.map((o) => orderKey(o.n));
  const existing = unwrap(await db.from("orders").select("idempotency_key,order_code").in("idempotency_key", keys), "tra idempotency_key");
  const haveKey = new Map(existing.map((r) => [r.idempotency_key, r.order_code]));
  const tokens = new Map();
  const codes = new Map();
  const counters = { skipped_existing: 0, created: 0, created_false: 0 };
  for (const o of plan.orders) {
    const key = orderKey(o.n);
    if (haveKey.has(key)) {
      counters.skipped_existing++;
      codes.set(o.n, haveKey.get(key));
      continue;
    }
    const uid = ids.get(o.account);
    unwrap(await db.from("cart_items").delete().eq("user_id", uid), `xoá giỏ cũ tài khoản ${o.account}`);
    unwrap(await db.from("cart_items").insert(o.lines.map((l) => ({ user_id: uid, book_id: bySlug.get(l.slug).id, quantity: l.qty }))), `chèn giỏ đơn ${o.n}`);
    if (!tokens.has(o.account)) tokens.set(o.account, await signIn(emailOf(o.account)));
    const total = o.lines.reduce((s, l) => s + l.qty * unitPrice(bySlug.get(l.slug)), 0);
    const r = await http("POST", `${ENV.url}/rest/v1/rpc/place_order`, {
      headers: { apikey: ENV.anon, Authorization: `Bearer ${tokens.get(o.account)}` },
      body: { p_idempotency_key: key, p_recipient_name: accountName(o.account), p_recipient_phone: accountPhone(o.account), p_address_line: accountAddress(o.account), p_ward_code: geo[o.account - 1].ward_code, p_province_code: geo[o.account - 1].province_code, p_payment_method: o.payment_method, p_note: null, p_expected_total: total },
    });
    if (!r.ok) stop(`place_order đơn ${o.n}: HTTP ${r.status} ${r.json?.message ?? ""}`);
    const row = Array.isArray(r.json) ? r.json[0] : r.json;
    if (row.created) counters.created++;
    else counters.created_false++;
    codes.set(o.n, row.order_code);
  }
  log(`[3] đơn: tạo mới ${counters.created}, skipped_existing ${counters.skipped_existing}, created=false ${counters.created_false}`);

  // 4. trạng thái, đúng vòng đời, mỗi bước một UPDATE
  const LIFE = ["pending", "processing", "shipped", "completed"];
  const cur = new Map(unwrap(await db.from("orders").select("order_code,status").in("order_code", [...codes.values()]), "đọc trạng thái").map((r) => [r.order_code, r.status]));
  let updates = 0;
  for (const o of plan.orders) {
    const code = codes.get(o.n);
    let s = cur.get(code);
    const steps = [];
    if (o.status === "cancelled") {
      if (s === "pending") steps.push("cancelled");
      else if (s !== "cancelled") stop(`đơn ${o.n} đang ${s}, không hủy được từ trạng thái này`);
    } else {
      const from = LIFE.indexOf(s);
      const to = LIFE.indexOf(o.status);
      if (from < 0 || from > to) stop(`đơn ${o.n} đang ${s}, không đi tới ${o.status} được`);
      for (let k = from + 1; k <= to; k++) steps.push(LIFE[k]);
    }
    for (const next of steps) {
      unwrap(await db.from("orders").update({ status: next }).eq("order_code", code), `đơn ${o.n} → ${next}`);
      updates++;
    }
  }
  log(`[4] lệnh UPDATE trạng thái: ${updates}`);

  // 5–6. lùi created_at rồi đặt confirmation_email_sent_at (gán tuyệt đối)
  for (const o of plan.orders) unwrap(await db.from("orders").update({ created_at: new Date(planTime(o)).toISOString() }).eq("order_code", codes.get(o.n)), `lùi created_at đơn ${o.n}`);
  for (const o of plan.orders) {
    const at = o.has_confirmation ? new Date(planTime(o) + o.emailOffsetSeconds * 1000).toISOString() : null;
    unwrap(await db.from("orders").update({ confirmation_email_sent_at: at }).eq("order_code", codes.get(o.n)), `confirmation đơn ${o.n}`);
  }
  log("[5-6] đã gán created_at và confirmation_email_sent_at cho 42 đơn");

  // 7. không còn giỏ
  const idList = [...ids.values()];
  unwrap(await db.from("cart_items").delete().in("user_id", idList), "quét giỏ");
  const left = (await db.from("cart_items").select("id", { count: "exact", head: true }).in("user_id", idList)).count;
  if (left !== 0) stop(`sau khi quét, cart_items của tài khoản demo còn ${left} dòng`);
  log("[7] cart_items của 25 tài khoản demo: 0 dòng");

  // 8. sự kiện
  const events = await buildEvents({ ids, codes, bySlug });
  unwrap(await db.from("events").delete().not("metadata->>seed_ref", "is", null), "xoá sự kiện seed cũ");
  for (let i = 0; i < events.length; i += 500) unwrap(await db.from("events").insert(events.slice(i, i + 500)), "chèn sự kiện");
  log(`[8] sự kiện chèn: ${events.length}`);

  log(`--apply xong sau ${((Date.now() - t0) / 1000).toFixed(1)} s. Chạy --verify:`);
  await verify();
}

async function buildEvents({ ids, codes, bySlug }) {
  const rand = mulberry32(plan.event_seed);
  const ev = [];
  const winStart = Date.parse(`${plan.window.start}T00:00:00${TZ}`);
  const days = Math.round((Date.parse(`${plan.window.end}T00:00:00${TZ}`) - winStart) / (24 * HOUR)) + 1;
  const randTime = () => {
    for (;;) {
      const d = Math.floor(rand() * days);
      const dow = new Date(Date.parse(`${plan.window.start}T00:00:00Z`) + d * 24 * HOUR).getUTCDay();
      if ((dow === 0 || dow === 6) && rand() > 0.4) continue; // cuối tuần thưa hơn
      return winStart + d * 24 * HOUR + (7 * 3600 + Math.floor(rand() * 16.5 * 3600)) * 1000;
    }
  };
  const orders = unwrap(await db.from("orders").select("id,order_code,created_at,total_amount,payment_method,user_id").in("order_code", [...codes.values()]), "đọc đơn");
  const byCode = new Map(orders.map((o) => [o.order_code, o]));
  const items = unwrap(await db.from("order_items").select("order_id,quantity").in("order_id", orders.map((o) => o.id)), "đọc order_items");
  const qtyOf = new Map();
  for (const it of items) qtyOf.set(it.order_id, (qtyOf.get(it.order_id) ?? 0) + it.quantity);

  const accIds = [...ids.keys()].sort((a, b) => a - b);
  const userSession = new Map(accIds.map((a) => [a, uuidv4From(rand)]));
  const anonPool = Array.from({ length: plan.events.sessionIdsDistinctMin }, () => uuidv4From(rand));
  let anonCounter = 0;
  const pickAcc = () => accIds[Math.floor(rand() * accIds.length)];
  const allSlugs = [...bySlug.keys()];
  const sellable = allSlugs.filter((s) => vector[s] > 0);
  const push = (type, num, uid, sid, ms, meta) => ev.push({ event_type: type, user_id: uid, session_id: sid, created_at: new Date(ms).toISOString(), metadata: { ...meta, seed_ref: `seed:${type}:${num}` } });
  const ident = (anon, acc) => (anon ? { uid: null, sid: anonPool[anonCounter++ % anonPool.length] } : { uid: ids.get(acc), sid: userSession.get(acc) });

  const T = plan.events.byType;
  for (let i = 0; i < T.page_view; i++) {
    const { uid, sid } = ident(i % 20 < 17, pickAcc()); // 85% ẩn danh
    const b = bySlug.get(allSlugs[Math.floor(rand() * allSlugs.length)]);
    push("page_view", i + 1, uid, sid, randTime(), { page: "book_detail", book_id: b.id, slug: b.slug });
  }
  const kw = await keywordCounts();
  for (let i = 0; i < T.search; i++) {
    const { uid, sid } = ident(i % 20 < 17, pickAcc());
    const k = kw[i < kw.length ? i : Math.floor(rand() * kw.length)];
    push("search", i + 1, uid, sid, randTime(), { q: k.q, results_count: k.count, category: null, sort: k.sort });
  }
  for (let i = 0; i < T.add_to_cart; i++) {
    const { uid, sid } = ident(i % 5 < 3, pickAcc()); // 60% ẩn danh
    const b = bySlug.get(sellable[Math.floor(rand() * sellable.length)]);
    push("add_to_cart", i + 1, uid, sid, randTime(), { book_id: b.id, quantity: 1 + Math.floor(rand() * 2) });
  }
  for (const o of plan.orders) {
    const ord = byCode.get(codes.get(o.n));
    const base = planTime(o); // created_at cuối cùng của đơn (đã gán ở bước 5)
    const k = o.n;
    const uid = ids.get(o.account);
    const sid = userSession.get(o.account);
    push("checkout_started", k, uid, sid, base - (60 + ((k * 13) % 540)) * 1000, { items_count: qtyOf.get(ord.id), total_amount: ord.total_amount });
    push("order_placed", k, uid, sid, base + o.orderPlacedOffsetSeconds * 1000, { order_code: ord.order_code, items_count: qtyOf.get(ord.id), total_amount: ord.total_amount, payment_method: ord.payment_method });
  }
  for (let k = 43; k <= T.checkout_started; k++) {
    const acc = pickAcc();
    const target = plan.events.abandonedCart.totalQuantityMin + Math.floor(rand() * (plan.events.abandonedCart.totalQuantityMax - plan.events.abandonedCart.totalQuantityMin + 1));
    let left = target;
    let total = 0;
    const used = new Set();
    while (left > 0) {
      const s = sellable[Math.floor(rand() * sellable.length)];
      if (used.has(s)) continue;
      used.add(s);
      const q = Math.min(left, 1 + Math.floor(rand() * 2));
      total += q * unitPrice(bySlug.get(s));
      left -= q;
    }
    push("checkout_started", k, ids.get(acc), userSession.get(acc), randTime(), { items_count: target, total_amount: total });
  }
  const firstOrder = new Map();
  for (const o of plan.orders) if (!firstOrder.has(o.account)) firstOrder.set(o.account, planTime(o));
  for (let i = 0; i < T.sign_up; i++) {
    const acc = accIds[i % accIds.length];
    const ms = Math.max(winStart, firstOrder.get(acc) - (3600 + Math.floor(rand() * 172800)) * 1000);
    push("sign_up", i + 1, ids.get(acc), userSession.get(acc), ms, { method: "password" });
  }
  for (let i = 0; i < T.login; i++) {
    const acc = pickAcc();
    push("login", i + 1, ids.get(acc), userSession.get(acc), randTime(), { method: "password" });
  }
  if (ev.length !== plan.events.total) stop(`sinh ${ev.length} sự kiện, cần ${plan.events.total}`);
  return ev;
}

// ───────────────────────────── --teardown ─────────────────────────────
async function teardown() {
  await commonChecks({ forApply: false });
  const users = await listDemoUsers();
  const idList = [...users.values()];
  if (idList.length) {
    unwrap(await db.from("orders").delete().in("user_id", idList), "[1] xoá orders");
    log(`[1] đã xoá orders của ${idList.length} tài khoản demo (order_items cascade)`);
  } else log("[1] không còn tài khoản demo; orders của chúng đã được xoá từ trước");
  unwrap(await db.from("events").delete().not("metadata->>seed_ref", "is", null), "[2] xoá events theo seed_ref");
  if (idList.length) unwrap(await db.from("events").delete().in("user_id", idList), "[2] xoá events theo user_id");
  log("[2] đã xoá events (seed_ref khác null, và theo user_id demo)");
  for (const id of idList) await deleteUser(id);
  const remain = (await listDemoUsers()).size;
  if (remain !== 0) {
    console.error(`[3] sau vòng xoá còn ${remain} tài khoản nguoi-dung-%@example.com`);
    process.exit(1);
  }
  log(`[3] đã xoá ${idList.length} tài khoản qua Admin API; còn lại: 0`);
  await setStockVector();
  log("[4] đã đặt lại tồn kho = vector (40 slug)");
}

// ───────────────────────────── --verify ─────────────────────────────
function booksChecksum(rows) {
  const h = createHash("sha256");
  for (const r of [...rows].sort((a, b) => (a.slug < b.slug ? -1 : 1))) {
    const { stock_quantity, ...rest } = r;
    void stock_quantity;
    h.update(JSON.stringify(rest));
  }
  return h.digest("hex").slice(0, 16);
}

async function verify() {
  timeGuards();
  const out = [];
  const add = (id, text) => out.push(`${id} | ${text}`);
  const { rows: books } = await loadBooks();
  const idMap = await listDemoUsers();
  const ids = [...idMap.values()];
  const inIds = (q) => (ids.length ? q.in("user_id", ids) : q.in("user_id", ["00000000-0000-0000-0000-000000000000"]));

  const sum = books.reduce((s, b) => s + b.stock_quantity, 0);
  const zeros = books.filter((b) => b.stock_quantity === 0).map((b) => b.slug).sort();
  const orders = await fetchAll((f, t) => inIds(db.from("orders").select("id,order_code,status,created_at,total_amount,payment_method,user_id,confirmation_email_sent_at")).order("id").range(f, t));
  const orderIds = orders.map((o) => o.id);
  const items = orderIds.length ? await fetchAll((f, t) => db.from("order_items").select("order_id,quantity").in("order_id", orderIds).order("id").range(f, t)) : [];
  const events = await fetchAll((f, t) => db.from("events").select("id,event_type,user_id,session_id,created_at,metadata").not("metadata->>seed_ref", "is", null).order("id").range(f, t));
  const carts = ids.length ? (await db.from("cart_items").select("id", { count: "exact", head: true }).in("user_id", ids)).count : 0;

  add("TC-S.1", `tài khoản demo ${idMap.size} | orders ${orders.length} | order_items ${items.length} | events seed ${events.length} | sum(stock) ${sum} | slug tồn kho 0: ${zeros.length}`);
  add("TC-S.1", `cart_items của tài khoản demo: ${carts}`);
  const mism = Object.entries(vector).filter(([s, v]) => books.find((b) => b.slug === s).stock_quantity !== v);
  add("TC-S.2", `ô tồn kho ≠ vector: ${mism.length}/40 | slug tồn kho 0: ${zeros.length} [${zeros.join(", ")}] | sum ${sum}`);

  let withFive = 0;
  const provinces = new Set();
  if (ids.length) {
    const prof = unwrap(await db.from("profiles").select("id,full_name,phone,address_line,ward_code,province_code,email").in("id", ids), "đọc profiles");
    withFive = prof.filter((p) => p.full_name && p.phone && p.address_line && p.ward_code && p.province_code).length;
    prof.forEach((p) => provinces.add(p.province_code));
    add("TC-S.6", `tài khoản ${idMap.size} | đủ 5 trường ${withFive}/${prof.length} | email khớp @example.com ${prof.filter((p) => /@example\.com$/.test(p.email ?? "")).length}/${prof.length} | tỉnh khác nhau ${provinces.size}`);
  } else add("TC-S.6", "chưa có tài khoản demo");

  const future = orders.filter((o) => Date.parse(o.created_at) > Date.now()).length;
  const stamps = orders.map((o) => Date.parse(o.created_at));
  add("TC-S.7", `đơn ${orders.length} | trạng thái ${JSON.stringify(count(orders, (o) => o.status))} | tháng ${JSON.stringify(count(orders, (o) => monthOf(Date.parse(o.created_at))))} | tương lai ${future} | min ${stamps.length ? new Date(Math.min(...stamps)).toISOString() : "-"} max ${stamps.length ? new Date(Math.max(...stamps)).toISOString() : "-"}`);

  const byType = count(events, (e) => e.event_type);
  const nullShare = (t) => {
    const r = events.filter((e) => e.event_type === t);
    return r.length ? `${((100 * r.filter((e) => e.user_id === null).length) / r.length).toFixed(1)}%` : "-";
  };
  const orderByCode = new Map(orders.map((o) => [o.order_code, o]));
  const qty = new Map();
  items.forEach((i) => qty.set(i.order_id, (qty.get(i.order_id) ?? 0) + i.quantity));
  const refNo = (e) => Number(e.metadata.seed_ref.split(":")[2]);
  const placed = events.filter((e) => e.event_type === "order_placed");
  const checkout = events.filter((e) => e.event_type === "checkout_started");
  const placedMatch = placed.filter((e) => {
    const o = orderByCode.get(e.metadata.order_code);
    return o && o.user_id === e.user_id && Number(o.total_amount) === Number(e.metadata.total_amount) && Math.abs(Date.parse(o.created_at) - Date.parse(e.created_at)) <= 5000;
  }).length;
  const bookIds = new Set(books.map((b) => b.id));
  const pv = events.filter((e) => e.event_type === "page_view");
  const sr = events.filter((e) => e.event_type === "search");
  const placedByNo = new Map(placed.map((e) => [refNo(e), e]));
  const notEarlier = checkout.filter((c) => refNo(c) <= 42 && !(Date.parse(c.created_at) < Date.parse(placedByNo.get(refNo(c))?.created_at ?? 0))).length;
  const matched = checkout.filter((c) => {
    const p = placedByNo.get(refNo(c));
    if (refNo(c) > 42 || !p) return false;
    const o = orderByCode.get(p.metadata.order_code);
    return o && c.user_id === o.user_id && Number(c.metadata.total_amount) === Number(o.total_amount) && c.metadata.items_count === qty.get(o.id);
  }).length;
  const abandoned = checkout.filter((c) => refNo(c) >= 43);
  const abandonedOk = abandoned.filter((c) => !placedByNo.has(refNo(c)) && c.metadata.total_amount > 0 && c.metadata.items_count >= 1 && c.metadata.items_count <= 3).length;
  add("TC-S.8", `theo loại ${JSON.stringify(byType)} | tổng ${events.length} | ẩn danh page_view ${nullShare("page_view")} search ${nullShare("search")} add_to_cart ${nullShare("add_to_cart")} | session khác nhau ${new Set(events.map((e) => e.session_id)).size}`);
  add("TC-S.8", `order_placed khớp đơn ${placedMatch}/${placed.length} | page_view book_id có thật ${pv.filter((e) => bookIds.has(e.metadata.book_id)).length}/${pv.length} | search đủ 4 khoá ${sr.filter((e) => ["q", "results_count", "category", "sort"].every((k) => k in e.metadata)).length}/${sr.length} | từ khoá 0 kết quả ${new Set(sr.filter((e) => e.metadata.results_count === 0).map((e) => e.metadata.q)).size}`);
  add("TC-S.8", `checkout_started khớp đơn ${matched}/42 | bỏ dở hợp lệ ${abandonedOk}/${abandoned.length}`);

  const sold = items.filter((i) => orders.find((o) => o.id === i.order_id)?.status !== "cancelled").reduce((s, i) => s + i.quantity, 0);
  add("TC-S.9", `books ${books.length} dòng | checksum (trừ stock_quantity) ${booksChecksum(books)} | tồn kho 0: ${zeros.length} | ${vectorTotal()} − sum(stock) = ${vectorTotal() - sum} vs tổng quantity đơn không hủy = ${sold}`);
  add("THÊM", `checkout_started k mà created_at KHÔNG sớm hơn order_placed cùng k: ${notEarlier}`);
  add("THÊM", `slug tồn kho 0: ${zeros.length} [${zeros.join(", ")}]`);
  out.forEach((l) => log(l));
}

const vectorTotal = () => Object.values(vector).reduce((a, b) => a + b, 0);

// ───────────────────────────── main ─────────────────────────────
const mode = MODES.find((m) => process.argv.includes(m));
if (!mode) {
  console.error(HELP);
  process.exit(1);
}
ENV = readEnv(mode === "--apply");
db = createClient(ENV.url, ENV.secret, { auth: { persistSession: false, autoRefreshToken: false } });
try {
  if (mode === "--dry-run") await dryRun();
  else if (mode === "--apply") await apply();
  else if (mode === "--teardown") await teardown();
  else {
    await commonChecks({ forApply: false });
    await verify();
  }
} catch (e) {
  console.error(e instanceof Stop ? `DỪNG: ${e.message}` : `LỖI: ${e.message}`);
  process.exit(e instanceof Stop ? 3 : 1);
}

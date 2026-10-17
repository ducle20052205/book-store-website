// `run.mjs cartslot [--runs=5] [--kbps=60]`: đo slot giỏ hàng của header lúc fallback và lúc ổn định, trên `/` với khách đã
// đăng nhập có 2 dòng trong giỏ. Phương pháp theo 2B.2 (TC-4/5/6) nhưng tạo cửa sổ fallback bằng cách GIỚI HẠN BĂNG THÔNG TẢI
// của trình duyệt (phần động của Suspense nằm cuối luồng HTML nên đến muộn), thay vì làm chậm Supabase, để đo được cả hai
// nhánh mã mà không phải build lại với địa chỉ API khác.
//
// Mỗi lượt đo: (1) tên khả truy cập (cây accessibility) và bề rộng liên kết LÚC FALLBACK; (2) số phần tử focusable trong vùng nội
// dung của boundary; (3) đặt focus lên liên kết trong cửa sổ fallback rồi chờ boundary ổn định: focus còn không (cùng một node,
// còn nối với DOM); (4) tên và bề rộng LÚC ỔN ĐỊNH; (5) CLS của lượt tải (hai chế độ: băng thông thường và bị giới hạn).
import { launch, sleep } from "./cdp.mjs";
import { API_URL, BASE, SECRET_KEY, USER_EMAIL, assertLocal, psql } from "./common.mjs";

const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1] ?? d;

// Chạy ở mỗi tài liệu mới, trước mọi script của trang.
const INIT = `(() => {
  window.__cls = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  const FOCUS = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
  window.__cartSnap = () => {
    const link = document.querySelector('header a[href="/gio-hang"]');
    if (!link) return null;
    const r = link.getBoundingClientRect();
    const lb = (link.getAttribute('aria-labelledby') || '').split(/\\s+/).filter(Boolean).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ');
    const text = link.getAttribute('aria-label') || lb || link.textContent || '';
    // vùng nội dung của boundary: span có id header-cart-name (bản mới) hoặc chính liên kết (bản cũ: cả liên kết nằm trong boundary)
    const region = document.getElementById('header-cart-name') || link;
    const focusable = region.querySelectorAll(FOCUS).length + (region.matches(FOCUS) ? 1 : 0);
    return { w: +r.width.toFixed(2), h: +r.height.toFixed(2), x: +r.x.toFixed(2), text: text.replace(/\\s+/g, ' ').trim(), stable: /sản phẩm/.test(text), focusableInRegion: focusable, linkFocusable: link.tabIndex >= 0 };
  };
})()`;

const LINK = `document.querySelector('header a[href="/gio-hang"]')`;

async function run(b, throttleKbps) {
  await b.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: throttleKbps ? throttleKbps * 1024 : -1, uploadThroughput: -1 });
  await b.send("Page.navigate", { url: `${BASE}/` });
  const out = { sawFallback: false };
  const t0 = Date.now();
  let focused = false;
  while (Date.now() - t0 < 60000) {
    let s = null;
    try { s = await b.evalJs("window.__cartSnap ? window.__cartSnap() : null"); } catch { /* tài liệu đang chuyển */ }
    if (s && !s.stable && !out.sawFallback) {
      out.sawFallback = true;
      out.fallback = s;
      out.fallbackAx = (await b.axOf(LINK))?.name ?? null;
      focused = await b.evalJs(`(() => { const l = ${LINK}; window.__fl = l; l.focus(); return document.activeElement === l; })()`);
      out.focusSet = focused;
    }
    if (s && s.stable) {
      out.stable = s;
      out.stableAx = (await b.axOf(LINK))?.name ?? null;
      if (out.sawFallback) {
        out.focusKept = await b.evalJs("document.activeElement === window.__fl");
        out.fallbackNodeConnected = await b.evalJs("window.__fl.isConnected");
        out.activeAfter = await b.evalJs("(() => { const a = document.activeElement; return a && a !== document.body ? a.tagName.toLowerCase() + (a.getAttribute('href') ? '[' + a.getAttribute('href') + ']' : '') : 'body'; })()");
      }
      break;
    }
    await sleep(15);
  }
  await sleep(700);
  out.cls = await b.evalJs("+window.__cls.toFixed(5)");
  return out;
}

export async function cartSlot() {
  assertLocal();
  const runs = Number(arg("runs", "5")), kbps = Number(arg("kbps", "60"));
  const uid = psql(`select id from auth.users where email='${USER_EMAIL}'`);
  let added = [];
  if (Number(psql(`select count(*) from public.cart_items where user_id='${uid}'`)) === 0) {
    added = psql(`insert into public.cart_items(user_id, book_id, quantity) select '${uid}', id, 1 from public.books where discount_price is null and stock_quantity>1 order by slug limit 2 returning id`).split("\n").filter((x) => /^[0-9a-f-]{36}$/.test(x));
  }
  const startTs = psql("select clock_timestamp()");
  const b = await launch("cartslot");
  const res = { throttled: [], natural: [] };
  try {
    // đăng nhập bằng liên kết recovery của Auth cục bộ (không cần mật khẩu)
    const r = await fetch(`${API_URL}/auth/v1/admin/generate_link`, { method: "POST", headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ type: "recovery", email: USER_EMAIL }) });
    const token = (await r.json()).hashed_token;
    await b.goto(`${BASE}/auth/callback?token_hash=${encodeURIComponent(token)}&type=recovery`, 2500);
    await b.send("Page.addScriptToEvaluateOnNewDocument", { source: INIT });
    for (let i = 0; i < runs; i++) res.throttled.push(await run(b, kbps));
    for (let i = 0; i < runs; i++) res.natural.push(await run(b, 0));
  } finally {
    await b.close();
    if (added.length) psql(`delete from public.cart_items where id in (${added.map((x) => `'${x}'`).join(",")})`);
    const ev = Number(psql(`select count(*) from public.events where created_at > '${startTs}'`));
    if (ev > 0) psql(`delete from public.events where created_at > '${startTs}'`);
    console.log(`(khôi phục: ${added.length} dòng giỏ đã gỡ, ${ev} sự kiện đã xoá)`);
  }
  // ───── báo cáo ─────
  const T = res.throttled;
  const saw = T.filter((x) => x.sawFallback);
  console.log(`\nBăng thông ${kbps} KB/s, ${runs} lượt: thấy cửa sổ fallback ${saw.length}/${runs}`);
  const row = (x, i) => `  #${i + 1} fallback{w=${x.fallback?.w}, focusableTrongVùng=${x.fallback?.focusableInRegion}, tên AX="${x.fallbackAx}"} → ổn định{w=${x.stable?.w}, focusableTrongVùng=${x.stable?.focusableInRegion}, tên AX="${x.stableAx}"} · focus đặt được=${x.focusSet} giữ được=${x.focusKept} node cũ còn nối=${x.fallbackNodeConnected} focus sau=${x.activeAfter} · CLS=${x.cls}`;
  saw.forEach((x, i) => console.log(row(x, i)));
  const dw = saw.map((x) => Math.abs((x.stable?.w ?? 0) - (x.fallback?.w ?? 0)));
  console.log(`CHÊNH BỀ RỘNG fallback↔ổn định: ${dw.map((d) => d.toFixed(2)).join(", ")} px (lớn nhất ${Math.max(0, ...dw).toFixed(2)})`);
  console.log(`SỐ FOCUSABLE trong vùng boundary: lúc fallback ${JSON.stringify(saw.map((x) => x.fallback.focusableInRegion))}; lúc ổn định ${JSON.stringify(saw.map((x) => x.stable.focusableInRegion))}`);
  console.log(`TÊN lúc fallback: ${JSON.stringify([...new Set(saw.map((x) => x.fallbackAx))])} · lúc ổn định: ${JSON.stringify([...new Set(T.map((x) => x.stableAx))])} · số lượt ổn định chứa " ,": ${T.filter((x) => (x.stableAx ?? "").includes(" ,")).length}`);
  console.log(`FOCUS KHÔNG MẤT: ${saw.filter((x) => x.focusSet && x.focusKept).length}/${saw.length} lượt (đặt được focus trong cửa sổ fallback: ${saw.filter((x) => x.focusSet).length}/${saw.length})`);
  console.log(`CLS băng thông bị giới hạn: ${JSON.stringify(T.map((x) => x.cls))} · CLS băng thông thường: ${JSON.stringify(res.natural.map((x) => x.cls))} (lớn nhất ${Math.max(...res.natural.map((x) => x.cls), ...T.map((x) => x.cls))})`);
  console.log(`tên lúc ổn định (băng thông thường): ${JSON.stringify([...new Set(res.natural.map((x) => x.stableAx))])}`);
  return res;
}

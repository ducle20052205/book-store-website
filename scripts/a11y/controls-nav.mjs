// Đối chứng cho phép đo liên kết bỏ qua (D2) và phép đo bàn phím của nút mở/đóng (TC-A.5). Tách khỏi controls.mjs cho gọn;
// controls.mjs gọi `runNavControls` ở cuối.
import { BASE } from "./common.mjs";
import { keyboardToggle, tabStopsBeforeMain } from "./measure.mjs";

/** `inject(b, html)` chèn khối HTML tổng hợp vào #a11y-ctl (định nghĩa ở controls.mjs). */
export async function runNavControls(b, lib, inject) {
  const res = [];
  const add = (id, expect, pass, observed) => res.push({ id, expect, pass, observed });

  // ───── D2. Gỡ liên kết bỏ qua trong bộ nhớ thì số đếm quay về đúng số cũ (8; 9 ở /?chao=1) ─────
  // Chỉ chạy được khi trang CÓ liên kết (sau FR-A.1); trước đó ghi "bỏ qua" (pass = null), không tính là đạt.
  for (const [path, want] of [["/dang-nhap", 8], ["/?chao=1", 9]]) {
    const id = `D2 gỡ liên kết bỏ qua thì còn ${want} điểm dừng (${path})`;
    await b.goto(`${BASE}${path}`);
    await b.evalJs(lib);
    const has = await b.evalJs(`!!document.querySelector('a[href="#noi-dung"]')`);
    if (!has) { add(id, `${want + 1} khi có liên kết, ${want} khi gỡ`, null, "trang chưa có liên kết #noi-dung: bỏ qua ca"); continue; }
    const withLink = await tabStopsBeforeMain(b);
    await b.evalJs(`document.querySelector('a[href="#noi-dung"]').remove()`);
    const without = await tabStopsBeforeMain(b);
    add(id, `${want + 1} khi có liên kết, ${want} khi gỡ`, withLink.stops === want + 1 && without.stops === want, `có=${withLink.stops} gỡ=${without.stops}`);
  }

  // ───── Bàn phím: nút tốt phải qua; hai nút hỏng (không đóng bằng Escape; đóng nhưng mất focus) phải trượt đúng chỗ ─────
  await b.goto(`${BASE}/dang-nhap`);
  await b.evalJs(lib);
  await inject(b, `<button id="kg" aria-expanded="false" aria-controls="pg">Tot</button><div id="pg" hidden><a href="#a">lien ket</a></div>
    <button id="ke" aria-expanded="false" aria-controls="pe">Khong Escape</button><div id="pe" hidden><a href="#a">lien ket</a></div>
    <button id="kf" aria-expanded="false" aria-controls="pf">Mat focus</button><div id="pf" hidden><a href="#a">lien ket</a></div>`);
  await b.evalJs(`(()=>{
    const wire=(btnId,panId,onEsc)=>{const btn=document.getElementById(btnId),pan=document.getElementById(panId);
      btn.addEventListener('click',()=>{const o=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!o));pan.hidden=o});
      document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&onEsc&&btn.getAttribute('aria-expanded')==='true'){btn.setAttribute('aria-expanded','false');pan.hidden=true;onEsc(btn)}})};
    wire('kg','pg',(btn)=>btn.focus());
    wire('kf','pf',()=>document.activeElement&&document.activeElement.blur());
    wire('ke','pe',null);
    return 1})()`);
  const kg = await keyboardToggle(b, "document.getElementById('kg')");
  const ke = await keyboardToggle(b, "document.getElementById('ke')");
  const kf = await keyboardToggle(b, "document.getElementById('kf')");
  add("Bàn phím phải KHÔNG bắt nút tốt", "S1 và S2: mở, đóng, focus về nút; S2: Tab vào panel", kg.S1.opens && kg.S1.closes && kg.S1.focusBack && kg.S2.opens && kg.S2.tabIntoPanel && kg.S2.closes && kg.S2.focusBack, JSON.stringify(kg));
  add("Bàn phím phải BẮT nút không đóng bằng Escape", "mở được, closes=false", ke.S1.opens && ke.S1.closes === false, JSON.stringify(ke.S1));
  add("Bàn phím phải BẮT nút đóng rồi mất focus", "closes=true, focusBack=false", kf.S2.closes && kf.S2.focusBack === false, JSON.stringify(kf.S2));
  return res;
}

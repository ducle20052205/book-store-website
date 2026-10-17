// Đối chứng của bộ đo. Mỗi ca chèn một vi phạm TỔNG HỢP (phải bị bắt) kèm một bản "tốt" (phải KHÔNG bị bắt) vào DOM
// trong bộ nhớ của một trang công khai (/dang-nhap), cùng một lượt chạy. So số đo trong trang với số tính ĐỘC LẬP bên
// Node (common.mjs), không chỉ kiểm cờ đạt/trượt: một phép đo bắt đúng vì sai lý do vẫn bị phát hiện ở chỗ lệch số.
// Một ca đối chứng "đạt" khi phép đo đúng; ca nào không đạt nghĩa là PHÉP ĐO hỏng, không phải trang có lỗi.
import { sleep } from "./cdp.mjs";
import { BASE, blend, ratioHex, ratioRgb, rgbOf } from "./common.mjs";
import { coverNames, glueChecked, tabStopsBeforeMain } from "./measure.mjs";
import { runChang3Controls } from "./controls-chang3.mjs";
import { runCoverControls } from "./controls-cover.mjs";
import { runNavControls } from "./controls-nav.mjs";

const ROOT = "document.getElementById('a11y-ctl')";
const near = (a, b, tol) => a !== null && b !== null && Math.abs(a - b) <= tol;
const COVER = 'class="book-cover-shadow" style="display:inline-block;width:40px;height:60px;background:#26306B"';

async function inject(b, html) {
  await b.evalJs(`(()=>{document.getElementById('a11y-ctl')?.remove();const box=document.createElement('div');box.id='a11y-ctl';box.style.cssText='background:#fff;padding:16px;position:relative';box.innerHTML=${JSON.stringify(html)};document.body.prepend(box);return true})()`);
}

export async function runControls(b, lib) {
  const res = [];
  const add = (id, expect, pass, observed) => res.push({ id, expect, pass: !!pass, observed });

  await b.goto(`${BASE}/dang-nhap`);
  await b.evalJs(lib);

  // ───── A.1 placeholder ─────
  await inject(b, `<style>#ca1::placeholder{color:#949494;opacity:1}#ca2::placeholder{color:#5F6379;opacity:1}</style>
    <div><input id="ca1" placeholder="x"></div>
    <div><input id="ca2" placeholder="x"></div>
    <div><input id="ca3" class="h-12 w-full rounded-field border bg-surface px-3.5 text-base text-ink-900" placeholder="goi y mac dinh"></div>
    <div style="display:none"><input id="ca4" placeholder="an"></div>`);
  const ph = await b.evalJs(`window.__a11y.measurePlaceholders(${ROOT})`);
  const row = (s) => ph.rows.find((r) => r.sel === s);
  const e1 = ratioHex("#949494", "#FFFFFF"), e2 = ratioHex("#5F6379", "#FFFFFF");
  const defaultExpected = ratioRgb(blend("#1A1C2E", 0.5, "#FFFFFF"), rgbOf("#FFFFFF"));
  add("A.1 phải BẮT: #949494 trên trắng", `tỉ lệ ≈ ${e1.toFixed(2)} (<4,5)`, row("input#ca1") && !row("input#ca1").unparsed && near(row("input#ca1").ratio, e1, 0.03) && row("input#ca1").ratio < 4.5, `${row("input#ca1")?.ratio} · ${row("input#ca1")?.raw}`);
  add("A.1 phải KHÔNG bắt: #5F6379 trên trắng", `tỉ lệ ≈ ${e2.toFixed(2)} (≥4,5)`, row("input#ca2") && !row("input#ca2").unparsed && near(row("input#ca2").ratio, e2, 0.03) && row("input#ca2").ratio >= 4.5, `${row("input#ca2")?.ratio} · ${row("input#ca2")?.raw}`);
  add("A.1 màu MẶC ĐỊNH của Tailwind (không ghi đè) được đo, không bị bỏ qua", `đo được, ≈ ${defaultExpected.toFixed(2)} (50% ink-900 trên trắng)`, row("input#ca3") && !row("input#ca3").unparsed && near(row("input#ca3").ratio, defaultExpected, 0.15), `${row("input#ca3")?.ratio ?? "KHÔNG CÓ DÒNG"} · ${row("input#ca3")?.raw ?? ""} · how=${row("input#ca3")?.how}`);
  add("A.1 sổ cái: found = measured + unparsed + notVisible", "4 = 3 + 0 + 1", ph.found === 4 && ph.found === ph.measured + ph.unparsed + ph.notVisible && ph.notVisible === 1, `found=${ph.found} measured=${ph.measured} unparsed=${ph.unparsed} notVisible=${ph.notVisible}`);

  // ───── B. ranh giới ô nhập ─────
  const box = "height:30px;box-sizing:border-box;width:120px";
  await inject(b, `<div style="background:#fff;padding:8px"><input id="cb1" style="border:1px solid #EFEDE8;background:#fff;${box}"></div>
    <div style="background:#fff;padding:8px"><input id="cb2" style="border:1px solid #6F6F6F;background:#fff;${box}"></div>
    <div style="background:#EDE6D9;padding:8px"><input id="cb3" style="border:1px solid #6F6F6F;background:#fff;${box}"></div>`);
  const bd = await b.evalJs(`window.__a11y.measureBoundaries(${ROOT})`);
  const br = (s) => bd.rows.find((r) => r.sel === s);
  const b1 = ratioHex("#EFEDE8", "#FFFFFF"), b2 = ratioHex("#6F6F6F", "#FFFFFF"), b3 = ratioHex("#6F6F6F", "#EDE6D9");
  add("B phải BẮT: viền #EFEDE8 trên trắng", `viền↔ngoài ≈ ${b1.toFixed(2)}, ok=false`, br("input#cb1") && near(br("input#cb1").rBorderOutside, b1, 0.03) && br("input#cb1").ok === false, `rBO=${br("input#cb1")?.rBorderOutside} rBI=${br("input#cb1")?.rBorderInside} rIO=${br("input#cb1")?.rInsideOutside} ok=${br("input#cb1")?.ok}`);
  add("B phải KHÔNG bắt: viền #6F6F6F trên trắng", `viền↔ngoài ≈ ${b2.toFixed(2)}, ok=true`, br("input#cb2") && near(br("input#cb2").rBorderOutside, b2, 0.03) && br("input#cb2").ok === true, `rBO=${br("input#cb2")?.rBorderOutside} ok=${br("input#cb2")?.ok}`);
  add("B phải KHÔNG bắt: viền #6F6F6F trên paper", `viền↔ngoài ≈ ${b3.toFixed(2)}, ok=true`, br("input#cb3") && near(br("input#cb3").rBorderOutside, b3, 0.03) && br("input#cb3").ok === true, `rBO=${br("input#cb3")?.rBorderOutside} rIO=${br("input#cb3")?.rInsideOutside} ok=${br("input#cb3")?.ok}`);

  // ───── C.1 tên lặp và chữ dính ─────
  await inject(b, `<a id="cc1" href="#"><span ${COVER} role="img" aria-label="Sách Thử Ghi"></span><span>Sách Thử Ghi</span></a>
    <a id="cc2" href="#"><span ${COVER} aria-hidden="true"></span><span>Sách Thử Một</span></a>
    <a id="cg1" href="#"><span>Alpha</span><span aria-hidden="true"> · </span><span>Beta</span></a>
    <a id="cg2" href="#"><span>Gamma </span><span aria-hidden="true">·</span><span> Delta</span></a>`);
  const titles = ["Sách Thử Ghi", "Sách Thử Một"];
  const cov = await coverNames(b, ROOT, titles);
  const c1 = cov.owners[0], c2 = cov.owners[1];
  add("C.1 phải BẮT: tên sách lặp (nhãn bìa + chữ thấy)", "dup=true", cov.owners.length === 2 && c1.dup === true, `name="${c1?.name}" counts=${JSON.stringify(c1?.titleCounts)}`);
  add("C.1 phải KHÔNG bắt: tên sách đúng một lần", "dup=false", c2 && c2.dup === false && Object.values(c2.titleCounts).reduce((s, n) => s + n, 0) === 1, `name="${c2?.name}" counts=${JSON.stringify(c2?.titleCounts)}`);
  const glue = await glueChecked(b, ROOT);
  const g1 = glue.find((g) => g.lastTok === "Alpha"), g2 = glue.find((g) => g.lastTok === "Gamma");
  add("C.1 phải BẮT: chữ dính (không dấu cách quanh nút aria-hidden)", "glued=true", g1 && g1.glueRisk && g1.glued === true, `name="${g1?.ownerName}"`);
  add("C.1 phải KHÔNG bắt: có dấu cách hai bên nút aria-hidden", "glueRisk=false, glued=false", g2 && g2.glueRisk === false && g2.glued === false, `name="${g2?.ownerName}"`);

  // ───── C.2 liên kết giữa câu ─────
  await inject(b, `<p style="color:#000;font-size:16px">Chữ thường <a href="#" style="color:#555;text-decoration:none">lk-bat</a> tiếp tục.</p>
    <p style="color:#000;font-size:16px">Chữ thường <a href="#" style="color:#555;text-decoration:underline">lk-gach</a> tiếp tục.</p>
    <div style="color:#000;font-size:16px">Chữ thường <a href="#" style="color:#555;text-decoration:none">lk-div</a> tiếp tục.</div>`);
  const lk = await b.evalJs(`window.__a11y.measureLinks(${ROOT})`);
  const l1 = lk.find((l) => l.text === "lk-bat"), l2 = lk.find((l) => l.text === "lk-gach"), l3 = lk.find((l) => l.text === "lk-div");
  const lExpected = ratioHex("#555555", "#000000");
  add("C.2 phải BẮT: liên kết không gạch ≈ 2,8:1", `tỉ lệ ≈ ${lExpected.toFixed(2)}, ok=false`, l1 && near(l1.ratio, lExpected, 0.03) && l1.ok === false && l1.byRule14, `ratio=${l1?.ratio} underline=${l1?.underline} ok=${l1?.ok}`);
  add("C.2 phải KHÔNG bắt: cùng màu nhưng có gạch chân", "ok=true", l2 && l2.underline && l2.ok === true, `ratio=${l2?.ratio} underline=${l2?.underline} ok=${l2?.ok}`);
  add("C.2 điểm mù đã biết: liên kết trong <div> thiếu chữ <p>/<li>/<dd>/<span>", "có dòng, byRule14=false (quy tắc 1.4 không chọn)", l3 && l3.byRule14 === false && l3.ok === false, `ratio=${l3?.ratio} byRule14=${l3?.byRule14}`);

  // ───── D. điểm dừng Tab trước <main> ─────
  await b.goto(`${BASE}/dang-nhap`);
  await b.evalJs(lib);
  const d0 = await tabStopsBeforeMain(b);
  await b.evalJs(`(()=>{const a=document.createElement('a');a.href='#x';a.id='a11y-ctl-skip';a.textContent='Diem dung chen';document.body.insertBefore(a,document.body.firstChild);return true})()`);
  const d1 = await tabStopsBeforeMain(b);
  add("D phải BẮT: chèn <a href=#x> đầu <body> thì số điểm dừng +1", `${d0.stops} → ${d0.stops + 1}, điểm đầu là phần tử chèn`, d1.stops === d0.stops + 1 && d1.names[0] === "Diem dung chen", `trước=${d0.stops} sau=${d1.stops} điểm đầu="${d1.names[0]}"`);
  add("D sổ cái: số Tab thật = số phần tử tương tác trước <main> theo DOM", "bằng nhau ở cả hai lượt", d0.stops === d0.domBefore && d1.stops === d1.domBefore, `Tab=${d0.stops}/DOM=${d0.domBefore}; sau chèn Tab=${d1.stops}/DOM=${d1.domBefore}`);

  // ───── bộ đo cũ còn dùng (6.1 chữ, 6.4 svg, 6.3 focus, 6.5 biểu đồ, 6.6 cỡ chữ) ─────
  await b.goto(`${BASE}/dang-nhap`);
  await b.evalJs(lib);
  await inject(b, `<style>#L6:focus{box-shadow:0 0 0 0 #fff,0 0 0 4px #26306B;outline:none}</style>
    <button style="color:#959595;background:#fff;font-size:16px">Nut xam ba chia mot</button>
    <button style="color:#595959;background:#fff;font-size:16px">Nut dam bay chia mot</button>
    <svg width="16" height="16"><circle cx="8" cy="8" r="6" fill="#26306B"/></svg>
    <svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="#26306B"/></svg>
    <input id="L4" type="text" style="border:1px solid #888;height:30px">
    <button id="L5" style="outline:none;box-shadow:none;font-size:16px;color:#1A1C2E">Khong vong focus</button>
    <button id="L6" style="font-size:16px;color:#1A1C2E">Co vong focus</button>
    <div role="img" aria-label="thu"><svg aria-hidden="true" width="100" height="40"><rect x="0" y="0" width="40" height="40" fill="#cc0000"/><rect x="50" y="0" width="40" height="40" fill="#0000cc"/></svg></div>
    <div role="img" aria-label="thu2"><svg aria-hidden="true" width="100" height="40"><rect x="0" y="0" width="40" height="40" fill="#cc0000"/><rect x="50" y="0" width="40" height="40" fill="#0000cc"/><text x="2" y="30">1</text><text x="52" y="30">2</text></svg></div>
    <p style="font-size:11px;color:#1A1C2E">Chu nho muoi mot px</p>
    <p style="font-size:12px;color:#1A1C2E">Chu muoi hai px</p>`);
  const tx = await b.evalJs(`window.__a11y.measureText(${ROOT})`);
  add("6.1 phải BẮT nút xám ~3:1, KHÔNG bắt nút đậm 7:1", "below chứa 'Nut xam', không chứa 'Nut dam'", tx.below.some((x) => x.text.startsWith("Nut xam")) && !tx.below.some((x) => x.text.startsWith("Nut dam")), tx.below.map((x) => `${x.text}=${x.ratio}`).join("; "));
  const sv = await b.evalJs(`window.__a11y.measureSvg(${ROOT})`);
  add("6.4 phải BẮT svg thiếu aria-hidden, KHÔNG bắt svg có aria-hidden", "đúng 1 svg thiếu", sv.svgNoAriaHidden.length === 1 && sv.svgTotal === 4, `svgTotal=${sv.svgTotal} thiếu=${sv.svgNoAriaHidden.length}`);
  const focusOf = async (prev, want) => {
    await b.evalJs(`document.getElementById('${prev}').focus()`);
    await b.key("Tab", "Tab", 9);
    await sleep(80);
    return b.evalJs(`(()=>{const e=document.activeElement;return {is:e&&e.id,d:window.__a11y.describe(e)}})()`).then((r) => ({ ...r.d, right: r.is === want }));
  };
  await b.evalJs("window.__a11y.noTransition()");
  const f5 = await focusOf("L4", "L5"), f6 = await focusOf("L5", "L6");
  add("6.3 phải BẮT phần tử không vòng focus, KHÔNG bắt phần tử có vòng 4px", "L5: none; L6: có vòng, ≥3:1", f5.right && f6.right && f5.indicator === "none" && f6.indicator !== "none" && f6.ratio >= 3, `L5=${f5.indicator}/${f5.ratio} L6=${f6.indicator}/${f6.ratio}`);
  const ch = await b.evalJs(`window.__a11y.measureCharts(${ROOT})`);
  add("6.5 phải BẮT biểu đồ chỉ khác màu, KHÔNG bắt biểu đồ có chữ", "onlyColor: true rồi false", ch.length === 2 && ch[0].onlyColor === true && ch[1].onlyColor === false, JSON.stringify(ch.map((c) => c.onlyColor)));
  add("6.6 phải BẮT chữ 11px (<12), KHÔNG bắt chữ 12px", "tiny chứa 'Chu nho', không chứa 'Chu muoi hai'", tx.tiny.some((x) => x.text.startsWith("Chu nho")) && !tx.tiny.some((x) => x.text.startsWith("Chu muoi hai")), tx.tiny.map((x) => x.text).join("; "));
  // ───── chặng 1: liên kết bỏ qua (D2) và bàn phím ─────
  res.push(...(await runNavControls(b, lib, inject)));
  // ───── chặng 2: điều kiện miễn trừ A11Y-14 ─────
  await b.goto(`${BASE}/dang-nhap`);
  res.push(...(await runCoverControls(b, lib, inject)));
  // ───── chặng 3: chọn-chữ của ô nhập, kiểm bảng số liệu biểu đồ ─────
  res.push(...(await runChang3Controls(b, lib, inject)));
  return res;
}

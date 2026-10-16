// Đo một trạng thái trang đang mở trong trình duyệt: gọi lib.js trong trang rồi bổ sung phần cần cây accessibility
// của trình duyệt (tên khả truy cập) hoặc phím Tab thật, những thứ lib.js không tự làm được.
import { sleep } from "./cdp.mjs";
import { countTitles } from "./common.mjs";

/**
 * D. Nhấn Tab thật từ đầu tài liệu cho tới khi focus vào trong <main>. Trả về số điểm dừng ĐỨNG TRƯỚC main (điểm dừng
 * đầu tiên trong main không tính), tên khả truy cập của từng điểm dừng, và số phần tử tương tác đứng trước main theo
 * thứ tự DOM để kiểm chéo.
 */
export async function tabStopsBeforeMain(b) {
  const start = await b.evalJs("window.__a11y.resetTabStart()");
  const pre = await b.evalJs("window.__a11y.preMain()");
  const names = [];
  let enteredMain = false, wrapped = false;
  for (let i = 0; i < 80; i++) {
    await b.key("Tab", "Tab", 9);
    await sleep(45);
    const info = await b.evalJs("window.__a11y.activeInfo()");
    if (info.isBody) { wrapped = true; break; }
    if (info.inMain) { enteredMain = true; break; }
    const ax = await b.axOf("document.activeElement");
    names.push(ax?.name || info.text || `(${info.tag} không tên)`);
  }
  return { stops: names.length, enteredMain, wrapped, activeAtLoad: start.activeAtLoad, domBefore: pre.domBefore.length, hasMain: pre.hasMain, mainId: pre.mainId, tabindexPositive: pre.tabindexPositive, names };
}

/** C.1 — tên khả truy cập đầy đủ của từng liên kết/nút chứa bìa, kèm số lần mỗi tên sách xuất hiện trong tên đó. */
export async function coverNames(b, root, titles) {
  const co = await b.evalJs(`window.__a11y.coverOwners(${root})`);
  const owners = [];
  for (const row of co.rows) {
    const ax = await b.axOf(`window.__a11y._owners[${row.i}]`);
    const name = ax?.name ?? "";
    const counts = countTitles(name, [...titles, ...row.coverLabels]);
    owners.push({
      ...row, role: ax?.role ?? null, ignored: !!ax?.ignored, name, nameLen: name.length, titleCounts: counts,
      // Liên kết bìa cố ý ẩn khỏi công nghệ hỗ trợ (aria-hidden + tabindex=-1, bản sao của liên kết tên sách bên cạnh)
      // không có tên khả truy cập theo thiết kế: không tính là lặp, dài hay rỗng.
      hiddenFromAT: row.ariaHidden || !!ax?.ignored,
      dup: !(row.ariaHidden || ax?.ignored) && Object.values(counts).some((n) => n >= 2),
      long: !(row.ariaHidden || ax?.ignored) && name.length > 90,
    });
  }
  return { covers: co.covers, coversOutsideInteractive: co.coversOutsideInteractive, owners };
}

/** C.1 — ứng viên chữ dính, kiểm bằng tên khả truy cập thật của vùng chứa. */
export async function glueChecked(b, root) {
  const cands = await b.evalJs(`window.__a11y.glueCandidates(${root})`);
  const out = [];
  for (const c of cands) {
    if (c.ownerIdx === null) { out.push({ ...c, verifiable: false, glued: null, ownerName: null }); continue; }
    const ax = await b.axOf(`window.__a11y._glue[${c.ownerIdx}]`);
    const name = ax?.name ?? "";
    out.push({ ...c, verifiable: true, ownerName: name.slice(0, 120), glued: name.includes(c.lastTok + c.firstTok) });
  }
  return out;
}

/** Đo đầy đủ một trạng thái của survey. `lib` là mã lib.js. */
export async function measureState(b, lib, titles, name, route, extra = {}) {
  await b.evalJs(lib);
  const ph = await b.evalJs("window.__a11y.measurePlaceholders(document)");
  const bd = await b.evalJs("window.__a11y.measureBoundaries(document)");
  const links = await b.evalJs("window.__a11y.measureLinks(document.body)");
  const covers = await coverNames(b, "document.body", titles);
  const glue = await glueChecked(b, "document.body");
  const tx = await b.evalJs("window.__a11y.measureText(document.body)");
  const text = { n: tx.n, unparsed: tx.unparsed, hidden: tx.hidden, groups: tx.groups, below: tx.below.length, exempt: tx.exempt.length, under14: tx.small, under12: tx.tiny.length };
  const page = await b.evalJs("window.__a11y.page()");
  const finalPath = await b.evalJs("location.pathname + location.search");
  const tab = await tabStopsBeforeMain(b);
  return { name, route, finalPath, page, text, placeholders: ph, boundaries: bd, links, covers, glue, tab, ...extra };
}

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
  const layout = await b.evalJs("window.__a11y.layoutMetrics()");
  const ph = await b.evalJs("window.__a11y.measurePlaceholders(document)");
  const bd = await b.evalJs("window.__a11y.measureBoundaries(document)");
  const links = await b.evalJs("window.__a11y.measureLinks(document.body)");
  const covers = await coverNames(b, "document.body", titles);
  const glue = await glueChecked(b, "document.body");
  const tx = await b.evalJs("window.__a11y.measureText(document.body)");
  const text = { n: tx.n, unparsed: tx.unparsed, hidden: tx.hidden, groups: tx.groups, below: tx.below.length, exempt: tx.exempt.length, under14: tx.small, under12: tx.tiny.length };
  const page = await b.evalJs("window.__a11y.page()");
  const finalPath = await b.evalJs("location.pathname + location.search");
  const svg = await b.evalJs("(()=>{const s=window.__a11y.measureSvg(document.body);return {total:s.svgTotal,bad:s.svgNoAriaHidden.length,roleImg:s.roleImg,roleImgNoLabel:s.roleImgNoLabel.length}})()");
  const a14 = await a14Measure(b, "document.body");
  const cartAx = await b.axOf(`document.querySelector('header a[href="/gio-hang"]')`);
  const tab = await tabStopsBeforeMain(b);
  const ax = await axUnnamed(b);
  const focus = await focusWalk(b);
  const skip = await skipLinkCheck(b);
  return { name, route, finalPath, page, layout, svg, a14, headerCartName: cartAx?.name ?? null, ax, focus, skip, text, placeholders: ph, boundaries: bd, links, covers, glue, tab, ...extra };
}

// ───────────── chặng 1: liên kết bỏ qua, duyệt focus, phần tử không tên, bàn phím ─────────────

/**
 * FR-A.1 — Tab một lần từ đầu tài liệu: điểm dừng đầu tiên có phải liên kết `#noi-dung` không, nó nhìn thấy được khi
 * focus không (hộp, màu, tỉ lệ), và Enter có đưa focus vào <main> không. Gỡ dấu `#` khỏi URL ngay sau đó.
 */
export async function skipLinkCheck(b) {
  await b.evalJs("window.__a11y.resetTabStart()");
  await b.key("Tab", "Tab", 9);
  await sleep(80);
  const first = await b.evalJs(`(()=>{const e=document.activeElement;return {href:e&&e.getAttribute?e.getAttribute('href'):null,style:window.__a11y.activeStyle()}})()`);
  const ax = await b.axOf("document.activeElement");
  const isSkip = first.href === "#noi-dung";
  let focusInMain = null, hash = null;
  if (isSkip) {
    await b.press("Enter", "Enter", 13, "\r");
    await sleep(200);
    focusInMain = await b.evalJs("document.activeElement===document.querySelector('main')");
    hash = await b.evalJs("location.hash");
    await b.evalJs("history.replaceState(null,'',location.pathname+location.search)");
  }
  return { firstName: ax?.name ?? null, firstHref: first.href, isSkip, style: first.style, focusInMain, hash };
}

/**
 * Duyệt Tab thật qua mọi phần tử tương tác nhìn thấy (bắt đầu từ phần tử cuối rồi vòng về đầu, như bản 1.4): có tới được
 * không, chỉ báo focus và tỉ lệ của nó. Giữ cách tính của bản 1.4; tắt transition trước khi đọc.
 */
export async function focusWalk(b) {
  await b.evalJs(`(()=>{window.__a11y.noTransition();document.activeElement&&document.activeElement.blur();window.scrollTo(0,0);window.__n=0;window.__list=window.__a11y.interactive(document.body);window.__list.forEach(e=>{e.__i=++window.__n});if(window.__list.length)window.__list[window.__list.length-1].focus();return window.__list.length})()`);
  const total = await b.evalJs("window.__list.length");
  const seen = new Set();
  const rows = [];
  for (let i = 0; i < total + 12; i++) {
    await b.key("Tab", "Tab", 9);
    await sleep(55);
    const d = await b.evalJs(`(()=>{const e=document.activeElement;if(!e||e===document.body)return null;return {i:e.__i??-1,d:window.__a11y.describe(e)}})()`);
    if (d === null) { if (rows.length > 0) break; continue; }
    if (seen.has(d.i) && d.i !== -1) break;
    seen.add(d.i);
    rows.push(d);
  }
  const missed = await b.evalJs(`window.__list.filter(e=>!${JSON.stringify([...seen])}.includes(e.__i)).map(e=>({tag:e.tagName.toLowerCase(),type:e.type||null,text:(e.getAttribute('aria-label')||e.textContent||e.name||'').replace(/\s+/g,' ').trim().slice(0,24)}))`);
  const noIndicator = rows.filter((r) => r.d.indicator === "none").map((r) => `${r.d.tag}:${r.d.text}`);
  const weak = rows.filter((r) => r.d.indicator !== "none" && r.d.ratio < 3).map((r) => `${r.d.tag}:${r.d.text}:${r.d.ratio}`);
  return { interactive: total, stops: rows.length, notReached: missed.length, notReachedSample: missed.slice(0, 5), radios: missed.filter((m) => m.type === "radio").length, noIndicator: noIndicator.length, noIndicatorSample: noIndicator.slice(0, 5), below3: weak.length, below3Sample: weak.slice(0, 5), minRatio: rows.length ? Math.min(...rows.map((r) => r.d.ratio)) : null };
}

const INTERACTIVE_ROLES = new Set(["link", "button", "textbox", "combobox", "searchbox", "checkbox", "radio", "spinbutton", "listbox", "menuitem", "switch", "slider", "tab", "option"]);
/** 6.4 — phần tử tương tác (vai trò từ cây accessibility, không bị bỏ qua) mà không có tên. */
export async function axUnnamed(b) {
  const { nodes } = await b.send("Accessibility.getFullAXTree");
  const inter = nodes.filter((n) => !n.ignored && INTERACTIVE_ROLES.has(n.role?.value));
  const unnamed = inter.filter((n) => !(n.name?.value ?? "").trim());
  return { interactive: inter.length, unnamed: unnamed.length, unnamedRoles: unnamed.slice(0, 5).map((n) => n.role.value) };
}

/**
 * TC-A.5 — Một nút mở/đóng bằng bàn phím. Hai chuỗi: S1 = Enter rồi Escape (focus vẫn ở nút); S2 = Enter, Tab vào panel,
 * Escape. Mỗi chuỗi ghi: mở được không (aria-expanded), panel nhìn thấy không, Tab có vào liên kết trong panel không,
 * Escape có đóng không, focus có về nút không. `buttonExpr` là biểu thức JS trả về nút.
 */
export async function keyboardToggle(b, buttonExpr) {
  const q = async (js) => b.evalJs(`(()=>{const btn=${buttonExpr};${js}})()`);
  const state = () => q(`const id=(btn.getAttribute('aria-controls')||'').split(' ')[0];const p=id?document.getElementById(id):null;return {exp:btn.getAttribute('aria-expanded'),panelVisible:!!p&&p.getBoundingClientRect().width>0,active:document.activeElement===btn,inPanel:!!p&&p.contains(document.activeElement),haspopup:btn.getAttribute('aria-haspopup')}`);
  const out = { haspopup: (await q("return btn.getAttribute('aria-haspopup')")), controls: (await q("return btn.hasAttribute('aria-controls')||null")) };
  for (const seq of ["S1", "S2"]) {
    await q("if(btn.getAttribute('aria-expanded')==='true'){btn.click();}document.activeElement&&document.activeElement.blur&&document.activeElement.blur();btn.focus();return 1");
    await sleep(150);
    const before = await state();
    await b.press("Enter", "Enter", 13, "\r");
    await sleep(250);
    const opened = await state();
    let tabbed = null;
    if (seq === "S2") { await b.key("Tab", "Tab", 9); await sleep(120); tabbed = await state(); }
    await b.key("Escape", "Escape", 27);
    await sleep(250);
    const closed = await state();
    out[seq] = {
      startedClosed: before.exp === "false", opens: opened.exp === "true" && opened.panelVisible,
      tabIntoPanel: tabbed ? tabbed.inPanel : null,
      closes: closed.exp === "false", focusBack: closed.active,
    };
  }
  return out;
}

// ───────────── chặng 2: điều kiện miễn trừ A11Y-14 (tên sách và tác giả của bìa) ─────────────

/** Danh sách sách ({title, author, slug}) cho phép đo A11Y-14; run.mjs nạp từ DB cục bộ, ca đối chứng truyền danh sách riêng. */
export const ctx = { books: [] };
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

/**
 * Phân loại một bìa theo điều kiện miễn trừ A11Y-14 (spec rà soát bản 1.3, mục 3.1).
 * (a) ĐẠT khi tên sách tới công nghệ hỗ trợ bằng ít nhất một đường: nhãn/alt của chính bìa đúng bằng một tên sách (đọc từ
 *     cây accessibility); tên khả truy cập của liên kết bọc chứa tên sách; hoặc bìa nằm trong cây aria-hidden mà tên sách là
 *     chữ thật cạnh bìa. TRƯỢT khi không đường nào đúng (bìa trơ, aria-hidden không chữ, alt rỗng, nhãn không phải tên sách).
 * (b) chỉ xét ở nơi bắt buộc (`bPlace`): tên tác giả là chữ thật cạnh bìa.
 */
export function classifyCover(row, ownerName, axName, books) {
  const adj = norm(row.adjacent);
  const sorted = [...books].sort((a, b) => b.title.length - a.title.length);
  const slug = row.href?.match(/^\/sach\/([^/?#]+)/)?.[1];
  const printed = [row.label, row.imgAlt, row.selfText].filter(Boolean).join(" ");
  const book = (slug && books.find((b) => b.slug === slug)) || sorted.find((b) => printed.includes(b.title)) || null;
  const isTitle = (s) => !!s && books.some((b) => norm(s) === b.title);
  const viaLabel = !row.ariaHidden && isTitle(axName);
  const viaLink = !!ownerName && !row.ownerHidden && (book ? norm(ownerName).includes(book.title) : books.some((b) => norm(ownerName).includes(b.title)));
  const viaText = row.ariaHidden && !!book && adj.includes(book.title);
  const passA = viaLabel || viaLink || viaText;
  const passB = row.bPlace ? !!book && adj.includes(book.author) : null;
  return {
    book: book?.title ?? null, place: row.bPlace, hidden: row.ariaHidden, viaLabel, viaLink, viaText, passA,
    path: row.ariaHidden ? (viaText ? "chữ cạnh bìa" : viaLink ? "tên liên kết bọc" : null) : viaLabel ? "nhãn bìa" : viaLink ? "tên liên kết bọc" : null,
    bReq: !!row.bPlace, passB, ownerHidden: row.ownerHidden, rect: row.rect, adjacent: adj.slice(0, 80),
  };
}

/** Đo mọi bìa nhìn thấy trong `root` (biểu thức JS). */
export async function a14Measure(b, root, books = ctx.books) {
  const info = await b.evalJs(`window.__a11y.coverInfo(${root})`);
  const rows = [];
  for (const r of info.rows) {
    const ownerName = r.ownerIdx !== null ? (await b.axOf(`window.__a11y._covOwner[${r.i}]`))?.name ?? "" : null;
    let axName = null;
    if (!r.ariaHidden) {
      const ax = await b.axOf(`window.__a11y._cov[${r.i}]`);
      axName = ax && !ax.ignored && ax.name ? ax.name : null;
      if (!axName && r.imgAlt !== null) axName = (await b.axOf(`window.__a11y._cov[${r.i}].querySelector('img')`))?.name ?? null;
    }
    rows.push(classifyCover(r, ownerName, axName, books));
  }
  return { covers: rows.length, failA: rows.filter((x) => !x.passA).length, bRequired: rows.filter((x) => x.bReq).length, failB: rows.filter((x) => x.bReq && !x.passB).length, rows };
}

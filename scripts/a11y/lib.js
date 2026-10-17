// Thư viện đo accessibility chạy TRONG trang (nạp bằng Runtime.evaluate, xem run.mjs). Đo ở 1280px.
// Dựng lại từ bộ đo của lượt rà soát bản 1.4 (phần màu, chữ, focus, biểu đồ giữ nguyên cách tính) và thêm các
// phép đo của chặng 0 đợt sửa accessibility: placeholder, ranh giới ô nhập, liên kết giữa câu, tên liên kết chứa
// bìa sách, chữ bị dính, điểm dừng Tab trước <main>.
//
// NGUYÊN TẮC: không bao giờ bỏ qua một phần tử mà không đếm. Mọi nhánh "không đo được" (màu không đọc được, phần
// tử ẩn) trả về một bộ đếm trong kết quả. Bản đo placeholder cũ có `if (!col) continue;` — một ô ăn màu mặc định
// của Tailwind (dạng color-mix) mà không parse được sẽ biến mất khỏi kết quả và phép đo vẫn báo "0 vi phạm".
//
// window.__a11y.measure*() trả về dữ liệu thuần JSON; run.mjs gom và in.
(() => {
  if (window.__a11y) return;

  // ───────────── màu ─────────────
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });

  /** Dự phòng: nhờ canvas đổi mọi chuỗi màu CSS (oklab, color-mix, tên màu…) về RGBA. Sai số làm tròn 8 bit. */
  function viaCanvas(s) {
    cx.fillStyle = "#010203";
    cx.fillStyle = s;
    // Trình duyệt từ chối chuỗi sai thì fillStyle giữ giá trị cũ.
    if (cx.fillStyle === "#010203" && !/^\s*#010203\s*$/i.test(s)) return null;
    cx.clearRect(0, 0, 1, 1);
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255, how: "canvas" };
  }
  const num = (t) => (t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t));

  /** Chuỗi màu tính toán -> {r,g,b,a,how}; `how` cho biết đã đọc bằng cách nào. null nếu không đọc được. */
  function parseColor(s) {
    if (!s) return null;
    s = s.trim();
    if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0, how: "keyword" };
    let m = s.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[ ,\/]+/).filter(Boolean);
      if (p.length >= 3) return { r: parseFloat(p[0]), g: parseFloat(p[1]), b: parseFloat(p[2]), a: p.length > 3 ? num(p[3]) : 1, how: "rgb" };
    }
    m = s.match(/^color\(srgb ([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[ \/]+/).filter(Boolean);
      if (p.length >= 3) return { r: parseFloat(p[0]) * 255, g: parseFloat(p[1]) * 255, b: parseFloat(p[2]) * 255, a: p.length > 3 ? num(p[3]) : 1, how: "color-srgb" };
    }
    return viaCanvas(s);
  }
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  /** Đặt màu `top` (có alpha) lên `bot` (đặc). */
  const over = (top, bot) => { const a = top.a; return { r: top.r * a + bot.r * (1 - a), g: top.g * a + bot.g * (1 - a), b: top.b * a + bot.b * (1 - a), a: 1 }; };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const r2 = (x) => +x.toFixed(2);
  const isSvg = (el) => el instanceof SVGElement;

  /** Nền hiệu dụng của `el`: hợp từ gốc xuống, nhân độ trong suốt tích luỹ của tổ tiên. */
  function effective(el) {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.push(e);
    chain.reverse();
    let bg = { r: 255, g: 255, b: 255, a: 1 }, acc = 1, hasImage = false, unparsed = 0;
    for (const e of chain) {
      const cs = getComputedStyle(e);
      acc *= parseFloat(cs.opacity);
      const c = parseColor(cs.backgroundColor);
      if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && !c) unparsed++;
      if (c && c.a > 0) bg = over({ r: c.r, g: c.g, b: c.b, a: c.a * acc }, bg);
      if (cs.backgroundImage && cs.backgroundImage !== "none" && e !== document.documentElement) hasImage = true;
    }
    return { bg, acc, hasImage, unparsed };
  }
  function visible(el) {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
    }
    return true;
  }
  const ariaHiddenAnc = (el) => !!el.closest('[aria-hidden="true"]');
  const disabledAnc = (el) => !!el.closest('[disabled],[aria-disabled="true"]');
  const label = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".") : "");
  /** Bộ chọn ngắn để người đọc báo cáo tìm lại phần tử: tag[type][name] hoặc tag.class. */
  function sel(el) {
    const t = el.tagName.toLowerCase();
    const bits = [];
    if (el.getAttribute("type")) bits.push(`[type=${el.getAttribute("type")}]`);
    if (el.getAttribute("name")) bits.push(`[name=${el.getAttribute("name")}]`);
    else if (el.id) bits.push(`#${el.id}`);
    return bits.length ? t + bits.join("") : label(el);
  }

  // ───────────── chữ (6.1 / 6.6 / 6.7) — giữ nguyên cách tính của bản 1.4 ─────────────
  function textNodesOf(root) {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    let n;
    while ((n = w.nextNode())) {
      const t = n.textContent.replace(/\s+/g, " ").trim();
      if (!t) continue;
      const el = n.parentElement;
      if (!el || el.closest("script,style,noscript,template,option")) continue;
      if (seen.has(el)) continue;
      seen.add(el);
      out.push(el);
    }
    return out;
  }
  function measureText(root) {
    const groups = new Map(), below = [], exempt = [], tiny = [];
    let n = 0, hidden = 0, small = 0, unparsed = 0;
    for (const el of textNodesOf(root)) {
      if (!visible(el)) { hidden++; continue; }
      const cs = getComputedStyle(el);
      const { bg, acc, hasImage } = effective(el);
      const col = parseColor(isSvg(el) ? cs.fill : cs.color);
      if (!col) { unparsed++; continue; }
      let a = col.a * acc;
      if (isSvg(el)) a *= parseFloat(cs.fillOpacity || "1");
      const text = over({ r: col.r, g: col.g, b: col.b, a }, bg);
      const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10) || 400;
      const r = ratio(text, bg);
      const need = fs >= 18 ? 3 : 4.5;
      const rec = { el: label(el), text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 28), ratio: r2(r), fs: +fs.toFixed(1), fw, fg: hex(text), bg: hex(bg), need, ariaHidden: ariaHiddenAnc(el), disabled: disabledAnc(el), image: hasImage };
      n++;
      const key = [rec.fg, rec.bg, rec.fs, rec.fw].join("|");
      if (!groups.has(key)) groups.set(key, { ...rec, count: 0 });
      groups.get(key).count++;
      if (r < need) (rec.disabled ? exempt : below).push(rec);
      if (fs < 14) small++;
      if (fs < 12) tiny.push(rec);
    }
    return { n, hidden, unparsed, groups: groups.size, below, exempt, small, tiny };
  }

  // ───────────── A. placeholder ─────────────
  /**
   * Mọi ô có thuộc tính placeholder. Mỗi ô: chuỗi màu `::placeholder` tính toán NGUYÊN VĂN, độ trong suốt, nền hiệu dụng
   * của ô, màu sau khi hợp, tỉ lệ. Ô không đọc được màu thành dòng `unparsed` (không bao giờ bị bỏ). Ô ẩn được đếm riêng.
   */
  function measurePlaceholders(root) {
    root = root || document;
    const all = [...root.querySelectorAll("input[placeholder],textarea[placeholder]")];
    const rows = [];
    let notVisible = 0;
    for (const el of all) {
      if (!visible(el)) { notVisible++; continue; }
      const ps = getComputedStyle(el, "::placeholder");
      const own = getComputedStyle(el);
      const raw = ps.color;
      const col = parseColor(raw);
      const { bg, acc } = effective(el);
      const base = { sel: sel(el), ph: el.placeholder.slice(0, 32), raw, rawOpacity: ps.opacity, ownColor: own.color, fs: parseFloat(own.fontSize), bg: hex(bg), how: col ? col.how : null };
      if (!col) { rows.push({ ...base, unparsed: true }); continue; }
      const c = over({ r: col.r, g: col.g, b: col.b, a: col.a * parseFloat(ps.opacity || "1") * acc }, bg);
      rows.push({ ...base, fg: hex(c), ratio: r2(ratio(c, bg)) });
    }
    return { found: all.length, notVisible, measured: rows.filter((x) => !x.unparsed).length, unparsed: rows.filter((x) => x.unparsed).length, rows };
  }

  // ───────────── B. ranh giới ô nhập (WCAG 1.4.11) ─────────────
  /**
   * Với mỗi ô nhập: màu viền, nền BÊN TRONG ô (nền hiệu dụng của chính ô), nền BÊN NGOÀI ngay sát (nền hiệu dụng của
   * cha), và ba tỉ lệ: viền↔ngoài, viền↔trong, trong↔ngoài. Viền có alpha được hợp lên nền trong (nền ô nằm dưới viền).
   * `ok` = ranh giới nhận ra được: viền↔ngoài ≥ 3 hoặc trong↔ngoài ≥ 3.
   */
  function measureBoundaries(root) {
    root = root || document;
    const q = "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]),textarea,select";
    const rows = [];
    let notVisible = 0, unparsed = 0;
    for (const el of root.querySelectorAll(q)) {
      if (!visible(el)) { notVisible++; continue; }
      const cs = getComputedStyle(el);
      const inside = effective(el);
      const outside = effective(el.parentElement);
      const sides = ["Top", "Right", "Bottom", "Left"]
        .map((s) => ({ s, w: parseFloat(cs["border" + s + "Width"]), st: cs["border" + s + "Style"], raw: cs["border" + s + "Color"] }))
        .filter((x) => x.w > 0 && x.st !== "none" && x.st !== "hidden");
      const rIO = ratio(inside.bg, outside.bg);
      let border = null, rBO = null, rBI = null;
      if (sides.length) {
        const col = parseColor(sides[0].raw);
        if (!col) { unparsed++; rows.push({ sel: sel(el), unparsed: true, rawBorder: sides[0].raw }); continue; }
        const bc = over(col, inside.bg);
        border = { hex: hex(bc), w: sides[0].w, raw: sides[0].raw, sides: sides.length };
        rBO = ratio(bc, outside.bg);
        rBI = ratio(bc, inside.bg);
      }
      rows.push({
        sel: sel(el), cls: label(el), border, inside: hex(inside.bg), outside: hex(outside.bg),
        rBorderOutside: rBO === null ? null : r2(rBO), rBorderInside: rBI === null ? null : r2(rBI), rInsideOutside: r2(rIO),
        ok: (rBO !== null && rBO >= 3) || rIO >= 3, image: inside.hasImage || outside.hasImage,
      });
    }
    return { notVisible, unparsed, rows };
  }

  // ───────────── C.2 liên kết giữa câu (WCAG 1.4.1) ─────────────
  /** Đường dẫn ngắn của phần tử cha để tìm lại liên kết: tối đa 3 cấp tổ tiên. */
  function path(el) {
    const bits = [];
    for (let e = el.parentElement, i = 0; e && i < 3 && e.tagName !== "BODY"; e = e.parentElement, i++) bits.unshift(label(e));
    return bits.join(" > ");
  }
  /**
   * Liên kết có chữ thường cùng khối. `byRule14` = đúng quy tắc của bản 1.4 (bộ chọn `p a, li a, dd a, span a`, khối gần
   * nhất `p,li,dd,div` có chữ thường là nút văn bản trực tiếp). Liên kết có chữ cùng khối nhưng KHÔNG khớp bộ chọn đó
   * vẫn được ghi (byRule14 = false): đó là điểm mù của quy tắc.
   */
  function measureLinks(root) {
    root = root || document.body;
    const rule = new Set(root.querySelectorAll("p a[href], li a[href], dd a[href], span a[href]"));
    const rows = [];
    for (const a of root.querySelectorAll("a[href]")) {
      if (!visible(a)) continue;
      const p = a.closest("p,li,dd,div");
      if (!p) continue;
      const around = [...p.childNodes].filter((nd) => nd.nodeType === 3 && nd.textContent.trim().length > 0);
      if (around.length === 0) continue;
      const cs = getComputedStyle(a), ps = getComputedStyle(p);
      const { bg } = effective(a);
      const lc = parseColor(cs.color), pc = parseColor(ps.color);
      const base = { text: a.textContent.replace(/\s+/g, " ").trim().slice(0, 28), where: path(a), byRule14: rule.has(a), fw: parseInt(cs.fontWeight, 10) || 400, parentFw: parseInt(ps.fontWeight, 10) || 400, underline: cs.textDecorationLine.includes("underline") };
      if (!lc || !pc) { rows.push({ ...base, unparsed: true, ok: false }); continue; }
      const L = over(lc, bg), P = over(pc, bg);
      const rr = ratio(L, P);
      rows.push({ ...base, link: hex(L), around: hex(P), ratio: r2(rr), ok: base.underline || rr >= 3 });
    }
    return rows;
  }

  // ───────────── C.1 tên khả truy cập của liên kết/nút chứa bìa ─────────────
  const OWNER_Q = "a[href],button,[role=link],[role=button]";
  /**
   * Liên kết/nút chứa ít nhất một `.book-cover-shadow` nhìn thấy (lớp chỉ có trong BookCover). Giữ tham chiếu ở
   * `window.__a11y._owners` để run.mjs lấy tên khả truy cập từ cây accessibility của trình duyệt, không tự tính lại.
   */
  function coverOwners(root) {
    root = root || document.body;
    const covers = [...root.querySelectorAll(".book-cover-shadow")].filter(visible);
    const map = new Map();
    let outside = 0;
    for (const c of covers) {
      const o = c.closest(OWNER_Q);
      if (!o) { outside++; continue; }
      if (!map.has(o)) map.set(o, []);
      map.get(o).push(c);
    }
    window.__a11y._owners = [...map.keys()];
    const rows = [...map.entries()].map(([o, cs], i) => {
      const h = o.closest("section,aside,article,li,ul,nav") ;
      const hd = h && h.querySelector("h1,h2,h3");
      return {
        i, tag: o.tagName.toLowerCase(), href: o.getAttribute("href"), covers: cs.length, ariaHidden: !!o.closest('[aria-hidden="true"]'), tabindex: o.getAttribute("tabindex"),
        coverLabels: cs.map((c) => (c.getAttribute("aria-label") || c.querySelector("img")?.getAttribute("alt") || "")).filter(Boolean),
        visibleText: (o.innerText || "").replace(/\s+/g, " ").trim().slice(0, 140),
        where: (hd ? hd.textContent.replace(/\s+/g, " ").trim().slice(0, 28) : "") + " | " + label(o),
      };
    });
    return { covers: covers.length, coversOutsideInteractive: outside, rows };
  }

  // ───────────── C.1 chữ bị dính vì nút aria-hidden ở giữa ─────────────
  const NAMEABLE_Q = "a[href],button,summary,h1,h2,h3,h4,h5,h6,[role=link],[role=button],[role=tab],[role=menuitem],[role=heading]";
  /** Chữ của một nhánh, bỏ mọi cây aria-hidden (đúng như cách tính tên khả truy cập bỏ chúng). */
  function textVisibleToAT(node) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1 || node.getAttribute("aria-hidden") === "true") return "";
    return [...node.childNodes].map(textVisibleToAT).join("");
  }
  function sideText(h, dir) {
    for (let n = dir < 0 ? h.previousSibling : h.nextSibling; n; n = dir < 0 ? n.previousSibling : n.nextSibling) {
      const t = textVisibleToAT(n);
      if (t.length) return t;
    }
    return "";
  }
  /**
   * Mọi nút gốc của cây aria-hidden có chữ thật ở CẢ HAI phía (anh em liền kề). `glueRisk` = không có khoảng trắng nào
   * nằm ngoài cây ẩn ở chỗ nối. Cấu trúc chỉ là ứng viên: run.mjs kiểm bằng tên khả truy cập thật của vùng chứa.
   */
  function glueCandidates(root) {
    root = root || document.body;
    const rows = [];
    window.__a11y._glue = [];
    for (const h of root.querySelectorAll('[aria-hidden="true"]')) {
      if (h.parentElement && h.parentElement.closest('[aria-hidden="true"]')) continue;
      const before = sideText(h, -1), after = sideText(h, +1);
      if (!before.trim() || !after.trim()) continue;
      const owner = h.closest(NAMEABLE_Q);
      const idx = owner ? window.__a11y._glue.push(owner) - 1 : null;
      rows.push({
        hTag: h.tagName.toLowerCase(), hText: (h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 8), hVisible: visible(h),
        lastTok: before.trim().split(/\s+/).pop(), firstTok: after.trim().split(/\s+/)[0],
        glueRisk: !(/\s$/.test(before) || /^\s/.test(after)),
        ownerIdx: idx, ownerTag: owner ? owner.tagName.toLowerCase() : null, where: owner ? label(owner) : path(h),
      });
    }
    return rows;
  }

  // ───────────── D. điểm dừng Tab trước <main> ─────────────
  const FOCUSABLE = "a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex=\"-1\"])";
  function interactive(root) {
    return [...(root || document.body).querySelectorAll(FOCUSABLE)].filter((e) => visible(e) && !e.disabled && !e.closest("[inert]"));
  }
  /** Phần tử tương tác nhìn thấy đứng TRƯỚC <main> theo thứ tự DOM — kiểm chéo cho số điểm dừng Tab đếm bằng phím thật. */
  function preMain() {
    const main = document.querySelector("main");
    if (!main) return { hasMain: false, mainId: null, domBefore: [] };
    const before = interactive(document.body).filter((e) => !main.contains(e) && !!(main.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING));
    return { hasMain: true, mainId: main.id || null, tabindexPositive: interactive(document.body).filter((e) => e.tabIndex > 0).length, domBefore: before.map((e) => ({ tag: e.tagName.toLowerCase(), text: (e.getAttribute("aria-label") || e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 28) })) };
  }
  /** Đưa điểm bắt đầu duyệt phím về đầu tài liệu (Chrome giữ điểm bắt đầu cũ sau blur, nên blur thôi chưa đủ). */
  function resetTabStart() {
    const was = document.activeElement && document.activeElement !== document.body ? label(document.activeElement) : null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    getSelection().removeAllRanges();
    document.body.setAttribute("tabindex", "-1");
    document.body.focus();
    document.body.removeAttribute("tabindex");
    window.scrollTo(0, 0);
    return { activeAtLoad: was };
  }
  function activeInfo() {
    const e = document.activeElement;
    const main = document.querySelector("main");
    return { isBody: !e || e === document.body, inMain: !!(main && e && main.contains(e)), tag: e ? e.tagName.toLowerCase() : null, text: e ? (e.getAttribute("aria-label") || e.textContent || e.name || "").replace(/\s+/g, " ").trim().slice(0, 28) : "" };
  }

  // ───────────── focus, svg, biểu đồ (giữ nguyên bản 1.4) ─────────────
  function describe(el) {
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const bgInfo = effective(el.parentElement || el);
    const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 ? { w: parseFloat(cs.outlineWidth), c: parseColor(cs.outlineColor) } : null;
    const layers = [];
    const shadow = cs.boxShadow;
    if (shadow && shadow !== "none") {
      for (const part of shadow.split(/,(?![^(]*\))/)) {
        const inset = /inset/.test(part);
        const col = parseColor(part.match(/rgba?\([^)]*\)|color\([^)]*\)/)?.[0]);
        const nums = part.replace(/rgba?\([^)]*\)|color\([^)]*\)/, "").trim().split(/\s+/).map(parseFloat).filter((x) => !Number.isNaN(x));
        const spread = nums.length >= 4 ? nums[3] : 0;
        if (col && col.a > 0 && spread > 0) layers.push({ c: col, spread, inset });
      }
    }
    let best = 0, kind = "none";
    if (outline && outline.c) { const r = ratio(over(outline.c, bgInfo.bg), bgInfo.bg); if (r > best) { best = r; kind = "outline"; } }
    const ownBg = effective(el).bg;
    for (const l of layers) { const base = l.inset ? ownBg : bgInfo.bg; const r = ratio(over(l.c, base), base); if (r > best) { best = r; kind = l.inset ? "ring-inset" : "ring"; } }
    return { tag: el.tagName.toLowerCase(), text: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("name") || "").replace(/\s+/g, " ").trim().slice(0, 26), indicator: kind, ratio: r2(best) };
  }
  function measureSvg(root) {
    const all = [...root.querySelectorAll("svg")].filter(visible);
    const bad = all.filter((s) => !s.closest('[aria-hidden="true"]') && s.getAttribute("role") !== "img" && !s.getAttribute("aria-label") && !s.querySelector("title"));
    const roleImg = [...root.querySelectorAll('[role="img"]')].filter(visible);
    return { svgTotal: all.length, svgNoAriaHidden: bad.map(label), roleImg: roleImg.length, roleImgNoLabel: roleImg.filter((e) => !(e.getAttribute("aria-label") || "").trim() && !e.getAttribute("aria-labelledby")).map(label) };
  }
  function measureCharts(root) {
    const out = [];
    for (const c of root.querySelectorAll('[role="img"]')) {
      if (!c.querySelector("svg")) continue;
      const rects = [...c.querySelectorAll("svg rect")].filter(visible);
      const fills = new Set(rects.map((r) => getComputedStyle(r).fill));
      const texts = [...c.querySelectorAll("svg text")].filter(visible).length;
      const htmlText = [...c.querySelectorAll("*")].filter((e) => !isSvg(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visible(e)).length;
      out.push({ marks: rects.length, distinctFills: fills.size, svgText: texts, htmlText, onlyColor: fills.size > 1 && texts + htmlText < rects.length });
    }
    return out;
  }

  // ───────────── bố cục và phần tử đang focus (FR-A.1) ─────────────
  /** Kích thước bố cục lúc CHƯA focus gì: dùng để chứng minh một thành phần ẩn không đẩy bố cục một pixel nào. */
  function layoutMetrics() {
    const header = document.querySelector("header");
    const main = document.querySelector("main");
    const h = header ? header.getBoundingClientRect() : null;
    const m = main ? main.getBoundingClientRect() : null;
    return {
      headerH: h ? +h.height.toFixed(2) : null,
      mainTop: m ? +(m.top + window.scrollY).toFixed(2) : null,
      bodyScrollH: document.body.scrollHeight,
      docScrollH: document.documentElement.scrollHeight,
      bodyScrollW: document.body.scrollWidth,
    };
  }
  /** Hộp, màu chữ, nền, tỉ lệ và chỉ báo focus của phần tử đang focus (đọc ngay sau khi nhấn Tab). */
  function activeStyle() {
    const e = document.activeElement;
    if (!e || e === document.body) return null;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    const { bg } = effective(e);
    const fg = parseColor(cs.color);
    return {
      rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
      position: cs.position, zIndex: cs.zIndex, clip: cs.clip, color: fg ? hex(over(fg, bg)) : null, bg: hex(bg),
      ratio: fg ? r2(ratio(over(fg, bg), bg)) : null, fs: parseFloat(cs.fontSize), indicator: describe(e),
    };
  }

  window.__a11y = {
    layoutMetrics, activeStyle,
    parseColor, ratio, over, hex, effective, visible, label, sel,
    measureText, measurePlaceholders, measureBoundaries, measureLinks, coverOwners, glueCandidates,
    preMain, resetTabStart, activeInfo, interactive, describe, measureSvg, measureCharts,
    page() { return { lang: document.documentElement.lang, h1: document.querySelectorAll("h1").length, main: document.querySelectorAll("main").length, title: document.title }; },
    noTransition() { const s = document.createElement("style"); s.textContent = "*{transition:none!important;animation:none!important}"; document.head.appendChild(s); },
    _owners: [], _glue: [],
  };
})();

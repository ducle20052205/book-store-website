// `run.mjs chang2 <trước1> <trước2> <sau1> <sau2>`: tổng hợp chặng 2 (FR-A.2, FR-A.3, điều kiện miễn trừ A11Y-14) từ bốn lần
// khảo sát — hai lượt trước khi sửa, hai lượt sau — và kiểm hai lượt cùng nhánh có cho cùng kết quả không. Chỉ định dạng lại số đo.
import { readFileSync } from "node:fs";

const load = (f) => readFileSync(f, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.name && !r.error);
const rp = (s) => s.route.split("?")[0];
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };

/** Số đo của một lần khảo sát. */
function summarize(states) {
  // C.1: liên kết/nút chứa bìa, duy nhất theo (route, href, tên); loại liên kết cố ý ẩn khỏi công nghệ hỗ trợ.
  const own = new Map();
  for (const s of states) for (const o of s.covers.owners) own.set([rp(s), o.href, o.name, o.hiddenFromAT].join("¦"), o);
  const named = [...own.values()].filter((o) => !o.hiddenFromAT);
  const lens = named.map((o) => o.nameLen);
  // chữ dính: liên kết/nút duy nhất đã xác minh bằng tên truy cập
  const glued = new Set(), unver = new Map();
  for (const s of states) for (const g of s.glue) { if (g.glued) glued.add(rp(s) + "¦" + g.ownerName); if (!g.verifiable) unver.set(`${rp(s)}¦${g.lastTok}+${g.firstTok}`, g.where); }
  // tên liên kết giỏ hàng trên header
  const cartNames = {};
  for (const s of states) cartNames[s.headerCartName] = (cartNames[s.headerCartName] ?? 0) + 1;
  // C.2
  const links = states.flatMap((s) => s.links.map((l) => ({ ...l, state: s.name, route: rp(s), old12: s.old12 })));
  const viol = links.filter((l) => !l.ok);
  const violU = new Map(); for (const l of viol) violU.set(`${l.route}¦${l.text}¦${l.ratio}`, l);
  const r14old = links.filter((l) => l.byRule14 && l.old12);
  // A11Y-14
  const a14 = states.flatMap((s) => s.a14.rows.map((x) => ({ ...x, state: s.name, route: rp(s) })));
  const paths = {}; for (const x of a14) paths[x.path ?? "KHÔNG ĐƯỜNG NÀO"] = (paths[x.path ?? "KHÔNG ĐƯỜNG NÀO"] ?? 0) + 1;
  const hiddenPaths = {}; for (const x of a14.filter((y) => y.hidden)) hiddenPaths[x.path ?? "KHÔNG ĐƯỜNG NÀO"] = (hiddenPaths[x.path ?? "KHÔNG ĐƯỜNG NÀO"] ?? 0) + 1;
  const bReq = a14.filter((x) => x.bReq);
  const sum = (f) => states.reduce((n, s) => n + f(s), 0);
  return {
    c1: { unique: named.length, hiddenFromAT: own.size - named.length, dup: named.filter((o) => o.dup).length, long: named.filter((o) => o.long).length, bothDupLong: named.filter((o) => o.dup && o.long).length, min: Math.min(...lens), median: median(lens), max: Math.max(...lens) },
    glue: { linksGlued: glued.size, unverifiable: [...unver.entries()] },
    cartNames, cartWithSpaceComma: states.filter((s) => (s.headerCartName ?? "").includes(" ,")).length,
    c2: { rowsAll: links.length, violations: viol.length, violationsUnique: [...violU.values()].map((l) => `${l.route} «${l.text}» ${l.ratio}:1 gạch=${l.underline}`), rule14In20: r14old.length, rule14In20Viol: r14old.filter((l) => !l.ok).length, blindSpot: links.filter((l) => !l.byRule14).map((l) => `${l.state} «${l.text}» ${l.ratio}:1 gạch=${l.underline} ok=${l.ok}`) },
    a14: { covers: a14.length, failA: a14.filter((x) => !x.passA).length, bRequired: bReq.length, failB: bReq.filter((x) => !x.passB).length, paths, hiddenPaths, hiddenCount: a14.filter((x) => x.hidden).length, failures: a14.filter((x) => !x.passA || (x.bReq && !x.passB)).slice(0, 5).map((x) => `${x.state} ${x.book} a=${x.passA} b=${x.passB}`) },
    reg: { interactive: sum((s) => s.focus.interactive), axInteractive: sum((s) => s.ax.interactive), axUnnamed: sum((s) => s.ax.unnamed), noIndicator: sum((s) => s.focus.noIndicator), below3: sum((s) => s.focus.below3), minRatio: Math.min(...states.map((s) => s.focus.minRatio ?? 99)), textBelow: sum((s) => s.text.below), svgBad: sum((s) => s.svg.bad), roleImgNoLabel: sum((s) => s.svg.roleImgNoLabel), notReachedNonRadio: sum((s) => s.focus.notReached - s.focus.radios) },
    perState: Object.fromEntries(states.map((s) => [s.name, { interactive: s.focus.interactive, ax: s.ax.interactive, rects: s.a14.rows.map((x) => x.rect) }])),
    fingerprint: Object.fromEntries(states.map((s) => [s.name, JSON.stringify({ own: s.covers.owners.map((o) => [o.href, o.name]), glue: s.glue.map((g) => g.glued), links: s.links.map((l) => [l.text, l.ok, l.ratio]), a14: s.a14.rows.map((x) => [x.passA, x.passB, x.path]), cart: s.headerCartName, tab: s.tab.stops })])),
  };
}

export function chang2([pre1, pre2, post1, post2]) {
  const S = [pre1, pre2, post1, post2].map((f) => ({ f, states: load(f) })).map((x) => ({ ...x, m: summarize(x.states) }));
  const [P1, P2, Q1, Q2] = S;
  console.log(`# trạng thái mỗi lượt: ${S.map((x) => x.states.length).join(" / ")}`);
  const same = (a, b) => Object.keys(a.m.fingerprint).filter((k) => a.m.fingerprint[k] !== b.m.fingerprint[k]);
  console.log(`# hai lượt cùng nhánh khác nhau ở: trước ${JSON.stringify(same(P1, P2))} · sau ${JSON.stringify(same(Q1, Q2))}`);
  for (const [tag, x] of [["TRƯỚC lượt 1", P1], ["TRƯỚC lượt 2", P2], ["SAU lượt 1", Q1], ["SAU lượt 2", Q2]]) {
    const m = x.m;
    console.log(`\n=== ${tag} ===`);
    console.log(`C.1 liên kết chứa bìa duy nhất: ${m.c1.unique} (+${m.c1.hiddenFromAT} cố ý ẩn) · tên lặp ${m.c1.dup} · >90 ký tự ${m.c1.long} (cả hai ${m.c1.bothDupLong}) · dài nhất ${m.c1.max} · trung vị ${m.c1.median} · ngắn nhất ${m.c1.min}`);
    console.log(`C.1 liên kết dính chữ duy nhất: ${m.glue.linksGlued} · không xác minh được: ${JSON.stringify(m.glue.unverifiable)}`);
    console.log(`giỏ hàng (tên liên kết ở header): ${JSON.stringify(m.cartNames)} · trạng thái có " ,": ${m.cartWithSpaceComma}`);
    console.log(`C.2 liên kết có chữ cùng khối: ${m.c2.rowsAll} · vi phạm (không gạch, <3:1): ${m.c2.violations} lượt, ${m.c2.violationsUnique.length} duy nhất · quy tắc 1.4 trên 20 trạng thái cũ: ${m.c2.rule14In20} liên kết, ${m.c2.rule14In20Viol} vi phạm`);
    for (const v of m.c2.violationsUnique) console.log(`    ${v}`);
    if (m.c2.blindSpot.length) console.log(`    ngoài quy tắc 1.4: ${m.c2.blindSpot.join("; ")}`);
    console.log(`A11Y-14: ${m.a14.covers} bìa · trượt (a) ${m.a14.failA} · nơi bắt buộc (b) ${m.a14.bRequired}, trượt ${m.a14.failB} · bìa aria-hidden ${m.a14.hiddenCount} · đường (a): ${JSON.stringify(m.a14.paths)} · riêng bìa aria-hidden: ${JSON.stringify(m.a14.hiddenPaths)}${m.a14.failures.length ? "\n    trượt mẫu: " + m.a14.failures.join("; ") : ""}`);
    console.log(`không hồi quy: tương tác ${m.reg.interactive} (cây AX ${m.reg.axInteractive}) · không tên ${m.reg.axUnnamed} · thiếu chỉ báo ${m.reg.noIndicator} · chỉ báo <3:1 ${m.reg.below3} (yếu nhất ${m.reg.minRatio}:1) · chữ dưới ngưỡng ${m.reg.textBelow} · svg thiếu aria-hidden ${m.reg.svgBad} · role=img thiếu nhãn ${m.reg.roleImgNoLabel} · không tới được (ngoài radio) ${m.reg.notReachedNonRadio}`);
  }
  // so trước/sau theo từng trạng thái: số phần tử tương tác và hộp của bìa
  const dI = [], dR = [];
  for (const k of Object.keys(Q1.m.perState)) {
    const a = P1.m.perState[k], b = Q1.m.perState[k];
    if (!a) continue;
    if (a.interactive !== b.interactive || a.ax !== b.ax) dI.push(`${k}: ${a.interactive}/${a.ax} → ${b.interactive}/${b.ax}`);
    if (JSON.stringify(a.rects) !== JSON.stringify(b.rects)) dR.push(k);
  }
  console.log(`\n=== TRƯỚC → SAU, từng trạng thái ===\nphần tử tương tác (DOM / cây AX) lệch: ${dI.length}/${Object.keys(Q1.m.perState).length}${dI.length ? "\n  " + dI.join("\n  ") : ""}`);
  console.log(`hộp (x,y,rộng,cao) của mọi bìa lệch: ${dR.length}/${Object.keys(Q1.m.perState).length}${dR.length ? " → " + dR.join(", ") : ""}`);
}

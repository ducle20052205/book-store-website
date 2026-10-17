// `run.mjs final <lượt1.jsonl> <lượt2.jsonl>`: tổng hợp TC-A.9 (không hồi quy toàn site) từ hai lượt khảo sát cuối, và kiểm hai lượt
// có giống nhau không. Chỉ định dạng lại số đo.
import { readFileSync } from "node:fs";

const recs = (f) => readFileSync(f, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const rp = (s) => s.route.split("?")[0];

function summary(file) {
  const all = recs(file), st = all.filter((r) => r.name && !r.error), errs = all.filter((r) => r.error);
  const sum = (f) => st.reduce((n, s) => n + f(s), 0);
  // A11Y-14
  const a14 = st.flatMap((s) => s.a14.rows.map((x) => ({ ...x, state: s.name, route: rp(s) })));
  const bReq = a14.filter((x) => x.bReq);
  const hiddenPaths = {};
  for (const x of a14.filter((y) => y.hidden)) hiddenPaths[x.path ?? "KHÔNG ĐƯỜNG NÀO"] = (hiddenPaths[x.path ?? "KHÔNG ĐƯỜNG NÀO"] ?? 0) + 1;
  const forms = a14.filter((x) => x.route.startsWith("/admin/sach"));
  // cặp chữ/nền (NFR-6.7) gộp qua mọi trạng thái, cộng placeholder
  const pairs = new Map();
  const put = (fg, bg, ratio, fs, need, sample, where) => { const k = `${fg}>${bg}`; const cur = pairs.get(k); if (!cur || ratio < cur.ratio) pairs.set(k, { fg, bg, ratio, fs, need, sample, where }); };
  for (const s of st) {
    for (const [fg, bg, ratio, fs, need, sample] of s.text.pairs ?? []) put(fg, bg, ratio, fs, need, sample, s.name);
    for (const r of s.placeholders.rows) if (!r.unparsed) put(r.fg, r.bg, r.ratio, r.fs, 4.5, "placeholder: " + r.ph, s.name);
  }
  const list = [...pairs.values()].sort((a, b) => a.ratio - b.ratio);
  return {
    states: st.length, errors: errs.map((e) => `${e.name}: ${e.error}`),
    routes: new Set(st.map(rp)).size,
    text: { n: sum((s) => s.text.n), below: sum((s) => s.text.below), unparsed: sum((s) => s.text.unparsed) },
    focus: { interactive: sum((s) => s.focus.interactive), stops: sum((s) => s.focus.stops), notReachedNonRadio: sum((s) => s.focus.notReached - s.focus.radios), radios: sum((s) => s.focus.radios), noIndicator: sum((s) => s.focus.noIndicator), below3: sum((s) => s.focus.below3), min: Math.min(...st.map((s) => s.focus.minRatio ?? 99)) },
    ax: { interactive: sum((s) => s.ax.interactive), unnamed: sum((s) => s.ax.unnamed) },
    svg: { total: sum((s) => s.svg.total), bad: sum((s) => s.svg.bad), roleImg: sum((s) => s.svg.roleImg), roleImgNoLabel: sum((s) => s.svg.roleImgNoLabel) },
    ph: { measured: sum((s) => s.placeholders.measured), below45: sum((s) => s.placeholders.rows.filter((r) => r.ratio < 4.5).length), unparsed: sum((s) => s.placeholders.unparsed) },
    a14: { covers: a14.length, failA: a14.filter((x) => !x.passA).length, bRequired: bReq.length, failB: bReq.filter((x) => !x.passB).length, hiddenPaths, forms: forms.map((x) => `${x.state}: ${x.book ?? "(placeholder)"} → a=${x.passA} đường="${x.path}"`) },
    pairs: { total: list.length, belowNeed: list.filter((p) => p.ratio < p.need).length, between45and50: list.filter((p) => p.ratio >= p.need && p.ratio < 5.0).length, lowest: list.slice(0, 8) },
    funnelAtAdmin: all.find((r) => r.setup?.funnelAtAdmin)?.setup.funnelAtAdmin,
    restore: all.find((r) => r.restore)?.restore,
    fingerprint: Object.fromEntries(st.map((s) => [s.name, JSON.stringify([s.focus.interactive, s.ax.unnamed, s.text.below, s.a14.rows.map((x) => [x.passA, x.passB, x.path]), s.tab.stops, s.links.map((l) => l.ok), s.covers.owners.map((o) => [o.dup, o.long]), s.glue.map((g) => g.glued), s.placeholders.rows.map((r) => r.ratio)])])),
  };
}

export function finalReport([f1, f2]) {
  const A = summary(f1), B = summary(f2);
  const diff = Object.keys(A.fingerprint).filter((k) => A.fingerprint[k] !== B.fingerprint[k]);
  console.log(`# trạng thái: ${A.states} / ${B.states} · route: ${A.routes} · lỗi: ${JSON.stringify([...A.errors, ...B.errors])}`);
  console.log(`# hai lượt khác nhau ở: ${JSON.stringify(diff)}`);
  for (const [tag, m] of [["LƯỢT 1", A], ["LƯỢT 2", B]]) {
    console.log(`\n=== ${tag} ===`);
    console.log(`phễu lúc /admin được đọc (đứng ĐẦU lượt): ${m.funnelAtAdmin}`);
    console.log(`6.1 nút chữ: ${m.text.n} đo được · dưới ngưỡng ${m.text.below} · không đọc được ${m.text.unparsed} · placeholder ${m.ph.measured} lượt, dưới 4,5:1 ${m.ph.below45}`);
    console.log(`6.3 tương tác ${m.focus.interactive} · Tab tới được ${m.focus.stops} · không tới được ngoài radio ${m.focus.notReachedNonRadio} (+${m.focus.radios} radio) · thiếu chỉ báo ${m.focus.noIndicator} · chỉ báo <3:1 ${m.focus.below3} (yếu nhất ${m.focus.min}:1)`);
    console.log(`6.4 <svg> ${m.svg.total}, thiếu aria-hidden/nhãn ${m.svg.bad} · role=img ${m.svg.roleImg}, thiếu nhãn ${m.svg.roleImgNoLabel} · phần tử tương tác không tên ${m.ax.unnamed}/${m.ax.interactive}`);
    console.log(`A11Y-14: ${m.a14.covers} bìa · trượt (a) ${m.a14.failA} · nơi bắt buộc (b) ${m.a14.bRequired}, trượt ${m.a14.failB} · đường (a) của bìa aria-hidden ${JSON.stringify(m.a14.hiddenPaths)}`);
    for (const x of m.a14.forms) console.log(`    ${x}`);
    console.log(`NFR-6.7 cặp chữ/nền (kể cả placeholder): ${m.pairs.total} cặp · dưới ngưỡng ${m.pairs.belowNeed} · trong [ngưỡng, 5,0) ${m.pairs.between45and50}`);
    for (const p of m.pairs.lowest) console.log(`    ${p.fg} trên ${p.bg} = ${p.ratio}:1 (${p.fs}px, cần ${p.need}) «${p.sample}» @${p.where}`);
    console.log(`khôi phục: ${m.restore ? JSON.stringify({ ...m.restore, after: m.restore.after?.text }) : "(không có)"}`);
  }
}

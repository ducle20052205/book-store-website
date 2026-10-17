// `run.mjs compare <trước.jsonl> <sau.jsonl>`: so hai lượt khảo sát (trước/sau một lần sửa) theo từng trạng thái cùng tên.
// Chỉ định dạng lại số đã đo.
import { readFileSync } from "node:fs";

const readStates = (file) => readFileSync(file, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.name && !r.error);
const dist = (set, f) => JSON.stringify(set.reduce((o, s) => ((o[f(s)] = (o[f(s)] ?? 0) + 1), o), {}));

export function compare(preFile, postFile) {
  const pre = readStates(preFile), post = readStates(postFile);
  const byName = new Map(pre.map((s) => [s.name, s]));
  console.log(`# trước: ${pre.length} trạng thái · sau: ${post.length} trạng thái · cùng tên: ${post.filter((s) => byName.has(s.name)).length}`);

  console.log("\n## TC-A.1 liên kết bỏ qua");
  const count = (set, f) => set.filter(f).length;
  console.log(`trước: điểm dừng đầu là #noi-dung ${count(pre, (s) => s.skip?.isSkip)}/${pre.length}; Enter đưa focus vào <main> ${count(pre, (s) => s.skip?.focusInMain === true)}/${pre.length}`);
  console.log(`sau  : điểm dừng đầu là #noi-dung ${count(post, (s) => s.skip?.isSkip)}/${post.length}; Enter đưa focus vào <main> ${count(post, (s) => s.skip?.focusInMain === true)}/${post.length}`);
  console.log(`điểm dừng Tab trước <main> theo thứ tự DOM (tính cả liên kết): trước ${dist(pre, (s) => s.tab.stops)} · sau ${dist(post, (s) => s.tab.stops)}`);
  console.log(`điểm dừng cần để tới <main> khi dùng liên kết (1 nếu điểm đầu là liên kết và Enter vào <main>): sau ${dist(post, (s) => (s.skip?.isSkip && s.skip.focusInMain ? 1 : s.tab.stops))}`);
  const styles = post.map((s) => s.skip?.style).filter(Boolean);
  if (styles.length) {
    const st = styles[0];
    console.log(`liên kết khi focus (mẫu): hộp ${st.rect.w}×${st.rect.h} tại (${st.rect.x},${st.rect.y}) · position=${st.position} z=${st.zIndex} · chữ ${st.color} nền ${st.bg} = ${st.ratio}:1 · ${st.fs}px · chỉ báo focus ${st.indicator?.indicator} ${st.indicator?.ratio}:1`);
    console.log(`  qua ${styles.length} trạng thái: tỉ lệ chữ thấp nhất ${Math.min(...styles.map((x) => x.ratio))}:1 · rộng nhất/nhỏ nhất ${Math.max(...styles.map((x) => x.rect.w))}/${Math.min(...styles.map((x) => x.rect.w))}px · cao nhỏ nhất ${Math.min(...styles.map((x) => x.rect.h))}px · chỉ báo focus yếu nhất ${Math.min(...styles.map((x) => x.indicator?.ratio ?? 0))}:1`);
  }

  console.log("\n## TC-A.1 bố cục lúc CHƯA focus (headerH, mainTop, bodyScrollH, docScrollH, bodyScrollW): trước vs sau");
  let same = 0;
  const diff = [];
  for (const s of post) {
    const p = byName.get(s.name);
    if (!p) continue;
    if (JSON.stringify(p.layout) === JSON.stringify(s.layout)) same++;
    else diff.push(`${s.name}: ${JSON.stringify(p.layout)} → ${JSON.stringify(s.layout)}`);
  }
  console.log(`giống hệt: ${same}/${post.length}${diff.length ? "\nLỆCH:\n" + diff.join("\n") : ""}`);
  if (post[0]) console.log(`mẫu (${post[0].name}): ${JSON.stringify(post[0].layout)}`);

  console.log("\n## TC-A.4 placeholder (mỗi ô khác nhau): trước → sau");
  const phMap = (set) => { const m = new Map(); for (const s of set) for (const r of s.placeholders.rows) m.set(`${s.route.split("?")[0]} ${r.sel}`, r); return m; };
  const a = phMap(pre), b = phMap(post);
  for (const [k, v] of b) console.log(`${k.padEnd(56)} ${a.get(k) ? `${a.get(k).ratio}:1` : "—"} → ${v.ratio}:1  [${v.raw}]`);
  const cnt = (set) => set.reduce((t, s) => ({ measured: t.measured + s.placeholders.measured, below45: t.below45 + s.placeholders.rows.filter((r) => r.ratio < 4.5).length, unparsed: t.unparsed + s.placeholders.unparsed }), { measured: 0, below45: 0, unparsed: 0 });
  console.log(`lượt đo: trước ${JSON.stringify(cnt(pre))} · sau ${JSON.stringify(cnt(post))}`);

  console.log("\n## Không hồi quy: tổng qua mọi trạng thái (radio tách riêng: vào bằng một Tab theo quy ước nhóm radio)");
  const tot = (set) => set.reduce((t, s) => ({
    interactive: t.interactive + s.focus.interactive, stops: t.stops + s.focus.stops, notReachedNonRadio: t.notReachedNonRadio + s.focus.notReached - s.focus.radios, radios: t.radios + s.focus.radios,
    noIndicator: t.noIndicator + s.focus.noIndicator, below3: t.below3 + s.focus.below3, minRatio: Math.min(t.minRatio, s.focus.minRatio ?? 99),
    axInteractive: t.axInteractive + s.ax.interactive, axUnnamed: t.axUnnamed + s.ax.unnamed, textN: t.textN + s.text.n, textBelow: t.textBelow + s.text.below,
  }), { interactive: 0, stops: 0, notReachedNonRadio: 0, radios: 0, noIndicator: 0, below3: 0, minRatio: 99, axInteractive: 0, axUnnamed: 0, textN: 0, textBelow: 0 });
  console.log("trước:", JSON.stringify(tot(pre)));
  console.log("sau  :", JSON.stringify(tot(post)));
  for (const s of post) {
    const flag = s.focus.noIndicator || s.focus.below3 || s.ax.unnamed || s.text.below || s.focus.notReached - s.focus.radios;
    if (flag) console.log(`  chú ý ${s.name}: không tới được=${s.focus.notReached} (radio ${s.focus.radios}) ${JSON.stringify(s.focus.notReachedSample)} · thiếu chỉ báo=${s.focus.noIndicator} ${JSON.stringify(s.focus.noIndicatorSample)} · <3:1=${s.focus.below3} · không tên=${s.ax.unnamed} ${JSON.stringify(s.ax.unnamedRoles)} · chữ dưới ngưỡng=${s.text.below}`);
  }
}

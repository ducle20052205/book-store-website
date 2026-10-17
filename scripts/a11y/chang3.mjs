// `run.mjs chang3 <trước> <sau1> <sau2>`: tổng hợp chặng 3 (FR-A.6 tiêu đề, FR-A.7 ô email chỉ đọc, FR-A.8 bảng số liệu biểu đồ)
// từ một lượt khảo sát trước khi sửa và hai lượt sau. Chỉ định dạng lại số đo.
import { readFileSync } from "node:fs";

const load = (f) => readFileSync(f, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.name && !r.error);
const rp = (s) => s.route.split("?")[0];

function titles(states) {
  const by = new Map();
  for (const s of states) { const k = rp(s); if (!by.has(k)) by.set(k, new Map()); by.get(k).set(s.page.title, (by.get(k).get(s.page.title) ?? 0) + 1); }
  return by;
}

export function chang3([pre, post1, post2]) {
  const P = load(pre), Q1 = load(post1), Q2 = load(post2);
  console.log(`# trạng thái: trước ${P.length} · sau ${Q1.length} / ${Q2.length}`);

  console.log("\n## TC-A.6 tiêu đề theo route (sau lượt 1) — số trạng thái có tiêu đề đó");
  const t = titles(Q1);
  for (const [route, m] of t) console.log(`  ${route.padEnd(30)} ${[...m].map(([k, n]) => `"${k}"×${n}`).join(" · ")}`);
  console.log(`  số route có <title> khác rỗng: ${[...t.values()].filter((m) => [...m.keys()].every((k) => k && k.trim())).length}/${t.size}`);
  const shelfOf = (st) => [...new Set(st.filter((s) => rp(s) === "/tu-sach/[slug]").map((s) => s.page.title))];
  console.log(`  tủ sách TRƯỚC: ${JSON.stringify(shelfOf(P))}\n  tủ sách SAU  : ${JSON.stringify(shelfOf(Q1))} (khác nhau: ${new Set(shelfOf(Q1)).size}/3, khác "NA Books": ${shelfOf(Q1).every((x) => x !== "NA Books")})`);
  const adminTitles = Q1.filter((s) => rp(s).startsWith("/admin")).reduce((o, s) => ((o[rp(s)] = s.page.title), o), {});
  console.log(`  route admin SAU: ${JSON.stringify(adminTitles)}`);

  console.log("\n## TC-A.7 ô email ở /tai-khoan");
  for (const [tag, set] of [["TRƯỚC", P], ["SAU lượt 1", Q1], ["SAU lượt 2", Q2]]) {
    const rows = set.filter((s) => rp(s) === "/tai-khoan");
    console.log(`  ${tag}: ${rows.length} trạng thái`);
    for (const s of rows) {
      const f = s.emailCheck?.fields?.[0], d = s.emailCheck?.dom, m = s.emailCheck?.mouse;
      console.log(`    ${s.name.padEnd(18)} disabled=${f?.disabled} readOnly=${f?.readOnly} chữ giá trị=${f?.ratio}:1 (opacity tổ tiên ${f?.opacityChain}) · select() nhận focus=${d?.active}, chọn được ${d?.domSelection?.length ?? 0}/${d?.valueLength} ký tự · chuột 3 cú nhấp chọn được ${m?.domSelection?.length ?? 0}/${m?.valueLength}`);
    }
  }

  console.log("\n## TC-A.8 bảng số liệu của biểu đồ /admin (giá trị kỳ vọng tính từ RPC lúc đo)");
  for (const [tag, set] of [["TRƯỚC", P], ["SAU lượt 1", Q1], ["SAU lượt 2", Q2]]) {
    const s = set.find((x) => x.name === "admin-thong-ke");
    const c = s?.chartCheck;
    console.log(`  ${tag}: ${c ? `${c.charts} biểu đồ · bảng ${JSON.stringify(c.tables)} · hàng ${JSON.stringify(c.rows)} · thiếu ${c.missing.length}${c.missing.length ? " " + JSON.stringify(c.missing).slice(0, 160) : ""} · chữ biểu đồ chưa có ở bảng ${c.uncovered.length}` : "(không có số liệu)"}`);
  }

  console.log("\n## Không hồi quy: tổng qua mọi trạng thái");
  const tot = (set) => set.reduce((o, s) => ({ interactive: o.interactive + s.focus.interactive, notReachedNonRadio: o.notReachedNonRadio + s.focus.notReached - s.focus.radios, noIndicator: o.noIndicator + s.focus.noIndicator, below3: o.below3 + s.focus.below3, axUnnamed: o.axUnnamed + s.ax.unnamed, axInteractive: o.axInteractive + s.ax.interactive, textBelow: o.textBelow + s.text.below, svgBad: o.svgBad + s.svg.bad, roleImgNoLabel: o.roleImgNoLabel + s.svg.roleImgNoLabel, minRatio: Math.min(o.minRatio, s.focus.minRatio ?? 99) }), { interactive: 0, notReachedNonRadio: 0, noIndicator: 0, below3: 0, axUnnamed: 0, axInteractive: 0, textBelow: 0, svgBad: 0, roleImgNoLabel: 0, minRatio: 99 });
  console.log("  trước    :", JSON.stringify(tot(P)));
  console.log("  sau lượt1:", JSON.stringify(tot(Q1)));
  console.log("  sau lượt2:", JSON.stringify(tot(Q2)));
  const per = (set) => Object.fromEntries(set.map((s) => [s.name, [s.focus.interactive, s.ax.interactive]]));
  const a = per(P), b = per(Q1), diff = Object.keys(b).filter((k) => a[k] && JSON.stringify(a[k]) !== JSON.stringify(b[k])).map((k) => `${k}: ${a[k]} → ${b[k]}`);
  console.log(`  phần tử tương tác (DOM/AX) khác nhau trước↔sau ở ${diff.length} trạng thái${diff.length ? ": " + diff.join("; ") : ""}`);
  const fp = (set) => Object.fromEntries(set.map((s) => [s.name, JSON.stringify([s.covers.owners.map((o) => [o.href, o.name]), s.a14.rows.map((x) => [x.passA, x.passB]), s.links.map((l) => [l.text, l.ok]), s.tab.stops, s.headerCartName])]));
  const f1 = fp(Q1), f2 = fp(Q2), fd = Object.keys(f1).filter((k) => f1[k] !== f2[k]);
  console.log(`  hai lượt sau khác nhau (tên liên kết chứa bìa, A11Y-14, liên kết giữa câu, Tab, tên giỏ hàng) ở ${fd.length} trạng thái ${fd.join(",")}`);
}

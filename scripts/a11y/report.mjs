// In bảng tóm tắt từ file JSONL do `run.mjs survey` ghi. Chỉ định dạng lại số đã đo, không đo gì thêm.
import { readFileSync } from "node:fs";

const uniq = (a) => [...new Set(a)];
const pad = (s, n) => String(s).padEnd(n);

export function printReport(file) {
  const recs = readFileSync(file, "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const states = recs.filter((r) => r.name && !r.error);
  const errors = recs.filter((r) => r.error);
  const setup = recs.filter((r) => r.setup).map((r) => r.setup);
  console.log(`# ${states.length} trạng thái đo được, ${errors.length} lỗi${errors.length ? ": " + errors.map((e) => `${e.name}=${e.error}`).join("; ") : ""}`);
  console.log(`# route phủ: ${uniq(states.map((s) => s.route.split("?")[0])).length} (${uniq(states.map((s) => s.route.split("?")[0])).join(" ")})`);

  // ───── chữ (6.1/6.6) ─────
  console.log("\n## E. nút văn bản (6.1/6.6): n = đo được, below = dưới ngưỡng (không tính vô hiệu hoá), exempt = vô hiệu hoá dưới ngưỡng, unparsed = không đọc được màu");
  const tt = states.reduce((t, s) => ({ n: t.n + s.text.n, below: t.below + s.text.below, exempt: t.exempt + s.text.exempt, unparsed: t.unparsed + s.text.unparsed, u14: t.u14 + s.text.under14, u12: t.u12 + s.text.under12 }), { n: 0, below: 0, exempt: 0, unparsed: 0, u14: 0, u12: 0 });
  console.log(`tổng qua ${states.length} trạng thái: n=${tt.n} below=${tt.below} exempt=${tt.exempt} unparsed=${tt.unparsed} <14px=${tt.u14} <12px=${tt.u12}`);
  for (const s of states) if (s.text.below || s.text.unparsed) console.log(`  ${pad(s.name, 30)} n=${s.text.n} below=${s.text.below} unparsed=${s.text.unparsed}`);

  // ───── A ─────
  console.log("\n## A. placeholder — mỗi dòng là một (route, ô, màu tính toán) khác nhau; n = số trạng thái có dòng này");
  const tot = states.reduce((t, s) => ({ found: t.found + s.placeholders.found, measured: t.measured + s.placeholders.measured, unparsed: t.unparsed + s.placeholders.unparsed, notVisible: t.notVisible + s.placeholders.notVisible }), { found: 0, measured: 0, unparsed: 0, notVisible: 0 });
  console.log(`tổng qua ${states.length} trạng thái: found=${tot.found} measured=${tot.measured} unparsed=${tot.unparsed} notVisible=${tot.notVisible}`);
  const ph = new Map();
  for (const s of states) for (const r of s.placeholders.rows) {
    const k = [s.route.split("?")[0], r.sel, r.raw, r.bg].join("¦");
    ph.set(k, { ...r, route: s.route.split("?")[0], n: (ph.get(k)?.n ?? 0) + 1 });
  }
  for (const r of [...ph.values()].sort((a, b) => (a.ratio ?? 0) - (b.ratio ?? 0))) console.log(`${pad(r.route, 22)} ${pad(r.sel, 30)} n=${pad(r.n, 3)} ${r.unparsed ? "KHÔNG ĐỌC ĐƯỢC" : `${r.ratio}:1`}  nền=${r.bg} fs=${r.fs} chữ ô=${r.ownColor} how=${r.how}\n${" ".repeat(24)}raw="${r.raw}" opacity=${r.rawOpacity} ph="${r.ph}"`);

  // ───── B ─────
  console.log("\n## B. ranh giới ô nhập — mỗi dòng là một bộ (viền, nền trong, nền ngoài); ví dụ đầu tiên");
  const bd = new Map();
  for (const s of states) for (const r of s.boundaries.rows) {
    if (r.unparsed) continue;
    const k = [r.border?.hex ?? "-", r.inside, r.outside].join("¦");
    const cur = bd.get(k) ?? { ...r, route: s.route.split("?")[0], n: 0, routes: new Set() };
    cur.n++; cur.routes.add(s.route.split("?")[0]); bd.set(k, cur);
  }
  for (const r of [...bd.values()].sort((a, b) => (a.rBorderOutside ?? 99) - (b.rBorderOutside ?? 99))) console.log(`viền=${pad(r.border?.hex ?? "-", 8)} trong=${r.inside} ngoài=${r.outside} | viền↔ngoài=${r.rBorderOutside} viền↔trong=${r.rBorderInside} trong↔ngoài=${r.rInsideOutside} ok=${r.ok} | n=${r.n} vd=${r.sel} @${r.route} (${[...r.routes].length} route)`);

  // ───── C.1 ─────
  console.log("\n## C.1 liên kết/nút chứa bìa — theo route: [liên kết, tên lặp, tên >90, ký tự dài nhất]");
  let T = { owners: 0, dup: 0, long: 0 };
  const byRoute = new Map();
  for (const s of states) {
    const o = s.covers.owners.filter((x) => !x.hiddenFromAT), k = s.route.split("?")[0];
    const cur = byRoute.get(k) ?? { owners: 0, dup: 0, long: 0, max: 0 };
    cur.owners += o.length; cur.dup += o.filter((x) => x.dup).length; cur.long += o.filter((x) => x.long).length; cur.max = Math.max(cur.max, ...o.map((x) => x.nameLen), 0);
    byRoute.set(k, cur);
    T.owners += o.length; T.dup += o.filter((x) => x.dup).length; T.long += o.filter((x) => x.long).length;
  }
  for (const [k, v] of byRoute) if (v.owners) console.log(`${pad(k, 28)} ${v.owners} · ${v.dup} · ${v.long} · max ${v.max}`);
  console.log(`TỔNG (cộng qua mọi trạng thái, trang chủ có nhiều trạng thái): liên kết=${T.owners} tên lặp=${T.dup} tên>90=${T.long}`);
  const covOut = states.reduce((n, s) => n + s.covers.coversOutsideInteractive, 0);
  console.log(`bìa nằm ngoài liên kết/nút (không tính): ${covOut} · liên kết/nút chứa bìa nhưng ẩn khỏi công nghệ hỗ trợ (aria-hidden, không tính): ${states.reduce((n, s) => n + s.covers.owners.filter((x) => x.hiddenFromAT).length, 0)}`);
  const examples = states.flatMap((s) => s.covers.owners.filter((x) => x.dup).map((x) => ({ route: s.route.split("?")[0], name: x.name, len: x.nameLen }))).slice(0, 2);
  for (const e of examples) console.log(`vd lặp @${e.route} (${e.len}): ${e.name}`);

  console.log("\n## C.1 chữ dính — ứng viên (nút aria-hidden có chữ hai phía), theo (nơi, cặp chữ)");
  const gl = new Map();
  for (const s of states) for (const g of s.glue) {
    const k = [g.where, g.hText, g.glueRisk, g.verifiable, g.glued].join("¦");
    const cur = gl.get(k) ?? { ...g, n: 0, routes: new Set(), ex: g.ownerName };
    cur.n++; cur.routes.add(s.route.split("?")[0]); gl.set(k, cur);
  }
  const gv = [...gl.values()];
  console.log(`ứng viên: ${gv.reduce((n, g) => n + g.n, 0)} lượt · glueRisk: ${gv.filter((g) => g.glueRisk).reduce((n, g) => n + g.n, 0)} · DÍNH (xác minh bằng tên truy cập): ${gv.filter((g) => g.glued).reduce((n, g) => n + g.n, 0)} · không xác minh được: ${gv.filter((g) => !g.verifiable).reduce((n, g) => n + g.n, 0)}`);
  for (const g of gv.sort((a, b) => b.n - a.n)) console.log(`n=${pad(g.n, 4)} dính=${pad(g.glued, 5)} risk=${pad(g.glueRisk, 5)} xm=${pad(g.verifiable, 5)} "${g.lastTok}"+"${g.firstTok}" nút="${g.hText}" nơi=${g.where} [${[...g.routes].join(" ")}]${g.ex ? `\n${" ".repeat(8)}tên="${g.ex}"` : ""}`);

  // ───── C.2 ─────
  console.log("\n## C.2 liên kết giữa câu — byRule14 = đúng quy tắc 1.4; old12 = trạng thái của 12 route bản 1.4");
  const rows = states.flatMap((s) => s.links.map((l) => ({ ...l, state: s.name, route: s.route.split("?")[0], old12: s.old12 })));
  for (const l of rows) console.log(`${pad(l.old12 ? "[12]" : "    ", 5)}${pad(l.state, 26)} rule14=${pad(l.byRule14, 5)} "${l.text}" gạch=${pad(l.underline, 5)} ${l.unparsed ? "KHÔNG ĐỌC ĐƯỢC" : `${l.ratio}:1 (${l.link} / ${l.around})`} fw=${l.fw}/${l.parentFw} ok=${l.ok} · ${l.where}`);
  const r14 = rows.filter((l) => l.byRule14), r14old = r14.filter((l) => l.old12);
  console.log(`quy tắc 1.4: ${r14.length} dòng trên mọi trạng thái; trong 20 trạng thái của 12 route bản 1.4: ${r14old.length} dòng, ${r14old.filter((l) => !l.ok).length} vi phạm`);
  console.log(`tất cả liên kết có chữ cùng khối (kể cả ngoài quy tắc): ${rows.length}; vi phạm (không gạch, <3:1): ${rows.filter((l) => !l.ok).length}; ngoài quy tắc 1.4: ${rows.filter((l) => !l.byRule14).length}`);

  // ───── D ─────
  console.log("\n## D. điểm dừng Tab trước <main> (Tab thật từ đầu tài liệu)");
  const sig = new Map();
  for (const s of states) {
    const t = s.tab;
    console.log(`${pad(s.name, 28)} ${pad(s.route, 28)} stops=${pad(t.stops, 3)} DOM=${pad(t.domBefore, 3)} vàoMain=${t.enteredMain} wrapped=${t.wrapped} activeAtLoad=${t.activeAtLoad ?? "-"} mainId=${t.mainId ?? "-"} tabindex>0=${t.tabindexPositive}`);
    const k = t.names.join(" › ");
    sig.set(k, [...(sig.get(k) ?? []), s.name]);
  }
  console.log("\ncác chuỗi điểm dừng khác nhau:");
  for (const [k, v] of sig) console.log(`  (${v.length} trạng thái: ${v.slice(0, 4).join(", ")}${v.length > 4 ? "…" : ""})\n    ${k}`);
  const restore = recs.find((r) => r.restore)?.restore;
  if (restore) console.log(`\n# khôi phục: ${JSON.stringify({ ...restore, after: restore.after?.text })}`);
}

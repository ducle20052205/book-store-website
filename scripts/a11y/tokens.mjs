// B.2 — tỉ lệ của MỌI token màu trong app/globals.css với nền trắng và nền `paper`, đọc thẳng từ file CSS (không
// qua trình duyệt). Token là biến `--color-*`; giá trị `var(--color-x)` được trả về giá trị của token x.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ratioHex } from "./common.mjs";

const CSS = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "app", "globals.css");
const WHITE = "#FFFFFF";

export function readTokens() {
  const css = readFileSync(CSS, "utf-8");
  const raw = new Map();
  const dupes = [];
  for (const m of css.matchAll(/(--color-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    if (raw.has(m[1])) dupes.push(m[1]);
    raw.set(m[1], m[2].trim());
  }
  const resolve = (name, depth = 0) => {
    const v = raw.get(name);
    if (v === undefined || depth > 5) return null;
    const ref = v.match(/^var\((--color-[a-z0-9-]+)\)$/i);
    return ref ? resolve(ref[1], depth + 1) : v;
  };
  const tokens = [...raw.keys()].map((name) => ({ name, value: resolve(name) }));
  return { tokens, dupes, paper: resolve("--color-paper") };
}

/** Trả về bảng {name, hex, vsWhite, vsPaper, both}. Token có giá trị không phải hex 6 chữ số được liệt kê riêng. */
export function tokenReport() {
  const { tokens, dupes, paper } = readTokens();
  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v ?? "");
  const rows = tokens.filter((t) => isHex(t.value)).map((t) => {
    const vsWhite = ratioHex(t.value, WHITE), vsPaper = ratioHex(t.value, paper);
    return { name: t.name.replace("--color-", ""), hex: t.value.toUpperCase(), vsWhite: +vsWhite.toFixed(2), vsPaper: +vsPaper.toFixed(2), both: vsWhite >= 3 && vsPaper >= 3 };
  });
  return { paper, dupes, nonHex: tokens.filter((t) => !isHex(t.value)), rows };
}

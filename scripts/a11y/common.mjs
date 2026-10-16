// Cấu hình, truy vấn DB cục bộ và các hàm tính độc lập (bên Node) dùng để đối chiếu với số đo trong trang.
import { spawnSync } from "node:child_process";

export const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
export const API_URL = process.env.API_URL ?? "http://127.0.0.1:54321";
export const SECRET_KEY = process.env.SECRET_KEY ?? "";
const DOCKER = process.env.DOCKER_BIN ?? "docker";
const DB_CONTAINER = process.env.DB_CONTAINER ?? "supabase_db_book-store-website";
export const USER_EMAIL = process.env.A11Y_USER ?? "nguoi-dung-01@example.com";
export const ADMIN_EMAIL = process.env.A11Y_ADMIN ?? "admin-demo@example.com";

/** Bộ đo chỉ được chạy trên máy này: từ chối nếu địa chỉ app hoặc Auth không phải loopback. */
export function assertLocal() {
  for (const [n, u] of [["BASE", BASE], ["API_URL", API_URL]]) {
    const h = new URL(u).hostname;
    if (!["127.0.0.1", "localhost", "[::1]", "::1"].includes(h)) throw new Error(`${n}=${h} không phải loopback. Bộ đo không chạy trên hosted.`);
  }
}

/** Chạy SQL trong container Postgres cục bộ; trả về stdout đã cắt khoảng trắng. */
export function psql(sql) {
  const r = spawnSync(DOCKER, ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-At", "-c", sql], { encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`psql lỗi: ${(r.stderr ?? "").slice(0, 200)}`);
  return (r.stdout ?? "").trim();
}

/** Bảy con số mốc nền + dấu thời gian sự kiện mới nhất. */
export function baseline() {
  const v = psql(
    "select (select count(*) from public.books)||'|'||(select count(*) from public.books where stock_quantity=0)||'|'||(select sum(stock_quantity) from public.books)||'|'||(select count(*) from public.orders)||'|'||(select count(*) from public.order_items)||'|'||(select count(*) from auth.users)||'|'||(select count(*) from public.events)",
  );
  const [books, stock0, sumStock, orders, items, users, events] = v.split("|").map(Number);
  return { books, stock0, sumStock, orders, items, users, events, text: v.split("|").join(" | ") };
}

// ───────────── màu, bản Node (độc lập với lib.js) ─────────────
export const rgbOf = (h) => { const m = h.replace("#", ""); return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) }; };
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
export const ratioRgb = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export const ratioHex = (a, b) => ratioRgb(rgbOf(a), rgbOf(b));
/** Màu `fg` ở độ đặc `alpha` hợp lên `bg`, trả về RGB thực (chưa làm tròn). */
export const blend = (fg, alpha, bg) => { const f = rgbOf(fg), b = rgbOf(bg); return { r: f.r * alpha + b.r * (1 - alpha), g: f.g * alpha + b.g * (1 - alpha), b: f.b * alpha + b.b * (1 - alpha) }; };

// ───────────── đếm tên sách trong một chuỗi ─────────────
const norm = (s) => s.replace(/\s+/g, " ").trim();
/**
 * Mỗi tên sách trong `titles` xuất hiện bao nhiêu lần trong `name`. Tên dài khớp trước và phần đã khớp bị che, để
 * "Dế Mèn" không bị đếm thêm bên trong "Dế Mèn phiêu lưu ký".
 */
export function countTitles(name, titles) {
  let rest = norm(name);
  const found = {};
  for (const t of [...new Set(titles)].map(norm).filter(Boolean).sort((a, b) => b.length - a.length)) {
    let n = 0, at;
    while ((at = rest.indexOf(t)) !== -1) { n++; rest = rest.slice(0, at) + "\u0000".repeat(t.length) + rest.slice(at + t.length); }
    if (n) found[t] = n;
  }
  return found;
}

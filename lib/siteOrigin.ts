/**
 * Origin tuyệt đối của site, dùng để dựng link trong email (đợt 3B, spec FR-3B.27).
 *
 * KHÔNG BAO GIỜ lấy từ header của request: `Host` và `X-Forwarded-Host` do client điều
 * khiển được, nên link trong email có thể bị trỏ sang domain khác — và email là đúng chỗ
 * không được để điều đó xảy ra; trong `after()` request context cũng có thể đã không còn.
 *
 * Chuỗi dự phòng, theo thứ tự:
 *   1. `SITE_URL` tường minh;
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` (Vercel đặt sẵn; tên miền production, KHÔNG kèm
 *      `https://`, luôn có kể cả ở bản preview — nên link trong email gửi từ preview trỏ về
 *      production; đặt `SITE_URL` ở môi trường Preview nếu muốn khác). Chỉ có khi ô "Enable
 *      access to System Environment Variables" của dự án Vercel đang bật;
 *   3. `http://localhost:3000` — CHỈ khi `NODE_ENV=development`.
 * Ở `NODE_ENV=production` mà (1) lẫn (2) đều thiếu thì trả `null` (email không có link),
 * thay vì một link `localhost` trong thư thật.
 *
 * Self-contained (không import gì) để script Node chạy được trực tiếp.
 */
export function resolveSiteOrigin(env: Record<string, string | undefined> = process.env): string | null {
  const explicit = (env.SITE_URL ?? "").trim();
  if (explicit !== "") return explicit.replace(/\/+$/, "");

  const vercelHost = (env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim();
  if (vercelHost !== "") return `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  if (env.NODE_ENV === "development") return "http://localhost:3000";
  return null;
}

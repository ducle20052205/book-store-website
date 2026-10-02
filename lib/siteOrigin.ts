/**
 * Origin tuyệt đối của site, dùng để dựng link trong email (đợt 3B, spec FR-3B.27).
 *
 * KHÔNG BAO GIỜ lấy từ header của request: `Host` và `X-Forwarded-Host` do client điều
 * khiển được, nên link trong email có thể bị trỏ sang domain khác — và email là đúng chỗ
 * không được để điều đó xảy ra; trong `after()` request context cũng có thể đã không còn.
 *
 * Chuỗi, theo thứ tự:
 *   1. `SITE_URL` tường minh;
 *   2. `http://localhost:3000` — CHỈ khi `NODE_ENV=development`.
 * Ở `NODE_ENV=production` mà `SITE_URL` thiếu thì trả `null` (email không có link), thay vì
 * một link `localhost` trong thư thật.
 *
 * Cố ý KHÔNG đọc biến hệ thống của Vercel (`VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`):
 * chúng chỉ tồn tại khi ô "Enable access to System Environment Variables" của dự án Vercel
 * đang bật — một cài đặt dễ bị quên mà một email thật không được hỏng im lặng vì nó
 * (quyết định của chủ dự án, 02/10/2026).
 *
 * Self-contained (không import gì) để script Node chạy được trực tiếp.
 */
export function resolveSiteOrigin(env: Record<string, string | undefined> = process.env): string | null {
  const explicit = (env.SITE_URL ?? "").trim();
  if (explicit !== "") return explicit.replace(/\/+$/, "");

  if (env.NODE_ENV === "development") return "http://localhost:3000";
  return null;
}

/**
 * `session_id` của bảng `events` (đợt 3A, spec FR-3A.14): UUID ẩn danh lưu ở
 * cookie `na_sid`. KHÔNG `httpOnly` vì `track()` ở client phải đọc được.
 *
 * Cookie KHÔNG được đặt ở `proxy.ts`: response GET mang `Set-Cookie` thì CDN không
 * lưu được, và gần như mọi khách xem portfolio là khách lần đầu. Cookie được tạo
 * lúc cần, ở đúng hai chỗ, cả hai đều không nằm trên response được cache:
 *   1. `track()` ở client (lib/analytics.ts) — tự sinh UUID, ghi bằng document.cookie;
 *   2. Server Action ghi sự kiện (lib/sessionId.server.ts) — sinh UUID, ghi vào
 *      response của action (POST).
 * Hai nơi dùng chung tên cookie, định dạng và hằng ở file này.
 *
 * File này dùng được ở cả server lẫn client (không import next/headers).
 */

export const SESSION_COOKIE = "na_sid";
/** 1 năm. */
export const SESSION_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSessionId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

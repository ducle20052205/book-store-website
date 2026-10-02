import { cookies, headers } from "next/headers";

/**
 * Giỏ của khách chưa đăng nhập (đợt 3A, spec FR-3A.1, FR-3A.2, FR-3A.11).
 *
 * Lưu bằng cookie `na_cart` chứ không phải `localStorage`: server đọc được nên
 * số trên badge header đúng ngay trong HTML đầu. Cookie `httpOnly` và chỉ ghi
 * qua Server Action (app/actions/cart.ts) — client không đọc, không ghi.
 *
 * Chỉ import file này ở phía server (dùng next/headers).
 */

export const CART_COOKIE = "na_cart";
/** Tối đa 20 dòng; thêm dòng mới khi đã đủ thì bỏ dòng cũ nhất (đứng đầu mảng). */
export const MAX_CART_LINES = 20;
/** Cookie (tên + giá trị đã mã hoá URL) vượt ngưỡng này thì từ chối thêm dòng mới. */
export const MAX_CART_COOKIE_BYTES = 3500;
/** Trần số lượng mỗi dòng, cùng trần với bộ chọn số lượng ở PurchasePanel. */
export const MAX_LINE_QUANTITY = 99;
const CART_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Một dòng trong cookie: `b` = book_id (uuid), `q` = số lượng nguyên từ 1 đến MAX_LINE_QUANTITY. */
export interface CartLine {
  b: string;
  q: number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export interface ParsedCart {
  lines: CartLine[];
  /** false khi cookie có mà không parse được hoặc sai schema (FR-3A.11); không có cookie thì vẫn true. */
  valid: boolean;
}

/**
 * Cookie không parse được, sai schema, `b` không phải uuid hay `q` không phải
 * số nguyên trong [1, MAX_LINE_QUANTITY]: coi cả giỏ là rỗng và báo `valid: false`
 * để nơi gọi ghi đè bằng giá trị hợp lệ. Không bao giờ ném lỗi. Dòng trùng
 * `b` được gộp (cộng dồn, chặn ở MAX_LINE_QUANTITY).
 */
export function parseCartCookie(raw: string | undefined): ParsedCart {
  if (raw === undefined) return { lines: [], valid: true };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { lines: [], valid: false };
  }
  if (!Array.isArray(parsed)) return { lines: [], valid: false };

  const merged = new Map<string, number>();
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) return { lines: [], valid: false };
    const { b, q } = item as { b?: unknown; q?: unknown };
    if (!isUuid(b) || typeof q !== "number" || !Number.isInteger(q) || q < 1 || q > MAX_LINE_QUANTITY) {
      return { lines: [], valid: false };
    }
    const key = b.toLowerCase();
    merged.set(key, Math.min((merged.get(key) ?? 0) + q, MAX_LINE_QUANTITY));
  }

  const lines = [...merged].map(([b, q]) => ({ b, q }));
  return { lines: lines.slice(-MAX_CART_LINES), valid: true };
}

export async function readGuestCart(): Promise<ParsedCart> {
  const store = await cookies();
  return parseCartCookie(store.get(CART_COOKIE)?.value);
}

/** `secure` khi không phải localhost (FR-3A.1): trình duyệt vẫn nhận cookie secure trên 127.0.0.1, nhưng spec chọn theo máy chủ. */
async function isLocalHost(): Promise<boolean> {
  const host = (await headers()).get("host") ?? "";
  const hostname = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** Số byte cookie sẽ gửi đi: tên + dấu bằng + giá trị đã mã hoá URL (đúng như Set-Cookie). */
export function cartCookieBytes(lines: CartLine[]): number {
  return CART_COOKIE.length + 1 + encodeURIComponent(JSON.stringify(lines)).length;
}

export type WriteGuestCartResult = { ok: true } | { ok: false; reason: "too_big" };

/**
 * Ghi giỏ vào cookie (chỉ gọi trong Server Action). `lines` rỗng vẫn ghi `[]` —
 * một giá trị hợp lệ — để ghi đè cookie hỏng; muốn xoá hẳn thì dùng clearGuestCart.
 */
export async function writeGuestCart(lines: CartLine[]): Promise<WriteGuestCartResult> {
  const kept = lines.slice(-MAX_CART_LINES);
  if (cartCookieBytes(kept) > MAX_CART_COOKIE_BYTES) return { ok: false, reason: "too_big" };

  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(kept), {
    httpOnly: true,
    secure: !(await isLocalHost()),
    sameSite: "lax",
    path: "/",
    maxAge: CART_MAX_AGE_SECONDS,
  });
  return { ok: true };
}

export async function clearGuestCart(): Promise<void> {
  const store = await cookies();
  if (store.has(CART_COOKIE)) store.delete(CART_COOKIE);
}

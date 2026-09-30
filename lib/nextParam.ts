/**
 * Luật DUY NHẤT cho tham số `?next=` (FR-5.3, spec 2B mục 8): sau khi đăng nhập
 * hoặc đăng ký thì điều hướng theo `?next=`, nhưng chỉ tới path NỘI BỘ — chống
 * open redirect. proxy.ts và các trang /dang-nhap, /dang-ky đều gọi hàm này,
 * không nơi nào tự viết lại luật, để không có hai bản lệch nhau.
 */

/** Đích khi `?next=` thiếu hoặc không hợp lệ. */
export const DEFAULT_NEXT_PATH = "/";

// Gốc giả chỉ để dựng URL kiểm tra; không bao giờ được dùng để điều hướng.
const PROBE_ORIGIN = "http://next-param.invalid";

/**
 * Trả về `raw` nếu là path nội bộ hợp lệ, ngược lại trả về "/".
 *
 * Ba luật của spec — path phải:
 *   1. bắt đầu bằng "/";
 *   2. không bắt đầu bằng "//" (URL không scheme, trình duyệt hiểu là host khác);
 *   3. không bắt đầu bằng "/\" (nhiều trình duyệt coi "\" như "/", nên "/\host"
 *      thành "//host").
 *
 * Thêm một lớp kiểm chứng: dựng URL thật rồi so origin. Lớp này bắt trường hợp
 * mà ba luật trên bỏ sót — bộ phân tích URL bỏ các ký tự tab/xuống dòng, nên
 * "/<tab>/host" thành "//host" dù không bắt đầu bằng "//" khi còn là chuỗi.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (typeof raw !== "string" || raw.length === 0) return DEFAULT_NEXT_PATH;
  if (!raw.startsWith("/")) return DEFAULT_NEXT_PATH;
  if (raw.startsWith("//")) return DEFAULT_NEXT_PATH;
  if (raw.startsWith("/\\")) return DEFAULT_NEXT_PATH;

  try {
    const resolved = new URL(raw, PROBE_ORIGIN);
    if (resolved.origin !== PROBE_ORIGIN) return DEFAULT_NEXT_PATH;
  } catch {
    return DEFAULT_NEXT_PATH;
  }

  return raw;
}

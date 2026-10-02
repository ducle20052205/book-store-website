/**
 * "Luồng tập trung" (đợt 3A, FR-3A.16): các trang người dùng đang dở việc mua hàng.
 * Dưới `--breakpoint-bottom-bar`, footer đầy đủ được thay bằng một dòng ghi chú ở các trang này
 * (components/FooterSwitch.tsx). Thêm trang vào đây khi một bước mới của luồng
 * mua hàng ra đời.
 *
 * So khớp CHÍNH XÁC từng đường dẫn, không khớp đường dẫn con (đợt 3B, FR-3B.16): trước đây dùng
 * `startsWith(base + "/")` nên `/thanh-toan/hoan-tat/...` — trang xác nhận đơn, đã hoàn tất luồng —
 * bị tính nhầm là luồng tập trung và mất footer đầy đủ. Trang xác nhận KHÔNG thuộc luồng tập trung.
 */
const FOCUSED_FLOW_PATHS = ["/gio-hang", "/thanh-toan"];

export function isFocusedFlow(pathname: string | null): boolean {
  if (!pathname) return false;
  // Dấu "/" ở cuối (nếu có) không làm đổi trang.
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return FOCUSED_FLOW_PATHS.includes(normalized);
}

/**
 * "Luồng tập trung" (đợt 3A, FR-3A.16): các trang người dùng đang dở việc mua hàng.
 * Dưới 768px, footer đầy đủ được thay bằng một dòng ghi chú ở các trang này
 * (components/FooterSwitch.tsx). Thêm trang vào đây khi một bước mới của luồng
 * mua hàng ra đời.
 */
const FOCUSED_FLOW_PATHS = ["/gio-hang", "/thanh-toan"];

export function isFocusedFlow(pathname: string | null): boolean {
  if (!pathname) return false;
  return FOCUSED_FLOW_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

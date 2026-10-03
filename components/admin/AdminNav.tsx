import Link from "next/link";

/**
 * Dải điều hướng tối thiểu của khu quản trị (đợt 5A, spec FR-5A.2): chỉ một liên kết văn bản "Đơn hàng"
 * (`aria-current="page"` ở các trang đơn hàng — hiện chỉ có khu này). Không thanh bên, không bảng điều khiển.
 * Chỉ được render SAU `requireAdmin()` bên trong `<Suspense>`: vỏ tĩnh của trang không được chứa chữ nào của
 * giao diện quản trị (FR-5A.1).
 */
export function AdminNav() {
  return (
    <nav aria-label="Khu quản trị" className="mb-4">
      <Link
        href="/admin/don-hang"
        aria-current="page"
        className="inline-flex min-h-11 items-center text-body-sm font-medium text-cham-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        Đơn hàng
      </Link>
    </nav>
  );
}

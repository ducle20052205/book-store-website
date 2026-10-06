import Link from "next/link";

/**
 * Dải điều hướng tối thiểu của khu quản trị (đợt 5A, spec FR-5A.2; đợt 5B thêm "Sách"; đợt 6, FR-D.1, thêm
 * "Thống kê" đứng đầu): ba liên kết văn bản, `aria-current="page"` ở mục đang xem (`current`, mặc định
 * `"stats"`). Không thanh bên, không bảng điều khiển. Chỉ được render SAU `requireAdmin()` bên trong
 * `<Suspense>`: vỏ tĩnh của trang không được chứa chữ nào của giao diện quản trị (FR-5A.1).
 */
const linkClass =
  "inline-flex min-h-11 min-w-11 items-center text-body-sm font-medium text-cham-700 hover:underline aria-[current=page]:underline aria-[current=page]:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600";

export function AdminNav({ current = "stats" }: { current?: "stats" | "orders" | "books" }) {
  return (
    <nav aria-label="Khu quản trị" className="mb-4 flex gap-6">
      <Link href="/admin" aria-current={current === "stats" ? "page" : undefined} className={linkClass}>
        Thống kê
      </Link>
      <Link href="/admin/don-hang" aria-current={current === "orders" ? "page" : undefined} className={linkClass}>
        Đơn hàng
      </Link>
      <Link href="/admin/sach" aria-current={current === "books" ? "page" : undefined} className={linkClass}>
        Sách
      </Link>
    </nav>
  );
}

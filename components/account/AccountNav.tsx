import Link from "next/link";

/**
 * Dải điều hướng khu tài khoản (đợt 8, spec FR-A.6): BẢN SAO khuôn `components/admin/AdminNav.tsx` — hai liên kết văn bản,
 * `aria-current="page"` ở mục đang xem (`current`), `min-h-11`, cùng `linkClass`. Không thanh bên, không bảng điều khiển.
 * Hai mục: Hồ sơ (`/tai-khoan`) và Đơn hàng (`/tai-khoan/don-hang`). Dải này không chứa dữ liệu cá nhân, nên đứng được cả
 * trong shell tĩnh (fallback của <Suspense>) lẫn trong phần nội dung sau khi kiểm phiên.
 */
const linkClass =
  "inline-flex min-h-11 min-w-11 items-center text-body-sm font-medium text-cham-700 hover:underline aria-[current=page]:underline aria-[current=page]:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600";

export function AccountNav({ current }: { current: "profile" | "orders" }) {
  return (
    <nav aria-label="Khu tài khoản" className="mb-4 flex gap-6">
      <Link href="/tai-khoan" aria-current={current === "profile" ? "page" : undefined} className={linkClass}>
        Hồ sơ
      </Link>
      <Link href="/tai-khoan/don-hang" aria-current={current === "orders" ? "page" : undefined} className={linkClass}>
        Đơn hàng
      </Link>
    </nav>
  );
}

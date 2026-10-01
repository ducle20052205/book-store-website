import Link from "next/link";
import type { Metadata } from "next";

// Trang tạm cho tới đợt 3 (giỏ hàng thật, FR-3.x). Có mặt để liên kết "Giỏ hàng" ở
// header không trỏ vào 404: mỗi lần tải trang, `<Link>` prefetch /gio-hang và trước
// đây nhận 404 (một request lỗi và một dòng đỏ trong console mỗi lượt tải). Không
// có logic giỏ hàng ở đây; noindex vì nội dung chỉ là lời báo.
export const metadata: Metadata = {
  title: "Giỏ hàng — NA Books",
  robots: { index: false },
};

export default function GioHangPage() {
  return (
    <div className="container-page py-12">
      <h1 className="font-serif text-h1 text-ink-900">Giỏ hàng</h1>
      <p className="mt-3 max-w-prose text-body text-ink-600">
        Giỏ hàng thuộc giai đoạn sau của dự án này, nên chúng mình chưa làm xong trang này.
      </p>
      <p className="mt-3 max-w-prose text-body text-ink-600">
        Trong lúc chờ, bạn cứ xem sách và chọn cuốn mình thích nhé.
      </p>
      <Link
        href="/sach"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-cham-700 px-5 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
      >
        Quay về danh sách sách
      </Link>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

// Trang tạm cho tới đợt 3B (thanh toán, FR-4.x). Có mặt để nút "Thanh toán" ở /gio-hang
// không trỏ vào 404 (mỗi lần tải /gio-hang, <Link> prefetch /thanh-toan và sẽ nhận 404:
// một request lỗi và một dòng đỏ trong console, như /gio-hang trước đây ở đợt 2B.1).
// Không có logic thanh toán ở đây; noindex vì nội dung chỉ là lời báo.
export const metadata: Metadata = {
  title: "Thanh toán — NA Books",
  robots: { index: false },
};

export default function ThanhToanPage() {
  return (
    <div className="container-page py-12">
      <h1 className="font-serif text-h1 text-ink-900">Thanh toán</h1>
      <p className="mt-3 max-w-prose text-body text-ink-600">
        Thanh toán thuộc giai đoạn sau của dự án này, nên chúng mình chưa làm xong trang này.
      </p>
      <p className="mt-3 max-w-prose text-body text-ink-600">
        Giỏ hàng của bạn vẫn được giữ nguyên, bạn cứ quay lại xem hoặc chọn thêm sách nhé.
      </p>
      <Link
        href="/gio-hang"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-cham-700 px-5 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
      >
        Quay lại giỏ hàng
      </Link>
    </div>
  );
}

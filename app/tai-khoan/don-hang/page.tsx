import Link from "next/link";
import type { Metadata } from "next";

// Trang tạm cho tới đợt Lịch sử đơn hàng (FR-6.x). Có mặt để nút "Xem đơn hàng của bạn" ở trang xác
// nhận (và mục "Đơn hàng của tôi" trong menu tài khoản) không trỏ vào 404. Cùng khuôn với trang tạm
// của /gio-hang (đợt 2B.1) và /thanh-toan (đợt 3A): trả 200, header/footer như mọi trang, nói thẳng
// tính năng thuộc đợt sau, có đường quay lại. Nằm dưới /tai-khoan nên proxy.ts bảo vệ (cần đăng nhập).
export const metadata: Metadata = {
  title: "Đơn hàng của tôi — NA Books",
  robots: { index: false },
};

export default function DonHangPage() {
  return (
    <div className="container-page py-12">
      <h1 className="font-serif text-h1 text-ink-900">Đơn hàng của tôi</h1>
      <p className="mt-3 max-w-prose text-body text-ink-600">
        Lịch sử đơn hàng thuộc giai đoạn sau của dự án này, nên chúng mình chưa làm xong trang này.
      </p>
      <p className="mt-3 max-w-prose text-body text-ink-600">
        Đơn bạn vừa đặt vẫn được ghi nhận. Mã đơn nằm ở trang xác nhận và trong email chúng mình gửi (nếu gửi được).
      </p>
      <Link
        href="/sach"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-cham-700 px-5 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
      >
        Tiếp tục xem sách
      </Link>
    </div>
  );
}

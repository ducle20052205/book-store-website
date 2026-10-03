import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderSummary } from "@/components/order/OrderSummary";
import { getOwnOrder } from "@/lib/orders/getOwnOrder";

/**
 * /thanh-toan/hoan-tat/[order_code] (đợt 3B, spec FR-3B.26, FR-3B.29): trang xác nhận đơn, bố cục
 * theo docs/mockups/buoc-3/ (xac-nhan-don.png, xac-nhan-don-mobile.png).
 *
 * Chỉ CHỦ ĐƠN xem được: `getOwnOrder` lọc theo `user_id` của phiên (ngoài RLS), người khác — kể cả admin,
 * vì admin đọc được mọi đơn qua RLS — nhận 404. Trang KHÔNG thuộc luồng tập trung: không thanh đáy,
 * footer đầy đủ (lib/focusedFlow.ts loại đường dẫn này). Đọc `confirmation_email_sent_at` để nói
 * thật về email: chưa có thì không bao giờ viết "đang gửi" (FR-3B.29).
 *
 * Đợt 4 (FR-B4.2): khối tóm tắt đơn và truy vấn đơn đã tách ra dùng chung với `/tai-khoan/don-hang/[order_code]`
 * (components/order/OrderSummary.tsx, lib/orders/getOwnOrder.ts); trang này giữ phần chào mừng và dòng về email.
 */
export const metadata: Metadata = {
  title: "Đã nhận đơn hàng — NA Books",
  robots: { index: false },
};

const primaryButtonClass =
  "pressable inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-field bg-cham-700 px-6 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 md:w-auto";
const secondaryButtonClass =
  "pressable inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-field border border-cham-700 bg-surface px-6 text-button font-medium text-cham-700 hover:bg-cham-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 md:w-auto";

export default function HoanTatPage({ params }: PageProps<"/thanh-toan/hoan-tat/[order_code]">) {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 md:px-6 md:py-10 lg:px-10">
      <Suspense fallback={<div aria-busy="true" className="min-h-48" />}>
        <Confirmation params={params} />
      </Suspense>
    </div>
  );
}

async function Confirmation({ params }: { params: PageProps<"/thanh-toan/hoan-tat/[order_code]">["params"] }) {
  const { order_code: rawCode } = await params;
  const found = await getOwnOrder(rawCode);
  if (!found) notFound();

  const { order, email } = found;
  const emailSent = order.confirmation_email_sent_at !== null;

  return (
    <>
      <div className="border-l-[3px] border-success pl-4 md:pl-6">
        <h1 className="font-serif text-h1 text-ink-900">Chúng mình đã nhận đơn của bạn</h1>
        {emailSent ? (
          <p className="mt-3 max-w-[68ch] text-body text-ink-600">
            Email xác nhận vừa được gửi tới <span className="font-medium text-ink-900">{email ?? "địa chỉ email của bạn"}</span>. Đơn sẽ chuyển
            sang trạng thái “đang xử lý” khi chúng mình bắt đầu đóng gói.
          </p>
        ) : (
          <p role="status" className="mt-3 max-w-[68ch] text-body text-ink-600">
            Chúng mình chưa gửi được email xác nhận, nhưng đơn của bạn đã được ghi nhận với mã bên dưới. Bạn lưu lại mã này nhé.
          </p>
        )}
      </div>

      <OrderSummary order={order} />

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <Link href="/tai-khoan/don-hang" prefetch={false} className={primaryButtonClass}>
          Xem đơn hàng của bạn
        </Link>
        <Link href="/sach" className={secondaryButtonClass}>
          Tiếp tục xem sách
        </Link>
      </div>

      <p className="mt-6 text-body-sm text-ink-600">
        Đây là dự án portfolio: không có cổng thanh toán thật và không có đơn hàng nào được giao. Dữ liệu sách chỉ nhằm minh họa.
      </p>
    </>
  );
}

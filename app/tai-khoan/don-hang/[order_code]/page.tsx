import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CancelOrder } from "@/components/order/CancelOrder";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PageTitle } from "@/components/PageTitle";
import { formatOrderDateTime } from "@/lib/format/orderDate";
import { getOwnOrder } from "@/lib/orders/getOwnOrder";

/**
 * /tai-khoan/don-hang/[order_code] (đợt 4, spec FR-B4.2): chi tiết một đơn trong lịch sử. Khối tóm tắt là
 * thành phần dùng chung với trang xác nhận; trang này thêm liên kết quay lại, dòng "Đặt lúc" và vùng hủy đơn
 * (FR-B4.4) — hai thứ sau nằm NGOÀI khối dùng chung. Người khác, mã không tồn tại, mã sai định dạng: cùng
 * một `notFound()`, nên không ai phân biệt được "đơn của người khác" với "không có đơn này". `notFound()`
 * trong <Suspense> trả giao diện 404 kèm `noindex` nhưng mã HTTP là 200 (hạn chế đã biết, spec 3B mục 7.1).
 */
export const metadata: Metadata = {
  title: "Chi tiết đơn hàng — NA Books",
  robots: { index: false },
};

export default function ChiTietDonPage({ params }: PageProps<"/tai-khoan/don-hang/[order_code]">) {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 md:px-6 md:py-10 lg:px-10">
      <Suspense fallback={<div aria-busy="true" className="min-h-48" />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}

async function Detail({ params }: { params: PageProps<"/tai-khoan/don-hang/[order_code]">["params"] }) {
  const { order_code: rawCode } = await params;
  const found = await getOwnOrder(rawCode);
  if (!found) notFound();
  const { order } = found;

  return (
    <>
      <Link
        href="/tai-khoan/don-hang"
        className="mb-4 inline-flex min-h-11 items-center text-body-sm font-medium text-cham-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        ← Đơn hàng của tôi
      </Link>
      <PageTitle title="Chi tiết đơn hàng" />
      <p className="mt-2 text-body-sm text-ink-600">Đặt lúc {formatOrderDateTime(order.created_at)}</p>
      <OrderSummary order={order} />
      <CancelOrder orderCode={order.order_code} status={order.status} />
    </>
  );
}

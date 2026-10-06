import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PageTitle } from "@/components/PageTitle";
import { type AdminCustomer, getAdminOrder } from "@/lib/admin/orders";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { formatOrderDateTime } from "@/lib/format/orderDate";
import { cardClass } from "@/lib/ui/classes";

/**
 * /admin/don-hang/[order_code] (đợt 5A, spec FR-5A.4): chi tiết một đơn cho admin. Khối tóm tắt là
 * `OrderSummary` dùng nguyên (cùng thành phần với trang của khách); trang này thêm dòng "Đặt lúc", khối
 * "Khách hàng" (thông tin TÀI KHOẢN, có thể khác người nhận ghi trong đơn) và vùng đổi trạng thái — cả ba nằm
 * NGOÀI khối dùng chung. Mã sai định dạng hoặc không tồn tại: `notFound()` (mã HTTP 200 trong <Suspense>, hạn
 * chế đã biết, spec 3B mục 7.1). Dữ liệu cá nhân của khách chỉ hiện ở đây: `noindex`, không ghi log, không
 * đưa vào URL. Toàn bộ nằm SAU `requireAdmin()` bên trong <Suspense>, `title` chung (spec FR-5A.1).
 */
export const metadata: Metadata = {
  title: "NA Books",
  robots: { index: false },
};

const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";
const NO_INFO = "Chưa có thông tin";

export default function AdminChiTietDonPage({ params }: PageProps<"/admin/don-hang/[order_code]">) {
  return (
    <div className={containerClass}>
      <Suspense fallback={<div aria-busy="true" className="min-h-48" />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}

async function Detail({ params }: { params: PageProps<"/admin/don-hang/[order_code]">["params"] }) {
  const { order_code: rawCode } = await params;
  await requireAdmin(`/admin/don-hang/${rawCode}`);

  const found = await getAdminOrder(rawCode);
  if (!found) notFound();
  const { order, customer } = found;

  return (
    <>
      <AdminNav current="orders" />
      <Link
        href="/admin/don-hang"
        className="mb-4 inline-flex min-h-11 items-center text-body-sm font-medium text-cham-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        ← Danh sách đơn hàng
      </Link>
      <PageTitle title="Chi tiết đơn hàng" />
      <p className="mt-2 text-body-sm text-ink-600">Đặt lúc {formatOrderDateTime(order.created_at)}</p>
      <OrderSummary order={order} />
      <CustomerBlock customer={customer} />
      <OrderStatusControl orderCode={order.order_code} status={order.status} />
    </>
  );
}

function CustomerBlock({ customer }: { customer: AdminCustomer | null }) {
  const rows: [string, string | null | undefined][] = [
    ["Họ tên", customer?.full_name],
    ["Email", customer?.email],
    ["Số điện thoại", customer?.phone],
  ];
  return (
    <section aria-label="Khách hàng" data-testid="admin-order-customer" className={`${cardClass} mt-6 p-4 md:p-6`}>
      <h2 className="font-serif text-xl font-semibold text-ink-900">Khách hàng</h2>
      <p className="mt-1 text-body-sm text-ink-600">Thông tin tài khoản đặt đơn; người nhận hàng ghi ở khối chi tiết đơn phía trên.</p>
      <dl className="mt-4 grid gap-x-6 gap-y-3 md:grid-cols-[9rem_minmax(0,1fr)]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-body-sm text-ink-600">{label}</dt>
            <dd className={`break-words text-body ${value?.trim() ? "text-ink-900" : "text-ink-600"}`}>{value?.trim() ? value : NO_INFO}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

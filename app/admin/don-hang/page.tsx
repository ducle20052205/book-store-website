import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { EmptyState } from "@/components/EmptyState";
import { OrderStatusChip } from "@/components/order/OrderStatusChip";
import { PageTitle } from "@/components/PageTitle";
import { PaginationNav } from "@/components/PaginationNav";
import { formatVnd } from "@/components/Price";
import { ADMIN_ORDER_SEARCH_MAX, buildAdminOrderQuery, listAdminOrders, parseAdminOrderParams, type ParsedAdminOrderParams } from "@/lib/admin/orders";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { formatOrderDateTime } from "@/lib/format/orderDate";
import { ORDER_STATUSES, orderStatusLabel } from "@/lib/orderStatus";
import { cardClass, inputClass, primaryButtonClass } from "@/lib/ui/classes";

/**
 * /admin/don-hang (đợt 5A, spec FR-5A.3): toàn bộ đơn của mọi khách, mới nhất trước, 20 dòng mỗi trang, lọc
 * theo trạng thái, tìm theo mã đơn hoặc tên khách. Bộ lọc và trang nằm trên URL (`status`, `q`, `page`).
 *
 * Vỏ tĩnh KHÔNG được lộ giao diện quản trị (FR-5A.1): Cache Components prerender mọi thứ ngoài <Suspense>
 * thành shell ai cũng nhận được trước khi `requireAdmin()` chạy, nên tiêu đề, điều hướng và nội dung đều nằm
 * SAU `requireAdmin()` bên trong <Suspense>; fallback là một khối trống không có chữ; `title` chung "NA
 * Books" và `noindex`.
 */
export const metadata: Metadata = {
  title: "NA Books",
  robots: { index: false },
};

const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";
const LIST_PATH = "/admin/don-hang";

export default function AdminDonHangPage({ searchParams }: PageProps<"/admin/don-hang">) {
  return (
    <div className={containerClass}>
      <Suspense fallback={<div aria-busy="true" className="min-h-48" />}>
        <AdminOrders searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminOrders({ searchParams }: { searchParams: PageProps<"/admin/don-hang">["searchParams"] }) {
  const parsed = parseAdminOrderParams(await searchParams);
  await requireAdmin(`${LIST_PATH}${buildAdminOrderQuery(parsed, { page: parsed.page })}`);

  const list = await listAdminOrders(parsed);
  if (!list) {
    return (
      <>
        <AdminNav current="orders" />
        <PageTitle title="Quản lý đơn hàng" />
        <p role="alert" className="mt-6 text-body text-ink-600">
          Chúng mình chưa tải được danh sách đơn hàng lúc này. Bạn thử tải lại trang sau ít phút nhé.
        </p>
      </>
    );
  }

  const { rows, accountNames, total, page, totalPages } = list;
  const filtering = Boolean(parsed.status || parsed.q);

  return (
    <>
      <AdminNav current="orders" />
      <PageTitle title="Quản lý đơn hàng" count={total} unit="đơn" countTestId="admin-order-count" />
      <FilterForm parsed={parsed} filtering={filtering} />

      {rows.length === 0 ? (
        <EmptyState
          title={filtering ? "Không có đơn nào khớp bộ lọc" : "Chưa có đơn hàng nào"}
          actions={filtering ? [{ href: LIST_PATH, label: "Xoá lọc", variant: "primary" }] : []}
        >
          {filtering ? "Bạn thử đổi từ khoá hoặc trạng thái, hoặc xoá bộ lọc để xem tất cả đơn." : "Khi khách đặt đơn đầu tiên, đơn sẽ xuất hiện ở đây."}
        </EmptyState>
      ) : (
        <>
          {/* Mỗi dòng là một lưới riêng, nên cột chip CỐ ĐỊNH chiều rộng ở md (7rem) — bài học lệch cột ở đợt 4.
              Từ 390px dòng xếp hai hàng: mã đơn + chip, rồi người nhận · ngày giờ + tổng tiền; dòng phụ "Tài khoản" chỉ hiện từ md và tên người nhận cắt bằng "…" dưới md (ngày giờ không xuống dòng) để giữ đúng hai hàng (spec FR-5A.3); tên đầy đủ có ở trang chi tiết. */}
          <ul data-testid="admin-order-list" className={`${cardClass} mt-6 divide-y divide-menu-sep`}>
            {rows.map((order) => {
              const account = accountNames[order.user_id];
              const showAccount = account && account.trim().toLowerCase() !== order.recipient_name.trim().toLowerCase();
              return (
                <li key={order.order_code} data-testid="admin-order-row">
                  <Link
                    href={`${LIST_PATH}/${order.order_code}`}
                    prefetch={false}
                    className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 p-4 hover:bg-cham-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cham-600 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_7rem] md:gap-x-6 md:p-6"
                  >
                    <span className="font-sans font-semibold tracking-[0.04em] text-ink-900 md:order-1">{order.order_code}</span>
                    <span className="justify-self-end md:order-5">
                      <OrderStatusChip status={order.status} />
                    </span>
                    <span className="flex min-w-0 items-baseline gap-x-2 text-body-sm text-ink-600 md:contents">
                      <span className="min-w-0 max-md:truncate md:order-3">
                        <span className="text-ink-900">{order.recipient_name}</span>
                        {showAccount && <span className="hidden text-meta text-ink-600 md:block">Tài khoản: {account}</span>}
                      </span>
                      <span className="shrink-0 md:order-2">{formatOrderDateTime(order.created_at)}</span>
                    </span>
                    <span className="justify-self-end text-body-sm font-medium text-ink-900 md:order-4">{formatVnd(order.total_amount)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <PaginationNav page={page} totalPages={totalPages} hrefFor={(p) => `${LIST_PATH}${buildAdminOrderQuery(parsed, { page: p })}`} />
        </>
      )}
    </>
  );
}

/**
 * Bộ lọc là một <form method="get"> thuần: không cần JavaScript, URL là nguồn sự thật duy nhất, Back và chia
 * sẻ liên kết đúng một cách tự nhiên. Gửi form bỏ `page` nên đổi bộ lọc luôn về trang 1. (Trình duyệt gửi cả ô
 * trống nên URL có thể mang `q=&status=`; hàm parse coi chúng là rỗng. Liên kết phân trang và "Xoá lọc" do
 * `buildAdminOrderQuery` dựng thì không có tham số rỗng.)
 */
function FilterForm({ parsed, filtering }: { parsed: ParsedAdminOrderParams; filtering: boolean }) {
  return (
    <form method="get" action={LIST_PATH} role="search" data-testid="admin-order-filter" className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
      <div className="md:flex-1">
        <label htmlFor="admin-order-q" className="mb-1.5 block text-body-sm font-medium text-ink-900">
          Tìm theo mã đơn hoặc tên khách
        </label>
        <input
          id="admin-order-q"
          type="search"
          name="q"
          defaultValue={parsed.q ?? ""}
          maxLength={ADMIN_ORDER_SEARCH_MAX}
          autoComplete="off"
          className={`${inputClass} border-line-field`}
        />
      </div>
      <div className="md:w-56">
        <label htmlFor="admin-order-status" className="mb-1.5 block text-body-sm font-medium text-ink-900">
          Trạng thái
        </label>
        <select id="admin-order-status" name="status" defaultValue={parsed.status ?? ""} className={`${inputClass} border-line-field`}>
          <option value="">Tất cả</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {orderStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={`${primaryButtonClass} md:!w-auto`}>
        Lọc
      </button>
      {filtering && (
        <Link
          href={LIST_PATH}
          className="inline-flex min-h-11 items-center justify-center text-body-sm font-medium text-cham-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
        >
          Xoá lọc
        </Link>
      )}
    </form>
  );
}

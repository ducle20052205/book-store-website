import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountNav } from "@/components/account/AccountNav";
import { EmptyState } from "@/components/EmptyState";
import { OrderStatusChip } from "@/components/order/OrderStatusChip";
import { PageTitle } from "@/components/PageTitle";
import { formatVnd } from "@/components/Price";
import { formatOrderDateTime } from "@/lib/format/orderDate";
import { createClient } from "@/lib/supabase/server";
import { cardClass } from "@/lib/ui/classes";

/**
 * /tai-khoan/don-hang (đợt 4, spec FR-B4.1): danh sách đơn của người đang đăng nhập, thay trang tạm của 3B.
 * Mới nhất trước; cả danh sách là MỘT mặt phẳng trắng ngăn bằng kẻ 1px (cùng mẫu `<ul>` của /gio-hang);
 * tối đa 50 đơn gần nhất, nhiều hơn thì có một dòng nói rõ; không phân trang. Đọc phiên cần cookie nên
 * nội dung nằm sau <Suspense>; tiêu đề trang nằm trong shell. Không `"use cache"`.
 */
export const metadata: Metadata = {
  title: "Đơn hàng của tôi — NA Books",
  robots: { index: false },
};

const PAGE_LIMIT = 50;
const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";
const LOGIN_HREF = `/dang-nhap?next=${encodeURIComponent("/tai-khoan/don-hang")}`;

export default function DonHangPage() {
  return (
    <div className={containerClass}>
      <Suspense
        fallback={
          <>
            <AccountNav current="orders" />
            <PageTitle title="Đơn hàng của tôi" />
            <div aria-busy="true" className={`${cardClass} mt-6 min-h-48`} />
          </>
        }
      >
        <OrderList />
      </Suspense>
    </div>
  );
}

interface OrderRow {
  order_code: string;
  status: string;
  total_amount: number;
  created_at: string | null;
}

async function OrderList() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  // Lớp bảo vệ thứ hai (lớp thứ nhất là proxy.ts, xem "nguyên tắc hai lớp" ở đầu file đó).
  if (!userId) redirect(LOGIN_HREF);

  // Lọc TƯỜNG MINH theo user_id ngoài RLS: admin đọc được mọi đơn qua policy orders_select_own_or_admin,
  // nên đây là thứ giữ cho admin chỉ thấy đơn của chính mình. `created_at` cho phép NULL và Postgres xếp
  // NULL lên đầu khi sắp giảm dần, nên `nullsFirst: false`; `order_code` giải quyết hai đơn trùng giây.
  const { data, count, error } = await supabase
    .from("orders")
    .select("order_code, status, total_amount, created_at", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("order_code", { ascending: false })
    .limit(PAGE_LIMIT);

  if (error) {
    return (
      <>
        <AccountNav current="orders" />
        <PageTitle title="Đơn hàng của tôi" />
        <p role="alert" className="mt-6 text-body text-ink-600">
          Chúng mình chưa tải được danh sách đơn hàng lúc này. Bạn thử tải lại trang sau ít phút nhé.
        </p>
      </>
    );
  }

  const rows = (data ?? []) as OrderRow[];
  const total = count ?? rows.length;

  if (rows.length === 0) {
    return (
      <>
        <AccountNav current="orders" />
        <PageTitle title="Đơn hàng của tôi" />
        <EmptyState
          title="Bạn chưa có đơn hàng nào"
          actions={[
            { href: "/sach", label: "Xem tất cả sách", variant: "primary" },
            { href: "/tu-sach", label: "Khám phá tủ sách", variant: "secondary" },
          ]}
        >
          Khi bạn đặt đơn đầu tiên, chúng mình sẽ xếp nó ở đây để bạn theo dõi. Nếu đổi ý lúc đơn còn chờ xử lý, bạn cũng hủy được ngay tại đây.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <AccountNav current="orders" />
      <PageTitle title="Đơn hàng của tôi" count={total} unit="đơn" />
      {/* Mỗi dòng là một lưới riêng, nên cột chip phải CỐ ĐỊNH chiều rộng ở md (7rem): để `auto` thì nhãn dài
          ngắn khác nhau ("Hoàn tất" so với "Đang xử lý") làm các cột ngày và tổng tiền xê dịch giữa các dòng. */}
      <ul data-testid="order-list" className={`${cardClass} mt-6 divide-y divide-menu-sep`}>
        {rows.map((order) => (
          <li key={order.order_code} data-testid="order-row">
            <Link
              href={`/tai-khoan/don-hang/${order.order_code}`}
              prefetch={false}
              className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 p-4 hover:bg-cham-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cham-600 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_7rem] md:gap-x-6 md:p-6"
            >
              <span className="font-sans font-semibold tracking-[0.04em] text-ink-900 md:order-1">{order.order_code}</span>
              <span className="justify-self-end md:order-4">
                <OrderStatusChip status={order.status} />
              </span>
              <span className="text-body-sm text-ink-600 md:order-2">{formatOrderDateTime(order.created_at)}</span>
              <span className="justify-self-end text-body-sm font-medium text-ink-900 md:order-3 md:justify-self-end">{formatVnd(order.total_amount)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {total > PAGE_LIMIT && (
        <p data-testid="order-list-limit-note" className="mt-4 text-body-sm text-ink-600">
          Đang hiển thị {PAGE_LIMIT} đơn gần nhất trong {total} đơn của bạn.
        </p>
      )}
    </>
  );
}

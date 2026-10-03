import { BookCover } from "@/components/BookCover";
import { OrderStatusChip } from "@/components/order/OrderStatusChip";
import { formatVnd } from "@/components/Price";
import { PAYMENT_METHOD_LABELS } from "@/lib/checkoutRules";
import type { OrderDetail } from "@/lib/orders/orderDetail";

/**
 * Khối tóm tắt đơn (đợt 4, spec FR-B4.2): mã đơn, trạng thái, sách trong đơn (số lượng × giá lúc mua),
 * địa chỉ giao đã đóng băng, phương thức thanh toán, tổng tiền. MỘT thành phần dùng chung cho
 * `/thanh-toan/hoan-tat/[order_code]` và `/tai-khoan/don-hang/[order_code]` — hai route chỉ bọc ngoài.
 * Dòng "Đặt lúc" và vùng hủy đơn của trang lịch sử nằm NGOÀI khối này, để khối giống hệt nhau ở hai route.
 *
 * Tách từ trang xác nhận (đợt 3B, bố cục theo docs/mockups/buoc-3/xac-nhan-don*.png); HTML giữ nguyên,
 * chỉ thêm hai thuộc tính `data-testid` (TC-12). `mt-8` nằm ngay trên `<section>` như bản gốc: đặt nó ở thẻ
 * bao ngoài thì HTML của khối khác bản chụp trước khi tách, và hai route sẽ không giống hệt nhau.
 */
export function OrderSummary({ order }: { order: OrderDetail }) {
  const items = [...order.order_items].sort((a, b) => (a.books?.title ?? "").localeCompare(b.books?.title ?? "", "vi"));

  return (
    <section
      aria-label="Chi tiết đơn hàng"
      data-testid="order-summary"
      className="mt-8 overflow-hidden rounded-menu border border-line-warm bg-surface"
    >
      <div className="flex items-center justify-between gap-3 border-b border-menu-sep p-4 md:px-6">
        <div className="min-w-0 md:flex md:items-baseline md:gap-3">
          <p className="text-body-sm text-ink-600">Mã đơn hàng</p>
          <p className="font-sans text-[1.25rem] font-semibold tracking-[0.08em] text-ink-900 md:text-[1.5rem]">{order.order_code}</p>
        </div>
        <OrderStatusChip status={order.status} />
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="p-4 md:p-6">
          <h2 className="font-serif text-xl font-semibold text-ink-900">Sách trong đơn</h2>
          <ul className="mt-4 space-y-4">
            {items.map((item) => (
              <li key={item.books?.slug ?? item.price_at_purchase} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-start gap-x-3 md:grid-cols-[56px_minmax(0,1fr)_auto]">
                <div className="w-12 md:w-14">
                  {item.books && (
                    <BookCover
                      slug={item.books.slug}
                      title={item.books.title}
                      author={item.books.author}
                      coverImageUrl={item.books.cover_image_url}
                      sizes="56px"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-[1.0625rem] font-semibold leading-snug text-ink-900">{item.books?.title}</p>
                  <p className="mt-0.5 hidden text-meta text-ink-600 md:block">{item.books?.author}</p>
                  <p className="mt-0.5 text-meta text-ink-600">
                    {item.quantity} × {formatVnd(item.price_at_purchase)}
                  </p>
                </div>
                <p className="text-body-sm text-ink-900">{formatVnd(item.quantity * item.price_at_purchase)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-menu-sep p-4 md:border-l md:border-t-0 md:p-6">
          <p className="text-body-sm text-ink-600">Giao tới</p>
          <p className="mt-1 text-body text-ink-900">
            {order.recipient_name} · {order.recipient_phone}
            <br />
            {order.shipping_address}
          </p>
          <p className="mt-5 text-body-sm text-ink-600">Thanh toán</p>
          <p className="mt-1 text-body text-ink-900">{PAYMENT_METHOD_LABELS[order.payment_method]}</p>
          <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-menu-sep pt-4">
            <p className="text-body-sm text-ink-600">Tổng cộng</p>
            <p className="font-serif text-[1.75rem] font-semibold leading-none text-cham-700">{formatVnd(order.total_amount)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

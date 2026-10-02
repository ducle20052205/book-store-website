import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookCover } from "@/components/BookCover";
import { formatVnd } from "@/components/Price";
import { createClient } from "@/lib/supabase/server";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/checkoutRules";

/**
 * /thanh-toan/hoan-tat/[order_code] (đợt 3B, spec FR-3B.26, FR-3B.29): trang xác nhận đơn, bố cục
 * theo docs/mockups/buoc-3/ (xac-nhan-don.png, xac-nhan-don-mobile.png).
 *
 * Chỉ CHỦ ĐƠN xem được: truy vấn lọc theo `user_id` của phiên (ngoài RLS), người khác — kể cả admin,
 * vì admin đọc được mọi đơn qua RLS — nhận 404. Trang KHÔNG thuộc luồng tập trung: không thanh đáy,
 * footer đầy đủ (lib/focusedFlow.ts loại đường dẫn này). Đọc `confirmation_email_sent_at` để nói
 * thật về email: chưa có thì không bao giờ viết "đang gửi" (FR-3B.29).
 */
export const metadata: Metadata = {
  title: "Đã nhận đơn hàng — NA Books",
  robots: { index: false },
};

const ORDER_CODE_PATTERN = /^NA-\d{4}-\d{4,}$/;

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
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

interface OrderRow {
  order_code: string;
  status: string;
  total_amount: number;
  payment_method: PaymentMethod;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  confirmation_email_sent_at: string | null;
  order_items: {
    quantity: number;
    price_at_purchase: number;
    books: { slug: string; title: string; author: string; cover_image_url: string | null } | null;
  }[];
}

async function Confirmation({ params }: { params: PageProps<"/thanh-toan/hoan-tat/[order_code]">["params"] }) {
  const { order_code: rawCode } = await params;
  const orderCode = decodeURIComponent(rawCode);
  if (!ORDER_CODE_PATTERN.test(orderCode)) notFound();

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) notFound();
  const email = typeof claims?.claims?.email === "string" ? claims.claims.email : null;

  const { data } = await supabase
    .from("orders")
    .select(
      "order_code, status, total_amount, payment_method, recipient_name, recipient_phone, shipping_address, confirmation_email_sent_at, order_items(quantity, price_at_purchase, books(slug, title, author, cover_image_url))",
    )
    .eq("order_code", orderCode)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) notFound();

  const order = data as unknown as OrderRow;
  const items = [...order.order_items].sort((a, b) => (a.books?.title ?? "").localeCompare(b.books?.title ?? "", "vi"));
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

      <section aria-label="Chi tiết đơn hàng" className="mt-8 overflow-hidden rounded-menu border border-line-warm bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-menu-sep p-4 md:px-6">
          <div className="min-w-0 md:flex md:items-baseline md:gap-3">
            <p className="text-body-sm text-ink-600">Mã đơn hàng</p>
            <p className="font-sans text-[1.25rem] font-semibold tracking-[0.08em] text-ink-900 md:text-[1.5rem]">{order.order_code}</p>
          </div>
          <span className="shrink-0 rounded-field border border-cham-700 bg-cham-active px-3 py-1 text-body-sm font-medium text-cham-700">
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
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

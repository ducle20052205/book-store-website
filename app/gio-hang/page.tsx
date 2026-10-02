import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BookCover } from "@/components/BookCover";
import { CartLineControls } from "@/components/cart/CartLineControls";
import { RepairCartCookie } from "@/components/cart/RepairCartCookie";
import { formatVnd, Price } from "@/components/Price";
import { StockLabel } from "@/components/StockLabel";
import { MAX_LINE_QUANTITY } from "@/lib/cart/cookie";
import { overStockMessage } from "@/lib/cart/messages";
import { type CartView, getCartView } from "@/lib/cart/view";
import { getBookCollectionRefMap, getCategoryCounts, getCategoryNameMap, getCollections } from "@/lib/queries";

/**
 * /gio-hang (đợt 3A, spec FR-3A.7): thay trang tạm của 2B.1. Bố cục theo
 * docs/mockups/buoc-3/ (gio-hang.png, gio-hang-trong.png, gio-hang-mobile.png), mọi
 * thành phần theo he-layout-dong-bang.png: container 1200px, một kiểu thẻ (nền
 * trắng, viền 1px, bo 4px), danh sách nhiều dòng là MỘT mặt phẳng ngăn bằng kẻ
 * 1px, nút cao 48px, ô nhập 44px, một kiểu tiêu đề trang, một kiểu trạng thái trống.
 *
 * Đọc giỏ cần cookie nên nội dung nằm sau <Suspense>; tiêu đề trang nằm trong shell.
 */
export const metadata: Metadata = {
  title: "Giỏ hàng — NA Books",
  robots: { index: false },
};

const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";
const cardClass = "rounded-menu border border-line-warm bg-surface";
const primaryButtonClass =
  "pressable inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-field bg-cham-700 px-6 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-field disabled:text-ink-400 disabled:hover:bg-field";
const secondaryButtonClass =
  "pressable inline-flex h-12 items-center justify-center whitespace-nowrap rounded-field border border-cham-700 bg-surface px-6 text-button font-medium text-cham-700 hover:bg-cham-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2";

function PageTitle({ count }: { count?: number }) {
  return (
    <div className="section-title">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="font-serif text-h1 text-ink-900">Giỏ hàng</h1>
        {count !== undefined && <p className="text-body-sm text-ink-600">{count} cuốn</p>}
      </div>
    </div>
  );
}

export default function GioHangPage() {
  return (
    <div className={containerClass}>
      <Suspense
        fallback={
          <>
            <PageTitle />
            <div aria-busy="true" className={`${cardClass} mt-6 min-h-48`} />
          </>
        }
      >
        <CartContent />
      </Suspense>
    </div>
  );
}

async function CartContent() {
  const view = await getCartView();
  const repair = view.needsRepair ? <RepairCartCookie /> : null;

  if (view.lines.length === 0) {
    return (
      <>
        {repair}
        <PageTitle />
        <EmptyCart />
      </>
    );
  }

  const [categoryNames, collectionRefs] = await Promise.all([getCategoryNameMap(), getBookCollectionRefMap()]);

  return (
    <>
      {repair}
      <PageTitle count={view.totalQuantity} />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-10">
        <ul className={`${cardClass} divide-y divide-menu-sep`}>
          {view.lines.map((line) => {
            const { book } = line;
            const categoryName = categoryNames.get(book.categoryId);
            const collection = collectionRefs.get(book.slug);
            return (
              <li
                key={book.id}
                data-book-id={book.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-6 md:p-6"
              >
                <Link
                  href={`/sach/${book.slug}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="row-span-2 block w-14 md:row-span-1 md:w-[84px]"
                >
                  <BookCover
                    slug={book.slug}
                    title={book.title}
                    author={book.author}
                    coverImageUrl={book.coverImageUrl}
                    sizes="84px"
                  />
                </Link>

                <div className="min-w-0">
                  {(categoryName || collection) && (
                    <p className="text-meta text-ink-400">
                      {categoryName}
                      {categoryName && collection && " · "}
                      {collection && <span>Trong tủ sách</span>}
                    </p>
                  )}
                  <h2 className="mt-0.5 font-serif text-[1.1875rem] font-semibold leading-snug text-ink-900">
                    <Link href={`/sach/${book.slug}`} className="hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600">
                      {book.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-body-sm text-ink-600">{book.author}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                    {line.outOfStock ? <StockLabel stockQuantity={0} /> : <Price price={book.price} discountPrice={book.discountPrice} hideBadge className="text-card-price" />}
                  </div>
                </div>

                <div className="col-start-2 md:col-start-3 md:row-start-1 md:text-right">
                  <div className="hidden md:mb-3 md:flex md:justify-end">
                    {line.outOfStock ? <StockLabel stockQuantity={0} /> : <Price price={book.price} discountPrice={book.discountPrice} hideBadge className="text-card-price md:justify-end" />}
                  </div>
                  <CartLineControls
                    bookId={book.id}
                    title={book.title}
                    quantity={line.displayQuantity}
                    maxQuantity={Math.min(book.stockQuantity, MAX_LINE_QUANTITY)}
                    outOfStock={line.outOfStock}
                    serverNotice={line.overStock ? overStockMessage(book.stockQuantity) : undefined}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <aside aria-label="Tóm tắt đơn hàng" className="hidden lg:sticky lg:top-24 lg:block">
          <div className={`${cardClass} p-6`}>
            <h2 className="font-serif text-xl font-semibold text-ink-900">Tóm tắt đơn hàng</h2>
            <SummaryRows view={view} />
            <div className="mt-5">
              <CheckoutAction view={view} />
            </div>
            <p className="mt-4 text-meta text-ink-600">
              Đây là dự án portfolio: không có cổng thanh toán thật và không có đơn hàng nào được giao.
            </p>
          </div>
        </aside>
      </div>

      <p className="mt-6">
        <Link href="/sach" className="text-body-sm text-cham-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600">
          Tiếp tục xem sách
        </Link>
      </p>

      {/* Mobile và tablet: thanh tổng dính đáy, nằm trong luồng trang nên không che footer. */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-line-warm bg-surface px-4 py-3 md:-mx-6 md:px-6 lg:hidden">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="text-body-sm text-ink-600">Tổng cộng · miễn phí giao hàng</p>
          <p className="font-serif text-xl font-semibold text-cham-700">{formatVnd(view.subtotal)}</p>
        </div>
        <CheckoutAction view={view} />
      </div>
    </>
  );
}

function SummaryRows({ view }: { view: CartView }) {
  return (
    <>
      <dl className="mt-4 space-y-2 text-body-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-600">Tạm tính</dt>
          <dd className="text-ink-900">{formatVnd(view.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-600">Phí vận chuyển</dt>
          <dd className="font-medium text-success">Miễn phí</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-menu-sep pt-4">
        <p className="text-body-sm text-ink-600">Tổng cộng</p>
        <p className="font-serif text-[1.75rem] font-semibold leading-none text-cham-700">{formatVnd(view.subtotal)}</p>
      </div>
    </>
  );
}

/** Sách hết hàng trong giỏ thì chặn đi tiếp sang thanh toán (FR-3A.9). */
function CheckoutAction({ view }: { view: CartView }) {
  if (view.hasOutOfStock) {
    return (
      <>
        <button type="button" disabled className={primaryButtonClass}>
          Thanh toán
        </button>
        <p role="status" className="mt-2 text-meta text-ink-600">
          Trong giỏ có sách đã hết hàng. Bạn xóa khỏi giỏ để tiếp tục thanh toán nhé.
        </p>
      </>
    );
  }
  return (
    <Link href="/thanh-toan" prefetch={false} className={primaryButtonClass}>
      Thanh toán
    </Link>
  );
}

async function EmptyCart() {
  const [counts, collections] = await Promise.all([getCategoryCounts(), getCollections()]);
  const bookTotal = counts.reduce((sum, category) => sum + category.bookCount, 0);

  return (
    <div className={`${cardClass} mt-6 px-6 py-14 text-center md:py-20`}>
      <svg
        viewBox="0 0 76 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mx-auto h-14 w-[76px] text-cham-700"
      >
        <path d="M4 6h30a4 4 0 0 1 4 4v42a6 6 0 0 0-6-6H4V6z" />
        <path d="M72 6H42a4 4 0 0 0-4 4v42a6 6 0 0 1 6-6h28V6z" />
        <path d="M12 16h16M12 24h16M48 16h16M48 24h16" strokeWidth="1.2" />
      </svg>
      <h2 className="mt-6 font-serif text-2xl font-semibold text-ink-900">Giỏ hàng của bạn đang trống</h2>
      <p className="mx-auto mt-3 max-w-[460px] text-body text-ink-600">
        Chúng mình có {bookTotal} cuốn đang chờ bạn ghé qua. Nếu chưa biết bắt đầu từ đâu, {collections.length} tủ sách
        tuyển chọn là chỗ dễ vào nhất — mỗi cuốn trong đó đều kèm lý do chúng mình chọn nó.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/sach" className={`${primaryButtonClass} !w-auto`}>
          Xem tất cả sách
        </Link>
        <Link href="/tu-sach" className={secondaryButtonClass}>
          Khám phá tủ sách
        </Link>
      </div>
    </div>
  );
}

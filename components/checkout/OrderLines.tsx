import { BookCover } from "@/components/BookCover";
import { formatVnd } from "@/components/Price";

export interface OrderLine {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/**
 * Danh sách cuốn trong đơn (cột tóm tắt ở /thanh-toan và hàng gập trên mobile; mockup
 * docs/mockups/buoc-3/checkout.png, checkout-mobile.png): bìa nhỏ, tên sách, "số lượng × đơn
 * giá", thành tiền. Dùng cho cả hai nơi để hai bản không lệch nhau.
 */
export function OrderLines({ lines }: { lines: OrderLine[] }) {
  return (
    <ul className="space-y-4">
      {lines.map((line) => (
        <li key={line.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-start gap-x-3">
          <div className="w-12">
            <BookCover slug={line.slug} title={line.title} author={line.author} coverImageUrl={line.coverImageUrl} sizes="48px" />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-[1.0625rem] font-semibold leading-snug text-ink-900">{line.title}</p>
            <p className="mt-0.5 text-meta text-ink-600">
              {line.quantity} × {formatVnd(line.unitPrice)}
            </p>
          </div>
          <p className="text-body-sm text-ink-900">{formatVnd(line.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

/** Tạm tính, phí giao hàng (miễn phí — không có cột phí, spec FR-3B.15) và tổng cộng. */
export function OrderTotals({ total }: { total: number }) {
  return (
    <>
      <dl className="mt-4 space-y-2 text-body-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-600">Tạm tính</dt>
          <dd className="text-ink-900">{formatVnd(total)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-600">Phí giao hàng</dt>
          <dd className="font-medium text-success">Miễn phí</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-menu-sep pt-4">
        <p className="text-body-sm text-ink-600">Tổng cộng</p>
        <p className="font-serif text-[1.75rem] font-semibold leading-none text-cham-700">{formatVnd(total)}</p>
      </div>
    </>
  );
}

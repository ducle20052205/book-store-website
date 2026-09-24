interface PriceProps {
  price: number;
  discountPrice?: number | null;
  className?: string;
  /** B.3: BookCard chuyển badge -X% lên góc bìa, không hiện cạnh giá nữa. */
  hideBadge?: boolean;
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function getPercentOff(price: number, discountPrice: number): number {
  return Math.round(((price - discountPrice) / price) * 100);
}

/**
 * Quy tắc màu theo mục 1.2 của spec brand: có discount_price thì giá thực tế
 * màu `sale`, giá gốc `ink-400` gạch ngang, kèm badge -X% (nền nghe-400, chữ
 * ink-900 — không bao giờ dùng nghe-400 làm màu chữ trên nền sáng).
 */
export function Price({ price, discountPrice, className, hideBadge = false }: PriceProps) {
  const hasDiscount = discountPrice != null && discountPrice < price;

  if (!hasDiscount) {
    return (
      <span className={`font-medium text-ink-900 ${className ?? ""}`}>
        {currencyFormatter.format(price)}
      </span>
    );
  }

  const percentOff = getPercentOff(price, discountPrice);

  return (
    <span className={`flex flex-wrap items-baseline gap-2 ${className ?? ""}`}>
      <span className="font-medium text-sale">
        {currencyFormatter.format(discountPrice)}
      </span>
      <span className="text-meta text-ink-400 line-through">
        {currencyFormatter.format(price)}
      </span>
      {!hideBadge && (
        <span className="rounded-pill bg-nghe-400 px-2 py-0.5 text-micro font-semibold text-ink-900">
          -{percentOff}%
        </span>
      )}
    </span>
  );
}

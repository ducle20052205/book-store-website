interface StockLabelProps {
  stockQuantity: number;
  className?: string;
}

export function StockLabel({ stockQuantity, className }: StockLabelProps) {
  if (stockQuantity > 0) return null;

  return (
    <span
      className={`inline-flex items-center rounded-pill border border-line bg-surface px-2.5 py-0.5 text-micro font-medium text-ink-900 ${className ?? ""}`}
    >
      Hết hàng
    </span>
  );
}

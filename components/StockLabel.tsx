interface StockLabelProps {
  stockQuantity: number;
  className?: string;
}

export function StockLabel({ stockQuantity, className }: StockLabelProps) {
  if (stockQuantity > 0) return null;

  return (
    <span
      className={`inline-flex items-center rounded-control border border-line bg-surface px-2 py-0.5 text-xs font-medium text-ink-900 ${className ?? ""}`}
    >
      Hết hàng
    </span>
  );
}

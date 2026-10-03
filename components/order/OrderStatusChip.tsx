import { orderStatusLabel } from "@/lib/orderStatus";

/**
 * Chip trạng thái đơn (đợt 4, spec FR-B4.5). MỘT kiểu cho cả năm trạng thái — đúng hiện trạng ở trang xác
 * nhận — nên trạng thái được phân biệt bằng CHỮ, không bằng màu (NFR-6.5); không thêm token màu mới.
 */
export function OrderStatusChip({ status }: { status: string }) {
  return (
    <span
      data-testid="order-status-chip"
      className="shrink-0 rounded-field border border-cham-700 bg-cham-active px-3 py-1 text-body-sm font-medium text-cham-700"
    >
      {orderStatusLabel(status)}
    </span>
  );
}

/**
 * Năm trạng thái của đơn hàng (đợt 4, spec FR-B4.5) — đúng năm giá trị của CHECK `orders_status_check`
 * trên database. Nhãn tiếng Việt dùng chung cho chip ở danh sách, trang chi tiết và trang xác nhận.
 */
export const ORDER_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

/** Nhãn của một trạng thái; giá trị ngoài năm giá trị trên (không thể có nhờ CHECK) hiện nguyên văn. */
export function orderStatusLabel(status: string): string {
  return (ORDER_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

/**
 * Sáu chuyển trạng thái hợp lệ (đợt 5A, spec FR-5A.5): `pending → processing → shipped → completed`, và
 * `→ cancelled` từ bất kỳ trạng thái nào TRƯỚC `completed`. `completed` và `cancelled` là trạng thái cuối.
 * MỘT nguồn cho giao diện (chỉ mời người dùng làm điều hợp lệ) và Server Action; BÊN QUYẾT ĐỊNH là trigger
 * `orders_status_guard` ở database (migration 20261003063859) — bảng này không thay thế nó.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

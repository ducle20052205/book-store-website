/** Mã đơn `NA-YYYY-NNNN` (FR-3B.22): năm 4 chữ số rồi số thứ tự từ 4 chữ số. */
export const ORDER_CODE_PATTERN = /^NA-\d{4}-\d{4,}$/;

export function isOrderCode(value: unknown): value is string {
  return typeof value === "string" && ORDER_CODE_PATTERN.test(value);
}

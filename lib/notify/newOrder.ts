/**
 * Thông báo cho CỬA HÀNG khi có đơn mới (đợt 3B, spec FR-3B.30) — đúng MỘT hàm, gọi trong
 * `after()` của Next sau khi khách đã được trả lời. POST tới `MAKE_WEBHOOK_URL`, header
 * `X-NA-Token: <MAKE_WEBHOOK_TOKEN>`, hết thời gian chờ sau 3 giây.
 *
 * `MAKE_WEBHOOK_URL` chưa đặt → no-op IM LẶNG (không log lỗi). Hỏng (HTTP lỗi, treo, mạng)
 * không bao giờ ảnh hưởng khách hay đơn hàng: hàm không ném lỗi, chỉ ghi `order_code` + mã
 * lỗi, KHÔNG ghi thân request (có tên, email, SĐT, địa chỉ). Đợt 3B không dựng scenario Make
 * nào; payload không có `admin_url` (trang admin chưa có — spec FR-3B.30). Token tĩnh trong
 * header yếu hơn HMAC, chấp nhận vì URL vốn đã là bí mật và dữ liệu không có giá trị tấn công.
 *
 * Self-contained (không import gì) để script Node chạy được trực tiếp.
 */

export const MAKE_TIMEOUT_MS = 3000;

export interface NewOrderPayload {
  order_code: string;
  placed_at: string;
  customer: { name: string; email: string | null; phone: string };
  shipping_address: string;
  payment_method: "cod" | "bank_transfer";
  total_amount: number;
  items: { title: string; author: string; quantity: number; unit_price: number; line_total: number }[];
}

export async function notifyNewOrder(
  payload: NewOrderPayload,
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  const url = (env.MAKE_WEBHOOK_URL ?? "").trim();
  if (url === "") return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-NA-Token": env.MAKE_WEBHOOK_TOKEN ?? "" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(MAKE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("[notify] webhook cửa hàng trả lỗi:", payload.order_code, response.status);
    }
  } catch (error) {
    const name = error instanceof Error ? error.name : "lỗi không rõ";
    console.error("[notify] gọi webhook cửa hàng thất bại:", payload.order_code, name);
  }
}

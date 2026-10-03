import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/checkoutRules";
import { isOrderCode } from "@/lib/orders/orderCode";

/**
 * Đọc MỘT đơn của người đang đăng nhập (đợt 4, spec FR-B4.2). Dùng chung cho `/thanh-toan/hoan-tat/[order_code]`
 * và `/tai-khoan/don-hang/[order_code]`: bộ lọc theo chủ đơn nằm đúng một chỗ.
 *
 * Lọc TƯỜNG MINH `.eq("user_id", userId)` ngoài RLS: admin đọc được mọi đơn qua policy
 * `orders_select_own_or_admin`, nên chính bộ lọc này là thứ giữ cho admin chỉ thấy đơn của mình, và là
 * hàng rào thật cho "người khác nhận 404". Trả `null` cho mọi trường hợp không xem được — mã sai định
 * dạng, chưa đăng nhập, đơn của người khác, đơn không tồn tại — để nơi gọi `notFound()` với cùng một
 * kết quả: không ai phân biệt được "đơn của người khác" với "không có đơn này".
 *
 * Phải gọi bên trong `<Suspense>` (đọc cookie phiên).
 */
export interface OwnOrder {
  order_code: string;
  status: string;
  total_amount: number;
  payment_method: PaymentMethod;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  created_at: string | null;
  confirmation_email_sent_at: string | null;
  order_items: {
    quantity: number;
    price_at_purchase: number;
    books: { slug: string; title: string; author: string; cover_image_url: string | null } | null;
  }[];
}

const ORDER_SELECT =
  "order_code, status, total_amount, payment_method, recipient_name, recipient_phone, shipping_address, created_at, confirmation_email_sent_at, order_items(quantity, price_at_purchase, books(slug, title, author, cover_image_url))";

export async function getOwnOrder(rawCode: string): Promise<{ order: OwnOrder; email: string | null } | null> {
  let orderCode: string;
  try {
    orderCode = decodeURIComponent(rawCode);
  } catch {
    // Phòng thủ: dãy %XX hỏng không phải mã đơn nào. Ở bản Next hiện tại các URL như vậy (và cả `%25`) cho
    // HTTP 500 ở MỌI route động của app, kể cả /sach/[slug], trước khi tới đây (đo 03/10/2026) — nên nhánh
    // này chưa chạm tới được; giữ để một thay đổi của framework không biến nó thành lỗi 500 của riêng ta.
    return null;
  }
  if (!isOrderCode(orderCode)) return null;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return null;
  const email = typeof claims?.claims?.email === "string" ? claims.claims.email : null;

  const { data } = await supabase.from("orders").select(ORDER_SELECT).eq("order_code", orderCode).eq("user_id", userId).maybeSingle();
  if (!data) return null;
  return { order: data as unknown as OwnOrder, email };
}

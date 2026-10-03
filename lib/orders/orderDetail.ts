import type { PaymentMethod } from "@/lib/checkoutRules";

/**
 * Hình dạng của MỘT đơn kèm dòng hàng — dữ liệu mà `OrderSummary` hiển thị. Không gắn với "của tôi": dùng
 * cho cả trang của khách (`getOwnOrder`) lẫn trang quản trị (`getAdminOrder`, đợt 5A spec FR-5A.2). Trước
 * đây là `OwnOrder` ở `getOwnOrder.ts`; đổi tên và chuyển ra đây, không đổi trường nào.
 */
export interface OrderDetail {
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

export const ORDER_DETAIL_SELECT =
  "order_code, status, total_amount, payment_method, recipient_name, recipient_phone, shipping_address, created_at, confirmation_email_sent_at, order_items(quantity, price_at_purchase, books(slug, title, author, cover_image_url))";

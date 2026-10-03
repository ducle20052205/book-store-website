"use server";

import { refresh } from "next/cache";
import { checkAdmin } from "@/lib/admin/requireAdmin";
import { isOrderStatus } from "@/lib/orderStatus";
import { isOrderCode } from "@/lib/orders/orderCode";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action đổi trạng thái đơn của admin (đợt 5A, spec FR-5A.5).
 *
 * - `checkAdmin()` TRƯỚC HẾT (Server Action là điểm vào riêng, không thừa hưởng việc kiểm của page — spec
 *   FR-5A.1). Kết quả có kiểu thay vì `redirect()`: giao diện hiện dải báo, như `cancelOrder` của đợt 4.
 * - Dùng client của PHIÊN admin (RLS `orders_admin_update`), không dùng khoá secret.
 * - Không kiểm "chuyển này có hợp lệ không" ở đây: DATABASE là bên quyết định (trigger `orders_status_guard`,
 *   FR-5A.6, áp cho mọi vai trò); `ORDER_TRANSITIONS` chỉ để giao diện không mời làm điều sẽ bị từ chối.
 *   Lỗi `CHUYEN_TRANG_THAI_KHONG_HOP_LE` của trigger được dịch thành `invalid_transition`.
 * - `.eq("status", from)` là KHOÁ LẠC QUAN: nếu đơn đã đổi giữa lúc xem và lúc bấm thì cập nhật 0 dòng và kết
 *   quả báo trạng thái thật (`stale`) thay vì đè lên.
 * - `refresh()` chạy ở mọi nhánh đã chạm tới database (thành công lẫn lỗi) để chip hiện trạng thái thật ngay
 *   trong response của action (tiền lệ `app/actions/cart.ts`, `cancelOrder`). Không `redirect()`, không
 *   `track()`, không gửi email.
 *
 * Log: chỉ `order_code` và mã lỗi, không bao giờ ghi gì khác.
 */
export type UpdateOrderStatusResult =
  | { ok: true; to: string }
  | { ok: false; kind: "stale"; status: string }
  | { ok: false; kind: "already"; status: string }
  | { ok: false; kind: "invalid_transition" }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "signed_out" }
  | { ok: false; kind: "forbidden" }
  | { ok: false; kind: "unknown" };

export async function updateOrderStatus(orderCode: string, from: string, to: string): Promise<UpdateOrderStatusResult> {
  const admin = await checkAdmin();
  if (!admin.ok) return { ok: false, kind: admin.reason === "signed_out" ? "signed_out" : "forbidden" };

  if (!isOrderCode(orderCode)) return { ok: false, kind: "not_found" };
  if (!isOrderStatus(from) || !isOrderStatus(to)) return { ok: false, kind: "invalid_transition" };

  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").update({ status: to }).eq("order_code", orderCode).eq("status", from).select("status");
  refresh();

  if (error) {
    if (error.message === "CHUYEN_TRANG_THAI_KHONG_HOP_LE") return { ok: false, kind: "invalid_transition" };
    console.error(`[updateOrderStatus] ${orderCode} ${error.code ?? "?"} ${error.message}`);
    return { ok: false, kind: "unknown" };
  }
  if (data && data.length === 1) return { ok: true, to };

  // 0 dòng: đơn không còn ở `from` (hoặc không tồn tại). Đọc lại trạng thái thật để báo đúng.
  const { data: current, error: readError } = await supabase.from("orders").select("status").eq("order_code", orderCode).maybeSingle();
  if (readError) {
    console.error(`[updateOrderStatus] ${orderCode} ${readError.code ?? "?"} ${readError.message}`);
    return { ok: false, kind: "unknown" };
  }
  if (!current) return { ok: false, kind: "not_found" };
  if (current.status === to) return { ok: false, kind: "already", status: to };
  return { ok: false, kind: "stale", status: current.status as string };
}

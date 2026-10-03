"use server";

import { refresh } from "next/cache";
import { isOrderCode } from "@/lib/orders/orderCode";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action hủy đơn (đợt 4, spec FR-B4.3, FR-B4.4). Toàn bộ việc hủy và cộng trả kho nằm trong MỘT hàm
 * Postgres `cancel_order` (một giao dịch, khoá dòng đơn, kiểm quyền sở hữu); action chỉ gọi RPC bằng phiên
 * của người dùng rồi dịch mã lỗi sang kết quả mà giao diện hiểu. Không `redirect()`, không `track()` (chưa có
 * sự kiện `order_cancelled`: spec đợt 4 mục 0), không gửi email.
 *
 * `refresh()` chạy ở MỌI nhánh (thành công lẫn lỗi) để chip trạng thái và nút hủy hiện trạng thái thật ngay
 * trong response của action — tiền lệ ở app/actions/cart.ts.
 *
 * Log: chỉ `order_code` và mã lỗi, không bao giờ ghi gì khác.
 */
export type CancelOrderResult =
  | { ok: true }
  | { ok: false; kind: "already_cancelled" }
  | { ok: false; kind: "not_pending"; status: string }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "signed_out" }
  | { ok: false; kind: "unknown" };

export async function cancelOrder(orderCode: string): Promise<CancelOrderResult> {
  if (!isOrderCode(orderCode)) return { ok: false, kind: "not_found" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", { p_order_code: orderCode });
  refresh();
  if (!error) return { ok: true };

  switch (error.message) {
    case "DON_KHONG_HUY_DUOC": {
      const status = typeof error.details === "string" ? error.details : "";
      if (status === "cancelled") return { ok: false, kind: "already_cancelled" };
      return { ok: false, kind: "not_pending", status };
    }
    case "DON_KHONG_TON_TAI":
      return { ok: false, kind: "not_found" };
    case "KHONG_DANG_NHAP":
      return { ok: false, kind: "signed_out" };
    default:
      console.error(`[cancel_order] ${orderCode} ${error.code ?? "?"} ${error.message}`);
      return { ok: false, kind: "unknown" };
  }
}

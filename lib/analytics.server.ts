import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventType } from "@/lib/analytics";
import { getOrCreateSessionId } from "@/lib/sessionId.server";

/**
 * Ghi 1 dòng vào bảng `events` từ Server Action (đợt 3A, spec FR-3A.6, FR-3A.14):
 * dành cho `sign_up` và `login`, chạy trước `redirect()` nên không còn lời gọi nào
 * ở client. Không bao giờ ném lỗi (một sự kiện không ghi được không được chặn việc
 * đăng nhập). `session_id` lấy từ cookie `na_sid` (tạo ở đây nếu chưa có) — cùng
 * nguồn với `track()` ở client. Không đưa dữ liệu cá nhân vào `metadata` (FR-8.5).
 *
 * `supabase` phải là client đã gắn phiên vừa tạo, để RLS cho phép `user_id = auth.uid()`.
 */
export async function trackServer(
  supabase: SupabaseClient,
  eventType: EventType,
  metadata: Record<string, unknown>,
  userId: string | null,
): Promise<void> {
  try {
    const { error } = await supabase.from("events").insert({
      event_type: eventType,
      metadata,
      session_id: await getOrCreateSessionId(),
      user_id: userId,
    });
    if (error) console.error("[analytics] ghi sự kiện từ server thất bại:", error.code ?? "không có mã", "-", error.message);
  } catch (error) {
    console.error("[analytics] ghi sự kiện từ server thất bại:", error instanceof Error ? error.message : "lỗi không rõ");
  }
}

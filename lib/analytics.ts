import { supabase } from "@/lib/supabase";

const SESSION_ID_KEY = "na_sid";

function getSessionId(): string | null {
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return null;
  }
}

export type EventType = "page_view" | "search" | "add_to_cart" | "checkout_started" | "order_placed";

/**
 * 1c.3: ghi 1 dòng vào bảng `events`, fire-and-forget — không bao giờ throw,
 * không await trong luồng giao diện. Lỗi chỉ log ở dev. Không đưa dữ liệu cá
 * nhân (email, tên, địa chỉ, số điện thoại) vào metadata.
 */
export function track(eventType: EventType, metadata: Record<string, unknown> = {}): void {
  void (async () => {
    try {
      const sessionId = getSessionId();
      const { data } = await supabase.auth.getSession();

      const { error } = await supabase.from("events").insert({
        event_type: eventType,
        metadata,
        session_id: sessionId,
        user_id: data.session?.user?.id ?? null,
      });

      if (error && process.env.NODE_ENV === "development") {
        console.warn("[analytics] track thất bại:", error.message);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[analytics] track thất bại:", error);
      }
    }
  })();
}

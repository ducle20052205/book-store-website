import { isSessionId, SESSION_COOKIE, SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/sessionId";
import { createClient } from "@/lib/supabase/client";

/**
 * `session_id` đọc từ cookie `na_sid` (spec FR-3A.14, trước đây là `localStorage`);
 * chưa có thì tự sinh UUID và ghi bằng document.cookie. Cookie KHÔNG httpOnly nên
 * đọc được ở đây; Server Action ghi sự kiện dùng cùng cookie (lib/sessionId.server.ts).
 * Không đặt ở proxy.ts: xem lý do ở lib/sessionId.ts.
 */
function getSessionId(): string | null {
  try {
    const match = document.cookie.split("; ").find((part) => part.startsWith(`${SESSION_COOKIE}=`));
    const existing = match?.slice(SESSION_COOKIE.length + 1);
    if (isSessionId(existing)) return existing;

    const sessionId = crypto.randomUUID();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SESSION_COOKIE}=${sessionId}; Max-Age=${SESSION_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
    return sessionId;
  } catch {
    return null;
  }
}

export type EventType =
  | "page_view"
  | "search"
  | "add_to_cart"
  | "checkout_started"
  | "order_placed"
  | "sign_up"
  | "login";

/**
 * 1c.3: ghi 1 dòng vào bảng `events`, fire-and-forget — không bao giờ throw,
 * không await trong luồng giao diện. Lỗi chỉ log ở dev. Không đưa dữ liệu cá
 * nhân (email, tên, địa chỉ, số điện thoại) vào metadata.
 */
export function track(eventType: EventType, metadata: Record<string, unknown> = {}): void {
  void (async () => {
    try {
      const supabase = createClient();
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

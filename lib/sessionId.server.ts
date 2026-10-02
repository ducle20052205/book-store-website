import { cookies, headers } from "next/headers";
import { isSessionId, SESSION_COOKIE, SESSION_COOKIE_MAX_AGE_SECONDS } from "@/lib/sessionId";

/**
 * Lấy `session_id` từ cookie `na_sid`; chưa có (hoặc sai định dạng) thì sinh UUID
 * v4 mới và ghi vào response. CHỈ gọi trong Server Action hoặc Route Handler —
 * Server Component không ghi được cookie (spec FR-3A.14).
 *
 * `Secure` khi không phải localhost, cùng luật với cookie giỏ hàng.
 */
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (isSessionId(existing)) return existing;

  const id = crypto.randomUUID();
  const host = (await headers()).get("host") ?? "";
  const hostname = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";

  store.set(SESSION_COOKIE, id, {
    httpOnly: false,
    secure: !isLocal,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });
  return id;
}

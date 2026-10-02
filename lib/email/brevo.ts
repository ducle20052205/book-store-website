/**
 * Gửi email giao dịch qua HTTP API của Brevo (đợt 3B, spec FR-3B.27) — không qua SMTP
 * (kết nối dài, chậm, thường bị chặn trong môi trường serverless) và không qua Make.com.
 *
 * Đã đối chiếu tài liệu Brevo ngày 02/10/2026 (đường dẫn ở spec mục 10):
 *   POST https://api.brevo.com/v3/smtp/email
 *   header `api-key`, `Content-Type: application/json`, `Accept: application/json`
 *   thân { sender: {email, name?}, to: [{email}], subject, htmlContent, textContent? }
 *   thành công 201 + { messageId }; lỗi 400 + { code, message }.
 *
 * Không bao giờ ném lỗi và không bao giờ ghi thân request / thân phản hồi vào log (có email,
 * tên, SĐT, địa chỉ): chỉ trả mã trạng thái để nơi gọi ghi `order_code` + mã lỗi.
 *
 * Self-contained (không import gì) để script Node chạy được trực tiếp.
 */

export const BREVO_DEFAULT_URL = "https://api.brevo.com/v3/smtp/email";
export const BREVO_TIMEOUT_MS = 4000;
export const BREVO_SENDER_NAME = "NA Books";

export type BrevoResult =
  | { ok: true; status: number; messageId: string | null }
  | { ok: false; reason: "not_configured" | "timeout" | "network" | "http_error"; status?: number; code?: string };

export interface BrevoEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * `BREVO_API_KEY` hoặc `BREVO_SENDER` chưa đặt → `not_configured`, im lặng (spec FR-3B.27).
 * `BREVO_API_URL` chỉ dùng để thử với endpoint giả (scripts/mock-external.mjs); mặc định là
 * địa chỉ thật của Brevo.
 */
export async function sendBrevoEmail(email: BrevoEmail, env: Record<string, string | undefined> = process.env): Promise<BrevoResult> {
  const apiKey = (env.BREVO_API_KEY ?? "").trim();
  const sender = (env.BREVO_SENDER ?? "").trim();
  if (apiKey === "" || sender === "") return { ok: false, reason: "not_configured" };

  const url = (env.BREVO_API_URL ?? "").trim() || BREVO_DEFAULT_URL;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: sender, name: BREVO_SENDER_NAME },
        to: [{ email: email.to }],
        subject: email.subject,
        htmlContent: email.html,
        textContent: email.text,
      }),
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      let code: string | undefined;
      try {
        const body = (await response.json()) as { code?: unknown };
        if (typeof body?.code === "string") code = body.code;
      } catch {
        // Không đọc được thân: chỉ cần mã HTTP.
      }
      return { ok: false, reason: "http_error", status: response.status, code };
    }

    let messageId: string | null = null;
    try {
      const body = (await response.json()) as { messageId?: unknown };
      if (typeof body?.messageId === "string") messageId = body.messageId;
    } catch {
      // 201 không có thân đọc được vẫn là thành công.
    }
    return { ok: true, status: response.status, messageId };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") return { ok: false, reason: "timeout" };
    return { ok: false, reason: "network" };
  }
}

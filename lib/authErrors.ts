/**
 * Phân loại lỗi từ Supabase Auth thành vài loại có câu chữ tiếng Việt riêng
 * (spec 2B mục 10). Giao diện chỉ nhận `AuthErrorKind`, không bao giờ nhận
 * thông báo gốc — nên không có chữ tiếng Anh hay mã lỗi kỹ thuật lọt ra màn hình.
 * Câu chữ hiển thị nằm ở components/AuthErrorMessage.tsx.
 */

export type AuthErrorKind =
  | "invalid_credentials"
  | "user_exists"
  | "rate_limit"
  | "weak_password"
  | "invalid_email"
  | "unknown";

/** Phần của AuthError mà hàm này cần — khai báo cục bộ để không phụ thuộc kiểu nội bộ của thư viện. */
interface AuthErrorLike {
  code?: string;
  status?: number;
  message?: string;
}

/**
 * Nhận diện theo `code` (ổn định) trước, rồi mới tới `status`/`message` cho
 * các phiên bản Auth server cũ chưa trả `code`. Mọi thứ không nhận ra được, kể
 * cả lỗi mạng (status 0 / không có gì), rơi vào "unknown".
 */
export function classifyAuthError(error: AuthErrorLike): AuthErrorKind {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) return "invalid_credentials";
  if (code === "user_already_exists" || code === "email_exists" || message.includes("user already registered")) {
    return "user_exists";
  }
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    code === "over_sms_send_rate_limit" ||
    error.status === 429
  ) {
    return "rate_limit";
  }
  if (code === "weak_password") return "weak_password";
  if (code === "email_address_invalid") return "invalid_email";
  return "unknown";
}

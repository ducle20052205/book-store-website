/**
 * Cờ chào mừng sau khi đăng ký (spec 2B mục 7): trang đích nhận `?chao=1`, hiện
 * dải thông báo rồi tự xoá tham số khỏi URL (components/WelcomeStrip.tsx) để
 * làm mới trang không hiện lại.
 */
export const WELCOME_PARAM = "chao";

/**
 * Cờ "đã đổi mật khẩu" (đợt 8, FR-A.3): sau khi đặt lại mật khẩu xong, trang đích nhận `?mk=1` và hiện dải
 * thông báo bằng đúng cơ chế của dải chào mừng (cùng component, cùng cách tự xoá tham số khỏi URL).
 */
export const PASSWORD_CHANGED_PARAM = "mk";

/** Thêm cờ chào mừng vào một path nội bộ, giữ nguyên query và hash sẵn có. */
export function withWelcomeParam(path: string): string {
  const url = new URL(path, "http://welcome.invalid");
  url.searchParams.set(WELCOME_PARAM, "1");
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Thêm cờ "đã đổi mật khẩu" vào một path nội bộ, giữ nguyên query và hash sẵn có. */
export function withPasswordChangedParam(path: string): string {
  const url = new URL(path, "http://welcome.invalid");
  url.searchParams.set(PASSWORD_CHANGED_PARAM, "1");
  return `${url.pathname}${url.search}${url.hash}`;
}

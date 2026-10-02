/**
 * Server Action gọi `redirect()` thì lời gọi ở client bị từ chối bằng lỗi có
 * `digest` bắt đầu bằng "NEXT_REDIRECT" (next/dist/client/.../server-action-reducer.js),
 * và router tự điều hướng. Form đăng nhập/đăng ký phải nhận ra lỗi đó để không
 * coi là thất bại (đợt 3A: signIn/signUp chuyển sang redirect() trong action).
 */
export function isNextRedirect(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Lớp kiểm quyền THẬT của khu `/admin/**` (đợt 5A, spec FR-5A.1) — lớp truy cập dữ liệu, gọi ở ĐẦU mọi page
 * của khu admin và ở đầu mọi Server Action của khu admin. Không đặt ở `layout`: layout không render lại khi
 * điều hướng và không chặn route con hay Server Action (docs Next, `authentication.md`, "Layouts and auth
 * checks"); Server Action là điểm vào riêng nên phải tự kiểm. `proxy.ts` là lớp 1 (chuyển hướng sớm); đây là
 * lớp 2, chạy cả khi lớp 1 bị bỏ qua (TC-17); lớp 3 là RLS và trigger ở database.
 *
 * `getUser()`, không `getClaims()`: hàng rào bảo vệ phải phát hiện token đã bị thu hồi (file quyết định mục
 * 5.1) — cùng lựa chọn với `proxy.ts`. Rồi đọc `profiles.role` của CHÍNH người đó (RLS
 * `profiles_select_own_or_admin`). Lỗi đọc `profiles` coi như không phải admin (đóng khi nghi ngờ).
 *
 * Phải gọi bên trong `<Suspense>` (đọc cookie phiên).
 */
export type AdminCheck = { ok: true; userId: string } | { ok: false; reason: "signed_out" | "not_admin" };

/** Lõi không chuyển hướng: Server Action dùng trực tiếp để trả kết quả có kiểu thay vì ném `redirect()`. */
export async function checkAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "signed_out" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { ok: false, reason: "not_admin" };
  return { ok: true, userId: user.id };
}

/**
 * Cho page: chưa đăng nhập → `/dang-nhap?next=<đường dẫn hiện tại>`; đã đăng nhập nhưng không phải admin →
 * `/`. `redirect()` trong `<Suspense>` cho mã HTTP 200 (hạn chế đã biết, spec 3B mục 7.1); chuyển hướng 307
 * thật là việc của `proxy.ts`.
 */
export async function requireAdmin(currentPath: string): Promise<string> {
  const check = await checkAdmin();
  if (!check.ok) {
    redirect(check.reason === "signed_out" ? `/dang-nhap?next=${encodeURIComponent(currentPath)}` : "/");
  }
  return check.userId;
}

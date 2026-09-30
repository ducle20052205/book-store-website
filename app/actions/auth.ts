"use server";

import { revalidatePath } from "next/cache";
import { type AuthErrorKind, classifyAuthError } from "@/lib/authErrors";
import { createClient } from "@/lib/supabase/server";

/** Kết quả trả về cho form: chỉ có `kind` (không có thông báo gốc) khi lỗi. */
export type AuthActionResult = { ok: true } | { ok: false; kind: AuthErrorKind };

/**
 * Đăng nhập bằng email + mật khẩu (đợt 2B, spec mục 5). Chạy ở server để lỗi
 * gốc của Supabase được ghi vào log server (spec mục 10) trong khi giao diện
 * chỉ nhận `kind`. Cookie phiên do client server ghi vào response của action.
 *
 * Không ghi email vào log (dữ liệu cá nhân); chỉ ghi mã và thông báo lỗi.
 * Đăng nhập sai mật khẩu và email chưa đăng ký cùng trả `invalid_credentials`
 * (Supabase không phân biệt), nên không dò được email nào có trong hệ thống.
 */
export async function signIn(input: { email: string; password: string }): Promise<AuthActionResult> {
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (!email || !password) return { ok: false, kind: "invalid_credentials" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[auth] đăng nhập thất bại:", error.code ?? error.status ?? "không có mã", "-", error.message);
    return { ok: false, kind: classifyAuthError(error) };
  }

  // Header nằm ở layout gốc và không tự render lại khi điều hướng phía client,
  // nên làm mới toàn bộ cây để mục tài khoản hiện đúng trạng thái đã đăng nhập.
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Đăng xuất (đợt 2A, spec mục 6): gọi signOut() trong Server Action rồi
 * revalidatePath('/'). Chỉ xoá phiên HIỆN TẠI (scope "local") — FR-5.3 quy
 * định "đăng xuất xóa session hiện tại"; mặc định của Supabase là "global"
 * (đăng xuất mọi thiết bị của người dùng), không phải điều spec yêu cầu.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/");
}

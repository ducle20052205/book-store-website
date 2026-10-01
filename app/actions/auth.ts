"use server";

import { type AuthErrorKind, classifyAuthError } from "@/lib/authErrors";
import { FULL_NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/authRules";
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

  // Cố ý KHÔNG gọi revalidatePath. Đổi cookie phiên đã đủ để Next đánh dấu action là
  // đã revalidate (next/dist/server/web/spec-extension/adapters/request-cookies.js dòng
  // 130), nên client tự làm mới; Header đọc cookie lúc request, nằm sau <Suspense>, nên
  // hiện đúng trạng thái. revalidatePath("/", "layout") còn vô hiệu hoá cache dữ liệu
  // của cả site (đo 01/10 trên hosted: `/` từ HIT sang REVALIDATED, chậm ~4 lần) mà
  // không đem lại gì thêm. Spec docs/specs/buoc-2b1-hieu-nang-hosted.md hạng mục 1.
  return { ok: true };
}

/**
 * Đăng ký bằng email + mật khẩu (đợt 2B, spec mục 6, FR-5.1). `full_name` đi qua
 * `options.data.full_name` để trigger `handle_new_user` chép sang `profiles`.
 * Confirm email đang TẮT (docs/runbooks/cau-hinh-supabase-auth.md) nên `signUp`
 * trả session ngay; nếu không có session thì cài đặt đã bị bật lại — ghi rõ
 * vào log để lần sau biết đường tìm, thay vì báo lỗi mơ hồ.
 */
export async function signUp(input: { fullName: string; email: string; password: string }): Promise<AuthActionResult> {
  const fullName = typeof input?.fullName === "string" ? input.fullName.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  const password = typeof input?.password === "string" ? input.password : "";

  if (!fullName || !email || fullName.length > FULL_NAME_MAX_LENGTH) return { ok: false, kind: "unknown" };
  // Kiểm lại ở server dù form đã chặn: form chỉ là tiện lợi, không phải hàng rào.
  if (password.length < PASSWORD_MIN_LENGTH) return { ok: false, kind: "weak_password" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    console.error("[auth] đăng ký thất bại:", error.code ?? error.status ?? "không có mã", "-", error.message);
    return { ok: false, kind: classifyAuthError(error) };
  }
  if (!data.session) {
    console.error(
      "[auth] đăng ký không trả session — Confirm email đang bật? Xem docs/runbooks/cau-hinh-supabase-auth.md",
    );
    return { ok: false, kind: "unknown" };
  }

  // Không revalidatePath, cùng lý do với signIn.
  return { ok: true };
}

/**
 * Đăng xuất (đợt 2A, spec mục 6): gọi signOut() trong Server Action. Chỉ xoá
 * phiên HIỆN TẠI (scope "local") — FR-5.3 quy định "đăng xuất xóa session hiện
 * tại"; mặc định của Supabase là "global" (đăng xuất mọi thiết bị của người
 * dùng), không phải điều spec yêu cầu. Không revalidatePath: cookie bị xoá đã đủ
 * để client làm mới (xem signIn).
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
}

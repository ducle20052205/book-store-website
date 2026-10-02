"use server";

import { redirect } from "next/navigation";
import { trackServer } from "@/lib/analytics.server";
import { type AuthErrorKind, classifyAuthError } from "@/lib/authErrors";
import { FULL_NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/authRules";
import { mergeGuestCart } from "@/lib/cart/mergeGuestCart";
import { safeNextPath } from "@/lib/nextParam";
import { createClient } from "@/lib/supabase/server";
import { withWelcomeParam } from "@/lib/welcome";

/**
 * Kết quả trả về cho form khi thất bại: chỉ có `kind` (không có thông báo gốc).
 * Thành công thì `signIn`/`signUp` KHÔNG trả về mà gọi `redirect()` (đợt 3A).
 */
export type AuthFailure = { ok: false; kind: AuthErrorKind };

/**
 * Việc sau khi đã có phiên (đợt 3A): gộp giỏ của khách (FR-3A.5) rồi ghi `login` /
 * `sign_up` từ server (FR-3A.6). Mỗi bước tự bắt lỗi — thất bại thì ghi log, không
 * ném ra, vì người dùng đã đăng nhập/đăng ký thành công. Không có email trong
 * `metadata` (FR-8.5).
 */
async function finishAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null,
  event: "login" | "sign_up",
): Promise<void> {
  if (userId) {
    try {
      await mergeGuestCart(supabase, userId);
    } catch (error) {
      console.error("[cart] gộp giỏ khách thất bại:", error instanceof Error ? error.message : "lỗi không rõ");
    }
  }
  await trackServer(supabase, event, { method: "password" }, userId);
}

/**
 * Đăng nhập bằng email + mật khẩu (đợt 2B, spec mục 5). Chạy ở server để lỗi
 * gốc của Supabase được ghi vào log server (spec mục 10) trong khi giao diện
 * chỉ nhận `kind`. Cookie phiên do client server ghi vào response của action.
 *
 * Không ghi email vào log (dữ liệu cá nhân); chỉ ghi mã và thông báo lỗi.
 * Đăng nhập sai mật khẩu và email chưa đăng ký cùng trả `invalid_credentials`
 * (Supabase không phân biệt), nên không dò được email nào có trong hệ thống.
 */
export async function signIn(input: { email: string; password: string; next?: string | null }): Promise<AuthFailure> {
  const email = typeof input?.email === "string" ? input.email.trim() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (!email || !password) return { ok: false, kind: "invalid_credentials" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[auth] đăng nhập thất bại:", error.code ?? error.status ?? "không có mã", "-", error.message);
    return { ok: false, kind: classifyAuthError(error) };
  }

  // Có phiên rồi: gộp giỏ khách vào giỏ tài khoản rồi ghi sự kiện, cả hai TRƯỚC redirect()
  // (spec 3A FR-3A.5, FR-3A.6). Lỗi ở hai bước này không được chặn người dùng vào tài khoản.
  await finishAuth(supabase, data.user?.id ?? null, "login");

  // Cố ý KHÔNG gọi revalidatePath. Đổi cookie phiên đã đủ để Next đánh dấu action là
  // đã revalidate (next/dist/server/web/spec-extension/adapters/request-cookies.js dòng
  // 130), nên client tự làm mới; Header đọc cookie lúc request, nằm sau <Suspense>, nên
  // hiện đúng trạng thái. revalidatePath("/", "layout") còn vô hiệu hoá cache dữ liệu
  // của cả site (đo 01/10 trên hosted: `/` từ HIT sang REVALIDATED, chậm ~4 lần) mà
  // không đem lại gì thêm. Spec docs/specs/buoc-2b1-hieu-nang-hosted.md hạng mục 1.
  //
  // redirect() (đợt 3A, FR-3A.5) đặt SAU mọi việc cần cookie/phiên, và nằm ngoài try/catch
  // vì nó ném lỗi để Next điều hướng. `next` được kiểm lại ở server bằng safeNextPath —
  // cùng luật với proxy.ts và trang /dang-nhap; form chỉ gửi giá trị thô của `?next=`.
  redirect(safeNextPath(input?.next));
}

/**
 * Đăng ký bằng email + mật khẩu (đợt 2B, spec mục 6, FR-5.1). `full_name` đi qua
 * `options.data.full_name` để trigger `handle_new_user` chép sang `profiles`.
 * Confirm email đang TẮT (docs/runbooks/cau-hinh-supabase-auth.md) nên `signUp`
 * trả session ngay; nếu không có session thì cài đặt đã bị bật lại — ghi rõ
 * vào log để lần sau biết đường tìm, thay vì báo lỗi mơ hồ.
 */
export async function signUp(input: {
  fullName: string;
  email: string;
  password: string;
  next?: string | null;
}): Promise<AuthFailure> {
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

  // Không revalidatePath, cùng lý do với signIn. Gộp giỏ, ghi sự kiện rồi redirect()
  // theo ?next= (không hợp lệ hoặc không có thì về "/") kèm cờ để trang đích hiện dải chào mừng.
  await finishAuth(supabase, data.user?.id ?? null, "sign_up");
  redirect(withWelcomeParam(safeNextPath(input?.next)));
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

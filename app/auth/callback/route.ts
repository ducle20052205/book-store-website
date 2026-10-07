import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /auth/callback (đợt 8, FR-A.2, SRS FR-5.4): đích của link trong email "đặt lại mật khẩu". Là route handler, không
 * phải trang — nó chỉ đổi `token_hash` lấy phiên rồi chuyển hướng.
 *
 * Dùng `verifyOtp({ type: "recovery", token_hash })`, KHÔNG dùng `{{ .ConfirmationURL }}` và luồng PKCE mặc định:
 * PKCE lưu code verifier ở trình duyệt đã khởi tạo yêu cầu, nên link mở ở trình duyệt hoặc thiết bị khác (tình huống
 * phổ biến nhất của chính tính năng này: bấm "quên mật khẩu" trên máy tính, đọc mail trên điện thoại) sẽ hỏng.
 * `token_hash` tự đủ để xác minh ở bất kỳ nơi nào. Template email ở `supabase/templates/recovery.html`.
 *
 * Cố ý nằm NGOÀI `/tai-khoan` và `/thanh-toan`: proxy.ts bắt đăng nhập ở hai nhánh đó mà người đến từ link mail thì
 * chưa có phiên. Không sửa proxy.ts.
 *
 * Thiếu tham số, sai `type`, hết hạn hay đã dùng rồi → `/quen-mat-khau?loi=het-han` (trang đó hiện lời giải thích và mời
 * gửi lại). Chỉ ghi log mã lỗi, không ghi `token_hash`.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || type !== "recovery") redirect("/quen-mat-khau?loi=het-han");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (error) {
    console.error("[auth] xác minh link đặt lại mật khẩu thất bại:", error.code ?? error.status ?? "không có mã", "-", error.message);
    redirect("/quen-mat-khau?loi=het-han");
  }

  redirect("/dat-lai-mat-khau");
}

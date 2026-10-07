"use server";

import { getSignedInUser } from "@/lib/account/requireUser";
import { type ProfileErrors, validateProfile } from "@/lib/account/profileRules";
import { classifyAuthError } from "@/lib/authErrors";
import { PASSWORD_MIN_LENGTH } from "@/lib/authRules";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

/**
 * Lưu hồ sơ (đợt 8, FR-A.4): họ tên, số điện thoại, địa chỉ ba trường của CHÍNH người đang đăng nhập.
 *
 * Kiểm lại ở server dù form đã chặn (lib/account/profileRules.ts, một bản duy nhất). Ghi bằng client có phiên của
 * người dùng, nên RLS (`profiles` chỉ sửa dòng `id = auth.uid()`) là lớp bảo vệ thật; `.eq("id", user.id)` chỉ để rõ ý.
 *
 * KHÔNG gửi `role` và `email` lên — và có gửi cũng vô ích: trigger `protect_profile_role` âm thầm giữ nguyên hai cột đó
 * (khoá `role` với người không phải Admin, khoá `email` với mọi người). Đổi email nằm ngoài phạm vi (spec mục 6.4).
 * Không ghi email, số điện thoại, địa chỉ vào log (NFR-A.5).
 *
 * Khoá ngoại ghép `(ward_code, province_code)` `MATCH FULL` (FR-5.8) từ chối phường không thuộc tỉnh (mã 23503): báo lỗi
 * ở ô phường/xã thay vì lỗi chung.
 */
export type SaveProfileResult = { ok: true } | { ok: false; errors: ProfileErrors; unknown?: boolean };

export async function saveProfile(input: {
  fullName: string;
  phone: string;
  provinceCode: string;
  wardCode: string;
  addressLine: string;
}): Promise<SaveProfileResult> {
  const user = await getSignedInUser();
  if (!user) return { ok: false, errors: {}, unknown: true };

  const { errors, value } = validateProfile(input);
  if (value === null) return { ok: false, errors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: value.fullName,
      phone: value.phone,
      province_code: value.provinceCode,
      ward_code: value.wardCode,
      address_line: value.addressLine,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[profile] lưu hồ sơ thất bại:", error.code ?? "không có mã");
    if (error.code === "23503") {
      return { ok: false, errors: { wardCode: "Phường/xã này không thuộc tỉnh đã chọn. Bạn chọn lại giúp chúng mình nhé." } };
    }
    return { ok: false, errors: {}, unknown: true };
  }

  // Header đọc tên từ `user_metadata` trong JWT (getClaims): cập nhật luôn để menu Tài khoản hiện tên mới ngay, thay vì
  // đợi lần làm mới token kế tiếp. Chỉ là phần hiển thị nên lỗi ở đây không làm hỏng việc lưu.
  const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name: value.fullName } });
  if (metadataError) console.error("[profile] cập nhật tên hiển thị thất bại:", metadataError.code ?? "không có mã");

  return { ok: true };
}

/**
 * Đổi mật khẩu khi đang đăng nhập (đợt 8, FR-A.5, SRS FR-5.7).
 *
 * XÁC MINH MẬT KHẨU HIỆN TẠI TRƯỚC (`signInWithPassword` với chính email của phiên), rồi mới `updateUser({ password })`.
 * Lý do: không có bước này thì ai mượn được máy đang mở phiên (hoặc chiếm được cookie phiên) là đổi được mật khẩu và
 * chiếm hẳn tài khoản — phiên đang mở chứng minh "đã đăng nhập", không chứng minh "biết mật khẩu". Sai mật khẩu hiện tại
 * thì từ chối và KHÔNG đổi gì.
 *
 * Việc xác minh dùng client công khai không giữ phiên (`createPublicClient`), nên không ghi đè cookie phiên đang có và
 * không sinh phiên thừa. KHÔNG đăng xuất phiên hiện tại sau khi đổi (`signOut` của dự án dùng scope "local", FR-5.3).
 * Không `revalidatePath` (cùng lý do với `signIn`). Không ghi email hay mật khẩu vào log (NFR-A.5).
 */
export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; kind: "wrong_current" | "weak_password" | "same_password" | "rate_limit" | "unknown" };

export async function changePassword(input: { current: string; next: string }): Promise<ChangePasswordResult> {
  const current = typeof input?.current === "string" ? input.current : "";
  const next = typeof input?.next === "string" ? input.next : "";

  const user = await getSignedInUser();
  if (!user?.email) return { ok: false, kind: "unknown" };
  if (current === "") return { ok: false, kind: "wrong_current" };
  // Kiểm lại ở server dù form đã chặn: form chỉ là tiện lợi, không phải hàng rào.
  if (next.length < PASSWORD_MIN_LENGTH) return { ok: false, kind: "weak_password" };
  if (next === current) return { ok: false, kind: "same_password" };

  const verify = await createPublicClient().auth.signInWithPassword({ email: user.email, password: current });
  if (verify.error) {
    const kind = classifyAuthError(verify.error);
    console.error("[profile] xác minh mật khẩu hiện tại thất bại:", verify.error.code ?? verify.error.status ?? "không có mã");
    if (kind === "rate_limit") return { ok: false, kind: "rate_limit" };
    return { ok: false, kind: kind === "invalid_credentials" ? "wrong_current" : "unknown" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    console.error("[profile] đổi mật khẩu thất bại:", error.code ?? error.status ?? "không có mã");
    const kind = classifyAuthError(error);
    return { ok: false, kind: kind === "weak_password" || kind === "same_password" || kind === "rate_limit" ? kind : "unknown" };
  }
  return { ok: true };
}

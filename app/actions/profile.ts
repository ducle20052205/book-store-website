"use server";

import { getSignedInUser } from "@/lib/account/requireUser";
import { type ProfileErrors, validateProfile } from "@/lib/account/profileRules";
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

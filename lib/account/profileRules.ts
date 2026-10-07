import { FULL_NAME_MAX_LENGTH } from "@/lib/authRules";
import {
  ADDRESS_LINE_MAX_LENGTH,
  ADDRESS_LINE_MIN_LENGTH,
  normalizePhone,
  PHONE_PATTERN,
  PROVINCE_CODE_PATTERN,
  WARD_CODE_PATTERN,
} from "@/lib/checkoutRules";

/**
 * Luật kiểm tra form hồ sơ (đợt 8, FR-A.4) dùng chung cho form (components/account/ProfileForm.tsx) và Server
 * Action (app/actions/profile.ts) — MỘT bản duy nhất, như lib/checkoutRules.ts, để hai nơi không lệch nhau. Lớp cuối
 * cùng là CHECK và khoá ngoại ghép `(ward_code, province_code)` `MATCH FULL` của bảng `profiles` ở database (FR-5.8).
 *
 * Dùng lại luật của checkout (số điện thoại, mã tỉnh/phường, độ dài địa chỉ), không viết luật mới. Khác checkout ở hai
 * điểm: số điện thoại là TÙY CHỌN, và ba trường địa chỉ phải CÙNG TRỐNG hoặc CÙNG CÓ GIÁ TRỊ — khoá ngoại `MATCH FULL`
 * chỉ cho hai cột cùng NULL hoặc cùng có giá trị, nên hồ sơ không được lưu nửa vời.
 */

export interface ProfileFields {
  fullName: string;
  phone: string;
  provinceCode: string;
  wardCode: string;
  addressLine: string;
}

export type ProfileField = keyof ProfileFields;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

/** Giá trị đã chuẩn hoá, an toàn để ghi vào `profiles`: ô trống thành `null`. */
export interface ProfileValue {
  fullName: string;
  phone: string | null;
  provinceCode: string | null;
  wardCode: string | null;
  addressLine: string | null;
}

/** Thứ tự các ô trên giao diện — dùng để đưa focus về ô lỗi đầu tiên. */
export const PROFILE_FIELD_ORDER: ProfileField[] = ["fullName", "phone", "provinceCode", "wardCode", "addressLine"];

export const ADDRESS_TRIO_MESSAGE = "Bạn điền đủ ba ô địa chỉ (tỉnh, phường/xã, số nhà và tên đường) hoặc để trống cả ba nhé.";

const text = (value: unknown): string => (typeof value === "string" ? value : "");

export function validateProfile(input: Partial<Record<ProfileField, unknown>>): {
  errors: ProfileErrors;
  value: ProfileValue | null;
} {
  const errors: ProfileErrors = {};

  const fullName = text(input.fullName).trim();
  if (fullName === "") errors.fullName = "Bạn cho chúng mình biết họ tên nhé.";
  else if (fullName.length > FULL_NAME_MAX_LENGTH) errors.fullName = `Họ tên tối đa ${FULL_NAME_MAX_LENGTH} ký tự.`;

  const phone = normalizePhone(text(input.phone));
  if (phone !== "" && !PHONE_PATTERN.test(phone)) {
    errors.phone = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0 (ví dụ 0912 345 678).";
  }

  const provinceCode = text(input.provinceCode).trim();
  const wardCode = text(input.wardCode).trim();
  const addressLine = text(input.addressLine).trim();
  const filled = [provinceCode, wardCode, addressLine].filter((part) => part !== "").length;
  if (filled > 0 && filled < 3) {
    if (provinceCode === "") errors.provinceCode = ADDRESS_TRIO_MESSAGE;
    if (wardCode === "") errors.wardCode = ADDRESS_TRIO_MESSAGE;
    if (addressLine === "") errors.addressLine = ADDRESS_TRIO_MESSAGE;
  }
  if (provinceCode !== "" && !PROVINCE_CODE_PATTERN.test(provinceCode)) {
    errors.provinceCode = "Tỉnh/thành phố này chưa hợp lệ. Bạn chọn lại giúp chúng mình nhé.";
  }
  if (wardCode !== "" && !WARD_CODE_PATTERN.test(wardCode)) {
    errors.wardCode = "Phường/xã này chưa hợp lệ. Bạn chọn lại giúp chúng mình nhé.";
  }
  if (addressLine !== "" && (addressLine.length < ADDRESS_LINE_MIN_LENGTH || addressLine.length > ADDRESS_LINE_MAX_LENGTH)) {
    errors.addressLine = `Số nhà và tên đường cần từ ${ADDRESS_LINE_MIN_LENGTH} đến ${ADDRESS_LINE_MAX_LENGTH} ký tự.`;
  }

  if (Object.keys(errors).length > 0) return { errors, value: null };
  return {
    errors,
    value: {
      fullName,
      phone: phone === "" ? null : phone,
      provinceCode: provinceCode === "" ? null : provinceCode,
      wardCode: wardCode === "" ? null : wardCode,
      addressLine: addressLine === "" ? null : addressLine,
    },
  };
}

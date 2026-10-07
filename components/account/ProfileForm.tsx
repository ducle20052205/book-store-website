"use client";

import { type FormEvent, useRef, useState } from "react";
import { saveProfile } from "@/app/actions/profile";
import { AddressPicker } from "@/components/address/AddressPicker";
import { AuthAlert, AuthErrorMessage } from "@/components/AuthAlert";
import { TextField } from "@/components/AuthFields";
import { AuthNotice } from "@/components/AuthNotice";
import type { ProvinceOption, WardOption } from "@/lib/address";
import { FULL_NAME_MAX_LENGTH } from "@/lib/authRules";
import { type ProfileErrors, type ProfileField, PROFILE_FIELD_ORDER, validateProfile } from "@/lib/account/profileRules";
import { cardClass, primaryButtonClass } from "@/lib/ui/classes";

export interface ProfileInitial {
  fullName: string;
  phone: string;
  email: string;
  provinceCode: string;
  wardCode: string;
  addressLine: string;
}

const sectionTitleClass = "font-serif text-xl font-semibold text-ink-900";

/**
 * Hai thẻ đầu của trang hồ sơ (đợt 8, FR-A.4): "Thông tin cá nhân" và "Địa chỉ giao hàng", MỘT form, MỘT nút lưu.
 *
 * - Email hiện ở dạng CHỈ ĐỌC (`disabled`): đổi email kéo theo xác minh địa chỉ mới và đồng bộ `profiles.email`, ngoài
 *   phạm vi đợt này (spec mục 6.4). Form không gửi email lên.
 * - Ba trường địa chỉ cùng trống hoặc cùng có giá trị (khoá ngoại ghép `MATCH FULL`, FR-5.8): luật nằm ở
 *   lib/account/profileRules.ts, dùng chung với Server Action; form báo lỗi ở từng ô thiếu, không để lưu nửa vời.
 * - Lưu xong là dải thông báo trong trang, có nút đóng, KHÔNG tự tắt (WCAG 2.2.1).
 * - Chọn tỉnh/phường dùng `AddressPicker` (đợt 8, FR-A.7) — cùng component với /thanh-toan.
 */
export function ProfileForm({
  initial,
  provinces,
  initialWards,
}: {
  initial: ProfileInitial;
  provinces: ProvinceOption[];
  initialWards: WardOption[];
}) {
  const fullNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const provinceCodeRef = useRef<HTMLSelectElement>(null);
  const wardCodeRef = useRef<HTMLSelectElement>(null);
  const addressLineRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState({
    fullName: initial.fullName,
    phone: initial.phone,
    provinceCode: initial.provinceCode,
    wardCode: initial.wardCode,
    addressLine: initial.addressLine,
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const attemptRef = useRef(0);

  function setField(field: ProfileField, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function handleAddressChange(next: { provinceCode: string; wardCode: string }) {
    setFields((current) => ({ ...current, provinceCode: next.provinceCode, wardCode: next.wardCode }));
    setErrors((current) => ({ ...current, provinceCode: undefined, wardCode: undefined }));
  }

  function focusFirst(found: ProfileErrors) {
    // Bảng tra chỉ dựng trong hàm xử lý sự kiện — không đọc ref lúc render.
    const byField = {
      fullName: fullNameRef,
      phone: phoneRef,
      provinceCode: provinceCodeRef,
      wardCode: wardCodeRef,
      addressLine: addressLineRef,
    };
    const first = PROFILE_FIELD_ORDER.find((field) => found[field]);
    if (first) byField[first].current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setSaved(false);
    setFailure(null);
    const checked = validateProfile(fields);
    if (checked.value === null) {
      setErrors(checked.errors);
      focusFirst(checked.errors);
      return;
    }

    setErrors({});
    setPending(true);
    let result: Awaited<ReturnType<typeof saveProfile>>;
    try {
      result = await saveProfile(fields);
    } catch {
      result = { ok: false, errors: {}, unknown: true };
    }
    setPending(false);

    if (result.ok) {
      setSaved(true);
      return;
    }
    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      focusFirst(result.errors);
    }
    if (result.unknown) {
      attemptRef.current += 1;
      setFailure(attemptRef.current);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
      {failure !== null && (
        <AuthAlert key={failure}>
          <AuthErrorMessage kind="unknown" />
        </AuthAlert>
      )}
      {saved && (
        <AuthNotice onClose={() => setSaved(false)}>Chúng mình đã lưu hồ sơ của bạn.</AuthNotice>
      )}

      <section aria-labelledby="profile-info" className={`${cardClass} p-6`}>
        <h2 id="profile-info" className={sectionTitleClass}>
          Thông tin cá nhân
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField
            ref={fullNameRef}
            label="Họ và tên"
            name="fullName"
            autoComplete="name"
            maxLength={FULL_NAME_MAX_LENGTH}
            required
            value={fields.fullName}
            error={errors.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
          />
          <TextField
            ref={phoneRef}
            label="Số điện thoại"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={fields.phone}
            error={errors.phone}
            hint="Không bắt buộc. Chúng mình điền sẵn số này khi bạn đặt hàng."
            onChange={(event) => setField("phone", event.target.value)}
          />
        </div>
        <div className="mt-4">
          <TextField
            label="Email"
            type="email"
            value={initial.email}
            disabled
            hint="Email dùng để đăng nhập. Đợt này chúng mình chưa cho đổi email."
            onChange={() => {}}
          />
        </div>
      </section>

      <section aria-labelledby="profile-address" className={`${cardClass} p-6`}>
        <h2 id="profile-address" className={sectionTitleClass}>
          Địa chỉ giao hàng
        </h2>
        <AddressPicker
          provinces={provinces}
          initialProvinceCode={initial.provinceCode}
          initialWards={initialWards}
          provinceCode={fields.provinceCode}
          wardCode={fields.wardCode}
          provinceError={errors.provinceCode}
          wardError={errors.wardCode}
          provinceRef={provinceCodeRef}
          wardRef={wardCodeRef}
          onChange={handleAddressChange}
        />
        <div className="mt-4">
          <TextField
            ref={addressLineRef}
            label="Số nhà và tên đường"
            name="addressLine"
            autoComplete="street-address"
            value={fields.addressLine}
            error={errors.addressLine}
            hint="Điền đủ ba ô địa chỉ hoặc để trống cả ba. Địa chỉ Việt Nam từ 01/07/2025 chỉ còn hai cấp: phường/xã rồi tới tỉnh/thành."
            onChange={(event) => setField("addressLine", event.target.value)}
          />
        </div>
      </section>

      <button type="submit" aria-disabled={pending} className={`${primaryButtonClass} aria-disabled:opacity-70`}>
        {pending ? "Đang lưu…" : "Lưu thay đổi"}
      </button>
    </form>
  );
}

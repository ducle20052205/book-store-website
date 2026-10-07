"use client";

import { type ReactNode, type Ref, type SelectHTMLAttributes, useEffect, useId, useRef, useState } from "react";
import { FieldFrame } from "@/components/AuthFields";
import type { ProvinceOption, WardOption } from "@/lib/address";

/**
 * Hai ô chọn địa chỉ Việt Nam hai cấp (đợt 8, FR-A.7): Tỉnh / Thành phố rồi Phường / Xã. TRÍCH NGUYÊN VĂN từ
 * `components/checkout/CheckoutView.tsx` (đợt 3B, spec FR-3B.10–3B.12) để trang hồ sơ dùng lại — không phải bản chép thứ hai.
 * Markup, thuộc tính và thứ tự giữ y hệt: HTML của `/thanh-toan` không được đổi (TC-A.8).
 *
 * Tự lo phần phường/xã theo tỉnh: nạp qua `api/dia-chi/phuong-xa` khi đổi tỉnh, nhớ tạm theo tỉnh (`wardCache`) để chọn đi
 * chọn lại không gọi mạng, bỏ kết quả của lời gọi cũ nếu đã chọn tỉnh khác (`wardsRequest`). Đổi tỉnh thì xoá phường/xã đã
 * chọn (nó thuộc tỉnh cũ). Giá trị đang chọn do NƠI DÙNG giữ (`provinceCode`, `wardCode`); `onChange` báo giá trị mới.
 *
 * `initialProvinceCode` + `initialWards`: danh sách phường/xã của tỉnh có sẵn do server đưa, nhớ vào cache ngay từ đầu.
 * `provinceRef`, `wardRef`: để nơi dùng đưa focus về ô (khối tóm tắt lỗi). `provinceError`, `wardError`: lỗi của riêng từng ô.
 */

export interface AddressPickerProps {
  provinces: ProvinceOption[];
  initialProvinceCode: string;
  initialWards: WardOption[];
  provinceCode: string;
  wardCode: string;
  onChange: (next: { provinceCode: string; wardCode: string }) => void;
  provinceError?: ReactNode;
  wardError?: ReactNode;
  provinceRef?: Ref<HTMLSelectElement>;
  wardRef?: Ref<HTMLSelectElement>;
}

type WardsState = "idle" | "loading" | "error";

export function AddressPicker({
  provinces,
  initialProvinceCode,
  initialWards,
  provinceCode,
  wardCode,
  onChange,
  provinceError,
  wardError,
  provinceRef,
  wardRef,
}: AddressPickerProps) {
  const [wards, setWards] = useState<WardOption[]>(initialWards);
  const [wardsState, setWardsState] = useState<WardsState>("idle");
  const wardCache = useRef(new Map<string, WardOption[]>());
  const wardsRequest = useRef(0);

  // Danh sách phường/xã của tỉnh trong hồ sơ do server đưa sẵn: nhớ lại để chọn đi chọn lại không gọi mạng.
  useEffect(() => {
    if (initialProvinceCode && initialWards.length > 0) wardCache.current.set(initialProvinceCode, initialWards);
  }, [initialProvinceCode, initialWards]);

  async function loadWards(code: string) {
    const cached = wardCache.current.get(code);
    if (cached) {
      setWards(cached);
      setWardsState("idle");
      return;
    }
    const request = ++wardsRequest.current;
    setWards([]);
    setWardsState("loading");
    try {
      const response = await fetch(`/api/dia-chi/phuong-xa?tinh=${encodeURIComponent(code)}`);
      if (!response.ok) throw new Error(String(response.status));
      const list = (await response.json()) as WardOption[];
      if (request !== wardsRequest.current) return; // đã chọn tỉnh khác trong lúc chờ
      wardCache.current.set(code, list);
      setWards(list);
      setWardsState("idle");
    } catch {
      if (request !== wardsRequest.current) return;
      setWardsState("error");
    }
  }

  function handleProvinceChange(code: string) {
    // Đổi tỉnh thì xoá phường/xã đã chọn (nó thuộc tỉnh cũ).
    onChange({ provinceCode: code, wardCode: "" });
    if (code === "") {
      wardsRequest.current += 1;
      setWards([]);
      setWardsState("idle");
      return;
    }
    void loadWards(code);
  }

  const wardPlaceholder =
    provinceCode === "" ? "Chọn tỉnh/thành phố trước" : wardsState === "loading" ? "Đang tải danh sách…" : "Chọn phường / xã";

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <SelectField
        ref={provinceRef}
        label="Tỉnh / Thành phố"
        name="provinceCode"
        autoComplete="address-level1"
        required
        value={provinceCode}
        error={provinceError}
        onChange={(event) => handleProvinceChange(event.target.value)}
      >
        <option value="">Chọn tỉnh / thành phố</option>
        {provinces.map((province) => (
          <option key={province.code} value={province.code}>
            {province.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        ref={wardRef}
        label="Phường / Xã"
        name="wardCode"
        autoComplete="address-level2"
        required
        disabled={provinceCode === "" || wardsState === "loading"}
        value={wardCode}
        error={wardError ?? (wardsState === "error" ? "Chúng mình chưa tải được danh sách phường/xã. Bạn chọn lại tỉnh để thử lần nữa nhé." : undefined)}
        onChange={(event) => onChange({ provinceCode, wardCode: event.target.value })}
      >
        <option value="">{wardPlaceholder}</option>
        {wards.map((ward) => (
          <option key={ward.code} value={ward.code}>
            {ward.name}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

/** <select> cùng khung nhãn/lỗi/gợi ý với TextField (components/AuthFields.tsx). */
function SelectField({
  label,
  error,
  hint,
  children,
  ref,
  ...selectProps
}: {
  label: string;
  error?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  ref?: Ref<HTMLSelectElement>;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className">) {
  const id = useId();
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      renderInput={(frame) => (
        <select {...selectProps} {...frame} ref={ref}>
          {children}
        </select>
      )}
    />
  );
}

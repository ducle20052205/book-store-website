"use client";

import { type InputHTMLAttributes, type ReactNode, type Ref, useId, useState } from "react";
import { inputClass } from "@/lib/ui/classes";

/**
 * Ô nhập dùng chung cho /dang-nhap và /dang-ky (đợt 2B, spec mục 5–6, README
 * mockup "Số đo lặp lại ở mọi màn"): nhãn luôn nằm TRÊN ô và không dùng
 * placeholder thay nhãn; ô cao 48px trên mobile với chữ 16px (iOS không tự
 * phóng to), 46px từ md; bo `radius-field`, viền `line-field` (≥ 3:1 trên nền
 * trắng — WCAG 1.4.11), viền `danger` khi có lỗi.
 */

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  label: string;
  /** Lời nhắn thường trực dưới ô (vd. yêu cầu mật khẩu) — hiện từ đầu, không đợi báo lỗi. */
  hint?: ReactNode;
  /** Lỗi của riêng ô này, hiện dưới ô, đọc ngay khi xuất hiện (role="alert"). */
  error?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/** Nhãn + ô + gợi ý + lỗi, nối nhau bằng aria-describedby; `renderInput` nhận các thuộc tính đã ghép sẵn. */
export function FieldFrame({
  id,
  label,
  hint,
  error,
  below,
  renderInput,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Chèn giữa ô và gợi ý (thanh đo độ mạnh của mật khẩu). */
  below?: ReactNode;
  renderInput: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string; className: string }) => ReactNode;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-body-sm font-medium text-ink-900">
        {label}
      </label>
      {renderInput({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        className: `${inputClass} ${error ? "border-danger" : "border-line-field"}`,
      })}
      {below}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-body-sm text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="mt-1.5 text-meta text-ink-600">
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, hint, error, ref, ...inputProps }: FieldProps) {
  const id = useId();
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      renderInput={(frame) => <input {...inputProps} {...frame} ref={ref} />}
    />
  );
}

interface PasswordFieldProps extends FieldProps {
  /** Nội dung chèn giữa ô và gợi ý — thanh đo độ mạnh ở /dang-ky. */
  below?: ReactNode;
}

/**
 * Ô mật khẩu có nút Hiện/Ẩn. Nút là `<button type="button">` (không gửi form),
 * có `aria-pressed`, đổi nhãn theo trạng thái (spec mục 5), cao 44px để đạt vùng
 * chạm tối thiểu — nằm chồng lên mép phải của ô nên ô chừa chỗ bằng `pr-[68px]`.
 * Không có ô nhập lại mật khẩu — nút này thay cho việc đó (FR-5.1).
 */
export function PasswordField({ label, hint, error, below, ref, ...inputProps }: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      below={below}
      renderInput={(frame) => (
        <div className="relative">
          <input
            {...inputProps}
            {...frame}
            ref={ref}
            type={visible ? "text" : "password"}
            autoCapitalize="none"
            spellCheck={false}
            className={`${frame.className} pr-[68px]`}
          />
          <button
            type="button"
            aria-pressed={visible}
            aria-controls={id}
            onClick={() => setVisible((value) => !value)}
            className="pressable absolute right-1 top-1/2 flex h-11 min-w-[52px] -translate-y-1/2 items-center justify-center rounded-field bg-field px-3 text-body-sm font-semibold text-ink-900 hover:bg-cham-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
          >
            {visible ? "Ẩn" : "Hiện"}
          </button>
        </div>
      )}
    />
  );
}

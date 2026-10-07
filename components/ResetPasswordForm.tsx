"use client";

import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { setNewPassword } from "@/app/actions/auth";
import { AuthAlert, AuthErrorMessage } from "@/components/AuthAlert";
import { PasswordField } from "@/components/AuthFields";
import { PasswordStrength } from "@/components/PasswordStrength";
import type { AuthErrorKind } from "@/lib/authErrors";
import { PASSWORD_MIN_LENGTH } from "@/lib/authRules";
import { isNextRedirect } from "@/lib/nextRedirect";

/**
 * Form đặt mật khẩu mới (đợt 8, FR-A.3). Chỉ được dựng khi đã có phiên đặt lại (`app/dat-lai-mat-khau/page.tsx`).
 * Luật mật khẩu dùng lại `PASSWORD_MIN_LENGTH` (8 ký tự, không ràng buộc thành phần); KHÔNG có ô nhập lại mật khẩu —
 * nút Hiện/Ẩn của `PasswordField` thay cho nó (mục 5.1 file quyết định). Đúng thì action gọi `redirect()` nên lời gọi bị
 * từ chối bằng lỗi redirect (`lib/nextRedirect.ts`) và router tự điều hướng; không gọi `router.push/refresh`.
 */
export function ResetPasswordForm() {
  const passwordRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<ReactNode>(null);
  const [formError, setFormError] = useState<{ attempt: number; kind: AuthErrorKind } | null>(null);
  const [pending, setPending] = useState(false);
  const attemptRef = useRef(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setFormError(null);
    if (password.length < PASSWORD_MIN_LENGTH) {
      setFieldError(`Mật khẩu cần tối thiểu ${PASSWORD_MIN_LENGTH} ký tự.`);
      passwordRef.current?.focus();
      return;
    }

    setFieldError(null);
    setPending(true);
    let result: Awaited<ReturnType<typeof setNewPassword>>;
    try {
      result = await setNewPassword({ password });
    } catch (caught) {
      if (isNextRedirect(caught)) return;
      // Không tới được máy chủ (mất mạng…): cùng câu với lỗi không rõ.
      result = { ok: false, kind: "unknown" };
    }

    setPending(false);
    if (result.kind === "weak_password" || result.kind === "same_password") {
      setFieldError(<AuthErrorMessage kind={result.kind} />);
      passwordRef.current?.focus();
    } else {
      attemptRef.current += 1;
      setFormError({ attempt: attemptRef.current, kind: result.kind });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <AuthAlert key={formError.attempt}>
          <AuthErrorMessage kind={formError.kind} />
        </AuthAlert>
      )}

      <PasswordField
        ref={passwordRef}
        label="Mật khẩu mới"
        name="password"
        autoComplete="new-password"
        required
        value={password}
        error={fieldError}
        hint={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự, không cần ký tự đặc biệt.`}
        below={<PasswordStrength password={password} />}
        onChange={(event) => setPassword(event.target.value)}
      />

      <button
        type="submit"
        aria-disabled={pending}
        className="pressable mt-4 flex h-[50px] w-full items-center justify-center rounded-field bg-cham-700 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 aria-disabled:opacity-70 md:h-12"
      >
        {pending ? "Đang lưu…" : "Đặt mật khẩu mới"}
      </button>
    </form>
  );
}

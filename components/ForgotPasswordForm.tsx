"use client";

import { type FormEvent, useRef, useState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import { AuthAlert, AuthErrorMessage } from "@/components/AuthAlert";
import { TextField } from "@/components/AuthFields";
import { AuthNotice } from "@/components/AuthNotice";
import { EMAIL_PATTERN } from "@/lib/authRules";

/**
 * Form quên mật khẩu (đợt 8, FR-A.1). Một ô email, một nút gửi; cùng khuôn `LoginForm` (kiểm tra bằng chữ của mình
 * với `noValidate`, nhãn thật, không placeholder thay nhãn).
 *
 * PHẢN HỒI KHÔNG PHÂN BIỆT email có tài khoản với email không có: server trả cùng `{ ok: true }` cho cả hai, và dải
 * thông báo dưới đây giống hệt nhau. Chỉ email sai ĐỊNH DẠNG mới báo lỗi, ngay dưới ô nhập. Thông báo thành công là
 * dải trong trang, có nút đóng, KHÔNG tự tắt (WCAG 2.2.1, mục 3 file quyết định).
 */
export function ForgotPasswordForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const attemptRef = useRef(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const mail = email.trim();
    setSent(false);
    setFormError(null);
    if (mail === "") {
      setFieldError("Bạn nhập email giúp chúng mình nhé.");
      emailRef.current?.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(mail)) {
      setFieldError("Email này chưa đúng định dạng. Bạn kiểm tra lại giúp chúng mình nhé.");
      emailRef.current?.focus();
      return;
    }

    setFieldError(null);
    setPending(true);
    let result: Awaited<ReturnType<typeof requestPasswordReset>>;
    try {
      result = await requestPasswordReset({ email: mail });
    } catch {
      // Không tới được máy chủ (mất mạng…): cùng câu với lỗi không rõ.
      setPending(false);
      attemptRef.current += 1;
      setFormError(attemptRef.current);
      return;
    }

    setPending(false);
    if (result.ok) {
      setSent(true);
    } else {
      setFieldError("Email này chưa đúng định dạng. Bạn kiểm tra lại giúp chúng mình nhé.");
      emailRef.current?.focus();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError !== null && (
        <AuthAlert key={formError}>
          <AuthErrorMessage kind="unknown" />
        </AuthAlert>
      )}
      {sent && (
        <AuthNotice onClose={() => setSent(false)}>
          Nếu email này có tài khoản, chúng mình đã gửi link đặt lại mật khẩu tới đó. Bạn kiểm tra cả hộp thư rác nhé.
        </AuthNotice>
      )}

      <div className="space-y-4">
        <TextField
          ref={emailRef}
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          error={fieldError}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <button
        type="submit"
        aria-disabled={pending}
        className="pressable mt-4 flex h-[50px] w-full items-center justify-center rounded-field bg-cham-700 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 aria-disabled:opacity-70 md:h-12"
      >
        {pending ? "Đang gửi…" : "Gửi link đặt lại mật khẩu"}
      </button>

      <p className="mt-4 text-meta text-ink-600">
        Link có hiệu lực trong một khoảng thời gian ngắn và chỉ dùng được một lần. Bạn mở nó ở máy nào cũng được.
      </p>
    </form>
  );
}

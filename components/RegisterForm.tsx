"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, type RefObject, useRef, useState } from "react";
import { signUp } from "@/app/actions/auth";
import { AuthAlert, AuthErrorMessage } from "@/components/AuthAlert";
import { PasswordField, TextField } from "@/components/AuthFields";
import { PasswordStrength } from "@/components/PasswordStrength";
import { track } from "@/lib/analytics";
import type { AuthErrorKind } from "@/lib/authErrors";
import { FULL_NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/authRules";
import { mergeGuestCart } from "@/lib/cart/mergeGuestCart";
import { safeNextPath } from "@/lib/nextParam";
import { withWelcomeParam } from "@/lib/welcome";

type FieldName = "fullName" | "email" | "emailConfirm" | "password";
type FieldErrors = Partial<Record<FieldName, ReactNode>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Form đăng ký (đợt 2B, spec mục 6, FR-5.1). Bốn trường đúng thứ tự: họ tên,
 * email, nhập lại email, mật khẩu. KHÔNG có ô nhập lại mật khẩu — nút Hiện/Ẩn
 * thay cho việc đó — còn ô nhập lại email chống gõ sai email, lỗi làm người dùng
 * bị khoá khỏi tài khoản vĩnh viễn.
 *
 * - Mật khẩu: chặn dưới 8 ký tự, KHÔNG áp đặt loại ký tự; yêu cầu hiện dưới ô
 *   ngay từ đầu; thanh độ mạnh chỉ gợi ý.
 * - Hai ô email lệch nhau: chặn gửi, báo lỗi ngay dưới ô thứ hai.
 * - Email đã có tài khoản: báo dưới ô email, kèm liên kết đăng nhập/lấy lại mật khẩu.
 * - Lỗi khác (giới hạn tần suất, lỗi không rõ) hiện ở ô thông báo phía trên form.
 * - `noValidate`: kiểm tra bằng chữ của mình, không dùng bong bóng của trình duyệt.
 */
export function RegisterForm() {
  const router = useRouter();
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const emailConfirmRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<{ attempt: number; kind: AuthErrorKind } | null>(null);
  const [pending, setPending] = useState(false);
  const attemptRef = useRef(0);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const name = fullName.trim();
    const mail = email.trim();

    if (name === "") errors.fullName = "Bạn cho chúng mình biết họ tên nhé.";
    if (mail === "") errors.email = "Bạn nhập email giúp chúng mình nhé.";
    else if (!EMAIL_PATTERN.test(mail)) {
      errors.email = "Email này chưa đúng định dạng. Bạn kiểm tra lại giúp chúng mình nhé.";
    }
    if (mail !== "" && emailConfirm.trim().toLowerCase() !== mail.toLowerCase()) {
      errors.emailConfirm = "Hai ô email chưa giống nhau. Bạn kiểm tra lại giúp chúng mình nhé.";
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Mật khẩu cần tối thiểu ${PASSWORD_MIN_LENGTH} ký tự.`;
    }
    return errors;
  }

  function focusField(field: FieldName) {
    // Bảng tra chỉ dựng trong hàm xử lý sự kiện — không đọc ref lúc render.
    const byField: Record<FieldName, RefObject<HTMLInputElement | null>> = {
      fullName: fullNameRef,
      email: emailRef,
      emailConfirm: emailConfirmRef,
      password: passwordRef,
    };
    byField[field].current?.focus();
  }

  function focusFirstInvalid(errors: FieldErrors) {
    const order: FieldName[] = ["fullName", "email", "emailConfirm", "password"];
    const first = order.find((field) => errors[field]);
    if (first) focusField(first);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const errors = validate();
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(errors);
      return;
    }

    setPending(true);
    let result: Awaited<ReturnType<typeof signUp>>;
    try {
      result = await signUp({ fullName: fullName.trim(), email: email.trim(), password });
    } catch {
      // Không tới được máy chủ (mất mạng…): cùng câu với lỗi không rõ.
      result = { ok: false, kind: "unknown" };
    }

    if (!result.ok) {
      setPending(false);
      if (result.kind === "user_exists" || result.kind === "invalid_email") {
        const inline = { email: <AuthErrorMessage kind={result.kind} /> };
        setFieldErrors(inline);
        focusField("email");
      } else if (result.kind === "weak_password") {
        setFieldErrors({ password: <AuthErrorMessage kind="weak_password" /> });
        focusField("password");
      } else {
        attemptRef.current += 1;
        setFormError({ attempt: attemptRef.current, kind: result.kind });
      }
      return;
    }

    // Đăng ký xong có session ngay (Confirm email tắt): gộp giỏ khách (hàm rỗng ở
    // đợt này; lỗi không được chặn người dùng), rồi điều hướng theo ?next= (không
    // hợp lệ hoặc không có thì về "/") kèm cờ để trang đích hiện dải chào mừng.
    try {
      await mergeGuestCart();
    } catch {
      // bỏ qua có chủ ý
    }
    // Ghi sự kiện SAU khi đã có phiên (để track() gắn đúng user_id), không chặn điều
    // hướng nếu ghi lỗi. metadata chỉ có phương thức — tuyệt đối không có email (FR-8.5).
    track("sign_up", { method: "password" });

    // Không gọi router.refresh() sau push: xem giải thích ở LoginForm.
    const target = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    router.push(withWelcomeParam(target));
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <AuthAlert key={formError.attempt}>
          <AuthErrorMessage kind={formError.kind} />
        </AuthAlert>
      )}

      <div className="space-y-4">
        <TextField
          ref={fullNameRef}
          label="Họ và tên"
          name="fullName"
          type="text"
          autoComplete="name"
          maxLength={FULL_NAME_MAX_LENGTH}
          required
          value={fullName}
          error={fieldErrors.fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
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
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          ref={emailConfirmRef}
          label="Nhập lại email"
          name="emailConfirm"
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={emailConfirm}
          error={fieldErrors.emailConfirm}
          hint="Gõ lại một lần cho chắc. Email sai thì bạn không lấy lại được mật khẩu."
          onChange={(event) => setEmailConfirm(event.target.value)}
        />
        <PasswordField
          ref={passwordRef}
          label="Mật khẩu"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          error={fieldErrors.password}
          below={<PasswordStrength password={password} />}
          hint="Tối thiểu 8 ký tự. Không bắt buộc chữ hoa hay ký tự đặc biệt — một câu ngắn bạn nhớ được thì tốt hơn."
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <button
        type="submit"
        aria-disabled={pending}
        className="pressable mt-6 flex h-[50px] w-full items-center justify-center rounded-field bg-cham-700 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 aria-disabled:opacity-70 md:h-12"
      >
        {pending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
      </button>

      <p className="mt-4 text-meta text-ink-600">
        Không cần xác nhận qua email — tạo xong là bạn vào được luôn.
      </p>
    </form>
  );
}

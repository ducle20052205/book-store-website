"use client";

import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { changePassword } from "@/app/actions/profile";
import { AuthErrorMessage } from "@/components/AuthAlert";
import { PasswordField } from "@/components/AuthFields";
import { AuthNotice } from "@/components/AuthNotice";
import { PasswordStrength } from "@/components/PasswordStrength";
import { PASSWORD_MIN_LENGTH } from "@/lib/authRules";
import { cardClass, primaryButtonClass } from "@/lib/ui/classes";

const sectionTitleClass = "font-serif text-xl font-semibold text-ink-900";

/**
 * Thẻ thứ ba của trang hồ sơ (đợt 8, FR-A.5): đổi mật khẩu khi đang đăng nhập. Hai ô: mật khẩu hiện tại và mật khẩu mới
 * (nút Hiện/Ẩn thay cho ô nhập lại, mục 5.1). Action xác minh mật khẩu hiện tại TRƯỚC khi đổi (xem `changePassword`) và không
 * đăng xuất phiên hiện tại. Đổi xong là dải thông báo trong trang, có nút đóng, KHÔNG tự tắt (WCAG 2.2.1); hai ô được xoá trắng.
 */
export function ChangePasswordForm() {
  const currentRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [currentError, setCurrentError] = useState<ReactNode>(null);
  const [nextError, setNextError] = useState<ReactNode>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setDone(false);
    setCurrentError(null);
    setNextError(null);
    if (current === "") {
      setCurrentError("Bạn nhập mật khẩu hiện tại giúp chúng mình nhé.");
      currentRef.current?.focus();
      return;
    }
    if (next.length < PASSWORD_MIN_LENGTH) {
      setNextError(`Mật khẩu mới cần tối thiểu ${PASSWORD_MIN_LENGTH} ký tự.`);
      nextRef.current?.focus();
      return;
    }

    setPending(true);
    let result: Awaited<ReturnType<typeof changePassword>>;
    try {
      result = await changePassword({ current, next });
    } catch {
      result = { ok: false, kind: "unknown" };
    }
    setPending(false);

    if (result.ok) {
      setCurrent("");
      setNext("");
      setDone(true);
      return;
    }
    if (result.kind === "wrong_current") {
      setCurrentError("Mật khẩu hiện tại chưa đúng. Bạn thử lại giúp chúng mình nhé.");
      currentRef.current?.focus();
    } else {
      setNextError(<AuthErrorMessage kind={result.kind} />);
      nextRef.current?.focus();
    }
  }

  return (
    <section aria-labelledby="profile-password" className={`${cardClass} p-6`}>
      <h2 id="profile-password" className={sectionTitleClass}>
        Đổi mật khẩu
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-4">
        {done && (
          <AuthNotice onClose={() => setDone(false)}>
            Chúng mình đã đổi mật khẩu của bạn. Bạn vẫn đang đăng nhập trên thiết bị này.
          </AuthNotice>
        )}
        <div className="space-y-4">
          <PasswordField
            ref={currentRef}
            label="Mật khẩu hiện tại"
            name="currentPassword"
            autoComplete="current-password"
            required
            value={current}
            error={currentError}
            onChange={(event) => setCurrent(event.target.value)}
          />
          <PasswordField
            ref={nextRef}
            label="Mật khẩu mới"
            name="newPassword"
            autoComplete="new-password"
            required
            value={next}
            error={nextError}
            hint={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự, không cần ký tự đặc biệt.`}
            below={<PasswordStrength password={next} />}
            onChange={(event) => setNext(event.target.value)}
          />
        </div>
        <button type="submit" aria-disabled={pending} className={`${primaryButtonClass} mt-6 aria-disabled:opacity-70`}>
          {pending ? "Đang đổi…" : "Đổi mật khẩu"}
        </button>
      </form>
    </section>
  );
}

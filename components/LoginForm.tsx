"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { signIn } from "@/app/actions/auth";
import { AuthAlert, AuthErrorMessage } from "@/components/AuthAlert";
import { PasswordField, TextField } from "@/components/AuthFields";
import type { AuthErrorKind } from "@/lib/authErrors";
import { isNextRedirect } from "@/lib/nextRedirect";

/** Lỗi kiểm tra ngay ở trình duyệt (chưa gọi Auth) hoặc lỗi Auth đã phân loại. */
type LoginError = { attempt: number; kind: AuthErrorKind | "missing_email" | "missing_password" };

/**
 * Form đăng nhập (đợt 2B, spec mục 5).
 *
 * - Đăng nhập sai: GIỮ email đã gõ, chỉ xoá ô mật khẩu và đưa focus về đó.
 * - Lỗi hiện một chỗ duy nhất phía trên form (role="alert"), không rải dưới
 *   từng ô. Chữ tiếng Việt, không lộ mã lỗi.
 * - Đích sau khi đăng nhập lấy từ `?next=` qua safeNextPath() lúc bấm nút (đọc
 *   URL trong hàm xử lý, không lúc render, để trang prerender tĩnh được).
 * - `noValidate`: kiểm tra bằng chữ của mình, không dùng bong bóng mặc định của
 *   trình duyệt (chữ theo ngôn ngữ trình duyệt, không đúng giọng NA Books).
 */
export function LoginForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LoginError | null>(null);
  const [pending, setPending] = useState(false);
  const attemptRef = useRef(0);

  function fail(kind: LoginError["kind"]) {
    attemptRef.current += 1;
    setError({ attempt: attemptRef.current, kind });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    if (email.trim() === "") {
      fail("missing_email");
      emailRef.current?.focus();
      return;
    }
    if (password === "") {
      fail("missing_password");
      passwordRef.current?.focus();
      return;
    }

    setPending(true);
    setError(null);

    // Đăng nhập đúng thì action gọi redirect() (gộp giỏ và ghi sự kiện đã làm ở server):
    // lời gọi bị từ chối bằng lỗi redirect và router tự điều hướng. Nút giữ trạng thái
    // đang xử lý tới khi trang mới hiện. Không gọi router.push/refresh nữa — một
    // request RSC duy nhất do chính action sinh ra (spec 3A, TC-6).
    // `next` gửi nguyên giá trị thô của ?next=; server kiểm lại bằng safeNextPath.
    let result: Awaited<ReturnType<typeof signIn>>;
    try {
      result = await signIn({
        email: email.trim(),
        password,
        next: new URLSearchParams(window.location.search).get("next"),
      });
    } catch (caught) {
      if (isNextRedirect(caught)) return;
      // Không tới được máy chủ (mất mạng…): cùng câu với lỗi không rõ.
      result = { ok: false, kind: "unknown" };
    }

    setPassword("");
    setPending(false);
    fail(result.kind);
    passwordRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <AuthAlert key={error.attempt}>
          {error.kind === "missing_email" ? (
            <>Bạn nhập email giúp chúng mình nhé.</>
          ) : error.kind === "missing_password" ? (
            <>Bạn nhập mật khẩu giúp chúng mình nhé.</>
          ) : (
            <AuthErrorMessage kind={error.kind} />
          )}
        </AuthAlert>
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
          onChange={(event) => setEmail(event.target.value)}
        />
        <div>
          <PasswordField
            ref={passwordRef}
            label="Mật khẩu"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div className="mt-1 flex justify-end">
            <Link
              href="/quen-mat-khau"
              prefetch={false}
              className="inline-flex min-h-11 items-center text-body-sm font-medium text-cham-700 underline underline-offset-2 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </div>
      </div>

      <button
        type="submit"
        aria-disabled={pending}
        className="pressable mt-2 flex h-[50px] w-full items-center justify-center rounded-field bg-cham-700 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 aria-disabled:opacity-70 md:h-12"
      >
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>

      <p className="mt-4 text-meta text-ink-600">
        Đăng nhập xong bạn quay lại đúng trang đang xem, và giỏ hàng đang có sẽ được giữ nguyên.
      </p>
    </form>
  );
}

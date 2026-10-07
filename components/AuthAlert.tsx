import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircleIcon } from "@/components/AuthIcons";
import type { AuthErrorKind } from "@/lib/authErrors";

/**
 * Ô thông báo lỗi đặt PHÍA TRÊN form (spec 2B mục 5), theo ô "sai đăng nhập" của
 * docs/mockups/buoc-2/bo-trang-thai-thong-bao.png: nền `danger-tint`, viền trái
 * 3px `danger`, bo `radius-notice`, biểu tượng cảnh báo. role="alert" để trình
 * đọc màn hình đọc ngay khi ô xuất hiện — nơi dùng gắn `key` đổi theo mỗi lần
 * thử để ô được dựng lại và đọc lại kể cả khi lỗi lặp y nguyên.
 */
export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-3 rounded-notice border-l-[3px] border-danger bg-danger-tint px-4 py-3 text-body-sm text-ink-900"
    >
      <AlertCircleIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-danger" />
      <div>{children}</div>
    </div>
  );
}

const linkClass = "font-medium underline underline-offset-2 hover:text-cham-600";

/**
 * Câu chữ hiển thị cho từng loại lỗi từ Supabase (spec 2B mục 10): tiếng Việt,
 * giọng "chúng mình", không lộ mã lỗi kỹ thuật, luôn nói người dùng làm gì tiếp.
 * Liên kết kế thừa màu chữ của nơi đặt (chữ tối trong ô thông báo, đỏ dưới ô nhập).
 */
export function AuthErrorMessage({ kind }: { kind: AuthErrorKind }) {
  switch (kind) {
    case "invalid_credentials":
      return (
        <>
          Email hoặc mật khẩu chưa đúng. Bạn thử lại nhé, hoặc{" "}
          <Link href="/quen-mat-khau" prefetch={false} className={linkClass}>
            đặt lại mật khẩu
          </Link>
          .
        </>
      );
    case "user_exists":
      return (
        <>
          Email này đã có tài khoản rồi.{" "}
          <Link href="/dang-nhap" className={linkClass}>
            Đăng nhập
          </Link>{" "}
          hoặc{" "}
          <Link href="/quen-mat-khau" prefetch={false} className={linkClass}>
            lấy lại mật khẩu
          </Link>
          .
        </>
      );
    case "rate_limit":
      return <>Bạn thử lại sau ít phút giúp chúng mình nhé.</>;
    case "weak_password":
      return <>Mật khẩu cần tối thiểu 8 ký tự. Bạn thử lại giúp chúng mình nhé.</>;
    case "invalid_email":
      return <>Email này chưa đúng định dạng. Bạn kiểm tra lại giúp chúng mình nhé.</>;
    case "same_password":
      return <>Mật khẩu mới đang trùng mật khẩu cũ. Bạn chọn một mật khẩu khác giúp chúng mình nhé.</>;
    case "unknown":
      return <>Có gì đó chưa ổn ở phía chúng mình. Bạn thử lại sau ít phút nhé.</>;
  }
}

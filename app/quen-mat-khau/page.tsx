import type { Metadata } from "next";
import { QuoteRuleIcon } from "@/components/AuthIcons";
import { AuthShell } from "@/components/AuthShell";
import { AuthSwitchLink } from "@/components/AuthSwitchLink";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { ResetLinkNotice } from "@/components/ResetLinkNotice";

export const metadata: Metadata = {
  title: "Quên mật khẩu — NA Books",
};

/**
 * /quen-mat-khau (đợt 8, FR-A.1): lắp từ `AuthShell` như `/dang-nhap`. Prerender tĩnh: mọi thứ phụ thuộc URL
 * (`?loi=`) nằm trong Client Component. Cột editorial chỉ có chữ, không truy vấn dữ liệu.
 */
export default function QuenMatKhauPage() {
  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle={
        <p className="flex flex-wrap items-center gap-x-1.5">
          Nhớ ra rồi? <AuthSwitchLink href="/dang-nhap">Đăng nhập</AuthSwitchLink>
        </p>
      }
      editorial={
        <div>
          <p className="font-serif text-lg italic leading-relaxed text-white md:text-xl">
            Quên mật khẩu là chuyện thường. Chúng mình gửi một đường dẫn tới email của bạn để bạn đặt lại — những đơn
            hàng và địa chỉ đã lưu vẫn còn nguyên.
          </p>
          <QuoteRuleIcon className="mt-3 h-3 w-16 text-nghe-400 md:hidden" />
        </div>
      }
    >
      <ResetLinkNotice />
      <ForgotPasswordForm />
    </AuthShell>
  );
}

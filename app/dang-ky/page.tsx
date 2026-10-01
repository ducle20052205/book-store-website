import type { Metadata } from "next";
import { BookmarkIcon, PinIcon, QuoteRuleIcon } from "@/components/AuthIcons";
import { AuthShell } from "@/components/AuthShell";
import { AuthSwitchLink } from "@/components/AuthSwitchLink";
import { OrdersIcon } from "@/components/HeaderIcons";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Tạo tài khoản — NA Books",
};

/** Ba lợi ích ở cột editorial (mockup dang-ky.png). Chỉ hiện từ md — dưới md cột rút còn khối trích dẫn. */
const BENEFITS = [
  { Icon: OrdersIcon, title: "Theo dõi đơn hàng", body: "Xem đơn đang tới đâu, huỷ được khi còn chờ xử lý." },
  { Icon: PinIcon, title: "Lưu địa chỉ giao hàng", body: "Lần sau đặt sách không phải gõ lại địa chỉ." },
  {
    Icon: BookmarkIcon,
    title: "Giữ lại giỏ hàng",
    body: "Những cuốn bạn đã bỏ vào giỏ sẽ theo bạn sang lần đăng nhập sau.",
  },
] as const;

/**
 * /dang-ky (đợt 2B, spec mục 6). Trang prerender tĩnh; `?next=` được đọc lúc bấm
 * nút trong RegisterForm.
 */
export default function DangKyPage() {
  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle={
        <p className="flex flex-wrap items-center gap-x-1.5">
          Đã có tài khoản? <AuthSwitchLink href="/dang-nhap">Đăng nhập</AuthSwitchLink>
        </p>
      }
      editorial={
        <>
          <div>
            <p className="font-serif text-lg italic leading-relaxed text-white md:text-xl">
              Có tài khoản thì mọi thứ ở lại chỗ của nó.
            </p>
            <QuoteRuleIcon className="mt-3 h-3 w-16 text-nghe-400" />
          </div>

          <ul className="hidden space-y-5 md:block">
            {BENEFITS.map(({ Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-nghe-400" />
                <div>
                  <p className="text-body-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-meta text-white/80">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}

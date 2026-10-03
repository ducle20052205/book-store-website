import Link from "next/link";
import type { ReactNode } from "react";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui/classes";

/**
 * Trạng thái trống đủ bốn phần của hệ layout đóng băng: hình vẽ nét 76px, tiêu đề, đoạn giải thích tối đa
 * 460px, hai nút. Tách từ hàm cục bộ `EmptyCart` ở `app/gio-hang/page.tsx` (đợt 4, spec FR-B4.1) để giỏ hàng
 * và danh sách đơn dùng chung; HTML giữ nguyên so với bản cục bộ (TC-17). Hình vẽ là một quyển sách mở, cùng
 * một hình cho mọi trạng thái trống trong hệ.
 */
export interface EmptyStateAction {
  href: string;
  label: string;
  variant: "primary" | "secondary";
}

export function EmptyState({ title, actions, children }: { title: string; actions: EmptyStateAction[]; children: ReactNode }) {
  return (
    <div className={`${cardClass} mt-6 px-6 py-14 text-center md:py-20`}>
      <svg
        viewBox="0 0 76 56"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mx-auto h-14 w-[76px] text-cham-700"
      >
        <path d="M4 6h30a4 4 0 0 1 4 4v42a6 6 0 0 0-6-6H4V6z" />
        <path d="M72 6H42a4 4 0 0 0-4 4v42a6 6 0 0 1 6-6h28V6z" />
        <path d="M12 16h16M12 24h16M48 16h16M48 24h16" strokeWidth="1.2" />
      </svg>
      <h2 className="mt-6 font-serif text-2xl font-semibold text-ink-900">{title}</h2>
      <p className="mx-auto mt-3 max-w-[460px] text-body text-ink-600">{children}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={action.variant === "primary" ? `${primaryButtonClass} !w-auto` : secondaryButtonClass}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

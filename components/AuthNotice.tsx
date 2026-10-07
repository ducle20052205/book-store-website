import type { ReactNode } from "react";
import { CheckIcon } from "@/components/AuthIcons";
import { CloseIcon } from "@/components/HeaderIcons";

/**
 * Dải thông báo THÀNH CÔNG đặt phía trên form (đợt 8, FR-A.1): cùng kiểu dáng với dải chào mừng
 * (`WelcomeStrip`: nền success-tint, viền trái 3px success, nút đóng 44×44px) nhưng nằm trong khung form.
 * KHÔNG tự tắt (WCAG 2.2.1, mục 3 file quyết định) — người dùng đóng bằng nút. `role="status"` để trình đọc màn hình
 * đọc khi dải xuất hiện. Dùng ở `/quen-mat-khau`.
 */
export function AuthNotice({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-3 rounded-notice border-l-[3px] border-success bg-success-tint pl-4 text-body-sm text-ink-900"
    >
      <CheckIcon className="mt-[14px] h-[18px] w-[18px] shrink-0 text-success" />
      <p className="flex-1 py-3">{children}</p>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={onClose}
        className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-ink-600 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        <CloseIcon className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

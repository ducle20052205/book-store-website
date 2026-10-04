"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui/classes";

/**
 * Vùng xác nhận NGAY TRONG TRANG (NFR-3.3), tách từ `CancelOrder` của đợt 4 (đợt 5A, spec FR-5A.5) để hủy
 * đơn của khách và đổi trạng thái của admin dùng chung. HTML phải giữ nguyên so với bản gốc (TC-14).
 *
 * Không dùng `confirm()` của trình duyệt; không phải hộp thoại modal (nền phía sau không bị khoá). Focus
 * chuyển vào vùng khi nó xuất hiện; Escape (khi không đang gửi) gọi `onClose`, nơi gọi trả focus về nút đã mở
 * vùng. Vùng không tự biến mất: nơi gọi quyết định khi nào gỡ nó (render có điều kiện). `id` dùng cho
 * `aria-controls` của nút mở; tiêu đề có id `${id}-title`.
 */
export function InlineConfirm({
  id,
  testId,
  title,
  confirmLabel,
  confirmClassName,
  pending,
  onConfirm,
  onClose,
  children,
}: {
  id: string;
  testId: string;
  title: string;
  confirmLabel: string;
  /** Kiểu của nút xác nhận; bỏ trống thì dùng `primaryButtonClass` (HTML của nơi gọi cũ không đổi). Đợt 5B: nút xoá sách dùng kiểu đỏ. */
  confirmClassName?: string;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      tabIndex={-1}
      role="group"
      aria-labelledby={`${id}-title`}
      aria-busy={pending}
      data-testid={testId}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) {
          event.stopPropagation();
          onClose();
        }
      }}
      className="mt-4 rounded-menu border border-line-warm bg-surface p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 md:p-6"
    >
      <h2 id={`${id}-title`} className="font-serif text-xl font-semibold text-ink-900">
        {title}
      </h2>
      <p className="mt-2 max-w-[68ch] text-body text-ink-600">{children}</p>
      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <button type="button" disabled={pending} onClick={onConfirm} className={`${confirmClassName ?? primaryButtonClass} md:!w-auto`}>
          {confirmLabel}
        </button>
        <button type="button" disabled={pending} onClick={onClose} className={`${secondaryButtonClass} w-full md:w-auto`}>
          Không
        </button>
      </div>
    </div>
  );
}

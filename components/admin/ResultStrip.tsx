"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { AlertCircleIcon, CheckIcon } from "@/components/AuthIcons";

/**
 * Dải kết quả TRONG TRANG của khu quản lý sách (đợt 5B, spec FR-5B.6): không tự tắt (WCAG 2.2.1, file quyết
 * định mục 3 — không phải `Toast`), `role="status"`, nhận focus khi xuất hiện để người dùng bàn phím và trình
 * đọc màn hình biết kết quả. Cùng kiểu dải với `OrderStatusControl` của 5A.
 */
export function ResultStrip({ tone, testId, children }: { tone: "ok" | "problem"; testId: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      data-testid={testId}
      className={`mb-4 flex items-start gap-3 rounded-notice border-l-[3px] pl-4 text-body-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
        tone === "ok" ? "border-success bg-success-tint" : "border-danger bg-danger-tint"
      }`}
    >
      {tone === "ok" ? (
        <CheckIcon className="mt-[14px] h-[18px] w-[18px] shrink-0 text-success" />
      ) : (
        <AlertCircleIcon className="mt-[14px] h-[18px] w-[18px] shrink-0 text-danger" />
      )}
      <p className="flex-1 py-3 pr-4">{children}</p>
    </div>
  );
}

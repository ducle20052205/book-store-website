"use client";

import { useEffect } from "react";

interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

/** 1c.2: toast dùng chung — aria-live="polite", tự ẩn sau 4 giây, đóng được bằng nút ×. */
export function Toast({ open, message, onClose }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-40 flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink-900 shadow-sm md:inset-x-auto md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng thông báo"
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control text-lg text-ink-600 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        ×
      </button>
    </div>
  );
}

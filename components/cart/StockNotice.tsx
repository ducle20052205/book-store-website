"use client";

import { useState } from "react";
import { AlertCircleIcon } from "@/components/AuthIcons";
import { CloseIcon } from "@/components/HeaderIcons";
import type { StockNoticeItem } from "@/lib/checkout/stockNotice";

/**
 * Banner "có sách không đủ hàng" ở /gio-hang (đợt 3B, spec FR-3B.9): hiện khi /thanh-toan chuyển
 * người dùng về đây vì kho đã tụt dưới số lượng trong giỏ.
 *
 * KHÔNG phải Toast và KHÔNG tự tắt (WCAG 2.2.1 Timing Adjustable): thông tin người dùng cần đọc kỹ
 * và có việc phải làm. Nằm trong luồng trang, đóng được bằng nút 44×44px. Nội dung (tên sách, số
 * còn lại) do server dựng từ tồn kho tính lại lúc render — props của component này — không bao giờ
 * lấy từ URL; cờ trong query chỉ là tín hiệu để trang quyết định có dựng banner hay không. Số lượng
 * trong giỏ KHÔNG bị tự sửa: người dùng tự quyết.
 */
export function StockNotice({ items }: { items: StockNoticeItem[] }) {
  const [open, setOpen] = useState(true);
  if (!open || items.length === 0) return null;

  return (
    <div
      role="status"
      className="mt-6 flex items-start gap-3 rounded-notice border-l-[3px] border-danger bg-danger-tint pl-4 text-body-sm text-ink-900"
    >
      <AlertCircleIcon className="mt-[14px] h-[18px] w-[18px] shrink-0 text-danger" />
      <div className="flex-1 py-3">
        <p className="font-medium">Trong giỏ có sách không đủ hàng, nên chúng mình chưa chuyển bạn sang thanh toán được.</p>
        <ul className="mt-1 list-disc pl-5">
          {items.map((item) => (
            <li key={item.title}>
              <span className="font-medium">{item.title}</span>
              {item.remaining <= 0 ? ": đã hết hàng." : `: chỉ còn ${item.remaining} cuốn (trong giỏ của bạn đang có ${item.inCart}).`}
            </li>
          ))}
        </ul>
        <p className="mt-1">Bạn đổi số lượng hoặc xóa sách khỏi giỏ rồi thanh toán lại nhé. Chúng mình không tự sửa số lượng của bạn.</p>
      </div>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={() => setOpen(false)}
        className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-ink-600 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        <CloseIcon className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

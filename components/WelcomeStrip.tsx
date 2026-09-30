"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckIcon } from "@/components/AuthIcons";
import { CloseIcon } from "@/components/HeaderIcons";
import { WELCOME_PARAM } from "@/lib/welcome";

/**
 * Dải chào mừng sau khi đăng ký (đợt 2B, spec mục 7). KHÔNG dùng component Toast
 * và KHÔNG tự tắt: toast tự biến mất vi phạm WCAG 2.2.1 Timing Adjustable — nội
 * dung người dùng cần đọc không được đặt trên đồng hồ họ không chỉnh được, và
 * người dùng bàn phím hay trình đọc màn hình thường chưa kịp đọc đã mất. Dải nằm
 * trong luồng trang, ngay dưới header, đóng được bằng nút 44×44px.
 *
 * Kiểu dáng theo ô "thành công" của docs/mockups/buoc-2/bo-trang-thai-thong-bao.png:
 * nền success-tint, viền trái 3px success, bo radius-notice.
 *
 * Trạng thái truyền qua `?chao=1`. Ngay khi thấy cờ, dải hiện lên (chốt lại trong
 * state để còn đó sau khi cờ bị gỡ) và cờ bị xoá khỏi URL bằng
 * history.replaceState — làm mới trang sẽ không hiện lại dải.
 */
function WelcomeStripInner() {
  const searchParams = useSearchParams();
  const wanted = searchParams.get(WELCOME_PARAM) === "1";
  const [open, setOpen] = useState(false);

  // Chốt "đã hiện" ngay trong lúc render (mẫu "điều chỉnh state theo props" của
  // React, có điều kiện nên không lặp): dải đã hiện thì giữ nguyên dù cờ sau đó
  // bị gỡ khỏi URL.
  if (wanted && !open) setOpen(true);

  useEffect(() => {
    if (!wanted) return;
    const url = new URL(window.location.href);
    url.searchParams.delete(WELCOME_PARAM);
    // Tham số đầu PHẢI là null, không truyền lại window.history.state: bản vá
    // replaceState của Next (app-router.js) thấy state nội bộ (__NA) thì gọi thẳng
    // hàm gốc và KHÔNG đồng bộ useSearchParams, khiến `wanted` kẹt ở true và dải
    // tự mở lại ngay sau khi người dùng đóng. Với null, Next tự sao chép state nội
    // bộ và cập nhật router.
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [wanted]);

  if (!open) return null;

  return (
    <div className="container-page pt-4">
      <div
        role="status"
        className="flex items-start gap-3 rounded-notice border-l-[3px] border-success bg-success-tint pl-4 text-body-sm text-ink-900"
      >
        <CheckIcon className="mt-[14px] h-[18px] w-[18px] shrink-0 text-success" />
        <p className="flex-1 py-3">
          Chào bạn, tài khoản đã sẵn sàng. Giỏ hàng và địa chỉ của bạn sẽ được lưu lại từ giờ.
        </p>
        <button
          type="button"
          aria-label="Đóng thông báo"
          onClick={() => setOpen(false)}
          className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-ink-600 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
        >
          <CloseIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}

/** useSearchParams() cần <Suspense> khi trang prerender (Cache Components); fallback rỗng vì dải chỉ hiện sau khi hydrate. */
export function WelcomeStrip() {
  return (
    <Suspense fallback={null}>
      <WelcomeStripInner />
    </Suspense>
  );
}

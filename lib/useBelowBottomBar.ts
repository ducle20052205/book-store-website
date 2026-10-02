"use client";

import { useSyncExternalStore } from "react";

/**
 * true khi viewport hẹp hơn breakpoint chung của luồng tập trung (đợt 3A, FR-3A.16).
 *
 * Con số KHÔNG viết ở đây: nó nằm ở một chỗ duy nhất là `--breakpoint-bottom-bar` trong
 * app/globals.css (cũng là nguồn của biến thể Tailwind `bottom-bar:` và của media query
 * đệm đáy), và hook đọc biến CSS đó lúc chạy. Nhờ vậy thanh cố định, footer thu gọn, cột
 * tóm tắt và đệm đáy không trôi khỏi nhau được.
 *
 * Trả `null` khi chưa biết — ở server và ở lượt render hydrate đầu — để nơi dùng giữ nguyên
 * HTML server (cả hai biến thể, class breakpoint chọn cái hiển thị) rồi mới bỏ biến thể thừa
 * sau hydrate: không nháy, không CLS.
 */
const BREAKPOINT_VAR = "--breakpoint-bottom-bar";

function belowQuery(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(BREAKPOINT_VAR).trim();
  if (!value) {
    // Biến chưa được phát ra: coi như không có breakpoint (bố cục rộng), nhưng nói to để thấy lỗi cấu hình.
    console.error(`[layout] thiếu ${BREAKPOINT_VAR} trong app/globals.css`);
    return "(width < 0px)";
  }
  return `(width < ${value})`;
}

export function useBelowBottomBar(): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(belowQuery());
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(belowQuery()).matches,
    () => null,
  );
}

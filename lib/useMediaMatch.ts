"use client";

import { useSyncExternalStore } from "react";

/**
 * `window.matchMedia(query).matches` cho Client Component, dùng với tiêu chí đo
 * theo breakpoint (đợt 3A, FR-3A.16). Trả `null` khi chưa biết — ở server và ở
 * lượt render hydrate đầu — để nơi dùng giữ nguyên HTML server (cả hai biến thể,
 * CSS chọn cái hiển thị) rồi mới bỏ biến thể thừa sau hydrate: không nháy, không CLS.
 */
export function useMediaMatch(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}

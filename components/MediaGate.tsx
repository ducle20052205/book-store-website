"use client";

import type { ReactNode } from "react";
import { useMediaMatch } from "@/lib/useMediaMatch";

/**
 * Chỉ giữ `children` trong DOM khi `query` khớp (đợt 3A, thanh thao tác đáy của
 * /gio-hang). CSS ẩn một phần tử vẫn để nó trong DOM; tiêu chí TC-15d đòi
 * `querySelector` trả null ở desktop, nên phải bỏ hẳn. HTML server luôn có
 * `children` (chưa biết viewport), phần tử tự ẩn bằng class breakpoint của nó;
 * sau hydrate nếu không khớp thì gỡ — người dùng không thấy gì đổi.
 */
export function MediaGate({ query, children }: { query: string; children: ReactNode }) {
  const matches = useMediaMatch(query);
  if (matches === false) return null;
  return <>{children}</>;
}

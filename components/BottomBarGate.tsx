"use client";

import type { ReactNode } from "react";
import { useBelowBottomBar } from "@/lib/useBelowBottomBar";

/**
 * Chỉ giữ `children` trong DOM khi viewport hẹp hơn breakpoint chung của luồng tập trung
 * (đợt 3A, thanh thao tác đáy của /gio-hang; số ở `--breakpoint-bottom-bar`, app/globals.css).
 * CSS ẩn một phần tử vẫn để nó trong DOM; tiêu chí TC-15d đòi `querySelector` trả null ở
 * desktop, nên phải bỏ hẳn. HTML server luôn có `children` (chưa biết viewport), phần tử tự ẩn
 * bằng class `bottom-bar:hidden` của nó; sau hydrate nếu rộng hơn thì gỡ — người dùng không
 * thấy gì đổi.
 */
export function BottomBarGate({ children }: { children: ReactNode }) {
  const below = useBelowBottomBar();
  if (below === false) return null;
  return <>{children}</>;
}

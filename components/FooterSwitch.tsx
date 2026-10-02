"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isFocusedFlow } from "@/lib/focusedFlow";
import { useMediaMatch } from "@/lib/useMediaMatch";

/**
 * Chọn footer theo luồng và breakpoint (đợt 3A, FR-3A.16). Ở luồng tập trung
 * (/gio-hang, /thanh-toan) dưới 768px: chỉ footer thu gọn; còn lại: footer đầy
 * đủ, không đổi.
 *
 * CSS ẩn vẫn để phần tử trong DOM, mà tiêu chí TC-16a đòi footer đầy đủ không có
 * trong DOM ở 390px. Vì vậy HTML server (và lượt hydrate đầu) mang CẢ HAI biến
 * thể, class breakpoint chọn cái hiển thị; sau hydrate mới bỏ biến thể thừa — hai
 * lớp bọc dùng `display: contents` nên không ảnh hưởng bố cục (footer vẫn là con
 * trực tiếp của body flex để `mt-auto` đẩy nó xuống đáy), không nháy, không CLS.
 */
export function FooterSwitch({ full, compact }: { full: ReactNode; compact: ReactNode }) {
  const pathname = usePathname();
  const narrow = useMediaMatch("(max-width: 767px)");

  if (!isFocusedFlow(pathname)) return full;

  return (
    <>
      {narrow !== false && <div className="contents md:hidden">{compact}</div>}
      {narrow !== true && <div className="contents max-md:hidden">{full}</div>}
    </>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthAlert } from "@/components/AuthAlert";

/**
 * Dải lỗi ở đầu `/quen-mat-khau` khi người dùng bị đẩy về đây (đợt 8, FR-A.2, FR-A.3). Hai cờ `?loi=`:
 *   - `het-han`: `/auth/callback` không đổi được `token_hash` lấy phiên (link hết hạn hoặc đã dùng rồi, hoặc thiếu tham số);
 *   - `phien`: vào `/dat-lai-mat-khau` mà không có phiên đặt lại.
 * Cờ lạ hay không có cờ thì không hiện gì. Là `role="alert"` (AuthAlert) và không tự tắt — mất nó là mất lời giải thích.
 *
 * Đọc URL bằng `useSearchParams()` trong <Suspense> để trang `/quen-mat-khau` vẫn prerender tĩnh (Cache Components);
 * form nằm NGOÀI Suspense nên có ngay trong HTML đầu, chỉ dải này hiện sau khi hydrate.
 */
function ResetLinkNoticeInner() {
  const flag = useSearchParams().get("loi");

  if (flag === "het-han") {
    return (
      <AuthAlert>
        Link đặt lại mật khẩu đã hết hạn hoặc đã được dùng rồi. Bạn nhập email bên dưới để chúng mình gửi một link mới nhé.
      </AuthAlert>
    );
  }
  if (flag === "phien") {
    return (
      <AuthAlert>
        Bạn cần mở link trong email đặt lại mật khẩu trước khi chọn mật khẩu mới. Bạn nhập email bên dưới để chúng mình
        gửi link nhé.
      </AuthAlert>
    );
  }
  return null;
}

export function ResetLinkNotice() {
  return (
    <Suspense fallback={null}>
      <ResetLinkNoticeInner />
    </Suspense>
  );
}

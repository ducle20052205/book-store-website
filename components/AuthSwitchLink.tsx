"use client";

import Link from "next/link";
import { type ReactNode, useSyncExternalStore } from "react";
import { safeNextPath } from "@/lib/nextParam";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}
const getSearch = () => window.location.search;
// Lúc prerender và lúc hydrate chưa có URL trình duyệt: dùng chuỗi rỗng để HTML
// khớp nhau, rồi React đọc giá trị thật ngay sau đó.
const getServerSearch = () => "";

/**
 * Liên kết chuyển giữa /dang-nhap và /dang-ky ("Tạo tài khoản mới", "Đăng nhập")
 * mang theo `?next=` đang có trên URL, để người bị proxy.ts chuyển tới đăng nhập
 * từ một trang cần quyền rồi chọn tạo tài khoản mới vẫn quay lại đúng trang đó.
 *
 * Đọc URL bằng useSyncExternalStore thay vì useSearchParams(): hai trang này
 * prerender tĩnh nên không đọc URL lúc render. `next` đi qua safeNextPath() (một
 * luật duy nhất, lib/nextParam.ts) trước khi được đặt vào liên kết.
 * Cao tối thiểu 44px — vùng chạm trên mobile (NFR-6.2).
 */
export function AuthSwitchLink({ href, children }: { href: string; children: ReactNode }) {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const raw = new URLSearchParams(search).get("next");
  const next = safeNextPath(raw);
  const target = raw !== null && next === raw ? `${href}?next=${encodeURIComponent(next)}` : href;

  return (
    <Link
      href={target}
      className="inline-flex min-h-11 items-center font-medium text-cham-700 underline underline-offset-2 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
    >
      {children}
    </Link>
  );
}

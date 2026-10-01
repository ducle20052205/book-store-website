"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { DEFAULT_NEXT_PATH, safeNextPath } from "@/lib/nextParam";

const LOGIN_PATH = "/dang-nhap";
const AUTH_PATHS = [LOGIN_PATH, "/dang-ky"];

function isAuthPage(pathname: string) {
  return AUTH_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

interface LoginNavLinkProps {
  className: string;
  children: ReactNode;
}

function LinkWithNext({ className, children }: LoginNavLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  // Ở /dang-nhap và /dang-ky không lấy chính trang đó làm đích (đăng nhập xong lại
  // rơi về trang đăng nhập): giữ nguyên `next` mà trang đang có, nếu có.
  const candidate = isAuthPage(pathname) ? searchParams.get("next") : `${pathname}${query ? `?${query}` : ""}`;
  // Cùng luật với mọi nơi khác đọc/ghi `?next=` (lib/nextParam.ts). Đích là "/"
  // (mặc định) thì không cần thêm tham số.
  const next = safeNextPath(candidate);
  const href = next === DEFAULT_NEXT_PATH ? LOGIN_PATH : `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;

  return (
    <a href={href} aria-label="Đăng nhập" className={className}>
      {children}
    </a>
  );
}

/**
 * Liên kết "Đăng nhập" ở header (đợt 2B): mang `?next=` là đường dẫn hiện tại để
 * sau khi đăng nhập người dùng quay lại đúng trang đang xem.
 *
 * Header nằm ở layout gốc và không render lại khi điều hướng, nên `next` phải
 * được tính ở phía client theo usePathname()/useSearchParams() — hai hook này
 * cần <Suspense> khi trang prerender (Cache Components). Fallback là liên kết
 * trần tới /dang-nhap: có sẵn trong HTML tĩnh (kể cả khi tắt JS), cùng kích cỡ
 * với bản có `next` nên không gây dịch bố cục khi hydrate.
 */
export function LoginNavLink({ className, children }: LoginNavLinkProps) {
  return (
    <Suspense
      fallback={
        <a href={LOGIN_PATH} aria-label="Đăng nhập" className={className}>
          {children}
        </a>
      }
    >
      <LinkWithNext className={className}>{children}</LinkWithNext>
    </Suspense>
  );
}

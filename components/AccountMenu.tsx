"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { navIconClass, navItemActiveClass, navItemClass } from "@/components/headerStyles";
import { ChevronUpIcon, CloseIcon, LogoutIcon, OrdersIcon, UserIcon } from "@/components/HeaderIcons";

interface AccountMenuProps {
  /** Họ tên hiển thị trong menu (đã có phương án dự phòng ở Header). */
  name: string;
  /** Email đăng nhập, lấy từ auth.users — null nếu không có (không kỳ vọng xảy ra). */
  email: string | null;
}

const panelItemClass =
  "flex h-[46px] w-full items-center gap-3 px-[18px] text-left text-body-sm text-ink-900 hover:bg-cham-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cham-600";
const sheetItemClass =
  "flex h-14 w-full items-center gap-3.5 px-4 text-left text-[15.5px] text-ink-900 hover:bg-cham-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cham-600";

/**
 * Đợt 2A (spec mục 6): mục "Tài khoản" khi đã đăng nhập. Nhãn luôn là "Tài
 * khoản" (không thay bằng tên người dùng — tên dài ngắn khác nhau sẽ đẩy
 * layout); tên và email nằm trong menu. Từ 768px trở lên là dropdown canh mép
 * phải theo nút; dưới 768px là sheet trượt từ đáy. Cả hai dùng chung một
 * trạng thái `open`, CSS (md:) quyết định cái nào hiện.
 *
 * Bàn phím: aria-expanded trên nút, Esc đóng, bấm ra ngoài đóng, focus quay
 * lại nút sau khi đóng. Sheet là hộp thoại modal: focus nhảy vào nút đóng
 * khi mở, Tab xoay vòng trong sheet, cuộn nền bị khoá.
 */
export function AccountMenu({ name, email }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const sheetId = `${baseId}-sheet`;

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    // Khung < 768px hiện sheet, từ 768px hiện dropdown (khớp `md:` trong CSS).
    const isSheet = !window.matchMedia("(min-width: 768px)").matches;
    let previousOverflow: string | null = null;

    if (isSheet) {
      closeButtonRef.current?.focus();
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key === "Tab" && isSheet && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    function handlePointerDown(event: PointerEvent) {
      // Sheet đã có lớp phủ tự đóng khi bấm; chỉ dropdown cần dò bấm-ra-ngoài.
      if (isSheet) return;
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      if (previousOverflow !== null) document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? `${panelId} ${sheetId}` : undefined}
        aria-label="Tài khoản"
        onClick={() => setOpen((value) => !value)}
        className={`${navItemClass} ${open ? navItemActiveClass : ""}`}
      >
        <UserIcon className={navIconClass} />
        <span className="hidden sm:inline">Tài khoản</span>
        <ChevronUpIcon className={`hidden h-3 w-3 shrink-0 text-cham-700 sm:block ${open ? "" : "rotate-180"}`} />
      </button>

      {open && (
        <>
          {/* Dropdown (từ md): nền đặc, viền, đổ bóng, z-index cao hơn CategoryNav; canh mép phải theo nút. */}
          <div
            id={panelId}
            className="absolute right-0 top-full z-50 mt-3.5 hidden w-[272px] rounded-menu border border-menu-line bg-surface py-2 shadow-menu md:block"
          >
            <div className="px-[18px] pb-3.5 pt-3">
              <p className="break-words text-[14.5px] font-semibold text-ink-900">{name}</p>
              {email && <p className="mt-0.5 break-all text-meta text-ink-400">{email}</p>}
            </div>
            <div className="h-px bg-menu-sep" />
            <Link href="/tai-khoan" prefetch={false} onClick={() => setOpen(false)} className={panelItemClass}>
              <UserIcon className="h-4 w-4 shrink-0 text-ink-400" />
              Hồ sơ của bạn
            </Link>
            <Link href="/tai-khoan/don-hang" prefetch={false} onClick={() => setOpen(false)} className={panelItemClass}>
              <OrdersIcon className="h-4 w-4 shrink-0 text-ink-400" />
              Đơn hàng của tôi
            </Link>
            <div className="my-1.5 h-px bg-menu-sep" />
            <form action={signOut}>
              <button type="submit" className={panelItemClass}>
                <LogoutIcon className="h-4 w-4 shrink-0 text-ink-400" />
                Đăng xuất
              </button>
            </form>
          </div>

          {/* Sheet (dưới md): trượt từ đáy, lớp phủ mờ, nút đóng 44×44 nằm trong tầm ngón cái. */}
          <div className="md:hidden">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Đóng menu tài khoản"
              onClick={close}
              className="overlay-enter fixed inset-0 z-50 cursor-default bg-cham-900/68"
            />
            <div
              id={sheetId}
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Tài khoản"
              className="sheet-enter fixed inset-x-0 bottom-0 z-50 rounded-t-sheet bg-surface pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2.5 shadow-sheet"
            >
              <div className="flex justify-center pb-2.5 pt-1.5">
                <div aria-hidden="true" className="h-1 w-11 rounded-[2px] bg-sheet-handle" />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-1.5">
                <div className="min-w-0">
                  <p className="break-words text-base font-semibold text-ink-900">{name}</p>
                  {email && <p className="mt-0.5 break-all text-meta text-ink-400">{email}</p>}
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Đóng"
                  onClick={close}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-field text-ink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
                >
                  <CloseIcon className="h-[18px] w-[18px]" />
                </button>
              </div>
              <div className="h-px bg-menu-sep" />
              <Link href="/tai-khoan" prefetch={false} onClick={() => setOpen(false)} className={sheetItemClass}>
                <UserIcon className="h-[19px] w-[19px] shrink-0 text-ink-400" />
                Hồ sơ của bạn
              </Link>
              <Link href="/tai-khoan/don-hang" prefetch={false} onClick={() => setOpen(false)} className={sheetItemClass}>
                <OrdersIcon className="h-[19px] w-[19px] shrink-0 text-ink-400" />
                Đơn hàng của tôi
              </Link>
              <div className="my-2 h-px bg-menu-sep" />
              <form action={signOut}>
                <button type="submit" className={sheetItemClass}>
                  <LogoutIcon className="h-[19px] w-[19px] shrink-0 text-ink-400" />
                  Đăng xuất
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

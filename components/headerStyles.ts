/**
 * Kiểu dùng chung cho các mục ở nhóm liên kết bên phải header (đợt 2A, mockup
 * header-2a.html: mỗi mục cao 44px, cách biểu tượng–chữ 8px).
 *
 * Đệm ngang là 8px, KHÔNG phải 12px như CSS trong mockup: với font thật (Be
 * Vietnam Pro 14px), đệm 12px cho nhóm 2 mục rộng 238–249px ở 1280px, vượt
 * khoảng 200–235px của tiêu chí nghiệm thu (spec 2A mục 8) — mockup tự mâu
 * thuẫn với bảng "Số đo bắt buộc" của chính nó, theo spec thì lấy số của spec.
 * Với đệm 8px: 222px (chưa đăng nhập) và 233px (đã đăng nhập).
 *
 * Để ở module thường (không "use client") vì cả Header (Server Component) lẫn
 * AccountMenu (Client Component) cùng dùng — hằng chuỗi export từ module
 * "use client" sẽ bị Next.js biến thành tham chiếu client, không còn là chuỗi.
 */
export const navItemClass =
  "pressable flex h-11 min-w-11 items-center justify-center gap-2 rounded-field px-2 text-body-sm text-ink-900 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600";

/** Mục đang chọn (menu tài khoản đang mở): nền cham-active, chữ cham-700, đậm 500. */
export const navItemActiveClass = "bg-cham-active font-medium text-cham-700";

/** Biểu tượng của mục: 20px khi chỉ còn biểu tượng (mobile), 17px khi có nhãn chữ (từ sm). */
export const navIconClass = "h-5 w-5 shrink-0 text-cham-700 sm:h-[17px] sm:w-[17px]";

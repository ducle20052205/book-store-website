/**
 * Kiểu dùng chung cho các mục ở nhóm liên kết bên phải header (đợt 2A, mockup
 * header-2a.html: mỗi mục cao 44px, đệm ngang 12px, cách biểu tượng–chữ 8px).
 *
 * Để ở module thường (không "use client") vì cả Header (Server Component) lẫn
 * AccountMenu (Client Component) cùng dùng — hằng chuỗi export từ module
 * "use client" sẽ bị Next.js biến thành tham chiếu client, không còn là chuỗi.
 */
export const navItemClass =
  "pressable flex h-11 min-w-11 items-center justify-center gap-2 rounded-field px-3 text-body-sm text-ink-900 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600";

/**
 * Bề rộng CỐ ĐỊNH (từ sm, khi đã hiện nhãn chữ) của mục tài khoản, chung cho cả
 * BA trạng thái: fallback trong lúc đọc phiên (đợt 2B.2: biểu tượng + ô chữ rỗng),
 * "Đăng nhập" và "Tài khoản ▾". Bố cục trong hộp cũng giống hệt nhau (căn từ
 * trái, ô chữ rộng cố định, chừa chỗ cho mũi tên) để biểu tượng không dịch chỗ
 * khi fallback được thay bằng nội dung thật (NFR-3.6: CLS = 0).
 *
 * 149px = đệm 12 + biểu tượng 17 + cách 8 + ô chữ 80 + cách 8 + mũi tên 12 + đệm 12.
 * Dưới sm nhãn và mũi tên ẩn, hộp chỉ còn biểu tượng (`min-w-11` của navItemClass).
 */
export const navAccountWidthClass = "sm:w-[149px] sm:justify-start";

/**
 * Ô chữ của mục tài khoản: rộng cố định 80px, chữ dài hơn thì cắt bằng dấu ba
 * chấm. Đo ngày 01/10/2026 (Be Vietnam Pro, 1280px): "Đăng nhập" 74,9px,
 * "Tài khoản" 66,0px — chuỗi dài hơn là "Đăng nhập", không phải "Tài khoản".
 */
export const navAccountLabelClass = "hidden shrink-0 truncate sm:inline-block sm:w-[80px]";

/**
 * Hộp của fallback (đợt 2B.2): cùng kích thước và bố cục với trạng thái thật
 * nhưng KHÔNG tương tác — không hover, không `pressable`, không focus ring.
 */
export const navFallbackClass = `flex h-11 min-w-11 items-center justify-center gap-2 rounded-field px-3 ${navAccountWidthClass}`;

/** Mục đang chọn (menu tài khoản đang mở): nền cham-active, chữ cham-700, đậm 500. */
export const navItemActiveClass = "bg-cham-active font-medium text-cham-700";

/** Biểu tượng của mục: 20px khi chỉ còn biểu tượng (mobile), 17px khi có nhãn chữ (từ sm). */
export const navIconClass = "h-5 w-5 shrink-0 text-cham-700 sm:h-[17px] sm:w-[17px]";

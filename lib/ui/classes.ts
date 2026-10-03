/**
 * Chuỗi class của hệ layout đóng băng (docs/trang-quyet-dinh-dac-ta-tong.md mục 3), dùng cho mã MỚI của
 * đợt 4. Các bản sao cũ ở app/gio-hang, components/checkout, components/PurchasePanel và trang xác nhận
 * vẫn đứng nguyên (spec đợt 4 mục 0: hợp nhất chúng ngoài phạm vi). Giữ chuỗi giống hệt bản ở
 * app/gio-hang/page.tsx để HTML của trạng thái trống không đổi khi tách (TC-17).
 */
export const cardClass = "rounded-menu border border-line-warm bg-surface";

export const primaryButtonClass =
  "pressable inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-field bg-cham-700 px-6 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-field disabled:text-ink-400 disabled:hover:bg-field";

export const secondaryButtonClass =
  "pressable inline-flex h-12 items-center justify-center whitespace-nowrap rounded-field border border-cham-700 bg-surface px-6 text-button font-medium text-cham-700 hover:bg-cham-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2";

/** Ô nhập một dòng của hệ layout đóng băng (chuyển từ `components/AuthFields.tsx` ở đợt 5A để Server Component dùng được: export từ module "use client" không phải chuỗi). Viền do nơi dùng đặt. */
export const inputClass =
  "h-12 w-full rounded-field border bg-surface px-3.5 text-base text-ink-900 md:h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 disabled:opacity-60";

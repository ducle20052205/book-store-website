export interface CategoryColorClasses {
  bg: string;
  text: string;
}

/**
 * E1.5 mục 2: màu riêng theo 5 danh mục cha (token khai báo ở app/globals.css,
 * mục --color-cat-*). Viết class Tailwind thành chuỗi trực tiếp (không ghép
 * động dạng `bg-cat-${slug}`) vì Tailwind quét mã nguồn theo chữ — ghép
 * chuỗi động sẽ không được nhận diện, sinh ra không có CSS. Cùng cách
 * COVER_COLORS xử lý trong components/BookCover.tsx.
 */
const CATEGORY_COLORS: Record<string, CategoryColorClasses> = {
  "van-hoc": { bg: "bg-cat-van-hoc", text: "text-cat-van-hoc" },
  "kinh-te": { bg: "bg-cat-kinh-te", text: "text-cat-kinh-te" },
  "tam-ly-ky-nang": { bg: "bg-cat-tam-ly-ky-nang", text: "text-cat-tam-ly-ky-nang" },
  "khoa-hoc-xa-hoi": { bg: "bg-cat-khoa-hoc-xa-hoi", text: "text-cat-khoa-hoc-xa-hoi" },
  "manga-light-novel": { bg: "bg-cat-manga-light-novel", text: "text-cat-manga-light-novel" },
};

const FALLBACK_COLOR: CategoryColorClasses = { bg: "bg-cham-700", text: "text-cham-700" };

/** Dùng cho thẻ danh mục ở trang chủ và dải màu dưới H1 trang /sach. slug không khớp (hoặc rỗng) trả về màu chàm thương hiệu. */
export function categoryColorClasses(slug: string | undefined | null): CategoryColorClasses {
  if (!slug) return FALLBACK_COLOR;
  return CATEGORY_COLORS[slug] ?? FALLBACK_COLOR;
}

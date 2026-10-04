/**
 * Slug của sách (đợt 5B, spec FR-5B.4). Hàm thuần, không import gì: dùng cho phần xem trước ở client, kiểm ở
 * Server Action và bộ đo — MỘT bản duy nhất.
 *
 * `slugify`: NFKD → bỏ mọi dấu kết hợp (`\p{M}`) → `đ`/`Đ` thành `d` bằng phép thay RIÊNG (hai chữ này không phân
 * rã theo Unicode) → viết thường → mỗi dãy ký tự ngoài `[a-z0-9]` thành một dấu `-` (dấu gạch dài "–", dấu hai
 * chấm, dấu phẩy… đều thành một dấu nối; nhiều dấu nối liền nhau gộp thành một) → cắt `-` hai đầu → cắt còn tối
 * đa `SLUG_MAX_LENGTH` ký tự rồi cắt lại `-` ở cuối. Đo khi viết spec: tái tạo đúng 40/40 slug của 40 cuốn hiện có.
 */
export const SLUG_MAX_LENGTH = 120;

/** Cùng biểu thức với CHECK `books_slug_format_check` ở database (cộng độ dài ≤ 120). */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Slug giữ chỗ: `/admin/sach/moi` là route tĩnh nên thắng route động `[slug]`; sách có slug `moi` sẽ không mở
 * được trang sửa. Chỉ kiểm ở app (không ở database), spec mục 7.1.
 */
export const RESERVED_SLUGS: readonly string[] = ["moi"];

export function slugify(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, SLUG_MAX_LENGTH).replace(/-+$/g, "");
}

/** Lỗi của một slug do admin nhập hoặc do `slugify` sinh ra; `null` nghĩa là hợp lệ về mặt luật (chưa biết có trùng không). */
export function slugError(slug: string): string | null {
  if (slug.length === 0) return "Bạn nhập địa chỉ trang nhé (chữ thường không dấu, số và dấu gạch ngang).";
  if (slug.length > SLUG_MAX_LENGTH) return `Địa chỉ trang tối đa ${SLUG_MAX_LENGTH} ký tự.`;
  if (!SLUG_PATTERN.test(slug)) {
    return "Địa chỉ trang chỉ gồm chữ thường không dấu, số và dấu gạch ngang; không bắt đầu hay kết thúc bằng dấu gạch ngang.";
  }
  if (RESERVED_SLUGS.includes(slug)) return `Địa chỉ “${slug}” dành riêng cho trang thêm sách, bạn chọn địa chỉ khác nhé.`;
  return null;
}

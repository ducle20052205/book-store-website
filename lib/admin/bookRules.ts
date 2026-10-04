import { slugError, slugify } from "./slug";

/**
 * Luật kiểm tra form sách của admin (đợt 5B, spec FR-5B.2, FR-5B.6) dùng chung cho form
 * (components/admin/BookForm.tsx) và Server Action (app/actions/admin-books.ts) — MỘT bản duy nhất, như
 * lib/checkoutRules.ts và lib/authRules.ts, để hai nơi không lệch nhau. Lớp cuối cùng là các CHECK, NOT NULL,
 * UNIQUE và khoá ngoại của bảng `books` (migration `20261004090859_books_constraints`).
 *
 * Chỉ import `./slug` (cũng là hàm thuần); dùng được cả ở client lẫn server. Các giới hạn dưới đây là quyết
 * định của spec (mục 2 và 11), chỉ ở app: database chỉ ép những gì ghi ở spec mục 4.
 *
 * Form có 15 trường — mọi cột của `books` trừ `id` và `created_at` (database sinh) và `cover_image_url` (bìa
 * luôn do BookCover sinh tự động, spec FR-2.8 và FR-5B.2): không có trường ảnh nào.
 */
export const BOOK_FIELDS = [
  "title",
  "slug",
  "author",
  "translator",
  "categoryId",
  "price",
  "discountPrice",
  "stockQuantity",
  "publisher",
  "publishDate",
  "isbn",
  "pageCount",
  "dimensions",
  "description",
  "tableOfContents",
] as const;

export type BookField = (typeof BOOK_FIELDS)[number];
/** Giá trị người dùng nhập, nguyên dạng chuỗi (chưa chuẩn hoá). */
export type BookInput = Record<BookField, string>;
export type BookErrors = Partial<Record<BookField, string>>;

export const BOOK_FIELD_LABELS: Record<BookField, string> = {
  title: "Tên sách",
  slug: "Địa chỉ trang",
  author: "Tác giả",
  translator: "Người dịch",
  categoryId: "Danh mục",
  price: "Giá",
  discountPrice: "Giá giảm",
  stockQuantity: "Tồn kho",
  publisher: "Nhà xuất bản",
  publishDate: "Ngày xuất bản",
  isbn: "ISBN",
  pageCount: "Số trang",
  dimensions: "Kích thước",
  description: "Mô tả",
  tableOfContents: "Mục lục",
};

export const TITLE_MAX = 200;
export const AUTHOR_MAX = 200;
export const TRANSLATOR_MAX = 200;
export const PUBLISHER_MAX = 200;
export const DESCRIPTION_MAX = 5000;
export const TABLE_OF_CONTENTS_MAX = 5000;
export const DIMENSIONS_MAX = 50;
export const PRICE_MAX = 100_000_000;
export const STOCK_MAX = 100_000;
export const PAGE_COUNT_MAX = 10_000;
const DATE_MIN_YEAR = 1900;
const DATE_MAX_YEAR = 2100;

/** Tên cột của bảng `books` ứng với mỗi trường (không có `cover_image_url`, `id`, `created_at`). */
export const BOOK_COLUMNS: Record<BookField, string> = {
  title: "title",
  slug: "slug",
  author: "author",
  translator: "translator",
  categoryId: "category_id",
  price: "price",
  discountPrice: "discount_price",
  stockQuantity: "stock_quantity",
  publisher: "publisher",
  publishDate: "publish_date",
  isbn: "isbn",
  pageCount: "page_count",
  dimensions: "dimensions",
  description: "description",
  tableOfContents: "table_of_contents",
};

/** Giá trị đã chuẩn hoá, đúng kiểu cột để ghi vào `books`. Trường tuỳ chọn để trống là `null`, không phải chuỗi rỗng. */
export interface BookValue {
  title: string;
  slug: string;
  author: string;
  translator: string | null;
  category_id: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  publisher: string | null;
  publish_date: string | null;
  isbn: string | null;
  page_count: number | null;
  dimensions: string | null;
  description: string | null;
  table_of_contents: string | null;
}

export const emptyBookInput = (): BookInput => ({
  title: "",
  slug: "",
  author: "",
  translator: "",
  categoryId: "",
  price: "",
  discountPrice: "",
  stockQuantity: "0",
  publisher: "",
  publishDate: "",
  isbn: "",
  pageCount: "",
  dimensions: "",
  description: "",
  tableOfContents: "",
});

/** Số nguyên không âm; chấp nhận dấu chấm ngăn nghìn kiểu Việt Nam ("89.000"). Không có thì `null`. */
export function parseWholeNumber(text: string): number | null {
  const t = text.trim();
  if (/^\d+$/.test(t) || /^\d{1,3}(\.\d{3})+$/.test(t)) {
    const n = Number(t.replace(/\./g, ""));
    return Number.isSafeInteger(n) ? n : null;
  }
  return null;
}

/** "89000" → "89.000" (hiển thị trong ô giá khi điền sẵn). */
export function formatWholeNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** dd/mm/yyyy hoặc yyyy-mm-dd, phải là ngày có thật trong [1900, 2100]. Trả `yyyy-mm-dd`, hoặc `null` nếu sai. */
export function parseBookDate(text: string): string | null {
  const t = text.trim();
  let y: number, m: number, d: number;
  let match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (match) {
    d = Number(match[1]);
    m = Number(match[2]);
    y = Number(match[3]);
  } else {
    match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (!match) return null;
    y = Number(match[1]);
    m = Number(match[2]);
    d = Number(match[3]);
  }
  if (y < DATE_MIN_YEAR || y > DATE_MAX_YEAR) return null;
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** "2026-10-04" → "04/10/2026" (hiển thị trong ô ngày khi điền sẵn). */
export function formatBookDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** ISBN: trống, hoặc 10 hay 13 chữ số (cho phép gạch ngang và khoảng trắng; chữ cuối ISBN-10 được là X). Không kiểm số kiểm. */
export function normalizeIsbn(text: string): string | null {
  const t = text.replace(/[-\s]/g, "");
  if (/^\d{13}$/.test(t) || /^\d{9}[\dXx]$/.test(t)) return t.toUpperCase();
  return null;
}

const optional = (text: string): string | null => {
  const t = text.trim();
  return t === "" ? null : t;
};

function tooLong(text: string, max: number): boolean {
  return Array.from(text).length > max;
}

/**
 * Kiểm toàn bộ form. `childCategoryIds` (khi có) là tập id của 17 danh mục CON: danh mục cha hay id lạ bị từ
 * chối ở ô danh mục. Trả `value` khác `null` khi và chỉ khi không có lỗi nào.
 */
export function validateBook(input: BookInput, ctx: { childCategoryIds?: ReadonlySet<string> } = {}): { errors: BookErrors; value: BookValue | null } {
  const errors: BookErrors = {};

  const title = input.title.trim();
  if (title === "") errors.title = "Bạn nhập tên sách nhé.";
  else if (tooLong(title, TITLE_MAX)) errors.title = `Tên sách tối đa ${TITLE_MAX} ký tự.`;

  const slug = input.slug.trim();
  const slugProblem = slugError(slug);
  if (slugProblem) errors.slug = slugProblem;
  // Tên chỉ có dấu câu thì không sinh được địa chỉ trang (FR-5B.4): báo cạnh ô tên, và ô địa chỉ trang ở trên đã báo thiếu.
  if (!errors.title && slug === "" && slugify(title) === "") errors.title = "Tên sách cần có ít nhất một chữ hoặc số để sinh địa chỉ trang. Bạn thêm chữ vào tên, hoặc tự nhập địa chỉ trang nhé.";

  const author = input.author.trim();
  if (author === "") errors.author = "Bạn nhập tên tác giả nhé.";
  else if (tooLong(author, AUTHOR_MAX)) errors.author = `Tên tác giả tối đa ${AUTHOR_MAX} ký tự.`;

  const categoryId = input.categoryId.trim();
  if (categoryId === "") errors.categoryId = "Bạn chọn một danh mục con nhé.";
  else if (ctx.childCategoryIds && !ctx.childCategoryIds.has(categoryId)) errors.categoryId = "Chỉ chọn được danh mục con.";

  const price = parseWholeNumber(input.price);
  if (input.price.trim() === "") errors.price = "Bạn nhập giá sách nhé.";
  else if (price === null || price < 1 || price > PRICE_MAX) errors.price = "Giá là số nguyên đồng, từ 1 đến 100.000.000.";

  let discount: number | null = null;
  if (input.discountPrice.trim() !== "") {
    const parsed = parseWholeNumber(input.discountPrice);
    if (parsed === null || parsed < 1) errors.discountPrice = "Giá giảm là số nguyên đồng, nhỏ hơn giá.";
    else if (price !== null && !errors.price && parsed >= price) errors.discountPrice = "Giá giảm phải nhỏ hơn giá.";
    else discount = parsed;
  }

  const stock = input.stockQuantity.trim() === "" ? 0 : parseWholeNumber(input.stockQuantity);
  if (stock === null || stock > STOCK_MAX) errors.stockQuantity = "Tồn kho là số nguyên từ 0 đến 100.000.";

  const translator = optional(input.translator);
  if (translator && tooLong(translator, TRANSLATOR_MAX)) errors.translator = `Tên người dịch tối đa ${TRANSLATOR_MAX} ký tự.`;

  const publisher = optional(input.publisher);
  if (publisher && tooLong(publisher, PUBLISHER_MAX)) errors.publisher = `Tên nhà xuất bản tối đa ${PUBLISHER_MAX} ký tự.`;

  let publishDate: string | null = null;
  if (input.publishDate.trim() !== "") {
    publishDate = parseBookDate(input.publishDate);
    if (publishDate === null) errors.publishDate = "Ngày xuất bản theo dạng dd/mm/yyyy, từ năm 1900 đến 2100.";
  }

  let isbn: string | null = null;
  if (input.isbn.trim() !== "") {
    isbn = normalizeIsbn(input.isbn);
    if (isbn === null) errors.isbn = "ISBN gồm 10 hoặc 13 chữ số (chữ cuối của ISBN-10 được là X).";
  }

  let pageCount: number | null = null;
  if (input.pageCount.trim() !== "") {
    pageCount = parseWholeNumber(input.pageCount);
    if (pageCount === null || pageCount < 1 || pageCount > PAGE_COUNT_MAX) errors.pageCount = "Số trang là số nguyên từ 1 đến 10.000.";
  }

  const dimensions = optional(input.dimensions);
  if (dimensions && tooLong(dimensions, DIMENSIONS_MAX)) errors.dimensions = `Kích thước tối đa ${DIMENSIONS_MAX} ký tự.`;

  const description = optional(input.description);
  if (description && tooLong(description, DESCRIPTION_MAX)) errors.description = `Mô tả tối đa ${DESCRIPTION_MAX} ký tự.`;

  const tableOfContents = optional(input.tableOfContents);
  if (tableOfContents && tooLong(tableOfContents, TABLE_OF_CONTENTS_MAX)) errors.tableOfContents = `Mục lục tối đa ${TABLE_OF_CONTENTS_MAX} ký tự.`;

  if (Object.keys(errors).length > 0 || price === null || stock === null) return { errors, value: null };

  return {
    errors,
    value: {
      title,
      slug,
      author,
      translator,
      category_id: categoryId,
      price,
      discount_price: discount,
      stock_quantity: stock,
      publisher,
      publish_date: publishDate,
      isbn,
      page_count: pageCount,
      dimensions,
      description,
      table_of_contents: tableOfContents,
    },
  };
}

/** Trường lỗi đầu tiên theo thứ tự hiển thị của form (để đưa focus vào ô đó). */
export function firstErrorField(errors: BookErrors): BookField | null {
  return BOOK_FIELDS.find((field) => errors[field]) ?? null;
}

import { BOOK_COLUMNS, BOOK_FIELD_LABELS, type BookErrors, type BookField, type BookInput, formatBookDate, formatWholeNumber } from "@/lib/admin/bookRules";
import { SLUG_MAX_LENGTH } from "@/lib/admin/slug";
import { createClient } from "@/lib/supabase/server";

/**
 * Truy vấn và dịch lỗi database của khu quản lý sách (đợt 5B, spec FR-5B.3, FR-5B.5, FR-5B.6). Mọi truy vấn dùng
 * client của PHIÊN admin (RLS `books_admin_*`, `order_items_select_own_or_admin`), không dùng khoá secret; nơi
 * gọi phải đã qua `requireAdmin()` hay `checkAdmin()`. KHÔNG dùng hàm `use cache` nào của `lib/queries.ts` cho
 * dữ liệu sách: trang admin phải thấy ngay sau mỗi lần ghi (spec mục 1).
 */

const BOOK_SELECT = "id, title, slug, author, translator, publisher, description, table_of_contents, price, discount_price, isbn, page_count, dimensions, publish_date, stock_quantity, category_id";

interface BookRow {
  id: string;
  title: string;
  slug: string;
  author: string;
  translator: string | null;
  publisher: string | null;
  description: string | null;
  table_of_contents: string | null;
  price: number;
  discount_price: number | null;
  isbn: string | null;
  page_count: number | null;
  dimensions: string | null;
  publish_date: string | null;
  stock_quantity: number;
  category_id: string;
}

export interface AdminBook {
  id: string;
  title: string;
  slug: string;
  stockQuantity: number;
  /** Giá trị điền sẵn vào form (chuỗi, đúng dạng người dùng nhập). */
  input: BookInput;
}

/** Một sách theo slug cho trang sửa; `null` khi slug sai định dạng hoặc không có sách. Không đọc `cover_image_url`. */
export async function getAdminBook(rawSlug: string): Promise<AdminBook | null> {
  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    return null;
  }
  if (slug.length === 0 || slug.length > SLUG_MAX_LENGTH) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("books").select(BOOK_SELECT).eq("slug", slug).maybeSingle();
  if (!data) return null;
  const row = data as unknown as BookRow;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    stockQuantity: row.stock_quantity,
    input: {
      title: row.title,
      slug: row.slug,
      author: row.author,
      translator: row.translator ?? "",
      categoryId: row.category_id,
      price: formatWholeNumber(row.price),
      discountPrice: row.discount_price === null ? "" : formatWholeNumber(row.discount_price),
      stockQuantity: String(row.stock_quantity),
      publisher: row.publisher ?? "",
      publishDate: row.publish_date ? formatBookDate(row.publish_date) : "",
      isbn: row.isbn ?? "",
      pageCount: row.page_count === null ? "" : String(row.page_count),
      dimensions: row.dimensions ?? "",
      description: row.description ?? "",
      tableOfContents: row.table_of_contents ?? "",
    },
  };
}

/** Tập id của các danh mục CON (`parent_id` khác NULL), đọc thẳng từ database: kiểm ở Server Action. */
export async function getChildCategoryIds(): Promise<Set<string> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id").not("parent_id", "is", null);
  if (error || !data) return null;
  return new Set(data.map((row) => row.id as string));
}

export interface BookOrderCounts {
  /** Số đơn khác nhau đang chứa sách (mọi trạng thái, kể cả đã hủy). */
  orderCount: number;
  cancelledCount: number;
}

/** Số đơn chứa sách. `null` khi truy vấn lỗi (nơi gọi KHÔNG được coi là "0 đơn": đóng khi nghi ngờ). */
export async function countOrdersContaining(bookId: string): Promise<BookOrderCounts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("order_items").select("order_id, orders!inner(status)").eq("book_id", bookId);
  if (error || !data) return null;
  const status = new Map<string, string>();
  for (const row of data as unknown as { order_id: string; orders: { status: string } | { status: string }[] }[]) {
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    status.set(row.order_id, order?.status ?? "");
  }
  return { orderCount: status.size, cancelledCount: [...status.values()].filter((s) => s === "cancelled").length };
}

/** Số tủ sách đang chứa sách (`collection_books` đọc công khai được). `null` khi lỗi. */
export async function countCollectionsContaining(bookId: string): Promise<number | null> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("collection_books").select("collection_id", { count: "exact", head: true }).eq("book_id", bookId);
  if (error) return null;
  return count ?? 0;
}

export type BookDbError =
  | { kind: "field"; field: BookField; message: string }
  | { kind: "ordered" }
  | { kind: "unknown" };

const COLUMN_TO_FIELD = Object.fromEntries(Object.entries(BOOK_COLUMNS).map(([field, column]) => [column, field])) as Record<string, BookField>;

export const SLUG_TAKEN_MESSAGE = "Địa chỉ này đã có sách khác dùng. Bạn đổi lại một chút nhé.";

/**
 * Dịch lỗi của PostgREST/Postgres thành lỗi theo ô (đọc `code` và TÊN RÀNG BUỘC trong thông điệp). Lỗi không
 * nhận ra là `unknown` — nơi gọi hiện câu chung, KHÔNG lộ thông điệp SQL ra giao diện.
 */
export function mapBookDbError(error: { code?: string; message?: string }): BookDbError {
  const message = error.message ?? "";
  const constraint = /constraint "([^"]+)"/.exec(message)?.[1] ?? null;
  const column = /column "([^"]+)"/.exec(message)?.[1] ?? null;

  if (error.code === "23505" && constraint === "books_slug_key") return { kind: "field", field: "slug", message: SLUG_TAKEN_MESSAGE };
  if (error.code === "23514") {
    if (constraint === "books_price_check") return { kind: "field", field: "price", message: "Giá là số nguyên đồng, từ 1 đến 100.000.000." };
    if (constraint === "books_discount_price_check") return { kind: "field", field: "discountPrice", message: "Giá giảm phải nhỏ hơn giá." };
    if (constraint === "books_stock_quantity_check") return { kind: "field", field: "stockQuantity", message: "Tồn kho là số nguyên từ 0 đến 100.000." };
    if (constraint === "books_slug_format_check") return { kind: "field", field: "slug", message: "Địa chỉ trang chỉ gồm chữ thường không dấu, số và dấu gạch ngang; không bắt đầu hay kết thúc bằng dấu gạch ngang." };
  }
  if (error.code === "23502" && column && COLUMN_TO_FIELD[column]) {
    const field = COLUMN_TO_FIELD[column];
    return { kind: "field", field, message: `${BOOK_FIELD_LABELS[field]} chưa có giá trị.` };
  }
  if (error.code === "23503") {
    if (constraint === "books_category_id_fkey") return { kind: "field", field: "categoryId", message: "Danh mục này không còn tồn tại, bạn chọn lại nhé." };
    if (constraint === "order_items_book_id_fkey") return { kind: "ordered" };
  }
  return { kind: "unknown" };
}

export const GENERIC_FORM_ERROR = "Chúng mình chưa lưu được cuốn sách này. Bạn thử lại sau ít phút nhé.";

/** Gom một lỗi theo ô thành `BookErrors`. */
export const errorsOf = (field: BookField, message: string): BookErrors => ({ [field]: message });

"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { BOOK_FIELDS, type BookErrors, type BookInput, validateBook } from "@/lib/admin/bookRules";
import { countOrdersContaining, getChildCategoryIds, mapBookDbError } from "@/lib/admin/books";
import { checkAdmin } from "@/lib/admin/requireAdmin";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action ghi sách của admin (đợt 5B, spec FR-5B.2 → FR-5B.7).
 *
 * - `checkAdmin()` TRƯỚC HẾT ở MỌI action (Server Action là điểm vào riêng, không thừa hưởng việc kiểm của page,
 *   spec FR-5A.1): khách và người chưa đăng nhập bị từ chối và database không đổi. Kết quả có kiểu thay vì ném
 *   lỗi, để giao diện hiện dải báo.
 * - Dùng client của PHIÊN admin (RLS `books_admin_insert/update/delete`), không dùng khoá secret.
 * - Kiểm lại bằng CHÍNH module luật của form (`lib/admin/bookRules.ts`) trước khi chạm database; database là
 *   bên quyết định cuối cùng (CHECK, NOT NULL, UNIQUE và khoá ngoại), lỗi của nó được dịch thành lỗi theo ô.
 * - `updateTag` với thẻ `books` SAU KHI database xác nhận ghi thành công (không bao giờ ở nhánh lỗi): làm hết hạn NGAY
 *   chín hàm đọc `books` có thẻ trong `lib/queries.ts`, để trang chủ và trang tủ sách hiện dữ liệu mới ở lượt xem
 *   kế tiếp của mọi người (spec FR-5B.7). Không `revalidateTag(…, "max")` (stale-while-revalidate vẫn trả bản
 *   cũ ở lượt kế), không `refresh()` một mình (chỉ làm mới client router, không đụng dữ liệu có thẻ).
 * - Thành công của thêm, sửa, xoá kết thúc bằng `redirect()` đặt SAU `updateTag` (tài liệu Next: mã sau
 *   `redirect` không chạy); lời gọi ở client bị từ chối bằng lỗi NEXT_REDIRECT mà router tự xử lý
 *   (`lib/nextRedirect.ts`). Thêm và sửa không dùng `router.replace` vì sau khi đổi slug, bản làm mới của trang
 *   cũ sẽ là "không tìm thấy".
 * - Sách được nhận diện bằng `id` (uuid, không đổi), không bằng slug, để đổi slug được. Không có cột
 *   `cover_image_url` trong bất kỳ câu lệnh nào (bìa do BookCover sinh).
 *
 * Log: chỉ tên action, mã lỗi và tên ràng buộc; không bao giờ ghi nội dung sách.
 */
export type BookActionResult =
  | { ok: false; kind: "invalid"; errors: BookErrors }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "signed_out" }
  | { ok: false; kind: "forbidden" }
  | { ok: false; kind: "unknown" };

export type DeleteBookResult =
  | { ok: false; kind: "ordered"; orderCount: number; cancelledCount: number }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "signed_out" }
  | { ok: false; kind: "forbidden" }
  | { ok: false; kind: "unknown" };

export type StockZeroResult =
  | { ok: true }
  | { ok: false; kind: "not_found" }
  | { ok: false; kind: "signed_out" }
  | { ok: false; kind: "forbidden" }
  | { ok: false; kind: "unknown" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Dữ liệu từ client là KHÔNG tin cậy: chỉ lấy đúng 15 trường, mỗi trường phải là chuỗi (còn lại thành chuỗi rỗng). */
function toBookInput(raw: unknown): BookInput {
  const source = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(BOOK_FIELDS.map((field) => [field, typeof source[field] === "string" ? (source[field] as string) : ""])) as BookInput;
}

function denied(reason: "signed_out" | "not_admin"): { ok: false; kind: "signed_out" | "forbidden" } {
  return { ok: false, kind: reason === "signed_out" ? "signed_out" : "forbidden" };
}

function dbFailure(action: string, error: { code?: string; message?: string }): BookActionResult {
  const mapped = mapBookDbError(error);
  if (mapped.kind === "field") return { ok: false, kind: "invalid", errors: { [mapped.field]: mapped.message } };
  const constraint = /constraint "([^"]+)"/.exec(error.message ?? "")?.[1] ?? "?";
  console.error(`[${action}] ${error.code ?? "?"} ${constraint}`);
  return { ok: false, kind: "unknown" };
}

export async function createBook(raw: unknown): Promise<BookActionResult> {
  const admin = await checkAdmin();
  if (!admin.ok) return denied(admin.reason);

  const childIds = await getChildCategoryIds();
  if (!childIds) return { ok: false, kind: "unknown" };
  const { errors, value } = validateBook(toBookInput(raw), { childCategoryIds: childIds });
  if (!value) return { ok: false, kind: "invalid", errors };

  const supabase = await createClient();
  const { data, error } = await supabase.from("books").insert(value).select("slug").single();
  if (error || !data) return dbFailure("createBook", error ?? {});

  updateTag("books");
  redirect(`/admin/sach/${encodeURIComponent(data.slug as string)}?ket-qua=them`);
}

export async function updateBook(id: string, raw: unknown): Promise<BookActionResult> {
  const admin = await checkAdmin();
  if (!admin.ok) return denied(admin.reason);
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, kind: "not_found" };

  const childIds = await getChildCategoryIds();
  if (!childIds) return { ok: false, kind: "unknown" };
  const { errors, value } = validateBook(toBookInput(raw), { childCategoryIds: childIds });
  if (!value) return { ok: false, kind: "invalid", errors };

  const supabase = await createClient();
  const { data, error } = await supabase.from("books").update(value).eq("id", id).select("slug");
  if (error) return dbFailure("updateBook", error);
  if (!data || data.length !== 1) return { ok: false, kind: "not_found" };

  updateTag("books");
  redirect(`/admin/sach/${encodeURIComponent(data[0].slug as string)}?ket-qua=luu`);
}

/**
 * Xoá sách. Sách đã nằm trong BẤT KỲ dòng `order_items` nào thì KHÔNG xoá: trả `ordered` kèm số đơn. Đếm trước để
 * giao diện nói được số đơn; nhưng người quyết định là khoá ngoại `order_items_book_id_fkey` (NO ACTION) của
 * database: nếu giữa lúc đếm và lúc xoá có đơn mới, `DELETE` bị `23503` và hàm này đếm lại rồi báo `ordered` với
 * số mới, không báo lỗi chung.
 */
export async function deleteBook(id: string): Promise<DeleteBookResult> {
  const admin = await checkAdmin();
  if (!admin.ok) return denied(admin.reason);
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, kind: "not_found" };

  const supabase = await createClient();
  const { data: book, error: readError } = await supabase.from("books").select("title").eq("id", id).maybeSingle();
  if (readError) return { ok: false, kind: "unknown" };
  if (!book) return { ok: false, kind: "not_found" };

  const before = await countOrdersContaining(id);
  if (!before) return { ok: false, kind: "unknown" };
  if (before.orderCount > 0) return { ok: false, kind: "ordered", ...before };

  const { data, error } = await supabase.from("books").delete().eq("id", id).select("id");
  if (error) {
    if (mapBookDbError(error).kind === "ordered") {
      const after = await countOrdersContaining(id);
      if (!after || after.orderCount === 0) return { ok: false, kind: "unknown" };
      return { ok: false, kind: "ordered", ...after };
    }
    console.error(`[deleteBook] ${error.code ?? "?"} ${/constraint "([^"]+)"/.exec(error.message ?? "")?.[1] ?? "?"}`);
    return { ok: false, kind: "unknown" };
  }
  if (!data || data.length !== 1) return { ok: false, kind: "not_found" };

  updateTag("books");
  redirect(`/admin/sach?ket-qua=xoa&ten=${encodeURIComponent(String(book.title).slice(0, 200))}`);
}

/** Gợi ý thay cho xoá: đặt `stock_quantity = 0` để cuốn hiện "Hết hàng" (FR-5B.5). Đảo lại được bằng cách sửa tồn kho. */
export async function setBookOutOfStock(id: string): Promise<StockZeroResult> {
  const admin = await checkAdmin();
  if (!admin.ok) return denied(admin.reason);
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, kind: "not_found" };

  const supabase = await createClient();
  const { data, error } = await supabase.from("books").update({ stock_quantity: 0 }).eq("id", id).select("id");
  if (error) {
    console.error(`[setBookOutOfStock] ${error.code ?? "?"} ${/constraint "([^"]+)"/.exec(error.message ?? "")?.[1] ?? "?"}`);
    return { ok: false, kind: "unknown" };
  }
  if (!data || data.length !== 1) return { ok: false, kind: "not_found" };

  updateTag("books");
  // Trang sửa đang mở nhận tồn kho mới (ô tồn kho của form, trạng thái nút "Đang là 0"): updateTag làm mới dữ liệu có thẻ, refresh() làm mới chính trang admin.
  refresh();
  return { ok: true };
}

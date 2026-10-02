import type { SupabaseClient } from "@supabase/supabase-js";
import { clearGuestCart, MAX_LINE_QUANTITY, readGuestCart } from "@/lib/cart/cookie";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Gộp giỏ của khách vào giỏ của tài khoản (đợt 3A, spec FR-3A.5, SRS FR-3.4).
 *
 * Chạy phía server, BÊN TRONG `signIn` / `signUp` ngay sau khi có phiên và TRƯỚC
 * `redirect()`. Mỗi dòng trong cookie `na_cart`: `book_id` đã có trong `cart_items`
 * thì cộng dồn `quantity`, chưa có thì chèn dòng mới. Số lượng sau gộp bị chặn ở
 * min(tồn kho, MAX_LINE_QUANTITY) (FR-3.6); sách không còn tồn tại thì bỏ qua; sách
 * hết hàng (tồn kho 0) vẫn được giữ trong giỏ để trang giỏ gắn nhãn "Hết hàng".
 *
 * Xong thì xoá cookie `na_cart` trong cùng response. Lỗi khi ghi thì ném ra và
 * KHÔNG xoá cookie, để không mất giỏ của khách; nơi gọi bắt lỗi và vẫn cho người
 * dùng vào tài khoản.
 */
export async function mergeGuestCart(supabase: SupabaseClient, userId: string): Promise<void> {
  const { lines } = await readGuestCart();

  if (lines.length > 0) {
    const ids = lines.map((line) => line.b);

    const { data: bookRows } = await createPublicClient().from("books").select("id, stock_quantity").in("id", ids);
    const stockById = new Map(
      ((bookRows ?? []) as { id: string; stock_quantity: number | null }[]).map((row) => [row.id, row.stock_quantity ?? 0]),
    );

    const { data: existingRows, error: readError } = await supabase
      .from("cart_items")
      .select("book_id, quantity")
      .in("book_id", ids);
    if (readError) throw new Error(`đọc cart_items thất bại: ${readError.message}`);
    const existingById = new Map(((existingRows ?? []) as { book_id: string; quantity: number }[]).map((row) => [row.book_id, row.quantity]));

    const rows: { user_id: string; book_id: string; quantity: number }[] = [];
    for (const line of lines) {
      const stock = stockById.get(line.b);
      if (stock === undefined) continue;
      const total = (existingById.get(line.b) ?? 0) + line.q;
      const quantity = stock > 0 ? Math.min(total, stock, MAX_LINE_QUANTITY) : Math.min(total, MAX_LINE_QUANTITY);
      rows.push({ user_id: userId, book_id: line.b, quantity });
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("cart_items").upsert(rows, { onConflict: "user_id,book_id" });
      if (error) throw new Error(`ghi cart_items thất bại: ${error.message}`);
    }
  }

  await clearGuestCart();
}

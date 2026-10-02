"use server";

import { refresh } from "next/cache";
import {
  type CartLine,
  clearGuestCart,
  isUuid,
  MAX_CART_LINES,
  MAX_LINE_QUANTITY,
  readGuestCart,
  writeGuestCart,
} from "@/lib/cart/cookie";
import { getCartSession } from "@/lib/cart/session";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Ba Server Action của giỏ hàng (đợt 3A, spec FR-3A.2, FR-3A.3, FR-3A.8) — đường
 * DUY NHẤT sửa giỏ. Phân nhánh theo phiên: người đã đăng nhập thì ghi bảng
 * `cart_items` (RLS: chỉ dòng của chính mình), khách thì ghi cookie `na_cart`.
 *
 * Số lượng luôn bị chặn ở server theo `stock_quantity` tại thời điểm thao tác,
 * không tin số client gửi. Vượt tồn thì đặt bằng tồn kho và trả `warning`.
 *
 * `refresh()` làm client làm mới giao diện (badge header, trang giỏ) ngay trong
 * response của action — cần cho người đã đăng nhập vì khi đó không có cookie nào
 * đổi để Next tự làm mới.
 */

export type CartWarning = { kind: "over_stock"; max: number };

export type CartActionResult =
  | { ok: true; quantity: number; warning?: CartWarning }
  | { ok: false; kind: "invalid" | "not_found" | "out_of_stock" | "cookie_full" | "unknown" };

function isQuantity(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10_000;
}

/** Tồn kho hiện tại của một cuốn; null nếu sách không tồn tại. */
async function loadStock(bookId: string): Promise<number | null> {
  const { data } = await createPublicClient().from("books").select("stock_quantity").eq("id", bookId).maybeSingle();
  return data ? ((data as { stock_quantity: number | null }).stock_quantity ?? 0) : null;
}

/** Bỏ một dòng khỏi giỏ của phiên hiện tại (dùng khi sách không còn tồn tại). */
async function dropLine(bookId: string): Promise<void> {
  const { supabase, userId } = await getCartSession();
  if (userId) {
    await supabase.from("cart_items").delete().eq("book_id", bookId);
    return;
  }
  const { lines } = await readGuestCart();
  const rest = lines.filter((line) => line.b !== bookId);
  if (rest.length === 0) await clearGuestCart();
  else await writeGuestCart(rest);
}

/**
 * Lõi chung của addToCart và setCartQty: `resolve` nhận số lượng đang có trong
 * giỏ và trả số lượng muốn có; kết quả bị chặn ở min(tồn kho, MAX_LINE_QUANTITY).
 */
async function applyQuantity(bookId: string, resolve: (existing: number) => number): Promise<CartActionResult> {
  const stock = await loadStock(bookId);
  if (stock === null) {
    await dropLine(bookId);
    refresh();
    return { ok: false, kind: "not_found" };
  }
  if (stock <= 0) return { ok: false, kind: "out_of_stock" };

  const limit = Math.min(stock, MAX_LINE_QUANTITY);
  const { supabase, userId } = await getCartSession();

  if (userId) {
    const { data: row } = await supabase.from("cart_items").select("quantity").eq("book_id", bookId).maybeSingle();
    const wanted = resolve((row as { quantity: number } | null)?.quantity ?? 0);
    const final = Math.min(wanted, limit);
    const { error } = await supabase
      .from("cart_items")
      .upsert({ user_id: userId, book_id: bookId, quantity: final }, { onConflict: "user_id,book_id" });
    if (error) {
      console.error("[cart] ghi cart_items thất bại:", error.code ?? "không có mã", "-", error.message);
      return { ok: false, kind: "unknown" };
    }
    refresh();
    return { ok: true, quantity: final, ...(wanted > limit ? { warning: { kind: "over_stock", max: limit } } : {}) };
  }

  const { lines } = await readGuestCart();
  const existing = lines.find((line) => line.b === bookId);
  const wanted = resolve(existing?.q ?? 0);
  const final = Math.min(wanted, limit);

  let next: CartLine[];
  if (existing) {
    next = lines.map((line) => (line.b === bookId ? { b: bookId, q: final } : line));
  } else {
    // Đủ MAX_CART_LINES dòng thì bỏ dòng cũ nhất (đứng đầu) để nhường chỗ.
    next = [...(lines.length >= MAX_CART_LINES ? lines.slice(1) : lines), { b: bookId, q: final }];
  }
  const written = await writeGuestCart(next);
  if (!written.ok) return { ok: false, kind: "cookie_full" };

  refresh();
  return { ok: true, quantity: final, ...(wanted > limit ? { warning: { kind: "over_stock", max: limit } } : {}) };
}

/** Thêm `quantity` cuốn vào giỏ, cộng dồn nếu đã có (FR-3.3). */
export async function addToCart(bookId: string, quantity: number = 1): Promise<CartActionResult> {
  if (!isUuid(bookId) || !isQuantity(quantity)) return { ok: false, kind: "invalid" };
  try {
    return await applyQuantity(bookId.toLowerCase(), (existing) => existing + quantity);
  } catch (error) {
    console.error("[cart] addToCart thất bại:", error instanceof Error ? error.message : "lỗi không rõ");
    return { ok: false, kind: "unknown" };
  }
}

/** Đặt số lượng của một dòng (không cộng dồn). Muốn bỏ dòng thì gọi removeFromCart. */
export async function setCartQty(bookId: string, quantity: number): Promise<CartActionResult> {
  if (!isUuid(bookId) || !isQuantity(quantity)) return { ok: false, kind: "invalid" };
  try {
    return await applyQuantity(bookId.toLowerCase(), () => quantity);
  } catch (error) {
    console.error("[cart] setCartQty thất bại:", error instanceof Error ? error.message : "lỗi không rõ");
    return { ok: false, kind: "unknown" };
  }
}

export async function removeFromCart(bookId: string): Promise<CartActionResult> {
  if (!isUuid(bookId)) return { ok: false, kind: "invalid" };
  try {
    await dropLine(bookId.toLowerCase());
    refresh();
    return { ok: true, quantity: 0 };
  } catch (error) {
    console.error("[cart] removeFromCart thất bại:", error instanceof Error ? error.message : "lỗi không rõ");
    return { ok: false, kind: "unknown" };
  }
}

/**
 * Dọn cookie giỏ của khách (FR-3A.11, FR-3A.9): cookie hỏng được ghi đè bằng `[]`,
 * dòng trỏ tới sách không còn tồn tại bị loại. Chỉ BỚT dữ liệu, không bao giờ thêm,
 * nên gọi tự động từ trang /gio-hang là an toàn. Người đã đăng nhập: không làm gì.
 */
export async function repairGuestCart(): Promise<{ ok: true }> {
  try {
    const { userId } = await getCartSession();
    if (userId) return { ok: true };

    const { lines, valid } = await readGuestCart();
    if (!valid) {
      await writeGuestCart([]);
      return { ok: true };
    }
    if (lines.length === 0) return { ok: true };

    const { data } = await createPublicClient()
      .from("books")
      .select("id")
      .in(
        "id",
        lines.map((line) => line.b),
      );
    const existing = new Set(((data ?? []) as { id: string }[]).map((row) => row.id));
    const kept = lines.filter((line) => existing.has(line.b));
    if (kept.length !== lines.length) {
      if (kept.length === 0) await clearGuestCart();
      else await writeGuestCart(kept);
    }
  } catch (error) {
    console.error("[cart] repairGuestCart thất bại:", error instanceof Error ? error.message : "lỗi không rõ");
  }
  return { ok: true };
}

import { cache } from "react";
import { readGuestCart, type CartLine } from "@/lib/cart/cookie";
import { getCartSession } from "@/lib/cart/session";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Đọc giỏ để hiển thị (đợt 3A, spec FR-3A.7, FR-3A.9). Chỉ gọi trong request
 * (đọc cookie) và sau <Suspense>.
 */

export interface CartBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  categoryId: string;
}

export interface CartViewLine {
  book: CartBook;
  /** Số lượng đã lưu trong giỏ. */
  quantity: number;
  /** Số lượng hiển thị: bằng `quantity` nhưng không vượt tồn kho (sách còn hàng); sách hết hàng giữ nguyên. */
  displayQuantity: number;
  /** Số lượng tính tiền: bằng `quantity` nhưng không vượt tồn kho; 0 khi hết hàng. */
  billableQuantity: number;
  unitPrice: number;
  lineTotal: number;
  outOfStock: boolean;
  /** Tồn kho đã giảm xuống dưới số lượng trong giỏ (và vẫn còn hàng). */
  overStock: boolean;
}

export interface CartView {
  mode: "guest" | "user";
  lines: CartViewLine[];
  /** Tổng số lượng hiển thị của mọi dòng trong giỏ, dùng cho tiêu đề trang. */
  totalQuantity: number;
  subtotal: number;
  hasOutOfStock: boolean;
  /** Cookie hỏng hoặc có dòng trỏ tới sách không còn: nơi gọi nên yêu cầu ghi đè cookie. */
  needsRepair: boolean;
}

const BOOK_COLUMNS = "id, slug, title, author, cover_image_url, price, discount_price, stock_quantity, category_id";

interface BookRow {
  id: string;
  slug: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number | null;
  category_id: string;
}

function mapBook(row: BookRow): CartBook {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    coverImageUrl: row.cover_image_url,
    price: row.price,
    discountPrice: row.discount_price,
    stockQuantity: row.stock_quantity ?? 0,
    categoryId: row.category_id,
  };
}

/** Giá thực tế của một cuốn: giá giảm nếu có và thấp hơn giá gốc (cùng luật với <Price>). */
export function effectivePrice(book: Pick<CartBook, "price" | "discountPrice">): number {
  return book.discountPrice != null && book.discountPrice < book.price ? book.discountPrice : book.price;
}

function buildLines(entries: { book: CartBook; quantity: number }[]): CartViewLine[] {
  return entries.map(({ book, quantity }) => {
    const outOfStock = book.stockQuantity <= 0;
    const billableQuantity = outOfStock ? 0 : Math.min(quantity, book.stockQuantity);
    const unitPrice = effectivePrice(book);
    return {
      book,
      quantity,
      displayQuantity: outOfStock ? quantity : Math.min(quantity, book.stockQuantity),
      billableQuantity,
      unitPrice,
      lineTotal: billableQuantity * unitPrice,
      outOfStock,
      overStock: !outOfStock && quantity > book.stockQuantity,
    };
  });
}

async function fetchBooks(ids: string[]): Promise<Map<string, CartBook>> {
  if (ids.length === 0) return new Map();
  const { data } = await createPublicClient().from("books").select(BOOK_COLUMNS).in("id", ids);
  return new Map(((data ?? []) as BookRow[]).map((row) => [row.id, mapBook(row)]));
}

function summarize(mode: CartView["mode"], lines: CartViewLine[], needsRepair: boolean): CartView {
  return {
    mode,
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.displayQuantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    hasOutOfStock: lines.some((line) => line.outOfStock),
    needsRepair,
  };
}

export const getCartView = cache(async function getCartView(): Promise<CartView> {
  const { supabase, userId } = await getCartSession();

  if (userId) {
    const { data } = await supabase
      .from("cart_items")
      .select(`quantity, created_at, books(${BOOK_COLUMNS})`)
      .order("created_at", { ascending: true });
    const entries: { book: CartBook; quantity: number }[] = [];
    for (const row of (data ?? []) as unknown as { quantity: number; books: BookRow | null }[]) {
      // Khoá ngoại có ON DELETE CASCADE nên dòng mồ côi không tồn tại ở bảng; nếu embed trả null thì bỏ qua.
      if (row.books) entries.push({ book: mapBook(row.books), quantity: row.quantity });
    }
    return summarize("user", buildLines(entries), false);
  }

  const { lines: cookieLines, valid } = await readGuestCart();
  const books = await fetchBooks(cookieLines.map((line) => line.b));
  const entries: { book: CartBook; quantity: number }[] = [];
  let orphan = false;
  for (const line of cookieLines) {
    const book = books.get(line.b);
    if (book) entries.push({ book, quantity: line.q });
    else orphan = true;
  }
  return summarize("guest", buildLines(entries), !valid || orphan);
});

/**
 * Số lượng sách trong giỏ cho badge header: tổng `quantity` các dòng. Không tra
 * sách ở bảng `books` (một truy vấn ít hơn ở mọi trang); dòng mồ côi hiếm sẽ bị
 * dọn khi người dùng mở /gio-hang.
 */
export const getCartCount = cache(async function getCartCount(): Promise<number> {
  const { supabase, userId } = await getCartSession();
  if (userId) {
    const { data } = await supabase.from("cart_items").select("quantity");
    return ((data ?? []) as { quantity: number }[]).reduce((sum, row) => sum + row.quantity, 0);
  }
  const { lines } = await readGuestCart();
  return lines.reduce((sum: number, line: CartLine) => sum + line.q, 0);
});

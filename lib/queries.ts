import { supabase } from "@/lib/supabase";

export interface BookSummary {
  slug: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
}

interface BookRow {
  slug: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
}

function mapBookRow(row: BookRow): BookSummary {
  return {
    slug: row.slug,
    title: row.title,
    author: row.author,
    coverImageUrl: row.cover_image_url,
    price: row.price,
    discountPrice: row.discount_price,
    stockQuantity: row.stock_quantity,
  };
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  children: CategoryNode[];
}

/** Cây danh mục 2 cấp, sắp xếp theo sort_order — dùng cho mega-menu. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, sort_order")
    .order("sort_order", { ascending: true });

  if (!data) return [];

  const byId = new Map<string, CategoryNode>();
  for (const row of data) {
    byId.set(row.id, { id: row.id, name: row.name, slug: row.slug, sortOrder: row.sort_order, children: [] });
  }

  const roots: CategoryNode[] = [];
  for (const row of data) {
    const node = byId.get(row.id)!;
    if (row.parent_id) {
      byId.get(row.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** FR-1.4: category cha (parent_id null) -> gồm cả sách của các category con trực tiếp. */
export async function resolveCategoryFilter(
  slug: string,
): Promise<{ name: string; categoryIds: string[] } | null> {
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) return null;

  if (category.parent_id === null) {
    const { data: children } = await supabase.from("categories").select("id").eq("parent_id", category.id);
    return { name: category.name, categoryIds: [category.id, ...(children ?? []).map((c) => c.id)] };
  }

  return { name: category.name, categoryIds: [category.id] };
}

export async function getBooksByCategoryIds(categoryIds: string[], limit = 60): Promise<BookSummary[]> {
  if (categoryIds.length === 0) return [];
  const { data } = await supabase
    .from("books")
    .select("slug, title, author, cover_image_url, price, discount_price, stock_quantity")
    .in("category_id", categoryIds)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapBookRow);
}

/** FR-1.6(a): mới nhất trước. */
export async function getNewestBooks(limit = 8): Promise<BookSummary[]> {
  const { data } = await supabase
    .from("books")
    .select("slug, title, author, cover_image_url, price, discount_price, stock_quantity")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapBookRow);
}

/**
 * FR-1.7: SUM(order_items.quantity) nhóm theo book_id, chỉ tính đơn
 * status != 'cancelled'; sách chưa có đơn xếp cuối. Tính ở tầng ứng dụng
 * (không tạo view/function mới trong DB) vì đợt này chỉ đụng frontend.
 * Vì orders/order_items hiện đang trống, "bán chạy nhất" tạm thời trùng
 * "mới nhất" — đây là kết quả đúng của rule, không phải lỗi.
 */
export async function getBestsellingBooks(limit = 8): Promise<BookSummary[]> {
  const { data: books } = await supabase
    .from("books")
    .select("id, slug, title, author, cover_image_url, price, discount_price, stock_quantity")
    .order("created_at", { ascending: false });

  if (!books) return [];

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("book_id, quantity, orders!inner(status)")
    .neq("orders.status", "cancelled");

  const soldByBookId = new Map<string, number>();
  for (const item of orderItems ?? []) {
    soldByBookId.set(item.book_id, (soldByBookId.get(item.book_id) ?? 0) + item.quantity);
  }

  const ranked = [...books].sort((a, b) => {
    const soldA = soldByBookId.get(a.id) ?? 0;
    const soldB = soldByBookId.get(b.id) ?? 0;
    return soldB - soldA;
  });

  return ranked.slice(0, limit).map(mapBookRow);
}

export interface CollectionSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  isFeatured: boolean;
  sortOrder: number;
}

export async function getCollections(): Promise<CollectionSummary[]> {
  const { data } = await supabase
    .from("collections")
    .select("id, slug, title, description, is_featured, sort_order")
    .order("sort_order", { ascending: true });

  return (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    isFeatured: c.is_featured,
    sortOrder: c.sort_order,
  }));
}

export interface FeaturedCollection {
  slug: string;
  title: string;
  description: string;
  books: { slug: string; title: string; author: string; coverImageUrl: string | null }[];
}

interface CollectionBookWithBookRow {
  position: number;
  books: BookRow | null;
}

/** Mục 5.2: hero lấy tủ sách is_featured = true, tối đa 5 ảnh bìa đầu theo position. */
export async function getFeaturedCollection(): Promise<FeaturedCollection | null> {
  const { data: collection } = await supabase
    .from("collections")
    .select("id, slug, title, description")
    .eq("is_featured", true)
    .maybeSingle();

  if (!collection) return null;

  const { data: rows } = await supabase
    .from("collection_books")
    .select("position, books(slug, title, author, cover_image_url, price, discount_price, stock_quantity)")
    .eq("collection_id", collection.id)
    .order("position", { ascending: true })
    .limit(5);

  const bookRows = (rows ?? []) as unknown as CollectionBookWithBookRow[];

  return {
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    books: bookRows
      .filter((r) => r.books !== null)
      .map((r) => ({
        slug: r.books!.slug,
        title: r.books!.title,
        author: r.books!.author,
        coverImageUrl: r.books!.cover_image_url,
      })),
  };
}

export interface CollectionDetail extends CollectionSummary {
  books: (BookSummary & { curatorNote: string; position: number })[];
}

export async function getCollectionBySlug(slug: string): Promise<CollectionDetail | null> {
  const { data: collection } = await supabase
    .from("collections")
    .select("id, slug, title, description, is_featured, sort_order")
    .eq("slug", slug)
    .maybeSingle();

  if (!collection) return null;

  const { data: rows } = await supabase
    .from("collection_books")
    .select(
      "position, curator_note, books(slug, title, author, cover_image_url, price, discount_price, stock_quantity)",
    )
    .eq("collection_id", collection.id)
    .order("position", { ascending: true });

  interface Row extends CollectionBookWithBookRow {
    curator_note: string;
  }
  const bookRows = (rows ?? []) as unknown as Row[];

  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    isFeatured: collection.is_featured,
    sortOrder: collection.sort_order,
    books: bookRows
      .filter((r) => r.books !== null)
      .map((r) => ({
        ...mapBookRow(r.books!),
        curatorNote: r.curator_note,
        position: r.position,
      })),
  };
}

import { cache } from "react";
import type { ParsedCatalogParams } from "@/lib/catalog";
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

export interface CategoryBasic {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

/** Tên + vị trí danh mục theo slug, dùng cho tiêu đề trang /sach và chip bộ lọc. */
export const getCategoryBySlug = cache(async function getCategoryBySlug(
  slug: string,
): Promise<CategoryBasic | null> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, name: data.name, slug: data.slug, parentId: data.parent_id };
});

interface SearchBookRow extends BookRow {
  id: string;
  total_count: number;
}

export interface SearchBooksResult {
  books: BookSummary[];
  totalCount: number;
}

/**
 * 1b: gọi RPC `search_books` (đợt 1a) — lọc theo q/category/khoảng giá, sắp
 * xếp và phân trang chạy hết phía server (NFR-1.3).
 */
export async function searchBooks(params: ParsedCatalogParams): Promise<SearchBooksResult> {
  const { data, error } = await supabase.rpc("search_books", {
    p_q: params.q ?? null,
    p_category_slug: params.category ?? null,
    p_min: params.min ?? null,
    p_max: params.max ?? null,
    p_sort: params.sort,
    p_page: params.page,
  });

  if (error || !data) return { books: [], totalCount: 0 };

  const rows = data as SearchBookRow[];
  return {
    books: rows.map(mapBookRow),
    totalCount: rows[0]?.total_count ?? 0,
  };
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

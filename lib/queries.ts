import { cache } from "react";
import type { ParsedCatalogParams } from "@/lib/catalog";
import { cacheLife } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

/*
 * Đợt 2A: mọi truy vấn ở đây đọc dữ liệu CÔNG KHAI bằng client không cookie
 * (lib/supabase/public.ts) để dùng được trong `use cache`.
 *  - Có `use cache` + cacheLife("minutes") (làm mới sau 60 giây, như `revalidate = 60`
 *    trước đây): mọi hàm mà trang chủ, /tu-sach, /tu-sach/[slug], Header và
 *    Footer cần — nhờ vậy các route này prerender thành shell tĩnh.
 *  - KHÔNG cache: searchBooks, getCategoryBySlug, getBookBySlug,
 *    getBookCollections, getRelatedBooks — phụ thuộc URL/từ khoá tuỳ ý hoặc cần
 *    dữ liệu mới (/sach, /sach/[slug]); các route đó luôn render theo request.
 */

export interface BookSummary {
  slug: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  /** E3: cần để tra tên danh mục con hiển thị trên BookCard, xem getCategoryNameMap. */
  categoryId: string;
}

/** E3: phần thêm vào BookSummary để hiện trên <BookCard> — xem enrichBooksForCard. */
export type WithCardExtras<T> = T & { categoryName: string | null; collectionRef: BookCollectionRef | null };

/**
 * E3: gắn nhãn danh mục con + chip "Trong tủ sách" vào một danh sách
 * BookSummary trước khi đưa vào <BookCard>. Hàm thuần (không gọi DB) —
 * mọi trang gọi getCategoryNameMap()/getBookCollectionRefMap() một lần
 * (2 bảng rất nhỏ, 23 + 17 dòng) rồi tra tại chỗ cho cả danh sách, thay vì
 * query riêng cho từng cuốn.
 */
export function enrichBooksForCard<T extends BookSummary>(
  books: T[],
  categoryNames: Map<string, string>,
  collectionRefs: Map<string, BookCollectionRef>,
): WithCardExtras<T>[] {
  return books.map((book) => ({
    ...book,
    categoryName: categoryNames.get(book.categoryId) ?? null,
    collectionRef: collectionRefs.get(book.slug) ?? null,
  }));
}

interface BookRow {
  slug: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  category_id: string;
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
    categoryId: row.category_id,
  };
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  children: CategoryNode[];
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

/**
 * Dựng cây 2 cấp từ các dòng `categories` ĐÃ sắp theo sort_order. Hàm thuần: getCategoryTree và
 * getCategoryCounts dùng chung để chỉ có MỘT bản logic dựng cây (đợt N+1 trang chủ, FR-N1.3).
 */
function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  for (const row of rows) {
    byId.set(row.id, { id: row.id, name: row.name, slug: row.slug, sortOrder: row.sort_order, children: [] });
  }

  const roots: CategoryNode[] = [];
  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parent_id) {
      byId.get(row.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** Cây danh mục 2 cấp, sắp xếp theo sort_order — dùng cho mega-menu. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, sort_order")
    .order("sort_order", { ascending: true });

  if (!data) return [];
  return buildCategoryTree(data);
}

/**
 * E3: map category_id -> tên danh mục, dùng để hiện nhãn danh mục con trên
 * BookCard. Chỉ 23 dòng trong bảng categories — lấy hết 1 lần rồi tra tại
 * chỗ cho cả danh sách sách, thay vì query riêng cho từng cuốn.
 */
export async function getCategoryNameMap(): Promise<Map<string, string>> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data } = await supabase.from("categories").select("id, name");
  const map = new Map<string, string>();
  for (const row of data ?? []) map.set(row.id, row.name);
  return map;
}

export interface CategoryBasic {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  /** E3: chỉ 5 danh mục cha có dữ liệu; danh mục con luôn null. */
  description: string | null;
}

/** Tên + vị trí danh mục theo slug, dùng cho tiêu đề trang /sach và chip bộ lọc. */
export const getCategoryBySlug = cache(async function getCategoryBySlug(
  slug: string,
): Promise<CategoryBasic | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, name: data.name, slug: data.slug, parentId: data.parent_id, description: data.description };
});

/** Danh mục theo id — dùng để lấy tên danh mục cha khi chỉ có category_id của sách. */
export async function getCategoryById(id: string): Promise<CategoryBasic | null> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, description")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, name: data.name, slug: data.slug, parentId: data.parent_id, description: data.description };
}

/** 1c (bổ sung): chuỗi breadcrumb [cha, con] (hoặc chỉ [cha] nếu category đã là cấp cao nhất). */
async function buildCategoryChain(category: CategoryBasic): Promise<CategoryBasic[]> {
  if (!category.parentId) return [category];
  const parent = await getCategoryById(category.parentId);
  return parent ? [parent, category] : [category];
}

export async function getCategoryChainBySlug(slug: string): Promise<CategoryBasic[]> {
  const category = await getCategoryBySlug(slug);
  return category ? buildCategoryChain(category) : [];
}

export async function getCategoryChainById(id: string): Promise<CategoryBasic[]> {
  const category = await getCategoryById(id);
  return category ? buildCategoryChain(category) : [];
}

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
  const supabase = createPublicClient();
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

/**
 * Tab "Bán chạy" ở trang chủ (đợt 2A): cùng RPC search_books nhưng bọc use cache
 * để trang chủ prerender được. /sach vẫn gọi searchBooks() trực tiếp, không
 * cache, nên kết quả tìm kiếm luôn mới.
 */
export async function getBestsellingBooks(): Promise<SearchBooksResult> {
  "use cache";
  cacheLife("minutes");
  return searchBooks({ sort: "bestseller", page: 1 });
}

/** FR-1.6(a): mới nhất trước. */
export async function getNewestBooks(limit = 8): Promise<BookSummary[]> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("books")
    .select("slug, title, author, cover_image_url, price, discount_price, stock_quantity, category_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapBookRow);
}

export interface FeaturedBookExtra {
  description: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

/**
 * Đợt E1: cuốn đầu tiên trong khối "Sách mới"/"Bán chạy" ở trang chủ hiển
 * thị to hơn kèm mô tả ngắn — `search_books` (RPC, dùng cho tab Bán chạy)
 * không trả `description`, sửa RPC chỉ để thêm 1 cột không đáng công một
 * migration. Lấy riêng qua bảng `books` theo đúng slug cần, chỉ 1-2 slug
 * mỗi lần gọi (chỉ dùng cho mục đầu tiên của mỗi tab).
 *
 * Đợt F [F2.1]: thẻ nổi bật giờ cần thêm nhãn danh mục — nhãn dùng danh mục
 * CHA (đúng 1 trong 5 màu danh mục đã có, không phải danh mục con vì nó
 * không có màu riêng); nếu không có cha thì chính danh mục đó.
 *
 * Đợt N+1 trang chủ [FR-N1.4]: lấy MỘT truy vấn duy nhất, nhúng danh mục và
 * danh mục cha qua khoá ngoại (`categories(... parent:parent_id(...))`), thay
 * cho chuỗi sách → danh mục con → danh mục cha (3 bậc, 1 + 2 truy vấn mỗi
 * sách). Gợi ý `parent:parent_id(...)` (tên CỘT khoá ngoại) trả về ĐỐI TƯỢNG
 * cha; `parent:categories!parent_id(...)` thì trả mảng con (rỗng) — đã đo
 * trên PostgREST cục bộ và hosted. Khoá của kết quả theo thứ tự `slugs`
 * (bản cũ theo thứ tự các lời gọi song song hoàn thành nên không tất định).
 */
export async function getFeaturedBookExtrasBySlug(slugs: string[]): Promise<Record<string, FeaturedBookExtra>> {
  "use cache";
  cacheLife("minutes");
  if (slugs.length === 0) return {};
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("books")
    .select("slug, description, categories(name, slug, parent_id, parent:parent_id(name, slug))")
    .in("slug", slugs);

  interface CategoryLabel {
    name: string;
    slug: string;
  }
  const rows = (data ?? []) as unknown as {
    slug: string;
    description: string | null;
    categories: (CategoryLabel & { parent_id: string | null; parent: CategoryLabel | null }) | null;
  }[];
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  const map: Record<string, FeaturedBookExtra> = {};
  for (const slug of slugs) {
    const row = bySlug.get(slug);
    if (!row) continue;
    const category = row.categories;
    const label = category?.parent_id && category.parent ? category.parent : category;
    map[slug] = {
      description: row.description,
      categoryName: label?.name ?? null,
      categorySlug: label?.slug ?? null,
    };
  }
  return map;
}

export interface CollectionSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  isFeatured: boolean;
  sortOrder: number;
}

export interface BookCollectionRef {
  slug: string;
  title: string;
}

/**
 * E3: map slug sách -> {slug, title} tủ sách chứa nó, dùng để hiện chip
 * "Trong tủ sách" trên BookCard (tên tủ hiện khi rê chuột qua chip). Chỉ 17
 * dòng trong collection_books hiện tại — lấy hết 1 lần bằng join thẳng tới
 * books.slug (không cần đi qua book_id/UUID, BookSummary không có sẵn
 * trường đó) rồi tra tại chỗ, thay vì query riêng cho từng cuốn.
 */
export async function getBookCollectionRefMap(): Promise<Map<string, BookCollectionRef>> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data } = await supabase.from("collection_books").select("books(slug), collections(slug, title)");

  const rows = (data ?? []) as unknown as {
    books: { slug: string } | null;
    collections: { slug: string; title: string } | null;
  }[];

  const map = new Map<string, BookCollectionRef>();
  for (const row of rows) {
    if (row.books && row.collections) {
      map.set(row.books.slug, { slug: row.collections.slug, title: row.collections.title });
    }
  }
  return map;
}

export async function getCollections(): Promise<CollectionSummary[]> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
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

export interface CollectionPreview extends CollectionSummary {
  previewBooks: { slug: string; title: string; author: string; coverImageUrl: string | null }[];
}

/**
 * C.2 mục 5: mỗi tủ sách kèm tối đa 3 bìa đầu (theo position) để xếp chồng trên trang chủ.
 *
 * Đợt N+1 trang chủ [FR-N1.2]: MỘT truy vấn nhúng (`collection_books(...)` có `order`/`limit` đặt trên bảng
 * nhúng) thay cho `getCollections()` rồi một truy vấn cho MỖI tủ (1 + N, hai bậc nối tiếp).
 */
export async function getCollectionsWithPreview(): Promise<CollectionPreview[]> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  // E1: tủ nổi bật hiện 4 bìa (thẻ lớn hơn), tủ thường chỉ dùng 3 — lấy
  // dư 1 cho mọi tủ rồi cắt bớt lúc hiển thị, đơn giản hơn 2 nhánh truy vấn.
  const { data } = await supabase
    .from("collections")
    .select(
      "id, slug, title, description, is_featured, sort_order, collection_books(position, books(slug, title, author, cover_image_url))",
    )
    .order("sort_order", { ascending: true })
    .order("position", { referencedTable: "collection_books", ascending: true })
    .limit(4, { referencedTable: "collection_books" });

  const collections = (data ?? []) as unknown as {
    id: string;
    slug: string;
    title: string;
    description: string;
    is_featured: boolean;
    sort_order: number;
    collection_books: {
      position: number;
      books: { slug: string; title: string; author: string; cover_image_url: string | null } | null;
    }[];
  }[];

  return collections.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    isFeatured: c.is_featured,
    sortOrder: c.sort_order,
    previewBooks: c.collection_books
      .filter((r) => r.books !== null)
      .map((r) => ({
        slug: r.books!.slug,
        title: r.books!.title,
        author: r.books!.author,
        coverImageUrl: r.books!.cover_image_url,
      })),
  }));
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  bookCount: number;
}

/**
 * C.2 mục 2: mỗi danh mục cha kèm tổng số sách thuộc nó hoặc các danh mục con của nó.
 *
 * Đợt N+1 trang chủ [FR-N1.3]: MỘT truy vấn đọc `categories` kèm số sách của từng danh mục (nhúng đếm
 * `books(count)`), rồi cộng cha với con trong mã — thay cho cây (1 truy vấn) rồi 5 lệnh `HEAD` đếm, hai bậc
 * nối tiếp. Dựng cây bằng `buildCategoryTree`, cùng hàm với `getCategoryTree`.
 */
export async function getCategoryCounts(): Promise<CategoryWithCount[]> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, sort_order, books(count)")
    .order("sort_order", { ascending: true });

  if (!data) return [];
  const rows = data as unknown as (CategoryRow & { books: { count: number }[] | null })[];
  const countById = new Map(rows.map((row) => [row.id, row.books?.[0]?.count ?? 0]));

  return buildCategoryTree(rows).map((parent) => ({
    id: parent.id,
    name: parent.name,
    slug: parent.slug,
    bookCount: [parent.id, ...parent.children.map((c) => c.id)].reduce((sum, id) => sum + (countById.get(id) ?? 0), 0),
  }));
}

export interface EditorialPick {
  curatorNote: string;
  collectionSlug: string;
  collectionTitle: string;
  book: { slug: string; title: string; author: string; coverImageUrl: string | null };
}

/**
 * C.2 mục 4: một curator_note thật để làm khối editorial trên trang chủ —
 * lấy cuốn đầu tiên (position 1) của tủ sách không phải hero, theo
 * sort_order, để không lặp lại đúng những cuốn đã hiện ở Hero.
 *
 * Đợt N+1 trang chủ [FR-N1.1]: MỘT truy vấn nhúng (tủ đầu tiên không phải hero kèm đúng 1 dòng
 * `collection_books` đầu theo position) thay cho chuỗi hai bậc tủ → dòng.
 */
export async function getEditorialPick(): Promise<EditorialPick | null> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data: candidateCollections } = await supabase
    .from("collections")
    .select("slug, title, collection_books(curator_note, books(slug, title, author, cover_image_url))")
    .eq("is_featured", false)
    .order("sort_order", { ascending: true })
    .order("position", { referencedTable: "collection_books", ascending: true })
    .limit(1)
    .limit(1, { referencedTable: "collection_books" });

  const collection = candidateCollections?.[0] as unknown as
    | {
        slug: string;
        title: string;
        collection_books: { curator_note: string; books: unknown }[];
      }
    | undefined;
  if (!collection) return null;

  const row = collection.collection_books[0];

  const book = row?.books as unknown as
    | { slug: string; title: string; author: string; cover_image_url: string | null }
    | null
    | undefined;
  if (!row || !book) return null;

  return {
    curatorNote: row.curator_note,
    collectionSlug: collection.slug,
    collectionTitle: collection.title,
    book: {
      slug: book.slug,
      title: book.title,
      author: book.author,
      coverImageUrl: book.cover_image_url,
    },
  };
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

/**
 * Mục 5.2: hero lấy tủ sách is_featured = true, tối đa 5 ảnh bìa đầu theo position.
 *
 * Đợt N+1 trang chủ [FR-N1.1]: MỘT truy vấn nhúng (tủ kèm 5 dòng `collection_books` đầu theo position)
 * thay cho chuỗi hai bậc tủ → dòng. `maybeSingle` giữ nguyên: nhiều hơn một tủ nổi bật thì lỗi → `null`.
 */
export async function getFeaturedCollection(): Promise<FeaturedCollection | null> {
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data: collection } = await supabase
    .from("collections")
    .select(
      "id, slug, title, description, collection_books(position, books(slug, title, author, cover_image_url, price, discount_price, stock_quantity))",
    )
    .eq("is_featured", true)
    .order("position", { referencedTable: "collection_books", ascending: true })
    .limit(5, { referencedTable: "collection_books" })
    .maybeSingle();

  if (!collection) return null;

  const bookRows = (collection.collection_books ?? []) as unknown as CollectionBookWithBookRow[];

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
  "use cache";
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data: collection } = await supabase
    .from("collections")
    .select("id, slug, title, description, is_featured, sort_order")
    .eq("slug", slug)
    .maybeSingle();

  if (!collection) return null;

  const { data: rows } = await supabase
    .from("collection_books")
    .select(
      "position, curator_note, books(slug, title, author, cover_image_url, price, discount_price, stock_quantity, category_id)",
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

export interface BookDetail {
  id: string;
  slug: string;
  title: string;
  author: string;
  translator: string | null;
  publisher: string | null;
  description: string | null;
  tableOfContents: string | null;
  price: number;
  discountPrice: number | null;
  isbn: string | null;
  pageCount: number | null;
  dimensions: string | null;
  publishDate: string | null;
  coverImageUrl: string | null;
  stockQuantity: number;
  categoryId: string;
}

/** 1c.1/1c.2: dữ liệu đầy đủ cho trang /sach/[slug]. */
export const getBookBySlug = cache(async function getBookBySlug(slug: string): Promise<BookDetail | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("books")
    .select(
      "id, slug, title, author, translator, publisher, description, table_of_contents, price, discount_price, isbn, page_count, dimensions, publish_date, cover_image_url, stock_quantity, category_id",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    author: data.author,
    translator: data.translator,
    publisher: data.publisher,
    description: data.description,
    tableOfContents: data.table_of_contents,
    price: data.price,
    discountPrice: data.discount_price,
    isbn: data.isbn,
    pageCount: data.page_count,
    dimensions: data.dimensions,
    publishDate: data.publish_date,
    coverImageUrl: data.cover_image_url,
    stockQuantity: data.stock_quantity,
    categoryId: data.category_id,
  };
});

export interface BookCollectionEntry {
  slug: string;
  title: string;
  curatorNote: string;
  bookCount: number;
}

interface CollectionBooksJoinRow {
  curator_note: string;
  collections: { id: string; slug: string; title: string } | null;
}

/** [Thay đổi SRS — FR-2.6 mới] Mọi tủ sách có chứa cuốn này, kèm curator_note riêng của cuốn trong tủ đó. */
export async function getBookCollections(bookId: string): Promise<BookCollectionEntry[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("collection_books")
    .select("curator_note, collections(id, slug, title)")
    .eq("book_id", bookId);

  const rows = (data ?? []) as unknown as CollectionBooksJoinRow[];

  return Promise.all(
    rows
      .filter((r) => r.collections !== null)
      .map(async (r) => {
        const { count } = await supabase
          .from("collection_books")
          .select("*", { count: "exact", head: true })
          .eq("collection_id", r.collections!.id);

        return {
          slug: r.collections!.slug,
          title: r.collections!.title,
          curatorNote: r.curator_note,
          bookCount: count ?? 0,
        };
      }),
  );
}

export interface RelatedBooks {
  heading: string;
  books: BookSummary[];
}

/**
 * [Thay đổi SRS — FR-2.3] Tối đa 4 cuốn cùng category_id (con), mới nhất
 * trước; nếu chưa đủ 4, lấy thêm từ các category con khác cùng cha, không
 * trùng. Tiêu đề đổi theo việc có phải lấy thêm từ cha hay không.
 */
export async function getRelatedBooks(book: Pick<BookDetail, "id" | "categoryId">): Promise<RelatedBooks | null> {
  const supabase = createPublicClient();
  const category = await getCategoryById(book.categoryId);
  if (!category) return null;

  const { data: sameData } = await supabase
    .from("books")
    .select("slug, title, author, cover_image_url, price, discount_price, stock_quantity, category_id")
    .eq("category_id", book.categoryId)
    .neq("id", book.id)
    .order("created_at", { ascending: false })
    .limit(4);

  let books = (sameData ?? []).map(mapBookRow);
  let usedParent = false;

  if (books.length < 4 && category.parentId) {
    const { data: siblingCategories } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", category.parentId)
      .neq("id", category.id);

    const siblingIds = (siblingCategories ?? []).map((c) => c.id);

    if (siblingIds.length > 0) {
      const { data: extraData } = await supabase
        .from("books")
        .select("id, slug, title, author, cover_image_url, price, discount_price, stock_quantity, category_id")
        .in("category_id", siblingIds)
        .neq("id", book.id)
        .order("created_at", { ascending: false })
        .limit(4 - books.length);

      if (extraData && extraData.length > 0) {
        usedParent = true;
        books = [...books, ...extraData.map(mapBookRow)];
      }
    }
  }

  if (books.length === 0) return null;

  let headingCategoryName = category.name;
  if (usedParent && category.parentId) {
    const parent = await getCategoryById(category.parentId);
    if (parent) headingCategoryName = parent.name;
  }

  return { heading: `Cùng thể loại ${headingCategoryName}`, books };
}

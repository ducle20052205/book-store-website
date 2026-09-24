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

/** Danh mục theo id — dùng để lấy tên danh mục cha khi chỉ có category_id của sách. */
export const getCategoryById = cache(async function getCategoryById(id: string): Promise<CategoryBasic | null> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, name: data.name, slug: data.slug, parentId: data.parent_id };
});

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

/**
 * Đợt E1: cuốn đầu tiên trong khối "Sách mới"/"Bán chạy" ở trang chủ hiển
 * thị to hơn kèm mô tả ngắn — `search_books` (RPC, dùng cho tab Bán chạy)
 * không trả `description`, sửa RPC chỉ để thêm 1 cột không đáng công một
 * migration. Lấy riêng qua bảng `books` theo đúng slug cần, chỉ 1-2 slug
 * mỗi lần gọi (chỉ dùng cho mục đầu tiên của mỗi tab).
 */
export async function getBookDescriptionsBySlug(slugs: string[]): Promise<Record<string, string | null>> {
  if (slugs.length === 0) return {};
  const { data } = await supabase.from("books").select("slug, description").in("slug", slugs);
  const map: Record<string, string | null> = {};
  for (const row of data ?? []) map[row.slug] = row.description;
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

export interface CollectionPreview extends CollectionSummary {
  previewBooks: { slug: string; title: string; author: string; coverImageUrl: string | null }[];
}

/** C.2 mục 5: mỗi tủ sách kèm tối đa 3 bìa đầu (theo position) để xếp chồng trên trang chủ. */
export async function getCollectionsWithPreview(): Promise<CollectionPreview[]> {
  const collections = await getCollections();

  return Promise.all(
    collections.map(async (collection) => {
      // E1: tủ nổi bật hiện 4 bìa (thẻ lớn hơn), tủ thường chỉ dùng 3 — lấy
      // dư 1 cho mọi tủ rồi cắt bớt lúc hiển thị, đơn giản hơn 2 nhánh truy vấn.
      const { data: rows } = await supabase
        .from("collection_books")
        .select("position, books(slug, title, author, cover_image_url)")
        .eq("collection_id", collection.id)
        .order("position", { ascending: true })
        .limit(4);

      const bookRows = (rows ?? []) as unknown as {
        position: number;
        books: { slug: string; title: string; author: string; cover_image_url: string | null } | null;
      }[];

      return {
        ...collection,
        previewBooks: bookRows
          .filter((r) => r.books !== null)
          .map((r) => ({
            slug: r.books!.slug,
            title: r.books!.title,
            author: r.books!.author,
            coverImageUrl: r.books!.cover_image_url,
          })),
      };
    }),
  );
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  bookCount: number;
}

/** C.2 mục 2: mỗi danh mục cha kèm tổng số sách thuộc nó hoặc các danh mục con của nó. */
export async function getCategoryCounts(): Promise<CategoryWithCount[]> {
  const tree = await getCategoryTree();

  return Promise.all(
    tree.map(async (parent) => {
      const categoryIds = [parent.id, ...parent.children.map((c) => c.id)];
      const { count } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true })
        .in("category_id", categoryIds);

      return { id: parent.id, name: parent.name, slug: parent.slug, bookCount: count ?? 0 };
    }),
  );
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
 */
export async function getEditorialPick(): Promise<EditorialPick | null> {
  const { data: candidateCollections } = await supabase
    .from("collections")
    .select("id, slug, title")
    .eq("is_featured", false)
    .order("sort_order", { ascending: true })
    .limit(1);

  const collection = candidateCollections?.[0];
  if (!collection) return null;

  const { data: row } = await supabase
    .from("collection_books")
    .select("curator_note, books(slug, title, author, cover_image_url)")
    .eq("collection_id", collection.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

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
  const category = await getCategoryById(book.categoryId);
  if (!category) return null;

  const { data: sameData } = await supabase
    .from("books")
    .select("slug, title, author, cover_image_url, price, discount_price, stock_quantity")
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
        .select("id, slug, title, author, cover_image_url, price, discount_price, stock_quantity")
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

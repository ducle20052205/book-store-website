import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { ResultStrip } from "@/components/admin/ResultStrip";
import { EmptyState } from "@/components/EmptyState";
import { PageTitle } from "@/components/PageTitle";
import { PaginationNav } from "@/components/PaginationNav";
import { Price } from "@/components/Price";
import { StockLabel } from "@/components/StockLabel";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { CATALOG_PAGE_SIZE, type ParsedCatalogParams, buildCatalogQuery, parseCatalogSearchParams } from "@/lib/catalog";
import { getCategoryNameMap, getCategoryTree, searchBooks } from "@/lib/queries";
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui/classes";

/**
 * /admin/sach (đợt 5B, spec FR-5B.1): toàn bộ sách, tìm theo tên hoặc tác giả (không phân biệt dấu), lọc theo
 * danh mục, 20 dòng mỗi trang, mới nhất trước. Bộ lọc và trang nằm trên URL (`q`, `category`, `page`).
 *
 * Dùng lại `searchBooks()` (RPC `search_books`, KHÔNG cache): RPC đã đọc mọi sách, lọc danh mục (cha gồm cả con),
 * tìm không dấu bằng `f_unaccent`, 20 dòng và `created_at desc, id`. Trang admin KHÔNG đọc dữ liệu sách từ hàm
 * `use cache` nào (nếu không, danh sách trễ tới 60 giây sau mỗi lần ghi); chỉ dùng hai hàm cache chỉ chạm
 * `categories`, vì đợt này không sửa danh mục.
 *
 * Vỏ tĩnh KHÔNG được lộ giao diện quản trị (FR-5A.1): mọi thứ nằm SAU `requireAdmin()` trong <Suspense>,
 * fallback là khối trống không có chữ; `title` chung "NA Books" và `noindex`.
 */
export const metadata: Metadata = {
  title: "NA Books",
  robots: { index: false },
};

const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";
const LIST_PATH = "/admin/sach";

export default function AdminSachPage({ searchParams }: PageProps<"/admin/sach">) {
  return (
    <div className={containerClass}>
      <Suspense fallback={<div aria-busy="true" className="min-h-48" />}>
        <AdminBooks searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function AdminBooks({ searchParams }: { searchParams: PageProps<"/admin/sach">["searchParams"] }) {
  const sp = await searchParams;
  // `sort` luôn là "newest", `min` và `max` bị bỏ qua: danh sách admin chỉ có `q`, `category`, `page`.
  const parsed: ParsedCatalogParams = { ...parseCatalogSearchParams(sp), sort: "newest", min: undefined, max: undefined };
  await requireAdmin(`${LIST_PATH}${buildCatalogQuery(parsed, { page: parsed.page })}`);

  const [categoryTree, categoryNames] = await Promise.all([getCategoryTree(), getCategoryNameMap()]);
  let { books, totalCount } = await searchBooks(parsed);
  let page = parsed.page;
  // `page` vượt tổng số trang: RPC trả 0 dòng (không có `total_count`). Chỉ khi trang trống và page > 1 mới gọi thêm
  // một lần để lấy tổng rồi lấy trang cuối; URL không bị viết lại.
  if (books.length === 0 && page > 1) {
    const first = await searchBooks({ ...parsed, page: 1 });
    if (first.totalCount > 0) {
      page = Math.max(1, Math.ceil(first.totalCount / CATALOG_PAGE_SIZE));
      ({ books, totalCount } = await searchBooks({ ...parsed, page }));
    } else {
      totalCount = 0;
    }
  }
  const totalPages = Math.max(1, Math.ceil(totalCount / CATALOG_PAGE_SIZE));
  const filtering = Boolean(parsed.q || parsed.category);

  const result = firstValue(sp["ket-qua"]);
  const deletedTitle = firstValue(sp["ten"])?.slice(0, 200);

  return (
    <>
      <AdminNav current="books" />
      {result === "xoa" && deletedTitle && (
        <ResultStrip tone="ok" testId="admin-book-result">
          Đã xoá “{deletedTitle}”. Cuốn này không còn trên cửa hàng.
        </ResultStrip>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <PageTitle title="Quản lý sách" count={totalCount} unit="cuốn sách" countTestId="admin-book-count" />
        <Link href="/admin/sach/moi" data-testid="admin-book-new" className={`${secondaryButtonClass} w-full md:w-auto`}>
          Thêm sách
        </Link>
      </div>

      <form method="get" action={LIST_PATH} role="search" data-testid="admin-book-filter" className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="md:flex-1">
          <label htmlFor="admin-book-q" className="mb-1.5 block text-body-sm font-medium text-ink-900">
            Tìm theo tên sách hoặc tác giả
          </label>
          <input id="admin-book-q" type="search" name="q" defaultValue={parsed.q ?? ""} maxLength={100} autoComplete="off" className={`${inputClass} border-line-field`} />
        </div>
        <div className="md:w-72">
          <label htmlFor="admin-book-category" className="mb-1.5 block text-body-sm font-medium text-ink-900">
            Danh mục
          </label>
          <select id="admin-book-category" name="category" defaultValue={parsed.category ?? ""} className={`${inputClass} border-line-field`}>
            <option value="">Tất cả</option>
            {categoryTree.map((parent) => (
              <optgroup key={parent.id} label={parent.name}>
                <option value={parent.slug}>Tất cả {parent.name}</option>
                {parent.children.map((child) => (
                  <option key={child.id} value={child.slug}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <button type="submit" className={`${primaryButtonClass} md:!w-auto`}>
          Lọc
        </button>
        {filtering && (
          <Link
            href={LIST_PATH}
            className="inline-flex min-h-11 items-center justify-center text-body-sm font-medium text-cham-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
          >
            Xoá lọc
          </Link>
        )}
      </form>

      {books.length === 0 ? (
        <EmptyState
          title={filtering ? "Không có sách nào khớp bộ lọc" : "Chưa có cuốn sách nào"}
          actions={filtering ? [{ href: LIST_PATH, label: "Xoá lọc", variant: "primary" }] : [{ href: "/admin/sach/moi", label: "Thêm sách", variant: "primary" }]}
        >
          {filtering ? "Bạn thử đổi từ khoá hoặc danh mục, hoặc xoá bộ lọc để xem tất cả sách." : "Khi bạn thêm cuốn sách đầu tiên, nó sẽ xuất hiện ở đây."}
        </EmptyState>
      ) : (
        <>
          <ul data-testid="admin-book-list" className={`${cardClass} mt-6 divide-y divide-menu-sep`}>
            {books.map((book) => (
              <li key={book.slug} data-testid="admin-book-row">
                <Link
                  href={`${LIST_PATH}/${encodeURIComponent(book.slug)}`}
                  prefetch={false}
                  className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 p-4 hover:bg-cham-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cham-600 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_8rem] md:gap-x-6 md:p-6"
                >
                  <span className="min-w-0 md:order-1">
                    <span className="block font-serif text-[1.0625rem] font-semibold leading-snug text-ink-900">{book.title}</span>
                    <span className="block text-body-sm text-ink-600">{book.author}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1 text-meta text-ink-600 md:order-4">
                    <span>Còn {book.stockQuantity}</span>
                    <StockLabel stockQuantity={book.stockQuantity} />
                  </span>
                  <span className="min-w-0 text-body-sm text-ink-600 md:order-2">{categoryNames.get(book.categoryId) ?? ""}</span>
                  <span className="justify-self-end text-body-sm md:order-3 md:justify-self-start">
                    <Price price={book.price} discountPrice={book.discountPrice} hideBadge />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <PaginationNav page={page} totalPages={totalPages} hrefFor={(p) => `${LIST_PATH}${buildCatalogQuery(parsed, { page: p })}`} />
        </>
      )}
    </>
  );
}

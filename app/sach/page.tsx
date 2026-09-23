import type { Metadata } from "next";
import Link from "next/link";
import { BookCard } from "@/components/BookCard";
import { CatalogFilters } from "@/components/CatalogFilters";
import { FilterChips } from "@/components/FilterChips";
import { MobileFilterSheet } from "@/components/MobileFilterSheet";
import { Pagination } from "@/components/Pagination";
import { SortSelect } from "@/components/SortSelect";
import { type ParsedCatalogParams, countActiveFilters, parseCatalogSearchParams } from "@/lib/catalog";
import { getCategoryBySlug, getCategoryTree, searchBooks } from "@/lib/queries";

async function resolveHeading(parsed: ParsedCatalogParams): Promise<{ heading: string; categoryName?: string }> {
  if (parsed.q) return { heading: `Kết quả cho "${parsed.q}"` };

  if (parsed.category) {
    const category = await getCategoryBySlug(parsed.category);
    return category ? { heading: category.name, categoryName: category.name } : { heading: "Không tìm thấy danh mục" };
  }

  return { heading: "Tất cả sách" };
}

export async function generateMetadata({ searchParams }: PageProps<"/sach">): Promise<Metadata> {
  const sp = await searchParams;
  const parsed = parseCatalogSearchParams(sp);
  const { heading } = await resolveHeading(parsed);
  return { title: `${heading} – NA Books` };
}

/**
 * Trang catalog /sach (đợt 1b): mọi bộ lọc nằm trên URL, lọc + sắp xếp +
 * phân trang chạy hết ở RPC search_books (đợt 1a).
 */
export default async function SachPage({ searchParams }: PageProps<"/sach">) {
  const sp = await searchParams;
  const parsed = parseCatalogSearchParams(sp);

  const [{ heading, categoryName }, categories, { books, totalCount }] = await Promise.all([
    resolveHeading(parsed),
    getCategoryTree(),
    searchBooks(parsed),
  ]);

  const activeFilterCount = countActiveFilters(parsed);

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-serif text-3xl text-ink-900">{heading}</h1>
        <p className="text-sm text-ink-600">{totalCount} cuốn sách</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="lg:hidden">
            <MobileFilterSheet activeCount={activeFilterCount}>
              <CatalogFilters categories={categories} current={parsed} />
            </MobileFilterSheet>
          </div>
          <FilterChips current={parsed} categoryName={categoryName} />
        </div>

        <SortSelect value={parsed.sort} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <CatalogFilters categories={categories} current={parsed} />
        </aside>

        <div>
          {books.length === 0 ? (
            <p className="text-ink-600">
              {parsed.q ? (
                <>Chúng mình chưa tìm thấy cuốn nào khớp với &quot;{parsed.q}&quot;. Bạn thử bỏ bớt bộ lọc, hoặc ghé</>
              ) : (
                <>Chúng mình chưa tìm thấy cuốn nào khớp với bộ lọc hiện tại. Bạn thử bỏ bớt bộ lọc, hoặc ghé</>
              )}{" "}
              <Link
                href="/tu-sach"
                className="font-medium text-cham-700 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
              >
                tủ sách tuyển chọn
              </Link>{" "}
              nhé.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                {books.map((book) => (
                  <BookCard key={book.slug} book={book} />
                ))}
              </div>
              <Pagination current={parsed} totalCount={totalCount} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

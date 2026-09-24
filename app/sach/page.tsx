import type { Metadata } from "next";
import Link from "next/link";
import { BookCard } from "@/components/BookCard";
import { Breadcrumb, categoryChainToBreadcrumbItems } from "@/components/Breadcrumb";
import { CatalogFilters } from "@/components/CatalogFilters";
import { FilterChips } from "@/components/FilterChips";
import { MobileFilterSheet } from "@/components/MobileFilterSheet";
import { Pagination } from "@/components/Pagination";
import { SortSelect } from "@/components/SortSelect";
import { TrackEvent } from "@/components/TrackEvent";
import { type ParsedCatalogParams, countActiveFilters, parseCatalogSearchParams } from "@/lib/catalog";
import { categoryColorClasses } from "@/lib/categoryColors";
import { type CategoryBasic, getCategoryChainBySlug, getCategoryTree, searchBooks } from "@/lib/queries";

async function resolveCatalogContext(
  parsed: ParsedCatalogParams,
): Promise<{ heading: string; categoryName?: string; categoryChain: CategoryBasic[] }> {
  const categoryChain = parsed.category ? await getCategoryChainBySlug(parsed.category) : [];
  const leaf = categoryChain[categoryChain.length - 1];

  let heading: string;
  if (parsed.q) heading = `Kết quả cho "${parsed.q}"`;
  else if (leaf) heading = leaf.name;
  else if (parsed.category) heading = "Không tìm thấy danh mục";
  else heading = "Tất cả sách";

  return { heading, categoryName: leaf?.name, categoryChain };
}

export async function generateMetadata({ searchParams }: PageProps<"/sach">): Promise<Metadata> {
  const sp = await searchParams;
  const parsed = parseCatalogSearchParams(sp);
  const { heading } = await resolveCatalogContext(parsed);
  return { title: `${heading} – NA Books` };
}

/**
 * Trang catalog /sach (đợt 1b): mọi bộ lọc nằm trên URL, lọc + sắp xếp +
 * phân trang chạy hết ở RPC search_books (đợt 1a).
 */
export default async function SachPage({ searchParams }: PageProps<"/sach">) {
  const sp = await searchParams;
  const parsed = parseCatalogSearchParams(sp);

  const [{ heading, categoryName, categoryChain }, categories, { books, totalCount }] = await Promise.all([
    resolveCatalogContext(parsed),
    getCategoryTree(),
    searchBooks(parsed),
  ]);

  const activeFilterCount = countActiveFilters(parsed);
  // E1.5 mục 2: màu theo danh mục CHA (đầu chuỗi categoryChain), kể cả khi
  // đang lọc theo danh mục con — chỉ 5 danh mục cha có màu riêng.
  const topCategorySlug = categoryChain[0]?.slug;

  return (
    <div className="container-page py-8">
      {parsed.q && parsed.page === 1 && (
        <TrackEvent
          eventType="search"
          metadata={{ q: parsed.q, results_count: totalCount, category: parsed.category ?? null, sort: parsed.sort }}
        />
      )}

      <Breadcrumb items={categoryChainToBreadcrumbItems(categoryChain)} />

      {/*
        A2.3: gộp tiêu đề+số kết quả (trái) và chip lọc+sắp xếp (phải) vào
        MỘT khối, căn baseline — trước đây 2 hàng riêng (mt-2 rồi mt-4) tạo
        2 dải trống ở đầu trang. py-8 (thay vì py-8 md:py-12) để khoảng cách
        từ header xuống tiêu đề không quá 32px.
      */}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-3">
        {/*
          E1.5 mục 5: section-title (vạch chàm trái) bọc quanh CẢ khối tiêu
          đề + số kết quả + dải màu danh mục bên dưới — để vạch chạy hết
          chiều cao khối, không chỉ riêng dòng H1. mục 2: dải màu ngắn dưới
          H1 chỉ hiện khi đang lọc theo 1 trong 5 danh mục cha (không hiện ở
          "Tất cả sách" / kết quả tìm kiếm chữ, vì khi đó không có danh mục
          nào đang chọn để tô màu).
        */}
        <div className="section-title">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-serif text-h1 text-ink-900">{heading}</h1>
            <p className="text-sm text-ink-600">{totalCount} cuốn sách</p>
          </div>
          {topCategorySlug && (
            <div
              aria-hidden="true"
              className={`mt-2 h-1 w-12 rounded-pill ${categoryColorClasses(topCategorySlug).bg}`}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="lg:hidden">
            <MobileFilterSheet
              activeCount={activeFilterCount}
              categories={categories}
              current={parsed}
              totalCount={totalCount}
            />
          </div>
          <FilterChips current={parsed} categoryName={categoryName} />
          <SortSelect value={parsed.sort} />
        </div>
      </div>

      {/*
        E1: mt-12(48px) -> mt-16(64px) — ranh giới "chuyển từ điều hướng
        sang duyệt hàng hoá" cần rõ hơn mức đồng đều 24-32px hiện có ở các
        khoảng cách khác trên trang này (trang tác vụ cố tình giữ ít nhịp,
        xem docs/specs/dot-e-design-plan.md mục 3 — đây là điểm nhịp DUY
        NHẤT được thêm ở trang catalog).
      */}
      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        {/*
          Sửa lỗi đợt B: bỏ max-h/overflow-y-auto (từng tạo vùng cuộn riêng
          bên trong cột lọc — xem .filter-sidebar ở globals.css). Sticky
          (top: 80px) chỉ bật qua media query chiều cao trong đó, không
          còn set trực tiếp bằng class Tailwind ở đây.

          E1: viền phải mảnh tách cột lọc khỏi lưới sách — trước chỉ dựa
          vào khoảng trắng gap-10, giờ thêm 1 đường kẻ để ranh giới rõ hơn
          là chỉ dựa vào mắt đo khoảng cách.

          E1.5 mục 5: viền đổi từ border-line (xám trung tính) sang
          cham-700/15 — viền vẫn rất mảnh/nhạt (15% alpha) nên không cạnh
          tranh với nội dung, nhưng là một điểm neo màu chàm nữa thay vì
          trung tính, nhất quán với "chàm xuất hiện ở mọi phần trang".
        */}
        <aside className="filter-sidebar hidden lg:block lg:border-r lg:border-cham-700/15 lg:pr-8">
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
              <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
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

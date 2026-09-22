import { BookCard } from "@/components/BookCard";
import { type BookSummary, getBooksByCategoryIds, getNewestBooks, resolveCategoryFilter } from "@/lib/queries";

/**
 * Điểm đến của mega-menu (mục 5.1, FR-1.4): lọc theo category_id, category
 * cha gồm cả sách của các category con trực tiếp. Chỉ hỗ trợ lọc category —
 * tìm kiếm/khoảng giá/sắp xếp/phân trang (FR-1.1-1.3, 1.5, 1.8, 1.9, 1.10)
 * chưa nằm trong phạm vi đợt này.
 */
export default async function SachPage({ searchParams }: PageProps<"/sach">) {
  const { category } = await searchParams;
  const categorySlug = typeof category === "string" ? category : undefined;

  let heading = "Tất cả sách";
  let books: BookSummary[];

  if (categorySlug) {
    const filter = await resolveCategoryFilter(categorySlug);
    if (!filter) {
      heading = "Không tìm thấy danh mục";
      books = [];
    } else {
      heading = filter.name;
      books = await getBooksByCategoryIds(filter.categoryIds);
    }
  } else {
    books = await getNewestBooks(60);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-3xl text-ink-900">{heading}</h1>

      {books.length === 0 ? (
        <p className="mt-8 text-ink-600">Chưa có sách nào ở danh mục này. Bạn xem thử danh mục khác nhé.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

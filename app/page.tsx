import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import { Hero } from "@/components/Hero";
import { HomeTabs } from "@/components/HomeTabs";
import {
  getCategoryCounts,
  getCollectionsWithPreview,
  getEditorialPick,
  getFeaturedCollection,
  getNewestBooks,
  searchBooks,
} from "@/lib/queries";

// Trang không dùng API động (cookies/headers/searchParams) nên Next.js sẽ
// static hoá và đóng băng dữ liệu Supabase lúc build nếu không có dòng này.
export const revalidate = 60;

const COLLECTION_STACK_OFFSETS = ["z-30 rotate-[-3deg]", "z-20 translate-y-1", "z-10 translate-y-2 rotate-[3deg]"];

/**
 * C.2: nhịp trang chủ 5 section, nền xen kẽ paper/surface-2 (Hero giữ nền
 * cham-50 riêng, không tính vào chuỗi xen kẽ). Mục 4 (editorial) spec ghim
 * cứng nền surface-2, nên chuỗi bắt đầu từ surface-2 để 2 bên nó (mục 3,5)
 * đều là paper — vẫn xen kẽ đúng nghĩa (không có 2 mục liền kề cùng nền).
 */
export default async function Home() {
  const [featured, newest, bestsellerResult, categoryCounts, editorial, collectionsWithPreview] = await Promise.all([
    getFeaturedCollection(),
    getNewestBooks(8),
    // 1b.1: tab "Bán chạy" dùng chung search_books(p_sort => 'bestseller') với /sach.
    searchBooks({ sort: "bestseller", page: 1 }),
    getCategoryCounts(),
    getEditorialPick(),
    getCollectionsWithPreview(),
  ]);
  const bestselling = bestsellerResult.books.slice(0, 8);

  return (
    <div>
      <Hero collection={featured} />

      {categoryCounts.length > 0 && (
        <section className="bg-surface-2 py-12">
          <div className="container-page">
            <h2 className="font-serif text-h2 font-semibold text-ink-900">Khám phá theo danh mục</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {categoryCounts.map((category) => (
                <Link
                  key={category.id}
                  href={`/sach?category=${category.slug}`}
                  className="hover-lift block rounded-card border border-line bg-surface p-5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
                >
                  <p className="font-serif text-lg font-semibold text-ink-900">{category.name}</p>
                  <p className="mt-1 text-sm text-ink-600">{category.bookCount} cuốn</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-paper py-12">
        <div className="container-page">
          <HomeTabs newest={newest} bestselling={bestselling} />
        </div>
      </section>

      {editorial && (
        <section className="bg-surface-2 py-12">
          <div className="container-page">
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <Link
                href={`/sach/${editorial.book.slug}`}
                className="shrink-0 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
              >
                <BookCover
                  slug={editorial.book.slug}
                  title={editorial.book.title}
                  author={editorial.book.author}
                  coverImageUrl={editorial.book.coverImageUrl}
                  className="w-40 shadow-md sm:w-48"
                />
              </Link>
              <div className="flex-1">
                <span aria-hidden="true" className="font-serif text-5xl leading-none text-cham-700/30">
                  &ldquo;
                </span>
                <blockquote className="-mt-4 font-serif text-h2 text-ink-900">{editorial.curatorNote}</blockquote>
                {/*
                  NFR-6.2: 2 link nằm giữa câu văn nên không thể đổi thành
                  block (sẽ vỡ dòng). inline-block + py-3 (44px vùng bấm,
                  giống Footer) + -my-3 triệt tiêu khoảng cách dòng mà
                  padding thêm vào — chữ vẫn nằm đúng vị trí trong câu,
                  chỉ vùng bấm lớn hơn.
                */}
                <p className="mt-4 text-sm text-ink-600">
                  Về{" "}
                  <Link
                    href={`/sach/${editorial.book.slug}`}
                    className="inline-block rounded-control py-3 -my-3 font-medium text-cham-700 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
                  >
                    {editorial.book.title}
                  </Link>
                  , trong tủ{" "}
                  <Link
                    href={`/tu-sach/${editorial.collectionSlug}`}
                    className="inline-block rounded-control py-3 -my-3 font-medium text-cham-700 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
                  >
                    {editorial.collectionTitle}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-paper py-12">
        <div className="container-page">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-h2 font-semibold text-ink-900">Tủ sách tuyển chọn</h2>
            <Link
              href="/tu-sach"
              className="rounded-control text-sm font-medium text-cham-700 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
            >
              Xem tất cả →
            </Link>
          </div>

          {collectionsWithPreview.length === 0 ? (
            <p className="mt-6 text-ink-600">NA Books chưa có tủ sách nào để giới thiệu. Ghé lại sau nhé.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {collectionsWithPreview.map((collection) => (
                <Link
                  key={collection.slug}
                  href={`/tu-sach/${collection.slug}`}
                  className="hover-lift flex items-center gap-6 rounded-card border border-line bg-surface p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
                >
                  {collection.previewBooks.length > 0 && (
                    <div className="flex shrink-0 items-end -space-x-6">
                      {collection.previewBooks.map((book, i) => (
                        <div
                          key={book.slug}
                          className={`w-14 shrink-0 sm:w-16 ${COLLECTION_STACK_OFFSETS[i % COLLECTION_STACK_OFFSETS.length]}`}
                        >
                          <BookCover
                            slug={book.slug}
                            title={book.title}
                            author={book.author}
                            coverImageUrl={book.coverImageUrl}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg font-semibold text-ink-900">{collection.title}</h3>
                    <p className="mt-1 line-clamp-2 text-body-sm text-ink-600">{collection.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

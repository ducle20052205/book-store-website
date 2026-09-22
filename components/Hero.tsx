import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import type { FeaturedCollection } from "@/lib/queries";

/** Mục 5.2: không có tủ nào featured -> ẩn hero, không báo lỗi. */
export function Hero({ collection }: { collection: FeaturedCollection | null }) {
  if (!collection) return null;

  return (
    <section className="border-b border-line bg-cham-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-center">
        <div className="flex-1 space-y-4">
          <span className="inline-block rounded-control bg-surface px-2 py-1 text-xs font-medium text-cham-700">
            Tuyển chọn
          </span>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
            {collection.title}
          </h1>
          <p className="line-clamp-2 max-w-prose text-ink-600">{collection.description}</p>
          <Link
            href={`/tu-sach/${collection.slug}`}
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-cham-700 px-5 text-sm font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
          >
            Xem tủ sách
          </Link>
        </div>

        {collection.books.length > 0 && (
          <div className="flex flex-1 gap-3 overflow-x-auto pb-1">
            {collection.books.slice(0, 5).map((book) => (
              <div key={book.slug} className="w-24 shrink-0 sm:w-28">
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
      </div>
    </section>
  );
}

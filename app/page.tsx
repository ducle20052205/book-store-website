import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import { EditorNoteConnector } from "@/components/EditorNoteConnector";
import { Hero } from "@/components/Hero";
import { HomeTabs } from "@/components/HomeTabs";
import {
  getBookDescriptionsBySlug,
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

const COLLECTION_STACK_OFFSETS = [
  "z-40 rotate-[-3deg]",
  "z-30 translate-y-1",
  "z-20 translate-y-2 rotate-[3deg]",
  "z-10 translate-y-3 rotate-[-2deg]",
];

/**
 * C.2: nhịp trang chủ 5 section, nền xen kẽ paper/surface-2 (Hero giữ nền
 * cham-700 riêng, không tính vào chuỗi xen kẽ). Mục 4 (editorial) spec ghim
 * cứng nền surface-2, nên chuỗi bắt đầu từ surface-2 để 2 bên nó (mục 3,5)
 * đều là paper — vẫn xen kẽ đúng nghĩa (không có 2 mục liền kề cùng nền).
 *
 * E1: khoảng cách giữa các section không còn đều (từng là py-12/48px cả
 * hai phía mọi nơi) — mỗi section giờ có pt/pb riêng, cộng với section kế
 * cận ra đúng 1 trong 3 mức theo tầm quan trọng của ranh giới đó, không
 * phải theo "section nào cũng giống section nào":
 *   Hero → Khám phá     = 56px  (32 Hero.pb + 24 Khám-phá.pt) — dải tiếp
 *                          theo chỉ là lối tắt, không cần tách xa.
 *   Khám phá → Sách mới = 88px  (48 + 40)
 *   Sách mới → Editorial= 128px (64 + 64) — khoảng rộng nhất trang, tách
 *                          hẳn khối bán hàng khỏi khối "dừng lại đọc".
 *   Editorial → Tủ sách = 88px  (48 + 40)
 *   Tủ sách → Footer    = 104px (56 pb-14 của Tủ sách + 48 padding-top có
 *                          sẵn trong py-12 của chính Footer — ĐÃ ĐO LẠI
 *                          BẰNG SỐ, không phải chỉ còn 56px như ước tính
 *                          ban đầu: padding riêng của Footer vẫn cộng vào
 *                          khoảng cách nhìn thấy được, không "biến mất" chỉ
 *                          vì đổi màu nền. 56px (bằng mức nhỏ nhất ở trên)
 *                          là phần Tủ sách chủ động chọn; 48px còn lại là
 *                          padding tiêu chuẩn của Footer, không phải một
 *                          mức nhịp thứ 4 được tính riêng.
 * Xem docs/specs/dot-e-design-plan.md mục 3 cho wireframe đầy đủ.
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

  // E1: mô tả ngắn cho đúng 2 cuốn đứng đầu mỗi tab (khối "to hơn hẳn").
  const featuredSlugs = [newest[0]?.slug, bestselling[0]?.slug].filter((s): s is string => Boolean(s));
  const featuredDescriptions = await getBookDescriptionsBySlug(featuredSlugs);

  return (
    <div>
      <Hero collection={featured} />

      {categoryCounts.length > 0 && (
        <section className="bg-surface-2 pt-6 pb-12">
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

      <section className="bg-paper pt-10 pb-16">
        <div className="container-page">
          <HomeTabs newest={newest} bestselling={bestselling} featuredDescriptions={featuredDescriptions} />
        </div>
      </section>

      {editorial && (
        <section className="bg-surface-2 pt-16 pb-12">
          <div className="container-page">
            {/*
              E1 mục 1 [Điều chỉnh sau duyệt]: ghi chú biên tập xoay nhẹ
              (-1° — tinh hơn -1.5° gốc vì cỡ chữ ở đây rất lớn, xoay nhiều
              dễ trông lỗi hơn là chủ ý), nét kẻ nối từ mép bìa sang mép chữ
              chỉ hiện ≥768px (EditorNoteConnector tự ẩn dưới ngưỡng đó).
              Nghiêng: text-h2 (28px) ≥18px, curator_note vốn ngắn theo
              thiết kế dữ liệu (1-2 câu) nên line-clamp-3 gần như không bao
              giờ thật sự cắt chữ, chỉ để phòng hờ.
            */}
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
              <EditorNoteConnector className="h-8 w-12 shrink-0 -rotate-3 text-cham-700/50 md:-mr-4" />
              <div className="flex-1 rotate-[-1deg]">
                <span aria-hidden="true" className="font-serif text-5xl leading-none text-cham-700/30">
                  &ldquo;
                </span>
                <blockquote className="-mt-4 line-clamp-3 max-w-[68ch] font-serif text-h2 italic text-ink-900">
                  {editorial.curatorNote}
                </blockquote>
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

      <section className="bg-paper pt-10 pb-14">
        <div className="container-page">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-h2 font-semibold text-ink-900">Tủ sách tuyển chọn</h2>
            <Link
              href="/tu-sach"
              className="rounded-control text-sm font-medium text-cham-700 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
            >
              Xem tất cả
            </Link>
          </div>

          {collectionsWithPreview.length === 0 ? (
            <p className="mt-6 text-ink-600">NA Books chưa có tủ sách nào để giới thiệu. Ghé lại sau nhé.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {collectionsWithPreview.map((collection) => {
                /* E1: tủ nổi bật lớn hơn hẳn — 4 bìa thay vì 3, bìa to hơn,
                   tên bậc H2 thay vì text-lg, mô tả không giới hạn 2 dòng.
                   Ba tủ không còn cùng kích thước như trước. */
                const previewCount = collection.isFeatured ? 4 : 3;
                const books = collection.previewBooks.slice(0, previewCount);
                return (
                  <Link
                    key={collection.slug}
                    href={`/tu-sach/${collection.slug}`}
                    className={`hover-lift flex items-center gap-6 rounded-card border border-line bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 ${
                      collection.isFeatured ? "p-7" : "p-5"
                    }`}
                  >
                    {books.length > 0 && (
                      <div className="flex shrink-0 items-end -space-x-6">
                        {books.map((book, i) => (
                          <div
                            key={book.slug}
                            className={`shrink-0 ${collection.isFeatured ? "w-16 sm:w-20" : "w-14 sm:w-16"} ${COLLECTION_STACK_OFFSETS[i % COLLECTION_STACK_OFFSETS.length]}`}
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
                      {collection.isFeatured ? (
                        <h3 className="font-serif text-h2 font-semibold text-ink-900">{collection.title}</h3>
                      ) : (
                        <h3 className="font-serif text-lg font-semibold text-ink-900">{collection.title}</h3>
                      )}
                      <p
                        className={`mt-1 max-w-[68ch] text-ink-600 ${
                          collection.isFeatured ? "text-body-sm" : "line-clamp-2 text-body-sm"
                        }`}
                      >
                        {collection.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

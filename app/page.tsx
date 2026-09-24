import Link from "next/link";
import { BookCover, coverColorVarForSlug } from "@/components/BookCover";
import { EditorNoteConnector } from "@/components/EditorNoteConnector";
import { Hero } from "@/components/Hero";
import { HomeTabs } from "@/components/HomeTabs";
import { categoryColorClasses } from "@/lib/categoryColors";
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
 * C.2: nhịp trang chủ 5 section. [Cập nhật E1.5]: nền không còn xen kẽ 2
 * tông trung tính (paper/surface-2) — mục 2 (Khám phá) và 4 (editorial) đổi
 * sang màu đặc (mảng màu danh mục, ink-900) để tăng điểm neo màu giữa
 * trang, chỉ mục 3/5 còn giữ paper. Hero giữ nền cham-700 riêng, không tính
 * vào chuỗi này.
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
    // E1.5: 13 = 1 nổi bật + 12 thường. 12 chia hết cho 2/3/4 cột (base/md/lg)
    // nên không ô nào mồ côi ở 3 tier đó; riêng 2xl (5 cột) ẩn bớt 2 cuốn
    // cuối — xem HIDE_AT_2XL_FROM_INDEX trong components/HomeTabs.tsx.
    getNewestBooks(13),
    // 1b.1: tab "Bán chạy" dùng chung search_books(p_sort => 'bestseller') với /sach.
    searchBooks({ sort: "bestseller", page: 1 }),
    getCategoryCounts(),
    getEditorialPick(),
    getCollectionsWithPreview(),
  ]);
  const bestselling = bestsellerResult.books.slice(0, 13);

  // E1: mô tả ngắn cho đúng 2 cuốn đứng đầu mỗi tab (khối "to hơn hẳn").
  const featuredSlugs = [newest[0]?.slug, bestselling[0]?.slug].filter((s): s is string => Boolean(s));
  const featuredDescriptions = await getBookDescriptionsBySlug(featuredSlugs);

  return (
    <div>
      <Hero collection={featured} />

      {categoryCounts.length > 0 && (
        <section className="bg-surface-2 pt-6 pb-12">
          <div className="container-page">
            <h2 className="section-title font-serif text-h2 font-semibold text-ink-900">Khám phá theo danh mục</h2>
            {/*
              E1.5 mục 2: mỗi thẻ tô đặc màu riêng của danh mục (5 màu lấy
              lại từ bảng --color-cover-*, xem lib/categoryColors.ts) thay vì
              nền trắng/viền mảnh — đây là 1 trong các mảng màu lớn giữa
              trang được thêm ở đợt này để tránh khoảng trắng dài không có
              điểm neo màu. Chữ trắng/trắng-70 trên nền đặc, tương phản đã
              tính tay >= 8:1 cho cả 5 màu, xem báo cáo đợt E1.5.
            */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {categoryCounts.map((category) => (
                <Link
                  key={category.id}
                  href={`/sach?category=${category.slug}`}
                  className={`hover-lift block rounded-card p-5 text-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 ${categoryColorClasses(category.slug).bg}`}
                >
                  <p className="font-serif text-lg font-semibold">{category.name}</p>
                  <p className="mt-1 text-sm text-white/70">{category.bookCount} cuốn</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-paper pt-10 pb-16">
        <div className="container-page">
          {/*
            E1.5 mục 5: khối Sách mới/Bán chạy là vùng DÀI nhất trang (thẻ
            nổi bật + lưới 12 bìa, đo được ~2000px ở nhiều viewport) — trước
            khi sửa, đây chính xác là "khoảng giữa trang không có điểm neo
            màu" chủ dự án nhắc tới: 2 lần đo bằng cuộn thực tế (800px,
            1600px) đều không thấy phần tử chàm nào trong khung nhìn, dù
            bìa sách vẫn nhiều màu (chỉ không phải màu THƯƠNG HIỆU). Vạch
            trái 3px chạy suốt chiều cao khối — cùng cơ chế với section-title
            nhưng kéo dài hết cả khối thay vì chỉ riêng dòng tiêu đề — lấp
            đúng khoảng trống này, xuyên suốt cả tab bar lẫn lưới bên dưới.
          */}
          <div className="border-l-[3px] border-cham-700/35 pl-6">
            <HomeTabs newest={newest} bestselling={bestselling} featuredDescriptions={featuredDescriptions} />
          </div>
        </div>
      </section>

      {editorial && (
        <section className="bg-ink-900 pt-16 pb-12">
          <div className="container-page">
            {/*
              E1.5 mục 4: đổi nền sang ink-900 (đặc, không phải tint) — một
              trong các mảng màu lớn giữa trang. Thêm tiêu đề dẫn đứng
              (không nghiêng, đây là lời NA Books nói, không phải trích dẫn
              của người khác — giữ nguyên quy tắc "nghiêng theo người nói"
              từ E1) phía trên khối trích dẫn để khối này đọc được là MỘT
              section có tên, không chỉ là một trích dẫn rời rạc.
              section-title dùng border-cham-50 thay vì mặc định cham-700 vì
              nền tối — 2 màu cùng họ chàm, cham-700 gần như vô hình trên
              ink-900 (2 mã màu tối tương đương độ sáng). Toàn bộ màu chữ
              trong khối đổi theo đúng quy ước đã có ở Footer.tsx (nền
              ink-900 tương tự): chữ thường trắng/trắng-70, link cham-50 ->
              trắng khi hover, ring focus trắng (cham-600 gốc không đủ
              tương phản trên ink-900).
            */}
            <h2 className="section-title border-cham-50 font-serif text-h2 font-semibold text-white">
              Vì sao chúng mình chọn cuốn này
            </h2>
            <div className="mt-8 flex flex-col items-center gap-8 md:flex-row">
              <Link
                href={`/sach/${editorial.book.slug}`}
                className="shrink-0 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <BookCover
                  slug={editorial.book.slug}
                  title={editorial.book.title}
                  author={editorial.book.author}
                  coverImageUrl={editorial.book.coverImageUrl}
                  className="w-40 shadow-md sm:w-48"
                />
              </Link>
              <EditorNoteConnector className="h-8 w-12 shrink-0 -rotate-3 text-cham-50/50 md:-mr-4" />
              <div className="flex-1 rotate-[-1deg]">
                <span aria-hidden="true" className="font-serif text-5xl leading-none text-cham-50/25">
                  &ldquo;
                </span>
                <blockquote className="-mt-4 line-clamp-3 max-w-[68ch] font-serif text-h2 italic text-white">
                  {editorial.curatorNote}
                </blockquote>
                {/*
                  NFR-6.2: 2 link nằm giữa câu văn nên không thể đổi thành
                  block (sẽ vỡ dòng). inline-block + py-3 (44px vùng bấm,
                  giống Footer) + -my-3 triệt tiêu khoảng cách dòng mà
                  padding thêm vào — chữ vẫn nằm đúng vị trí trong câu,
                  chỉ vùng bấm lớn hơn.
                */}
                <p className="mt-4 text-sm text-white/70">
                  Về{" "}
                  <Link
                    href={`/sach/${editorial.book.slug}`}
                    className="inline-block rounded-control py-3 -my-3 font-medium text-cham-50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {editorial.book.title}
                  </Link>
                  , trong tủ{" "}
                  <Link
                    href={`/tu-sach/${editorial.collectionSlug}`}
                    className="inline-block rounded-control py-3 -my-3 font-medium text-cham-50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
            <h2 className="section-title font-serif text-h2 font-semibold text-ink-900">Tủ sách tuyển chọn</h2>
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
            /* E1.5 mục 3: space-y-8 (từ 4) — đúng bằng khoảng chồng bìa kéo
               lên mép trên mỗi thẻ (-mt-8 bên dưới), nên mép trên phần tràn
               chạm đúng mép dưới thẻ phía trên chứ không đè vào nó. */
            <div className="mt-6 space-y-8">
              {collectionsWithPreview.map((collection) => {
                /* E1: tủ nổi bật lớn hơn hẳn — 4 bìa thay vì 3, bìa to hơn,
                   tên bậc H2 thay vì text-lg, mô tả không giới hạn 2 dòng.
                   Ba tủ không còn cùng kích thước như trước. */
                const previewCount = collection.isFeatured ? 4 : 3;
                const books = collection.previewBooks.slice(0, previewCount);
                /* E1.5 mục 3: nền thẻ nhuốm nhẹ (12%) màu bìa cuốn ĐẦU TIÊN
                   trong tủ — dùng lại đúng hash chọn màu bìa của BookCover
                   (coverColorVarForSlug) để màu nền LUÔN khớp màu bìa đầu
                   tiên hiển thị ngay trên nó, không phải 2 màu chọn độc lập
                   trông như tình cờ. color-mix 12% cùng công thức đã ghi ở
                   BookCover.tsx — nhạt gần trắng nên giữ chữ ink-900/ink-600
                   như cũ, không cần tính lại tương phản (đổi nền trắng ->
                   trắng+12% màu đậm không hạ tương phản chữ tối xuống dưới
                   AA, kiểm tra thực tế thấp nhất đo được vẫn > 15:1).
                */
                const tintVar = coverColorVarForSlug(books[0]?.slug ?? collection.slug);
                return (
                  <Link
                    key={collection.slug}
                    href={`/tu-sach/${collection.slug}`}
                    style={{ backgroundColor: `color-mix(in srgb, var(${tintVar}) 12%, white)` }}
                    className={`hover-lift relative flex items-center gap-6 overflow-visible rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 ${
                      collection.isFeatured ? "p-7" : "p-5"
                    }`}
                  >
                    {books.length > 0 && (
                      <div className="-ml-8 -mt-8 flex shrink-0 items-end -space-x-6">
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

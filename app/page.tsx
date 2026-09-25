import Link from "next/link";
import { BookCover, coverColorVarForSlug } from "@/components/BookCover";
import { EditorNoteConnector } from "@/components/EditorNoteConnector";
import { Hero } from "@/components/Hero";
import { HomeTabs } from "@/components/HomeTabs";
import { categoryColorClasses } from "@/lib/categoryColors";
import {
  getCategoryCounts,
  getCollectionsWithPreview,
  getEditorialPick,
  getFeaturedBookExtrasBySlug,
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
 * sang màu đặc (mảng màu danh mục, cham-900 — F1.1) để tăng điểm neo màu
 * giữa trang, chỉ mục 3/5 còn giữ paper. Hero giữ nền cham-700 riêng, không
 * tính vào chuỗi này.
 *
 * E1: khoảng cách giữa các section không còn đều (từng là py-12/48px cả
 * hai phía mọi nơi) — mỗi section giờ có pt/pb riêng, cộng với section kế
 * cận ra đúng 1 trong 3 mức theo tầm quan trọng của ranh giới đó, không
 * phải theo "section nào cũng giống section nào". [Đợt F, F3]: TỔNG 3 mức
 * (56/88/128) giữ nguyên như đã chốt, nhưng padding RIÊNG của 2 section
 * tối (editorial, footer) phải >= 72px để mảng màu có sức nặng — phần
 * chênh lệch chuyển bớt sang section sáng liền kề (padding của nó giảm
 * tương ứng để tổng không đổi), không thêm khoảng trắng đệm ở ranh giới:
 *   Hero → Khám phá     = 56px  (32 Hero.pb + 24 Khám-phá.pt) — không đổi,
 *                          Hero không nằm trong 2 section tối F3 nhắc tới.
 *   Khám phá → Sách mới = 88px  (48 + 40) — không đổi.
 *   Sách mới → Editorial= 128px (56 Sách-mới.pb + 72 Editorial.pt — trước
 *                          64+64, giảm Sách-mới còn 56 để Editorial tăng
 *                          lên 72 mà tổng vẫn 128).
 *   Editorial → Tủ sách = 88px  (72 Editorial.pb + 16 Tủ-sách.pt — trước
 *                          48+40, tương tự trên).
 *   Tủ sách → Footer    = 104px (32 Tủ-sách.pb + 72 Footer.pt — trước 56+48).
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
  // Đợt F [F2.1]: lấy kèm nhãn danh mục cho cùng 2 cuốn đó.
  const featuredSlugs = [newest[0]?.slug, bestselling[0]?.slug].filter((s): s is string => Boolean(s));
  const featuredExtras = await getFeaturedBookExtrasBySlug(featuredSlugs);

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

              Đợt F [F2.2]: chiều cao cố định 112px (giữa khoảng 104-120px
              yêu cầu) thay vì cao theo nội dung (p-5 + 2 dòng chữ trước đây
              cao hơn hẳn, không đều với các thẻ ít chữ) — flex căn giữa dọc
              để tên danh mục luôn ở chính giữa thẻ bất kể độ dài tên 1 hay 2
              dòng. Hover đổi từ .hover-lift dùng chung (nâng 3px + đổi
              shadow) sang nâng đúng 2px, chỉ transform, không đổi shadow/
              kích thước — spec F2.2 yêu cầu con số cụ thể khác với các thẻ
              hover-lift còn lại trên trang.
            */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {categoryCounts.map((category) => (
                <Link
                  key={category.id}
                  href={`/sach?category=${category.slug}`}
                  className={`flex h-[112px] flex-col items-center justify-center rounded-card px-3 text-center text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 ${categoryColorClasses(category.slug).bg}`}
                >
                  <p className="font-serif text-lg font-semibold">{category.name}</p>
                  <p className="mt-1 text-sm text-white/70">{category.bookCount} cuốn</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-paper pt-10 pb-14">
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
            <HomeTabs newest={newest} bestselling={bestselling} featuredExtras={featuredExtras} />
          </div>
        </div>
      </section>

      {editorial && (
        <section className="bg-cham-900 pt-18 pb-18">
          <div className="container-page">
            {/*
              E1.5 mục 4: đổi nền sang đặc (không phải tint) — một trong các
              mảng màu lớn giữa trang. Thêm tiêu đề dẫn đứng (không nghiêng,
              đây là lời NA Books nói, không phải trích dẫn của người khác —
              giữ nguyên quy tắc "nghiêng theo người nói" từ E1) phía trên
              khối trích dẫn để khối này đọc được là MỘT section có tên,
              không chỉ là một trích dẫn rời rạc.

              [Đợt F, F1.1]: nền đổi từ ink-900 sang cham-900 (hợp nhất họ
              màu tối với Hero/Footer — xem app/globals.css). section-title
              dùng border-cham-50 thay vì mặc định cham-700 vì cả 2 đều tối,
              cham-700 vẫn không đủ nổi trên cham-900. Toàn bộ màu chữ trong
              khối theo đúng quy ước đã có ở Footer.tsx (cùng họ nền tối):
              chữ thường trắng/trắng-70, link cham-50 -> trắng khi hover,
              ring focus trắng (cham-600 gốc không đủ tương phản trên nền
              tối).
            */}
            <h2 className="section-title border-cham-50 font-serif text-h2 font-semibold text-white">
              Vì sao chúng mình chọn cuốn này
            </h2>
            {/*
              Đợt F [F2.3]: 2 cột LẤP ĐẦY chiều ngang — cột trái cố định
              200-240px (trước w-40/w-48 = 160/192px, dưới sàn yêu cầu), cột
              phải flex-1 nhận hết phần còn lại. Bỏ hẳn max-w-[68ch] trên
              blockquote — đây chính là nguyên nhân "gần nửa bên phải trống
              trơn" trong chẩn đoán: cột phải tuy flex-1 (chiếm đủ chỗ) vẫn
              hiện trống vì CHỮ bên trong bị chặn ở 68 ký tự/dòng, không đầy
              hết khối cha. Thêm dòng tác giả (trước đây thiếu hẳn).
            */}
            <div className="mt-8 flex flex-col items-center gap-8 md:flex-row">
              <Link
                href={`/sach/${editorial.book.slug}`}
                className="w-48 shrink-0 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:w-56"
              >
                <BookCover
                  slug={editorial.book.slug}
                  title={editorial.book.title}
                  author={editorial.book.author}
                  coverImageUrl={editorial.book.coverImageUrl}
                  className="shadow-md"
                />
              </Link>
              <EditorNoteConnector className="h-8 w-12 shrink-0 -rotate-3 text-cham-50/50 md:-mr-4" />
              <div className="w-full flex-1 rotate-[-1deg]">
                <span aria-hidden="true" className="font-serif text-5xl leading-none text-cham-50/25">
                  &ldquo;
                </span>
                <blockquote className="-mt-4 line-clamp-3 font-serif text-h2 italic text-white">
                  {editorial.curatorNote}
                </blockquote>
                {/*
                  NFR-6.2: link nằm giữa câu văn nên không thể đổi thành
                  block (sẽ vỡ dòng). inline-block + py-3 (44px vùng bấm,
                  giống Footer) + -my-3 triệt tiêu khoảng cách dòng mà
                  padding thêm vào — chữ vẫn nằm đúng vị trí trong câu,
                  chỉ vùng bấm lớn hơn.
                */}
                <p className="mt-4 text-sm text-white/70">
                  <Link
                    href={`/sach/${editorial.book.slug}`}
                    className="inline-block rounded-control py-3 -my-3 font-medium text-cham-50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {editorial.book.title}
                  </Link>{" "}
                  — {editorial.book.author}
                </p>
                <p className="text-sm text-white/70">
                  Trong tủ{" "}
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

      <section className="bg-paper pt-4 pb-8">
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
            /*
              Đợt F [F2.4]: đổi từ danh sách thẻ ngang (mỗi thẻ 1 hàng dài,
              chỉ chứa ảnh nhỏ + 2 dòng chữ — chẩn đoán gọi đây là "dàn
              ngang") sang LƯỚI 3 cột (2 cột tablet, 1 cột mobile), mỗi thẻ
              giờ dọc: dải bìa tràn ngang phía trên, tên + mô tả bên dưới.
              Tủ nổi bật chiếm 2 cột (sm:col-span-2 — tự áp lên cả lg vì
              Tailwind là min-width, không cần khai lại riêng ở lg).
            */
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collectionsWithPreview.map((collection) => {
                /* E1: tủ nổi bật lớn hơn hẳn — 4 bìa thay vì 3, bìa to hơn,
                   tên bậc H2 thay vì text-lg, mô tả không giới hạn dòng. */
                const previewCount = collection.isFeatured ? 4 : 3;
                const books = collection.previewBooks.slice(0, previewCount);
                /* E1.5 mục 3 [Đợt F: nhạt thêm]: nền thẻ nhuốm màu bìa cuốn
                   ĐẦU TIÊN trong tủ — dùng lại đúng hash chọn màu bìa của
                   BookCover (coverColorVarForSlug) để màu nền LUÔN khớp bìa
                   đầu tiên hiển thị ngay trên nó. F [F2.4]: đo lại chênh
                   sáng với nền trang (paper mới, đậm hơn hẳn bản E1.5) —
                   12% không còn đủ 4% chênh sáng ở tủ màu tối (vd. cover-9
                   xám than), nâng lên 18% cho toàn bộ 3 tủ để nhất quán một
                   công thức, xem số đo trong báo cáo đợt F.
                */
                const tintVar = coverColorVarForSlug(books[0]?.slug ?? collection.slug);
                return (
                  <Link
                    key={collection.slug}
                    href={`/tu-sach/${collection.slug}`}
                    style={{ backgroundColor: `color-mix(in srgb, var(${tintVar}) 18%, white)` }}
                    className={`hover-lift flex flex-col rounded-card p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 ${
                      collection.isFeatured ? "sm:col-span-2" : ""
                    }`}
                  >
                    {books.length > 0 && (
                      <div className="flex">
                        {books.map((book, i) => (
                          <div
                            key={book.slug}
                            className={`${i > 0 ? "-ml-6" : ""} ${collection.isFeatured ? "basis-1/4" : "basis-1/3"} ${COLLECTION_STACK_OFFSETS[i % COLLECTION_STACK_OFFSETS.length]}`}
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
                    <div className="mt-5 min-w-0">
                      {collection.isFeatured ? (
                        <h3 className="font-serif text-h2 font-semibold text-ink-900">{collection.title}</h3>
                      ) : (
                        <h3 className="font-serif text-lg font-semibold text-ink-900">{collection.title}</h3>
                      )}
                      <p
                        className={`mt-1 text-ink-600 ${
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCard } from "@/components/BookCard";
import { BookCover } from "@/components/BookCover";
import { Breadcrumb, categoryChainToBreadcrumbItems } from "@/components/Breadcrumb";
import { EditorNoteConnector } from "@/components/EditorNoteConnector";
import { Price } from "@/components/Price";
import { PurchasePanel } from "@/components/PurchasePanel";
import { StockLabel } from "@/components/StockLabel";
import { TrackEvent } from "@/components/TrackEvent";
import {
  type BookDetail,
  getBookBySlug,
  getBookCollections,
  getCategoryChainById,
  getRelatedBooks,
} from "@/lib/queries";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function formatDateVN(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

interface InfoRow {
  label: string;
  value: React.ReactNode;
}

/**
 * E1 [Điều chỉnh sau duyệt, mục 4]: bỏ dòng "Danh mục" từng có ở đây — đã
 * trùng breadcrumb ngay phía trên <h1>, breadcrumb đã hiện đúng tên danh
 * mục kèm link. Không còn dùng categoryChain nên bỏ luôn tham số.
 */
function buildInfoRows(book: BookDetail): InfoRow[] {
  const rows: InfoRow[] = [];

  if (book.translator) rows.push({ label: "Người dịch", value: book.translator });
  if (book.publisher) rows.push({ label: "Nhà xuất bản", value: book.publisher });
  if (book.isbn) rows.push({ label: "ISBN", value: book.isbn });
  if (book.pageCount) rows.push({ label: "Số trang", value: String(book.pageCount) });
  if (book.dimensions) rows.push({ label: "Kích thước", value: book.dimensions });
  if (book.publishDate) rows.push({ label: "Ngày phát hành", value: formatDateVN(book.publishDate) });

  return rows;
}

const COMPACT_INFO_ROW_LIMIT = 2;

/**
 * A2.2: dưới 3 dòng (dữ liệu seed hiện để trống nhiều field) thì bỏ tiêu đề
 * "Thông tin sách" và hiển thị gọn dạng metadata thay vì bảng đầy đủ —
 * tránh 1 dòng đơn độc trông như lỗi bố cục. Từ 3 dòng trở lên mới tách
 * thành khối bảng có tiêu đề riêng.
 */
function BookInfoBlock({ rows }: { rows: InfoRow[] }) {
  if (rows.length === 0) return null;

  if (rows.length <= COMPACT_INFO_ROW_LIMIT) {
    return (
      <dl className="mt-5 space-y-1.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap gap-x-1.5">
            <dt className="text-ink-600">{row.label}:</dt>
            <dd className="text-ink-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="font-serif text-lg font-semibold text-ink-900">Thông tin sách</h2>
      <table className="mt-3 w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line">
              <th scope="row" className="w-36 py-2 pr-4 text-left font-normal text-ink-600">
                {row.label}
              </th>
              <td className="py-2 text-ink-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps<"/sach/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  return {
    title: `${book.title} – ${book.author} | NA Books`,
    description: book.description ? book.description.slice(0, 160) : undefined,
  };
}

/** 1c.1/1c.2: trang chi tiết sách /sach/[slug]. */
export default async function BookDetailPage({ params }: PageProps<"/sach/[slug]">) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const [categoryChain, collections, related] = await Promise.all([
    getCategoryChainById(book.categoryId),
    getBookCollections(book.id),
    getRelatedBooks(book),
  ]);

  const infoRows = buildInfoRows(book);
  const inStock = book.stockQuantity > 0;

  return (
    <div className="container-page py-8 pb-28 md:py-12 md:pb-12">
      <TrackEvent eventType="page_view" metadata={{ page: "book_detail", book_id: book.id, slug: book.slug }} />

      {/*
        A2.2: lưới 2 cột cố định 380px/1fr (không dùng 40% như trước — bìa
        40% của khung 1200px có thể lên tới ~700px cao, thừa nhiều so với
        cột phải). items-start để cột phải không bị kéo dãn bằng chiều cao
        bìa — tránh khoảng trắng chết ở cuối cột phải khi bìa cao hơn.
      */}
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[380px_1fr] md:gap-14">
        <div>
          <BookCover
            slug={book.slug}
            title={book.title}
            author={book.author}
            coverImageUrl={book.coverImageUrl}
            sizes="(min-width: 768px) 380px, 60vw"
            className="max-w-[240px] shadow-md md:max-w-none"
          />
        </div>

        <div>
          <Breadcrumb items={categoryChainToBreadcrumbItems(categoryChain)} />

          <h1 className="mt-3 font-serif text-book-title font-semibold text-ink-900">{book.title}</h1>
          <p className="mt-2 text-sm text-ink-600">
            Tác giả:{" "}
            <Link
              href={`/sach?q=${encodeURIComponent(book.author)}`}
              className="font-medium text-cham-700 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
            >
              {book.author}
            </Link>
          </p>

          <div className="mt-4">
            <Price price={book.price} discountPrice={book.discountPrice} className="text-2xl" />
          </div>

          <div className="mt-2">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckIcon /> Còn hàng
              </span>
            ) : (
              <StockLabel stockQuantity={book.stockQuantity} />
            )}
          </div>

          <div className="mt-5">
            <PurchasePanel stockQuantity={book.stockQuantity} />
          </div>

          <BookInfoBlock rows={infoRows} />

          {/*
            [Lệch spec A2.2 — có lý do, xem báo cáo]: spec yêu cầu đưa mô
            tả xuống "Phần dưới" full-width, nhưng đo thực tế thì grid vẫn
            cao bằng CHIỀU CAO BÌA (bìa là cột lưới, "items-start" chỉ ảnh
            hưởng vị trí nội dung TRONG cột, không rút ngắn hàng lưới) —
            nghĩa là chuyển mô tả xuống dưới không hề xóa khoảng trống chết,
            chỉ dời nó xuống dưới cột phải, đo được 334px (vượt xa mức tối
            đa 120px). Giữ mô tả + mục lục trong cột phải để chúng lấp vào
            đúng chỗ trống cạnh bìa — cách duy nhất thực sự xóa khoảng
            trống khi bìa cao hơn phần chữ. "Có trong tủ sách"/"Sách liên
            quan" vẫn chuyển xuống full-width vì chúng vốn cần bề ngang lớn
            (lưới sách liên quan 4 cột), không phải nguồn gây khoảng trống.
          */}
          {book.description && (
            <div className="mt-8">
              <h2 className="font-serif text-lg font-semibold text-ink-900">Giới thiệu sách</h2>
              <p className="mt-2 max-w-[68ch] whitespace-pre-line text-body text-ink-600">{book.description}</p>
            </div>
          )}

          {book.tableOfContents && (
            <details className="mt-8">
              <summary className="cursor-pointer font-serif text-lg font-semibold text-ink-900">Mục lục</summary>
              <p className="mt-2 max-w-[68ch] whitespace-pre-line text-sm leading-relaxed text-ink-600">
                {book.tableOfContents}
              </p>
            </details>
          )}
        </div>
      </div>

      <div className="mt-12 space-y-10">
        {collections.length > 0 && (
          <div className="space-y-8">
            {/*
              E1 mục 1 [Điều chỉnh sau duyệt]: bỏ khung hộp bg-cham-50 —
              ghi chú trong lề không nằm trong hộp. Thêm bìa nhỏ của chính
              cuốn đang xem (trang này chưa có bìa nào cục bộ trong khối,
              bìa lớn ở đầu trang cách quá xa để nét kẻ nối tới hợp lý) làm
              điểm neo cho nét kẻ. Nghiêng: text-lg (18px, đúng ngưỡng tối
              thiểu) + line-clamp-3.
            */}
            {collections.map((collection) => (
              <div key={collection.slug} className="flex gap-4">
                <BookCover
                  slug={book.slug}
                  title={book.title}
                  author={book.author}
                  coverImageUrl={book.coverImageUrl}
                  className="w-16 shrink-0"
                />
                <EditorNoteConnector className="h-6 w-10 shrink-0 -rotate-6 self-center text-cham-700/40" />
                <div className="min-w-0 flex-1 rotate-[-1deg]">
                  <p className="text-xs font-semibold text-ink-600">
                    Có trong tủ{" "}
                    <Link
                      href={`/tu-sach/${collection.slug}`}
                      className="font-semibold text-cham-700 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
                    >
                      {collection.title}
                    </Link>
                  </p>
                  <blockquote className="relative mt-2 max-w-[68ch] pl-5 font-serif text-lg italic text-ink-900">
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-0 -translate-y-1 text-2xl leading-none not-italic text-cham-700/40"
                    >
                      &ldquo;
                    </span>
                    <span className="line-clamp-3">{collection.curatorNote}</span>
                  </blockquote>
                  <Link
                    href={`/tu-sach/${collection.slug}`}
                    className="mt-2 inline-block text-sm font-medium text-cham-700 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
                  >
                    Xem cả tủ sách ({collection.bookCount} cuốn)
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {related && (
          <div>
            <h2 className="font-serif text-h2 font-semibold text-ink-900">{related.heading}</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {related.books.map((relatedBook) => (
                <BookCard key={relatedBook.slug} book={relatedBook} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

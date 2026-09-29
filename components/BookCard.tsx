import Link from "next/link";
import { BookCover } from "./BookCover";
import { getPercentOff, Price } from "./Price";
import { StockLabel } from "./StockLabel";

interface BookCardBook {
  slug: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  price: number;
  discountPrice?: number | null;
  stockQuantity: number;
  /** E3: tên danh mục CON của chính cuốn sách — nhãn nhỏ, không phải màu. */
  categoryName?: string | null;
  /** E3: tủ sách tuyển chọn chứa cuốn này, nếu có — null nghĩa là không thuộc tủ nào. */
  collectionRef?: { slug: string; title: string } | null;
}

/**
 * B.3: phân cấp trọng lượng thị giác giá > tên > tác giả (giá đậm/lớn hơn
 * — KHÔNG phải thứ tự xếp dọc, thứ tự đọc vẫn tên > tác giả > giá). Badge
 * -X% chuyển lên góc trên trái ảnh bìa (thay vì cạnh giá) — tự tính
 * percentOff ở đây và ẩn badge mặc định của <Price> qua hideBadge.
 *
 * Sửa lỗi sau đợt B: nhãn "Hết hàng" từng đặt absolute đè lên bìa — với
 * biến thể "Dưới" (chữ dồn xuống đáy) và "Có khung" thì nhãn che mất tên
 * sách/tác giả. Chuyển hẳn ra ngoài bìa, đặt ngay trên tên sách, không còn
 * chồng lên bất kỳ chữ nào trên bìa ở cả 4 biến thể.
 *
 * E3: thêm nhãn danh mục con + chip "Trong tủ sách" — gộp CHUNG 1 dòng
 * (text-micro, không padding/pill) thay vì 2 dòng riêng, để chiều cao thẻ
 * chỉ tăng đúng 1 dòng dù có 1 hay cả 2 nhãn cùng lúc (ràng buộc: chênh
 * không quá 24px — đo thực tế xem báo cáo đợt E3). Không dùng pill có
 * padding cho chip (như FeaturedBook ở đợt F) vì dòng này LUÔN xuất hiện
 * (categoryName gần như không bao giờ null), pill sẽ đội chiều cao thêm
 * ~8px padding dọc mỗi thẻ — phân biệt "Trong tủ sách" bằng màu chữ
 * (cham-700, đậm) thay vì hình khối. Tên tủ hiện qua thuộc tính title gốc
 * của trình duyệt (rê chuột) — không lồng thêm <Link> thứ hai vì cả thẻ đã
 * là 1 link lớn.
 *
 * `truncate` (không phải flex-wrap): tên danh mục con dài nhất hiện có
 * ("Trinh thám – Kinh dị") cộng "Trong tủ sách" có thể KHÔNG vừa 1 dòng ở
 * thẻ hẹp nhất (2 cột mobile, ~159px) — nếu cho xuống dòng, dòng thứ 2 phá
 * luôn giới hạn chênh 24px. `truncate` buộc dòng này LUÔN đúng 1 dòng
 * (line-height cố định 16.8px) bất kể độ dài nội dung, phần thừa hiện dấu
 * "…" thay vì đẩy chiều cao — an toàn cho ràng buộc theo cấu trúc, không
 * phải "vừa đủ trong đa số trường hợp".
 */
export function BookCard({ book, className }: { book: BookCardBook; className?: string }) {
  const percentOff =
    book.discountPrice != null && book.discountPrice < book.price
      ? getPercentOff(book.price, book.discountPrice)
      : null;
  const categoryName = book.categoryName ?? null;
  const collectionRef = book.collectionRef ?? null;

  return (
    <Link
      href={`/sach/${book.slug}`}
      className={`book-card-lift group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 ${className ?? ""}`}
    >
      <div className="relative">
        <BookCover
          slug={book.slug}
          title={book.title}
          author={book.author}
          coverImageUrl={book.coverImageUrl}
        />
        {percentOff !== null && (
          <span
            aria-hidden="true"
            className="absolute left-2 top-2 rounded-pill bg-nghe-400 px-2 py-0.5 text-micro font-semibold text-ink-900"
          >
            -{percentOff}%
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <StockLabel stockQuantity={book.stockQuantity} />
        {(categoryName || collectionRef) && (
          <p className="truncate text-micro">
            {categoryName && <span className="text-ink-400">{categoryName}</span>}
            {categoryName && collectionRef && (
              <span aria-hidden="true" className="text-ink-400">
                {" "}
                ·{" "}
              </span>
            )}
            {collectionRef && (
              <span title={`Trong tủ sách: ${collectionRef.title}`} className="font-semibold text-cham-700">
                Trong tủ sách
              </span>
            )}
          </p>
        )}
        <p className="line-clamp-2 font-sans text-card-title font-medium text-ink-900">{book.title}</p>
        <p className="text-meta text-ink-400">{book.author}</p>
        <Price
          price={book.price}
          discountPrice={book.discountPrice}
          hideBadge
          className="text-card-price font-semibold"
        />
      </div>
    </Link>
  );
}

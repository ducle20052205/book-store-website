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
}

/**
 * B.3: phân cấp trọng lượng thị giác giá > tên > tác giả. Badge -X% chuyển
 * lên góc trên trái ảnh bìa (thay vì cạnh giá) — tự tính percentOff ở đây và
 * ẩn badge mặc định của <Price> qua hideBadge.
 */
export function BookCard({ book }: { book: BookCardBook }) {
  const percentOff =
    book.discountPrice != null && book.discountPrice < book.price
      ? getPercentOff(book.price, book.discountPrice)
      : null;

  return (
    <Link
      href={`/sach/${book.slug}`}
      className="book-card-lift group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
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
        <StockLabel stockQuantity={book.stockQuantity} className="absolute bottom-2 left-2" />
      </div>

      <div className="mt-3 space-y-1">
        <Price
          price={book.price}
          discountPrice={book.discountPrice}
          hideBadge
          className="text-card-price font-semibold"
        />
        <p className="line-clamp-2 font-sans text-card-title font-medium text-ink-900">{book.title}</p>
        <p className="text-meta text-ink-400">{book.author}</p>
      </div>
    </Link>
  );
}

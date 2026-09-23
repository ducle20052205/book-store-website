import Link from "next/link";
import { BookCover } from "./BookCover";
import { Price } from "./Price";
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

export function BookCard({ book }: { book: BookCardBook }) {
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
        <StockLabel stockQuantity={book.stockQuantity} className="absolute bottom-2 left-2" />
      </div>

      <div className="mt-2 space-y-1">
        <p className="line-clamp-2 font-sans text-sm font-medium text-ink-900">
          {book.title}
        </p>
        <p className="text-xs text-ink-400">{book.author}</p>
        <Price price={book.price} discountPrice={book.discountPrice} className="text-sm" />
      </div>
    </Link>
  );
}

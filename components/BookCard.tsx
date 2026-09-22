import Image from "next/image";
import Link from "next/link";
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
      href={`/books/${book.slug}`}
      className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-card border border-line bg-surface transition-shadow group-hover:shadow-sm">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            fill
            sizes="(min-width: 768px) 200px, 45vw"
            className="object-cover"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm text-ink-400"
            aria-hidden="true"
          >
            Chưa có ảnh bìa
          </div>
        )}
        <StockLabel stockQuantity={book.stockQuantity} className="absolute left-2 top-2" />
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

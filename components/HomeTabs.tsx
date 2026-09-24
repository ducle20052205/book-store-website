"use client";

import Link from "next/link";
import { useState } from "react";
import { BookCard } from "@/components/BookCard";
import { BookCover } from "@/components/BookCover";
import { Price } from "@/components/Price";
import type { BookSummary } from "@/lib/queries";

interface HomeTabsProps {
  newest: BookSummary[];
  bestselling: BookSummary[];
  /** E1: mô tả ngắn cho cuốn đứng đầu mỗi tab, theo slug. */
  featuredDescriptions: Record<string, string | null>;
}

type TabKey = "moi-nhat" | "ban-chay";

/**
 * E1: cuốn đầu tiên trong danh sách hiển thị to hơn hẳn (chiếm nhiều cột,
 * kèm mô tả ngắn) thay vì tất cả các ô cùng kích thước — phân cấp bằng
 * kích thước, không chỉ bằng thứ tự. col-span đổi theo breakpoint để không
 * để lại 1 ô lẻ mồ côi cạnh khối lớn (md: chiếm hết hàng 3 cột; lg+: chiếm
 * 2 trong 4/5 cột, vẫn còn ít nhất 2 ô thường cùng hàng).
 */
function FeaturedBook({ book, description }: { book: BookSummary; description: string | null }) {
  return (
    <Link
      href={`/sach/${book.slug}`}
      className="hover-lift col-span-2 flex gap-6 rounded-card border border-line bg-surface p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 md:col-span-3 lg:col-span-2"
    >
      <div className="w-28 shrink-0 sm:w-36">
        <BookCover
          slug={book.slug}
          title={book.title}
          author={book.author}
          coverImageUrl={book.coverImageUrl}
          className="shadow-md"
        />
      </div>
      <div className="min-w-0 flex-1">
        <Price
          price={book.price}
          discountPrice={book.discountPrice}
          hideBadge
          className="text-card-price font-semibold"
        />
        <p className="mt-1 font-serif text-book-title font-semibold text-ink-900">{book.title}</p>
        <p className="text-meta text-ink-400">{book.author}</p>
        {description && <p className="mt-3 line-clamp-3 max-w-[42ch] text-sm text-ink-600">{description}</p>}
      </div>
    </Link>
  );
}

/**
 * Mục 2: khối tab Sách mới / Bán chạy trên trang chủ, dùng lại logic FR-1.6 /
 * FR-1.7 (8 sách mỗi tab). Độc lập với /sach — link nhanh "Sách mới"/"Bán
 * chạy" ở CategoryNav trỏ sang /sach?sort=... (1b.1), tab này chỉ còn phục vụ
 * xem nhanh ngay trên trang chủ nên mặc định mở "Sách mới".
 */
export function HomeTabs({ newest, bestselling, featuredDescriptions }: HomeTabsProps) {
  const [active, setActive] = useState<TabKey>("moi-nhat");

  const books = active === "moi-nhat" ? newest : bestselling;
  const [firstBook, ...restBooks] = books;

  return (
    <section>
      <div role="tablist" aria-label="Sách theo mục mới nhất hoặc bán chạy" className="flex gap-2 border-b border-line">
        <button
          type="button"
          role="tab"
          id="tab-moi-nhat"
          aria-selected={active === "moi-nhat"}
          aria-controls="panel-sach-tab"
          onClick={() => setActive("moi-nhat")}
          className={`min-h-11 border-b-2 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
            active === "moi-nhat" ? "border-cham-700 text-cham-700" : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          Sách mới
        </button>
        <button
          type="button"
          role="tab"
          id="tab-ban-chay"
          aria-selected={active === "ban-chay"}
          aria-controls="panel-sach-tab"
          onClick={() => setActive("ban-chay")}
          className={`min-h-11 border-b-2 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
            active === "ban-chay" ? "border-cham-700 text-cham-700" : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          Bán chạy
        </button>
      </div>

      <div
        id="panel-sach-tab"
        role="tabpanel"
        aria-labelledby={active === "moi-nhat" ? "tab-moi-nhat" : "tab-ban-chay"}
        className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
      >
        {books.length === 0 ? (
          <p className="col-span-full text-ink-600">NA Books chưa có sách nào ở mục này. Ghé lại sau nhé.</p>
        ) : (
          <>
            <FeaturedBook book={firstBook} description={featuredDescriptions[firstBook.slug] ?? null} />
            {restBooks.map((book) => (
              <BookCard key={book.slug} book={book} />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

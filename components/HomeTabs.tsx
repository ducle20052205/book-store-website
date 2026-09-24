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
 * E1.5 [sửa lỗi]: bản E1 cho bìa nổi bật một chiều rộng CỐ ĐỊNH (w-28/w-36)
 * trong khi thẻ chiếm col-span-2/3 — vì bề rộng ô lưới đổi rất nhiều theo
 * breakpoint (159px ở 375px đến 347px ở 767px, cùng một tier "chưa tới md"),
 * bìa cố định có lúc còn NHỎ HƠN bìa thẻ thường (đo được tỉ lệ nhỏ nhất
 * 0.77x ở khoảng 639px) — đúng lỗi được báo. Sửa bằng 2 thay đổi:
 *   1. Thẻ nổi bật LUÔN chiếm trọn 1 hàng riêng (col-span bằng đúng số cột
 *      ở mọi breakpoint) thay vì chỉ 2 cột cố định — để không còn thẻ
 *      thường nào bị kéo dãn chung hàng với nó (grid mặc định stretch theo
 *      hàng cao nhất).
 *   2. Bìa đổi từ px cố định sang PHẦN TRĂM chiều rộng thẻ (w-3/4 dọc ở
 *      dưới md, md:w-1/2 rồi lg:w-2/5 khi chuyển ngang) — tỉ lệ % bám theo
 *      đúng tốc độ co giãn của ô lưới thường (cả hai cùng là hàm bậc nhất
 *      theo viewport), nên tỉ lệ so với bìa thường gần như không đổi trong
 *      cùng một tier, thay vì trồi sụt như trước.
 * Bố cục dọc (ảnh trên, chữ dưới) ở dưới md vì thẻ hẹp — ngang không đủ chỗ
 * cho cả bìa to lẫn chữ dễ đọc cùng lúc; chuyển ngang từ md vì thẻ đã đủ
 * rộng. Đã đo bằng số cụ thể ở mọi breakpoint, xem báo cáo đợt E1.5.
 */
function FeaturedBook({ book, description }: { book: BookSummary; description: string | null }) {
  return (
    <Link
      href={`/sach/${book.slug}`}
      className="hover-lift col-span-2 flex flex-col gap-5 rounded-card border border-line bg-surface p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 md:col-span-3 md:flex-row md:items-center md:gap-7 lg:col-span-4 2xl:col-span-5"
    >
      <div className="mx-auto w-3/4 shrink-0 md:mx-0 md:w-1/2 lg:w-2/5">
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
 * E1.5 [sửa lỗi]: bìa nổi bật giờ chiếm trọn 1 hàng riêng (xem FeaturedBook),
 * nên số ô lưới mồ côi chỉ còn phụ thuộc restBooks.length có chia hết cho
 * số cột hiện tại hay không — không còn phải trừ phần hàng bìa nổi bật
 * chiếm như bản nháp đầu. 12 sách thường chia hết cho 2/3/4 (base/md/lg)
 * nhưng KHÔNG chia hết cho 5 (2xl, dư 2) — ẩn đúng 2 cuốn cuối ở 2xl. */
const HIDE_AT_2XL_FROM_INDEX = 10;

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
      {/* E1.5 mục 5: gạch chân tab đang chọn dày 3px (từ 2px) — rõ hơn giữa
          một trang giờ có nhiều mảng màu chàm khác, không còn là điểm neo
          màu chàm mảnh nhất trên trang như trước. */}
      <div role="tablist" aria-label="Sách theo mục mới nhất hoặc bán chạy" className="flex gap-2 border-b border-line">
        <button
          type="button"
          role="tab"
          id="tab-moi-nhat"
          aria-selected={active === "moi-nhat"}
          aria-controls="panel-sach-tab"
          onClick={() => setActive("moi-nhat")}
          className={`min-h-11 border-b-[3px] px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
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
          className={`min-h-11 border-b-[3px] px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
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
            {restBooks.map((book, i) => (
              <BookCard
                key={book.slug}
                book={book}
                className={i >= HIDE_AT_2XL_FROM_INDEX ? "2xl:hidden" : undefined}
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

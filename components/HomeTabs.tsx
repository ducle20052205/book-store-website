"use client";

import Link from "next/link";
import { useState } from "react";
import { BookCard } from "@/components/BookCard";
import { BookCover } from "@/components/BookCover";
import { Price } from "@/components/Price";
import { categoryColorClasses } from "@/lib/categoryColors";
import type { BookSummary, FeaturedBookExtra, WithCardExtras } from "@/lib/queries";

interface HomeTabsProps {
  /** E3: BookCard trong lưới cần categoryName/collectionRef — thẻ nổi bật
      (FeaturedBook, không dùng BookCard) chỉ cần BookSummary gốc. */
  newest: WithCardExtras<BookSummary>[];
  bestselling: WithCardExtras<BookSummary>[];
  /** E1/F2.1: mô tả ngắn + nhãn danh mục cho cuốn đứng đầu mỗi tab, theo slug. */
  featuredExtras: Record<string, FeaturedBookExtra>;
}

type TabKey = "moi-nhat" | "ban-chay";

/**
 * Lịch sử: E1 (bìa px cố định) và E1.5 (bìa % + chiếm trọn hàng, đạt sàn
 * >=1.4x) đều bị Đợt F chẩn đoán lỗi ("mảng trống lớn góc dưới phải"/diện
 * tích trống vượt xa 15%). Đợt F round 1 thử ép bìa vào trần 32-38% trong
 * bố cục NGANG (bìa trái, chữ phải) — CHỨNG MINH BẰNG SỐ ĐO đây là mâu
 * thuẫn nội tại: cột chữ phải "căn giữa theo chiều dọc" trong khi bìa cao
 * gấp nhiều lần chiều cao chữ tự nhiên, không cách nào vừa đạt sàn 1.4x
 * vừa đạt trần trống 15% khi 2 khối đặt CẠNH NHAU theo chiều ngang.
 *
 * Đợt F round 2 [chốt]: bỏ hẳn bố cục ngang, đổi sang DỌC — bìa TRÊN
 * (chiếm hết chiều rộng thẻ, tỉ lệ 2:3), chữ DƯỚI. Đây là thay đổi cấu
 * trúc, không phải tinh chỉnh số đo: khi bìa và chữ xếp CHỒNG thay vì
 * CẠNH NHAU, chiều cao khối chữ không còn bị ép phải "căn giữa" so với
 * chiều cao bìa — chữ chỉ cần chiều cao TỰ NHIÊN của chính nó, xoá bỏ hẳn
 * mâu thuẫn hình học đã chứng minh ở round 1. Thẻ chiếm col-span-2 (2 ô
 * lưới, không chiếm trọn hàng) — bìa khi đó rộng gần gấp đôi 1 ô lưới
 * thường (2 ô + khoảng cách giữa 2 ô, trừ padding thẻ), tự nhiên lớn hơn
 * bìa thường ~2 lần theo chiều ngang mà không cần ép tỉ lệ % nào — số đo
 * thật xem báo cáo đợt F round 2.
 *
 * items-start ở lưới cha (xem HomeTabs) VẪN cần giữ: thẻ nổi bật (col-
 * span-2, bìa~2x + chữ to hơn) vẫn cao hơn hẳn thẻ thường dù đã đổi bố
 * cục — không có items-start, thẻ thường chung hàng (phần "ô lưới thừa"
 * sau span-2) sẽ bị grid kéo dãn theo chiều cao thẻ nổi bật.
 *
 * Nhãn danh mục (màu theo 1 trong 5 danh mục cha, tái dùng
 * categoryColorClasses). Bỏ dòng "Xem chi tiết" của round 1 — round 2 chỉ
 * yêu cầu đúng 5 mục dưới bìa (nhãn, tên, tác giả, giá, mô tả), không có
 * CTA riêng; toàn thẻ đã là 1 link lớn, CTA riêng là thừa.
 */
function FeaturedBook({ book, extra }: { book: BookSummary; extra: FeaturedBookExtra | undefined }) {
  const description = extra?.description ?? null;
  const categoryName = extra?.categoryName ?? null;
  const categorySlug = extra?.categorySlug ?? null;

  return (
    <Link
      href={`/sach/${book.slug}`}
      className="hover-lift col-span-2 flex flex-col rounded-card border border-line bg-surface p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
    >
      <BookCover
        slug={book.slug}
        title={book.title}
        author={book.author}
        coverImageUrl={book.coverImageUrl}
        className="shadow-md"
      />
      <div className="mt-4">
        {categoryName && (
          <span
            className={`mb-2 inline-block w-fit rounded-pill px-2 py-0.5 text-micro font-semibold text-white ${categoryColorClasses(categorySlug).bg}`}
          >
            {categoryName}
          </span>
        )}
        <p className="font-serif text-book-title font-semibold text-ink-900">{book.title}</p>
        <p className="mt-1 text-meta text-ink-400">{book.author}</p>
        <Price
          price={book.price}
          discountPrice={book.discountPrice}
          hideBadge
          className="mt-1 text-card-price font-semibold"
        />
        {description && <p className="mt-3 line-clamp-3 text-sm text-ink-600">{description}</p>}
      </div>
    </Link>
  );
}

/**
 * Đợt F round 2: thẻ nổi bật giờ chiếm col-span-2 (không phải trọn hàng),
 * nên số ô "thừa" cùng hàng với nó = (số cột - 2), đổi theo breakpoint:
 * base(2 cột)=0 ô thừa, md(3)=1, lg(4)=2, 2xl(5)=3. Để lưới không khuyết ô
 * ở CẢ 4 breakpoint, số sách thường hiển thị N phải thoả đồng thời:
 *   N ≡ 0 (mod 2)   — base: thẻ nổi bật lấp kín hàng, các hàng sau đủ 2
 *   N ≡ 1 (mod 3)   — md: 1 ô thừa + các hàng sau đủ 3
 *   N ≡ 2 (mod 4)   — lg: 2 ô thừa + các hàng sau đủ 4
 *   N ≡ 3 (mod 5)   — 2xl: 3 ô thừa + các hàng sau đủ 5
 * Giải đồng thời (CRT) ra nghiệm dương nhỏ nhất N=58 — quá nhiều để lấy hết
 * cho một khối xem nhanh ở trang chủ. Thay vào đó lấy dư 16 cuốn (đủ cho
 * mọi breakpoint ẩn bớt một chút thay vì lấy đúng 58), ẩn responsive theo
 * TỪNG breakpoint để số HIỂN THỊ ở mỗi mốc là số lớn nhất <=16 thoả đúng
 * điều kiện mốc đó: base=16 (16 mod 2=0, hiện đủ 16), md=16 (16 mod 3=1,
 * hiện đủ 16 — trùng hợp cả 2 mốc đầu đều không cần ẩn), lg=14 (16 mod 4=0
 * sai, 14 mod 4=2 đúng — ẩn 2 cuốn cuối), 2xl=13 (16 mod 5=1 sai, 13 mod
 * 5=3 đúng — ẩn 3 cuốn cuối). Ẩn đơn điệu tăng dần theo breakpoint (không
 * có cuốn nào ẩn rồi hiện lại) nên chỉ cần 2 nhóm: cuốn thứ 14 (index 13)
 * ẩn từ 2xl; cuốn 15-16 (index 14-15) ẩn từ lg. Xem báo cáo đợt F round 2
 * cho bảng số ô khuyết đo thực tế ở cả 4 mốc.
 */
const VISIBILITY_CLASS_BY_INDEX: Record<number, string> = {
  13: "2xl:hidden",
  14: "lg:hidden",
  15: "lg:hidden",
};

/**
 * Mục 2: khối tab Sách mới / Bán chạy trên trang chủ, dùng lại logic FR-1.6 /
 * FR-1.7 (8 sách mỗi tab). Độc lập với /sach — link nhanh "Sách mới"/"Bán
 * chạy" ở CategoryNav trỏ sang /sach?sort=... (1b.1), tab này chỉ còn phục vụ
 * xem nhanh ngay trên trang chủ nên mặc định mở "Sách mới".
 */
export function HomeTabs({ newest, bestselling, featuredExtras }: HomeTabsProps) {
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
          className={`pressable min-h-11 border-b-[3px] px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
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
          className={`pressable min-h-11 border-b-[3px] px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
            active === "ban-chay" ? "border-cham-700 text-cham-700" : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          Bán chạy
        </button>
      </div>

      {/*
        items-start: xem lý do đầy đủ trong comment của FeaturedBook — thẻ
        nổi bật (col-span-2, bìa~2x + chữ to hơn) vẫn cao hơn hẳn thẻ
        thường; items-start ngăn grid kéo dãn thẻ thường chung hàng với nó
        theo chiều cao thẻ nổi bật.
      */}
      <div
        id="panel-sach-tab"
        role="tabpanel"
        aria-labelledby={active === "moi-nhat" ? "tab-moi-nhat" : "tab-ban-chay"}
        className="mt-6 grid grid-cols-2 items-start gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
      >
        {books.length === 0 ? (
          <p className="col-span-full text-ink-600">NA Books chưa có sách nào ở mục này. Ghé lại sau nhé.</p>
        ) : (
          <>
            <FeaturedBook book={firstBook} extra={featuredExtras[firstBook.slug]} />
            {restBooks.map((book, i) => (
              <BookCard key={book.slug} book={book} className={VISIBILITY_CLASS_BY_INDEX[i]} />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

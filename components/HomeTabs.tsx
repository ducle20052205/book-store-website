"use client";

import { useState } from "react";
import { BookCard } from "@/components/BookCard";
import type { BookSummary } from "@/lib/queries";

interface HomeTabsProps {
  newest: BookSummary[];
  bestselling: BookSummary[];
}

type TabKey = "moi-nhat" | "ban-chay";

/**
 * Mục 2: khối tab Sách mới / Bán chạy trên trang chủ, dùng lại logic FR-1.6 /
 * FR-1.7 (8 sách mỗi tab). Độc lập với /sach — link nhanh "Sách mới"/"Bán
 * chạy" ở CategoryNav trỏ sang /sach?sort=... (1b.1), tab này chỉ còn phục vụ
 * xem nhanh ngay trên trang chủ nên mặc định mở "Sách mới".
 */
export function HomeTabs({ newest, bestselling }: HomeTabsProps) {
  const [active, setActive] = useState<TabKey>("moi-nhat");

  const books = active === "moi-nhat" ? newest : bestselling;

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
          books.map((book) => <BookCard key={book.slug} book={book} />)
        )}
      </div>
    </section>
  );
}

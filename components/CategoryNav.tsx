"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { CategoryNode } from "@/lib/queries";

/*
 * D: thanh dưới header đổi nền cham-700 chữ trắng, trải hết chiều ngang.
 * Trạng thái hover/đang mở dùng cham-600 làm NỀN (không phải màu chữ) —
 * cham-600 là sắc xanh liền kề cham-700, dùng làm màu chữ trên chính nền
 * cham-700 sẽ gần như không đọc được (tối trên tối). Ring focus đổi sang
 * trắng vì cham-600 (ring mặc định) cũng quá gần cham-700 để nhìn thấy.
 */
const navLinkClass =
  "flex min-h-11 shrink-0 items-center rounded-control px-2 text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

export function CategoryNav({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative bg-cham-700">
      <nav
        aria-label="Danh mục và điều hướng nhanh"
        className="container-page scrollbar-hidden flex items-center gap-5 overflow-x-auto whitespace-nowrap py-1 text-sm"
      >
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-control px-2 font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${open ? "bg-cham-600" : ""}`}
        >
          Danh mục
          <svg
            viewBox="0 0 20 20"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={open ? "rotate-180" : ""}
          >
            <path d="M5 7.5 10 12.5 15 7.5" />
          </svg>
        </button>

        <Link href="/sach?sort=newest" className={navLinkClass}>
          Sách mới
        </Link>
        <Link href="/sach?sort=bestseller" className={navLinkClass}>
          Bán chạy
        </Link>
        <Link href="/tu-sach" className={navLinkClass}>
          Tủ sách
        </Link>
      </nav>

      {open && (
        <>
          <button
            type="button"
            aria-label="Đóng danh mục"
            onClick={() => setOpen(false)}
            className="fixed inset-0 cursor-default bg-ink-900/20"
          />
          <div id={panelId} className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-sm">
            {/*
              NFR-6.2: link chữ thuần (inline, không padding) đo được cao
              20px — bounding box của phần tử inline phản ánh khung glyph
              (~font-size * 1.25), KHÔNG phải line-height CSS (24px). Đổi
              sang block + py-2.5 (10px trên/dưới): khi đã là block, chiều
              cao tự nhiên = line-height thật (24px), cộng 20px padding
              thành đúng 44px. Bỏ mt-2/space-y-1.5 cũ vì padding đã tự tạo
              khoảng cách giữa link cha/con, cộng thêm sẽ quá rộng.
            */}
            <div className="container-page grid grid-cols-2 gap-6 py-6 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((parent) => (
                <div key={parent.id}>
                  <Link
                    href={`/sach?category=${parent.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-control py-2.5 font-serif text-base font-semibold text-ink-900 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
                  >
                    {parent.name}
                  </Link>
                  <ul>
                    {parent.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/sach?category=${child.slug}`}
                          onClick={() => setOpen(false)}
                          className="block rounded-control py-2.5 text-ink-600 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

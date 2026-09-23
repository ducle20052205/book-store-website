"use client";

import Link from "next/link";
import { type ParsedCatalogParams, buildCatalogQuery } from "@/lib/catalog";
import type { CategoryNode } from "@/lib/queries";

interface CatalogFiltersProps {
  categories: CategoryNode[];
  current: ParsedCatalogParams;
  /** Nhãn nút submit của form khoảng giá — mặc định "Áp dụng" (desktop). */
  applyLabel?: string;
  /** Gọi thêm khi bấm nút submit — mobile dùng để đóng bottom sheet lại. */
  onApply?: () => void;
}

const optionLinkClass =
  "flex min-h-11 items-center rounded-control px-2 leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600";
const activeClass = "bg-cham-50 font-semibold text-cham-700";

/**
 * Nội dung bộ lọc dùng chung cho cột lọc desktop và bottom sheet mobile
 * (1b.2: "nội dung lọc giống desktop"). Mọi lựa chọn là link GET tới /sach
 * để URL luôn phản ánh đúng bộ lọc và nút Back hoạt động đúng (1b.1).
 */
export function CatalogFilters({ categories, current, applyLabel = "Áp dụng", onApply }: CatalogFiltersProps) {
  const isUnder100k = current.max === 100000 && current.min === undefined;
  const isMidRange = current.min === 100000 && current.max === 200000;
  const isOver200k = current.min === 200000 && current.max === undefined;

  return (
    <div className="space-y-6 text-sm">
      <div>
        <h2 className="text-xs font-semibold tracking-wide text-ink-600 uppercase">Danh mục</h2>
        <ul className="mt-3 space-y-0.5">
          {categories.map((parent) => {
            const parentActive = current.category === parent.slug;
            const childActive = parent.children.some((c) => c.slug === current.category);
            return (
              <li key={parent.id}>
                <Link
                  href={`/sach${buildCatalogQuery(current, { category: parent.slug })}`}
                  aria-current={parentActive ? "true" : undefined}
                  className={`${optionLinkClass} ${parentActive ? activeClass : "text-ink-900 hover:text-cham-700"}`}
                >
                  {parent.name}
                </Link>
                {(parentActive || childActive) && parent.children.length > 0 && (
                  <ul className="ml-3 space-y-0.5 border-l border-line pl-3">
                    {parent.children.map((child) => {
                      const active = current.category === child.slug;
                      return (
                        <li key={child.id}>
                          <Link
                            href={`/sach${buildCatalogQuery(current, { category: child.slug })}`}
                            aria-current={active ? "true" : undefined}
                            className={`${optionLinkClass} ${active ? activeClass : "text-ink-600 hover:text-cham-700"}`}
                          >
                            {child.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2 className="text-xs font-semibold tracking-wide text-ink-600 uppercase">Khoảng giá</h2>
        <ul className="mt-3 space-y-0.5">
          <li>
            <Link
              href={`/sach${buildCatalogQuery(current, { min: undefined, max: 100000 })}`}
              aria-current={isUnder100k ? "true" : undefined}
              className={`${optionLinkClass} ${isUnder100k ? activeClass : "text-ink-900 hover:text-cham-700"}`}
            >
              Dưới 100.000đ
            </Link>
          </li>
          <li>
            <Link
              href={`/sach${buildCatalogQuery(current, { min: 100000, max: 200000 })}`}
              aria-current={isMidRange ? "true" : undefined}
              className={`${optionLinkClass} ${isMidRange ? activeClass : "text-ink-900 hover:text-cham-700"}`}
            >
              100.000 – 200.000đ
            </Link>
          </li>
          <li>
            <Link
              href={`/sach${buildCatalogQuery(current, { min: 200000, max: undefined })}`}
              aria-current={isOver200k ? "true" : undefined}
              className={`${optionLinkClass} ${isOver200k ? activeClass : "text-ink-900 hover:text-cham-700"}`}
            >
              Trên 200.000đ
            </Link>
          </li>
        </ul>

        <form action="/sach" method="get" className="mt-3 grid grid-cols-2 gap-2">
          {current.q && <input type="hidden" name="q" value={current.q} />}
          {current.category && <input type="hidden" name="category" value={current.category} />}
          {current.sort !== "newest" && <input type="hidden" name="sort" value={current.sort} />}

          <label className="col-span-1 block text-xs text-ink-600">
            Từ
            <input
              type="number"
              name="min"
              min={0}
              step={1000}
              defaultValue={current.min ?? ""}
              className="mt-1 block min-h-11 w-full rounded-control border border-line bg-surface px-2 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
            />
          </label>
          <label className="col-span-1 block text-xs text-ink-600">
            Đến
            <input
              type="number"
              name="max"
              min={0}
              step={1000}
              defaultValue={current.max ?? ""}
              className="mt-1 block min-h-11 w-full rounded-control border border-line bg-surface px-2 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
            />
          </label>
          <button
            type="submit"
            onClick={onApply}
            className="col-span-2 min-h-11 rounded-control bg-cham-700 px-4 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
          >
            {applyLabel}
          </button>
        </form>
      </div>

      <Link
        href="/sach"
        className="block min-h-11 rounded-control border border-line px-3 py-2 text-center text-button font-medium text-ink-900 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        Xóa bộ lọc
      </Link>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { CatalogFilters } from "@/components/CatalogFilters";
import type { ParsedCatalogParams } from "@/lib/catalog";
import type { CategoryNode } from "@/lib/queries";

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2" fill="var(--color-surface)" />
      <circle cx="16" cy="12" r="2" fill="var(--color-surface)" />
      <circle cx="10" cy="18" r="2" fill="var(--color-surface)" />
    </svg>
  );
}

interface MobileFilterSheetProps {
  activeCount: number;
  categories: CategoryNode[];
  current: ParsedCatalogParams;
  totalCount: number;
}

/**
 * 1b.2 (mobile): nút "Bộ lọc" mở bottom sheet. Dùng <dialog>/showModal() vì
 * trình duyệt tự lo focus trap và đóng bằng Esc — đúng yêu cầu "focus bị giữ
 * trong sheet" + "đóng được bằng phím Esc" mà không cần tự viết focus trap.
 *
 * 1c (bổ sung): nút chính của form khoảng giá đổi thành "Xem N kết quả" (N =
 * totalCount hiện tại) và tự đóng sheet khi bấm — khác desktop vẫn "Áp dụng".
 */
export function MobileFilterSheet({ activeCount, categories, current, totalCount }: MobileFilterSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-surface px-3 text-sm font-medium text-ink-900 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        <FilterIcon />
        Bộ lọc{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Bộ lọc"
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85vh] w-full max-w-none flex-col rounded-t-card border-t border-line bg-surface p-0 open:flex [&::backdrop]:bg-ink-900/30"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-serif text-lg font-semibold text-ink-900">Bộ lọc</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Đóng bộ lọc"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-xl text-ink-900 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
          >
            ×
          </button>
        </div>
        <div
          className="overflow-y-auto px-4 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <CatalogFilters
            categories={categories}
            current={current}
            applyLabel={`Xem ${totalCount} kết quả`}
            onApply={() => dialogRef.current?.close()}
          />
        </div>
      </dialog>
    </>
  );
}

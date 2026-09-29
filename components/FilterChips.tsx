"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { type ParsedCatalogParams, buildCatalogQuery, formatVndShort } from "@/lib/catalog";

interface FilterChipsProps {
  current: ParsedCatalogParams;
  categoryName?: string;
}

/*
 * E2 mục 2: chip co lại + mờ dần rồi mới thật sự bị gỡ khỏi bộ lọc, thay vì
 * mất đột ngột. Chip do server tính ra từ URL (current), không có state cục
 * bộ nào giữ danh sách — nên "gỡ chip" nghĩa là ĐIỀU HƯỚNG sang URL không
 * còn tham số đó, và trang server re-render lại danh sách chip. Nếu điều
 * hướng ngay lập tức, chip biến mất cùng lúc với cú bấm — không có gì để
 * hoạt ảnh. Thay vào đó: chặn điều hướng mặc định, bật state "removing" cục
 * bộ để CSS chạy hoạt ảnh co+mờ trên chính chip đó trước, rồi mới điều
 * hướng thật sau đúng bằng thời lượng hoạt ảnh (--dur-fast, 150ms) — lúc
 * điều hướng xảy ra thì chip đã mờ hẳn, người dùng không thấy bước "biến
 * mất" nào cả. Bỏ qua độ trễ khi prefers-reduced-motion vì khi đó hoạt ảnh
 * đã tắt hẳn (xem globals.css), chờ thêm không có tác dụng gì.
 */
function FilterChip({ chip }: { chip: { key: string; label: string; href: string } }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  function handleRemove(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (removing) return;
    setRemoving(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => router.push(chip.href), reduceMotion ? 0 : 150);
  }

  return (
    <li>
      <a
        href={chip.href}
        onClick={handleRemove}
        data-removing={removing || undefined}
        className="filter-chip inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-line bg-cham-50 px-3 text-sm font-medium text-cham-700 hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        {chip.label}
        <span aria-hidden="true">×</span>
        <span className="sr-only">Bỏ lọc {chip.label}</span>
      </a>
    </li>
  );
}

/** 1b.2: chip cho từng bộ lọc đang áp dụng, mỗi chip có nút × để bỏ riêng lẻ. */
export function FilterChips({ current, categoryName }: FilterChipsProps) {
  const chips: { key: string; label: string; href: string }[] = [];

  if (current.q) {
    chips.push({
      key: "q",
      label: `"${current.q}"`,
      href: `/sach${buildCatalogQuery(current, { q: undefined })}`,
    });
  }

  if (current.category && categoryName) {
    chips.push({
      key: "category",
      label: categoryName,
      href: `/sach${buildCatalogQuery(current, { category: undefined })}`,
    });
  }

  if (current.min !== undefined || current.max !== undefined) {
    const label =
      current.min !== undefined && current.max !== undefined
        ? `${formatVndShort(current.min)} – ${formatVndShort(current.max)}`
        : current.min !== undefined
          ? `Từ ${formatVndShort(current.min)}`
          : `Đến ${formatVndShort(current.max!)}`;

    chips.push({
      key: "price",
      label,
      href: `/sach${buildCatalogQuery(current, { min: undefined, max: undefined })}`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <FilterChip key={chip.key} chip={chip} />
      ))}
    </ul>
  );
}

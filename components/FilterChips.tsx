import Link from "next/link";
import { type ParsedCatalogParams, buildCatalogQuery, formatVndShort } from "@/lib/catalog";

interface FilterChipsProps {
  current: ParsedCatalogParams;
  categoryName?: string;
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
        <li key={chip.key}>
          <Link
            href={chip.href}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-line bg-cham-50 px-3 text-sm font-medium text-cham-700 hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
          >
            {chip.label}
            <span aria-hidden="true">×</span>
            <span className="sr-only">Bỏ lọc {chip.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

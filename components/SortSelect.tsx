"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_LABELS, SORT_OPTIONS, type SortOption } from "@/lib/catalog";

/** 1b.2: dropdown sắp xếp, đổi giá trị là điều hướng ngay (đổi bộ lọc thì reset về trang 1). */
export function SortSelect({ value }: { value: SortOption }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    const next = event.target.value;

    if (next === "newest") params.delete("sort");
    else params.set("sort", next);
    params.delete("page");

    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort-select" className="text-ink-600">
        Sắp xếp
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={handleChange}
        className="min-h-11 rounded-control border border-line bg-surface px-2 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {SORT_LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}

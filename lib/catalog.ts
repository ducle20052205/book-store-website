export const SORT_OPTIONS = ["newest", "price_asc", "price_desc", "bestseller"] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Mới nhất",
  price_asc: "Giá tăng dần",
  price_desc: "Giá giảm dần",
  bestseller: "Bán chạy",
};

export const CATALOG_PAGE_SIZE = 20;

export interface ParsedCatalogParams {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  sort: SortOption;
  page: number;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** 1b.1: mọi bộ lọc nằm trên URL — parse + validate về giá trị an toàn để gọi search_books. */
export function parseCatalogSearchParams(sp: RawSearchParams): ParsedCatalogParams {
  const q = firstValue(sp.q)?.trim() || undefined;
  const category = firstValue(sp.category)?.trim() || undefined;
  const min = parsePositiveNumber(firstValue(sp.min));
  const max = parsePositiveNumber(firstValue(sp.max));

  const sortRaw = firstValue(sp.sort);
  const sort: SortOption = (SORT_OPTIONS as readonly string[]).includes(sortRaw ?? "")
    ? (sortRaw as SortOption)
    : "newest";

  const pageRaw = Number(firstValue(sp.page));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  return { q, category, min, max, sort, page };
}

type CatalogQueryOverrides = Partial<Record<keyof ParsedCatalogParams, string | number | undefined>>;

/**
 * Ghép query string từ bộ lọc hiện tại + override một vài field (vd. đổi
 * category, xóa min/max). Đổi bất kỳ field nào ngoài `page` sẽ reset về
 * trang 1, trừ khi override có truyền `page` rõ ràng.
 */
export function buildCatalogQuery(current: ParsedCatalogParams, overrides: CatalogQueryOverrides): string {
  const merged: CatalogQueryOverrides = { ...current, ...overrides };
  if (!("page" in overrides)) merged.page = undefined;

  const params = new URLSearchParams();
  if (merged.q) params.set("q", String(merged.q));
  if (merged.category) params.set("category", String(merged.category));
  if (merged.min !== undefined && merged.min !== "") params.set("min", String(merged.min));
  if (merged.max !== undefined && merged.max !== "") params.set("max", String(merged.max));
  if (merged.sort && merged.sort !== "newest") params.set("sort", String(merged.sort));
  if (merged.page && Number(merged.page) > 1) params.set("page", String(merged.page));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Số bộ lọc đang áp dụng trong bottom sheet mobile (category + khoảng giá — không tính q/sort). */
export function countActiveFilters(parsed: ParsedCatalogParams): number {
  let count = 0;
  if (parsed.category) count++;
  if (parsed.min !== undefined || parsed.max !== undefined) count++;
  return count;
}

export function formatVndShort(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

/** Danh sách số trang rút gọn kiểu 1 2 … 5 6 7 … 12 13, tối đa quanh trang hiện tại. */
export function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const keep = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

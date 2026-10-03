import { PaginationNav } from "@/components/PaginationNav";
import { CATALOG_PAGE_SIZE, type ParsedCatalogParams, buildCatalogQuery } from "@/lib/catalog";

interface PaginationProps {
  current: ParsedCatalogParams;
  totalCount: number;
}

/** Lớp mỏng của catalog trên `PaginationNav` (đợt 5A): giữ nguyên mọi tham số lọc khi chuyển trang. */
export function Pagination({ current, totalCount }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / CATALOG_PAGE_SIZE));
  return <PaginationNav page={current.page} totalPages={totalPages} hrefFor={(page) => `/sach${buildCatalogQuery(current, { page })}`} />;
}

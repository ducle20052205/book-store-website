import Link from "next/link";
import { CATALOG_PAGE_SIZE, type ParsedCatalogParams, buildCatalogQuery, buildPageList } from "@/lib/catalog";

interface PaginationProps {
  current: ParsedCatalogParams;
  totalCount: number;
}

const pageLinkClass =
  "flex min-h-11 min-w-11 items-center justify-center rounded-control px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600";

/** 1b.2: thẻ <a> thật (Next Link render ra <a>), giữ nguyên mọi tham số lọc khi chuyển trang. */
export function Pagination({ current, totalCount }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / CATALOG_PAGE_SIZE));
  if (totalPages <= 1) return null;

  const { page } = current;
  const pages = buildPageList(page, totalPages);

  return (
    <nav aria-label="Phân trang" className="mt-10 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && (
        <Link href={`/sach${buildCatalogQuery(current, { page: page - 1 })}`} className={`${pageLinkClass} text-ink-900 hover:text-cham-700`}>
          Trước
        </Link>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-ink-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={`/sach${buildCatalogQuery(current, { page: p })}`}
            aria-current={p === page ? "page" : undefined}
            className={`${pageLinkClass} ${p === page ? "bg-cham-700 text-white" : "text-ink-900 hover:text-cham-700"}`}
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages && (
        <Link href={`/sach${buildCatalogQuery(current, { page: page + 1 })}`} className={`${pageLinkClass} text-ink-900 hover:text-cham-700`}>
          Sau
        </Link>
      )}
    </nav>
  );
}

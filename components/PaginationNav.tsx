import Link from "next/link";
import { buildPageList } from "@/lib/catalog";

interface PaginationNavProps {
  /** Trang hiện tại (từ 1). */
  page: number;
  totalPages: number;
  /** Dựng `href` của một trang; nơi gọi giữ nguyên mọi tham số lọc của nó. */
  hrefFor: (page: number) => string;
}

const pageLinkClass =
  "pressable flex min-h-11 min-w-11 items-center justify-center rounded-control px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600";

/**
 * Lõi phân trang dùng chung (đợt 5A, spec FR-5A.3), tách từ `Pagination` của catalog: chỉ biết trang hiện tại,
 * tổng số trang và cách dựng `href` — không biết `/sach` hay bộ lọc nào. HTML của `/sach` phải giữ nguyên
 * so với trước khi tách (TC-14). 1b.2: thẻ <a> thật (Next Link render ra <a>).
 */
export function PaginationNav({ page, totalPages, hrefFor }: PaginationNavProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav aria-label="Phân trang" className="mt-10 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={`${pageLinkClass} text-ink-900 hover:text-cham-700`}>
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
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${pageLinkClass} ${p === page ? "bg-cham-700 text-white" : "text-ink-900 hover:text-cham-700"}`}
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages && (
        <Link href={hrefFor(page + 1)} className={`${pageLinkClass} text-ink-900 hover:text-cham-700`}>
          Sau
        </Link>
      )}
    </nav>
  );
}

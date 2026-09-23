import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** "Trang chủ" + chuỗi danh mục cha→con, cấp cuối không có href (trang hiện tại). */
export function categoryChainToBreadcrumbItems(chain: { name: string; slug: string }[]): BreadcrumbItem[] {
  if (chain.length === 0) return [];
  return [
    { label: "Trang chủ", href: "/" },
    ...chain.map((category, index) =>
      index === chain.length - 1
        ? { label: category.name }
        : { label: category.name, href: `/sach?category=${category.slug}` },
    ),
  ];
}

/**
 * 1c (bổ sung): breadcrumb dùng chung cho /sach và /sach/[slug]. Mỗi cấp là
 * link, riêng cấp cuối (trang hiện tại) không phải link.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-600">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className="text-ink-400">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="rounded-control hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink-900">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

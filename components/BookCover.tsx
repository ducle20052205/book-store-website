import Image from "next/image";

const COVER_COLORS = [
  "bg-cover-1",
  "bg-cover-2",
  "bg-cover-3",
  "bg-cover-4",
  "bg-cover-5",
  "bg-cover-6",
  "bg-cover-7",
  "bg-cover-8",
] as const;

function colorClassForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return COVER_COLORS[hash % COVER_COLORS.length];
}

interface BookCoverProps {
  slug: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  sizes?: string;
  className?: string;
}

/**
 * Bìa sách dùng chung: ảnh thật khi có cover_image_url, hoặc bìa typographic
 * (nền màu ổn định theo hash slug, tên sách serif, tác giả sans) khi không có
 * — theo mục 4.2b của spec brand. Luôn tỷ lệ 2:3, accessible name = tên sách.
 *
 * Bìa typographic dùng container query (@container + cqw) để cỡ chữ co theo
 * độ rộng thật của bìa (không phải viewport) — bìa 2 cột trên mobile vẫn đọc
 * được mà không tràn. Tên sách neo trên cùng, tác giả theo ngay bên dưới
 * (không justify-between) để luôn còn khoảng trống phía dưới cho StockLabel
 * chồng lên mà không đè vào chữ.
 */
export function BookCover({
  slug,
  title,
  author,
  coverImageUrl,
  sizes = "(min-width: 768px) 200px, 45vw",
  className,
}: BookCoverProps) {
  if (coverImageUrl) {
    return (
      <div
        className={`book-cover-shadow cover-zoom relative aspect-[2/3] overflow-hidden rounded-card border border-line bg-surface ${className ?? ""}`}
      >
        <Image src={coverImageUrl} alt={title} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={title}
      className={`book-cover-shadow @container relative aspect-[2/3] overflow-hidden rounded-card border border-line p-3 text-white ${colorClassForSlug(slug)} ${className ?? ""}`}
    >
      <p
        aria-hidden="true"
        className="line-clamp-4 font-serif font-semibold leading-snug text-[clamp(0.75rem,9cqw,1.125rem)]"
      >
        {title}
      </p>
      <p
        aria-hidden="true"
        className="mt-1.5 line-clamp-2 font-sans text-white/80 text-[clamp(0.625rem,6cqw,0.8125rem)]"
      >
        {author}
      </p>
    </div>
  );
}

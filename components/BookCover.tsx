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
        className={`relative aspect-[2/3] overflow-hidden rounded-card border border-line bg-surface ${className ?? ""}`}
      >
        <Image src={coverImageUrl} alt={title} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={title}
      className={`relative flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-card border border-line p-3 text-white ${colorClassForSlug(slug)} ${className ?? ""}`}
    >
      <p aria-hidden="true" className="line-clamp-4 font-serif text-base font-semibold leading-snug">
        {title}
      </p>
      <p aria-hidden="true" className="line-clamp-2 font-sans text-xs text-white/80">
        {author}
      </p>
    </div>
  );
}

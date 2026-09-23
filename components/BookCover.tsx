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
  "bg-cover-9",
  "bg-cover-10",
  "bg-cover-11",
  "bg-cover-12",
] as const;

const LAYOUT_COUNT = 4;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Hash riêng cho layout (không dùng chung hash với màu) để 2 lựa chọn độc lập nhau. */
function layoutIndexForSlug(slug: string): number {
  return hashString(`${slug}:layout`) % LAYOUT_COUNT;
}

function colorClassForSlug(slug: string): string {
  return COVER_COLORS[hashString(slug) % COVER_COLORS.length];
}

const titleClass =
  "line-clamp-4 w-full font-serif font-semibold leading-snug text-[clamp(0.75rem,9cqw,1.125rem)]";
const authorClass =
  "line-clamp-2 w-full font-sans text-white/80 text-[clamp(0.625rem,6cqw,0.8125rem)]";

/** B.1: 4 biến thể bố cục chữ trên bìa typographic, chọn theo hash slug. */
function CoverText({ layout, title, author }: { layout: number; title: string; author: string }) {
  if (layout === 1) {
    // Giữa — tên căn giữa ngang/dọc, tác giả ở đáy sau một đường kẻ mảnh.
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p aria-hidden="true" className={titleClass}>
            {title}
          </p>
        </div>
        <div className="border-t border-white/25 pt-1.5 text-center">
          <p aria-hidden="true" className={`${authorClass} line-clamp-1`}>
            {author}
          </p>
        </div>
      </div>
    );
  }

  if (layout === 2) {
    // Dưới — khoảng trống ở trên, tên và tác giả dồn xuống đáy.
    return (
      <div className="flex h-full flex-col justify-end">
        <p aria-hidden="true" className={titleClass}>
          {title}
        </p>
        <p aria-hidden="true" className={`mt-1.5 ${authorClass}`}>
          {author}
        </p>
      </div>
    );
  }

  if (layout === 3) {
    // Có khung — khung viền mảnh cách mép 12px, chữ căn giữa trong khung.
    return (
      <div className="flex h-full flex-col items-center justify-center border border-white/40 p-3 text-center">
        <p aria-hidden="true" className={titleClass}>
          {title}
        </p>
        <p aria-hidden="true" className={`mt-1.5 ${authorClass}`}>
          {author}
        </p>
      </div>
    );
  }

  // layout === 0 — Trên trái (bố cục gốc): tên ở trên, tác giả ngay dưới.
  return (
    <>
      <p aria-hidden="true" className={titleClass}>
        {title}
      </p>
      <p aria-hidden="true" className={`mt-1.5 ${authorClass}`}>
        {author}
      </p>
    </>
  );
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
 *
 * B.1/B.2: 4 biến thể bố cục chữ (CoverText, chọn theo hash slug riêng, độc
 * lập với màu) + gáy sách (dải 7% mép trái, tối hơn nền) + vân giấy rất nhẹ
 * (.paper-grain) + bo góc bất đối xứng (mép gáy 2px, mép kia --radius-card).
 * Spine/grain là 2 lớp phủ full-bleed nằm NGOÀI khối đệm 12px (p-3) của chữ,
 * nên phải là con trực tiếp của container ngoài cùng — nếu đặt trong cùng
 * div có padding thì inset-0 sẽ tính từ mép trong padding, không tới mép bìa
 * thật. Chỉ áp dụng cho bìa typographic — bìa ảnh thật giữ nguyên đơn giản
 * vì đã có hoạ tiết riêng từ chính ảnh.
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

  const layout = layoutIndexForSlug(slug);

  return (
    <div
      role="img"
      aria-label={title}
      className={`book-cover-shadow @container relative aspect-[2/3] overflow-hidden rounded-r-card rounded-l-spine border border-line text-white ${colorClassForSlug(slug)} ${className ?? ""}`}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[7%] bg-black/12" />
      <span aria-hidden="true" className="paper-grain absolute inset-0" />
      <div className="relative h-full p-3">
        <CoverText layout={layout} title={title} author={author} />
      </div>
    </div>
  );
}

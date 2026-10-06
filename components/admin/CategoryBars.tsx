import { cardClass } from "@/lib/ui/classes";

/**
 * Năm danh mục cha theo số bản đã bán (đợt 6, spec FR-D.4 và mục 4A): thanh ngang, SVG viết tay. Mỗi hàng cao
 * 40px, khe 8px; nhãn bên trái cố định 140px (100px dưới 768px); thanh cao 16px, bo 2px, dài tỉ lệ với danh mục
 * lớn nhất; số bản ngay sau thanh (12px `ink-900`). Màu: đúng 5 màu danh mục đã có (`--color-cat-*`); viết class
 * thành chuỗi trực tiếp vì Tailwind quét mã nguồn theo chữ (như `lib/categoryColors.ts`). Số luôn hiện bằng
 * chữ, không chỉ bằng độ dài thanh. 48px bên phải thanh dành chỗ cho con số của thanh dài nhất.
 */
const FILL: Record<string, string> = {
  "van-hoc": "fill-cat-van-hoc",
  "kinh-te": "fill-cat-kinh-te",
  "tam-ly-ky-nang": "fill-cat-tam-ly-ky-nang",
  "khoa-hoc-xa-hoi": "fill-cat-khoa-hoc-xa-hoi",
  "manga-light-novel": "fill-cat-manga-light-novel",
};

export function CategoryBars({ categories }: { categories: { slug: string; name: string; units: number }[] }) {
  const max = Math.max(0, ...categories.map((c) => c.units));
  const total = categories.reduce((sum, c) => sum + c.units, 0);
  const top = categories.reduce((a, b) => (b.units > a.units ? b : a), categories[0]);
  const label = `Số bản đã bán theo danh mục cha, tổng ${total} bản. Nhiều nhất: ${top.name}, ${top.units} bản. ${categories.map((c) => `${c.name} ${c.units}`).join("; ")}.`;

  return (
    <div role="img" aria-label={label} data-testid="admin-category-chart" className={`${cardClass} p-4 md:p-6`}>
      <ul className="flex flex-col gap-2">
        {categories.map((c) => {
          const pct = max > 0 ? (c.units / max) * 100 : 0;
          return (
            <li key={c.slug} className="flex h-10 items-center">
              <span className="w-[100px] shrink-0 pr-2 text-[13px] leading-[1.25] text-ink-900 md:w-[140px]">{c.name}</span>
              <svg aria-hidden="true" className="mr-12 block h-4 min-w-0 flex-1 overflow-visible">
                <rect x="0" y="0" width={`${pct}%`} height="16" rx="2" className={FILL[c.slug] ?? "fill-cham-700"} />
                <text x={`${pct}%`} dx="8" y="12" fontSize="12" className="fill-ink-900">
                  {c.units}
                </text>
              </svg>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

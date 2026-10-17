import { formatVnd } from "@/components/Price";
import { formatVndCompact, monthLabel } from "@/lib/admin/dashboard";
import { cardClass } from "@/lib/ui/classes";

/**
 * Doanh thu theo tháng (đợt 6, spec FR-D.3 và mục 4A): cột đứng, SVG viết tay, KHÔNG thư viện. Một cột mỗi
 * tháng, một màu `cham-700`; tháng giá trị 0 vẫn có cột (vạch 2px `ink-400` ở đáy). Số đọc được bằng chữ:
 * giá trị trên đỉnh cột (12px `ink-400`, "1,2tr"), nhãn tháng dưới cột (12px, "T4"). Không lưới, không trục,
 * không animation.
 *
 * Hình học: khung cao 220px (180px dưới 768px) = 24px chừa cho giá trị + vùng cột tối đa 160px (120px) + 36px
 * nhãn. Khe giữa cột do lưới CSS (16px; 8px dưới 768px); mỗi cột là một <svg> riêng, cao đúng vùng cột, nên
 * toạ độ dạng phần trăm (`y`, `height`) tính theo chiều cao vùng cột và chữ trong SVG giữ đúng 12px ở mọi bề
 * rộng. `role="img"` + `aria-label` tóm tắt (tháng cao nhất, thấp nhất, tổng).
 */
export function RevenueChart({ months }: { months: { month: string; revenue: number }[] }) {
  const max = Math.max(0, ...months.map((m) => m.revenue));
  const total = months.reduce((sum, m) => sum + m.revenue, 0);
  const best = months.reduce((a, b) => (b.revenue > a.revenue ? b : a), months[0]);
  const worst = months.reduce((a, b) => (b.revenue < a.revenue ? b : a), months[0]);
  const label = `Doanh thu theo tháng, ${months.length} tháng. Tháng cao nhất: ${monthLabel(best.month)}, ${formatVnd(best.revenue)}. Tháng thấp nhất: ${monthLabel(worst.month)}, ${formatVnd(worst.revenue)}. Tổng: ${formatVnd(total)}.`;

  return (
    <>
      <div role="img" aria-label={label} data-testid="admin-revenue-chart" className={`${cardClass} p-4 md:p-6`}>
        <div className="grid h-[180px] gap-x-2 md:h-[220px] md:gap-x-4" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
          {months.map((m) => {
            const ratio = max > 0 ? m.revenue / max : 0;
            const top = `${(1 - ratio) * 100}%`;
            return (
              <div key={m.month} className="flex h-full min-w-0 flex-col">
                <svg aria-hidden="true" className="mt-6 block h-[120px] w-full shrink-0 overflow-visible md:h-[160px]">
                  {m.revenue > 0 ? (
                    <rect x="0" y={top} width="100%" height={`${ratio * 100}%`} className="fill-cham-700" />
                  ) : (
                    <rect x="0" y="100%" width="100%" height="2" transform="translate(0 -2)" className="fill-ink-400" />
                  )}
                  <text x="50%" y={m.revenue > 0 ? top : "100%"} dy={m.revenue > 0 ? -6 : -8} textAnchor="middle" fontSize="12" className="fill-ink-400">
                    {formatVndCompact(m.revenue)}
                  </text>
                </svg>
                <span className="pt-2 text-center text-[12px] leading-4 text-ink-400">{monthLabel(m.month)}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/*
       * FR-A.8 (A11Y-23): bảng số liệu bằng chữ cho công nghệ hỗ trợ, đặt NGOÀI cây role="img". Phần tử role="img" coi con của nó là
       * trình bày thuần, nên chữ trong biểu đồ có thể không được đọc dù có trong cây accessibility; bảng này luôn đọc được và
       * điều hướng được theo hàng/cột. Dùng sr-only (không phải bảng nhìn thấy): người nhìn đã đọc mọi giá trị ngay trên biểu đồ
       * (mỗi cột có số), bảng hiện thêm sẽ lặp nội dung và đổi bố cục của hệ layout đóng băng. sr-only là absolute, không chiếm chỗ.
       */}
      <table data-testid="admin-revenue-table" className="sr-only">
        <caption>Doanh thu theo tháng, bảng số liệu</caption>
        <thead>
          <tr>
            <th scope="col">Tháng</th>
            <th scope="col">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row">{`${monthLabel(m.month)}/${m.month.slice(0, 4)}`}</th>
              <td>{formatVnd(m.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

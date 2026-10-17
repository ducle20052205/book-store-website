import { FUNNEL_LABELS } from "@/lib/admin/dashboard";
import { cardClass } from "@/lib/ui/classes";

/**
 * Phễu chuyển đổi (đợt 6, spec FR-D.5 và mục 4A): năm bước theo FR-8.3, thanh ngang SVG viết tay. Mỗi hàng cao
 * 44px, khe 8px; thanh cao 20px, dài tỉ lệ với bước đầu (bước đầu = 100%). Trái thanh: tên bước 13px `ink-900`;
 * phải thanh: số tuyệt đối 13px `ink-900` và tỉ lệ so với bước đầu 12px `ink-400`. Màu `cham-700`, độ mờ
 * 100 / 85 / 70 / 55 / 40% theo thứ tự bước — chỉ để trang trí, mọi thông tin đã nằm ở chữ. Đếm số DÒNG sự
 * kiện, không phải số phiên (spec mục 7.3), và giao diện nói rõ điều đó.
 */
const OPACITIES = [1, 0.85, 0.7, 0.55, 0.4];
const percent = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("vi-VN");

export function FunnelChart({ steps }: { steps: { event_type: string; count: number }[] }) {
  const first = steps[0]?.count ?? 0;
  const last = steps[steps.length - 1]?.count ?? 0;
  const ratio = (n: number) => (first > 0 ? (n / first) * 100 : 0);
  const label = `Phễu chuyển đổi, đếm số lượt: từ ${integer.format(first)} lượt xem trang sách xuống ${integer.format(last)} đơn đặt, bằng ${percent.format(ratio(last))}% của bước đầu.`;

  return (
    <>
      <div role="img" aria-label={label} data-testid="admin-funnel-chart" className={`${cardClass} p-4 md:p-6`}>
        <ul className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <li key={s.event_type} className="grid h-11 grid-cols-[96px_minmax(0,1fr)_104px] items-center gap-x-3 md:grid-cols-[150px_minmax(0,1fr)_132px]">
              <span className="text-[13px] leading-[1.25] text-ink-900">{FUNNEL_LABELS[s.event_type] ?? s.event_type}</span>
              <svg aria-hidden="true" className="block h-5 w-full">
                <rect x="0" y="0" width={`${ratio(s.count)}%`} height="20" fillOpacity={OPACITIES[i] ?? 0.4} className="fill-cham-700" />
              </svg>
              <span className="text-right">
                <span className="text-[13px] text-ink-900">{integer.format(s.count)}</span>{" "}
                <span className="text-[12px] text-ink-400">{percent.format(ratio(s.count))}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {/*
       * FR-A.8 (A11Y-23): bảng số liệu bằng chữ cho công nghệ hỗ trợ, đặt NGOÀI cây role="img". Phần tử role="img" coi con của nó là
       * trình bày thuần, nên chữ trong biểu đồ có thể không được đọc dù có trong cây accessibility; bảng này luôn đọc được và
       * điều hướng được theo hàng/cột. Dùng sr-only (không phải bảng nhìn thấy): người nhìn đã đọc mọi giá trị ngay trên biểu đồ
       * (mỗi cột có số), bảng hiện thêm sẽ lặp nội dung và đổi bố cục của hệ layout đóng băng. sr-only là absolute, không chiếm chỗ.
       */}
      <table data-testid="admin-funnel-table" className="sr-only">
        <caption>Phễu chuyển đổi, đếm số lượt, bảng số liệu</caption>
        <thead>
          <tr>
            <th scope="col">Bước</th>
            <th scope="col">Số lượt</th>
            <th scope="col">Tỉ lệ so với bước đầu</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s) => (
            <tr key={s.event_type}>
              <th scope="row">{FUNNEL_LABELS[s.event_type] ?? s.event_type}</th>
              <td>{integer.format(s.count)}</td>
              <td>{`${percent.format(ratio(s.count))}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

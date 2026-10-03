/**
 * Tiêu đề trang của hệ layout đóng băng: vạch chàm 3px (lớp `section-title`) + Newsreader + số đếm 14px canh
 * đáy. Tách từ hàm cục bộ ở `app/gio-hang/page.tsx` (đợt 4, spec FR-B4.1) để `/gio-hang` và trang lịch sử đơn
 * dùng chung. HTML phải giữ nguyên so với bản cục bộ (TC-17): số đếm dựng từ HAI nút văn bản (`{count}` và
 * `{" " + unit}`) đúng như `{count} cuốn` cũ, vì React chèn dấu phân tách giữa hai nút văn bản liền nhau.
 * `countTestId` (đợt 5A) chỉ thêm `data-testid` cho số đếm khi được truyền; bỏ trống thì HTML không đổi.
 */
export function PageTitle({ title, count, unit, countTestId }: { title: string; count?: number; unit?: string; countTestId?: string }) {
  return (
    <div className="section-title">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="font-serif text-h1 text-ink-900">{title}</h1>
        {count !== undefined && (
          <p data-testid={countTestId} className="text-body-sm text-ink-600">
            {count}
            {` ${unit ?? ""}`}
          </p>
        )}
      </div>
    </div>
  );
}

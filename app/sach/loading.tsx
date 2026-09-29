/**
 * 1b.2/B.4: skeleton lưới thẻ sách khi /sach đang tải dữ liệu — khớp thứ tự
 * tên/tác giả/giá và vị trí badge góc bìa của <BookCard>.
 * animate-pulse tắt qua prefers-reduced-motion ở globals.css.
 *
 * E2 mục 4: cập nhật lại cho khớp hình dạng thật hiện tại của trang (đã đổi
 * nhiều lần qua các đợt D/E1/E1.5/F) — trước đó lệch ở 3 chỗ: (1) container
 * còn `py-8 md:py-12`, trang thật chỉ còn `py-8` từ E1; (2) bìa dùng
 * `rounded-card` (14px, dành cho THẺ) thay vì `rounded-cover` (8px, đúng bo
 * góc của chính bìa sách — xem thang bo góc theo thứ bậc ở globals.css);
 * (3) tiêu đề chưa có vạch trái mô phỏng `.section-title` (thêm ở E1.5) và
 * dải màu danh mục (thêm ở E1.5 mục 2, chỉ hiện khi lọc theo danh mục nên
 * để mặc định ẩn trong skeleton — không có thật cho MỌI lượt tải).
 */
export default function Loading() {
  return (
    <div className="container-page py-8">
      <div className="mt-3 section-title">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <div className="h-9 w-56 animate-pulse rounded-control bg-line" />
          <div className="h-4 w-24 animate-pulse rounded-control bg-line" />
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 w-32 animate-pulse rounded-control bg-line" />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="relative">
                <div className="aspect-2/3 animate-pulse rounded-cover bg-line" />
                <div className="absolute left-2 top-2 h-5 w-10 animate-pulse rounded-pill bg-surface" />
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-[15px] w-full animate-pulse rounded-control bg-line" />
                <div className="h-[13px] w-1/2 animate-pulse rounded-control bg-line" />
                <div className="h-[17px] w-1/3 animate-pulse rounded-control bg-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 1b.2/B.4: skeleton lưới thẻ sách khi /sach đang tải dữ liệu — khớp thứ tự
 * tên/tác giả/giá và vị trí badge góc bìa của <BookCard>.
 * animate-pulse tắt qua prefers-reduced-motion ở globals.css.
 */
export default function Loading() {
  return (
    <div className="container-page py-8 md:py-12">
      <div className="h-9 w-56 animate-pulse rounded-control bg-line" />

      <div className="mt-4 h-11 w-40 animate-pulse rounded-control bg-line" />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 w-32 animate-pulse rounded-control bg-line" />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="relative">
                <div className="aspect-2/3 animate-pulse rounded-card bg-line" />
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

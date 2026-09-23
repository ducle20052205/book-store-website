/** 1b.2: skeleton lưới thẻ sách khi /sach đang tải dữ liệu. */
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

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-2/3 animate-pulse rounded-card bg-line" />
              <div className="h-4 w-3/4 animate-pulse rounded-control bg-line" />
              <div className="h-3 w-1/2 animate-pulse rounded-control bg-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

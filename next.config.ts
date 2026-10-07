import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Đợt 2A: bật Cache Components để Header có thể đọc phiên đăng nhập (cookie)
  // mà không kéo mọi route sang render động — phần phụ thuộc phiên nằm sau
  // <Suspense>, phần còn lại prerender thành shell tĩnh. Xem components/Header.tsx.
  cacheComponents: true,

  // Đợt 8 (spec FR-A.4): đã BỎ chuyển hướng /tai-khoan → /tai-khoan/don-hang của đợt 4 — `/tai-khoan` nay là trang hồ sơ
  // (app/tai-khoan/page.tsx). Người chưa đăng nhập vào /tai-khoan được proxy.ts (`isUnder(pathname, "/tai-khoan")` khớp cả
  // đúng đường dẫn này) chuyển tới /dang-nhap?next=%2Ftai-khoan. Đợt 6 cũng đã bỏ chuyển hướng /admin (app/admin/page.tsx).
};

export default nextConfig;

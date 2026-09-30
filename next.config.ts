import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Đợt 2A: bật Cache Components để Header có thể đọc phiên đăng nhập (cookie)
  // mà không kéo mọi route sang render động — phần phụ thuộc phiên nằm sau
  // <Suspense>, phần còn lại prerender thành shell tĩnh. Xem components/Header.tsx.
  cacheComponents: true,
};

export default nextConfig;

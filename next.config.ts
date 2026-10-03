import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Đợt 2A: bật Cache Components để Header có thể đọc phiên đăng nhập (cookie)
  // mà không kéo mọi route sang render động — phần phụ thuộc phiên nằm sau
  // <Suspense>, phần còn lại prerender thành shell tĩnh. Xem components/Header.tsx.
  cacheComponents: true,

  async redirects() {
    return [
      // Đợt 4 (spec FR-B4.6): /tai-khoan chưa có trang riêng, nhưng menu tài khoản trỏ vào đó ("Hồ sơ của
      // bạn") nên trước đây là 404. Chuyển tạm sang danh sách đơn. Khi đợt 2D dựng trang hồ sơ thì BỎ
      // chuyển hướng này. `redirects` của next.config chạy trước proxy, nên người chưa đăng nhập đi tiếp
      // /tai-khoan → /tai-khoan/don-hang → proxy → /dang-nhap?next=…; và đây là 307 thật, không phải
      // `redirect()` trong <Suspense> (mã HTTP 200). Chỉ đúng đường dẫn này, không `:path*`.
      { source: "/tai-khoan", destination: "/tai-khoan/don-hang", permanent: false },
    ];
  },
};

export default nextConfig;

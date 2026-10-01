import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/nextParam";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Đợt 2A (spec mục 5). Next.js 16 đổi tên `middleware` thành `proxy`; hàm export
 * tên `proxy`, chạy trên Node.js runtime.
 *
 * NGUYÊN TẮC HAI LỚP: file này CHỈ để cải thiện trải nghiệm — làm mới cookie
 * phiên và chuyển hướng sớm người chưa đủ quyền, để họ không thấy trang rồi mới
 * bị đá ra. Hàng rào THẬT là kiểm tra trong Server Component và RLS ở database.
 * Không đặt bất kỳ logic phân quyền nào chỉ tồn tại ở đây: nếu proxy bị bỏ qua
 * hay cấu hình sai, dữ liệu vẫn phải được bảo vệ bởi hai lớp kia.
 */

function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Chuyển hướng nhưng giữ nguyên cookie phiên vừa làm mới và các header chống cache đi kèm. */
function redirectKeepingSession(sessionResponse: NextResponse, to: URL) {
  const redirect = NextResponse.redirect(to);
  sessionResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = sessionResponse.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const needsLogin = isUnder(pathname, "/tai-khoan");
  const needsAdmin = isUnder(pathname, "/admin");

  const { supabase, user, response } = await updateSession(request);

  if (!user && (needsLogin || needsAdmin)) {
    const loginUrl = new URL("/dang-nhap", request.url);
    // Cùng luật với hai trang đọc `?next=` (lib/nextParam.ts) — một bản duy nhất.
    loginUrl.searchParams.set("next", safeNextPath(`${pathname}${search}`));
    return redirectKeepingSession(response, loginUrl);
  }

  if (user && needsAdmin) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") {
      // Đã đăng nhập nhưng không phải admin: về trang chủ (không gửi sang
      // /dang-nhap — họ đã đăng nhập rồi, sẽ tạo vòng lặp chuyển hướng).
      return redirectKeepingSession(response, new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Mọi request tới trang, trừ tệp tĩnh của Next, ảnh tối ưu, favicon, các đuôi ảnh
    // VÀ trừ request prefetch. Request prefetch do <Link> phát khi liên kết vào khung
    // nhìn (header `next-router-prefetch: 1`, đã kiểm 171/171 request RSC prefetch trong
    // 11 lượt tải, 01/10/2026) chỉ lấy phần tĩnh của trang và không đọc phiên, nên
    // không cần getUser() — một lượt gọi Auth cho mỗi liên kết trong khung nhìn, 17–24
    // lần mỗi lần tải trang có phiên — và cũng không cần làm mới cookie.
    //
    // PHẢI loại bằng `missing` ở đây, không kiểm header trong hàm `proxy`: Next xoá các
    // header Flight (`rsc`, `next-router-prefetch`...) khỏi `request` trước khi gọi proxy
    // (node_modules/next/dist/server/web/adapter.js, và docs proxy.md mục "RSC requests
    // and rewrites"), nên `request.headers.get("next-router-prefetch")` luôn là null.
    {
      source: "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [{ type: "header", key: "next-router-prefetch" }],
    },
    // Đường dẫn được bảo vệ KHÔNG được miễn: prefetch tới đây vẫn chạy đủ logic chuyển
    // hướng. Hàng rào thật vẫn là Server Component và RLS (xem NGUYÊN TẮC HAI LỚP ở trên).
    { source: "/tai-khoan/:path*" },
    { source: "/admin/:path*" },
  ],
};

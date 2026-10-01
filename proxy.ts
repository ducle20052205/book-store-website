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
  const { supabase, user, response } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const needsLogin = isUnder(pathname, "/tai-khoan");
  const needsAdmin = isUnder(pathname, "/admin");

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
    // Bỏ qua tệp tĩnh của Next, ảnh tối ưu, favicon và các đuôi ảnh.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

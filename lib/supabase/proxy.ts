import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Client Supabase dành riêng cho proxy.ts (đợt 2A, spec mục 4 và 5) — CHỈ
 * proxy.ts được gọi file này. Đọc cookie từ NextRequest và ghi cookie mới
 * (khi token được làm mới) vào cả request lẫn NextResponse, để cả phần render
 * phía sau lẫn trình duyệt đều nhận đúng phiên đã làm mới.
 *
 * Gọi BÊN TRONG hàm proxy, không bao giờ ở module scope.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Phản hồi có Set-Cookie của phiên không được CDN/proxy cache — nếu
        // không, token của người này có thể bị phát cho người khác.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // GIỮ getUser(), CỐ Ý khác Header (Header dùng getClaims(), spec 2B mục 4):
  // getUser() hỏi thẳng máy chủ Auth nên phát hiện được token đã bị thu hồi
  // (đăng xuất ở thiết bị khác, xoá tài khoản); getClaims() chỉ xác minh chữ ký
  // cục bộ nên vẫn tin token đó tới khi hết hạn. Đây là hàng rào bảo vệ nên cần
  // mức chắc chắn cao hơn; Header chỉ hiển thị nên không cần. Đổi lại proxy tốn
  // một round trip (~99 ms) ở mọi request có phiên. Không getSession(): nó chỉ
  // đọc cookie, không đáng tin để quyết định quyền. Đừng đồng nhất hai chỗ này.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // `response` có thể đã bị thay trong setAll ở trên, nên chỉ đọc sau khi await.
  return { supabase, user, response };
}

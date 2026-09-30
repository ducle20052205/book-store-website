import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase cho Client Component (đợt 2A, spec mục 4).
 *
 * Gọi BÊN TRONG hàm xử lý/sự kiện, không bao giờ ở module scope — mỗi lần
 * gọi trả về client mới (createBrowserClient tự dùng chung bộ nhớ đệm bên
 * trong ở trình duyệt, nên không tốn kém). Phiên đăng nhập đọc/ghi qua cookie
 * để server (Server Component, proxy.ts) thấy cùng phiên với trình duyệt.
 */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

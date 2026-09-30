import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase KHÔNG gắn phiên đăng nhập, chỉ để đọc dữ liệu công khai
 * (sách, danh mục, tủ sách — RLS cho phép đọc bằng khoá anon).
 *
 * Tồn tại vì các hàm `use cache` không được đọc `cookies()`: client server
 * (lib/supabase/server.ts) buộc route phải render động, còn client này thì
 * không đụng tới cookie nên kết quả cache được và trang prerender được.
 * KHÔNG dùng cho bất cứ thứ gì phụ thuộc người dùng đang đăng nhập.
 *
 * Gọi BÊN TRONG hàm, không bao giờ ở module scope.
 */
export function createPublicClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

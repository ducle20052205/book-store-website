import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase cho Server Component, Server Action và Route Handler
 * (đợt 2A, spec mục 4).
 *
 * Gọi BÊN TRONG hàm xử lý request, không bao giờ ở module scope: mỗi request
 * cần một client riêng gắn với cookie của chính request đó.
 *
 * KHÔNG import file này vào bất kỳ file nào có "use client".
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component không ghi được cookie — đó là bình thường, không
          // phải lỗi: proxy.ts đã làm mới phiên ở request này rồi. Nuốt lỗi
          // ở đây để nó không làm hỏng việc render trang.
        }
      },
    },
  });
}

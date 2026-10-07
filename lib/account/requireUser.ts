import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Lớp kiểm đăng nhập THẬT của trang `/tai-khoan` (đợt 8, FR-A.4) — lớp truy cập dữ liệu, gọi ở ĐẦU trang và ở đầu mọi
 * Server Action của khu tài khoản. `proxy.ts` là lớp 1 (chuyển hướng sớm, đã có `/tai-khoan` trong `needsLogin`);
 * đây là lớp 2, chạy cả khi lớp 1 bị bỏ qua; lớp 3 là RLS (`profiles` chỉ cho sửa dòng của chính mình, FR-5.6).
 *
 * `getUser()`, không `getClaims()`: hàng rào bảo vệ phải phát hiện token đã bị thu hồi (mục 5.1 file quyết định) —
 * cùng lựa chọn với `proxy.ts` và `requireAdmin`. Phải gọi bên trong `<Suspense>` (đọc cookie phiên).
 */
export async function getSignedInUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/** Cho page: chưa đăng nhập → `/dang-nhap?next=<đường dẫn hiện tại>` (HTTP 200 vì `redirect()` chạy trong <Suspense>). */
export async function requireUser(currentPath: string): Promise<User> {
  const user = await getSignedInUser();
  if (!user) redirect(`/dang-nhap?next=${encodeURIComponent(currentPath)}`);
  return user;
}

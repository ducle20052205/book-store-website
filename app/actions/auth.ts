"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Đăng xuất (đợt 2A, spec mục 6): gọi signOut() trong Server Action rồi
 * revalidatePath('/'). Chỉ xoá phiên HIỆN TẠI (scope "local") — FR-5.3 quy
 * định "đăng xuất xóa session hiện tại"; mặc định của Supabase là "global"
 * (đăng xuất mọi thiết bị của người dùng), không phải điều spec yêu cầu.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/");
}

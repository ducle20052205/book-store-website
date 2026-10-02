import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Phiên cho giỏ hàng: client Supabase gắn cookie của request này và id người
 * dùng (null nếu chưa đăng nhập). Dùng getClaims() như Header — chỉ để quyết
 * giỏ nằm ở đâu; hàng rào thật là RLS `cart_items` (FR-3A.12).
 *
 * `cache` của React gộp các lần gọi trong cùng một request (badge header,
 * trang giỏ, Server Action) thành một.
 */
export const getCartSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return { supabase, userId: typeof sub === "string" && sub.length > 0 ? sub : null };
});

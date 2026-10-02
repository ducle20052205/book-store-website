import { type NextRequest, NextResponse } from "next/server";
import { getWardsOfProvince } from "@/lib/address";
import { PROVINCE_CODE_PATTERN } from "@/lib/checkoutRules";

/**
 * GET /api/dia-chi/phuong-xa?tinh=<mã tỉnh> (đợt 3B, spec FR-3B.12): danh sách phường/xã của
 * một tỉnh, `[{code, name}]` với `name` là tên đầy đủ kèm loại hình. Dữ liệu công khai nên đọc
 * bằng client Supabase không cookie, và response KHÔNG BAO GIỜ đặt cookie.
 *
 * Route này được loại khỏi matcher của proxy.ts (nguyên tắc: route phải cache công khai thì
 * không được đi qua proxy, vì `getUser()` ở đó có thể đặt cookie làm mới token lên response —
 * và response mang Set-Cookie thì CDN không lưu).
 */
const PUBLIC_CACHE = "public, s-maxage=31536000, stale-while-revalidate=86400";

export async function GET(request: NextRequest) {
  const province = request.nextUrl.searchParams.get("tinh");
  if (province === null || !PROVINCE_CODE_PATTERN.test(province)) {
    return NextResponse.json({ error: "tinh_khong_hop_le" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const wards = await getWardsOfProvince(province);
  return NextResponse.json(wards, { headers: { "Cache-Control": PUBLIC_CACHE } });
}

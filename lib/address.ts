import { cacheLife } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Dữ liệu hành chính 2 cấp (đợt 3B, spec FR-3B.1, FR-3B.12): 34 tỉnh/thành, 3.321
 * phường/xã. Đọc bằng client công khai (không cookie) nên dùng được trong `use cache`;
 * dữ liệu gần như không đổi nên làm mới theo ngày.
 */

export interface ProvinceOption {
  code: string;
  /** Tên không kèm loại hình ("Hà Nội"), đủ rõ để hiện trong ô chọn tỉnh/thành. */
  name: string;
}

export interface WardOption {
  code: string;
  /**
   * Tên ĐẦY ĐỦ kèm loại hình ("Phường Ba Đình", "Xã Hòa Lạc"): trong cùng một tỉnh có thể có
   * phường và xã trùng tên phần sau, nên ô chọn phải hiện loại hình. Đây cũng là số đo của
   * spec FR-3B.12 (143.932 byte cho cả nước được tính trên tên đầy đủ).
   */
  name: string;
}

// So sánh theo bảng chữ cái tiếng Việt (Đ sau D, Ă/Â sau A…), không phải thứ tự byte.
const vietnameseCollator = new Intl.Collator("vi");

/** 34 tỉnh/thành theo `sort_order` (bảng chữ cái tiếng Việt, tính một lần lúc seed). */
export async function getProvinces(): Promise<ProvinceOption[]> {
  "use cache";
  cacheLife("days");
  const { data } = await createPublicClient()
    .from("provinces")
    .select("code, name")
    .order("sort_order", { ascending: true });
  return ((data ?? []) as { code: string; name: string }[]).map((row) => ({ code: row.code, name: row.name }));
}

/** Phường/xã của một tỉnh, sắp theo phần tên (không kèm loại hình), rỗng nếu tỉnh không tồn tại. */
export async function getWardsOfProvince(provinceCode: string): Promise<WardOption[]> {
  "use cache";
  cacheLife("days");
  const { data } = await createPublicClient()
    .from("wards")
    .select("code, name, full_name")
    .eq("province_code", provinceCode);
  return ((data ?? []) as { code: string; name: string; full_name: string }[])
    .sort((a, b) => vietnameseCollator.compare(a.name, b.name) || a.code.localeCompare(b.code))
    .map((row) => ({ code: row.code, name: row.full_name }));
}

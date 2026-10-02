"use client";

import { useEffect, useRef } from "react";
import { repairGuestCart } from "@/app/actions/cart";

/**
 * Trang giỏ phát hiện cookie `na_cart` hỏng hoặc có dòng trỏ tới sách không còn
 * (FR-3A.9, FR-3A.11). Server Component không ghi được cookie, nên component này
 * gọi Server Action `repairGuestCart` một lần để ghi đè bằng giá trị hợp lệ. Action
 * chỉ bớt dữ liệu, không bao giờ thêm. Ghi cookie xong Next tự làm mới trang.
 */
export function RepairCartCookie() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void repairGuestCart();
  }, []);

  return null;
}

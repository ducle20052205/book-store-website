import { createClient } from "@/lib/supabase/server";

/**
 * Dữ liệu của /admin (đợt 6, spec FR-D.6): MỘT lời gọi RPC `admin_dashboard_stats()` cho toàn bộ số liệu
 * (NFR-D.4). Hàm chạy `SECURITY INVOKER` và tự chặn người không phải admin (`KHONG_PHAI_ADMIN`), nên phải gọi
 * bằng client của PHIÊN admin (`lib/supabase/server`), không bằng khoá secret. KHÔNG đọc qua hàm `"use cache"`
 * nào (FR-D.7): dashboard đọc qua cache sẽ hiện số trễ tới 60 giây sau mỗi lần ghi.
 *
 * Phải gọi sau `requireAdmin()` và bên trong `<Suspense>` (đọc cookie phiên).
 */
export interface DashboardStats {
  kpi: { revenue: number; orders: number; avg_order_value: number; customers: number };
  revenue_by_month: { month: string; revenue: number; orders: number }[];
  top_books: { slug: string; title: string; category: string | null; units: number; revenue: number }[];
  category_sales: { slug: string; name: string; units: number; revenue: number }[];
  funnel: { steps: { event_type: string; count: number }[]; sign_up: number; login: number };
}

function isStats(value: unknown): value is DashboardStats {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<DashboardStats>;
  return (
    !!v.kpi &&
    Array.isArray(v.revenue_by_month) &&
    Array.isArray(v.top_books) &&
    Array.isArray(v.category_sales) &&
    !!v.funnel &&
    Array.isArray(v.funnel.steps)
  );
}

/** `null` khi RPC lỗi hoặc trả hình dạng lạ: trang nói thật là chưa tải được, không vẽ số bịa. */
export async function getAdminDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error || !isStats(data)) return null;
  return data;
}

/** Số tiền rút gọn trên đỉnh cột: 1.234.000 → "1,2tr"; 850.000 → "850k"; 0 → "0". */
export function formatVndCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(".", ",")}tr`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(Math.round(amount));
}

/** "2026-04" → "T4". */
export function monthLabel(month: string): string {
  return `T${Number(month.slice(5, 7))}`;
}

export const FUNNEL_LABELS: Record<string, string> = {
  page_view: "Xem trang sách",
  search: "Tìm kiếm",
  add_to_cart: "Thêm vào giỏ",
  checkout_started: "Bắt đầu thanh toán",
  order_placed: "Đặt đơn",
};

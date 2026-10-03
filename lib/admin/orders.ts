import { type OrderStatus, isOrderStatus } from "@/lib/orderStatus";
import { isOrderCode } from "@/lib/orders/orderCode";
import { ORDER_DETAIL_SELECT, type OrderDetail } from "@/lib/orders/orderDetail";
import { createClient } from "@/lib/supabase/server";

/**
 * Truy vấn và tham số URL của danh sách đơn quản trị (đợt 5A, spec FR-5A.3, FR-5A.4). Mọi truy vấn dùng
 * client của PHIÊN admin (RLS `orders_select_own_or_admin`, `profiles_select_own_or_admin`), không dùng khoá
 * secret; nơi gọi phải đã qua `requireAdmin()`.
 */
export const ADMIN_ORDER_PAGE_SIZE = 20;
export const ADMIN_ORDER_SEARCH_MAX = 100;
/** Số tài khoản tối đa đưa vào bộ lọc khi tìm theo tên tài khoản (hạn chế đã biết, spec mục 6.1). */
const ACCOUNT_MATCH_LIMIT = 200;
/** Chặn `page` cực lớn trước khi thành `offset` (số mũ trong URL làm PostgREST từ chối); sau đó vẫn bị kẹp về trang cuối. */
const PAGE_CEILING = 1_000_000;

export interface ParsedAdminOrderParams {
  status?: OrderStatus;
  q?: string;
  page: number;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Theo mẫu `parseCatalogSearchParams`: giá trị lạ về mặc định, không ném lỗi. `q` cắt theo KÝ TỰ (không cắt đôi cặp thay thế của emoji). */
export function parseAdminOrderParams(sp: RawSearchParams): ParsedAdminOrderParams {
  const statusRaw = firstValue(sp.status);
  const status = isOrderStatus(statusRaw) ? statusRaw : undefined;

  const qRaw = firstValue(sp.q)?.trim();
  const q = qRaw ? Array.from(qRaw).slice(0, ADMIN_ORDER_SEARCH_MAX).join("") : undefined;

  const pageRaw = Number(firstValue(sp.page));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.min(Math.floor(pageRaw), PAGE_CEILING) : 1;

  return { status, q, page };
}

type AdminOrderQueryOverrides = Partial<Record<keyof ParsedAdminOrderParams, string | number | undefined>>;

/**
 * Ghép query string theo mẫu `buildCatalogQuery`: đổi bất kỳ tham số nào ngoài `page` đặt `page` về 1 (trừ khi
 * override truyền `page` rõ ràng); `page = 1` và `status` rỗng không xuất hiện trên URL.
 */
export function buildAdminOrderQuery(current: ParsedAdminOrderParams, overrides: AdminOrderQueryOverrides): string {
  const merged: AdminOrderQueryOverrides = { ...current, ...overrides };
  if (!("page" in overrides)) merged.page = undefined;

  const params = new URLSearchParams();
  if (merged.status) params.set("status", String(merged.status));
  if (merged.q) params.set("q", String(merged.q));
  if (merged.page && Number(merged.page) > 1) params.set("page", String(merged.page));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Chuỗi `q` thành giá trị an toàn cho bộ lọc `or` của PostgREST (FR-5A.3, TC-11).
 *
 * Hai lớp, vì có hai bộ ký tự đặc biệt khác nhau:
 *  1. Cú pháp `or(...)` của PostgREST: `,` `(` `)` `"` `\` đổi nghĩa bộ lọc nếu để trần. Bọc giá trị trong dấu
 *     nháy kép và escape `\` rồi `"` (đúng quy tắc "reserved characters" của PostgREST).
 *  2. Ký tự của toán tử so khớp. KHÔNG dùng `ilike`: PostgREST đổi MỌI `*` trong giá trị thành `%` sau khi đã
 *     parse, nên một `*` do người dùng gõ không thể thành chữ thường (đo trên PostgREST cục bộ v16.3: `q = "*"`
 *     với `ilike` + escape `LIKE` khớp 13/13 đơn thử, không chỉ đơn có dấu `*`). Dùng `imatch` (regex không
 *     phân biệt hoa thường, `~*`) với mọi ký tự regex đã được escape bằng `\`: `*` `%` `_` `.` ... đều là chữ
 *     thường, và không có đầu vào nào làm regex sai cú pháp. Khớp "chứa chuỗi con", đúng như `ilike '%q%'`.
 */
export function regexEscape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export interface AdminOrderRow {
  order_code: string;
  status: string;
  total_amount: number;
  created_at: string | null;
  recipient_name: string;
  user_id: string;
}

export interface AdminOrderList {
  rows: AdminOrderRow[];
  /** `user_id` → họ tên tài khoản (chỉ những tài khoản có `full_name`). */
  accountNames: Record<string, string>;
  total: number;
  /** Trang thật được trả về (đã kẹp về trang cuối nếu `page` vượt quá). */
  page: number;
  totalPages: number;
}

const LIST_SELECT = "order_code, status, total_amount, created_at, recipient_name, user_id";

/** Trả `null` khi truy vấn lỗi (nơi gọi hiện thông báo chung; không lộ chi tiết lỗi ra giao diện). */
export async function listAdminOrders(params: ParsedAdminOrderParams): Promise<AdminOrderList | null> {
  const supabase = await createClient();

  // Tìm theo mã đơn, tên người nhận HOẶC tên tài khoản — hai bước, không nhúng: `orders.user_id` chỉ có khoá
  // ngoại tới `auth.users`, không có quan hệ nào tới `profiles` (spec FR-5A.3).
  let searchOr: string | null = null;
  if (params.q) {
    const pattern = regexEscape(params.q);
    const { data: accounts, error: accountError } = await supabase
      .from("profiles")
      .select("id")
      .filter("full_name", "imatch", pattern)
      .limit(ACCOUNT_MATCH_LIMIT);
    if (accountError) return null;
    const quoted = quotePostgrestValue(pattern);
    const parts = [`order_code.imatch.${quoted}`, `recipient_name.imatch.${quoted}`];
    const ids = (accounts ?? []).map((a) => a.id as string);
    if (ids.length > 0) parts.push(`user_id.in.(${ids.join(",")})`);
    searchOr = parts.join(",");
  }

  const query = () => {
    let qb = supabase.from("orders").select(LIST_SELECT, { count: "exact" });
    if (params.status) qb = qb.eq("status", params.status);
    if (searchOr) qb = qb.or(searchOr);
    return qb;
  };
  const fetchPage = (page: number) => {
    const from = (page - 1) * ADMIN_ORDER_PAGE_SIZE;
    // `created_at` cho phép NULL và Postgres xếp NULL lên đầu khi giảm dần → `nullsFirst: false`; `order_code`
    // giải quyết hai đơn trùng giây (cùng mẫu `/tai-khoan/don-hang`).
    return query()
      .order("created_at", { ascending: false, nullsFirst: false })
      .order("order_code", { ascending: false })
      .range(from, from + ADMIN_ORDER_PAGE_SIZE - 1);
  };

  let page = params.page;
  let result = await fetchPage(page);
  // `page` vượt quá tổng số trang: PostgREST trả lỗi PGRST103 (416) hoặc danh sách rỗng. Đếm lại rồi kẹp về
  // trang cuối; URL của người dùng không bị viết lại (spec FR-5A.3).
  if (page > 1 && (result.error?.code === "PGRST103" || (!result.error && (result.data ?? []).length === 0))) {
    const counted = await query().range(0, 0);
    if (counted.error) return null;
    page = Math.max(1, Math.ceil((counted.count ?? 0) / ADMIN_ORDER_PAGE_SIZE));
    result = await fetchPage(page);
  }
  if (result.error) {
    console.error(`[admin orders] ${result.error.code ?? "?"} ${result.error.message}`);
    return null;
  }

  const rows = (result.data ?? []) as unknown as AdminOrderRow[];
  const total = result.count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_ORDER_PAGE_SIZE));

  const accountNames: Record<string, string> = {};
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    for (const p of profiles ?? []) if (p.full_name) accountNames[p.id as string] = p.full_name as string;
  }

  return { rows, accountNames, total, page, totalPages };
}

export interface AdminCustomer {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * Một đơn cho admin (không lọc theo `user_id`, khác `getOwnOrder`) kèm thông tin TÀI KHOẢN của chủ đơn. Trả
 * `null` cho mã sai định dạng và đơn không tồn tại → nơi gọi `notFound()`. `customer` là `null` khi không có
 * dòng `profiles`. Phải gọi sau `requireAdmin()`.
 */
export async function getAdminOrder(rawCode: string): Promise<{ order: OrderDetail; customer: AdminCustomer | null } | null> {
  let orderCode: string;
  try {
    orderCode = decodeURIComponent(rawCode);
  } catch {
    return null;
  }
  if (!isOrderCode(orderCode)) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("orders").select(`${ORDER_DETAIL_SELECT}, user_id`).eq("order_code", orderCode).maybeSingle();
  if (!data) return null;
  const { user_id: userId, ...rest } = data as unknown as OrderDetail & { user_id: string };

  const { data: profile } = await supabase.from("profiles").select("full_name, email, phone").eq("id", userId).maybeSingle();
  return { order: rest as OrderDetail, customer: (profile as AdminCustomer | null) ?? null };
}

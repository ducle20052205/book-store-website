"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { trackServer } from "@/lib/analytics.server";
import { clearGuestCart, isUuid } from "@/lib/cart/cookie";
import { type CheckoutErrors, type CheckoutFields, validateCheckout } from "@/lib/checkoutRules";
import { CART_STOCK_NOTICE_HREF } from "@/lib/checkout/stockNotice";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderOrderConfirmation } from "@/lib/email/orderConfirmation";
import { type NewOrderPayload, notifyNewOrder } from "@/lib/notify/newOrder";
import { resolveSiteOrigin } from "@/lib/siteOrigin";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action đặt hàng (đợt 3B, spec FR-3B.18–3B.25, FR-3B.27–3B.30).
 *
 * Lớp kiểm tra thật nằm ở đây và ở database: form chỉ để tiện cho người dùng. Mọi việc ghi
 * dữ liệu đơn nằm trong MỘT hàm Postgres `place_order` (một giao dịch). Client KHÔNG gửi giá
 * hay danh sách sách; chỉ gửi `expectedTotal` là tổng người dùng đã thấy, để hàm phát hiện giá
 * đổi giữa lúc xem trang và lúc bấm nút.
 *
 * Sau khi RPC thành công, theo đúng thứ tự: xoá cookie giỏ của khách (nếu còn) → ghi sự kiện
 * `order_placed` từ server → gửi email xác nhận (await, hết hạn 4 giây; cố ý KHÔNG dùng
 * `after()` vì độ chắc chắn của email quan trọng hơn vài trăm ms chờ) → lên lịch báo cửa hàng
 * trong `after()` → `redirect()`. Thành công thì KHÔNG trả về mà gọi `redirect()` (như
 * signIn/signUp ở app/actions/auth.ts), nên form phải bỏ qua lỗi redirect (lib/nextRedirect.ts).
 *
 * Log: chỉ `order_code` và mã lỗi, không bao giờ ghi email, tên, SĐT hay địa chỉ.
 */

export interface PlaceOrderInput extends CheckoutFields {
  /** Tổng tiền người dùng đã thấy (số do server tính ra lúc render trang). */
  expectedTotal: number;
  /** Lưu địa chỉ vào hồ sơ sau khi đặt hàng thành công (FR-3B.11). */
  saveAddress: boolean;
}

export type PlaceOrderFailure =
  | { ok: false; kind: "validation"; errors: CheckoutErrors }
  | { ok: false; kind: "price_changed"; newTotal: number | null }
  | { ok: false; kind: "address_invalid" }
  | { ok: false; kind: "unknown" };

/** Mã lỗi do `place_order` raise (message của exception). */
const ERROR_CODES = [
  "KHONG_DANG_NHAP",
  "KHOA_DAT_HANG_TRUNG_USER_KHAC",
  "DU_LIEU_KHONG_HOP_LE",
  "DIA_CHI_KHONG_HOP_LE",
  "GIO_HANG_TRONG",
  "GIA_DA_DOI",
  "HET_HANG",
] as const;
type OrderErrorCode = (typeof ERROR_CODES)[number];

function orderErrorCode(message: string | undefined): OrderErrorCode | null {
  return ERROR_CODES.find((code) => message === code) ?? null;
}

interface OrderRow {
  order_code: string;
  total_amount: number;
  payment_method: "cod" | "bank_transfer";
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  created_at: string;
  order_items: { quantity: number; price_at_purchase: number; books: { title: string; author: string } | null }[];
}

export async function placeOrder(input: PlaceOrderInput, idempotencyKey: string): Promise<PlaceOrderFailure> {
  // --- Lớp 2: kiểm tra lại ở server ---
  const { errors, value } = validateCheckout(input ?? {});
  if (value === null) return { ok: false, kind: "validation", errors };
  if (!isUuid(idempotencyKey) || typeof input.expectedTotal !== "number" || !Number.isFinite(input.expectedTotal)) {
    return { ok: false, kind: "unknown" };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) redirect("/dang-nhap?next=%2Fthanh-toan");
  const accountEmail = typeof claims?.claims?.email === "string" ? claims.claims.email : null;

  // --- Lớp 3: MỘT giao dịch ở database ---
  const { data, error } = await supabase.rpc("place_order", {
    p_idempotency_key: idempotencyKey.toLowerCase(),
    p_recipient_name: value.recipientName,
    p_recipient_phone: value.recipientPhone,
    p_address_line: value.addressLine,
    p_ward_code: value.wardCode,
    p_province_code: value.provinceCode,
    p_payment_method: value.paymentMethod,
    p_note: value.note,
    p_expected_total: input.expectedTotal,
  });

  if (error) {
    const code = orderErrorCode(error.message);
    console.error("[checkout] place_order thất bại:", code ?? error.code ?? "không có mã");
    // Banner ở /gio-hang dựng lại từ tồn kho thật; không truyền gì từ lỗi HET_HANG sang URL.
    if (code === "HET_HANG") redirect(CART_STOCK_NOTICE_HREF);
    if (code === "GIO_HANG_TRONG") redirect("/gio-hang");
    if (code === "KHONG_DANG_NHAP") redirect("/dang-nhap?next=%2Fthanh-toan");
    if (code === "DIA_CHI_KHONG_HOP_LE") return { ok: false, kind: "address_invalid" };
    if (code === "GIA_DA_DOI") {
      const parsed = Number(error.details);
      return { ok: false, kind: "price_changed", newTotal: Number.isFinite(parsed) ? parsed : null };
    }
    return { ok: false, kind: "unknown" };
  }

  const result = (data as { order_code: string; created: boolean }[] | null)?.[0];
  if (!result?.order_code) {
    console.error("[checkout] place_order không trả mã đơn");
    return { ok: false, kind: "unknown" };
  }
  const orderCode = result.order_code;
  const confirmationPath = `/thanh-toan/hoan-tat/${encodeURIComponent(orderCode)}`;

  // Cùng khoá đã đặt rồi (bấm hai lần, mạng chập chờn…): đơn đã có, các việc phụ đã làm ở lần
  // đầu — chỉ đưa người dùng tới trang xác nhận, không ghi sự kiện / gửi email lần hai.
  if (!result.created) redirect(confirmationPath);

  // Từ đây đơn ĐÃ có trong database; mọi việc phụ tự bắt lỗi, không việc nào được làm đơn thất bại.
  try {
    await clearGuestCart();
  } catch {
    // Cookie giỏ của khách đã được gộp và xoá lúc đăng nhập; chỗ này chỉ là dọn cho chắc.
  }

  const order = await loadOrder(supabase, orderCode);
  const itemsCount = order ? order.order_items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  await trackServer(
    supabase,
    "order_placed",
    {
      order_code: orderCode,
      items_count: itemsCount,
      total_amount: order?.total_amount ?? input.expectedTotal,
      payment_method: value.paymentMethod,
    },
    userId,
  );

  if (input.saveAddress === true) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ province_code: value.provinceCode, ward_code: value.wardCode, address_line: value.addressLine })
      .eq("id", userId);
    if (profileError) console.error("[checkout] lưu địa chỉ vào hồ sơ thất bại:", orderCode, profileError.code ?? "không có mã");
  }

  if (order) {
    const items = order.order_items.map((item) => ({
      title: item.books?.title ?? "",
      author: item.books?.author ?? "",
      quantity: item.quantity,
      unit_price: item.price_at_purchase,
      line_total: item.quantity * item.price_at_purchase,
    }));

    await sendConfirmationEmail(supabase, order, accountEmail, items);

    const payload: NewOrderPayload = {
      order_code: orderCode,
      placed_at: order.created_at,
      customer: { name: order.recipient_name, email: accountEmail, phone: order.recipient_phone },
      shipping_address: order.shipping_address,
      payment_method: order.payment_method,
      total_amount: order.total_amount,
      items,
    };
    after(() => notifyNewOrder(payload));
  }

  redirect(confirmationPath);
}

async function loadOrder(supabase: Awaited<ReturnType<typeof createClient>>, orderCode: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_code, total_amount, payment_method, recipient_name, recipient_phone, shipping_address, created_at, order_items(quantity, price_at_purchase, books(title, author))",
    )
    .eq("order_code", orderCode)
    .maybeSingle();
  if (error || !data) {
    console.error("[checkout] đọc lại đơn thất bại:", orderCode, error?.code ?? "không có dữ liệu");
    return null;
  }
  return data as unknown as OrderRow;
}

/**
 * Gửi email xác nhận cho khách (FR-3B.27) và ghi `confirmation_email_sent_at` qua
 * `mark_confirmation_sent` khi thành công (FR-3B.28). Thất bại, hết hạn hay chưa cấu hình thì
 * để trống cột — trang xác nhận nói thật về điều đó (FR-3B.29). Không ném lỗi.
 */
async function sendConfirmationEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  order: OrderRow,
  accountEmail: string | null,
  items: NewOrderPayload["items"],
): Promise<void> {
  if (!accountEmail) return;
  try {
    // Không dựng được origin (production, thiếu cả SITE_URL lẫn biến của Vercel): gửi email KHÔNG có link
    // thay vì link `localhost`, và ghi đúng một dòng chỉ gồm mã đơn + mã lỗi (spec FR-3B.27).
    const siteOrigin = resolveSiteOrigin();
    if (siteOrigin === null) console.error("[checkout] email không có link:", order.order_code, "site_origin_missing");

    const content = renderOrderConfirmation({
      orderCode: order.order_code,
      recipientName: order.recipient_name,
      recipientPhone: order.recipient_phone,
      shippingAddress: order.shipping_address,
      paymentMethod: order.payment_method,
      totalAmount: order.total_amount,
      items: items.map((item) => ({
        title: item.title,
        author: item.author,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        lineTotal: item.line_total,
      })),
      siteOrigin,
    });

    const result = await sendBrevoEmail({ to: accountEmail, subject: content.subject, html: content.html, text: content.text });
    if (result.ok) {
      const { error } = await supabase.rpc("mark_confirmation_sent", { p_order_code: order.order_code });
      if (error) console.error("[checkout] ghi confirmation_email_sent_at thất bại:", order.order_code, error.code ?? "không có mã");
      return;
    }
    // Chưa cấu hình là trạng thái bình thường (im lặng); còn lại ghi mã lỗi, không ghi thân.
    if (result.reason !== "not_configured") {
      console.error(
        "[checkout] gửi email xác nhận thất bại:",
        order.order_code,
        result.reason,
        result.status ?? "",
        result.code ?? "",
      );
    }
  } catch (error) {
    console.error("[checkout] gửi email xác nhận thất bại:", order.order_code, error instanceof Error ? error.name : "lỗi không rõ");
  }
}

/**
 * Nội dung email xác nhận đơn (đợt 3B, spec FR-3B.27, mục 9a). Tiếng Việt, giọng NA Books
 * ("chúng mình" / "bạn"). Render bằng hàm này, không phải do Make điền placeholder.
 *
 * HTML: CSS viết thẳng vào thuộc tính `style`, KHÔNG ảnh ngoài, KHÔNG webfont, KHÔNG
 * script, bố cục bảng đơn giản (email client không dùng grid/flex ổn định). Bản `.txt` đọc
 * được không cần HTML. Cả hai bản đều có dòng ghi rõ đây là dự án portfolio.
 *
 * Màu: email không dùng được biến CSS, nên các mã hex ở đây là GIÁ TRỊ của token trong
 * `@theme` (app/globals.css): paper #EDE6D9, ink-900 #1A1C2E, ink-600 #4A4E66, cham-700 #26306B,
 * success #266E48, line-warm #E3DCCE, menu-sep #EFE9DD. Đổi token thì đổi ở đây (ngoại lệ duy
 * nhất của quy tắc "không viết cứng hex", vì nơi dùng không phải component của app).
 *
 * Mẫu đã render nằm ở docs/email-templates/ (sinh bằng scripts/render-email-samples.mjs từ
 * chính hàm này, dữ liệu mẫu `ban.doc@example.com`); không viết tay hai nơi.
 *
 * Self-contained (không import gì) để script Node chạy được trực tiếp.
 */

export interface ConfirmationItem {
  title: string;
  author: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderConfirmationData {
  orderCode: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  paymentMethod: "cod" | "bank_transfer";
  totalAmount: number;
  items: ConfirmationItem[];
  /** Origin tuyệt đối của site (lib/siteOrigin.ts); null thì email không có link. */
  siteOrigin: string | null;
}

export const PORTFOLIO_LINE =
  "Đây là dự án portfolio: không có cổng thanh toán thật và không có đơn hàng nào được giao thật.";

const PAYMENT_LABELS = { cod: "Thanh toán khi nhận hàng (COD)", bank_transfer: "Chuyển khoản ngân hàng (minh họa)" } as const;

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const money = (amount: number) => vnd.format(amount);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Link tới trang xác nhận đơn; null khi không có origin. Mã đơn có dạng NA-YYYY-NNNN nên không cần mã hoá. */
export function orderUrl(data: Pick<OrderConfirmationData, "orderCode" | "siteOrigin">): string | null {
  return data.siteOrigin ? `${data.siteOrigin}/thanh-toan/hoan-tat/${encodeURIComponent(data.orderCode)}` : null;
}

export function renderOrderConfirmation(data: OrderConfirmationData): { subject: string; html: string; text: string } {
  const subject = `NA Books — chúng mình đã nhận đơn ${data.orderCode}`;
  const link = orderUrl(data);

  const text = [
    `Chào ${data.recipientName},`,
    "",
    "Chúng mình đã nhận đơn của bạn. Cảm ơn bạn đã chọn sách ở NA Books.",
    "",
    `Mã đơn hàng: ${data.orderCode}`,
    "Trạng thái: Chờ xử lý",
    "",
    "Sách trong đơn:",
    ...data.items.map(
      (item) => `- ${item.title} (${item.author}) — ${item.quantity} × ${money(item.unitPrice)} = ${money(item.lineTotal)}`,
    ),
    "",
    "Phí giao hàng: Miễn phí",
    `Tổng cộng: ${money(data.totalAmount)}`,
    "",
    "Giao tới:",
    `${data.recipientName} · ${data.recipientPhone}`,
    data.shippingAddress,
    "",
    `Thanh toán: ${PAYMENT_LABELS[data.paymentMethod]}`,
    ...(link ? ["", `Xem đơn hàng: ${link}`] : []),
    "",
    PORTFOLIO_LINE,
    "NA Books — nhà sách tuyển chọn.",
    "",
  ].join("\n");

  const td = "padding:8px 0;border-bottom:1px solid #EFE9DD;vertical-align:top;";
  const rows = data.items
    .map(
      (item) =>
        `<tr><td style="${td}"><span style="font-weight:600;color:#1A1C2E;">${escapeHtml(item.title)}</span><br>` +
        `<span style="font-size:13px;color:#4A4E66;">${escapeHtml(item.author)} · ${item.quantity} × ${escapeHtml(money(item.unitPrice))}</span></td>` +
        `<td style="${td}text-align:right;white-space:nowrap;color:#1A1C2E;">${escapeHtml(money(item.lineTotal))}</td></tr>`,
    )
    .join("");

  const button = link
    ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#26306B;color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:3px;">Xem đơn hàng</a></p>`
    : "";

  const html =
    `<!doctype html>\n<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${escapeHtml(subject)}</title></head>` +
    `<body style="margin:0;padding:0;background:#EDE6D9;font-family:Arial,Helvetica,sans-serif;color:#1A1C2E;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDE6D9;"><tr><td align="center" style="padding:24px 12px;">` +
    `<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border:1px solid #E3DCCE;">` +
    `<tr><td style="padding:24px 24px 8px;"><p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#26306B;">NA Books</p></td></tr>` +
    `<tr><td style="padding:8px 24px 0;">` +
    `<h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:#1A1C2E;">Chúng mình đã nhận đơn của bạn</h1>` +
    `<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#4A4E66;">Chào ${escapeHtml(data.recipientName)}, cảm ơn bạn đã chọn sách ở NA Books.</p>` +
    `<p style="margin:16px 0 0;font-size:14px;color:#4A4E66;">Mã đơn hàng</p>` +
    `<p style="margin:2px 0 0;font-size:20px;font-weight:bold;letter-spacing:1px;color:#1A1C2E;">${escapeHtml(data.orderCode)}</p>` +
    `<p style="margin:2px 0 0;font-size:13px;color:#4A4E66;">Trạng thái: Chờ xử lý</p>` +
    `</td></tr>` +
    `<tr><td style="padding:16px 24px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;line-height:1.5;">${rows}` +
    `<tr><td style="padding:8px 0;color:#4A4E66;">Phí giao hàng</td><td style="padding:8px 0;text-align:right;color:#266E48;font-weight:600;">Miễn phí</td></tr>` +
    `<tr><td style="padding:8px 0;font-weight:bold;">Tổng cộng</td><td style="padding:8px 0;text-align:right;font-size:18px;font-weight:bold;color:#26306B;">${escapeHtml(money(data.totalAmount))}</td></tr>` +
    `</table></td></tr>` +
    `<tr><td style="padding:16px 24px 0;font-size:15px;line-height:1.6;">` +
    `<p style="margin:0;font-size:13px;color:#4A4E66;">Giao tới</p>` +
    `<p style="margin:2px 0 0;">${escapeHtml(data.recipientName)} · ${escapeHtml(data.recipientPhone)}<br>${escapeHtml(data.shippingAddress)}</p>` +
    `<p style="margin:12px 0 0;font-size:13px;color:#4A4E66;">Thanh toán</p>` +
    `<p style="margin:2px 0 0;">${escapeHtml(PAYMENT_LABELS[data.paymentMethod])}</p>` +
    `${button}</td></tr>` +
    `<tr><td style="padding:24px;"><p style="margin:0;border-top:1px solid #EFE9DD;padding-top:16px;font-size:12px;line-height:1.5;color:#4A4E66;">${escapeHtml(PORTFOLIO_LINE)}</p></td></tr>` +
    `</table></td></tr></table></body></html>\n`;

  return { subject, html, text };
}

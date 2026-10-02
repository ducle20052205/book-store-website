// Gửi MỘT email xác nhận đơn mẫu qua Brevo để thử API key mà không cần đặt đơn thật
// (đợt 3B, spec mục 9b; tiêu chí TC-38, số mẫu 1).
//
// Biến môi trường:
//   BREVO_API_KEY   khoá API v3 của Brevo
//   BREVO_SENDER    địa chỉ người gửi đã được xác minh trong Brevo
//   TEST_EMAIL_TO   địa chỉ nhận thử (của chính bạn); KHÔNG ghi vào repo
//   SITE_URL        (tuỳ chọn) origin cho link trong email
//
// Chạy (nạp biến từ .env.local, thêm TEST_EMAIL_TO ở dòng lệnh):
//   TEST_EMAIL_TO=ban@example.com node --no-warnings --env-file=.env.local scripts/send-test-confirmation.mjs
//
// In ra mã HTTP và thân phản hồi của Brevo (thân chỉ có messageId hoặc mã lỗi — không có dữ liệu
// cá nhân). Không in địa chỉ nhận đầy đủ. Sau khi gửi, mở thư nhận được và ghi lại: địa chỉ From thực
// tế (có bị viết lại thành @…brevosend.com không), đích thật của một link trong thân (có qua domain
// theo dõi không), và bản .txt / HTML cùng đến hay chỉ một bản.

import { renderOrderConfirmation } from "../lib/email/orderConfirmation.ts";
import { resolveSiteOrigin } from "../lib/siteOrigin.ts";

const apiKey = (process.env.BREVO_API_KEY ?? "").trim();
const sender = (process.env.BREVO_SENDER ?? "").trim();
const to = (process.env.TEST_EMAIL_TO ?? "").trim();
const url = (process.env.BREVO_API_URL ?? "").trim() || "https://api.brevo.com/v3/smtp/email";

const missing = [
  ["BREVO_API_KEY", apiKey],
  ["BREVO_SENDER", sender],
  ["TEST_EMAIL_TO", to],
]
  .filter(([, value]) => value === "")
  .map(([name]) => name);
if (missing.length > 0) {
  console.error(`Thiếu biến môi trường: ${missing.join(", ")}`);
  process.exit(2);
}

const content = renderOrderConfirmation({
  orderCode: "NA-2026-0042",
  recipientName: "Bạn Đọc",
  recipientPhone: "0900000000",
  shippingAddress: "12 ngõ 4 Nguyễn Chí Thanh, Phường Ba Đình, Thành phố Hà Nội",
  paymentMethod: "cod",
  totalAmount: 376000,
  items: [
    { title: "Nhà giả kim", author: "Paulo Coelho", quantity: 1, unitPrice: 69000, lineTotal: 69000 },
    { title: "Rừng Na Uy", author: "Haruki Murakami", quantity: 2, unitPrice: 99000, lineTotal: 198000 },
    { title: "Tâm lý học về tiền", author: "Morgan Housel", quantity: 1, unitPrice: 109000, lineTotal: 109000 },
  ],
  siteOrigin: resolveSiteOrigin(),
});

const masked = to.replace(/^(.).*(@.*)$/, "$1***$2");
console.log(`Gửi 1 email mẫu tới ${masked} qua ${new URL(url).host} …`);

const response = await fetch(url, {
  method: "POST",
  headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({
    sender: { email: sender, name: "NA Books" },
    to: [{ email: to }],
    subject: `[THỬ] ${content.subject}`,
    htmlContent: content.html,
    textContent: content.text,
  }),
  signal: AbortSignal.timeout(15000),
});

console.log("HTTP", response.status);
console.log(await response.text());
// Đặt exitCode rồi để tiến trình tự kết thúc: gọi process.exit() ngay sau fetch làm Node trên Windows
// báo "Assertion failed … UV_HANDLE_CLOSING" và thoát với mã lạ dù thư đã gửi xong.
process.exitCode = response.ok ? 0 : 1;

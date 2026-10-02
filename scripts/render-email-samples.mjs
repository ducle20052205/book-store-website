// Sinh bản mẫu đã render của email xác nhận đơn vào docs/email-templates/ (đợt 3B, spec mục 9a).
//
// Nguồn thật của nội dung email là hàm `renderOrderConfirmation` ở lib/email/orderConfirmation.ts;
// hai file mẫu .html và .txt được SINH từ chính hàm đó, không viết tay hai nơi. Dữ liệu mẫu dùng
// `ban.doc@example.com` và địa chỉ giả (repo công khai: không dữ liệu cá nhân thật).
//
// Chạy:  node --no-warnings scripts/render-email-samples.mjs
// (Node 24 chạy trực tiếp file .ts đã bỏ kiểu; lib/email/orderConfirmation.ts không import gì khác.)

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderOrderConfirmation } from "../lib/email/orderConfirmation.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs", "email-templates");
mkdirSync(outDir, { recursive: true });

export const SAMPLE_ORDER = {
  orderCode: "NA-2026-0042",
  recipientName: "Lê Bạn Đọc",
  recipientPhone: "0900000000",
  shippingAddress: "12 ngõ 4 Nguyễn Chí Thanh, Phường Ba Đình, Thành phố Hà Nội",
  paymentMethod: "cod",
  totalAmount: 376000,
  items: [
    { title: "Nhà giả kim", author: "Paulo Coelho", quantity: 1, unitPrice: 69000, lineTotal: 69000 },
    { title: "Rừng Na Uy", author: "Haruki Murakami", quantity: 2, unitPrice: 99000, lineTotal: 198000 },
    { title: "Tâm lý học về tiền", author: "Morgan Housel", quantity: 1, unitPrice: 109000, lineTotal: 109000 },
  ],
  siteOrigin: "https://example.com",
};

const { html, text } = renderOrderConfirmation(SAMPLE_ORDER);
writeFileSync(join(outDir, "xac-nhan-don.html"), html, "utf8");
writeFileSync(join(outDir, "xac-nhan-don.txt"), text, "utf8");
console.log("Đã ghi docs/email-templates/xac-nhan-don.html và xac-nhan-don.txt");

// Endpoint nhận GIẢ cho hai đường gọi ra ngoài của đợt 3B (spec mục 9c): Brevo (email khách) và
// Make.com (báo cửa hàng). CHỈ để kiểm thử trên máy, KHÔNG deploy.
//
// Chạy:  node scripts/mock-external.mjs [cổng]      (mặc định 4010)
//
// Trỏ ứng dụng vào đây bằng biến môi trường:
//   BREVO_API_URL=http://127.0.0.1:4010/brevo/ok      (hoặc /brevo/500, /brevo/hang)
//   MAKE_WEBHOOK_URL=http://127.0.0.1:4010/make/ok    (hoặc /make/500, /make/hang)
//
// Hành vi theo đoạn cuối của đường dẫn:
//   ok    trả 201 {"messageId": "<mock-…>"} (Brevo) hoặc 200 "Accepted" (Make)
//   500   trả 500 {"code":"mock_error"}
//   hang  nhận request rồi KHÔNG trả lời (giữ kết nối 30 giây) — thử hết thời gian chờ
//
// Quan sát: GET /_requests trả mọi request đã nhận (đường dẫn, header, thân), DELETE /_requests xoá.
// Đây là kho tạm trong bộ nhớ của tiến trình thử; thân request chứa dữ liệu mẫu của tài khoản thử.

import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 4010);
const received = [];

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (url.pathname === "/_requests") {
    if (request.method === "DELETE") received.length = 0;
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(request.method === "DELETE" ? [] : received));
    return;
  }

  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    const body = Buffer.concat(chunks).toString("utf8");
    let parsed = null;
    try {
      parsed = JSON.parse(body);
    } catch {
      // thân không phải JSON: giữ nguyên chuỗi
    }
    const [, target, mode] = url.pathname.split("/");
    received.push({
      at: new Date().toISOString(),
      method: request.method,
      path: url.pathname,
      headers: request.headers,
      body: parsed ?? body,
    });
    console.log(`${request.method} ${url.pathname} (${body.length} byte)`); // không in thân: có dữ liệu mẫu

    if (mode === "hang") {
      setTimeout(() => response.end(), 30000);
      return;
    }
    if (mode === "500") {
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ code: "mock_error", message: "lỗi giả lập" }));
      return;
    }
    if (target === "brevo") {
      response.writeHead(201, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ messageId: `<mock-${received.length}@brevo.invalid>` }));
      return;
    }
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Accepted");
  });
});

server.listen(port, "127.0.0.1", () => console.log(`mock-external đang nghe http://127.0.0.1:${port}`));

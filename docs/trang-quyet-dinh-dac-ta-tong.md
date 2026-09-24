# NA Books — Quyết định & Đặc tả tổng

> **Vai trò của file này:** nơi lưu những gì đã **thực sự chốt**, không phải nơi đưa ra quyết định mới. Project này đóng vai trò "chỉ huy": mọi quyết định về kiến trúc, thiết kế, tính năng và spec cho Claude Code được thảo luận và chốt trong các chat của project, sau đó cập nhật vào đây. Đọc file này trước khi trả lời để không hỏi lại hoặc mâu thuẫn với quyết định cũ — nhưng đừng coi mục "còn mở" là đã có hướng đi.
>
> **Cập nhật lần cuối:** 24/09/2026.
> **Nguồn chân lý:** repo `github.com/ducle20052205/book-store-website`. Các file `docs/SRS.md`, `docs/specs/*`, `CLAUDE.md` trong repo là bản gốc; file này là bản tóm tắt cấp quyết định.

## 1. Bối cảnh & mục tiêu (đã chốt)

- Website bán sách xây từ đầu (thiết kế, frontend, backend, API, database) — mục đích **showcase/portfolio cá nhân**, không kinh doanh thật, không cần nguồn hàng hay logistics.
- Đối tượng xem: **nhà tuyển dụng và chương trình ứng tuyển hướng BA/PM/Product**.
- Vì vậy cần một trang/README giải thích lý do đằng sau các quyết định sản phẩm, không chỉ có code.
- Toàn bộ spec chốt trong project được đưa trực tiếp cho Claude Code triển khai.

## 2. Định vị sản phẩm (đã chốt)

- **Người đọc mục tiêu: 18–30 tuổi.**
- **Định vị: nhà sách tuyển chọn — mỗi cuốn sách có mặt đều kèm lời giải thích của biên tập.** Đây là điểm khác biệt chính so với 8 nhà sách VN đã khảo sát; IPM có tủ "Tinh tuyển" nhưng không giải thích lý do chọn.
- **Nguyên tắc thiết kế: "Quen ở cấu trúc, riêng ở chất liệu."** Bố cục, vị trí thành phần, luồng mua hàng, màu giá theo quy ước các website bán sách VN. Khác biệt nằm ở nhận diện, nội dung tuyển chọn và giọng văn.
- Kiến trúc: **cửa hàng sách độc lập (single-store)**, không phải marketplace.
- **Còn mở:** persona chính trong khoảng 18–30 (hiện đang viết chung cho cả dải tuổi).

## 3. Nhận diện thương hiệu (đã chốt)

- **Tên: NA Books.** "NA" là viết tắt của Ngọc Anh.
- **Màu:** chàm `#26306B` chủ đạo; vàng nghệ `#D9A33A` chỉ dùng cho badge; giá khuyến mãi đỏ `#C2362B`; nền trắng ngà `#FBFAF7`; chữ `#1A1C2E`. Thêm màu ngữ nghĩa `danger` và `success`.
- **Font:** Be Vietnam Pro cho giao diện, Lora cho tên sách và tiêu đề lớn. Serif chỉ dùng từ 18px trở lên. Bắt buộc subset `vietnamese`.
- **Giọng văn:** NA Books xưng "chúng mình", gọi người dùng là "bạn". Không teen-code, không lạm dụng dấu "!".
- **Ảnh bìa: không dùng ảnh có bản quyền.** Toàn bộ bìa do component `BookCover` sinh tự động từ `title`, `author`, `slug` — 4 biến thể bố cục, 12 màu trầm, có gáy sách và vân giấy. Cột `cover_image_url` giữ trong schema cho khả năng mở rộng nhưng không dùng. Đây là quyết định chính thức, không phải giải pháp tạm.
- **Còn mở:** logo chính thức (hiện dùng wordmark chữ). Ý tưởng đã có: monogram NA dạng mặt ngọc.

## 4. Phạm vi tính năng

### Core (7 tính năng, theo SRS)

Catalog + tìm kiếm/lọc · Trang chi tiết sách · Giỏ hàng · Checkout (mock payment) · Tài khoản người dùng · Lịch sử đơn hàng · Admin dashboard cơ bản.

### Bổ sung so với bản chốt ban đầu

- **Tủ sách tuyển chọn** (2 bảng `collections`, `collection_books`): read-only, seed sẵn, chưa có giao diện quản lý. Hiện có 3 tủ, 1 tủ nổi bật hiển thị ở hero.
- **Ghi log sự kiện** vào bảng `events`: `page_view`, `search`, `add_to_cart`, `checkout_started`, `order_placed`. Quyết định ghi log **ngay từ đầu** thay vì đợi đến khi làm dashboard, để dashboard có dữ liệu thật.

### Điểm nhấn (chưa làm)

1. **Chatbot trợ lý** dùng Gemini API: gợi ý sách theo mô tả tự nhiên dựa trên metadata catalog + trả lời FAQ tĩnh. Không thao tác giỏ hàng/đơn hàng, không truy cập dữ liệu cá nhân. API key qua backend proxy, cần rate limit. **System prompt: chưa soạn.**
2. **Dashboard thống kê nâng cao cho admin:** doanh thu theo thời gian, sách bán chạy theo danh mục, phễu chuyển đổi (dùng bảng `events`).

## 5. Kiến trúc kỹ thuật (đã chốt)

| Lớp | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind CSS v4 (không có config file) |
| Backend | Supabase — Postgres + Auth + Storage + Edge Functions |
| Automation | Make.com (chưa làm) — email xác nhận đơn, báo admin đơn mới |
| Deploy | Vercel, nhánh `main` là production |

- **Database: 9 bảng**, tất cả bật RLS: `profiles`, `categories`, `books`, `cart_items`, `orders`, `order_items`, `events`, `collections`, `collection_books`.
- **Quy tắc bắt buộc:** mọi thay đổi schema đi qua migration trong `supabase/migrations/`, apply bằng Supabase MCP, không sửa trực tiếp qua Table Editor.
- Tìm kiếm không phân biệt dấu qua extension `unaccent`; toàn bộ lọc/sắp xếp/phân trang gói trong hàm RPC `search_books`.
- **Danh mục 2 tầng:** 5 danh mục cha (Văn học, Kinh tế, Tâm lý – Kỹ năng, Khoa học – Xã hội, Manga – Light novel), 17 danh mục con. Không có danh mục Thiếu nhi (ngoài nhóm tuổi mục tiêu).
- Catalog dùng route tiếng Việt: `/sach`, `/sach/[slug]`, `/tu-sach`, `/tu-sach/[slug]`.
- Cloud/DevOps nâng cao (Docker, CI/CD): gác lại, chỉ làm nếu còn thời gian sau MVP.

## 6. Dữ liệu mẫu

- 40 cuốn sách thật, chọn bằng cách đối chiếu bảng bán chạy của Fahasa, Nhã Nam, Alpha Books, IPM.
- **Nguyên tắc trung thực:** tên sách và tác giả là thật; ISBN, số trang, NXB, người dịch để trống vì không xác minh được; mô tả tự viết, không chép của nhà xuất bản. Footer ghi rõ "Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio."
- 16/40 cuốn có giảm giá, 4 cuốn hết hàng để demo đủ trạng thái UI.

## 7. Tiến độ (24/09/2026)

| Hạng mục | Trạng thái |
|---|---|
| Brand identity + trang chủ đầu tiên | Xong, đã merge |
| Bước 1: Catalog `/sach` + trang chi tiết + ghi log sự kiện | Xong, đã merge |
| Bước 1.5: Nâng cấp giao diện (đợt A, A2, B, C) | Xong, đang ở PR #4 chờ merge |
| Đợt D: tăng chiều rộng và mật độ màu | Đang làm |
| Bước 2: Tài khoản | Chưa bắt đầu |
| Giỏ hàng · Checkout · Lịch sử đơn · Admin · Make.com · Chatbot · Dashboard | Chưa bắt đầu |
| README cho nhà tuyển dụng · Logo | Chưa bắt đầu |

**Quy trình làm việc đã định hình:** mockup (Claude Design) → spec trong `docs/specs/` → Claude Code làm theo từng đợt → báo cáo kèm số đo → kiểm tra trên bản preview Vercel → PR → merge. Mỗi bước một nhánh riêng.

## 8. Bài học đã rút ra (giữ lại để không lặp)

- Spec phải nói cả **mật độ và bố cục**, không chỉ giá trị token. Đợt A đúng token nhưng giao diện vẫn rỗng vì thiếu phần này.
- Không animate `height` trên phần tử `position: sticky` — gây reflow toàn trang, chữ rung khi cuộn.
- Ngưỡng bật/tắt trạng thái theo scroll phải lệch nhau hai chiều, nếu không sẽ nhấp nháy quanh ngưỡng.
- Không tạo vùng cuộn riêng (`overflow-y: auto`) cho cột lọc; thà bỏ `sticky` còn hơn.
- Khi Claude Code bác lại chẩn đoán và đưa ra bằng chứng đo được, nó thường đúng.

## 9. Việc cần bàn tiếp trong project

- Persona chính trong 18–30.
- Logo chính thức.
- System prompt cho chatbot.
- Nội dung README cho nhà tuyển dụng.
- Mockup cho: tài khoản, giỏ hàng, checkout, admin.
- Viết lại mô tả 3 tủ sách bằng giọng của chủ dự án (nội dung hiện tại do AI viết).

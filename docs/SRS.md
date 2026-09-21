# Đặc tả Yêu cầu Phần mềm (SRS) – NA Books – 7 Tính năng Core

2026-09-21 · Soạn bởi @Someone

## 1. Giới thiệu

Tài liệu đặc tả 7 tính năng Core của website bán sách (dự án showcase/portfolio cá nhân, không kinh doanh thật), làm cơ sở triển khai trực tiếp với Claude Code và minh chứng năng lực đặc tả yêu cầu (BA) cho nhà tuyển dụng.

**Phạm vi.** 7 tính năng: Catalog & tìm kiếm/lọc, Trang chi tiết sách, Giỏ hàng, Checkout, Tài khoản người dùng, Lịch sử đơn hàng, Admin Dashboard cơ bản. Hai tính năng sau nằm **ngoài phạm vi** tài liệu này, đặc tả riêng ở buổi khác: Chatbot trợ lý AI (Gemini) và Dashboard thống kê nâng cao.

**Đối tượng đọc.**

- Nhà tuyển dụng/người đánh giá hồ sơ ứng tuyển vị trí BA/PM/Product — đọc để đánh giá năng lực phân tích và đặc tả yêu cầu.
- Claude Code — đọc phần Functional Requirements (mục 5) để triển khai kỹ thuật; các yêu cầu ở đó viết đủ cụ thể (tên cột, business logic, RLS policy) để dùng trực tiếp làm prompt.

**Tài liệu tham chiếu.** Báo cáo nghiên cứu & so sánh 6 website nhà sách Việt Nam (Fahasa, Nhà sách Phương Nam, Nhã Nam, Thái Hà Books, Alpha Books, IPM/InBook) — cơ sở tham khảo pattern UX, tổ chức danh mục và checkout khi soạn các yêu cầu bên dưới.

## 2. Tổng quan hệ thống

Website bán sách độc lập (single-store), không phải marketplace đa người bán — gần với mô hình nhà xuất bản bán trực tiếp (Nhã Nam, Thái Hà, Alpha Books, IPM) hơn là sàn bán lẻ đa ngành hàng (Fahasa, Phương Nam).

### Tech stack

| Lớp | Công nghệ |
| --- | --- |
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Supabase — Postgres + Auth + Storage + Edge Functions |
| Automation | Make.com — email xác nhận đơn hàng, báo admin đơn mới |
| Deploy | Vercel |

### Actors

| Actor | Mô tả | Xác thực |
| --- | --- | --- |
| Khách vãng lai (Guest) | Chưa đăng nhập | Không |
| Khách hàng (Customer) | `profiles.role = 'customer'` | Có |
| Quản trị viên (Admin) | `profiles.role = 'admin'` | Có |

### Database schema

7 bảng Postgres, đã bật Row Level Security (RLS). So với bản chốt trước, buổi này bổ sung 2 cột: `profiles.email` (đồng bộ từ `auth.users` để Admin liên hệ khách và Make.com lấy địa chỉ gửi mail) và `orders.payment_method` (lưu lựa chọn COD/Chuyển khoản — mục 5.4).

```mermaid
erDiagram
    PROFILES ||--o{ ORDERS : places
    PROFILES ||--o{ CART_ITEMS : has
    PROFILES ||--o{ EVENTS : generates
    CATEGORIES ||--o{ CATEGORIES : "parent of"
    CATEGORIES ||--o{ BOOKS : contains
    BOOKS ||--o{ CART_ITEMS : "in cart as"
    BOOKS ||--o{ ORDER_ITEMS : "ordered as"
    ORDERS ||--o{ ORDER_ITEMS : contains

    PROFILES {
        uuid id PK
        string full_name
        string email
        string role
        string phone
        string address
    }
    CATEGORIES {
        uuid id PK
        string name
        string slug
        uuid parent_id FK
    }
    BOOKS {
        uuid id PK
        string title
        string slug
        string author
        decimal price
        decimal discount_price
        int stock_quantity
        uuid category_id FK
    }
    CART_ITEMS {
        uuid id PK
        uuid user_id FK
        uuid book_id FK
        int quantity
    }
    ORDERS {
        uuid id PK
        uuid user_id FK
        string status
        string payment_method
        decimal total_amount
        string shipping_address
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid book_id FK
        int quantity
        decimal price_at_purchase
    }
    EVENTS {
        uuid id PK
        uuid user_id FK
        string session_id
        string event_type
    }
```

Bảng `events` chỉ phục vụ Dashboard thống kê nâng cao (ngoài phạm vi tài liệu này) — không có yêu cầu ghi log nào cho bảng này trong mục 5.

## 3. UML Use Case Diagram

Hai sơ đồ: (A) Khách vãng lai & Khách hàng — các tính năng mua sắm; (B) Quản trị viên & automation Make.com — vận hành và tự động hóa.

### A. Khách vãng lai & Khách hàng

```mermaid
flowchart LR
    G[Khách vãng lai]
    C[Khách hàng]

    UC1([Duyệt, tìm kiếm và lọc sách])
    UC2([Xem chi tiết sách])
    UC3([Quản lý giỏ hàng])
    UC4([Đăng ký tài khoản])
    UC5([Đăng nhập / Đăng xuất])
    UC6([Quên mật khẩu])
    UC7([Quản lý thông tin cá nhân])
    UC8([Thanh toán / Đặt hàng])
    UC9([Xem lịch sử đơn hàng])
    UC10([Hủy đơn hàng])

    G --> UC1
    G --> UC2
    G --> UC3
    G --> UC4
    G --> UC5
    G --> UC6
    C --> UC1
    C --> UC2
    C --> UC3
    C --> UC5
    C --> UC7
    C --> UC8
    C --> UC9
    C --> UC10
```

Ghi chú: UC3 (Quản lý giỏ hàng) khả dụng cho cả hai actor nhưng lưu dữ liệu khác nơi — giỏ của Khách vãng lai ở `localStorage`, giỏ của Khách hàng ở bảng `cart_items` (chi tiết mục 5.3). UC8 chỉ Khách hàng thực hiện được — Khách vãng lai bấm "Thanh toán" bị chuyển hướng sang UC4/UC5 trước.

### B. Quản trị viên & Automation

```mermaid
flowchart LR
    ADM[Quản trị viên]
    SYS[Hệ thống Make.com]
    TRIG([Đặt hàng thành công])

    UC11([Quản lý sách - CRUD])
    UC12([Quản lý đơn hàng])
    UC13([Gửi email xác nhận cho khách])
    UC14([Báo admin đơn hàng mới])

    ADM --> UC11
    ADM --> UC12
    TRIG -.include.-> UC13
    TRIG -.include.-> UC14
    SYS --> UC13
    SYS --> UC14
```

Ghi chú: TRIG (Đặt hàng thành công — chính là UC8 ở sơ đồ A) «include» hai use case tự động UC13/UC14, không cần thao tác thủ công của Admin.

## 4. User Stories

26 user story, đánh số US-x.x theo 7 tính năng Core, theo mẫu "Là \[role\], tôi muốn \[action\] để \[benefit\]".

### 4.1 Catalog & Tìm kiếm/Lọc

- **US-1.1** — Là khách vãng lai, tôi muốn xem danh sách sách theo từng trang để duyệt catalog mà không bị quá tải thông tin.
- **US-1.2** — Là khách vãng lai, tôi muốn tìm sách theo tên để nhanh chóng tìm được cuốn sách đang cần.
- **US-1.3** — Là khách vãng lai, tôi muốn lọc sách theo danh mục để chỉ xem những sách thuộc thể loại quan tâm.
- **US-1.4** — Là khách vãng lai, tôi muốn lọc sách theo khoảng giá để tìm sách phù hợp ngân sách.
- **US-1.5** — Là khách vãng lai, tôi muốn sắp xếp sách (mới nhất/giá/bán chạy) để dễ so sánh và ra quyết định mua.

### 4.2 Trang chi tiết sách

- **US-2.1** — Là khách vãng lai, tôi muốn xem đầy đủ thông tin một cuốn sách (tác giả, NXB, mô tả, mục lục) để quyết định có mua hay không.
- **US-2.2** — Là khách vãng lai, tôi muốn biết tình trạng còn hàng/hết hàng để không đặt nhầm sách đã hết.
- **US-2.3** — Là khách vãng lai, tôi muốn xem sách liên quan/cùng tác giả để khám phá thêm sách phù hợp sở thích.

### 4.3 Giỏ hàng

- **US-3.1** — Là khách vãng lai, tôi muốn thêm sách vào giỏ mà không cần đăng nhập trước để trải nghiệm mua sắm không bị gián đoạn.
- **US-3.2** — Là khách hàng, tôi muốn giỏ hàng thêm lúc chưa đăng nhập được giữ lại khi đăng nhập để không phải thêm lại từ đầu.
- **US-3.3** — Là khách hàng, tôi muốn đổi số lượng hoặc xóa sách khỏi giỏ để điều chỉnh đơn trước khi thanh toán.
- **US-3.4** — Là khách hàng, tôi muốn thấy tổng tiền giỏ hàng cập nhật ngay khi thay đổi số lượng để biết mình sẽ trả bao nhiêu.

### 4.4 Checkout

- **US-4.1** — Là khách hàng, tôi muốn nhập/chọn địa chỉ giao hàng khi đặt hàng để sách được giao đúng nơi.
- **US-4.2** — Là khách hàng, tôi muốn chọn phương thức thanh toán (COD hoặc chuyển khoản) để phù hợp cách tôi muốn trả tiền.
- **US-4.3** — Là khách hàng, tôi muốn nhận email xác nhận sau khi đặt hàng để yên tâm đơn đã được ghi nhận.
- **US-4.4** — Là quản trị viên, tôi muốn được báo ngay khi có đơn hàng mới để xử lý kịp thời.

### 4.5 Tài khoản người dùng

- **US-5.1** — Là khách vãng lai, tôi muốn đăng ký bằng email/mật khẩu để đặt hàng và theo dõi đơn.
- **US-5.2** — Là khách hàng, tôi muốn đăng nhập/đăng xuất để bảo vệ thông tin tài khoản.
- **US-5.3** — Là khách hàng, tôi muốn đặt lại mật khẩu khi quên để không mất quyền truy cập tài khoản.
- **US-5.4** — Là khách hàng, tôi muốn cập nhật thông tin cá nhân (họ tên, SĐT, địa chỉ) để thông tin giao hàng luôn chính xác.

### 4.6 Lịch sử đơn hàng

- **US-6.1** — Là khách hàng, tôi muốn xem danh sách đơn hàng đã đặt để theo dõi lịch sử mua sắm.
- **US-6.2** — Là khách hàng, tôi muốn xem chi tiết một đơn hàng để biết chính xác đơn gồm những gì.
- **US-6.3** — Là khách hàng, tôi muốn hủy đơn khi còn đang chờ xử lý để linh hoạt thay đổi quyết định mua.

### 4.7 Admin Dashboard

- **US-7.1** — Là quản trị viên, tôi muốn thêm/sửa/xóa sách để quản lý catalog sản phẩm.
- **US-7.2** — Là quản trị viên, tôi muốn xem danh sách tất cả đơn hàng để nắm tình hình kinh doanh.
- **US-7.3** — Là quản trị viên, tôi muốn cập nhật trạng thái đơn hàng để phản ánh đúng tiến trình xử lý.

## 5. Functional Requirements

46 yêu cầu chức năng, đánh số FR-x.x theo 7 tính năng Core — đủ chi tiết (tên cột, business logic, RLS) để đưa thẳng cho Claude Code triển khai.

### 5.1 Catalog & Tìm kiếm/Lọc

- **FR-1.1** — Hiển thị danh sách sách dạng lưới; mỗi thẻ gồm: ảnh bìa (`cover_image_url`), tên sách, tác giả, giá gốc (`price`), giá giảm (`discount_price` nếu có, gạch ngang giá gốc), trạng thái còn hàng/hết hàng.
- **FR-1.2** — Phân trang, mặc định 20 sách/trang.
- **FR-1.3** — Tìm kiếm theo tên sách (cột `title`), không phân biệt hoa/thường, khớp một phần chuỗi (SQL `ILIKE '%từ khóa%'`).
- **FR-1.4** — Lọc theo `category_id`. Chọn category cha (`parent_id IS NULL`) → kết quả gồm cả sách thuộc các category con trực tiếp của nó.
- **FR-1.5** — Lọc theo khoảng giá (min–max), áp dụng trên giá thực tế phải trả: `COALESCE(discount_price, price)`.
- **FR-1.6** — Sắp xếp theo: (a) Mới nhất (`created_at` giảm dần — mặc định), (b) Giá tăng dần, (c) Giá giảm dần, (d) Bán chạy nhất.
- **FR-1.7** — "Bán chạy nhất" = `SUM(order_items.quantity)` nhóm theo `book_id`, chỉ tính đơn có `status != 'cancelled'`; sách chưa có đơn xếp cuối danh sách.
- **FR-1.8** — Các bộ lọc (category, khoảng giá, từ khóa, sắp xếp) kết hợp đồng thời được.
- **FR-1.9** — `stock_quantity = 0` → hiển thị nhãn "Hết hàng" trên thẻ sách.
- **FR-1.10** — Không yêu cầu đăng nhập; áp dụng cho Khách vãng lai và Khách hàng.

### 5.2 Trang chi tiết sách

- **FR-2.1** — Truy cập qua `/books/[slug]`, hiển thị đầy đủ: `title`, `author`, `translator` (nếu có), `publisher`, `description`, `table_of_contents`, `price`, `discount_price` (nếu có), `isbn`, `page_count`, `dimensions`, `publish_date`, `cover_image_url`, tên category, trạng thái còn hàng (không hiển thị số lượng tồn kho chính xác).
- **FR-2.2** — `stock_quantity = 0` → vô hiệu hóa nút "Thêm vào giỏ hàng", hiển thị rõ nhãn "Hết hàng".
- **FR-2.3** — Hiển thị tối đa 4 sách "liên quan" cùng `category_id` (loại trừ sách đang xem), sắp xếp mới nhất trước.
- **FR-2.4** — Slug không tồn tại → trả về trang 404.
- **FR-2.5** — Không yêu cầu đăng nhập.

### 5.3 Giỏ hàng

- **FR-3.1** — Khách vãng lai thêm sách vào giỏ được lưu tại `localStorage` của trình duyệt, dạng mảng `{book_id, quantity}`.
- **FR-3.2** — Khách hàng thêm sách vào giỏ được lưu vào bảng `cart_items` (`user_id`, `book_id`, `quantity`).
- **FR-3.3** — Thêm sách đã có sẵn trong giỏ → cộng dồn `quantity`, không tạo dòng mới. Áp dụng ràng buộc `UNIQUE (user_id, book_id)` ở tầng database.
- **FR-3.4** — Ngay sau khi Khách vãng lai đăng nhập/đăng ký thành công: với mỗi item trong `localStorage`, nếu `book_id` đã tồn tại trong `cart_items` của user thì cộng dồn `quantity`, chưa có thì insert dòng mới; merge xong thì xóa dữ liệu giỏ khỏi `localStorage`.
- **FR-3.5** — Cho phép đổi số lượng (`quantity ≥ 1`) hoặc xóa từng dòng khỏi giỏ.
- **FR-3.6** — `quantity` nhập vào vượt `stock_quantity` hiện có → giới hạn tối đa bằng `stock_quantity`, hiển thị cảnh báo.
- **FR-3.7** — Tổng tiền giỏ hàng = `SUM(quantity × giá thực tế)` từng sách, cập nhật theo thời gian thực khi có thay đổi.
- **FR-3.8** — RLS: `cart_items` — user chỉ đọc/ghi/xóa dòng có `user_id = auth.uid()` của chính mình.

### 5.4 Checkout

- **FR-4.1** — Yêu cầu đăng nhập. Khách vãng lai bấm "Thanh toán" → chuyển hướng đăng nhập/đăng ký, sau đó quay lại checkout với giỏ hàng đã merge (FR-3.4).
- **FR-4.2** — Trang checkout hiển thị: danh sách sách trong giỏ, tổng tiền, form nhập địa chỉ giao hàng (`shipping_address` — điền sẵn từ `profiles.address` nếu có, cho phép sửa), chọn phương thức thanh toán (`payment_method` — "COD" hoặc "Chuyển khoản").
- **FR-4.3** — Xác nhận đặt hàng thực hiện tuần tự trong 1 transaction (khuyến nghị Supabase Edge Function/Postgres function, tránh thao tác rời rạc từ client):
  1. Kiểm tra lại `stock_quantity` từng sách trong giỏ tại thời điểm đặt — không đủ số lượng thì hủy thao tác, báo lỗi.
  2. Tạo 1 dòng `orders` (`user_id`, `status='pending'`, `payment_method`, `total_amount`, `shipping_address`).
  3. Tạo các dòng `order_items` tương ứng (`order_id`, `book_id`, `quantity`, `price_at_purchase` = giá thực tế tại thời điểm đặt).
  4. Trừ `stock_quantity` từng sách theo `quantity` đã đặt.
  5. Xóa các dòng `cart_items` tương ứng của user.
- **FR-4.4** — Sau khi tạo đơn thành công, gọi webhook Make.com (Database Webhook trên `INSERT` của bảng `orders`, hoặc trigger từ Edge Function) để: gửi email xác nhận cho khách (theo `profiles.email`), và báo admin có đơn mới.
- **FR-4.5** — `payment_method` chỉ mang tính lưu trữ lựa chọn — không xử lý thanh toán thật, không tích hợp cổng thanh toán.
- **FR-4.6** — Đặt hàng thành công → chuyển hướng trang xác nhận, hiển thị mã đơn và tóm tắt đơn.

### 5.5 Tài khoản người dùng

- **FR-5.1** — Đăng ký bằng email + mật khẩu (Supabase Auth), tối thiểu: `full_name`, `email`, `password` (≥ 6 ký tự — mặc định Supabase Auth). Không bật xác thực email (email confirmation) để demo mượt.
- **FR-5.2** — Đăng ký thành công → tự động tạo dòng `profiles` (`id` = auth user id, `role = 'customer'` mặc định — không cho tự chọn role, `email` đồng bộ từ `auth.users.email` qua Postgres trigger khi insert vào `auth.users`).
- **FR-5.3** — Đăng nhập bằng email + mật khẩu; đăng xuất xóa session hiện tại.
- **FR-5.4** — Quên mật khẩu dùng cơ chế reset password mặc định của Supabase Auth (email chứa link đặt lại).
- **FR-5.5** — Khách hàng xem/cập nhật được `full_name`, `phone`, `address` của chính mình trong `profiles`; không tự đổi `role` hoặc `email` qua giao diện.
- **FR-5.6** — RLS: `profiles` — user đọc/sửa dòng có `id = auth.uid()` của chính mình; Admin (`role='admin'`) đọc được mọi dòng (phục vụ Admin Dashboard xem thông tin khách theo đơn).

### 5.6 Lịch sử đơn hàng

- **FR-6.1** — Khách hàng xem danh sách đơn hàng của mình (`orders WHERE user_id = auth.uid()`), mới nhất trước; hiển thị: mã đơn, ngày đặt, tổng tiền, trạng thái.
- **FR-6.2** — Xem chi tiết 1 đơn: danh sách sách đã mua (`quantity`, `price_at_purchase`), tổng tiền, địa chỉ giao hàng, phương thức thanh toán, trạng thái hiện tại.
- **FR-6.3** — Khách hàng chỉ hủy được đơn (`status → 'cancelled'`) khi đơn đang `'pending'`. Từ `'processing'` trở đi, chỉ Admin đổi được status.
- **FR-6.4** — Đơn bị hủy (dù bởi khách hay Admin) → cộng trả lại `stock_quantity` tương ứng từng sách trong đơn (khuyến nghị xử lý qua Edge Function/database trigger khi `status` chuyển sang `'cancelled'`, đảm bảo nhất quán dù hủy từ phía nào).
- **FR-6.5** — RLS: `orders` — `SELECT` cho `user_id = auth.uid()`; `UPDATE` do khách tự thực hiện CHỈ áp dụng `USING (user_id = auth.uid() AND status = 'pending')` và `WITH CHECK (status = 'cancelled')` — khách không tự đặt được trạng thái nào khác ngoài hủy, và chỉ hủy được đơn đang `pending`.

### 5.7 Admin Dashboard

- **FR-7.1** — Chỉ `role='admin'` truy cập được `/admin/*`; kiểm tra role ở cả middleware (route protection) lẫn RLS (bảo vệ 2 lớp).
- **FR-7.2** — Quản lý sách: Admin xem danh sách toàn bộ sách (phân trang/tìm kiếm), thêm sách mới (đủ các trường bảng `books`), sửa thông tin, xóa sách.
- **FR-7.3** — Trước khi xóa 1 sách, kiểm tra sách có đang xuất hiện trong `order_items` nào không — nếu có, chặn xóa cứng, gợi ý đặt `stock_quantity = 0` thay thế để không phá vỡ dữ liệu lịch sử đơn hàng.
- **FR-7.4** — Quản lý đơn hàng: Admin xem danh sách toàn bộ đơn (lọc theo status, tìm theo mã đơn/tên khách), xem chi tiết 1 đơn (kèm thông tin khách từ `profiles`), cập nhật status theo luồng `pending → processing → shipped → completed` (hoặc `→ cancelled` ở bất kỳ bước nào trước `completed`).
- **FR-7.5** — RLS: `books` — `SELECT` public (mọi actor), `INSERT`/`UPDATE`/`DELETE` chỉ `role='admin'`. `orders`/`order_items` — `SELECT`/`UPDATE` toàn quyền chỉ `role='admin'` (kết hợp quyền hạn chế của khách hàng ở FR-6.5).
- **FR-7.6** — `categories` không có giao diện quản lý trong phạm vi MVP — dữ liệu được seed sẵn (migration/seed script), chỉnh sửa trực tiếp qua Supabase Dashboard nếu cần.

### 5.8 Tóm tắt RLS theo bảng

| Bảng | Khách vãng lai | Khách hàng | Admin |
| --- | --- | --- | --- |
| `profiles` | — | SELECT/UPDATE dòng của mình | SELECT toàn bộ |
| `categories` | SELECT toàn bộ | SELECT toàn bộ | SELECT toàn bộ (ghi qua Supabase Dashboard) |
| `books` | SELECT toàn bộ | SELECT toàn bộ | SELECT/INSERT/UPDATE/DELETE toàn bộ |
| `cart_items` | — (localStorage) | SELECT/INSERT/UPDATE/DELETE dòng của mình | — |
| `orders` | — | SELECT dòng của mình; UPDATE chỉ khi `pending → cancelled` | SELECT/UPDATE toàn bộ |
| `order_items` | — | SELECT qua đơn của mình | SELECT toàn bộ |

*(Bảng `events` không đưa vào tóm tắt này — dành cho Dashboard thống kê nâng cao, ngoài phạm vi tài liệu.)*

## 6. Non-functional Requirements

15 yêu cầu phi chức năng, nhóm theo 5 nhóm chuẩn SRS: hiệu năng, bảo mật, khả năng sử dụng, khả năng bảo trì/mở rộng, tương thích.

### 6.1 Hiệu năng

- **NFR-1.1** — Trang catalog và trang chi tiết sách tải dưới 2 giây trên kết nối mạng trung bình (Core Web Vitals: LCP < 2.5s).
- **NFR-1.2** — Ảnh bìa sách lưu trên Supabase Storage, tối ưu qua Next.js `Image` component (lazy loading, responsive sizing, WebP khi trình duyệt hỗ trợ).
- **NFR-1.3** — Lọc/sắp xếp/tìm kiếm ở catalog thực hiện phía server; không tải toàn bộ dữ liệu sách về client rồi lọc.

### 6.2 Bảo mật

- **NFR-2.1** — Toàn bộ 7 bảng bật Row Level Security; không bảng nào cho phép truy cập ngoài các policy đã định nghĩa (chi tiết theo bảng ở mục 5.8).
- **NFR-2.2** — API key (Gemini cho chatbot — cấu hình buổi khác), Supabase service role key, Make.com webhook secret — không expose ra phía client, chỉ dùng trong Edge Functions/server-side code.
- **NFR-2.3** — Input từ mọi form (đăng ký, checkout, thêm/sửa sách...) validate cả client (UX) lẫn server/database (ràng buộc thật, không tin dữ liệu từ client).
- **NFR-2.4** — Mật khẩu không lưu dạng plaintext (Supabase Auth mặc định hash bằng bcrypt).
- **NFR-2.5** — Middleware kiểm tra `role='admin'` cho mọi route `/admin/*` trước khi render, tránh lộ giao diện quản trị qua URL trực tiếp.

### 6.3 Khả năng sử dụng

- **NFR-3.1** — Giao diện responsive: mobile (≥375px), tablet, desktop.
- **NFR-3.2** — Thông báo lỗi (hết hàng, sai mật khẩu, hết hạn phiên...) bằng tiếng Việt, rõ ràng, không lộ mã lỗi kỹ thuật thô.
- **NFR-3.3** — Thao tác quan trọng (xóa sách, hủy đơn) yêu cầu xác nhận (confirm dialog) trước khi thực hiện.

### 6.4 Khả năng bảo trì & mở rộng

- **NFR-4.1** — Code theo cấu trúc chuẩn Next.js App Router: tách components tái sử dụng, business logic (Edge Functions/API routes), truy vấn dữ liệu (Supabase client).
- **NFR-4.2** — Bảng `events` đã có sẵn trong schema, dành riêng cho Dashboard thống kê nâng cao (ngoài phạm vi tài liệu này) — không có yêu cầu ghi log nào cho bảng này trong 7 tính năng Core ở mục 5.

### 6.5 Tương thích

- **NFR-5.1** — Hỗ trợ trình duyệt hiện đại: Chrome, Firefox, Safari, Edge (2 phiên bản gần nhất).
- **NFR-5.2** — Tương thích thiết bị di động phổ biến (iOS Safari, Android Chrome).

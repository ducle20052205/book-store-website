# NA Books — Quyết định & Đặc tả tổng

> **Vai trò của file này:** nơi lưu những gì đã **thực sự chốt**, không phải nơi đưa ra quyết định mới. Project này đóng vai trò "chỉ huy": mọi quyết định về kiến trúc, thiết kế, tính năng và spec cho Claude Code được thảo luận và chốt trong các chat của project, sau đó cập nhật vào đây. Đọc file này trước khi trả lời để không hỏi lại hoặc mâu thuẫn với quyết định cũ — nhưng đừng coi mục "còn mở" là đã có hướng đi.
>
> **Ai được sửa phần nào.** Bản gốc là bản trong Claude.ai Project; file `docs/trang-quyet-dinh-dac-ta-tong.md` trong repo là bản đồng bộ. Claude Code **được sửa mục 7** (bảng tiến độ, số đo, số commit/PR) vì nó biết chính xác hơn. **Mục 1–6, 8, 9 do Claude Code ghi theo prompt đóng đợt**, với nội dung chủ dự án đã chốt trong chat; thấy một khẳng định lệch mã thì báo cáo, không tự sửa. Mọi lần sửa file này là **commit riêng**, không gộp vào commit mã. Trong file chỉ ghi sự kiện và số đo kèm số mẫu — không có câu tự thuật tiến độ, không có đánh giá chất lượng công việc; file này sẽ nằm trong portfolio.
>
> **Hướng đồng bộ — một chiều, chốt 07/10/2026.** **Repo là bản gốc của MỌI mục.** Claude Code ghi thẳng vào `docs/trang-quyet-dinh-dac-ta-tong.md`, kể cả mục 1–6, 8, 9; quyết định chốt trong chat đi vào repo qua prompt đóng đợt, không ai sửa tay bản Project knowledge. Bản trong Claude.ai Project được **sinh lại từ repo** sau mỗi đợt, bằng cách thay mục 7 bằng stub — không bao giờ sửa tay. Luật cũ (Project knowledge là bản gốc của mục 1–6, 8, 9) đã làm hai bản trôi khỏi nhau hai lần trong hai ngày (06/10 và 07/10), vì bên sửa được bản này thì không sửa được bản kia. **`docs/SRS.md` chỉ nằm ở repo** — Project knowledge không giữ bản sao nào. Bản sao ở đó không có chủ sở hữu và đã lệch thật (v1.3 trong Project knowledge so với v1.5 trong repo, phát hiện 02/10). Cần đọc SRS thì gắn repo vào chat và đọc `docs/SRS.md`.
>
> **Cập nhật lần cuối:** 07/10/2026
> **Nguồn chân lý:** repo `github.com/ducle20052205/book-store-website`. Các file `docs/SRS.md`, `docs/specs/*`, `CLAUDE.md` trong repo là bản gốc; file này là bản tóm tắt cấp quyết định.

## 1. Bối cảnh & mục tiêu (đã chốt)

- Website bán sách xây từ đầu (thiết kế, frontend, backend, API, database) — mục đích **showcase/portfolio cá nhân**, không kinh doanh thật, không cần nguồn hàng hay logistics.
- Đối tượng xem: **nhà tuyển dụng và chương trình ứng tuyển hướng BA/PM/Product**.
- Vì vậy cần một trang/README giải thích lý do đằng sau các quyết định sản phẩm, không chỉ có code.
- Toàn bộ spec chốt trong project được đưa trực tiếp cho Claude Code triển khai.
- **Ràng buộc chi phí: mọi thứ phải nằm trong gói miễn phí.** Vercel Hobby, Supabase free tier, Brevo free SMTP (300 email/ngày), GitHub Actions.

## 2. Định vị sản phẩm (đã chốt)

- **Người đọc mục tiêu: 18–30 tuổi.**
- **Định vị: nhà sách tuyển chọn — mỗi cuốn sách có mặt đều kèm lời giải thích của biên tập.** Đây là điểm khác biệt chính so với 8 nhà sách VN đã khảo sát; IPM có tủ "Tinh tuyển" nhưng không giải thích lý do chọn.
- **Nguyên tắc thiết kế: "Quen ở cấu trúc, riêng ở chất liệu."** Bố cục, vị trí thành phần, luồng mua hàng, màu giá theo quy ước các website bán sách VN. Khác biệt nằm ở nhận diện, nội dung tuyển chọn và giọng văn.
- Kiến trúc: **cửa hàng sách độc lập (single-store)**, không phải marketplace.
- **Còn mở:** persona chính trong khoảng 18–30 (hiện đang viết chung cho cả dải tuổi).

## 3. Nhận diện thương hiệu (đã chốt)

- **Tên: NA Books.** "NA" là viết tắt của Ngọc Anh.
- **Màu:** chàm `#26306B` (`cham-700`) chủ đạo; chàm đậm `#171D40` (`cham-900`) cho footer và khối editorial; vàng nghệ `#D9A33A` chỉ dùng cho badge; giá khuyến mãi `#BD3125` (`sale`); nền trang `#EDE6D9` (`paper`), nền thẻ trắng (`surface`) để tạo lớp phân tách; chữ `#1A1C2E` (`ink-900`), chữ phụ `#5F6379` (`ink-400`); `success` `#266E48`.
- **Màu bổ sung từ đợt 2A/2B:** viền ô nhập `#9E8E70` (`line-field`) — chọn vì đạt 3,203:1 trên nền trắng, thỏa WCAG 1.4.11 Non-text Contrast; bản `#CFC7B8` cũ chỉ 1,68:1 và `#A29376` 3,01:1 là quá sát ngưỡng. Nền phụ `#F6F2E9`, nền chọn `#F4F2F8`, danger `#C2362B`.
- **Màu danh mục:** 5 danh mục cha mỗi danh mục một màu lấy từ bảng 12 màu bìa, dùng nhất quán ở thẻ "Khám phá theo danh mục" và dải màu dưới tiêu đề trang catalog.
- **Hiện diện màu:** cuộn tới bất kỳ vị trí nào trên trang chủ và trang catalog đều phải thấy ít nhất một thành phần màu chàm (vạch 3px bên trái tiêu đề section, tab đang chọn, phân trang, link).
- **Font:** Newsreader cho tiêu đề và tên sách (thay Lora từ đợt E), Be Vietnam Pro cho giao diện. Serif chỉ dùng từ 18px trở lên. Bắt buộc subset `vietnamese`. Chữ nghiêng chỉ từ 18px và tối đa 3 dòng. Line-height của chữ display tối thiểu 1.15 để không cắt dấu tiếng Việt.
- **Quy tắc nghiêng/đứng theo người nói:** chữ nghiêng là lời của biên tập (`curator_note`, mô tả tủ sách); chữ đứng là thông tin hệ thống (tên sách, danh mục, giá).
- **Chi tiết chữ ký:** ghi chú biên tập trình bày như lời ghi tay ở lề, nối tới bìa bằng nét kẻ cong mảnh (`EditorNoteConnector`, `aria-hidden`). Chỉ dùng ở 3 chỗ: trang chi tiết sách, khối editorial trang chủ, trang tủ sách. Dưới 768px bỏ nét kẻ, giữ độ xoay nhẹ.
- **Giọng văn:** NA Books xưng "chúng mình", gọi người dùng là "bạn". Không teen-code, không lạm dụng dấu "!". Không dùng nhãn tiếng Anh kiểu "Coming soon" trong giao diện.
- **Ảnh bìa: không dùng ảnh có bản quyền.** Toàn bộ bìa do component `BookCover` sinh tự động từ `title`, `author`, `slug` — 4 biến thể bố cục chọn theo hash, 12 màu trầm, có gáy sách và vân giấy. Cột `cover_image_url` giữ trong schema cho khả năng mở rộng nhưng không dùng. Đây là quyết định chính thức, không phải giải pháp tạm. Lớp hình ảnh thứ hai (ảnh giấy, kệ sách, bàn đọc) sẽ dùng nguồn giấy phép mở (Unsplash/Pexels), ghi nguồn trong README — chưa làm.
- **Chuyển động:** chỉ animate `transform` và `opacity`; CLS = 0; không `will-change`; không hiệu ứng fade-in theo section khi cuộn; một khoảnh khắc mở trang duy nhất ở trang chủ (400–600ms, không lặp trong cùng phiên); mọi chuyển động tắt được bằng `prefers-reduced-motion`. View Transitions API: đã kiểm tra React 19.2.8 chưa có export `ViewTransition`, quyết định không dùng và không cài bản canary.
- **Thông báo quan trọng không được tự biến mất** (WCAG 2.2.1 Timing Adjustable). Dải chào mừng sau đăng ký là banner trong trang có nút đóng, **không phải Toast tự tắt**. Dải chỉ hiện sau đăng ký, không hiện sau đăng nhập (kiểm 10/10).
- **Hệ layout đóng băng (chốt 02/10, đợt 3A).** Mọi mockup và mọi trang từ đợt 3 trở đi chỉ được lắp từ một bộ: container tối đa 1200px canh giữa, lề trang 40px từ 1024px và 16px dưới 768px; thang khoảng cách chỉ gồm 4 · 8 · 16 · 24 · 40; một kiểu thẻ (nền trắng, viền 1px `#E3DACA`, bo góc 4px, không đổ bóng); một kiểu nút cao 48px; một kiểu ô nhập cao 44px; một tiêu đề trang (vạch chàm 3px + Newsreader 32 + số đếm 14px canh đáy); một trạng thái trống đủ bốn phần (hình vẽ nét 76px, tiêu đề, đoạn giải thích tối đa 460px, hai nút). Trang nào cần thành phần chưa có thì thêm vào hệ trước, rồi mới dùng. Bản tham chiếu: `docs/mockups/buoc-3/he-layout-dong-bang.png`.
- **Danh sách nhiều dòng là MỘT mặt phẳng trắng** với các dòng ngăn bằng kẻ 1px `#EFE8DB`, không phải mỗi dòng một thẻ nổi. Đây là cách chặn dấu hiệu "mọi thứ đều là card" của giao diện do AI sinh.
- **Luồng tập trung (chốt 02/10).** Trên `/gio-hang` và `/thanh-toan`, khi màn hình hẹp hơn breakpoint `--breakpoint-bottom-bar` (64rem = 1024px): trang có **thanh thao tác đáy cố định** (`position: fixed`, `bottom: 0`, `<body>` có đệm đáy bằng chiều cao thanh), và footer đầy đủ được thay bằng **một dòng duy nhất** trên nền `paper` — "Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio.", chữ 12px `ink-400`, canh giữa, không cột liên kết. Từ breakpoint trở lên: cột tóm tắt bên phải xuất hiện, thanh đáy biến mất, footer đầy đủ trở lại.
  - **Hai thứ gắn vào một breakpoint duy nhất, không phải hai con số.** Breakpoint đặt một chỗ ở `app/globals.css`; mọi nơi cùng đọc từ đó. Lý do chọn 1024px chứ không phải 768px: cột tóm tắt (chứa nút "Thanh toán") chỉ hiện từ 1024px, nên dưới đó thanh đáy là đường duy nhất tới thanh toán.
  - Dòng ghi rõ dự án portfolio **không được biến mất cùng footer** — nó là nguyên tắc trung thực ở mục 6, không phải phần trang trí.
- **Còn mở:** logo chính thức (hiện dùng wordmark chữ). Ý tưởng đã có: monogram NA dạng mặt ngọc.

## 4. Phạm vi tính năng

### Core (7 tính năng, theo SRS)

Catalog + tìm kiếm/lọc · Trang chi tiết sách · Giỏ hàng · Checkout (mock payment) · Tài khoản người dùng · Lịch sử đơn hàng · Admin dashboard cơ bản.

### Bổ sung so với bản chốt ban đầu

- **Tủ sách tuyển chọn** (2 bảng `collections`, `collection_books`): read-only, seed sẵn, chưa có giao diện quản lý. Hiện có 3 tủ, 17 cuốn, 1 tủ nổi bật hiển thị ở hero.
- **Ghi log sự kiện** vào bảng `events`: `page_view`, `search`, `add_to_cart`, `checkout_started`, `order_placed`, và từ 2A thêm `sign_up`, `login` (7 loại). Quyết định ghi log **ngay từ đầu** thay vì đợi đến khi làm dashboard, để dashboard có dữ liệu thật.
- **Mô tả danh mục:** 5 danh mục cha có `categories.description`, hiển thị ở trang catalog khi lọc theo danh mục cha; danh mục con để trống.
- **Chip thông tin trên thẻ sách:** nhãn danh mục con và chip "Trong tủ sách", chỉ dùng dữ liệu có thật.
- **Trang tạm cho giai đoạn sau.** Khuôn đã dùng hai lần: trả 200, có header và footer như mọi trang, nói thẳng rằng tính năng thuộc đợt sau, kèm liên kết quay lại. `/gio-hang` tạm (2B.1) đã được thay bằng trang thật ở 3A; `/thanh-toan` tạm (3A) sẽ được thay ở 3B.
- **Bước 3 tách làm đôi:** 3A giỏ hàng, 3B checkout. Gộp lại là 15+ FR trong một đợt — đúng cách đã làm phần auth phình thành bốn lần.

### Thứ tự còn lại và định nghĩa "xong" (chốt 02/10; thứ tự đổi 06/10)

**5B CRUD sách đã xong** (chặng 1: migration `20261004090859`; chặng 2: merge `622ea35`; số đo ở mục 7.10).

**Đợt seed dữ liệu demo đã xong** (PR #23, squash `6257f0e`, 06/10/2026; số đo ở mục 7.11).

**Đợt 6 dashboard thống kê đã xong** (PR #24, squash `8e43c16`, 06/10/2026; 10/10 tiêu chí đạt; migration `20261006164939_admin_dashboard_stats` đã áp lên hosted, 20 → 21; số đo ở mục 7.12).

**Đợt 7 README cho nhà tuyển dụng đã xong** (PR #25, 07/10/2026; 6/6 tiêu chí đạt; số đo ở mục 7.13).

- **Tạm dừng toàn bộ giao diện và chức năng cho mobile (chốt 06/10/2026).** Từ thời điểm này mọi đợt chỉ xây và chỉ đo cho máy tính. Mã mobile đã có — sheet của `AccountMenu` dưới 768px, thanh thao tác đáy dưới 1024px, các lớp responsive — **giữ nguyên, không gỡ**: gỡ là việc phải làm thêm, không phải tiết kiệm. Điều thay đổi: không xây giao diện mobile mới, không đặt tiêu chí nghiệm thu ở 390px, không chụp ảnh duyệt ở 390px, và mọi phát hiện chỉ xuất hiện ở bề rộng mobile (ví dụ 9/302 vùng chạm dưới 44px ở 390px, mục 9) chuyển sang danh sách sau thay vì sửa trong đợt. Yêu cầu accessibility KHÔNG được nới theo: tương phản, `aria-label`, bàn phím, trạng thái focus vẫn đo ở mọi đợt, chỉ bỏ phần đo theo bề rộng mobile. **Mobile là một GIAI ĐOẠN SAU KHI SẢN PHẨM HOÀN THÀNH, không phải một đợt trong danh sách còn lại.** Nó không nằm trong định nghĩa "xong" (bảy bước ở mục này) và không chen vào thứ tự các đợt đang chờ (dashboard, README, 5C, 2C, 2D, đợt 1.6, accessibility, chatbot). Chỉ khi toàn bộ phần máy tính đã xong — bao gồm cả README cho nhà tuyển dụng và đợt accessibility — mới mở giai đoạn mobile.

**Thứ tự còn lại:** 5C scenario Make.com → 2C quên mật khẩu → 2D trang hồ sơ → đợt 1.6 → sửa accessibility → chatbot.

**Đợt seed dữ liệu demo: 7 FR, 10 tiêu chí nghiệm thu (5 trong đó là đối chứng).** Spec ở `docs/specs/dot-seed-du-lieu-demo.md` (v1.8, đóng băng). 25 tài khoản `@example.com`, 42 đơn trải 6 tháng đầy đủ + tháng hiện tại, 1.897 dòng `events` hình phễu, tồn kho sau khi chạy 737. Kết quả: **9/10 tiêu chí đạt**; TC-S.10 **trượt** vì điều khoản của chính nó không khả thi (xem mục 8). Dựng và đo toàn bộ trên stack cục bộ; **chưa chạy lên hosted** — đó là việc tay của chủ dự án theo `docs/runbooks/chay-seed-demo.md`.

**Lý do đổi:** thứ tự cũ xếp hai việc tùy chọn (5C Make.com, chatbot) trước ba việc nằm trong định nghĩa "xong" (seed là nền cho bước 1–6, dashboard là bước 6, README là bước 7). Seed đứng trước dashboard vì hosted chỉ có 2 đơn và 3 người dùng, dashboard sẽ vẽ biểu đồ của số 0.

**Bảy bước của định nghĩa "xong" đã đủ, chốt 07/10/2026.** Bước 1–5 xong từ đợt 4; bước 6 xong khi đợt 6 lên production và tài khoản `admin-demo@example.com` được công bố; bước 7 xong với đợt 7. Dữ liệu demo đã chạy lên hosted ngày 07/10: 25 tài khoản, 42 đơn trải 7 tháng, 1.897 sự kiện seed. Mọi việc còn lại — 5C Make.com, 2C quên mật khẩu, 2D trang hồ sơ, đợt sửa lỗi giao diện tồn đọng, accessibility, chatbot, và giai đoạn mobile — đều là TÙY CHỌN, không phải điều kiện hoàn thành.

**Định nghĩa "xong"** — bảy bước một người lạ phải làm được, viết trước để không bị dời:

1. Vào trang chủ, duyệt catalog, lọc và tìm kiếm.
2. Mở một cuốn sách, thêm vào giỏ **khi chưa đăng nhập**.
3. Bấm thanh toán, đăng ký, giỏ hàng còn nguyên.
4. Điền địa chỉ (tỉnh/phường thật), đặt hàng, nhận email xác nhận.
5. Xem lịch sử đơn, hủy đơn, kho cộng lại.
6. Đăng nhập bằng tài khoản admin demo, thấy đơn vừa đặt, đổi trạng thái, xem dashboard có số thật.
7. Đọc README hiểu được **vì sao** từng quyết định được đưa ra.

Thiếu bất kỳ bước nào là chưa xong. Thừa gì ngoài danh sách này là tùy chọn, không phải điều kiện.

### Điểm nhấn (chưa làm)

1. **Chatbot trợ lý** dùng Gemini API: gợi ý sách theo mô tả tự nhiên dựa trên metadata catalog + trả lời FAQ tĩnh. Không thao tác giỏ hàng/đơn hàng, không truy cập dữ liệu cá nhân. API key qua backend proxy, cần rate limit. **System prompt: chưa soạn.**

## 5. Kiến trúc kỹ thuật (đã chốt)

| Lớp | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19.2 + Tailwind CSS v4 (không có config file) |
| Backend | Supabase — Postgres + Auth + Storage + Edge Functions |
| Automation | Make.com — lớp vận hành back-office (sổ đơn hàng, báo đơn mới, digest kho); làm ở đợt admin, **không gửi email cho khách** |
| Deploy | Vercel, nhánh `main` là production |

- **Database: 11 bảng**, tất cả bật RLS: `profiles`, `categories`, `books`, `cart_items`, `orders`, `order_items`, `events`, `collections`, `collection_books`, `provinces`, `wards` (hai bảng hành chính, áp ở đợt 3B).
- **Khoá ngoại tới `auth.users`:** `profiles` và `cart_items` là **CASCADE**; `events` và `orders` là **NO ACTION**. Hệ quả: không xoá được một user từng có sự kiện hoặc đơn hàng nếu chưa xoá tay các dòng đó trước — xem mục 9.
- **Quy tắc bắt buộc:** mọi thay đổi schema đi qua migration trong `supabase/migrations/`, apply bằng Supabase MCP, đặt tên file theo version Supabase ghi nhận. Không sửa trực tiếp qua Table Editor.
- Tìm kiếm theo tên sách và tác giả, không phân biệt dấu qua `unaccent`; toàn bộ lọc/sắp xếp/phân trang gói trong hàm RPC `search_books` (`SECURITY DEFINER` để tính "bán chạy" vượt qua RLS của `orders`).
- **Danh mục 2 tầng:** 5 danh mục cha (Văn học, Kinh tế, Tâm lý – Kỹ năng, Khoa học – Xã hội, Manga – Light novel), 17 danh mục con. Không có danh mục Thiếu nhi (ngoài nhóm tuổi mục tiêu).
- Route tiếng Việt: `/sach`, `/sach/[slug]`, `/tu-sach`, `/tu-sach/[slug]`, `/gio-hang`, `/thanh-toan`.
- **Email cho khách do ứng dụng gửi, không qua Make.com (chốt 02/10).** Email xác nhận đơn gọi **HTTP API Brevo** từ Server Action (không dùng SMTP — trong serverless đó là kết nối dài, chậm, thường bị chặn), `await` với timeout 4s rồi mới `redirect()`; `orders.confirmation_email_sent_at` ghi lại kết quả, null thì trang xác nhận nói thật thay vì "đang gửi". Lý do: email xác nhận là bước 4 của định nghĩa "xong", nên phải chắc chắn và kiểm được bằng test trong repo — hai thứ Make.com không cho.
  - **Quy tắc phân định: khách đang chờ thì app lo, cửa hàng dùng thì Make lo.** Không email nào gửi cho khách đi qua Make.
  - Make.com giữ lại với việc thật ở đợt admin: sổ đơn hàng Google Sheet, báo đơn mới qua Discord/Telegram (không Slack — cần workspace, phơi tài khoản cá nhân), digest sách `stock_quantity <= 3`, nhắc giỏ bỏ quên. Google Sheet sẽ chứa tên/SĐT/địa chỉ của người đặt thử, nên chỉ dùng dữ liệu demo.
  - **Chưa xác minh** gói Make miễn phí có cho webhook chạy tức thì hay ép chu kỳ tối thiểu. Ngưỡng chốt trước: email chậm hơn 2 phút ở 3 lần thử thì bỏ Make khỏi đường đó.
- **Hủy đơn làm bằng hàm `cancel_order` SECURITY DEFINER, KHÔNG bằng policy UPDATE cho khách (chốt 03/10, đợt lịch sử đơn).** Lý do: RLS không giới hạn được theo cột, nên một policy "chỉ được đặt `cancelled`" vẫn cho khách sửa kèm `total_amount` trong cùng câu `UPDATE`. Một hàm gom cả đổi trạng thái và chặn cột vào một chỗ. Hàm khoá dòng bằng `SELECT … FOR UPDATE`; thiếu khoá thì hai lời gọi đồng thời cộng trả kho hai lần (đo được: hàm ngây thơ sai 12/12 ở cửa sổ 50 ms). Khách vẫn **không có policy `INSERT` hay `UPDATE` nào** trên `orders`: đơn chỉ sinh qua `place_order`, chỉ hủy qua `cancel_order`.
- **Luồng trạng thái đơn và việc cộng trả kho do MỘT trigger `BEFORE UPDATE` trên `orders` đảm nhiệm (chốt 03/10, đợt 5A).** Trigger vừa chặn chuyển trạng thái sai (chỉ 6 chuyển hợp lệ trong `pending → processing → shipped → completed`, và `→ cancelled` từ mọi trạng thái trước `completed`), vừa cộng trả kho khi sang `cancelled` — cho **mọi đường đi**: khách hủy, admin đổi, và cả sửa tay trong Supabase Dashboard. Vì vậy `cancel_order` đã **bỏ vòng cộng kho** của chính nó; để cả hai thì kho cộng hai lần. Mệnh đề `WHEN (OLD.status IS DISTINCT FROM NEW.status)` làm trigger tự idempotent — hai lệnh hủy đồng thời chỉ cộng trả một lần (đo 30/30); bỏ mệnh đề đó thì cộng thừa 12/12. Điều này khép lại việc mở của FR-6.4.
- **Dashboard thống kê đọc qua MỘT hàm `admin_dashboard_stats()` (chốt 06/10, đợt 6).** `SECURITY INVOKER`, không `SECURITY DEFINER`: RLS của `orders` và `events` đã chỉ cho admin đọc nên không cần hàm vượt rào; hàm tự chặn thêm bằng `if not public.is_admin() then raise exception 'KHONG_PHAI_ADMIN'`. Thu hồi `execute` khỏi `public` và `anon`, cấp cho `authenticated`. Trả `jsonb` năm khoá (`kpi`, `revenue_by_month`, `top_books`, `category_sales`, `funnel`); trang gọi đúng một lần. Gộp tháng bằng `at time zone 'Asia/Ho_Chi_Minh'`. Chốt chặn đã kiểm trên hosted: gọi bằng vai `postgres` (không có `auth.uid()`) ném `KHONG_PHAI_ADMIN`.
- **Biểu đồ vẽ bằng SVG viết tay, không thêm dependency.** Repo giữ đúng 5 dependency production. Lý do không dùng thư viện biểu đồ: ràng buộc gói miễn phí ở mục 1, và thư viện mặc định trông đúng kiểu "giao diện do AI sinh" mà mục 8 bảo phải chặn.
- **Header đọc `profiles.role` để biết có phải admin không.** `AccountItem` vốn chỉ dùng `getClaims()` (không round-trip), nay thêm một truy vấn khoá chính cho người đã đăng nhập, trong `<Suspense>` sẵn có — đo cục bộ 1 → 2 truy vấn `/rest/v1/`, TTFB 68,4 → 66,1 ms (10 lượt mỗi phía, nằm trong nhiễu); chi phí hosted ước tính một vòng PostgREST ≈ 12,5 ms, là ước lượng chứ không phải số đo. KHÔNG dùng Custom Access Token Hook của Supabase: đó là thiết lập trên dashboard chưa ai kiểm được bằng lệnh, đúng loại rủi ro đã làm "Confirm email" sai suốt chín ngày. Hook là đường nâng cấp nếu phép đo sau này cho thấy truy vấn đó đáng kể.
- Cloud/DevOps nâng cao (CI/CD): gác lại, chỉ làm nếu còn thời gian sau MVP.

### 5.1 Auth và rendering (chốt ở đợt 2A/2B/2B.1/2B.2/3A)

- **`middleware.ts` đổi tên thành `proxy.ts`** (Next 16), hàm export tên `proxy`, chỉ chạy Node.js runtime.
- **Hai lớp bảo vệ:** `proxy.ts` chặn sớm cho trải nghiệm; **enforcement thật nằm ở Server Component + RLS**. Đây là hệ quả rút ra từ CVE-2025-29927 — không được coi proxy là hàng rào duy nhất.
- **Bốn Supabase client** trong `lib/supabase/`: `client` (trình duyệt), `server` (Server Component/Action), `proxy` (chỉ dùng trong `proxy.ts`), `public` (không cookie, dùng được trong `"use cache"`). **Mọi client phải khởi tạo bên trong request handler, không bao giờ ở module scope.**
- **Bất đối xứng có chủ đích:** Header dùng `getClaims()` (xác minh ES256 cục bộ qua JWKS, không round-trip); `proxy.ts` giữ `getUser()` (hỏi Auth server nên phát hiện được token đã thu hồi). Đã ghi chú trong mã và CLAUDE.md để không ai "dọn dẹp" nhầm.
- **Cache Components (`cacheComponents: true`)** bật từ 2A để chữa hồi quy TTFB trang chủ 2,9ms → 647,7ms. Cấm dùng segment config `revalidate`; hàm `"use cache"` không gọi được `cookies()`; chỗ đọc cookie phải nằm trong `<Suspense>`. `/`, `/sach`, `/tu-sach`, `/tu-sach/[slug]` đều render kiểu Partial Prerendering.
- **Next đặt `pathWasRevalidated` ngay khi cookie bị đổi** (`request-cookies.js:130`). Hệ quả: bỏ `revalidatePath` khỏi một Server Action **không** làm response của action hết render lại trang — nó chỉ tránh việc vô hiệu hoá cache.
- **Next xoá `FLIGHT_HEADERS` khỏi `request` TRƯỚC khi gọi `proxy`** (`adapter.js:156–165`). Vì vậy **không đọc được** `next-router-prefetch` trong thân hàm proxy — nó luôn `null`. Cách đúng để tách prefetch là `config.matcher` với `missing: [{ type: "header", key: "next-router-prefetch" }]`, vì matcher khớp trước lúc header bị xoá. `/tai-khoan` và `/admin` có entry matcher riêng không điều kiện, nên prefetch tới đó vẫn chạy đủ logic chuyển hướng.
- **Sàn 2 request RSC sau đăng nhập/đăng ký — đã hạ ở đợt 3A.** Cơ chế cũ: khi một Server Action đã revalidate (do đổi cookie) bị `router.push` huỷ, Next tự phát thêm một `ACTION_REFRESH` (`app-router-instance.js:76–92`). Từ 3A, `signIn` và `signUp` dùng `redirect()` trong action; đếm theo định nghĩa của 2B.1 (GET có `rsc`, không prefetch) là **2 → 0**, tính cả POST action là **3 → 1**.
- **`lib/nextRedirect.ts` không phải mã thừa.** `redirect()` trong Server Action làm lời gọi action ở client bị từ chối, nên form cần phân biệt redirect với lỗi thật. Không xoá file này, không bắt form xử lý lỗi theo cách cũ.
- **Giỏ của khách chưa đăng nhập lưu ở cookie `na_cart`** (httpOnly, SameSite=Lax, Path=/, 30 ngày, tối đa 20 dòng, ~1,0 KB dạng JSON và ~1,5 KB sau khi mã hoá URL). Mọi thay đổi đi qua Server Action; client không đọc và không ghi cookie này. **Lý do chọn cookie thay `localStorage`:** badge giỏ hàng phải đúng ngay trong HTML đầu, nếu không sẽ tái tạo đúng lớp lỗi trạng thái trung gian sai đã chữa ở 2B.2.
- **Cookie không có read-modify-write nguyên tử.** Hai request đổi giỏ gửi thật sự đồng thời đều đọc cùng một giá trị cũ, và `Set-Cookie` tới sau ghi đè cái tới trước, nên một dòng có thể mất. Giảm nhẹ bằng vô hiệu hoá nút khi action đang chạy, nên luồng của người dùng là tuần tự; không chữa triệt để. Nếu về sau thấy mất dòng trong thực tế thì chuyển sang bảng `guest_carts` với một id trong cookie, và khi đó phải có spec riêng.
- **`session_id` ở cookie `na_sid`** (UUID v4, KHÔNG httpOnly, SameSite=Lax, 1 năm). **`proxy.ts` không đặt cookie này** — nó được tạo lúc cần, ở client trong `track()` hoặc trong Server Action ghi sự kiện, cả hai đều không nằm trên response được cache. Lý do: response GET mang `Set-Cookie` có thể không được CDN lưu, mà khách xem portfolio gần như toàn bộ là khách lần đầu.
- **`mergeGuestCart()` và `track('sign_up'/'login')` chạy phía server** trong `signIn` và `signUp`, trước `redirect()`. Không chuyển ngược lên client. Merge cộng dồn số lượng theo `book_id` và chặn theo `stock_quantity`, rồi xoá cookie `na_cart` trong cùng response.
- **Email nhất quán hai chiều:** trigger `protect_profile_role()` khoá `role` với người không phải admin và khoá `email` với **mọi người**, trừ khi cờ phiên `app.sync_auth_email = 'on'`; trigger `sync_profile_email()` (AFTER UPDATE OF email ON auth.users) bật cờ, cập nhật `profiles.email`, rồi tắt cờ trong cùng transaction.
- **Mật khẩu:** tối thiểu 8 ký tự, **không ràng buộc thành phần** (NIST SP 800-63B rev 4). Không có ô "nhập lại mật khẩu" — thay bằng nút Ẩn/Hiện.
- **Có ô "Nhập lại email"** vì đã tắt xác nhận email: gõ sai mật khẩu thì thấy được, gõ sai email thì không, và sẽ không lấy lại được mật khẩu. *Đang xem xét thay bằng gợi ý typo domain — xem mục 9.*
- **Xác nhận email: TẮT.** Phát hiện 30/09 là thiết lập này vốn đang **BẬT** trên hosted, trái FR-5.1, và chưa ai từng kiểm. Đã tắt. Cũng đã nâng Minimum password length 6 → 8.
- **SMTP: Brevo free** (300 email/ngày). Hai hạn chế đã chấp nhận và ghi trong runbook: địa chỉ gửi bị viết lại thành `@…brevosend.com` (domain mail miễn phí không ký DKIM được), và không tắt được click tracking cho email giao dịch.
- **Địa chỉ Việt Nam 2 cấp** (từ 01/07/2025: 34 tỉnh, không còn quận/huyện): số nhà/đường → phường/xã → tỉnh/thành. `profiles` sẽ có `province_code`, `ward_code`, `address_line` với khoá ngoại ghép `(ward_code, province_code)` → `wards(code, province_code)` dùng **MATCH FULL** (MATCH SIMPLE sẽ bỏ qua kiểm tra khi một cột NULL). Làm ở đợt 3B, trong form checkout, không tách thành đợt riêng — nó là dependency của ô địa chỉ giao hàng.

### 5.2 Vùng hạ tầng (chốt 30/09, đo xác nhận 01/10/2026)

- **Supabase: `ap-northeast-1` (Tokyo).**
- **Vercel Function Region: `hnd1` (Tokyo)** — đổi từ `iad1` (Washington D.C.) ngày 30/09. Edge vẫn là `hkg1`. Xác nhận bằng `x-vercel-id` = `hkg1::hnd1`.
- **Kết quả đo trước và sau khi đổi vùng:**

| Phép đo | `iad1` | `hnd1` |
|---|---|---|
| PostgREST từ Vercel, trung vị | 280 ms | **12,5 ms** |
| p90 | 757 ms | **23,7 ms** |
| Tối đa | 1629 ms | 254 ms |
| Request trên 500 ms | 67 / 154 | **0 / 384** |
| Server Action `signOut`, tổng | 3,6–4,3 s | **0,49–0,64 s** |
| `GET /` ngay sau action | 4,2 s | **0,71–0,98 s** |

- **Một thay đổi trong dashboard, không một dòng mã, lấy lại hệ số ~22 lần ở tầng truy vấn.** Bài học về thứ tự ưu tiên: kiểm hạ tầng trước khi tối ưu mã.
- **Supabase cục bộ (dựng lại 06/10/2026):** CLI 2.118.0, bản tải thẳng (không qua npm), đặt ở `D:\tools\supabase-cli\supabase.exe` và **không nằm trên PATH** — mọi lệnh gọi bằng đường dẫn đầy đủ. Cấu hình ở `supabase/config.toml`. Cổng host: Kong 54321, Postgres 54322, Mailpit 54324, app cục bộ 3100 (dev trỏ hosted vẫn 3000). Container Postgres tên `supabase_db_book-store-website`; trong container Postgres nghe 5432, còn 54322 là cổng host — `docker exec … psql` dùng 5432. Biến môi trường ở `.env.supabase-local` (git-ignore). Khoá ký JWT cục bộ đặt **ES256** để khớp hosted.
- **`supabase start` trơn dựng 12 container và kéo ~7,97 GB image**, không phải 5 container như runbook mô tả — cờ `-x` của runbook là thứ cắt xuống 5. Lần dựng lại 06/10 chạy trơn, nên con số thật hiện tại là 12.
- **Dữ liệu Docker nằm ở ổ E**, không phải ổ C: Docker Desktop → Settings → Resources → Advanced → Disk image location trỏ `E:\DockerData\DockerDesktopWSL`. File `.vhdx` **không tự co lại** khi xoá image; đo 06/10 là 10,2 GB.
- **Mốc kiểm sau mỗi lần dựng lại stack:** `books` = 40, tồn kho 0 = 4 cuốn, `sum(stock_quantity)` = 835, migration = 19 file `.sql`. Khác bất kỳ con số nào thì dừng, đừng tự chữa.
- **Vai `postgres` của stack cục bộ xoá được `auth.users`** (kiểm 06/10 bằng `begin; delete … where id = '00000000-…'; rollback;` — 0 dòng, không bị từ chối vì quyền).
- **Lý do phải có stack cục bộ:** Claude Code không tạo/đăng nhập tài khoản trên hosted Auth (ranh giới an toàn của chính nó). Mọi kiểm thử cần phiên thật đều chạy trên `127.0.0.1`.
- **Cục bộ chạy HTTP/1.1 (giới hạn 6 kết nối mỗi origin), hosted chạy HTTP/2** (xác nhận: Edge nhận `h2` ở 36/36 response của preview; `curl` trên máy đó không hỗ trợ h2 nên báo nhầm HTTP/1.1). Khác biệt này tạo ra một hiện tượng chỉ có ở local — xem mục 7.1.
- **Giữ Supabase không bị tạm dừng:** free tier tạm dừng project sau 7 ngày ít hoạt động; đã có workflow GitHub Actions ping hằng ngày.

## 6. Dữ liệu mẫu

- 40 cuốn sách thật, chọn bằng cách đối chiếu bảng bán chạy của Fahasa, Nhã Nam, Alpha Books, IPM.
- **Nguyên tắc trung thực:** tên sách và tác giả là thật; ISBN, số trang, NXB, người dịch để trống vì không xác minh được; mô tả tự viết, không chép của nhà xuất bản. Footer ghi rõ "Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio."
- 16/40 cuốn có giảm giá, 4 cuốn hết hàng để demo đủ trạng thái UI.
- **Tồn kho của 40 cuốn do một vector cố định trong `docs/specs/dot-seed-du-lieu-demo.md` (FR-S.2) làm chủ, không phải do giá trị đang nằm trong database.** Vector lấy nguyên từ `supabase/seed.sql`: tổng 835, đúng 4 cuốn ở mức 0 (`bach-da-hanh`, `ban-co-the-dam-phan-bat-cu-dieu-gi`, `mindset-tam-ly-hoc-thanh-cong`, `tham-tu-lung-danh-conan-tap-1`), cuốn thấp nhất còn hàng là 6. Script seed đặt tồn kho bằng vector lúc chạy và đặt lại đúng vector lúc gỡ. Hệ quả đã chấp nhận: lần chạy đầu tiên trên hosted **ghi đè** tồn kho hiện có (đã bị 2 đơn thật trừ đi) và không có đường quay lại con số đó.
- **Repo là PUBLIC.** Không bao giờ commit email cá nhân, API key hay mật khẩu — kể cả trong mockup, ảnh chụp, chú thích và tài liệu. Dữ liệu mẫu dùng `ban.doc@example.com` (domain dành riêng theo RFC 2606).
- **Bí mật chỉ nằm ở biến môi trường.** API key, webhook URL, token đặt ở Vercel environment variables và `.env.local`; **không dán vào chat, không đưa vào prompt, không vào repo, không vào migration.** Mục này trước đây chỉ nói về repo, nhưng đường rò thực tế là chat → prompt → file.
- **Tài khoản thử trên hosted phải xoá sau mỗi đợt kiểm** (tiêu chí dọn dẹp). Quy trình: SELECT trước và in ra, xoá `events` của tài khoản đó trước (khoá ngoại NO ACTION), rồi xoá `auth.users` bằng id tường minh trong một transaction có chốt số dòng.
- **Ảnh mockup phải là bản xuất từ canvas ở 2×, không phải ảnh chụp màn hình** — ảnh chụp mang theo giao diện công cụ, không đạt chuẩn cho repo public. Lưu ở `docs/mockups/buoc-N/`, kèm README ghi quyết định thiết kế và phạm vi.

## 7. Tiến độ (07/10/2026)

| Hạng mục | Trạng thái |
|---|---|
| Brand identity + trang chủ đầu tiên | Xong, đã merge |
| Bước 1: Catalog `/sach` + trang chi tiết + ghi log sự kiện | Xong, đã merge |
| Bước 1.5: Nâng cấp giao diện (đợt A, A2, B, C, D, E0–E3, F) | Xong, đã merge |
| Bước 2A: Hạ tầng auth | Xong, đã merge (PR #7) |
| Bước 2B: Đăng nhập / đăng ký | Xong, đã merge (PR #9, `18016f8`) |
| Bước 2B.1: Hiệu năng trên hosted | Xong, đã merge (PR #10, `d49ff1a`) |
| Bước 2B.2: Nháy trạng thái header | Xong, đã merge (PR #11, `8f90eaf`) |
| Bước 2C: Quên/đặt lại mật khẩu | Chưa bắt đầu |
| Bước 2D: Trang hồ sơ, tỉnh/phường, đổi mật khẩu | Chưa bắt đầu |
| Đợt 1.6: Sửa lỗi giao diện tồn đọng | Chưa bắt đầu |
| Đợt 3A: Giỏ hàng | Xong, đã merge (PR #12, `8f05b91`) |
| Đợt 3B chặng 1: tầng dữ liệu (địa chỉ hai cấp, schema đơn hàng, `place_order`) | Xong, đã merge (PR #13, `54e6a54`); 8 migration đã áp lên hosted ngày 02/10/2026 |
| Đợt 3B chặng 2: trang thanh toán, đặt hàng, email xác nhận, trang xác nhận đơn | Xong, đã merge (PR #14, `00d6cde`); đơn thật đầu tiên `NA-2026-0001` ngày 02/10/2026 |
| Đợt 4 chặng 1: hàm hủy đơn `cancel_order` | Xong, đã merge (PR #15, `d299d2e`); migration `20261003043221` đã áp lên hosted ngày 03/10/2026 |
| Đợt 4 chặng 2: danh sách đơn, chi tiết đơn, hủy đơn trong trang | Xong, đã merge (PR #16, `09c41ad`); 1 lần hủy thật trên hosted ngày 03/10/2026 |
| Đợt 5A chặng 1: trigger trạng thái đơn và cộng trả kho trong database | Xong, đã merge (PR #17, `35a7f32`); migration `20261003063859` đã áp lên hosted ngày 03/10/2026 |
| Đợt 5A chặng 2: danh sách đơn, chi tiết đơn, đổi trạng thái (khu quản trị) | Xong, đã merge (PR #18, `3fc5c52`); 1 lần đổi trạng thái thật trên production ngày 03/10/2026 |
| Đợt N+1: chữa chuỗi truy vấn tuần tự ở trang chủ | Xong, đã merge (PR #19, `424e96f`); không áp gì lên hosted |
| Rà soát accessibility (một lần đo, không phải đợt sửa) | Xong: 20 phát hiện, 9 đóng, 11 mở (3 Trung bình, 8 Thấp, 0 Cao); `docs/specs/dot-accessibility-ra-soat.md` bản 1.3 (`7cfe9ff`); SRS lên 1.9 (`2580589`) |
| Đợt 5B chặng 1: ràng buộc dữ liệu cho `books` (ba CHECK, CHECK slug, hai `NOT NULL`) | Xong, đã merge (PR #21, `4b08d44`); migration `20261004090859` đã áp lên hosted ngày 04/10/2026 |
| Đợt 5B chặng 2: quản lý sách (`/admin/sach*`, form thêm/sửa, xoá có chặn) và làm mới cache bằng `updateTag` | PR #22 (commit mã `b491dee`); merge `622ea35`; 108 phép kiểm cục bộ (không tính TC-15), 15/15 lượt trên Vercel preview và 6/6 lượt trên production (nút "Đặt tồn kho về 0" chỉ kiểm ở cục bộ và preview), xem 7.10 |
| Đợt 6: dashboard thống kê (`/admin`, RPC `admin_dashboard_stats()`, mục "Khu quản trị" trong menu) | PR #24; 10 tiêu chí đo trên cục bộ, hai phép đo yếu hơn tiêu chí gốc (TC-D.3, CLS), xem 7.12 |
| Đợt 7: README cho nhà tuyển dụng | Xong, đã merge (PR #25, `eaddf67`); 6/6 tiêu chí đạt (TC-R.6 theo spec v1.1), xem 7.13 |
| 5C scenario Make.com · Chatbot | Chưa bắt đầu (admin đơn hàng xong ở 5A, admin sách ở 5B) |
| README cho nhà tuyển dụng · Logo | Chưa bắt đầu |

**Quy trình làm việc đã định hình:** mockup (Claude Design) → spec trong `docs/specs/` kèm tiêu chí nghiệm thu đo được → Claude Code làm theo từng đợt, mỗi hạng mục một commit và một lần đo → báo cáo kèm số đo → kiểm tay trên preview Vercel (những gì Claude Code không làm được) → PR → merge. Mỗi đợt một nhánh riêng.

**Bước bắt buộc trước khi mở PR mỗi đợt:** chạy `git status --short`, liệt kê mọi file modified nằm ngoài phạm vi đợt, và đồng bộ file quyết định này nếu nó đã lệch. Thêm vào quy trình ngày 01/10 sau khi phát hiện bản repo của chính file này lệch bản gốc 7 ngày mà không ai thấy.

### 7.1 Bước 2B — kết luận (01/10/2026)

**Toàn bộ chức năng chạy đúng trên hosted.** Kiểm thủ công trên preview PR #9: đăng ký, đăng nhập, đăng xuất, báo lỗi sai mật khẩu (ô email giữ giá trị, ô mật khẩu trắng), tham số `?next=`, dropdown hiện đúng họ tên và email, dải chào mừng có nút đóng và không tự biến mất.

**Ba chỗ chẩn đoán sai đã được số đo bác bỏ** — giữ lại vì chúng là bài học về cách đọc số đo:

1. *"Thân response của Server Action treo vô hạn."* Sai. Action trả về bình thường; `track()` ghi được sự kiện 0,9–1,2 s sau khi dòng `auth.users` được tạo. Cái chậm là bản dựng lại trang bên trong response, không phải treo.
2. *"Bão prefetch 132 / 223 request mỗi lượt tải."* Sai. Thực tế **41–49 request**. Con số 132/223 đọc từ DevTools có bật **"Preserve log"**, nên nó **cộng dồn qua nhiều lượt điều hướng**. Chỉ số "Finish: 3,3 phút" đi kèm lẽ ra đã phải làm người đọc nghi ngờ. Tương tự, "3 lỗi đỏ Console" thực tế là **1 lỗi mỗi lượt tải**.
3. *"`revalidatePath` xoá cache dùng chung của toàn site."* Đúng một nửa. `revalidatePath("/")` đẩy `GET /` từ `HIT` sang `REVALIDATED` cho **client khác** (5/5 vòng), nhưng **chỉ trang `/`** — bốn trang đối chứng vẫn `HIT`.

**Hiện tượng 24,5 giây chỉ có ở local.** Trên stack cục bộ, tải `/` khi đã đăng nhập cho 6 request prefetch `/_tree` kéo dài 24,4–24,9 s (5/5 lần) dù dữ liệu về ở 0,3 s; `curl` cùng request chỉ 47–66 ms. Giả thuyết: con số **6** trùng giới hạn 6 kết nối đồng thời của **HTTP/1.1** mà bản cục bộ dùng. Đo trên hosted (HTTP/2): request chậm nhất 1,25 s → **không tái hiện**. Nguyên nhân chính xác ở local vẫn chưa xác định và không chặn việc gì.

**Tiêu chí 3 (hồi quy hiệu năng) — đóng ở đợt 2B.1, mục 3.3, bằng một lượt đo tay trên hosted (n = 1).** Tiêu chí gốc đòi 15 lượt mỗi trang trên 4 trang, so `main` với nhánh PR; phép đo thực tế **yếu hơn tiêu chí gốc**. Kết luận rút ra chỉ ở mức "không hồi quy", không có con số phần trăm. Không mở lại ở 2B.2.

**Tiêu chí 8 (nháy trạng thái header) — chuyển sang 2B.2.** Tiêu chí cũ **đúng**; hai câu thêm vào ngày 30/09 là sai ("kiến trúc `getClaims()` đã xoá giai đoạn thứ hai" — giai đoạn thứ hai vẫn còn). Đo thật bằng Edge headless: **3/5 lần người đã đăng nhập thấy chữ "Đăng nhập" 234–273 ms** rồi mới đổi. Nguyên nhân: React streaming chỉ hiện Suspense boundary ngay nếu nó xong trước khung vẽ đầu; xong sau thì chờ `$RT+300ms`. Dạng mới: **0/10 lần** thấy trạng thái sai sau FCP, **bắt buộc có đối chứng ở trạng thái ngược lại**.

**Phương án sửa nháy (chốt, chờ làm ở 2B.2):** giữ icon người sẵn có + ô chữ rỗng có bề rộng cố định làm fallback. **Không** dùng ô trống hoàn toàn, vì như vậy đổi một vấn đề của thiểu số (người đã đăng nhập) lấy một vấn đề của đa số (khách chưa đăng nhập — gần như 100% người xem portfolio). Dự phòng nếu không đạt: cookie gợi ý hiển thị (không httpOnly, giá trị chỉ `1`, thuần hiển thị) do `proxy.ts` đồng bộ + script inline đặt `data-auth` trên `<html>` trước khi vẽ.

**Mục 11.1:** phần khoá email ở tầng DB **đạt**. Phần hành vi xác nhận hai đầu khi đổi email **chuyển sang 2D**, vì đổi email là chức năng của trang hồ sơ.

### 7.2 Đợt 2B.1 — kết quả (PR #10, `d49ff1a`)

**Bốn hạng mục đã làm:**

1. Bỏ `revalidatePath` khỏi `signIn`, `signUp`, `signOut`.
2. Bỏ `router.refresh()` thừa sau `router.push()` ở `LoginForm` và `RegisterForm`.
3. `proxy.ts` bỏ qua request prefetch — qua `config.matcher` với `missing`, không phải đọc header trong thân hàm (xem 5.1).
4. Trang `/gio-hang` tạm.

**Hạng mục "giảm prefetch": chốt KHÔNG làm.** Sau hạng mục 3, `getUser()` khi tải `/` đã đăng nhập giảm từ 16–17 xuống **1**, mỗi lần còn ~15 ms, nên chi phí server của prefetch gần như biến mất. Prefetch làm **URL và khung trang** đổi tức thì (23 ms so với 270 ms) — lưu ý nó **không** làm nội dung tới nhanh hơn (h1 trang sách: 604 ms không prefetch so với 982 ms có prefetch, mẫu nhỏ). Nếu về sau cần, dùng prefetch theo ý định (rê chuột / chạm), **không** `prefetch={false}` toàn bộ.

**Số đo chính (cục bộ, độ trễ Supabase +160 ms, 5 lần mỗi luồng, nhiễu tối đa 147 ms):**

| Luồng | Trước | Sau |
|---|---|---|
| Đăng ký tới `/` | 1626 ms | **899 ms** |
| Đăng nhập tới `/` | 1531 ms | **883 ms** |
| Đăng xuất từ `/` | 1487 ms | **497 ms** |
| `getUser()` khi tải `/` đã đăng nhập | 16–17 | **1** |
| `getUser()` sau đăng ký/đăng nhập | 20–24 | **2–3** |
| Request RSC trùng URL gửi đồng thời | 4/10 | **0/20** |
| Response `signOut` không phiên | 54.110 byte | **81 byte** |

**Số đo trên hosted (production mã cũ so với preview PR #10, cùng trạng thái đã đăng nhập):**

| | Production, n = 2 | Preview, n = 1 |
|---|---|---|
| `Finish` | 2,52 s và 2,18 s | **1,53 s** |
| Request chậm nhất | 524 ms và 1,25 s | **349 ms** |
| Lỗi Console | 1 | **0** |
| `/gio-hang` | 404, 464 ms | **200, 38–41 ms** |
| Số request | 42 và 48 | 48 |

Kết luận ghi trong spec: **không hồi quy, cải thiện nhất quán về hướng ở mọi phép đo thời gian và lỗi.** Số request là ngoại lệ (cao hơn), giải thích chưa kiểm: 3 request của thanh công cụ Vercel chỉ có trên preview, cộng `/gio-hang` giờ prefetch thành công. Chênh lệch ở request chậm nhất nhỏ hơn khoảng dao động giữa hai lần đo production, nên **chỉ cho biết hướng, không cho biết độ lớn**.

**Còn mở sau 2B.1:** tiêu chí 1.6 (vì sao đăng ký 2–3 s còn đăng nhập gần như tức thì trên hosted). Ba ứng viên, xếp theo mức tin dựa trên số đo: `signUp` chậm hơn `signInWithPassword` ~275 ms (log Supabase, 1 mẫu mỗi bên — là phần duy nhất giải thích *chênh lệch*); dựng lại cache `/` ~0,62 s (áp dụng cho cả hai nên chỉ giải thích thời gian chung); khởi động lạnh hàm Vercel (chưa đo, chỉ có dấu hiệu gián tiếp, nhưng là ứng viên duy nhất đủ lớn). Phần đo được cộng lại ~0,9 s trên 2–3 s.

**Chưa lên lịch:** N+1 ở trang chủ — ~25–30 truy vấn PostgREST xếp 4–5 bậc nối tiếp cho một trang 40 cuốn sách. Đổi vùng chỉ che bớt chứ không chữa.

### 7.3 Đợt 2B.2 — phạm vi, tiêu chí và kết quả đo (01/10/2026)

Spec: `docs/specs/buoc-2b2-xoa-nhay-trang-thai-header.md` (bản v2, ghi đè bản v1.0 ngày 30/09).

- **Mục tiêu hẹp lại cho đúng:** xoá **thông tin sai** trong trạng thái trung gian, **không** rút ngắn thời gian chờ ~250 ms. Đánh đổi đã chấp nhận: khách chưa đăng nhập thấy icon + ô chữ rỗng trong lúc chờ thay vì thấy ngay chữ "Đăng nhập".
- **Giả thuyết nguyên nhân đã được xác nhận bằng khảo sát mã** (bản v1.0, 30/09): `LoginLink` dùng chung cho cả Suspense fallback lẫn trạng thái khách thật, nên trạng thái sai đến từ fallback phía server, không phải từ render client trước hydration. Hằng `navAccountWidthClass` (135px) đã có sẵn. Bước 0 của spec vẫn phải xác nhận lại mô tả này trên mã sau 2B.1.
- **Phạm vi gồm mọi vị trí hiển thị trạng thái auth** (header desktop và menu mobile), không chỉ header desktop như bản v1.0.
- **Loại tiêu chí mới — đối chứng baseline (TC-3):** chạy đúng script đo trên commit **trước khi sửa**, phải thấy lỗi tái hiện ≥3/10. Baseline 0/10 nghĩa là phép đo hỏng hoặc môi trường không đủ điều kiện, **không được kết luận "đạt"**. Nếu tăng độ trễ Supabase tới +500 ms vẫn không tái hiện thì dừng và báo cáo.
- **Hạn chế đã biết, không vá:** tắt JavaScript thì fallback ở nguyên nên header không có liên kết đăng nhập. Không vá bằng `<noscript>` vì nó chỉ render được một trạng thái tĩnh, sẽ hiện "Đăng nhập" cho cả người đã đăng nhập — tái tạo đúng lỗi đang chữa, chỉ khác là vĩnh viễn. Vá riêng header cũng không cứu được trang: giỏ hàng, menu, dropdown đều cần JS.
- **Phương án cookie gợi ý hiển thị để ngoài phạm vi 2B.2**, chỉ mở khi TC-1 trượt, và khi đó phải có spec riêng vì nó thêm một nguồn sự thật thứ hai về trạng thái auth.

**Kết quả đo (01/10/2026).** Điều kiện: stack Supabase cục bộ, bản production (`next build` rồi `next start`) ở `127.0.0.1:3100`, Edge headless qua CDP, 1280px, tắt cache, độ trễ Supabase +160 ms/vòng ở cả hai phía. Mã mới ở commit `65269fb`; baseline là mã ứng dụng của `87ba18c`. Một lượt tải là một mẫu.

| Phép đo | Số mẫu | Kết quả |
|---|---|---|
| Bước 0: vị trí hiển thị trạng thái auth | 1 lần đọc mã | 1 vị trí (`components/Header.tsx`); mobile dùng chung slot |
| Bước 0: HTML ban đầu của baseline, đã đăng nhập | 1 lượt tải | Chứa "Đăng nhập" trong fallback phía server |
| Bước 0: tắt JS, tải `/` | 1 lượt mỗi trạng thái | Baseline hiện "Đăng nhập" cho cả người đã đăng nhập; mã mới hiện ô rỗng cho cả hai trạng thái |
| TC-0: `data-testid="header-auth"` | `rg -c`; 20 lượt tải | 1 lần trong mã; 1 phần tử trong DOM ở cả 20 lượt |
| TC-3: baseline, đã đăng nhập | 10 | **10/10** thấy "Đăng nhập" sau FCP (selector `nav[aria-label="Tài khoản và giỏ hàng"]`, khác selector của TC-1; xem ghi chú dưới TC-3 trong spec) |
| TC-1: mã mới, đã đăng nhập | 10 | **0/10** |
| TC-2a: mã mới, khách, thấy tên hoặc "Tài khoản" | 10 | **0/10** |
| TC-2b: mã mới, khách, kết thúc bằng "Đăng nhập" | 10 | **10/10** |
| TC-4: CLS của `/` | 10 mỗi trạng thái | **0** ở 20/20 lượt. Baseline đã đăng nhập: 9/10 lượt khác 0, tối đa 0,0002 (ngưỡng "tốt" 0,1) |
| TC-5: bề rộng slot, fallback so với ổn định | 10 mỗi trạng thái | 149,00 px và 149,00 px ở 20/20 lượt, chênh 0 px |
| Mobile 390px: kích thước slot, fallback / ổn định | 5 mỗi trạng thái | 44×44 px / 44×44 px; TC-1 0/5; CLS 0 |
| TC-6: số phần tử focusable trong slot, fallback / ổn định | 10 mỗi trạng thái | 0 / 1 ở 20/20 lượt |
| TC-7: FCP đến lúc chữ thật xuất hiện, trung vị (khoảng) | 10 mỗi dòng | Đã đăng nhập 285 ms (269–291); khách 279 ms (158–288); baseline đã đăng nhập 398 ms (261–449). Không có ngưỡng; chưa đo độ nhiễu của phép đo |
| `tsc`, `eslint`, `next build` | 1 lần | 0 lỗi, 0 lỗi, exit 0 |

**Merge:** PR #11 đã merge (squash) vào `main` ngày 02/10/2026, commit `8f90eaf`; CI 2/2 đạt (Vercel, Vercel Preview Comments). Kết quả TC-9: 6/6 lượt cho mỗi mục (dropdown/sheet hiện, họ tên khớp, email khớp, đăng xuất về khách, `/tai-khoan` chuyển hướng), 3 lượt mỗi viewport ở 1280px và 390px.

**TC-8 — chốt không chạy.** Sau khi đổi vùng sang `hnd1`, PostgREST từ Vercel có trung vị 12,5 ms, trong khi cửa sổ lỗi ở cục bộ chỉ mở được khi cộng +160 ms. Baseline trên production nhiều khả năng ra 0/10, tức "không tái hiện được" theo luật đối chứng của TC-3, không phải "đạt". Bằng chứng cho bản sửa là phép đo cục bộ: baseline 10/10 → 0/10, cùng script, cùng độ trễ, 10 mẫu mỗi phía.

**TC-9 — tự động qua CDP, cục bộ, không thêm độ trễ.** 3 lượt mỗi viewport (1280px và 390px), 6/6 lượt đạt: menu mở hiện đúng dropdown (1280px) hoặc sheet (390px); họ tên và email hiển thị khớp tài khoản thử; "Đăng xuất" đưa slot về khách; `/tai-khoan` sau đăng xuất chuyển về `/dang-nhap?next=%2Ftai-khoan`. Đối chứng: khi còn đăng nhập, `/tai-khoan` không bị chuyển hướng, 6/6.

**Phát hiện khi làm:** chuỗi "Đăng nhập" rộng 74,9 px, dài hơn "Tài khoản" 66,0 px (Be Vietnam Pro, 1280px, 1 mẫu mỗi chuỗi), ngược với ghi chú cũ ở `components/headerStyles.ts` và spec v1.0. Ô chữ vì vậy là 80 px và hộp là 149 px (trước đó `min-w` 135 px). Cả ba trạng thái căn từ trái, chừa chỗ cho mũi tên, để biểu tượng không dịch chỗ khi fallback được thay bằng nội dung thật.

**Ghi chú bổ sung (02/10, đo ở đợt 3A):** tiêu chí CLS = 0 của 2B.2 không ổn định. Đo xen kẽ A/B giữa `main` và nhánh 3A: `main` cho 0/10, 8/10 và 9/10 lượt có CLS khác 0, giá trị tối đa 0,0002; nhánh 3A cũng dao động, có lượt 0/30. Nguồn dịch chuyển là độ rộng nav và chữ danh mục (font hoặc thanh cuộn), không phải slot auth hay badge giỏ hàng. Kết luận "CLS = 0 ở cả 20 lần" của 2B.2 vì vậy chỉ đúng với môi trường đo lúc đó, không phải một tính chất của mã.

### 7.4 Đợt 3A — kết quả (02/10/2026)

PR #12 đã merge (squash) vào `main` ngày 02/10/2026, commit `8f05b91`; CI 2/2 đạt (Vercel, Vercel Preview Comments). Spec: `docs/specs/buoc-3a-gio-hang.md` (bản v2.4).

**Phạm vi:** giỏ khách bằng cookie `na_cart`; giỏ người đã đăng nhập ở bảng `cart_items`; gộp giỏ khi đăng nhập/đăng ký (phía server, trước `redirect()`); trang `/gio-hang` thật; badge số lượng ở header (Suspense riêng, `data-testid="header-cart-count"`); nối nút "Thêm vào giỏ" và "Mua ngay" ở `PurchasePanel`, ghi `add_to_cart`; `session_id` chuyển sang cookie `na_sid`; trang `/thanh-toan` tạm; thanh thao tác đáy cố định của `/gio-hang`; footer thu gọn ở luồng tập trung (`/gio-hang`, `/thanh-toan`).

**Điều kiện đo:** stack Supabase cục bộ, bản production (`next build` rồi `next start`), Edge headless qua CDP; độ trễ Supabase +160 ms/vòng ở TC-5, TC-6, TC-12. TC-14 đo trên preview và production Vercel, TC-15 và TC-16 đo trên preview (bản cục bộ cho cùng kết quả). Một lượt tải là một mẫu.

| TC | Số mẫu | Kết quả |
|---|---|---|
| TC-1 giỏ khách sống qua tải lại | 3 lần tải lại | Đạt, 5/5 kiểm; đối chứng: trước khi thêm cookie `na_cart` không tồn tại |
| TC-2 gộp giỏ | 3 | Đạt 3/3 (A: 2 → 3, B = 1, cookie đã xoá) |
| TC-3 chặn vượt tồn | 3 mỗi trạng thái (khách, đã đăng nhập) | Đạt 14/14; đối chứng q = 2 không có cảnh báo |
| TC-4 thao tác nối tiếp không mất dòng | 10 | Đạt 10/10; đối chứng sau lần gửi đầu đúng 1 dòng 10/10 |
| TC-5 badge không hiện số sai | 10 mỗi dòng | Số sai hoặc `0` sau FCP: 0/10 (khách, giỏ 3 cuốn), 0/10 (đã đăng nhập, giỏ 3 cuốn); giỏ rỗng có số: 0/10; số khi ổn định là `3` ở 10/10 mỗi dòng giỏ 3 cuốn. Ở khách, badge đã có số trước FCP (không có trạng thái trung gian); trạng thái trung gian rỗng rồi `3` chỉ quan sát ở dòng đã đăng nhập |
| TC-6 sàn RSC | 10 `signIn`, 3 `signUp` mỗi phía | Xem dưới |
| TC-7 sách biến mất khỏi catalog | 3 | Đạt 3/3 |
| TC-8 cookie rác | 1 mỗi trường hợp (3 trường hợp) | Đạt 3/3 |
| TC-9 hết hàng | 3 | Đạt 6/6 kiểm; đối chứng còn hàng đạt |
| TC-10 không còn `track` ở client cho `sign_up`/`login` | 1 lần chạy | 0 dòng; đối chứng `add_to_cart`: 1 dòng (`PurchasePanel.tsx`) |
| TC-11 kiểu | 1 | `tsc` 0 lỗi, `eslint` 0 lỗi, `next build` exit 0 |
| TC-12 testid của 2B.2 | `rg`; 20 lần tải | `header-auth` 1 lần trong mã, 1 phần tử trong DOM; TC-1 của 2B.2: 0/10, đối chứng khách 10/10 |
| TC-13 `session_id` hai phía | 3 | Đạt 3/3 (`page_view`, `add_to_cart`, `sign_up` cùng `session_id`, khớp cookie `na_sid`) |
| TC-14 không có `Set-Cookie` ở response được cache | 5 lượt mỗi phía | Xem dưới |
| TC-15a giỏ 1 cuốn, thanh ở đáy khung nhìn (390×844) | 5 | Đạt 5/5, chênh 0 px |
| TC-15b giỏ 5 cuốn, `scrollY = 0` và cuối trang | 5 mỗi vị trí | Đạt 5/5 ở cả hai vị trí, chênh 0 px |
| TC-15c dòng cuối footer không bị thanh che | 5 | Đạt 5/5 khi đo dòng chữ: cách thanh 16,69 px. Đo bằng hộp `<footer>`: −0,31 px (chạm 0,31 px do chiều cao tài liệu lẻ, không che chữ) |
| TC-15d desktop 1280px, thanh `null` | 5 | Đạt 5/5 |
| TC-15e CLS của `/gio-hang` ở 390px | 5 (bản cuối) | 0, 0, 0, 0, 0 (không đặt ngưỡng; xem mục CLS) |
| TC-16a footer thu gọn dưới breakpoint (1023px và 390px) | 3 mỗi trang, mỗi mốc | Đạt: 1 `<footer>`, 0 liên kết, có câu minh hoạ |
| TC-16b footer đầy đủ trên breakpoint (1024px và 1280px) | 3 mỗi trang, mỗi mốc | Đạt: 9 liên kết, đủ ba cột và GitHub; thanh `null`, cột tóm tắt có mặt |
| TC-16c trang khác (`/`, `/sach`) ở 1023px và 390px | 3 mỗi trang, mỗi mốc | Đạt: footer đầy đủ, 9 liên kết |

**TC-6:** đếm theo định nghĩa của 2B.1 (GET có `rsc`, không prefetch): baseline trên `main` ra **2** (10/10 lượt `signIn`), mã mới ra **0** (10/10 lượt `signIn`, 3/3 lượt `signUp`), vì `redirect()` mang luôn trang đích trong response của action. Tính cả POST action (response `text/x-component`): 3 xuống 1. Hạn chế của baseline: được chạy trên bản `main` sạch nhưng SAU khi viết mã, không phải trước như tiêu chí gốc đòi. Đối chứng phân loại: số request prefetch cùng lượt > 0 ở mọi lượt.

**TC-14:** khách hoàn toàn mới (mỗi lượt một tiến trình `curl` riêng, không cookie), `GET /` xen kẽ preview và production (baseline `main` `8462236`), 5 lượt mỗi phía. `Set-Cookie` cho `na_sid`: không có ở 10/10 response, và không có header `Set-Cookie` nào ở cả hai phía. `x-vercel-cache`: preview PRERENDER ×1, HIT ×4; production STALE ×1, HIT ×4. Chưa thấy dấu hiệu mất cache edge. Lượt đầu của hai phía không cùng điều kiện (preview vừa dựng, production STALE với `age` 2.404 s), nên chỉ so được 4/5 lượt, trong đó hai phía cùng `HIT` ở 4/4 lượt. Phép đo chỉ thấy header HTTP, không thấy cookie do JavaScript ghi bằng `document.cookie`.

**CLS:** TC-15e đo được CLS khác 0 ở 4/35 lượt (0,0325 ×2, 0,0091, và một lượt gỡ lỗi ≈ 0,0317), tối đa 0,0325; 0 ở 10/10 lượt đo đầy đủ trên preview và 0 dịch chuyển ở 12 lượt gỡ lỗi. Cơ chế quan sát được một lần (lượt gỡ lỗi): footer thu gọn dịch 113 px rồi bị gỡ khỏi DOM khoảng 3,6 s sau khi tải; chưa rõ vì sao việc gỡ xảy ra muộn, chưa tái hiện được. Không chữa ở 3A. Cách chữa hoãn sang đợt 1.6: chuyển footer khỏi layout gốc xuống layout theo route (`/gio-hang` và `/thanh-toan` dùng layout riêng với footer thu gọn), phần phụ thuộc bề rộng để CSS lo; khi đó tiêu chí đo khả kiến, không đo sự có mặt trong DOM. Chi tiết ở mục 5 của spec.

**Breakpoint:** thanh thao tác đáy và footer thu gọn dùng chung `--breakpoint-bottom-bar` (64rem = 1024px), đặt một chỗ ở `app/globals.css` (`@theme static`); bốn nơi cùng đọc: biến thể Tailwind `bottom-bar:`/`max-bottom-bar:`, media query đệm đáy của `<body>` (`theme(--breakpoint-bottom-bar)`), hook `useBelowBottomBar` (đọc biến CSS lúc chạy, dùng bởi `FooterSwitch`), và `BottomBarGate`.

**Sáu chỗ mã khác spec v2.1** (chi tiết và lý do ở mục 7 của `docs/specs/buoc-3a-gio-hang.md`): (1) `refresh()` làm mới badge cho người đã đăng nhập; (2) cookie hỏng được dọn bằng một action gọi từ client; (3) giỏ khách hết dòng thì cookie bị xoá, không ghi `[]`; (4) `mergeGuestCart` chặn số lượng theo tồn kho; (5) `lib/nextRedirect.ts` cho lời gọi action bị từ chối bởi `redirect()`; (6) nút "Thanh toán" trỏ trang `/thanh-toan` tạm cho tới đợt 3B.

### 7.5 Đợt 3B — kết quả (02/10/2026)

PR #13 (chặng 1, tầng dữ liệu) merge (squash) vào `main` lúc 16:19 UTC ngày 02/10/2026, commit `54e6a54`. PR #14 (chặng 2, giao diện và email) merge (squash) lúc 16:43 UTC cùng ngày, commit `00d6cde`; CI 2/2 đạt (Vercel, Vercel Preview Comments) tại `d18a8d2`. Spec: `docs/specs/buoc-3b-checkout.md`; `docs/SRS.md` lên v1.6.

**Phạm vi chặng 1 (8 migration):** bảng `provinces` (34 dòng) và `wards` (3.321 dòng) theo đơn vị hành chính hai cấp có hiệu lực từ 01/07/2025, nguồn API Cục Thống kê ngày 02/10/2026; `profiles` thêm `province_code`, `ward_code`, `address_line` với khoá ngoại ghép `MATCH FULL`, bỏ cột `address`; `orders` và `order_items` thêm cột và ràng buộc; `order_code_seq`; `place_order()` (một transaction, khoá advisory theo `idempotency_key`, trừ kho có điều kiện theo thứ tự `book_id`); `mark_confirmation_sent()`. Áp lên hosted ngày 02/10/2026 bằng MCP: version `20261002160851` (schema), `20261002160911` (provinces), sáu version từ `20261002161023` đến `20261002161620` (wards 1–6).

**Phạm vi chặng 2:** trang `/thanh-toan` thật (form địa chỉ, chọn tỉnh và phường/xã qua `/api/dia-chi/phuong-xa`, khoá idempotency); Server Action `placeOrder`; email xác nhận do ứng dụng gửi qua HTTP API Brevo (đợi kết quả, timeout 4 s); thông báo cửa hàng qua webhook Make trong `after()` (timeout 3 s); trang `/thanh-toan/hoan-tat/[order_code]` (chỉ chủ đơn xem được); banner hết hàng ở `/gio-hang?hang=1`; `SITE_URL` tường minh cho link trong email; ghi `order_placed` phía server; `/tai-khoan/don-hang` tạm.

**Điều kiện đo:** chặng 1 chạy trên stack Supabase cục bộ, gọi RPC/PostgREST bằng người dùng thật; hosted chỉ được đối chiếu md5, cấu trúc và truy vấn SELECT. Chặng 2 chạy trên bản production (`next build` rồi `next start`) trỏ stack cục bộ, Edge headless qua CDP; Brevo và Make là endpoint giả (`scripts/mock-external.mjs`). Các bộ kiểm không nằm trong repo. TC-38: máy dev gọi API Brevo thật bằng `scripts/send-test-confirmation.mjs`. Đơn đầu tiên: đặt tay trên production Vercel, kiểm lại bằng truy vấn SELECT qua MCP.

| Phép đo | Số mẫu | Kết quả |
|---|---|---|
| Kiểm tầng dữ liệu (dữ liệu, schema, `place_order`, RLS) | 58 phép kiểm, 1 lượt | 58/58; gồm 34 tỉnh, 3.321 phường/xã, 3 mã tỉnh và 994 mã phường/xã giữ số 0 đầu, 2.599 xã / 709 phường / 13 đặc khu |
| Replay migration | 1 lượt trên DB trống (16 migration, `auth` là stub); 1 lượt áp lên stack đã có dữ liệu cũ | Không lỗi; `provinces` 34, `wards` 3.321 |
| TC-13 hai người tranh cuốn cuối | 12 lượt | 12/12 đúng 1 thành công + 1 `HET_HANG`; kho âm 0/12 |
| Đối chứng TC-13: hàm đọc-rồi-ghi ngây thơ, cùng cách đo | 12 lượt (cửa sổ 50 ms); 60 lượt (không độ trễ) | Bán lố 12/12 và 57/60 |
| TC-14d hai lời gọi đồng thời cùng `idempotency_key` | 1 lượt | 1 đơn, cả hai trả cùng mã, kho trừ 1 lần. Đối chứng không có khoá advisory: lỗi UNIQUE 12/12 lượt |
| Quyền ghi của khách trên `orders` | 1 lượt mỗi kiểu | UPDATE `status`, `total_amount`, `note`, `confirmation_email_sent_at`: 0 dòng đổi; INSERT trực tiếp: `42501`; đối chứng: cùng câu UPDATE trên `cart_items` đổi 1 dòng |
| Áp lên hosted | 8 migration; md5 tính 1 lần mỗi bảng | 8/8; md5 `wards` (3.321 dòng) `58741100602161a977a6d7bcbf9bc199` và `provinces` (34 dòng) `c30b4c8a9f682a3b8db12950da3285e4` trùng từng ký tự với md5 tính từ file seed trong repo |
| Giao diện chặng 2 | 101 phép kiểm trong 4 bộ (47 + 17 + 23 + 14), 1 lượt mỗi bộ | 101/101; chạy trước khi đổi sang `SITE_URL` tường minh (xem dưới) |
| Chuỗi `SITE_URL` | 8 trường hợp ở mức hàm | 8/8 |
| TC-38: 1 email thật qua API Brevo, gọi từ máy dev | 1 thư, đường API | HTTP 201 có `messageId`; Brevo nhận cả `htmlContent` và `textContent`; `From` bị viết lại thành `@…brevosend.com`; vào Inbox Gmail, không vào Spam; HTML hiển thị đúng; link "Xem đơn hàng" trỏ thẳng tới `SITE_URL`, không bọc qua tên miền theo dõi, không tham số theo dõi; Gmail hiện nút "Huỷ đăng ký" |
| Script `send-test-confirmation.mjs` thoát sau khi gửi | 8 lượt trước sửa, 8 lượt sau sửa, khoá giả (Brevo trả 401, không gửi thư) | Trước: 8/8 mã 127 kèm `Assertion failed … UV_HANDLE_CLOSING`. Sau khi thay `process.exit()` bằng `process.exitCode`: 8/8 mã 1, 0/8 assertion; đường thiếu biến vẫn mã 2 |

**Đơn thật đầu tiên trên production, `NA-2026-0001` (02/10/2026 16:47:45 UTC, 1 đơn).** Kiểm bằng SELECT qua MCP trên hosted, 5/5 mục khớp:
1. `status` `pending`, `total_amount` 243.000, `payment_method` `cod`; `shipping_address` kết thúc đúng bằng tên phường/xã và tỉnh/thành tra từ `wards` và `provinces` theo mã (so khớp trong SQL, không in giá trị), dòng số nhà dài 19 ký tự; `confirmation_email_sent_at` không null, đặt 0,95 s sau khi tạo đơn.
2. `order_items` 3 dòng, mỗi dòng số lượng 1, `price_at_purchase` 109.000, 69.000, 65.000; tổng 243.000, chênh với `total_amount` 0; cả ba bằng giá hiệu lực tại thời điểm kiểm.
3. Tồn kho so với `supabase/seed.sql`: Hồ Điệp và Kình Ngư 30 → 29, Nhà giả kim 24 → 23, Xứ tuyết 12 → 11. Tổng tồn kho 40 cuốn: 835 theo seed, 832 trên hosted, chênh 3.
4. `cart_items` của tài khoản đặt đơn: 0 dòng.
5. `events` của phiên: 9 sự kiện (1 `login`, 3 `page_view`, 3 `add_to_cart`, 1 `checkout_started`, 1 `order_placed`). Metadata `checkout_started`: `items_count` 3, `total_amount` 243000. Metadata `order_placed`: `items_count` 3, `order_code`, `payment_method` `cod`, `total_amount` 243000. So khớp metadata với email, phần trước `@`, tên, SĐT và dòng địa chỉ: 0/9 sự kiện; regex dạng email, SĐT Việt Nam và tên đơn vị hành chính: 0/9. Đối chứng: cùng hình dạng truy vấn tìm một chuỗi có sẵn trong metadata cho 1 kết quả ở cả ba kiểu join; ba regex bắt được chuỗi mẫu và không bắt nhầm UUID.

**Chỗ phép đo yếu hơn tiêu chí gốc, hoặc dựa trên giả định:**
- **TC-39.** Tiêu chí gốc: link trong email không đổi khi request đặt hàng mang `Host` hoặc `X-Forwarded-Host` giả. Phép đo thực tế: (đo) các nhánh của chuỗi cấu hình (`SITE_URL`; `http://localhost:3000` chỉ ở `NODE_ENV=development`; không có `SITE_URL` ở production thì email không link kèm log `site_origin_missing`), và Next từ chối request Server Action có `X-Forwarded-Host` lệch `Origin` (1 mẫu) nên request giả không tới được mã gửi email; (đọc mã) 4 file dựng URL, email và webhook không đọc header request, kèm 1 đối chứng cho biểu thức lọc. Không có phép đo nào cho thấy email giữ nguyên link khi một request giả tới được mã gửi email. Sau khi đổi sang `SITE_URL` tường minh, chuỗi cấu hình chỉ được chạy lại ở mức hàm (8 trường hợp), không chạy lại ở mức ứng dụng.
- **101 phép kiểm giao diện** chạy trước commit `e627890` (`SITE_URL` tường minh); bộ 101 không được chạy lại sau commit đó.
- **TC-38, tiêu chí (d)** (bản `.txt` và bản HTML cùng đến hay chỉ một bản): chưa trả lời được. Đã quan sát: HTML hiển thị đúng; bản `.txt` chưa mở riêng vì Gmail ưu tiên HTML. Số mẫu 1.
- **TC-38 chạy từ máy dev**, không qua site production; link trong thư được dựng từ `SITE_URL=http://localhost:3000`. Việc link không bị bọc là quan sát trên 1 thư qua đường API; mục 5.1 ghi "không tắt được click tracking" cho đường SMTP, đường đó không được đo lại. Nguyên nhân của nút "Huỷ đăng ký" (Brevo gắn header huỷ đăng ký vào thư giao dịch) là nhận định của chủ dự án, không có bước đọc header trong TC-38. Hạn mức 300 email/ngày chưa kiểm ở trang giá chính thức.
- **Lỗi thoát của script** đo ở phản hồi 401 chứ không phải 201 (lỗi gốc xảy ra ở 201): sửa xong không gửi thêm thư thật để đo lại ở 201.
- **Tồn kho so với seed:** giả định hosted khớp `supabase/seed.sql` trước đơn đầu tiên; tồn kho ngay trước đơn không được đo. Ba cuốn trong đơn mỗi cuốn −1 và tổng chênh 3 cho thấy các cuốn còn lại cộng lại không đổi; hai thay đổi bù trừ nhau ở cuốn khác không bị loại trừ.
- **Email của đơn `NA-2026-0001`:** DB đánh dấu đã gửi (`confirmation_email_sent_at` không null); việc thư tới hộp thư không được ghi nhận.
- **Kiểm lọt dữ liệu cá nhân ở `events`** chỉ phủ 9 sự kiện của 1 phiên.
- **Webhook Make** chỉ được kiểm với endpoint giả trong repo; không có phép đo nào với Make thật.
- **Hạn chế đã biết, chủ dự án chấp nhận 02/10/2026** (chi tiết ở mục 7.1 của spec): `notFound()` và `redirect()` trong `<Suspense>` trả HTTP 200 (TC-19; chuyển hướng ở TC-3 và TC-4 là phía client); địa chỉ gửi bị viết lại thành `@…brevosend.com` ở cả đường API; Gmail hiện nút "Huỷ đăng ký" trên thư xác nhận.

### 7.6 Đợt 4 — kết quả (03/10/2026)

PR #15 (chặng 1, hàm hủy đơn) merge (squash) vào `main` lúc 04:36 UTC ngày 03/10/2026, commit `d299d2e`; CI 2/2 đạt (Vercel, Vercel Preview Comments) tại `6624b33`. PR #16 (chặng 2, giao diện) merge (squash) lúc 05:32 UTC cùng ngày, commit `09c41ad`; CI 2/2 đạt tại `bba7669`. Spec: `docs/specs/buoc-4-lich-su-don.md`; `docs/SRS.md` lên v1.7 (commit `08ed83b` và `b83a54a`).

**Phạm vi chặng 1 (1 migration):** hàm `public.cancel_order(p_order_code text) returns void`, `SECURITY DEFINER`, `search_path` rỗng, `EXECUTE` thu hồi từ `public` và `anon`; một giao dịch: đọc đơn của `auth.uid()` bằng `SELECT … FOR UPDATE`, từ chối nếu không phải `pending`, đặt `status = 'cancelled'`, cộng trả `stock_quantity` theo thứ tự `book_id`. Không thêm cột, bảng, policy, trigger; không đổi CHECK. Áp lên hosted ngày 03/10/2026, version `20261003043221`.

**Phạm vi chặng 2:** `/tai-khoan/don-hang` thật (một mặt phẳng trắng, tối đa 50 đơn, giờ Việt Nam); `/tai-khoan/don-hang/[order_code]` dùng chung khối tóm tắt đơn với trang xác nhận; nút hủy với vùng xác nhận trong trang và dải kết quả không tự tắt; `/tai-khoan` chuyển hướng 307 sang danh sách bằng `redirects` của `next.config.ts`. Tách thành phần dùng chung: `OrderSummary`, `OrderStatusChip`, `PageTitle`, `EmptyState`, hàm đọc đơn của chủ đơn.

**Điều kiện đo:** chặng 1 và chặng 2 chạy trên stack Supabase cục bộ; chặng 2 trên bản production (`next build` rồi `next start`), Edge headless qua CDP. Các bộ kiểm không nằm trong repo. Hosted chỉ được đọc bằng SELECT và log API.

| Phép đo | Số mẫu | Kết quả |
|---|---|---|
| Kiểm chặng 1 (RPC/PostgREST bằng người dùng thật) | 28 phép kiểm, 1 lượt | 28/28 |
| TC-6 hủy đơn `pending` | 3 đơn (hai qua `place_order`, một dựng trực tiếp có hai dòng cùng `book_id`) | 3/3: chỉ cột `status` của `orders` đổi (so cả dòng), `order_items` giống hệt, kho mỗi cuốn tăng đúng tổng `quantity`, 40 cuốn còn lại không đổi. Đối chứng độ nhạy: sửa cố ý `note` bị bắt đúng cột |
| TC-7 trạng thái khác `pending` | 4 mẫu (`processing`, `shipped`, `completed`, `cancelled`) | 4/4 bị từ chối `DON_KHONG_HUY_DUOC` kèm `details` đúng trạng thái; băm `orders`/`order_items`/`books` không đổi |
| TC-8 đơn người khác | 3 mẫu (khách khác, mã không tồn tại, admin) | 3/3 `DON_KHONG_TON_TAI`; trả lời cho khách khác và cho mã không tồn tại giống hệt (code, message, details, hint, HTTP 400). Đối chứng: chủ đơn gọi thành công |
| **TC-9 hai lời gọi hủy đồng thời cùng một đơn** | **30 lượt** | **30/30**: đúng 1 thành công + 1 `DON_KHONG_HUY_DUOC`, kho cộng đúng một lần |
| Đối chứng TC-9: hàm "đọc rồi ghi" ngây thơ, cùng cách đo | 12 lượt (cửa sổ 50 ms); 60 lượt (không độ trễ) | Cộng kho gấp đôi ở **12/12** và **57/60** lượt |
| Deadlock | 30 lượt mỗi nhánh | `cancel_order` × `cancel_order` trên hai đơn cùng chứa hai cuốn: 0/30; `cancel_order` × `place_order` cùng hai cuốn: 0/30 |
| Deadlock, cửa sổ nới 50 ms mỗi cuốn | 30 lượt mỗi nhánh | Cùng thứ tự `book_id` tăng dần: **0/30**; thứ tự ngược nhau: **30/30** |
| TC-10 quyền ghi của khách trên `orders` | 15 cột + 1 lượt `PATCH status → cancelled` | 0 dòng đổi ở 15/15 và ở lượt `PATCH status`; đối chứng: cùng `PATCH` bằng phiên admin đổi 1 dòng ở 15/15 |
| TC-10 `anon` gọi `cancel_order` | 1 lượt | HTTP 401 mã `42501`; đối chứng: hàm không tồn tại trả 404 `PGRST202`. Catalog: `anon` = false, `authenticated` = true |
| Áp lên hosted | 1 migration, md5 tính 1 lần mỗi bên | Số migration đã ghi 17 → 18. md5 thân hàm `01f49ded602b5457bdc9edce7b2b822b` trùng từng ký tự với file trong repo (1.266 byte). md5 `orders`, `order_items`, `books` trước và sau khi áp bằng nhau. Policy, trigger, CHECK không đổi. `get_advisors`: thêm 1 dòng ở nhóm "người đã đăng nhập thực thi hàm SECURITY DEFINER" (4 → 5), `anon` không có `cancel_order` |
| Kiểm chặng 2 | 44 phép kiểm (31 giao diện + 13 hồi quy), 1 lượt cuối trên bản build được commit | 44/44 |
| TC-1, TC-2 | 3 request + 3 lượt đăng nhập qua trình duyệt; 3 request + 3 lượt trình duyệt + 1 chuỗi chưa đăng nhập | 307 tới `/dang-nhap?next=%2Ftai-khoan%2Fdon-hang` 3/3, đăng nhập xong về đúng trang 3/3; `/tai-khoan` 307 → `/tai-khoan/don-hang` 3/3; chưa đăng nhập đo được `307 → 307 → 200 /dang-nhap?next=%2Ftai-khoan%2Fdon-hang`. Đối chứng: `/tai-khoan/khong-co-trang` 404 |
| TC-3 danh sách đúng và không lẫn | tài khoản A 6 đơn đủ 5 trạng thái × 3 lượt tải; B 3 đơn; 1 admin | Đúng thứ tự (mới nhất trước, hai đơn cùng giây xếp mã giảm dần), mã, ngày giờ, tổng, chip 3/3; `2026-12-31T17:30:00Z` hiện `01/01/2027 00:30`; 0/3 mã của B ở trang A; admin chỉ thấy đơn của chính mình |
| TC-4, TC-15 | 3 lượt; 5 trạng thái × 2 vị trí | Trạng thái trống đủ bốn phần 3/3; năm nhãn đúng ở danh sách và chi tiết, cả năm chip cùng một `class`. Đối chứng: tài khoản có đơn không có phần tử nào của trạng thái trống; tài khoản không có đơn có 0 chip |
| TC-5 đơn của người khác | 3 trường hợp (đơn người khác, mã không tồn tại, mã sai định dạng) | Giao diện 404, `noindex`, 0 lần lộ mã đơn/tên sách/tên người nhận/địa chỉ; văn bản, `robots` và `title` giống hệt nhau ở cả ba. Mã HTTP đo được: 200 |
| TC-6, TC-7 qua giao diện | 1 lượt mỗi cái | Hủy qua nút: chip "Đã hủy", chỉ cột `status` đổi, kho 3 cuốn tăng 2, 1, 3, 0 hộp thoại `confirm()`. Đơn đổi sang `processing` sau khi trang đã mở: dải báo "Đang xử lý", kho không đổi |
| TC-11 | 51 đơn × 3 lượt; 50 đơn × 1 | 51 đơn: đúng 50 dòng + 1 ghi chú nêu "50" và "51" 3/3; 50 đơn: 50 dòng, 0 ghi chú; 0 phần tử có `box-shadow`, 0 dòng bo góc, n−1 đường kẻ 1px màu `--color-menu-sep` |
| TC-12 khối tóm tắt dùng chung | 3 đơn × 3 lượt | `outerHTML` ở hai route giống hệt từng ký tự 9/9; so với baseline trên `main`: giống hệt 9/9 sau khi bỏ hai `data-testid` (nguyên văn chênh +60 byte) |
| TC-13 xác nhận trong trang | 5 lượt (3 chuột, 2 chỉ bàn phím); chờ 10 giây ở lượt 1 | 5/5: 0 hộp thoại, focus vào vùng, Escape và "Không" trả focus về nút, vùng còn nguyên sau 10 giây. Đối chứng: một trang gọi `confirm()` làm sự kiện hộp thoại bắn 1 lần |
| TC-14 dải kết quả | 3 lượt, mỗi lượt chờ 10 giây | 3/3: dải còn nguyên sau 10 giây, focus trong dải, kho +đúng |
| TC-16 ở 390×844 | 3 lượt (6, 7, 8 dòng + 3 nút) | Mọi liên kết và nút ≥ 44×44 (nhỏ nhất 48 px cao, 324 px rộng); không cuộn ngang ở danh sách, chi tiết, khi vùng xác nhận mở |
| TC-17 hồi quy `/gio-hang` | baseline 5 mẫu × 3 lượt; so lại 3 lượt mỗi trạng thái | Độ nhiễu baseline 0 (5/5 mẫu cùng mã băm ở 3/3 lượt). `/gio-hang` có hàng (8.454 byte) và rỗng (1.911 byte) giống baseline trên `main` từng byte, 3/3 mỗi trạng thái |

**Lần hủy thật trên hosted (1 đơn, 03/10/2026).** Đơn `NA-2026-0001` (đặt lúc 02/10/2026 16:47:45 UTC). Log API: 1 lời gọi `POST /rest/v1/rpc/cancel_order`, HTTP 204, lúc 2026-10-03T05:32:04Z — 53 giây trước thời điểm merge #16 (05:32:57Z); trong cửa sổ log từ 03/10/2026 00:00 UTC không có lời gọi `cancel_order` nào khác và không có `PATCH`, `DELETE`, `POST` nào lên `/rest/v1/orders`. Kiểm bằng SELECT sau lần hủy:
1. `status` `cancelled`; `total_amount` 243.000; `payment_method` `cod`; `confirmation_email_sent_at` vẫn không null. `orders` theo trạng thái: `cancelled` 1, `pending` 1.
2. md5 của `orders` sau khi thay ngược `status` của `NA-2026-0001` về `pending` là `39fd557e36c00892be21e872fab07420`, bằng md5 chụp trước khi áp migration: mọi cột khác của cả hai đơn (kể cả `total_amount`, `confirmation_email_sent_at`, `shipping_address`) không đổi. Đơn còn lại `NA-2026-0002` vẫn `pending`, 273.000.
3. md5 của `order_items` là `4dde652c28761e8b27204ae368418ee9`, bằng md5 trước khi áp.
4. md5 của `books` sau khi trừ ngược `quantity` của đơn đã hủy khỏi `stock_quantity` là `d7669087daec9fb0f18fbba83ea3469b`, bằng md5 trước khi áp: mỗi cuốn trong đơn tăng đúng bằng `quantity` (3 dòng, mỗi dòng 1): Hồ Điệp và Kình Ngư 28 → 29, Nhà giả kim 23 → 24, Xứ tuyết 10 → 11; 37 cuốn còn lại không đổi. Tổng tồn kho 829 → 832.

**Chỗ phép đo yếu hơn tiêu chí gốc, hoặc dựa trên giả định:**
- **TC-5.** Tiêu chí gốc: đơn của người khác → 404. Mã HTTP đo được là 200 (`notFound()` trong `<Suspense>`, hạn chế đã biết ở spec đợt 3B mục 7.1), nên phép đo ở mức văn bản nhìn thấy, `robots` và `title`; HTML thô không được so vì nó chứa đường dẫn được yêu cầu trong state của router.
- **TC-12(c).** So với baseline sau khi bỏ hai `data-testid` mới thêm (`order-summary`, `order-status-chip`), vì chính hai hook mà tiêu chí dùng là thuộc tính mới; so nguyên văn thì chắc chắn khác (+60 byte). Số mẫu 9.
- **Giao diện chưa đo trên hosted.** 44 phép kiểm giao diện chạy ở stack cục bộ. Trên hosted chỉ có 1 lần hủy (1 mẫu); nguồn của lời gọi (bản preview, máy dev trỏ hosted hay gọi trực tiếp) không phân biệt được vì không đọc IP và user agent trong log. `orders` không có cột `cancelled_at`, nên thời điểm hủy lấy từ log API. Các giá trị tồn kho "trước khi hủy" là suy ra (hiện tại trừ `quantity`), được bảo chứng bằng việc md5 khớp bản chụp trước khi áp migration, không đọc trực tiếp.
- **Deadlock ở cửa sổ tự nhiên** (0/30 và 0/30) có sức phát hiện yếu: ở lượt smoke đầu, đối chứng deadlock ở cửa sổ tự nhiên bắt được 0/3 lượt vì hàm chạy vài mili giây. Kết luận về thứ tự khoá dựa trên so sánh ở cửa sổ nới 50 ms (cùng thứ tự 0/30, ngược thứ tự 30/30); các nhánh chỉ dùng hai cuốn; hàm đối chứng khác `cancel_order` thật ở độ trễ nhân tạo và thứ tự sắp xếp tuỳ chọn.
- **TC-6 và TC-7 qua giao diện** mỗi cái 1 lượt. **TC-16** đo viền focus của nút hủy bằng bàn phím, không đo mọi phần tử focus được.
- **Hạn chế đã biết, ngoài phạm vi** (chi tiết ở mục 4.1 của spec đợt 4): đường hủy của Admin không cộng trả kho (policy `orders_admin_update` cho `UPDATE` trực tiếp, không trigger nào trên `orders`; hosted có 3 profile, cả 3 là `customer`); URL có dãy `%XX` hỏng hoặc `%25` ở route động trả HTTP 500 ở route mới và ở `/sach/[slug]`, `/tu-sach/[slug]`, `/thanh-toan/hoan-tat/[order_code]` (có từ trước), đường dẫn không động trả 404; menu "Hồ sơ của bạn" mở ra danh sách đơn cho tới đợt 2D.

### 7.7 Đợt 5A — kết quả (03/10/2026)

PR #17 (chặng 1, tầng dữ liệu) merge (squash) vào `main` lúc 06:41 UTC ngày 03/10/2026, commit `35a7f32`; CI 2/2 đạt. PR #18 (chặng 2, giao diện) merge (squash) lúc 09:49 UTC cùng ngày, commit `3fc5c52`; CI 2/2 đạt tại `03344ed`. Spec: `docs/specs/buoc-5a-admin-don-hang.md`; `docs/SRS.md` lên v1.8 (commit `fc687d7` và `a9c2e4a`).

**Phạm vi chặng 1 (1 migration `20261003063859_orders_status_trigger.sql`):** trigger `orders_status_transition` (`BEFORE UPDATE` trên `orders`, `FOR EACH ROW`, `WHEN (OLD.status IS DISTINCT FROM NEW.status)`) và hàm `orders_status_guard()` (`SECURITY DEFINER`, `search_path` rỗng, `EXECUTE` thu hồi từ `public`, `anon`, `authenticated`): chặn mọi chuyển ngoài sáu chuyển hợp lệ bằng `CHUYEN_TRANG_THAI_KHONG_HOP_LE` (áp cho mọi vai trò, kể cả `service_role` và `postgres`), và cộng trả `stock_quantity` theo thứ tự `book_id` khi `status` chuyển sang `cancelled`. `cancel_order` bỏ vòng cộng kho trong CÙNG giao dịch (giữ `FOR UPDATE`, kiểm chủ đơn, kiểm `pending`). Không thêm cột, bảng, policy; không đổi CHECK.

**Áp lên hosted ngày 03/10/2026 (1 giao dịch):** số migration 18 → 19; trigger tồn tại và bật (`tgenabled = 'O'`); md5 thân `orders_status_guard` `d0473cf27c9091ca84a3194722cccbd6` và thân `cancel_order` mới `2551acd2c161f3d1e55d5fe2d84982ab` (trước: `01f49ded602b5457bdc9edce7b2b822b`) trùng file trong repo; `cancel_order` không còn vòng cộng kho, vẫn `FOR UPDATE`, ACL không đổi; md5 `orders` (`3a6eb3e80251f6357fdcf8e550af61ef`), `order_items` (`4dde652c28761e8b27204ae368418ee9`), `books` (`7ab03d0a15bf92d9b98030ba31fb7dea`) trước và sau bằng nhau; md5 10 policy của `books`, `orders`, `order_items`, `profiles` (`8790b7609de4b08d0f1df93c487e5a05`) không đổi. 19 mục đối chiếu, 0 lệch. Không gọi `cancel_order` trên hosted.

**Phạm vi chặng 2:** `/admin/don-hang` (toàn bộ đơn của mọi khách, mới nhất trước, 20 dòng mỗi trang, lọc theo trạng thái, tìm theo mã đơn / tên người nhận / tên tài khoản; bộ lọc là `<form method="get">`, nằm trên URL); `/admin/don-hang/[order_code]` (dùng nguyên `OrderSummary`, thêm "Đặt lúc" và khối Khách hàng); đổi trạng thái bằng Server Action `updateOrderStatus` (khoá lạc quan `AND status = from`, client của phiên admin, database là bên quyết định) và `OrderStatusControl`, xác nhận trong trang cho MỌI lần đổi; `requireAdmin()`/`checkAdmin()` ở đầu mọi page và Server Action của khu admin, mọi giao diện quản trị nằm sau `requireAdmin()` trong `<Suspense>`; `/admin` chuyển hướng 307 sang `/admin/don-hang`. Tìm bằng `imatch` (regex đã escape), không `ilike`. Tách thành phần dùng chung: `PaginationNav`, `InlineConfirm`, `OrderDetail` (đổi tên từ `OwnOrder`), `inputClass` (sang `lib/ui/classes.ts`). `proxy.ts`, `lib/focusedFlow.ts`, mọi policy RLS, mọi migration: không đổi.

**Điều kiện đo:** chặng 1 và chặng 2 chạy trên stack Supabase cục bộ; chặng 2 trên bản production (`next build` rồi `next start`), Edge headless qua CDP. Các bộ kiểm không nằm trong repo. Hosted chỉ được đọc bằng SELECT và log API.

| Phép đo | Số mẫu | Kết quả |
|---|---|---|
| Kiểm chặng 1 (SQL, PostgREST bằng admin, RPC bằng người dùng thật) | 61 phép kiểm | 61/61 |
| TC-6 chuyển trạng thái, hai đường (`service_role` và PostgREST admin) | 40 mẫu (6 hợp lệ + 14 bị từ chối, mỗi đường) + 5 mẫu cập nhật lên đúng trạng thái đang có | 40/40 và 5/5: 6 chuyển hợp lệ thành công, 14 chuyển bị từ chối `CHUYEN_TRANG_THAI_KHONG_HOP_LE` kèm `detail` đúng, dòng `orders`/`order_items`/`books` không đổi. Đối chứng: tắt trigger trong một giao dịch thì `pending → shipped` đi qua (hoàn tác) |
| TC-7 admin → `cancelled` từ `pending`, `processing`, `shipped` | 3 mẫu (đơn 3 dòng, có hai dòng cùng `book_id`) | 3/3: chỉ cột `status` đổi, `order_items` giống hệt, mỗi cuốn +đúng tổng `quantity` một lần. Đối chứng độ nhạy: sửa cố ý `note` bị bắt đúng cột |
| TC-8 khách hủy sau khi có trigger | 3 đơn; 30 lượt hai lời gọi đồng thời | Hiệu kho đúng một lần `quantity` 3/3; 30/30 đúng 1 thành công + 1 `DON_KHONG_HUY_DUOC`. **Đối chứng: `cancel_order` bản cũ (còn vòng cộng kho) chạy cùng trigger cộng gấp đôi ở 3/3** |
| TC-9 sửa tay `status = 'cancelled'` (psql vai `postgres`, PostgREST `service_role`) | 4 mẫu + đơn `completed` | 4/4 kho +đúng một lần; `completed → cancelled` bị từ chối. Đối chứng: tắt trigger thì `status` đổi nhưng kho KHÔNG đổi |
| TC-15 cập nhật không đổi trạng thái | 5 mẫu | 5/5 không chạm trigger |
| **TC-16 cạnh tranh** | 30 lượt × 4 nhánh | **120/120**: kho +đúng một lần, 0 deadlock (`40P01`). **Đối chứng: trigger thử thiếu `OLD ≠ NEW` cộng thừa ở 12/12 lượt.** Thứ tự khoá đo riêng, tất định, bằng `FOR UPDATE NOWAIT` |
| Hồi quy đợt 4 chặng 1 (phần dựng dữ liệu chỉnh theo trigger) | 28 phép | 28/28 |
| Hồi quy bộ UI đợt 4 trên bản dựng 5A | 31 phép | 31/31 |
| TC-14 thành phần dùng chung | `/sach` 3 URL × 3 lượt; vùng xác nhận `CancelOrder` 4 băm × 3 mẫu | HTML giống hệt baseline chụp trên `main` trước khi sửa (baseline ổn định 3/3) |
| TC-1, TC-2, TC-20 chặn truy cập | 6 + 3 + 3 + 9 + 20 + 3 | Chưa đăng nhập: 307 tới `/dang-nhap?next=…`, 0 chữ quản trị trong thân; admin đăng nhập quay lại đúng trang 3/3; khách: 307 về `/`; RLS 20/20 truy vấn của khách vào dữ liệu khách khác trả 0 dòng (đối chứng admin trả đủ); `/admin` 307 → `/admin/don-hang`, đối chứng `/admin/khong-co-trang` 404 |
| **TC-17 lớp 2 khi lớp 1 bị bỏ qua** | bản dựng thử `proxy.ts` cho qua; 6 phép × 3 lượt | 6/6: khách và người chưa đăng nhập không thấy chữ quản trị nào trong HTML đầy đủ, kết thúc ở `/` và `/dang-nhap?next=…`; Server Action gọi trực tiếp bằng phiên khách bị từ chối (`forbidden`), người chưa đăng nhập `signed_out`, DB không đổi. Đối chứng: phiên admin vào được, action đổi `pending → processing` 3/3. Vỏ tĩnh đã build: 0/8 chuỗi quản trị, `title` "NA Books", `noindex` |
| TC-3 danh sách đúng | 45 đơn, 3 khách, 1 cặp cùng giây; 3 trang × 3 lượt | 20 + 20 + 5 dòng đúng thứ tự độc lập, hợp mã = DB (45/45). Đối chứng: khách thường chỉ thấy 20 đơn của mình |
| TC-4, TC-12 lọc và tìm | 5 trạng thái; 5 kiểu tìm (mã, đoạn mã, tên nhận, tên tài khoản, `q` + `status`) qua form và URL; 3 lượt hai cửa sổ | Đúng tập đơn, URL đúng tham số, đổi bộ lọc về `page` 1, Back đúng; liên kết phân trang giữ `status`, `q` |
| TC-5 chi tiết | 3 đơn (1 dòng, 3 dòng, giảm giá) | Khớp DB; `outerHTML` của `order-summary` giống hệt trang của chủ đơn; giá sách đổi sau khi đặt không ảnh hưởng. Đối chứng: ba `outerHTML` đôi một khác nhau; SĐT trống hiện "Chưa có thông tin" |
| **TC-11 `q` không đổi nghĩa bộ lọc** | 10 mẫu | 10/10 đúng nghĩa văn bản. **Đối chứng: cách nối chuỗi ngây thơ làm lọt 3/3 đơn `cancelled`**, và `*` khớp 45/45 qua `ilike` (trang thật trả 1) |
| TC-13 hủy qua giao diện | 5 lượt; 3 mẫu khoá lạc quan | 5/5 kho +đúng từng cuốn, chỉ cột `status` đổi, dải còn nguyên sau 10 giây; 3/3 trang cũ báo "vừa chuyển sang Đang xử lý", kho không đổi |
| **TC-21 xác nhận cho mọi lần đổi** | 6 chuyển × 3 đường = 18; 2 lượt chỉ bàn phím | **18/18**: DB không đổi cho tới khi xác nhận (18/18), 0 hộp thoại, Escape và "Không" trả focus về đúng nút, dải còn nguyên sau 10 giây; 2/2 bàn phím. Đối chứng: một trang gọi `confirm()` làm sự kiện hộp thoại bắn 1 lần |
| TC-18 biên phân trang | 5 cỡ (20, 21, 40, 41, 0 đơn) × 6 URL | 30/30; đối chứng 20 đơn 0 `<nav>`, 21 đơn 1 `<nav>` |
| TC-19 ở 390×844 | 3 lượt (chạy lại sau khi sửa dòng đơn) | 0 phần tử < 44×44px ở danh sách, chi tiết, vùng xác nhận; 0 cuộn ngang; luồng chỉ bàn phím |
| Dòng đơn ở 390px giữ hai hàng | 12 dòng (4 kiểu tên × 3) | Chiều cao `<li>`: trước 81–142px, sau 81–82px ở 12/12; ở 1280px không đổi (88/88, 73/72). Chỉ ẩn dòng phụ "Tài khoản" thì còn 103/124px, nên tên người nhận cắt "…" dưới `md` |

**Lần đổi trạng thái thật trên production (1 đơn, 03/10/2026).** Đơn `NA-2026-0002`, `pending → processing`, qua giao diện `/admin/don-hang/NA-2026-0002` của bản production (`book-store-website-dun.vercel.app`, commit `3fc5c52`, deployment thành công lúc 09:50:16Z), do chủ dự án thực hiện bằng tài khoản admin đã nâng quyền; chủ dự án báo chip hiện "Đang xử lý". Log API: đúng 1 lời gọi `PATCH /rest/v1/orders?order_code=eq.NA-2026-0002&status=eq.pending&select=status`, HTTP 200, lúc 2026-10-03T10:09:03Z — đúng dạng truy vấn của `updateOrderStatus` (khoá lạc quan `status=eq.pending`); trong cửa sổ log 24 giờ không có `PATCH`, `DELETE` hay `PUT` nào khác lên `orders`, `order_items`, `books`. Một lần kiểm SELECT trước lời gọi `PATCH` (lúc đó log API mới tới 10:06:35Z) cho `NA-2026-0002` còn `pending` và mọi băm bằng baseline. Kiểm bằng SELECT sau lần đổi, so với baseline chụp trước khi bấm:
1. `NA-2026-0002` `status` `processing` (trước: `pending`); `NA-2026-0001` vẫn `cancelled`, không bị chạm. `orders` theo trạng thái: `cancelled` 1, `processing` 1; 2 đơn, 6 `order_items`.
2. md5 các cột đóng băng (`total_amount`, `payment_method`, `recipient_name`, `recipient_phone`, `shipping_address`, `user_id`, `created_at`, `idempotency_key`, `note`) từng đơn bằng baseline: `NA-2026-0001` `20ec6b3e834d3fd4bfaa9c8c277d7af0`, `NA-2026-0002` `ecc0b11833c02a3033705b23aa05a76f`. `confirmation_email_sent_at` vẫn không null ở cả hai đơn. `total_amount` bằng tổng `quantity × price_at_purchase` ở 2/2 đơn.
3. md5 `order_items` từng đơn bằng baseline: `4532ea0c7d65e4b82f88ae2f3aaa372c` và `8a4cb39fd4f11a7b6061582ebc5e147a`; số dòng 6.
4. Kho: md5 toàn bảng `books` `5b181f9da55503b774cfb6d017ad4247` và md5 `id:stock_quantity` `f9b8c3aeea776280b5323ca2ea15c8e8` bằng baseline; tổng tồn kho 832, 40 cuốn. Chuyển sang `processing` không cộng trả kho (chỉ chuyển sang `cancelled` mới cộng). Trigger `orders_status_transition` vẫn bật.

**Chỗ phép đo yếu hơn tiêu chí gốc, hoặc dựa trên giả định:**
- **TC-1 ở mức thanh địa chỉ: 0/3.** Khách thường đăng nhập từ `?next=/admin/don-hang`: nội dung là trang chủ, 0 phần tử và 0 chữ quản trị (3/3), tải lại thì ở `/`; nhưng thanh địa chỉ ở lại `/admin/don-hang` (tiêu chí gốc đòi kết thúc ở `/`). Đối chứng `next=/tai-khoan` cho cùng kết quả (2/2), có từ đợt 4. Quyết định của chủ dự án: không sửa ở đợt 5A, gom vào đợt 1.6 (sửa tận gốc đụng `app/actions/auth.ts`).
- **Giao diện admin trên hosted chỉ có 1 mẫu: một lần đổi `pending → processing` trên production, do chủ dự án thao tác** (Claude Code không đăng nhập hosted Auth). Danh sách, lọc, tìm, phân trang, chi tiết, hủy và bố cục 390px chỉ đo ở stack cục bộ; lần đổi trên production không đi qua bộ kiểm tự động. Lần đổi đó không phải chuyển sang `cancelled` nên chưa có số đo cộng trả kho qua giao diện trên hosted; cộng trả kho đo ở stack cục bộ qua PostgREST (TC-7, TC-13). Nguồn của lời gọi `PATCH` xác định qua dạng truy vấn trong log, không đọc IP và user agent. Phần database (trigger, `cancel_order`) đã kiểm bằng SELECT trên hosted sau khi áp migration, không gọi hàm.
- **TC-11 và TC-18 đo bằng HTML trả về** (đếm dòng, mã), không phải DOM trình duyệt.
- **"Viền focus nhìn thấy" (TC-19) đo bằng `box-shadow` tính toán khác `none`** trên phần tử đang focus, không đo điểm ảnh.
- **Tiền đề TC-16 của spec gốc sai, đối chứng được thay.** Spec đòi một biến thể ngây thơ "kiểm trạng thái bằng `SELECT` thường rồi ghi" cộng kho gấp đôi; đo cho thấy với trigger điều đó không xảy ra (30/30 vẫn cộng đúng một lần nhờ `WHEN`). Đối chứng thay bằng trigger thử thiếu `OLD ≠ NEW` (12/12 cộng thừa). Cùng loại: payload nguyên văn `x,status.eq.cancelled` của TC-11 không làm lọt với nối chuỗi (dấu `*` cuối), nên đối chứng dùng `x,status.eq.cancelled,status.eq.`.
- **TC-2a** dùng POST với header `next-action` giả để đo `proxy` chuyển hướng; lời gọi Server Action thật đo ở TC-17 (ID lấy từ `server-reference-manifest`).
- **Phép đo hỏng của chính bộ kiểm, đã sửa và chạy lại:** điều kiện "sẵn sàng" khớp `h2` của Footer; dấu hiệu rò rỉ trùng mã đơn nằm trên URL (bị phản chiếu trong HTML); chỉ số "số dòng chữ" đếm thừa nên dùng chiều cao `<li>`; selector `span.block` không còn khớp sau khi đổi class (chỉ số "dòng phụ hiện" sau sửa dùng `span.text-meta`).
- **Hạn chế đã biết, ngoài phạm vi** (spec mục 6.1): `redirect()`/`notFound()` trong `<Suspense>` trả HTTP 200; policy `orders_admin_update`/`order_items_admin_update` cho `UPDATE` mọi cột, kể cả cột đóng băng (sửa `order_items.quantity` rồi hủy làm kho lệch); sửa trạng thái sai bằng tay phải tắt trigger; form bộ lọc để lại `?q=&status=` trên URL; không có liên kết nào tới `/admin` (vào bằng URL); README đang trống nên chưa ghi URL.

### 7.8 Đợt N+1 trang chủ — kết quả (03/10/2026)

PR #19 merge (squash) vào `main` lúc 11:15:54 UTC ngày 03/10/2026, commit `424e96f`; CI 2/2 đạt (Vercel; Vercel Preview Comments). PR đổi 3 file (+382/−94): `lib/queries.ts` (sửa), `docs/specs/dot-n1-trang-chu.md` (mới, 136 dòng), `docs/specs/dot-accessibility-ra-soat.md` (mới; xem 7.9). `app/page.tsx`, `package.json`, `package-lock.json` và mọi migration: không đổi. Spec: `docs/specs/dot-n1-trang-chu.md`.

**Phạm vi:** năm hàm `use cache` trong `lib/queries.ts` (`getFeaturedCollection`, `getEditorialPick`, `getCollectionsWithPreview`, `getCategoryCounts`, `getFeaturedBookExtrasBySlug`) chuyển sang truy vấn nhúng của PostgREST (`collection_books(position, books(…))`, `books(count)`, `parent:parent_id(…)`); hàm thuần `buildCategoryTree` tách ra để `getCategoryCounts` và `getCategoryTree` dùng chung. Không RPC, không migration, không thư viện mới, không đổi giao diện hay nội dung, không áp gì lên hosted.

**Điều kiện đo:** stack Supabase cục bộ; bản production (`next build` rồi `next start`) qua một proxy chỉ-ghi-nhật-ký đặt giữa app và PostgREST; cùng máy, cùng dữ liệu, cùng bộ đo ở hai phía; bộ đo không nằm trong repo. Baseline chụp ở commit `bbdf305`, trước khi sửa. Truy vấn chỉ chạy ở hai trường hợp: tải nguội thật (không còn bản prerender của `/`; người dùng chờ chuỗi truy vấn) và tái tạo nền (sau `revalidate` 60 giây; người dùng nhận bản cũ). Một request tới `/` phục vụ từ shell tĩnh đã prerender không tạo truy vấn nào (25 mẫu, 0 truy vấn).

**Baseline thật khác ước lượng cũ.** Mục 9 ghi N+1 ở trang chủ là "~25–30 truy vấn, 4–5 bậc nối tiếp", một ước lượng chưa đo. Baseline đo: **21 truy vấn và 5 bậc** cho một lần dựng trang chủ — 21 truy vấn ở 11/12 mẫu tải nguội thật và 23 ở 1/12 (hai lệnh gọi trùng một hàm `use cache` cùng trượt); 5 bậc ở 5/5 mẫu với trễ nhân tạo 80 ms mỗi truy vấn (không trễ: 5 ở 10/12 mẫu, 6 ở 2/12). 28 là số truy vấn của cả một lần `next build` (mọi route cộng lại, 1 mẫu). Cấu thành 21 truy vấn: `categories` 4, `collections` 3, `books` 2, `collection_books` 6, `POST rpc/search_books` 1, `HEAD books` 5.

| Phép đo | Số mẫu | Trước | Sau |
|---|---|---|---|
| Số truy vấn, tải nguội thật, không trễ | 12 | 21 ở 11/12; 23 ở 1/12 | **11 ở 11/12; 13 ở 1/12** (hai lệnh gọi trùng cùng trượt, như 23 ở baseline) |
| Số truy vấn, tải nguội thật, trễ 80 ms | 5 | 21 ở 5/5 | **11 ở 5/5** |
| Số truy vấn, tái tạo nền | 5 | 21 ở 5/5 | **11 ở 5/5** |
| **Độ sâu chuỗi**, trễ 80 ms | 5 | 5 ở 5/5 (các bậc 8 / 10 / 1 / 1 / 1 truy vấn) | **2 ở 5/5** (bậc 1: 10 truy vấn; bậc 2: 1 truy vấn `books` của thẻ nổi bật) |
| Độ sâu quan sát, không trễ | 12 | 5 ở 10/12; 6 ở 2/12 | 2 ở 8/12; 3 ở 3/12; 4 ở 1/12 |
| Trải từ truy vấn đầu tới cuối, tái tạo nền | 5 | trung vị 113,9 ms (113,3–122,7) | trung vị 67,2 ms (65,5–85,4) |
| Số truy vấn của một lần `next build` (mọi route) | 1 | 28 | 18 |
| **TTFB CỤC BỘ**, tải nguội thật, không trễ | 12 | trung vị 305,4 ms; p90 318,7; 281,7–319,4 | trung vị 253,5 ms; p90 272,1; 222,2–275,2 |
| TTFB cục bộ, tải nguội thật, trễ 80 ms | 5 | trung vị 745,0 ms; p90 756,7 | trung vị 431,4 ms; p90 467,0 |
| TTFB cục bộ, tái tạo nền (người dùng nhận bản cũ) | 5 | trung vị 20,6 ms | trung vị 20,9 ms |
| TTFB cục bộ, ấm (từ prerender) | 25 | trung vị 3,7 ms; p90 5,0; 0 truy vấn | trung vị 3,8 ms; p90 5,1; 0 truy vấn |
| **HTML giống baseline từng byte** (sau chuẩn hoá id build và email thử) | 56 bản chụp: `/` khách 20 (ấm 12, nguội 4 + 4), `/` đã đăng nhập 3, `/sach` và `/sach/[slug]` 4 URL × 3, `/tu-sach` 4 URL × 3, `/gio-hang` + `/dang-nhap` + `/dang-ky` × 3 | baseline ổn định (12 bản ấm của `/`: 1 băm, 127.566 B) | giống hệt ở mọi nhóm; 0 khác biệt còn lại. Đối chứng độ đủ của chuẩn hoá: hai bản build của cùng mã baseline giống hệt nhau ở cả 12 nhóm sau chuẩn hoá |
| Mọi khối trang chủ đúng dữ liệu (DOM bản production so với truy vấn độc lập vào DB) | 8 phép (hero, 5 thẻ danh mục, editorial, 17 + 17 thẻ sách, 3 thẻ tủ sách) | — | 8/8. Đối chứng độ nhạy: sửa cố ý một giá và một số đếm bị bắt |
| Hàm cũ và hàm mới của năm hàm cho cùng kết quả sâu (`isDeepStrictEqual`, kể cả thứ tự khoá) | 9 phép trên DB cục bộ; 9 phép trên hosted (GET công khai, chỉ đọc); 31 phép với dữ liệu cục bộ bị biến dạng | — | 9/9; 9/9; 31/31 |
| PPR và kiểm tĩnh | 1 lần `next build`; 15 directive `"use cache"` | — | `◐` cho `/`; `index.meta` còn khoá `postponed`; không file nào trong `lib/` gọi `cookies()` hay `headers()`; `package.json` và `package-lock.json` không đổi; `next build`, `tsc --noEmit`, `eslint` sạch |

**TTFB là số cục bộ, không phải mức cải thiện trên production.** PostgREST chạy cục bộ nên mỗi truy vấn mất vài ms; ở trễ nhân tạo 80 ms mỗi truy vấn, TTFB nguội đo được 745,0 → 431,4 ms (5 mẫu). Chênh lệch trung vị TTFB nguội không trễ là 51,9 ms (12 mẫu mỗi phía); dao động mốc ở baseline (nhỏ nhất–lớn nhất) là 37,7 ms và hai khoảng nhỏ nhất–lớn nhất không chồng nhau (sau tối đa 275,2 ms; trước tối thiểu 281,7 ms). Truy vấn chỉ chạy ở lần render nguội và lần tái tạo nền, và đó là nơi thay đổi này có tác dụng (số truy vấn 21 → 11; trải từ truy vấn đầu tới cuối khi tái tạo nền 113,9 → 67,2 ms, 5 mẫu). Lượt CDN `HIT`, nơi đa số khách gặp, không chạy truy vấn nào: baseline production, 14 mẫu GET thuần của khách, `x-vercel-cache` HIT 13 và PRERENDER 1; TTFB trung vị 137,2 ms, p90 910,4 ms (98,3–1542,6); vùng `hkg1`. Không có số đo sau trên production.

**Chỗ phép đo yếu hơn tiêu chí gốc, hoặc dựa trên giả định:**
- **Không có số đo "sau" trên hosted hay production.** Không làm được trước khi merge; chưa đếm truy vấn của một lần tái tạo thật bằng nhật ký truy vấn của Supabase. Hosted chỉ được dùng cho 9/9 phép so hàm cũ/mới bằng GET công khai chỉ đọc (xác nhận PostgREST của hosted hiểu cú pháp nhúng).
- **Độ sâu chính thức đo với trễ nhân tạo 80 ms (5 mẫu)**; không trễ thì dao động theo lịch trình (sau: 2 ở 8/12, 3 ở 3/12, 4 ở 1/12; trước: 5 ở 10/12, 6 ở 2/12; cùng một mã baseline đo được 5–7).
- **Kịch bản "hai tủ nổi bật" không dựng được** (chỉ mục duy nhất một phần `collections_one_featured`): nhánh lỗi `maybeSingle` của hero không đạt tới được bằng dữ liệu thật; hàm vẫn dùng `maybeSingle`.
- **Nhánh "Hết hàng" của TC-5 phủ bằng cách tạm đặt tồn kho 0 cho hai cuốn trên DB cục bộ rồi khôi phục.**
- **Quyết định: bỏ phần "khởi chạy thẻ nổi bật sớm" ở `app/page.tsx`.** Phiên bản đầu cho cùng 11 truy vấn và cùng độ sâu 2 (5/5, trễ 80 ms) nhưng làm hai dòng RSC liền kề (thân trang `b` và metadata `11`) hoán đổi ở mọi điều kiện của trang chủ, tất định giữa các bản build, trong khi hai bản build của mã baseline giống hệt nhau. Số đo của phương án đã bỏ: tải nguội thật 11 truy vấn ở 12/12, TTFB nguội không trễ trung vị 247,6 ms (231,3–277,7).
- **Thứ tự khoá của `featuredExtras` đổi thành theo thứ tự `slugs`.** Bản cũ phụ thuộc thứ tự hoàn thành của các lời gọi song song (khác nhau giữa bản cũ và bản mới khi hai slug khác nhau, đo ở cả DB cục bộ và hosted); với dữ liệu hiện tại hai tab cùng cuốn đầu nên chỉ có một khoá và HTML không đổi.
- **Không làm:** gộp xuống khoảng 5 truy vấn bằng "kho" dùng chung (kéo `Header`, `Footer`, `/sach`, `/tu-sach`, `/gio-hang` vào phạm vi); kéo thêm dữ liệu vào bậc 1 để độ sâu thành 1.
- **Phép đo hỏng đã bắt được:** so sánh HTML báo khác ở mọi nhóm vì id build (`"b":"<21 ký tự>"`) khác ở mọi bản build, kể cả hai bản build của cùng mã (chuẩn hoá id build và email thử của tài khoản thử); cú pháp nhúng `parent:categories!parent_id(…)` trả mảng rỗng trên PostgREST, mã dùng `parent:parent_id(…)`.

### 7.9 Rà soát accessibility — một lần đo, không phải đợt sửa (03/10/2026)

Một lần đo trên mã đã merge; không có thay đổi mã nào. Tài liệu: `docs/specs/dot-accessibility-ra-soat.md` (bản 1.0 trong PR #19, `424e96f`; 1.1 và SRS 1.9 ở `2580589`; 1.2 ở `1d34df8`; 1.3 ở `7cfe9ff`). **Phạm vi:** 8 route, 12 trạng thái, 2 khung (1280×900 và 390×844) = 24 lượt, cộng một lượt đo riêng cho bìa sách (16 trang × 2 khung = 32 lượt, 219 bìa). **Điều kiện:** stack Supabase cục bộ, bản production, Edge headless qua CDP; dữ liệu thử: 1 khách có giỏ (2 cuốn), 5 đơn đủ 5 trạng thái, 1 admin. Hosted không đo (Claude Code không đăng nhập hosted Auth). Bộ đo không nằm trong repo.

**Kết quả: 20 phát hiện (A11Y-01 → A11Y-20) — 9 đóng, 11 mở (3 Trung bình, 8 Thấp, 0 Cao).** Mở, Trung bình: A11Y-01 (placeholder 3,3:1, `/thanh-toan`), A11Y-05 (9/302 phần tử dưới 44px ở 390px), A11Y-10 (3 liên kết trong dòng 1,50–1,68:1 với chữ quanh, không gạch chân). Mở, Thấp: A11Y-03, 04, 06, 07, 08, 09, 12, 13. Đóng: A11Y-02 (nút vô hiệu hoá: chủ dự án chấp nhận theo miễn trừ có trong WCAG 1.4.3), A11Y-11 (chữ dưới 14px: giải quyết bằng sửa NFR-6.6 ở SRS 1.9), A11Y-14 (chữ in trên bìa dưới 12px: miễn trừ), A11Y-15 → A11Y-20 (xem dưới).

| NFR | Số mẫu | Kết quả |
|---|---|---|
| 6.1 tương phản | 1.009 nút văn bản nhìn thấy ở desktop, 938 ở mobile; 702 nhóm; 59 cặp token; 26 `::placeholder` | 0 vi phạm ở chữ hoạt động; dưới 4,5:1: thành phần vô hiệu hoá, 1 ký tự trang trí `aria-hidden` (2,13:1), 1 placeholder (3,3:1) |
| 6.2 vùng chạm (390px) | 302 phần tử tương tác | 9 dưới 44px (3,0%); 0 ở 8 trong 12 trang |
| 6.3 focus và bàn phím | 311 phần tử tương tác ở 11 trang desktop; menu "Danh mục" 3/3 (mở bằng `Enter`, đóng bằng `Escape`, focus trả về nút); hộp thoại tài khoản mobile 14 lần `Tab` | 0 thiếu chỉ báo focus; 0 chỉ báo dưới 3:1; 310 tới được bằng `Tab` (1 radio theo quy ước phím mũi tên); 0/14 lần focus thoát khỏi hộp thoại tài khoản |
| 6.4 `alt` và icon | 108 `<svg>`; 134 `[role=img]`; 381 phần tử tương tác | 108/108 `aria-hidden`; 134/134 có nhãn; 0 phần tử tương tác không tên |
| 6.5 không chỉ bằng màu | liên kết trong dòng; lỗi form ở `/thanh-toan` | 3 liên kết chỉ khác màu và độ đậm; lỗi form không chỉ bằng màu (3/3 trường `aria-invalid` + `aria-describedby`) |
| 6.6 cỡ chữ | 1.009 nút văn bản ở 1280px | 347 (34,4%) dưới 14px; theo NFR-6.6 bản 1.9, 0/347 dưới 4,5:1, thấp nhất 4,77:1; 20 nút dưới 12px (16 ở 10px, 4 ở 11,3px; chữ in trên bìa) |
| 6.7 kiểm lại cặp màu | 59 cặp | cặp thấp nhất của chữ hoạt động `sale` → `paper` 4,66:1; 300 nút văn bản nằm trong 0,5 trên ngưỡng |
| Ngoài NFR-6.x | 12 trang; ô nhập ở `/sach`; 3 trang admin | không có liên kết bỏ qua (8 điểm dừng `Tab` trước `<main>` ở 12/12 trang); viền ô nhập 1,04:1 và 1,36:1 (cần 3:1); `<title>` của 3/3 trang admin cùng "NA Books" (cố ý, spec 5A) |

**SRS lên 1.9 (`2580589`):** NFR-6.6 viết lại — chữ nội dung đọc tối thiểu 14px; chữ phụ trợ (ngày, số đếm, nhãn, chú thích) được dùng 12–13px theo token `--text-micro` và `--text-meta`, với điều kiện tương phản đạt WCAG AA cho cỡ chữ đó. Lý do ghi ở lịch sử thay đổi của SRS: NFR-6.6 là quy tắc tự đặt của dự án, không phải tiêu chí WCAG.

**Điều kiện của miễn trừ A11Y-14 bị thay giữa chừng.** Chủ dự án miễn trừ chữ in trên bìa dưới 12px khỏi NFR-6.6 (chữ in trên bìa là chất liệu của ảnh bìa do `BookCover` sinh ra), kèm điều kiện thứ nhất (tài liệu 1.2): ở mọi nơi dùng `BookCover`, tên sách và tên tác giả là chữ thật bên cạnh bìa. Đo theo điều kiện đó: **173/219 bìa đạt**, 8/14 nơi, 5/13 trang có dùng `BookCover`; sáu nơi thiếu thành sáu phát hiện Trung bình (A11Y-15 → A11Y-20). Điều kiện thứ nhất bỏ sót `alt` và tên khả truy cập của bìa; chủ dự án thay bằng điều kiện hai phần (tài liệu 1.3): (a) mọi bìa mang tên sách tới công nghệ hỗ trợ (qua `alt`, chữ nhìn thấy hoặc tên khả truy cập của liên kết bọc; bìa trang trí thì `aria-hidden` và không là nơi duy nhất mang thông tin); (b) tên tác giả là chữ ở thẻ sách của lưới catalog và các dải trang chủ và ở dòng giỏ hàng, các chỗ khác chỉ cần tên sách. Đo lại theo điều kiện mới, bằng cây accessibility của trình duyệt: **219/219 bìa đạt** — (a) 219/219 (215 qua nhãn của bìa, tên khả truy cập = tên sách; 4 trang trí `aria-hidden` ở giỏ hàng, tên sách là chữ thật cạnh bìa; 0 bìa thiếu cả `alt`, tên và `aria-hidden`), (b) 158/158 ở nơi bắt buộc; đối chứng 6/6 bìa tổng hợp; thêm 26 bìa ảnh (SVG tạm gán cho 3 cuốn trên DB cục bộ, đã khôi phục): 26/26. **A11Y-14 và A11Y-15 → A11Y-20 đóng vì điều kiện miễn trừ đổi, không vì mã đổi** (mã không đổi).

**Chỗ phép đo yếu hơn tiêu chí gốc, hoặc dựa trên giả định:**
- **Tên khả truy cập đọc từ cây accessibility của Edge, không phải trình đọc màn hình thật.** Chưa đo: thu phóng 200–400% và reflow, giãn chữ, trạng thái hover và active, chế độ tối (site không có), hosted.
- **Ảnh bìa thật (JPEG/PNG qua trình tối ưu ảnh của Next) chưa đo**; nhánh `<Image alt={title}>` đo bằng ảnh SVG tạm ở 6 nơi (26 bìa), và trang chủ không có bìa ảnh nào trong lượt đo đó.
- **Cách xếp từng nơi vào nhóm (b) hay nhóm "chỉ cần tên sách" là cách đọc của Claude Code** (chủ dự án liệt kê theo tên, không theo mã). 39/219 bìa không nằm trong liên kết nào (hero 8, bìa lớn 4, "Có trong tủ" 4, dòng đơn ở thanh toán 4, tóm tắt đơn 18, đăng nhập 1), nên lý do nêu cho (b), "tác giả nằm ở trang chi tiết mà bìa dẫn tới", không đúng nguyên văn ở các bìa đó; (b) vẫn đạt vì ở đó không đòi tác giả. 182/215 bìa có nhãn lặp với chữ tên sách thật cạnh bìa (thuộc A11Y-09, còn mở).
- **"Bên cạnh" được thao tác hoá** là tổ tiên gần nhất có từ 20 ký tự chữ thật, ngoài bìa và ngoài cây `aria-hidden`; ngưỡng 20 chưa được thử đổi.
- **Tương phản của chữ trên bìa đo theo màu nền bìa**; lớp vân giấy và gáy sách phủ lên bìa không được tính. Chữ trắng trên các màu bìa có mặt ở dữ liệu đo đạt ≥ 5,0:1 (thấp nhất `cover-4` 5,02:1); dữ liệu cục bộ không dùng hết 12 màu bìa.
- **Phép đo hỏng đã bắt được và sửa, rồi đo lại:** vòng focus báo "yếu" ở thẻ `hover-lift` là dương tính giả do đọc `box-shadow` giữa lúc chuyển dần (tắt transition khi đo); 3 "vùng chạm 20×20" ở `/thanh-toan` là ô chọn trong `<label>` (đo theo nhãn: 0 dưới 44px); truy vấn `[role=dialog]` khớp hộp thoại mobile đang ẩn bằng CSS; nhãn "nơi" của bìa ở `/dang-nhap` và `/gio-hang` gán sai và `<details>` tóm tắt đơn gập ở 390px không có bìa nhìn thấy; bộ đo điều kiện mới lần chạy đầu chỉ 4/6 đối chứng khớp (bỏ qua `<img alt>` con của nút gốc bị đánh "bỏ qua"; coi mọi nhãn không rỗng là tên sách), sửa rồi chạy lại 32 lượt: 219/219 không đổi, 6/6 đối chứng. Một câu sai của chính tài liệu ở bản 1.2 ("tên và tác giả vẫn có trong tên truy cập của bìa") đã sửa ở 1.3: tên khả truy cập của bìa chỉ có tên sách.

### 7.10 Đợt 5B — quản lý sách (04–06/10/2026)

Đợt chia hai chặng. PR #20 (mockup) merge (squash) vào `main` commit `1bae2c9`; PR #21 (chặng 1, tầng dữ liệu) merge (squash) commit `4b08d44`, migration `20261004090859_books_constraints.sql` đã áp lên hosted ngày 04/10/2026; PR #22 (chặng 2, giao diện và cache): commit mã `b491dee` (16 file, +1.621/−17), commit SRS `a959c27` (`docs/SRS.md` lên v1.11; v1.10 ở `d2fb8ce`, spec ở `ff2bf73`), CI Vercel đạt; merge (squash) vào `main` lúc 05:17:17 UTC ngày 06/10/2026, commit `622ea35`; production dựng xong cho commit đó (GitHub deployment `success`). Spec: `docs/specs/buoc-5b-admin-sach.md` (FR-5B.1 → 5B.7, 22 tiêu chí), mockup: `docs/mockups/buoc-5b/`.

**Phạm vi chặng 1 (1 migration):** ba CHECK của chủ dự án trên `books` (`books_price_check`, `books_discount_price_check`, `books_stock_quantity_check`), cộng `books_slug_format_check` và `NOT NULL` cho `stock_quantity` và `category_id`. Chặn xoá sách đã đặt dùng khoá ngoại `order_items_book_id_fkey` có sẵn (`NO ACTION`), không thêm trigger.

**Phạm vi chặng 2:** `/admin/sach` (20 dòng mỗi trang, tìm không dấu bằng RPC `search_books`, lọc danh mục, bộ lọc nằm trên URL), `/admin/sach/moi` và `/admin/sach/[slug]` dùng chung một `BookForm` (15 trường), vùng xoá có chặn khi sách đã nằm trong đơn kèm nút "Đặt tồn kho về 0". Bốn Server Action `createBook`, `updateBook`, `deleteBook`, `setBookOutOfStock` (`checkAdmin()` trước hết, client của phiên admin, không dùng khoá secret). Luật dùng chung `lib/admin/bookRules.ts` cho client và Server Action; lỗi database dịch theo ô. Cache: `cacheTag("books")` ở chín hàm đọc `books` của `lib/queries.ts`, `updateTag("books")` sau khi database xác nhận ghi. File mới: `app/actions/admin-books.ts`, `app/admin/sach/{page,moi/page,[slug]/page}.tsx`, `components/admin/{BookForm,BookDeleteSection,ResultStrip}.tsx`, `lib/admin/{bookRules,books,slug}.ts`. File sửa: `lib/queries.ts`, `components/admin/AdminNav.tsx`, `components/AuthFields.tsx`, `components/InlineConfirm.tsx`, `components/Breadcrumb.tsx`, `lib/ui/classes.ts`. `proxy.ts`, `package.json`, `package-lock.json`, RLS: không đổi.

**Điều kiện đo:** stack Supabase cục bộ; bản production (`next build` rồi `next start`); Edge headless qua CDP; bản dựng thử đối chứng ở thư mục sao chép ngoài repo; bộ đo không nằm trong repo.

| Phép đo | Số mẫu | Kết quả |
|---|---|---|
| **TC-4/5/8 làm mới cache, bản thật** (đo trong cửa sổ TTL: mốc SQL chưa hiện ở `/` trước khi ghi, trình duyệt mới không cookie đọc ngay và đọc lại ở ~8,3 s) | 45 lượt: thêm 10; đổi tên, giá, giá giảm, danh mục, tồn kho 0 (form), slug mỗi loại 5; nút "Đặt tồn kho về 0" 5 | **45/45** dữ liệu mới ở `/` và `/tu-sach/<tủ>`, đọc lần 1 muộn nhất 0,8 s sau lúc lưu; 0 lượt bị loại |
| **TC-4/5/8 đối chứng: bản gỡ mọi `updateTag`** | 30 lượt: thêm 10; đổi tên 5; đổi giá 5; đổi slug 5; nút về 0 5 | **30/30 dữ liệu CŨ ở cả hai lần đọc** (số đếm danh mục không đổi, chip "Trong tủ sách" biến mất khi đổi slug), `/sach?q=` và `/sach/<slug>` có sách mới (đọc theo request); 0 lượt bị loại |
| **Vercel preview của PR #22** (hosted Supabase, function `hnd1`, edge `hkg1`, HTTP/2) | 15 lượt: thêm 5, sửa tên 5, nút "Đặt tồn kho về 0" 5; mỗi lượt đọc `/` bằng trình duyệt mới sau lúc lưu và lại ở 30 s | **15/15** dữ liệu mới. Đọc lần 1: phản hồi 0,38–0,88 s sau lúc lưu (tải xong ≤ 1,49 s). `x-vercel-cache`: tiền kiểm `HIT` (`age` 19–31 s, một lượt 5 s) và mốc chưa hiện → đọc lần 1 `REVALIDATED` (`age` 0) → đọc lần 2 `HIT` (`age` 28–29 s) |
| **Production** (`book-store-website-dun.vercel.app`, commit `622ea35`, hosted Supabase, function `hnd1`, edge `hkg1`, HTTP/2; 06/10/2026) | 6 lượt: thêm 3, sửa tên 3; mỗi lượt đọc `/` bằng trình duyệt mới sau lúc lưu và lại ở 30 s | **6/6** dữ liệu mới. Đọc lần 1: phản hồi 0,66–1,19 s sau lúc lưu (tải xong ≤ 1,89 s). `x-vercel-cache`: tiền kiểm `HIT` (`age` 3, 30, 31, 31, 31, 30 s) và mốc chưa hiện → đọc lần 1 `REVALIDATED` (`age` 0) → đọc lần 2 `HIT` (`age` 29 s). Không đo nút "Đặt tồn kho về 0" (xem Điều kiện còn lại) |
| TC-1 chặn truy cập | (a) 3 route × 3; (b) 9; (c) 4 action × 2 vai × 3 = 24; (d) 9 | 7/7 kèm đối chứng admin |
| TC-2, TC-21 danh sách và biên URL | 45 sách (2 cuốn cùng giây); 22 danh mục; 6 ca tìm; 4 ca trình duyệt (đổi bộ lọc, Back) | 17/17 |
| TC-3, TC-10, TC-22 thêm sách, bìa, tập trường | 3 cuốn; 15 trường = 15 cột | 13/13; sửa không chạm `cover_image_url` 3/3 |
| TC-6, TC-11, TC-12 slug | 3+3 ca trùng; 40/40 slug sinh lại đúng; 3 lượt mỗi hành vi | 13/13 |
| TC-13, TC-14 lỗi cạnh ô, hai lớp trên | 15 trường × 3; 8 luật × 3 × hai đường | 7/7. Bản bỏ kiểm ở client: 21/21 vẫn bị Server Action chặn; bản bỏ cả hai: 12 + 4 lượt bị CHECK của database chặn |
| TC-7, TC-8 xoá và nút về 0 qua giao diện | 3 + 3 + 3; 5 + 5 | 6/6 |
| TC-15 hồi quy HTML | 12 trang × 3 bản | 10 trang giống hệt baseline (sau chuẩn hoá id build và tên chunk); 2 trang admin chỉ khác ở `AdminNav` (so phần DOM bỏ `<script>`); sửa một ký tự bị bắt ở 12/12 |
| TC-16 kiểm tĩnh phạm vi cache | 11 phép | 11/11: đúng 9 `cacheTag("books")`, 4 `updateTag("books")`, bảng route vẫn `◐` |
| TC-17 lớp 2 khi `proxy.ts` bị bỏ qua | 18 HTML + 18 trình duyệt + 24 Server Action | 6/6 kèm đối chứng admin |
| TC-20 ở 390×844 | 10 trạng thái; luồng thêm 3 × 16 điểm dừng; luồng xoá 3 | 7/7 |

**Hosted trong lúc đo trên preview (06/10/2026):** tạo 5 sách tiền tố `Thử5B-VC` bằng giao diện admin, 1 sách mốc mỗi lượt bằng PostgREST (xoá ngay sau lượt), 5 đơn `cancelled` mã `NA-9798-0001…0005` gắn vào tài khoản admin của chủ dự án (nút "Đặt tồn kho về 0" chỉ hiện ở cuốn đã có đơn); chủ dự án tự đăng nhập admin vào cửa sổ Edge do Claude Code mở. Dọn: 5 `order_items`, 5 đơn, 5 sách. Sau dọn: 40 sách, 2 đơn, 6 `order_items`, 17 `collection_books`; `xmin` lớn nhất của 40 dòng gốc 1670, nhỏ hơn `xmin` nhỏ nhất của dòng thử (1738), nên không dòng gốc nào bị `UPDATE`.

**Hosted trong lúc đo trên production (06/10/2026):** chủ dự án tự đăng nhập admin vào cửa sổ Edge do Claude Code mở; 3 sách tiền tố `Thử5B-PD` tạo bằng giao diện admin (không có đơn nào), 1 sách mốc mỗi lượt bằng PostgREST (xoá ngay sau lượt). Dọn: 3 sách. Sau dọn: 40 sách, 2 đơn, 6 `order_items`, `xmin` lớn nhất của `books` 1670.

**Năm chỗ spec lệch thực tế, đã chốt:**
1. **Breadcrumb:** mockup có "Sách / Thêm sách", spec không nhắc, nhưng TC-20 đòi mọi liên kết ≥ 44px. Giữ breadcrumb, nới vùng chạm bằng prop tuỳ chọn `linkClassName`.
2. **FR-5B.4 và TC-11:** FR nói tên chỉ có dấu câu thì báo lỗi cạnh ô tên; TC-11 nói ô slug để trống và có lỗi. Làm cả hai (`aria-invalid` ở cả hai ô).
3. **TC-1 (c):** khi `proxy.ts` bật, request tới Server Action của khách và người chưa đăng nhập bị chuyển hướng 307 trước khi tới action, nên (c) đo 307 và `books` không đổi (24/24). Kết quả `forbidden` và `signed_out` của lớp 2, tức đường gọi thẳng Server Action, do TC-17 phủ trên bản không có `proxy.ts`.
4. **`refresh()`:** spec mục 9 ghi `refresh()` ở mọi action. Thêm, sửa, xoá kết thúc bằng `redirect()` đặt sau `updateTag`; chỉ `setBookOutOfStock` dùng `refresh()`.
5. **Ba thành phần dùng chung** mở rộng ngoài hai mục spec nêu (`AdminNav`, `lib/queries.ts`): `InlineConfirm` (prop `confirmClassName`), `Breadcrumb` (prop `linkClassName`), `lib/ui/classes.ts` (hai hằng). Đều là prop tuỳ chọn, HTML mặc định không đổi (TC-15). Thêm: chuỗi kỹ thuật trong ảnh mockup (`updateTag`, `cover_image_url`, `NFR-3.3`, `order_items_book_id_fkey`) không có trong giao diện.

**Bốn lỗi mã tìm ra khi đo, đã sửa trước khi mở PR:**
1. **Đặt tồn kho về 0 rồi Lưu sẽ ghi đè tồn kho về số cũ.** Sau khi bấm "Đặt tồn kho về 0", ô "Tồn kho" của form trên cùng trang vẫn hiện số cũ; một lần "Lưu thay đổi" sau đó ghi lại số cũ vào database. Đo trước khi sửa: DB = 0, ô = 6. Sửa: ô tồn kho theo giá trị của trang được làm mới (các ô khác giữ nguyên bản đang sửa dở) và `setBookOutOfStock` gọi `refresh()`; đo sau sửa: ô = 0 ở 5/5 lượt.
2. Escape và "Không" ở vùng xoá không trả focus về nút mở (nút bị gỡ khỏi cây khi mở bước xác nhận). Sửa: giữ nút, thêm `aria-expanded` và `aria-controls`; đo lại 3/3 lượt trả focus.
3. 24 cặp (trạng thái, phần tử) dưới 44px ở 390px: liên kết "Sách" của `AdminNav` rộng 35,2px, breadcrumb cao 20px, nút trong tóm tắt lỗi cao 21px, liên kết trong dải kết quả cao 18–39px. Sửa: nới vùng chạm; đo lại 0 phần tử dưới 44×44px ở 10 trạng thái.
4. Viền focus của ô "Địa chỉ trang" nằm ở khung bọc chứ không ở ô nhập (TC-20 đo `box-shadow` trên phần tử đang focus). Sửa: tiền tố "/sach/" chồng lên phần đệm trái của chính ô nhập; đo lại 48/48 điểm dừng có viền.

**Chỗ phép đo yếu hơn tiêu chí gốc, hoặc dựa trên giả định:**
- **TC-21 "đúng 20 / 21 sách"** đo bằng bộ lọc `q` có tiền tố riêng (20 và 21 kết quả khớp), vì không thể xoá 40 cuốn gốc để còn đúng 20.
- **TC-15 "giống hệt từng byte"** đo sau khi chuẩn hoá id build và tên chunk (tên chunk theo nội dung, đổi vì thêm lớp CSS); hai trang admin so phần DOM bỏ `<script>` vì payload RSC đánh số lại khi thêm một liên kết.
- **TC-20** đo trong vùng nội dung chính, không tính Header và Footer cửa hàng.
- **TC-1 (c)** đo 307 thay cho `forbidden`/`signed_out` (xem trên).
- **Phép đo hỏng của chính bộ đo, đã sửa và chạy lại:** dấu "không tìm thấy" của TC-21 nằm sẵn trong payload RSC của mọi trang (đọc DOM thay vì thân HTML); nhật ký truy vấn của TC-14 ban đầu mù vì `ALTER SYSTEM` bị từ chối với vai `postgres` (đối chứng bắt được, chuyển sang `supabase_admin`); bản vá đối chứng "bỏ cả hai lớp kiểm" ban đầu có biểu thức xoá mọi ký tự nên mọi ca dội về `books_price_check`; ngưỡng "tuổi entry < 55 s" ở bộ đo cache loại nhầm mọi lượt của lần chạy thử đầu bản đối chứng; lần đo đầu trên preview hỏng vì bấm lưu trước khi form hydrate trong cửa sổ Edge nền (form gửi kiểu GET; 1 sách mốc dư, xoá ngay).
- **Lệch có sẵn, ngoài phạm vi đợt, không sửa ở đây:** mục 4 của file này (dòng "Thứ tự") còn xếp 5B là việc sắp làm; FR-6.4 và FR-7.4 của SRS còn câu "trạng thái đích, chưa cài" của đợt 5A dù migration `20261003063859` đã áp.

**Hai việc ghi nhận cho đợt 1.6 (không phải việc của 5B, chưa làm):**
1. **Preview và production dùng chung một database hosted** (`xnqfswvtrgfokkhsrmkx`; bundle của preview trỏ vào cùng URL Supabase). Mọi lần ghi khi đo ở preview nằm trong database mà production cũng đọc, với cache 60 giây. Lần đo 5B trên preview để 5 cuốn `Thử5B-VC` trong database khoảng 12 phút (từ lần chèn đầu tới lúc xoá); production không được đọc trong lúc đó nên chưa đo cuốn nào có hiện trên trang thật hay không. Hướng sửa: tách database cho preview.
2. **Form admin không có progressive enhancement.** `components/admin/BookForm.tsx` gắn `onSubmit` phía client (`<form onSubmit={handleSubmit} noValidate>`), không dùng `<form action={serverAction}>`, và form không có `action` hay `method`. Bấm "Lưu" trước khi trang hydrate xong thì trình duyệt gửi form kiểu GET tới chính URL: không lưu gì và đẩy giá trị các ô lên URL (`/admin/sach/moi?title=…&slug=…`). Đo được ở lần đo đầu trên preview, trong cửa sổ Edge nền nơi Chrome trì hoãn hydrate khối Suspense; chưa đo trên trình duyệt người dùng thật. Hướng sửa cần chọn: chuyển sang `<form action>` gắn Server Action, hoặc giữ `onSubmit` và vô hiệu nút Lưu tới khi hydrate xong.

**Điều kiện còn lại (đã kiểm và chưa kiểm):** cache (`updateTag`) đã kiểm trên bản `next start` cục bộ (45/45; đối chứng 30/30), trên Vercel preview của PR #22 (15/15: thêm 5, sửa tên 5, nút "Đặt tồn kho về 0" 5) và trên production (6/6: thêm 3, sửa tên 3). **Nút "Đặt tồn kho về 0" (`setBookOutOfStock`) chưa kiểm trên production:** nút chỉ hiện ở cuốn đã có đơn nên phép đo đòi một đơn trong database, và chủ dự án quyết định không tạo đơn giả trên database thật; nút đã đạt ở cục bộ (5/5) và preview (5/5), và cả bốn action dùng chung một lời gọi `updateTag("books")` nên `createBook` và `updateBook` đã phủ tính chất cần chứng minh. Ghi chú để đối chiếu: preview dùng cùng database hosted, nơi lần đo trên preview đã tạo 5 đơn `cancelled` tạm rồi xoá (xem trên).

### 7.11 Đợt seed dữ liệu demo (06/10/2026)

Spec `docs/specs/dot-seed-du-lieu-demo.md` v1.8 (7 FR, 10 tiêu chí). Một chặng, nhánh `dot-seed-du-lieu-demo`, 16 commit trước commit của mục này. Không migration, không đổi schema, không đổi `app/`, `components/`, `lib/`, không thêm dependency (`package.json` và `package-lock.json` không đổi). Commit: spec v1.1 → v1.8 `2b33fc3`, `4d150d0`, `1b31214`, `3228fa1`, `1ffb252`, `90343a4`, `f15e881`, `a638aa5`; vector, kế hoạch và bảng hình dạng metadata `4e060da`, `f21a0e7`, `038ef4e`, `15612d3`; script `857f0e1`; README `a24be90`; runbook hosted `c0e6a02`; runbook cục bộ và `CLAUDE.md` `6998053`. File mới: `scripts/seed-demo.mjs` (637 dòng), `scripts/seed-demo/{plan.json, stock-vector.json, metadata-shapes.md, README.md}`, `docs/runbooks/chay-seed-demo.md`. File có sẵn sửa: `.env.local.example` (+2 tên biến, giá trị rỗng), `CLAUDE.md` (+1 dòng), `docs/runbooks/supabase-local.md`.

**Điều kiện đo:** stack Supabase cục bộ (CLI 2.118.0, 12 container) sau `supabase db reset` (19 migration + `seed.sql`); SQL trực tiếp bằng `docker exec supabase_db_book-store-website psql -U postgres`; `--apply` chạy 4 lần (lần 1; lần 2 để đo TC-S.1; hai lần dựng lại cho TC-S.5). Mốc trước `--apply` lần 1: `books` 40, tồn kho 0 là 4, tổng 835, `auth.users` / `orders` / `events` 0, md5 `books` trừ `stock_quantity` `1f65fa33a015e5bdd0eecae5fa7c8d5c`, `order_code_seq.last_value` 1.

| Tiêu chí | Số lượt, cỡ mẫu | Kết quả |
|---|---|---|
| TC-S.1 chạy lại không đổi gì | 1 lượt `--apply` lần 2; 6 số + md5 | 6/6 số giống hệt (25 / 42 / 84 / 1897 / 737 / 4), md5 `books` giống hệt; `skipped_existing` 42; log có dòng "đã có dữ liệu demo, bỏ qua bước đặt tồn kho" |
| TC-S.2 gỡ về đúng vector | 2 lượt `--teardown`; 40 ô | ô khác vector 0/40 cả hai lượt; sum 835; 4 slug ở mức 0 đúng là 4 slug có V = 0; tài khoản, `orders`, `order_items`, `events` đều 0; md5 `books` trước = sau |
| TC-S.3 đảo thứ tự xoá | 3 lượt đảo + 1 đối chứng | 3/3 `23503`: lượt 0 và 1 vi phạm `orders_user_id_fkey`, lượt 2 vi phạm `events_user_id_fkey`. Đối chứng đúng thứ tự (`orders` → `events` → tài khoản): `DELETE` 42 / 1897 / 25, thành công. Sau cả bốn lượt: 25 / 42 / 1897 |
| TC-S.4 trigger trạng thái và mệnh đề `WHEN` | (a) 3 lượt + 1 đối chứng; (b) 3 lượt + 1 đối chứng | (a) 3/3 `P0001` `CHUYEN_TRANG_THAI_KHONG_HOP_LE`, detail `pending -> completed`; đối chứng `pending → processing`: `UPDATE 1`. (b) 3/3 `UPDATE 1`, tồn kho đổi ở 0/2, 0/1, 0/3 sách trong đơn; đối chứng hủy một đơn `pending`: tồn kho đổi ở 1/1 sách |
| TC-S.5 bước đặt lại vector là bắt buộc | 2 lượt biến thể bỏ bước 4; 40 ô | cả hai lượt: 36/40 ô khác vector, 4/40 khớp, sum 737 < 835. Đối chứng (`--teardown` đầy đủ, TC-S.2): 0/40 ô khác vector |
| TC-S.6 tài khoản | 1 lượt; 25 tài khoản | đủ 5 trường 25/25; email `@example.com` 25/25; 10 tỉnh khác nhau |
| TC-S.7 đơn | 1 lượt; 42 đơn | 6 / 5 / 5 / 18 / 8 (`pending` / `processing` / `shipped` / `completed` / `cancelled`); 7 nhóm tháng × 6 (giờ +07); `created_at` ở tương lai 0; `confirmation_email_sent_at` có giá trị 38; mốc 2026-04-03 09:17 → 2026-10-05 17:54 (+07) |
| TC-S.8 sự kiện | 1 lượt; 1.897 dòng | 1200 / 360 / 150 / 60 / 42 / 25 / 60; ẩn danh `page_view` 85,0%, `search` 85,0%; `order_placed` khớp đơn 42/42; `checkout_started` không sớm hơn `order_placed` cùng số: 0; `seed_ref` trùng 0. Số do `--verify` của script: `checkout_started` khớp đơn 42/42, bỏ dở hợp lệ 18/18, 325 `session_id` khác nhau, 6 từ khoá cho 0 kết quả |
| TC-S.9 sách | 1 lượt; 40 sách | md5 `books` trừ `stock_quantity` trước = sau; 4 slug ở mức 0 đúng là 4 slug V = 0; 835 − 737 = 98 = tổng `quantity` của `order_items` thuộc đơn khác `cancelled` (98); tồn kho âm 0 |
| TC-S.10 không rò bí mật, không đổi schema | 1 lượt mỗi phép | `grep` giá trị khoá trong `scripts/`: 0 dòng (đối chứng file giả: 1). `next build` rồi `grep "SERVICE_ROLE\|SECRET_KEY" .next/static`: 0, bằng mốc 0 (đối chứng file giả: 1). `git diff origin/main...HEAD` không chạm `supabase/migrations/`, `package.json`, `package-lock.json`, `app/`, `components/`, `lib/`. 19 file `.sql`. File có sẵn bị sửa: `.env.local.example`, `CLAUDE.md`, `docs/runbooks/supabase-local.md` |

**Thời gian và số đếm:** `--apply` lần 1: 9,5 giây (script), 11 giây (đồng hồ ngoài); lần 2 (bỏ qua cả 42 đơn): 2,5 giây (script), 4 giây (đồng hồ ngoài); lần dựng lại: 9,3 giây (script). 77 lệnh `UPDATE` trạng thái (5×1 + 5×2 + 18×3 + 8×1). `--dry-run`: 21 từ khoá tìm kiếm, 6 cho 0 kết quả. `order_code_seq`: 126 sau ba lần dựng, không reset.

**Chỗ phép đo yếu hơn tiêu chí gốc hoặc dựa trên giả định:**
- **TC-S.1:** "bỏ qua 42/42" là bộ đếm `skipped_existing` của chính script; phần đo độc lập bằng truy vấn là 6/6 số đếm và md5 giống hệt.
- **TC-S.3:** spec ghi một biến thể đảo thứ tự; đo 3 lượt (một lượt gốc, hai lượt tách từng khoá ngoại) để thấy cả `orders` lẫn `events` nổ.
- **TC-S.5:** biến thể viết bằng SQL trực tiếp (không qua script, không qua Admin API); bước xoá tài khoản là `delete from auth.users`.
- **TC-S.8:** 18 dòng `checkout_started` bỏ dở chỉ được kiểm `total_amount` > 0, `items_count` trong 1–3 và không có `order_placed` cùng số; "tính thật theo luật giá" không có phép đo. Các số lấy từ `--verify` của script chưa có bản đo SQL độc lập.
- **TC-S.10:** điều khoản "`.env.local.example` là file có sẵn duy nhất được đổi" không đúng: `CLAUDE.md` và `docs/runbooks/supabase-local.md` cũng sửa trong cùng nhánh.
- Mọi phép đo chạy trên stack cục bộ; chưa chạy lên hosted. `SEED_DEMO_PASSWORD` chỉ bắt buộc ở `--apply`; chốt `now() < 2026-10-06` chỉ chặn `--apply`, không chặn `--teardown` (khác chữ spec).

**TC-S.10 trượt, ghi nhận sau merge.** PR #23 merge (squash) vào `main` commit `6257f0e`; các hash liệt kê ở đầu mục này nằm trên nhánh `dot-seed-du-lieu-demo`, đã xoá sau squash. Tiêu chí gốc đòi: `grep` giá trị khoá trong `scripts/` = 0 dòng; `grep` `SERVICE_ROLE` và `SECRET_KEY` trong `.next/static` bằng con số mốc; `git diff` không chạm `supabase/migrations/`, `package.json`, `app/`, `components/`, `lib/`; 19 file `.sql`; và "`.env.local.example` là file có sẵn DUY NHẤT được phép đổi". Phép đo thực tế: `grep` khoá trong `scripts/` = 0 (đối chứng file giả: 1); `grep` `.next/static` = 0, bằng mốc 0 (đối chứng file giả: 1); 0 file trong các đường dẫn cấm; 19 file `.sql`; file có sẵn bị sửa = 3: `.env.local.example` (thuộc đợt), `CLAUDE.md` và `docs/runbooks/supabase-local.md` (việc hoãn từ trước, gộp vào đợt này). Bốn phép đo đầu đều đạt; điều khoản cuối không đạt. Điều khoản cuối không khả thi ở bất kỳ đợt nào: quy trình đóng đợt bắt buộc sửa mục 7 của chính file `docs/trang-quyet-dinh-dac-ta-tong.md`, mà điều khoản không tính tới file này. Spec không sửa.

### 7.12 Đợt 6 — dashboard thống kê (06/10/2026)

Spec `docs/specs/dot-6-dashboard-thong-ke.md` v1.1 (8 FR, 10 tiêu chí). Hai chặng, nhánh `dot-6-dashboard`, PR #24. Không thêm dependency (production = 5; `package.json` và `package-lock.json` không đổi). Commit: spec v1.0 `98a5db3`, migration `5a4d80f`, spec v1.1 `b323519`, `AdminNav` và `next.config.ts` `13d0ee4`, trang thống kê `5969efd`, mục menu `f2b730e`, SRS lên 1.14 (FR-7.7) `0452711`. File mới: `supabase/migrations/20261006164939_admin_dashboard_stats.sql` (163 dòng; tên file lúc tạo là `20261006154854`, đổi theo version hosted ở commit `bf665d0`), `app/admin/page.tsx` (163), `lib/admin/dashboard.ts` (58), `components/admin/RevenueChart.tsx` (48), `CategoryBars.tsx` (44), `FunnelChart.tsx` (39). File có sẵn sửa: `components/admin/AdminNav.tsx`, `app/admin/don-hang/page.tsx`, `app/admin/don-hang/[order_code]/page.tsx`, `next.config.ts`, `components/Header.tsx`, `components/AccountMenu.tsx`, `components/HeaderIcons.tsx`. `git diff --stat origin/main...HEAD` ở lúc mở PR: 14 file, 0 file ngoài danh sách cho phép của spec mục 0.

**Điều kiện đo:** stack Supabase cục bộ sau `db reset` và `scripts/seed-demo.mjs --apply` (42 đơn, 1.897 sự kiện, 25 tài khoản); chặng 2 đo trên `next build` + `next start` cổng 3100, Edge headless qua CDP. Migration chỉ tạo một hàm (`admin_dashboard_stats()`), không bảng, cột, trigger, policy, không `UPDATE`. Migration đã áp lên hosted ngày 06/10/2026 (version `20261006164939`, `prosecdef = false`, ACL gồm `postgres`, `authenticated`, `service_role`, không có `public` và `anon`; 20 → 21 migration); gọi hàm bằng vai `postgres` (không có `auth.uid()`) ném `KHONG_PHAI_ADMIN`. Phía trả dữ liệu cho admin chưa kiểm trên hosted (Claude Code không đăng nhập hosted).

| Tiêu chí | Số lượt, cỡ mẫu | Kết quả |
|---|---|---|
| TC-D.1 không import hàm `"use cache"` | 1 lượt quét cây import `app/admin/page.tsx` | 0 hàm. Đối chứng: thêm tạm `import { getNewestBooks }` → 1 hàm, `lib/queries.ts` vào cây; đã hoàn lại, `grep -c getNewestBooks` = 0 |
| TC-D.2 chặn người không phải admin | 3 + 3 lượt, PostgREST với JWT thật | vai thường (`nguoi-dung-01`): 3/3 HTTP 400 `KHONG_PHAI_ADMIN`; vai admin (`admin-demo`): 3/3 HTTP 200, đủ 5 khoá |
| TC-D.3 vỏ tĩnh không lộ chữ quản trị | `curl` `/admin` 3 + 3 lượt | chưa đăng nhập: 0/4 chuỗi, nhưng HTTP 307 (3/3); admin: 4/4 chuỗi, HTTP 200 (3/3) |
| TC-D.4 bốn KPI | 1 lượt, so 4 câu SQL | 4/4 khớp: doanh thu 9.575.000, số đơn 34 (42 − 8 hủy), giá trị đơn trung bình 281.618, khách đã mua 20. Đối chứng: DB có 42 đơn, RPC ra 34 |
| TC-D.5 doanh thu theo tháng | 1 lượt | 7 phần tử (2026-04 → 2026-10), 7/7 khớp SQL `date_trunc('month', created_at at time zone 'Asia/Ho_Chi_Minh')`, tổng = KPI |
| TC-D.6 phễu | 1 lượt | 1200 / 360 / 150 / 60 / 42, giảm dần ở cả 4 so sánh liền kề; `sign_up` 25 và `login` 60 nằm ngoài `steps` |
| TC-D.7 sách bán chạy | 1 lượt | `top_books` 10/10 và `category_sales` 5/5 khớp SQL; tổng 98 bản |
| TC-D.8 truy cập được | 4 khổ (390, 768, 1024, 1280) × 1 lượt | 3/3 biểu đồ có `role="img"` và `aria-label` không rỗng ở cả 4 khổ; vùng chạm dưới 44px: 0; cặp màu chữ 6, thấp nhất 5,92:1, 0 cặp dưới 4,5:1 |
| TC-D.9 không phình phạm vi | `git diff`, `package.json`, đếm file `.sql`, CLS ở 4 khổ × 1 lượt | dependency production 5; `package.json` và lock diff 0 dòng; migration 19 → 20; 14 file đổi, 0 file ngoài danh sách; CLS 0 ở 4 khổ |
| TC-D.10 mục "Khu quản trị" chỉ hiện với admin | 3 trạng thái × 2 lượt, DOM sau khi mở menu Tài khoản | admin 2 (cả hai `href="/admin"`) / `nguoi-dung-01` 0 / chưa đăng nhập 0 ở cả 2 lượt; HTML thô 0 ở cả ba |

**Đối chứng và hai phía:** TC-D.1 1 (có import) so 0 (thật). TC-D.2 3/3 từ chối so 3/3 trả dữ liệu. TC-D.3 0/4 so 4/4. TC-D.10 2 so 0 và 0. TC-D.4: bộ lọc `status <> 'cancelled'` có chạy (42 đơn, RPC ra 34). Không có đối chứng nào "đạt" ở phía ngược lại.

**Chi phí FR-D.8** (truy vấn `profiles.role` ở `AccountItem` cho người đã đăng nhập; trang chủ có cookie admin, cục bộ, 10 lượt mỗi phía, đếm ở nhật ký Kong): `/rest/v1/` 1 → 2 lời gọi mỗi lượt, `/auth/v1/` 1 → 1; TTFB trung vị 68,4 → 66,1 ms (trong nhiễu của phép đo). Chi phí trên hosted là ước tính hosted 12,5 ms (một vòng PostgREST, trung vị ở mục 5.2), không phải số đo.

**Chỗ phải ghi trung thực:**
- **Mục 0.1 của spec chia chặng SAI.** Spec ghi D.6 ở chặng 2 và bỏ sót D.2 và D.4. Danh sách đúng của chặng 2 là FR-D.1, D.2, D.3, D.4, D.5, D.7, D.8; D.6 (RPC) xong ở chặng 1. Spec không sửa vì đã hết lượt sửa tự đặt.
- **TC-D.3, phép đo yếu hơn tiêu chí gốc.** Tiêu chí gốc đòi `curl` `/admin` khi chưa đăng nhập cho thấy vỏ tĩnh không chứa chữ quản trị. Phép đo thực tế: 3 lượt `curl` chưa đăng nhập đều nhận HTTP 307 từ `proxy.ts` (không có vỏ tĩnh nào của `/admin` đến được khách vãng lai), nên 0/4 chuỗi chỉ chứng minh trang chuyển hướng, không chứng minh vỏ tĩnh sạch. Tính chất "vỏ tĩnh không lộ chữ quản trị" không được kiểm ở `/admin` cho khách vãng lai.
- **CLS = 0, phép đo yếu hơn tiêu chí gốc.** Đo trong khung 900px nên chân trang bị đẩy xuống nằm ngoài tầm bộ đo; baseline với fallback nhỏ hơn nội dung cũng ra 0 (đối chứng không phân biệt được), nên 0 không chứng minh được fallback đúng. `min-h` của fallback được chỉnh theo chiều cao đo được của khối thống kê: 2368 / 2275 / 1904 / 1913 px ở 390 / 768 / 1024 / 1280.
- **TC-D.9, "HTML hai trang admin cũ đổi đúng ở dải `AdminNav`"** chỉ kiểm bằng `git diff` mã nguồn (mỗi trang chỉ thêm `current="orders"`), không so HTML trước và sau.
- **TC-D.10, phía chưa đăng nhập** không có nút "Tài khoản" để mở (header hiện "Đăng nhập"); phép đo là đếm chuỗi trong DOM trang chủ.
- **Chưa dựng được ảnh `/admin` khi DB không có đơn** (phải xoá dữ liệu mẫu): trạng thái rỗng chưa được quan sát, chỉ có mã.
- **Một lỗi thật được bắt trong lúc đo:** ở 390px, `/admin` rộng 498px vì một cột lưới `auto` bị tên sách dài kéo giãn; sửa bằng `grid-cols-1`, đo lại thấy 390px.
- **Tác dụng phụ của bộ đo:** đăng nhập admin và `nguoi-dung-01` qua giao diện ghi sự kiện `login` thật (35 dòng qua hai lần dọn, 28 + 7); đã xoá, bảng `events` về 1200 / 360 / 150 / 60 / 42 / 25 / 60.

### 7.13 Đợt 7 — README cho nhà tuyển dụng (07/10/2026)

Spec `docs/specs/dot-7-readme-nha-tuyen-dung.md` v1.1 (6 FR, 6 tiêu chí; sửa một lần, xem dưới). Một chặng, nhánh `dot-7-readme`, PR #25, squash `eaddf67`. Không đổi mã ứng dụng, không migration, không thêm dependency (`package.json` và `package-lock.json` không đổi). Commit trên nhánh (đã xoá sau squash): spec v1.0 `85e7006`, spec v1.1 `f9048d4`, README `b498314`. File đổi: `README.md` (từ 20 byte lên 13.882 byte), `docs/specs/dot-7-readme-nha-tuyen-dung.md` (mới).

**Điều kiện đo:** không Docker, không đăng nhập hosted. Hai script kiểm (`check_readme.py` cho TC-R.2, `check_links.py` cho TC-R.3) nằm ngoài repo và không commit. Số liệu dữ liệu demo trên hosted (25 tài khoản, 42 đơn trải 7 tháng, 1.897 sự kiện) do chủ dự án cung cấp, README không đo lại chúng.

| Tiêu chí | Số lượt, cỡ mẫu | Kết quả |
|---|---|---|
| TC-R.1 đủ bảy phần, đúng thứ tự | 1 lượt đếm `^## ` | 7/7 (Đây là gì, Thử trong 2 phút, Vì sao từng quyết định, Kiến trúc, Chưa làm gì và vì sao, Chạy cục bộ, Bản đồ tài liệu); 0 phần thừa; 1 tiêu đề `#` |
| TC-R.2 mọi con số có nguồn | 1 lượt; 50 claim | 50/50 claim khớp nguồn; 0 chữ số không có claim |
| TC-R.3 mọi liên kết mở được | 10 liên kết ngoài, 11 đường dẫn nội bộ, 1 lượt | liên kết ngoài: 7 trả 200, 3 trả 307 về `/dang-nhap` (`/admin`, `/tai-khoan/don-hang`, `/thanh-toan`, cần phiên); đường dẫn nội bộ 11/11 tồn tại |
| TC-R.4 không rò dữ liệu cá nhân | 1 lượt mỗi phép | `grep -nE "gmail\.com\|[0-9]{9,11}"` (bản đã sửa): 0 dòng; email duy nhất `admin-demo@example.com`; 0 số điện thoại; mật khẩu công bố không trùng mật khẩu seed cục bộ |
| TC-R.5 độ dài | `wc -w`, 1 lượt | toàn file 2.067 từ (ngưỡng ≤ 2.500); ba phần lướt 735 từ (R.1 152, R.2 317, R.5 266; ngưỡng 500–900); sáu quyết định 109–140 từ mỗi mục (ngưỡng 80–150) |
| TC-R.6 không phình phạm vi | `git diff --stat origin/main...HEAD`, 1 lượt | 2 file (`README.md` và spec đợt 7); 0 file trong `app/`, `components/`, `lib/`, `supabase/`, `docs/SRS.md`, `package.json`, `package-lock.json`. Đạt theo v1.1; trượt theo nguyên văn v1.0 ("đúng 1 file") |

**Đối chứng, kết quả cả hai phía:**
- **TC-R.2:** README thật 50/50 claim, 0 số không nguồn. Ba bản cố ý sai, mỗi bản 1 lượt: `20 migration` → `21 migration` ra LỆCH (đếm repo ra 20); `30/30` → `31/31` ra THIẾU và 1 số không nguồn; thêm `99 người dùng` ra 1 số không nguồn. Bắt 3/3. Hash README trước và sau khi hoàn lại giống nhau.
- **TC-R.3:** README thật 0 lỗi. Bản thêm 1 URL 404 (`/khong-co-trang-nay`) và 1 đường dẫn giả (`docs/runbooks/khong-ton-tai.md`) ra 2 lỗi, cả hai bị báo. Hash README trước và sau khi hoàn lại giống nhau.

**Bảng con số quy mô đếm từ repo (nguồn của TC-R.2):**

| Con số | Giá trị | Lệnh |
|---|---|---|
| Trang | 18 | `find app -name page.tsx \| wc -l` |
| Route handler | 1 | `find app -name route.ts \| wc -l` |
| Migration | 20 | `ls supabase/migrations/*.sql \| wc -l` |
| Bảng (đều bật RLS) | 11 | `create table` và `enable row level security` trong `supabase/migrations/`, hai tập trùng nhau |
| Dependency production | 5 | số khoá của `dependencies` trong `package.json` |
| Yêu cầu chức năng | 64 | `grep -c '^- \*\*FR-' docs/SRS.md` |
| File spec | 23 | `ls docs/specs \| wc -l` (đã tính spec của chính đợt này) |
| File runbook | 6 | `ls docs/runbooks \| wc -l` |

**Chỗ phải ghi trung thực:**
- **Spec v1.0 có bốn khẳng định sai so với repo**, đã sửa bằng đúng một lần sửa spec cho phép, lên v1.1 (`f9048d4`): (1) bảng công nghệ ghi Supabase Storage, repo dùng 0 lần (0 tham chiếu `storage` trong `app/`, `components/`, `lib/`, 0 trong `supabase/migrations/`); (2) "số đo 12 đợt": mục 7 có 12 mục `7.x`, trong đó một mục là rà soát accessibility, không phải đợt; (3) "22 file spec": `docs/specs/` có 23 file sau khi commit chính spec này; (4) TC-R.6 "đúng 1 file đổi" không đạt được, vì đợt phải commit chính spec của nó vào `docs/specs/`.
- **TC-R.6 lặp lại cùng loại lỗi với TC-S.10 của đợt seed (mục 7.11):** tiêu chí phạm vi không tính tới quy trình đóng đợt. Khác biệt: lần này phát hiện TRƯỚC khi đo và trước khi đóng đợt, nên sửa được tiêu chí (nguyên văn v1.0 và bản v1.1 đều ghi trong spec); ở đợt seed phát hiện sau khi đã có kết quả, nên giữ nguyên là trượt.
- **Lệnh grep của TC-R.4 trong spec là phép đo hỏng.** `\|` trong ERE là ký tự `|` theo nghĩa đen, nên bản cố ý nhiễm `abc@gmail.com` và một số điện thoại vẫn ra 0 dòng (đối chứng). Thay bằng `|`: bản nhiễm ra 1 dòng, README thật ra 0 dòng.
- **Ba chỗ README nói khác spec, đều theo hướng chính xác hơn:** FR-R.4 đòi "ba lớp bảo vệ" nhưng SRS FR-7.1 và mục 5.1 ghi "hai lớp", nên README nêu ba tầng theo tên và không đếm lớp; FR-R.3 ghi "kiểm được bằng test trong repo" nhưng repo chỉ có script `scripts/send-test-confirmation.mjs`, nên README ghi "script"; phép so mật khẩu công bố với `SEED_DEMO_PASSWORD` yếu hơn tiêu chí gốc, vì biến đó của hosted không có trên máy: chỉ so được với mật khẩu seed cục bộ (không trùng, so sánh không in), mật khẩu hosted chưa so.
- **Số từ phụ thuộc cách đếm:** `wc -w` ra 2.067, đếm bằng tách khoảng trắng trong Python ra 2.005; cả hai nằm dưới ngưỡng, bảng trên dùng `wc -w` như spec đòi.

## 8. Bài học đã rút ra (giữ lại để không lặp)

**Về tiêu chí nghiệm thu**

- **Tiêu chí nghiệm thu phải đo được bằng số.** "Tăng mật độ", "tạo nhịp", "hiện đại hơn" là chữ mô tả cảm giác, mỗi bên hiểu một kiểu và kết quả luôn hụt.
- **Tiêu chí dùng selector phải nêu selector chỉ khớp đúng trạng thái đang kiểm, và phải có đối chứng ở trạng thái ngược lại.** Đối chứng cũng "đạt" nghĩa là phép đo hỏng, không phải mã đạt. Bài học từ tiêu chí 8: selector `button[aria-haspopup]` khớp cả nút menu điều hướng, nên báo cáo "5/5 đạt" là vô giá trị.
- **Tiêu chí không được mô tả cách triển khai.** "`querySelector` trả `null`" là một ràng buộc kiến trúc đội lốt tiêu chí hành vi: nó buộc phải gỡ phần tử khỏi DOM bằng JS, loại mất phương án `display: none` vốn tương đương với người dùng mà không cần JS và không gây dịch chuyển. Viết tiêu chí theo thứ người dùng trải nghiệm (khả kiến, focusable, screen reader đọc được), không theo thứ nằm trong DOM.
- **Với một lỗi phụ thuộc timing, phải chạy đúng script đo đó trên commit trước khi sửa.** Baseline không tái hiện được lỗi nghĩa là phép đo hỏng hoặc môi trường không đủ điều kiện — không được kết luận "đạt".
- **Khi đóng một tiêu chí bằng phép đo yếu hơn tiêu chí gốc, ghi rõ cả hai:** tiêu chí gốc đòi gì, phép đo thực tế làm gì, số mẫu bao nhiêu. Không ghi "đã xử lý" trống không.
- **Mọi ngưỡng phần trăm phải lớn hơn độ nhiễu đo được của chính phép đo đó.** Đo độ nhiễu trước khi đặt ngưỡng.
- **Một chỉ số đã nằm sâu dưới ngưỡng thì không phân biệt được đạt và trượt.** CLS 0,0002 so với ngưỡng "tốt" 0,1 là nhiễu, không phải kết quả. Tiêu chí CLS = 0 của 2B.2 đạt một phần vì may.
- **Khi so hai nhánh mã, selector và script phải giống hệt nhau ở cả hai phía.** Không thay được selector ở phía cũ thì phải nói rõ đã thay gì, và chỉ ra selector nào lệch về phía kết quả mong muốn.
- **Tiêu chí phải đặt sau khi chốt kiến trúc, không phải trước.**
- **Tiêu chí cho đợt tính năng là assertion chức năng, không phải đo timing.** Giỏ hàng và checkout hỏng vì logic (merge sai, trừ kho sai, tổng tiền sai), không vì timing.
- Với mỗi tiêu chí, trả lời trước một câu: *"lệnh nào cho ra con số này?"* Không trả lời được thì đó chưa phải tiêu chí.
- **Phép đo trong một khung cố định không thấy phần nằm ngoài khung.** CLS của đợt 6 đo trong khung 900px nên chân trang bị đẩy ra ngoài tầm bộ đo và không được tính; "CLS = 0" khi đó là kết quả của khung, không phải của trang. Cách chữa: đặt chiều cao khung theo chiều cao THẬT đo được của trang (2368 / 2275 / 1904 / 1913 px ở bốn khổ), rồi mới đo.
- **Tiêu chí về phạm vi thay đổi phải tính tới quy trình đóng đợt.** TC-S.10 của đợt seed cấm sửa mọi file có sẵn trừ `.env.local.example`, nhưng quy trình đóng đợt BẮT BUỘC sửa mục 7 của chính file quyết định — nên tiêu chí đó không đạt được ở bất kỳ đợt nào, kể cả một đợt hoàn hảo. Đã giữ nguyên kết quả TRƯỢT thay vì sửa tiêu chí sau khi đã thấy kết quả; bốn phép đo thực chất bên trong nó (grep khoá trong `scripts/`, grep `.next/static` so với mốc, 0 file trong đường dẫn cấm, 19 migration) đều đạt, hai lệnh grep có đối chứng file giả.

**Về cách đọc số đo**

- **Số request trong DevTools cộng dồn khi bật "Preserve log".** Mọi con số request phải ghi rõ là **một lượt tải** hay **tích luỹ**.
- **So sánh phải cùng điều kiện.** `HIT` không so được với `STALE`; khác trạng thái đăng nhập không so được; khác vùng không so được. Không so công bằng được thì nói thẳng thay vì báo một con số đẹp.
- **Luôn ghi số mẫu.** Một mẫu thì kết luận là "không hồi quy", không phải một con số phần trăm.
- **Chênh lệch nhỏ hơn khoảng dao động giữa các lần đo mốc thì chỉ cho biết hướng**, không cho biết độ lớn.
- **Cộng cho đủ trước khi gọi một hiện tượng là hiếm.** Con số "1/23 lượt" của đợt 3A thực ra là **4/35** khi cộng hết các lần đo; cái sai đến từ việc chỉ lấy lần đo cuối.
- **Đừng viết "ở mọi phép đo" khi có một phép đo đi ngược.** Nêu ngoại lệ ra, kèm giải thích và ghi rõ giải thích đó đã kiểm hay chưa.
- **Một phép thử bật–tắt chỉ chứng minh được "không phải điều kiện đủ", không chứng minh được "không liên quan".**
- **Bằng chứng trái chiều mạnh hơn bằng chứng thuận chiều.** Nêu giả thuyết thì nêu kèm **phép đo để bác bỏ nó**.
- **Đừng biến một quan sát đúng thành một khẳng định về cách dùng mà chưa đọc tài liệu.** "Request prefetch mang header X" là quan sát; "nên dùng header X để tách prefetch" là khẳng định về khả năng — và nó sai, vì Next xoá header đó trước khi gọi proxy.
- **Đừng phát biểu cơ chế như sự thật rồi lấy nó làm cơ sở quyết định.** "Response GET mang `Set-Cookie` thì CDN không lưu" là một mệnh đề chưa đọc tài liệu. Quyết định chỉ an toàn vì phương án đã chọn không bao giờ tệ hơn phương án kia, dù mệnh đề đúng hay sai — và phép đo được giữ lại để kiểm, không để biện minh.
- **Vá một lỗ có thể đào ra lỗ kế tiếp; khi bản vá thứ hai lại đẻ ra lỗ thứ ba thì vấn đề nằm ở gốc, không ở chỗ vá.** Luật "lùi `created_at` chỉ cho đơn vừa tạo trong lần chạy này" chữa được việc chạy lại khác ngày, nhưng đẻ ra lỗ "đơn của lần chạy dở không bao giờ được lùi". Sửa gốc là bỏ hẳn sự phụ thuộc vào ngày chạy: neo cửa sổ thời gian vào hai ngày hằng số, để `created_at` thành hàm thuần của số thứ tự và bước lùi thành phép gán tuyệt đối.

**Về cách làm việc với Claude Code**

- **Khi Claude Code bác lại chẩn đoán và đưa ra bằng chứng đo được, nó thường đúng.** Mẫu hình này đã lặp nhiều lần. Hệ quả: phía project chat suy luận từ kiến trúc, Claude Code đo từ hệ thống thật; khi hai bên lệch thì **số đo thắng**.
- **Claude Code cũng tự sửa mình khi có số đo mới** — hành vi cần khuyến khích, không phải dấu hiệu thiếu tin cậy.
- **Trước khi ghi đè một file trong `docs/specs/`, phải đọc bản hiện có và báo cáo những mục sẽ mất.** Không xoá mục nào mà không hỏi, kể cả khi prompt nói "chép nguyên văn".
- **Khi hai tiêu chí trong spec không thể cùng thỏa, sửa spec** — đừng ép nó chọn bừa rồi giấu phần không đạt.
- **Khi mã buộc phải khác spec lúc triển khai, sửa spec cho khớp mã ngay trong đợt.** Để lệch thì lần sau không ai biết bản nào đúng.
- **Trước khi đặt một tiêu chí thành việc kiểm tay, hỏi: "Claude Code thật sự không làm được, hay chỉ là tôi chưa nghĩ cách?"** Một phép đo thủ công kém hơn phép đo tự động sẵn có thì không được đưa vào tiêu chí.
- **Một quy tắc nên gắn hai thứ vào nhau, đừng viết thành hai con số.** Thanh đáy ở 1024px và footer thu gọn ở 768px tạo ra một dải 256px mà trang hành xử nửa nọ nửa kia. Gắn cả hai vào một breakpoint đặt một chỗ thì chúng không trôi khỏi nhau được.
- Mọi lệnh commit/push phải dùng **đường dẫn tường minh**, không `git add -A`, và kiểm `git status` trước khi stage. Luật này đã thực sự cứu một lần: một thay đổi chưa commit của file quyết định nằm trong working tree suốt 7 ngày, xuyên qua nhiều lần tạo nhánh, mà không lọt vào commit nào.
- **Không bao giờ giết mọi tiến trình Node** (`taskkill /IM node.exe`). Dừng theo PID đã ghi hoặc theo cổng đang nghe.
- Việc gì Claude Code chạy được bằng lệnh thì đưa vào prompt, đừng bắt người dùng gõ tay. Chỉ những thứ nó thật sự không làm được (dashboard Vercel, Docker Desktop, đánh giá thị giác) mới thành bước thủ công.
- **Prompt nên trỏ tới mục spec thay vì chép lại nội dung spec** — nó đọc được repo, chép lại chỉ tốn token hai lần.
- Yêu cầu nó mở đầu phần báo cáo cuối bằng một dòng đánh dấu, để phần tự thuật tiến độ không bị mang sang chat khác.

**Về kiểm thử**

- **Kiểm tra bằng ảnh chụp toàn trang thu nhỏ**, không chỉ ảnh cận cảnh.
- **Có loại lỗi chỉ lộ trên hosted.** Ở local, app và database cùng ở `127.0.0.1` nên một chuỗi 30 truy vấn nối tiếp tốn 30 ms và hoàn toàn vô hình; cùng chuỗi đó trên hạ tầng thật thành 4 giây. **Một bước kiểm thủ công trên bản deploy thật phát hiện được nhiều hơn toàn bộ phần đo tự động ở local.**
- **Và ngược lại: có loại hiện tượng chỉ có ở local** (HTTP/1.1 so với HTTP/2). Trước khi sửa một hiện tượng đo được ở local, kiểm xem nó có tồn tại trên hosted không.
- **Kiểm hạ tầng trước khi tối ưu mã.**
- `requestAnimationFrame` trong trình duyệt tích hợp chạy ~2 Hz nên mọi phép đo theo frame đều vô dụng. Dùng trình duyệt thật (Edge headless qua CDP) với `MutationObserver` và `PerformanceObserver`.
- Thiết lập trên dashboard mà chưa ai kiểm bằng lệnh thì coi như chưa biết. "Confirm email" bật sai suốt từ đầu và chỉ lộ ra khi chạy script kiểm.
- **Thiết lập máy có thể biến mất giữa chừng, và phát hiện muộn thì cả kế hoạch đo phải viết lại.** Ngày 06/10 toàn bộ stack Supabase cục bộ đã không còn: không CLI, không image, không container, chỉ còn volume rỗng. Spec lúc đó đã có mười tiêu chí đều đo trên local. Một prompt kiểm môi trường mất 5 phút phát hiện ra điều này **trước** khi viết thêm một phiên bản spec nữa. Quy tắc: trước khi chốt tiêu chí phụ thuộc môi trường, kiểm môi trường đó còn sống không.

**Về tài liệu**

- **Tài liệu cũng lệch được mà không ai thấy.** Bản repo của chính file này lệch bản gốc 7 ngày (24/09 trong git, 29/09 trên đĩa, 01/10 ở bản gốc), ghi sai bảng màu và sai font, trong khi repo là public và đây là file nhà tuyển dụng đọc. `git status` có báo suốt thời gian đó. Hệ quả: đồng bộ file này là một bước có tên trong quy trình đóng đợt, không phải việc nhớ thì làm.
- **Khi hợp nhất hai bản của một tài liệu, hãy ghép cơ học, đừng dựng lại từ báo cáo.** Bản hợp nhất sau đợt 3A được viết lại mục 7 từ báo cáo thay vì giữ nguyên bản trong git, và làm mất hơn hai chục số đo, cỡ mẫu và cảnh báo về selector. Phần nào đã có bản đúng thì cắt và dán phần đó, chỉ viết tay những phần thật sự mới.
- **Dòng "Cập nhật lần cuối" chỉ chứa ngày**, không có chú thích mô tả lần sửa. Chú thích mô tả sẽ lệch ở lần sửa kế tiếp; lịch sử nằm ở git log.
- **Spec sửa tám lần trong một ngày là dấu hiệu viết trước khi đọc, không phải dấu hiệu cầu toàn.** Spec đợt seed đi từ v1.0 tới v1.8 trong một ngày; chỉ một hai lần do mã thật buộc phải đổi, phần còn lại là tham chiếu mục SRS sai, tên biến môi trường sai, tiêu chí tự mâu thuẫn, và vá chồng lên vá. Mỗi lần sửa kéo theo một lượt Claude Code đọc lại, sửa lại, commit lại. Cách chặn: **đọc hết mã mà spec chạm vào TRƯỚC khi viết dòng đầu tiên**; nêu giới hạn gồm cả số lần được phép sửa; sau khi commit chỉ sửa khi Claude Code chứng minh mã không thỏa được, mọi thứ khác vào danh sách đợt sau.

**Về thiết kế và giao diện**

- Spec phải nói cả **mật độ và bố cục**, không chỉ giá trị token.
- Không animate `height` trên phần tử `position: sticky` — gây reflow toàn trang, chữ rung khi cuộn.
- **`position: sticky` chỉ dính trong khối chứa nó.** Khi nội dung ngắn hơn khung nhìn, thanh "dính đáy" bằng sticky nằm lửng giữa trang. Muốn dính đáy khung nhìn thì phải `fixed`, và khi đó `<body>` cần đệm đáy bằng đúng chiều cao thanh để không che nội dung cuối trang.
- Ngưỡng bật/tắt trạng thái theo scroll phải lệch nhau hai chiều, nếu không sẽ nhấp nháy quanh ngưỡng.
- Không tạo vùng cuộn riêng (`overflow-y: auto`) cho cột lọc; thà bỏ `sticky` còn hơn.
- Giao diện do AI sinh có dấu hiệu nhận biết rõ: nhãn viết hoa trên mỗi khối, mũi tên gắn sau link, mọi thẻ chung một bo góc và một khoảng cách. Spec phải chặn từng dấu hiệu bằng tên gọi cụ thể.
- **Thiếu hụt thị giác của site không nằm ở thẩm mỹ mà ở lớp hình ảnh.** Chính sách không dùng bìa bản quyền khiến toàn trang không có một pixel ảnh nào, nên 40 ô màu phẳng đọc ra là placeholder. Các đợt nâng cấp trước chữa bằng typography và layout nên luôn hụt. Cách chữa đúng là thêm một lớp ảnh atmosphere giấy phép mở, không phải gõ lại font.
- **Một tính năng chỉ vào được bằng cách gõ URL thì chưa coi là đã làm xong.** Khu quản trị chạy đủ từ đợt 5A và 5B, nhưng admin đăng nhập xong không có liên kết nào dẫn vào — phải gõ `/admin/don-hang` lên thanh địa chỉ. Lỗi lộ ra khi chủ dự án dùng thật, không lộ ra ở bất kỳ tiêu chí nào của hai đợt đó. Từ nay mỗi đợt thêm trang mới phải trả lời một câu trước khi đóng: *người dùng vào trang này bằng đường nào, và đường đó có nằm trong tiêu chí không?*
- **Một artboard cố định bằng đúng kích thước màn hình bị đọc là "toàn bộ trang".** Mockup mobile 390×844 không vẽ footer vì footer nằm dưới fold, và điều đó đã bị hiểu là "trang này không có footer". Khung một màn hình phải được ghi rõ trong README của thư mục mockup.

**Từ đợt 5B**

- **Đo chiều cao bằng font thay thế chỉ cho CHẶN TRÊN, không phải số thật.** Google Fonts bị proxy chặn nên bản đo trong container dùng DejaVu, dày hơn bản thật khoảng 24px ở 1280px và khoảng 42px ở 390px. Kẹp khoảng bằng hai font rộng và hẹp rồi lấy cận trên.
- **Giá trị enum của tweak trong Claude Design phải là slug ASCII.** Bản dùng tên tiếng Việt có dấu và khoảng trắng bị editor chuẩn hoá, làm mọi `sc-if` so sánh trượt và artboard ra trang trống.
- **Phép đo cache phải nằm TRONG cửa sổ TTL và phải có đối chứng.** Chín hàm dùng `cacheLife("minutes")` nên đo sau 60 giây thì TTL tự làm phép đo đạt mà không chứng minh `updateTag` có tác dụng. Cách đúng: chèn một bản ghi mốc, xác nhận mốc chưa hiện (entry còn sống), ghi, đọc lại trong 10 giây, và chạy một bản gỡ `updateTag` để thấy dữ liệu cũ.
- **Preview và production dùng chung một database thì mọi lần ghi khi đo ở preview là ghi vào trang thật.**

**Từ khâu chuẩn bị đợt seed (06/10/2026)**

- **Một bất biến đo được chọn cho đợt chỉ-đọc sẽ sai ở đợt có ghi.** Bất biến phải chọn theo việc sắp làm, không bê nguyên từ đợt trước. Ví dụ: `xmin` lớn nhất của `books` là bất biến đúng khi đo cache ở 5B, nhưng sai ở đợt seed vì `place_order` có `UPDATE books`.
- **Trigger `BEFORE UPDATE` trên `orders` không chạy khi `DELETE`.** Xoá một đơn đã trừ kho sẽ không cộng trả, và đơn `completed` không chuyển sang `cancelled` được. Mọi kịch bản dọn dẹp đụng tới `orders` phải tính tồn kho riêng.

## 9. Việc cần bàn tiếp trong project

- **Ô "Nhập lại email"** — giữ nguyên, hay thay bằng gợi ý typo domain ("Ý bạn là …@gmail.com?"), hay bật lại xác nhận email. Hiện giữ nguyên; nghiêng về gợi ý typo cho đợt sau.
- **Khoá ngoại `events.user_id` và `orders.user_id` đang là ON DELETE NO ACTION**, nên chặn việc xoá user. Với bảng analytics, cách thường dùng là **SET NULL** (giữ sự kiện, bỏ danh tính). Quyết khi làm chức năng xoá tài khoản hoặc ở 2D.
- **Footer xuống layout theo route** — cách chữa đúng cho dịch chuyển bố cục ghi ở 7.4, gom vào đợt 1.6.
- **URL route động có dãy `%XX` hỏng hoặc `%25` trả HTTP 500** ở mọi route động (hiện có sáu route động; đo ở bốn: `/sach/[slug]`, `/tu-sach/[slug]`, `/thanh-toan/hoan-tat/[order_code]`, `/tai-khoan/don-hang/[order_code]` — đều 500; hai route còn lại, `/admin/don-hang/[order_code]` (đợt 5A) và `/admin/sach/[slug]` (đợt 5B), **chưa đo**). Lỗi xảy ra trước khi tới mã trang nên có từ trước, không do đợt nào gây ra; đường dẫn không động vẫn trả 404 đúng. Không lộ dữ liệu. Gom vào đợt 1.6.
- **Tách database cho preview (đợt 1.6).** Preview và production dùng chung một database hosted (`xnqfswvtrgfokkhsrmkx`), nên mọi lần ghi khi đo ở preview nằm trong database mà production cũng đọc, với cache 60 giây; ghi chi tiết ở mục 7.10. Chưa làm.
- **`BookForm` gắn bằng `onSubmit` phía client (đợt 1.6).** Form admin không có progressive enhancement: bấm Lưu trước khi trang hydrate xong thì form gửi kiểu GET tới chính URL, không lưu gì và đẩy giá trị các ô lên URL. Cần chọn giữa `<form action={serverAction}>` và vô hiệu nút Lưu tới khi hydrate xong; ghi chi tiết ở mục 7.10. Chưa làm.
- **Lớp ảnh atmosphere** — chọn nguồn, số lượng, đặt ở những trang nào. Gom vào đợt 1.6 mở rộng.
- **Repo có 19 file migration `.sql`, hosted báo 20.** Chênh 1 chưa giải thích được; mục 7 chỉ ghi dãy 17→18→19. Không chặn đợt nào vì mọi phép đo của đợt seed chạy trên local. Kiểm khi làm đợt 1.6 (tách database preview), bằng cách liệt kê migration hosted ở chế độ chỉ đọc.
- Persona chính trong 18–30.
- Logo chính thức.
- System prompt cho chatbot.
- Nội dung README cho nhà tuyển dụng.
- **11 việc accessibility còn mở** (3 Trung bình, 8 Thấp, 0 Cao) — danh sách và số đo ở `docs/specs/dot-accessibility-ra-soat.md`, sửa ở đợt accessibility. Không còn nợ mockup cho admin: khu quản trị lắp từ hệ layout đóng băng, đó chính là lý do hệ đó tồn tại.
- Viết lại mô tả 3 tủ sách bằng giọng của chủ dự án (nội dung hiện tại do AI viết).

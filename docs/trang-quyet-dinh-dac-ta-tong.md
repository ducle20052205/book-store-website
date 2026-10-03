# NA Books — Quyết định & Đặc tả tổng

> **Vai trò của file này:** nơi lưu những gì đã **thực sự chốt**, không phải nơi đưa ra quyết định mới. Project này đóng vai trò "chỉ huy": mọi quyết định về kiến trúc, thiết kế, tính năng và spec cho Claude Code được thảo luận và chốt trong các chat của project, sau đó cập nhật vào đây. Đọc file này trước khi trả lời để không hỏi lại hoặc mâu thuẫn với quyết định cũ — nhưng đừng coi mục "còn mở" là đã có hướng đi.
>
> **Ai được sửa phần nào.** Bản gốc là bản trong Claude.ai Project; file `docs/trang-quyet-dinh-dac-ta-tong.md` trong repo là bản đồng bộ. Claude Code **được sửa mục 7** (bảng tiến độ, số đo, số commit/PR) vì nó biết chính xác hơn. **Mọi mục khác chỉ chủ dự án ghi**, vì chúng chốt trong chat mà Claude Code không đọc được; thấy lệch thì báo cáo, không tự sửa. Mọi lần sửa file này là **commit riêng**, không gộp vào commit mã. Trong file chỉ ghi sự kiện và số đo kèm số mẫu — không có câu tự thuật tiến độ, không có đánh giá chất lượng công việc; file này sẽ nằm trong portfolio.
>
> **Hướng đồng bộ.** Bản gốc này giữ mục 1–6, 8, 9. **Mục 7 chỉ nằm ở repo**, do Claude Code ghi — bản gốc không giữ bản sao của nó. Khi dán bản gốc đè lên repo, phải nối lại mục 7 của repo bằng cách cắt–dán theo dòng, không viết lại. **`docs/SRS.md` chỉ nằm ở repo** — Project knowledge không giữ bản sao nào. Bản sao ở đó không có chủ sở hữu và đã lệch thật (v1.3 trong Project knowledge so với v1.5 trong repo, phát hiện 02/10). Cần đọc SRS thì gắn repo vào chat và đọc `docs/SRS.md`.
>
> **Cập nhật lần cuối:** 03/10/2026
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

### Thứ tự còn lại và định nghĩa "xong" (chốt 02/10)

**Thứ tự:** 3B checkout (gồm tỉnh/phường; email xác nhận qua API Brevo) → lịch sử đơn → admin (gồm các scenario Make.com) → 2C quên mật khẩu → 2D trang hồ sơ → seed dữ liệu demo → chữa N+1 trang chủ → dashboard thống kê → chatbot → đợt 1.6 → rà accessibility → README cho nhà tuyển dụng.

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
2. **Dashboard thống kê nâng cao cho admin:** doanh thu theo thời gian, sách bán chạy theo danh mục, phễu chuyển đổi (dùng bảng `events`).

## 5. Kiến trúc kỹ thuật (đã chốt)

| Lớp | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19.2 + Tailwind CSS v4 (không có config file) |
| Backend | Supabase — Postgres + Auth + Storage + Edge Functions |
| Automation | Make.com — lớp vận hành back-office (sổ đơn hàng, báo đơn mới, digest kho); làm ở đợt admin, **không gửi email cho khách** |
| Deploy | Vercel, nhánh `main` là production |

- **Database: 9 bảng**, tất cả bật RLS: `profiles`, `categories`, `books`, `cart_items`, `orders`, `order_items`, `events`, `collections`, `collection_books`. Đợt 3B sẽ thêm `provinces`, `wards` (thành 11).
- **Khoá ngoại tới `auth.users`:** `profiles` và `cart_items` là **CASCADE**; `events` và `orders` là **NO ACTION**. Hệ quả: không xoá được một user từng có sự kiện hoặc đơn hàng nếu chưa xoá tay các dòng đó trước — xem mục 9.
- **Quy tắc bắt buộc:** mọi thay đổi schema đi qua migration trong `supabase/migrations/`, apply bằng Supabase MCP, đặt tên file theo version Supabase ghi nhận. Không sửa trực tiếp qua Table Editor.
- Tìm kiếm theo tên sách và tác giả, không phân biệt dấu qua `unaccent`; toàn bộ lọc/sắp xếp/phân trang gói trong hàm RPC `search_books` (`SECURITY DEFINER` để tính "bán chạy" vượt qua RLS của `orders`).
- **Danh mục 2 tầng:** 5 danh mục cha (Văn học, Kinh tế, Tâm lý – Kỹ năng, Khoa học – Xã hội, Manga – Light novel), 17 danh mục con. Không có danh mục Thiếu nhi (ngoài nhóm tuổi mục tiêu).
- Route tiếng Việt: `/sach`, `/sach/[slug]`, `/tu-sach`, `/tu-sach/[slug]`, `/gio-hang`, `/thanh-toan`.
- **Email cho khách do ứng dụng gửi, không qua Make.com (chốt 02/10).** Email xác nhận đơn gọi **HTTP API Brevo** từ Server Action (không dùng SMTP — trong serverless đó là kết nối dài, chậm, thường bị chặn), `await` với timeout 4s rồi mới `redirect()`; `orders.confirmation_email_sent_at` ghi lại kết quả, null thì trang xác nhận nói thật thay vì "đang gửi". Lý do: email xác nhận là bước 4 của định nghĩa "xong", nên phải chắc chắn và kiểm được bằng test trong repo — hai thứ Make.com không cho.
  - **Quy tắc phân định: khách đang chờ thì app lo, cửa hàng dùng thì Make lo.** Không email nào gửi cho khách đi qua Make.
  - Make.com giữ lại với việc thật ở đợt admin: sổ đơn hàng Google Sheet, báo đơn mới qua Discord/Telegram (không Slack — cần workspace, phơi tài khoản cá nhân), digest sách `stock_quantity <= 3`, nhắc giỏ bỏ quên. Google Sheet sẽ chứa tên/SĐT/địa chỉ của người đặt thử, nên chỉ dùng dữ liệu demo.
  - **Chưa xác minh** gói Make miễn phí có cho webhook chạy tức thì hay ép chu kỳ tối thiểu. Ngưỡng chốt trước: email chậm hơn 2 phút ở 3 lần thử thì bỏ Make khỏi đường đó.
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
- **Supabase cục bộ:** CLI 2.118.0 cài ngoài repo, stack 5 container Docker, cấu hình ở `supabase/config.toml`. Cổng: Kong 54321, Postgres 54322, Mailpit 54324, app cục bộ 3100 (dev trỏ hosted vẫn 3000). Biến môi trường ở `.env.supabase-local` (git-ignore). Khoá ký JWT cục bộ đặt **ES256** để khớp hosted.
- **Lý do phải có stack cục bộ:** Claude Code không tạo/đăng nhập tài khoản trên hosted Auth (ranh giới an toàn của chính nó). Mọi kiểm thử cần phiên thật đều chạy trên `127.0.0.1`.
- **Cục bộ chạy HTTP/1.1 (giới hạn 6 kết nối mỗi origin), hosted chạy HTTP/2** (xác nhận: Edge nhận `h2` ở 36/36 response của preview; `curl` trên máy đó không hỗ trợ h2 nên báo nhầm HTTP/1.1). Khác biệt này tạo ra một hiện tượng chỉ có ở local — xem mục 7.1.
- **Giữ Supabase không bị tạm dừng:** free tier tạm dừng project sau 7 ngày ít hoạt động; đã có workflow GitHub Actions ping hằng ngày.

## 6. Dữ liệu mẫu

- 40 cuốn sách thật, chọn bằng cách đối chiếu bảng bán chạy của Fahasa, Nhã Nam, Alpha Books, IPM.
- **Nguyên tắc trung thực:** tên sách và tác giả là thật; ISBN, số trang, NXB, người dịch để trống vì không xác minh được; mô tả tự viết, không chép của nhà xuất bản. Footer ghi rõ "Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio."
- 16/40 cuốn có giảm giá, 4 cuốn hết hàng để demo đủ trạng thái UI.
- **Repo là PUBLIC.** Không bao giờ commit email cá nhân, API key hay mật khẩu — kể cả trong mockup, ảnh chụp, chú thích và tài liệu. Dữ liệu mẫu dùng `ban.doc@example.com` (domain dành riêng theo RFC 2606).
- **Bí mật chỉ nằm ở biến môi trường.** API key, webhook URL, token đặt ở Vercel environment variables và `.env.local`; **không dán vào chat, không đưa vào prompt, không vào repo, không vào migration.** Mục này trước đây chỉ nói về repo, nhưng đường rò thực tế là chat → prompt → file.
- **Tài khoản thử trên hosted phải xoá sau mỗi đợt kiểm** (tiêu chí dọn dẹp). Quy trình: SELECT trước và in ra, xoá `events` của tài khoản đó trước (khoá ngoại NO ACTION), rồi xoá `auth.users` bằng id tường minh trong một transaction có chốt số dòng.
- **Ảnh mockup phải là bản xuất từ canvas ở 2×, không phải ảnh chụp màn hình** — ảnh chụp mang theo giao diện công cụ, không đạt chuẩn cho repo public. Lưu ở `docs/mockups/buoc-N/`, kèm README ghi quyết định thiết kế và phạm vi.

## 7. Tiến độ (03/10/2026)

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
| Admin · Make.com · Chatbot · Dashboard | Chưa bắt đầu |
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

**Về tài liệu**

- **Tài liệu cũng lệch được mà không ai thấy.** Bản repo của chính file này lệch bản gốc 7 ngày (24/09 trong git, 29/09 trên đĩa, 01/10 ở bản gốc), ghi sai bảng màu và sai font, trong khi repo là public và đây là file nhà tuyển dụng đọc. `git status` có báo suốt thời gian đó. Hệ quả: đồng bộ file này là một bước có tên trong quy trình đóng đợt, không phải việc nhớ thì làm.
- **Khi hợp nhất hai bản của một tài liệu, hãy ghép cơ học, đừng dựng lại từ báo cáo.** Bản hợp nhất sau đợt 3A được viết lại mục 7 từ báo cáo thay vì giữ nguyên bản trong git, và làm mất hơn hai chục số đo, cỡ mẫu và cảnh báo về selector. Phần nào đã có bản đúng thì cắt và dán phần đó, chỉ viết tay những phần thật sự mới.
- **Dòng "Cập nhật lần cuối" chỉ chứa ngày**, không có chú thích mô tả lần sửa. Chú thích mô tả sẽ lệch ở lần sửa kế tiếp; lịch sử nằm ở git log.

**Về thiết kế và giao diện**

- Spec phải nói cả **mật độ và bố cục**, không chỉ giá trị token.
- Không animate `height` trên phần tử `position: sticky` — gây reflow toàn trang, chữ rung khi cuộn.
- **`position: sticky` chỉ dính trong khối chứa nó.** Khi nội dung ngắn hơn khung nhìn, thanh "dính đáy" bằng sticky nằm lửng giữa trang. Muốn dính đáy khung nhìn thì phải `fixed`, và khi đó `<body>` cần đệm đáy bằng đúng chiều cao thanh để không che nội dung cuối trang.
- Ngưỡng bật/tắt trạng thái theo scroll phải lệch nhau hai chiều, nếu không sẽ nhấp nháy quanh ngưỡng.
- Không tạo vùng cuộn riêng (`overflow-y: auto`) cho cột lọc; thà bỏ `sticky` còn hơn.
- Giao diện do AI sinh có dấu hiệu nhận biết rõ: nhãn viết hoa trên mỗi khối, mũi tên gắn sau link, mọi thẻ chung một bo góc và một khoảng cách. Spec phải chặn từng dấu hiệu bằng tên gọi cụ thể.
- **Thiếu hụt thị giác của site không nằm ở thẩm mỹ mà ở lớp hình ảnh.** Chính sách không dùng bìa bản quyền khiến toàn trang không có một pixel ảnh nào, nên 40 ô màu phẳng đọc ra là placeholder. Các đợt nâng cấp trước chữa bằng typography và layout nên luôn hụt. Cách chữa đúng là thêm một lớp ảnh atmosphere giấy phép mở, không phải gõ lại font.
- **Một artboard cố định bằng đúng kích thước màn hình bị đọc là "toàn bộ trang".** Mockup mobile 390×844 không vẽ footer vì footer nằm dưới fold, và điều đó đã bị hiểu là "trang này không có footer". Khung một màn hình phải được ghi rõ trong README của thư mục mockup.

## 9. Việc cần bàn tiếp trong project

- **Ô "Nhập lại email"** — giữ nguyên, hay thay bằng gợi ý typo domain ("Ý bạn là …@gmail.com?"), hay bật lại xác nhận email. Hiện giữ nguyên; nghiêng về gợi ý typo cho đợt sau.
- **Khoá ngoại `events.user_id` và `orders.user_id` đang là ON DELETE NO ACTION**, nên chặn việc xoá user. Với bảng analytics, cách thường dùng là **SET NULL** (giữ sự kiện, bỏ danh tính). Quyết khi làm chức năng xoá tài khoản hoặc ở 2D.
- **Footer xuống layout theo route** — cách chữa đúng cho dịch chuyển bố cục ghi ở 7.4, gom vào đợt 1.6.
- **N+1 ở trang chủ** (~25–30 truy vấn, 4–5 bậc nối tiếp) — nằm trong thứ tự ở mục 4, chưa có spec.
- **Lớp ảnh atmosphere** — chọn nguồn, số lượng, đặt ở những trang nào. Gom vào đợt 1.6 mở rộng.
- Persona chính trong 18–30.
- Logo chính thức.
- System prompt cho chatbot.
- Nội dung README cho nhà tuyển dụng.
- Mockup cho: admin. (Mockup checkout đã xong, 8 artboard, xuất 2× vào `docs/mockups/buoc-3/`.)
- Viết lại mô tả 3 tủ sách bằng giọng của chủ dự án (nội dung hiện tại do AI viết).

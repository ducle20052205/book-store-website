# NA Books — Quyết định & Đặc tả tổng

> **Vai trò của file này:** nơi lưu những gì đã **thực sự chốt**, không phải nơi đưa ra quyết định mới. Project này đóng vai trò "chỉ huy": mọi quyết định về kiến trúc, thiết kế, tính năng và spec cho Claude Code được thảo luận và chốt trong các chat của project, sau đó cập nhật vào đây. Đọc file này trước khi trả lời để không hỏi lại hoặc mâu thuẫn với quyết định cũ — nhưng đừng coi mục "còn mở" là đã có hướng đi.
>
> **Ai được sửa phần nào.** Bản gốc là bản trong Claude.ai Project này; file `docs/trang-quyet-dinh-dac-ta-tong.md` trong repo là bản đồng bộ. Claude Code **được sửa mục 7** (bảng tiến độ, số đo, số commit/PR) vì nó biết chính xác hơn. **Mọi mục khác chỉ chủ dự án ghi**, vì chúng chốt trong chat mà Claude Code không đọc được; thấy lệch thì báo cáo, không tự sửa. Mọi lần sửa file này là **commit riêng**, không gộp vào commit mã. Trong file chỉ ghi sự kiện và số đo kèm số mẫu — không có câu tự thuật tiến độ, không có đánh giá chất lượng công việc; file này sẽ nằm trong portfolio.
>
> **Cập nhật lần cuối:** 01/10/2026 (bản thứ hai trong ngày — sau khi chốt spec 2B.2 và ranh giới sửa file này).
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
- **Ảnh bìa: không dùng ảnh có bản quyền.** Toàn bộ bìa do component `BookCover` sinh tự động từ `title`, `author`, `slug` — 4 biến thể bố cục chọn theo hash, 12 màu trầm, có gáy sách và vân giấy. Cột `cover_image_url` giữ trong schema cho khả năng mở rộng nhưng không dùng. Đây là quyết định chính thức, không phải giải pháp tạm.
- **Chuyển động:** chỉ animate `transform` và `opacity`; CLS = 0; không `will-change`; không hiệu ứng fade-in theo section khi cuộn; một khoảnh khắc mở trang duy nhất ở trang chủ (400–600ms, không lặp trong cùng phiên); mọi chuyển động tắt được bằng `prefers-reduced-motion`. View Transitions API: đã kiểm tra React 19.2.8 chưa có export `ViewTransition`, quyết định không dùng và không cài bản canary.
- **Thông báo quan trọng không được tự biến mất** (WCAG 2.2.1 Timing Adjustable). Dải chào mừng sau đăng ký là banner trong trang có nút đóng, **không phải Toast tự tắt**. Dải chỉ hiện sau đăng ký, không hiện sau đăng nhập (kiểm 10/10).
- **Còn mở:** logo chính thức (hiện dùng wordmark chữ). Ý tưởng đã có: monogram NA dạng mặt ngọc.

## 4. Phạm vi tính năng

### Core (7 tính năng, theo SRS)

Catalog + tìm kiếm/lọc · Trang chi tiết sách · Giỏ hàng · Checkout (mock payment) · Tài khoản người dùng · Lịch sử đơn hàng · Admin dashboard cơ bản.

### Bổ sung so với bản chốt ban đầu

- **Tủ sách tuyển chọn** (2 bảng `collections`, `collection_books`): read-only, seed sẵn, chưa có giao diện quản lý. Hiện có 3 tủ, 17 cuốn, 1 tủ nổi bật hiển thị ở hero.
- **Ghi log sự kiện** vào bảng `events`: `page_view`, `search`, `add_to_cart`, `checkout_started`, `order_placed`, và từ 2A thêm `sign_up`, `login` (7 loại). Quyết định ghi log **ngay từ đầu** thay vì đợi đến khi làm dashboard, để dashboard có dữ liệu thật.
- **Mô tả danh mục:** 5 danh mục cha có `categories.description`, hiển thị ở trang catalog khi lọc theo danh mục cha; danh mục con để trống.
- **Chip thông tin trên thẻ sách:** nhãn danh mục con và chip "Trong tủ sách", chỉ dùng dữ liệu có thật.
- **Trang `/gio-hang` tạm** (từ 2B.1): trả 200, có header và footer như mọi trang, nói thẳng rằng giỏ hàng thuộc giai đoạn sau, kèm liên kết về `/sach`. Thay thế bằng trang thật ở đợt 3.

### Điểm nhấn (chưa làm)

1. **Chatbot trợ lý** dùng Gemini API: gợi ý sách theo mô tả tự nhiên dựa trên metadata catalog + trả lời FAQ tĩnh. Không thao tác giỏ hàng/đơn hàng, không truy cập dữ liệu cá nhân. API key qua backend proxy, cần rate limit. **System prompt: chưa soạn.**
2. **Dashboard thống kê nâng cao cho admin:** doanh thu theo thời gian, sách bán chạy theo danh mục, phễu chuyển đổi (dùng bảng `events`).

## 5. Kiến trúc kỹ thuật (đã chốt)

| Lớp | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19.2 + Tailwind CSS v4 (không có config file) |
| Backend | Supabase — Postgres + Auth + Storage + Edge Functions |
| Automation | Make.com (chưa làm) — email xác nhận đơn, báo admin đơn mới |
| Deploy | Vercel, nhánh `main` là production |

- **Database: 9 bảng**, tất cả bật RLS: `profiles`, `categories`, `books`, `cart_items`, `orders`, `order_items`, `events`, `collections`, `collection_books`. Đợt 2D sẽ thêm `provinces`, `wards` (thành 11).
- **Khoá ngoại tới `auth.users`:** `profiles` và `cart_items` là **CASCADE**; `events` và `orders` là **NO ACTION**. Hệ quả: không xoá được một user từng có sự kiện hoặc đơn hàng nếu chưa xoá tay các dòng đó trước — xem mục 9.
- **Quy tắc bắt buộc:** mọi thay đổi schema đi qua migration trong `supabase/migrations/`, apply bằng Supabase MCP, đặt tên file theo version Supabase ghi nhận. Không sửa trực tiếp qua Table Editor.
- Tìm kiếm theo tên sách và tác giả, không phân biệt dấu qua `unaccent`; toàn bộ lọc/sắp xếp/phân trang gói trong hàm RPC `search_books` (`SECURITY DEFINER` để tính "bán chạy" vượt qua RLS của `orders`).
- **Danh mục 2 tầng:** 5 danh mục cha (Văn học, Kinh tế, Tâm lý – Kỹ năng, Khoa học – Xã hội, Manga – Light novel), 17 danh mục con. Không có danh mục Thiếu nhi (ngoài nhóm tuổi mục tiêu).
- Route tiếng Việt: `/sach`, `/sach/[slug]`, `/tu-sach`, `/tu-sach/[slug]`, `/gio-hang`.
- Cloud/DevOps nâng cao (CI/CD): gác lại, chỉ làm nếu còn thời gian sau MVP.

### 5.1 Auth và rendering (chốt ở đợt 2A/2B/2B.1)

- **`middleware.ts` đổi tên thành `proxy.ts`** (Next 16), hàm export tên `proxy`, chỉ chạy Node.js runtime.
- **Hai lớp bảo vệ:** `proxy.ts` chặn sớm cho trải nghiệm; **enforcement thật nằm ở Server Component + RLS**. Đây là hệ quả rút ra từ CVE-2025-29927 — không được coi proxy là hàng rào duy nhất.
- **Bốn Supabase client** trong `lib/supabase/`: `client` (trình duyệt), `server` (Server Component/Action), `proxy` (chỉ dùng trong `proxy.ts`), `public` (không cookie, dùng được trong `"use cache"`). **Mọi client phải khởi tạo bên trong request handler, không bao giờ ở module scope.**
- **Bất đối xứng có chủ đích:** Header dùng `getClaims()` (xác minh ES256 cục bộ qua JWKS, không round-trip); `proxy.ts` giữ `getUser()` (hỏi Auth server nên phát hiện được token đã thu hồi). Đã ghi chú trong mã và CLAUDE.md để không ai "dọn dẹp" nhầm.
- **Cache Components (`cacheComponents: true`)** bật từ 2A để chữa hồi quy TTFB trang chủ 2,9ms → 647,7ms. Cấm dùng segment config `revalidate`; hàm `"use cache"` không gọi được `cookies()`; chỗ đọc cookie phải nằm trong `<Suspense>`. `/`, `/sach`, `/tu-sach`, `/tu-sach/[slug]` đều render kiểu Partial Prerendering.
- **Next đặt `pathWasRevalidated` ngay khi cookie bị đổi** (`request-cookies.js:130`). Hệ quả: bỏ `revalidatePath` khỏi một Server Action **không** làm response của action hết render lại trang — nó chỉ tránh việc vô hiệu hoá cache.
- **Next xoá `FLIGHT_HEADERS` khỏi `request` TRƯỚC khi gọi `proxy`** (`adapter.js:156–165`). Vì vậy **không đọc được** `next-router-prefetch` trong thân hàm proxy — nó luôn `null`. Cách đúng để tách prefetch là `config.matcher` với `missing: [{ type: "header", key: "next-router-prefetch" }]`, vì matcher khớp trước lúc header bị xoá. `/tai-khoan` và `/admin` có entry matcher riêng không điều kiện, nên prefetch tới đó vẫn chạy đủ logic chuyển hướng.
- **Sàn 2 request RSC sau đăng nhập/đăng ký.** Khi một Server Action đã revalidate (do đổi cookie) bị `router.push` huỷ, Next tự phát thêm một `ACTION_REFRESH` (`app-router-instance.js:76–92`). Muốn còn 1 phải dùng `redirect()` trong action, nhưng khi đó cả `mergeGuestCart()` lẫn `track("sign_up"/"login")` ở client đều không chạy — xem mục 9.
- **Email nhất quán hai chiều:** trigger `protect_profile_role()` khoá `role` với người không phải admin và khoá `email` với **mọi người**, trừ khi cờ phiên `app.sync_auth_email = 'on'`; trigger `sync_profile_email()` (AFTER UPDATE OF email ON auth.users) bật cờ, cập nhật `profiles.email`, rồi tắt cờ trong cùng transaction.
- **Mật khẩu:** tối thiểu 8 ký tự, **không ràng buộc thành phần** (NIST SP 800-63B rev 4). Không có ô "nhập lại mật khẩu" — thay bằng nút Ẩn/Hiện.
- **Có ô "Nhập lại email"** vì đã tắt xác nhận email: gõ sai mật khẩu thì thấy được, gõ sai email thì không, và sẽ không lấy lại được mật khẩu. *Đang xem xét thay bằng gợi ý typo domain — xem mục 9.*
- **Xác nhận email: TẮT.** Phát hiện 30/09 là thiết lập này vốn đang **BẬT** trên hosted, trái FR-5.1, và chưa ai từng kiểm. Đã tắt. Cũng đã nâng Minimum password length 6 → 8.
- **SMTP: Brevo free** (300 email/ngày). Hai hạn chế đã chấp nhận và ghi trong runbook: địa chỉ gửi bị viết lại thành `@…brevosend.com` (domain mail miễn phí không ký DKIM được), và không tắt được click tracking cho email giao dịch.
- **Địa chỉ Việt Nam 2 cấp** (từ 01/07/2025: 34 tỉnh, không còn quận/huyện): số nhà/đường → phường/xã → tỉnh/thành. `profiles` sẽ có `province_code`, `ward_code`, `address_line` với khoá ngoại ghép `(ward_code, province_code)` → `wards(code, province_code)` dùng **MATCH FULL** (MATCH SIMPLE sẽ bỏ qua kiểm tra khi một cột NULL).

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
- **Tài khoản thử trên hosted phải xoá sau mỗi đợt kiểm** (tiêu chí dọn dẹp). Quy trình: SELECT trước và in ra, xoá `events` của tài khoản đó trước (khoá ngoại NO ACTION), rồi xoá `auth.users` bằng id tường minh trong một transaction có chốt số dòng. Tính đến 01/10: `auth.users` 1, `profiles` 1, `events` 68.

## 7. Tiến độ (01/10/2026)

| Hạng mục | Trạng thái |
|---|---|
| Brand identity + trang chủ đầu tiên | Xong, đã merge |
| Bước 1: Catalog `/sach` + trang chi tiết + ghi log sự kiện | Xong, đã merge |
| Bước 1.5: Nâng cấp giao diện (đợt A, A2, B, C, D, E0–E3, F) | Xong, đã merge |
| Bước 2A: Hạ tầng auth | Xong, đã merge (PR #7) |
| Bước 2B: Đăng nhập / đăng ký | Xong, đã merge (PR #9, `18016f8`) |
| Bước 2B.1: Hiệu năng trên hosted | Xong, đã merge (PR #10, `d49ff1a`) |
| Bước 2B.2: Nháy trạng thái header | **Đang làm** — spec v2 đã viết (nhánh `fix/2b2-xoa-nhay-header`, commit `255c30e`), chưa sửa mã |
| Bước 2C: Quên/đặt lại mật khẩu | Chưa bắt đầu |
| Bước 2D: Trang hồ sơ, tỉnh/phường, đổi mật khẩu | Chưa bắt đầu |
| Đợt 1.6: Sửa lỗi giao diện tồn đọng | Chưa bắt đầu |
| Giỏ hàng · Checkout · Lịch sử đơn · Admin · Make.com · Chatbot · Dashboard | Chưa bắt đầu |
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

### 7.3 Đợt 2B.2 — phạm vi và tiêu chí đã chốt (01/10/2026, chưa sửa mã)

Spec: `docs/specs/buoc-2b2-xoa-nhay-trang-thai-header.md` (bản v2, ghi đè bản v1.0 ngày 30/09).

- **Mục tiêu hẹp lại cho đúng:** xoá **thông tin sai** trong trạng thái trung gian, **không** rút ngắn thời gian chờ ~250 ms. Đánh đổi đã chấp nhận: khách chưa đăng nhập thấy icon + ô chữ rỗng trong lúc chờ thay vì thấy ngay chữ "Đăng nhập".
- **Giả thuyết nguyên nhân đã được xác nhận bằng khảo sát mã** (bản v1.0, 30/09): `LoginLink` dùng chung cho cả Suspense fallback lẫn trạng thái khách thật, nên trạng thái sai đến từ fallback phía server, không phải từ render client trước hydration. Hằng `navAccountWidthClass` (135px) đã có sẵn. Bước 0 của spec vẫn phải xác nhận lại mô tả này trên mã sau 2B.1.
- **Phạm vi gồm mọi vị trí hiển thị trạng thái auth** (header desktop và menu mobile), không chỉ header desktop như bản v1.0.
- **Loại tiêu chí mới — đối chứng baseline (TC-3):** chạy đúng script đo trên commit **trước khi sửa**, phải thấy lỗi tái hiện ≥3/10. Baseline 0/10 nghĩa là phép đo hỏng hoặc môi trường không đủ điều kiện, **không được kết luận "đạt"**. Nếu tăng độ trễ Supabase tới +500 ms vẫn không tái hiện thì dừng và báo cáo.
- **Hạn chế đã biết, không vá:** tắt JavaScript thì fallback ở nguyên nên header không có liên kết đăng nhập. Không vá bằng `<noscript>` vì nó chỉ render được một trạng thái tĩnh, sẽ hiện "Đăng nhập" cho cả người đã đăng nhập — tái tạo đúng lỗi đang chữa, chỉ khác là vĩnh viễn. Vá riêng header cũng không cứu được trang: giỏ hàng, menu, dropdown đều cần JS.
- **Phương án cookie gợi ý hiển thị để ngoài phạm vi 2B.2**, chỉ mở khi TC-1 trượt, và khi đó phải có spec riêng vì nó thêm một nguồn sự thật thứ hai về trạng thái auth.

## 8. Bài học đã rút ra (giữ lại để không lặp)

**Về tiêu chí nghiệm thu**

- **Tiêu chí nghiệm thu phải đo được bằng số.** "Tăng mật độ", "tạo nhịp", "hiện đại hơn" là chữ mô tả cảm giác, mỗi bên hiểu một kiểu và kết quả luôn hụt.
- **Tiêu chí dùng selector phải nêu selector chỉ khớp đúng trạng thái đang kiểm, và phải có đối chứng ở trạng thái ngược lại.** Đối chứng cũng "đạt" nghĩa là phép đo hỏng, không phải mã đạt. Bài học từ tiêu chí 8: selector `button[aria-haspopup]` khớp cả nút menu điều hướng, nên báo cáo "5/5 đạt" là vô giá trị.
- **Với một lỗi phụ thuộc timing, phải chạy đúng script đo đó trên commit trước khi sửa.** Baseline không tái hiện được lỗi nghĩa là phép đo hỏng hoặc môi trường không đủ điều kiện — không được kết luận "đạt". Rút ra khi soạn TC-3 của đợt 2B.2.
- **Khi đóng một tiêu chí bằng phép đo yếu hơn tiêu chí gốc, ghi rõ cả hai:** tiêu chí gốc đòi gì, phép đo thực tế làm gì, số mẫu bao nhiêu. Không ghi "đã xử lý" trống không. Rút ra từ tiêu chí 3 của Bước 2B, đóng bằng n = 1 trong khi tiêu chí đòi 15 lượt × 4 trang.
- **Mọi ngưỡng phần trăm phải lớn hơn độ nhiễu đo được của chính phép đo đó.** Đo độ nhiễu trước khi đặt ngưỡng. Ngưỡng 20% trên một giá trị 4,2 ms với nhiễu ±1 ms là không phân biệt được đạt và trượt.
- **Tiêu chí phải đặt sau khi chốt kiến trúc, không phải trước.**
- Với mỗi tiêu chí, trả lời trước một câu: *"lệnh nào cho ra con số này?"* Không trả lời được thì đó chưa phải tiêu chí.

**Về cách đọc số đo**

- **Số request trong DevTools cộng dồn khi bật "Preserve log".** Mọi con số request phải ghi rõ là **một lượt tải** hay **tích luỹ**. Đây là nguồn của sai lầm "223 request mỗi lượt tải".
- **So sánh phải cùng điều kiện.** `HIT` không so được với `STALE`; khác trạng thái đăng nhập không so được; khác vùng không so được. Không so công bằng được thì nói thẳng thay vì báo một con số đẹp.
- **Luôn ghi số mẫu.** Một mẫu thì kết luận là "không hồi quy", không phải một con số phần trăm.
- **Chênh lệch nhỏ hơn khoảng dao động giữa các lần đo mốc thì chỉ cho biết hướng**, không cho biết độ lớn.
- **Đừng viết "ở mọi phép đo" khi có một phép đo đi ngược.** Nêu ngoại lệ ra, kèm giải thích và ghi rõ giải thích đó đã kiểm hay chưa.
- **Một phép thử bật–tắt chỉ chứng minh được "không phải điều kiện đủ", không chứng minh được "không liên quan".**
- **Bằng chứng trái chiều mạnh hơn bằng chứng thuận chiều.** Nêu giả thuyết thì nêu kèm **phép đo để bác bỏ nó**.
- **Đừng biến một quan sát đúng thành một khẳng định về cách dùng mà chưa đọc tài liệu.** "Request prefetch mang header X" là quan sát; "nên dùng header X để tách prefetch" là khẳng định về khả năng — và nó sai, vì Next xoá header đó trước khi gọi proxy.

**Về cách làm việc với Claude Code**

- **Khi Claude Code bác lại chẩn đoán và đưa ra bằng chứng đo được, nó thường đúng.** Mẫu hình này đã lặp nhiều lần. Hệ quả: phía project chat suy luận từ kiến trúc, Claude Code đo từ hệ thống thật; khi hai bên lệch thì **số đo thắng**.
- **Claude Code cũng tự sửa mình khi có số đo mới** — hành vi cần khuyến khích, không phải dấu hiệu thiếu tin cậy.
- **Trước khi ghi đè một file trong `docs/specs/`, phải đọc bản hiện có và báo cáo những mục sẽ mất.** Không xoá mục nào mà không hỏi, kể cả khi prompt nói "chép nguyên văn". Rút ra ngày 01/10: một prompt viết theo kiểu "tạo file" đã ghi đè bản v1.0 của spec 2B.2 và suýt làm mất kết quả khảo sát mã trong đó.
- **Khi hai tiêu chí trong spec không thể cùng thỏa, sửa spec** — đừng ép nó chọn bừa rồi giấu phần không đạt.
- Mọi lệnh commit/push phải dùng **đường dẫn tường minh**, không `git add -A`, và kiểm `git status` trước khi stage. Luật này đã thực sự cứu một lần: một thay đổi chưa commit của file quyết định nằm trong working tree suốt 7 ngày, xuyên qua nhiều lần tạo nhánh, mà không lọt vào commit nào.
- Việc gì Claude Code chạy được bằng lệnh thì đưa vào prompt, đừng bắt người dùng gõ tay. Chỉ những thứ nó thật sự không làm được (dashboard Vercel, đăng nhập hosted, Docker Desktop) mới thành bước thủ công.
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

**Về thiết kế và giao diện**

- Spec phải nói cả **mật độ và bố cục**, không chỉ giá trị token.
- Không animate `height` trên phần tử `position: sticky` — gây reflow toàn trang, chữ rung khi cuộn.
- Ngưỡng bật/tắt trạng thái theo scroll phải lệch nhau hai chiều, nếu không sẽ nhấp nháy quanh ngưỡng.
- Không tạo vùng cuộn riêng (`overflow-y: auto`) cho cột lọc; thà bỏ `sticky` còn hơn.
- Giao diện do AI sinh có dấu hiệu nhận biết rõ: nhãn viết hoa trên mỗi khối, mũi tên gắn sau link, mọi thẻ chung một bo góc và một khoảng cách. Spec phải chặn từng dấu hiệu bằng tên gọi cụ thể.

## 9. Việc cần bàn tiếp trong project

- **Ô "Nhập lại email"** — giữ nguyên, hay thay bằng gợi ý typo domain ("Ý bạn là …@gmail.com?"), hay bật lại xác nhận email. Hiện giữ nguyên; nghiêng về gợi ý typo cho đợt sau.
- **Khoá ngoại `events.user_id` và `orders.user_id` đang là ON DELETE NO ACTION**, nên chặn việc xoá user. Với bảng analytics, cách thường dùng là **SET NULL** (giữ sự kiện, bỏ danh tính). Quyết khi làm chức năng xoá tài khoản hoặc ở 2D.
- **Lưu giỏ khách bằng cookie hay localStorage (đợt 3).** Nếu dùng cookie thì server đọc được, dùng `redirect()` trong action được, và sàn 2 request RSC sau đăng nhập xuống 1 — nhưng phải chuyển cả `mergeGuestCart()` lẫn `track("sign_up"/"login")` lên server.
- **N+1 ở trang chủ** (~25–30 truy vấn, 4–5 bậc nối tiếp) — chưa lên lịch.
- Persona chính trong 18–30.
- Logo chính thức.
- System prompt cho chatbot.
- Nội dung README cho nhà tuyển dụng.
- Mockup cho: giỏ hàng, checkout, admin.
- Viết lại mô tả 3 tủ sách bằng giọng của chủ dự án (nội dung hiện tại do AI viết).

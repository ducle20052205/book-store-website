# NA Books

- Demo: https://book-store-website-dun.vercel.app
- Mã nguồn: https://github.com/ducle20052205/book-store-website

## Đây là gì

NA Books là một dự án portfolio cá nhân, không kinh doanh thật: không có nguồn hàng, không có thanh toán thật, dữ liệu sách chỉ nhằm minh họa.

Về sản phẩm, đó là một cửa hàng sách độc lập (một cửa hàng, không phải marketplace), định vị "nhà sách tuyển chọn" cho người đọc 18–30 tuổi: mỗi cuốn có mặt đều kèm lời giải thích của biên tập về lý do được chọn. Cấu trúc trang và luồng mua hàng theo quy ước của các nhà sách Việt Nam; phần riêng nằm ở nhận diện, nội dung tuyển chọn và giọng văn.

README này viết cho nhà tuyển dụng và người xét hồ sơ hướng BA/PM/Product, nên trọng tâm là vì sao từng quyết định được đưa ra, không chỉ là code.

## Thử trong 2 phút

Bảy bước dưới đây là định nghĩa "xong" của dự án. Mỗi bước là một thao tác một người lạ làm được trên site thật.

1. Mở [trang chủ](https://book-store-website-dun.vercel.app/), vào [`/sach`](https://book-store-website-dun.vercel.app/sach) để duyệt catalog, lọc theo danh mục, và thử tìm "murakami" (không cần gõ dấu).
2. Mở một cuốn bất kỳ ở `/sach/<tên-sách>` và thêm vào giỏ **khi chưa đăng nhập**. Giỏ nằm ở [`/gio-hang`](https://book-store-website-dun.vercel.app/gio-hang).
3. Bấm thanh toán ([`/thanh-toan`](https://book-store-website-dun.vercel.app/thanh-toan)). Trang đưa bạn tới đăng nhập; chọn đăng ký ([`/dang-ky`](https://book-store-website-dun.vercel.app/dang-ky)). Đăng ký xong, giỏ hàng vẫn còn nguyên.
4. Điền địa chỉ (tỉnh/thành và phường/xã lấy từ dữ liệu hành chính hai cấp thật) và đặt hàng. Email xác nhận gửi tới địa chỉ bạn đã đăng ký, nên hãy dùng một email bạn đọc được. Trang xác nhận ở `/thanh-toan/hoan-tat/<mã-đơn>`.
5. Mở [`/tai-khoan/don-hang`](https://book-store-website-dun.vercel.app/tai-khoan/don-hang): xem lịch sử đơn, hủy một đơn đang chờ xử lý, rồi mở lại cuốn sách đó để thấy kho đã cộng trả. Giữ lại một đơn chưa hủy cho bước 6.
6. Đăng xuất, rồi đăng nhập bằng tài khoản admin demo ở [`/dang-nhap`](https://book-store-website-dun.vercel.app/dang-nhap):

   ```
   Email:    admin-demo@example.com
   Mật khẩu: matkhau123@
   ```

   Vào `/admin/don-hang` để thấy đơn vừa đặt và đổi trạng thái của nó; vào [`/admin`](https://book-store-website-dun.vercel.app/admin) để xem dashboard.

   Tài khoản này công khai: ai cũng dùng được, và nó có quyền admin thật (xem đơn, đổi trạng thái đơn, sửa sách). Dữ liệu trên site là dữ liệu demo và được dựng lại bằng script `scripts/seed-demo.mjs` khi cần (`--teardown` rồi `--apply`, xem `docs/runbooks/chay-seed-demo.md`). Dữ liệu demo gồm 25 tài khoản, 42 đơn trải 7 tháng và gần 1.900 sự kiện. Nếu bạn thấy đơn hay tên sách trông lạ, đó là dấu vết của người thử trước, không phải lỗi.
7. Đọc tiếp phần "Vì sao từng quyết định" ngay dưới đây.

## Vì sao từng quyết định

Sáu quyết định, mỗi quyết định theo thứ tự bối cảnh, chọn gì, đánh đổi gì. Số đo lấy từ `docs/trang-quyet-dinh-dac-ta-tong.md`.

### Bìa sách sinh tự động, không dùng ảnh bản quyền

**Bối cảnh.** Một trang bán sách thiếu ảnh bìa trông trống, nhưng ảnh bìa là tài sản có bản quyền và repo này công khai.
**Chọn gì.** Component `BookCover` sinh bìa từ `title`, `author` và `slug`: bốn biến thể bố cục chọn theo hash, mười hai màu trầm, có gáy sách và vân giấy. Cột `cover_image_url` vẫn nằm trong schema nhưng không được dùng. Đây là quyết định chính thức, không phải giải pháp tạm.
**Đánh đổi.** Không một ảnh bìa nào là tệp ảnh, nên thẻ sách kém sinh động hơn một nhà sách thật. Lớp ảnh giấy, kệ sách từ nguồn giấy phép mở vẫn chưa làm.

### Hủy đơn làm bằng hàm `cancel_order`, không bằng policy RLS

**Bối cảnh.** Khách cần tự hủy đơn đang chờ xử lý. Cách quen thuộc là cho khách một policy `UPDATE` trên `orders`.
**Chọn gì.** RLS không giới hạn được theo cột: policy "chỉ được đặt `cancelled`" chỉ kiểm dòng sau khi sửa, nên khách vẫn sửa kèm `total_amount` trong cùng câu `UPDATE`. Vì vậy khách không có policy `INSERT` hay `UPDATE` nào trên `orders`; việc hủy đi qua hàm `cancel_order` (`SECURITY DEFINER`), hàm tự kiểm chủ đơn, kiểm trạng thái và khoá dòng bằng `SELECT … FOR UPDATE`.
**Đánh đổi.** Logic nằm trong SQL, khó đọc hơn một policy và phải tự kiểm quyền. Thiếu khoá thì hỏng thật: ở bản đầu của hàm, một biến thể đọc-rồi-ghi không khoá cộng kho gấp đôi ở 12/12 lượt thử trong cửa sổ 50 ms.

### Luồng trạng thái đơn và cộng trả kho do một trigger đảm nhiệm

**Bối cảnh.** Đơn đi theo luồng chờ xử lý, đang xử lý, đã giao, hoàn tất (hoặc hủy trước khi hoàn tất), và hủy thì kho phải cộng lại. Nếu luật này chỉ nằm ở giao diện admin thì một câu `UPDATE` tay trong SQL Editor lách được.
**Chọn gì.** Một trigger `BEFORE UPDATE` trên `orders` chặn chuyển trạng thái sai và cộng trả kho khi sang `cancelled`, đúng cho mọi đường đi; `cancel_order` bỏ vòng cộng kho của chính nó. Mệnh đề `WHEN (OLD.status IS DISTINCT FROM NEW.status)` làm trigger tự idempotent: hai lệnh hủy đồng thời, kho cộng đúng một lần ở 30/30 lượt. Bản thử bỏ mệnh đề đó cộng thừa ở 12/12 lượt.
**Đánh đổi.** Luật nghiệp vụ nằm trong database, ngoài tầm mắt người chỉ đọc code ứng dụng, và phải kiểm trên database thật.

### Đổi vùng Vercel từ `iad1` sang `hnd1`

**Bối cảnh.** Database ở Tokyo (`ap-northeast-1`) nhưng Function của Vercel chạy ở Washington D.C. (`iad1`). Một Server Action đăng xuất mất từ 3,6 đến 4,3 giây.
**Chọn gì.** Đổi Function Region sang `hnd1` (Tokyo) trong dashboard Vercel: không một dòng mã. PostgREST từ Vercel có trung vị 280 ms trước đổi và 12,5 ms sau đổi, hệ số khoảng 22 lần; số request trên 500 ms từ 67/154 xuống 0/384.
**Đánh đổi.** Edge vẫn ở `hkg1`, nên hệ số 22 lần là ở tầng truy vấn chứ không phải toàn trang. Thiết lập nằm trong dashboard, không nằm trong repo: ai clone repo không thấy nó. Bài học: kiểm hạ tầng trước khi tối ưu mã.

### Email xác nhận đơn do ứng dụng gửi qua HTTP API, không qua Make.com

**Bối cảnh.** Email xác nhận là bước 4 của định nghĩa "xong", nên phải chắc chắn và kiểm được bằng script trong repo. Gói Make.com miễn phí chưa được xác minh là có webhook chạy tức thì.
**Chọn gì.** Server Action gọi HTTP API của Brevo, không dùng SMTP (kết nối dài, chậm, thường bị chặn trong môi trường serverless), `await` với timeout 4 giây rồi mới chuyển trang. Cột `orders.confirmation_email_sent_at` ghi kết quả; còn trống thì trang xác nhận nói thật thay vì viết "đang gửi". Quy tắc phân định: khách đang chờ thì app lo, cửa hàng dùng thì Make lo.
**Đánh đổi.** Đặt hàng có thể chờ thêm tới 4 giây khi Brevo chậm, và không có giao diện kéo-thả của Make.com.

### Giỏ của khách chưa đăng nhập lưu ở cookie, không `localStorage`

**Bối cảnh.** Khách phải thêm vào giỏ được trước khi đăng nhập, và badge số lượng phải đúng ngay trong HTML đầu tiên. `localStorage` chỉ đọc được sau khi JavaScript chạy, nghĩa là tái tạo đúng lớp lỗi "trạng thái trung gian sai" đã sửa ở header.
**Chọn gì.** Cookie `na_cart` (httpOnly, `SameSite=Lax`, 30 ngày, tối đa 20 dòng). Mọi thay đổi đi qua Server Action; khi đăng nhập, `mergeGuestCart()` gộp giỏ vào bảng `cart_items`.
**Đánh đổi.** Cookie không có read-modify-write nguyên tử: hai request thật sự đồng thời có thể làm mất một dòng. Đã giảm nhẹ bằng cách khoá nút khi action đang chạy, chưa chữa triệt để; nếu thấy mất dòng trong thực tế thì chuyển sang bảng `guest_carts`.

## Kiến trúc

```
Trình duyệt
    |  HTTPS
    v
Vercel (Edge hkg1 -> Function hnd1)    Next.js 16: proxy.ts, Server Components, Server Actions
    |                          \
    |  PostgREST, Auth           \  HTTP API
    v                              v
Supabase ap-northeast-1          Brevo
(Postgres + Auth, RLS)           (email xác nhận đơn)
```

| Lớp | Công nghệ |
|---|---|
| Giao diện và server | Next.js 16 (App Router), React 19.2, Tailwind CSS v4 |
| Database và đăng nhập | Supabase (Postgres + Auth) |
| Triển khai | Vercel, nhánh `main` là production |
| Email giao dịch | Brevo HTTP API |

Quy mô, đếm từ repo: 18 trang (`app/**/page.tsx`) và 1 route handler, 20 migration, 11 bảng đều bật RLS, 5 dependency production, 64 yêu cầu chức năng trong `docs/SRS.md`, 23 file trong `docs/specs/`, 6 file trong `docs/runbooks/`.

Khu quản trị được kiểm quyền theo từng tầng: `proxy.ts` chặn sớm, rồi kiểm quyền admin trong Server Component, rồi RLS và trigger ở database. `proxy.ts` không phải hàng rào duy nhất, vì CVE-2025-29927 (lỗ hổng cho phép bỏ qua middleware của Next.js) cho thấy một lớp chặn ở rìa không đủ để tin; quyền thật được kiểm lại ở hai lớp sau.

## Chưa làm gì, và vì sao

- **Giao diện mobile tạm dừng.** Mobile là một giai đoạn sau khi sản phẩm hoàn thành, không nằm trong định nghĩa "xong" và không chen vào thứ tự các đợt. Mã mobile đã có được giữ nguyên, không xây thêm và không đo thêm theo bề rộng mobile.
- **11 phát hiện accessibility còn mở** (3 Trung bình, 8 Thấp, 0 Cao). Đã đo, chưa sửa; có đợt riêng cho việc này.
- **URL động có dãy `%XX` hỏng hoặc `%25` trả HTTP 500.** Lỗi có từ trước mọi đợt, xảy ra trước khi tới mã trang, không lộ dữ liệu; gom vào đợt sửa lỗi giao diện tồn đọng.
- **Preview và production dùng chung một database.** Mọi lần ghi khi thử ở preview nằm trong database mà production cũng đọc. Đợt sửa lỗi giao diện tồn đọng sẽ tách chúng.
- **Chatbot, quên mật khẩu, trang hồ sơ, scenario Make.com.** Chưa làm, nằm trong thứ tự các đợt còn lại và ngoài định nghĩa "xong".
- **Một tiêu chí nghiệm thu đã trượt và được giữ nguyên là trượt.** TC-S.10 của đợt seed dữ liệu cấm sửa mọi file có sẵn, nhưng quy trình đóng đợt bắt buộc sửa mục 7 của chính file quyết định, nên tiêu chí đó không đạt được ở bất kỳ đợt nào. Kết quả trượt được giữ nguyên thay vì sửa tiêu chí sau khi đã thấy kết quả. Bốn phép đo thực chất bên trong tiêu chí đó đều đạt.

## Chạy cục bộ

Cần Node.js, Docker Desktop và Supabase CLI (tải bản phát hành chính thức, đối chiếu SHA256). Các bước dưới đây rút gọn từ `docs/runbooks/supabase-local.md`.

```bash
npm install
supabase start -x studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta
supabase db reset
```

`supabase db reset` áp toàn bộ migration rồi `supabase/seed.sql` (40 cuốn sách). Lấy khoá của stack bằng `supabase status -o env` (đừng dán đầu ra đầy đủ vào chat hay repo), tạo file `.env.supabase-local` (đã được `.gitignore` bỏ qua) rồi chạy:

```bash
set -a; . ./.env.supabase-local; set +a
npm run build
npx next start -p 3100
```

Biến môi trường (chỉ tên; mẫu ở `.env.local.example`):

- Bắt buộc: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Tùy chọn, chỉ phía server: `BREVO_API_KEY`, `BREVO_SENDER`, `SITE_URL`, `MAKE_WEBHOOK_URL`, `MAKE_WEBHOOK_TOKEN`. Thiếu `BREVO_API_KEY` hoặc `BREVO_SENDER` thì email xác nhận bị bỏ qua.
- Chỉ cho script seed: `SUPABASE_SECRET_KEY`, `SEED_DEMO_PASSWORD`.

## Bản đồ tài liệu

| Muốn biết | Đọc |
|---|---|
| Hệ thống phải làm gì | [`docs/SRS.md`](docs/SRS.md): yêu cầu chức năng và phi chức năng |
| Mọi quyết định đã chốt, và số đo từng đợt | [`docs/trang-quyet-dinh-dac-ta-tong.md`](docs/trang-quyet-dinh-dac-ta-tong.md), mục 7 là số đo |
| Một đợt cụ thể làm gì và nghiệm thu ra sao | [`docs/specs/`](docs/specs/): đặc tả từng đợt kèm tiêu chí nghiệm thu |
| Cách vận hành (seed, admin đầu tiên, SMTP, Supabase cục bộ) | [`docs/runbooks/`](docs/runbooks/) |
| Mockup và quyết định thiết kế | [`docs/mockups/`](docs/mockups/) |

Nếu muốn xem dự án tự sửa mình ra sao, đọc mục 8 ("Bài học đã rút ra") của file quyết định.

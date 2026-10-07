# Runbook — Cấu hình gửi email xác thực (custom SMTP)

Cập nhật lần cuối: 07/10/2026. Trạng thái: đã chạy, đã kiểm chứng.

## Vì sao cần

Dịch vụ email tích hợp sẵn của Supabase giới hạn 2 email/giờ và chỉ gửi tới
các địa chỉ đã được cấp phép trước, nên luồng quên mật khẩu không demo được.
Bật custom SMTP nâng mức mặc định lên 30 email/giờ.

## Cấu hình hiện tại

**Nhà cung cấp:** Brevo, gói Free (300 email/ngày).

| Thông số | Giá trị |
|---|---|
| SMTP Server | `smtp-relay.brevo.com` |
| Port | 587 |
| Username | login SMTP dạng `xxxxxxxxx@smtp-brevo.com` (xem Brevo → Settings → SMTP & API) |
| Password | SMTP key tên "NA Books", tạo 29/09/2026, hết hạn 29/09/2027 |
| Sender email | địa chỉ Gmail của chủ dự án, đã verify ở Brevo |
| Sender name | NA Books |
| Minimum interval per user | 60 giây |

**Supabase → Authentication → Rate Limits:** 30 emails/h.

**Supabase → Authentication → URL Configuration:**
- Site URL: `https://book-store-website-dun.vercel.app`
- Redirect URLs: `http://localhost:3000/**`, `https://book-store-website-dun.vercel.app/**`

Lưu ý: redirect URL phải có scheme `https://` và đuôi `/**`. Thiếu `/**` thì
chỉ khớp đúng trang gốc, link đặt lại mật khẩu trỏ tới đường dẫn con sẽ bị từ chối.

## Kết quả kiểm chứng (30/09/2026, 00:20)

Cách test: Supabase → Authentication → Users → chọn user → Send password recovery.

| Tiêu chí | Kết quả |
|---|---|
| Thư tới trong 2 phút | Đạt |
| Tên người gửi hiển thị "NA Books" | Đạt |
| Vào Hộp thư đến, không phải Spam | Đạt |
| Brevo → Transactional → Email → Logs hiện Delivered | Đạt |
| Link mở được và về đúng site | Đạt |

## Hai hạn chế đã biết, chấp nhận trong phạm vi dự án

**1. Địa chỉ người gửi bị Brevo thay thế.** Log hiện From là
`...@12302835.brevosend.com` chứ không phải Gmail. Nguyên nhân: domain của
dịch vụ mail miễn phí không thể xác thực DKIM, và Brevo tự thay để tuân thủ
yêu cầu người gửi của Gmail/Yahoo có hiệu lực từ 01/02/2024. Người nhận vẫn
thấy tên hiển thị "NA Books".

**2. Không tắt được click tracking.** Brevo viết lại link trong email để đếm
lượt bấm; tuỳ chọn tắt chỉ có qua header `X-Mailin-Track` khi gửi bằng API,
mà Supabase không cho chèn header SMTP tuỳ ý. Trang Transactional → Settings
→ Tracking chỉ chọn được tracking ẩn danh hay không, không tắt được việc viết
lại link. Hệ quả thực tế: link hiện domain lạ khi rê chuột, thêm một chặng
chuyển hướng. Tracking không tự mở link nên **không** làm tiêu link một-lần
của Supabase.

**Cách xử lý dứt điểm khi cần:** mua một domain riêng, xác thực domain đó
(Brevo code + DKIM + DMARC), rồi hoặc giữ Brevo hoặc chuyển sang Resend /
Amazon SES. Cả hai hạn chế trên biến mất. Tiện thể gắn domain vào Vercel để
thay `book-store-website-dun.vercel.app`.

## Đã làm ở đợt 8 (07/10/2026): template email đặt lại mật khẩu

Hai việc từng ghi là "còn lại ở đợt 2C" đã làm xong, mỗi việc kiểm bằng TC-A.2 của đợt 8 (số đo ở mục 7.14 của `docs/trang-quyet-dinh-dac-ta-tong.md`):

- **Template viết lại bằng tiếng Việt** theo giọng NA Books. Lý do ban đầu: template mặc định bằng tiếng Anh, Gmail phải tự dịch và hiện banner "Đã dịch" giữa thư — trái với NFR-3.4.
- **Đổi sang chiến lược `token_hash`** thay cho `{{ .ConfirmationURL }}` mặc định. Lý do ban đầu: Supabase dùng PKCE, code verifier lưu ở trình duyệt khởi tạo luồng; người dùng bấm "Quên mật khẩu" trên máy tính rồi mở mail trên điện thoại sẽ hỏng (đã tái hiện khi test ngày 30/09).

**File nguồn:** `supabase/templates/recovery.html` (dùng cho stack cục bộ qua `supabase/config.toml`). **Trên hosted** template được dán tay vào Supabase Dashboard → Authentication → Email Templates → Reset Password, lấy từ file này. Đã dán và kiểm bằng TC-A.2 (hosted) ngày 07/10/2026: 3/3 đặt lại được, tiêu đề tiếng Việt đúng, chữ đủ dấu, link chứa `token_hash` và `type=recovery`, 0 lần chứa `ConfirmationURL`.

**Cạm bẫy khi dán lại template (đã xảy ra một lần):** phải dán bằng clipboard UTF-8, tức là lấy nội dung bằng `Get-Content -Raw -Encoding UTF8 supabase/templates/recovery.html | Set-Clipboard`. Thiếu `-Encoding UTF8` thì PowerShell 5.1 đọc file theo bảng mã ANSI và toàn bộ chữ có dấu bị hỏng. Sau mỗi lần dán lại, gửi một thư thử và đọc tiêu đề lẫn thân thư có đủ dấu.

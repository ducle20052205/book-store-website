# Runbook — Cấu hình Supabase Auth của project hosted

Cập nhật lần cuối: 30/09/2026. Liên quan: FR-5.1, FR-5.3, FR-5.5, FR-5.7 trong `docs/SRS.md`; `docs/runbooks/cau-hinh-smtp.md`.

## Vì sao có file này

Cài đặt Auth nằm trong Dashboard, không nằm trong repo, và chưa từng được ghi lại. Hậu quả đã gặp:

- **Confirm email đang BẬT** trong khi FR-5.1 yêu cầu tắt. Lần chạy đầu của Bước 0 (spec 2B) vì thế thất bại: `signUp` không trả session. Đã tắt trong Dashboard ngày 30/09/2026.
- **Secure email change BẬT**: `updateUser({ email })` không đổi `auth.users.email` ngay, nên cách kiểm tiêu chí 15 của 2A phải viết lại (spec 2B mục 11.1).
- Các cài đặt gửi email và PKCE đã vấp ở `docs/runbooks/cau-hinh-smtp.md`.

Cột **Đo** cho biết cách kiểm lại: **lệnh** là đọc được bằng lệnh không cần token (mục "Cách kiểm lại" bên dưới, đã chạy ngày 30/09/2026 và khớp); **API** là chỉ đọc được qua Management API cần access token cá nhân, nếu không có token thì **chỉ xem được trong Dashboard**.

## Authentication → Sign In / Providers → User Signups

| Cài đặt | Giá trị | Đo | Ghi chú |
|---|---|---|---|
| Allow new users to sign up | BẬT | lệnh: `disable_signup = false` | |
| Allow manual linking | TẮT | API | |
| Allow anonymous sign-ins | TẮT | lệnh: `external.anonymous_users = false` | |
| Confirm email | **TẮT** | lệnh: `mailer_autoconfirm = true` | Quyết định của bước 2 (FR-5.1): đăng ký xong có session ngay. Bật lên thì `signUp` không trả session, hỏng luồng đăng ký ở spec 2B mục 6 (ghi `sign_up`, dải chào mừng, điều hướng ngay). |

## Authentication → Sign In / Providers → Email

| Cài đặt | Giá trị | Đo | Ghi chú |
|---|---|---|---|
| Enable email provider | BẬT | lệnh: `external.email = true` | |
| Secure email change | **BẬT** | API | Đổi email phải xác nhận ở cả địa chỉ cũ lẫn mới, nên `auth.users.email` **không** đổi ngay khi gọi `updateUser({ email })`. Giữ bật vì đúng về bảo mật; FR-5.5 vốn cấm đổi email qua giao diện. |
| Secure password change | TẮT | API | |
| Require current password when updating | TẮT | API | FR-5.7 tự xử lý ở tầng ứng dụng: `signInWithPassword` rồi mới `updateUser`. |
| Prevent use of leaked passwords | TẮT | API | Chỉ có ở gói Pro. |
| Minimum password length | 8 | API | FR-5.1. |
| Password requirements | không chọn gì | API | Theo NIST SP 800-63B, không áp đặt loại ký tự. |
| Email OTP expiration | 3600 giây | API | |
| Email OTP length | 8 | API | |

Các nhà cung cấp khác đều TẮT (đo bằng lệnh: mọi `external.*` trừ `email` là `false`; `phone`, SAML, passkeys đều tắt).

## JWT

ES256, khoá bất đối xứng. `getClaims()` xác minh cục bộ qua JWKS, không cần round trip tới Auth server. Đây là điều kiện để thiết kế Header ở spec 2B chạy được. **Đo:** lệnh — JWKS có đúng 1 khoá `EC` / `P-256` / `ES256`.

## Authentication → Rate Limits

30 email/giờ (sau khi bật custom SMTP, xem `cau-hinh-smtp.md`). **Đo:** API (`rate_limit_email_sent`).

## Authentication → URL Configuration

Ghi theo `cau-hinh-smtp.md` (đã kiểm chứng ngày 30/09/2026), chưa đọc lại được bằng lệnh nên **đo: API** (`site_url`, `uri_allow_list`), nếu không có token thì chỉ xem được trong Dashboard.

- Site URL: `https://book-store-website-dun.vercel.app`
- Redirect URLs: `http://localhost:3000/**`, `https://book-store-website-dun.vercel.app/**`

## Hệ quả cho code và spec

- Confirm email tắt → sau `signUp` có session ngay; code không chờ bước xác nhận.
- Secure email change bật → `updateUser({ email })` chỉ ghi nhận yêu cầu; `profiles.email` chỉ đổi khi `auth.users.email` thật sự đổi (trigger `sync_profile_email`). Xem cách kiểm ở spec 2B mục 11.1.
- ES256 → `getClaims()` ở Header không tốn round trip; `proxy.ts` vẫn dùng `getUser()` làm hàng rào bảo vệ (spec 2B mục 4).

## Cách kiểm lại bằng số, không đoán

**1. Lệnh không cần token.** Chạy từ thư mục gốc repo (nạp `.env.local` chứa URL và key công khai; chỉ `GET`, không đăng nhập):

```bash
set -a; . ./.env.local; set +a
curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/settings" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" | python -m json.tool
```

Kỳ vọng: `"disable_signup": false`, `"mailer_autoconfirm": true`, `"email": true` và `"anonymous_users": false` (trong khối `external`); mọi provider khác `false`.

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/.well-known/jwks.json" | python -m json.tool
```

Kỳ vọng: đúng 1 khoá với `"kty": "EC"`, `"alg": "ES256"`, `"crv": "P-256"`.

**2. Management API (cần access token cá nhân).** Tạo token ở https://supabase.com/dashboard/account/tokens, đặt vào biến môi trường của phiên terminal, **không lưu vào file hay repo**. `PROJECT_REF` là phần đầu của `NEXT_PUBLIC_SUPABASE_URL` (trước `.supabase.co`).

```bash
curl -s "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | python -c "import sys,json,re; d=json.load(sys.stdin); [print(k,'=',v) for k,v in sorted(d.items()) if re.search('autoconfirm|secure|password|otp|signup|anonymous|linking|site_url|uri_allow|rate_limit_email|hibp', k)]"
```

Lệnh lọc theo từ khoá thay vì liệt kê tên trường cố định, vì tên trường do Supabase đặt và có thể đổi; đối chiếu từng dòng in ra với các bảng ở trên.

**3. Kiểm bằng hành vi.** Chạy lại Bước 0 của spec 2B (`signUp` phải trả session ngay) — đây là phép thử trực tiếp nhất cho "Confirm email tắt".

**4. Không đọc được bằng cách nào ngoài Dashboard** (khi không có token): Allow manual linking, Secure password change, Require current password, Prevent leaked passwords, Minimum password length, Password requirements, Email OTP expiration và length, Rate Limits, Site URL, Redirect URLs.

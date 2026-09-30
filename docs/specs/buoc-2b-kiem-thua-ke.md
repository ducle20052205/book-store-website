# Đợt 2B — Kiểm tra thừa kế từ đợt 2A

Bước 2 · Tài khoản người dùng · phiên bản 1.0 · 30/09/2026

Ba việc dưới đây thuộc tiêu chí của đợt 2A (`docs/specs/buoc-2a-ha-tang-auth.md`) nhưng cần một **phiên đăng nhập thật** mà 2A không tạo được: chưa có trang `/dang-nhap` (thuộc 2B) và `/auth/callback` (thuộc 2C). Phần kiểm ở tầng database của các tiêu chí này đã làm xong ở 2A.

**Điều kiện bắt buộc trước khi đóng đợt 2B:** cả ba mục phải có kết quả đo thực ghi trong báo cáo đợt 2B. Thiếu một mục thì đợt 2B chưa được coi là hoàn thành.

Dùng tài khoản thử tạo riêng (không dùng tài khoản admin hay tài khoản cá nhân), xoá sau khi kiểm xong.

## 1. `updateUser({ email })` bằng tài khoản thật (tiêu chí 15 của 2A)

Đã kiểm ở 2A (tầng database): `update auth.users set email = …` làm `profiles.email` khớp theo, cờ `app.sync_auth_email` tắt lại sau trigger, một `UPDATE profiles.email` khác trong cùng transaction vẫn bị khoá.

Cách kiểm:

1. Đăng nhập bằng tài khoản thử tại `/dang-nhap`.
2. Gọi `createClient().auth.updateUser({ email: '<địa chỉ thử>' })` (client trình duyệt ở `lib/supabase/client.ts`) từ một Client Component hoặc script tạm, không commit. Địa chỉ thử phải là hộp thư mình kiểm soát được.
3. Ghi lại hành vi quan sát được khi email confirmation đang tắt: đổi áp dụng ngay, hay Supabase vẫn gửi thư xác nhận (tới địa chỉ nào). Nếu cần xác nhận thì hoàn tất bước đó rồi mới đọc lại.
4. Đọc lại: `select p.email as profiles_email, u.email as auth_email from public.profiles p join auth.users u on u.id = p.id where p.id = '<id tài khoản thử>';`

Đạt khi: `profiles_email` và `auth_email` khớp nhau và bằng địa chỉ thử.

## 2. `/admin` với tài khoản `customer` (tiêu chí 22 của 2A)

Đã kiểm ở 2A: chưa đăng nhập, `/admin` và `/admin/sach` chuyển hướng (HTTP 307) tới `/dang-nhap?next=…`.

Cách kiểm:

1. Đăng nhập bằng tài khoản thử có `role = 'customer'`.
2. Mở `/admin`, rồi `/admin/sach`. Ghi mã trạng thái và URL cuối từ tab Network.

Đạt khi: cả hai bị chuyển hướng (HTTP 307) về `/`, không hiện giao diện quản trị.

Đối chứng (nếu có sẵn tài khoản admin theo `docs/runbooks/tao-admin-dau-tien.md`): với admin, `/admin` không bị chuyển về `/` (trang trả 404 vì chưa có giao diện quản trị, thuộc bước 7).

## 3. Luồng đăng xuất có phiên thật (mục 6 của 2A)

Đã kiểm ở 2A: Server Action `signOut` chạy không lỗi khi gọi không có phiên (POST trả 200).

Cách kiểm: đăng nhập cùng một tài khoản thử ở hai trình duyệt (hoặc hai hồ sơ trình duyệt) A và B, rồi ở A:

1. Header hiện "Tài khoản" (không phải "Đăng nhập"). Mở menu, bấm "Đăng xuất". Lặp lại ở 375px với sheet tài khoản.
2. Không tải lại trang: header đổi về "Đăng nhập".
3. Tab Application → Cookies: không còn cookie `sb-<project-ref>-auth-token*`.
4. Mở `/tai-khoan`: chuyển hướng (HTTP 307) tới `/dang-nhap?next=%2Ftai-khoan`.
5. Ở B, tải lại trang: vẫn hiện "Tài khoản" — đăng xuất chỉ xoá phiên hiện tại (`scope: "local"`, FR-5.3), không đăng xuất các thiết bị khác.

Đạt khi: cả năm bước cho kết quả như trên, ở cả dropdown (≥ 768px) lẫn sheet (< 768px).

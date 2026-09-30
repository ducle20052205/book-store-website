# Đợt 2B — Kiểm tra thừa kế từ đợt 2A

Bước 2 · Tài khoản người dùng · phiên bản 1.1 · 30/09/2026

Ba việc ở mục 1–3 thuộc tiêu chí của đợt 2A (`docs/specs/buoc-2a-ha-tang-auth.md`) nhưng cần một **phiên đăng nhập thật** mà 2A không tạo được: chưa có trang `/dang-nhap` (thuộc 2B) và `/auth/callback` (thuộc 2C). Phần kiểm ở tầng database của các tiêu chí này đã làm xong ở 2A. Mục 4–5 là hai việc tồn đọng khác phát hiện trong 2A, không thuộc tiêu chí nào của 2A.

**Điều kiện bắt buộc trước khi đóng đợt 2B:** cả ba mục 1–3 phải có kết quả đo thực ghi trong báo cáo đợt 2B. Thiếu một mục thì đợt 2B chưa được coi là hoàn thành.

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

## 4. Nhãn tài khoản ở header nháy về "Đăng nhập" (tồn đọng từ 2A)

Hiện trạng đo ở 2A: mục tài khoản nằm trong `<Suspense>` để trang còn render tĩnh được, và fallback luôn là trạng thái chưa đăng nhập. Người đã đăng nhập vì thế thấy "Đăng nhập" khoảng 100–200 ms rồi mới đổi sang "Tài khoản". Bề rộng hai trạng thái đã cân bằng (`sm:min-w-[135px]`) nên không gây dịch layout, nhưng nhãn vẫn nháy sai.

Hướng sửa dự kiến: ở `components/Header.tsx`, thay `getUser()` bằng `getClaims()`. Dự án dùng khoá bất đối xứng ES256 nên `getClaims()` xác thực JWT ngay trong tiến trình bằng khoá công khai (JWKS), không gọi máy chủ Auth — bỏ được vòng gọi mạng khoảng 99 ms của `getUser()`. Header chỉ cần biết có phiên hay không, thông tin đó nằm trong JWT.

Ngoài phạm vi mục này: `proxy.ts` vẫn gọi `getUser()` để làm mới phiên, nên TTFB của request có phiên vẫn khoảng 100 ms; đổi `proxy.ts` là quyết định riêng.

Cách kiểm: đăng nhập bằng tài khoản thử, mở `/` bằng bản `npm run build && npm start`, đo trong tab Performance (hoặc `PerformanceObserver` + `MutationObserver` trên mục tài khoản) khoảng thời gian từ lúc shell hiện tới lúc nhãn "Đăng nhập" đổi thành "Tài khoản". Đo ít nhất 5 lần, lấy trung vị.

Đạt khi: trung vị dưới 50 ms với phiên đăng nhập thật. Lưu ý khi đo: sau khi có phiên, Header còn một truy vấn `profiles` lấy `full_name`; nếu tổng vẫn chưa dưới 50 ms thì ghi rõ phần nào (giải mã claims hay truy vấn `profiles`) chiếm thời gian trước khi quyết định bước tiếp.

## 5. Cache Components giữ trang cũ ở trạng thái ẩn khi điều hướng (tồn đọng từ 2A)

Khi bật Cache Components, Next.js giữ các trang đã rời đi ở trạng thái ẩn (`<Activity>`) thay vì huỷ, nên state client của chúng có thể còn sống khi quay lại.

Đã kiểm ở 2A: `page_view` không bị ghi đôi khi điều hướng qua lại giữa các trang.

Còn phải rà: ba chỗ dưới đây có giữ nhầm trạng thái khi quay lại trang hay không.

Cách kiểm (bản `npm run build && npm start`, mỗi chỗ thử cả bấm liên kết lẫn nút Back/Forward của trình duyệt):

1. Bộ lọc catalog ở `/sach`: đổi bộ lọc hoặc cách sắp xếp, vào một sách, rồi quay lại. Đối chiếu điều khiển bộ lọc trên màn hình với query string trên URL và danh sách sách hiển thị.
2. Menu tài khoản: mở dropdown (≥ 768px) và sheet (< 768px), điều hướng sang trang khác rồi quay lại. Ghi menu đang mở hay đã đóng.
3. Ô tìm kiếm ở header: gõ chữ (chưa gửi), sang trang khác rồi quay lại; và sau một lần tìm ở `/sach?q=…`, sang trang khác rồi quay lại. Đối chiếu nội dung ô với URL hiện tại.

Đạt khi: không chỗ nào hiển thị trạng thái mâu thuẫn với URL hoặc với dữ liệu đang hiện. Chỗ nào lệch thì ghi rõ hành vi quan sát được và hướng xử lý vào báo cáo đợt 2B.

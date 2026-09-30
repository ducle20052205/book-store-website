# Đợt 2B — Đăng nhập và đăng ký

Bước 2 · Tài khoản người dùng · phiên bản 1.0 · 30/09/2026
Nhánh: `feature/buoc-2b-dang-nhap-dang-ky`

Tài liệu liên quan: `docs/SRS.md` (FR-5.1, FR-5.3, FR-8.3, FR-8.4),
`docs/specs/buoc-2a-ha-tang-auth.md`, `docs/specs/buoc-2b-kiem-thua-ke.md`,
`docs/mockups/buoc-2/`.

---

## 1. Vì sao có đợt này

Đợt 2A dựng xong hạ tầng: client Supabase theo cookie, `proxy.ts`, header hai
trạng thái, trigger đồng bộ email. Nhưng chưa có đường nào để một người thật
đăng nhập, nên năm thứ vẫn treo:

1. Không có `/dang-nhap` và `/dang-ky`.
2. Header đang gọi `getUser()` rồi query `profiles` để lấy tên, khiến người đã
   đăng nhập thấy nhãn "Đăng nhập" khoảng 100–200ms trước khi nó đổi.
3. Ba tiêu chí của 2A chưa kiểm được vì cần phiên thật (xem
   `buoc-2b-kiem-thua-ke.md` mục 1–3).
4. `?next=` đã có ở `proxy.ts` nhưng chưa có trang nào đọc nó.
5. FR-3.4 cần một điểm móc để đợt 3 gắn việc gộp giỏ hàng vào.

## 2. Phạm vi

**Thuộc phạm vi**
- Trang `/dang-nhap` và `/dang-ky`, desktop và mobile.
- Header đổi sang `getClaims()`, bỏ truy vấn `profiles`.
- Dải thông báo chào mừng sau khi đăng ký.
- Xử lý `?next=` ở tầng trang.
- Hàm `mergeGuestCart()` rỗng, gọi đúng chỗ.
- Ghi sự kiện `sign_up` và `login`.
- Kiểm năm mục của `buoc-2b-kiem-thua-ke.md`.

**Ngoài phạm vi**
- `/quen-mat-khau`, `/dat-lai-mat-khau`, `/auth/callback`, template email (2C).
- `/tai-khoan`, bảng `provinces`/`wards`, đổi mật khẩu (2D).
- Ruột của `mergeGuestCart()` (đợt 3).
- Magic link, đăng nhập bằng Google, wishlist, bot protection.

## 3. Bước 0 — Kiểm chứng trước khi viết code

Toàn bộ thiết kế Header ở mục 4 dựa trên một giả định chưa kiểm: access token
của dự án có chứa `user_metadata` với `full_name` hay không.

Cách kiểm: tạo một tài khoản thử bằng script Node với anon key
(`signUp` kèm `options.data.full_name`), lấy access token, giải mã phần payload
(base64, không cần verify chữ ký vì chỉ để đọc), in ra các claim có trong đó.
Xoá tài khoản thử ngay sau khi kiểm.

- **Nếu có `user_metadata.full_name` và `email`:** làm theo mục 4.
- **Nếu không có:** DỪNG và báo. Khi đó Header chỉ hiện trạng thái đăng nhập,
  còn tên và email lấy bằng một truy vấn `profiles` chạy khi dropdown mở lần
  đầu, không phải khi render trang.

Ghi kết quả kiểm chứng vào báo cáo, kèm danh sách claim (che giá trị email).

## 4. Header — bỏ nháy trạng thái

Vấn đề hiện tại: `<Suspense>` gửi fallback "Đăng nhập" trước, rồi nội dung thật
stream vào sau. Độ trễ đến từ hai chỗ: `getUser()` gọi mạng tới Auth server
(~99ms đo ở 2A), và một truy vấn `profiles` lấy `full_name`.

Cách sửa:
- Đổi `getUser()` thành `getClaims()` trong phần Header. Dự án đã bật khoá bất
  đối xứng ES256, nên `getClaims()` xác minh JWT cục bộ bằng JWKS, không cần
  round trip.
- Bỏ hẳn truy vấn `profiles` khỏi Header. Tên và email lấy từ claim.
- `proxy.ts` **giữ nguyên `getUser()`**. Đó là hàng rào bảo mật: `getUser()`
  hỏi Auth server nên phát hiện được token đã bị thu hồi, còn `getClaims()` chỉ
  xác minh chữ ký. Header là hiển thị, proxy là bảo vệ — hai chỗ chịu mức rủi
  ro khác nhau, không đồng nhất.
- Ghi vào code một comment nêu đúng lý do phân biệt trên.

Đánh đổi phải ghi vào spec và vào SRS: JWT làm mới mỗi giờ, nên khi đợt 2D cho
sửa họ tên thì dropdown hiện tên cũ tới lần refresh kế tiếp. Vá ở 2D bằng
`refreshSession()` ngay sau khi lưu hồ sơ.

## 5. Trang `/dang-nhap`

Tham chiếu `docs/mockups/buoc-2/dang-nhap.png` (desktop) và khung trái của
`mobile.png`.

**Bố cục** — thẻ 1040px chia 440px cột editorial nền `cham-900` và 600px cột
form. Mobile một cột, cột editorial rút còn khối trích dẫn đặt dưới form.

**Trường**
| Trường | Thuộc tính |
|---|---|
| Email | `type="email"`, `autocomplete="username"`, `required` |
| Mật khẩu | `type="password"`, `autocomplete="current-password"`, `required`, kèm nút Hiện/Ẩn |

**Quy tắc**
- Không có ô nhập lại mật khẩu.
- Nút Hiện/Ẩn là `<button type="button">`, có `aria-pressed`, đổi nhãn theo
  trạng thái.
- Link "Quên mật khẩu?" trỏ `/quen-mat-khau` — trang chưa tồn tại ở đợt này,
  chấp nhận 404, ghi rõ trong báo cáo.
- Đăng nhập sai thì **giữ nguyên email đã gõ**, chỉ xoá ô mật khẩu.
- Thông báo lỗi đặt phía trên form, không phải dưới từng ô, để trình đọc màn
  hình đọc được ngay khi nó xuất hiện (`role="alert"`).

## 6. Trang `/dang-ky`

Tham chiếu `docs/mockups/buoc-2/dang-ky.png`.

**Trường, đúng thứ tự**
| Trường | Thuộc tính |
|---|---|
| Họ và tên | `type="text"`, `autocomplete="name"`, `required` |
| Email | `type="email"`, `autocomplete="username"`, `required` |
| Nhập lại email | `type="email"`, không `autocomplete`, `required` |
| Mật khẩu | `type="password"`, `autocomplete="new-password"`, `required`, nút Hiện/Ẩn |

**Quy tắc**
- Mật khẩu tối thiểu 8 ký tự, **không** áp đặt loại ký tự (FR-5.1).
- Yêu cầu mật khẩu hiển thị ngay dưới ô từ đầu, không đợi báo lỗi.
- Thanh đo độ mạnh chỉ để gợi ý, **không chặn** gửi form.
- Hai ô email lệch nhau thì chặn gửi, báo lỗi ngay dưới ô thứ hai.
- `full_name` truyền qua `options.data.full_name`, đã cắt khoảng trắng thừa.
- Không có ô nhập lại mật khẩu.

**Sau khi đăng ký thành công**
- `signUp` trả session ngay (email confirmation đang tắt).
- Gọi `mergeGuestCart()` (mục 8).
- Ghi sự kiện `sign_up`.
- Điều hướng theo `?next=` nếu hợp lệ, không thì về `/`, kèm dải thông báo chào
  mừng (mục 7).

## 7. Dải thông báo chào mừng

Không dùng toast. Toast tự tắt vi phạm WCAG 2.2.1 Timing Adjustable: nội dung
người dùng cần đọc không được đặt trên đồng hồ không chỉnh được, và người dùng
bàn phím hoặc trình đọc màn hình thường chưa kịp đọc đã mất.

- Dải nằm trong luồng trang, ngay dưới header của trang đích.
- Kiểu dáng theo ô "thành công" trong `bo-trang-thai-thong-bao.png`: nền
  `#E7F0EA`, viền trái 3px `#266E48`, bo 2px.
- Nội dung: "Chào bạn, tài khoản đã sẵn sàng. Giỏ hàng và địa chỉ của bạn sẽ
  được lưu lại từ giờ."
- Có nút đóng 44×44px với `aria-label`. **Không tự tắt.**
- `role="status"`.
- Trạng thái truyền qua query param (ví dụ `?chao=1`), xoá khỏi URL sau khi
  hiện bằng `history.replaceState` để refresh không hiện lại.

## 8. `?next=` và `mergeGuestCart()`

**Xác thực `?next=`** — chỉ chấp nhận path nội bộ:
- Bắt đầu bằng `/`
- Không bắt đầu bằng `//`
- Không bắt đầu bằng `/\`
- Không hợp lệ hoặc không có thì về `/`

Logic này đã có ở `proxy.ts` từ 2A. Tách thành một hàm dùng chung
(`lib/nextParam.ts`), gọi ở cả proxy lẫn hai trang, để không có hai bản luật
lệch nhau.

**`mergeGuestCart()`** — tạo `lib/cart/mergeGuestCart.ts`:
```ts
// Đợt 3 (FR-3.4) sẽ điền ruột: đọc giỏ trong localStorage,
// gộp vào bảng cart_items của user, rồi xoá localStorage.
export async function mergeGuestCart(): Promise<void> {
  return;
}
```
Gọi ngay sau khi đăng nhập và sau khi đăng ký thành công, trước khi điều hướng.
Không gọi ở chỗ nào khác.

## 9. Ghi sự kiện

- `sign_up` khi đăng ký thành công, `login` khi đăng nhập thành công.
- `metadata` đúng dạng `{"method":"password"}`.
- **Tuyệt đối không có email trong metadata** (FR-8.5).
- Ghi sau khi đã có session, không chặn điều hướng nếu ghi lỗi.

## 10. Thông báo lỗi

Mọi lỗi hiển thị bằng tiếng Việt, giọng "chúng mình", không lộ mã lỗi kỹ thuật,
luôn nói người dùng làm gì tiếp theo. Bảng ánh xạ tối thiểu:

| Lỗi từ Supabase | Hiển thị |
|---|---|
| `Invalid login credentials` | Email hoặc mật khẩu chưa đúng. Bạn thử lại nhé, hoặc [đặt lại mật khẩu]. |
| `User already registered` | Email này đã có tài khoản rồi. [Đăng nhập] hoặc [lấy lại mật khẩu]. |
| Lỗi liên quan rate limit | Bạn thử lại sau ít phút giúp chúng mình nhé. |
| Lỗi mạng hoặc không rõ | Có gì đó chưa ổn ở phía chúng mình. Bạn thử lại sau ít phút nhé. |

Bắt mọi lỗi còn lại bằng nhánh cuối, không để thông báo tiếng Anh lọt ra giao
diện. Ghi lỗi gốc vào log server để còn debug.

Lưu ý: việc nói thẳng "email này đã có tài khoản" là đánh đổi có ý thức — dễ
dùng hơn, đổi lại để lộ email nào có trong hệ thống. Chỉ hoạt động vì email
confirmation đang tắt; nếu sau này bật lên, Supabase sẽ cố tình che thông tin
này và thông báo phải viết lại.

## 11. Năm mục kế thừa từ 2A

Làm theo `docs/specs/buoc-2b-kiem-thua-ke.md`. Tóm tắt:

1. Tiêu chí 15 — `updateUser({ email })` với phiên thật.
2. Tiêu chí 22 — `/admin` với phiên `customer`.
3. Luồng đăng xuất với phiên thật.
4. Nháy trạng thái header (mục 4 của spec này xử lý, mục này đo lại).
5. Cache Components giữ trạng thái trang cũ — rà bộ lọc catalog, menu tài
   khoản, ô tìm kiếm.

## 12. Hoàn thành khi

Mỗi mục kèm số đo hoặc kết quả lệnh trong báo cáo.

**Kiểm chứng và không hồi quy**
1. Bước 0 cho kết quả rõ ràng: JWT có hay không có `user_metadata.full_name`.
   Tài khoản thử đã xoá, `auth.users` và `profiles` về đúng số dòng ban đầu.
2. `npm run build` exit 0, `tsc` 0 lỗi, `lint` 0 lỗi.
3. TTFB trung vị 5 lần, không xấu hơn mốc 2A quá 20%: `/` 4,2ms, `/tu-sach`
   4,3ms, `/sach` 4,6ms. Ghi cả thời gian tải xong (`/` 22,5ms, `/tu-sach`
   17,4ms, `/sach` 113–119ms).
4. `/sach` trang 1 có 20 thẻ, `?page=2` có 20, tổng 40. `?q=nha gia kim` ra 1
   kết quả. `?category=van-hoc` ra 10 sách.
5. `grep -rn "SERVICE_ROLE" .next/static` trả 0 dòng.

**Header**
6. `grep` trong code Header: không còn lần gọi `getUser()` nào; `proxy.ts` vẫn
   còn `getUser()`.
7. Header không còn truy vấn `profiles`: đếm số truy vấn database khi render
   `/` lúc chưa đăng nhập và lúc đã đăng nhập, hai con số phải bằng nhau.
8. Thời gian từ lúc shell hiện tới lúc nhãn tài khoản đổi, đo với phiên thật:
   **dưới 50ms**, trung vị 5 lần. Không đạt thì ghi số thật và nói rõ vướng ở
   đâu, đừng nới mục tiêu.
9. Dropdown hiện đúng họ tên và email của tài khoản đang đăng nhập.

**Đăng nhập**
10. Đăng nhập đúng: chuyển sang trang đích, header đổi sang trạng thái đã đăng
    nhập, refresh vẫn giữ.
11. Đăng nhập sai mật khẩu: hiện đúng câu ở mục 10, ô email **giữ nguyên giá
    trị đã gõ**, ô mật khẩu rỗng.
12. Đăng nhập bằng email chưa đăng ký: hiện cùng câu như sai mật khẩu (không
    phân biệt, tránh dò email).

**Đăng ký**
13. Đăng ký đủ trường: tạo được tài khoản, có session ngay, `profiles` có
    `email` và `full_name` đúng, `role = 'customer'`.
14. Mật khẩu 7 ký tự: bị chặn, báo lỗi rõ. Mật khẩu 8 ký tự toàn chữ thường:
    **được chấp nhận**.
15. Hai ô email lệch nhau: chặn gửi, báo lỗi dưới ô thứ hai.
16. Đăng ký bằng email đã tồn tại: hiện đúng câu ở mục 10 kèm link đăng nhập.
17. Dải chào mừng hiện ở trang đích, **không tự tắt** sau 30 giây, đóng được
    bằng nút, refresh không hiện lại.

**`?next=`**
18. Năm trường hợp, ghi URL cuối cho từng cái:
    `?next=%2Fsach` → `/sach`;
    `?next=%2F%2Fevil.com` → `/`;
    `?next=%2F%5Cevil.com` → `/`;
    `?next=https%3A%2F%2Fevil.com` → `/`;
    không có `next` → `/`.
19. `grep` xác nhận luật `?next=` chỉ được định nghĩa ở một file, `proxy.ts` và
    hai trang đều import từ đó.

**Sự kiện**
20. Đăng ký xong: đúng 1 dòng `sign_up` trong `events`, `metadata` là
    `{"method":"password"}`, `user_id` khớp.
21. Đăng nhập xong: đúng 1 dòng `login`, cùng dạng metadata.
22. Truy vấn toàn bộ `events` của hai thao tác trên: **không dòng nào chứa
    chuỗi `@`** trong `metadata`.

**Kế thừa từ 2A**
23. Tiêu chí 15 của 2A: `updateUser({ email })` với phiên thật, `profiles.email`
    khớp `auth.users.email`. Ghi rõ hành vi khi email confirmation tắt.
24. Tiêu chí 22 của 2A: phiên `customer` mở `/admin` bị chuyển về `/`, không
    render giao diện quản trị.
25. Đăng xuất với phiên thật: header về trạng thái chưa đăng nhập, refresh vẫn
    thế, cookie phiên đã bị xoá.
26. Cache Components: vào `/sach?category=van-hoc`, sang `/`, quay lại — bộ lọc
    không bị giữ sai; mở dropdown tài khoản, điều hướng đi rồi quay lại —
    dropdown không tự mở lại.

**Giao diện và tiếp cận**
27. Ở 1280px: thẻ form rộng 1040px, chia 440/600. Ở 375px: không cuộn ngang,
    mọi vùng chạm ≥ 44×44px, ô nhập cao 48px font 16px.
28. Mọi cặp chữ/nền trên hai trang mới đạt tương phản ≥ 4,5:1 (biểu tượng
    ≥ 3:1). Liệt kê từng cặp kèm tỷ số.
29. Tab qua toàn bộ form theo đúng thứ tự thị giác; nút Hiện/Ẩn có
    `aria-pressed`; thông báo lỗi có `role="alert"`.
30. Ảnh chụp toàn trang thu nhỏ: `/dang-nhap` và `/dang-ky` ở 1280px và 375px,
    cộng một ảnh dải chào mừng. Không phải ảnh cận cảnh.

**Dọn dẹp**
31. Mọi tài khoản thử đã xoá. `auth.users` và `profiles` chỉ còn các dòng có
    trước đợt này. Không còn file hay route tạm nào trong `git status`.

## 13. Điều cần làm rõ trước khi code

Dừng lại và hỏi, đừng tự chọn, nếu gặp:

- Bước 0 cho kết quả JWT **không** chứa `user_metadata.full_name`.
- Đổi Header sang `getClaims()` làm hỏng luồng nào đó của 2A.
- Tiêu chí 8 (dưới 50ms) không đạt dù đã bỏ truy vấn `profiles` — chứng minh
  bằng số đo rồi đề nghị sửa spec.
- Supabase trả lỗi khác với bảng ở mục 10 mà không rõ nên ánh xạ thế nào.
- `signUp` bị chặn bởi rate limit hoặc Auth từ chối domain dùng để thử.

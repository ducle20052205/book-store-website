# Đợt 2B — Đăng nhập và đăng ký

Bước 2 · Tài khoản người dùng · phiên bản 1.1 · 30/09/2026
Nhánh: `feature/buoc-2b-dang-nhap-dang-ky`

Tài liệu liên quan: `docs/SRS.md` (FR-5.1, FR-5.3, FR-8.3, FR-8.4),
`docs/specs/buoc-2a-ha-tang-auth.md`, `docs/mockups/buoc-2/`.

---

## 1. Vì sao có đợt này

Đợt 2A dựng xong hạ tầng: client Supabase theo cookie, `proxy.ts`, header hai
trạng thái, trigger đồng bộ email. Nhưng chưa có đường nào để một người thật
đăng nhập, nên năm thứ vẫn treo:

1. Không có `/dang-nhap` và `/dang-ky`.
2. Header đang gọi `getUser()` rồi query `profiles` để lấy tên, khiến người đã
   đăng nhập thấy nhãn "Đăng nhập" khoảng 100–200ms trước khi nó đổi.
3. Năm việc của 2A chưa kiểm được vì cần phiên thật: tiêu chí 13, 14, 15, 22
   và luồng đăng xuất (xem mục 11.1–11.3, 11.6–11.7).
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
- Kiểm bảy mục kế thừa từ 2A (mục 11).

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

**Token** — dùng chung cho cả `/dang-ky` (mục 6): `radius-field` cho ô nhập và
nút, `radius-menu` cho thẻ form, `line-field` cho viền ô nhập và select. Không
viết hex hay số px bo góc cứng.

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

Luật này **chưa có** ở `proxy.ts` từ 2A (proxy chỉ tạo giá trị `next` từ đường
dẫn của chính request, chưa kiểm tra gì). Viết thành một hàm dùng chung
(`lib/nextParam.ts`, `safeNextPath`), gọi ở proxy, hai form và mọi nơi khác đọc
hay ghi `?next=`, để không có hai bản luật lệch nhau. Ngoài ba luật trên, hàm còn
dựng URL thật rồi so origin, bắt trường hợp chèn tab hoặc xuống dòng (`/<tab>/host`
bị bộ phân tích URL đọc thành `//host`).

**Liên kết "Đăng nhập" ở header** mang `?next=` là đường dẫn hiện tại (kèm query),
tạo bằng `safeNextPath`; đường dẫn hiện tại là `/` thì không thêm tham số; ở
`/dang-nhap` và `/dang-ky` giữ nguyên `next` mà trang đang có thay vì lấy chính
trang đó làm đích. Nhờ vậy câu "Đăng nhập xong bạn quay lại đúng trang đang xem"
ở cuối form đăng nhập là đúng sự thật.

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

## 11. Bảy mục kế thừa từ 2A

Năm mục 11.1, 11.2, 11.3, 11.6, 11.7 là tiêu chí (hoặc luồng) của đợt 2A
(`docs/specs/buoc-2a-ha-tang-auth.md`) nhưng cần một **phiên đăng nhập thật** mà
2A không tạo được: chưa có `/dang-nhap` (thuộc 2B) và `/auth/callback` (thuộc
2C). Phần kiểm ở tầng database của các tiêu chí này đã làm xong ở 2A. Hai mục
11.4 và 11.5 là tồn đọng khác phát hiện trong 2A, không thuộc tiêu chí nào của
2A.

**Cả bảy mục đều bắt buộc trước khi đóng đợt 2B:** mỗi mục phải có kết quả đo
thực ghi trong báo cáo đợt 2B. Thiếu một mục thì đợt 2B chưa được coi là hoàn
thành.

**Tài khoản thử.** Tạo qua chính trang `/dang-ky` của đợt này — không dùng lại
tài khoản của Bước 0 (đã xoá ngay sau Bước 0), không dùng tài khoản admin thật
hay tài khoản cá nhân. Tài khoản đăng ký qua `/dang-ky` có `role = 'customer'`.
Mục 11.2 (đối chứng) và 11.7 cần thêm một tài khoản admin thử: tạo cũng qua
`/dang-ky`, rồi thăng cấp theo `docs/runbooks/tao-admin-dau-tien.md`. Xoá mọi tài
khoản thử sau khi kiểm xong.

### 11.1 `updateUser({ email })` bằng tài khoản thật (tiêu chí 15 của 2A)

Đã kiểm ở 2A (tầng database): `update auth.users set email = …` làm
`profiles.email` khớp theo, cờ `app.sync_auth_email` tắt lại sau trigger, một
`UPDATE profiles.email` khác trong cùng transaction vẫn bị khoá.

**Vì sao cách kiểm khác bản đầu.** Project hosted bật Secure email change (xem
`docs/runbooks/cau-hinh-supabase-auth.md`): đổi email phải xác nhận ở cả địa chỉ
cũ lẫn địa chỉ mới, nên `auth.users.email` **không** đổi ngay khi gọi
`updateUser({ email })`. Đòi cả hai cột bằng địa chỉ mới ngay sau lệnh gọi là
không đạt được. Thứ cần chứng minh là trigger `sync_profile_email`, chạy khi
`auth.users.email` thật sự đổi.

Cách kiểm:

1. Đăng nhập bằng tài khoản thử tại `/dang-nhap`.
2. Gọi `createClient().auth.updateUser({ email: '<địa chỉ mới>' })` (client
   trình duyệt ở `lib/supabase/client.ts`) từ một Client Component hoặc script
   tạm, không commit.
3. Ghi lại hành vi quan sát được: Supabase trả về gì (`data.user` có `new_email`
   không), có gửi thư xác nhận không và tới những địa chỉ nào; xác nhận
   `auth.users.email` chưa đổi. Đây là ghi nhận hành vi, không phải điều kiện
   đạt.
4. Làm cho `auth.users.email` thật sự đổi, bằng một trong hai cách: (a) xác nhận
   ở cả hai địa chỉ — chỉ làm được khi cả địa chỉ cũ lẫn mới đều là hộp thư mình
   kiểm soát được (tài khoản thử đăng ký bằng địa chỉ `@example.com` thì không
   nhận được thư); (b) thao tác admin: Dashboard → Authentication → Users → sửa
   email của tài khoản thử, hoặc trong SQL Editor `update auth.users set email =
   '<địa chỉ mới>' where id = '<id tài khoản thử>';`.
5. Đọc lại: `select p.email as profiles_email, u.email as auth_email from
   public.profiles p join auth.users u on u.id = p.id where p.id = '<id tài khoản
   thử>';`

Đạt khi: sau khi `auth.users.email` đổi, `profiles.email` khớp giá trị mới
(`profiles_email` = `auth_email` = địa chỉ mới) (tiêu chí 23).

### 11.2 `/admin` với tài khoản `customer` (tiêu chí 22 của 2A)

Đã kiểm ở 2A: chưa đăng nhập, `/admin` và `/admin/sach` chuyển hướng (HTTP 307)
tới `/dang-nhap?next=…`.

Cách kiểm:

1. Đăng nhập bằng tài khoản thử có `role = 'customer'`.
2. Mở `/admin`, rồi `/admin/sach`. Ghi mã trạng thái và URL cuối từ tab Network.

Đối chứng: đăng nhập bằng tài khoản admin thử (xem "Tài khoản thử" ở đầu mục
này), mở `/admin`: không bị chuyển về `/`; kỳ vọng HTTP 404 vì chưa có giao diện
quản trị (thuộc bước 7).

Đạt khi: cả `/admin` và `/admin/sach` với `customer` bị chuyển hướng (HTTP 307)
về `/`, không hiện giao diện quản trị; đối chứng với admin cho 404 (tiêu chí 24).

### 11.3 Luồng đăng xuất có phiên thật (mục 6 của 2A)

Đã kiểm ở 2A: Server Action `signOut` chạy không lỗi khi gọi không có phiên (POST
trả 200).

Cách kiểm: đăng nhập cùng một tài khoản thử ở hai trình duyệt (hoặc hai hồ sơ
trình duyệt) A và B, rồi ở A:

1. Header hiện "Tài khoản" (không phải "Đăng nhập"). Mở menu, bấm "Đăng xuất".
   Lặp lại toàn bộ ở 375px với sheet tài khoản.
2. Không tải lại trang: header đổi về "Đăng nhập".
3. Tab Application → Cookies: không còn cookie `sb-<project-ref>-auth-token*`.
4. Mở `/tai-khoan`: chuyển hướng (HTTP 307) tới `/dang-nhap?next=%2Ftai-khoan`.
5. Tải lại trang: vẫn ở trạng thái chưa đăng nhập.
6. Ở B, tải lại trang: vẫn hiện "Tài khoản" — đăng xuất chỉ xoá phiên hiện tại
   (`scope: "local"`, FR-5.3), không đăng xuất các thiết bị khác.

Đạt khi: cả sáu bước cho kết quả như trên, ở cả dropdown (≥ 768px) lẫn sheet
(< 768px) (tiêu chí 25 cho bước 1–5, tiêu chí 26 cho bước 6).

### 11.4 Nhãn tài khoản ở header nháy về "Đăng nhập" (tồn đọng từ 2A)

Hiện trạng đo ở 2A: mục tài khoản nằm trong `<Suspense>` để trang còn render tĩnh
được, và fallback luôn là trạng thái chưa đăng nhập. Người đã đăng nhập vì thế
thấy "Đăng nhập" khoảng 100–200 ms rồi mới đổi sang "Tài khoản". Bề rộng hai
trạng thái đã cân bằng (`sm:min-w-[135px]`) nên không gây dịch layout, nhưng nhãn
vẫn nháy sai.

Cách sửa: mục 4 của spec này (`getClaims()`, tên và email lấy từ claim, bỏ truy
vấn `profiles`). `proxy.ts` giữ `getUser()` — đã quyết ở mục 4 — nên TTFB của
request có phiên vẫn khoảng 100 ms (xem tiêu chí 3); điều đó không thuộc mục này.

Cách kiểm: đăng nhập bằng tài khoản thử, mở `/` bằng bản `npm run build && npm
start` (không đo ở `npm run dev`), đo khoảng thời gian từ lúc shell hiện tới lúc
nhãn "Đăng nhập" đổi thành "Tài khoản", bằng Performance API hoặc
`MutationObserver` trên mục tài khoản. Đo ít nhất 5 lần, lấy trung vị.

Đạt khi: trung vị dưới 50 ms với phiên đăng nhập thật (tiêu chí 8). Không đạt thì
ghi số thật, nói rõ phần nào chiếm thời gian, rồi xử lý theo mục 13.

### 11.5 Cache Components giữ trang cũ ở trạng thái ẩn khi điều hướng (tồn đọng từ 2A)

Khi bật Cache Components, Next.js giữ các trang đã rời đi ở trạng thái ẩn
(`<Activity>`) thay vì huỷ, nên state client của chúng có thể còn sống khi quay
lại.

Đã kiểm ở 2A: `page_view` không bị ghi đôi khi điều hướng qua lại giữa các
trang.

Còn phải rà: ba chỗ dưới đây có giữ nhầm trạng thái khi quay lại trang hay không.

Cách kiểm (bản `npm run build && npm start`; mỗi chỗ thử cả bấm liên kết lẫn nút
Back/Forward của trình duyệt):

1. Bộ lọc catalog ở `/sach`: đổi bộ lọc, rồi đổi cách sắp xếp (hai lần thử riêng),
   vào một sách, rồi quay lại. Đối chiếu điều khiển bộ lọc và sắp xếp trên màn
   hình với query string trên URL và danh sách sách hiển thị.
2. Menu tài khoản: mở dropdown (≥ 768px) và sheet (< 768px), điều hướng sang
   trang khác rồi quay lại. Ghi menu đang mở hay đã đóng.
3. Ô tìm kiếm ở header, hai kịch bản (dùng hai chuỗi khác nhau để nhận ra nội
   dung cũ): (a) gõ `aaa` nhưng chưa gửi, sang trang khác rồi quay lại; (b) tìm
   `aaa`, rồi tìm `bbb`, sang trang khác rồi quay lại. Ghi nội dung ô sau khi
   quay lại. Lưu ý: ô tìm kiếm trống sau khi tìm là hành vi có sẵn (đã ghi ở
   `docs/specs/dot-1.6-sua-loi-giao-dien.md` mục 5), không phải lệch của mục này.

Đạt khi: không chỗ nào hiển thị trạng thái mâu thuẫn với URL hoặc với dữ liệu
đang hiện (tiêu chí 29–31; riêng ô tìm kiếm theo đúng tiêu chí 31). Cách xử lý
khi có lệch, kể cả trường hợp phải dừng ngay, nằm ở đoạn đặt trước tiêu chí 29
ở mục 12.

### 11.6 Sửa `profiles.email` bằng phiên `customer` (tiêu chí 13 của 2A)

Đã kiểm ở 2A ở tầng database (giả lập phiên bằng transaction rồi rollback):
trigger `profiles_protect_role` ép `email` về giá trị cũ.

Cách kiểm:

1. Đăng nhập bằng tài khoản thử `customer`.
2. Từ một Client Component hoặc script tạm (không commit), gọi qua API bằng chính
   phiên đó: `createClient().from('profiles').update({ email: '<địa chỉ khác>'
   }).eq('id', '<id tài khoản thử>')`.
3. Đọc lại: `select email from public.profiles where id = '<id tài khoản thử>';`

Đạt khi: `email` không đổi (tiêu chí 27).

### 11.7 Sửa `profiles.email` bằng phiên `admin` (tiêu chí 14 của 2A)

Điểm cốt lõi của khoá `email` là admin cũng không sửa được, nên mục này không
được bỏ dù 11.6 đã đạt.

Cách kiểm: như 11.6, nhưng đăng nhập bằng tài khoản admin thử (tạo qua
`/dang-ky`, thăng cấp theo `docs/runbooks/tao-admin-dau-tien.md`, xoá sau khi kiểm
— xoá tài khoản thì quyền admin mất theo, không cần giáng cấp).

Đạt khi: `email` không đổi (tiêu chí 28).

## 12. Hoàn thành khi

Mỗi mục kèm số đo hoặc kết quả lệnh trong báo cáo.

**Kiểm chứng và không hồi quy**
1. Bước 0 cho kết quả rõ ràng: JWT có hay không có `user_metadata.full_name`.
   Tài khoản thử đã xoá, `auth.users` và `profiles` về đúng số dòng ban đầu.
2. `npm run build` exit 0, `tsc` 0 lỗi, `lint` 0 lỗi.
3. TTFB trung vị 5 lần, **đo ở trạng thái chưa đăng nhập** (mốc 2A đo ở trạng
   thái đó), không xấu hơn mốc 2A quá 20%: `/` 4,2ms, `/tu-sach` 4,3ms, `/sach`
   4,6ms. Ghi cả thời gian tải xong (`/` 22,5ms, `/tu-sach` 17,4ms, `/sach`
   113–119ms). Request có phiên dự kiến TTFB khoảng 100ms vì `proxy.ts` giữ
   `getUser()` (mục 4); đo và ghi lại con số đó riêng, không dùng để đánh giá
   đạt/trượt.
4. `/sach` trang 1 có 20 thẻ, `?page=2` có 20, tổng 40. `?q=nha gia kim` ra 1
   kết quả. `?category=van-hoc` ra 10 sách.
5. `grep -rn "SERVICE_ROLE" .next/static` trả 0 dòng.

**Header**
6. `grep` trong code Header: không còn lần gọi `getUser()` nào; `proxy.ts` vẫn
   còn `getUser()`.
7. Header không còn truy vấn `profiles`: đếm số truy vấn database khi render
   `/` lúc chưa đăng nhập và lúc đã đăng nhập, hai con số phải bằng nhau.
8. Thời gian từ lúc shell hiện tới lúc nhãn tài khoản đổi, đo với phiên thật
   trên bản `npm run build && npm start`, bằng Performance API hoặc
   `MutationObserver`, ít nhất 5 lần: **dưới 50ms**, trung vị. Không đạt thì ghi
   số thật và nói rõ vướng ở đâu, đừng nới mục tiêu.
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

**Kế thừa từ 2A** (cách kiểm chi tiết ở mục 11)
23. Tiêu chí 15 của 2A (mục 11.1): gọi `updateUser({ email })` bằng phiên thật,
    ghi lại Supabase trả về gì và có gửi thư xác nhận không (ghi nhận hành vi,
    không phải điều kiện đạt; Secure email change đang bật nên `auth.users.email`
    chưa đổi ngay, xem `docs/runbooks/cau-hinh-supabase-auth.md`). Điều kiện đạt:
    sau khi `auth.users.email` đổi (qua xác nhận cả hai địa chỉ, hoặc qua thao
    tác admin), `profiles.email` khớp giá trị mới.
24. Tiêu chí 22 của 2A (mục 11.2): phiên `customer` mở `/admin` và `/admin/sach`,
    cả hai trả HTTP 307 về `/`, không render giao diện quản trị; ghi mã và URL
    cuối từ tab Network. Đối chứng bằng tài khoản admin: `/admin` không bị chuyển
    về `/`, trả 404.
25. Đăng xuất với phiên thật (mục 11.3), ở cả dropdown (≥ 768px) và sheet (375px):
    header đổi về "Đăng nhập" không cần tải lại trang; cookie
    `sb-<project-ref>-auth-token*` bị xoá; `/tai-khoan` chuyển hướng 307 tới
    `/dang-nhap?next=%2Ftai-khoan`; tải lại trang vẫn ở trạng thái chưa đăng nhập.
26. Đăng xuất chỉ xoá phiên hiện tại (mục 11.3, `scope: "local"`, FR-5.3): sau khi
    đăng xuất ở trình duyệt A, trình duyệt B cùng tài khoản tải lại vẫn hiện
    "Tài khoản".
27. Tiêu chí 13 của 2A (mục 11.6): phiên `customer` sửa `profiles.email` của chính
    mình qua API, đọc lại: `email` không đổi.
28. Tiêu chí 14 của 2A (mục 11.7): phiên `admin` sửa `profiles.email` của chính
    mình qua API, đọc lại: `email` không đổi.

**Nhóm Cache Components (tiêu chí 29–31)** — bắt buộc phải **có số đo**, không
bắt buộc phải đạt. Tiêu chí giữ dạng đạt/không đạt, không nới. Phát hiện lệch thì
ghi "không đạt" kèm mô tả, đưa vào `docs/specs/dot-1.6-sua-loi-giao-dien.md`, và
vẫn đóng được đợt 2B.

Ngoại lệ chặn đóng đợt: nếu lệch là lỗi đúng sai chứ không phải thẩm mỹ — dữ
liệu hoặc trạng thái của một phiên lọt sang phiên khác, hiển thị sai trạng thái
đăng nhập sau khi đăng xuất, hoặc hiển thị dữ liệu của người dùng khác — thì
**dừng và báo ngay**, không ghi vào backlog.

29. Cache Components — bộ lọc catalog (mục 11.5): vào `/sach?category=van-hoc`,
    đổi bộ lọc rồi đổi cách sắp xếp, sang `/` hoặc một trang sách, quay lại bằng
    liên kết và bằng Back/Forward: điều khiển bộ lọc, điều khiển sắp xếp và danh
    sách sách khớp với query string trên URL, không bị giữ sai.
30. Cache Components — menu tài khoản (mục 11.5): mở dropdown (≥ 768px) và sheet
    (< 768px), điều hướng đi rồi quay lại bằng liên kết và bằng Back/Forward: menu
    không tự mở lại.
31. Cache Components — ô tìm kiếm (mục 11.5). Ô trống sau khi tìm là hành vi
    **đang có** (form GET không có `defaultValue`), đã ghi ở
    `docs/specs/dot-1.6-sua-loi-giao-dien.md` mục 5 — không tính là lệch của
    tiêu chí này. Chạy hai kịch bản (a) và (b) ở mục 11.5, cả liên kết lẫn
    Back/Forward: ô trống thì đạt; ô có chữ thì phải đúng chữ gõ gần nhất (`aaa`
    ở (a), `bbb` ở (b)). Trượt chỉ khi ô hiện một giá trị khác với lần gõ gần
    nhất, tức Cache Components giữ lại nội dung cũ.

**Giao diện và tiếp cận**
32. Ở 1280px: thẻ form rộng 1040px, chia 440/600. Ở 375px: không cuộn ngang,
    mọi vùng chạm ≥ 44×44px, ô nhập cao 48px font 16px.
33. Mọi cặp chữ/nền trên hai trang mới đạt tương phản ≥ 4,5:1 (biểu tượng
    ≥ 3:1). Viền ô nhập và viền select (`line-field`) đạt ≥ 3:1 so với nền thẻ
    form (WCAG 1.4.11), vì viền là thứ duy nhất nhận diện ô. Liệt kê từng cặp kèm
    tỷ số.
34. Tab qua toàn bộ form theo đúng thứ tự thị giác; nút Hiện/Ẩn có
    `aria-pressed`; thông báo lỗi có `role="alert"`.
35. Ảnh chụp toàn trang thu nhỏ: `/dang-nhap` và `/dang-ky` ở 1280px và 375px,
    cộng một ảnh dải chào mừng. Không phải ảnh cận cảnh.

**Dọn dẹp**
36. Mọi tài khoản thử đã xoá, kể cả tài khoản admin thử ở mục 11.7. `auth.users`
    và `profiles` chỉ còn các dòng có trước đợt này; số admin về đúng như trước.
    Không còn file hay route tạm nào trong `git status`.

## 13. Điều cần làm rõ trước khi code

Dừng lại và hỏi, đừng tự chọn, nếu gặp:

- Bước 0 cho kết quả JWT **không** chứa `user_metadata.full_name`.
- Đổi Header sang `getClaims()` làm hỏng luồng nào đó của 2A.
- Tiêu chí 8 (dưới 50ms) không đạt dù đã bỏ truy vấn `profiles` — chứng minh
  bằng số đo rồi đề nghị sửa spec.
- Supabase trả lỗi khác với bảng ở mục 10 mà không rõ nên ánh xạ thế nào.
- `signUp` bị chặn bởi rate limit hoặc Auth từ chối domain dùng để thử.

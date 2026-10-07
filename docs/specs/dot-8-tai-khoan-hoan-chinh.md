# Đợt 8 — Tài khoản hoàn chỉnh (quên mật khẩu + trang hồ sơ)

Phiên bản 1.1 · 07/10/2026 · Ba lỗ khiến site chưa dùng được như một cửa hàng thật: quên mật khẩu là mất tài khoản vĩnh viễn; `/tai-khoan` chỉ là một lệnh chuyển hướng; đang đăng nhập cũng không đổi được mật khẩu.
**Đổi so với 1.0** (lần sửa spec duy nhất, đã dùng): thêm `supabase/templates/` và `supabase/config.toml` vào đường dẫn được phép của TC-A.9 và bỏ chúng khỏi "ngoài phạm vi" ở mục 0 (giữ nguyên `supabase/migrations/` là ngoài phạm vi), vì template email của FR-A.8 phải là file trong repo; FR-A.8 ghi rõ "hai nơi, một nguồn"; mục 6.5 ghi nhận lỗi tiêu chí phạm vi.
Nhánh: `dot-8-tai-khoan`. Hai chặng, hai PR (mục 0.1).

**Giới hạn sửa spec: MỘT lần**, chỉ khi Claude Code chứng minh mã không thỏa được.

**Không có mockup.** Đợt này không sinh một đối tượng thị giác nào chưa có trong hệ layout đóng băng: hai màn quên mật khẩu lắp từ `AuthShell` (đang dùng ở `/dang-nhap`, `/dang-ky`), trang hồ sơ lắp từ `containerClass` + `PageTitle` + `cardClass` (đang dùng ở `/tai-khoan/don-hang`), ô nhập từ `TextField` và `PasswordField`, dải điều hướng là bản sao `AdminNav`. Duyệt bằng **ảnh chụp toàn trang sau khi xây**, không phải mockup trước khi xây.

Tài liệu tham chiếu, KHÔNG chép nội dung vào đây:
- `docs/SRS.md` **FR-5.4** (quên mật khẩu: route, chiến lược `token_hash`, lý do), **FR-5.5** (hồ sơ: `full_name`, `phone`, địa chỉ ba trường), **FR-5.6** (RLS `profiles`), **FR-5.7** (đổi mật khẩu: xác minh mật khẩu hiện tại), **FR-5.8** (`provinces`, `wards`, khoá ngoại ghép `MATCH FULL`), NFR-2.6 (custom SMTP).
- `docs/trang-quyet-dinh-dac-ta-tong.md` mục 3 (hệ layout đóng băng; thông báo quan trọng không tự tắt — WCAG 2.2.1; giọng văn), mục 5.1 (bốn Supabase client; `getClaims()` ở Header so với `getUser()` ở hàng rào; Cache Components; `lib/nextRedirect.ts`), mục 6 (repo PUBLIC), mục 8 (bài học).
- `docs/runbooks/cau-hinh-smtp.md` — **mục "Việc còn lại ở đợt 2C"** là đầu vào trực tiếp của FR-A.8.
- `docs/specs/buoc-2b-dang-nhap-dang-ky.md` (khuôn `AuthShell`, `TextField`, `PasswordField`, `classifyAuthError`, không ghi email vào log), `docs/specs/buoc-3b-checkout.md` (ô chọn tỉnh/phường, `api/dia-chi/phuong-xa`).

**Đánh số.** Tiền tố `FR-A.x`, tiêu chí `TC-A.x`. Đối ứng SRS: A.1–A.3 ↔ FR-5.4; A.4 ↔ FR-5.5; A.5 ↔ FR-5.7; A.6, A.7 không có FR riêng; A.8 ↔ FR-5.4 và NFR-2.6. SRS **không đổi** ở đợt này — mọi yêu cầu đã có sẵn.

---

## 0. Ranh giới đợt

**Trong phạm vi:** FR-A.1 → FR-A.8. Không migration, không đổi schema, không đổi policy — `profiles` đã có đủ cột và RLS từ đợt 2A/3B.

**Ngoài phạm vi:** đổi email · xoá tài khoản · ảnh đại diện · sổ nhiều địa chỉ · đăng nhập mạng xã hội · xác thực hai bước · email chào mừng · email khi admin đổi trạng thái đơn · mọi thay đổi trong `app/admin/`, `app/sach/`, `app/tu-sach/`, `supabase/migrations/`.

**Ghi nhận, cũng không làm:** gợi ý sửa lỗi gõ tên miền email ("Ý bạn là …@gmail.com?", mục 9 file quyết định) · bỏ ô "Nhập lại email" ở trang đăng ký · giới hạn số lần yêu cầu đặt lại mật khẩu ở tầng ứng dụng (xem 6.3).

### 0.1 Chia chặng

- **Chặng 1 — quên mật khẩu.** FR-A.1, A.2, A.3, A.8. Kiểm TC-A.1 → TC-A.4. Đây là chặng có rủi ro thật (phiên recovery, token, email), làm trước và đóng gọn.
- **Chặng 2 — hồ sơ.** FR-A.4, A.5, A.6, A.7. Kiểm TC-A.5 → TC-A.10. PR xếp chồng lên chặng 1 nếu chặng 1 chưa merge.

---

## 1. Use Case

```
                   ┌──────────────────────────────────────────────┐
                   │                   NA Books                   │
  ┌──────────┐     │                                              │
  │  Khách   │─────┼──▶┌────────────────────────────────────┐     │
  │ quên mật │     │   │ UC-A1  Đặt lại mật khẩu            │     │
  │   khẩu   │     │   └──────────────┬─────────────────────┘     │
  │ (CHƯA    │     │                  │ «include»                 │
  │ đăng     │     │      ┌───────────┼───────────┐               │
  │ nhập)    │     │      ▼           ▼           ▼               │
  └──────────┘     │ ┌─────────┐ ┌─────────┐ ┌──────────┐         │
                   │ │ UC-A1.1 │ │ UC-A1.2 │ │ UC-A1.3  │         │
                   │ │Nhập     │ │Mở link  │ │Đặt mật   │         │
                   │ │email →  │ │trong    │ │khẩu mới  │         │
                   │ │gửi link │ │mail →   │ │(cần phiên│         │
                   │ │         │ │verifyOtp│ │ recovery)│         │
                   │ └─────────┘ └─────────┘ └──────────┘         │
                   │                                              │
  ┌──────────┐     │   ┌────────────────────────────────────┐     │
  │  Khách   │─────┼──▶│ UC-A2  Xem và sửa hồ sơ            │     │
  │ ĐÃ đăng  │     │   └──────────────┬─────────────────────┘     │
  │  nhập    │     │                  │ «include»                 │
  │          │     │        ┌─────────┴─────────┐                 │
  │          │     │        ▼                   ▼                 │
  │          │     │  ┌───────────┐      ┌─────────────┐          │
  │          │     │  │ UC-A2.1   │      │ UC-A2.2     │          │
  │          │     │  │Sửa tên,   │      │Đổi mật khẩu │          │
  │          │     │  │điện thoại,│      │(xác minh mật│          │
  │          │     │  │địa chỉ    │      │khẩu hiện tại│          │
  │          │     │  └───────────┘      └─────────────┘          │
  │          │     │                                              │
  │          │─────┼──▶┌────────────────────────────────────┐     │
  └──────────┘     │   │ UC-A3  Đi tới Đơn hàng của tôi     │     │
                   │   └────────────────────────────────────┘     │
                   └──────────────────────────────────────────────┘
```

---

## 2. User Stories

| # | Là | Tôi muốn | Để |
|---|---|---|---|
| US-A1 | khách quên mật khẩu | nhận link đặt lại qua email | không mất tài khoản và lịch sử đơn vĩnh viễn |
| US-A2 | khách bấm "quên mật khẩu" trên máy tính | mở link trong mail trên điện thoại vẫn đặt lại được | đó là cách người ta thật sự đọc mail |
| US-A3 | khách đã đăng nhập | sửa tên, số điện thoại và địa chỉ giao hàng | lần đặt sau không phải gõ lại, và sửa được khi chuyển nhà |
| US-A4 | khách đã đăng nhập | đổi mật khẩu mà không cần đăng xuất | giữ tài khoản an toàn khi nghi mật khẩu bị lộ |
| US-A5 | người thấy menu ghi "Hồ sơ của bạn" | bấm vào thì tới đúng trang hồ sơ | không bị đá sang danh sách đơn như hiện nay |

---

## 3. Yêu cầu chức năng

### FR-A.1 — `/quen-mat-khau`

- Trang lắp từ `AuthShell` (`title`, `subtitle`, `editorial`) — cùng khuôn `/dang-nhap`. Một ô `TextField` email, một nút gửi.
- Server Action gọi `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/auth/callback })`.
- **Phản hồi PHẢI giống hệt nhau** dù email có trong hệ thống hay không: cùng chữ, cùng kiểu hiển thị, cùng mã HTTP. Lý do: trang `/dang-nhap` đã cố ý không phân biệt "sai mật khẩu" với "email chưa đăng ký" để không ai dò được danh sách email; trang này mà rò thì phá luôn tính chất đó. TC-A.1 đo.
- Thông báo thành công là **banner trong trang, có nút đóng, không tự tắt** (mục 3, WCAG 2.2.1), nội dung đại ý: nếu email đó có tài khoản thì link đã được gửi, kiểm tra cả hộp thư rác.
- Không ghi email vào log server (mục 6 và khuôn đợt 2B). Lỗi gốc của Supabase ghi log kèm mã, không kèm email.
- Có liên kết từ `/dang-nhap` sang trang này — nếu không thì người quên mật khẩu không tìm thấy đường. Đây đúng là bài học mục 8 ("một tính năng chỉ vào được bằng cách gõ URL thì chưa coi là làm xong").

### FR-A.2 — `/auth/callback`

- Route handler (`route.ts`), không phải page.
- Đọc `token_hash` và `type` từ query, gọi `supabase.auth.verifyOtp({ type: 'recovery', token_hash })`.
- Thành công → `redirect` sang `/dat-lai-mat-khau`. Thất bại hoặc thiếu tham số → `redirect` sang `/quen-mat-khau` kèm cờ lỗi, và trang đó hiện banner nói link đã hết hạn hoặc đã dùng rồi, mời gửi lại.
- **KHÔNG dùng `{{ .ConfirmationURL }}` và luồng PKCE mặc định.** SRS FR-5.4 đã chốt: PKCE lưu code verifier ở trình duyệt khởi tạo, nên link mở ở trình duyệt hoặc thiết bị khác sẽ hỏng — tình huống phổ biến nhất của chính tính năng này, và đã tái hiện được ngày 30/09. TC-A.2 là đối chứng cho điều này.
- `/auth/callback` **không** được nằm dưới `/tai-khoan` hay `/thanh-toan`: `proxy.ts` bắt đăng nhập ở hai nhánh đó, mà người đến từ link mail thì chưa có phiên. Không sửa `proxy.ts`.

### FR-A.3 — `/dat-lai-mat-khau`

- Trang lắp từ `AuthShell`. Hai ô `PasswordField` (mật khẩu mới, và nút Ẩn/Hiện như `/dang-ky` — **không** có ô "nhập lại mật khẩu", theo quyết định mục 5.1).
- Luật mật khẩu dùng lại `PASSWORD_MIN_LENGTH` ở `lib/authRules.ts` (8 ký tự, không ràng buộc thành phần). Không viết luật mới.
- **Chỉ dùng được khi có phiên.** Vào thẳng URL mà không có phiên → chuyển sang `/quen-mat-khau` kèm banner giải thích. TC-A.3 đo.
- Server Action gọi `supabase.auth.updateUser({ password })`, rồi `redirect` về `/tai-khoan` kèm cờ để trang đích hiện banner "đã đổi mật khẩu" — dùng lại khuôn `withWelcomeParam` của đợt 2B thay vì phát minh cơ chế mới.
- Không `revalidatePath` (cùng lý do với `signIn`, mục 5.1).

### FR-A.4 — `/tai-khoan` thành trang hồ sơ

- Tạo `app/tai-khoan/page.tsx`. **Bỏ chuyển hướng `/tai-khoan` → `/tai-khoan/don-hang`** trong `next.config.ts` — chính comment trong file đã ghi "khi đợt 2D dựng trang hồ sơ thì BỎ chuyển hướng này".
- Khung: `containerClass` 1200px, `PageTitle` ("Hồ sơ của bạn"), dải điều hướng FR-A.6, nội dung sau `requireUser` trong `<Suspense>`, `metadata.robots.index = false`.
- Hai thẻ `cardClass`:
  1. **Thông tin cá nhân** — `full_name` (bắt buộc, ≤ `FULL_NAME_MAX_LENGTH`), `phone` (tùy chọn, khớp `^0[2-9][0-9]{8}$` nếu có). Email hiện ở dạng **chỉ đọc**, kèm một dòng nói đợt này chưa đổi được email.
  2. **Địa chỉ giao hàng** — `province_code`, `ward_code`, `address_line`, dùng component FR-A.7. Ba trường cùng trống hoặc cùng có giá trị (khoá ngoại ghép `MATCH FULL`, FR-5.8) — form phải ép điều đó, không để lưu nửa vời.
- Lưu bằng Server Action, cập nhật `profiles` của chính `auth.uid()`. **Không đụng `role` và `email`**: trigger `protect_profile_role` sẽ âm thầm giữ nguyên hai cột đó, nên gửi lên cũng vô ích — ghi rõ trong mã để người đọc sau không tưởng là lỗi.
- Lưu xong hiện banner trong trang, có nút đóng, không tự tắt.
- Trang **không** đọc qua hàm `"use cache"` nào.

### FR-A.5 — Đổi mật khẩu khi đang đăng nhập

- Thẻ thứ ba trên `/tai-khoan`: mật khẩu hiện tại, mật khẩu mới.
- **Xác minh mật khẩu hiện tại trước** bằng `signInWithPassword` với chính email đang đăng nhập (SRS FR-5.7), rồi mới `updateUser({ password })`. Sai mật khẩu hiện tại → từ chối, không đổi gì. TC-A.4 là đối chứng.
- Lý do bước xác minh, ghi vào mã: không có nó thì ai mượn được máy đang mở phiên là đổi được mật khẩu và chiếm tài khoản.
- Đổi xong **không** đăng xuất khỏi phiên hiện tại (`signOut` của dự án dùng scope `"local"`, FR-5.3 — giữ nguyên hành vi đó).

### FR-A.6 — Dải điều hướng khu tài khoản

- Component `components/account/AccountNav.tsx`, **bản sao khuôn `components/admin/AdminNav.tsx`**: liên kết văn bản, `aria-current="page"` ở mục đang xem, `min-h-11`, dùng lại đúng `linkClass` của `AdminNav`.
- Hai mục: **Hồ sơ** (`/tai-khoan`) và **Đơn hàng** (`/tai-khoan/don-hang`). Prop `current: "profile" | "orders"`.
- `/tai-khoan/don-hang` thêm dải này. HTML của trang đó chỉ được đổi **đúng ở dải điều hướng** — TC-A.9 đo.

### FR-A.7 — Trích component chọn địa chỉ

- Hiện ô chọn tỉnh/phường nằm **trong** `components/checkout/CheckoutView.tsx` (607 dòng), đan với state của chính component đó.
- Trích thành `components/address/AddressPicker.tsx`: nhận `provinces`, `initialWards`, giá trị và hàm `onChange`; tự nạp phường theo tỉnh qua `api/dia-chi/phuong-xa`, giữ nguyên cơ chế nhớ tạm (`wardCache`) và các trạng thái nạp.
- **Ràng buộc cứng: HTML của `/thanh-toan` không được đổi một byte nào.** So sánh HTML dựng ra trước và sau khi trích — cùng cách đợt 5B kiểm `AdminNav` không làm vỡ hai trang admin. TC-A.8 đo, và đây là tiêu chí chặn: không đạt thì không merge.
- **Đường lùi, quyết định trước:** nếu sau khi đọc `CheckoutView.tsx` bạn thấy trích không an toàn, DỪNG và báo. Khi đó trang hồ sơ dùng form chọn địa chỉ **không JS** (chọn tỉnh thì gửi form và nạp lại trang). Ghi lý do vào báo cáo; đó là lệch có chủ ý, không phải thiếu sót. Đừng chép lại logic thành bản thứ hai.

### FR-A.8 — Template email và chiến lược `token_hash` (việc tay + kiểm bằng lệnh)

Theo mục "Việc còn lại ở đợt 2C" của `docs/runbooks/cau-hinh-smtp.md`:

- Template "Reset password" trong Supabase Dashboard viết lại **bằng tiếng Việt** theo giọng NA Books (xưng "chúng mình", gọi người đọc là "bạn"). Template mặc định là tiếng Anh, Gmail tự dịch và chèn banner "Đã dịch" giữa thư — trái NFR-3.4.
- Template dùng `{{ .TokenHash }}` và `type=recovery` trỏ `/auth/callback`, **không** dùng `{{ .ConfirmationURL }}`.
- **Đây là thiết lập trên dashboard, và mục 8 nói thiết lập chưa kiểm bằng lệnh thì coi như chưa biết** — chính kiểu lỗi đã làm "Confirm email" bật sai suốt chín ngày. Nên spec đòi: sau khi đổi, kiểm bằng cách gửi một email thật tới hộp thư đọc được (`TEST_EMAIL_TO` ở `.env.local`), đọc **mã nguồn thư**, xác nhận link chứa `token_hash` và `type=recovery`, không chứa chuỗi của `ConfirmationURL`. TC-A.2 dùng chính email đó.
- **Template sống ở `supabase/templates/recovery.html`** và được khai báo ở `supabase/config.toml`, mục `[auth.email.template.recovery]`. Nhờ đó template chạy được trên stack cục bộ, đọc được bằng lệnh và nằm trong git; stack cục bộ gửi thư vào Mailpit (cổng 54324) nên TC-A.2 đo được phần link và phần "mở ở ngữ cảnh khác" ngay trên local, không cần email thật.
- Việc áp template lên **hosted** là **việc tay của chủ dự án** (dashboard của dịch vụ ngoài): dán ĐÚNG nội dung `supabase/templates/recovery.html` vào ô "Reset password" của Supabase Dashboard. Hai nơi, một nguồn — file trong repo là nguồn. Claude Code viết file template và phép kiểm.
- Cập nhật `docs/runbooks/cau-hinh-smtp.md`: chuyển mục "Việc còn lại ở đợt 2C" thành đã làm, kèm ngày.

---

## 4. Yêu cầu phi chức năng

- **NFR-A.1 — Không thêm dependency.** Repo giữ đúng 5 dependency production.
- **NFR-A.2 — Không migration, không đổi schema, không đổi policy.** `profiles` đã đủ cột và RLS.
- **NFR-A.3 — Không rò danh sách email.** Xem FR-A.1. Không trang nào, không thông báo nào, không mã HTTP nào cho biết một email có tài khoản hay không.
- **NFR-A.4 — Accessibility.** Mọi ô nhập có nhãn thật (`<label>`, không placeholder thay nhãn); lỗi gắn với ô bằng `aria-describedby`; banner thành công không tự tắt; tương phản chữ ≥ 4,5:1; focus nhìn thấy được. Đo ở 1280px (mobile đã tạm dừng, mục 4 file quyết định).
- **NFR-A.5 — Không ghi dữ liệu cá nhân vào log.** Không email, không số điện thoại, không mật khẩu — kể cả trong log lỗi.
- **NFR-A.6 — Giọng văn** theo mục 3: xưng "chúng mình", gọi "bạn", không nhãn tiếng Anh trong giao diện.

---

## 5. Tiêu chí nghiệm thu

Đo trên stack cục bộ, trừ TC-A.2 (cần email thật). Mỗi tiêu chí ghi **số lượt và cỡ mẫu**.

| # | Tiêu chí | Lệnh cho ra con số | Đạt khi |
|---|---|---|---|
| **TC-A.1** | **Đối chứng — không dò được email tồn tại.** Gửi yêu cầu đặt lại cho một email CÓ tài khoản và một email KHÔNG có, 5 lượt mỗi phía. | So HTML trả về, mã HTTP, và thời gian phản hồi | **5/5 và 5/5** cho **cùng** HTML và cùng mã HTTP. Chênh lệch thời gian trung vị < 300 ms. Hai phía khác nhau ở bất kỳ điểm nào là TRƯỢT — và đó chính là lỗ hổng tiêu chí này tồn tại để bắt |
| **TC-A.2** | **Đối chứng — link mở ở trình duyệt khác vẫn chạy.** Khởi tạo yêu cầu ở trình duyệt A, mở link trong trình duyệt B (hoặc cửa sổ ẩn danh), đặt mật khẩu mới, đăng nhập bằng mật khẩu mới. 3 lượt. | Chạy tay, ghi kết quả từng lượt; đọc mã nguồn thư | **3/3** đặt lại được ở trình duyệt B. Link trong thư chứa `token_hash` và `type=recovery`, **0 lần** chứa chuỗi `ConfirmationURL`. **Đối chứng:** nếu đổi template về `{{ .ConfirmationURL }}` thì phép thử này phải TRƯỢT — nếu nó vẫn đạt thì phép đo hỏng, báo ngay |
| **TC-A.3** | `/dat-lai-mat-khau` không có phiên thì không dùng được. | `curl` thẳng URL khi không có cookie phiên, 3 lượt | **3/3** chuyển sang `/quen-mat-khau`; HTML trả về **0 lần** chứa ô nhập mật khẩu mới |
| **TC-A.4** | **Đối chứng — đổi mật khẩu cần đúng mật khẩu hiện tại.** Thử với mật khẩu hiện tại SAI (3 lượt) và ĐÚNG (3 lượt). | Chạy action, rồi thử đăng nhập bằng mật khẩu cũ và mới | Sai: **3/3** bị từ chối, và mật khẩu cũ **vẫn đăng nhập được** (chứng minh không có gì bị đổi). Đúng: **3/3** đổi được, mật khẩu cũ **không** đăng nhập được nữa |
| **TC-A.5** | Hồ sơ lưu đúng và đọc lại đúng. | Sửa `full_name`, `phone`, ba trường địa chỉ; đọc lại bằng `psql` | **5/5** trường khớp giá trị vừa nhập. `role` và `email` **không đổi** (trigger `protect_profile_role` giữ nguyên) |
| **TC-A.6** | **Đối chứng — RLS chặn sửa hồ sơ người khác.** Dùng JWT của `nguoi-dung-01` để `UPDATE` dòng `profiles` của `nguoi-dung-02`, 3 lượt. | PostgREST với JWT thật | **3/3** đổi được **0 dòng**. **Đối chứng:** cùng câu lệnh trên dòng của chính mình phải đổi được 1 dòng. Hai phía giống nhau nghĩa là phép đo hỏng |
| **TC-A.7** | Ba trường địa chỉ cùng trống hoặc cùng có giá trị. | Thử lưu chỉ tỉnh, chỉ phường, chỉ địa chỉ — 3 tổ hợp thiếu | **3/3** bị form từ chối; database **0 dòng** ở trạng thái nửa vời |
| **TC-A.8** | **Chặn merge — `/thanh-toan` không đổi một byte HTML.** Dựng HTML của `/thanh-toan` trước và sau khi trích `AddressPicker`, cùng dữ liệu, cùng phiên. | So hai file HTML bằng `diff` | **0 dòng khác nhau**. Khác một dòng cũng là TRƯỢT và không merge. Nếu đã chọn đường lùi (form không JS) thì tiêu chí này ghi "không áp dụng" kèm lý do |
| **TC-A.9** | Không phình phạm vi. | `git diff --stat origin/main...HEAD`; `package.json`; đếm migration | Dependency production = **5**, `package.json` và `package-lock.json` **không đổi**; **0** migration mới; `git diff` chỉ chạm `app/tai-khoan/`, `app/quen-mat-khau/`, `app/dat-lai-mat-khau/`, `app/auth/`, `app/actions/`, `components/`, `lib/`, `next.config.ts`, `supabase/templates/`, `supabase/config.toml`, `docs/`; HTML `/tai-khoan/don-hang` đổi **đúng ở dải điều hướng** |
| **TC-A.10** | Accessibility và không rò dữ liệu cá nhân. | Đọc HTML đã render ở 1280px; `grep` log server sau khi chạy đủ bốn luồng | **0** ô nhập thiếu `<label>`; **0** lỗi không gắn `aria-describedby`; **0** banner tự tắt; **0** cặp màu chữ < 4,5:1; log server **0 lần** chứa email, số điện thoại hoặc mật khẩu |

**Cách báo cáo.** Mỗi tiêu chí ghi lệnh, con số, số lượt. Bốn tiêu chí có đối chứng ghi **cả hai phía** — phía đối chứng cũng "đạt" nghĩa là phép đo hỏng, phải nói ra thay vì báo đạt.

---

## 6. Ghi nhận, không xử lý trong đợt này

### 6.1 Email đặt lại mật khẩu gửi tới `@example.com` sẽ không tới đâu
25 tài khoản demo dùng tên miền `@example.com` (RFC 2606), vốn không nhận thư. Không phải lỗi: luồng quên mật khẩu chỉ demo được bằng một địa chỉ thật. TC-A.2 dùng `TEST_EMAIL_TO`. README có thể nói rõ điều này về sau; đợt này không sửa README.

### 6.2 Brevo gói miễn phí: 300 thư/ngày, 30 thư/giờ
`docs/runbooks/cau-hinh-smtp.md` ghi rõ. Khi đo TC-A.2 (3 lượt) và thử tay, đừng gửi dồn — chạm trần thì Supabase báo lỗi gửi thư và phép đo trông như lỗi mã.

### 6.3 Không giới hạn số lần yêu cầu đặt lại ở tầng ứng dụng
Supabase Auth đã có giới hạn tốc độ riêng, và thêm một lớp nữa ở ứng dụng cần bảng đếm hoặc bộ nhớ chia sẻ — ngoài phạm vi. Ghi lại vì một site thật nên có.

### 6.4 Đổi email chưa làm
Trang hồ sơ hiện email ở dạng chỉ đọc. Đổi email kéo theo xác minh địa chỉ mới và đồng bộ `profiles.email` qua trigger `sync_profile_email` — đủ lớn cho một đợt riêng.

### 6.5 Lần thứ ba tiêu chí phạm vi bỏ sót thứ chính đợt đó cần
TC-A.9 bản 1.0 liệt kê đường dẫn `git diff` được phép chạm nhưng bỏ sót `supabase/`, nơi template email của FR-A.8 phải sống. Hai lần trước cùng loại: TC-S.10 của đợt seed (mục 7.11 file quyết định) và TC-R.6 của đợt 7 (mục 7.13). Lần này phát hiện trước khi viết mã, nên sửa được ở v1.1. (Ghi chú sau khi đọc mã: liên kết "Quên mật khẩu?" của FR-A.1 đã có sẵn ở `components/LoginForm.tsx` từ đợt 2B, nên không cần chạm `app/dang-nhap/`.)

---

## 7. Thứ tự làm

1. Đọc `app/actions/auth.ts`, `components/AuthShell.tsx`, `components/AuthFields.tsx`, `lib/authRules.ts`, `proxy.ts`, `next.config.ts`, `components/admin/AdminNav.tsx`, `components/checkout/CheckoutView.tsx`. Dùng lại, không viết mới.
2. **Chặng 1:** FR-A.1, A.2, A.3. Viết sẵn nội dung template cho chủ dự án dán (FR-A.8). Kiểm TC-A.1, TC-A.3 trên local.
3. Chủ dự án đổi template trên Dashboard, rồi cùng kiểm TC-A.2 bằng email thật.
4. Báo cáo, mở PR chặng 1.
5. **Chặng 2:** FR-A.7 trước (trích `AddressPicker`, đo TC-A.8 ngay — trượt thì lùi về form không JS trước khi xây tiếp), rồi FR-A.4, A.5, A.6.
6. Kiểm TC-A.5 → TC-A.7, TC-A.9, TC-A.10. Chụp ảnh toàn trang `/tai-khoan` và hai màn quên mật khẩu ở 1280px để chủ dự án duyệt.
7. Báo cáo, mở PR chặng 2. Merge sau khi chủ dự án xem ảnh.
8. Đóng đợt: mục 7.14 và cập nhật `docs/runbooks/cau-hinh-smtp.md`.

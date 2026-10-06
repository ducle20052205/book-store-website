# Đợt S — Seed dữ liệu demo

Phiên bản 1.5 · 06/10/2026 · Dựng 25 tài khoản demo, 42 đơn trải 7 tháng lịch (cố định từ 01/04 đến 06/10/2026) đủ 5 trạng thái, và chuỗi sự kiện hình phễu, bằng MỘT script chạy lại được và gỡ được.
Nhánh: chưa tạo. Một chặng, một PR. Đợt này **không có migration, không đổi schema, không đổi mã ứng dụng** — chỉ thêm `scripts/` và `docs/runbooks/`, và thêm hai tên biến rỗng vào `.env.local.example` (NFR-S.2).

**Đổi so với 1.4** (06/10, do Claude Code đối chiếu spec với mã, tài liệu và môi trường đã đo): neo cửa sổ thời gian vào hai ngày cố định `2026-04-01` và `2026-10-06` trong `plan.json`, bỏ điều kiện `created = true` (FR-S.4, FR-S.6, mục 6), nhận biết 18 dòng `checkout_started` bỏ dở bằng `seed_ref` 43–60 (FR-S.5, TC-S.8), đổi lệnh `grep .next/static` sang `SERVICE_ROLE` hoặc `SECRET_KEY` (TC-S.10), buộc kiểm kết quả xoá tài khoản (FR-S.7), ghi điều kiện đo đã kiểm của TC-S.3, và ghi dữ kiện môi trường đã đo ngày 06/10 vào mục 9. **Đổi 1.3 → 1.4** (giữ lại): bỏ yêu cầu "một transaction SQL" ở FR-S.7 và thay bằng bốn bước tuần tự tự idempotent, ghi `psql` qua `docker exec` là công cụ đo ở mục 9, xoá giỏ cũ trước khi chèn `cart_items` (FR-S.3), chỉ lùi `created_at` cho đơn tạo trong lần chạy này (FR-S.4), tất định hoá `confirmation_email_sent_at` bằng công thức (FR-S.3), đổi tên biến khoá phía server thành `SUPABASE_SECRET_KEY` (NFR-S.2, TC-S.10, `.env.local.example`), và ghi hai phép đo yếu hơn tiêu chí gốc (FR-S.5, TC-S.1, TC-S.8). **Đổi 1.2 → 1.3** (giữ lại): thêm bước 0 và bước quét giỏ, chốt 18 dòng `checkout_started` bỏ dở, luật phủ 24 cuốn, chia bước gỡ làm hai, đổi tên biến theo `.env.local.example`, bỏ câu trùng, ghi `search_books` 0 kết quả. **Đổi 1.1 → 1.2** (giữ lại): sửa tham chiếu SRS và số bảng, đổi cửa sổ thời gian sang 7 tháng lịch, đổi lệnh `grep` của TC-S.10, chốt hình dạng `metadata` theo mã. **Đổi 1.0 → 1.1** (giữ lại để không mất lịch sử): tồn kho do **một vector cố định trong spec** làm chủ (mục 3, FR-S.2) thay vì "đo rồi lập hạn mức"; bước gỡ **đặt lại vector**, bỏ hẳn logic cộng trả tay; bất biến `xmin` bị bỏ, thay bằng băm theo cột; thêm mục 7.4 về cache.

Tài liệu tham chiếu, KHÔNG chép lại nội dung vào đây:
- `docs/SRS.md` mục 5.3 (FR-3.x giỏ hàng), 5.4 (FR-4.x checkout), 5.5 (FR-5.x tài khoản), 5.6 (FR-6.x lịch sử đơn hàng), 5.8 (FR-8.x ghi log sự kiện), 5.10 (RLS).
- `docs/trang-quyet-dinh-dac-ta-tong.md` mục 5 (11 bảng, khoá ngoại tới `auth.users`), mục 5.2 (ranh giới: CC không tạo/đăng nhập tài khoản trên hosted Auth; stack cục bộ), mục 6 (nguyên tắc trung thực; `@example.com`; repo PUBLIC; **16/40 cuốn giảm giá, 4 cuốn hết hàng**).
- `supabase/seed.sql` — nguồn gốc của vector tồn kho ở FR-S.2.
- `supabase/migrations/20261002160851_checkout_3b_schema.sql` (`place_order`, `mark_confirmation_sent`, `order_code_seq`, ràng buộc `orders`).
- `supabase/migrations/20261003063859_orders_status_trigger.sql` (`orders_status_guard`, `cancel_order`).
- `docs/runbooks/supabase-local.md` (dựng stack cục bộ).

**Đánh số.** Tiền tố `FR-S.x`, tiêu chí `TC-S.x`. Đợt này **không sửa `docs/SRS.md`**: seed tạo dữ liệu cho các FR đã có, không phải yêu cầu mới. Dòng ghi nhận quyền sở hữu tồn kho thuộc mục 6 file quyết định, do chủ dự án viết.

---

## 0. Ranh giới đợt

**Trong phạm vi:** FR-S.1 → FR-S.7 dưới đây; một script Node duy nhất; một runbook.

**Ngoài phạm vi, không làm:** đánh giá/bình luận sách · nhiều tài khoản admin · seed giỏ hàng đang mở · thư viện sinh dữ liệu giả làm dependency mới · mọi thay đổi schema (cột, bảng, trigger, policy, migration) · cột đánh dấu "dữ liệu demo" · ảnh atmosphere · mọi thay đổi trong `app/`, `components/`, `lib/`.

**Ghi nhận, cũng không làm:** reset `order_code_seq` sau khi gỡ (7.1) · seed `collections` (đã có 17 dòng, không chạm) · đo hiệu năng dashboard (đợt sau) · làm mới cache sau khi seed (7.4) · chạy script lên hosted (việc tay của chủ dự án, mục 8).

### 0.1 Nơi chạy

Mục 5.2 file quyết định: **Claude Code không tạo hoặc đăng nhập tài khoản trên hosted Auth.** Hệ quả bắt buộc:

- CC **dựng và đo toàn bộ trên stack Supabase cục bộ** (`127.0.0.1:54321`). Mọi con số của mười tiêu chí đo ở đó.
- CC **không chạy script lên hosted**, không gọi Auth Admin API của hosted, không tạo người dùng trên hosted.
- Chạy lên hosted là **việc tay của chủ dự án**, theo runbook ở mục 8.

Local có đủ 40 cuốn sách qua `supabase/seed.sql`, nên điều kiện đo trùng hosted ở phần dữ liệu sách.

---

## 1. Use Case

```
                    ┌─────────────────────────────────────────────┐
                    │          Hệ thống NA Books (local)          │
                    │                                             │
   ┌──────────┐     │   ┌───────────────────────────────────┐     │
   │  Chủ dự  │─────┼──▶│ UC-S1  Dựng dữ liệu demo          │     │
   │   án /   │     │   └───────────────┬───────────────────┘     │
   │ Claude   │     │                   │ «include»               │
   │  Code    │     │    ┌──────────┬───┴────┬──────────┐         │
   │(người    │     │    ▼          ▼        ▼          ▼         │
   │ vận hành │     │ ┌───────┐ ┌───────┐ ┌──────┐ ┌────────┐     │
   │  script) │     │ │UC-S1.0│ │UC-S1.1│ │UC-S1.2│ │UC-S1.3│     │
   │          │     │ │Đặt tồn│ │Tạo tài│ │Đặt đơn│ │Ghi sự │     │
   │          │     │ │kho =  │ │khoản  │ │qua    │ │kiện   │     │
   │          │     │ │vector │ │demo   │ │place_ │ │(phễu) │     │
   │          │     │ └───────┘ └───────┘ │order  │ └────────┘    │
   │          │     │                     └───┬───┘               │
   │          │     │                         │ «include»         │
   │          │     │                         ▼                   │
   │          │     │                 ┌───────────────┐           │
   │          │     │                 │ UC-S1.4       │           │
   │          │     │                 │ Dựng lịch sử  │           │
   │          │     │                 │ trạng thái    │           │
   │          │     │                 └───────────────┘           │
   │          │     │                                             │
   │          │─────┼──▶┌───────────────────────────────────┐     │
   │          │     │   │ UC-S2  Gỡ dữ liệu demo            │     │
   │          │     │   └───────────────┬───────────────────┘     │
   │          │     │                   │ «include»               │
   │          │     │                   ▼                         │
   │          │     │           ┌───────────────┐                 │
   │          │     │           │ UC-S2.1       │                 │
   │          │     │           │ Đặt lại tồn   │                 │
   │          │     │           │ kho = vector  │                 │
   │          │     │           └───────────────┘                 │
   │          │     │                                             │
   │          │─────┼──▶┌───────────────────────────────────┐     │
   └──────────┘     │   │ UC-S3  Kiểm chứng (verify, đọc)   │     │
                    │   └───────────────────────────────────┘     │
                    └─────────────────────────────────────────────┘
```

**Không có actor "khách hàng".** Đợt này không sinh giao diện; người dùng cuối chỉ *nhìn thấy kết quả* ở dashboard và trang quản trị của các đợt khác.

---

## 2. User Stories

| # | Là | Tôi muốn | Để |
|---|---|---|---|
| US-S1 | nhà tuyển dụng xem portfolio | thấy dashboard có biểu đồ nhiều điểm thay vì một cột | tin rằng chức năng thống kê thật sự chạy, không phải ảnh chụp |
| US-S2 | chủ dự án | dựng lại toàn bộ dữ liệu demo bằng một lệnh | không phải bấm tay 42 lần mỗi khi dựng lại database |
| US-S3 | chủ dự án | gỡ sạch dữ liệu demo và đưa tồn kho về đúng một con số biết trước | 40 cuốn sách gốc không trôi dần sau mỗi lần chạy thử |
| US-S4 | chủ dự án | chạy script hai lần mà không sinh đơn trùng | một lần chạy lỡ tay không làm hỏng dữ liệu |
| US-S5 | Claude Code ở đợt dashboard | có dữ liệu phễu và doanh thu theo ngày sẵn sàng | không phải quay lại sửa seed giữa đợt dashboard |

---

## 3. Yêu cầu chức năng

### FR-S.1 — 25 tài khoản demo

- **25 tài khoản**, tạo qua **Supabase Auth Admin API** (`POST /auth/v1/admin/users`), `email_confirm: true`, `user_metadata.full_name` là tên tiếng Việt bịa.
  - Trigger `handle_new_user` tự chèn `public.profiles` (`role='customer'`, `email`, `full_name`). Script **không** chèn `profiles` tay.
- **Email:** `nguoi-dung-01@example.com` … `nguoi-dung-25@example.com` (RFC 2606, mục 6 file quyết định).
- **Mật khẩu:** MỘT mật khẩu chung cho cả 25, đọc từ biến môi trường `SEED_DEMO_PASSWORD`. **Không có giá trị mặc định trong mã**; thiếu biến thì script dừng với thông báo rõ. Lý do: script phải đăng nhập lại từng tài khoản ở FR-S.2 nên không dùng mật khẩu ngẫu nhiên vứt đi được.
- **Hồ sơ:** sau khi tạo, `UPDATE public.profiles` đặt `full_name`, `phone`, `address_line`, `ward_code`, `province_code`. Phường/tỉnh **lấy tất định từ bảng `wards` thật** (không bịa mã), trải trên ít nhất 8 tỉnh.
  - Ghi chú hành vi đã đọc trong mã, để người đọc sau không tưởng là lỗi: trigger `protect_profile_role()` âm thầm giữ nguyên `role` ở mọi `UPDATE` khi người gọi không phải admin, và giữ nguyên `email` với MỌI người gọi kể cả admin (chỉ mở khi cờ phiên `app.sync_auth_email = 'on'`). Script không cố đổi hai cột đó.
- **Số điện thoại** khớp `^0[2-9][0-9]{8}$` (ràng buộc `orders_recipient_phone_check`). Dùng dải `0288xxxxxx` với bốn số cuối chạy tuần tự từ `0001`. **Nêu thẳng trong README của script:** Việt Nam không có dải số dành riêng cho tài liệu, nên đây là số bịa có khả năng trùng một thuê bao thật; script không bao giờ gửi gì tới các số này.
- **Không tạo tài khoản admin.**

### FR-S.2 — Tồn kho do vector trong spec làm chủ

Đây là quyết định nền của cả đợt. Nó đóng ba vấn đề cùng lúc: `place_order` không bao giờ gặp `HET_HANG` giữa chừng; "đúng 4 cuốn tồn kho 0" trở thành thứ spec **quy định** thay vì thứ phải cầu may; và bước gỡ không cần cộng trả tay, không cần tắt trigger, không phụ thuộc file snapshot.

- **Bước đầu tiên của `--apply`:** `UPDATE public.books SET stock_quantity = <V[slug]>` cho đúng 40 slug dưới đây, **trước** khi tạo tài khoản và đơn hàng.
- **Bước cuối (bước 4) của `--teardown`** (FR-S.7): đặt lại **đúng vector này**.
- **Khoá theo `slug`, không theo `id`.** `books.id` là `gen_random_uuid()` nên khác nhau giữa local và hosted; `slug` là `unique not null` và ổn định.
- **Vector V** — lấy nguyên văn từ `supabase/seed.sql`, không phát minh số mới. Tổng **835**, đúng **4** ô bằng 0, cuốn thấp nhất còn hàng là **6**.

| # | slug | V | # | slug | V |
|---|---|---|---|---|---|
| 1 | `nha-gia-kim` | 24 | 21 | `tuoi-tre-dang-gia-bao-nhieu` | 29 |
| 2 | `cay-cam-ngot-cua-toi` | 18 | 22 | `con-duong-chang-may-ai-di` | 16 |
| 3 | `rung-na-uy` | 15 | 23 | `tu-duy-nhanh-va-cham` | 11 |
| 4 | `ho-diep-va-kinh-ngu` | 30 | 24 | `mindset-tam-ly-hoc-thanh-cong` | **0** |
| 5 | `xu-tuyet` | 12 | 25 | `phi-ly-tri` | 23 |
| 6 | `phia-sau-nghi-can-x` | 20 | 26 | `hieu-ve-trai-tim` | 31 |
| 7 | `bach-da-hanh` | **0** | 27 | `sapiens-luoc-su-loai-nguoi` | 20 |
| 8 | `dieu-ky-dieu-cua-tiem-tap-hoa-namiya` | 27 | 28 | `homo-deus-luoc-su-tuong-lai` | 13 |
| 9 | `mat-biec` | 40 | 29 | `sung-vi-trung-va-thep` | 9 |
| 10 | `toi-thay-hoa-vang-tren-co-xanh` | 35 | 30 | `luoc-su-thoi-gian` | 25 |
| 11 | `ke-toan-via-he` | 10 | 31 | `vu-tru` | 6 |
| 12 | `cha-giau-cha-ngheo` | 22 | 32 | `the-gioi-cua-sophie` | 21 |
| 13 | `tam-ly-hoc-ve-tien` | 17 | 33 | `suy-tuong` | 33 |
| 14 | `tu-tot-den-vi-dai` | 8 | 34 | `dandadan-tap-1` | 50 |
| 15 | `con-bo-tim` | 26 | 35 | `tham-tu-lung-danh-conan-tap-1` | **0** |
| 16 | `ban-co-the-dam-phan-bat-cu-dieu-gi` | **0** | 36 | `spy-x-family-tap-1` | 42 |
| 17 | `khoi-nghiep-tinh-gon` | 19 | 37 | `frieren-phap-su-tien-tang-tap-1` | 28 |
| 18 | `tu-khong-den-mot` | 14 | 38 | `van-hao-luu-lac-tap-1` | 19 |
| 19 | `dac-nhan-tam` | 45 | 39 | `horimiya-tap-1` | 24 |
| 20 | `thoi-quen-nguyen-tu` | 38 | 40 | `overlord-tap-6` | 15 |

- **Script dừng** nếu số slug đọc được từ database khác 40, hoặc có slug trong bảng trên không tồn tại. Không tự thêm, không tự bỏ qua.
- **Hai luật bán hàng, bắt buộc:**
  1. **Không bán 4 cuốn có `V = 0`.** Chúng phải ở mức 0 cả trước lẫn sau khi seed (mục 6 file quyết định: trạng thái demo có chủ đích).
  2. **Mỗi cuốn bán tối đa `min(5, V[slug] − 1)` đơn vị**, cộng dồn trên toàn bộ 42 đơn. Luật này bảo đảm **không cuốn nào rơi xuống 0** vì bán, nên sau `--apply` vẫn đúng 4 cuốn bằng 0. Sức chứa tối đa là 180 đơn vị trên 36 cuốn bán được — thừa cho khoảng 85–110 đơn vị thực bán.

**Hệ quả phải nói rõ, không giấu:** đặt tồn kho bằng vector là **ghi đè** giá trị đang có. Tồn kho hosted hiện tại (đã bị 2 đơn thật trừ đi) sẽ bị thay bằng số của `seed.sql`, và `--teardown` trả về **vector**, không trả về "số trước khi chạy". Kể từ lần `--apply` đầu tiên, **vector trong spec này là nguồn chân lý của `books.stock_quantity`**, không phải thứ đang nằm trong database. Mục 6 file quyết định cần thêm một dòng trỏ tới đây.

### FR-S.3 — 42 đơn hàng, sinh qua `place_order`

- **Bắt buộc đi qua `place_order`, không `INSERT` thẳng vào `orders`.** Với mỗi đơn:
  0. **Truy vấn `orders` theo `idempotency_key`** của đơn này (khoá tất định ở FR-S.6). Đã có dòng thì **bỏ qua toàn bộ bước 1–4 cho đơn đó**: không đăng nhập, không chèn `cart_items`, không gọi RPC. Script đếm số đơn bị bỏ qua và in ra bộ đếm `skipped_existing` (TC-S.1).
  1. Đăng nhập chủ đơn qua `POST /auth/v1/token?grant_type=password` (anon key) → `access_token`.
  2. **Xoá giỏ cũ của user đó** (`DELETE FROM public.cart_items WHERE user_id = <user đó>`), rồi `INSERT` 1–3 dòng `cart_items`. Thiếu bước xoá thì chạy dở rồi chạy lại sẽ nổ `UNIQUE (user_id, book_id)` vì giỏ của lần dở còn sót.
  3. Tính `p_expected_total` bằng **đúng luật giá của `place_order`**: dùng `discount_price` khi nó có *và nhỏ hơn* `price`, ngược lại dùng `price`. Sai luật này nhận `GIA_DA_DOI`.
  4. Gọi RPC `place_order` **bằng JWT của user** — service_role có `auth.uid()` NULL nên sẽ nhận `KHONG_DANG_NHAP`.
  - `place_order` tự xoá `cart_items` khi **tạo đơn mới** (nhánh `created = false` thì không, xem FR-S.6), nên sau đợt này **không tài khoản demo nào còn giỏ hàng** — khớp với "seed giỏ đang mở" nằm ngoài phạm vi.
- **Quét giỏ sau vòng sinh đơn** (lưới an toàn, không thay bước 0): `DELETE FROM public.cart_items WHERE user_id IN (<25 id demo>)`, rồi khẳng định số dòng `cart_items` còn lại của 25 tài khoản đó = **0**.
- Số lượng mỗi dòng: 1–2. Danh sách sách mỗi đơn chọn tất định từ 36 cuốn bán được, tôn trọng trần `min(5, V−1)` của FR-S.2. **Luật phủ:** (a) 42 đơn phải chạm **ít nhất 24 cuốn khác nhau** trong 36 cuốn bán được; (b) trong đó **ít nhất 20 cuốn** phải có mặt ở các đơn không `cancelled` (8 đơn hủy cộng trả hết nên không làm lệch kho).
- **Phân bố:** 42 đơn trên 25 tài khoản, tối thiểu 1, tối đa 4 đơn mỗi tài khoản.
- **`payment_method`:** 28 `cod`, 14 `bank_transfer`.
- **`confirmation_email_sent_at`:** TẤT ĐỊNH, không ngẫu nhiên. Với đơn có số thứ tự `n` (1–42, cùng `n` với khoá idempotency ở FR-S.6): giá trị = `created_at` CUỐI CÙNG + (2 + (`n` × 7) mod 39) giây, tức 2–40 giây. 38/42 đơn có giá trị; 4 đơn có `n` chia hết cho 10 (10, 20, 30, 40) để `NULL`, để demo nhánh "trang xác nhận nói thật". Ghi bằng `UPDATE` trực tiếp — không gọi `mark_confirmation_sent` (hàm đó cũng cần `auth.uid()`). Đặt **SAU** khi đã lùi `created_at` (FR-S.4), không tính từ giờ `place_order` chạy.

### FR-S.4 — Lịch sử trạng thái và lùi `created_at`

- **Phân bố trạng thái cuối** (5 trạng thái — con số 6 là số *chuyển* hợp lệ, không phải số trạng thái):

  | Trạng thái | Số đơn | Số lệnh `UPDATE` mỗi đơn |
  |---|---|---|
  | `pending` | 6 | 0 |
  | `processing` | 5 | 1 |
  | `shipped` | 5 | 2 |
  | `completed` | 18 | 3 |
  | `cancelled` | 8 | 1 (từ `pending`) |
  | **Tổng** | **42** | |

- **Phải đi đúng đường.** `orders_status_guard` chỉ cho 6 chuyển: `pending→processing`, `processing→shipped`, `shipped→completed`, và `→cancelled` từ `pending`/`processing`/`shipped`. Một đơn `completed` cần **ba** lệnh `UPDATE` liên tiếp. Không nhảy tắt. **`completed` là trạng thái cuối — không chuyển sang `cancelled` được**, nên 8 đơn hủy phải hủy từ `pending`.
- **Tuyệt đối không tắt trigger.** Không `ALTER TABLE ... DISABLE TRIGGER`, không `session_replication_role`. Lệnh đó cần quyền chủ sở hữu bảng và lấy khoá `ACCESS EXCLUSIVE` trên `orders`; và không cần — tồn kho đã do vector làm chủ, còn phép toán của trigger tự đúng ở cả hai nhánh (đơn `cancelled`: `place_order` trừ → trigger cộng lại, net 0; đơn còn lại: trừ và giữ).
- **Lùi thời gian:** `UPDATE public.orders SET created_at = <mốc>` cho **mọi** 42 đơn, sau khi đã dựng xong trạng thái.
  - **Cửa sổ là hằng số**, không tính từ ngày chạy: từ `2026-04-01` đến `2026-10-06`, ghi trong `scripts/seed-demo/plan.json` cùng `stock-vector.json`. `date_trunc('month', created_at)` cho đúng **7 nhóm**: 6 tháng đầy đủ (tháng 4 → 9) + 01–06/10.
  - **`created_at` của mọi đơn và mọi sự kiện là HÀM THUẦN của số thứ tự** (`n` của đơn; số thứ tự trong `seed_ref` của sự kiện) và của `plan.json`. Vì vậy bước lùi là phép gán tuyệt đối: chạy lại ngày nào, hay chạy tiếp sau một lần dở, đều ra cùng một kết quả.
  - **Phân bố:** 6 đơn mỗi tháng đầy đủ (4→9, 36 đơn) + 6 đơn trong 01–06/10 = **42**.
  - **Seed lại sau nhiều tháng thì SỬA hai ngày trong `plan.json`** (runbook cũng ghi điều này): đó là thay đổi có chủ ý, không được để nó trôi âm thầm.
  - Lệnh này **không** làm trigger chạy, vì mệnh đề `WHEN (OLD.status IS DISTINCT FROM NEW.status)`. **Phải chứng minh bằng đo, không tin spec** — TC-S.4(b).
- **Ghi nhận:** `order_code` do `place_order` sinh theo `now()` giờ Việt Nam, nên mọi đơn demo mang năm của lúc `place_order` chạy (`2026` nếu chạy trong năm 2026), còn `created_at` neo cố định trong 2026; chạy sang năm khác thì năm trong mã khác năm của `created_at`. Script **không** sửa `order_code`.

### FR-S.5 — Sự kiện (bảng `events`)

| `event_type` | Số dòng | `user_id` |
|---|---|---|
| `page_view` | 1.200 | ≥ 75% NULL (phiên ẩn danh) |
| `search` | 360 | ≥ 75% NULL |
| `add_to_cart` | 150 | ≥ 50% NULL (giỏ khách chưa đăng nhập là có thật, mục 5.1) |
| `checkout_started` | 60 | 100% có `user_id` |
| `order_placed` | 42 | 100% có `user_id` |
| `sign_up` | 25 | 100% có `user_id` |
| `login` | 60 | 100% có `user_id` |
| **Tổng** | **1.897** | |

- **Phễu đơn điệu giảm** qua `page_view → search → add_to_cart → checkout_started → order_placed`: 1200 > 360 > 150 > 60 > 42.
- **`order_placed` khớp đơn 1–1:** đúng 42 dòng, `metadata` chứa `order_code` của đơn tương ứng, `user_id` là chủ đơn, `created_at` bằng `created_at` của đơn ± 5 giây.
- **`session_id`:** UUID v4; phiên ẩn danh dùng `session_id` riêng, không trùng phiên của tài khoản. Tối thiểu 300 `session_id` khác nhau.
- **`created_at`** trải cùng cửa sổ cố định của FR-S.4, là hàm thuần của số thứ tự trong `seed_ref`; mật độ ngày thường cao hơn cuối tuần.
- **`metadata`** ≤ 2048 byte mỗi dòng (trần của policy `events_insert_public`; service_role bỏ qua RLS nhưng giữ trần để dữ liệu hợp lệ với đường ghi thật).
- Chèn theo lô, không 1.897 lời gọi lẻ.

**Hình dạng `metadata`.** Mỗi dòng sự kiện seed phải mang `metadata` ĐÚNG hình dạng mà ứng dụng đang ghi cho loại đó. Nguồn hình dạng là các chỗ gọi `track()` và `trackServer()` trong mã (`lib/analytics.ts`, `lib/analytics.server.ts` và mọi nơi gọi chúng), **không phải** câu chữ FR-8.4 của SRS. Đọc từ mã ngày 06/10/2026:

| `event_type` | Số khoá (chưa tính `seed_ref`) | Khoá `metadata` theo mã | Nơi ghi |
|---|---|---|---|
| `page_view` | 3 | `page` (luôn là `"book_detail"`), `book_id`, `slug` | `app/sach/[slug]/page.tsx` |
| `search` | 4 | `q`, `results_count`, `category` (slug hoặc `null`), `sort` (`newest`, `price_asc`, `price_desc`, `bestseller`) | `app/sach/page.tsx` |
| `add_to_cart` | 2 | `book_id`, `quantity` | `components/PurchasePanel.tsx` |
| `checkout_started` | 2 | `items_count`, `total_amount`. Nhận biết bằng `seed_ref`: số 1–42 ứng với đơn cùng số thứ tự, số 43–60 là phiên bỏ dở | `components/checkout/CheckoutView.tsx` |
| `order_placed` | 4 | `order_code`, `items_count`, `total_amount`, `payment_method` | `app/actions/checkout.ts` |
| `sign_up`, `login` | 1 mỗi loại | `method` (luôn là `"password"`) | `app/actions/auth.ts` |

`items_count` ở `checkout_started` và `order_placed` là **tổng `quantity`** của các dòng trong giỏ hoặc đơn, không phải số dòng. Hai chỗ mã khác chữ của SRS FR-8.4: `page_view` trong mã có thêm khoá `page`; `add_to_cart` không có khoá nào được SRS nêu. Script theo mã.

Ba ràng buộc về giá trị:
- **`page_view`:** `book_id` và `slug` phải trỏ tới một cuốn CÓ THẬT trong 40 cuốn. Tra `book_id` theo `slug` lúc chạy, không chép UUID (`id` khác nhau giữa local và hosted, như FR-S.2).
- **`search`:** `results_count` là số THẬT. Chọn khoảng 20 từ khoá khác nhau, gọi RPC `search_books` một lần cho mỗi từ khoá, lấy `total_count`, rồi dùng lại cho 360 dòng. `search_books` KHÔNG trả dòng nào khi 0 kết quả (`total_count` là `count(*) over ()` nên vắng mặt cùng các dòng), nên script đọc thành 0 — cùng cách `lib/queries.ts` làm: `rows[0]?.total_count ?? 0`. Không coi "không có dòng" là lỗi. Không bịa số. Có ít nhất 2 từ khoá cho ra 0 kết quả. `category` và `sort` ghi đúng giá trị đã truyền vào lần gọi RPC đó.
- **`order_placed` và `checkout_started`:** `order_placed` (42 dòng) khớp đơn thật. **42/60** dòng `checkout_started` (`seed_ref` 1–42) khớp một đơn thật theo thứ tự, nên `items_count` và `total_amount` bằng của đơn đó. **18/60** dòng còn lại (`seed_ref` 43–60) là phiên bỏ giữa chừng — chỗ RƠI của phễu, cố ý giữ: `items_count` và `total_amount` tính THẬT từ một giỏ sách có thật theo đúng luật giá của `place_order` (`discount_price` khi nó có và nhỏ hơn `price`), chỉ là không có đơn theo sau; giỏ bỏ dở có tổng `quantity` từ 1 đến 3. Không bịa số. **Phép đo YẾU HƠN tiêu chí gốc** (bài học mục 8 file quyết định): tiêu chí gốc muốn kiểm "tính thật theo luật giá"; phép đo thực tế (TC-S.8, 18 dòng) chỉ kiểm được `total_amount` > 0, `items_count` trong 1–3 và 18/18 dòng có `seed_ref` 43–60 mà không có dòng `order_placed` cùng số. Script in giỏ đã dùng để tính — ghi là bằng chứng phụ, không phải phép đo.

`seed_ref` (FR-S.6) là một khoá THÊM, nằm ngoài tập khoá ứng dụng ghi cho loại đó, cố ý thêm để làm tay cầm cho bước gỡ. Nó hợp FR-8.5 (không dữ liệu cá nhân, dưới 2KB) và không phải cột schema mới.

### FR-S.6 — Chạy lại được (idempotent)

- **Khoá idempotency tất định.** Mỗi đơn có `idempotency_key = uuidv5(namespace_cố_định, 'na-books-seed:order:' || <số thứ tự>)`. `place_order` đã có sẵn: cùng khoá, cùng user → trả `created = false`, **không tạo đơn thứ hai, không trừ kho lần hai**. Nhánh `created = false` này **KHÔNG xoá giỏ**: hàm thoát (`return query select v_existing_code, false`) trước khi đọc giỏ và trước lệnh `delete from public.cart_items` (`20261002160851_checkout_3b_schema.sql`). Đó là lý do bước 0 của FR-S.3 tồn tại.
- **Tồn kho:** bước đặt vector là phép gán tuyệt đối, chạy bao nhiêu lần cũng ra một kết quả. Nhưng ở lần chạy thứ hai, đặt lại vector rồi **không** đặt đơn mới (bước 0 của FR-S.3 bỏ qua đơn đã có) sẽ làm tồn kho **cao hơn** lần chạy thứ nhất. Vì vậy: **bước đặt vector chỉ chạy khi chưa có tài khoản demo nào tồn tại**; lần chạy thứ hai bỏ qua bước này và báo rõ "đã có dữ liệu demo, bỏ qua bước đặt tồn kho". Đây là điều kiện bắt buộc để TC-S.1 đạt.
- **Tài khoản:** email đã tồn tại → Admin API trả lỗi trùng; script **dùng lại tài khoản cũ**, không coi là lỗi.
- **Sự kiện:** mỗi dòng có `metadata->>'seed_ref'` tất định (`'seed:' || <loại> || ':' || <số thứ tự>`). Trước khi chèn, xoá mọi dòng `events` có `seed_ref` trùng. Đây là *dữ liệu*, không phải cột schema mới.
- **Trạng thái và lùi thời gian:** `UPDATE` trạng thái chỉ chạy khi trạng thái hiện tại khác đích và chuyển là hợp lệ; lùi `created_at` là phép gán tuyệt đối cho mọi đơn, theo hàm thuần của số thứ tự và `plan.json` (FR-S.4), nên chạy lại hay chạy tiếp sau một lần dở đều ra cùng kết quả. Cả hai tự idempotent.

### FR-S.7 — Gỡ được (`--teardown`)

Bốn bước chạy **tuần tự**, mỗi bước **tự idempotent**. Không cần transaction vì mỗi bước là xoá-theo-điều-kiện hoặc gán tuyệt đối (xoá tài khoản là lời gọi HTTP nên cũng không gói chung được với SQL). Dừng giữa chừng thì **chạy lại `--teardown`**: nó đi tiếp được từ chỗ còn dở.

1. `DELETE FROM public.orders WHERE user_id IN (<25 id demo>)` — `order_items` tự xoá theo (`ON DELETE CASCADE`).
2. `DELETE FROM public.events` với `user_id IN (<25 id demo>)` **hoặc** `metadata->>'seed_ref' IS NOT NULL` (bắt cả dòng ẩn danh có `user_id IS NULL`).
3. Xoá 25 tài khoản qua Admin API (`DELETE /auth/v1/admin/users/<id>`) — `profiles` và `cart_items` tự xoá theo (`ON DELETE CASCADE`). **Không tin lời gọi im lặng:** kiểm mã HTTP của từng lời gọi; sau vòng xoá, đếm lại các tài khoản `nguoi-dung-%@example.com` còn lại bằng `GET /auth/v1/admin/users` (PostgREST chỉ lộ schema `public` và `graphql_public` nên script không đọc được `auth.users`), phải = **0**. Khác 0 thì script báo lỗi và thoát với mã khác 0. Công cụ đo kiểm lại bằng `select count(*) from auth.users where email like 'nguoi-dung-%@example.com'` = 0.
4. **Đặt lại `books.stock_quantity` bằng đúng vector V của FR-S.2.**

- **Thứ tự bắt buộc** vì khoá ngoại `NO ACTION` của `orders.user_id` và `events.user_id`: bước 3 phải đứng sau bước 1 và 2; bước 4 đặt cuối cùng. Đảo bước 3 lên trước bước 1–2 sẽ **thất bại bằng lỗi khoá ngoại**. Đó là TC-S.3, không phải rủi ro.
- Bước 4 **không** suy ra từ `order_items` và **không** phụ thuộc trigger. `orders_status_transition` là `BEFORE UPDATE`; `DELETE` không kích hoạt nó, nên xoá đơn không hoàn kho. Gán thẳng vector là đường duy nhất không có trạng thái trung gian để sai.
- Script **không** đụng `books` ngoài cột `stock_quantity`; không đụng `categories`, `collections`, `collection_books`; không đụng tài khoản nào ngoài 25 email demo.
- **Không có cột đánh dấu dữ liệu demo.** Ranh giới là quyền sở hữu: mọi đơn và mọi sự kiện có danh tính thuộc 25 email `@example.com`; dòng `events` ẩn danh nhận diện bằng `metadata->>'seed_ref'`. Hai đơn thật hiện có thuộc tài khoản admin nên nằm ngoài mọi câu lệnh.
- **Chế độ `--verify`** (chỉ đọc): in bảng số đếm của cả mười tiêu chí, chạy lại được bất cứ lúc nào.

---

## 4. Yêu cầu phi chức năng

- **NFR-S.1 — Không thêm dependency.** Chỉ `node:crypto` (uuid v5), `fetch` có sẵn của Node 18+, và `@supabase/supabase-js` đã có trong `package.json`. Không cài `faker`, `chance`, `dayjs`.
- **NFR-S.2 — Bí mật chỉ ở biến môi trường.** Script dùng lại hai tên ứng dụng đã có trong `.env.local.example`, `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` (không tạo `SUPABASE_URL` hay `SUPABASE_ANON_KEY`), cộng đúng hai biến mới `SUPABASE_SECRET_KEY` và `SEED_DEMO_PASSWORD`. Hai biến mới được thêm vào `.env.local.example` với **giá trị rỗng**. **Không giá trị mặc định nào trong mã**, không khoá nào trong repo, không in khoá ra log. Script nằm ngoài cây build của Next nên tiêu chí `grep` `SERVICE_ROLE` trên `.next/static` trả 0 dòng của đợt 2A/2B không bị ảnh hưởng — TC-S.10 kiểm lại, và canh thêm `SECRET_KEY` vì tên khoá đã đổi.
- **NFR-S.3 — Chạy xong dưới 180 giây** trên stack cục bộ.
- **NFR-S.4 — Dữ liệu trung thực.** Tên người, số điện thoại, địa chỉ đều bịa; phường/tỉnh lấy từ bảng tra thật. Không tên người thật, không số thật, không email thật trong repo và trong báo cáo.

---

## 5. Tiêu chí nghiệm thu

Đo trên **stack Supabase cục bộ**, sau `supabase db reset`. Mỗi tiêu chí ghi **số lượt chạy và cỡ mẫu**.

| # | Tiêu chí | Lệnh cho ra con số | Đạt khi |
|---|---|---|---|
| **TC-S.1** | **Đối chứng — chạy lại không đổi gì.** `--apply` lần 1, ghi 6 số đếm (`auth.users` demo, `orders`, `order_items`, `events`, `sum(books.stock_quantity)`, `count(*) filter (stock_quantity = 0)`). Chạy `--apply` lần 2. | `--verify` in 6 số, so hai lần | **6/6 số giống hệt**; bước 0 của FR-S.3 bỏ qua đúng **42/42** đơn ở lần 2 (bộ đếm `skipped_existing` do script in ra); `cart_items` của 25 tài khoản demo = **0** sau lần 2; log lần 2 có dòng "bỏ qua bước đặt tồn kho" (FR-S.6). **Yếu hơn tiêu chí gốc:** tiêu chí gốc là "không sinh đơn trùng"; con số 42/42 chỉ do bộ đếm của chính chương trình đang được kiểm in ra, không phải truy vấn database. Phần đo độc lập bằng truy vấn là 6/6 số đếm giống hệt và `cart_items` = 0 |
| **TC-S.2** | **Đối chứng — gỡ về đúng vector.** `--apply` → `--teardown`. | So từng dòng `select slug, stock_quantity from books order by slug` với bảng vector | **40/40 ô bằng đúng V**; `count(*) where stock_quantity = 0` = **4**, và 4 slug đó đúng là `bach-da-hanh`, `ban-co-the-dam-phan-bat-cu-dieu-gi`, `mindset-tam-ly-hoc-thanh-cong`, `tham-tu-lung-danh-conan-tap-1`; `sum(stock_quantity)` = **835**; tài khoản demo = 0; `orders` và `events` về mốc trước |
| **TC-S.3** | **Đối chứng — sai thứ tự xoá phải nổ.** Chạy biến thể gỡ **đảo bước 3 lên trước bước 1 và 2**, bằng SQL trực tiếp (công cụ đo, mục 9), bọc `BEGIN … ROLLBACK` để không đổi dữ liệu. **Điều kiện đo đã kiểm:** vai `postgres` của stack cục bộ xoá được `auth.users` — kiểm 06/10/2026 bằng `begin; delete from auth.users where id = '00000000-…'; rollback;` ra `DELETE 0`, không bị từ chối vì quyền (`postgres` không phải superuser). Phép thử này yếu hơn việc xoá thật: id không tồn tại nên chưa chạy qua cascade. | SQL biến thể, bắt `SQLSTATE` | Thất bại `23503` (foreign_key_violation) ở **cả** `orders` và `events`, **2/2**. Lệnh đảo thứ tự mà **thành công** nghĩa là phép đo hỏng, không phải script đạt |
| **TC-S.4** | **Đối chứng — trigger còn canh.** (a) `UPDATE orders SET status='completed' WHERE status='pending'` trên 1 đơn demo. (b) `UPDATE orders SET created_at = created_at - interval '1 day'` trên 1 đơn demo đang `cancelled`. | SQL trực tiếp qua `psql` (mục 9), bắt lỗi + đo `stock_quantity` trước/sau | (a) ném `CHUYEN_TRANG_THAI_KHONG_HOP_LE`, detail `pending -> completed`, **3/3** lượt. (b) chạy thành công **và** `stock_quantity` mọi sách trong đơn **không đổi**, **3/3** lượt — chứng minh mệnh đề `WHEN` hoạt động |
| **TC-S.5** | **Đối chứng — chứng minh bước 4 (đặt lại vector) là bắt buộc.** Chạy một biến thể `--teardown` **bỏ bước đặt lại vector**, đo tồn kho. | `sum(stock_quantity)` và số ô lệch vector sau biến thể | Tồn kho **khác vector** ở ít nhất 20/40 ô và `sum` **< 835**, **2/2** lượt. Ngưỡng 20/40 đạt được nhờ luật phủ ở FR-S.3 (≥ 20 cuốn có mặt ở đơn không `cancelled`). Nếu biến thể bỏ bước đặt lại vector vẫn ra đúng vector thì phép đo hỏng (đang có đường cộng trả khác mà spec chưa biết), phải báo thay vì ghi đạt |
| **TC-S.6** | 25 tài khoản demo, toàn bộ `@example.com`, mỗi tài khoản đủ `full_name`, `phone`, `address_line`, `ward_code`, `province_code`. | `select … from profiles join auth.users` | **25/25** đủ 5 trường; **25/25** email khớp `@example\.com$`; `count(distinct province_code) >= 8` |
| **TC-S.7** | 42 đơn, phân bố trạng thái đúng bảng FR-S.4, trải 7 tháng lịch cố định từ `2026-04-01` đến `2026-10-06` (tháng 4 → 9 đầy đủ, cộng 01–06/10), mỗi tháng 6 đơn. | `group by status`; `count(distinct date_trunc('month', created_at))`; `group by date_trunc('month', created_at)` | **6/5/5/18/8** đúng từng con số; `count(distinct date_trunc('month', created_at))` = **7**; **6** nhóm tháng đầy đủ (4 → 9), mỗi nhóm = **6** đơn; nhóm 01–06/10 = **6** đơn; **0** đơn có `created_at` trong tương lai |
| **TC-S.8** | Phễu đơn điệu giảm; phần lớn lưu lượng ẩn danh; `order_placed` khớp đơn 1–1. | `group by event_type`; `count(*) filter (user_id is null)`; nối `books` theo `metadata->>'book_id'`; `metadata ? '<khoá>'`; nối `orders` theo `metadata->>'order_code'`; nối `order_placed` theo số cuối của `seed_ref` cho `checkout_started` | **1200/360/150/60/42** đúng và giảm dần **5/5** bước; `page_view` và `search` có ≥ 75% `user_id IS NULL`; **42/42** dòng `order_placed` có `order_code` khớp một đơn có thật; **1200/1200** dòng `page_view` có `metadata->>'book_id'` khớp một `books.id` có thật; **360/360** dòng `search` có đủ 4 khoá của mã (`q`, `results_count`, `category`, `sort`; `category` có mặt kể cả khi giá trị `null`); ≥ 2 từ khoá có `results_count` = 0; **42/42** dòng `order_placed` có `total_amount` bằng `orders.total_amount` của đơn tương ứng; **42/60** dòng `checkout_started` có `seed_ref` số 1–42 và, nối theo số với dòng `order_placed` cùng số, có cùng `user_id`, `items_count` = tổng `quantity` và `total_amount` = của đơn thật (đơn tra qua `order_code` của dòng `order_placed`); **18/60** dòng có `seed_ref` số 43–60, không có dòng `order_placed` cùng số (dòng `checkout_started` vốn không mang `order_code`, đúng hình dạng của ứng dụng), có `total_amount` > 0 và `items_count` trong 1–3. **Yếu hơn tiêu chí gốc:** tiêu chí gốc muốn kiểm "tính thật theo luật giá"; phép đo chỉ kiểm ba điều vừa nêu, số mẫu 18; giỏ script in ra là bằng chứng phụ |
| **TC-S.9** | 40 cuốn sách **chỉ** đổi `stock_quantity`; sau `--apply` vẫn đúng 4 cuốn bằng 0 và không cuốn nào rơi xuống 0 vì bán. | `md5(string_agg(…))` trên mọi cột của `books` **trừ** `stock_quantity`, sắp theo `slug`, đo trước `--apply` và sau `--apply`. Riêng tồn kho: đẳng thức dưới | Hai checksum **giống hệt**; số dòng `books` = **40** cả hai lần. Sau `--apply`: `count(*) where stock_quantity = 0` = **4**, đúng 4 slug của TC-S.2; và `835 − sum(stock_quantity)` = tổng `quantity` của `order_items` thuộc đơn demo có `status <> 'cancelled'` |
| **TC-S.10** | Không rò bí mật, không thêm dependency, không đổi schema. | `grep -rnE -e "eyJ[A-Za-z0-9_-]{20,}" -e "sb_secret_" -e "sbp_" scripts/`; `grep -rn -e "SERVICE_ROLE" -e "SECRET_KEY" .next/static` sau `next build`; `git diff --stat` so với `main`; `supabase migration list --local`; `bash -c 'set -- supabase/migrations/*.sql; echo $#'` | `grep` trên `scripts/` trả **0 dòng**. Tên biến `SUPABASE_SECRET_KEY` được phép xuất hiện trong mã và README (NFR-S.2 đòi nó); thứ bị cấm là giá trị khoá. `grep` trên `.next/static` (tiêu chí có sẵn của đợt 2A/2B, nay canh cả `SECRET_KEY`) vẫn **0 dòng**. `git diff` **không chạm** `supabase/migrations/`, `package.json`, `app/`, `components/`, `lib/`; `.env.local.example` là file có sẵn **DUY NHẤT** được phép đổi (chỉ thêm hai tên biến, giá trị rỗng); số migration không đổi: **19** file `.sql` |

**Cách báo cáo.** Mỗi tiêu chí ghi: lệnh đã chạy, con số thu được, số lượt. Tiêu chí có đối chứng ghi **cả hai phía** — phía đối chứng cũng "đạt" nghĩa là phép đo hỏng, phải nói ra thay vì báo đạt.

---

## 6. Tệp sinh ra

| Đường dẫn | Nội dung |
|---|---|
| `scripts/seed-demo.mjs` | Script duy nhất. Cờ: `--apply`, `--teardown`, `--verify`, `--dry-run`. Không cờ → in trợ giúp, thoát mã 1 |
| `scripts/seed-demo/stock-vector.json` | Vector V dạng `{ "<slug>": <số> }`, 40 khoá. Script đọc từ đây, **không** chép số vào mã |
| `scripts/seed-demo/plan.json` | Hai ngày neo cửa sổ (`2026-04-01`, `2026-10-06`), phân bố 42 đơn theo tháng, phân bố trạng thái, số dòng phễu sự kiện. Script đọc từ đây, **không** chép số vào mã |
| `scripts/seed-demo/README.md` | Cách chạy, biến môi trường, ghi chú số điện thoại bịa (FR-S.1), ghi chú `order_code_seq` (7.1), ghi chú cache (7.4) |
| `docs/runbooks/chay-seed-demo.md` | Runbook cho chủ dự án chạy lên hosted (mục 8) |
| `docs/specs/dot-seed-du-lieu-demo.md` | Chính spec này |

Chỉ sửa một file có sẵn: `.env.local.example`, thêm hai tên biến với giá trị rỗng.

---

## 7. Ghi nhận, không xử lý trong đợt này

### 7.1 `order_code_seq` không được reset sau khi gỡ

42 đơn demo tiêu 42 số của sequence toàn cục. Sau `--teardown`, dãy mã đơn có một khoảng trống đúng bằng số đơn demo đã sinh. **Chấp nhận có chủ đích:** `setval` ngược lại sinh nguy cơ trùng `order_code` với đơn thật đã phát hành — nặng hơn nhiều so với một khoảng trống trong dãy số, vốn là chuyện bình thường ở mọi hệ bán hàng.

### 7.2 Vector thay thế tồn kho đang có trên hosted

Xem đoạn "Hệ quả phải nói rõ" ở FR-S.2. Lần `--apply` đầu tiên trên hosted sẽ ghi đè tồn kho hiện tại (đã bị 2 đơn thật trừ), và không có đường quay lại con số đó. Chấp nhận: đây là dự án portfolio, tồn kho là dữ liệu minh hoạ. **Phải cập nhật mục 6 file quyết định** thêm một dòng: tồn kho 40 cuốn do vector ở spec này làm chủ.

### 7.3 Preview và production dùng chung database

Đã ghi ở mục 9 file quyết định. Chạy script lên hosted nghĩa là preview cũng thấy dữ liệu demo. Không xử lý ở đợt này.

### 7.4 Seed ghi thẳng vào database nên không có `updateTag` nào chạy

`lib/queries.ts` có **13 hàm** `"use cache"`, trong đó **9 hàm** mang `cacheTag("books")` (đợt 5B). Script seed ghi qua PostgREST và SQL, **không đi qua Server Action nào**, nên không có `updateTag` nào được gọi: sau khi chạy, trang catalog và trang chủ có thể hiển thị tồn kho cũ cho tới khi `cacheLife` hết hạn.

Hai điều phải viết đúng, không nhầm thành lỗi:
- **4 hàm không mang thẻ `books` là hành vi đúng**, không phải thiếu sót — đừng báo là lỗi khi đo.
- Ngay cả khi gọi tay `updateTag("books")`, 4 hàm đó cũng không được làm mới. Cách chắc chắn duy nhất sau khi seed trên hosted là **đợi hết `cacheLife`** hoặc deploy lại. Ghi vào runbook, không xử lý trong đợt này.

### 7.5 Số migration: repo 19 file, hosted 20

Thư mục `supabase/migrations/` có 20 mục vì có `README.md`; số file `.sql` là **19**. Hosted ghi 20 migration (mục 7 file quyết định ghi chuỗi 17 → 18 → 19 tới hết đợt 5A, cộng migration `20261004090859` của đợt 5B). Chênh 1 so với repo CHƯA giải thích được, và không chặn đợt này vì mọi phép đo chạy trên local.

---

## 8. Việc tay của chủ dự án (CC không làm)

Runbook `docs/runbooks/chay-seed-demo.md` phải ghi đủ, theo khuôn của `docs/runbooks/supabase-local.md`:

1. Lấy `service_role key` từ Supabase Dashboard → Settings → API. **Không dán vào chat, không vào repo.**
2. Đặt 4 biến môi trường trong phiên terminal (không ghi ra file trong repo).
3. `node scripts/seed-demo.mjs --verify` trước — ghi lại 6 số làm mốc.
4. `node scripts/seed-demo.mjs --apply`.
5. `--verify` lại, đối chiếu bảng kỳ vọng ở mục 5.
6. Cách lùi: `node scripts/seed-demo.mjs --teardown`, rồi `--verify` so với vector.

Runbook phải nêu rõ ba điều: **lần `--apply` đầu tiên ghi đè tồn kho hiện tại của 40 cuốn bằng vector** (7.2), **trang web có thể hiển thị số cũ tới khi hết `cacheLife`** (7.4), và **seed lại sau nhiều tháng thì sửa hai ngày trong `plan.json`** (FR-S.4).

---

## 9. Thứ tự làm

**Môi trường đã đo ngày 06/10/2026** (không phải giả định):
- Container Postgres tên `supabase_db_book-store-website`; cổng host: db `54322`, API `54321`, Mailpit `54324`; bên trong container Postgres nghe `5432` (`54322→5432`).
- Supabase CLI 2.118.0 nằm ở `D:\tools\supabase-cli\supabase.exe`, **không nằm trên PATH**: mọi lệnh `supabase …` gọi bằng đường dẫn đầy đủ.
- `supabase db reset` áp 19 migration rồi `seed.sql` (`config.toml`: `[db.migrations]` và `[db.seed]` đều `enabled = true`, `sql_paths = ["./seed.sql"]`). Sau reset: `supabase migration list --local` ra 19; `books` 40, tồn kho 0 là 4, tổng tồn kho 835; `auth.users`, `orders`, `events` đều 0.

1. Dựng stack cục bộ theo `docs/runbooks/supabase-local.md` (`supabase start -x …`; `start` trơn dựng 12 container thay vì 5), rồi `supabase db reset`, ghi baseline (6 số + checksum cột).
2. Viết `stock-vector.json` và `seed-demo.mjs`; kiểm `--dry-run` (in kế hoạch bán hàng và trần từng cuốn, không ghi).
3. `--apply`, đo TC-S.6 → TC-S.9.
4. `--apply` lần 2, đo TC-S.1.
5. Đo TC-S.3, TC-S.4, TC-S.5 (ba đối chứng) bằng SQL chạy thẳng vào Postgres cục bộ: `docker exec -i supabase_db_book-store-website psql -U postgres` (container của stack Supabase; `docker exec` chạy bên trong container nên không dùng cổng host `54322`). TC-S.3 bọc `BEGIN … ROLLBACK` trong phiên `psql`; TC-S.5 chạy biến thể `--teardown` rồi dựng lại database (`supabase db reset`). **Đây là CÔNG CỤ ĐO, không phải phần của script và không phải dependency của repo**: script vẫn chỉ dùng `fetch` và `@supabase/supabase-js` (NFR-S.1).
6. `--teardown`, đo TC-S.2.
7. Đo TC-S.10, viết README + runbook, mở PR.

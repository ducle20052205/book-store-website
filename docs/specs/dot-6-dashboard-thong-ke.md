# Đợt 6 — Dashboard thống kê cho admin

Phiên bản 1.1 · 06/10/2026 · Trang `/admin` thành bảng số liệu: KPI, doanh thu theo tháng, sách bán chạy, phễu chuyển đổi. Một migration (một hàm RPC), không thêm bảng, không thêm cột, không thêm dependency.
Nhánh: chưa tạo. Hai chặng, hai PR (mục 0.1).

**Giới hạn sửa spec: MỘT lần — đã dùng ở v1.1; spec đóng băng từ v1.1.** Sau đó chỉ sửa khi Claude Code chứng minh mã không thỏa được. Mọi thứ khác vào mục 7 "ghi nhận, đợt sau".

**Đổi so với 1.0** (06/10): thêm `next.config.ts` (nơi khai báo chuyển hướng `/admin`) vào đường dẫn được phép đổi, sửa "bốn khoá" thành "năm khoá" ở FR-D.6 và "20 → 20 + 1" thành "19 → 20 file `.sql`" ở TC-D.9; thêm FR-D.8 (mục "Khu quản trị" trong menu Tài khoản) kèm TC-D.10 và các đường dẫn nó chạm; thêm mục 4A "Số đo ba thành phần biểu đồ" (đánh số 4A để mục 7 vẫn là mục 7); đổi 7 FR thành 8 và 9 tiêu chí thành 10.

Tài liệu tham chiếu, KHÔNG chép nội dung vào đây:
- `docs/SRS.md` mục 5.7 (FR-7.1 → FR-7.6; đợt này thêm **FR-7.7**), 5.8 (FR-8.1 → FR-8.6, bảng `events`), 5.10 (RLS).
- `docs/trang-quyet-dinh-dac-ta-tong.md` mục 3 (hệ layout đóng băng; danh sách nhiều dòng là một mặt phẳng trắng; chuyển động chỉ `transform` và `opacity`, CLS = 0, `prefers-reduced-motion`; giọng văn), mục 4 (điểm nhấn "Dashboard thống kê nâng cao"), mục 5.1 (Cache Components, bốn Supabase client), mục 8 (dấu hiệu giao diện do AI sinh).
- `docs/specs/buoc-5a-admin-don-hang.md` (khung admin, `requireAdmin()`, `<Suspense>`, vỏ tĩnh không lộ chữ quản trị) và `docs/specs/buoc-5b-admin-sach.md` (bài học: trang admin KHÔNG đọc từ hàm `"use cache"` nào).
- `docs/specs/dot-seed-du-lieu-demo.md` (dữ liệu để vẽ: 42 đơn, 1.897 sự kiện, `plan.json`).

**Đánh số.** Tiền tố `FR-D.x`, tiêu chí `TC-D.x`. Đối ứng SRS: toàn bộ đợt ↔ **FR-7.7** (mới), cộng FR-7.1 (truy cập) và FR-8.x (nguồn dữ liệu phễu) không đổi.

---

## 0. Ranh giới đợt

**Trong phạm vi:** FR-D.1 → FR-D.8. Đúng **một migration** (một hàm RPC). Thay đổi mã chỉ trong `app/admin/`, `components/admin/`, `lib/admin/`, cộng `next.config.ts` (bỏ chuyển hướng `/admin`, FR-D.1) và ba file của menu Tài khoản `components/Header.tsx`, `components/AccountMenu.tsx`, `components/HeaderIcons.tsx` (FR-D.8), cộng một dòng ở `docs/SRS.md`.

**Ngoài phạm vi, không làm:** lọc theo khoảng thời gian · xuất CSV · so sánh với kỳ trước · tooltip, zoom, biểu đồ tương tác · cập nhật realtime · cảnh báo tồn kho thấp · bản đồ đơn theo tỉnh · tỉ lệ hủy đơn theo thời gian · **thư viện biểu đồ** · bảng mới, cột mới, trigger mới, policy mới · mọi thay đổi ngoài các đường dẫn nêu ở "Trong phạm vi".

**Ghi nhận, cũng không làm:** chạy seed lên hosted (việc tay của chủ dự án, sau đợt này) · dashboard cho khách · phân trang cho bảng sách bán chạy.

### 0.1 Chia chặng

- **Chặng 1 — dữ liệu.** Migration (mục 4). Kiểm TC-D.2, TC-D.4 → TC-D.7 bằng SQL và PostgREST trên stack cục bộ. Báo cáo, mở PR. Áp lên hosted chỉ khi chủ dự án đồng ý.
- **Chặng 2 — giao diện.** FR-D.1, D.3, D.5, D.6, D.7 phần giao diện, và FR-D.8. Kiểm các tiêu chí còn lại. PR xếp chồng lên chặng 1 nếu chặng 1 chưa merge.

---

## 1. Use Case

```
                 ┌──────────────────────────────────────────────┐
                 │               NA Books — /admin              │
                 │                                              │
  ┌─────────┐    │  ┌────────────────────────────────────────┐  │
  │  Admin  │────┼─▶│ UC-D1  Xem bảng số liệu cửa hàng       │  │
  │ (role=  │    │  └───────────────────┬────────────────────┘  │
  │ admin)  │    │                      │ «include»             │
  └─────────┘    │     ┌────────┬───────┴───────┬────────────┐  │
       │         │     ▼        ▼               ▼            ▼  │
       │         │ ┌────────┐┌────────┐  ┌────────────┐┌───────┐│
       │         │ │UC-D1.1 ││UC-D1.2 │  │  UC-D1.3   ││UC-D1.4││
       │         │ │Hàng KPI││Doanh   │  │Sách bán    ││Phễu   ││
       │         │ │        ││thu theo│  │chạy        ││chuyển ││
       │         │ │        ││tháng   │  │            ││đổi    ││
       │         │ └────────┘└────────┘  └────────────┘└───────┘│
       │         │                  │ «include»                 │
       │         │                  ▼                           │
       │         │        ┌────────────────────┐                │
       │         │        │ UC-D1.5            │                │
       │         │        │ RPC admin_dashboard│                │
       │         │        │ _stats (một lượt)  │                │
       │         │        └────────────────────┘                │
       │         │                                              │
       │         │  ┌────────────────────────────────────────┐  │
       └─────────┼─▶│ UC-D2  Đi tới Đơn hàng / Sách          │  │
                 │  └────────────────────────────────────────┘  │
                 │                                              │
  ┌─────────┐    │  ┌────────────────────────────────────────┐  │
  │ Khách / │────┼─▶│ UC-D3  Bị chặn (proxy → requireAdmin   │  │
  │ vãng lai│    │  │        → RLS → RPC tự kiểm) «extend»   │  │
  └─────────┘    │  └────────────────────────────────────────┘  │
                 └──────────────────────────────────────────────┘
```

---

## 2. User Stories

| # | Là | Tôi muốn | Để |
|---|---|---|---|
| US-D1 | nhà tuyển dụng đăng nhập tài khoản admin demo | thấy ngay một trang số liệu khi vào `/admin` | biết chức năng thống kê có thật, không phải ảnh chụp |
| US-D2 | admin | thấy doanh thu theo tháng trên một biểu đồ | nhận ra xu hướng mà bảng đơn hàng không cho thấy |
| US-D3 | admin | biết sách nào bán chạy và thuộc danh mục nào | quyết định nhập thêm gì |
| US-D4 | admin | thấy phễu từ lượt xem tới đơn đặt | biết khách rơi ở bước nào |
| US-D5 | chủ dự án | mọi con số trên trang kiểm được bằng một câu SQL | bảng số liệu không trở thành thứ trang trí không ai dám tin |

---

## 3. Yêu cầu chức năng

### FR-D.1 — `/admin` trở thành dashboard

- Tạo `app/admin/page.tsx`. **Bỏ chuyển hướng `/admin` → `/admin/don-hang`** của đợt 5A, khai báo trong `next.config.ts` (xoá mục `/admin` của `redirects`, giữ mục `/tai-khoan`); `/admin` nay là trang thống kê.
- `AdminNav` có **ba** liên kết theo thứ tự: **Thống kê** (`/admin`), **Đơn hàng** (`/admin/don-hang`), **Sách** (`/admin/sach`). Prop `current` mở rộng thành `"stats" | "orders" | "books"`, mặc định `"stats"`. HTML của hai trang cũ đổi đúng ở dải này — TC-D.9 kiểm.
- **Khung giống hệt 5A/5B**, không phát minh thêm: container 1200px; `PageTitle` ("Thống kê", không số đếm); `AdminNav`; mọi thứ nằm SAU `requireAdmin()` bên trong `<Suspense>`, fallback là khối trống `aria-busy` không chữ; `metadata` `title` "NA Books", `robots: { index: false }`.
- **Vỏ tĩnh không được chứa chữ nào của giao diện quản trị** (FR-5A.1) — TC-D.3.
- Hook kiểm thử: `data-testid` `admin-stats` (vùng chính), `admin-kpi`, `admin-revenue-chart`, `admin-top-books`, `admin-funnel`.

### FR-D.2 — Hàng KPI

Bốn ô, một hàng, xuống hai hàng dưới 768px. Mỗi ô: nhãn, số lớn, và **một dòng giải thích cách tính** — con số không có định nghĩa là con số không ai dám dùng.

| Ô | Giá trị | Cách tính |
|---|---|---|
| Doanh thu | tổng `orders.total_amount` | chỉ đơn `status <> 'cancelled'` |
| Số đơn | đếm `orders` | chỉ đơn `status <> 'cancelled'` |
| Giá trị đơn trung bình | doanh thu ÷ số đơn | làm tròn tới đồng |
| Khách đã mua | đếm `distinct orders.user_id` | chỉ đơn `status <> 'cancelled'` |

- Dòng giải thích ghi thẳng "không tính đơn đã hủy" — nguyên tắc trung thực của mục 6.
- Tiền hiển thị bằng `formatVnd` đã có, không viết hàm định dạng mới.
- Ô dùng `cardClass` có sẵn. Không bo góc khác, không đổ bóng, không nhãn viết hoa toàn phần (mục 8: dấu hiệu giao diện do AI sinh).

### FR-D.3 — Biểu đồ doanh thu theo tháng

- **Cột đứng, SVG tự viết, KHÔNG thư viện.** Một cột mỗi tháng lịch có đơn, tính theo giờ Việt Nam (`Asia/Ho_Chi_Minh`). Với dữ liệu seed hiện tại là **7 cột** (04/2026 → 10/2026).
- Chỉ đơn `status <> 'cancelled'`.
- **Số phải đọc được bằng chữ, không chỉ bằng chiều cao cột:** dưới mỗi cột là nhãn tháng, trên mỗi cột là giá trị. Biểu đồ có `role="img"` và `aria-label` tóm tắt (tháng cao nhất, tháng thấp nhất, tổng).
- Màu cột: chàm `cham-700`. Một màu duy nhất — không bảng màu cầu vồng.
- Tháng không có đơn vẫn có cột với giá trị 0, không bị bỏ qua (nếu không, trục thời gian nói dối).
- Không animation. `transform` và `opacity` là hai thuộc tính duy nhất được animate ở dự án này, và biểu đồ không cần cái nào.

### FR-D.4 — Sách bán chạy

Hai khối cạnh nhau, xếp dọc dưới 1024px:

1. **Top 10 sách** — một mặt phẳng trắng, dòng ngăn bằng kẻ 1px (mục 3, KHÔNG phải mỗi dòng một thẻ). Mỗi dòng: tên sách (liên kết tới `/admin/sach/<slug>`), tên danh mục cha, số bản đã bán, doanh thu của sách đó. Sắp theo số bản giảm dần, rồi theo tên.
2. **Năm danh mục cha** — thanh ngang, số bản đã bán mỗi danh mục, dùng **màu danh mục đã có** (mục 3: 5 danh mục cha mỗi danh mục một màu). Có nhãn chữ kèm số.

- Cả hai chỉ tính `order_items` thuộc đơn `status <> 'cancelled'`.
- Chưa có đơn nào → `EmptyState` đủ bốn phần (hình vẽ nét 76px, tiêu đề, đoạn giải thích ≤ 460px, hai nút) thay cho cả hai khối.

### FR-D.5 — Phễu chuyển đổi

- Năm bước theo FR-8.3: `page_view` → `search` → `add_to_cart` → `checkout_started` → `order_placed`.
- Thanh ngang, chiều dài tỉ lệ với số dòng, kèm **số tuyệt đối và tỉ lệ so với bước đầu**.
- Hai loại sự kiện còn lại (`sign_up`, `login`) **không nằm trong phễu**, hiển thị thành hai con số rời bên dưới.
- Nguồn: bảng `events`, không lọc theo thời gian (đợt này không có bộ lọc thời gian).
- `role="img"` + `aria-label` tóm tắt tỉ lệ bước đầu và bước cuối.

### FR-D.6 — Một RPC gom mọi số

- **`public.admin_dashboard_stats()`** trả về `jsonb` một lần gọi, năm khoá: `kpi`, `revenue_by_month`, `top_books`, `category_sales`, `funnel`.
- **`SECURITY INVOKER`** (mặc định), KHÔNG `SECURITY DEFINER`: RLS của chính người gọi áp dụng, nên không cần hàm vượt rào. Thêm chặn tường minh ở đầu hàm: `if not public.is_admin() then raise exception 'KHONG_PHAI_ADMIN'; end if;`
- `revoke execute ... from public, anon;` và `grant execute ... to authenticated;` — cùng khuôn với `place_order`.
- Mọi phép gộp theo tháng dùng `at time zone 'Asia/Ho_Chi_Minh'`, không dùng UTC.
- Trang gọi hàm này **một lần**, không gọi truy vấn phụ nào khác cho số liệu.

### FR-D.7 — Không cache, chỉ admin, trạng thái trống

- **Trang `/admin` KHÔNG được import hay gọi bất kỳ hàm `"use cache"` nào** của `lib/queries.ts`. Bài học 5B: dashboard đọc qua cache sẽ hiện số trễ tới 60 giây sau mỗi lần ghi, và không ai biết. TC-D.1 kiểm bằng cách đọc import, có đối chứng.
- Ba lớp chặn giữ nguyên, không sửa `proxy.ts`: `proxy.ts` (matcher `/admin/:path*` đã có) → `requireAdmin()` ở đầu page → RLS cộng chặn tường minh trong RPC.
- Database chưa có đơn nào → toàn trang là một `EmptyState` đủ bốn phần, không phải bốn ô KPI toàn số 0.
- Giọng văn theo mục 3: xưng "chúng mình", không nhãn tiếng Anh kiểu "Coming soon".

### FR-D.8 — "Khu quản trị" trong menu Tài khoản

Vấn đề: admin đăng nhập xong không có đường nào vào `/admin` ngoài gõ URL.

- `AccountItem` trong `components/Header.tsx` hiện đọc người dùng bằng `getClaims()`, KHÔNG truy vấn `profiles`, nên không biết `role`. Thêm **MỘT** truy vấn `select role from profiles where id = <uid>` trong `AccountItem` — nó đã nằm trong `<Suspense>` sẵn có, và chỉ chạy cho người đã đăng nhập. `getClaims()` giữ nguyên; cập nhật câu chú thích của `AccountItem` đang ghi "không truy vấn `profiles`".
- **KHÔNG dùng Custom Access Token Hook của Supabase:** đó là một thiết lập trên dashboard chưa ai kiểm được bằng lệnh, đúng loại rủi ro đã làm "Confirm email" sai suốt nhiều tuần. Phương án hook ghi ở mục 7 làm đường nâng cấp.
- `AccountMenu` (`components/AccountMenu.tsx`) nhận thêm prop `isAdmin: boolean`. Khi `true`, thêm **MỘT** mục "Khu quản trị" trỏ `/admin`, đặt **NGAY TRÊN** "Đăng xuất", có đường kẻ ngăn. Phải thêm ở **CẢ HAI**: dropdown (từ 768px) và sheet (dưới 768px). Hai panel cùng nằm trong DOM khi menu mở (CSS chọn cái hiển thị), nên mục xuất hiện hai lần.
- Dùng lại `panelItemClass` và `sheetItemClass` đã có. Biểu tượng: thêm một icon vào `HeaderIcons.tsx` cùng kiểu nét với các icon hiện có.
- Người không phải admin: mục này **KHÔNG được render**, không chỉ ẩn bằng CSS.

---

## 4. Migration

**Đúng một file.** Chỉ tạo hàm `admin_dashboard_stats()`. Không bảng, không cột, không index, không trigger, không policy. Không `UPDATE` dòng nào.

Chặn an toàn ở đầu migration: dừng nếu `public.is_admin` không tồn tại.

---

## 4A. Số đo ba thành phần biểu đồ

Thêm vào hệ layout đóng băng theo luật mục 3 ("trang nào cần thành phần chưa có thì thêm vào hệ trước"). Đánh số 4A vì mục 4 đã là Migration và mục 7 phải giữ nguyên số.

**Chung:** khung biểu đồ nằm trong `cardClass`, padding 24px (16px dưới 768px). Không lưới, không trục — mọi con số đã hiện bằng chữ. Không animation.

**Cột đứng (doanh thu theo tháng):**
- Khung cao 220px từ 768px, 180px dưới 768px; rộng 100%.
- 7 cột; khe giữa cột 16px từ 768px, 8px dưới; bề rộng cột chia đều phần còn lại.
- Cột cao tối đa 160px (120px dưới 768px); chừa 24px trên cho giá trị, 36px dưới cho nhãn.
- Giá trị trên đỉnh cột: 12px, `ink-400`, canh giữa, rút gọn dạng "1,2tr".
- Nhãn dưới: 12px, `ink-400`, dạng "T4" … "T10".
- Màu cột `cham-700`. Tháng giá trị 0: vẽ vạch ngang 2px `ink-400` ở đáy để cột không biến mất.

**Thanh ngang (5 danh mục cha):**
- Mỗi hàng cao 40px, khe 8px.
- Nhãn danh mục bên trái, cột cố định 140px từ 768px, 100px dưới.
- Thanh cao 16px, bo góc 2px, dài tỉ lệ với danh mục lớn nhất.
- Số bản ngay sau thanh, 12px `ink-900`.
- Màu: đúng 5 màu danh mục đã có trong hệ.

**Phễu 5 bước:**
- 5 hàng, mỗi hàng cao 44px, khe 8px.
- Thanh cao 20px, dài tỉ lệ với bước đầu (1.200 = 100%).
- Trái thanh: tên bước 13px `ink-900`. Phải thanh: số tuyệt đối 13px `ink-900` và tỉ lệ 12px `ink-400`.
- Màu `cham-700`, độ mờ 100 / 85 / 70 / 55 / 40% theo thứ tự bước — chỉ để trang trí, mọi thông tin đã nằm ở chữ.

**Hàng KPI:** 4 ô `cardClass`, padding 24px; nhãn 12px `ink-400`; số 28px Be Vietnam Pro semibold `ink-900` (chữ đứng = thông tin hệ thống, mục 3); dòng giải thích 12px `ink-400`. Hai cột dưới 768px.

---

## 5. Yêu cầu phi chức năng

- **NFR-D.1 — Không thêm dependency.** Repo đang có đúng 5 dependency production (`@supabase/ssr`, `@supabase/supabase-js`, `next`, `react`, `react-dom`). Sau đợt này vẫn phải là 5. Biểu đồ vẽ bằng SVG viết tay.
- **NFR-D.2 — CLS = 0** trên `/admin`. Mọi khối biểu đồ có kích thước cố định trước khi dữ liệu về (`<Suspense>` fallback cùng chiều cao).
- **NFR-D.3 — Accessibility.** Mỗi biểu đồ có `role="img"` và `aria-label`; mọi con số đọc được bằng chữ, không chỉ bằng hình; không truyền tin chỉ bằng màu; vùng chạm ≥ 44px; tương phản chữ ≥ 4,5:1.
- **NFR-D.4 — Một lượt truy vấn.** Trang gọi đúng một RPC cho toàn bộ số liệu.

---

## 6. Tiêu chí nghiệm thu

Đo trên stack cục bộ, sau `--apply` của script seed (42 đơn, 1.897 sự kiện). Mỗi tiêu chí ghi **số lượt và cỡ mẫu**.

| # | Tiêu chí | Lệnh cho ra con số | Đạt khi |
|---|---|---|---|
| **TC-D.1** | **Đối chứng — trang không đọc qua cache.** Đọc toàn bộ import của `app/admin/page.tsx` và mọi component nó dùng; không hàm nào có `"use cache"`. | Lần theo cây import bằng lệnh; liệt kê tên hàm | **0 hàm** `"use cache"` trong cây import. **Đối chứng:** thêm tạm một import `getNewestBooks` → phép kiểm phải phát hiện **1**. Đối chứng không phát hiện được nghĩa là phép đo hỏng |
| **TC-D.2** | **Đối chứng — RPC chặn người không phải admin.** Gọi `admin_dashboard_stats()` bằng JWT của một tài khoản demo thường, rồi bằng JWT admin. | PostgREST với hai JWT, 3 lượt mỗi vai | Vai thường: **3/3** ném `KHONG_PHAI_ADMIN`. Vai admin: **3/3** trả `jsonb` có đủ 5 khoá. Cả hai phía phải khác nhau |
| **TC-D.3** | **Đối chứng — vỏ tĩnh không lộ chữ quản trị.** `curl` `/admin` khi CHƯA đăng nhập, và khi đăng nhập admin. | `curl` + `grep` trên HTML thô | Chưa đăng nhập: HTML **không chứa** "Thống kê", "Doanh thu", "Phễu", "Khách đã mua" — 0/4 chuỗi. Đăng nhập admin: **4/4** chuỗi có mặt |
| **TC-D.4** | Bốn số KPI khớp SQL trực tiếp. | `psql`: tổng `total_amount`, đếm đơn, AOV, `count(distinct user_id)` với `status <> 'cancelled'` | **4/4** số trên trang bằng đúng 4 số SQL. Với dữ liệu seed: số đơn = **34** (42 − 8 hủy) |
| **TC-D.5** | Biểu đồ tháng đúng số cột và đúng giá trị. | `psql`: `group by date_trunc('month', created_at at time zone 'Asia/Ho_Chi_Minh')` | **7 cột**; **7/7** giá trị khớp SQL; nhãn tháng đúng thứ tự tăng dần; 0 tháng bị bỏ qua |
| **TC-D.6** | Phễu khớp bảng `events`. | `psql`: `group by event_type` | **1200 / 360 / 150 / 60 / 42** đúng từng con số; 5/5 bước giảm dần; `sign_up` = 25 và `login` = 60 hiện riêng, không nằm trong phễu |
| **TC-D.7** | Sách bán chạy khớp SQL. | `psql`: `sum(quantity)` theo `book_id` và theo danh mục cha, chỉ đơn khác `cancelled` | **10/10** dòng top sách khớp SQL (tên, số bản, doanh thu); **5/5** danh mục cha khớp; tổng số bản của 5 danh mục = **98** |
| **TC-D.8** | Accessibility. | Đọc HTML đã render; đo tương phản; đo vùng chạm ở 390px | **3/3** biểu đồ có `role="img"` và `aria-label` khác rỗng; **0** con số chỉ tồn tại dưới dạng hình; **0** vùng chạm < 44px; **0** cặp màu chữ < 4,5:1 |
| **TC-D.9** | Không phình phạm vi. | `git diff --stat` so `origin/main`; `package.json`; đếm migration; đo CLS | Dependency production = **5**, `package.json` và `package-lock.json` **không đổi**; đúng **1** migration mới (19 → 20 file `.sql`); `git diff` chỉ chạm `app/admin/`, `components/admin/`, `lib/admin/`, `next.config.ts`, `components/Header.tsx`, `components/AccountMenu.tsx`, `components/HeaderIcons.tsx`, `supabase/migrations/`, `docs/`; HTML hai trang admin cũ đổi **đúng ở dải `AdminNav`**; CLS = **0** |
| **TC-D.10** | **Đối chứng — mục "Khu quản trị" chỉ hiện với admin.** Ba trạng thái: đăng nhập `admin-demo@example.com`; đăng nhập `nguoi-dung-01@example.com`; chưa đăng nhập. Mỗi trạng thái mở trang chủ, mở menu Tài khoản (nút `aria-label="Tài khoản"`) rồi đọc DOM. HTML thô của trang không chứa chuỗi này với bất kỳ ai, vì dropdown và sheet chỉ render khi menu mở (`AccountMenu`: `{open && …}`); nên không đo bằng `curl`. | Trình duyệt thật (Edge headless qua CDP): đếm chuỗi "Khu quản trị" và đọc `href` của mục đó trong DOM sau khi mở menu | Admin: chuỗi xuất hiện **2** lần (dropdown + sheet) và cả hai có `href="/admin"`; `nguoi-dung-01`: **0** lần; chưa đăng nhập: **0** lần — **2/0/0**. Hai phía cho cùng kết quả nghĩa là phép đo hỏng, không phải mã đạt |

**Cách báo cáo.** Mỗi tiêu chí ghi lệnh đã chạy, con số thu được, số lượt. Bốn tiêu chí có đối chứng (TC-D.1, TC-D.2, TC-D.3, TC-D.10) ghi **cả hai phía** — phía đối chứng cũng "đạt" nghĩa là phép đo hỏng, phải nói ra thay vì báo đạt.

---

## 7. Ghi nhận, không xử lý trong đợt này

### 7.1 Doanh thu tính cả đơn chưa giao

Doanh thu gồm cả `pending`, `processing`, `shipped`, không chỉ `completed`. Đây là lựa chọn có chủ ý cho một cửa hàng demo: loại hết thì con số còn lại quá nhỏ để biểu đồ có ý nghĩa. Giao diện ghi rõ cách tính ngay dưới mỗi ô (FR-D.2), nên con số không nói dối. Muốn tách "doanh thu đã giao" thì làm ở đợt sau.

### 7.2 Không có bộ lọc thời gian

Mọi số là toàn thời gian. Thêm bộ lọc kéo theo tham số URL, trạng thái rỗng riêng cho từng khoảng, và một vòng tiêu chí mới — ngoài giới hạn đợt này.

### 7.3 Phễu không phải phễu theo phiên

Năm bước đếm **số dòng sự kiện**, không lần theo cùng một `session_id` đi hết năm bước. Phễu theo phiên đòi truy vấn window khác hẳn. Giao diện ghi rõ "số lượt, không phải số phiên".

### 7.4 Đường nâng cấp: Custom Access Token Hook

FR-D.8 biết `role` bằng một truy vấn `profiles` trong `AccountItem`. Đường nâng cấp là Custom Access Token Hook của Supabase đưa `role` vào claim của JWT, để `getClaims()` đọc được mà không cần truy vấn. Không làm ở đợt này: đó là một thiết lập trên dashboard chưa ai kiểm được bằng lệnh, đúng loại rủi ro đã làm "Confirm email" bật sai suốt nhiều tuần (file quyết định, mục 8). Làm khi có cách kiểm bằng lệnh.

---

## 8. Thứ tự làm

1. Đọc `app/admin/don-hang/page.tsx`, `components/admin/AdminNav.tsx`, `lib/admin/requireAdmin.ts`, `lib/ui/classes.ts` — dùng lại, không viết mới.
2. Chặng 1: viết migration, áp lên local, kiểm TC-D.2 và TC-D.4 → TC-D.7 bằng `psql` và PostgREST. Báo cáo, mở PR.
3. Chặng 2: `AdminNav` ba liên kết; `app/admin/page.tsx`; ba component biểu đồ SVG trong `components/admin/` theo mục 4A; bỏ chuyển hướng `/admin` ở `next.config.ts`; mục "Khu quản trị" (FR-D.8).
4. Kiểm TC-D.1, TC-D.3, TC-D.8, TC-D.9, TC-D.10. Báo cáo, mở PR.
5. Thêm **FR-7.7** vào `docs/SRS.md` mục 5.7 — commit riêng, không gộp vào commit mã.

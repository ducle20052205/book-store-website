# Đợt sửa accessibility — đặc tả

Phiên bản 1.0 · 16/10/2026 · 8 FR · 10 tiêu chí · 4 chặng.
Nguồn phát hiện: `docs/specs/dot-accessibility-ra-soat.md` bản 1.4 (14 phát hiện còn mở).
Số đo phạm vi: chặng 0 của đợt này, 16/10/2026, bộ đo `scripts/a11y/` tại `24b1af2`,
36 trạng thái của 21 route, chỉ 1280×900.

## 0. Phạm vi

### 0.1 Chặng 0 đã làm gì (đo, không sửa)
Chặng 0 dựng bộ đo vào repo và đo lại phạm vi thật của bốn phát hiện. Nó phát hiện
**bộ đo của bản 1.4 bị hỏng ở ba chỗ**, nên một phần số đo của bản 1.4 phải sửa lại
(mục 0.5). Mã ứng dụng không đổi ở chặng 0.

### 0.2 Tám FR của đợt này

| FR | Phát hiện | Nguyên nhân trong mã | Phạm vi |
|---|---|---|---|
| FR-A.1 | A11Y-08 | `app/layout.tsx`: `<main>` không có `id`, không có liên kết bỏ qua | Liên kết "Bỏ qua tới nội dung" là điểm dừng `Tab` ĐẦU TIÊN, hiện khi focus; `<main>` nhận `id` và `tabindex="-1"` |
| FR-A.2 | A11Y-09 | (a) bìa `role=img` có nhãn nằm trong liên kết đã có tên sách dạng chữ; (b) `components/BookCard.tsx` đặt dấu cách BÊN TRONG span `aria-hidden`; (c) `components/Header.tsx` khoảng trắng JSX giữa "Giỏ hàng" và badge | Mọi liên kết/nút chứa `BookCover` mà tên sách đã là chữ trong cùng liên kết; mọi chỗ có dấu cách nằm trong cây `aria-hidden`; tên khả truy cập của liên kết giỏ hàng |
| FR-A.3 | A11Y-10 | Liên kết trong khối văn bản chỉ khác màu và độ đậm, không gạch chân | Mọi liên kết nằm giữa câu có tỉ lệ với chữ quanh < 3:1 — tự quét, không theo danh sách |
| FR-A.4 | A11Y-01 | `lib/ui/classes.ts` `inputClass` không đặt màu placeholder, nên ô ăn màu mặc định preflight Tailwind v4 (`color-mix(... currentcolor 50% ...)`) | Sửa ở `inputClass`, không vá từng ô |
| FR-A.5 | A11Y-07 | `components/AccountMenu.tsx` và `components/CategoryNav.tsx` đặt `aria-haspopup="true"` nhưng panel chỉ chứa `<Link>` | Mọi nút `aria-haspopup` mà panel không phải menu — hai chỗ |
| FR-A.6 | A11Y-22 | `app/tu-sach/[slug]/page.tsx` không có `metadata` hay `generateMetadata` | `generateMetadata` lấy tên tủ sách; 4 route admin giữ "NA Books" (A11Y-13, cố ý theo spec 5A) |
| FR-A.7 | A11Y-21 | `components/account/ProfileForm.tsx` dòng 167 dùng `disabled`; `inputClass` có `disabled:opacity-60` | Đổi sang `readOnly`, bỏ `opacity` cho riêng ô này |
| FR-A.8 | A11Y-23 | `aria-label` của 3 biểu đồ `/admin` thiếu số liệu từng mục; `role="img"` có thể khiến công nghệ hỗ trợ bỏ qua nút con | Bảng số liệu đọc được bằng chữ, NGOÀI cây `role="img"`, cho cả ba biểu đồ |

**FR-A.8 là một nước đi có chủ ý:** thay một thứ không kiểm được bằng lệnh (trình đọc màn
hình có đọc nút con của `role="img"` không) bằng một thứ kiểm được bằng lệnh (số liệu có mặt
ở chữ ngoài `role="img"` không). Đợt này **không kết luận** A11Y-23 là vi phạm hay không;
nó làm câu hỏi đó không còn quan trọng.

### 0.3 Đã bỏ khỏi đợt, có lý do

- **A11Y-12 (viền ô nhập, Thấp, ngoài NFR-6.x).** Ước lượng ban đầu xếp nó là FR. Số đo
  chặng 0 biến nó thành một quyết định thiết kế: 26/41 token đạt ≥ 3:1 với cả `#FFFFFF` và
  `#EDE6D9`, nhưng token nhẹ nhất trong số đó (`ink-400` `#5F6379`) đậm hơn hẳn hai token
  viền đang dùng, nên đổi là đổi diện mạo hệ layout đóng băng (file quyết định mục 3) ở lọc
  catalog, ô tìm header và form admin cùng lúc. Quyết định màu thuộc một đợt thiết kế.
  **Phạm vi mới của A11Y-12, ghi vào bản 1.5:** ba kiểu ô trượt, không phải hai —
  ô giá/sắp xếp `/sach` (`#E4E2DC`, viền↔ngoài 1,04 · viền↔trong 1,30 · trong↔ngoài 1,24),
  ô tìm header (`#E3DCCE`, 1,36 · 1,22 · 1,12), và `inputClass` + `border-line-field` khi nền
  xung quanh là `paper` (`/admin/don-hang`, n=4, viền↔ngoài **2,58**). Trên nền trắng
  `line-field` đạt (3,20).
- **A11Y-05 (9 vùng chạm < 44px) và A11Y-06 (hộp thoại bộ lọc):** mobile đang tạm dừng.
  A11Y-06 không sửa nửa vời dù phần `aria-expanded`/`aria-controls` đo được ở 1280px.
- **A11Y-03 (ký tự trang trí `aria-hidden`) và A11Y-13 (tiêu đề admin):** đã quyết, không sửa.
- **A11Y-04 (biên token 4,66–4,77):** không phải việc sửa. Đợt này tính lại bảng cặp token
  (TC-A.9) vì có đổi token màu; phép canh tự động chặn khi đổi token để đợt sau.
- **6 ứng viên dính chữ không nằm trong liên kết/nút** (`/admin` 5, `/dang-nhap` 1): ngoài
  phạm vi FR-A.2. Không có phép đo nào cho thấy chúng bị đọc dính, và chúng không sinh ra
  tên khả truy cập của phần tử tương tác nào. Ghi vị trí vào bản 1.5; nếu một phép thử bằng
  trình đọc màn hình về sau cho thấy khác, đó là phát hiện mới.

### 0.4 File đợt này sẽ chạm
Mã: `app/layout.tsx` · `components/BookCard.tsx` · `components/Header.tsx` ·
`lib/ui/classes.ts` · `components/AccountMenu.tsx` · `components/CategoryNav.tsx` ·
`app/tu-sach/[slug]/page.tsx` · `components/account/ProfileForm.tsx` ·
`components/admin/RevenueChart.tsx` · `components/admin/CategoryBars.tsx` ·
`components/admin/FunnelChart.tsx` · `app/page.tsx` và `app/sach/[slug]/page.tsx` (FR-A.3)
và mọi file khác mà phép quét của FR-A.2/FR-A.3 tìm ra.
Tài liệu (việc đóng đợt, TC-A.10): `docs/specs/dot-accessibility-ra-soat.md` lên bản 1.5 ·
`docs/trang-quyet-dinh-dac-ta-tong.md` mục 7.15 (mới), mục 8 (hai luật mới), mục 9 (xoá
dòng "chênh 1 migration chưa giải thích được"), mục 3 (nếu đổi token màu) · `README.md`
dòng 103 · `docs/runbooks/supabase-local.md` · `supabase/migrations/README.md`.
`docs/SRS.md`: KHÔNG đổi — NFR-6.3 đã phủ liên kết bỏ qua, không cần điều khoản mới.
`package.json`: KHÔNG đổi, giữ đúng 5 dependency production.

### 0.5 Số đo của bản 1.4 phải sửa lại
Bộ đo của bản 1.4 hỏng ở ba chỗ. Kết luận của bản 1.4 phần lớn vẫn đứng; **con số thì sai**.

| Chỗ hỏng | Bản 1.4 ghi | Số đúng (chặng 0) | Kết luận có đổi? |
|---|---|---|---|
| Nhánh placeholder đọc được `rgb()` nhưng không đọc được `oklab(... / 0.5)` rồi `continue` | 20 placeholder, 0 vi phạm | 54 lượt đo được; **16 lượt ở 3,3:1** (1 ở `/thanh-toan`, 15 ở admin = 5 ô × 3 trạng thái) | **Đổi.** "0 vi phạm" là SAI |
| Vòng lặp nút chữ bỏ sót 13,4% | 1.018 nút chữ · 0 nút < 12px | 1.176 nút chữ · **11 nút < 12px** | Không đổi: 11 nút là dòng tác giả in trên bìa, thuộc nhóm A11Y-14 đã miễn trừ; 6.1 vẫn 0 vi phạm (4 phần tử dưới ngưỡng đều là dấu `“` `aria-hidden`, A11Y-03). Ba dòng 6.1/6.6/6.7 dùng chung vòng lặp này |
| Dòng liên kết giữa câu tính liên kết đọc không được màu là "đạt" | 9 liên kết, 0 vi phạm | 9 liên kết, 0 vi phạm | Không đổi: cả 9 đều có gạch chân |

Phạm vi thật của hai phát hiện cũng rộng hơn bản 1.4 ghi: A11Y-09 có **66** liên kết chứa
bìa (62 lặp tên sách, 34 dài > 90 ký tự, dài nhất 320, trung vị 93; bản 1.4 ghi 23 > 90 ký
tự) cộng **39** liên kết dính chữ; A11Y-10 có **6** liên kết vi phạm (bản 1.4 ghi 4).
Phần lớn mức tăng đến từ `/tu-sach/[slug]`, route chỉ được đo từ bản 1.4.

### 0.6 Luật của đợt, rút từ chính chặng 0
1. **Một phát hiện mô tả NƠI NÓ ĐƯỢC ĐO, không phải nơi khuyết tật nằm.** Giao FR theo
   nguyên nhân trong mã, không theo chỗ phát hiện nêu. Ví dụ trong chính đợt này: A11Y-07
   chỉ nêu nút "Tài khoản" vì lượt rà soát chỉ thử `ArrowDown` ở đó, trong khi `CategoryNav`
   có mã giống hệt; A11Y-01 chỉ nêu một `textarea` trong khi nguyên nhân ở `inputClass` dùng
   chung.
2. **Đối chứng phải dựng từ NGUYÊN NHÂN NGHI NGỜ, không phải từ NGƯỠNG.** Hai ca đối chứng
   đầu của chặng 0 (placeholder `#949494` và `#5F6379`, hex tường minh) đều vượt ở bộ đo cũ
   trong khi bộ cũ vẫn bỏ sót đúng loại ô là gốc của nghi vấn — vì hex tường minh tính ra
   `rgb()`, không chạm nhánh `oklab()` bị hỏng. Ca phân biệt được là ca "ô ăn màu mặc định".

## 1. Bốn chặng

| Chặng | FR | Vì sao xếp ở đây |
|---|---|---|
| 1 — khung chung | FR-A.1, FR-A.4, FR-A.5 | Đổi `app/layout.tsx`, `inputClass`, `Header`-nav ⇒ ảnh hưởng cả 21 route; phải đo lại toàn site sau chặng này |
| 2 — thẻ sách | FR-A.2, FR-A.3 | Chạm `BookCover` trong liên kết ⇒ phải đo lại điều kiện miễn trừ A11Y-14 |
| 3 — nhỏ | FR-A.6, FR-A.7, FR-A.8 | Độc lập nhau, độc lập hai chặng trên |
| 4 — đóng đợt | — | Đo lần cuối, merge, tài liệu (TC-A.10) |

## 2. Mười tiêu chí
Mỗi tiêu chí nêu lệnh cho ra con số. Mọi phép đo ở **1280×900**, bản production, bộ đo
`scripts/a11y/`. Phép đo nào có đối chứng mà đối chứng cũng "đạt" thì đó là phép đo hỏng,
không phải mã đạt.

- **TC-A.1** (FR-A.1, chặng 1) — Liên kết bỏ qua là điểm dừng `Tab` đầu tiên ở **36/36**
  trạng thái; số điểm dừng trước `<main>` giảm từ 8 (9 ở `/?chao=1` và `/?mk=1`) xuống **1**;
  `<main>` có `id` và nhận focus khi kích hoạt liên kết. *Lệnh:* phép đo D của
  `scripts/a11y/`. *Đối chứng:* gỡ liên kết trong bộ nhớ ⇒ số đếm quay về 8 và 9.
- **TC-A.2** (FR-A.2, chặng 2) — **0/66** liên kết chứa bìa có tên sách xuất hiện hai lần
  (trước: 62); **0** liên kết có chuỗi dính không dấu cách (trước: 39); tên khả truy cập của
  liên kết giỏ hàng không chứa " ," (trước: "Giỏ hàng , 2 sản phẩm"). Số liên kết > 90 ký tự,
  tên dài nhất và trung vị: **ghi lại con số, KHÔNG phải cổng đạt/trượt** (trước: 34 · 320 ·
  93). *Lệnh:* phép đo C.1. *Đối chứng:* liên kết tổng hợp có tên lặp phải bị bắt; có tên một
  lần phải không bị bắt; cặp chữ ngăn bằng `aria-hidden` CÓ dấu cách hai bên phải không bị
  tính là dính.
- **TC-A.3** (FR-A.3, chặng 2) — **0** liên kết giữa câu dưới 3:1 mà không gạch chân (trước:
  6 — trang chủ 2 ở 1,68:1; `/sach/[slug]` liên kết tác giả 1,50:1 ở 3 trang; 1 liên kết tên
  tủ sách 1,50:1 ở trang sách hết hàng). 9 liên kết của phép đối chiếu bản 1.4 vẫn 0 vi phạm.
  **Điểm mù đã biết:** 1 liên kết trong `<div>` ("đặt lại mật khẩu") quy tắc không chọn —
  kiểm bằng `grep` và ghi kết quả riêng, không gộp vào con số 0. *Lệnh:* phép đo C.2.
- **TC-A.4** (FR-A.4, chặng 1) — **0/54** lượt placeholder dưới 4,5:1 (trước: 16 lượt ở
  3,3:1). *Lệnh:* phép đo A. *Đối chứng BẮT BUỘC gồm ca theo nguyên nhân:* một ô thật ăn màu
  mặc định của preflight (không đặt màu bằng tay) phải bị bắt trước khi sửa và không bị bắt
  sau khi sửa; chỉ hai ca hex tường minh là KHÔNG đủ (luật 0.6.2).
- **TC-A.5** (FR-A.5, chặng 1) — **0** nút `aria-haspopup` mà panel không có
  `role=menu`/`menuitem`; **2/2** chỗ đã xử lý (`AccountMenu`, `CategoryNav`). `Enter` mở,
  `Escape` đóng, focus trả về nút: **2/2** vẫn đạt sau khi sửa. *Lệnh:* `grep -rn
  'aria-haspopup'` ra đúng tập đã xử lý, cộng phép đo bàn phím của `scripts/a11y/`.
- **TC-A.6** (FR-A.6, chặng 3) — **21/21** route có `<title>`; **3/3** `/tu-sach/[slug]` có
  tiêu đề riêng, khác nhau và khác "NA Books"; **4** route admin cố ý giữ "NA Books"
  (A11Y-13). *Lệnh:* `curl` từng route trên bản production, `grep` thẻ `<title>`.
- **TC-A.7** (FR-A.7, chặng 3) — Ô email ở `/tai-khoan` dùng `readOnly`, không `disabled`;
  chữ giá trị **≥ 4,5:1** (trước: 4,45:1); chọn và copy được (`document.getSelection()` sau
  khi chọn trả về đúng chuỗi email, điều `disabled` chặn). **3/3** trạng thái của trang.
  *Lệnh:* phép đo A (chữ giá trị trong ô) cộng một phép thử chọn-chữ qua CDP.
- **TC-A.8** (FR-A.8, chặng 3) — **3/3** biểu đồ `/admin` có bảng số liệu bằng chữ nằm NGOÀI
  cây `role="img"`; mọi giá trị trong biểu đồ có mặt ở chữ đó, gồm **doanh thu từng tháng** và
  **ba bước giữa của phễu (360, 150, 60 lượt)**. *Lệnh:* cây accessibility của Edge cộng
  `grep` nút chữ ngoài cây `role="img"`. *Đối chứng:* xoá một giá trị khỏi bảng trong bộ nhớ
  ⇒ phép đo phải báo thiếu.
- **TC-A.9** (không hồi quy, chặng 4) — Đo lại **36 trạng thái**: 0 vi phạm NFR-6.1; mọi phần
  tử tương tác tới được bằng `Tab`, 0 thiếu chỉ báo focus, 0 chỉ báo dưới 3:1; 0 `<svg>` thiếu
  `aria-hidden` hoặc nhãn; 0 phần tử tương tác không tên; 0 cặp token dưới 4,5:1 (NFR-6.7, vì
  đợt này đổi token màu placeholder). Điều kiện miễn trừ **A11Y-14** đo lại ở 1280px:
  **108/108** bìa đạt (a), nơi bắt buộc đạt (b). Đối chứng của bộ đo **≥ 21/21**, gồm ca
  "màu mặc định". *Lệnh:* `node scripts/a11y/run.mjs` toàn bộ.
- **TC-A.10** (đóng đợt, chặng 4) — Mọi tài liệu khớp hiện trạng: spec rà soát lên **bản 1.5**
  mang số đo sửa lại ở mục 0.5 và lý do lệch; mục 7.15 mới; mục 8 thêm hai luật ở mục 0.6;
  mục 9 xoá dòng "chênh 1 migration chưa giải thích được" và dẫn
  `supabase/migrations/README.md` làm lời giải; `README.md` dòng 103 đổi **14 → 6** phát hiện
  còn mở; `docs/runbooks/supabase-local.md` thêm mẹo `wsl --shutdown` trước khi mở Docker
  Desktop; `supabase/migrations/README.md` sửa "4 file đầu tiên" thành "3".
  *Lệnh:* `grep -rn "14 phát hiện\|14 việc\|4 file đầu tiên\|chênh 1 migration" docs/ README.md`
  ra **0** dòng.

## 3. Sau đợt này
**8 phát hiện đóng:** A11Y-01, 07, 08, 09, 10, 21, 22, 23 (A11Y-23 đóng là "đã sửa, chưa kết
luận nó có phải vi phạm" — xem 0.2).
**6 còn mở:** A11Y-03 và A11Y-13 (đã quyết: không sửa) · A11Y-04 (biên token, phép canh tự
động để đợt sau) · A11Y-05 và A11Y-06 (mobile) · A11Y-12 (quyết định thiết kế, xem 0.3).
**390px:** mọi số của đợt này đo ở 1280px. Thay đổi của FR-A.1 → FR-A.8 không nằm trong
media query nào, nên **suy ra** là giống nhau ở 390px — đó là suy luận, không phải phép đo.
Giai đoạn mobile phải đo lại.

# Đợt sửa accessibility — đặc tả

Phiên bản 1.4 · 17/10/2026 · 8 FR · 10 tiêu chí · 4 chặng. Bản 1.1–1.3 sửa tiêu chí không đo được và ghi lại những gì từng chặng đo (lịch sử ở mục 0.7). Bản 1.4 là lượt sửa chữ cuối: chính xác hoá NFR-6.7 trong TC-A.9, ghi đúng hai bước mở rộng của quy tắc A11Y-14, và đánh dấu những con số thuộc về chặng nào. FR và phạm vi không đổi từ bản 1.0.
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
`docs/trang-quyet-dinh-dac-ta-tong.md` mục 7.15 (mới), mục 8 (sáu luật mới), mục 9 (xoá
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
3. **Một con số đếm trong repo có thể bị chính hành động của đợt làm sai.** Kỳ vọng "4 dòng"
   của TC-A.10 được đo khi `docs/specs/dot-accessibility-sua.md` chưa tồn tại; viết file đó
   xong là thành 7, vì nó chứa cả các cụm cần tìm lẫn câu lệnh tìm. Hệ quả: tiêu chí dạng đếm
   phải đo SAU KHI mọi file của đợt đã có mặt, và một cổng quét cả repo phải TỰ LOẠI TRỪ tài
   liệu của chính đợt.
4. **Một tiêu chí không được ghi cứng con số do dữ liệu sinh ra, vì chính lượt đo làm đổi dữ
   liệu — và THỨ TỰ các trạng thái trong một lượt quyết định ai nhiễm ai.** FR-A.8 và TC-A.8
   bản 1.0–1.1 ghi 360/150/60 cho ba bước giữa của phễu `/admin`; chặng 2 đọc được 361/150/61
   và bản 1.2 giải thích sai là "số liệu trôi theo thời gian". Chặng 3 đọc
   `supabase/migrations/20261006164939_admin_dashboard_stats.sql`: hàm **không lọc thời gian**,
   và DB đúng seed từng loại (`page_view` 1200, `search` 360, `add_to_cart` 150,
   `checkout_started` 60, `order_placed` 42). Chênh +3/+1/0/+1/0 là **5 sự kiện của chính lượt
   đo** (3 xem trang sách, 1 tìm rỗng, 1 vào thanh toán), đọc trước lúc dọn, vì `/admin` được
   khảo sát SAU phần ẩn danh và phần khách. Hai hệ quả: giá trị kỳ vọng phải tính từ dữ liệu
   lúc đo, và trạng thái nào đọc số tích luỹ thì phải đo TRƯỚC các trạng thái sinh ra số đó.
   Mốc bảy số không bắt được chuyện này vì chỉ có tổng `events`; từ chặng 3 mốc có thêm phân
   tách theo loại.
5. **Phép thao tác hoá của một điều kiện có thể hẹp hơn chính điều kiện.** Điều kiện (a) của
   miễn trừ A11Y-14 nói "không được là nơi duy nhất mang thông tin"; bộ đo chỉ đếm text node
   nên không thấy giá trị ô nhập, và chấm trượt ba bìa xem trước của form admin. Khi phép đo
   và điều kiện lệch nhau, sửa phép đo trước khi kết luận mã sai.
6. **Một tiêu chí viết từ hành vi của MỘT thành phần sẽ ôm sát thành phần đó.** "Tab vào
   panel" của TC-A.5 viết từ `AccountMenu` và sai với `CategoryNav` chỉ vì thứ tự DOM khác.
   Tiêu chí cho một họ thành phần phải phát biểu yêu cầu, không phát biểu hành vi quan sát
   được ở một thành viên.

### 0.7 Sửa và phát hiện thêm trong khi làm (chặng 1 và chặng 2)
- **FR-A.2(c), nguyên nhân thật.** Tên khả truy cập "Giỏ hàng , 2 sản phẩm" **không** do
  khoảng trắng JSX (chẩn đoán ban đầu, sai). Chặng 2 thử 6 cách viết trong trình duyệt thật,
  cả 6 đều cho ra dấu cách thừa: trình duyệt chèn dấu cách trước mọi hộp không phải inline
  thuần, và phần tử `sr-only` là `absolute` còn con của flex container thì bị khối hoá. Tên
  phải đặt ở cấp liên kết.
- **FR-A.3 có chỗ thứ năm.** Ngoài 4 chỗ đã nêu, `app/sach/page.tsx` (thông báo "chưa tìm
  thấy cuốn nào", liên kết "tủ sách", 1,5:1). Phủ được nó cần 3 trạng thái mới (tìm rỗng,
  404, tìm rỗng của admin), nên survey từ 36 lên **39 trạng thái**.
- **Điểm mù của quy tắc "liên kết giữa câu".** `components/AuthAlert.tsx` dòng 39: quy tắc
  không chọn (liên kết trong `<div>`). Đo tay: 1,00:1 (kế thừa màu chữ quanh) nhưng **có**
  `underline underline-offset-2`, nên đạt WCAG 1.4.1 — không sửa.
- **Bìa xem trước của form admin KHÔNG vi phạm (a).** `components/admin/BookForm.tsx` dòng
  ~144: bìa `aria-hidden` trong `<aside aria-label="Bìa xem trước">`, tên sách là **giá trị
  ô nhập** admin đang gõ ngay cạnh, cộng một `h2` và một đoạn giải thích. Thông tin không
  nằm duy nhất ở bìa. Thêm nữa đây là **bìa xem trước đang soạn**, không phải bìa đại diện
  một cuốn trong danh mục; A11Y-14 viết cho bìa danh mục. Sửa phép đo (mục 0.6 luật 5),
  không sửa mã.
- **Sáu chỗ chữ dính ngoài liên kết, không sửa** (spec mục 0.3): đều là `<svg aria-hidden>`
  giữa hai ô lưới, không phải dấu phân cách bằng chữ. `components/admin/FunnelChart.tsx`
  dòng 25–34, 5 bước; và `app/dang-nhap/page.tsx` dòng 55 (`QuoteRuleIcon`, `md:hidden`).
  Năm chỗ đầu nằm trong cây `role="img"` của phễu nên không sinh ra tên khả truy cập nào.
- **Thẻ tủ sách ở trang chủ ngoài phạm vi FR-A.2, có chủ ý.** 10 bìa xếp chồng trong liên
  kết `/tu-sach/[slug]`: ở đó tên sách KHÔNG phải chữ nhìn thấy, chỉ có trong nhãn bìa, nên
  gỡ nhãn là xoá thông tin chứ không phải bỏ trùng lặp. Tên khả truy cập của ba thẻ đó vẫn
  dài sau đợt này. Sau chặng 2: liên kết > 90 ký tự còn **9** (từ 34), dài nhất **308** (từ
  320), trung vị **74** (từ 93) — phần còn lại là ba thẻ tủ sách và thẻ nổi bật có mô tả.
- **Giới hạn của đối chứng.** 39 ca đối chứng ở cuối đợt (29 ở chặng 2) chưa phủ nhánh `<img>` ảnh bìa thật; dữ liệu
  đo chỉ có bìa sinh tự động.
- **Cấu trúc của FR-A.2(c) phải sửa lại sau chặng 2.** Bản chặng 2 (`78b3bfb`) đặt `aria-label`
  ở `<Link>` và cho cả liên kết vào Suspense, nên **fallback là một `<a href>` focusable** —
  đúng hình mẫu mà `docs/specs/buoc-2b2-xoa-nhay-trang-thai-header.md` TC-6 đã loại bỏ ("0
  phần tử focusable lúc fallback"). Phép thử focus trên `78b3bfb`: **0/5** lượt giữ được focus
  (focus rơi về `body`, node cũ rời DOM). Bản sửa (`b3eb0f9`): `<Link>` đứng ngoài Suspense,
  tên qua `aria-labelledby` trỏ vào một `span` ẩn nằm trong boundary — **5/5** giữ được focus,
  focusable trong boundary 1 → 0, tên "Giỏ hàng, 2 sản phẩm" không chứa " ,", bề rộng chênh
  0,00 px, CLS băng thông thường 0. *Ghi chú về phép đo:* tiêu chí đặt ra là "lúc ổn định 1
  phần tử focusable" nhưng đếm trong BOUNDARY thì đúng là 0 ở cả hai lúc, vì liên kết nay nằm
  ngoài boundary — tiêu chí chỉ sai chỗ đếm, không sai yêu cầu.
- **CLS ở băng thông thấp: phát hiện mới, KHÔNG do đợt này.** Ở 60 KB/s, CLS của `/` là
  **0,097–0,100**, giống nhau ở cả `78b3bfb` và `b3eb0f9`, nên nguồn không phải slot giỏ hàng
  và chưa xác định. Hệ quả cho tài liệu cũ: TC-4 của 2B.2 ghi "CLS của `/` = 0" mà không nêu
  điều kiện băng thông; câu đó cần mệnh đề "ở băng thông thường". Thuộc NFR-3.6, không thuộc
  đợt accessibility, hạn mức đã kín — xếp cho đợt sau.
- **Lý lẽ của FR-A.7 hẹp hơn lời chủ dự án nói khi chốt.** Lý do nêu là "`readOnly` cho bôi
  đen và copy, `disabled` chặn". Chặng 3 đo trên Edge 154: bằng **chuột**, ba cú nhấp chọn
  được 25/25 ký tự ở **cả** `disabled` lẫn `readOnly`; chỉ đường **focus/bàn phím** phân biệt
  (`select()` chọn 0/25 → 25/25). Lợi ích thuộc về người dùng bàn phím, không phải mọi người
  dùng. Phần tương phản (4,45:1 → 16,81:1) đứng độc lập với lý lẽ này.
- **Hệ quả thị giác của FR-A.7:** bỏ `opacity` làm ô email trông như sửa được. `readOnly` vẫn
  được công nghệ hỗ trợ thông báo đúng và ô có dòng giải thích ngay dưới. Xếp cho đợt sau.
- **FR-A.8 chọn `sr-only` chứ không phải bảng nhìn thấy:** người nhìn đã đọc mọi số ngay trên
  biểu đồ, một bảng nhìn thấy sẽ lặp lại và đổi bố cục đóng băng. Ba bảng (8/6/6 hàng, gồm
  tiêu đề) nằm ngoài cây `role="img"`; 17/17 giá trị có mặt, 0 chữ của biểu đồ thiếu ở bảng,
  0/20 hàng có lỗi chữ dính.

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

- **TC-A.1** (FR-A.1, chặng 1) — Liên kết bỏ qua là điểm dừng `Tab` đầu tiên ở **36/36 trạng thái của survey chặng 1**;
  **số lần bấm `Tab` CẦN để tới `<main>`** giảm từ 8 (9 ở `/?chao=1` và `/?mk=1`) xuống **1**. *Bản 1.0–1.1 viết "số điểm dừng trước `<main>`", câu đó có hai nghĩa đi ngược chiều nhau:* theo thứ tự DOM, số điểm dừng **tăng** 8→9 vì liên kết bỏ qua là một điểm dừng mới; số lần bấm **cần** để tới `<main>` mới là con số giảm về 1. Chặng 1 đo cả hai: 8→9 ở 34 trạng thái, 9→10 ở 2 trạng thái, và 1 ở 36/36 trạng thái của survey chặng 1;
  `<main>` có `id` và nhận focus khi kích hoạt liên kết. *Lệnh:* phép đo D của
  `scripts/a11y/`. *Đối chứng:* gỡ liên kết trong bộ nhớ ⇒ số đếm quay về 8 và 9. *Survey lên 39 trạng thái từ chặng 2 (mục 0.7); con số của TC-A.1 là số của chặng 1, không lệch với TC-A.9.*
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
  `role=menu`/`menuitem`; **2/2** chỗ đã xử lý (`AccountMenu`, `CategoryNav`). `Enter` mở, `Escape` đóng và trả focus về nút khi focus đang ở nút hoặc trong panel: **2/2** vẫn đạt sau khi sửa. *Bản 1.0–1.1 còn đòi "Tab vào panel"; bỏ ở bản 1.2 vì tiêu chí đó ôm sát `AccountMenu` (panel nằm ngay sau nút trong DOM) và không đúng cho `CategoryNav` (panel nằm sau các liên kết điều hướng). Yêu cầu thật của một disclosure là Escape đóng và trả focus. Chặng 1 báo việc nới này thay vì nới lặng lẽ — đó là lằn ranh.* *Lệnh:* `grep -rn
  'aria-haspopup'` ra đúng tập đã xử lý, cộng phép đo bàn phím của `scripts/a11y/`.
- **TC-A.6** (FR-A.6, chặng 3) — **21 route cộng `/_not-found`** đều có `<title>`; **3/3** `/tu-sach/[slug]` có
  tiêu đề riêng, khác nhau và khác "NA Books"; **6** route admin cố ý giữ "NA Books" (A11Y-13): `/admin`, `/admin/don-hang`, `/admin/don-hang/[code]`, `/admin/sach`, `/admin/sach/moi`, `/admin/sach/[slug]`. *Bản 1.0–1.2 ghi 4; con số đó chép từ bản 1.4 của spec rà soát, mà bản 1.4 chỉ đếm những route nó vừa đo và bỏ `/admin/don-hang` (đã đo ở bản 1.3) — một con số cũng mô tả nơi nó được đo, mục 0.6 luật 1.* *Lệnh:* `curl` từng route trên bản production, `grep` thẻ `<title>`.
- **TC-A.7** (FR-A.7, chặng 3) — Ô email ở `/tai-khoan` dùng `readOnly`, không `disabled`;
  chữ giá trị **≥ 4,5:1** (trước: 4,45:1); chọn và copy được (`document.getSelection()` sau
  khi chọn trả về đúng chuỗi email, điều `disabled` chặn). **3/3** trạng thái của trang.
  *Lệnh:* phép đo A (chữ giá trị trong ô) cộng một phép thử chọn-chữ qua CDP.
- **TC-A.8** (FR-A.8, chặng 3) — **3/3** biểu đồ `/admin` có bảng số liệu bằng chữ nằm NGOÀI
  cây `role="img"`; mọi giá trị trong biểu đồ có mặt ở chữ đó, gồm **doanh thu từng tháng** và **ba bước giữa của phễu**. **Giá trị kỳ vọng tính TỪ DỮ LIỆU LÚC ĐO** (truy vấn thẳng cùng nguồn mà biểu đồ dùng), không ghi cứng trong tiêu chí: bản 1.0–1.1 ghi 360/150/60, chặng 2 đo được 361/150/61 — số do dữ liệu sinh ra thì trôi, xem mục 0.6 luật 4. *Lệnh:* cây accessibility của Edge cộng
  `grep` nút chữ ngoài cây `role="img"`. *Đối chứng:* xoá một giá trị khỏi bảng trong bộ nhớ
  ⇒ phép đo phải báo thiếu.
- **TC-A.9** (không hồi quy, chặng 4) — Đo lại **39 trạng thái**: 0 vi phạm NFR-6.1; mọi phần
  tử tương tác tới được bằng `Tab`, 0 thiếu chỉ báo focus, 0 chỉ báo dưới 3:1; 0 `<svg>` thiếu
  `aria-hidden` hoặc nhãn; 0 phần tử tương tác không tên; **0 cặp token của chữ HOẠT ĐỘNG dưới 4,5:1** (NFR-6.7, vì
  đợt này đổi token màu placeholder). Số đo cuối: **68 cặp, 5 dưới ngưỡng — cả 5 đều là miễn trừ đã chấp nhận**: 3 cặp của thành phần vô hiệu hoá (A11Y-02, miễn trừ của chính WCAG 1.4.3) và 2 cặp của dấu `“` trang trí `aria-hidden` (A11Y-03); 3 cặp trong 4,5–5,0:1 đúng là ba cặp của A11Y-04 (4,66 · 4,77 · 4,97). *Bản 1.0–1.3 viết "0 cặp token dưới 4,5:1" mà quên khoét hai miễn trừ đã biết, trong khi tiêu chí 6.1 của cùng mục thì có mệnh đề "thành phần vô hiệu hoá tách riêng" — tiêu chí viết thiếu phần khoét sẵn sẽ đọc ra "trượt" trong khi mã đạt.* Điều kiện miễn trừ **A11Y-14** đo lại ở 1280px: **0 bìa trượt (a)**, và 0 nơi bắt buộc trượt (b); **số bìa đo được ghi lại làm số liệu, KHÔNG phải ngưỡng.** *Vì sao bản 1.0 sai:* nó đặt ngưỡng 108, là cột 1280px của bảng mục 3.1 bản 1.3 (108 + 111 = 219 qua hai khung). Bản 1.3 đo trên dữ liệu cục bộ khác (3 tủ sách, 1 khách có giỏ 2 dòng, 1 đơn 3 dòng), còn đợt này đo trên seed demo (40 sách, 42 đơn, 84 dòng `order_items`), nên số bìa ở `/gio-hang`, `OrderSummary` và các lưới `BookCard` không so sánh được giữa hai lượt. Tiêu chí giữ được tính không rỗng bằng đối chứng: **6/6** bìa tổng hợp phải bị phân loại đúng. **Phép thao tác hoá của (a), sửa ở bản 1.2 và ghi đủ ở bản 1.4 — HAI bước, không phải một:** (1) tính thông tin có mặt dưới dạng **giá trị ô nhập**, không chỉ text node; (2) với bìa `aria-hidden` **không nằm trong liên kết nào**, kiểm thêm chữ trong `<main>`, vì ô nhập nằm ngoài khối chú thích nên quy tắc "tổ tiên đầu tiên đủ 20 ký tự" không với tới. Bước (2) là phán đoán của Claude Code, ghi ở mục 3.3.2 của bản 1.5 rà soát. Kết quả cuối: **161 bìa, 0 trượt (a), 96 nơi bắt buộc 0 trượt (b)**; ba bìa xem trước của form admin chuyển trượt → đạt. **Hai bìa ở `/admin/sach/moi` (form trống) đạt một cách tầm thường, không phải "nhờ nhãn ô":** bìa vẽ chữ giữ chỗ "Tên sách"/"Tác giả" nên **không mang thông tin sách nào**, và nhánh trang trí của (a) chỉ đòi bìa không là nơi duy nhất mang thông tin — ở đây không có thông tin nào để giữ. Đối chứng của bộ đo **≥ 21/21**, gồm ca
  "màu mặc định". *Lệnh:* `node scripts/a11y/run.mjs` toàn bộ.
- **TC-A.10** (đóng đợt, chặng 4) — Mọi tài liệu khớp hiện trạng: spec rà soát lên **bản 1.5**
  mang số đo sửa lại ở mục 0.5 và lý do lệch; mục 7.15 mới; mục 8 thêm sáu luật ở mục 0.6;
  mục 9 xoá dòng "chênh 1 migration chưa giải thích được" và dẫn
  `supabase/migrations/README.md` làm lời giải; `README.md` dòng 103 đổi **14 → 6** phát hiện
  còn mở; `docs/runbooks/supabase-local.md` thêm mẹo `wsl --shutdown` trước khi mở Docker
  Desktop; `supabase/migrations/README.md` sửa "4 file đầu tiên" thành "3".
  *Lệnh (hai lệnh, hai chiều ngược nhau):*
  (1) **Cụm cũ phải biến mất.** `grep -rn "14 phát hiện\|14 việc\|4 file đầu tiên\|Chênh 1 chưa giải thích được" docs/ README.md supabase/migrations/README.md --exclude=dot-accessibility-sua.md --exclude=dot-accessibility-ra-soat.md` — **đúng 4 dòng TRƯỚC khi sửa** (`README.md` dòng 103 · mục 9 dòng 881 · mục 9 dòng 886 · `supabase/migrations/README.md` dòng 8) và **0 dòng SAU khi sửa**.
  (2) **Mẹo mới phải xuất hiện.** `grep -c "wsl --shutdown" docs/runbooks/supabase-local.md` — **0 TRƯỚC khi sửa**, **≥ 1 SAU khi sửa**.

  *Vì sao hai file spec bị loại trừ — đây là một quyết định, không phải tiện tay:* `dot-accessibility-sua.md` và `dot-accessibility-ra-soat.md` là **bản ghi lịch sử**, có nhiệm vụ giữ nguyên câu chữ của trạng thái TRƯỚC đợt sửa (dòng nguồn "14 phát hiện còn mở", và bản 1.5 sẽ ghi lại cùng câu đó làm dấu vết). Năm chỗ còn lại là **tài liệu mô tả hiện trạng**, có nhiệm vụ khớp thực tế. Cổng chỉ soi loại thứ hai. Không loại trừ thì cổng **không bao giờ đạt được**, vì chính file spec chứa các cụm đó và chứa cả câu lệnh này.

  *Vì sao bản 1.0 và bản 1.1-nháp đều sai:* bản 1.0 có cụm `chênh 1 migration` không khớp dòng nào (câu thật là "Chênh 1 chưa giải thích được") và cụm `4 file đầu tiên` nằm ngoài phạm vi `docs/ README.md` (nó ở `supabase/migrations/README.md`) — **cổng đạt rỗng**. Bản 1.1-nháp sửa hai lỗi đó nhưng đặt kỳ vọng 4 từ một phép đếm chạy KHI FILE SPEC CHƯA TỒN TẠI; file spec vừa viết thêm 3 dòng khớp, nên thành **cổng không đạt được**. Phép đếm TRƯỚC khi sửa, cộng với việc tự loại trừ tài liệu của chính đợt, là hai thứ giữ cho cổng không rỗng và không bất khả.

## 3. Sau đợt này
**8 phát hiện đóng:** A11Y-01, 07, 08, 09, 10, 21, 22, 23 (A11Y-23 đóng là "đã sửa, chưa kết
luận nó có phải vi phạm" — xem 0.2).
**6 còn mở:** A11Y-03 và A11Y-13 (đã quyết: không sửa) · A11Y-04 (biên token, phép canh tự
động để đợt sau) · A11Y-05 và A11Y-06 (mobile) · A11Y-12 (quyết định thiết kế, xem 0.3).
**390px:** mọi số của đợt này đo ở 1280px. Thay đổi của FR-A.1 → FR-A.8 không nằm trong
media query nào, nên **suy ra** là giống nhau ở 390px — đó là suy luận, không phải phép đo.
Giai đoạn mobile phải đo lại.

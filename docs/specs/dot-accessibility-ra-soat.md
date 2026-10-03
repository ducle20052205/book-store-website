# Rà soát accessibility toàn site — danh sách phát hiện

Phiên bản 1.0 · 03/10/2026 · **Chỉ đo, không sửa.** Đợt sửa là đợt riêng, chờ chủ dự án chọn việc ở mục 6. Tài liệu này không thay đổi mã nào.

Tham chiếu: `docs/SRS.md` NFR-6.1 → NFR-6.7 (tương phản AA, vùng chạm 44×44px trên mobile, focus nhìn thấy và điều hướng bàn phím, `alt` ảnh bìa và `aria-hidden` icon trang trí, không truyền đạt thông tin chỉ bằng màu, chữ nội dung tối thiểu 14px, kiểm lại cặp màu sau mỗi lần đổi token). Mã được đo: `main` tại `bbdf305` cộng nhánh `perf/n1-trang-chu` (không đổi giao diện).

## 1. Phạm vi và cách đo

**Trang (12 trạng thái của 8 route), mỗi trang ở 1280×900 và 390×844 (24 lượt):** trang chủ; `/sach`; `/sach/[slug]` (sách giảm giá; sách hết hàng); `/tu-sach`; `/gio-hang` (trống; có hàng); `/thanh-toan`; `/tai-khoan/don-hang`; `/admin/don-hang` (danh sách; chi tiết; chi tiết với vùng xác nhận đang mở).

**Điều kiện.** Stack Supabase cục bộ, bản production (`next build` rồi `next start`), Edge headless qua CDP; dữ liệu thử: 1 khách có giỏ (2 cuốn) và 5 đơn đủ 5 trạng thái, 1 admin. Bộ đo không nằm trong repo (như các đợt trước). Hosted chưa được đo (Claude Code không đăng nhập hosted Auth).

| NFR | Cách đo | Ngưỡng |
|---|---|---|
| 6.1 | Mọi nút văn bản nhìn thấy (1.009 ở desktop, 938 ở mobile): màu chữ (kể cả độ trong suốt và `opacity` của tổ tiên) hợp thành lên nền hiệu dụng (hợp từ gốc xuống), tỉ lệ WCAG; gom theo (chữ, nền, cỡ, đậm) = 702 nhóm, 59 cặp token; thêm `::placeholder` của 26 ô nhập | 4,5:1; 3:1 nếu ≥ 18px (theo SRS) |
| 6.2 | `getBoundingClientRect` của mọi phần tử tương tác nhìn thấy ở 390px (302 phần tử); ô chọn/radio trong `<label>` đo theo label | 44×44px |
| 6.3 | Duyệt `Tab` thật bằng sự kiện bàn phím CDP (311 phần tử tương tác ở 11 trang desktop): có tới được không, chỉ báo focus (outline, vòng `box-shadow`, đổi kiểu) và tỉ lệ của nó với nền xung quanh; mở/đóng công tắc bằng `Enter`/`Space`/`Escape`; ảnh chụp đối chiếu | chỉ báo có và ≥ 3:1 (WCAG 1.4.11) |
| 6.4 | Mọi `<svg>` nhìn thấy (`aria-hidden`), mọi `<img>` (`alt`), `[role=img]` (nhãn); cây accessibility của trình duyệt: phần tử tương tác không có tên | — |
| 6.5 | Liên kết nằm giữa câu: gạch chân, độ đậm, tỉ lệ màu so với chữ quanh; lỗi form ở `/thanh-toan` (gửi form trống) | WCAG 1.4.1: ≥ 3:1 với chữ quanh hoặc dấu hiệu khác |
| 6.6 | `font-size` tính toán của mọi nút văn bản ở 1280px | 14px |
| 6.7 | Bảng 59 cặp token chữ/nền thực dùng, tỉ lệ nhỏ nhất của từng cặp | như 6.1 |

**Mức độ.** *Cao*: chặn hoàn thành tác vụ hoặc vi phạm rõ NFR ở nội dung/điều khiển chính trên nhiều trang. *Trung bình*: vi phạm NFR ở nội dung/điều khiển phụ, hoặc một nhóm người dùng bị ảnh hưởng nhưng có đường vòng. *Thấp*: ngoại lệ của chuẩn (WCAG) mà SRS không nêu, biên sát ngưỡng, hoặc ngoài NFR-6.x.

## 2. Tổng hợp

| NFR | Kết quả | Số phát hiện |
|---|---|---|
| 6.1 tương phản | Mọi chữ hoạt động đạt: 0 vi phạm ở 702 nhóm. Dưới ngưỡng chỉ có thành phần vô hiệu hoá, một ký tự trang trí `aria-hidden`, và **1 placeholder** (3,3:1) | 1 Trung bình, 2 Thấp |
| 6.2 vùng chạm (390px) | 9/302 phần tử dưới 44px (3,0%); 0 ở 8 trong 12 trang | 1 Trung bình |
| 6.3 focus và bàn phím | **0/311** phần tử thiếu chỉ báo focus; 0 chỉ báo dưới 3:1; 310 tới được bằng `Tab` (1 radio theo quy ước phím mũi tên); mọi công tắc mở/đóng được bằng bàn phím | 2 Thấp |
| 6.4 `alt` và icon | **108/108** `<svg>` có `aria-hidden`; 134/134 `[role=img]` có nhãn; 0 phần tử tương tác không tên (381 có tên) | 1 Thấp |
| 6.5 không chỉ bằng màu | Lỗi form không chỉ bằng màu; 3 liên kết trong dòng chỉ khác màu và độ đậm | 1 Trung bình |
| 6.6 chữ ≥ 14px | **347/1.009 (34,4%)** nút văn bản dưới 14px | 1 Trung bình |
| 6.7 kiểm lại cặp màu | 59 cặp đã đo, bảng ở mục 4; 300 nút văn bản nằm trong 0,5 trên ngưỡng | 1 Thấp |
| Ngoài NFR-6.x | không có liên kết bỏ qua; viền ô nhập; `title` admin | 3 Thấp |

Không có phát hiện mức *Cao*.

## 3. Danh sách phát hiện

| # | NFR | Mức | Trang · phần tử | Số đo | Ghi chú |
|---|---|---|---|---|---|
| A11Y-01 | 6.1 | Trung bình | `/thanh-toan` · `textarea[name=note]` (placeholder "Ví dụ: gọi trước khi gia…", 16px) | placeholder **3,3:1** trên nền ô, ngưỡng 4,5:1 | Các placeholder khác đạt: 5,3:1 (ô tìm ở mọi trang) và 5,9:1 (ô giá `/sach`). Bộ đo chữ không thấy placeholder (không phải nút văn bản): phải đo riêng |
| A11Y-02 | 6.1 | Thấp | `/sach/[slug]` hết hàng · nút "−", "+", "Thêm vào giỏ hàng", "Mua ngay" (vô hiệu, `opacity: 0,4`); "−" khi số lượng = 1; thanh dưới mobile | 2,13:1 · 2,39:1 · 2,48:1 · 3,29:1 (ngưỡng 3 hoặc 4,5) | WCAG 1.4.3 miễn trừ thành phần vô hiệu; SRS NFR-6.1 không nêu miễn trừ. Trên trang hết hàng toàn bộ hành động chính gần như không đọc được — chủ dự án quyết có chấp nhận miễn trừ không |
| A11Y-03 | 6.1 | Thấp | Trang chủ · khối editorial · dấu `“` 48px (`aria-hidden`) | 2,13:1 | Ký tự trang trí, không mang thông tin; ghi để đối chiếu với A11Y-02 |
| A11Y-04 | 6.7 | Thấp | Toàn site · `ink-400` trên `paper` (12–14px: tác giả, giá gốc, chân trang; 261 nút), `sale` trên `paper` (17px; 37 nút), `success` trên `paper` (2 nút) | **4,77:1**, **4,66:1**, 4,97:1 (ngưỡng 4,5) | Đạt, nhưng dư 0,16–0,47: đổi `paper` hay các token này sẽ tụt dưới ngưỡng (đã từng xảy ra ở đợt F, `globals.css`). NFR-6.7 yêu cầu kiểm lại sau mỗi lần đổi token |
| A11Y-05 | 6.2 | Trung bình | 390px · "Xem tất cả" ở trang chủ (76×20); 4 liên kết breadcrumb ở `/sach/[slug]` ("Trang chủ" 67×20, "Văn học" 56×20, "Manga – Light novel" 138×20, "Trang chủ" 67×20); liên kết tác giả trong dòng (91×18 và 105×18); liên kết tên sách trong dòng ở `/gio-hang` (114×19); "Tiếp tục xem sách" (124×18) | 9/302 dưới 44px; cao 18–20px | 293 phần tử còn lại đạt ngưỡng. Liên kết nằm giữa câu được WCAG 2.5.8 miễn trừ nhưng SRS thì không; đã có chỗ giải bằng `py-3 -my-3` (editorial) — chưa áp cho các chỗ này |
| A11Y-06 | 6.3 | Thấp | `/sach` ở 390px · nút "Bộ lọc" và hộp thoại bộ lọc | nút không `aria-expanded`/`aria-controls`; `role="dialog"` không `aria-modal`; 1/14 lần `Tab` đưa focus ra ngoài hộp thoại | `Escape` đóng và trả focus về nút đúng; focus vào "Đóng bộ lọc" khi mở |
| A11Y-07 | 6.3 | Thấp | Header · nút "Tài khoản" | `aria-haspopup="true"` (nghĩa là menu) nhưng nội dung là liên kết, không `role=menu`/`menuitem`; `ArrowDown` không di chuyển focus | `Enter` mở, `Tab` vào liên kết, `Escape` đóng và trả focus: đúng. Hộp thoại mobile của cùng nút đúng: focus vào "Đóng", 0/14 lần `Tab` thoát ra |
| A11Y-08 | ngoài NFR (WCAG 2.4.1) | Thấp | 12/12 trang · không có liên kết "bỏ qua tới nội dung" | 8 điểm dừng `Tab` đứng trước `<main>` ở mọi trang | Header: logo, ô tìm, tài khoản, giỏ, bốn mục điều hướng |
| A11Y-09 | 6.4 | Thấp | `/`, `/sach`, `/sach/[slug]`, `/tu-sach` · liên kết thẻ sách và thẻ tủ sách | tên truy cập lặp tên sách (bìa `role=img` rồi chữ tên) và dính liền "Kinh dịTrong tủ sách"; 23 liên kết tên > 90 ký tự (trang chủ 10, `/sach` 8, `/tu-sach` 3, sách hết hàng 2) | Ví dụ: "Frieren – Pháp sư tiễn táng – Tập 1 Manga Frieren – Pháp sư tiễn táng – Tập 1 Yamada Kanehito, Abe Tsukasa 39.000 ₫". Không phần tử tương tác nào thiếu tên |
| A11Y-10 | 6.5 | Trung bình | Liên kết tác giả ở `/sach/[slug]` (2 trang): màu `cham-700`, `font-medium`, không gạch chân; 2 liên kết trong khối editorial trang chủ (nền tối) | tỉ lệ với chữ quanh **1,50:1** và **1,68:1** (cần 3:1), độ đậm 500 so với 400, không gạch chân | Chưa đo trạng thái hover/focus (có thể có gạch chân khi hover). Lỗi form ở `/thanh-toan` đạt: 3/3 trường `aria-invalid` + `aria-describedby`, có chữ báo lỗi và dải tóm tắt `role=alert` |
| A11Y-11 | 6.6 | Trung bình | Toàn site (desktop) | **347/1.009** nút văn bản < 14px: 13px 113, 12px 194, 12,9px 20, 11,3px 4, **10px 16**. Theo vai trò: metadata `text-meta` 85, nhãn/chip `text-micro` 80, bìa typographic (`aria-hidden`, nhân đôi tên/tác giả) 78, tiêu đề `text-xs` ở mega-menu 38, còn lại 66 (badge "-X%", "Hết hàng", nhãn "Từ", số đếm giỏ…) | Xung đột giữa SRS ("chữ nội dung tối thiểu 14px") và token thiết kế đã chốt (`--text-micro` 12px "nhãn, chip"; `--text-meta` 13px). Trang nặng nhất: `/sach` 123/219, trang chủ 108/220. Chữ in trên bìa nhỏ xuống 10px khi bìa hẹp (`clamp`, 6cqw) |
| A11Y-12 | ngoài NFR (WCAG 1.4.11) | Thấp | `/sach` · ô sắp xếp, ô giá "Từ"/"Đến"; ô tìm ở header | viền so với nền xung quanh **1,04:1** và 1,36:1 (cần 3:1) | Ô ở `/thanh-toan` đạt 3,2:1. Chỉ đo viền, chưa đo nền ô: có thể ranh giới thấy được nhờ nền ô khác nền cha |
| A11Y-13 | ngoài NFR (WCAG 2.4.2) | Thấp | `/admin/*` · `<title>` | 3/3 trang admin cùng "NA Books" | Cố ý (spec 5A FR-5A.1: vỏ tĩnh không được lộ giao diện quản trị); ghi để biết |

## 4. Đã đạt (đối chứng: phép đo không rỗng)

- **Chỉ báo focus:** 311 phần tử qua `Tab`; 308 vòng `box-shadow` (trắng 2px rồi chàm 4px), 2 outline mặc định của ô chọn, 0 thiếu. Ảnh chụp một thẻ sách và một thẻ tủ sách `hover-lift` (lớp có transition) cho thấy vòng nhìn thấy; thẻ danh mục và nút "Xem tủ sách" được đối chiếu bằng `box-shadow` tính toán (cùng hai lớp trắng 2px và chàm 4px).
- **Bàn phím:** menu "Danh mục" mở bằng `Enter`, đóng bằng `Escape`, focus trả về nút (3/3); hộp thoại tài khoản ở 390px giữ focus (0/14 lần thoát). Mọi ô nhập có nhãn (26/26, 0 chỉ có placeholder).
- **Khung trang:** `lang="vi"`, đúng một `h1`, `main`/`header`/`footer` mỗi cái một, 12/12.
- **Tương phản:** 59 cặp token; cặp thấp nhất của chữ hoạt động là `sale`→`paper` 4,66:1 (chữ 17px) và `ink-400`→`paper` 4,77:1. Chữ trắng/trắng-80 trên các màu bìa có mặt ở dữ liệu đo đạt ≥ 5,0:1 (thấp nhất `cover-4` 5,02:1); chưa đo đủ 12 màu bìa vì dữ liệu cục bộ không dùng hết.
- **Vùng chạm:** 293/302 phần tử ≥ 44×44px ở 390px; ô chọn và radio trong nhãn đạt (đo theo nhãn).
- **Icon và ảnh:** 108/108 `<svg>` có `aria-hidden`; bìa typographic `role="img"` có `aria-label` = tên sách (134/134 lượt); mã dùng `alt={title}` cho ảnh bìa thật (dữ liệu cục bộ không có ảnh thật nên chưa đo bằng trình duyệt).
- **Giảm chuyển động:** có `@media (prefers-reduced-motion: reduce)` (`globals.css`); vùng thông báo `Toast` có `aria-live`/`role` (đọc mã, chưa đo bằng trình đọc màn hình).

## 5. Giới hạn và phép đo hỏng của chính bộ kiểm

**Phép đo hỏng đã bắt được và sửa trước khi viết phát hiện (đo lại sau khi sửa):**
- Vòng focus báo "yếu 1,11:1" ở thẻ `hover-lift` (thẻ nổi bật, thẻ tủ sách) và "không có vòng": **dương tính giả**, do đọc `box-shadow` ngay sau khi focus, đúng lúc lớp `hover-lift` đang chuyển dần (transition). Tắt transition khi đo, và ảnh chụp xác nhận vòng nhìn thấy; sau đó 0/311 thiếu chỉ báo và 0 dưới 3:1. Tỉ lệ viền lúc đầu cũng đo so với nền của chính phần tử thay vì nền xung quanh.
- Ba "vùng chạm 20×20" ở `/thanh-toan`: ô chọn nằm trong `<label>`; vùng bấm thật là cả nhãn. Đo lại theo nhãn: 0 dưới 44px.
- "Không tới được bằng Tab" ở `/thanh-toan` (1 radio) là hành vi chuẩn của nhóm radio (vào bằng một `Tab`, đổi ô bằng phím mũi tên); ở trạng thái xác nhận của admin (12 phần tử) là do điểm bắt đầu duyệt phím đã dời vào vùng xác nhận sau khi nhấp; trạng thái nghỉ của cùng trang đã được duyệt đầy đủ.
- Hộp thoại "Tài khoản" ở desktop: truy vấn `[role=dialog]` khớp hộp thoại mobile đang ẩn bằng CSS (mã `AccountMenu.tsx` có cả bảng desktop không role lẫn hộp thoại mobile `role=dialog aria-modal`); đã đọc lại theo mã và đo từng khung riêng.

**Chưa đo / không đo được:**
- Trạng thái hover và active (A11Y-10 có thể khác khi hover); trạng thái mở của mega-menu và hộp thoại ngoài việc mở/đóng và Tab; `/dang-nhap`, `/dang-ky`, `/tai-khoan/...` ngoài danh sách; hosted.
- Lớp vân giấy và gáy sách phủ lên bìa (phần tử anh em, không phải tổ tiên của chữ) không được tính vào nền hiệu dụng của chữ trên bìa; tương phản của chữ trên bìa đo theo màu nền bìa.
- Tương phản của thành phần giao diện không phải chữ (WCAG 1.4.11) chỉ đo ở viền ô nhập và vòng focus; chưa đo biểu tượng, đường kẻ, trạng thái chọn.
- Trình đọc màn hình thật (chỉ đọc cây accessibility của trình duyệt), thu phóng 200–400% và reflow, giãn chữ, thứ tự khoảng cách giữa các vùng chạm, chế độ tối (site không có).
- Đo ở một máy, Edge headless; `min-height`/`vùng chạm` đo bằng hộp bao, không đo vùng bấm thực của liên kết nhiều dòng.

## 6. Việc cần chủ dự án quyết trước đợt sửa

1. **NFR-6.6 hay token?** 34,4% chữ dưới 14px là hệ quả của `--text-micro` 12px và `--text-meta` 13px đã chốt. Sửa SRS cho khớp (ví dụ chữ nội dung chính ≥ 14px, metadata ≥ 12px) hoặc nâng token — hai đường có chi phí giao diện rất khác nhau.
2. **Miễn trừ cho thành phần vô hiệu hoá (A11Y-02)** và cho liên kết nằm giữa câu ở vùng chạm (A11Y-05): chấp nhận theo WCAG hay giữ chữ của SRS.
3. **Thứ tự sửa gợi ý theo tác động:** A11Y-01 (một class), A11Y-10 và A11Y-05 (liên kết: gạch chân và vùng bấm), A11Y-06 và A11Y-07 (ARIA), A11Y-09 (tên truy cập thẻ sách), A11Y-08 (liên kết bỏ qua); A11Y-11 là quyết định thiết kế.

# Rà soát accessibility toàn site — danh sách phát hiện

Phiên bản 1.2 · 03/10/2026 · **Chỉ đo, không sửa.** Đợt sửa là đợt riêng. Tài liệu này không thay đổi mã nào.

**Quyết định của chủ dự án, 03/10/2026 (bản 1.1 và 1.2):**
1. A11Y-11 (chữ dưới 14px) **đã giải quyết bằng sửa chuẩn**: SRS lên bản 1.9, NFR-6.6 viết lại (ghi chú ở A11Y-11).
2. A11Y-02 (nút vô hiệu hoá) **chấp nhận**: đó là miễn trừ có trong chính WCAG 1.4.3 cho thành phần không hoạt động, không phải ngoại lệ do dự án tự đặt ra.
3. Ba phát hiện Trung bình còn lại, **A11Y-01, A11Y-05 và A11Y-10, giữ nguyên là việc cần sửa**, thuộc đợt sửa accessibility.
4. A11Y-14 (chữ in trên bìa dưới 12px): **miễn trừ khỏi NFR-6.6 có điều kiện** (bản 1.2). Chữ in trên bìa là chất liệu của ảnh bìa do `BookCover` sinh ra, không phải chữ giao diện; nâng sàn của `clamp` lên 12px là sửa ảnh để phục vụ một quy tắc viết cho chữ giao diện, và làm méo tỉ lệ bìa ở cỡ nhỏ. **Điều kiện:** ở mọi nơi dùng `BookCover`, tên sách và tên tác giả có mặt dưới dạng chữ thật bên cạnh bìa. **Điều kiện đã kiểm (mục 3.1): chưa đạt** — 6 nơi thiếu, nên A11Y-14 **chưa đóng** và mỗi nơi thiếu là một phát hiện Trung bình riêng (A11Y-15 → A11Y-20). A11Y-14 đóng khi sáu phát hiện này được sửa và kiểm lại.

Tình trạng: 20 phát hiện — 2 đã đóng (A11Y-02, A11Y-11), 18 còn mở (9 Trung bình, 9 Thấp, 0 Cao). Trong 18 phát hiện còn mở có A11Y-14: miễn trừ đã quyết, điều kiện chưa đạt.

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

**Kiểm điều kiện miễn trừ A11Y-14 (bản 1.2, đo riêng, mục 3.1).** Mọi bìa `BookCover` nhìn thấy (`[role=img]` mang lớp bìa) ở 16 trang × 2 khung (1280×900 và 390×844) = 32 lượt: 219 bìa. Với mỗi bìa, "bên cạnh" được thao tác hoá như sau: đi từ cha của bìa lên từng tổ tiên cho tới tổ tiên đầu tiên có từ 20 ký tự chữ thật trở lên, **không tính** cây con của chính bìa, mọi cây `aria-hidden` và phần tử bị ẩn; đạt khi chữ đó chứa tên sách **và** tên tác giả. Tên tác giả lấy từ bảng `books` (không lấy từ chữ in trên bìa); tên sách là duy nhất trong dữ liệu đo (0 trùng). Trang chủ đo cả hai tab (Sách mới, Bán chạy); ở 390px `/thanh-toan` mở sẵn `<details>` tóm tắt đơn. Dữ liệu cục bộ, không có ảnh bìa thật.

**Mức độ.** *Cao*: chặn hoàn thành tác vụ hoặc vi phạm rõ NFR ở nội dung/điều khiển chính trên nhiều trang. *Trung bình*: vi phạm NFR ở nội dung/điều khiển phụ, hoặc một nhóm người dùng bị ảnh hưởng nhưng có đường vòng. *Thấp*: ngoại lệ của chuẩn (WCAG) mà SRS không nêu, biên sát ngưỡng, hoặc ngoài NFR-6.x.

## 2. Tổng hợp

| NFR | Kết quả | Số phát hiện |
|---|---|---|
| 6.1 tương phản | Mọi chữ hoạt động đạt: 0 vi phạm ở 702 nhóm. Dưới ngưỡng chỉ có thành phần vô hiệu hoá, một ký tự trang trí `aria-hidden`, và **1 placeholder** (3,3:1) | 1 Trung bình (A11Y-01), 1 Thấp (A11Y-03), 1 đã chấp nhận (A11Y-02) |
| 6.2 vùng chạm (390px) | 9/302 phần tử dưới 44px (3,0%); 0 ở 8 trong 12 trang | 1 Trung bình |
| 6.3 focus và bàn phím | **0/311** phần tử thiếu chỉ báo focus; 0 chỉ báo dưới 3:1; 310 tới được bằng `Tab` (1 radio theo quy ước phím mũi tên); mọi công tắc mở/đóng được bằng bàn phím | 2 Thấp |
| 6.4 `alt` và icon | **108/108** `<svg>` có `aria-hidden`; 134/134 `[role=img]` có nhãn; 0 phần tử tương tác không tên (381 có tên) | 1 Thấp |
| 6.5 không chỉ bằng màu | Lỗi form không chỉ bằng màu; 3 liên kết trong dòng chỉ khác màu và độ đậm | 1 Trung bình |
| 6.6 cỡ chữ | 347/1.009 (34,4%) nút văn bản dưới 14px; theo NFR-6.6 bản 1.9, chữ phụ 12–13px không còn là vi phạm (0/347 dưới 4,5:1, thấp nhất 4,77:1); còn 20 nút dưới 12px | A11Y-11 đã giải quyết bằng sửa chuẩn; 1 Thấp mới (A11Y-14) |
| 6.6 / 6.4 chữ thật cạnh bìa (điều kiện miễn trừ A11Y-14) | **173/219** bìa có tên sách và tác giả dưới dạng chữ thật bên cạnh; 8/14 nơi đạt ở cả hai khung (6/12 nơi, nếu hai tab trang chủ tính một); 5/13 trang có dùng `BookCover` đạt | 6 Trung bình (A11Y-15 → A11Y-20) |
| 6.7 kiểm lại cặp màu | 59 cặp đã đo, bảng ở mục 4; 300 nút văn bản nằm trong 0,5 trên ngưỡng | 1 Thấp |
| Ngoài NFR-6.x | không có liên kết bỏ qua; viền ô nhập; `title` admin | 3 Thấp |

Không có phát hiện mức *Cao*. Còn mở: A11Y-01, A11Y-05, A11Y-10, A11Y-15, 16, 17, 18, 19, 20 (Trung bình); A11Y-03, 04, 06, 07, 08, 09, 12, 13, 14 (Thấp; A11Y-14 đã được miễn trừ có điều kiện, điều kiện chưa đạt).

## 3. Danh sách phát hiện

| # | NFR | Mức | Trang · phần tử | Số đo | Ghi chú |
|---|---|---|---|---|---|
| A11Y-01 | 6.1 | Trung bình | `/thanh-toan` · `textarea[name=note]` (placeholder "Ví dụ: gọi trước khi gia…", 16px) | placeholder **3,3:1** trên nền ô, ngưỡng 4,5:1 | **Còn mở, thuộc đợt sửa accessibility.** Các placeholder khác đạt: 5,3:1 (ô tìm ở mọi trang) và 5,9:1 (ô giá `/sach`). Bộ đo chữ không thấy placeholder (không phải nút văn bản): phải đo riêng |
| A11Y-02 | 6.1 | **Đã chấp nhận** | `/sach/[slug]` hết hàng · nút "−", "+", "Thêm vào giỏ hàng", "Mua ngay" (vô hiệu, `opacity: 0,4`); "−" khi số lượng = 1; thanh dưới mobile | 2,13:1 · 2,39:1 · 2,48:1 · 3,29:1 (ngưỡng 3 hoặc 4,5) | **Chủ dự án chấp nhận (03/10/2026): không sửa.** Thành phần vô hiệu hoá được miễn trừ **bởi chính WCAG 1.4.3** (thành phần giao diện không hoạt động), không phải ngoại lệ do dự án tự đặt ra. Ghi nhận thêm: trên trang hết hàng toàn bộ hành động chính vì thế gần như không đọc được (2,13–3,29:1) |
| A11Y-03 | 6.1 | Thấp | Trang chủ · khối editorial · dấu `“` 48px (`aria-hidden`) | 2,13:1 | Ký tự trang trí, không mang thông tin; ghi để đối chiếu với A11Y-02 |
| A11Y-04 | 6.7 | Thấp | Toàn site · `ink-400` trên `paper` (12–14px: tác giả, giá gốc, chân trang; 261 nút), `sale` trên `paper` (17px; 37 nút), `success` trên `paper` (2 nút) | **4,77:1**, **4,66:1**, 4,97:1 (ngưỡng 4,5) | Đạt, nhưng dư 0,16–0,47: đổi `paper` hay các token này sẽ tụt dưới ngưỡng (đã từng xảy ra ở đợt F, `globals.css`). NFR-6.7 yêu cầu kiểm lại sau mỗi lần đổi token |
| A11Y-05 | 6.2 | Trung bình | 390px · "Xem tất cả" ở trang chủ (76×20); 4 liên kết breadcrumb ở `/sach/[slug]` ("Trang chủ" 67×20, "Văn học" 56×20, "Manga – Light novel" 138×20, "Trang chủ" 67×20); liên kết tác giả trong dòng (91×18 và 105×18); liên kết tên sách trong dòng ở `/gio-hang` (114×19); "Tiếp tục xem sách" (124×18) | 9/302 dưới 44px; cao 18–20px | **Còn mở, thuộc đợt sửa accessibility (cả 9 phần tử).** 293 phần tử còn lại đạt ngưỡng. Liên kết nằm giữa câu được WCAG 2.5.8 miễn trừ nhưng SRS thì không và chủ dự án không áp miễn trừ này; đã có chỗ giải bằng `py-3 -my-3` (editorial) — chưa áp cho các chỗ này |
| A11Y-06 | 6.3 | Thấp | `/sach` ở 390px · nút "Bộ lọc" và hộp thoại bộ lọc | nút không `aria-expanded`/`aria-controls`; `role="dialog"` không `aria-modal`; 1/14 lần `Tab` đưa focus ra ngoài hộp thoại | `Escape` đóng và trả focus về nút đúng; focus vào "Đóng bộ lọc" khi mở |
| A11Y-07 | 6.3 | Thấp | Header · nút "Tài khoản" | `aria-haspopup="true"` (nghĩa là menu) nhưng nội dung là liên kết, không `role=menu`/`menuitem`; `ArrowDown` không di chuyển focus | `Enter` mở, `Tab` vào liên kết, `Escape` đóng và trả focus: đúng. Hộp thoại mobile của cùng nút đúng: focus vào "Đóng", 0/14 lần `Tab` thoát ra |
| A11Y-08 | ngoài NFR (WCAG 2.4.1) | Thấp | 12/12 trang · không có liên kết "bỏ qua tới nội dung" | 8 điểm dừng `Tab` đứng trước `<main>` ở mọi trang | Header: logo, ô tìm, tài khoản, giỏ, bốn mục điều hướng |
| A11Y-09 | 6.4 | Thấp | `/`, `/sach`, `/sach/[slug]`, `/tu-sach` · liên kết thẻ sách và thẻ tủ sách | tên truy cập lặp tên sách (bìa `role=img` rồi chữ tên) và dính liền "Kinh dịTrong tủ sách"; 23 liên kết tên > 90 ký tự (trang chủ 10, `/sach` 8, `/tu-sach` 3, sách hết hàng 2) | Ví dụ: "Frieren – Pháp sư tiễn táng – Tập 1 Manga Frieren – Pháp sư tiễn táng – Tập 1 Yamada Kanehito, Abe Tsukasa 39.000 ₫". Không phần tử tương tác nào thiếu tên |
| A11Y-10 | 6.5 | Trung bình | Liên kết tác giả ở `/sach/[slug]` (2 trang): màu `cham-700`, `font-medium`, không gạch chân; 2 liên kết trong khối editorial trang chủ (nền tối) | tỉ lệ với chữ quanh **1,50:1** và **1,68:1** (cần 3:1), độ đậm 500 so với 400, không gạch chân | **Còn mở, thuộc đợt sửa accessibility.** WCAG 1.4.1 (kỹ thuật G183) đòi liên kết trong khối văn bản phải phân biệt được bằng thứ khác màu nếu tương phản của liên kết với chữ xung quanh dưới 3:1; 1,50–1,68:1 là dưới ngưỡng, nên **cách sửa là thêm gạch chân**. Chưa đo trạng thái hover/focus. Lỗi form ở `/thanh-toan` đạt: 3/3 trường `aria-invalid` + `aria-describedby`, có chữ báo lỗi và dải tóm tắt `role=alert` |
| A11Y-11 | 6.6 | **Đã giải quyết bằng sửa chuẩn** | Toàn site (desktop) | **347/1.009** nút văn bản < 14px: 13px 113, 12px 194, 12,9px 20, 11,3px 4, **10px 16**. Theo vai trò: metadata `text-meta` 85, nhãn/chip `text-micro` 80, bìa typographic (`aria-hidden`, nhân đôi tên/tác giả) 78, tiêu đề `text-xs` ở mega-menu 38, còn lại 66 (badge "-X%", "Hết hàng", nhãn "Từ", số đếm giỏ…) | **SRS lên bản 1.9: NFR-6.6 viết lại** — chữ nội dung đọc tối thiểu 14px; chữ phụ trợ (ngày, số đếm, nhãn, chú thích) được dùng 12–13px theo token `--text-micro` và `--text-meta` đã chốt, với điều kiện tương phản đạt WCAG AA cho cỡ chữ đó. **Lý do:** NFR-6.6 là quy tắc tự đặt của dự án, không phải tiêu chí WCAG (WCAG không quy định cỡ chữ tối thiểu); 12–13px cho chữ phụ là quy ước của các website sách Việt Nam đã khảo sát; nâng token lên 14px sẽ phá hệ layout đóng băng ở mục 3 file quyết định. 347/1.009 nút văn bản dưới 14px vì thế **không còn là vi phạm**. Điều kiện của điều khoản mới đã kiểm bằng chính số đo này: 0/347 nút dưới 4,5:1, thấp nhất 4,77:1 (`ink-400` trên `paper`, xem A11Y-04). Phần điều khoản mới không bao phủ: 20 nút dưới 12px (A11Y-14). Trang nặng nhất khi đo: `/sach` 123/219, trang chủ 108/220 |
| A11Y-12 | ngoài NFR (WCAG 1.4.11) | Thấp | `/sach` · ô sắp xếp, ô giá "Từ"/"Đến"; ô tìm ở header | viền so với nền xung quanh **1,04:1** và 1,36:1 (cần 3:1) | Ô ở `/thanh-toan` đạt 3,2:1. Chỉ đo viền, chưa đo nền ô: có thể ranh giới thấy được nhờ nền ô khác nền cha |
| A11Y-13 | ngoài NFR (WCAG 2.4.2) | Thấp | `/admin/*` · `<title>` | 3/3 trang admin cùng "NA Books" | Cố ý (spec 5A FR-5A.1: vỏ tĩnh không được lộ giao diện quản trị); ghi để biết |
| A11Y-14 | 6.6 (bản 1.9) | Thấp — **miễn trừ có điều kiện, điều kiện chưa đạt (chưa đóng)** | Dòng tác giả in trên bìa typographic hẹp (`BookCover`, `clamp(0,625rem, 6cqw, 0,8125rem)`): trang chủ 14 nút, `/gio-hang` 2, `/thanh-toan` 2, chi tiết đơn admin 2 | **20 nút** dưới 12px: 16 ở 10px, 4 ở 11,3px | Dưới sàn 12px của NFR-6.6 bản 1.9. Là chữ in trên bìa (`aria-hidden`; tên và tác giả vẫn có trong tên truy cập của bìa). **Quyết định của chủ dự án (03/10/2026): miễn trừ khỏi NFR-6.6**, vì chữ in trên bìa là chất liệu của ảnh bìa do `BookCover` sinh ra, không phải chữ giao diện; nâng sàn của `clamp` lên 12px là sửa ảnh để phục vụ một quy tắc viết cho chữ giao diện, và làm méo tỉ lệ bìa ở cỡ nhỏ. **Miễn trừ có điều kiện:** ở mọi nơi dùng `BookCover`, tên sách và tên tác giả có mặt dưới dạng chữ thật bên cạnh bìa. **Điều kiện đã kiểm (mục 3.1): chưa đạt.** 173/219 bìa đạt; 6 nơi thiếu, mỗi nơi là một phát hiện Trung bình riêng: A11Y-15 → A11Y-20. **Chưa đóng**: A11Y-14 đóng khi A11Y-15 → A11Y-20 được sửa và đo lại bằng đúng phép đo ở mục 1 (kỳ vọng 219/219). Không sửa `clamp` |
| A11Y-15 | 6.6 / 6.4 (điều kiện miễn trừ A11Y-14) | Trung bình | Trang chủ · Hero · `section.bg-cham-700 .flex.items-end > div.hero-intro-el` (4 bìa xếp chồng, component `Hero`) | **0/4** bìa có tên sách và tác giả thành chữ thật bên cạnh, ở cả 1280 và 390px (8/8 lượt thiếu) | Bìa chỉ có tên sách trong `aria-label`; tên tác giả không có ở dạng chữ nào cạnh bìa (chỉ là chữ in `aria-hidden`). Cùng tên và tác giả có ở chỗ khác trên trang (không bên cạnh Hero), nên người dùng trình đọc màn hình không biết 4 bìa này là sách nào cạnh chỗ chúng xuất hiện |
| A11Y-16 | 6.6 / 6.4 (điều kiện miễn trừ A11Y-14) | Trung bình | Trang chủ · thẻ tủ sách · `a.hover-lift[href^="/tu-sach/"]` (bìa xếp chồng trong thẻ; 10 bìa) | **0/10** ở cả 1280 và 390px (20/20 lượt thiếu) | Thẻ có tên tủ sách và mô tả tủ, không có tên sách hay tác giả của các bìa xếp chồng. Tên và tác giả cùng trang có ở chỗ khác nhưng không bên cạnh thẻ |
| A11Y-17 | 6.6 / 6.4 (điều kiện miễn trừ A11Y-14) | Trung bình | `/sach/[slug]` (2/2 trang đo) · khối "Có trong tủ" · `div.flex.gap-4 > BookCover.w-16` (bìa nhỏ của chính cuốn đang xem) | **0/2** ở mỗi khung (4/4 lượt thiếu) | Bìa nhỏ là bản lặp của cuốn đang xem; tên và tác giả của cuốn đó có ở `h1` và dòng "Tác giả:" đầu trang, cách xa khối này. Theo đúng điều kiện của chủ dự án (chữ thật *bên cạnh* bìa) vẫn tính là thiếu. Đây là chỗ nhẹ nhất trong sáu chỗ, vì thông tin có trên cùng trang |
| A11Y-18 | 6.6 / 6.4 (điều kiện miễn trừ A11Y-14) | Trung bình | `/thanh-toan` · tóm tắt đơn · `ul.space-y-4 > li.grid` (`OrderLines`; ở 390px nằm trong `<details>` gập) | **0/2** ở cả 1280 và 390px (4/4 lượt thiếu); tên sách có (2/2), **tên tác giả thiếu (0/2)** | Dòng chỉ có tên sách và số lượng; không có dòng tác giả. Tên tác giả không xuất hiện ở bất kỳ chỗ nào trên trang (đối chiếu: cùng trang, tên sách "có ở chỗ khác" = có, tác giả = không) |
| A11Y-19 | 6.6 / 6.4 (điều kiện miễn trừ A11Y-14) | Trung bình | 390px · `/thanh-toan/hoan-tat/[code]`, `/tai-khoan/don-hang/[code]`, `/admin/don-hang/[code]` · `ul.mt-4.space-y-4 > li.grid` (`OrderSummary`): dòng tác giả `p.hidden.md:block` | **0/9** ở 390px (3 trang × 3 dòng); **9/9 ở 1280px** (đối chứng: cùng phần tử ở bề rộng md trở lên đạt) | Dòng tác giả mang `hidden … md:block` nên ẩn dưới `md`. Tên sách có (9/9), tác giả thiếu (0/9) |
| A11Y-20 | 6.6 / 6.4 (điều kiện miễn trừ A11Y-14) | Trung bình | `/dang-nhap` · `aside` editorial (bìa của một cuốn; chỉ có ở md trở lên) · không nằm trong danh sách trang của đợt rà soát, được phép đo này thêm vào vì `BookCover` có mặt ở đó | **0/1** ở 1280px; ở 390px không có bìa nhìn thấy (khối bìa mang `hidden … md:flex`: 0/0) | Cạnh bìa không có chữ thật nào của sách; tên sách và tác giả cũng không xuất hiện ở chỗ khác trên trang (0/0 "chỗ khác"). Bìa chỉ mang tên qua `aria-label` |

### 3.1 Kiểm điều kiện miễn trừ A11Y-14 — mọi nơi dùng `BookCover`

Điều kiện của chủ dự án: ở mọi nơi dùng `BookCover`, tên sách và tên tác giả có mặt dưới dạng chữ thật bên cạnh bìa. Cách đo ở mục 1. Mã `BookCover` được gọi ở 11 chỗ trong 9 file (`components/BookCard.tsx`, `components/Hero.tsx`, `components/HomeTabs.tsx`, `components/checkout/OrderLines.tsx`, `components/order/OrderSummary.tsx`, `app/page.tsx` ×2, `app/sach/[slug]/page.tsx` ×2, `app/gio-hang/page.tsx`, `app/dang-nhap/page.tsx`); đo theo **nơi** (cùng một thành phần ở nhiều trang là một nơi).

| Nơi | Trang | 1280px | 390px | Kết quả |
|---|---|---|---|---|
| Editorial trang chủ | `/` | 1/1 | 1/1 | Đạt |
| Thẻ nổi bật (tab Sách mới) | `/` | 1/1 | 1/1 | Đạt |
| Thẻ nổi bật (tab Bán chạy) | `/` | 1/1 | 1/1 | Đạt |
| `BookCard` (tab Sách mới) | `/` | 14/14 | 16/16 | Đạt |
| `BookCard` (tab Bán chạy) | `/` | 14/14 | 16/16 | Đạt |
| `BookCard` (lưới) | `/sach`, `/sach/[slug]` ×2 (sách liên quan), `/tu-sach/[slug]` ×3 | 45/45 | 45/45 | Đạt |
| Bìa lớn chi tiết sách | `/sach/[slug]` ×2 | 2/2 | 2/2 | Đạt |
| Dòng giỏ hàng | `/gio-hang` | 2/2 | 2/2 | Đạt |
| Hero | `/` | **0/4** | **0/4** | **Thiếu — A11Y-15** |
| Thẻ tủ sách (bìa xếp chồng) | `/` | **0/10** | **0/10** | **Thiếu — A11Y-16** |
| Bìa nhỏ khối "Có trong tủ" | `/sach/[slug]` ×2 | **0/2** | **0/2** | **Thiếu — A11Y-17** |
| `OrderLines` | `/thanh-toan` | **0/2** | **0/2** | **Thiếu — A11Y-18** (tác giả) |
| `OrderSummary` | `/thanh-toan/hoan-tat/[code]`, `/tai-khoan/don-hang/[code]`, `/admin/don-hang/[code]` | 9/9 | **0/9** | **Thiếu ở 390px — A11Y-19** (tác giả) |
| Bìa editorial ở đăng nhập | `/dang-nhap` | **0/1** | 0/0 | **Thiếu — A11Y-20** |

**Tổng:** 8/14 nơi đạt ở cả hai khung (hai tab trang chủ tính riêng cho thẻ nổi bật và `BookCard`); nếu mỗi thành phần tính một nơi thì 6/12. Theo bìa: **173/219** đạt (46 thiếu: Hero 8, thẻ tủ sách 20, bìa nhỏ "Có trong tủ" 4, `OrderLines` 4, `OrderSummary` ở 390px 9, đăng nhập 1). Theo trang: **5/13** trang có dùng `BookCover` đạt ở cả hai khung (`/sach`, `/tu-sach/[slug]` ×3, `/gio-hang`); 8 trang thiếu (`/`, `/sach/[slug]` ×2, `/thanh-toan`, `/thanh-toan/hoan-tat/[code]`, `/tai-khoan/don-hang/[code]`, `/admin/don-hang/[code]`, `/dang-nhap`). Ba trang trong danh sách của chủ dự án không dùng `BookCover` nên không có bìa để kiểm: `/tu-sach`, `/tai-khoan/don-hang`, `/admin/don-hang` (danh sách) — đã xác nhận cả bằng mã (không có `BookCover`, `BookCard`, `OrderSummary` hay `OrderLines` trong các route đó) lẫn bằng đo (0 bìa ở cả hai khung).

**Phép đo này không đo:** mắt đọc có thấy tên sách và tác giả hay không (chữ in trên bìa của bìa typographic vẫn hiện, nên người nhìn thấy được chữ trên bìa; điều kiện của chủ dự án đòi chữ *thật*, cho người dùng trình đọc màn hình và để chữ phóng được); bìa ảnh thật (`alt={title}`; dữ liệu cục bộ không có ảnh thật nên 219 bìa đều là bìa typographic).

## 4. Đã đạt (đối chứng: phép đo không rỗng)

- **Chỉ báo focus:** 311 phần tử qua `Tab`; 308 vòng `box-shadow` (trắng 2px rồi chàm 4px), 2 outline mặc định của ô chọn, 0 thiếu. Ảnh chụp một thẻ sách và một thẻ tủ sách `hover-lift` (lớp có transition) cho thấy vòng nhìn thấy; thẻ danh mục và nút "Xem tủ sách" được đối chiếu bằng `box-shadow` tính toán (cùng hai lớp trắng 2px và chàm 4px).
- **Bàn phím:** menu "Danh mục" mở bằng `Enter`, đóng bằng `Escape`, focus trả về nút (3/3); hộp thoại tài khoản ở 390px giữ focus (0/14 lần thoát). Mọi ô nhập có nhãn (26/26, 0 chỉ có placeholder).
- **Khung trang:** `lang="vi"`, đúng một `h1`, `main`/`header`/`footer` mỗi cái một, 12/12.
- **Tương phản:** 59 cặp token; cặp thấp nhất của chữ hoạt động là `sale`→`paper` 4,66:1 (chữ 17px) và `ink-400`→`paper` 4,77:1. Chữ trắng/trắng-80 trên các màu bìa có mặt ở dữ liệu đo đạt ≥ 5,0:1 (thấp nhất `cover-4` 5,02:1); chưa đo đủ 12 màu bìa vì dữ liệu cục bộ không dùng hết.
- **Vùng chạm:** 293/302 phần tử ≥ 44×44px ở 390px; ô chọn và radio trong nhãn đạt (đo theo nhãn).
- **Icon và ảnh:** 108/108 `<svg>` có `aria-hidden`; bìa typographic `role="img"` có `aria-label` = tên sách (134/134 lượt); mã dùng `alt={title}` cho ảnh bìa thật (dữ liệu cục bộ không có ảnh thật nên chưa đo bằng trình duyệt).
- **Chữ thật cạnh bìa:** 173/219 bìa có tên sách và tác giả dưới dạng chữ thật bên cạnh (6 nơi đạt ở cả hai khung: editorial và thẻ nổi bật trang chủ, `BookCard`, bìa lớn chi tiết sách, dòng giỏ hàng; đối chứng: 46 bìa ở 6 nơi còn lại bị phép đo bắt là thiếu, nên phép đo không rỗng; xem mục 3.1).
- **Giảm chuyển động:** có `@media (prefers-reduced-motion: reduce)` (`globals.css`); vùng thông báo `Toast` có `aria-live`/`role` (đọc mã, chưa đo bằng trình đọc màn hình).

## 5. Giới hạn và phép đo hỏng của chính bộ kiểm

**Phép đo hỏng đã bắt được và sửa trước khi viết phát hiện (đo lại sau khi sửa):**
- Vòng focus báo "yếu 1,11:1" ở thẻ `hover-lift` (thẻ nổi bật, thẻ tủ sách) và "không có vòng": **dương tính giả**, do đọc `box-shadow` ngay sau khi focus, đúng lúc lớp `hover-lift` đang chuyển dần (transition). Tắt transition khi đo, và ảnh chụp xác nhận vòng nhìn thấy; sau đó 0/311 thiếu chỉ báo và 0 dưới 3:1. Tỉ lệ viền lúc đầu cũng đo so với nền của chính phần tử thay vì nền xung quanh.
- Ba "vùng chạm 20×20" ở `/thanh-toan`: ô chọn nằm trong `<label>`; vùng bấm thật là cả nhãn. Đo lại theo nhãn: 0 dưới 44px.
- "Không tới được bằng Tab" ở `/thanh-toan` (1 radio) là hành vi chuẩn của nhóm radio (vào bằng một `Tab`, đổi ô bằng phím mũi tên); ở trạng thái xác nhận của admin (12 phần tử) là do điểm bắt đầu duyệt phím đã dời vào vùng xác nhận sau khi nhấp; trạng thái nghỉ của cùng trang đã được duyệt đầy đủ.
- Hộp thoại "Tài khoản" ở desktop: truy vấn `[role=dialog]` khớp hộp thoại mobile đang ẩn bằng CSS (mã `AccountMenu.tsx` có cả bảng desktop không role lẫn hộp thoại mobile `role=dialog aria-modal`); đã đọc lại theo mã và đo từng khung riêng.

**Phép đo hỏng của chính bộ kiểm điều kiện miễn trừ (bắt được ở lần chạy đầu, sửa và chạy lại toàn bộ):**
- Nhãn "nơi" gán sai cho bìa ở `/dang-nhap` và `/gio-hang` (rơi vào nhóm không đúng thành phần): sửa nhãn theo đường dẫn trang rồi đo lại toàn bộ; số bìa không đổi, chỉ đổi cách gom nơi.
- `/thanh-toan` ở 390px: tóm tắt đơn nằm trong `<details>` gập nên không có bìa nào nhìn thấy; đo lại với `<details>` mở. Nếu để gập, `OrderLines` chỉ bị đo ở 1280px.
- "Bên cạnh" là thao tác hoá của phép đo này (tổ tiên gần nhất có ≥ 20 ký tự chữ thật, ngoài bìa và ngoài cây `aria-hidden`), không phải định nghĩa của chủ dự án; một thao tác hoá khác (ví dụ bán kính theo pixel) có thể cho số khác ở các nơi biên như bìa nhỏ "Có trong tủ" (A11Y-17). Ngưỡng 20 ký tự chưa được thử đổi.

**Chưa đo / không đo được:**
- Trạng thái hover và active (A11Y-10 có thể khác khi hover); trạng thái mở của mega-menu và hộp thoại ngoài việc mở/đóng và Tab; `/dang-nhap`, `/dang-ky`, `/tai-khoan/...` ngoài danh sách; hosted.
- Lớp vân giấy và gáy sách phủ lên bìa (phần tử anh em, không phải tổ tiên của chữ) không được tính vào nền hiệu dụng của chữ trên bìa; tương phản của chữ trên bìa đo theo màu nền bìa.
- Tương phản của thành phần giao diện không phải chữ (WCAG 1.4.11) chỉ đo ở viền ô nhập và vòng focus; chưa đo biểu tượng, đường kẻ, trạng thái chọn.
- Trình đọc màn hình thật (chỉ đọc cây accessibility của trình duyệt), thu phóng 200–400% và reflow, giãn chữ, thứ tự khoảng cách giữa các vùng chạm, chế độ tối (site không có).
- Kiểm điều kiện miễn trừ A11Y-14: dữ liệu cục bộ (3 tủ sách, 1 khách có giỏ 2 dòng, 1 admin, 1 đơn 3 dòng); trang chủ ở trạng thái mặc định và tab Bán chạy; không đo hosted và không đo bìa ảnh thật; `/dang-ky` và các trang `/tai-khoan/...` khác chưa được dò bằng đo (chỉ bằng `grep`: không dùng `BookCover`).
- Đo ở một máy, Edge headless; `min-height`/`vùng chạm` đo bằng hộp bao, không đo vùng bấm thực của liên kết nhiều dòng.

## 6. Quyết định đã có và việc còn lại

**Đã quyết (03/10/2026):**
1. **NFR-6.6: sửa chuẩn** (SRS bản 1.9), không nâng token. A11Y-11 đã đóng.
2. **Thành phần vô hiệu hoá: chấp nhận** miễn trừ có trong chính WCAG 1.4.3. A11Y-02 đã đóng. (Miễn trừ này không mở rộng sang liên kết nằm giữa câu ở vùng chạm: A11Y-05 giữ nguyên.)
3. **Giữ nguyên là việc cần sửa:** A11Y-01 (placeholder 3,3:1, một class), A11Y-05 (9/302 vùng chạm dưới 44px ở 390px), A11Y-10 (liên kết trong dòng: thêm gạch chân).
4. **A11Y-14: miễn trừ khỏi NFR-6.6 có điều kiện.** Chữ in trên bìa là chất liệu của ảnh bìa do `BookCover` sinh ra, không phải chữ giao diện; nâng sàn `clamp` lên 12px là sửa ảnh để phục vụ quy tắc viết cho chữ giao diện và làm méo tỉ lệ bìa ở cỡ nhỏ. Điều kiện: tên sách và tên tác giả có mặt dưới dạng chữ thật bên cạnh bìa ở mọi nơi dùng `BookCover`. **Điều kiện đã kiểm, chưa đạt (173/219 bìa; 6 nơi thiếu)**, nên A11Y-14 chưa đóng; sáu nơi thiếu là sáu phát hiện Trung bình (A11Y-15 → A11Y-20).

**Còn lại cho đợt sửa accessibility:** thứ tự gợi ý theo tác động: A11Y-01, A11Y-10 và A11Y-05 (đã chốt là việc cần sửa); rồi A11Y-15 → A11Y-20 (chữ thật cạnh bìa, điều kiện của miễn trừ A11Y-14; gồm hai chỗ chỉ cần bỏ một class hoặc thêm một dòng: A11Y-19 bỏ `hidden md:block` hoặc thay bằng cách hiển thị khác, A11Y-18 thêm dòng tác giả vào `OrderLines`); rồi A11Y-06 và A11Y-07 (ARIA), A11Y-09 (tên truy cập thẻ sách), A11Y-08 (liên kết bỏ qua). **Cần chủ dự án quyết riêng:** A11Y-17 — bìa nhỏ lặp lại cuốn đang xem; nếu coi bìa lặp là trang trí thì chữ thật đã có ở `h1` và dòng tác giả đầu trang, và phát hiện này có thể đóng mà không đổi mã; tôi không tự coi là trang trí vì điều kiện đã chốt không có ngoại lệ này. **A11Y-14 đóng** khi A11Y-15 → A11Y-20 được sửa (hoặc có quyết định riêng cho từng nơi) và phép đo ở mục 1 cho 219/219.

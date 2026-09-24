# NA Books — Đợt E0: Kế hoạch thiết kế

> Đặt tại `docs/specs/dot-e-design-plan.md`.

**Đã duyệt, kèm 4 điều chỉnh — cập nhật vào tài liệu tại đúng mục liên quan, đánh dấu `[Điều chỉnh sau duyệt]`:**
1. Không bỏ nhãn chữ cạnh icon Yêu thích/Tài khoản/Giỏ hàng (quy ước chung của nhà sách Việt Nam). Thay bằng bỏ nhãn "Tuyển chọn" trên tiêu đề Hero — xem mục 4.
2. Chữ nghiêng chỉ dùng ở cỡ ≥18px và đoạn ≤3 dòng — xem mục 2.
3. Line-height mọi bậc chữ lớn tối thiểu 1.15, đã đo lại bằng số — xem mục 2.
4. Nét kẻ nối: dưới 768px bỏ nét kẻ, đặt ghi chú ngay dưới bìa, giữ xoay nhẹ; nét kẻ SVG có `aria-hidden="true"` — xem mục 1.

---

## 1. Chi tiết chữ ký: Ghi chú biên tập ở lề, nối bằng một nét kẻ tay

**Chọn hướng gợi ý số 2 ("Ghi chú của biên tập ở lề"), nhưng nâng lên một bậc: không chỉ đổi font cho `curator_note`, mà thêm một NÉT KẺ nối giữa ghi chú và đúng cuốn sách nó nói tới.**

### Vì sao không chọn hướng 1 (kệ sách nhìn từ gáy)

Đã dùng một phần ý tưởng này rồi — `BookCover` từ đợt B đã có dải gáy 7% tối hơn nền ở mọi bìa. Nếu chọn "gáy sách" làm chữ ký, tôi sẽ phải hoặc (a) lặp lại thứ đã có ở khắp nơi — không còn là "một chỗ duy nhất" nữa, hoặc (b) làm thêm một kiểu hiển thị "chỉ thấy gáy, không thấy mặt bìa" — nhưng đó vẫn là hình ảnh chung của MỌI nhà sách/thư viện, không riêng gì NA Books. Gáy sách nói "đây là sách". Ghi chú biên tập nói "đây là NA Books" — vì chỉ NA Books mới có `curator_note` gắn với từng cuốn.

### Cơ chế cụ thể

- Đoạn `curator_note` không nằm trong khung/thẻ như hiện tại, mà tách ra như một mảnh giấy ghi chú: lệch sang một bên (lề trái trên desktop), xoay nhẹ (-1.5°), chữ nghiêng (Newsreader italic — xem mục 2), **không dùng font viết tay/script**. Lý do bỏ font script: (a) rủi ro hiển thị dấu tiếng Việt của các font script trên Google Fonts thường kém hơn font text thường, chưa kiểm chứng được; (b) font script + xoay nghiêng + kẻ nối là 3 lớp "làm màu" cộng dồn, dễ thành lố. Chỉ giữ 2 lớp: nghiêng nhẹ + kẻ nối.
- Một nét kẻ cong mảnh (SVG, 1 màu `cham-700`, dày 1.5px, dài ~30–50px tuỳ khoảng cách thật) nối từ mép ghi chú tới mép bìa sách nó nhắc tới — giống ký hiệu biên tập viên khoanh tay nối annotation vào bản thảo, không phải đường thẳng kẻ thước. Nét kẻ thuần trang trí, không mang thông tin gì thêm ngoài thứ đã thấy bằng mắt (ghi chú nằm cạnh đúng cuốn nào) — SVG đánh dấu `aria-hidden="true"`, không đọc ra cho trình đọc màn hình. **[Điều chỉnh sau duyệt]**
- **[Điều chỉnh sau duyệt]** Dưới 768px: bỏ hẳn nét kẻ (không đủ chỗ lệch lề để có gì mà nối), ghi chú đặt ngay dưới bìa thay vì lệch lề — nhưng **vẫn giữ độ xoay nhẹ** (-1.5°) và chữ nghiêng nếu đủ điều kiện cỡ chữ (xem mục 2). Xoay nhẹ không tốn chỗ ngang nên giữ được trên mọi kích thước màn hình, chỉ riêng nét kẻ mới cần chỗ lệch lề nên phải bỏ.

### Đúng 3 chỗ áp dụng

1. Trang chi tiết sách (`/sach/[slug]`) — khối "Có trong tủ sách" (đã có `curator_note`, chỉ đổi cách trình bày).
2. Trang chủ — khối editorial (đã có, đang hiển thị 1 `curator_note` cỡ lớn).
3. Trang tủ sách (`/tu-sach/[slug]`) — dòng `curator_note` dưới mỗi `BookCard` trong danh sách.

Không thêm chỗ nào khác. Nếu sau này muốn dùng lại motif này ở đâu ngoài 3 chỗ trên, phải quay lại xin duyệt — không tự mở rộng.

---

## 2. Typography

### Font đề xuất

**Serif (thay Lora): Newsreader.** **Sans (giữ nguyên): Be Vietnam Pro.** Tổng 2 họ chữ, đúng giới hạn.

### Kết quả kiểm tra tiếng Việt (đã đo, không phải suy đoán)

Đã dựng trang test thật, nạp font qua Google Fonts CDN, hiển thị chuỗi `Điệp Ừ Ỡ Ặ Ỹ Đ ữ ộ ằ ẫ` ở cỡ 60px cho cả 6 ứng viên spec liệt kê, tại các trọng lượng dự kiến dùng, cộng đối chiếu bằng `document.fonts.check()` và so khớp độ rộng canvas với một tên font không tồn tại (để phát hiện fallback âm thầm). Xoá trang test ngay sau khi đo, không để lại trong repo.

| Font | 400 | 600 | 700 | Kết luận |
|---|---|---|---|---|
| Newsreader | Đạt | Đạt | Đạt (đã thử cả italic) | **Đạt — chọn dùng** |
| Literata | Đạt | Đạt | Đạt | Đạt — ứng viên dự phòng |
| Source Serif 4 | Đạt | Đạt | — | Đạt |
| Bricolage Grotesque | Đạt | — | Đạt | Đạt |
| Public Sans | Đạt | — | Đạt | Đạt |
| Noto Serif Display | Đạt | — | Đạt | Đạt |

Tất cả 6 ứng viên đều lên đúng dấu, không vỡ chồng dấu, không ô trống (tofu) ở mọi độ đậm đã thử. Nghĩa là lựa chọn dưới đây là **do gu và độ hợp với NA Books quyết định, không phải vì các font khác bị loại vì lỗi kỹ thuật** — cần nói rõ để không nguỵ biện "chọn Newsreader vì nó là font duy nhất chạy được", điều đó không đúng.

### Vì sao Newsreader, và một quy tắc dùng chữ nghiêng có chủ đích

Newsreader có trục cỡ quang học (optical size, `opsz`) — con chữ tự vẽ lại hình dạng khác nhau ở cỡ nhỏ (đọc liền mạch) so với cỡ lớn (tiêu đề), không phải phóng to/thu nhỏ cùng một hình. Lora không có trục này. Tận dụng đúng đặc điểm kỹ thuật này (không chỉ vì "nhìn ấm hơn Lora") là lý do kỹ thuật cụ thể, không phải chọn ngẫu nhiên từ danh sách gợi ý.

**Quy tắc chữ nghiêng xuyên suốt (không chỉ ở chi tiết chữ ký):** chữ nghiêng (Newsreader italic) dành riêng cho nội dung **do người biên tập nói** (`curator_note`). Chữ đứng dành cho nội dung **do hệ thống mô tả** (tên sách, tên danh mục, thông số). Đây là quy tắc ngữ nghĩa, không phải trang trí — nghiêng/đứng tự nó trả lời câu hỏi "ai đang nói câu này", áp dụng nhất quán toàn site chứ không chỉ ở 3 chỗ chữ ký.

**[Điều chỉnh sau duyệt] Điều kiện dùng chữ nghiêng:** chỉ áp dụng khi cỡ chữ ≥18px **và** đoạn hiển thị tối đa 3 dòng (`line-clamp-3` phòng hờ khi có `curator_note` dài bất thường). Hai điều kiện cùng lúc, thiếu một là giữ chữ đứng. Hệ quả cụ thể:
- 2 trong 3 chỗ chữ ký (trang chi tiết: `text-lg`=18px; trang chủ editorial: `text-h2`=28px) đủ điều kiện → nghiêng.
- Chỗ thứ 3 (`/tu-sach/[slug]`, dòng `curator_note` dưới mỗi `BookCard`, hiện `text-sm`=14px) **không đủ điều kiện** → giữ chữ đứng. Vẫn giữ các dấu hiệu chữ ký khác (lệch vị trí, xoay nhẹ, nét kẻ) — chỉ riêng lớp "nghiêng" không áp dụng ở đây, không tự ý tăng cỡ chữ lên 18px chỉ để hợp thức hoá nghiêng, vì 14px là cỡ đúng vai trò phụ chú trong danh sách.
- **`description` dài của tủ sách** (Hero lấy từ `collections.description`, và trang `/tu-sach/[slug]` hiển thị lại) — luôn giữ chữ đứng, kể cả nếu sau này đổi cỡ chữ ≥18px, vì đây là đoạn mô tả dài không giới hạn số dòng chắc chắn (Hero có `line-clamp-2` nhưng trang tủ sách thì không), khác bản chất với `curator_note` vốn đã ngắn theo thiết kế dữ liệu (1–2 câu).

### Thang chữ đầy đủ

| Bậc | Font | Cỡ | Trọng lượng | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Display (Hero) | Newsreader | `clamp(2.25rem, 5vw, 3.75rem)` (36px→60px, không đổi từ đợt A) | 600 | **1.15** [Điều chỉnh sau duyệt, xem đo bên dưới] | -0.02em |
| H1 trang | Newsreader | `clamp(1.875rem, 3.4vw, 2.625rem)` | 600 | 1.15 | 0 |
| H2 section | Newsreader | 1.75rem | 600 | 1.25 | 0 |
| Tên sách (chi tiết) | Newsreader | `clamp(1.625rem, 2.6vw, 2.25rem)` | 600 | 1.15 | 0 |
| Trích dẫn biên tập (chữ ký, mục 1) | Newsreader **italic** | 1.125rem – 1.75rem tuỳ chỗ đặt | 400 | 1.5 | 0 |
| Body | Be Vietnam Pro | 1rem | 400 | 1.65 | 0 |
| Body phụ / metadata | Be Vietnam Pro | 0.875rem | 400 | 1.5 | 0 |
| Micro (nhãn, chip) | Be Vietnam Pro | 0.75rem | 500 | 1.4 | 0.04em |
| Nút | Be Vietnam Pro | 0.9375rem | 500 | 1.2 | 0 |

**[Điều chỉnh sau duyệt] Đo line-height, cỡ 64px (cao hơn cả mức tối đa thật của Display là 60px, để có biên an toàn dư ra):** dựng trang test, render chuỗi `Điệp Ừ Ỡ Ặ Ỹ Đ ữ ộ ằ ẫ` 2 dòng liên tiếp bằng Newsreader 600/64px, đo khoảng cách giữa mép dưới cùng của dòng 1 (điểm thấp nhất của các dấu nặng ệ/ặ/ộ/ằ/ẫ) và mép trên cùng của dòng 2 (điểm cao nhất của Ừ/Ỡ/Ỹ/ữ) bằng `Range.getBoundingClientRect()` — đo trên vùng chữ thật, không suy ra từ chỉ số line-height. Xoá trang test ngay sau khi đo. Vì test dùng 64px > 60px thật, số đo dưới đây đã là kịch bản khắt khe hơn thực tế.

| line-height | Khoảng cách dòng 1↔dòng 2 đo được |
|---|---|
| 1.05 (giá trị cũ) | 3.19px |
| **1.15 (giá trị mới)** | **9.59px** |
| 1.2 (đối chứng thêm) | 12.80px |

Cả 3 mức đều dương (không chồng chữ), nhưng 1.05 chỉ chừa 3.19px — quá sát để an toàn nếu font hoặc trình duyệt render lệch đi chút ít. 1.15 cho khoảng hở gấp 3 lần, xác nhận an toàn. Áp dụng 1.15 cho toàn bộ các bậc lớn (Display/H1/H2/Tên sách) — 3 bậc còn lại vốn đã ≥1.15 sẵn, chỉ riêng Display phải sửa từ 1.05.

Các token khác của `BookCard` (giá/tên/tác giả, đợt B) giữ nguyên vì đã tách bậc hợp lý, không đổi.

---

## 3. Nhịp trang

Nguyên tắc: không section nào cách section kế cận đúng một khoảng như section trước nó; không hai section liền kề dùng cùng dạng lưới.

### Trang chủ

```
┌──────────────────────────────────────────────────────┐
│ HERO — tràn hết viewport, nền cham-700                │  ← full-bleed, cao
│  (chữ trái, bìa xếp chồng phải, lệch trục)             │
└──────────────────────────────────────────────────────┘
        ↕ 56px (khoảng hẹp — dải tiếp theo chỉ là lối tắt)
   ┌────────────────────────────────────────────┐
   │ Khám phá theo danh mục — thụt vào, 5 ô đều  │  ← inset, thấp, lưới đều
   └────────────────────────────────────────────┘
        ↕ 88px
   ┌────────────────────────────────────────────┐
   │ ┌──────────────┐┌────┐┌────┐┌────┐          │
   │ │  Sách mới #1  ││ #2 ││ #3 ││ #4 │          │  ← inset, LƯỚI LỆCH:
   │ │  (2 cột, có   │└────┘└────┘└────┘          │    ô đầu to gấp đôi
   │ │   mô tả ngắn) │┌────┐┌────┐┌────┐          │    (xem E1)
   │ └──────────────┘│ #5 ││ #6 ││ #7 │           │
   │                  └────┘└────┘└────┘          │
   └────────────────────────────────────────────┘
        ↕ 128px (khoảng rộng nhất trang — tách hẳn khối bán hàng
                  khỏi khối "dừng lại đọc")
┌──────────────────────────────────────────────────────┐
│ EDITORIAL — tràn hết viewport lần 2, nền ink-900        │  ← full-bleed, cao,
│  (bìa + trích dẫn lớn + ghi chú lề, xem mục 1)          │    lặp lại nhịp Hero
│  [Cập nhật E1.5: nền đổi surface-2 → ink-900, thêm      │
│  tiêu đề dẫn — xem mục 6]                               │
└──────────────────────────────────────────────────────┘
        ↕ 88px
   ┌────────────────────────────────────────────┐
   │ ┌────────────────────────────────────────┐ │
   │ │ Tủ nổi bật — thẻ ngang RỘNG HẾT CỘT,     │ │  ← inset, KHÔNG phải
   │ │ 4 bìa xếp chồng, mô tả dài hơn           │ │    lưới — 1 thẻ lớn +
   │ └────────────────────────────────────────┘ │    danh sách thẻ nhỏ
   │ ┌───────────────┐ ┌───────────────┐         │    bên dưới
   │ │ Tủ #2 (nhỏ)   │ │ Tủ #3 (nhỏ)   │         │
   │ └───────────────┘ └───────────────┘         │
   └────────────────────────────────────────────┘
        ↕ 104px (56 chủ động chọn + 48 padding chuẩn sẵn có của
                 Footer — [Điều chỉnh sau duyệt: đo lại lúc làm
                 E1, số ban đầu ước tính thiếu phần padding riêng
                 của Footer])
┌──────────────────────────────────────────────────────┐
│ FOOTER — tràn hết viewport, nền ink-900                 │  ← full-bleed
└──────────────────────────────────────────────────────┘
```

Hai lần full-bleed (Hero, Editorial) tạo nhịp "đóng khung — mở ra — đóng khung" thay vì chỉ Hero tràn viền rồi mọi thứ khác thụt vào đều đặn tới cuối trang (kiểu rất phổ biến, xem mục 5).

### Trang catalog (`/sach`)

```
┌──────────────────────────────────────────────────────┐
│ Breadcrumb (nhỏ, sát header)                            │
│ Tiêu đề + số kết quả + chip lọc + sắp xếp (1 hàng)       │
└──────────────────────────────────────────────────────┘
        ↕ 64px (rộng hơn hẳn khoảng cách phía trên nó —
                đây là ranh giới "chuyển từ điều hướng
                sang duyệt hàng hoá", cần rõ ràng hơn
                mức 24–32px hiện tại)
┌───────────┬────────────────────────────────────────────┐
│  CỘT LỌC   │  Lưới sách 2/3/4/5 cột (không đổi cấu trúc  │
│  (nền      │  lưới — trang tác vụ, ưu tiên quét nhanh    │
│  paper,    │  hơn "nhịp")                                │
│  tách khỏi │                                              │
│  nền trắng │                                              │
│  của lưới  │                                              │
│  bằng 1    │                                              │
│  đường kẻ  │                                              │
│  dọc mảnh) │                                              │
└───────────┴────────────────────────────────────────────┘
```

Trang catalog **cố tình ít "nhịp" hơn trang chủ** — đây là trang tác vụ (tìm và so sánh sách), không phải trang trưng bày. Thêm nhịp ở đây (lưới lệch, full-bleed xen kẽ) sẽ làm chậm việc quét mắt qua nhiều sách, phản tác dụng. Nhịp duy nhất thêm vào: khoảng cách 64px giữa khối điều hướng và khối nội dung (rộng hơn mức đồng đều hiện tại), và một đường kẻ dọc mảnh tách cột lọc khỏi lưới (thay vì chỉ dựa vào khoảng trắng `gap-10` như hiện tại).

---

## 4. Ba thứ sẽ bị xoá bỏ

1. **Dòng "Danh mục: [tên]" trong khối thông tin ở trang chi tiết sách.** Trùng lặp với breadcrumb ngay phía trên `<h1>` — breadcrumb đã hiện đúng tên danh mục kèm link, giữ cả hai là nói lại cùng một thứ hai lần trên cùng một màn hình.
2. **Link "Xóa bộ lọc" ở cột lọc `/sach`, khi chưa có bộ lọc nào đang áp dụng.** Hiện tại link này luôn hiện, kể cả khi không có gì để xoá — một hành động vô nghĩa luôn nằm sờ sờ trên màn hình. Chỉ hiện khi `countActiveFilters(current) > 0`.
3. ~~Chữ nhãn cạnh icon Yêu thích/Tài khoản/Giỏ hàng trên desktop~~ **[Điều chỉnh sau duyệt — KHÔNG bỏ nữa]**: đây là quy ước chung của các nhà sách Việt Nam (Fahasa, Nhã Nam, Phương Nam đều hiện chữ cạnh icon), bỏ đi làm giảm rõ ràng chứ không phải "gọn hơn" — rút kinh nghiệm, giữ nguyên.

   **Thay bằng: nhãn "Tuyển chọn" đặt phía trên tiêu đề Hero.** Đây đúng kiểu "nhãn nhỏ đặt trên khối" mà chính đề bài Đợt E liệt kê là dấu hiệu mặc định (mục "Vì sao có đợt này", điểm 1 — dù điểm 1 nói về nhãn viết hoa như "DANH MỤC", nhãn "Tuyển chọn" tuy không viết hoa nhưng cùng một khuôn mẫu: nhãn nhỏ nền màu đặt phía trên tiêu đề lớn, mẫu này lặp lại ở gần như mọi landing page). Bỏ hẳn, để `collection.title` (đã đủ lớn, đã đủ rõ nhờ Display) tự đứng một mình — định vị "tuyển chọn" đã nằm trong nội dung `collection.description` ngay bên dưới rồi, không cần nhãn nhắc lại.

---

## 5. Tự phản biện

Câu hỏi cho từng đề xuất: *"Nếu nhận đề bài 'làm một website bán sách đẹp' không có bối cảnh gì, tôi có đưa ra đúng lựa chọn này không?"*

### Mục 1 — Ghi chú biên tập + nét kẻ nối

**Không.** Một đề bài chung chung không có lý do gì để biết `curator_note` tồn tại, càng không biết định vị "mỗi lựa chọn đều có lời giải thích" — chọn được hướng này bắt buộc phải đọc dữ liệu và định vị thật của NA Books trước. Đây là lựa chọn có bối cảnh, không phải mặc định.

Rủi ro thành thật cần nêu: "ghi chú viết tay ở lề" tự nó **không phải ý tưởng chưa ai nghĩ ra** — tạp chí và blog cá nhân dùng motif này khá nhiều. Cái không mặc định là (a) nó lấy đúng dữ liệu thật của site này, và (b) nét kẻ nối tới đúng cuốn sách là chi tiết THAO TÁC cụ thể, không phải chỉ đổi font. Nếu khi làm E1 mà bỏ nét kẻ (chỉ còn "đổi font nghiêng cho curator_note"), lựa chọn sẽ tụt xuống thành mặc định — nét kẻ là phần bắt buộc giữ, không phải tuỳ chọn.

### Mục 2 — Newsreader + quy tắc nghiêng/đứng theo người nói

**Phần chọn font: có, đây gần như là lựa chọn mặc định.** Thành thật: "đổi Lora sang một font serif ấm hơn, đọc sách tốt hơn" là gợi ý đầu tiên bất kỳ ai (hay chính tôi, nếu không có ràng buộc "phải tự phản biện") sẽ đưa ra khi được yêu cầu "đừng dùng font mặc định nữa" — Newsreader/Literata đều đang là hai cái tên hay bị gợi ý nhất cho đúng tình huống này. Tự nhận đây là lựa chọn mặc định ở tầng "chọn font nào".

Vì vậy tôi đã KHÔNG dừng ở việc chọn font: quy tắc "nghiêng = lời người biên tập nói, đứng = hệ thống mô tả" là phần tôi thêm để lựa chọn không dừng ở mức thẩm mỹ. Đây là phần cần giữ khi duyệt — nếu duyệt bỏ quy tắc này và chỉ giữ "đổi font", mục 2 coi như thất bại ở đúng bài kiểm tra của mục 5.

### Mục 3 — Nhịp trang (2 lần full-bleed, lưới lệch, catalog giữ nguyên lưới đều)

**Nguyên tắc chung ("phá lưới đều, phá khoảng cách đều") không phải ý của tôi — đề bài đã yêu cầu thẳng.** Tự phản biện ở đây phải nhắm vào phần tôi TỰ quyết định: cụ thể là chỗ nào phá, chỗ nào giữ nguyên.

Quyết định "Hero full-bleed" — **có, đây là mặc định.** Gần như mọi trang chủ hiện nay đều để Hero tràn viền; không có gì đặc trưng cho NA Books ở riêng quyết định này.

Quyết định "Editorial cũng full-bleed lần hai, tạo nhịp đóng-mở-đóng" — không hẳn mặc định, vì cách phổ biến hơn nhiều là chỉ để đúng Hero tràn viền rồi mọi thứ sau đó thụt vào tới hết trang (đây chính là điều đề bài mô tả ở mục "mọi khối đều là lưới đều"). Lặp lại full-bleed ở giữa trang là quyết định có cân nhắc thật.

Quyết định "giữ nguyên lưới đều ở trang catalog, không thêm nhịp" — đây là quyết định **đi ngược lại** hướng "phải phá lưới đều" mà đề bài nêu, dựa trên lý do UX (trang tác vụ cần quét nhanh). Tôi giữ nguyên nó dù biết có thể bị coi là "không làm đủ" — nếu người duyệt cho rằng trang catalog cũng cần nhịp, tôi sẽ làm, nhưng lựa chọn mặc định của tôi là không, và tôi nói rõ lý do thay vì lặng lẽ bỏ qua yêu cầu.

### Mục 4 — Ba thứ xoá bỏ

**Không, cho 2 mục đầu** — breadcrumb trùng thông tin và link "Xóa bộ lọc" chết khi chưa lọc đều là lỗi cụ thể của chính codebase này, một đề bài chung chung không thể biết chúng tồn tại.

**Mục thứ 3 (nhãn "Tuyển chọn") — tôi đã sai một lần rồi ở đúng bài kiểm tra này.** Đề xuất ban đầu (bỏ chữ cạnh icon Yêu thích/Tài khoản/Giỏ hàng) hoá ra chính là ví dụ phản diện: tôi tưởng đó là "dọn dẹp cho gọn", nhưng thực ra icon-only cho 3 mục này lại là mẫu **phổ biến ở các web bán lẻ chung (thời trang, điện máy)**, còn nhà sách Việt Nam cụ thể lại giữ chữ — tức là bỏ chữ mới là lựa chọn generic kiểu "web bán hàng bất kỳ", đúng thứ đợt E đang cố tránh (điểm 7 trong "Vì sao có đợt này": *"không có chi tiết nào chỉ thuộc về một nhà sách: thay chữ và màu là thành website bán quần áo"*). Nhãn "Tuyển chọn" bị thay vào đúng là ví dụ đề bài liệt kê sẵn (nhãn nhỏ trên tiêu đề) nên câu trả lời cho mục này là **không mặc định theo nghĩa "tự nghĩ ra"**, nhưng cũng không cần tự nhận công — đề bài đã chỉ thẳng, tôi chỉ áp dụng đúng chỗ.

---

**E0 đã duyệt kèm 4 điều chỉnh (đánh dấu `[Điều chỉnh sau duyệt]` ở trên). Đã triển khai E1 theo đúng kế hoạch đã điều chỉnh — xem báo cáo E1 kèm số đo.**

---

## 6. Đợt E1.5 — sửa lỗi bố cục, tăng hiện diện màu chàm

Bối cảnh: sau E1, trang vẫn bị đánh giá là nhạt nhòa — chàm chỉ xuất hiện ở Hero và Footer, còn toàn bộ phần giữa trang không có điểm neo màu, khác với Thái Hà/Fahasa/Nhã Nam (màu thương hiệu xuất hiện ở mọi màn hình khi cuộn). Đợt này KHÔNG thêm section mới — chỉ sửa 1 lỗi bố cục thật và tăng mật độ/độ hiện diện màu trong khung đã có.

### 6.1 Lỗi bìa sách nổi bật (HomeTabs)

Lỗi thật: bìa nổi bật từng có chiều rộng CỐ ĐỊNH (`w-28 sm:w-36`) trong khi ô lưới xung quanh co giãn liên tục theo viewport — ở nhiều mốc, bìa nổi bật còn NHỎ HƠN bìa thẻ thường (đo tay lúc điều tra: tỉ lệ thấp nhất ~0.77× quanh 639px).

Sửa bằng 2 thay đổi cấu trúc (không chỉ đổi số đo):
1. Bìa đổi từ px cố định sang **phần trăm chiều rộng thẻ** (`w-3/4` dọc dưới `md`, `md:w-1/2`, `lg:w-2/5`) — vì cả bìa lẫn ô lưới thường đều là hàm bậc nhất theo viewport, tỉ lệ giữa chúng gần như không đổi trong một tier thay vì trồi sụt.
2. Thẻ nổi bật đổi từ "chiếm 2 cột cố định" sang **luôn chiếm trọn 1 hàng riêng** (`col-span-2 md:col-span-3 lg:col-span-4 2xl:col-span-5`) — lý do hình học, không phải thẩm mỹ: với span cố định 2 cột, để bìa đạt ≥1.4× thì bìa phải chiếm ~70-74% chiều rộng thẻ, không còn đủ chỗ cho cột chữ đọc được. Chiếm trọn hàng cho đủ không gian để vừa đạt tỉ lệ lớn vừa giữ cột chữ thoải mái, và tiện thể xoá luôn nguy cơ ô thường bị kéo dãn chung hàng.

Bố cục dọc dưới `md` (không đủ ngang cho cả bìa to lẫn chữ), ngang từ `md` trở lên (`md:flex-row md:items-center` — `items-center` để chênh chiều cao bìa/chữ chia đều lên-xuống thay vì dồn hết xuống đáy cột chữ).

**Tỉ lệ bìa nổi bật / bìa thường đo thực tế (mục tiêu tự đặt ≥1.4×, không phải số trong đề bài gốc):**

| Viewport | Cột lưới | Bìa nổi bật | Bìa thường | Tỉ lệ |
|---|---|---|---|---|
| 375px | 2 | 226px | 159px | **1.42×** |
| 768px | 3 | 332px | 219px | **1.52×** |
| 1024px | 4 | 368px | 222px | **1.66×** |
| 1600px | 5 | 540px | 259px | **2.09×** |

Tất cả đều vượt mục tiêu, không chỉ vừa đủ.

**Ô lưới mồ côi:** vì thẻ nổi bật giờ luôn chiếm trọn hàng riêng, số ô mồ côi chỉ còn phụ thuộc `restBooks.length` có chia hết cho số cột hiện tại. Lấy 13 sách (1 nổi bật + 12 thường) — 12 chia hết cho 2/3/4 (base/md/lg) nhưng dư 2 với 5 (2xl), nên ẩn đúng 2 cuốn cuối ở `2xl` (`2xl:hidden` từ chỉ số 11 trở đi). Đo thực tế số thẻ hiển thị: base 12/12, md 12/12, lg 12/12, 2xl 10/12 — cả 4 tier đều lấp kín hàng (12÷2=6, 12÷3=4, 12÷4=3, 10÷5=2), không ô nào mồ côi.

### 6.2 Màu theo 5 danh mục cha

5 token mới trong `@theme` (`app/globals.css`), tái dùng nguyên hex từ bảng `--color-cover-*` sẵn có (không thêm màu mới), tránh riêng `cover-5` (#333366) vì gần trùng chính `cham-700` — dùng sẽ nhầm "đây là màu thương hiệu" thay vì "đây là màu danh mục":

| Danh mục | Token | Hex | Tương phản với chữ trắng (tiêu đề) | Tương phản (số đếm, trắng/70%) |
|---|---|---|---|---|
| Văn học | `--color-cat-van-hoc` | #5C2436 | 11.93:1 | 6.69:1 |
| Kinh tế | `--color-cat-kinh-te` | #4B4A2A | 9.08:1 | 5.45:1 |
| Tâm lý – Kỹ năng | `--color-cat-tam-ly-ky-nang` | #5B3358 | 10.20:1 | 5.94:1 |
| Khoa học – Xã hội | `--color-cat-khoa-hoc-xa-hoi` | #34495A | 9.35:1 | 5.58:1 |
| Manga – Light novel | `--color-cat-manga-light-novel` | #7A3B2E | 8.43:1 | 5.07:1 |

Cả 10 giá trị đo lại bằng script thật trong trình duyệt (canvas + composite alpha, không chỉ tính tay) — thấp nhất 5.07:1, vẫn vượt AA (4.5:1). Áp dụng ở thẻ "Khám phá theo danh mục" (trang chủ, nền đặc màu danh mục + chữ trắng, thay hẳn nền trắng/viền mảnh cũ) và dải màu mỏng dưới `<h1>` trang `/sach?category=...` (chỉ hiện khi đang lọc theo 1 trong 5 danh mục cha, kể cả khi URL trỏ tới danh mục con — lấy màu của danh mục cha đầu chuỗi `categoryChain`).

### 6.3 Thẻ tủ sách: nền nhuốm màu bìa + chồng bìa tràn mép

Nền mỗi thẻ tủ sách đổi từ trắng/viền mảnh sang `color-mix(in srgb, var(--color-cover-N) 12%, white)`, với N lấy theo đúng hash chọn màu bìa của **cuốn đầu tiên trong tủ** (hàm `coverColorVarForSlug` mới trong `BookCover.tsx`, dùng lại đúng hash cũ — không phải màu chọn độc lập). Kết quả 3 tủ hiện có ra 3 sắc nền khác nhau, đều rất nhạt (gần trắng, kênh RGB đo được quanh 228-235/255) nên giữ nguyên chữ `ink-900`/`ink-600`, không cần tính lại tương phản (chênh lệch với nền trắng thuần không đáng kể).

Chồng bìa kéo lệch `-mt-8 -ml-8` để tràn ra ngoài mép trên-trái của thẻ (đệm thẻ `p-5`/`p-7` nhỏ hơn 32px). Đo tràn thực tế: thẻ thường tràn 7px (trên) / 12px (trái), thẻ nổi bật tràn 4px cả hai chiều (đệm `p-7` lớn hơn nên tràn ít hơn — chấp nhận được, vẫn dương ở mọi thẻ). Tăng khoảng cách giữa các thẻ từ `space-y-4` lên `space-y-8` (đúng bằng độ tràn) để phần tràn của thẻ dưới không chạm vào thẻ trên — đo khoảng hở thực tế còn lại: 25px, không chồng lấn.

### 6.4 Khối editorial: nền đặc + tiêu đề dẫn

Đổi nền từ `surface-2` (tint nhạt) sang `ink-900` (đặc) — cùng họ với Footer. Thêm tiêu đề dẫn "Vì sao chúng mình chọn cuốn này" (chữ đứng — đây là lời NA Books nói, không phải trích dẫn của ai khác, nên không áp quy tắc nghiêng của E1) phía trên khối trích dẫn, dùng chính cơ chế `section-title` ở mục 6.5 nhưng đổi màu vạch sang `cham-50` (vạch mặc định `cham-700` gần như vô hình trên nền `ink-900` — hai màu tối tương đương độ sáng).

Toàn bộ màu chữ trong khối đổi theo đúng quy ước đã có sẵn ở `Footer.tsx` (nền `ink-900` tương tự): chữ thường trắng/70%, link `cham-50` → trắng khi hover, ring focus trắng. Đo tương phản thật (composite kênh alpha qua canvas, vì `text-white/70` của Tailwind v4 tính ra `oklab(... / 0.7)` — không thể lấy giá trị RGB trực tiếp mà phải render rồi đọc lại pixel):

| Phần tử | Màu (đã hoà nền) | Tương phản |
|---|---|---|
| Tiêu đề dẫn + trích dẫn (trắng) | rgb(255,255,255) | 16.81:1 |
| Đoạn "Về X, trong tủ Y" (trắng/70%) | rgb(187,187,193) | 8.80:1 |
| Link trong đoạn đó (cham-50) | rgb(238,240,247) | 14.76:1 |

Tất cả vượt xa AA, phần lớn đạt cả AAA (7:1).

### 6.5 Cơ chế neo màu chàm nhất quán (`section-title`) + phát hiện thêm khi kiểm tra

Chọn **vạch trái 3px** (không phải gạch chân) làm cơ chế DUY NHẤT cho mọi tiêu đề section H1/H2 — gạch chân đã là ngôn ngữ riêng của tab đang chọn trong `HomeTabs`, dùng lại cho tiêu đề sẽ gây nhầm "đây cũng là một tab". Class `.section-title` dùng chung (`app/globals.css`), màu mặc định `cham-700`, đổi sang `cham-50` khi đặt trên nền tối (editorial). Áp dụng cho: "Khám phá theo danh mục", "Tủ sách tuyển chọn", tiêu đề dẫn editorial (trang chủ), và khối tiêu đề+số kết quả ở `/sach`. Ngoài ra: gạch chân tab đang chọn dày lên `2px → 3px`; viền phải cột lọc `/sach` đổi từ `border-line` (xám) sang `border-cham-700/15`; xác nhận `Pagination` (trang đang chọn nền chàm chữ trắng) và `CatalogFilters` (danh mục đang chọn nền `cham-50` chữ `cham-700`) đã đúng từ trước, không cần sửa.

**Phát hiện quan trọng khi kiểm tra bằng số đo cuộn thực tế (không phải suy đoán):** sau khi áp hết các thay đổi trên, đo bằng script (lấy toạ độ Y tuyệt đối của mọi phần tử màu chàm, so với khung nhìn tại 5 mốc cuộn 0/800/1600/2400/3200px) thì **2 mốc 800px và 1600px KHÔNG có phần tử chàm nào trong khung nhìn** — đúng khoảng "Sách mới/Bán chạy" (thẻ nổi bật + lưới 12 bìa), vì bìa sách tuy nhiều màu nhưng không phải màu thương hiệu. Đây chính xác là lỗi chủ dự án mô tả, chỉ là tôi chưa sửa hết ở lần áp đầu tiên — vạch mảnh trên tiêu đề không đủ vì nó nằm NGOÀI khoảng bị thiếu.

Sửa bằng cách thêm 1 vạch trái 3px nữa (`border-cham-700/35`, đệm `pl-6`), nhưng lần này bọc quanh **toàn bộ khối** Sách mới/Bán chạy (tab bar + thẻ nổi bật + lưới) thay vì chỉ riêng dòng tiêu đề — vạch chạy liên tục từ đầu khối tới cuối lưới, cùng cơ chế "vạch trái = neo chàm" nhưng kéo dài theo cả khối thay vì chỉ 1 dòng. Đo lại sau khi thêm: cả 5 mốc cuộn đều có phần tử chàm trong khung nhìn, kiểm tra chéo ở 2 kích thước khung nhìn khác nhau (1600×1000 và 1440×900, vì chiều cao trang đổi theo viewport):

| Mốc cuộn | 1600×1000 | 1440×900 |
|---|---|---|
| 0px | Hero + 5 thẻ danh mục + vạch mới | Hero + 5 thẻ danh mục + vạch mới |
| 800px | vạch mới (719-2642px) | vạch mới |
| 1600px | vạch mới | vạch mới |
| 2400px | vạch mới + nền editorial | vạch mới |
| 3200px | nền Footer | vạch mới + nền Footer |

### 6.6 Kiểm tra bắt buộc

- `npm run build` + `npm run lint`: sạch, không lỗi TypeScript/ESLint.
- Tràn ngang ở 375px: đo `document.body.scrollWidth - window.innerWidth` = 0px ở `/`, `/sach`, `/sach?category=van-hoc`, `/sach/nha-gia-kim`, `/tu-sach`.
- Ràng buộc giữ nguyên: không thêm `will-change`, không thêm listener cuộn (vạch mới là CSS tĩnh, không JS), chỉ light mode, không dữ liệu giả.

**Lưu ý thành thật về cách kiểm tra:** phần lớn số đo ở trên lấy qua script (đọc toạ độ/màu tính toán thật trong DOM, kể cả composite alpha qua canvas cho `text-white/70`) thay vì chỉ nhìn ảnh chụp — vì trong phiên làm việc này, cửa sổ trình duyệt bị hệ thống coi là "ẩn" (`Browser pane is currently hidden`) phần lớn thời gian, ảnh chụp trả về khung hình cũ/trắng trống không phản ánh đúng trạng thái thật. Đã xác nhận cấu trúc không vỡ (không phần tử kích thước 0, không chồng chữ lên bìa) bằng toạ độ `getBoundingClientRect`, và có 2 ảnh chụp sớm trong phiên (lúc cửa sổ còn hiện) xác nhận đúng: thẻ danh mục 5 màu rõ ràng, thẻ nổi bật bố cục ngang đúng như thiết kế.

**Không làm E2.**

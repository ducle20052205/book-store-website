# NA Books — Bước 1.5: Nâng cấp chất lượng giao diện

> Prompt cho Claude Code. Đặt tại `docs/specs/buoc-1.5-nang-cap-giao-dien.md`.
> Nhánh mới `feat/ui-polish`, tách từ `main` sau khi bước 1 đã merge.
> Làm theo 3 đợt (A → B → C). Mỗi đợt xong thì commit, push và báo cáo, chưa làm đợt sau cho đến khi tôi xác nhận.

**Mục tiêu:** giữ nguyên định vị và nguyên tắc "quen ở cấu trúc, riêng ở chất liệu", nhưng nâng chất lượng hoàn thiện bề mặt. Giao diện hiện tại đúng nhưng phẳng, thiếu phân cấp và thiếu chi tiết, nên trông giống bản prototype hơn là một cửa hàng thật.

**Không làm** (giữ nguyên quyết định cũ):
- Không thêm đánh giá sao, popup voucher, đếm ngược, banner carousel.
- Không dùng gradient nhiều màu, glassmorphism tràn lan, parallax, hay hiệu ứng cuộn cầu kỳ.
- Không dùng ảnh bìa sách thật (bản quyền) và không hotlink ảnh từ site khác.
- Không hạ chuẩn accessibility đã đạt (NFR nhóm 6). Mọi thay đổi màu và cỡ chữ phải kiểm tra lại tương phản.
- Không thêm nút hoặc link dẫn tới tính năng chưa tồn tại.

---

## Đợt A — Nền tảng thị giác

### A.1 Bổ sung token

Thêm vào `@theme` trong `app/globals.css`, giữ nguyên các token màu đã có:

```css
--radius-card: 10px;      /* thay giá trị 4px cũ */
--radius-control: 8px;
--radius-pill: 999px;

--shadow-sm: 0 1px 2px rgba(26, 28, 46, 0.06);
--shadow-md: 0 8px 24px -10px rgba(26, 28, 46, 0.22);

--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
--dur-fast: 150ms;
--dur-base: 250ms;

--color-surface-2: #F4F2ED;   /* nền phân lớp cho section xen kẽ */
```

### A.2 Thang chữ

Áp dụng thống nhất, thay cho các cỡ chữ rời rạc hiện tại:

| Vai trò | Font | Cỡ | Ghi chú |
|---|---|---|---|
| Display (hero) | Lora 600 | `clamp(36px, 5vw, 60px)` | `line-height: 1.05`, `letter-spacing: -0.02em` |
| H1 trang | Lora 600 | `clamp(30px, 3.4vw, 42px)` | `line-height: 1.15` |
| H2 section | Lora 600 | 28px | |
| Tên sách (chi tiết) | Lora 600 | `clamp(26px, 2.6vw, 36px)` | |
| Body | Be Vietnam Pro 400 | 16px | `line-height: 1.65` |
| Body phụ / metadata | Be Vietnam Pro 400 | 14px | màu `ink-400` |
| Micro (nhãn, chip) | Be Vietnam Pro 500 | 12px | `letter-spacing: 0.04em` |

Nguyên tắc: khoảng cách giữa các bậc phải rõ. Không dùng 15px và 16px cạnh nhau.

### A.3 Độ sâu và lớp nền

- Thẻ sách, thẻ tủ sách: nền `surface`, `--shadow-sm`, viền `line` chỉ khi cần tách khỏi nền cùng màu.
- Các section trên trang chủ xen kẽ nền `paper` và `surface-2`, để trang có nhịp thay vì một mảng phẳng.
- Bìa sách có `--shadow-md` ở trang chi tiết.

### A.4 Chuyển động

- Thẻ sách khi rê chuột: `transform: translateY(-3px)` + đổi sang `--shadow-md`, thời lượng `--dur-base`, easing `--ease-out`.
- Nút và link: đổi màu nền/chữ trong `--dur-fast`.
- Ảnh bìa trong thẻ: phóng nhẹ `scale(1.03)` khi hover, đặt trong khung `overflow: hidden`.
- **Bắt buộc:** bọc toàn bộ trong `@media (prefers-reduced-motion: reduce)` để tắt mọi chuyển động khi người dùng tắt hiệu ứng.

### A.5 Header

- Dính trên cùng khi cuộn (`position: sticky`).
- Nền `rgba(255, 255, 255, 0.82)` + `backdrop-filter: blur(12px)`; có fallback nền đặc cho trình duyệt không hỗ trợ.
- Viền dưới chỉ xuất hiện khi trang đã cuộn quá 8px.
- Chiều cao co từ 72px xuống 60px khi cuộn, chuyển mượt.

### A.6 Nút và chip

- Nút chính, nút phụ: `--radius-control`, chiều cao 44–48px, chữ 15px/500.
- Chip lọc, nhãn: `--radius-pill`.
- Focus ring 2px màu `cham-600`, cách viền 2px, áp dụng cho mọi phần tử tương tác.

**Báo cáo đợt A:** danh sách file đã sửa, và kết quả kiểm tra tương phản cho các cặp màu chữ/nền mới.

---

## Đợt B — Bìa sách và thẻ sách

Đây là đợt tác động mạnh nhất tới cảm nhận "thật hay chưa thật", vì toàn bộ trang web hiện đang dùng một kiểu bìa duy nhất.

### B.1 `BookCover`: 4 biến thể bố cục

Chọn biến thể theo hash của `slug` (ổn định, không đổi giữa các lần tải):

1. **Trên trái** — tên sách ở trên, tác giả ngay dưới (bố cục hiện tại).
2. **Giữa** — tên căn giữa cả chiều ngang lẫn dọc, tác giả ở đáy, có một đường kẻ mảnh ngăn cách.
3. **Dưới** — khoảng trống ở trên, tên và tác giả dồn xuống đáy.
4. **Có khung** — khung viền mảnh cách mép 12px, chữ nằm trong khung, căn giữa.

### B.2 Chất liệu bìa

- **Gáy sách:** dải dọc rộng 7% ở mép trái, tối hơn nền khoảng 12%, tạo cảm giác khối.
- **Vân giấy:** lớp phủ rất nhẹ (`opacity` khoảng 0.05) bằng SVG `feTurbulence` nhúng dạng data-URI hoặc pattern CSS. Phải cực kỳ tinh tế, nhìn thoáng qua không nhận ra.
- **Bo góc:** `--radius-card`, riêng mép trái (phía gáy) bo nhỏ hơn (2px).
- Bảng màu mở rộng từ 8 lên 12 màu trầm. Mọi màu phải đạt tương phản ≥ 4.5:1 với chữ trắng.
- Tên sách dài vẫn phải cắt bằng "…", không bao giờ tràn hoặc đè lên tác giả.

### B.3 `BookCard`: phân cấp rõ hơn

Thứ tự trọng lượng thị giác: giá > tên sách > tác giả.

- Tên sách: 15px/500, tối đa 2 dòng.
- Tác giả: 13px, màu `ink-400`.
- Giá bán: 17px/600. Giá gốc 13px gạch ngang, màu `ink-400`.
- Badge `-X%`: chuyển lên **góc trên trái của ảnh bìa** (thay vì nằm cạnh giá), nền `nghe-400`, chữ `ink-900`.
- Nhãn "Hết hàng": giữ ở góc dưới trái bìa, nền trắng đặc.
- Khoảng cách giữa các thẻ: 32px dọc, 24px ngang trên desktop.

### B.4 Skeleton

Cập nhật skeleton trong `loading.tsx` cho khớp bố cục thẻ mới, có hiệu ứng nhấp nháy nhẹ (cũng phải tắt khi `prefers-reduced-motion`).

**Báo cáo đợt B:** ảnh chụp lưới sách ở desktop và mobile, và xác nhận 12 màu bìa đều đạt tương phản.

---

## Đợt C — Nhịp trang chủ và footer

### C.1 Footer đầy đủ

Footer một dòng hiện tại là điểm yếu dễ thấy nhất. Thay bằng 4 cột (mobile xếp dọc):

1. **NA Books** — logo, 2 câu giới thiệu về định vị tuyển chọn.
2. **Danh mục** — 5 danh mục cha, link tới `/sach?category=...`.
3. **Tủ sách** — các tủ sách hiện có, link tới `/tu-sach/...`.
4. **Về dự án** — nêu rõ đây là dự án portfolio phi thương mại, kèm link tới repo GitHub.

Dòng cuối cùng: "Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio."

**Không** tạo link tới các trang chưa tồn tại (chính sách đổi trả, tuyển dụng, liên hệ...).

### C.2 Nhịp trang chủ

Thứ tự section mới, xen kẽ nền `paper` và `surface-2`:

1. **Hero** (tủ sách nổi bật) — chữ display, bìa xếp chồng hơi lệch nhau thay vì xếp hàng đều.
2. **Khám phá theo danh mục** — 5 ô, mỗi ô là tên danh mục cha + số lượng sách, nền `surface`, hover nâng nhẹ.
3. **Tab Sách mới / Bán chạy** — giữ nguyên chức năng.
4. **Khối editorial (mới)** — nền `surface-2`. Trích **một** `curator_note` thật, trình bày cỡ lớn bằng serif, kèm bìa cuốn sách đó và link tới trang sách. Đây là chỗ thể hiện định vị "tuyển chọn có lời giải thích".
5. **Tủ sách tuyển chọn** — thẻ ngang, mỗi thẻ có tên tủ, lời giới thiệu rút gọn, và 3 bìa xếp chồng.
6. **Footer.**

### C.3 Trang chi tiết sách

- Tên sách dùng bậc "Tên sách (chi tiết)" trong thang chữ.
- Bìa có `--shadow-md`.
- Khối "Có trong tủ sách": lời giải thích của biên tập trình bày như một trích dẫn (serif, 18px), có dấu ngoặc kép trang trí.

**Báo cáo đợt C:** ảnh chụp toàn trang chủ ở desktop và mobile, và checklist từng mục.

---

## Hoàn thành khi

- [ ] Token, thang chữ, chuyển động, header mới áp dụng thống nhất toàn site; không còn cỡ chữ hay bo góc viết cứng ngoài token.
- [ ] `BookCover` có 4 biến thể, 12 màu, gáy sách và vân giấy; không có bìa nào lỗi chữ ở 375px.
- [ ] `BookCard` phân cấp đúng thứ tự giá > tên > tác giả; badge nằm trên bìa.
- [ ] Footer 4 cột, không có link chết.
- [ ] Trang chủ có 5 section theo thứ tự ở C.2, nền xen kẽ.
- [ ] `prefers-reduced-motion` tắt được toàn bộ chuyển động.
- [ ] Kiểm tra lại NFR-6.1 → 6.6, ghi kết quả vào báo cáo.
- [ ] `npm run build` và `npm run lint` sạch.

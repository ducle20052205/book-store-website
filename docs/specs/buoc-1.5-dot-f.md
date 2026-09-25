# NA Books — Đợt F: Hoàn thiện hệ thống thị giác

> Prompt cho Claude Code. Đặt tại `docs/specs/buoc-1.5-dot-f.md`.
> Vẫn ở nhánh `feat/ui-signature`, làm **trước** E2.
> Cập nhật `docs/specs/dot-e-design-plan.md` khi xong.

## Chẩn đoán (từ ảnh chụp toàn trang ở mức thu nhỏ 33%)

Khi nhìn cả trang cùng lúc thay vì từng khối, lộ ra vấn đề gốc: **nội dung không lấp đầy khung chứa nó**, và **các khối không cùng một hệ**.

| Vấn đề | Biểu hiện |
|---|---|
| Thẻ sách nổi bật sai tỉ lệ | Bìa phóng quá lớn, chữ nhỏ, mảng trống lớn ở góc dưới phải |
| Dải danh mục co cụm | 5 thẻ nhỏ dồn bên trái, phần lớn chiều ngang bỏ trống |
| Khối editorial rỗng một nửa | Bìa + câu trích nằm bên trái, gần nửa bên phải trống trơn |
| Thẻ tủ sách dàn ngang | Mỗi thẻ kéo hết chiều ngang nhưng chỉ chứa ảnh nhỏ và 2 dòng chữ |
| Hai họ màu tối khác nhau | Hero dùng `cham-700` (chàm), footer và editorial dùng `ink-900` (xanh đen ngả tím) |
| Không có lớp nền | Nền trang, nền thẻ, nền section gần như cùng một màu nên không có ranh giới |

Nguyên tắc chung cho cả đợt: **mỗi khối phải tự lấp đầy chiều ngang của nó bằng nội dung thật**, hoặc thu hẹp lại cho vừa nội dung. Không để mảng trống lớn hơn 120px ở bất kỳ đâu trừ khoảng cách giữa các section.

---

## F1 — Hệ màu và lớp nền (làm trước, vì ảnh hưởng mọi thứ sau)

**1. Thống nhất họ màu tối.**
- Thêm token `--color-cham-900`: chàm đậm cùng họ với `cham-700` (#26306B), tối hơn nhưng giữ nguyên sắc chàm, không ngả tím.
- Footer và khối editorial đổi từ `ink-900` sang `cham-900`.
- `ink-900` quay về đúng vai trò: chỉ dùng cho chữ.
- Báo cáo hex của `cham-900` và tương phản chữ trắng trên nền đó.

**2. Tạo lớp nền.**
- `--color-paper` (nền trang): đổi sang tông xám ấm **đậm hơn rõ rệt** so với hiện tại. Giữ sắc ấm, không xám lạnh.
- `--color-surface` (nền thẻ): trắng hoặc gần trắng.
- Độ chênh sáng giữa hai màu phải nhìn thấy được khi đặt cạnh nhau, không phải 1–2%.
- Rà lại toàn site: mọi thẻ, ô nhập, bảng thông tin dùng `surface`; nền trang và nền section sáng dùng `paper`.
- Section tối (`cham-900`) và section sáng xen kẽ nhau tạo nhịp; hai section sáng liền nhau phải khác nền (`paper` và `surface`).

---

## F2 — Sửa tỉ lệ từng khối

### F2.1 Thẻ sách nổi bật (khối "Sách mới" / "Bán chạy")

Hiện bìa chiếm quá nhiều chỗ, chữ bị dồn nhỏ, góc dưới phải trống.

- Bìa chiếm **32–38% chiều rộng thẻ** trên desktop, không nhiều hơn. Vẫn phải lớn hơn bìa thường ít nhất 1.4 lần; nếu hai ràng buộc xung đột thì giảm chiều cao thẻ.
- Chiều cao thẻ bằng chiều cao bìa cộng padding. **Không được có mảng trống dưới cùng.**
- Cột chữ căn giữa theo chiều dọc so với bìa, gồm: tên sách, tác giả, giá, mô tả ngắn 3 dòng, nhãn danh mục, và một liên kết "Xem chi tiết".
- Mobile: xếp dọc, bìa rộng tối đa 200px.
- Kiểm tra: diện tích trống trong thẻ nổi bật không vượt 15% diện tích thẻ. Báo cáo số đo.

### F2.2 Dải "Khám phá theo danh mục"

- 5 thẻ chia đều **hết chiều ngang khung nội dung** (`grid-template-columns: repeat(5, 1fr)`), khoảng cách 16px. Mobile 2 cột, tablet 3 cột.
- Chiều cao mỗi thẻ 104–120px, tên danh mục căn giữa theo chiều dọc.
- Giữ nền màu danh mục, chữ trắng.
- Hover: nâng nhẹ 2px bằng `transform`, không đổi kích thước.

### F2.3 Khối editorial

- Bố cục 2 cột lấp đầy chiều ngang: cột trái là bìa sách (rộng 200–240px), cột phải là nội dung, chiếm hết phần còn lại.
- Câu trích cỡ 28–32px, tối đa 3 dòng, chữ nghiêng như quy tắc đã chốt.
- Dưới câu trích: tên sách, tác giả, tên tủ sách, và liên kết sang trang sách.
- Nếu sau khi làm vẫn còn hơn 25% chiều ngang trống, tăng cỡ câu trích hoặc bó hẹp khung khối lại. Báo cáo tỉ lệ lấp đầy.

### F2.4 Thẻ tủ sách tuyển chọn

- Đổi từ ba dòng ngang dài sang **lưới 3 cột** trên desktop (mobile 1 cột, tablet 2 cột).
- Mỗi thẻ: dải 3–4 bìa xếp chồng chiếm hết chiều ngang thẻ ở phía trên, dưới là tên tủ và mô tả rút gọn 2 dòng.
- Giữ nền nhuốm 12% màu bìa cuốn đầu; tăng lên 18% nếu đo thấy chênh với nền trang dưới 4%.
- Thẻ tủ nổi bật chiếm 2 cột, bìa lớn hơn, mô tả không giới hạn dòng.

### F2.5 Hero

- Chiều cao tối thiểu 420px trên desktop, nội dung căn giữa theo chiều dọc.
- Cụm bìa xếp chồng bên phải phóng to để cân với cột chữ bên trái; hiện đang quá nhỏ so với khoảng trống dành cho nó.
- Trên màn ≥1536px, hero không được để trống quá 20% chiều ngang.

---

## F3 — Nhịp và khung

- Khung nội dung: giữ `max-width` hiện tại nhưng kiểm tra lại mọi section đều dùng đúng một lớp container; không section nào tự đặt chiều rộng riêng.
- Khoảng cách dọc giữa các section giữ 3 mức 56 / 88 / 128px như đã chốt, nhưng **padding trong của section tối** (editorial, footer) phải ≥ 72px trên desktop để mảng màu có sức nặng.
- Mỗi section sáng cách section tối bằng đúng ranh giới màu, không thêm khoảng trắng đệm.

---

## Hoàn thành khi

- [ ] Chỉ còn **một** họ màu tối trên toàn site; `ink-900` không còn dùng làm nền.
- [ ] Nền trang và nền thẻ khác nhau rõ; liệt kê hex và độ chênh sáng.
- [ ] Thẻ nổi bật: bìa chiếm 32–38% chiều rộng thẻ, diện tích trống ≤ 15%, không có mảng trống dưới cùng.
- [ ] Dải danh mục lấp đầy chiều ngang khung nội dung ở mọi breakpoint.
- [ ] Khối editorial lấp ≥ 75% chiều ngang.
- [ ] Thẻ tủ sách theo lưới 3 cột, tủ nổi bật chiếm 2 cột.
- [ ] Hero cao ≥ 420px, không trống quá 20% chiều ngang ở 1536px.
- [ ] Không có mảng trống nào lớn hơn 120px bên trong một khối (không tính khoảng cách giữa các section). Đo bằng script, liệt kê 3 mảng trống lớn nhất còn lại kèm vị trí.
- [ ] Mọi cặp màu chữ/nền đạt WCAG AA sau khi đổi nền; liệt kê các cặp bị ảnh hưởng.
- [ ] Không tràn ngang ở 375px; `npm run build` và `npm run lint` sạch.
- [ ] Giữ nguyên ràng buộc cũ: chỉ animate `transform`/`opacity`, không `will-change`, không thêm trình lắng nghe cuộn, không thêm dữ liệu không có thật.
- [ ] Commit, push, báo cáo toàn bộ số đo. Chưa làm E2.

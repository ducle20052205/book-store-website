# NA Books — Đợt E: Chất riêng, chuyển động và mật độ thông tin

> Prompt cho Claude Code. Đặt tại `docs/specs/buoc-1.5-dot-e.md`.
> Làm sau khi PR #4 (đợt A–D) đã merge. Tạo nhánh mới `feat/ui-signature` từ `main`.
> Làm theo 4 phần: **E0 → E1 → E2 → E3**. **E0 phải dừng lại chờ tôi duyệt trước khi viết bất kỳ dòng code nào.** Các phần sau, mỗi phần xong thì commit, push, báo cáo, chờ xác nhận rồi mới làm tiếp.

## Vì sao có đợt này

Giao diện hiện đã đúng nhận diện, bố cục và mật độ màu, nhưng vẫn bị đánh giá là "cơ bản, hơi lỗi thời, và trông giống sản phẩm do AI tạo hàng loạt". Nguyên nhân cụ thể, đã soi trên chính site:

1. Nhãn viết hoa toàn bộ đặt trên mỗi khối: "DANH MỤC", "KHOẢNG GIÁ", "TỦ SÁCH", "VỀ DỰ ÁN".
2. Mũi tên gắn sau chữ ở link: "Xem tất cả →", "Xem mã nguồn trên GitHub ↗".
3. Mọi thẻ dùng chung một bo góc, chung một padding, chung một kiểu đổ bóng, bất kể thứ bậc.
4. Mọi section cách nhau đúng một khoảng như nhau, mọi khối đều là lưới đều: trang không có nhịp.
5. Trang gần như tĩnh hoàn toàn, không có phản hồi khi người dùng tương tác.
6. Thẻ sách chỉ có tên, tác giả, giá, ít thông tin hơn hẳn các nhà sách khác.
7. Không có chi tiết nào chỉ thuộc về một nhà sách: thay chữ và màu là thành website bán quần áo.

Điểm 1 đến 4 là những dấu hiệu bị nhận diện rộng rãi là "giao diện mặc định do AI sinh". Chúng xuất hiện vì các spec trước viết bằng ngôn ngữ giá trị token, không phải ngôn ngữ ý đồ thiết kế.

**Nguyên tắc xuyên suốt:** dồn sự táo bạo vào **một chỗ duy nhất**, giữ mọi thứ còn lại kỷ luật và yên tĩnh. Không rải hiệu ứng hay chi tiết đều khắp trang.

## Ràng buộc bắt buộc — rút từ lỗi đã gặp ở đợt A

- **Chỉ được animate `transform` và `opacity`.** Tuyệt đối không animate `height`, `width`, `padding`, `margin`, `top`, `font-size`. Những thuộc tính này kéo theo tính lại bố cục và đã từng gây rung chữ toàn trang.
- Không thêm `will-change` ở bất kỳ đâu.
- Không thêm trình lắng nghe sự kiện cuộn mới. Hiệu ứng theo cuộn dùng `IntersectionObserver`.
- Mọi chuyển động phải tắt hoàn toàn trong `@media (prefers-reduced-motion: reduce)`.
- CLS (độ dịch chuyển bố cục) phải bằng 0: hiệu ứng xuất hiện không được làm nội dung nhảy chỗ.
- Giữ nguyên: định vị nhà sách tuyển chọn cho người đọc 18–30; giọng văn "chúng mình / bạn"; không ảnh bìa bản quyền; WCAG AA; chỉ light mode.

**Không làm:** parallax, scroll-jacking, chữ chạy, gradient nhiều màu, chuyển động lặp vô hạn, glassmorphism, đánh giá sao, nhãn "sắp hết hàng", đếm ngược, hay bất kỳ thông tin nào không có thật trong database.

---

## E0 — Kế hoạch thiết kế (dừng lại chờ duyệt)

Viết file `docs/specs/dot-e-design-plan.md`, **chưa động vào code**. Nội dung gồm 5 mục:

### 1. Chi tiết chữ ký (signature element)

Đề xuất **đúng một** yếu tố thị giác mà chỉ NA Books có, rút ra từ chính thế giới của sách: gáy sách trên kệ, dấu trang, ghi chú viết tay ở lề, phiếu mượn sách trong thư viện cũ, dấu mộc của hiệu sách, mép giấy xén thô. Giải thích vì sao nó thuộc về NA Books chứ không phải một shop bất kỳ, và nêu rõ nó xuất hiện ở **tối đa 3 chỗ** trên toàn site.

Hai hướng gợi ý để bạn phản biện hoặc thay bằng hướng tốt hơn:
- **Kệ sách nhìn từ gáy:** ở một vài chỗ, sách hiển thị dạng gáy đứng cạnh nhau như trên kệ thật, thay vì thẻ phẳng xếp lưới. Hợp với hero và thẻ tủ sách. Tận dụng được `BookCover` đã có.
- **Ghi chú của biên tập ở lề:** `curator_note` trình bày như lời ghi tay bên lề trang sách, có đường kẻ dẫn tới bìa. Đúng với định vị "mỗi lựa chọn đều có lời giải thích".

### 2. Typography

Đề xuất bộ chữ, thay Lora nếu tìm được lựa chọn đặc sắc hơn. Yêu cầu:
- Hỗ trợ đầy đủ tiếng Việt. Kiểm tra bằng chuỗi `Điệp Ừ Ỡ Ặ Ỹ Đ ữ ộ ằ ẫ` ở mọi trọng lượng sẽ dùng, báo cáo kết quả. Không đạt thì loại, không cố dùng.
- Không dùng Inter. Tối đa 2 họ chữ. Giữ Be Vietnam Pro cho thân chữ là chấp nhận được.
- Nêu thang chữ đầy đủ: cỡ, trọng lượng, letter-spacing, line-height cho từng bậc.
- Ứng viên để tự kiểm tra: Newsreader, Literata, Source Serif 4, Bricolage Grotesque, Public Sans, Noto Serif Display.

### 3. Nhịp trang

ASCII wireframe cho trang chủ và trang catalog: khối nào rộng hết màn hình, khối nào thụt vào, khối nào lệch trục, khối nào cao, khối nào thấp. Yêu cầu: các section **không được** cách nhau cùng một khoảng và **không được** cùng một dạng lưới.

### 4. Ba thứ sẽ bị xóa bỏ

Liệt kê 3 thứ đang có mà bạn đề xuất bỏ đi để trang gọn hơn. Không được chỉ thêm vào.

### 5. Tự phản biện

Với mỗi đề xuất ở trên, trả lời: "nếu nhận đề bài 'làm một website bán sách đẹp' mà không có bối cảnh gì, tôi có đưa ra đúng lựa chọn này không?" Nếu có, đó là lựa chọn mặc định, phải làm lại.

**Dừng ở đây. Báo cáo kế hoạch và chờ tôi duyệt.**

---

## E1 — Chi tiết chữ ký và phá vỡ tính đồng nhất

Chỉ làm sau khi E0 được duyệt, đúng phạm vi đã chốt, không lan rộng.

**Bỏ các dấu hiệu mặc định:**
- Xóa toàn bộ nhãn viết hoa đứng trên các khối. Thay bằng tiêu đề viết thường, hoặc bỏ hẳn nếu nội dung đã tự rõ.
- Xóa mũi tên "→" và "↗" gắn sau chữ link.
- Bo góc phân theo thứ bậc, không dùng một giá trị cho tất cả: bìa sách, thẻ, nút, chip, ô nhập mỗi loại một giá trị riêng. Ghi lý do trong comment.

**Tạo phân cấp bằng kích thước:**
- Khối "Sách mới" trên trang chủ: cuốn đầu tiên lớn hơn hẳn (chiếm 2 cột, kèm mô tả ngắn).
- Ba thẻ tủ sách không cùng kích thước: tủ nổi bật lớn hơn.

**Khoảng cách theo nhịp:** dùng 3 giá trị khác nhau giữa các section (ví dụ 56 / 88 / 128px), gán theo mức độ quan trọng, không rải đều.

## E2 — Chuyển động có mục đích

Nguyên tắc: motion **trả lời hành động của người dùng**, không trang trí. Fade-and-slide-up cho từng section khi cuộn là hiệu ứng mặc định phổ biến nhất của trang do AI sinh — **không làm**.

Được làm:
1. **Một khoảnh khắc mở trang duy nhất**, chỉ ở trang chủ: các phần tử trong hero xuất hiện theo trình tự có chủ đích, tổng khoảng 400–600ms, không lặp lại ở lần vào sau trong cùng phiên (lưu cờ trong `sessionStorage`).
2. **Phản hồi tức thì khi tương tác:** nút có trạng thái `:active`; bộ chọn số lượng nảy nhẹ khi đổi số; chip lọc khi bị bỏ thì co lại rồi biến mất thay vì mất đột ngột; thẻ sách giữ hiệu ứng nhấc nhẹ đã có.
3. **Chuyển trang:** dùng View Transitions API nếu phiên bản Next hiện tại hỗ trợ ổn định. Nếu chưa, bỏ qua và ghi rõ lý do, không tự cài thư viện ngoài.
4. **Trạng thái tải:** skeleton mô phỏng đúng hình dạng nội dung sắp hiện, không phải các khối chữ nhật chung chung.

## E3 — Mật độ thông tin thật

Bổ sung vào thẻ sách, chỉ dùng **dữ liệu có thật trong database**:
- Nhãn danh mục con (ví dụ "Trinh thám – Kinh dị"), chữ nhỏ.
- Chip "Trong tủ sách" cho sách thuộc tủ tuyển chọn, hiện tên tủ khi rê chuột.
- Trang danh mục: một dòng giới thiệu ngắn cho mỗi danh mục cha. Nếu `categories.description` chưa có dữ liệu, đề xuất migration và để tôi viết nội dung, không tự viết.

Ràng buộc: chiều cao thẻ sách trước và sau không chênh quá 24px.

---

## Hoàn thành khi

- [ ] E0 được duyệt trước khi có dòng code nào.
- [ ] Chi tiết chữ ký xuất hiện đúng ở những chỗ đã chốt, không nhiều hơn.
- [ ] Không còn nhãn viết hoa toàn bộ, không còn mũi tên gắn sau chữ link.
- [ ] Bo góc và khoảng cách phân theo thứ bậc, mỗi giá trị có lý do ghi trong comment.
- [ ] Không có hiệu ứng fade-in theo section khi cuộn.
- [ ] Bật "giảm chuyển động" trong hệ điều hành hoặc DevTools: mọi hiệu ứng tắt, nội dung vẫn hiện đầy đủ.
- [ ] Tắt JavaScript: nội dung vẫn hiện đầy đủ, không có khối nào vô hình.
- [ ] Toàn repo không có `will-change`, không animate `height`/`width`/`padding`/`margin`/`top`.
- [ ] Không thêm trình lắng nghe sự kiện cuộn mới nào ngoài `IntersectionObserver`.
- [ ] Thẻ sách hiện nhãn danh mục con và chip "Trong tủ sách" đúng dữ liệu thật. Kiểm tra bằng SQL: số sách có chip khớp số cuốn khác nhau trong `collection_books` (17 cuốn).
- [ ] Chiều cao thẻ sách trước/sau chênh không quá 24px.
- [ ] Font mới (nếu đổi) hiển thị đúng toàn bộ chuỗi dấu tiếng Việt đã nêu.
- [ ] `npm run build`, `npm run lint` sạch. NFR-6.1 → 6.6 vẫn đạt.
- [ ] Báo cáo cuối kèm số đo: CLS, chiều cao thẻ trước/sau, số sách có chip, kết luận về View Transitions, 3 thứ đã bỏ đi, và một câu trả lời cho câu hỏi: "chi tiết nào trên trang này không thể xuất hiện trên một website bán hàng khác?"

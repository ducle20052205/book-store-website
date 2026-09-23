# NA Books — Đợt A2: Sửa header, bố cục và mật độ

> Prompt cho Claude Code. Đặt tại `docs/specs/buoc-1.5-dot-a2.md`.
> Làm tiếp trên nhánh `feat/ui-polish`, sau đợt A. Xong thì commit, push, báo cáo. Chưa làm đợt B.
> Mọi quy tắc trong `docs/specs/buoc-1.5-nang-cap-giao-dien.md` vẫn áp dụng, gồm cả danh sách "Không làm".

Đợt A đã áp đúng token, thang chữ, bo góc, đổ bóng và hiệu ứng hover. Đợt A2 xử lý 3 nhóm vấn đề còn lại: lỗi header, bố cục trang chi tiết, và mật độ trang catalog.

---

## A2.1 Sửa lỗi giật khi cuộn (ưu tiên cao nhất)

**Triệu chứng đã quan sát trên bản preview:**
- Khi cuộn **lên**, **toàn bộ chữ trên trang** bị rung/giật, không chỉ riêng header.
- Rõ nhất ở `/sach/[slug]`, ít thấy ở `/sach`.
- Nền mờ của header chỉ phủ khoảng 45% chiều ngang, có ranh giới dọc thấy rõ.

Chữ rung toàn trang nghĩa là cả trang đang bị vẽ lại mỗi khung hình, không phải chỉ header bị lỗi bố cục.

**Làm theo đúng thứ tự dưới đây. Sau mỗi bước, tự kiểm tra lại bằng cách cuộn lên xuống ở `/sach/nha-gia-kim`, và ghi kết quả vào báo cáo.**

**Bước 1 — Bỏ mọi `will-change`.**
Tìm toàn repo, xóa hết `will-change` (nhất là `will-change: backdrop-filter` và `will-change: transform` trên header). Thuộc tính này ép trình duyệt tạo lớp hiển thị riêng, là nguyên nhân hàng đầu khiến chữ bị dựng lại và rung.

**Bước 2 — Bỏ hẳn hiệu ứng mờ để xác định nguyên nhân.**
Tạm thời xóa `backdrop-filter` trên header, thay bằng nền đặc `rgba(255, 255, 255, 0.96)`. Cuộn thử lại.
- **Hết giật** → nguyên nhân là `backdrop-filter`. **Giữ nguyên phương án nền đặc, không khôi phục hiệu ứng mờ.** Một header mượt quan trọng hơn hiệu ứng mờ; nhiều website hiện đại cũng chỉ dùng nền đặc hơi trong.
- **Vẫn giật** → sang bước 3.

**Bước 3 — Kiểm tra các nguyên nhân còn lại**, theo thứ tự:
- `html { scroll-behavior: smooth }` kết hợp với header dính có thể gây giật khi cuộn ngược. Thử bỏ.
- Bất kỳ `transform`, `filter`, `perspective` nào trên `body`, `main` hoặc khung bọc trang: chúng tạo ngữ cảnh chứa mới, làm hỏng `position: sticky` bên trong.
- Header đổi chiều cao khi cuộn (72px → 60px): việc này làm nội dung dịch lên, kéo theo vị trí cuộn đổi, vượt ngưỡng ngược lại, tạo vòng lặp. **Bắt buộc sửa dù có phải nguyên nhân chính hay không** (xem bước 4).
- Thanh cuộn xuất hiện/biến mất làm đổi chiều rộng trang: thêm `scrollbar-gutter: stable` cho `html`.
- Lắng nghe sự kiện cuộn không dùng `{ passive: true }` hoặc cập nhật state React trực tiếp trong handler: chuyển sang `{ passive: true }` + `requestAnimationFrame`, và chỉ cập nhật khi trạng thái thật sự đổi.

**Bước 4 — Header giữ chiều cao cố định 64px ở mọi trạng thái.**
- Không đổi chiều cao, `padding` hay `font-size` khi cuộn.
- Khi cuộn chỉ được đổi: `box-shadow`, `border-color`, `background-color`. Muốn logo nhỏ lại thì dùng `transform: scale()`.
- Ngưỡng có độ trễ hai chiều: bật trạng thái "đã cuộn" khi `scrollY > 64`, tắt khi `scrollY < 24`.

**Bước 5 — Nếu vẫn giữ được hiệu ứng mờ** (tức bước 2 cho thấy nó không phải nguyên nhân):
- `backdrop-filter` đặt trên **chính thẻ `<header>`** (phần tử trải hết chiều ngang), không đặt trên khung 1200px bên trong. Đây là lý do nền mờ hiện chỉ phủ 45%.
- Khung bên trong không có nền riêng, không `transform`, không `filter`.
- Có dự phòng `@supports not (backdrop-filter: blur(1px))` dùng nền đặc.

**Bước 6 — Header che nội dung khi cuộn tới.**
Thêm `scroll-padding-top: 80px` cho `html` và `scroll-margin-top: 80px` cho các mốc cuộn.

---

## A2.2 Bố cục trang chi tiết sách

**Vấn đề:** bìa cao khoảng 700px trong khi cột bên phải kết thúc sớm hơn nhiều, tạo khoảng trống chết khoảng 300px. Nút "Thêm vào giỏ hàng" xuống 2 dòng dù còn thừa chỗ.

**Bố cục mới:**

**Phần trên** — lưới 2 cột, `grid-template-columns: 380px 1fr`, khoảng cách 56px:
- Trái: bìa sách, rộng tối đa 380px, tỉ lệ 2:3, có `--shadow-md`.
- Phải, theo thứ tự: breadcrumb, tên sách, tác giả, giá, trạng thái kho, bộ chọn số lượng và 2 nút mua, bảng thông tin sách.

**Phần dưới** — trải hết chiều ngang khung 1200px, xếp dọc:
- Giới thiệu sách (chiều dài dòng tối đa 68 ký tự, dùng `max-width: 68ch`).
- Mục lục (nếu có).
- Khối "Có trong tủ sách".
- Sách liên quan.

Chuyển phần mô tả xuống dưới, trải ngang, là cách chuẩn của các trang sản phẩm, và nó xóa hẳn khoảng trống chết.

**Sửa nút:**
- Hàng mua hàng dùng `flex-wrap: wrap`, mỗi nút có `white-space: nowrap` và `padding: 0 24px`. Nút không bao giờ được xuống 2 dòng trên desktop.
- Thứ tự: bộ chọn số lượng, "Thêm vào giỏ hàng" (nút phụ), "Mua ngay" (nút chính).

**Bảng thông tin sách:** khi chỉ còn 1–2 dòng (do các trường khác là `null`), **bỏ tiêu đề "Thông tin sách"** và hiển thị các dòng đó như metadata gọn ngay dưới phần giá. Chỉ khi có từ 3 dòng trở lên mới tách thành khối có tiêu đề riêng.

---

## A2.3 Mật độ trang catalog

**Vấn đề:** tiêu đề, số kết quả và dropdown sắp xếp nằm rải trên 3 tầng, tạo hai dải trống lớn ở đầu trang. Cột lọc để trống khoảng 600px ở nửa dưới.

**Cách sửa:**
- Gộp thành **một khối đầu trang**: breadcrumb ở trên; hàng dưới gồm tiêu đề và số kết quả bên trái, chip lọc và dropdown sắp xếp bên phải, căn theo đường chân chữ (baseline). Khoảng cách từ header xuống tiêu đề tối đa 32px.
- **Cột lọc dính khi cuộn:** `position: sticky; top: 80px; max-height: calc(100vh - 96px); overflow-y: auto`.
- Ô lọc giá có gợi ý số thật: "0" và "500.000".
- Khoảng cách giữa các section dùng thang thống nhất: 48px (nhỏ), 72px (vừa), 96px (lớn). Không dùng giá trị tùy tiện.

---

## A2.4 Kiểm tra lại đợt A

- Thẻ sách phải có `--shadow-sm` ở trạng thái thường, chuyển sang `--shadow-md` khi rê chuột (hiện hover đã chạy, cần xác nhận trạng thái thường có bóng).
- Không còn chỗ nào viết cứng bo góc, cỡ chữ hay mã màu ngoài token.

---

## Hoàn thành khi

- [ ] Cuộn lên/xuống liên tục ở `/sach/nha-gia-kim` không còn giật, **chữ ở mọi vị trí trên trang đứng yên**. Kiểm tra ở cả 1440px và 1280px, và ở cả trang `/sach` lẫn trang chủ.
- [ ] Báo cáo ghi rõ: bước nào trong A2.1 đã khắc phục được lỗi, và quyết định cuối cùng là giữ hay bỏ hiệu ứng mờ.
- [ ] Không còn `will-change` nào trong repo.
- [ ] Nếu giữ hiệu ứng mờ: nền mờ phủ hết chiều ngang, không có ranh giới dọc.
- [ ] Header không che nội dung khi cuộn tới.
- [ ] Trang chi tiết không còn khoảng trống trên 120px giữa các khối.
- [ ] Nút "Thêm vào giỏ hàng" nằm gọn 1 dòng ở mọi độ rộng từ 1024px trở lên.
- [ ] Trang catalog: khối đầu trang gọn 1 tầng, cột lọc dính khi cuộn.
- [ ] `npm run build` và `npm run lint` sạch. Kiểm tra lại NFR-6.1 → 6.6.
- [ ] Báo cáo kèm ảnh chụp: trang chi tiết (đầu trang và sau khi cuộn), trang catalog.

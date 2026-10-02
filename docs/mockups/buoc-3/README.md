# Mockup bước 3 — Giỏ hàng & Checkout

Ảnh trong thư mục này là bản thiết kế đã chốt cho bước 3. Khi triển khai,
**ảnh là nguồn cho bố cục, màu và khoảng cách**; số đo cụ thể lấy từ spec
trong `docs/specs/`. Hai bên mâu thuẫn thì theo spec — và báo lại chỗ mâu thuẫn.

Nguồn: canvas Claude Design "NA Books — Giỏ hàng & Checkout", 02/10/2026. Sáu
artboard, hai trong số đó bấm được: giỏ hàng (nút +/− đổi số lượng và tổng
tiền) và checkout (chọn chuyển khoản thì mở khối thông tin ngân hàng). Ảnh PNG
là ảnh tĩnh, không có hai hành vi này.

## Ảnh nào cho màn hình nào

| File | Màn hình | Kích thước khung |
|---|---|---|
| `gio-hang.png` | Giỏ hàng có sách | 1280×920 |
| `gio-hang-trong.png` | Giỏ hàng trống | 1280×620 |
| `checkout.png` | Thanh toán một bước | 1280×1180 |
| `xac-nhan-don.png` | Xác nhận đơn hàng | 1280×800 |
| `gio-hang-mobile.png` | Giỏ hàng ở 390px | 390×844 |
| `he-layout-dong-bang.png` | Hệ layout tham chiếu | 1280×1040 |

Kích thước khung là kích thước artboard; ảnh xuất ở 2× so với khung.

## Phạm vi

`he-layout-dong-bang.png` KHÔNG thuộc riêng bước 3. Nó là hệ layout tham chiếu
cho mọi bước sau: container 1200px, thang khoảng cách 4/8/16/24/40, một kiểu
thẻ, nút 48px, ô nhập 44px, một tiêu đề trang, một trạng thái trống. Trang nào
cần thành phần chưa có thì thêm vào hệ trước, rồi mới dùng.

## Quyết định thiết kế đã chốt

- Giỏ hàng là trang riêng `/gio-hang`, không phải drawer trượt.
- Danh sách nhiều dòng là MỘT mặt phẳng trắng, các dòng ngăn bằng kẻ 1px —
  không phải mỗi dòng một thẻ.
- Checkout một bước; chọn tỉnh/phường nằm ngay trong form địa chỉ, không tách
  thành bước riêng.
- Bỏ dải "trust strip" 4 icon kiểu các nhà sách thật — nó là ngôn ngữ của shop
  thật, đặt vào portfolio thành nhiễu.
- Luồng tập trung (`/gio-hang`, `/thanh-toan`): ở đúng những kích thước có thanh thao tác cố định (dưới 1024px), footer đầy đủ được thay bằng một dòng "Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio." (nền `paper`, chữ 12px `ink-400`, canh giữa); từ 1024px trở lên footer đầy đủ như mọi trang.

## Dữ liệu trong ảnh

Toàn bộ là dữ liệu mẫu: `ban.doc@example.com`, "Lê Bạn Đọc", số điện thoại và
địa chỉ giả, mã đơn NA-2026-0042. Không có dữ liệu cá nhân thật.

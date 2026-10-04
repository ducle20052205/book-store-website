# Mockup đợt 5B — Form thêm/sửa sách

Nguồn: Claude Design canvas "NA Books — Form thêm/sửa sách (mockup 5B)", Version 24.

Sáu ảnh là export 2× từ canvas (chiều rộng ảnh gấp đôi chiều rộng khung: 1280→2560, 390→780), không phải screenshot.

## Ảnh nào cho màn hình nào

| File | Breakpoint | Trạng thái | Kích thước (đo từ file) |
|---|---|---|---|
| `form-desktop-xoa-duoc.png` | 1280px | Sửa sách; sách chưa từng được đặt, vùng xoá có bước xác nhận | 2560×3520 |
| `form-desktop-da-dat.png` | 1280px | Sửa sách; sách đã nằm trong đơn, vùng xoá chặn kèm nút "Đặt tồn kho về 0" | 2560×3520 |
| `form-desktop-them-moi.png` | 1280px | Thêm sách | 2560×3520 |
| `form-mobile-xoa-duoc.png` | 390px | Sửa sách; sách chưa từng được đặt, vùng xoá có bước xác nhận | 780×5520 |
| `form-mobile-da-dat.png` | 390px | Sửa sách; sách đã nằm trong đơn, vùng xoá chặn kèm nút "Đặt tồn kho về 0" | 780×5520 |
| `form-mobile-them-moi.png` | 390px | Thêm sách | 780×5520 |

## Chiều cao ảnh và nền giấy ở đáy

Chiều cao artboard lấy theo trạng thái cao nhất (trạng thái "xoa-duoc"): nội dung cao 1719px ở desktop và 2718px ở mobile (đo bằng Chromium headless; đọc lại từ pixel của hai ảnh cho đúng 1719 và 2718), cộng lề đáy 41px và 42px, nên ảnh cao 1760px và 2760px khi tính theo khung (3520/2 và 5520/2). Mọi trạng thái thấp hơn dùng chung chiều cao đó, nên hai ảnh `them-moi` có nền giấy thừa ở đáy. Đó là đúng, không phải lỗi export: trang thêm mới không có cảnh báo đổi địa chỉ trang và không có vùng xoá nên ngắn hơn thật.

Đo từ pixel ảnh (đơn vị px của khung, tức một nửa số pixel của file): chiều cao nội dung, rồi nền giấy từ hàng nội dung cuối tới đáy ảnh (đã gồm lề đáy 41px hoặc 42px chung cho cả sáu ảnh).

| File | Nội dung | Nền giấy ở đáy |
|---|---|---|
| `form-desktop-xoa-duoc.png` | 1719 | 41 |
| `form-desktop-da-dat.png` | 1645 | 115 |
| `form-desktop-them-moi.png` | 1408 | 352 |
| `form-mobile-xoa-duoc.png` | 2718 | 42 |
| `form-mobile-da-dat.png` | 2664 | 96 |
| `form-mobile-them-moi.png` | 2279 | 481 |

## Bốn quyết định bố cục mà mockup chốt

1. Form là MỘT mặt phẳng trắng chia bằng kẻ `divide-menu-sep` theo bốn nhóm (Thông tin chính, Giá và kho, Chi tiết xuất bản, Nội dung), không phải bốn thẻ.
2. Lưới hai–ba cột; cả hàng chỉ dành cho mô tả và mục lục. Tên sách đứng cạnh địa chỉ trang vì slug sinh từ tên.
3. Cột phải 280px xem trước bìa do `BookCover` sinh.
4. Vùng xoá ở thẻ riêng dưới cùng, không cạnh nút Lưu.

## Mockup đã khớp spec

- Vỏ trang là Header cửa hàng cộng `AdminNav` trong trang ("Đơn hàng", "Sách"); không có top bar quản trị.
- Không có dòng "cập nhật lần cuối", vì `books` không có `updated_at`.
- Vùng xoá có hai trạng thái của FR-5B.5: sách chưa từng được đặt (xác nhận ngay trong trang, nêu số tủ sách và giỏ hàng bị ảnh hưởng) và sách đã nằm trong đơn (chặn, nêu số đơn, nút "Đặt tồn kho về 0").
- Nhãn trường đúng bảng 15 trường của spec.
- Danh mục mẫu ("Tiểu thuyết") nằm trong 17 danh mục con thật.
- Ô ngày dùng placeholder dd/mm/yyyy, không dùng `input type=date`: trình duyệt sẽ hiện mm/dd/yyyy theo locale máy.

## Chữ nghĩa để xem lại ở đợt 1.6, KHÔNG phải việc của 5B

- Cân nhắc "Giá bìa" thay "Giá" và "Khổ sách" thay "Kích thước".
- Đổi "Địa chỉ trang" sẽ phải đổi tập chữ quản trị trong TC-1, nên không làm trong đợt này.

## Mockup cố ý không thể hiện

- Cột phải chỉ có một thẻ nên ngắn hơn form nhiều; không nhồi thêm thẻ cho đầy.
- Chế độ thêm mới vẫn điền sẵn dữ liệu mẫu để so sánh bố cục; trang thật sẽ trống.

## Chú thích trong ảnh KHÔNG phải câu chữ giao diện

Một số chuỗi trong mockup là ghi chú cho người xem, không được chép vào giao diện thật:

- `(updateTag("books"))` ở thanh hành động;
- "UPDATE không chứa `cover_image_url`" ở thẻ bìa;
- `NFR-3.3` và `order_items_book_id_fkey` ở vùng xoá.

Câu chữ giao diện lấy từ `docs/specs/buoc-5b-admin-sach.md`, không lấy từ ảnh.

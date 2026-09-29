# Mockup bước 2 — Tài khoản người dùng

Ảnh trong thư mục này là bản thiết kế đã chốt cho bước 2. Khi triển khai,
**ảnh là nguồn cho bố cục, màu và khoảng cách**; số đo cụ thể lấy từ spec
trong `docs/specs/`. Hai bên mâu thuẫn thì theo spec — và báo lại chỗ mâu thuẫn.

File `header-2a.html` trong cùng thư mục là bản dựng HTML của đúng phần header,
mở được bằng trình duyệt. Khi cần mã màu hoặc số px chính xác cho header thì đọc
file đó thay vì đoán từ ảnh.

## Ảnh nào cho đợt nào

| File | Màn hình | Dùng ở đợt |
|---|---|---|
| `header-2-trang-thai.png` | Header khi chưa đăng nhập và khi đã đăng nhập, menu tài khoản đang mở | 2A |
| `mobile.png` | Ba màn mobile 390px trong một ảnh: đăng nhập (trái), hồ sơ (giữa), menu tài khoản dạng sheet (phải) | phần sheet dùng ở 2A, đăng nhập ở 2B, hồ sơ ở 2D |
| `dang-nhap.png` | `/dang-nhap` desktop | 2B |
| `dang-ky.png` | `/dang-ky` desktop | 2B |
| `quen-mat-khau.png` | `/quen-mat-khau` | 2C |
| `gui-link-dat-lai.png` | Trạng thái sau khi đã gửi link đặt lại | 2C |
| `dat-lai-mat-khau.png` | `/dat-lai-mat-khau` | 2C |
| `bo-trang-thai-thong-bao.png` | Bốn thông báo: sai đăng nhập, email đã có tài khoản, link hết hạn, đổi mật khẩu thành công | 2B và 2C |
| `tai-khoan.png` | `/tai-khoan` desktop, ba khối: thông tin cá nhân, địa chỉ giao hàng, bảo mật | 2D |

## Token màu

| Vai trò | Mã |
|---|---|
| Chàm — nút chính, link, mục đang chọn | `#26306B` |
| Chàm đậm — cột editorial, footer | `#171D40` |
| Vàng — badge, nét nối ghi chú biên tập | `#D9A33A` |
| Đỏ — giá giảm, thông báo lỗi | `#BD3125` |
| Nền trang | `#EDE6D9` |
| Nền thẻ | `#FFFFFF` |
| Chữ chính | `#1A1C2E` |
| Chữ phụ | `#5F6379` |
| Thành công | `#266E48` |
| Viền ô nhập | `#CFC7B8` |
| Viền thẻ | `#E3DCCE` |
| Nền ô tìm kiếm và khối phụ | `#F6F2E9` |
| Nền mục đang chọn | `#F4F2F8` |

## Số đo lặp lại ở mọi màn

- Topbar cao 64px, thanh danh mục cao 52px, đệm ngang 24px.
- Ô nhập cao 46px trên desktop, 48px trên mobile với font 16px để iOS không tự phóng to.
- Nút chính cao 48px desktop, 50px mobile.
- Bo góc 3px cho ô nhập và nút, 4px cho thẻ.
- Thẻ form hai cột: rộng 1040px, chia 440px cột editorial nền chàm đậm và 600px cột form.
- Thẻ form một cột (quên mật khẩu, đã gửi link, đặt lại mật khẩu): rộng 560px, canh giữa.
- Menu tài khoản: rộng 272px, mỗi mục cao 46px, nền đặc, viền `#DCD4C4`, đổ bóng `0 16px 34px rgba(23,29,64,0.22)`, canh mép phải theo mép phải nút Tài khoản.
- Trang hồ sơ: container 1120px, cột trái 240px, khoảng cách hai cột 40px.
- Vùng chạm trên mobile tối thiểu 44×44px.

## Quy ước chữ

- Newsreader cho tiêu đề và tên sách, chỉ dùng từ 18px trở lên.
- Be Vietnam Pro cho toàn bộ giao diện.
- Chữ nghiêng là lời của biên tập. Chữ đứng là thông tin hệ thống.
- Không dùng nhãn viết hoa toàn bộ trên đầu mỗi khối, không gắn mũi tên sau link,
  không cho mọi thẻ chung một bo góc và một khoảng cách.

## Quy ước nội dung

- NA Books xưng "chúng mình", gọi người dùng là "bạn".
- Thông báo lỗi bằng tiếng Việt, không lộ mã lỗi kỹ thuật, và luôn nói người
  dùng làm gì tiếp theo.
- Nhãn luôn hiển thị phía trên ô nhập, không dùng placeholder thay nhãn.

## Ba điểm cố tình khác production hiện tại

1. Menu và dropdown có nền đặc, viền và đổ bóng, z-index cao hơn thanh danh mục.
   Mega-menu hiện tại đang nhìn xuyên thấy nội dung phía sau — không lặp lại.
2. Header không còn mục Yêu thích, vì trang `/yeu-thich` chưa tồn tại.
3. Trang khai báo `color-scheme: light` để Chrome trên Android không tự ép sang
   dark mode và đảo bảng màu.

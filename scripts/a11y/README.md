# Bộ đo accessibility (`scripts/a11y/`)

Đo accessibility của bản production chạy trên máy này: Edge headless điều khiển qua Chrome DevTools Protocol, không thêm
dependency nào (Node 22+ có `WebSocket` toàn cục; bộ đo dựng và chạy trên Node v24). Bộ đo này thay cho bộ đo bản 1.4 vốn
nằm trong thư mục tạm của phiên làm việc và đã phải dựng lại ba lần.

**Chỉ chạy trên stack cục bộ.** `run.mjs` từ chối chạy nếu `BASE` hoặc `API_URL` không phải loopback. Phiên đăng nhập của
khách và admin được cấp bằng liên kết `recovery` do Auth cục bộ phát (`/auth/v1/admin/generate_link`, không gửi thư) rồi đổi
lấy phiên ở `/auth/callback`; không cần biết mật khẩu tài khoản seed và không đổi mật khẩu của ai.

## Chạy

Điều kiện: stack Supabase cục bộ đang chạy (`docs/runbooks/supabase-local.md`), app đã build với biến môi trường cục bộ và đang
`next start -p 3100`, Edge cài ở đường dẫn mặc định (hoặc đặt `EDGE_PATH`).

```bash
# khoá chỉ lấy bằng biến, không in ra (xem cảnh báo trong runbook)
eval "$(supabase status -o env | grep -E '^(SECRET_KEY|API_URL)=')"; export SECRET_KEY API_URL
export DOCKER_BIN=<đường dẫn docker.exe>        # nếu docker không nằm trên PATH

node scripts/a11y/run.mjs control               # đối chứng: PHẢI chạy trước, thoát 1 nếu có ca trượt
node scripts/a11y/run.mjs tokens                # tỉ lệ của mọi token màu với trắng và paper (đọc app/globals.css)
node scripts/a11y/run.mjs survey --out=f.jsonl  # 21 route, 36 trạng thái, ghi JSONL
node scripts/a11y/run.mjs report f.jsonl        # bảng tóm tắt từ file JSONL
```

Biến môi trường: `BASE` (mặc định `http://127.0.0.1:3100`), `API_URL` (mặc định `http://127.0.0.1:54321`), `SECRET_KEY`,
`DOCKER_BIN`, `DB_CONTAINER` (mặc định `supabase_db_book-store-website`), `EDGE_PATH`, `A11Y_USER` / `A11Y_ADMIN` (email tài
khoản thử, mặc định `nguoi-dung-01@example.com` / `admin-demo@example.com`).

`survey` đọc DB cục bộ để dựng URL (slug sách, tủ sách, mã đơn) và **trả dữ liệu về như cũ**: nếu giỏ của khách thử trống thì
thêm 2 dòng `cart_items` để `/thanh-toan` không chuyển hướng rồi gỡ đúng 2 dòng đó; xoá các `events` sinh ra trong lượt chạy;
so băm hồ sơ khách trước/sau (trạng thái "đã lưu" của `/tai-khoan` gửi lại đúng giá trị đang có, không đổi dữ liệu). Cuối lượt in
bảy con số mốc nền. `--no-restore` tắt việc xoá `events`.

## Đo gì

| Phép đo | Hàm trong `lib.js` | Ngưỡng |
|---|---|---|
| **A** placeholder: chuỗi màu `::placeholder` tính toán nguyên văn, nền hiệu dụng của ô, tỉ lệ | `measurePlaceholders` | 4,5:1 (WCAG 1.4.3) |
| **B** ranh giới ô nhập: màu viền, nền trong, nền ngoài, ba tỉ lệ (viền↔ngoài, viền↔trong, trong↔ngoài) | `measureBoundaries` | 3:1 (WCAG 1.4.11) |
| **C.1** tên khả truy cập (lấy từ cây accessibility của trình duyệt) của mọi liên kết/nút chứa `.book-cover-shadow`: có lặp tên sách không, dài hơn 90 ký tự không; chữ dính do nút `aria-hidden` ở giữa | `coverOwners`, `glueCandidates` + `measure.mjs` | — |
| **C.2** liên kết giữa câu: gạch chân hoặc tỉ lệ màu với chữ quanh | `measureLinks` | 3:1 (WCAG 1.4.1) |
| **D** số điểm dừng `Tab` thật từ đầu tài liệu cho tới khi focus vào `<main>`, tên khả truy cập từng điểm; kiểm chéo với số phần tử tương tác đứng trước `<main>` theo DOM | `preMain`, `resetTabStart` + `measure.mjs` | — |
| Giữ lại từ bản 1.4 (chỉ chạy trong `control`): tương phản chữ, `<svg>` thiếu `aria-hidden`, chỉ báo focus, biểu đồ chỉ khác màu, cỡ chữ | `measureText`, `measureSvg`, `describe`, `measureCharts` | như bản 1.4 |

Liên kết giữa câu theo **đúng quy tắc của bản 1.4**: bộ chọn `p a, li a, dd a, span a`, khối gần nhất `p, li, dd, div` có chữ thường
là nút văn bản trực tiếp. Liên kết có chữ cùng khối nhưng không khớp bộ chọn (ví dụ trong `<div>`) vẫn được ghi với
`byRule14: false`, để thấy điểm mù của quy tắc.

## Đối chứng (`control`)

Mỗi phép đo có một ca PHẢI BẮT và một ca PHẢI KHÔNG BẮT, chèn vào DOM trong bộ nhớ của `/dang-nhap`, so số đo với số tính độc lập
bên Node (`common.mjs`). Hiện 21 ca. Một ca trượt nghĩa là **phép đo hỏng**, không phải trang có lỗi.

Hai bài học nằm trong các ca này:

- **Bỏ qua im lặng.** Bộ đo placeholder bản 1.4 có `if (!col) continue;`. Màu placeholder mặc định của Tailwind v4 (`color-mix`)
  được Edge trả về dạng `oklab(… / 0.5)`; bộ đo cũ chỉ đọc `rgb()` và `color(srgb …)` nên ô nào ăn màu mặc định biến mất khỏi kết
  quả mà không để lại dấu vết. Hai ca đối chứng "ghi đè bằng `#949494` / `#5F6379`" **không phát hiện được điều này** (cả hai đều là
  `rgb()`; bộ đo cũ vượt cả hai). Vì vậy có ca thứ ba: ô không ghi đè màu, phải được đo và khớp số độc lập, cộng ca sổ cái
  `found = measured + unparsed + notVisible`. Mọi nhánh "không đo được" phải trả về bộ đếm, không bao giờ `continue` âm thầm.
- **Điểm bắt đầu của `Tab`.** Trình duyệt giữ điểm bắt đầu duyệt phím sau `blur()`, nên phải đặt lại (`resetTabStart`) trước khi đếm;
  ca đối chứng chèn một `<a>` làm con đầu của `<body>` và đòi số đếm tăng đúng 1.

## Giới hạn đã biết

- Chỉ 1280×900. Không đo vùng chạm (NFR-6.2), không 390px: mobile đang tạm dừng.
- Một máy, Edge headless, bản production cục bộ; không đo hosted, không đo bằng trình đọc màn hình thật.
- Tên khả truy cập đọc từ cây accessibility của Edge (`Accessibility.getPartialAXTree`), không phải trình đọc màn hình.
- `byRule14` kế thừa điểm mù của bản 1.4 (không thấy liên kết nằm trực tiếp trong `<div>`, `<label>`, `<td>`).
- Chữ dính: cấu trúc (nút `aria-hidden` có chữ thật hai phía, không có khoảng trắng nào nằm ngoài cây ẩn) chỉ là ứng viên; chỉ ứng
  viên nằm trong liên kết/nút/tiêu đề mới được xác minh bằng tên khả truy cập, phần còn lại được đếm riêng là "không xác minh được".
- Viền ô nhập: bộ đo lấy nền "ngoài" là nền hiệu dụng của phần tử cha, không phải điểm ảnh thật; ô nằm trên ảnh nền sẽ bị gắn cờ `image`.
- Trạng thái hover và active không được đo.

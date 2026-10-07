# Runbook — Chạy seed dữ liệu demo lên hosted

Cập nhật lần cuối: 07/10/2026. Việc này là **việc tay của chủ dự án**: Claude Code không tạo hay đăng nhập tài khoản trên hosted Auth. Spec: `docs/specs/dot-seed-du-lieu-demo.md` (mục 8). Cách dùng script: `scripts/seed-demo/README.md`. Khuôn: `docs/runbooks/supabase-local.md`.

## Hai điều phải biết trước khi chạy

1. **Lần `--apply` đầu tiên GHI ĐÈ tồn kho hiện có của 40 cuốn bằng vector** (`scripts/seed-demo/stock-vector.json`, tổng 835). Tồn kho hosted hiện tại (đã bị các đơn thật trừ đi) bị thay bằng số của `supabase/seed.sql`, và không có đường quay lại con số cũ: `--teardown` trả về vector, không trả về "số trước khi chạy". Kể từ đó, vector là nguồn chân lý của `books.stock_quantity`.
2. **Trang web có thể hiện số cũ tới khi hết `cacheLife`.** Script ghi thẳng vào database, không có `updateTag` nào chạy. 13 hàm `"use cache"` trong `lib/queries.ts`, 9 hàm mang thẻ `books`; 4 hàm không mang thẻ là đúng. Muốn thấy ngay thì đợi hết `cacheLife` (60 giây, profile `minutes`) hoặc deploy lại.

Cũng cần nhớ: preview và production dùng chung một database hosted, nên dữ liệu demo hiện ở cả hai. Hai đơn thật hiện có thuộc tài khoản admin, nằm ngoài mọi câu lệnh của script.

## Các bước

1. **Lấy khoá phía server** từ Supabase Dashboard → Settings → API. **Không dán vào chat, không ghi vào repo.**
2. **Đặt bốn biến môi trường trong phiên terminal** (không ghi ra file trong repo): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SEED_DEMO_PASSWORD` (mật khẩu chung cho 25 tài khoản demo, tự chọn).
3. **Lấy mốc:** `node scripts/seed-demo.mjs --verify`. Ghi lại sáu số (tài khoản demo, `orders`, `order_items`, `events`, `sum(stock_quantity)`, số sách tồn kho 0) và checksum `books`.
4. **Dựng:** `node scripts/seed-demo.mjs --apply`. Trước đó có thể chạy `--dry-run` để xem kế hoạch.
5. **Đối chiếu:** `node scripts/seed-demo.mjs --verify` rồi so với bảng dưới. Checksum `books` (trừ `stock_quantity`) phải bằng mốc ở bước 3.
6. **Cách lùi:** `node scripts/seed-demo.mjs --teardown`, rồi `--verify`: tồn kho phải bằng vector (835, 4 slug ở mức 0), tài khoản demo / đơn / sự kiện đều 0.

Chạy `--apply` lại là an toàn (đơn đã có thì bỏ qua). `--teardown` dừng giữa chừng thì chạy lại.

## Bảng số kỳ vọng sau `--apply`

Lấy từ lần đo thật trên stack cục bộ ngày 06/10/2026 (psql trực tiếp và `--verify` cho cùng số).

| Mục | Số |
|---|---|
| Tài khoản demo (`nguoi-dung-NN@example.com`) | 25 |
| Đơn | 42 (6 `pending`, 5 `processing`, 5 `shipped`, 18 `completed`, 8 `cancelled`) |
| Dòng hàng (`order_items`) | 84 |
| Sự kiện | 1.897 (1200 / 360 / 150 / 60 / 42 / 25 / 60) |
| Tổng tồn kho | 737 — SAU seed (835 là mốc TRƯỚC seed; cách tính ngay dưới bảng) |
| Sách tồn kho 0 | 4: `bach-da-hanh`, `ban-co-the-dam-phan-bat-cu-dieu-gi`, `mindset-tam-ly-hoc-thanh-cong`, `tham-tu-lung-danh-conan-tap-1` |
| Giỏ hàng của tài khoản demo | 0 |

Sau `--teardown`: tồn kho 835, 4 slug ở mức 0, các mục còn lại 0.

**Mốc nền tồn kho: 835 là TRƯỚC seed demo, 737 là SAU.** Phép tính để tự kiểm: `scripts/seed-demo/plan.json` có 42 đơn / 84 dòng hàng / 120 đơn vị, trong đó 8 đơn `cancelled` giữ 22 đơn vị. Đơn không hủy bán 120 − 22 = 98 đơn vị, nên 835 − (120 − 22) = **737**. Con số 737 không chỉ là tổng tồn: nó chỉ đúng khi trigger `orders_status_guard` hoàn tồn kho lúc đơn bị hủy. Nếu trigger không hoàn, 22 đơn vị của 8 đơn hủy vẫn bị trừ và tổng là 835 − 120 = 715. Vì vậy `--verify` in `835 − sum(stock) = 98 vs tổng quantity đơn không hủy = 98` (TC-S.9): hai vế bằng nhau là bằng chứng trigger đã hoàn đúng.

## Lưu ý riêng cho hosted

- Script gọi thẳng RPC `place_order`, không qua Server Action: không gửi email xác nhận, không gọi webhook Make.com. Sự kiện trong bảng `events` là 1.897 dòng do script tự chèn (có `metadata->>'seed_ref'`), không phải do ứng dụng ghi.
- `order_code_seq` không reset: mỗi lần dựng tiêu 42 mã đơn (số đo cục bộ: sau ba lần dựng, sequence = 126). Đơn thật kế tiếp sẽ mang mã sau khoảng trống đó.
- Seed lại sau nhiều tháng: sửa hai ngày neo cửa sổ và sinh lại mảng 42 đơn trong `scripts/seed-demo/plan.json` (README, mục `plan.json`). Script cảnh báo khi dữ liệu già hơn một năm.
- Chưa đo trên hosted: thời gian chạy (cục bộ `--apply` 9,5 giây) và giới hạn tốc độ đăng nhập của Auth hosted (script đăng nhập mỗi tài khoản demo một lần, 25 lượt).

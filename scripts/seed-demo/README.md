# Seed dữ liệu demo — `scripts/seed-demo.mjs`

Dựng 25 tài khoản demo, 42 đơn trải 7 tháng, 1.897 sự kiện hình phễu; gỡ sạch và đưa tồn kho về một vector biết trước. Spec: `docs/specs/dot-seed-du-lieu-demo.md` (v1.8). Chạy lên hosted theo `docs/runbooks/chay-seed-demo.md`.

Node thuần, không dependency mới: chỉ `node:crypto`, `fetch` và `@supabase/supabase-js` đã có trong `package.json`.

## Bốn chế độ

| Chế độ | Ghi database? | Dùng khi |
|---|---|---|
| `--dry-run` | Không | Trước `--apply`: in kế hoạch và mọi phép tự kiểm của `plan.json`, tồn kho dự kiến sau khi chạy, số slug được chạm, slug chạm trần |
| `--apply` | Có | Dựng dữ liệu demo. Chạy lại được: đơn đã có thì bỏ qua (`skipped_existing`), tồn kho chỉ đặt lại khi chưa có tài khoản demo nào |
| `--teardown` | Có | Gỡ theo bốn bước (xoá `orders`, xoá `events`, xoá tài khoản qua Admin API, đặt lại tồn kho = vector). Dừng giữa chừng thì chạy lại |
| `--verify` | Không | Bất cứ lúc nào: in số đo của các tiêu chí. Dùng làm mốc trước `--apply` và đối chiếu sau |

Không cờ: in trợ giúp, thoát mã 1. Thiếu biến môi trường: thoát mã 2. Một điều kiện dừng: mã 3.

## Biến môi trường

Chỉ tên, không bao giờ ghi giá trị vào file trong repo. Script không có giá trị mặc định nào.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` (khoá phía server)
- `SEED_DEMO_PASSWORD` (mật khẩu chung của 25 tài khoản demo; **chỉ `--apply` cần**)

Trên stack cục bộ, lấy giá trị bằng `supabase status -o env` rồi chọn đúng biến; không in thẳng đầu ra của `supabase start` hay `supabase status` (có `JWT_SECRET` và khoá S3 cục bộ).

## Điều kiện dừng và cảnh báo

- `--apply` dừng nếu `now()` sớm hơn `2026-10-06 00:00 +07` (cửa sổ cố định chỉ an toàn khi mọi mốc đã nằm trong quá khứ).
- Mọi chế độ cảnh báo (không dừng) khi `now()` muộn hơn ngày cuối cửa sổ quá 12 tháng.
- Dừng nếu `books` không đúng 40 dòng, có slug trong vector không tồn tại, hoặc `plan.json` / `stock-vector.json` lệch khối `expected`.

## Ghi chú

- **Số điện thoại.** Dải `0288xxxxxx` là số bịa. Việt Nam không có dải số dành riêng cho tài liệu, nên các số này có khả năng trùng một thuê bao thật. Script không bao giờ gửi gì tới các số này (nó gọi thẳng RPC `place_order`, không qua email hay SMS).
- **`order_code_seq` không được reset.** Sau mỗi lần gỡ, dãy mã đơn có một khoảng trống đúng bằng số đơn đã sinh (42 mỗi lần dựng). Đo được trên stack cục bộ: sau ba lần dựng, sequence = 126. Đặt ngược lại sẽ có nguy cơ trùng `order_code` với đơn thật.
- **Cache.** Script ghi thẳng vào database nên không có `updateTag` nào chạy: trang catalog và trang chủ có thể hiện số cũ tới khi hết `cacheLife`. `lib/queries.ts` có 13 hàm `"use cache"`, 9 hàm mang thẻ `books`; 4 hàm còn lại không mang thẻ là ĐÚNG, không phải thiếu sót.
- **`plan.json`.** Hai ngày neo cửa sổ (`2026-04-01`, `2026-10-05`) là hằng số. Seed lại sau nhiều tháng thì phải SỬA cửa sổ và sinh lại mảng 42 đơn; đó là thay đổi có chủ ý, đừng để nó trôi âm thầm. Script chỉ ĐỌC mảng này, không tự tính ngày, giờ, trạng thái hay dòng hàng.
- **Tồn kho.** `stock-vector.json` là nguồn chân lý của `books.stock_quantity` kể từ lần `--apply` đầu tiên. `--teardown` trả về vector, không trả về số trước khi chạy.

## Tệp

| Đường dẫn | Nội dung |
|---|---|
| `scripts/seed-demo.mjs` | Script duy nhất |
| `scripts/seed-demo/plan.json` | Mảng 42 đơn tường minh (`n`, `account`, `date`, `time`, `status`, `payment_method`, `lines`, `has_confirmation`, `emailOffsetSeconds`, `orderPlacedOffsetSeconds`), `event_seed`, cửa sổ, khối `expected` để tự kiểm |
| `scripts/seed-demo/stock-vector.json` | Vector tồn kho `{ "<slug>": <số> }`, 40 khoá, tổng 835, 4 khoá bằng 0 |
| `scripts/seed-demo/metadata-shapes.md` | Hình dạng `metadata` của 7 loại sự kiện, đọc từ mã |

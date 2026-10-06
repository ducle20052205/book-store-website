# Hình dạng `metadata` của sự kiện — đọc từ mã (06/10/2026)

Nguồn là các chỗ gọi `track()` và `trackServer()` trong mã, không phải câu chữ SRS FR-8.4.
Hai hàm ghi: `track()` ở `lib/analytics.ts:39` (client, qua `components/TrackEvent.tsx:23` hoặc gọi trực tiếp) và `trackServer()` ở `lib/analytics.server.ts:14` (Server Action). Cả hai chỉ chuyển `metadata` nguyên xi vào cột `events.metadata`.

Bảy loại `event_type` (`lib/analytics.ts:25`): `page_view`, `search`, `add_to_cart`, `checkout_started`, `order_placed`, `sign_up`, `login`. Mỗi loại chỉ có đúng một chỗ ghi (riêng `sign_up` và `login` dùng chung một dòng, hai lời gọi `finishAuth`).

| `event_type` | Khoá `metadata` | Kiểu giá trị | Nơi gọi (file:dòng) |
|---|---|---|---|
| `page_view` | `page` | string, luôn là `"book_detail"` | `app/sach/[slug]/page.tsx:143` |
| | `book_id` | string (uuid của `books.id`) | |
| | `slug` | string (`books.slug`) | |
| `search` | `q` | string, không rỗng | `app/sach/page.tsx:82-85` |
| | `results_count` | number (số nguyên, `totalCount` của `searchBooks`, 0 khi không có kết quả) | |
| | `category` | string (slug danh mục) hoặc `null` | |
| | `sort` | string: `newest`, `price_asc`, `price_desc` hoặc `bestseller` | |
| `add_to_cart` | `book_id` | string (uuid) | `components/PurchasePanel.tsx:73` |
| | `quantity` | number (số lượng vừa thêm) | |
| `checkout_started` | `items_count` | number (`totalQuantity`: TỔNG `quantity` của giỏ, không phải số dòng) | `components/checkout/CheckoutView.tsx:278` |
| | `total_amount` | number (`total` của giỏ) | |
| `order_placed` | `order_code` | string (dạng `NA-YYYY-NNNN`) | `app/actions/checkout.ts:136-146` |
| | `items_count` | number (tổng `quantity` của `order_items`; 0 nếu không đọc lại được đơn) | |
| | `total_amount` | number (`orders.total_amount`; nếu không đọc lại được đơn thì `expectedTotal`) | |
| | `payment_method` | string: `cod` hoặc `bank_transfer` | |
| `sign_up` | `method` | string, luôn là `"password"` | `app/actions/auth.ts:36` (gọi từ dòng 118) |
| `login` | `method` | string, luôn là `"password"` | `app/actions/auth.ts:36` (gọi từ dòng 62) |

## Số đo từ bảng

- 7 loại sự kiện, 6 chỗ ghi khác nhau.
- Số khoá mỗi loại: `page_view` 3, `search` 4, `add_to_cart` 2, `checkout_started` 2, `order_placed` 4, `sign_up` 1, `login` 1.
- Tổng số khoá KHÁC NHAU: 13 (`page`, `book_id`, `slug`, `q`, `results_count`, `category`, `sort`, `quantity`, `items_count`, `total_amount`, `order_code`, `payment_method`, `method`).

## Điều kiện ghi trong mã (không phải khoá)

- `search` chỉ ghi khi có từ khoá và đang ở trang 1: `parsed.q && parsed.page === 1` (`app/sach/page.tsx:81`).
- `checkout_started` ghi phía client, một lần mỗi lần mở trang thanh toán có giỏ không rỗng (`components/TrackEvent.tsx`, chặn ghi trùng bằng `useRef`).
- `order_placed`, `sign_up`, `login` ghi phía server, sau khi việc chính đã thành công (`app/actions/checkout.ts:124` thoát trước nếu `created = false`, nên đặt lại một đơn đã có không ghi lần hai).

## Khoá không có trong mã

`seed_ref` do đợt seed thêm (spec FR-S.5, FR-S.6); ứng dụng không bao giờ ghi khoá này.

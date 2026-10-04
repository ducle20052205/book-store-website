-- ============================================================================
-- Đợt 5B, chặng 1 (admin: quản lý sách) — ràng buộc dữ liệu cho public.books.
-- Spec: docs/specs/buoc-5b-admin-sach.md (FR-5B.6, mục 4). SRS: FR-7.2, FR-7.3.
--
-- Sáu thay đổi, MỘT transaction (đúng thứ tự mục 4 của spec):
--   1. CHECK books_price_check:           price > 0.
--   2. CHECK books_discount_price_check:  discount_price là NULL, hoặc > 0 và < price.
--   3. CHECK books_stock_quantity_check:  stock_quantity >= 0.
--   4. stock_quantity NOT NULL — cột đang cho NULL (mặc định 0); một CHECK >= 0 cho NULL đi qua, và
--      place_order với NULL thì "stock_quantity >= qty" không bao giờ đúng (HET_HANG mãi).
--   5. category_id NOT NULL — "danh mục con là bắt buộc" cần có chỗ đứng ở database.
--   6. CHECK books_slug_format_check:     slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' và dài tối đa 120 ký tự — một
--      slug sai định dạng (rỗng, có khoảng trắng hay dấu /) làm hỏng URL /sach/[slug].
-- Ba mục đầu là của chủ dự án; mục 4, 5, 6 do spec thêm (tự chốt): đảo lại bằng DROP NOT NULL / DROP
-- CONSTRAINT, và 0 dòng hosted vi phạm.
--
-- KHÔNG làm: không thêm cột, bảng, trigger hay policy; không đổi policy nào của books; không UPDATE dòng nào.
-- KHÔNG cần thêm (đã có từ trước, đo trên hosted ngày 04/10/2026):
--   - unique index trên slug: books_slug_key UNIQUE (slug) — trùng slug đã bị từ chối bằng 23505;
--   - chặn xoá sách còn trong order_items: khoá ngoại order_items_book_id_fkey (NO ACTION) — DELETE trúng
--     sách đã đặt bị từ chối bằng 23503 với mọi vai trò, an toàn khi chạy đồng thời với place_order.
--
-- Dữ liệu hiện có không vi phạm điều nào (hosted, 40 sách, đo lại khi viết migration): price <= 0: 0 dòng;
-- discount_price sai: 0; stock_quantity < 0: 0; stock_quantity NULL: 0; category_id NULL: 0; slug sai
-- định dạng: 0. Nên thêm thẳng, không cần NOT VALID.
--
-- place_order trừ kho bằng UPDATE ... WHERE stock_quantity >= qty nên không bao giờ làm kho âm; trigger hủy
-- đơn cộng coalesce(stock_quantity, 0) + quantity nên không phụ thuộc NULL — cả hai chạy bình thường.
-- ============================================================================

begin;

alter table public.books
  add constraint books_price_check check (price > 0);

alter table public.books
  add constraint books_discount_price_check
  check (discount_price is null or (discount_price > 0 and discount_price < price));

alter table public.books
  add constraint books_stock_quantity_check check (stock_quantity >= 0);

alter table public.books
  alter column stock_quantity set not null;

alter table public.books
  alter column category_id set not null;

alter table public.books
  add constraint books_slug_format_check
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120);

commit;

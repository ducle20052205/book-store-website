# NA Books — Bước 1: Catalog, Trang chi tiết sách, ghi log sự kiện

> Prompt cho Claude Code. Đặt file này tại `docs/specs/buoc-1-catalog-chi-tiet.md`.
> Làm trên nhánh mới `feat/catalog-detail`, tách từ `main` **sau khi** nhánh `feat/brand-identity` đã được merge.
> Làm theo 3 đợt (1a → 1b → 1c). Mỗi đợt xong thì commit và báo cáo, chưa làm đợt sau cho đến khi tôi xác nhận.
> Mọi quy tắc trong `docs/specs/claude-code-brand-update.md` (tokens, component, giọng văn, accessibility) vẫn áp dụng.
> **Mockup:** giao diện bám theo ảnh trong `docs/mockups/buoc-1/` (catalog desktop/mobile, bộ lọc mobile, chi tiết sách desktop/mobile). Mockup trả lời câu hỏi "trông như thế nào", spec trả lời "hoạt động ra sao". Khi hai bên mâu thuẫn, **spec thắng** — ghi lại chỗ mâu thuẫn trong báo cáo.

**Căn cứ:** SRS mục 5.1 (FR-1.x) và 5.2 (FR-2.x). Những chỗ spec này **khác SRS** đều được đánh dấu **[Thay đổi SRS]**.

---

## Đợt 1a — Database

### 1a.1 Migration: tìm kiếm không dấu

**[Thay đổi SRS — FR-1.3]**
- Tìm kiếm theo cả `title` **và** `author`. Lý do: placeholder của ô tìm kiếm đã hứa "Tìm tên sách, tác giả…".
- Tìm kiếm **không phân biệt dấu**. Người dùng Việt Nam thường gõ "nha gia kim" thay vì "Nhà giả kim".

```sql
create extension if not exists unaccent with schema extensions;

-- unaccent() không phải hàm immutable, nên cần một hàm bọc lại.
create or replace function public.f_unaccent(text)
returns text
language sql immutable parallel safe strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;
```

Kiểm tra sau khi apply:
- `select public.f_unaccent('Điều kỳ diệu')` phải trả về `Dieu ky dieu`.
- Nếu chữ `Đ`/`đ` không được chuyển thành `D`/`d`, xử lý thêm bằng `replace()` bên trong hàm, rồi báo lại tôi.

### 1a.2 Hàm RPC `search_books`

Toàn bộ lọc, sắp xếp, phân trang chạy phía server (NFR-1.3), gói trong một hàm duy nhất:

```sql
create or replace function public.search_books(
  p_q text default null,
  p_category_slug text default null,
  p_min numeric default null,
  p_max numeric default null,
  p_sort text default 'newest',   -- newest | price_asc | price_desc | bestseller
  p_page int default 1
)
returns table (
  id uuid, slug text, title text, author text,
  price numeric, discount_price numeric,
  stock_quantity int, cover_image_url text,
  total_count bigint
)
language plpgsql stable
security definer
set search_path = ''
as $$ ... $$;

grant execute on function public.search_books(text, text, numeric, numeric, text, int)
  to anon, authenticated;
```

**Vì sao dùng `security definer`:** sort "Bán chạy" cần cộng `order_items.quantity` của **mọi** đơn hàng. Nhưng RLS chỉ cho khách xem đơn hàng của chính họ, còn khách vãng lai không xem được đơn nào. Nếu chạy với quyền người gọi, kết quả sort sẽ sai. Hàm chỉ trả về các cột công khai của sách, không để lộ dữ liệu đơn hàng hay khách hàng nào.

**Logic bắt buộc:**

| Tham số | Quy tắc |
|---|---|
| `p_q` | Trim khoảng trắng. Chuỗi rỗng coi như `null`. Cắt tối đa 100 ký tự. Escape `%` và `_`. Khớp khi `f_unaccent(lower(title))` **hoặc** `f_unaccent(lower(author))` chứa `f_unaccent(lower(p_q))`. |
| `p_category_slug` | Lấy sách thuộc danh mục đó. Nếu là danh mục cha, lấy cả sách thuộc các danh mục con trực tiếp (FR-1.4). Slug không tồn tại thì trả về 0 dòng. |
| `p_min` / `p_max` | So sánh với `coalesce(discount_price, price)` (FR-1.5). Nếu `p_min > p_max` thì đổi chỗ hai giá trị. Giá trị âm coi như `null`. |
| `p_sort` | `newest` = `created_at desc`. `price_asc` / `price_desc` theo giá thực tế. `bestseller` = tổng `order_items.quantity` của các đơn có `status <> 'cancelled'`, giảm dần; sách chưa có đơn xếp cuối (FR-1.7). Giá trị không hợp lệ thì dùng `newest`. |
| Tie-break | **Mọi** kiểu sort đều thêm `created_at desc, id` ở cuối, để phân trang ổn định. Hiện chưa có đơn hàng nào, nên `bestseller` sẽ tạm thời giống `newest`. Đây là hành vi đúng, không phải lỗi. |
| `p_page` | Nhỏ hơn 1 thì coi là 1. Page size cố định **20** (FR-1.2) — không nhận từ client. |
| `total_count` | Tổng số kết quả trước phân trang, dùng `count(*) over ()`. |

### 1a.3 Migration: sửa bảo mật bảng `events`

Policy hiện tại `events_insert_public` có `WITH CHECK (true)`. Nghĩa là bất kỳ ai cũng chèn được sự kiện mang `user_id` của **người khác**, với metadata không giới hạn kích thước.

Thay bằng:

```sql
drop policy if exists "events_insert_public" on public.events;

create policy "events_insert_public" on public.events
  for insert to anon, authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and octet_length(coalesce(metadata::text, '')) <= 2048
  );
```

Mở rộng CHECK constraint của `event_type`: giữ 4 giá trị cũ (`page_view`, `add_to_cart`, `checkout_started`, `order_placed`), thêm `search`. Dùng lại tên constraint hiện có (drop rồi tạo lại).

**Quy tắc migration** (như các lần trước):
- Apply bằng Supabase MCP.
- Đặt tên file theo version mà Supabase ghi nhận.
- Không sửa schema qua Table Editor.

**Báo cáo đợt 1a:** kết quả chạy thử `search_books` với các trường hợp sau:
- `p_q = 'nha gia kim'`
- `p_q = 'higashino'`
- `p_category_slug = 'van-hoc'` (phải ra 10 cuốn)
- `p_min = 200000, p_max = 100000`
- `p_sort = 'bestseller'`
- `p_page = 3` (phải ra 0 dòng)

---

## Đợt 1b — Trang Catalog `/sach`

### 1b.1 URL

Mọi bộ lọc nằm trên URL, để link có thể chia sẻ và nút Back hoạt động đúng.

`/sach?q=&category=&min=&max=&sort=&page=`

Giá trị hợp lệ của `sort`: `newest` | `price_asc` | `price_desc` | `bestseller`.

**Cập nhật các link đang có:**
- Ô tìm kiếm ở header: submit sang `/sach?q=...`
- "Sách mới" → `/sach?sort=newest`
- "Bán chạy" → `/sach?sort=bestseller`
- Mega-menu → `/sach?category=<slug>`
- Tab "Bán chạy" ở trang chủ gọi cùng hàm `search_books(p_sort => 'bestseller')`.

### 1b.2 Bố cục

**Tiêu đề trang** (theo thứ tự ưu tiên):
1. Có `q` → `Kết quả cho "<q>"`.
2. Có `category` → tên danh mục.
3. Không có gì → "Tất cả sách".

**Thanh trên cùng:**
- Số kết quả, ví dụ "40 cuốn sách".
- Chip cho từng bộ lọc đang áp dụng, mỗi chip có nút × để bỏ.
- Dropdown sắp xếp (nhãn: Mới nhất / Giá tăng dần / Giá giảm dần / Bán chạy).

**Desktop (≥ 1024px):**
- Cột lọc bên trái, gồm:
  - Cây danh mục: cha → con, theo `sort_order`. Danh mục đang chọn được đánh dấu.
  - Khoảng giá: 2 ô nhập (từ / đến) + nút "Áp dụng".
  - 3 lựa chọn nhanh: Dưới 100.000đ / 100.000–200.000đ / Trên 200.000đ.
  - Nút "Xóa bộ lọc".
- Lưới sách bên phải, 4 cột.

**Mobile:**
- Nút "Bộ lọc" mở một bottom sheet chứa các nội dung lọc giống desktop.
- Focus bị giữ trong sheet khi mở. Đóng được bằng phím Esc và nút ×.
- Lưới 2 cột.

**Các thành phần khác:**
- Thẻ sách: dùng lại `BookCard`.
- Phân trang: dạng số trang + Trước / Sau. Dùng thẻ `<a>` thật, không dùng nút JavaScript. Giữ nguyên các tham số lọc khi chuyển trang.
- Loading: tạo `app/sach/loading.tsx` dạng skeleton lưới thẻ sách.
- Kết quả rỗng: hiển thị theo giọng văn:
  > "Chúng mình chưa tìm thấy cuốn nào khớp với "<q>". Bạn thử bỏ bớt bộ lọc, hoặc ghé tủ sách tuyển chọn nhé."
  
  Kèm link tới `/tu-sach`.
- Metadata: `title` = tiêu đề trang + " – NA Books".

---

## Đợt 1c — Trang chi tiết sách + ghi log sự kiện

### 1c.1 Route

**[Thay đổi SRS — FR-2.1]** Route là `/sach/[slug]`, không phải `/books/[slug]`. Lý do: thống nhất với các route tiếng Việt đã có (`/tu-sach`, `/gio-hang`, `/tai-khoan`).

- Slug không tồn tại → `notFound()`, dùng trang 404 đã có (FR-2.4).
- `generateMetadata`: title = "<Tên sách> – <Tác giả> | NA Books", description = 160 ký tự đầu của `description`.

### 1c.2 Bố cục

- **Desktop:** 2 cột. Bên trái là `BookCover` lớn (khoảng 40%), bên phải là thông tin sách.
- **Mobile:** xếp dọc, bìa ở trên.

**Cột thông tin, theo thứ tự:**

1. Tên sách: serif, 28–32px.
2. Tác giả: link tới `/sach?q=<tác giả>`.
3. Khối giá (`Price`) + trạng thái kho. **Không** hiển thị số lượng tồn kho chính xác (FR-2.1).
   - Còn hàng: nhãn "Còn hàng" màu `success`, kèm icon dấu tích.
   - Hết hàng: `StockLabel` "Hết hàng".
   - Trạng thái luôn có chữ, không chỉ dựa vào màu (NFR-6.5).
4. Bộ chọn số lượng (1 → `min(stock_quantity, 99)`) + nút "Thêm vào giỏ hàng" (nút phụ) + nút "Mua ngay" (nút chính).
   - **Giỏ hàng chưa có (làm ở bước 3):** bấm nút thì hiện toast *"Giỏ hàng đang được hoàn thiện, bạn quay lại sau nhé."* Không để nút "chết" mà không phản hồi gì.
   - Khi hết hàng: vô hiệu hóa cả hai nút (FR-2.2).
   - **Mobile (< 768px):** hai nút "Thêm vào giỏ" và "Mua ngay" nằm trong một **thanh dính ở đáy màn hình**. Thanh có nền `surface`, viền trên `line`, tôn trọng `env(safe-area-inset-bottom)`. Bộ chọn số lượng vẫn nằm trong nội dung trang, cạnh trạng thái kho. Thêm padding cuối trang bằng chiều cao của thanh, để thanh không che footer. Toast hiện ngay phía trên thanh này.
5. Bảng "Thông tin sách": Người dịch, Nhà xuất bản, ISBN, Số trang, Kích thước, Ngày phát hành (định dạng dd/mm/yyyy), Danh mục (link `/sach?category=<slug>`). **Ẩn các dòng có giá trị `null`.** Dữ liệu seed hiện để trống nhiều trường, và không được hiển thị "Đang cập nhật" hay "—".
6. Mô tả sách.
7. Mục lục: dùng `<details>`/`<summary>`, mặc định đóng. Ẩn hoàn toàn nếu `table_of_contents` là `null`.

**[Thay đổi SRS — FR-2.6 mới] Khối "Có trong tủ sách":**
- Liệt kê mọi tủ sách có chứa cuốn này.
- Mỗi tủ gồm: tên tủ (link tới `/tu-sach/<slug>`) + `curator_note` của cuốn sách trong tủ đó.
- Ẩn khối nếu sách không nằm trong tủ nào.
- Đây là nơi định vị "tuyển chọn, có lời giải thích" xuất hiện ngay trên trang sản phẩm.

**[Thay đổi SRS — FR-2.3] Sách liên quan:**

1. Lấy tối đa 4 cuốn cùng `category_id` (danh mục con), loại trừ cuốn đang xem, mới nhất trước.
2. Nếu chưa đủ 4 cuốn, lấy thêm từ các danh mục con khác **cùng danh mục cha**, mới nhất trước, không trùng.
3. Tiêu đề khối:
   - Chỉ có sách cùng danh mục con: "Cùng thể loại <tên danh mục con>".
   - Có lấy thêm từ danh mục cha: "Cùng thể loại <tên danh mục cha>".
4. Ẩn khối nếu tổng số sách vẫn là 0.

Lý do: mỗi danh mục con hiện chỉ có 1–3 cuốn. Ví dụ "Kỳ ảo – Khoa học viễn tưởng" chỉ có 1 cuốn, nên nếu giữ đúng SRS thì khối này sẽ trống trên nhiều trang.

**Component mới:** `Toast`
- Dùng `aria-live="polite"`, tự ẩn sau 4 giây, đóng được bằng nút ×.
- Tái sử dụng được ở các bước sau.

### 1c.3 Ghi log sự kiện (tính năng mới)

**[Thay đổi SRS — nhóm FR-8 mới]** Mục đích: thu dữ liệu thật cho Dashboard thống kê nâng cao (phễu tìm kiếm → xem sách → giỏ → checkout → đặt hàng).

**Tạo `lib/analytics.ts`:**
- Hàm `track(eventType, metadata)`.
- Fire-and-forget: gọi `insert` vào `events` qua Supabase client. **Không bao giờ throw, không await trong luồng giao diện.** Lỗi chỉ ghi `console.warn` khi ở môi trường dev.
- `session_id`: lấy từ `localStorage` key `na_sid`. Nếu chưa có thì tạo bằng `crypto.randomUUID()` và lưu lại. Bọc trong try/catch.
- `user_id`: `auth.uid()` nếu đã đăng nhập, ngược lại để `null`.
- **Không đưa dữ liệu cá nhân vào metadata** (email, tên, địa chỉ, số điện thoại).

**Sự kiện ghi ở bước này:**

| `event_type` | Khi nào | `metadata` |
|---|---|---|
| `page_view` | Mở trang chi tiết sách | `{ "page": "book_detail", "book_id": "...", "slug": "..." }` |
| `search` | Trang `/sach` có `q` không rỗng (chỉ ghi ở trang 1) | `{ "q": "...", "results_count": 12, "category": "...", "sort": "..." }` |

- `add_to_cart`, `checkout_started`, `order_placed` sẽ ghi ở bước 3 và 4.
- Chặn ghi trùng: ở dev mode, React Strict Mode chạy effect hai lần. Dùng `useRef` để mỗi lần mở trang chỉ ghi một sự kiện.
- `results_count = 0` là dữ liệu quan trọng ("tìm mà không thấy"). Vẫn phải ghi.

---

## Hoàn thành khi

- [ ] **1a:** `unaccent` hoạt động. `search_books` qua đủ 6 case thử ở trên. Policy `events` đã được siết lại. Constraint có thêm `search`.
- [ ] **1b:** `/sach` lọc, sắp xếp, phân trang đúng. Mọi link ở header, nav, mega-menu, trang chủ đã trỏ đúng. Trạng thái rỗng và loading đều có. Bottom sheet trên mobile dùng được bằng bàn phím.
- [ ] **1c:** `/sach/[slug]` hiển thị đủ thông tin, ẩn trường `null`.
  - Khối "Có trong tủ sách" hoạt động.
  - "Sách liên quan" lấy thêm từ danh mục cha khi danh mục con không đủ 4 cuốn. Thử với cuốn Namiya: phải ra 4 cuốn.
  - Nhãn "Còn hàng" / "Hết hàng" hiển thị đúng.
  - Thanh mua hàng dính đáy trên mobile.
  - Toast hiện khi bấm nút giỏ hàng.
  - Slug sai trả về 404.
- [ ] Đối chiếu với ảnh trong `docs/mockups/buoc-1/`, liệt kê mọi chỗ lệch.
- [ ] **Events:** mở 1 trang sách + tìm 1 từ khóa → có đúng 2 dòng trong `events`, `user_id` là null, có `session_id`.
- [ ] Kiểm tra NFR-6.1 → 6.6 (accessibility) trên cả 2 trang mới.
- [ ] Commit sau mỗi đợt. Push lên `feat/catalog-detail` (vẫn kiểm tra `.env.local` như lần trước). Báo cáo file đã sửa, file tạo mới, và những gì chưa đạt.

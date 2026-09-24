# NA Books — Cập nhật brand identity, danh mục và tủ sách tuyển chọn

> Prompt cho Claude Code. Trước khi sửa, hãy đọc repo để xác định phần nào đã có, phần nào chưa.
> - Phần nào **đã tồn tại**: sửa theo spec này.
> - Phần nào **chưa có**: tạo mới theo spec này.
> - Với mọi thao tác **phá dữ liệu** (xóa/đổi seed `categories` khi `books` đã tham chiếu tới): DỪNG LẠI, báo tôi trạng thái hiện tại và phương án trước khi làm.

## 0. Nguyên tắc thiết kế

**"Quen ở cấu trúc, riêng ở chất liệu."**

- **Cấu trúc** (layout, vị trí thành phần, luồng mua hàng, màu giá) theo quy ước của các website bán sách/TMĐT Việt Nam, để người dùng không phải học lại.
- **Chất liệu** (màu thương hiệu, typography, khoảng trắng, nội dung tủ sách, giọng văn) là nơi tạo khác biệt.
- Người dùng mục tiêu: 18–30 tuổi. Định vị: nhà sách tuyển chọn, mỗi lựa chọn đều có lời giải thích.
- Chỉ làm light mode trong MVP.
- **Bìa sách không dùng ảnh bản quyền.** Toàn bộ bìa hiển thị — catalog, trang chi tiết, tủ sách — do `<BookCover>` sinh tự động theo nhận diện thương hiệu (màu, typography, bố cục), không lấy ảnh bìa thật từ nhà xuất bản và không hotlink ảnh từ nguồn khác. Đây là **quyết định sản phẩm chính thức**, không phải giải pháp tạm trong lúc chưa có ảnh thật — áp dụng cho mọi giai đoạn, kể cả khi danh mục sách mở rộng sau này.

## 1. Design tokens

### 1.1 Tailwind v4

Đã xác nhận từ `package.json`: Next 16.3, React 19.2, Tailwind 4. Đặt khối `@theme` dưới đây vào `app/globals.css`. Không tạo file `tailwind.config.*`.

```css
@theme {
  --color-paper: #FBFAF7;      /* nền trang */
  --color-surface: #FFFFFF;    /* nền thẻ, header */
  --color-line: #E4E2DC;       /* border hairline */
  --color-ink-900: #1A1C2E;    /* chữ chính */
  --color-ink-600: #4A4E66;    /* chữ phụ */
  --color-ink-400: #6B6F85;    /* metadata: tác giả, giá gốc */
  --color-cham-700: #26306B;   /* màu thương hiệu: nút chính, link, header phụ */
  --color-cham-600: #3A4585;   /* hover */
  --color-cham-50: #EEF0F7;    /* nền tint: tab đang chọn, section nổi bật */
  --color-nghe-400: #D9A33A;   /* CHỈ badge giảm giá + số đếm giỏ hàng */
  --color-sale: #C2362B;       /* giá bán khi có giảm giá */
  --color-danger: #C2362B;     /* lỗi form, cảnh báo */
  --color-success: #2E7D4F;    /* thông báo thành công */

  --font-sans: var(--font-be-vietnam-pro), system-ui, sans-serif;
  --font-serif: var(--font-lora), Georgia, serif;

  --radius-card: 4px;
  --radius-control: 6px;
}
```

### 1.2 Quy tắc dùng màu (bắt buộc)

- `nghe-400` **không bao giờ** dùng làm màu chữ trên nền sáng (không đạt độ tương phản). Chỉ dùng làm nền, và chữ trên nền này luôn là `ink-900`.
- Giá: có `discount_price` thì giá thực tế hiển thị màu `sale`, giá gốc màu `ink-400` gạch ngang, kèm badge `-X%` (nền `nghe-400`, chữ `ink-900`). Không có `discount_price` thì giá hiển thị màu `ink-900`.
- Nút chính: nền `cham-700`, chữ trắng, hover `cham-600`. Nút phụ: viền `cham-700`, chữ `cham-700`.
- Không dùng gradient, không dùng shadow đậm. Được phép dùng shadow rất nhẹ khi hover thẻ sách.

### 1.3 Font

Khai báo trong `app/layout.tsx` bằng `next/font/google`:

```ts
import { Be_Vietnam_Pro, Lora } from 'next/font/google';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600'],
  variable: '--font-lora',
  display: 'swap',
});
// Gắn `${beVietnamPro.variable} ${lora.variable}` vào <html>, body dùng font-sans, nền bg-paper, chữ text-ink-900.
```

Subset `vietnamese` là bắt buộc; thiếu subset này chữ có dấu sẽ rơi về font dự phòng.

### 1.4 Typography

- **Serif (Lora)** chỉ dùng cho chữ **≥ 18px**: tiêu đề hero, tên sách ở trang chi tiết (28–32px), tiêu đề tủ sách.
- **Sans (Be Vietnam Pro)** cho mọi thứ còn lại, **kể cả tên sách trên thẻ sách**.
- Chữ nội dung tối thiểu 14px (mobile và desktop). Metadata tối thiểu 12px.
- Hệ khoảng cách: bội số của 4px.

## 2. Quy ước cấu trúc (giữ theo chuẩn, không sáng tạo)

- **Header** (sticky khi cuộn): logo bên trái, ô tìm kiếm rộng ở giữa (placeholder "Tìm tên sách, tác giả…"), bên phải là các icon Yêu thích, Tài khoản, Giỏ hàng. Mọi icon đều có nhãn chữ trên desktop và `aria-label` trên mobile. Số đếm giỏ hàng là badge `nghe-400`.
- **Thanh điều hướng** dưới header: nút "Danh mục" mở mega-menu, tiếp theo là link nhanh: Sách mới, Bán chạy, Tủ sách.
- **Thẻ sách:** ảnh bìa (tỷ lệ 2:3) → tên sách (tối đa 2 dòng, cắt bằng "…") → tác giả → khối giá (theo mục 1.2). Không có đánh giá sao.
- **Trang chi tiết:** giữ đúng thứ tự thông tin trong FR-2.1. Hai nút "Thêm vào giỏ hàng" (nút phụ) và "Mua ngay" (nút chính), có bộ chọn số lượng đi kèm.
- **Hết hàng** (`stock_quantity = 0`): luôn có **nhãn chữ** "Hết hàng". Không được chỉ làm mờ ảnh bìa. Nút mua bị vô hiệu hóa (FR-2.2).
- **Trang chủ:** hero (mục 4.3) → khối tab "Sách mới / Bán chạy" (dùng lại logic sắp xếp FR-1.6/FR-1.7, 8 sách mỗi tab) → danh sách tủ sách → footer.
- Mobile-first, breakpoint tối thiểu 375px.

**Không làm** (ngoài scope hoặc trái nguyên tắc):
- Đánh giá sao.
- Nhãn "Sắp hết hàng".
- Popup voucher.
- Đồng hồ đếm ngược.
- Banner carousel nhiều slide.

## 3. Accessibility (NFR mới, nhóm 6.6)

- **NFR-6.1:** Độ tương phản chữ đạt WCAG 2.1 AA (≥ 4.5:1 với chữ thường, ≥ 3:1 với chữ ≥ 18px).
- **NFR-6.2:** Vùng chạm tối thiểu 44×44px trên mobile.
- **NFR-6.3:** Mọi phần tử tương tác có focus state nhìn thấy được (ring `cham-600`, 2px) và điều hướng được bằng bàn phím, kể cả mega-menu và tab.
- **NFR-6.4:** Ảnh bìa có `alt` = tên sách. Icon trang trí có `aria-hidden`.
- **NFR-6.5:** Không truyền đạt thông tin chỉ bằng màu (trạng thái hết hàng, lỗi form, tab đang chọn đều phải có tín hiệu chữ hoặc hình dạng).
- **NFR-6.6:** Chữ nội dung ≥ 14px.

## 4. Thay đổi dữ liệu

### 4.1 Migration mới

- Tạo file migration mới trong `supabase/migrations/`. Không sửa các migration cũ đã chạy.
- Database đã có 4 migration: `init_schema`, `restrict_trigger_function_execute`, `restrict_trigger_function_execute_v2`, `perf_fixes`. Kiểm tra xem 4 migration này có đủ file tương ứng trong repo không. Nếu thiếu, báo tôi.
- Máy của tôi **không có Supabase CLI**. Hãy apply migration bằng cùng cách đã dùng cho 4 migration trước (Supabase MCP), và giữ file SQL trong repo khớp đúng nội dung đã apply.

```sql
-- Thứ tự hiển thị danh mục trong mega-menu
alter table public.categories
  add column if not exists sort_order int not null default 0;

-- Tủ sách tuyển chọn
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,          -- lời giới thiệu của biên tập
  cover_image_url text,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Tối đa 1 tủ sách được chọn làm hero
create unique index collections_one_featured
  on public.collections (is_featured) where is_featured;

create table public.collection_books (
  collection_id uuid not null references public.collections(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  position int not null default 0,
  curator_note text not null,         -- 1–2 câu: vì sao cuốn này có mặt trong tủ
  primary key (collection_id, book_id)
);

create index collection_books_book_id_idx on public.collection_books (book_id);

alter table public.collections enable row level security;
alter table public.collection_books enable row level security;

create policy "collections_select_public"
  on public.collections for select to anon, authenticated using (true);
create policy "collections_admin_insert"
  on public.collections for insert to authenticated with check (public.is_admin());
create policy "collections_admin_update"
  on public.collections for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "collections_admin_delete"
  on public.collections for delete to authenticated using (public.is_admin());

create policy "collection_books_select_public"
  on public.collection_books for select to anon, authenticated using (true);
create policy "collection_books_admin_insert"
  on public.collection_books for insert to authenticated with check (public.is_admin());
create policy "collection_books_admin_update"
  on public.collection_books for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "collection_books_admin_delete"
  on public.collection_books for delete to authenticated using (public.is_admin());
-- Mirror đúng pattern categories_* đang có trong DB (dùng hàm is_admin() sẵn có).
```

**Quy tắc bắt buộc:** mọi thay đổi schema đều phải đi qua file trong `supabase/migrations/`. Không sửa trực tiếp trên Table Editor. Project Supabase hiện chỉ có nhánh `main` (production), nên nếu sửa tay trên dashboard, schema trong repo và schema trong database sẽ lệch nhau.

### 4.2 Seed danh mục (thay bộ cũ)

Cấu trúc 2 cấp (cha có `parent_id = null`). Slug viết không dấu, dạng kebab-case. `sort_order` theo đúng thứ tự dưới đây.

1. **Văn học** (`van-hoc`)
   - Tiểu thuyết
   - Truyện ngắn – Tản văn
   - Trinh thám – Kinh dị
   - Kỳ ảo – Khoa học viễn tưởng
   - Văn học Việt Nam
2. **Kinh tế** (`kinh-te`)
   - Quản trị – Lãnh đạo
   - Marketing – Bán hàng
   - Tài chính – Đầu tư
   - Khởi nghiệp
3. **Tâm lý – Kỹ năng** (`tam-ly-ky-nang`)
   - Tâm lý học
   - Kỹ năng sống
   - Sức khỏe – Chữa lành
4. **Khoa học – Xã hội** (`khoa-hoc-xa-hoi`)
   - Khoa học phổ thông
   - Lịch sử
   - Triết học
5. **Manga – Light novel** (`manga-light-novel`)
   - Manga
   - Light novel

Không có danh mục Thiếu nhi (ngoài nhóm người dùng mục tiêu).

**Nếu `books` đã được seed** và tham chiếu tới danh mục cũ: DỪNG LẠI, liệt kê danh mục cũ đang được dùng và đề xuất bảng ánh xạ cũ → mới cho tôi duyệt. Không xóa trước khi tôi duyệt.

### 4.2b Seed sách (bắt buộc — database hiện đang trống)

Trạng thái ngày 22/09: `books`, `categories`, `profiles`, `orders` đều có 0 dòng. Phải seed sách **sau** danh mục và **trước** tủ sách.

**Danh sách 40 cuốn (đã chốt)**

Danh sách được chọn bằng cách đối chiếu bảng bán chạy của Fahasa (2026), danh sách bán chạy của Nhã Nam, và các trang Alpha Books, IPM. Seed đúng tên sách và tác giả như dưới đây. Mỗi cuốn gắn vào danh mục con ghi trong ngoặc. Không tự thay sách khác; nếu thấy tên hoặc tác giả nào sai, báo tôi.

**Văn học (10)**
1. Nhà giả kim — Paulo Coelho (Tiểu thuyết)
2. Cây cam ngọt của tôi — José Mauro de Vasconcelos (Tiểu thuyết)
3. Rừng Na Uy — Haruki Murakami (Tiểu thuyết)
4. Hồ Điệp và Kình Ngư — Tuế Kiến (Tiểu thuyết)
5. Xứ tuyết — Kawabata Yasunari (Tiểu thuyết)
6. Phía sau nghi can X — Higashino Keigo (Trinh thám – Kinh dị)
7. Bạch dạ hành — Higashino Keigo (Trinh thám – Kinh dị)
8. Điều kỳ diệu của tiệm tạp hóa Namiya — Higashino Keigo (Kỳ ảo – Khoa học viễn tưởng)
9. Mắt biếc — Nguyễn Nhật Ánh (Văn học Việt Nam)
10. Tôi thấy hoa vàng trên cỏ xanh — Nguyễn Nhật Ánh (Văn học Việt Nam)

**Kinh tế (8)**
11. Kế toán vỉa hè — Darrell Mullis, Judith Orloff (Tài chính – Đầu tư)
12. Cha giàu cha nghèo — Robert T. Kiyosaki (Tài chính – Đầu tư)
13. Tâm lý học về tiền — Morgan Housel (Tài chính – Đầu tư)
14. Từ tốt đến vĩ đại — Jim Collins (Quản trị – Lãnh đạo)
15. Con bò tím — Seth Godin (Marketing – Bán hàng)
16. Bạn có thể đàm phán bất cứ điều gì — Herb Cohen (Marketing – Bán hàng)
17. Khởi nghiệp tinh gọn — Eric Ries (Khởi nghiệp)
18. Từ không đến một — Peter Thiel, Blake Masters (Khởi nghiệp)

**Tâm lý – Kỹ năng (8)**
19. Đắc nhân tâm — Dale Carnegie (Kỹ năng sống)
20. Thói quen nguyên tử — James Clear (Kỹ năng sống)
21. Tuổi trẻ đáng giá bao nhiêu — Rosie Nguyễn (Kỹ năng sống)
22. Con đường chẳng mấy ai đi — M. Scott Peck (Tâm lý học)
23. Tư duy nhanh và chậm — Daniel Kahneman (Tâm lý học)
24. Mindset – Tâm lý học thành công — Carol S. Dweck (Tâm lý học)
25. Phi lý trí — Dan Ariely (Tâm lý học)
26. Hiểu về trái tim — Minh Niệm (Sức khỏe – Chữa lành)

**Khoa học – Xã hội (7)**
27. Sapiens: Lược sử loài người — Yuval Noah Harari (Lịch sử)
28. Homo Deus: Lược sử tương lai — Yuval Noah Harari (Lịch sử)
29. Súng, vi trùng và thép — Jared Diamond (Lịch sử)
30. Lược sử thời gian — Stephen Hawking (Khoa học phổ thông)
31. Vũ trụ — Carl Sagan (Khoa học phổ thông)
32. Thế giới của Sophie — Jostein Gaarder (Triết học)
33. Suy tưởng — Marcus Aurelius (Triết học)

**Manga – Light novel (7)**
34. Dandadan – Tập 1 — Yukinobu Tatsu (Manga)
35. Thám tử lừng danh Conan – Tập 1 — Gosho Aoyama (Manga)
36. Spy x Family – Tập 1 — Endo Tatsuya (Manga)
37. Frieren – Pháp sư tiễn táng – Tập 1 — Yamada Kanehito, Abe Tsukasa (Manga)
38. Văn hào lưu lạc – Tập 1 — Asagiri Kafka, Harukawa Sango (Manga)
39. Horimiya – Tập 1 — HERO, Hagiwara Daisuke (Manga)
40. Overlord – Tập 6 — Maruyama Kugane (Light novel)

**Quy tắc cho các trường khác**
- `translator`: để `null` cho tất cả. Chúng ta không xác minh người dịch.
- `price`: đặt trong khoảng hợp lý với thể loại. Manga từ 25.000–45.000đ; sách thường từ 79.000–299.000đ.
- `slug`: viết không dấu, dạng kebab-case, lấy từ `title`.

**Trộn trạng thái để demo đủ các case UI**
- Khoảng 40% số sách có `discount_price` (giảm 10–30%).
- Đúng 4 cuốn có `stock_quantity = 0`.
- Số sách còn lại có `stock_quantity` từ 5 đến 50.
- `created_at` rải trong 90 ngày gần nhất, để sort "Mới nhất" có ý nghĩa.

**Tính trung thực của dữ liệu**
- `description`: tự viết 2–4 câu. **Không** chép nguyên văn lời giới thiệu của nhà xuất bản hay nhà sách.
- `isbn`, `page_count`, `dimensions`, `publish_date`, `publisher`: nếu không chắc chắn đúng thì để `null`. Không bịa số ISBN trông như thật.
- `table_of_contents`: để `null`, trừ 3–4 cuốn dùng để demo trang chi tiết.
- Thêm dòng nhỏ ở footer: "Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio."

**Ảnh bìa**
- Không dùng ảnh bìa thật và không hotlink ảnh từ website khác.
- Để `cover_image_url = null`.
- Tạo component `<BookCover>`: khi `cover_image_url` là null, render một bìa typographic gồm:
  - Nền màu lấy ổn định theo hash của `slug`, chọn từ bảng 8 màu trầm (tự chọn, tất cả phải đạt tương phản với chữ trắng).
  - Tên sách bằng serif.
  - Tên tác giả bằng sans.
  - Tỷ lệ 2:3.
- `alt` = tên sách.

### 4.3 Seed tủ sách

Tạo đúng 3 tủ sách dưới đây. Số trong ngoặc là số thứ tự sách ở mục 4.2b; thứ tự liệt kê chính là `position`.

1. **Hành trang năm đầu đi làm** (`hanh-trang-nam-dau-di-lam`)
   - `is_featured = true`, `sort_order = 1`.
   - Sách: Tâm lý học về tiền (13), Kế toán vỉa hè (11), Thói quen nguyên tử (20), Đắc nhân tâm (19), Bạn có thể đàm phán bất cứ điều gì (16), Tuổi trẻ đáng giá bao nhiêu (21).
2. **Văn học Nhật cho người mới bắt đầu** (`van-hoc-nhat-cho-nguoi-moi-bat-dau`)
   - `sort_order = 2`.
   - Sách: Điều kỳ diệu của tiệm tạp hóa Namiya (8), Phía sau nghi can X (6), Rừng Na Uy (3), Bạch dạ hành (7), Xứ tuyết (5).
3. **Hiểu mình trước khi hiểu đời** (`hieu-minh-truoc-khi-hieu-doi`)
   - `sort_order = 3`.
   - Sách: Hiểu về trái tim (26), Mindset (24), Con đường chẳng mấy ai đi (22), Phi lý trí (25), Tư duy nhanh và chậm (23), Thế giới của Sophie (32).
- `description` và `curator_note` viết theo giọng văn ở mục 6.
- Đánh dấu rõ trong file seed rằng đây là **nội dung nháp**, cần tôi duyệt lại.

## 5. Thay đổi frontend

1. **Mega-menu:** dựng từ cây `categories`, sắp xếp theo `sort_order`. Bấm vào danh mục cha thì lọc theo FR-1.4.
2. **Hero trang chủ:** lấy tủ sách có `is_featured = true`. Hiển thị:
   - Nhãn nhỏ "Tuyển chọn".
   - `title` (serif).
   - `description` (cắt ở 2 dòng).
   - 3–5 ảnh bìa đầu tiên theo `position`.
   - Nút "Xem tủ sách".
   - Không có tủ nào được featured thì ẩn hero, không báo lỗi.
3. **Route `/tu-sach`:** danh sách tất cả tủ sách, sắp xếp theo `sort_order`.
4. **Route `/tu-sach/[slug]`:** tiêu đề (serif), `description`, danh sách sách theo `position`. Dưới mỗi thẻ sách hiển thị `curator_note` (sans, 14px, `ink-600`). Slug không tồn tại thì trả về 404.
5. **Component dùng chung:**
   - `<Price>` theo mục 1.2.
   - `<BookCard>` theo mục 2.
   - `<StockLabel>` hiển thị nhãn chữ "Hết hàng".
   - Thay mọi chỗ đang tự render giá hoặc thẻ sách bằng các component này.
6. **Microcopy:** mọi thông báo lỗi và trạng thái trống viết theo mục 6.

## 6. Giọng văn

- NA Books tự xưng "NA Books" hoặc "chúng mình", gọi người dùng là "bạn".
- Câu ngắn, gần gũi. Không dùng teen-code. Không dùng dấu "!" liên tiếp. Không viết hoa toàn bộ.

**Ví dụ:**

- Hết hàng:
  > "Cuốn này tạm hết hàng rồi. Bạn xem thử sách cùng thể loại nhé."
- Vượt tồn kho (FR-3.6):
  > "Hiện chỉ còn {n} cuốn, chúng mình đã điều chỉnh số lượng giúp bạn."
- Giỏ hàng trống:
  > "Giỏ hàng của bạn đang trống. Ghé tủ sách tuyển chọn để tìm cuốn đầu tiên?"
- Sai mật khẩu:
  > "Email hoặc mật khẩu chưa đúng. Bạn thử lại nhé."

## 7. Hoàn thành khi

- [ ] Tokens và font đã áp dụng. Không còn mã màu hex viết cứng trong component.
- [ ] Migration chạy thành công. RLS đã bật trên 2 bảng mới.
- [ ] Seed theo đúng thứ tự: danh mục → 40 sách → 3 tủ sách mẫu.
- [ ] `<BookCover>` hiển thị bìa typographic khi không có ảnh bìa.
- [ ] Footer có dòng ghi chú về dữ liệu minh họa.
- [ ] Trang chủ, `/tu-sach`, `/tu-sach/[slug]` hoạt động. Hero ẩn đúng khi không có tủ nào được featured.
- [ ] Kiểm tra NFR-6.1 → 6.6 (ghi kết quả kiểm tra độ tương phản vào PR description).
- [ ] Báo cáo lại cho tôi: file nào đã sửa, file nào tạo mới, và những gì chưa làm được.

# Cập nhật SRS lên v1.1 — danh sách thay đổi

> Dành cho Claude Code. Áp dụng vào file SRS trong repo (`docs/SRS.md`).
> Nguyên tắc:
> - Chỉ sửa đúng những chỗ liệt kê dưới đây. Giữ nguyên văn phong, cách đánh số và định dạng của SRS.
> - Chỗ nào ghi "thay bằng" thì dùng **đúng nguyên văn**. Chỗ nào ghi "viết" thì soạn theo nội dung mô tả.
> - Không tự thêm yêu cầu mới.
>
> Căn cứ: `docs/specs/claude-code-brand-update.md`, `docs/specs/buoc-1-catalog-chi-tiet.md`, và trạng thái database thực tế.

---

## 0. Đầu tài liệu

Thay dòng ngày/tác giả bằng:

`Phiên bản 1.1 · 22/09/2026 · Soạn bởi Lê Minh Đức`

Ngay dưới dòng đó, thêm:

`Tài liệu liên quan: docs/specs/claude-code-brand-update.md (nhận diện thương hiệu), docs/specs/buoc-1-catalog-chi-tiet.md (triển khai bước 1), docs/mockups/ (mockup giao diện).`

---

## 1. Mục 1 – Giới thiệu, đoạn "Phạm vi"

Sau câu liệt kê 7 tính năng, thêm:

> Ngoài 7 tính năng Core, bản 1.1 bổ sung hai phần nhỏ phục vụ định vị sản phẩm và đo lường: **Tủ sách tuyển chọn** (mục 5.9) và **Ghi log sự kiện hành vi** (mục 5.8). Phần ghi log chỉ thu thập dữ liệu; Dashboard thống kê nâng cao dùng dữ liệu này vẫn nằm ngoài phạm vi tài liệu.

Thêm một đoạn mới ngay sau đoạn "Phạm vi":

> **Định vị.** Nhà sách tuyển chọn cho người đọc 18–30 tuổi; mỗi lựa chọn sách đều kèm lời giải thích của biên tập. Nguyên tắc thiết kế: "Quen ở cấu trúc, riêng ở chất liệu" — bố cục và luồng mua hàng theo quy ước của các website bán sách Việt Nam, khác biệt nằm ở nhận diện, nội dung tuyển chọn và giọng văn.

---

## 2. Mục 2 – Tổng quan hệ thống

**2a. Bảng Tech stack, dòng Frontend:** thay bằng `Next.js 16 (App Router) + React 19 + Tailwind CSS v4`.

**2b. Đoạn mở đầu "Database schema":** thay bằng:

> 9 bảng Postgres, tất cả đã bật Row Level Security (RLS). Bản 1.0 có 7 bảng; bản 1.1 bổ sung `collections` và `collection_books` (tủ sách tuyển chọn), cột `categories.sort_order` (thứ tự hiển thị menu), và dùng cột `events.metadata` (jsonb) cho ghi log sự kiện. Chi tiết cột xem `supabase/migrations/`.

**2c. Sơ đồ ERD (Mermaid):**

Thêm các quan hệ sau vào khối `erDiagram`:

```
    COLLECTIONS ||--o{ COLLECTION_BOOKS : contains
    BOOKS ||--o{ COLLECTION_BOOKS : "listed in"
```

Thêm vào khối `CATEGORIES`:

```
        int sort_order
```

Thêm vào khối `EVENTS`:

```
        jsonb metadata
```

Thêm hai khối mới:

```
    COLLECTIONS {
        uuid id PK
        string title
        string slug
        string description
        boolean is_featured
        int sort_order
    }
    COLLECTION_BOOKS {
        uuid collection_id FK
        uuid book_id FK
        int position
        string curator_note
    }
```

**2d. Câu ngay dưới sơ đồ** ("Bảng `events` chỉ phục vụ Dashboard…"): thay bằng:

> Bảng `events` nhận log sự kiện hành vi từ các tính năng Core (mục 5.8). Dashboard thống kê nâng cao đọc dữ liệu này và được đặc tả riêng.

---

## 3. Mục 3 – UML Use Case Diagram, sơ đồ A

Thêm use case và các cạnh sau vào khối Mermaid của sơ đồ A:

```
    UC15([Xem tủ sách tuyển chọn])
    G --> UC15
    C --> UC15
```

Sửa nhãn `UC1` thành: `Duyệt, tìm kiếm (tên sách/tác giả) và lọc sách`.

---

## 4. Mục 4 – User Stories

**4a.** Sửa câu mở đầu mục 4: "26 user story" → "29 user story", "7 tính năng Core" → "7 tính năng Core và phần Tủ sách tuyển chọn".

**4b. US-1.2:** thay bằng:

> **US-1.2** — Là khách vãng lai, tôi muốn tìm sách theo tên sách hoặc tác giả, kể cả khi gõ không dấu, để nhanh chóng tìm được cuốn sách đang cần.

**4c.** Thêm vào cuối mục 4.2:

> - **US-2.4** — Là khách vãng lai, tôi muốn biết cuốn sách đang xem nằm trong tủ sách tuyển chọn nào và vì sao nó được chọn, để có thêm lý do tin tưởng khi quyết định mua.

**4d.** Thêm mục mới **4.8 Tủ sách tuyển chọn** ngay sau mục 4.7:

> - **US-8.1** — Là khách vãng lai, tôi muốn xem các tủ sách tuyển chọn kèm lời giới thiệu để khám phá sách phù hợp mà không cần biết trước tên sách.
> - **US-8.2** — Là khách vãng lai, tôi muốn đọc lý do từng cuốn được đưa vào tủ sách để chọn cuốn hợp với mình nhất.

---

## 5. Mục 5 – Functional Requirements

**5a.** Sửa câu mở đầu mục 5: cập nhật lại số lượng yêu cầu cho khớp sau khi sửa (tự đếm lại).

**5b. FR-1.3:** thay bằng:

> **FR-1.3** — Tìm kiếm theo tên sách (`title`) **hoặc** tác giả (`author`), không phân biệt hoa/thường và **không phân biệt dấu tiếng Việt** (dùng extension `unaccent` qua hàm `f_unaccent`), khớp một phần chuỗi. Từ khóa được trim, tối đa 100 ký tự, escape ký tự `%` và `_`.

**5c. FR-1.7:** thay bằng:

> **FR-1.7** — "Bán chạy nhất" = `SUM(order_items.quantity)` nhóm theo `book_id`, chỉ tính đơn có `status != 'cancelled'`; sách chưa có đơn xếp cuối. Vì RLS không cho khách đọc đơn hàng của người khác, phép tính này chạy trong hàm `search_books` với `SECURITY DEFINER`; hàm chỉ trả về các cột công khai của sách.

**5d.** Thêm sau FR-1.10:

> - **FR-1.11** — Toàn bộ lọc, sắp xếp và phân trang được gói trong một hàm RPC `search_books(p_q, p_category_slug, p_min, p_max, p_sort, p_page)`. Mọi kiểu sắp xếp có tie-break `created_at desc, id` để phân trang ổn định. Page size cố định 20, không nhận từ client.
> - **FR-1.12** — Trang catalog dùng route `/sach`; mọi bộ lọc nằm trên URL (`q`, `category`, `min`, `max`, `sort`, `page`) để có thể chia sẻ link và nút Back hoạt động đúng.

**5e. FR-2.1:** đổi `/books/[slug]` thành `/sach/[slug]`. Thêm vào cuối câu:

> Các trường có giá trị `null` được ẩn hoàn toàn (không hiển thị "Đang cập nhật"). Trạng thái kho hiển thị bằng chữ: "Còn hàng" hoặc "Hết hàng".

**5f. FR-2.3:** thay bằng:

> **FR-2.3** — Hiển thị tối đa 4 sách liên quan: ưu tiên cùng danh mục con (`category_id`), loại trừ sách đang xem, mới nhất trước. Nếu chưa đủ 4 cuốn, lấy thêm từ các danh mục con khác cùng danh mục cha. Tiêu đề khối ghi tên danh mục thực tế đã dùng. Ẩn khối nếu không có sách nào.

**5g.** Thêm sau FR-2.5:

> - **FR-2.6** — Khối "Có trong tủ sách": liệt kê mọi tủ sách chứa cuốn đang xem, mỗi tủ gồm tên (link tới `/tu-sach/[slug]`) và `curator_note` của cuốn đó. Ẩn khối nếu sách không thuộc tủ nào.
> - **FR-2.7** — Trên mobile (< 768px), nút "Thêm vào giỏ" và "Mua ngay" nằm trong thanh dính ở đáy màn hình.

**5h.** Thêm mục mới **5.8 Ghi log sự kiện**, đặt ngay trước mục "Tóm tắt RLS":

> - **FR-8.1** — Hệ thống ghi sự kiện hành vi vào bảng `events` qua hàm `track(event_type, metadata)` phía client, theo kiểu fire-and-forget: không chặn giao diện, lỗi không hiển thị cho người dùng.
> - **FR-8.2** — Mỗi sự kiện có `session_id` (UUID ẩn danh lưu trong `localStorage`) và `user_id` (null nếu chưa đăng nhập).
> - **FR-8.3** — Các loại sự kiện hợp lệ: `page_view`, `search`, `add_to_cart`, `checkout_started`, `order_placed` (ràng buộc CHECK ở database).
> - **FR-8.4** — `page_view` được ghi khi mở trang chi tiết sách (`metadata`: `book_id`, `slug`). `search` được ghi khi trang catalog có từ khóa (`metadata`: `q`, `results_count`, `category`, `sort`), kể cả khi không có kết quả. `add_to_cart`, `checkout_started`, `order_placed` được ghi ở các tính năng Giỏ hàng và Checkout.
> - **FR-8.5** — `metadata` không chứa dữ liệu cá nhân (email, tên, địa chỉ, số điện thoại) và tối đa 2KB.
> - **FR-8.6** — RLS: ai cũng được `INSERT`, nhưng chỉ với `user_id` là null hoặc bằng `auth.uid()`. Chỉ Admin được `SELECT`.

**5i.** Thêm mục mới **5.9 Tủ sách tuyển chọn**, ngay sau 5.8:

> - **FR-9.1** — Tủ sách gồm tên, slug, lời giới thiệu của biên tập (`description`), thứ tự hiển thị, và danh sách sách có thứ tự (`position`). Mỗi sách trong tủ có lời giải thích riêng (`curator_note`).
> - **FR-9.2** — Tối đa một tủ sách được đánh dấu nổi bật (`is_featured`), ràng buộc bằng unique index. Tủ này hiển thị ở hero trang chủ. Không có tủ nổi bật thì ẩn hero, không báo lỗi.
> - **FR-9.3** — `/tu-sach` liệt kê mọi tủ sách; `/tu-sach/[slug]` hiển thị lời giới thiệu và danh sách sách kèm `curator_note`. Slug không tồn tại thì trả về trang 404.
> - **FR-9.4** — Trong phạm vi MVP, tủ sách không có giao diện quản lý; dữ liệu được seed sẵn và chỉnh qua Supabase Dashboard. RLS: `SELECT` công khai, ghi chỉ Admin.

**5j.** Đổi số mục "Tóm tắt RLS theo bảng" thành **5.10** và cập nhật bảng:

- Dòng `categories`, cột Admin: thay bằng `SELECT/INSERT/UPDATE/DELETE toàn bộ`.
- Thêm dòng `collections`: Khách vãng lai `SELECT toàn bộ`; Khách hàng `SELECT toàn bộ`; Admin `SELECT/INSERT/UPDATE/DELETE toàn bộ`.
- Thêm dòng `collection_books`: giống `collections`.
- Thêm dòng `events`: Khách vãng lai `INSERT (user_id null)`; Khách hàng `INSERT (user_id = của mình hoặc null)`; Admin `SELECT toàn bộ`.
- Xóa ghi chú in nghiêng "(Bảng `events` không đưa vào tóm tắt này…)".

**5k. FR-7.6:** thêm vào cuối câu:

> RLS vẫn cho phép Admin ghi (xem mục 5.10) để sẵn sàng khi có giao diện quản lý sau này.

---

## 6. Mục 6 – Non-functional Requirements

**6a.** Sửa câu mở đầu: "15 yêu cầu … 5 nhóm" → đếm lại số yêu cầu, "6 nhóm".

**6b. NFR-2.1:** thay "Toàn bộ 7 bảng" bằng "Toàn bộ bảng trong schema `public`".

**6c. NFR-4.2:** thay bằng:

> **NFR-4.2** — Mọi thay đổi schema đi qua file migration trong `supabase/migrations/`, không sửa trực tiếp qua Table Editor, để schema trong repo và trong database luôn khớp nhau.

**6d.** Thêm **NFR-3.4**:

> **NFR-3.4** — Mọi chữ hiển thị viết bằng tiếng Việt theo giọng văn thống nhất: NA Books xưng "chúng mình", gọi người dùng là "bạn"; không dùng teen-code, không lạm dụng dấu "!".

**6e.** Thêm mục mới **6.6 Khả năng tiếp cận (Accessibility)**:

> - **NFR-6.1** — Độ tương phản chữ đạt WCAG 2.1 AA (≥ 4.5:1 với chữ thường, ≥ 3:1 với chữ ≥ 18px).
> - **NFR-6.2** — Vùng chạm tối thiểu 44×44px trên mobile.
> - **NFR-6.3** — Mọi phần tử tương tác có focus state nhìn thấy được và điều hướng được bằng bàn phím.
> - **NFR-6.4** — Ảnh bìa có `alt` là tên sách; icon trang trí có `aria-hidden`.
> - **NFR-6.5** — Không truyền đạt thông tin chỉ bằng màu sắc.
> - **NFR-6.6** — Chữ nội dung tối thiểu 14px.

---

## 7. Mục mới cuối tài liệu – Lịch sử thay đổi

Thêm mục mới **7. Lịch sử thay đổi**, gồm một bảng 3 cột (Phiên bản | Ngày | Nội dung) với 2 dòng:

| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 1.0 | 21/09/2026 | Bản đầu: 7 tính năng Core. |
| 1.1 | 22/09/2026 | Tìm kiếm theo tác giả, không dấu (FR-1.3); RPC `search_books` (FR-1.11); route `/sach` (FR-1.12, FR-2.1); sách liên quan có phương án dự phòng (FR-2.3); khối "Có trong tủ sách" (FR-2.6); thanh mua hàng dính đáy trên mobile (FR-2.7); ghi log sự kiện (5.8); tủ sách tuyển chọn (5.9); schema 9 bảng; NFR giọng văn (NFR-3.4) và accessibility (6.6). |

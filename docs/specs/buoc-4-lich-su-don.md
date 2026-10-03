# Đợt 4 — Lịch sử đơn hàng

Phiên bản 1.0 · 03/10/2026 · Thay trang tạm `/tai-khoan/don-hang` bằng danh sách và chi tiết đơn thật; khách tự hủy đơn đang chờ xử lý qua hàm `cancel_order`.
Nhánh: chưa tạo. Hai chặng, mỗi chặng một PR (mục 0.1).

Tài liệu tham chiếu, KHÔNG chép lại nội dung vào đây:
- `docs/SRS.md` mục 5.6 (FR-6.1→6.5), 5.10 (RLS), 4.6 (US-6.1→6.3), NFR-3.3, NFR-6.1→6.6. SRS được lên bản 1.7 ở cùng đợt (commit riêng).
- `docs/trang-quyet-dinh-dac-ta-tong.md` mục 3 (hệ layout đóng băng, danh sách là một mặt phẳng trắng, trạng thái trống đủ bốn phần, thông báo quan trọng không tự tắt, giọng văn), mục 4 (định nghĩa "xong", bước 5), mục 5.1.
- `docs/specs/buoc-3b-checkout.md`: `place_order` (FR-3B.19→3B.22: một transaction, trừ kho có điều kiện theo thứ tự `book_id`, mã lỗi, `set search_path = ''`), `mark_confirmation_sent` (FR-3B.28), trang xác nhận (FR-3B.26, FR-3B.29), mục 7.1 (hạn chế HTTP 200 của `notFound()` trong `<Suspense>`).
- `docs/specs/claude-code-brand-update.md` mục 6 (giọng văn).

**Đánh số.** Mọi yêu cầu của đợt này dùng tiền tố `FR-B4.x`, không dùng `FR-4.x` vì SRS đã dùng số đó cho checkout. Đối ứng sang SRS: B4.1 ↔ FR-6.1; B4.2 ↔ FR-6.2; B4.3 ↔ FR-6.3, FR-6.4; B4.4 ↔ NFR-3.3; B4.5 ↔ FR-6.1, FR-6.2 (cột trạng thái); B4.6 không có FR trong SRS (sửa liên kết đang 404); B4.7 ↔ FR-6.5.

## 0. Ranh giới đợt

Trong phạm vi:
- Danh sách đơn (FR-B4.1), trang chi tiết dùng chung khối tóm tắt với trang xác nhận (FR-B4.2), hủy đơn qua hàm `cancel_order` (FR-B4.3) với xác nhận ngay trong trang (FR-B4.4), chip trạng thái (FR-B4.5), `/tai-khoan` chuyển hướng (FR-B4.6), RLS không đổi (FR-B4.7).
- Tách bốn thứ đang là bản sao cục bộ thành thành phần dùng chung (mục 6): khối tóm tắt đơn, chip và nhãn trạng thái, trạng thái trống, tiêu đề trang. Lý do ở FR-B4.1 và FR-B4.2.
- **Đúng một migration:** hàm `cancel_order`. Không thêm cột, bảng, policy, trigger; không đổi CHECK nào.

Ngoài phạm vi, không làm trong đợt này:
- Phân trang · lọc hoặc tìm theo trạng thái · nút mua lại · ô lý do hủy · email báo hủy đơn · hóa đơn PDF · dòng thời gian vận chuyển.
- Trang hồ sơ `/tai-khoan` (đợt 2D).
- Admin đổi trạng thái và admin hủy đơn (đợt admin); xem mục 4.1 về đường hủy của Admin.
- Sự kiện `order_cancelled`: CHECK của `events.event_type` hiện có 7 giá trị (đo 03/10/2026), thêm loại mới là sửa CHECK; để dành đợt dashboard.
- Spec ghi nhận thêm, cũng không làm: cột `cancelled_at` (`orders` không có; ngày hiển thị luôn là ngày đặt); hợp nhất các bản sao cục bộ `cardClass` (ở 2 file) và `primaryButtonClass` (ở 4 file) — đếm bằng `grep` ngày 03/10/2026; đổi nhãn "Hồ sơ của bạn" ở menu tài khoản (mục 4.1).

### 0.1 Chia chặng

Theo cách đã làm ở đợt 3B (đợt có cả tầng dữ liệu lẫn giao diện):
- **Chặng 1 — dữ liệu.** Migration `cancel_order` (FR-B4.3, FR-B4.7); kiểm TC-6 → TC-10 bằng SQL/RPC trực tiếp trên stack cục bộ (Docker chỉ mở khi prompt nói rõ). Xong thì báo cáo và mở PR. Áp lên hosted chỉ sau khi chủ dự án đồng ý; không merge khi chưa được nói.
- **Chặng 2 — giao diện.** FR-B4.1, B4.2, B4.4, B4.5, B4.6 và Server Action `cancelOrder`; kiểm TC-1 → TC-5 và TC-11 → TC-17. PR xếp chồng lên chặng 1 nếu chặng 1 chưa merge.

## 1. Danh sách và chi tiết

- **FR-B4.1** — Thay trang tạm `/tai-khoan/don-hang` bằng danh sách thật. Server Component động, **không** `"use cache"`.
  - Mỗi dòng: mã đơn, ngày đặt (giờ Việt Nam), tổng tiền, chip trạng thái. Mới nhất trước. Cả danh sách là **một mặt phẳng trắng**, các dòng ngăn bằng kẻ 1px — không phải mỗi đơn một thẻ nổi. Mẫu có sẵn để dùng lại: `app/gio-hang/page.tsx` dòng 97 (`<ul>` với `rounded-menu border border-line-warm bg-surface divide-y divide-menu-sep`).
  - Hiển thị tối đa 50 đơn gần nhất; nhiều hơn thì thêm một dòng nói rõ đang hiển thị 50 đơn gần nhất. Không phân trang. Truy vấn lấy tổng bằng `count: "exact"` kèm `.limit(50)`, nên dòng ghi chú nêu được tổng số ("Đang hiển thị 50 đơn gần nhất trong N đơn của bạn.") và số đếm ở tiêu đề trang luôn đúng. Đúng 50 đơn thì KHÔNG có dòng ghi chú.
  - **Cấu trúc trang.** Vỏ trang (tiêu đề, khung) tĩnh; phần đọc phiên và đơn nằm trong `<Suspense>` có fallback `aria-busy`, vì Cache Components đang bật và chỗ nào đọc cookie phải nằm trong `<Suspense>` (xem file quyết định mục 5.1). `metadata`: title "Đơn hàng của tôi — NA Books", `robots: { index: false }`.
  - **Danh tính.** `createClient()` (client server) rồi `getClaims()`, như trang xác nhận đơn; không có phiên thì `redirect()` tới `/dang-nhap?next=/tai-khoan/don-hang` (lớp bảo vệ thứ hai; lớp thứ nhất là `proxy.ts`, theo "nguyên tắc hai lớp" ở đầu file đó). Truy vấn lọc **tường minh** `.eq("user_id", userId)` ngoài RLS: admin đọc được mọi đơn qua policy `orders_select_own_or_admin`, nên bộ lọc này là thứ giữ cho admin chỉ thấy đơn của chính mình.
  - **Truy vấn:** cột `order_code, status, total_amount, created_at`; sắp `created_at` giảm dần với `nullsFirst: false` rồi `order_code` giảm dần. Hai chi tiết này có lý do đo được: `orders.created_at` cho phép NULL (`nullable = YES`, đo 03/10/2026; hiện 0/2 dòng NULL) và Postgres xếp NULL lên đầu khi sắp giảm dần; còn `order_code` giải quyết hai đơn trùng giây. Chỉ mục: chỉ có `orders_user_id_idx`; không thêm chỉ mục mới — số đơn mỗi tài khoản nhỏ và chưa đo trên dữ liệu lớn (ghi ở mục 8).
  - **Ngày:** `dd/MM/yyyy HH:mm`, 24 giờ, múi giờ `Asia/Ho_Chi_Minh`. Repo chưa có hàm định dạng ngày nào (`grep` `DateTimeFormat`/`toLocaleDateString`: 0 kết quả, 03/10/2026), nên thêm một hàm dùng `Intl.DateTimeFormat` với `formatToParts` để ghép đúng thứ tự, không phụ thuộc thứ tự ngày/giờ mặc định của locale.
  - **Mỗi dòng là một liên kết** tới `/tai-khoan/don-hang/[order_code]`, cao tối thiểu 44px (NFR-6.2); từ 390px xếp hai dòng (mã đơn + chip; ngày + tổng tiền).
  - Chưa có đơn nào thì dùng **trạng thái trống bốn phần** của hệ layout (hình vẽ nét 76px, tiêu đề, đoạn giải thích tối đa 460px, hai nút): tiêu đề "Bạn chưa có đơn hàng nào"; đoạn giải thích đại ý đơn đầu tiên sẽ nằm ở đây để bạn theo dõi và, nếu đổi ý khi đơn còn chờ xử lý, hủy ngay tại đây; hai nút "Xem tất cả sách" (`/sach`) và "Khám phá tủ sách" (`/tu-sach`), như trạng thái trống của giỏ hàng.
  - **Hiện trạng cần tách:** trạng thái trống và tiêu đề trang (vạch chàm 3px + Newsreader + số đếm) hiện là hàm cục bộ `EmptyCart` và `PageTitle` trong `app/gio-hang/page.tsx` (dòng 257 và 38), **chưa phải thành phần dùng chung**. File quyết định mục 3 quy định "trang nào cần thành phần chưa có thì thêm vào hệ trước, rồi mới dùng", nên đợt này tách chúng ra `components/` và để `/gio-hang` import lại, không chép lần thứ hai. Hồi quy: TC-17.
  - Hook kiểm thử: `data-testid="order-list"` (phần tử `<ul>`), `order-row` (mỗi `<li>`), `order-list-limit-note` (dòng ghi chú 50 đơn).

- **FR-B4.2** — Trang chi tiết `/tai-khoan/don-hang/[order_code]`.
  - **Khối tóm tắt đơn** (danh sách sách với `quantity` và `price_at_purchase`, địa chỉ giao hàng đã đóng băng, phương thức thanh toán, tổng tiền, trạng thái) là **MỘT thành phần dùng chung** với `/thanh-toan/hoan-tat/[order_code]`; hai route chỉ là lớp mỏng bọc ngoài.
  - **Hiện trạng cần tách:** khối này hiện dựng thẳng trong hàm `Confirmation` của `app/thanh-toan/hoan-tat/[order_code]/page.tsx` (dòng 106–162, `<section aria-label="Chi tiết đơn hàng">`), cùng `STATUS_LABELS` (dòng 26) và chip trạng thái (một `<span>`, dòng 112) đều cục bộ trong file đó. `components/checkout/OrderLines.tsx` KHÔNG dùng lại được: nó phục vụ tóm tắt giỏ ở form thanh toán và có hình dạng dữ liệu khác. Đợt này tách khối tóm tắt, chip và nhãn trạng thái ra dùng chung.
  - **Quyền xem đơn một nơi.** Truy vấn đơn (cột, `order_items(…books(…))` và bộ lọc `.eq("order_code", …).eq("user_id", …)`) nằm trong một hàm dùng chung cho cả hai route, vì bộ lọc theo `user_id` là hàng rào thật chống admin xem nhầm và chống đọc đơn người khác; hai bản chép là hai chỗ có thể lệch nhau.
  - **Trang xác nhận** giữ phần chào mừng và dòng về email (FR-3B.29); nút "Xem đơn hàng của bạn" vẫn trỏ `/tai-khoan/don-hang` (danh sách). **Trang lịch sử** có: liên kết quay lại danh sách, tiêu đề trang "Chi tiết đơn hàng", dòng "Đặt lúc `dd/MM/yyyy HH:mm`", khối tóm tắt dùng chung, rồi vùng hủy đơn (FR-B4.4) khi `pending`. Dòng "Đặt lúc" và vùng hủy nằm NGOÀI khối dùng chung, để khối dùng chung giống hệt nhau ở hai route (TC-12).
  - **Không phải chủ đơn → 404**, giống hệt khi mã không tồn tại hoặc sai định dạng `^NA-\d{4}-\d{4,}$`: người khác không phân biệt được "đơn của người khác" với "không có đơn này" (TC-5). Cùng cơ chế `notFound()` trong `<Suspense>` như trang xác nhận nên mang cùng hạn chế mã HTTP (mục 4.1).
  - Hook kiểm thử: `data-testid="order-summary"` trên chính phần tử `<section>` của khối dùng chung.

- **FR-B4.5** — Chip trạng thái cho đúng **5 giá trị** của CHECK `orders_status_check` (đo 03/10/2026: `pending`, `processing`, `shipped`, `completed`, `cancelled`), nhãn tiếng Việt: `pending` "Chờ xử lý", `processing` "Đang xử lý", `shipped` "Đang giao", `completed` "Hoàn tất", `cancelled` "Đã hủy".
  - Dùng lại kiểu chip đã có ở trang xác nhận (`rounded-field border border-cham-700 bg-cham-active px-3 py-1 text-body-sm font-medium text-cham-700`), **một kiểu cho cả năm trạng thái**, chỉ dùng token màu sẵn có; không thêm biến thể màu theo trạng thái ở đợt này. Không truyền đạt trạng thái chỉ bằng màu (NFR-6.5) — chữ luôn có; vì cả năm chip cùng màu nên trạng thái được phân biệt bằng chữ, đúng yêu cầu.
  - Một giá trị ngoài năm giá trị trên (không thể xảy ra nhờ CHECK) hiện nguyên giá trị, như mã hiện tại (`STATUS_LABELS[status] ?? status`).
  - Hook kiểm thử: `data-testid="order-status-chip"`.

- **FR-B4.6** — `/tai-khoan` hiện 404 (không có `app/tai-khoan/page.tsx`; đo 03/10/2026), nhưng menu tài khoản có hai liên kết tới nó (`components/AccountMenu.tsx`, nhãn "Hồ sơ của bạn", bản desktop dòng 130 và bản mobile dòng 183). Đợt này cho nó chuyển hướng sang `/tai-khoan/don-hang`.
  - **Cơ chế:** một mục `redirects()` trong `next.config.ts`, `source: "/tai-khoan"` (đúng đường dẫn đó, không `:path*`), `permanent: false` (307). Lý do: `redirects` của `next.config` chạy **trước** `proxy` (tài liệu Next đi kèm, `proxy.md` mục "Execution order": `headers` → `redirects` → Proxy), nên không cần đọc phiên, và tránh hạn chế mã HTTP 200 của `redirect()` trong `<Suspense>` (mục 4.1). Người chưa đăng nhập vì thế đi `/tai-khoan` → `/tai-khoan/don-hang` → `proxy` → `/dang-nhap?next=…`; kết quả được đo ở TC-2, không suy ra từ tài liệu.
  - **Một dòng ghi chú ngay cạnh mục đó trong `next.config.ts`:** khi đợt 2D dựng trang hồ sơ thì bỏ chuyển hướng này.
  - Hệ quả đã biết: từ khi chuyển hướng có hiệu lực, "Hồ sơ của bạn" mở ra danh sách đơn (mục 4.1).

## 2. Hủy đơn

- **FR-B4.3** — Hủy đơn qua hàm `cancel_order(p_order_code text)`, `SECURITY DEFINER`, `set search_path = ''`, `REVOKE EXECUTE … FROM public, anon`, `GRANT EXECUTE … TO authenticated` — cùng khuôn `place_order` và `mark_confirmation_sent` (`supabase/migrations/20261002160851_checkout_3b_schema.sql`). Mọi hàm hiện có đều đặt `search_path` rỗng: 12 chỗ trong 6 file migration (9 chỗ viết `= ''`, 3 chỗ viết `to ''`; đếm 03/10/2026).
  - **Trong một transaction**, theo thứ tự:
    1. `auth.uid()` rỗng → `raise exception 'KHONG_DANG_NHAP'`.
    2. Đọc đơn có `order_code = p_order_code` **và** `user_id = auth.uid()` bằng `SELECT … FOR UPDATE`. Không có dòng nào → `raise exception 'DON_KHONG_TON_TAI'`. Đơn của người khác và mã không tồn tại cho **cùng một lỗi** (thông báo và `detail` y hệt), nên hàm không tiết lộ đơn đó có tồn tại hay không.
    3. `status` khác `'pending'` → `raise exception 'DON_KHONG_HUY_DUOC' using detail = <status hiện tại>`.
    4. Đặt `status = 'cancelled'`.
    5. Với từng dòng `order_items` của đơn, **theo thứ tự `book_id`** (kèm `id` để ổn định): cộng trả `stock_quantity` đúng bằng `quantity`, dùng `coalesce(stock_quantity, 0) + quantity` vì `books.stock_quantity` cho phép NULL (đo 03/10/2026: nullable = YES, 0/40 dòng NULL; `place_order` coi tồn NULL là hết hàng nên chưa bao giờ trừ). Không có sách để cộng thì `raise exception` làm hỏng cả giao dịch; trường hợp này không xảy ra nhờ khoá ngoại `order_items_book_id_fkey` (không `ON DELETE`, nên sách đang được đơn tham chiếu không xoá được), giữ lại để một lỗi dữ liệu không làm mất kho âm thầm.
  - **Hàm KHÔNG được chạm** vào `confirmation_email_sent_at`, `total_amount`, `shipping_address` hay bất kỳ cột nào khác của `orders`: câu `UPDATE` trên `orders` chỉ có đúng cột `status`; trên `books` chỉ có cột `stock_quantity`; không đụng `order_items`. TC-6 đo điều này bằng so sánh cả dòng, không chỉ ba cột được nêu.
  - **Kiểu trả về:** `void` (Server Action chỉ cần biết thành công hay lỗi). Mã lỗi theo quy ước của `place_order`: `message` là mã viết hoa không dấu, thông tin kèm theo đặt ở `detail`.
  - **Thứ tự khoá và deadlock.** Hàm khoá dòng `orders` của đơn rồi mới cộng kho theo `book_id` tăng dần. `place_order` khoá các dòng `books` theo `book_id` tăng dần rồi chỉ **chèn** dòng `orders` mới, không khoá dòng `orders` nào đang tồn tại; `mark_confirmation_sent` chỉ khoá dòng `orders` trong transaction riêng. Hai lời gọi hủy hai đơn khác nhau cùng có sách A và B cũng khoá `books` theo cùng thứ tự `book_id`, nên không thể đợi nhau theo vòng — cùng lý do đã ghi ở FR-3B.21.
  - **Không cần cơ chế idempotency riêng — với một điều kiện nêu rõ.** Lời gọi hủy lần hai (bấm đúp, hai tab, thử lại sau lỗi mạng) không cộng trả kho lần nữa vì nó chỉ đi tiếp khi đơn còn `pending`, mà đơn đã hủy thì không còn `pending`. Điều kiện: kiểm trạng thái và ghi trạng thái phải là một bước không để hở cho lời gọi đồng thời. `SELECT … FOR UPDATE` khoá dòng rồi mới kiểm `status`: lời gọi thứ hai đợi lời gọi thứ nhất commit, đọc lại thấy `cancelled`, bị từ chối với `DON_KHONG_HUY_DUOC`. Một `SELECT` thường rồi `UPDATE` thì **không đủ**: ở READ COMMITTED mặc định cả hai lời gọi cùng đọc thấy `pending`, cùng đặt `cancelled` và cùng cộng trả kho, nên kho tăng gấp đôi. Đây là chính lỗi "kiểm rồi ghi" mà FR-3B.21 chặn ở phía trừ kho; TC-9 đo nó và có đối chứng.
  - **Vì sao hàm mà không phải trigger hay policy.** Policy `UPDATE` không giới hạn được theo cột (FR-B4.7). Trigger trên `orders` chuyển sang `cancelled` thì cộng kho cho mọi người ghi, kể cả Admin — nhưng làm khoá cột và cộng kho thành hành vi ngầm của mọi `UPDATE`, và khách vẫn cần một đường ghi hợp lệ. Hàm `SECURITY DEFINER` cho khách một đường duy nhất, đọc được và kiểm được. Cái giá phải ghi: đường hủy của Admin không đi qua hàm này (mục 4.1).
  - **Migration:** một file `supabase/migrations/<version>_cancel_order.sql`, tên theo đúng `version` Supabase trả về khi áp lên hosted (như đợt 3B). Hàm mới, không phá dữ liệu; áp lên hosted vẫn chỉ sau khi chủ dự án đồng ý.

- **FR-B4.4** — Xác nhận trước khi hủy (NFR-3.3): xác nhận **ngay trong trang**, không dùng hộp thoại `confirm()` của trình duyệt.
  - Vùng xác nhận nói rõ hậu quả bằng giọng NA Books: đơn sẽ bị hủy và sách được trả lại kho. **Focus chuyển vào vùng xác nhận** khi nó mở; **Escape hoặc nút "Không"** thì thoát và trả focus về nút "Hủy đơn hàng". Vùng xác nhận **không tự biến mất**. Không phải hộp thoại modal: nền phía sau không bị khoá.
  - **Chữ hiển thị** (giọng "chúng mình"/"bạn", một đề xuất mà đợt triển khai được chỉnh câu chữ miễn giữ nghĩa):
    - Nút mở: "Hủy đơn hàng", kèm dòng nhỏ "Bạn chỉ hủy được khi đơn còn ở trạng thái “Chờ xử lý”."
    - Vùng xác nhận: tiêu đề "Hủy đơn này?"; nội dung "Đơn sẽ bị hủy và sách trong đơn được trả lại kho. Bạn không mở lại được đơn đã hủy; nếu vẫn muốn mua, bạn đặt đơn mới nhé."; hai nút "Xác nhận hủy" và "Không".
    - Đơn không còn `pending` (`processing`, `shipped`, `completed`): không có nút hủy, thay bằng một dòng "Đơn đã sang bước tiếp theo nên không hủy được tại đây." Đơn `cancelled`: không có nút và không có dòng thêm (chip đã nói rõ; không viết "sách đã trả lại kho" vì đơn có thể bị hủy bằng đường khác, mục 4.1).
  - **Kết quả là dải trong trang, không tự tắt** (file quyết định mục 3; WCAG 2.2.1), không phải `Toast`: thông báo có thông tin người dùng cần đọc kỹ không thuộc loại "thuần xác nhận và ngắn". Thành công: "Chúng mình đã hủy đơn {mã}. Sách trong đơn đã được trả lại kho." Dải phải **còn nguyên sau khi trang làm mới** (`refresh()` dựng lại chip thành "Đã hủy"): thành phần hủy đơn không được bị gỡ khi `status` chuyển khỏi `pending`; sau khi hủy thành công, focus chuyển vào dải này vì nút đã biến mất.
  - **Ánh xạ lỗi của Server Action `cancelOrder`** (mỗi mã một câu, không lộ mã kỹ thuật):
    - `DON_KHONG_HUY_DUOC`, `detail = cancelled` → "Đơn này đã được hủy từ trước." (không phải lỗi);
    - `DON_KHONG_HUY_DUOC`, `detail` là trạng thái khác → "Đơn này đã chuyển sang “{nhãn}” nên chúng mình không hủy được nữa.";
    - `DON_KHONG_TON_TAI` → "Chúng mình không tìm thấy đơn này.";
    - `KHONG_DANG_NHAP` → "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại để hủy đơn nhé." kèm liên kết `/dang-nhap?next=…`;
    - lỗi mạng, hết hạn, mã lạ → "Chúng mình chưa xác nhận được việc hủy đơn. Bạn tải lại trang để xem trạng thái hiện tại nhé." (không viết "đơn vẫn như cũ": một lời gọi hết hạn có thể đã chạy xong ở database, nguyên tắc trung thực ở file quyết định mục 6).
    Mọi trường hợp lỗi cũng gọi `refresh()` để chip hiện trạng thái thật.
  - Nút "Xác nhận hủy" và "Không" bị vô hiệu trong lúc đang gửi (`useTransition`); bấm đúp không tạo hai lời gọi, và nếu có, database chặn lời gọi thứ hai (FR-B4.3).
  - **Server Action** `cancelOrder(orderCode)`: kiểm định dạng mã (`^NA-\d{4}-\d{4,}$`) rồi `supabase.rpc("cancel_order", …)` bằng client server của phiên, ánh xạ lỗi như trên, thành công thì `refresh()` (từ `next/cache`; tiền lệ ở `app/actions/cart.ts`). **Không** `redirect()`, không gọi `track()` (không có `order_cancelled`), không gửi email.
  - Hook kiểm thử: `order-cancel-trigger` (nút mở), `order-cancel-confirm` (vùng xác nhận), `order-cancel-result` (dải kết quả).

- **FR-B4.7** — RLS KHÔNG đổi: khách vẫn không có policy `INSERT` hay `UPDATE` nào trên `orders` (đo 03/10/2026: chỉ có `orders_select_own_or_admin` cho `SELECT` và `orders_admin_update` cho `UPDATE` của Admin; `order_items` cũng chỉ có `SELECT` và `UPDATE` của Admin). Hủy đơn chỉ qua `cancel_order`.
  - **Lý do:** RLS không giới hạn được theo cột. Một policy `UPDATE` "chỉ được đặt `cancelled`" (`USING (status = 'pending')`, `WITH CHECK (status = 'cancelled')`) vẫn cho khách sửa kèm cột khác trong cùng câu `UPDATE` — `total_amount`, `shipping_address`, `confirmation_email_sent_at`, `note`… — miễn là dòng sau khi sửa có `status = 'cancelled'`. `WITH CHECK` chỉ kiểm dòng kết quả, không kiểm cột nào được đổi.
  - Hàm `SECURITY DEFINER` bỏ qua RLS, nên quyền sở hữu đơn do chính hàm kiểm (`user_id = auth.uid()` ở FR-B4.3); Admin gọi hàm với đơn của người khác cũng bị từ chối (TC-8).

## 3. Ảnh hưởng chéo

- **Cache catalog.** Dữ liệu sách (kể cả tồn kho) cache bằng `"use cache"` với `cacheLife("minutes")` (`lib/queries.ts`, làm mới sau 60 giây). Tồn kho cộng trả và thứ hạng "Bán chạy nhất" (FR-1.7, bỏ các đơn `cancelled`) vì thế cập nhật trong vòng tối đa 60 giây, cùng cách `place_order` ở 3B; không thêm `revalidateTag`.
- **Giỏ hàng, email, sự kiện:** không đổi. Hủy đơn không gửi email và không ghi sự kiện (ngoài phạm vi).
- **`proxy.ts` và `lib/focusedFlow.ts` không đổi:** `/tai-khoan/:path*` đã nằm trong `matcher` và `needsLogin`; `/tai-khoan/**` không thuộc luồng tập trung (chỉ `/gio-hang` và `/thanh-toan`). Lời gọi Server Action là POST tới chính route, nên đi qua `matcher` như mọi request.

## 4. Tiêu chí nghiệm thu

**Điều kiện đo.** Stack Supabase cục bộ (Docker chỉ mở khi prompt nói rõ), bản production (`next build` rồi `next start`), Edge headless qua CDP; tài khoản thử tạo trên 127.0.0.1. Claude Code không tạo hay đăng nhập tài khoản trên hosted Auth, nên mọi tiêu chí có phiên đăng nhập đều đo ở stack cục bộ; hosted chỉ được đọc bằng SELECT. Đơn thử tạo bằng `place_order` hoặc bằng service role; trạng thái khác `pending` đặt bằng service role (khách không có quyền). Không tiêu chí nào dùng ngưỡng phần trăm: các số đếm đòi đúng 100% số mẫu. Mọi tiêu chí có đối chứng ở trạng thái ngược lại; đối chứng cũng "đạt" nghĩa là phép đo hỏng.

TC-1 → TC-10 là mười tiêu chí của chủ dự án; TC-11 → TC-17 do spec thêm để mỗi FR có phép đo.

- **TC-1** — Khách chưa đăng nhập mở `/tai-khoan/don-hang` → tới trang đăng nhập; đăng nhập xong quay lại đúng trang đó. Đo: request không cookie, không theo chuyển hướng → 307 tới `/dang-nhap?next=%2Ftai-khoan%2Fdon-hang`; trình duyệt: đăng nhập bằng tài khoản thử → `location.pathname` cuối là `/tai-khoan/don-hang` và `order-list` hoặc trạng thái trống có mặt. 3 lượt. Đối chứng: phiên đã đăng nhập mở cùng URL → 200 ngay, không qua `/dang-nhap`.
- **TC-2** — Mở `/tai-khoan` → kết thúc ở `/tai-khoan/don-hang`. Đo: đã đăng nhập, không theo chuyển hướng → 307, `Location` là `/tai-khoan/don-hang`; theo chuyển hướng → URL cuối đúng. Chưa đăng nhập: ghi lại chuỗi chuyển hướng đo được (dự kiến `/tai-khoan` → `/tai-khoan/don-hang` → `/dang-nhap?next=…`; nếu đo ra khác thì ghi số đo thật). 3 lượt mỗi trạng thái. Đối chứng: `/tai-khoan/khong-co-trang` vẫn 404 (chuyển hướng không nuốt đường dẫn con).
- **TC-3** — Danh sách hiện đúng đơn của mình, mới nhất trước, đúng mã/ngày/tổng/trạng thái; đơn của người khác không bao giờ xuất hiện. Đo với hai tài khoản có đơn: A có ≥ 5 đơn đủ cả 5 trạng thái và có hai đơn cùng giây; B có ≥ 3 đơn. So văn bản hiển thị của từng `order-row` với dòng DB (mã, tổng theo `formatVnd`, ngày, nhãn trạng thái) và thứ tự với `ORDER BY created_at DESC, order_code DESC`; tập mã của A giao với tập mã của B = rỗng. Hai đơn đặt ở ranh giới ngày (`2026-12-31T17:30:00Z` phải hiện `01/01/2027 00:30`; `2026-10-02T16:47:45Z` phải hiện `02/10/2026 23:47`) để bắt lỗi dùng giờ UTC. 1 lượt mỗi tài khoản, 3 lần tải. Đối chứng: đăng nhập B thấy đúng tập của B (phép đo "không lẫn" không rỗng vì cả hai có đơn). Thêm một lượt với một tài khoản admin có đơn của chính mình và đơn của người khác tồn tại: admin chỉ thấy đơn của mình.
- **TC-4** — Tài khoản chưa có đơn → trạng thái trống đủ bốn phần. Đo: có đúng 1 hình `svg[aria-hidden]` rộng 76px, 1 tiêu đề, 1 đoạn giải thích có `max-width` tính được ≤ 460px, đúng 2 liên kết hành động; `order-list` có 0 phần tử. Đối chứng: tài khoản có ≥ 1 đơn → cả bốn phần có 0 phần tử khớp, `order-list` có mặt.
- **TC-5** — Mở chi tiết đơn của người khác bằng mã → 404. Đo trên giao diện (tiêu chí mô tả thứ người dùng thấy): nội dung trang 404, `<meta name="robots" content="noindex">`, và 0 lần xuất hiện của mã đơn, tên sách hay địa chỉ của đơn đó trong văn bản trang. **Ghi thêm mã HTTP đo được:** dự kiến 200, do hạn chế `notFound()` trong `<Suspense>` đã ghi ở mục 7.1 của spec 3B, không phải tiêu chí bị bỏ. Phần "không tiết lộ tồn tại": HTML của trang 404 cho mã của người khác giống hệt trang 404 cho một mã đúng định dạng nhưng không tồn tại, và cho mã sai định dạng. 3 lượt mỗi trường hợp. Đối chứng: chủ đơn mở cùng mã → trang chi tiết, `order-summary` có mặt, có mã đơn trong văn bản.
- **TC-6** — Hủy đơn `pending` → `status` thành `cancelled`; tồn kho từng cuốn tăng đúng bằng số đã đặt; `total_amount`, `confirmation_email_sent_at`, `shipping_address` không đổi. Đo bằng chụp trước/sau: **mọi cột** của dòng `orders` trừ `status` giống hệt; mọi dòng `order_items` của đơn giống hệt; với mọi sách trong đơn, `stock_quantity` sau = trước + `quantity`; mọi sách còn lại trong bảng `books` không đổi cột nào. Đơn thử có ≥ 3 dòng (kể cả hai dòng cùng `book_id` nếu dữ liệu cho phép tạo). 3 lượt (qua RPC ở chặng 1; thêm 1 lượt qua nút hủy ở chặng 2). Đối chứng độ nhạy: sửa cố ý một cột của đơn (ví dụ `note`) rồi chạy cùng bộ so sánh → phải báo lệch đúng cột đó.
- **TC-7** — Thử hủy đơn ở từng trạng thái không phải `pending` (`processing`, `shipped`, `completed`, `cancelled`) → bị từ chối, không dòng nào đổi. Đo: 1 đơn cho mỗi trạng thái (4 mẫu); lỗi trả về là `DON_KHONG_HUY_DUOC` với `detail` bằng đúng trạng thái hiện tại; băm toàn bộ `orders`, `order_items` và `books` trước/sau bằng nhau. Ở chặng 2 thêm một lượt giao diện: đơn đổi sang `processing` bằng service role sau khi trang đã mở, rồi bấm hủy → dải báo trạng thái thật, tồn kho không đổi. Đối chứng: cùng lời gọi trên đơn `pending` thì đổi (TC-6).
- **TC-8** — Gọi `cancel_order` với mã đơn của người khác → bị từ chối, không dòng nào đổi. Đo ba mẫu: (a) khách B gọi mã đơn `pending` của A; (b) khách gọi một mã đúng định dạng nhưng không tồn tại; (c) admin gọi mã đơn `pending` của một khách. Cả ba trả `DON_KHONG_TON_TAI`; thông báo và `detail` của (a) và (b) giống hệt nhau từng ký tự; băm `orders`/`order_items`/`books` không đổi. Đối chứng: chủ đơn gọi cùng mã (a) thì thành công.
- **TC-9** — Hai lời gọi hủy đồng thời cùng một đơn → đúng 1 thành công, kho cộng trả đúng một lần. **Ít nhất 10 lượt**; báo `đạt/tổng`. Mỗi lượt: đơn `pending` mới có 2 cuốn (số lượng 2 và 1), hai kết nối riêng cùng token người dùng, bắn đồng thời; đạt khi đúng một lời gọi thành công, một lời gọi `DON_KHONG_HUY_DUOC` với `detail = cancelled`, và tồn kho mỗi cuốn = trước + số lượng (một lần). Mọi lượt phải đạt; một lượt không đạt là không đạt. **Đối chứng bắt buộc, cùng cách đo:** một hàm "đọc rồi ghi" cố ý ngây thơ (`SELECT` thường rồi `UPDATE`, chỉ tạo trên cơ sở dữ liệu cục bộ, không đưa vào migration) phải bị cộng kho gấp đôi ở ít nhất một lượt; đo hai biến thể (có độ trễ nhân tạo giữa kiểm và ghi, và không độ trễ) và báo cả hai tỷ lệ — ở 3B, hàm trừ kho ngây thơ bị bán lố 12/12 và 57/60. Đối chứng không bắt được lỗi nghĩa là phép đo hỏng, không phải hàm đạt.
- **TC-10** — Khách vẫn không `UPDATE` được bất kỳ cột nào của `orders` qua PostgREST; `anon` không gọi được `cancel_order`. Đo: với từng trong **15 cột** của `orders` (đo 03/10/2026), khách gửi `PATCH` đổi cột đó trên đơn của chính mình → 0 dòng đổi (đọc lại dòng bằng service role); kèm 1 lượt `PATCH` đổi `status` sang `cancelled` trực tiếp → 0 dòng đổi, kho không đổi. `anon` (khoá anon, không JWT) gọi `rpc/cancel_order` → HTTP 401 với mã `42501` ("permission denied"), **không phải** 404/`PGRST202` ("không tìm thấy hàm") — hai kết quả này phải phân biệt được; `has_function_privilege('anon', …)` = false và `authenticated` = true. Đối chứng: cùng câu `PATCH` bằng phiên admin đổi 1 dòng (admin có policy), và `authenticated` gọi `cancel_order` trên đơn của mình thành công, để chứng minh "0 dòng đổi" là do RLS chứ không do phép đo.
- **TC-11** — (FR-B4.1) Giới hạn 50 đơn và mặt phẳng trắng. Đo: tài khoản có 51 đơn → đúng 50 `order-row`, 1 `order-list-limit-note` nêu "50" và tổng "51"; tài khoản có đúng 50 đơn → 50 dòng và **0** `order-list-limit-note` (đối chứng ranh giới). Mặt phẳng: trong `order-list`, số phần tử có `box-shadow` khác `none` là 0, số `order-row` có `border-radius` > 0 là 0, và có n−1 đường kẻ giữa các dòng, mỗi đường dày 1px màu `--color-menu-sep` (Tailwind v4 vẽ `divide-y` ở cạnh **dưới** của mọi dòng trừ dòng cuối — đo ngày 03/10/2026; bản đầu của spec ghi nhầm là cạnh trên), không có kẻ ở cạnh trên dòng đầu và cạnh dưới dòng cuối; đối chứng độ nhạy của selector: cùng phép đo trên khối `order-summary` (có bo góc 4px) phải thấy `border-radius` > 0. 3 lượt tải.
- **TC-12** — (FR-B4.2) Khối tóm tắt dùng chung. Đo: (a) mã nguồn của khối chỉ nằm trong một file và cả hai route import nó (`rg` đếm định nghĩa = 1, import = 2); (b) với cùng một đơn, `outerHTML` của `order-summary` ở `/thanh-toan/hoan-tat/[code]` và ở `/tai-khoan/don-hang/[code]` giống hệt nhau từng ký tự; (c) hồi quy: `outerHTML` của `order-summary` trên trang xác nhận **sau** khi tách giống hệt bản chụp trên `main` **trước** khi sửa (chụp baseline trước khi viết mã), **sau khi bỏ hai thuộc tính `data-testid` mới thêm** (`order-summary` trên `<section>` và `order-status-chip` trên chip) — so nguyên văn thì chắc chắn khác, vì chính hai hook mà tiêu chí này dùng là thuộc tính mới; phép đo phải nêu cả số byte chênh để chứng minh chênh lệch chỉ là hai thuộc tính đó (60 byte). 3 đơn khác nhau (1 dòng, 3 dòng, một sách có giảm giá). Đối chứng: `outerHTML` của hai đơn khác nhau phải khác nhau, để (b) không rỗng nghĩa.
- **TC-13** — (FR-B4.4) Xác nhận trong trang. Đo bằng CDP, chỉ dùng bàn phím ở lượt 2: bấm "Hủy đơn hàng" → 0 sự kiện `Page.javascriptDialogOpening`; `order-cancel-confirm` xuất hiện; `document.activeElement` nằm trong vùng đó; chưa dòng nào trong DB đổi. Escape → vùng biến mất, `activeElement` là `order-cancel-trigger`, DB không đổi; lặp lại với nút "Không". Chờ 10 giây khi vùng đang mở → vẫn còn. 5 lượt (3 bằng chuột, 2 bằng bàn phím). Đối chứng của phép đo hộp thoại: một trang kiểm thử gọi `confirm()` phải làm sự kiện đó bắn ra ít nhất 1 lần.
- **TC-14** — (FR-B4.4) Dải kết quả không tự tắt. Đo: xác nhận hủy → chip chuyển thành "Đã hủy", `order-cancel-trigger` có 0 phần tử, `order-cancel-result` có mặt với câu thành công; sau 10 giây vẫn còn; `activeElement` nằm trong dải; kho tăng đúng như TC-6. 3 lượt. Đối chứng: trước khi hủy `order-cancel-result` có 0 phần tử.
- **TC-15** — (FR-B4.5) Năm chip. Đo: 5 đơn đủ 5 trạng thái, văn bản của `order-status-chip` ở danh sách và ở chi tiết bằng đúng nhãn trong FR-B4.5 (so từng cặp), và mỗi chip có chữ không rỗng; kiểu chip (`class`) của cả năm giống hệt nhau, nên trạng thái chỉ phân biệt được bằng chữ. 1 lượt mỗi trạng thái, 2 vị trí. Đối chứng: số chip trên trang không có đơn nào là 0.
- **TC-16** — (NFR-6.2, NFR-6.3) Trên 390×844: mọi liên kết và nút trong `order-list` và vùng hủy đơn có hộp ≥ 44×44px; `document.documentElement.scrollWidth` ≤ `innerWidth` (không cuộn ngang) ở danh sách, chi tiết và khi vùng xác nhận mở; toàn bộ luồng hủy làm được chỉ bằng `Tab`/`Enter`/`Escape` và phần tử đang focus luôn có viền focus nhìn thấy. 3 lượt. Đối chứng: số phần tử được đo ≥ số dòng + số nút kỳ vọng (không rỗng).
- **TC-17** — (hồi quy) Sau khi tách `PageTitle` và trạng thái trống ra dùng chung, `/gio-hang` không đổi: `outerHTML` của tiêu đề trang và của trạng thái trống giống hệt bản chụp trên `main` trước khi sửa (giỏ có hàng và giỏ rỗng), cùng điều kiện. 3 lượt mỗi trạng thái. Baseline không chụp được ở `main` thì dừng và báo.

### 4.1 Hạn chế đã biết

Ghi lại để người đọc sau không phải đoán; **không phải việc cần làm ở đợt nào**.

- **Mã HTTP của `notFound()` và `redirect()` trong `<Suspense>` là 200.** Cùng cơ chế chủ dự án đã chấp nhận ở mục 7.1 của spec 3B (02/10/2026): nội dung 404 đúng và có `noindex`, tiêu chí mô tả thứ người dùng thấy. Ảnh hưởng ở đợt này: TC-5; phần chuyển hướng "chưa có phiên" của trang danh sách khi `proxy.ts` bị bỏ qua. Chuyển hướng của `proxy.ts` (TC-1) và của `next.config.ts` (TC-2) là 307.
- **Menu tài khoản: "Hồ sơ của bạn" mở ra danh sách đơn.** Hai liên kết "Hồ sơ của bạn" (`components/AccountMenu.tsx`) trỏ `/tai-khoan`, và theo FR-B4.6 `/tai-khoan` chuyển tới `/tai-khoan/don-hang`. Đến khi đợt 2D dựng trang hồ sơ, nhãn "Hồ sơ của bạn" và trang đích không khớp nhau. Đợt này không đổi nhãn (ngoài phạm vi).
- **Đường hủy của Admin không cộng trả kho.** FR-6.4 của SRS yêu cầu cộng trả kho khi đơn bị hủy "dù bởi khách hay Admin". Hosted có policy `orders_admin_update` (cho Admin `UPDATE` mọi cột của `orders`) và **không có trigger nào trên `orders`** (đo 03/10/2026; trigger duy nhất của schema là `profiles_protect_role`). Nên một Admin đặt `status = 'cancelled'` bằng `UPDATE` trực tiếp sẽ không cộng trả kho. Hosted hiện có 3 profile, cả 3 là `customer` (không có Admin), nên chưa ai làm được điều đó qua ứng dụng; lỗ hổng nằm ở policy, không ở một tài khoản cụ thể. Đợt admin phải chọn cơ chế (cho đường hủy của Admin đi qua một hàm dùng chung logic cộng kho, hoặc trigger) và FR-6.4 của SRS ghi điều này.
- **Không có `cancelled_at`.** Danh sách và chi tiết chỉ có ngày đặt; không biết đơn hủy lúc nào.
- **Tồn kho và "Bán chạy nhất" cập nhật trong vòng ≤ 60 giây** (mục 3).
- **URL có dãy `%XX` hỏng hoặc `%25` ở route động cho HTTP 500** (đo 03/10/2026 trên bản `next start`): `/tai-khoan/don-hang/%E0%A4%A` và `/tai-khoan/don-hang/%25`, và cả các route có từ trước `/sach/%E0%A4%A`, `/tu-sach/%E0%A4%A`, `/thanh-toan/hoan-tat/%E0%A4%A`; đường dẫn không khớp route động (`/khong-co/%E0%A4%A`) trả 404. Lỗi sinh ra trước khi tới mã trang nên không do đợt này và không sửa ở đây; đã tách thành một việc riêng.
- **Phép đo ở stack cục bộ, không ở hosted.** Claude Code không đăng nhập được hosted Auth; hosted được kiểm bằng SELECT sau khi áp migration (mục 5).

## 5. Việc chỉ chủ dự án làm được

**Không có việc tay bắt buộc ở đợt này.** Chặng 1 có một cổng quyết định, không phải việc tay: áp migration `cancel_order` lên hosted cần chủ dự án đồng ý trước.

Điều Claude Code không làm được: đăng nhập vào hosted. Nếu muốn có bằng chứng "xem lịch sử đơn, hủy đơn, kho cộng lại" (định nghĩa "xong", bước 5) trên production, chủ dự án đặt một đơn rồi hủy nó; Claude Code kiểm lại bằng SELECT như đã làm với `NA-2026-0001`. **Không phải điều kiện nghiệm thu.** Chủ dự án giữ việc tuỳ chọn này (03/10/2026); nó vẫn là tuỳ chọn.

## 6. Claude Code tạo sẵn

Tên file là gợi ý, người triển khai được đổi miễn giữ ranh giới dùng chung.
- `supabase/migrations/<version>_cancel_order.sql` — duy nhất một migration.
- `lib/orderStatus.ts` (năm giá trị, nhãn, kiểu), `lib/format/orderDate.ts` (định dạng ngày giờ Việt Nam), `lib/orders/` (hàm đọc đơn của chủ đơn dùng chung cho hai route), `lib/ui/` (các chuỗi class thẻ/nút cho code mới của đợt này; bốn bản sao cũ không đụng).
- `components/order/OrderSummary.tsx`, `components/order/OrderStatusChip.tsx`, `components/order/CancelOrder.tsx` (client), `components/PageTitle.tsx`, `components/EmptyState.tsx`.
- `app/actions/orders.ts` (Server Action `cancelOrder`).
- Sửa: `app/tai-khoan/don-hang/page.tsx` (thay trang tạm), thêm `app/tai-khoan/don-hang/[order_code]/page.tsx`, `app/thanh-toan/hoan-tat/[order_code]/page.tsx` (mỏng đi, dùng khối chung), `app/gio-hang/page.tsx` (import `PageTitle` và `EmptyState`), `next.config.ts` (mục chuyển hướng và dòng ghi chú).
- Không đổi: `proxy.ts`, `lib/focusedFlow.ts`, mọi policy RLS, mọi CHECK.

## 7. Kết quả khảo sát khi viết spec (03/10/2026)

**Hosted (chỉ đọc, qua MCP, dự án `book-store-website`):**
- `orders` có 15 cột: `id`, `user_id`, `status` (mặc định `'pending'`), `total_amount`, `shipping_address`, `created_at` (cho phép NULL, mặc định `now()`), `order_code`, `idempotency_key`, `payment_method`, `recipient_name`, `recipient_phone`, `shipping_ward_code`, `shipping_province_code`, `note`, `confirmation_email_sent_at`. `order_items` có 5 cột (`id`, `order_id`, `book_id`, `quantity`, `price_at_purchase`), tất cả NOT NULL.
- Ràng buộc `orders`: `orders_status_check` (5 giá trị: `pending`, `processing`, `shipped`, `completed`, `cancelled`), `orders_payment_method_check`, `orders_total_amount_check` (> 0), `orders_recipient_name_check`, `orders_recipient_phone_check`, `orders_note_check`, UNIQUE `order_code` và `idempotency_key`, khoá ngoại `user_id → auth.users`. `order_items`: khoá ngoại `order_id → orders` `ON DELETE CASCADE`, `book_id → books` không `ON DELETE`.
- Policy: `orders_select_own_or_admin` (SELECT), `orders_admin_update` (UPDATE, `is_admin()`); `order_items_select_own_or_admin` (SELECT), `order_items_admin_update` (UPDATE, `is_admin()`). Không có policy `INSERT` hay `DELETE` nào trên cả hai bảng.
- `events`: CHECK nằm ở **`event_type`** (không có cột `status`), 7 giá trị: `page_view`, `search`, `add_to_cart`, `checkout_started`, `order_placed`, `sign_up`, `login`.
- Trigger: một trigger duy nhất trong `public`, `profiles_protect_role`. Chỉ mục `orders`: `orders_pkey`, `orders_idempotency_key_key`, `orders_order_code_key`, `orders_user_id_idx`.
- `books.stock_quantity`: nullable, mặc định 0; 0/40 dòng NULL.
- Dữ liệu: `orders` 2 dòng (cả hai `pending`), `order_items` 6 dòng, `created_at` NULL ở 0 dòng; `profiles` 3 dòng, cả 3 `role = customer`.
- `cancel_order` chưa tồn tại. `place_order`: `anon` = false, `authenticated` = true. 7 hàm `SECURITY DEFINER` trong `public`: `handle_new_user`, `is_admin`, `mark_confirmation_sent`, `place_order`, `protect_profile_role`, `search_books`, `sync_profile_email`.

**Mã:**
- `app/tai-khoan/don-hang/page.tsx` là trang tạm tĩnh (không đọc phiên), cùng khuôn với trang tạm của `/gio-hang` và `/thanh-toan`; trong `app/tai-khoan/` không có file nào khác.
- `app/thanh-toan/hoan-tat/[order_code]/page.tsx` dựng khối tóm tắt đơn thẳng trong file (không phải thành phần riêng); chip trạng thái là một `<span>` một kiểu cho mọi trạng thái; `STATUS_LABELS` cục bộ đã có đúng 5 nhãn như FR-B4.5.
- `proxy.ts` coi `/tai-khoan` và mọi đường dẫn con là cần đăng nhập (`isUnder(pathname, "/tai-khoan")`), `matcher` có `/tai-khoan/:path*`; `?next=` đi qua `lib/nextParam.ts`.
- Trạng thái trống: hàm cục bộ `EmptyCart` ở `app/gio-hang/page.tsx`; tiêu đề trang: hàm cục bộ `PageTitle` cùng file; không có thành phần chip hay trạng thái trống dùng chung nào trong `components/`.
- `next.config.ts` chỉ có `cacheComponents: true`, không có `redirects`.
- Repo không có hàm định dạng ngày nào.

**SRS 1.6:** FR-6.3 ("Khách hàng chỉ hủy được đơn … khi đơn đang `'pending'`"), FR-6.4 (khuyến nghị "Edge Function/database trigger"), FR-6.5 (policy hủy là "trạng thái đích, chưa cài"; yêu cầu đợt này chọn trigger khoá cột hoặc hàm `SECURITY DEFINER`) và dòng `orders` ở mục 5.10 mô tả cơ chế khác với đợt này; được sửa ở commit riêng (SRS 1.7, `08ed83b`). NFR-3.3 ghi "confirm dialog" trong khi FR-B4.4 xác nhận ngay trong trang; mục 5.10 ghi `order_items` của Admin chỉ `SELECT toàn bộ` trong khi hosted có `order_items_admin_update` và FR-7.5 ghi `SELECT`/`UPDATE` (lệch có từ trước, không do đợt này): cả hai được sửa ở một commit riêng (SRS 1.7, `b83a54a`).

## 8. Điều cần làm rõ trước khi code

**Không còn câu hỏi mở cho chủ dự án.** Các quyết định dưới đây do Claude Code tự chốt khi viết spec (theo quyền tự quyết: có tiền lệ trong repo, miễn phí hoặc đảo lại được, hoặc trả lời được bằng một phép đo); **chủ dự án duyệt toàn bộ ngày 03/10/2026**, kèm hai chỗ được nêu riêng: hai chặng hai PR, và bộ TC-11 → TC-17 thêm vào mười tiêu chí gốc. Ghi lại để người đọc sau biết chỗ nào từng là lựa chọn:
- **Chia hai chặng** → theo tiền lệ đợt 3B.
- **Chuyển hướng `/tai-khoan` bằng `redirects` của `next.config.ts`** → đảo lại được bằng xoá một mục; chạy trước `proxy` theo tài liệu Next đi kèm; mã HTTP đo ở TC-2.
- **`count: "exact"` kèm `.limit(50)`** thay cho lấy 51 dòng → đảo lại được; cho số đếm đúng ở tiêu đề.
- **Sắp xếp `created_at` giảm dần, `nullsFirst: false`, rồi `order_code` giảm dần** → đo được: `created_at` nullable.
- **Không thêm chỉ mục** → chưa đo trên dữ liệu lớn (hosted 2 đơn); số đơn mỗi tài khoản nhỏ; thêm chỉ mục là migration thứ hai, ngoài phạm vi. Đo lại nếu một tài khoản có hàng trăm đơn.
- **Mỗi dòng danh sách là một liên kết cao ≥ 44px** → NFR-6.2.
- **Tách khối tóm tắt, chip, trạng thái trống, tiêu đề trang ra dùng chung** → file quyết định mục 3 ("thêm vào hệ trước, rồi mới dùng") và chỉ dẫn "đừng chép đôi" của FR-B4.2.
- **Một kiểu chip cho năm trạng thái** → đúng hiện trạng ở trang xác nhận; không thêm token màu.
- **`refresh()` sau Server Action, không `revalidatePath`** → tiền lệ `app/actions/cart.ts`.
- **Không làm mới cache catalog khi hủy** → tiền lệ `place_order` ở 3B; tối đa 60 giây.
- **`cancel_order` trả `void`; mã lỗi viết hoa không dấu, `detail` mang thông tin** → quy ước của `place_order`.
- **`coalesce(stock_quantity, 0)`** → đo được: cột nullable (0/40 NULL hiện nay).
- **`SELECT … FOR UPDATE` làm chốt chặn của lời gọi đồng thời** → TC-9 đo, kèm đối chứng.
- **Danh tính trang danh sách: `getClaims()`, rồi `redirect()` tới đăng nhập nếu không có phiên** → `getClaims()` cho hiển thị và `getUser()` cho hàng rào ở `proxy.ts`, đúng điều đã chốt ở file quyết định (mục 5.1); `redirect()` là lớp thứ hai của "nguyên tắc hai lớp".
- **Dải kết quả hủy đơn không dùng `Toast`** → file quyết định mục 3 và `CLAUDE.md` (thông báo có thông tin cần đọc kỹ).

**Vẫn là tình huống DỪNG khi triển khai** (điều kiện dừng đã định sẵn, không phải câu hỏi mở):
- TC-9 có lượt không đạt, hoặc đối chứng hàm ngây thơ không bị cộng kho gấp đôi ở lượt nào (phép đo hỏng).
- Baseline TC-12(c) hoặc TC-17 không chụp được ở `main` trước khi sửa, hoặc `/gio-hang` đổi sau khi tách.
- Phải thêm cột, bảng, policy, trigger hay sửa một CHECK để làm đúng một FR (đổi phạm vi).
- Trước khi áp migration lên hosted: báo và chờ đồng ý.
- Phát hiện một đường hủy khác (ngoài `cancel_order`) mà đợt này phải xử lý để đạt TC-6.

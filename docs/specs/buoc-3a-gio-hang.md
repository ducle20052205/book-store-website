# Bước 3A — Giỏ hàng

Bước 3 · Giỏ hàng và thanh toán · phiên bản 2.0 · 02/10/2026
Nhánh: chưa tạo.

Tài liệu liên quan: docs/SRS.md (mục 5.3), docs/mockups/buoc-3/ (gio-hang.png, gio-hang-trong.png, gio-hang-mobile.png, he-layout-dong-bang.png), docs/trang-quyet-dinh-dac-ta-tong.md mục 5.1 và mục 9.

## 1. Phạm vi

Trong phạm vi: lưu giỏ của khách chưa đăng nhập, giỏ của khách đã đăng nhập, gộp giỏ khi đăng nhập, trang `/gio-hang` thật thay trang tạm, badge số lượng trên header, ghi sự kiện `add_to_cart`.

Ngoài phạm vi, để đợt 3B: trang thanh toán, bảng `provinces`/`wards`, transaction đặt hàng, webhook Make.com.

## 2. Thay đổi so với SRS

**FR-3.1 đổi: giỏ của khách chưa đăng nhập lưu bằng COOKIE, không phải `localStorage`.** Lý do: `localStorage` chỉ đọc được sau khi JavaScript chạy, nên badge số lượng trên header sẽ hiện trạng thái sai trong giai đoạn trung gian của mỗi lượt tải — đúng lớp lỗi đã mất đợt 2B.2 để xoá. Cookie đọc được phía server nên số trong HTML đầu đã đúng.

Hai hệ quả kéo theo: `mergeGuestCart()` chuyển lên Server Action; `signIn`/`signUp` dùng được `redirect()` trong action, nên sàn 2 request RSC ghi ở mục 5.1 của file quyết định xuống 1.

## 3. Yêu cầu chức năng

- **FR-3A.1** — Cookie tên `na_cart`: `httpOnly`, `secure` khi không phải localhost, `SameSite=Lax`, `Path=/`, `Max-Age` 30 ngày. Giá trị là JSON mảng `[{"b": "<book_id uuid>", "q": <int ≥ 1>}]`, tối đa 20 dòng. Vượt 20 dòng thì bỏ dòng cũ nhất. Cookie vượt 3.500 byte thì từ chối thêm dòng mới và báo cho người dùng.
- **FR-3A.2** — Mọi thay đổi giỏ của khách chưa đăng nhập đi qua Server Action (`addToCart`, `setCartQty`, `removeFromCart`). Client không đọc và không ghi cookie này. Không có đường thứ hai sửa giỏ.
- **FR-3A.3** — Khách đã đăng nhập: giỏ nằm ở bảng `cart_items` như FR-3.2; cùng ba Server Action ở trên, phân nhánh theo phiên.
- **FR-3A.4** — Badge số lượng trên header render phía server, nằm trong Suspense boundary riêng (xem FR-3A.15). Fallback là ô bề rộng cố định KHÔNG chứa số — không hiện `0`, theo đúng nguyên tắc của 2B.2: thà chưa có thông tin còn hơn thông tin sai.
- **FR-3A.5** — `mergeGuestCart()` chạy phía server bên trong `signIn` và `signUp`, TRƯỚC `redirect()`. Mỗi dòng trong cookie: `book_id` đã có trong `cart_items` thì cộng dồn `q`, chưa có thì chèn dòng mới. Merge xong thì xoá cookie `na_cart` trong cùng response.
- **FR-3A.6** — `track('sign_up')` và `track('login')` chuyển lên server, gọi trong action trước `redirect()`. Sau thay đổi này không còn lời gọi `track` nào ở client cho hai sự kiện đó.
- **FR-3A.7** — `/gio-hang` thật thay trang tạm của 2B.1: danh sách sách, bộ đếm số lượng, xóa dòng, tóm tắt tổng tiền, trạng thái trống. Bố cục theo docs/mockups/buoc-3/gio-hang.png, gio-hang-trong.png và gio-hang-mobile.png; mọi thành phần lấy từ docs/mockups/buoc-3/he-layout-dong-bang.png.
- **FR-3A.8** — Số lượng bị chặn ở server theo `stock_quantity` tại thời điểm thao tác, không tin số client gửi. Vượt tồn thì đặt bằng `stock_quantity` và trả về cảnh báo hiển thị tại dòng đó.
- **FR-3A.9** — Dòng trỏ tới sách không còn tồn tại thì bị loại khỏi giỏ khi đọc, không báo lỗi. Dòng trỏ tới sách `stock_quantity = 0` thì vẫn hiện, gắn nhãn "Hết hàng", không tính vào tổng tiền, và chặn đi tiếp sang thanh toán.
- **FR-3A.10** — Ghi sự kiện `add_to_cart` với `metadata` gồm `book_id` và `quantity`. Không ghi dữ liệu cá nhân.
- **FR-3A.11** — Cookie không parse được, sai schema, hoặc chứa `book_id` không phải UUID: coi như giỏ rỗng, ghi đè cookie bằng giá trị hợp lệ, không ném lỗi ra giao diện.
- **FR-3A.12** — RLS `cart_items` giữ nguyên như FR-3.8.
- **FR-3A.13** — Nút "Thêm vào giỏ" và "Mua ngay" ở `PurchasePanel.tsx` (trang chi tiết sách) hiện chỉ hiện Toast. Nối chúng vào `addToCart`. "Mua ngay" = `addToCart` rồi điều hướng tới `/gio-hang`. Thanh dính đáy trên mobile (FR-2.7) dùng chung hành vi. Đây là đường vào duy nhất của giỏ hàng trong phạm vi 3A; thiếu nó thì FR-3A.10 không bao giờ chạy.
- **FR-3A.14** — `session_id` chuyển từ `localStorage` sang cookie `na_sid`: UUID v4, KHÔNG `httpOnly` (client `track()` vẫn đọc được), `SameSite=Lax`, `Path=/`, `Max-Age` 1 năm. `proxy.ts` đặt cookie khi request chưa có. Cả `track()` ở client lẫn lời gọi ghi sự kiện ở server đều lấy `session_id` từ cookie này — một nguồn duy nhất. Không giữ tương thích ngược với giá trị cũ trong `localStorage`: bảng `events` trên hosted hiện có 69 dòng (60 `page_view`, 9 `search`, 14 giá trị `session_id` khác nhau; đếm ngày 02/10/2026) mang `session_id` cũ; các dòng đó giữ nguyên và sẽ không nối được với `session_id` mới, chấp nhận.
- **FR-3A.15** — Badge số lượng giỏ hàng nằm trong **Suspense boundary RIÊNG**, tách khỏi boundary của trạng thái auth. Phần tử bọc mang `data-testid="header-cart-count"`, và testid này chỉ xuất hiện ở đó. Không sửa, không di chuyển, không đổi tên `data-testid="header-auth"` của đợt 2B.2 — phép đo TC-1 của đợt đó phải còn chạy đúng sau 3A.

## 4. Tiêu chí nghiệm thu

Đây là đợt về logic, không phải về timing. Tiêu chí là assertion chức năng chạy tự động, trừ TC-5 và TC-6 vốn phụ thuộc render. Mỗi tiêu chí ghi lệnh hoặc script cho ra kết quả, và số mẫu.

- **TC-1 — Giỏ khách sống qua lần tải lại.** Chưa đăng nhập, thêm 1 cuốn, tải lại trang 3 lần: giỏ vẫn có đúng 1 dòng, `q = 1`, ở cả 3 lần. Đối chứng: trước khi thêm, cookie `na_cart` không tồn tại.
- **TC-2 — Gộp giỏ.** Tài khoản có sẵn cuốn A với `quantity = 2` trong `cart_items`. Khách chưa đăng nhập thêm cuốn A (`q = 1`) và cuốn B (`q = 1`), rồi đăng nhập. Sau đăng nhập: A có `quantity = 3`, B có `quantity = 1`, cookie `na_cart` đã bị xoá. 3 lần, cùng kết quả.
- **TC-3 — Chặn vượt tồn.** Chọn một cuốn có `stock_quantity = 2`. Gửi thẳng Server Action với `q = 5` (không qua giao diện): kết quả lưu là 2, action trả về cảnh báo. Làm cả hai trạng thái: chưa đăng nhập và đã đăng nhập. Đối chứng: `q = 2` thì lưu 2 và KHÔNG có cảnh báo.
- **TC-4 — Thao tác nối tiếp không mất dòng.** Gửi `addToCart` cho cuốn A, ĐỢI action trả về, rồi gửi cho cuốn B. Lặp 10 lần: cookie cuối cùng luôn có đủ 2 dòng, 10/10. Giao diện phải vô hiệu hóa nút trong lúc action đang chạy, nên luồng tuần tự là luồng thật của người dùng. Đối chứng: sau lần gửi thứ nhất, cookie có đúng 1 dòng.
- **TC-5 — Badge không hiện số sai.** Edge headless qua CDP, độ trễ Supabase +160 ms, 10 lượt tải `/` khi giỏ có 3 cuốn (selector `[data-testid="header-cart-count"]`): số lượt mà badge hiển thị `0` hoặc số khác 3 ở bất kỳ thời điểm nào từ FCP tới khi ổn định = **0/10**. Đối chứng bắt buộc: giỏ rỗng, 10 lượt, badge không bao giờ hiện số nào (0/10 có số), và sau khi ổn định vẫn không có số (chứng minh script đọc được đúng chỗ).
- **TC-6 — Sàn RSC xuống 1.** Đếm số request RSC phát ra sau khi `signIn` thành công, 10 lần. Kỳ vọng 1. **Đối chứng baseline bắt buộc:** chạy đúng script đó trên commit trước khi sửa, phải thấy 2. Baseline ra 1 nghĩa là phép đếm hỏng, không được kết luận "đạt".
- **TC-7 — Sách biến mất khỏi catalog.** Thêm cuốn C vào giỏ, xóa cuốn C khỏi bảng `books`, tải `/gio-hang`: trang trả 200, dòng đó không hiện, không có lỗi trong console. 3 lần.
- **TC-8 — Cookie rác.** Đặt `na_cart` thành `"{{{"`, rồi thành `'[{"b":"khong-phai-uuid","q":1}]'`, rồi thành `'[{"b":"<uuid hop le>","q":-3}]'`. Mỗi trường hợp: `/gio-hang` trả 200, hiện trạng thái trống, cookie bị ghi đè bằng giá trị hợp lệ. 1 lần mỗi trường hợp.
- **TC-9 — Hết hàng.** Cuốn trong giỏ có `stock_quantity = 0`: dòng hiện kèm nhãn "Hết hàng", không cộng vào tổng tiền, nút đi tiếp sang thanh toán bị vô hiệu hóa. 3 lần.
- **TC-10 — Không còn track ở client cho hai sự kiện đó.** Chỉ quét file client: `rg -n "track\((['\"])(sign_up|login)" $(rg -l '"use client"' app components)` trả về 0 dòng (dạng `$(...)` thay cho `xargs`, vì `xargs` không gọi được `rg` khi `rg` là hàm của shell, như trong Claude Code; đã chạy ngày 02/10/2026 trên mã hiện tại: ra 2 dòng, ở `LoginForm.tsx` và `RegisterForm.tsx`). Đối chứng: cùng lệnh đó với `add_to_cart` thay cho `sign_up|login` phải trả về ít nhất 1 dòng — chứng minh lệnh thật sự tìm được lời gọi `track` trong file client (hiện ra 0 dòng vì chưa có lời gọi `track("add_to_cart"` nào ở client; đối chứng chỉ có nghĩa sau FR-3A.13).
- **TC-11 — Không hồi quy kiểu.** `tsc --noEmit`, `eslint`, `next build`: 0 lỗi, exit 0.
- **TC-12 — Testid của 2B.2 không bị động tới.** `rg -c 'data-testid="header-auth"'` vẫn trả về đúng 1, và `document.querySelectorAll('[data-testid="header-auth"]').length === 1` trên trang đã render. Chạy lại TC-1 của đợt 2B.2 (0/10 hiện "Đăng nhập" khi đã đăng nhập, kèm đối chứng trạng thái khách) sau khi sửa xong 3A.
- **TC-13 — session_id có mặt ở cả hai phía.** Chưa đăng nhập, thêm một cuốn vào giỏ rồi đăng ký tài khoản. Trong bảng `events`: dòng `add_to_cart` (ghi từ client) và dòng `sign_up` (ghi từ server) có CÙNG một `session_id`, và giá trị đó khớp cookie `na_sid` trong trình duyệt. 3 lần.

## 5. Hạn chế đã biết

Cookie gửi kèm mọi request tới cùng origin. Với trần 20 dòng, kích thước thực tế khoảng 1,0 KB dạng JSON và 1,5 KB sau khi mã hoá URL (đo ngày 02/10/2026 trên 3 mẫu 20 dòng, UUID ngẫu nhiên, `q` = 1, 99, 999: 1.021, 1.041, 1.061 byte JSON; 1.503, 1.523, 1.543 byte mã hoá), chấp nhận được. Nếu về sau cần giỏ lớn hơn thì chuyển sang bảng `guest_carts` với một id trong cookie, và khi đó phải có spec riêng.

**Cookie không có read-modify-write nguyên tử.** Hai request thay đổi giỏ gửi đi thật sự đồng thời đều đọc cùng một giá trị cookie cũ, và `Set-Cookie` tới sau ghi đè cái tới trước, nên một dòng có thể mất. Giảm nhẹ bằng cách vô hiệu hóa nút trong lúc action đang chạy, nên luồng của người dùng là tuần tự; không chữa triệt để trong phạm vi 3A. Chưa đo trên Next 16.3.5 — nếu về sau thấy mất dòng trong thực tế thì chuyển sang bảng `guest_carts` với một id trong cookie, và khi đó phải có spec riêng.

## 6. Những điểm đã làm rõ

Năm điểm sau được nêu khi đọc mã ngày 02/10/2026 và đã có quyết định cùng ngày; ghi lại để người đọc sau thấy chúng đã được cân nhắc.

- **Nút "Thêm vào giỏ" chưa được nối** → nối `PurchasePanel.tsx` vào `addToCart`, "Mua ngay" thêm rồi sang `/gio-hang`, thanh dính đáy mobile dùng chung (FR-3A.13).
- **`session_id` của sự kiện ghi từ server** → chuyển sang cookie `na_sid` không `httpOnly`, `proxy.ts` đặt, client và server cùng đọc; không giữ tương thích ngược (FR-3A.14, TC-13).
- **TC-4 và tính nguyên tử của cookie** → TC-4 đo thao tác nối tiếp (luồng thật của người dùng, nút bị vô hiệu hóa khi action chạy); truy cập đồng thời thật không chữa trong 3A và ghi ở mục 5.
- **Phạm vi của TC-10** → chỉ quét file có `"use client"`, kèm đối chứng với `add_to_cart` (TC-10).
- **Cùng Suspense boundary ở FR-3A.4** → badge có boundary riêng với `data-testid="header-cart-count"`; không đụng `header-auth` (FR-3A.15, TC-12).

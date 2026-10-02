# Bước 3A — Giỏ hàng

Bước 3 · Giỏ hàng và thanh toán · phiên bản 2.4 · 02/10/2026
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
- **FR-3A.14** — `session_id` chuyển từ `localStorage` sang cookie `na_sid`: UUID v4, KHÔNG `httpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` 1 năm.

  **`proxy.ts` KHÔNG đặt cookie này.** Response GET mang `Set-Cookie` thì CDN không lưu được, và khách xem portfolio gần như toàn bộ là khách lần đầu — đặt ở proxy sẽ làm mọi lượt tải đầu tiên mất cache edge. Cookie được tạo lúc cần, ở hai chỗ, cả hai đều không nằm trên response được cache:

  1. `track()` ở client: chưa có cookie thì tự sinh UUID, ghi bằng `document.cookie`, rồi gửi kèm sự kiện.
  2. Server Action ghi sự kiện (`sign_up`, `login`): chưa có cookie thì sinh UUID, ghi vào response của action (POST, không bao giờ được cache).

  Hai đường dùng chung đúng một tên cookie và cùng định dạng, nên chỉ có một nguồn sự thật. Không giữ tương thích ngược với giá trị cũ trong `localStorage`: 69 dòng `events` hiện có giữ `session_id` cũ và không nối được với giá trị mới, nên việc giữ lại không mang thêm thông tin nào.
- **FR-3A.15** — Badge số lượng giỏ hàng nằm trong **Suspense boundary RIÊNG**, tách khỏi boundary của trạng thái auth. Phần tử bọc mang `data-testid="header-cart-count"`, và testid này chỉ xuất hiện ở đó. Không sửa, không di chuyển, không đổi tên `data-testid="header-auth"` của đợt 2B.2 — phép đo TC-1 của đợt đó phải còn chạy đúng sau 3A.
- **FR-3A.16** — Luồng tập trung: trên `/gio-hang` và `/thanh-toan`, footer thu gọn hiện ở **đúng những kích thước có thanh thao tác cố định** — quy tắc là "cùng điều kiện với thanh", không phải một con số viết hai lần. Breakpoint chung đặt MỘT chỗ là `--breakpoint-bottom-bar` (64rem = 1024px) trong `app/globals.css`; biến thể Tailwind `bottom-bar:` / `max-bottom-bar:`, media query đệm đáy của `<body>` và JS (`lib/useBelowBottomBar.ts`, đọc biến CSS lúc chạy) cùng đọc từ đó, nên không trôi khỏi nhau. Dưới breakpoint, footer đầy đủ được thay bằng một dòng duy nhất: nền `paper` (không phải khối `cham-900`); đúng một câu "Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio."; chữ 12px, màu `ink-400`, canh giữa, padding 16px trên dưới; không cột liên kết, không đoạn giới thiệu thương hiệu, không liên kết GitHub. Footer đầy đủ không có trong DOM dưới breakpoint (không chỉ ẩn bằng CSS). Từ breakpoint trở lên: footer đầy đủ như hiện tại, không đổi (thanh cố định không có trong DOM, cột tóm tắt thay vào). Quy tắc chỉ áp cho luồng tập trung, không phải cho toàn site.

## 4. Tiêu chí nghiệm thu

Đây là đợt về logic, không phải về timing. Tiêu chí là assertion chức năng chạy tự động, trừ TC-5 và TC-6 vốn phụ thuộc render. Mỗi tiêu chí ghi lệnh hoặc script cho ra kết quả, và số mẫu.

- **TC-1 — Giỏ khách sống qua lần tải lại.** Chưa đăng nhập, thêm 1 cuốn, tải lại trang 3 lần: giỏ vẫn có đúng 1 dòng, `q = 1`, ở cả 3 lần. Đối chứng: trước khi thêm, cookie `na_cart` không tồn tại.
- **TC-2 — Gộp giỏ.** Tài khoản có sẵn cuốn A với `quantity = 2` trong `cart_items`. Khách chưa đăng nhập thêm cuốn A (`q = 1`) và cuốn B (`q = 1`), rồi đăng nhập. Sau đăng nhập: A có `quantity = 3`, B có `quantity = 1`, cookie `na_cart` đã bị xoá. 3 lần, cùng kết quả.
- **TC-3 — Chặn vượt tồn.** Chọn một cuốn có `stock_quantity = 2`. Gửi thẳng Server Action với `q = 5` (không qua giao diện): kết quả lưu là 2, action trả về cảnh báo. Làm cả hai trạng thái: chưa đăng nhập và đã đăng nhập. Đối chứng: `q = 2` thì lưu 2 và KHÔNG có cảnh báo.
- **TC-4 — Thao tác nối tiếp không mất dòng.** Gửi `addToCart` cho cuốn A, ĐỢI action trả về, rồi gửi cho cuốn B. Lặp 10 lần: cookie cuối cùng luôn có đủ 2 dòng, 10/10. Giao diện phải vô hiệu hóa nút trong lúc action đang chạy, nên luồng tuần tự là luồng thật của người dùng. Đối chứng: sau lần gửi thứ nhất, cookie có đúng 1 dòng.
- **TC-5 — Badge không hiện số sai.** Edge headless qua CDP, độ trễ Supabase +160 ms, 10 lượt tải `/` khi giỏ có 3 cuốn (selector `[data-testid="header-cart-count"]`): số lượt mà badge hiển thị `0` hoặc số khác 3 ở bất kỳ thời điểm nào từ FCP tới khi ổn định = **0/10**. Đối chứng bắt buộc: giỏ rỗng, 10 lượt, badge không bao giờ hiện số nào (0/10 có số), và sau khi ổn định vẫn không có số (chứng minh script đọc được đúng chỗ).
- **TC-6 — Sàn RSC hạ.** Đếm theo định nghĩa của 2B.1 (GET có `rsc`, không prefetch): baseline trên `main` ra **2**, mã mới ra **0**, vì `redirect()` mang luôn trang đích trong response của action. Tính cả POST action thì là 3 xuống 1. Hai cách đếm cùng cho một hướng. **Ghi rõ một hạn chế của phép đo:** baseline được chạy trên bản `main` sạch nhưng SAU khi viết mã, không phải trước như tiêu chí gốc đòi. Mẫu: 10 lượt `signIn` và 3 lượt `signUp` mỗi phía, +160 ms; đối chứng phân loại: số request prefetch cùng lượt đo > 0 ở mọi lượt.
- **TC-7 — Sách biến mất khỏi catalog.** Thêm cuốn C vào giỏ, xóa cuốn C khỏi bảng `books`, tải `/gio-hang`: trang trả 200, dòng đó không hiện, không có lỗi trong console. 3 lần.
- **TC-8 — Cookie rác.** Đặt `na_cart` thành `"{{{"`, rồi thành `'[{"b":"khong-phai-uuid","q":1}]'`, rồi thành `'[{"b":"<uuid hop le>","q":-3}]'`. Mỗi trường hợp: `/gio-hang` trả 200, hiện trạng thái trống, cookie bị ghi đè bằng giá trị hợp lệ. 1 lần mỗi trường hợp.
- **TC-9 — Hết hàng.** Cuốn trong giỏ có `stock_quantity = 0`: dòng hiện kèm nhãn "Hết hàng", không cộng vào tổng tiền, nút đi tiếp sang thanh toán bị vô hiệu hóa. 3 lần.
- **TC-10 — Không còn track ở client cho hai sự kiện đó.** Chỉ quét file client: `rg -n "track\((['\"])(sign_up|login)" $(rg -l '"use client"' app components)` trả về 0 dòng (dạng `$(...)` thay cho `xargs`, vì `xargs` không gọi được `rg` khi `rg` là hàm của shell, như trong Claude Code; đã chạy ngày 02/10/2026 trên mã hiện tại: ra 2 dòng, ở `LoginForm.tsx` và `RegisterForm.tsx`). Đối chứng: cùng lệnh đó với `add_to_cart` thay cho `sign_up|login` phải trả về ít nhất 1 dòng — chứng minh lệnh thật sự tìm được lời gọi `track` trong file client (hiện ra 0 dòng vì chưa có lời gọi `track("add_to_cart"` nào ở client; đối chứng chỉ có nghĩa sau FR-3A.13).
- **TC-11 — Không hồi quy kiểu.** `tsc --noEmit`, `eslint`, `next build`: 0 lỗi, exit 0.
- **TC-12 — Testid của 2B.2 không bị động tới.** `rg -c 'data-testid="header-auth"'` vẫn trả về đúng 1, và `document.querySelectorAll('[data-testid="header-auth"]').length === 1` trên trang đã render. Chạy lại TC-1 của đợt 2B.2 (0/10 hiện "Đăng nhập" khi đã đăng nhập, kèm đối chứng trạng thái khách) sau khi sửa xong 3A.
- **TC-13 — session_id có mặt ở cả hai phía.** Chưa đăng nhập, thêm một cuốn vào giỏ rồi đăng ký tài khoản. Trong bảng `events`: dòng `add_to_cart` (ghi từ client) và dòng `sign_up` (ghi từ server) có CÙNG một `session_id`, và giá trị đó khớp cookie `na_sid` trong trình duyệt. 3 lần.
- **TC-14 — Không thêm `Set-Cookie` vào response được cache.** Với một khách hoàn toàn mới (profile sạch, không cookie), tải `GET /` 5 lần: response KHÔNG chứa `Set-Cookie` cho `na_sid`. Đồng thời ghi lại header `x-vercel-cache` của 5 lượt đó trên preview.

  **Đối chứng baseline bắt buộc:** chạy đúng phép đo đó trên `main` trước khi sửa, cùng điều kiện (cùng khách mới, cùng trang, cùng số lượt). So phân bố `x-vercel-cache` trước và sau; khác nhau thì dừng và báo cáo, đừng kết luận "đạt". Nếu baseline đã không có lượt `HIT` nào thì phép đo này không phân biệt được gì — nói thẳng như vậy thay vì báo một con số đẹp.

  **Kết quả (02/10/2026).** Khách hoàn toàn mới (mỗi lượt một tiến trình `curl` riêng, không cookie), `GET /` xen kẽ preview (`book-store-website-1d4gybcn6-duc-75bf.vercel.app`, commit `f7a67a1`) và production (`book-store-website-dun.vercel.app`, baseline `main` `8462236`), 5 lượt mỗi phía. `Set-Cookie` cho `na_sid`: **không có** ở 10/10 response, và không có header `Set-Cookie` nào ở cả hai phía. `x-vercel-cache`: preview PRERENDER ×1, HIT ×4; production STALE ×1, HIT ×4. Baseline có 4/5 lượt `HIT` nên phép đo phân biệt được; sau lượt đầu, hai bên cùng `HIT` ở 4/4 lượt còn lại. **Hạn chế:** lượt đầu của hai bên không cùng điều kiện (preview vừa dựng nên là PRERENDER, production là STALE với `age` 2.404 s), nên không so được lượt đó; phép đo chỉ thấy header HTTP, không thấy cookie do JavaScript ghi bằng `document.cookie` (`track()` ở client), vốn không nằm trên response được cache.

- **TC-15 — Thanh thao tác đáy của `/gio-hang` cố định ở đáy khung nhìn.** Dưới breakpoint chung (cột tóm tắt bị ẩn), thanh "Tổng cộng" và nút "Thanh toán" nằm cố định ở đáy khung nhìn trên mọi nội dung (mockup `gio-hang-mobile.png`); đệm đáy của `<body>` bằng đúng chiều cao thanh nên footer không bị che. Edge headless, 390×844:
  - **TC-15a** — giỏ 1 cuốn: `|rect.bottom − window.innerHeight| ≤ 1px`, 5/5.
  - **TC-15b** — giỏ 5 cuốn, tại `scrollY = 0` và tại cuối trang: cả hai vị trí `|rect.bottom − window.innerHeight| ≤ 1px`, 5/5 mỗi vị trí.
  - **TC-15c** — cuộn tới cuối trang: dòng cuối cùng của footer ("Dữ liệu sách chỉ nhằm minh họa…") có `rect.bottom ≤ rect.top` của thanh, 5/5.
  - **TC-15d** — đối chứng desktop 1280px: `querySelector('[data-bottom-bar]')` trả `null`, 5/5; nếu thanh vẫn có thì phép đo trên mobile không chứng minh được gì về breakpoint.
  - **TC-15e** — CLS của `/gio-hang` ở 390px, 5 lượt: ghi lại, không đặt ngưỡng.
- **TC-16 — Footer thu gọn ở luồng tập trung (FR-3A.16).** Ba mốc, Edge headless, mỗi mốc 3 lượt mỗi trang:
  - **TC-16a** — dưới breakpoint (1023px; thêm 390px): `/gio-hang` và `/thanh-toan` có đúng 1 `<footer>`, đếm liên kết trong `<footer>` = 0 và câu "Dữ liệu sách chỉ nhằm minh họa" vẫn có mặt; trên `/gio-hang` thanh cố định có mặt (cùng breakpoint).
  - **TC-16b** — ngay trên breakpoint (1024px) và 1280px: cùng hai trang có footer đầy đủ với đủ các cột liên kết; trên `/gio-hang` thanh cố định KHÔNG có trong DOM, cột tóm tắt có mặt. Nếu ở các mốc này footer cũng bị thu gọn thì phép đo breakpoint hỏng, không kết luận "đạt".
  - **TC-16c** — đối chứng trang khác: `/` và `/sach` ở 1023px và 390px, footer đầy đủ vẫn có mặt. Quy tắc chỉ áp cho luồng tập trung.

  **Khảo sát trước khi sửa (preview PR #12, 390×844).** Thanh là `position: sticky; bottom: 0; z-index: auto`, không có tổ tiên `overflow` khác `visible`. Giỏ 1 cuốn: `rect.bottom` = 650,1 px, cách đáy khung nhìn (844) 193,9 px, trên footer (đỉnh 682) một dải nền 32 px. Giỏ 5 cuốn: ở `scrollY = 0` chênh 0 (đang dính), nhưng ở `scrollY = 777` chênh 204,7 px và ở cuối trang `rect.bottom` = −136,7 px, tức thanh trôi mất khỏi khung nhìn khi tới footer. Nguyên nhân: `sticky` chỉ dính trong khối chứa nó.

  **Kết quả (02/10/2026, commit `5caa9f5`).** Preview `book-store-website-p3gtwvlko-duc-75bf.vercel.app` và bản `next start` cục bộ cho cùng kết quả (số ghi ở đây là của preview). Thanh sau khi sửa: `position: fixed; bottom: 0; z-index: 30`, cao 113 px = đệm đáy `<body>` 113 px. **TC-15a** đạt 5/5 (chênh 0, 0, 0, 0, 0). **TC-15b** đạt 5/5 ở cả `scrollY = 0` và cuối trang (chênh 0). **TC-15c** đạt 5/5 khi đo đúng *dòng chữ* (Range trên text node): thanh.top − dòng.bottom = 16,69 px ở 5/5 lượt. Lần đo đầu của tôi lấy hộp `<footer>` (gồm 16 px padding) cho −0,31 px ở 5/5 lượt: hộp footer chạm thanh 0,31 px do chiều cao tài liệu lẻ, nhưng không che chữ nào; ghi lại để không ai đo lại bằng hộp rồi tưởng là lỗi mới. **TC-15d** đạt 5/5: thanh `null`, cột tóm tắt có mặt, đệm `<body>` 0 px. **TC-15e** (390px, giỏ 3 cuốn, 5 lượt): 0, 0, 0, 0, 0 trên preview. Các lần đo đầu cục bộ (server vừa khởi động) có lượt ra 0,0325, 0,0091; xem mục 5 "Một lần dịch chuyển bố cục chưa chữa". Sau khi đổi footer sang cùng breakpoint với thanh (commit `03ca4f3`, v2.4), đo lại trên preview `book-store-website-niy0gx6hu-duc-75bf.vercel.app` (bản `next start` cục bộ cho cùng kết quả): **TC-15a/b/d** giữ nguyên (chênh 0, 0, 0, 0, 0 ở cả hai vị trí; thanh `null` ở 1280px), **TC-15c** 16,69 px ở 5/5, **TC-15e** 0 ở 5/5. **TC-16a** đạt 3/3 mỗi trang ở 1023px và 390px (1 `<footer>`, 0 liên kết, có câu minh hoạ; thanh có mặt trên `/gio-hang`; nền `rgb(237, 230, 217)` = `paper`, 12px, `rgb(95, 99, 121)` = `ink-400`, canh giữa, padding 16px/16px, đo ở lần đầu trước khi đổi breakpoint). **TC-16b** đạt 3/3 mỗi trang ở 1024px và 1280px (9 liên kết, đủ ba cột và GitHub; thanh `null`, cột tóm tắt có mặt). **TC-16c** đạt 3/3 mỗi trang (`/`, `/sach`) ở 1023px và 390px (9 liên kết). Tổng 16/16 kiểm.

## 5. Hạn chế đã biết

Cookie gửi kèm mọi request tới cùng origin. Với trần 20 dòng, kích thước thực tế khoảng 1,0 KB dạng JSON và 1,5 KB sau khi mã hoá URL (đo ngày 02/10/2026 trên 3 mẫu 20 dòng, UUID ngẫu nhiên, `q` = 1, 99, 999: 1.021, 1.041, 1.061 byte JSON; 1.503, 1.523, 1.543 byte mã hoá), chấp nhận được. Nếu về sau cần giỏ lớn hơn thì chuyển sang bảng `guest_carts` với một id trong cookie, và khi đó phải có spec riêng.

**Cookie không có read-modify-write nguyên tử.** Hai request thay đổi giỏ gửi đi thật sự đồng thời đều đọc cùng một giá trị cookie cũ, và `Set-Cookie` tới sau ghi đè cái tới trước, nên một dòng có thể mất. Giảm nhẹ bằng cách vô hiệu hóa nút trong lúc action đang chạy, nên luồng của người dùng là tuần tự; không chữa triệt để trong phạm vi 3A. Chưa đo trên Next 16.3.5 — nếu về sau thấy mất dòng trong thực tế thì chuyển sang bảng `guest_carts` với một id trong cookie, và khi đó phải có spec riêng.

**Khách tắt cookie** thì giỏ hàng không hoạt động và sự kiện không ghi được. Không vá: toàn bộ auth của site đã dựa trên cookie từ đợt 2A, nên vá riêng giỏ hàng không cứu được trang.

**Một lần dịch chuyển bố cục chưa chữa.** TC-15e đo được CLS khác 0 ở 4/35 lượt (0,0325 ×2, 0,0091, và một lượt gỡ lỗi ≈ 0,0317), đều ở `/gio-hang` 390px với giỏ 3 cuốn trong những lần đo đầu cục bộ; 0 ở 10/10 lượt đo đầy đủ trên preview và 0 dịch chuyển ở 12 lượt gỡ lỗi. Cơ chế ghi được ở lượt gỡ lỗi: footer thu gọn dịch 113 px rồi bị gỡ khỏi DOM khoảng 3,6 s sau khi tải. Việc biến thể thừa phải bị gỡ khỏi DOM bằng JS là do thiết kế: tiêu chí TC-15d và TC-16a đòi `querySelector` trả `null` và đếm liên kết bằng 0, nên không thể chỉ ẩn bằng CSS media query. Hệ quả kéo theo: `BottomBarGate`, `FooterSwitch`, một `<Suspense>` vá lỗi `usePathname` ở layout gốc, và HTML mang cả hai biến thể. **Chưa rõ vì sao** việc gỡ xảy ra muộn (~3,6 s) ở những lượt đó; chưa tái hiện được để quan sát.

**Cách chữa đúng, hoãn sang đợt 1.6:** chuyển footer khỏi layout gốc xuống layout theo route — `/gio-hang` và `/thanh-toan` dùng layout riêng với footer thu gọn, các route còn lại dùng footer đầy đủ; phần phụ thuộc bề rộng để CSS lo. Khi đó không cần JS, không có biến thể thừa trong HTML, không có dịch chuyển. Tiêu chí lúc đó đo **khả kiến**, không đo sự có mặt trong DOM.

Không chữa ở 3A: tái hiện 4/35 lượt, giá trị tối đa 0,0325 so với ngưỡng "tốt" 0,1, và cách chữa là restructure layout, không phải làm ngay trước khi merge.

## 6. Những điểm đã làm rõ

Năm điểm sau được nêu khi đọc mã ngày 02/10/2026 và đã có quyết định cùng ngày; ghi lại để người đọc sau thấy chúng đã được cân nhắc.

- **Nút "Thêm vào giỏ" chưa được nối** → nối `PurchasePanel.tsx` vào `addToCart`, "Mua ngay" thêm rồi sang `/gio-hang`, thanh dính đáy mobile dùng chung (FR-3A.13).
- **`session_id` của sự kiện ghi từ server** → chuyển sang cookie `na_sid` không `httpOnly`, tạo lúc cần ở client (`track()`) hoặc ở Server Action, KHÔNG qua `proxy.ts` để không làm mất cache edge; không giữ tương thích ngược (FR-3A.14, TC-13, TC-14).
- **TC-4 và tính nguyên tử của cookie** → TC-4 đo thao tác nối tiếp (luồng thật của người dùng, nút bị vô hiệu hóa khi action chạy); truy cập đồng thời thật không chữa trong 3A và ghi ở mục 5.
- **Phạm vi của TC-10** → chỉ quét file có `"use client"`, kèm đối chứng với `add_to_cart` (TC-10).
- **Cùng Suspense boundary ở FR-3A.4** → badge có boundary riêng với `data-testid="header-cart-count"`; không đụng `header-auth` (FR-3A.15, TC-12).

## 7. Khác với spec v2.1 khi triển khai

- **`refresh()` (Next 16.3.5) làm mới badge cho người đã đăng nhập** — giỏ của họ nằm ở bảng `cart_items`, đổi dữ liệu không đổi cookie nào nên Next không tự làm mới giao diện; `refresh()` trong Server Action làm client làm mới ngay trong response của action.
- **Cookie hỏng được dọn bằng một action gọi từ client** (`repairGuestCart`, gọi từ `RepairCartCookie`) — Server Component không ghi được cookie, nên trang `/gio-hang` chỉ phát hiện và yêu cầu dọn; action chỉ bớt dữ liệu, không bao giờ thêm.
- **Giỏ khách hết dòng thì cookie bị xoá, không ghi `[]`** — cookie rỗng không mang thông tin nào; `[]` chỉ dùng để ghi đè cookie hỏng ở trạng thái "không có dòng hợp lệ nào" (TC-8).
- **`mergeGuestCart` chặn số lượng theo tồn kho** — spec v2.1 không nói, nhưng để nguyên thì gộp giỏ vượt được giới hạn mà FR-3A.8 đặt ra (số lượng sau gộp bị chặn ở min(tồn kho, 99); sách hết hàng vẫn được giữ để dòng hiện nhãn "Hết hàng").
- **`lib/nextRedirect.ts`** — `redirect()` trong Server Action làm lời gọi action ở client bị từ chối bằng lỗi redirect, nên form đăng nhập/đăng ký cần phân biệt redirect với lỗi thật; không phải mã thừa.
- **Nút "Thanh toán" trỏ trang `/thanh-toan` tạm cho tới đợt 3B** — nếu không có trang này thì liên kết trỏ vào 404 và mỗi lần tải `/gio-hang`, prefetch sinh một request lỗi.
- **Thanh thao tác đáy và footer thu gọn dùng chung một breakpoint, `--breakpoint-bottom-bar` = 64rem (v2.4)** — cột tóm tắt chỉ hiện từ breakpoint này nên dưới nó thanh là đường duy nhất tới "Thanh toán"; v2.3 để footer thu gọn ở 768px, lệch với thanh (1024px) nên ở 768–1023px có thanh nhưng footer đầy đủ. Biến đặt trong `@theme static` của `app/globals.css` (`static` để luôn được phát ra, vì JS đọc nó mà Tailwind không thấy lời gọi đó); biến thể `bottom-bar:` / `max-bottom-bar:`, media query `@media (width < theme(--breakpoint-bottom-bar))` và hook `useBelowBottomBar` cùng đọc từ đó.
- **`BottomBarGate` và `FooterSwitch` bỏ phần tử khỏi DOM sau hydrate, không ẩn bằng CSS (v2.3)** — TC-15d và TC-16a đòi `querySelector` trả `null` và 0 liên kết trong `<footer>`; HTML server mang cả hai biến thể (class breakpoint chọn cái hiển thị) rồi gỡ biến thể thừa sau hydrate để không nháy và không CLS.
- **`<Suspense fallback={<Footer />}>` quanh `FooterSwitch` ở layout gốc (v2.3)** — `usePathname()` ở route có tham số động (`/sach/[slug]`) cần Suspense, nếu không `next build` lỗi.
- **Đệm đáy `<body>` dùng chung biến `--bottom-bar-h` với thanh (v2.3)** — `body:has([data-bottom-bar])` thêm đệm SAU footer, vì đệm trong nội dung trang không giúp footer: thanh cố định phủ đáy khung nhìn nên dòng cuối của footer sẽ nằm dưới thanh.
- **Chữ "Trong giỏ có sách đã hết hàng…" chuyển khỏi thanh đáy (v2.3)** — thanh cao cố định 113 px nên chỉ chứa dòng tổng và nút; chữ hiện ngay dưới danh sách (dưới 1024px) hoặc dưới nút ở cột tóm tắt.

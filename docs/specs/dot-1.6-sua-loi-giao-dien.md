# Đợt 1.6 — Sửa lỗi giao diện

Danh sách các lỗi và sai lệch đã biết (phát hiện ở bước 1 và trong các đợt bước 2), gom lại để xử lý trong đợt 1.6. Mỗi mục ghi hiện trạng đo được, điều SRS yêu cầu, và trạng thái.

## 1. `/sach/<slug không tồn tại>` trả HTTP 200 thay vì 404 (lệch FR-2.4)

**SRS yêu cầu:** FR-2.4 — slug không tồn tại → trả về trang 404.

**Hiện trạng (đo bằng `npm run build && npm start`, `curl -w "%{http_code}"`, 30/09/2026):**

| URL | Mã HTTP | Nội dung |
|---|---|---|
| `/sach/nha-gia-kim` (slug có thật) | 200 | trang chi tiết sách |
| `/sach/khong-ton-tai-abc` | **200** | "không tìm thấy" + `noindex` |
| `/tu-sach/hieu-minh-truoc-khi-hieu-doi` (slug có thật) | 200 | trang tủ sách |
| `/tu-sach/khong-ton-tai-abc` | 404 | "không tìm thấy" + `noindex` |

Nội dung "không tìm thấy" và thẻ `noindex` đều đúng; chỉ mã trạng thái sai, nên người dùng không thấy khác biệt nhưng công cụ tìm kiếm và `curl` thì thấy.

**Có từ trước đợt 2A.** Đã xác nhận bằng bản build từ nhánh `main` trước khi đợt 2A bắt đầu: `/sach/<slug lạ>` trả 200 ở cả hai bản, nên đợt 2A không gây ra lỗi này.

**`/tu-sach/<slug lạ>` không lệch.** Trả 404 ở cả bản gốc lẫn hiện tại. Đợt 2A đã phải giữ nguyên hành vi này: bọc trang bằng `<Suspense>` làm nó thành 200, nên `app/tu-sach/[slug]/page.tsx` dùng `export const instant = false` (kèm `generateStaticParams`) để slug lạ vẫn render chặn và `notFound()` cho ra 404. Không được gỡ dòng đó khi sửa.

**Nguyên nhân (giả thuyết, chưa kiểm chứng):** `app/sach/` có `loading.tsx` còn `app/tu-sach/` thì không. `loading.tsx` bọc segment trong `<Suspense>`, nên mã 200 có thể đã được gửi đi trước khi `notFound()` chạy.

**Trạng thái:** chưa xử lý.

## 2. Hai hệ bo góc song song

**Hiện trạng (`app/globals.css`):** site đang có hai bộ bo góc.

| Bộ | Token |
|---|---|
| Phần cũ (bước 1, đợt E) | `radius-card` 14px, `radius-control` 10px, `radius-input` 6px, `radius-cover` 8px |
| Header và form mới (đợt 2A, 2B) | `radius-field` 3px, `radius-menu` 4px, `radius-sheet` 12px |

Một ô nhập ở form đăng nhập (3px) và một ô nhập ở phần cũ (6px) nhìn khác nhau dù cùng vai trò; thẻ form 4px đứng cạnh thẻ sách 14px.

**Cần làm:** chốt một hệ và thống nhất, rồi bỏ hoặc đổi tên bộ còn lại. Tới lúc đó, đợt 2B dùng `radius-field` và `radius-menu` theo mockup (xem `docs/mockups/buoc-2/README.md`).

**Trạng thái:** chưa xử lý.

## 3. `claude-code-brand-update.md` mục 1 đã cũ so với `globals.css`

**Hiện trạng:** mục 1 của `docs/specs/claude-code-brand-update.md` ghi những giá trị mà code không còn dùng:

| Chỗ | Mục 1 ghi | `app/globals.css` |
|---|---|---|
| Nền trang | `paper #FBFAF7` | `#EDE6D9` |
| Font serif | Lora | Newsreader (đợt E thay Lora) |
| Bo góc | thẻ 4px, control 6px | thẻ 14px, control 10px, input 6px (xem mục 2) |
| Thành công | `success #2E7D4F` | `#266E48` |
| Metadata | `ink-400 #6B6F85` | `#5F6379` |
| Giá giảm | `sale #C2362B` | `#BD3125` (`danger` vẫn `#C2362B`) |

Mục 1.2 còn ghi "không dùng shadow đậm", trong khi menu tài khoản dùng `shadow-menu` (`0 16px 34px rgba(23,29,64,.22)`) theo mockup 2A.

Riêng mục 6 (giọng văn) của file này vẫn dùng được và `CLAUDE.md` đang trỏ tới nó.

**Cần làm:** cập nhật mục 1 theo `globals.css`, hoặc ghi rõ ở đầu mục 1 rằng nó đã bị thay thế và `app/globals.css` là nguồn duy nhất cho token.

**Trạng thái:** chưa xử lý.

## 4. `Toast` không dừng đếm giờ khi rê chuột hoặc focus

**Hiện trạng:** `components/Toast.tsx` tự ẩn sau 4 giây bằng `setTimeout(onClose, 4000)` (dòng 15). Đồng hồ chạy tiếp khi người dùng rê chuột lên toast hoặc đưa focus vào nó (nút ×), nên người dùng bàn phím và trình đọc màn hình có thể chưa kịp đọc thì toast đã mất (WCAG 2.2.1 Timing Adjustable).

Hiện `Toast` chỉ được dùng ở `components/PurchasePanel.tsx` (trang chi tiết sách).

**Cần làm:** thêm pause-on-hover và pause-on-focus (dừng đồng hồ khi chuột ở trên hoặc focus ở trong toast, đếm lại khi rời đi). `CLAUDE.md` đã giới hạn `Toast` cho thông báo xác nhận ngắn; thông báo mang thông tin cần đọc kỹ dùng dải trong trang, không tự tắt.

**Trạng thái:** chưa xử lý.

## 5. Ô tìm kiếm ở header trống sau khi tìm

**Hiện trạng:** ô tìm kiếm ở header (`components/Header.tsx`, `input#site-search`) nằm trong một form GET thường (`action="/sach"`) và không có `defaultValue`. Đo trên bản `npm run build && npm start`: HTML của `/sach?q=nha+gia+kim` chứa `input#site-search` không có thuộc tính `value`. Nên sau khi tìm, ô trống trong khi URL có `?q=`; người dùng không thấy và không sửa được từ khoá vừa tìm.

**Có từ bước 1, không liên quan Cache Components.** Tiêu chí 31 của spec 2B (`docs/specs/buoc-2b-dang-nhap-dang-ky.md`) vì vậy không tính hành vi này là lệch.

**Cần làm:** đọc `?q=` và truyền vào `defaultValue` của ô. Lưu ý khi làm: Header nằm trong layout gốc, mà layout không đọc được `searchParams` (Next.js: layout không render lại khi điều hướng, xem `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`, mục "Query params"). Vì vậy không dùng được prop `searchParams` của trang. Cách hợp lệ là tách ô tìm kiếm thành một Client Component dùng `useSearchParams()`, bọc trong `<Suspense>` (Cache Components bắt buộc). `defaultValue` chỉ có tác dụng lúc mount, nên cần thêm `key` theo giá trị `q` để ô cập nhật khi điều hướng phía client (Back/Forward giữa hai lần tìm).

**Trạng thái:** chưa xử lý.

## 6. Viền ô tìm kiếm ở header không đạt WCAG 1.4.11

**Hiện trạng:** ô tìm kiếm ở header (`components/Header.tsx`, `input#site-search`) dùng `border-line-warm` (`#E3DCCE`) trên nền ô `bg-field` (`#F6F2E9`), đặt trong topbar nền trắng. Viền là thứ chính nhận diện ô, nên phải đạt ≥ 3:1 (WCAG 1.4.11, thành phần giao diện). Số đo (tính từ độ sáng tương đối theo công thức WCAG):

| Cặp | Tỷ số |
|---|---|
| Viền `#E3DCCE` so với nền ô `#F6F2E9` (phía trong) | 1,22:1 |
| Viền `#E3DCCE` so với nền topbar `#FFFFFF` (phía ngoài) | 1,36:1 |
| Nền ô `#F6F2E9` so với nền topbar `#FFFFFF` | 1,12:1 |

Cả ba đều dưới 3:1, nên ô không nhận diện được chỉ bằng viền hay chỉ bằng nền. Đây cùng loại lỗi vừa sửa ở viền ô nhập của form (`--color-line-field`, từng là `#CFC7B8`, 1,68:1).

Giá trị này đến từ mockup: `docs/mockups/buoc-2/header-2a.html` ghi viền ô tìm kiếm `#E3DCCE`, và code làm đúng như vậy. Viền dưới của topbar cũng dùng `line-warm` nhưng chỉ là đường phân vùng, không nhận diện thành phần nên không thuộc phạm vi 1.4.11.

**Cần làm:** đổi viền ô tìm kiếm sang `line-field` (đạt 3,20:1 trên nền trắng của topbar), và sửa `header-2a.html` (khai báo `.search` và dòng "Ô tìm kiếm" trong bảng "Số đo bắt buộc") cho khớp.

**Trạng thái:** chưa xử lý.

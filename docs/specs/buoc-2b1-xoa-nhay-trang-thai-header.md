# Đợt 2B.1 — Xoá nháy trạng thái ở header

Bước 2 · Tài khoản người dùng · phiên bản 1.0 · 30/09/2026
Nhánh: chưa tạo. Đợt này đi sau 2B, không nằm trong PR #9.

Tài liệu liên quan: `docs/specs/buoc-2b-dang-nhap-dang-ky.md` (mục 4, mục 11.4,
mục 12 tiêu chí 3 và 8), `components/Header.tsx`, `components/headerStyles.ts`.

---

## 1. Vì sao có đợt này

Mục tiêu: **người đã đăng nhập không bao giờ nhìn thấy chữ "Đăng nhập" ở header.**

Từ đợt 2A, mục tài khoản của header nằm trong
`<Suspense fallback={<LoginLink />}>` (`components/Header.tsx`), vì đọc cookie thì
không nằm được trong shell tĩnh. Người đã đăng nhập vì thế nhận HTML có "Đăng
nhập" trước, phần thật stream vào sau.

Đợt 2B đã bỏ truy vấn `profiles` và đổi sang `getClaims()`, nên phần thật về
nhanh hơn, nhưng nhãn vẫn đổi thấy được. Số đo 30/09/2026 (Edge headless, rAF
60 Hz, `MutationObserver` + `PerformanceObserver`, 5 lần tải `/` với phiên thật
trên stack cục bộ):

| Lần | "Đăng nhập" xuất hiện trong DOM | Nhãn "Tài khoản" xuất hiện | Khung đầu (FCP) | "Đăng nhập" còn hiển thị sau FCP |
|---|---|---|---|---|
| 1 | 329 ms | 634 ms | 400 ms | 234 ms |
| 2 | 76 ms | 85 ms | 124 ms | 0 (đổi trước khi vẽ) |
| 3 | 77 ms | 91 ms | 128 ms | 0 (đổi trước khi vẽ) |
| 4 | 90 ms | 409 ms | 136 ms | 273 ms |
| 5 | 73 ms | 386 ms | 116 ms | 270 ms |

3/5 lần người dùng thấy sai. Nguyên nhân: runtime Suspense của React (`$RC` và
`$RV` trong `react-dom`) chỉ hiện boundary ngay nếu nó xong trước khung vẽ đầu;
xong sau thì chờ `$RT` + 300 ms. Vì vậy rút ngắn thời gian server không xoá được
lỗi: cái sai nằm ở chỗ fallback là trạng thái sai cho người đã đăng nhập.

Lỗi có từ 2A, không phải hồi quy của 2B (xem "Hai tiêu chí chuyển sang 2B.1" ở mục
12 của spec 2B).

## 2. Phạm vi

**Thuộc phạm vi**
- Fallback của `<Suspense>` ở mục tài khoản của header (phương án A, mục 3).
- Phương án B (mục 4) chỉ khi A không đạt tiêu chí 2.
- Đo hai tiêu chí ở mục 5.

**Ngoài phạm vi**
- `proxy.ts` và `getUser()` (đã chốt ở mục 4 của spec 2B).
- Logic `getClaims()` trong `AccountItem`, nội dung menu tài khoản.
- Menu không đóng khi Back/Forward (`docs/specs/dot-1.6-sua-loi-giao-dien.md` mục 7).
- Mobile header, nếu số đo xác nhận nó chỉ còn biểu tượng (xem mục 3).

## 3. Phương án chốt (A)

Fallback của `<Suspense>` ở header desktop đổi từ
`<a href="/dang-nhap">Đăng nhập</a>` thành: giữ nguyên biểu tượng người sẵn có,
cộng một ô chữ rỗng có `min-width` cố định bằng độ rộng của chuỗi dài hơn trong
hai chuỗi "Đăng nhập" / "Tài khoản" (cùng 9 ký tự, cùng font Be Vietnam Pro nên
gần bằng nhau). Mục tiêu CLS của vùng header = 0.

Mobile header vốn chỉ có biểu tượng nên không nằm trong phạm vi sửa — xác nhận
lại bằng số đo trước khi kết luận.

Lưu ý khi làm, rút từ mã hiện tại:
- `LoginLink` đang vừa là fallback vừa là trạng thái chưa đăng nhập thật
  (`AccountItem` trả nó khi không có claim). Đổi fallback thì phải tách ra một
  thành phần fallback riêng, để người chưa đăng nhập vẫn nhận lại "Đăng nhập".
- Bề rộng cố định đã có: `navAccountWidthClass` (`sm:min-w-[135px]`,
  `components/headerStyles.ts`) áp cho cả hai trạng thái, và 135px là bề rộng đo
  ở 2A của nút "Tài khoản ▾" gồm cả mũi tên. Ô rỗng dùng lại hằng này, không thêm
  hằng mới.
- Nhãn chữ chỉ hiện từ `sm` (640px) trở lên (`hidden sm:inline`), dưới đó cả hai
  trạng thái chỉ còn biểu tượng.

## 4. Phương án dự phòng (B)

Chỉ làm nếu A không đạt tiêu chí 2.

Cookie gợi ý hiển thị (KHÔNG httpOnly, giá trị chỉ "1", thuần hiển thị —
enforcement thật vẫn ở Server Component + RLS), do `proxy.ts` đồng bộ mỗi request
dựa trên kết quả `getUser()` sẵn có; cộng một script inline trong `<head>` đặt
`data-auth` trên `<html>` trước khi vẽ; header render cả hai biến thể, CSS ẩn
một. Mặc định `data-auth="0"` để khi không có JS thì hiện trạng thái chưa đăng
nhập (an toàn hơn).

Rủi ro phải xử lý nếu dùng B: cookie gợi ý lệch với session thật; không được để
nó tham gia cache key.

## 5. Hoàn thành khi

1. Không tái diễn hồi quy hiệu năng.
   Đo cùng phiên, cùng máy, cùng bản production: checkout `main` đo 15 lần mỗi
   trang, rồi checkout nhánh PR đo 15 lần mỗi trang. Lấy trung vị.
   Đạt khi: trung vị nhánh PR ≤ trung vị `main` + 1,5 ms VÀ ≤ 2x trung vị
   `main`, cho cả 4 trang (`/`, `/sach`, `/tu-sach`, `/tu-sach/<slug>`).
   Ghi cả min–max để thấy độ nhiễu.
   Lý do đổi: mốc tuyệt đối của 2A đo ở phiên khác; ba lần đo 2A của cùng một
   trang `/` với cùng mã cho 4,17 / 4,98 / 5,19 ms, chênh 24,5% — lớn hơn ngưỡng
   20% cũ. Ngưỡng nhỏ hơn nhiễu thì không phân biệt được đạt và trượt. Hồi quy
   cần bắt là loại 223x (2,9 ms → 647,7 ms).

2. Không lần nào người đã đăng nhập nhìn thấy trạng thái chưa đăng nhập sau khi
   khung đầu đã vẽ.
   Tải đầy đủ `/` 10 lần với phiên thật, trình duyệt thật chạy rAF 60 Hz, đo
   bằng `MutationObserver` + `PerformanceObserver`. Cấm dùng
   `requestAnimationFrame` trong mã đo. Đếm số lần chữ "Đăng nhập" hiển thị sau
   mốc FCP: phải bằng 0/10.
   ĐỐI CHỨNG BẮT BUỘC: chạy lại đúng phép đo với phiên chưa đăng nhập. Nếu đối
   chứng cũng ra 0 thì phép đo không phân biệt được trạng thái → phép đo hỏng,
   không phải mã đạt.
   Mốc trước khi sửa (đo 30/09, Edge headless): 3/5 lần thấy sai, kéo dài
   234–273 ms. Nguyên nhân: React streaming chỉ hiện Suspense boundary ngay nếu
   nó xong trước khung vẽ đầu; xong sau thì chờ `$RT`+300 ms.

## 6. Điều cần làm rõ trước khi code

Dừng lại và hỏi, đừng tự chọn, nếu gặp:

- Sau phương án A, tiêu chí 2 vẫn không đạt: báo số đo trước, rồi mới làm B.
- Đối chứng của tiêu chí 2 cũng ra 0: phép đo hỏng, sửa phép đo trước khi kết luận
  về mã.

Ba điểm dưới đây do người soạn file này thêm từ việc đọc mã, chưa có quyết định:

- Với A, người chưa đăng nhập thấy ô chữ rỗng thay cho "Đăng nhập" cho tới khi
  phần thật về (theo cơ chế trên, có thể tới ~300 ms). Chấp nhận không?
- Khi trình duyệt tắt JavaScript, React thay boundary bằng script inline nên
  không chạy được, và fallback là thứ còn lại: hiện là liên kết dùng được, với A
  là ô rỗng, tức header không có liên kết đăng nhập. Cần xác nhận khi làm; nếu
  đúng thì có giữ một liên kết trong `<noscript>` không?
- Dưới `sm` (640px), fallback vẫn là liên kết có `aria-label="Đăng nhập"`
  (`components/LoginNavLink.tsx`), nên người dùng trình đọc màn hình đã đăng nhập
  vẫn nghe "Đăng nhập" trong khoảng đó dù mắt không thấy chữ. Tiêu chí 2 chỉ đếm
  chữ hiển thị nên không bắt được. Có đưa vào phạm vi không?

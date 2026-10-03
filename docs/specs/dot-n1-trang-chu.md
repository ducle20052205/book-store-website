# Đợt N+1 — Chữa chuỗi truy vấn tuần tự ở trang chủ

Phiên bản 1.0 · 03/10/2026 · Đợt TỐI ƯU, không phải đợt tính năng: hành vi và giao diện không được đổi; tiêu chí quan trọng nhất là HTML trang chủ giống baseline.
Nhánh: `perf/n1-trang-chu`. Một PR, chờ duyệt; không merge, không áp migration lên hosted, không đụng dữ liệu hosted, không sửa `docs/trang-quyet-dinh-dac-ta-tong.md`.

Tài liệu tham chiếu, KHÔNG chép lại nội dung vào đây:
- `docs/trang-quyet-dinh-dac-ta-tong.md` mục 5.1 (Cache Components, `use cache` không gọi `cookies()`), mục 9 ("N+1 ở trang chủ ... chưa có spec"), mục 8 (cách đọc số đo: số mẫu, độ nhiễu, cùng điều kiện).
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md`, mục "Runtime caching considerations": trên serverless, hàm `use cache` dùng chung giữa hai trang chạy lại ở MỖI lần tái tạo shell tĩnh, và entry không giữ giữa các instance — nên số truy vấn và độ sâu chuỗi là chi phí thật của mỗi lần tái tạo hoặc tải nguội.
- `lib/queries.ts` (các hàm `use cache`), `app/page.tsx` (trang chủ).

## 0. Ranh giới đợt

Trong phạm vi: `lib/queries.ts` (bốn hàm: `getFeaturedCollection`, `getEditorialPick`, `getCollectionsWithPreview`, `getCategoryCounts`, và `getFeaturedBookExtrasBySlug`) và `app/page.tsx` (thứ tự khởi chạy các lời gọi). Hai file mã, không file nào khác.

Ngoài phạm vi: mọi thay đổi giao diện hoặc nội dung; thêm thư viện; hàm RPC mới hoặc migration (chỉ được cân nhắc nếu truy vấn nhúng của PostgREST và `Promise.all` không đủ — đợt này không cần); `Header`, `Footer`, `getCategoryTree`, `getCollections`, `getCategoryNameMap`, `getBookCollectionRefMap`, `getNewestBooks`, `getBestsellingBooks` (không đổi); `/sach/[slug]` và các trang khác ngoài việc chứng minh không hồi quy.

Thứ tự ưu tiên của cách chữa: (a) gom bằng truy vấn nhúng sẵn có của PostgREST; (b) chạy song song bằng `Promise.all`; (c) RPC mới — không dùng.

## 1. Baseline (đo TRƯỚC khi sửa, commit `bbdf305`, 03/10/2026)

**Điều kiện đo.** Stack Supabase cục bộ; app là bản production (`next build` rồi `next start`) trỏ qua một proxy chỉ-ghi-nhật-ký đặt giữa app và PostgREST (`127.0.0.1:54399` → Kong `:54321`), mỗi truy vấn ghi giờ bắt đầu, giờ kết thúc, phương thức, đường dẫn. Bộ đo không nằm trong repo. `NEXT_PUBLIC_SUPABASE_URL` được nhúng lúc build nên bản đo build với địa chỉ proxy; bản commit không bao giờ chứa địa chỉ đó.

**Hai kịch bản "nguội".** Một request tới `/` được phục vụ từ shell tĩnh đã prerender thì KHÔNG tạo truy vấn upstream nào (đo: 25 mẫu, 0 truy vấn). Truy vấn chỉ chạy ở hai trường hợp, đo riêng:
1. **Tải nguội thật** — lượt tải đầu tiên khi không còn bản prerender của `/` (tương đương hết `expire` hoặc instance mới): xoá `index.html`, `index.meta`, `index.segments` của `/` trong `.next/server/app`, tiến trình `next start` mới cho mỗi mẫu, rồi gọi `/dang-nhap` (làm nóng mô-đun, không tạo truy vấn) và `/`. Người dùng BỊ CHẶN chờ chuỗi truy vấn.
2. **Tái tạo nền** — lượt tải đầu tiên sau khi bản prerender quá `revalidate` 60 giây. Người dùng nhận bản cũ ngay (TTFB thấp), truy vấn chạy nền.

**Độ sâu chuỗi** = số bậc tối đa: bậc(i) = 1 + bậc lớn nhất trong các truy vấn đã KẾT THÚC trước khi i BẮT ĐẦU. Không trễ nhân tạo thì ranh giới giữa các bậc mờ vì dao động lịch trình (đo được 5–7 cho cùng một mã), nên con số chính thức đo với **trễ nhân tạo 80 ms mỗi truy vấn** ở proxy (các bậc phụ thuộc tách rõ); báo kèm D.

| Phép đo (trước khi sửa) | Số mẫu | Kết quả |
|---|---|---|
| Số truy vấn PostgREST, tải nguội thật, D = 0 | 12 | **21** ở 11/12 mẫu; 23 ở 1/12 (hai lệnh gọi trùng một hàm `use cache` cùng trượt, chạy song song) |
| Số truy vấn, tải nguội thật, D = 80 ms | 5 | **21** ở 5/5 |
| Độ sâu, tải nguội thật, D = 80 ms | 5 | **5** ở 5/5 (các bậc: 8 / 10 / 1 / 1 / 1 truy vấn) |
| Độ sâu quan sát, D = 0 | 12 | 5 ở 10/12, 6 ở 2/12 |
| Số truy vấn, tái tạo nền, D = 0 | 5 | 21 ở 5/5; trải từ truy vấn đầu tới cuối: trung vị 113,9 ms (113,3–122,7) |
| TTFB cục bộ, tải nguội thật, D = 0 | 12 | trung vị **305,4 ms**, p90 318,7, nhỏ nhất–lớn nhất 281,7–319,4 (dao động mốc 37,7 ms); tổng thời gian tải trung vị 319,6, p90 332,8 |
| TTFB cục bộ, tải nguội thật, D = 80 ms | 5 | trung vị 745,0 ms, p90 756,7 (chỉ để xem cách chuỗi nhân lên theo độ trễ; không so với D = 0) |
| TTFB cục bộ, tái tạo nền (người dùng nhận bản cũ) | 5 | trung vị 20,6 ms, p90 27,5 |
| TTFB cục bộ, ấm (từ prerender) | 25 | trung vị 3,7 ms, p90 5,0; tổng 22,7 / 26,4 ms; 0 truy vấn |
| Số truy vấn của một lần `next build` (mọi route cộng lại, vì hàm `use cache` dùng chung) | 1 | 28 |
| Production công khai `book-store-website-dun.vercel.app`, GET thuần, khách | 14 | TTFB trung vị 137,2 ms, p90 910,4 (98,3–1542,6); `x-vercel-cache`: HIT 13, PRERENDER 1; vùng `hkg1` |

**Cấu thành 21 truy vấn** (tải nguội, D = 80): `categories` 4 (cây danh mục, bảng tên, hai bậc `getCategoryById` của thẻ nổi bật), `collections` 3 (hero, editorial, `getCollections`), `books` 2 (sách mới, mô tả thẻ nổi bật), `collection_books` 6 (bảng chip "Trong tủ sách", hero, editorial, 3 tủ xem trước), `POST rpc/search_books` 1, `HEAD books` 5 (đếm mỗi danh mục cha).

**Ước lượng cũ ở mục 9 file quyết định ("~25–30 truy vấn, 4–5 bậc") so với số đo:** 21 truy vấn và 5 bậc cho một lần dựng trang chủ; 28 là tổng của cả `next build` (mọi route).

**Chuỗi nối tiếp tạo ra 5 bậc** (đọc từ mã, khớp số đo): bậc 1–2 là `getFeaturedCollection`, `getEditorialPick`, `getCollectionsWithPreview` (bảng → bảng nối) và `getCategoryCounts` (cây → 5 lệnh `HEAD`), chờ trong một `Promise.all`; bậc 3–5 là `getFeaturedBookExtrasBySlug`, chỉ bắt đầu SAU KHI cả `Promise.all` xong (cần slug của cuốn đầu mỗi tab), rồi tự có chuỗi sách → danh mục con → danh mục cha.

**Độ nhiễu của HTML (cùng commit chụp nhiều lần, trước khi so sánh).**

| Nhóm | Số bản chụp | Số bản khác nhau |
|---|---|---|
| `/` khách, ấm (3 tiến trình, 6 + 3 + 3) | 12 | 1 (giống hệt từng byte, 127.566 B) |
| `/` khách, nguội lần đầu / nguội lần hai | 4 / 4 | 1 / 1; và bằng bản ấm từng byte |
| `/` đã đăng nhập | 3 | 2 — chỉ khác thứ tự các khối stream; cùng 127.208 B và cùng tập token |
| `/sach`, `/sach?page=2`, `/sach?category=…`, `/sach/[slug]` | 3 mỗi URL | 1 mỗi URL |
| `/tu-sach` và 3 trang `/tu-sach/[slug]` | 3 mỗi URL | 1 mỗi URL |

Không tìm thấy nonce, mốc thời gian hay id ngẫu nhiên trong HTML khách. Cách chuẩn hoá duy nhất cần: HTML đã đăng nhập so theo **tập token** (cắt sau mỗi `>`, sắp xếp), vì thứ tự các khối stream của phần phụ thuộc cookie không tất định; cùng cách áp ở cả hai phía.

## 2. Yêu cầu

- **FR-N1.1 — Hero và editorial: mỗi cái một truy vấn.** `getFeaturedCollection` và `getEditorialPick` lấy tủ sách kèm các dòng `collection_books` và sách bằng một truy vấn nhúng (`collection_books(position, …, books(…))`, sắp theo `position` và `limit` đặt trên bảng nhúng), thay cho chuỗi hai bậc. Giữ nguyên bộ lọc (`is_featured`), thứ tự, số dòng (5 và 1), danh sách cột, phép `maybeSingle` của hero (nhiều hơn một tủ nổi bật → `null`, như cũ) và điều kiện `null` của editorial.
- **FR-N1.2 — Tủ sách xem trước: một truy vấn thay cho 1 + N.** `getCollectionsWithPreview` lấy mọi tủ kèm tối đa 4 dòng đầu (theo `position`) của mỗi tủ bằng một truy vấn nhúng, bỏ vòng lặp một truy vấn cho mỗi tủ và lệnh gọi `getCollections()` bên trong. Hình dạng đối tượng trả về (`CollectionPreview`) và thứ tự khoá không đổi.
- **FR-N1.3 — Đếm danh mục: một truy vấn thay cho 1 + 5.** `getCategoryCounts` đọc `categories` kèm số sách của từng danh mục bằng nhúng đếm (`books(count)`) rồi cộng cha với con trong mã, thay cho 5 lệnh `HEAD` đếm tuần tự sau khi có cây. Dùng chung hàm thuần dựng cây với `getCategoryTree` để không có hai bản logic.
- **FR-N1.4 — Thẻ nổi bật: một truy vấn, khởi chạy sớm.** `getFeaturedBookExtrasBySlug` lấy `description` và danh mục (kèm danh mục cha) của sách bằng một truy vấn nhúng, bỏ chuỗi `getCategoryChainById` hai bậc. Ở `app/page.tsx`, lời gọi này khởi chạy ngay khi hai danh sách đầu (mới nhất, bán chạy) về, song song với các khối còn lại, thay vì đợi cả `Promise.all`. Quy tắc chọn nhãn không đổi: danh mục cha nếu có, không thì chính danh mục.
- **FR-N1.5 — Bất biến.** HTML, hành vi và giao diện không đổi; trang chủ vẫn prerender kiểu PPR; hàm `use cache` vẫn không gọi `cookies()` và vẫn `cacheLife("minutes")`; chỗ đọc cookie vẫn trong `<Suspense>`; không thêm thư viện; không RPC, không migration; `Header` và `Footer` không đổi.

Mục tiêu thiết kế (không phải tiêu chí): từ 21 truy vấn / 5 bậc xuống khoảng 11 truy vấn / 2 bậc (mười truy vấn ở bậc 1, một truy vấn của thẻ nổi bật ở bậc 2, vì cuốn đứng đầu tab Bán chạy chỉ biết sau khi RPC trả về).

## 3. Tiêu chí nghiệm thu

Điều kiện đo giống baseline (mục 1): cùng máy, cùng dữ liệu cục bộ, cùng bộ đo, cùng proxy; mỗi con số báo kèm số mẫu; "trước" lấy ở mục 1, "sau" đo lại bằng đúng bộ đo đó. Mọi tiêu chí có đối chứng ở trạng thái ngược lại.

1. **HTML trang chủ giống baseline.** Khách: 12 bản ấm (3 tiến trình) và 8 bản nguội của bản sau phải giống từng byte bản baseline (127.566 B); đã đăng nhập: 3 bản, so theo tập token. Liệt kê từng khác biệt còn lại và lý do. Đối chứng độ nhạy: một bản sửa cố ý một ký tự của HTML baseline bị bộ so sánh bắt.
2. **Số truy vấn giảm.** Tải nguội thật D = 0 (12 mẫu) và D = 80 (5 mẫu), tái tạo nền (5 mẫu): báo trước/sau, giảm ở mọi mẫu; kèm phân rã theo bảng.
3. **Độ sâu chuỗi giảm.** D = 80, 5 mẫu: trước 5, báo sau; kèm các bậc.
4. **TTFB cục bộ.** Tải nguội thật D = 0, 12 mẫu mỗi phía, trung vị và p90. Dao động mốc ở baseline là 37,7 ms (nhỏ nhất–lớn nhất): chênh lệch nhỏ hơn con số đó chỉ được kết luận về HƯỚNG, không nói độ lớn. Ấm và tái tạo nền báo kèm để chứng minh không hồi quy.
5. **Mọi khối vẫn đúng dữ liệu.** Đối chiếu DOM với truy vấn độc lập vào DB: hero (tủ nổi bật, 5 cuốn theo `position`), 5 thẻ danh mục (tên, số cuốn), khối editorial (lời ghi, cuốn, tủ), 17 thẻ Sách mới và 17 thẻ Bán chạy (tên, giá, giá giảm, nhãn "Hết hàng", nhãn danh mục, chip "Trong tủ sách", mô tả và nhãn của thẻ nổi bật), 3 thẻ tủ sách (tên, mô tả, số bìa 4 hoặc 3). Đối chứng: sửa cố ý một giá trong bản sao DOM thì phép so sánh báo lệch.
6. **`/sach` và `/tu-sach` không hồi quy.** HTML giống baseline của chính chúng (3 URL `/sach`, `/sach/[slug]`, 4 URL `/tu-sach`), 3 bản mỗi URL; thêm `/gio-hang` và `/dang-nhap` vì dùng cùng các hàm.
7. **PPR còn nguyên.** Bảng route của `next build` vẫn ghi `◐` (Partial Prerender) cho `/`; `index.meta` của `/` còn khoá `postponed`; không hàm `use cache` nào trong `lib/` import hoặc gọi `cookies()`/`headers()`.
8. **Không phụ thuộc mới; kiểm tĩnh sạch.** `package.json` và `package-lock.json` không đổi; `next build`, `tsc --noEmit`, `eslint` sạch.

## 4. Việc không làm trong đợt này (ghi để người đọc sau không phải đoán)

- Gộp xuống còn khoảng 5 truy vấn bằng hai "kho" dùng chung (một cho `categories`, một cho `collections`/`collection_books`, mọi hàm suy ra từ kho): bỏ vì kéo `Header`, `Footer`, `/sach`, `/tu-sach`, `/gio-hang` vào phạm vi và đổi ranh giới cache của nhiều hàm cùng lúc; đợt tối ưu nên ít đổi nhất.
- Kéo `description` và danh mục của mọi sách vào bậc 1 để bỏ bậc 2 của thẻ nổi bật (độ sâu 1): đánh đổi thêm dữ liệu mỗi lần tái tạo lấy một bậc; không cần cho mục tiêu.
- Đo `after` trên production: không làm được trước khi merge; và ở production phần lớn request là `HIT` của CDN nên TTFB ngoài không phản ánh chuỗi truy vấn (mục 1).

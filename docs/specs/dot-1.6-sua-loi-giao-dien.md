# Đợt 1.6 — Sửa lỗi giao diện

Danh sách các lỗi và sai lệch đã biết ở bước 1, gom lại để xử lý trong đợt 1.6. Mỗi mục ghi hiện trạng đo được, điều SRS yêu cầu, và trạng thái.

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

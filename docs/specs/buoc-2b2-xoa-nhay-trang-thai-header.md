# Bước 2B.2 — Xoá nháy trạng thái header

Tài liệu liên quan: docs/specs/buoc-2b-dang-nhap-dang-ky.md (tiêu chí 8 gốc), docs/specs/buoc-2b1-hieu-nang-hosted.md (đợt trước), docs/SRS.md (NFR-3.6 chuyển động, NFR-6.2/6.3 accessibility).

## 1. Vấn đề

Người đã đăng nhập tải trang, header hiển thị chữ "Đăng nhập" trong khoảng 234–273 ms rồi mới đổi sang trạng thái đúng. Đo ở đợt 2B bằng Edge headless: 3/5 lượt tái hiện.

Giả thuyết nguyên nhân (chưa xác nhận trên mã ở đợt này): phần auth của header nằm trong một Suspense boundary vì phải đọc cookie; React streaming chỉ hiện nội dung boundary ngay nếu nó xong trước khung vẽ đầu, xong sau thì hiện fallback rồi chờ `$RT+300ms`. Fallback hiện tại nhiều khả năng đang render trạng thái khách ("Đăng nhập"), nên trạng thái trung gian là một thông tin **sai**.

## 2. Mục tiêu và không-mục tiêu

**Mục tiêu:** trạng thái trung gian không còn chứa thông tin sai về việc người dùng đã đăng nhập hay chưa.

**Không-mục tiêu, ghi rõ để không ai nghiệm thu nhầm:**
- Không làm cho trạng thái thật đến nhanh hơn. Thời gian chờ ~250 ms giữ nguyên.
- Không đụng `getClaims()` ở Header hay `getUser()` ở `proxy.ts` (bất đối xứng có chủ đích, xem CLAUDE.md).
- Không đụng cấu hình prefetch (đã chốt không làm ở 2B.1).
- Không làm phương án dự phòng cookie gợi ý hiển thị ở đợt này. Chỉ mở ra nếu TC-1 trượt.

**Đánh đổi đã chốt:** khách chưa đăng nhập — gần như 100% người xem portfolio — sẽ thấy ô chữ rỗng trong thời gian chờ thay vì thấy ngay chữ "Đăng nhập". Chấp nhận, vì "chưa có thông tin" không phải lỗi còn "thông tin sai" thì có. Vì vậy fallback **vẫn giữ icon người** để ô không trống hoàn toàn.

## 3. Bước 0 — Khảo sát bắt buộc trước khi sửa

Trước khi thay đổi bất cứ dòng mã nào, khảo sát và báo cáo:

1. Liệt kê **mọi** vị trí trong giao diện hiển thị trạng thái đăng nhập (header desktop, menu mobile, bất cứ chỗ nào khác). Đợt này phải xử lý hết, không chỉ header desktop.
2. Với mỗi vị trí: nó nằm trong Suspense boundary nào, fallback hiện tại render ra gì, dữ liệu auth lấy từ đâu (Server Component hay client).
3. Xác nhận hay bác bỏ giả thuyết ở mục 1: chữ "Đăng nhập" trong giai đoạn trung gian đến từ **Suspense fallback phía server** hay từ **render client trước hydration**.

**Nếu giả thuyết bị bác bỏ, dừng lại, báo cáo, không tự chọn cách sửa khác.** Cách sửa ở mục 4 chỉ đúng cho trường hợp fallback server.

## 4. Thay đổi cần làm

- **FR-2B2.1** — Fallback của Suspense bao quanh phần auth đổi thành một component không chứa thông tin trạng thái: icon người sẵn có + một ô chữ **rỗng**. Không chữ "Đăng nhập", không tên người dùng, không skeleton nhấp nháy.
- **FR-2B2.2** — Ô chữ có **bề rộng cố định** (không phải min-width co giãn), giống nhau ở fallback và ở cả hai trạng thái thật; chữ thật dài hơn thì cắt bằng ellipsis. Mục đích: hộp auth không đổi bề rộng khi fallback được thay bằng nội dung thật.
- **FR-2B2.3** — Fallback **không tương tác và không focusable**: không `<a>`, không `<button>`, không `tabindex` ≥ 0. Lý do: trong lúc chưa biết trạng thái thì không có đích đến đúng cho cú bấm; thà mất một cú bấm hiếm trong 250 ms còn hơn điều hướng sai.
- **FR-2B2.4** — Icon trong fallback có `aria-hidden="true"`; fallback không có `aria-live`, không thông báo gì cho screen reader. Trạng thái thật khi tới mới mang nhãn và mới focusable.
- **FR-2B2.5** — Phần tử bọc slot auth mang `data-testid="header-auth"` ở **mọi** vị trí tìm thấy ở Bước 0, và thuộc tính này **chỉ** xuất hiện ở đó. Một `data-testid` riêng cho mỗi vị trí nếu có nhiều hơn một (ví dụ `header-auth`, `header-auth-mobile`).
- **FR-2B2.6** — Vùng chạm của trạng thái thật giữ tối thiểu 44×44px (NFR-6.2); kích thước hộp fallback bằng đúng kích thước hộp trạng thái thật.

## 5. Môi trường đo

- Stack Supabase cục bộ (Docker), app chạy **bản production** (`next build` rồi `next start`) ở `127.0.0.1:3100`. Không đo trên dev server.
- Độ trễ Supabase cộng thêm: bắt đầu ở **+160 ms**, đúng thiết lập đã dùng ở 2B.1.
- Trình duyệt: **Edge headless qua CDP**. Không dùng trình duyệt tích hợp (`requestAnimationFrame` ở đó chạy ~2 Hz, mọi phép đo theo frame đều vô dụng).
- Dụng cụ: `PerformanceObserver` cho `paint` (lấy FCP) và `layout-shift` (CLS); `MutationObserver` trên node `[data-testid="header-auth"]`, ghi lại mọi giá trị `textContent` kèm `performance.now()`.
- **Mọi so sánh trước/sau phải cùng một giá trị độ trễ.** Nếu phải đổi, đo lại cả hai phía.

## 6. Tiêu chí nghiệm thu

Mỗi tiêu chí ghi kèm: lệnh/script cho ra con số, số mẫu, và kết quả.

- **TC-0 — Selector đặc hiệu.** `data-testid="header-auth"` xuất hiện đúng 1 lần trong mã nguồn (đếm bằng `rg -c`) và `document.querySelectorAll('[data-testid="header-auth"]').length === 1` trên trang đã render. Nếu có slot mobile riêng thì cùng kiểm với testid của nó. **Tiêu chí này phải đạt trước, nếu không mọi số đo bên dưới đều vô giá trị** (bài học tiêu chí 8 đợt 2B: selector `button[aria-haspopup]` khớp cả nút menu điều hướng).
- **TC-1 — Trạng thái chính.** Phiên **đã đăng nhập**, 10 lượt tải `/`: số lượt mà `textContent` của slot auth chứa chuỗi "Đăng nhập" tại bất kỳ thời điểm nào từ FCP tới khi ổn định = **0/10**.
- **TC-2 — Đối chứng trạng thái ngược.** Phiên **chưa đăng nhập**, 10 lượt tải `/`: (a) số lượt slot auth chứa tên người dùng hoặc chuỗi của menu tài khoản = **0/10**; (b) số lượt kết thúc bằng chữ "Đăng nhập" = **10/10**. Vế (b) là bằng chứng script thật sự đọc được nội dung; thiếu nó thì 0/10 ở vế (a) không chứng minh được gì.
- **TC-3 — Đối chứng phép đo trên mã cũ.** Chạy **đúng script của TC-1**, cùng độ trễ, trên commit trước khi sửa (checkout tạm vào worktree riêng, không đụng nhánh làm việc). Phải thấy **≥3/10** lượt có chữ "Đăng nhập" ở phiên đã đăng nhập.
  - Baseline ra 0/10 → hiện tượng không tái hiện ở điều kiện này. Tăng độ trễ theo bậc +300 ms, +500 ms, đo lại; ghi rõ giá trị cuối cùng dùng được.
  - Tới +500 ms vẫn không tái hiện → **dừng, báo cáo, không kết luận "đạt"**. Khi đó TC-1 chỉ chứng minh được "mã mới không sai", không chứng minh được "đã chữa".
- **TC-4 — CLS.** CLS của `/` = **0**, 5 lượt mỗi trạng thái (đã đăng nhập / chưa đăng nhập). Ràng buộc sẵn có: NFR-3.6.
- **TC-5 — Bề rộng không đổi.** `getBoundingClientRect().width` của slot auth lúc fallback và lúc ổn định chênh **≤ 0,5 px**, 5 lượt mỗi trạng thái. Ngưỡng này là sai số làm tròn của trình duyệt, không phải ngưỡng phần trăm.
- **TC-6 — Fallback không focusable.** Số phần tử focusable (`a[href], button, [tabindex]:not([tabindex="-1"])`) bên trong slot auth: **0 lúc fallback**, **≥1 sau khi ổn định**, 5 lượt mỗi trạng thái. Hai con số phải khác nhau, nếu bằng nhau thì phép đo hỏng.
- **TC-7 — Số tham khảo, không đặt ngưỡng.** Ghi lại khoảng cách FCP → lúc chữ thật xuất hiện, 10 lượt mỗi trạng thái, báo cáo trung vị và khoảng. Không có ngưỡng đạt/trượt vì chưa đo được độ nhiễu của chính phép đo này. Con số này là mốc cho lần sau.
- **TC-8 — Kiểm tay trên preview (người dùng làm, Claude Code không làm được).** Đăng nhập trên preview Vercel, DevTools bật throttle "Slow 4G", tải lại 5 lần, quay Performance panel và xem filmstrip. Ghi nhận có khung hình nào hiện chữ "Đăng nhập" không. Đối chứng: lặp lại ở trạng thái chưa đăng nhập.
- **TC-9 — Không hồi quy chức năng (kiểm tay).** Sau khi ổn định: dropdown mở được, hiện đúng họ tên và email, đăng xuất chạy; menu mobile tương tự.

## 7. Phương án dự phòng — chỉ mở khi TC-1 trượt

Cookie gợi ý hiển thị do `proxy.ts` đồng bộ: không httpOnly, giá trị chỉ `1`, thuần hiển thị, không mang danh tính và không dùng để phân quyền; script inline đặt `data-auth` trên `<html>` trước khi vẽ. Không làm ở đợt này. Nếu phải mở, viết spec riêng vì nó thêm một nguồn sự thật thứ hai về trạng thái auth và cần ghi rõ cách xử lý khi cookie lệch với phiên thật.

## 8. Phạm vi file dự kiến

Chỉ các file của header/menu mobile và component fallback mới. Không đụng `proxy.ts`, `lib/supabase/*`, các Server Action auth.

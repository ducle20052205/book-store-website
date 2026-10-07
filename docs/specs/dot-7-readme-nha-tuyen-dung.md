# Đợt 7 — README cho nhà tuyển dụng

Phiên bản 1.1 · 07/10/2026 · Viết `README.md` ở gốc repo (hiện đúng 1 dòng). Đây là **bước 7 và là bước cuối** của định nghĩa "xong" ở mục 4 file quyết định.
**Đổi so với 1.0** (lần sửa duy nhất, Claude Code chứng minh bốn khẳng định sai so với repo): (1) FR-R.4 bỏ "Storage" khỏi bảng công nghệ — repo không dùng Supabase Storage (0 tham chiếu `storage` trong `app/`, `components/`, `lib/`, 0 trong `supabase/migrations/`); (2) "số đo 12 đợt" ở mục 2 và FR-R.6 đổi thành "số đo ở mục 7" — mục 7 có 12 mục `7.x`, trong đó một mục là rà soát accessibility chứ không phải đợt, nên không phải 12 đợt; (3) "22 file" ở phần tài liệu tham chiếu bỏ con số — thư mục `docs/specs/` có 23 file sau khi commit chính spec này, và số đó do README đếm; (4) TC-R.6 không thể đạt nguyên văn: đợt phải commit chính spec này vào `docs/specs/`, nên `git diff` có 2 file chứ không phải 1 — nguyên văn 1.0 là "đúng 1 file đổi (`README.md`); 0 file trong ... `docs/specs/` ..."; sửa thành hai file có tên.
Nhánh: `dot-7-readme`. Một chặng, một PR. Đợt này **không sửa một dòng mã nào**: chỉ `README.md`, cộng hai dòng ghi nhận ở file quyết định khi đóng đợt.

**Giới hạn sửa spec: MỘT lần**, và chỉ khi Claude Code chứng minh một khẳng định trong spec sai so với repo.

**Lệch có chủ ý so với các spec trước:** đợt này KHÔNG có Use Case diagram và User Stories. README là tài liệu, không phải tính năng — không có actor thao tác, không có luồng hệ thống. Thay vào đó: dàn ý nội dung bắt buộc (mục 2) và tiêu chí đo được (mục 4). Ghi rõ ở đây để người đọc sau không tưởng là thiếu sót.

Tài liệu tham chiếu, KHÔNG chép nội dung vào README:
- `docs/trang-quyet-dinh-dac-ta-tong.md` mục 1 (bối cảnh, ràng buộc gói miễn phí), mục 2 (định vị), mục 3 (nhận diện, hệ layout), mục 4 (định nghĩa "xong", thứ tự còn lại, tạm dừng mobile), mục 5 và 5.1, 5.2 (kiến trúc, số đo vùng), mục 6 (dữ liệu mẫu, nguyên tắc trung thực), **mục 7 (số đo từng đợt)**, mục 8 (bài học), mục 9 (việc còn mở).
- `docs/SRS.md` (64 FR), `docs/specs/*`, `docs/runbooks/*`.

---

## 0. Ranh giới đợt

**Trong phạm vi:** `README.md` ở gốc repo. Đúng một file.

**Ngoài phạm vi:** ảnh chụp hay GIF nhúng trong README · badge CI · hướng dẫn đóng góp · giấy phép · bản tiếng Anh · sửa bất kỳ dòng mã nào · sửa `docs/SRS.md` · sửa `docs/specs/*`.

**Ghi nhận, cũng không làm:** bản tiếng Anh cho nhà tuyển dụng nước ngoài (đợt sau, nếu cần) · trang giới thiệu trong chính website (README nằm ở GitHub, không phải ở site).

---

## 1. Hai việc tay của chủ dự án, PHẢI xong trước khi Claude Code viết README

Claude Code không tạo hoặc đăng nhập tài khoản trên hosted Auth (mục 5.2). Hai việc dưới đây là của chủ dự án, và README phụ thuộc kết quả của chúng:

### 1.1 Chạy seed lên hosted
Theo `docs/runbooks/chay-seed-demo.md`. Production đang có 2 đơn; không chạy thì mục "dashboard có số thật" của README là lời nói suông. Sau khi chạy, ghi lại 6 con số từ `--verify` để README dùng.

### 1.2 Tạo tài khoản admin demo RIÊNG trên hosted
- Email **`admin-demo@example.com`** (RFC 2606). **Tuyệt đối không công bố tài khoản admin cá nhân đang có** — mục 6: email cá nhân không bao giờ được commit, và README là file công khai nhất của repo.
- Mật khẩu: một chuỗi đặt riêng cho tài khoản này, **khác** mật khẩu của mọi tài khoản thật, và khác `SEED_DEMO_PASSWORD`.
- Đặt `role = 'admin'` theo `docs/runbooks/tao-admin-dau-tien.md`.
- Tài khoản admin cá nhân giữ nguyên, không công bố, không nhắc tới trong README.

---

## 2. Yêu cầu chức năng

### FR-R.1 — Mở đầu: đây là gì, trong 15 giây

- Tên dự án, một câu nói rõ **đây là dự án portfolio cá nhân, không kinh doanh thật**.
- Một đoạn 3–4 câu: cửa hàng sách độc lập, định vị "nhà sách tuyển chọn", người đọc 18–30.
- **Link demo** và **link repo**, đặt ngay dưới tiêu đề.
- Một dòng nói thẳng người đọc mục tiêu: nhà tuyển dụng hướng BA/PM/Product.
- Không có badge, không có ảnh, không có emoji trang trí.

### FR-R.2 — "Thử trong 2 phút": bảy bước thành đường đi bấm được

Chép **bảy bước của định nghĩa "xong"** (mục 4 file quyết định) thành một danh sách đánh số, mỗi bước là một thao tác người lạ làm được trên site thật, kèm đường dẫn cụ thể.

- Bước 6 cần đăng nhập: **công bố `admin-demo@example.com` và mật khẩu ngay tại bước đó**, trong một khối mã để copy được.
- Ngay dưới, một đoạn ngắn nói rõ ba điều: tài khoản này ai cũng dùng được; dữ liệu là demo và được dựng lại bằng một lệnh khi cần; nếu người đọc thấy dữ liệu trông lạ thì đó là dấu vết người khác thử trước, không phải lỗi.
- Không hứa dữ liệu bất biến. Không viết "vui lòng không phá".

### FR-R.3 — "Vì sao từng quyết định" — phần dài nhất và quan trọng nhất

**Sáu quyết định**, mỗi quyết định một tiểu mục có đúng ba phần: **bối cảnh → chọn gì → đánh đổi là gì**. Mỗi tiểu mục 80–150 từ. Lấy từ mục 5 và 8 file quyết định, kèm số đo thật khi có.

Sáu quyết định bắt buộc (không thay, không thêm):
1. **Bìa sách sinh tự động, không dùng ảnh bản quyền** — quyết định chính thức chứ không phải giải pháp tạm; đánh đổi: toàn site không có một pixel ảnh nào (mục 3, mục 8).
2. **Hủy đơn làm bằng hàm `cancel_order`, không bằng policy RLS** — RLS không giới hạn được theo cột, nên policy "chỉ được đặt `cancelled`" vẫn cho khách sửa kèm `total_amount` trong cùng câu `UPDATE`. Kèm số đo: hàm thiếu khoá sai **12/12** ở cửa sổ 50 ms.
3. **Luồng trạng thái đơn và cộng trả kho do MỘT trigger ở database đảm nhiệm** — đúng cho mọi đường đi, kể cả sửa tay trong SQL Editor. Kèm: bỏ mệnh đề `WHEN` thì cộng thừa **12/12**; giữ thì đúng **30/30**.
4. **Đổi vùng Vercel từ `iad1` sang `hnd1`** — một thay đổi trong dashboard, không một dòng mã, lấy lại hệ số ~22 lần ở tầng truy vấn (trung vị **280 ms → 12,5 ms**; request trên 500 ms **67/154 → 0/384**). Bài học: kiểm hạ tầng trước khi tối ưu mã.
5. **Email xác nhận đơn do ứng dụng gửi qua HTTP API, không qua Make.com** — vì nó là bước 4 của định nghĩa "xong" nên phải chắc chắn và kiểm được bằng test trong repo. Quy tắc phân định: khách đang chờ thì app lo, cửa hàng dùng thì Make lo.
6. **Giỏ của khách chưa đăng nhập lưu ở cookie, không `localStorage`** — badge số lượng phải đúng ngay trong HTML đầu. Đánh đổi đã ghi nhận: cookie không có read-modify-write nguyên tử.

### FR-R.4 — Kiến trúc, một sơ đồ

- Một sơ đồ ASCII trong khối mã: trình duyệt → Vercel (`hnd1`) → Supabase (`ap-northeast-1`), kèm Brevo cho email.
- Một bảng công nghệ: Next.js 16 App Router, React 19.2, Tailwind v4, Supabase (Postgres + Auth), Vercel, Brevo HTTP API.
- **Số liệu quy mô, Claude Code phải ĐẾM từ repo, không chép từ spec này:** số route, số migration, số dependency production, số bảng, số FR trong SRS, số file spec, số file runbook.
- Một câu về ba lớp bảo vệ: `proxy.ts` chặn sớm → kiểm quyền trong Server Component → RLS và trigger ở database. Nói rõ `proxy.ts` không phải hàng rào duy nhất, và vì sao (CVE-2025-29927).

### FR-R.5 — "Chưa làm gì, và vì sao" — phần phân biệt với README thường

Danh sách thẳng thắn, mỗi dòng một món, **kèm lý do**, không bào chữa:
- **Giao diện mobile tạm dừng** — là giai đoạn sau khi sản phẩm hoàn thành, không nằm trong định nghĩa "xong", không chen vào thứ tự đợt.
- **11 phát hiện accessibility còn mở** (3 Trung bình, 8 Thấp, 0 Cao) — đã đo, chưa sửa, có đợt riêng.
- **`%XX` và `%25` trả HTTP 500 ở route động** — có từ trước mọi đợt, không lộ dữ liệu, gom vào đợt 1.6.
- **Preview và production dùng chung một database** — hệ quả đã ghi, đợt 1.6 tách.
- **Chatbot, quên mật khẩu, trang hồ sơ** — chưa làm, nằm trong thứ tự còn lại.
- **Một tiêu chí nghiệm thu đã TRƯỢT và được giữ nguyên là trượt**: TC-S.10 của đợt seed cấm sửa mọi file có sẵn, nhưng quy trình đóng đợt bắt buộc sửa mục 7 của chính file quyết định, nên nó không đạt được ở bất kỳ đợt nào. **Đã giữ kết quả trượt thay vì sửa tiêu chí sau khi thấy kết quả.** Đây là mục quan trọng nhất của cả phần này — nó cho người đọc thấy kỷ luật đo của dự án.

### FR-R.6 — Chạy cục bộ, và bản đồ tài liệu

- **Chạy cục bộ:** các bước thật từ `docs/runbooks/supabase-local.md`, rút gọn, kèm danh sách TÊN biến môi trường cần có (chỉ tên, không giá trị) và câu trỏ tới `.env.local.example`.
- **Bản đồ tài liệu:** bảng ngắn — tài liệu nào trả lời câu hỏi nào, kèm đường dẫn:
  · `docs/SRS.md` — yêu cầu chức năng và phi chức năng
  · `docs/trang-quyet-dinh-dac-ta-tong.md` — mọi quyết định đã chốt và **số đo từng đợt** (mục 7)
  · `docs/specs/*` — đặc tả từng đợt kèm tiêu chí nghiệm thu
  · `docs/runbooks/*` — việc vận hành
  · `docs/mockups/*` — mockup và quyết định thiết kế
- Một câu mời người đọc xem mục 8 ("Bài học đã rút ra") nếu muốn thấy dự án tự sửa mình ra sao.

---

## 3. Yêu cầu phi chức năng

- **NFR-R.1 — Độ dài: 500–900 từ cho phần người đọc lướt** (FR-R.1, R.2, R.5), và tối đa **2.500 từ** cho toàn file. README dài hơn thế không ai đọc hết, và dự án đã có 160 KB tài liệu cho người muốn đào sâu.
- **NFR-R.2 — Mọi con số trong README phải đếm được từ repo hoặc có trong mục 7.** Không con số nào viết từ trí nhớ. TC-R.2 kiểm từng con số.
- **NFR-R.3 — Không rò dữ liệu cá nhân.** Không email cá nhân, không số điện thoại thật, không tên người thật ngoài tên chủ dự án nếu chủ dự án muốn. Chỉ `admin-demo@example.com`.
- **NFR-R.4 — Tiếng Việt**, giữ thuật ngữ kỹ thuật bằng tiếng Anh, theo mục 3. Giọng văn: thẳng, không tự khen, không câu tự thuật tiến độ. File này nhà tuyển dụng đọc.
- **NFR-R.5 — Markdown chuẩn GitHub**, không HTML thô, không badge, không emoji.

---

## 4. Tiêu chí nghiệm thu

| # | Tiêu chí | Lệnh cho ra con số | Đạt khi |
|---|---|---|---|
| **TC-R.1** | Đủ bảy phần theo FR-R.1 → R.6, đúng thứ tự. | Đếm tiêu đề `##` trong README | **7/7** phần có mặt, đúng thứ tự; 0 phần thừa |
| **TC-R.2** | **Đối chứng — mọi con số kiểm lại từ repo.** Liệt kê MỌI con số xuất hiện trong README; với từng con số, nêu lệnh hoặc mục tài liệu cho ra nó. | Một bảng: con số · nguồn · lệnh | **100%** con số có nguồn. **Đối chứng:** cố ý đổi một con số thành sai, phép kiểm phải phát hiện. Không phát hiện được nghĩa là phép kiểm hỏng |
| **TC-R.3** | **Đối chứng — mọi liên kết mở được.** Mọi liên kết trong README: link demo, link repo, và mọi đường dẫn file nội bộ. | `curl -o /dev/null -w "%{http_code}"` cho link ngoài; `test -f` cho đường dẫn nội bộ | Link ngoài **2xx** hoặc 3xx hợp lệ; **100%** đường dẫn nội bộ tồn tại. **Đối chứng:** thêm một đường dẫn giả, phép kiểm phải báo thiếu |
| **TC-R.4** | Không rò dữ liệu cá nhân. | `grep -nE "gmail\.com\|[0-9]{9,11}"` trên README; đọc tay một lượt | **0** email cá nhân; **0** số điện thoại thật; email duy nhất là `admin-demo@example.com`; mật khẩu công bố KHÔNG trùng `SEED_DEMO_PASSWORD` |
| **TC-R.5** | Độ dài trong ngưỡng. | Đếm từ bằng lệnh | Toàn file ≤ **2.500 từ**; ba phần lướt (R.1, R.2, R.5) trong khoảng **500–900 từ** |
| **TC-R.6** | Không phình phạm vi. | `git diff --stat origin/main...HEAD` | Đúng **2** file đổi: `README.md` và chính `docs/specs/dot-7-readme-nha-tuyen-dung.md`; **0** file trong `app/`, `components/`, `lib/`, `supabase/`, `docs/SRS.md`, **0** file khác trong `docs/specs/`; `package.json` không đổi |

**Cách báo cáo.** Hai tiêu chí có đối chứng ghi **cả hai phía** — phía đối chứng cũng "đạt" nghĩa là phép kiểm hỏng, phải nói ra thay vì báo đạt.

---

## 5. Ghi nhận, không xử lý trong đợt này

### 5.1 Tài khoản admin demo công khai: rủi ro đã chấp nhận
Công bố tài khoản admin trên một repo public nghĩa là ai cũng đăng nhập được, xoá được sách chưa từng ai đặt, sửa tên sách, đổi trạng thái đơn. Chấp nhận có chủ ý: một nhà tuyển dụng bấm thử rồi thấy nó thật sự chạy có giá hơn một site không ai chạm được; và dữ liệu dựng lại bằng `--teardown` rồi `--apply`. Phương án chặn ghi ở tầng database cho riêng tài khoản demo đã cân nhắc và loại: nó chặn luôn thao tác "đổi trạng thái đơn" mà bước 6 muốn chứng minh.

### 5.2 README không có ảnh
Nằm ngoài phạm vi để đợt này đóng được trong một lượt. Ảnh chụp khu admin và dashboard là thứ đáng thêm sau — ghi lại, không làm bây giờ.

---

## 6. Thứ tự làm

1. **Chủ dự án**: chạy seed lên hosted (1.1) và tạo `admin-demo@example.com` (1.2). Ghi lại 6 số từ `--verify`.
2. Claude Code đọc mục 1–9 file quyết định, SRS, và đếm số liệu quy mô từ repo.
3. Viết `README.md`.
4. Kiểm TC-R.1 → TC-R.6, hai tiêu chí có đối chứng chạy cả hai phía.
5. Commit, mở PR. Merge sau khi chủ dự án đọc README một lượt.
6. Khi đóng đợt: thêm mục 7.13 (số đo đợt này) và cập nhật mục 4 — **bảy bước của định nghĩa "xong" đã đủ**.

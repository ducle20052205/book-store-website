# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack

Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind CSS v4 (CSS-first qua `@theme` trong `app/globals.css`, không có `tailwind.config.*`) + Supabase (Postgres + Auth).

```bash
npm run dev     # dev server (Turbopack)
npm run build   # build production
npm run lint    # ESLint
```

## Kiến trúc đã chốt

Những điều dưới đây trông như có thể "dọn cho gọn" nhưng không phải. Đổi chúng thì phải hỏi trước.

- **`proxy.ts`, không phải `middleware.ts`.** Next.js 16 đã đổi tên; hàm export tên là `proxy`, chạy trên Node.js runtime.
- **Cache Components đang bật** (`cacheComponents: true`). Hệ quả: không dùng segment config `revalidate`; hàm có `"use cache"` không được gọi `cookies()`; chỗ nào đọc cookie phải nằm trong `<Suspense>`.
- **Bốn client Supabase** trong `lib/supabase/`: `client` (browser), `server` (Server Component và Server Action), `proxy` (chỉ `proxy.ts` dùng), `public` (dữ liệu công khai, không cookie, dùng được trong `"use cache"`).
- **Mọi client Supabase khởi tạo bên trong hàm xử lý request**, không bao giờ ở module scope.
- **Header dùng `getClaims()`, `proxy.ts` dùng `getUser()`.** Khác nhau là cố ý: `getUser()` hỏi Auth server nên phát hiện được token bị thu hồi, hợp cho hàng rào bảo vệ; `getClaims()` xác minh chữ ký cục bộ, đủ cho hiển thị và không tốn round trip. Đừng đồng nhất.

## Supabase: hosted và cục bộ

- Hosted: không có CLI, thay đổi schema đi qua migration file + MCP.
- Cục bộ: Supabase CLI 2.118.0 (cài ngoài repo), stack 5 container, cấu hình ở `supabase/config.toml`.
- Cổng: Kong 54321, Postgres 54322, Mailpit 54324, app cục bộ 3100 (dev trỏ hosted vẫn 3000).
- Biến môi trường cục bộ ở `.env.supabase-local` (đã git-ignore). KHÔNG sửa `.env.local`.
- Khoá ký JWT cục bộ là ES256 để khớp hosted; file khoá riêng đã git-ignore.
- Khác biệt đã biết so với hosted: rate limit email 360000/h (hosted 30/h), OTP 6 ký tự (hosted 8), Site URL localhost:3100, email qua Mailpit.
- Claude Code KHÔNG tạo/đăng nhập tài khoản trên hosted Auth; chỉ làm trên 127.0.0.1.
- Chi tiết: `docs/runbooks/supabase-local.md`

## Vùng hạ tầng (30/09/2026)

- Supabase: ap-northeast-1 (Tokyo).
- Vercel Function Region: hnd1 (Tokyo) — đổi từ iad1 (Washington D.C.) ngày 30/09. Edge vẫn là hkg1.
- Mốc trước khi đổi, để so sánh: PostgREST từ Vercel trung vị 280ms, p90 757ms, tối đa 1629ms.
- Docker và stack Supabase cục bộ CHỈ mở khi prompt nói rõ là cần. Mặc định để tắt.
- Lý do cần stack cục bộ: Claude Code không tạo/đăng nhập tài khoản trên hosted Auth, nên mọi kiểm thử cần phiên thật chạy trên 127.0.0.1.

## Sự thật kỹ thuật đã kiểm (01/10/2026)

- Next đặt `pathWasRevalidated` ngay khi cookie bị đổi (`node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.js` dòng 130). Bỏ `revalidatePath` khỏi một Server Action KHÔNG làm response của action hết render lại trang — nó chỉ tránh việc vô hiệu hoá cache.
- Mọi request prefetch của Next mang header `next-router-prefetch: 1` (đã kiểm: 171/171 request RSC prefetch trong 11 lượt tải riêng, preview và cục bộ, ngày 01/10/2026). Dùng header này để tách prefetch là sạch, không có vùng xám.
- Bản cục bộ (`next start`) chạy HTTP/1.1 (6 kết nối mỗi origin), hosted chạy HTTP/2 (đo bằng Edge: `h2` ở 36/36 response của preview). Trước khi sửa một hiện tượng chỉ đo được ở local, kiểm xem nó có tồn tại trên hosted không. Ví dụ: 6 request prefetch kéo dài ~24,5 s khi tải `/` lúc đã đăng nhập ở local không tái hiện trên hosted (chậm nhất 1,25 s).

## Database

- Mọi thay đổi schema đi qua migration trong `supabase/migrations/`, apply bằng Supabase MCP (hosted không có CLI, xem mục "Supabase: hosted và cục bộ"), tên file theo đúng `version` Supabase trả về — không sửa qua Table Editor.
- Trước mọi thao tác xoá/phá dữ liệu đang được tham chiếu: DỪNG LẠI, hỏi trước khi làm.
- Trigger `profiles_protect_role` khoá `role` với người không phải Admin, và khoá `email` với mọi người — kể cả service role. Muốn sửa `email` phải tạm tắt trigger trong một transaction (xem `docs/runbooks/tao-admin-dau-tien.md`).

## Bảo mật

- Không bao giờ commit `.env*`, trừ `.env.local.example` (chỉ chứa placeholder rỗng, không có giá trị thật).
- Secret key (vd. `SUPABASE_SECRET_KEY`) chỉ dùng phía server, không bao giờ prefix `NEXT_PUBLIC_`; bảng mới trong Supabase phải bật RLS trước khi có dữ liệu thật.
- Repo này là public. Không commit email cá nhân, khoá, mật khẩu — kể cả trong tài liệu, mockup, ảnh chụp màn hình và comment. Dữ liệu mẫu dùng `ban.doc@example.com`.
- Trước khi commit thư mục có tài liệu hoặc ảnh mới, quét: `grep -rn "gmail.com" <thư mục>` trên các file text.

## Giao diện

- Chỉ dùng token màu khai báo trong `@theme` (`app/globals.css`) — không viết cứng mã hex trong component.
- Dùng lại component dùng chung đã có: `Price`, `BookCard`, `BookCover`, `StockLabel`, `Toast`. `Toast` chỉ dùng cho thông báo thuần xác nhận và ngắn (vd. đã thêm vào giỏ). Thông báo mang thông tin người dùng cần đọc kỹ hoặc có hành động thì dùng dải trong trang, không tự tắt (WCAG 2.2.1).
- Chữ hiển thị cho người dùng viết bằng tiếng Việt, đúng giọng văn NA Books ở `docs/specs/claude-code-brand-update.md` mục 6.
- Không bao giờ thêm ảnh bìa sách từ nguồn ngoài (không hotlink, không tải ảnh có bản quyền) — bìa luôn do `BookCover` sinh tự động.

## Quy trình làm việc

- Mỗi việc lớn làm trên một nhánh riêng; commit sau mỗi đợt hoàn thành, không gộp nhiều đợt vào một commit.
- Khi báo cáo hoàn thành: liệt kê file đã sửa, file tạo mới, và những gì chưa đạt được.
- Trước khi code: đọc spec của đợt trong `docs/specs/`, làm đúng phạm vi ghi trong đó, không mở rộng.
- Mockup và spec mâu thuẫn: theo spec, và báo lại chỗ mâu thuẫn.
- Gặp tình huống nằm trong mục "Điều cần làm rõ trước khi code" của spec: dừng và hỏi, đừng tự chọn.
- Báo cáo bằng số đo thật (px, ms, số dòng, mã HTTP), không mô tả cảm giác. Tiêu chí không đạt thì ghi con số đo được và lý do, đừng bỏ trống.
- Mọi tiêu chí dùng selector phải nêu selector chỉ khớp đúng trạng thái đang kiểm, và phải có đối chứng ở trạng thái ngược lại. Đối chứng cũng "đạt" nghĩa là phép đo hỏng, không phải mã đạt.
- Mọi ngưỡng phần trăm phải lớn hơn độ nhiễu đo được của chính phép đo đó. Đo độ nhiễu trước khi đặt ngưỡng.
- Số request trong DevTools CỘNG DỒN khi bật "Preserve log" (đã gặp: 132 và 223 request ở trang chủ là cộng dồn qua nhiều lượt điều hướng; một lượt tải đo được 41–49). Mọi con số request phải ghi rõ là một lượt tải hay tích luỹ, và ô "Preserve log" bật hay tắt.
- So sánh phải cùng điều kiện: một lần đo `HIT` từ cache edge không so được với một lần `STALE` có chạy hàm (đã gặp ở TTFB preview 01/10). Không so công bằng được thì nói thẳng, đừng báo con số đẹp.
- Kiểm giao diện bằng ảnh chụp toàn trang thu nhỏ, không chỉ ảnh cận cảnh.
- File tạm, route thử, script đo: xoá trước khi commit, chạy `git status` xác nhận sạch.

## Tài liệu tham khảo

`docs/SRS.md` — yêu cầu chức năng 7 tính năng core. `docs/specs/` — spec triển khai chi tiết cho từng đợt việc (vd. `claude-code-brand-update.md`).

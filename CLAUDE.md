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
- Kiểm giao diện bằng ảnh chụp toàn trang thu nhỏ, không chỉ ảnh cận cảnh.
- File tạm, route thử, script đo: xoá trước khi commit, chạy `git status` xác nhận sạch.

## Tài liệu tham khảo

`docs/SRS.md` — yêu cầu chức năng 7 tính năng core. `docs/specs/` — spec triển khai chi tiết cho từng đợt việc (vd. `claude-code-brand-update.md`).

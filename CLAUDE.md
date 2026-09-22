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

## Database

- Mọi thay đổi schema đi qua migration trong `supabase/migrations/`, apply bằng Supabase MCP (không có CLI cục bộ), tên file theo đúng `version` Supabase trả về — không sửa qua Table Editor.
- Trước mọi thao tác xoá/phá dữ liệu đang được tham chiếu: DỪNG LẠI, hỏi trước khi làm.

## Bảo mật

- Không bao giờ commit `.env*`, trừ `.env.local.example` (chỉ chứa placeholder rỗng, không có giá trị thật).
- Secret key (vd. `SUPABASE_SECRET_KEY`) chỉ dùng phía server, không bao giờ prefix `NEXT_PUBLIC_`; bảng mới trong Supabase phải bật RLS trước khi có dữ liệu thật.

## Giao diện

- Chỉ dùng token màu khai báo trong `@theme` (`app/globals.css`) — không viết cứng mã hex trong component.
- Dùng lại component dùng chung đã có: `Price`, `BookCard`, `BookCover`, `StockLabel`, `Toast`.
- Chữ hiển thị cho người dùng viết bằng tiếng Việt, đúng giọng văn NA Books ở `docs/specs/claude-code-brand-update.md` mục 6.

## Quy trình làm việc

- Mỗi việc lớn làm trên một nhánh riêng; commit sau mỗi đợt hoàn thành, không gộp nhiều đợt vào một commit.
- Khi báo cáo hoàn thành: liệt kê file đã sửa, file tạo mới, và những gì chưa đạt được.

## Tài liệu tham khảo

`docs/SRS.md` — yêu cầu chức năng 7 tính năng core. `docs/specs/` — spec triển khai chi tiết cho từng đợt việc (vd. `claude-code-brand-update.md`).

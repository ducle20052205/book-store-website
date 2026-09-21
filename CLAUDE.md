# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Tổng quan

Đây là dự án Next.js 16 (App Router) vừa được khởi tạo bằng `create-next-app`, dự kiến làm nền cho một website bán sách. Hiện tại `app/page.tsx` và `app/layout.tsx` vẫn là nội dung mặc định do `create-next-app` sinh ra — chưa có tính năng nghiệp vụ nào được xây dựng, ngoài việc đã gắn sẵn một Supabase client dùng chung.

## Lệnh thường dùng

```bash
npm run dev     # chạy dev server (Turbopack) tại http://localhost:3000
npm run build   # build production
npm run start   # chạy server production sau khi build
npm run lint    # chạy ESLint (eslint.config.mjs)
```

Repo chưa cấu hình test framework nào (không có script `test` trong `package.json`).

## Kiến trúc & cấu trúc

- **App Router, không dùng `src/`**: route/layout nằm trực tiếp trong `app/` ở thư mục gốc (`app/layout.tsx`, `app/page.tsx`), không phải `src/app/`.
- **Import alias**: `@/*` trỏ về thư mục gốc repo (khai báo ở `tsconfig.json` → `compilerOptions.paths`), ví dụ `@/lib/supabase`.
- **TypeScript strict mode** đang bật.
- **Tailwind CSS v4** dùng cấu hình kiểu CSS-first — không có file `tailwind.config.*`. Theme khai báo bằng khối `@theme inline` ngay trong `app/globals.css`; Tailwind được nạp qua PostCSS plugin `@tailwindcss/postcss` (`postcss.config.mjs`).
- **ESLint dùng flat config** (`eslint.config.mjs`), kế thừa `eslint-config-next/core-web-vitals` và `eslint-config-next/typescript`.
- **`lib/supabase.ts`**: khởi tạo Supabase client dùng chung (an toàn cho phía client, `createClient` từ `@supabase/supabase-js`), đọc `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` từ biến môi trường. Import qua `@/lib/supabase`.

## Biến môi trường

Copy `.env.local.example` thành `.env.local` (đã nằm trong `.gitignore`, không commit) rồi điền giá trị thật lấy từ project Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`.gitignore` chặn toàn bộ `.env*` nhưng có ngoại lệ giữ lại `.env.local.example` (file mẫu, không chứa key thật) để file này được commit vào repo.

## Về AGENTS.md

`AGENTS.md` được Next.js tự sinh/ghi đè mỗi khi chạy `next dev` (xem `node_modules/next/dist/server/lib/generate-agent-files.js`) và được nạp vào đầu file này qua dòng `@AGENTS.md` ở trên. Nội dung của nó cảnh báo rằng phiên bản Next.js đang dùng có thể có API/quy ước khác với dữ liệu huấn luyện của model — nên đọc tài liệu trong `node_modules/next/dist/docs/` trước khi viết code mới, và nên commit lại thay đổi ở file này thay vì xoá nó đi.

## Tài liệu tham khảo

Xem docs/SRS.md để biết đầy đủ yêu cầu chức năng của 7 tính năng core.

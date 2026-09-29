# Đợt 2A — Hạ tầng xác thực

Bước 2 · Tài khoản người dùng · phiên bản 1.0 · 30/09/2026
Nhánh: `feature/buoc-2a-ha-tang-auth`

Tài liệu liên quan: `docs/SRS.md` (mục 5.5, 5.7, 5.8), mockup canvas bước 2 (artboard `Header.dc.html`).

---

## 1. Vì sao có đợt này

Trước khi làm bất kỳ màn hình đăng nhập nào, dự án cần bốn thứ chưa tồn tại:

1. Bảng `profiles` không có cột `email`, và trigger `handle_new_user()` không chép `full_name`. Người dùng đăng ký xong sẽ mất họ tên, và FR-4.4 (Make.com gửi email xác nhận đơn) không có email để gửi.
2. Dự án chỉ có `@supabase/supabase-js` với một singleton dùng chung cho cả server lẫn client. Phiên đăng nhập theo cookie không chạy được trên kiến trúc này.
3. Không có `proxy.ts` (tên của middleware từ Next.js 16), nên chưa có chỗ làm mới phiên đăng nhập.
4. Chưa có cách tạo tài khoản admin đầu tiên, và trigger `profiles_protect_role` chặn mọi câu `UPDATE` đổi `role` khi `auth.uid()` là null.

Đợt 2A xử lý đúng bốn thứ đó. Không có màn hình mới nào ngoài phần header.

## 2. Phạm vi

**Thuộc phạm vi**
- Một migration: cột `profiles.email`, sửa `handle_new_user()`, mở rộng CHECK của `events.event_type`.
- Cài `@supabase/ssr`, tách thành ba client, xoá singleton cũ.
- Tạo `proxy.ts` làm mới phiên và chặn sớm các route cần đăng nhập.
- Header hai trạng thái, dropdown tài khoản, sheet tài khoản trên mobile, gỡ liên kết Yêu thích.
- Runbook tạo admin đầu tiên.

**Ngoài phạm vi** — không làm ở đợt này
- Màn `/dang-nhap`, `/dang-ky` (đợt 2B).
- `/quen-mat-khau`, `/dat-lai-mat-khau`, `/auth/callback`, template email (đợt 2C).
- `/tai-khoan`, bảng `provinces`/`wards`, đổi mật khẩu (đợt 2D).
- Magic link, đăng nhập bằng Google, wishlist.

## 3. Migration

Một file duy nhất, apply bằng Supabase MCP, đặt tên theo version Supabase ghi nhận.

```sql
-- 1. profiles.email
alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

create index if not exists profiles_email_idx on public.profiles (email);

-- 2. handle_new_user: bổ sung email và full_name
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.profiles (id, role, email, full_name)
  values (
    new.id,
    'customer',
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  );
  return new;
end;
$function$;

-- 3. events: thêm sign_up và login
alter table public.events drop constraint events_event_type_check;
alter table public.events add constraint events_event_type_check
  check (event_type = any (array[
    'page_view','search','add_to_cart','checkout_started','order_placed',
    'sign_up','login'
  ]));
```

Ràng buộc:
- **Không** đặt UNIQUE trên `profiles.email`. `auth.users.email` đã unique; thêm ràng buộc nữa chỉ tạo thêm một đường làm trigger fail, mà trigger fail nghĩa là đăng ký fail.
- **Không** sửa `protect_profile_role()`. Hàm đang đúng và đã bị thu hồi quyền EXECUTE ở migration `0002`.
- Sau khi apply, chạy `\df+ public.handle_new_user` (hoặc truy vấn `information_schema.routine_privileges`) xác nhận `public`, `anon`, `authenticated` vẫn **không** có quyền EXECUTE — `create or replace` không khôi phục quyền đã revoke, nhưng phải kiểm chứng chứ không tin lý thuyết.
- Đồng bộ email là một chiều, chỉ tại thời điểm tạo. FR-5.5 cấm đổi email qua giao diện nên không phát sinh lệch.

## 4. Client Supabase

Cài `@supabase/ssr`. Tách thành ba nơi tạo client, **mỗi client khởi tạo bên trong request handler, không bao giờ ở module scope**:

| File | Hàm | Dùng ở đâu |
|---|---|---|
| `lib/supabase/client.ts` | `createBrowserClient` | Client Component |
| `lib/supabase/server.ts` | `createServerClient` + `cookies()` từ `next/headers` | Server Component, Server Action, Route Handler |
| `lib/supabase/proxy.ts` | `createServerClient` đọc/ghi cookie qua `NextRequest`/`NextResponse` | chỉ `proxy.ts` gọi |

- `setAll` trong `lib/supabase/server.ts` phải bọc `try/catch` — Server Component không ghi được cookie, và lỗi đó là bình thường, không được để nó làm hỏng trang.
- Xoá `lib/supabase.ts` cũ. Chuyển `lib/queries.ts` sang client server, `lib/analytics.ts` sang client browser.
- Không import client server vào bất kỳ file nào có `"use client"`.

## 5. proxy.ts

- File `proxy.ts` ở thư mục gốc, cùng cấp với `app/`. Hàm export tên `proxy` (Next.js 16 đổi tên từ `middleware`; tên cũ còn chạy nhưng đã deprecated).
- Nhiệm vụ: gọi `supabase.auth.getUser()` để làm mới cookie phiên, trả về response mang cookie đã cập nhật.
- Chặn sớm: request tới `/tai-khoan` hoặc `/tai-khoan/*` mà chưa đăng nhập thì chuyển hướng `/dang-nhap?next=<path đã encode>`. Tương tự với `/admin/*` nhưng thêm điều kiện `role = 'admin'`. Hai nhóm route này chưa có giao diện ở đợt 2A — vẫn làm để đợt 2D và bước 7 không phải quay lại.
- `matcher` loại trừ `_next/static`, `_next/image`, `favicon.ico`, và các đuôi ảnh.
- **Nguyên tắc hai lớp, ghi thành comment ngay trong file:** proxy chỉ để cải thiện trải nghiệm. Hàng rào thật là kiểm tra trong Server Component và RLS. Không đặt logic phân quyền nào chỉ tồn tại ở proxy.

## 6. Header

Tham chiếu artboard `Header.dc.html` trong canvas mockup.

- `components/Header.tsx` (Server Component) đọc user bằng client server và truyền trạng thái xuống.
- **Gỡ liên kết Yêu thích** (`/yeu-thich`) khỏi cả desktop lẫn mobile. Trang đó không tồn tại.
- Chưa đăng nhập: mục tài khoản là `<a href="/dang-nhap">` nhãn "Đăng nhập".
- Đã đăng nhập: mục tài khoản là `<button>` nhãn **"Tài khoản"** (không thay bằng tên người dùng — tên dài ngắn khác nhau sẽ đẩy layout), mở dropdown.
- Dropdown (Client Component riêng): rộng 272px, nền `#FFFFFF`, viền 1px `#DCD4C4`, đổ bóng `0 16px 34px rgba(23,29,64,0.22)`, bo góc 4px. Khối đầu hiển thị họ tên và email. Ba mục cao 46px: Hồ sơ của bạn → `/tai-khoan`, Đơn hàng của tôi → `/tai-khoan/don-hang`, Đăng xuất. Canh mép phải theo mép phải của nút Tài khoản.
- `z-index` của dropdown phải lớn hơn `CategoryNav`, và panel phải có nền đặc — lỗi mega-menu nhìn xuyên hiện tại không được lặp lại.
- Bàn phím: `aria-expanded` trên nút, Esc đóng, click ra ngoài đóng, focus quay lại nút sau khi đóng.
- Mobile (<768px): chạm vào mục tài khoản mở sheet trượt từ đáy (artboard `MobileMenu.dc.html`), mọi vùng chạm ≥44×44px, có nút đóng.
- Đăng xuất gọi `signOut()` trong Server Action rồi `revalidatePath('/')`.

## 7. Runbook admin

Tạo `docs/runbooks/tao-admin-dau-tien.md`, nội dung gồm: lý do không làm bằng migration (email cá nhân không nên nằm trong repo public), lý do không sửa `protect_profile_role`, đoạn SQL dưới đây với email ở dạng placeholder, và câu lệnh kiểm chứng.

```sql
begin;
alter table public.profiles disable trigger profiles_protect_role;

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'EMAIL_CUA_BAN');

alter table public.profiles enable trigger profiles_protect_role;
commit;

select id, email, role from public.profiles where role = 'admin';
```

Ghi thêm phần hạn chế đã biết: policy `profiles_update_own` chỉ cho sửa dòng của chính mình, nên admin hiện **không** thăng cấp được người khác qua giao diện. Việc đó thuộc bước 7.

## 8. Hoàn thành khi

Mỗi mục phải kèm số đo hoặc kết quả lệnh trong báo cáo.

**Không hồi quy**
1. `npm run build` thành công, không có lỗi TypeScript mới.
2. `grep -rn "from ['\"]@/lib/supabase['\"]" --include=*.ts --include=*.tsx` trả về **0 dòng**.
3. `grep -rn "createClient\|createServerClient\|createBrowserClient" app lib components` cho thấy **không** lần gọi nào nằm ở module scope (mọi lần gọi đều trong thân hàm).
4. `/sach` trang 1 hiển thị đúng **20 thẻ sách**, `/sach?page=2` hiển thị đúng **20 thẻ**, tổng **40**.
5. `/sach?q=nha gia kim` trả **1 kết quả**; `/sach?category=van-hoc` trả đúng số sách như trước đợt này (ghi con số thực đo).
6. `/sach/nha-gia-kim` trả HTTP 200 và hiển thị đủ: tên sách, tác giả, giá gốc, giá giảm, trạng thái kho.
7. TTFB của `/sach` trên bản preview: đo 5 lần, lấy trung vị, **không tăng quá 20%** so với trung vị 5 lần đo trên `main` trước khi merge. Ghi cả hai con số.
8. `grep -rn "SERVICE_ROLE" .next/static` trả về **0 dòng**.

**Database**
9. `select pg_get_constraintdef(oid) from pg_constraint where conname = 'events_event_type_check';` chứa đúng **7 giá trị**.
10. Tạo một user thử qua Supabase Studio với `raw_user_meta_data` chứa `full_name`: dòng `profiles` tương ứng có **cả** `email` và `full_name` khác null. Xoá user thử sau khi kiểm.
11. `select has_function_privilege('anon', 'public.handle_new_user()', 'execute');` trả về **false**; lặp lại với `authenticated` và `public`.

**Header**
12. Ở viewport 1280px: nhóm liên kết bên phải gồm đúng **2 mục**, tổng chiều rộng trong khoảng **200–235px**; ô tìm kiếm rộng trong khoảng **855–905px**; không có cuộn ngang. Ghi số đo thực.
13. Ở viewport 375px: không có cuộn ngang; mọi mục chạm ≥ **44×44px**.
14. Dropdown mở ở 1280px: chụp ảnh cho thấy **không** đọc được chữ nào của thanh CategoryNav xuyên qua panel. Ghi giá trị `z-index` của panel và của nav.
15. Nhấn Esc khi dropdown đang mở thì panel đóng và focus quay về nút Tài khoản.
16. `grep -rn "yeu-thich" app components` trả về **0 dòng**.

**Route**
17. Mở `/tai-khoan` khi chưa đăng nhập: chuyển hướng tới `/dang-nhap?next=%2Ftai-khoan` (trang đích trả 404 ở đợt này — chấp nhận được, ghi rõ trong báo cáo).
18. Mở `/admin` khi đã đăng nhập bằng tài khoản `customer`: chuyển hướng, **không** render giao diện quản trị.

**Ảnh kiểm tra**
19. Ảnh chụp **toàn trang thu nhỏ** (không phải ảnh cận cảnh) của `/` và `/sach` ở 1280px và 375px, trước và sau đợt này, để đối chiếu không có gì xô lệch.
20. Ảnh dropdown mở ở 1280px và sheet tài khoản mở ở 375px.

## 9. Điều cần làm rõ trước khi code

Nếu trong lúc làm phát hiện bất kỳ điều nào dưới đây, **dừng lại và hỏi**, đừng tự chọn:

- Việc chuyển `lib/queries.ts` sang client server làm thay đổi kết quả của `search_books` (số lượng, thứ tự).
- Có file nào import Supabase client trong một Client Component mà không thể tách.
- Hai tiêu chí ở mục 8 không thể cùng thoả — chứng minh bằng số đo, rồi đề nghị sửa spec.

# Runbook: tạo tài khoản admin đầu tiên

Quy trình thủ công, chạy **một lần** duy nhất khi dựng môi trường mới (hoặc khi database chưa có admin nào). Liên quan: FR-5.6 và FR-7.1 trong `docs/SRS.md`.

## Vì sao không làm bằng migration

Migration nằm trong `supabase/migrations/` và được commit vào repo public. Một migration thăng cấp admin buộc phải chứa email thật của người dùng — email cá nhân không nên nằm trong repo public. Vì vậy thao tác này chạy tay, ngoài repo.

## Vì sao không nới lỏng `protect_profile_role`

Hàm `public.protect_profile_role()` (trigger `profiles_protect_role`) có được mở rộng ở đợt 2A để khoá thêm cột `email`, nhưng điều kiện `is_admin()` của nó giữ nguyên: người không phải admin không đổi được `role` của chính mình. Ở migration `0002`, quyền `EXECUTE` của nó đã được thu hồi khỏi `anon` và `authenticated`. Nới lỏng điều kiện này để tiện cho một thao tác chỉ chạy một lần là đánh đổi tệ: lỗ hổng tự nâng quyền sẽ nằm lại vĩnh viễn trong hệ thống để phục vụ một việc chỉ cần làm một lần. Cách làm dưới đây tắt trigger tạm thời, trong đúng một transaction, rồi bật lại — hàm không bị sửa để phục vụ thao tác này.

## Điều kiện trước khi chạy

- Tài khoản cần thăng cấp đã tồn tại và đã có dòng `profiles` tương ứng — trigger `handle_new_user()` tạo dòng này ngay khi tài khoản được tạo, bằng cách nào cũng vậy:
  - Sau đợt 2B: đăng ký bình thường qua trang `/dang-ky` (FR-5.1).
  - Trước đó (trang `/dang-ky` chưa có): tạo trong Supabase Dashboard → Authentication → Users → Add user. Dòng `profiles` vẫn được trigger tạo, nhưng `full_name` để trống nếu không điền `raw_user_meta_data`.
- Có quyền chạy SQL trực tiếp trên database (Supabase Dashboard → SQL Editor).

## Bước 1 — thăng cấp

Thay `EMAIL_CUA_BAN` bằng email của tài khoản đã đăng ký, **ngay trong ô soạn SQL**. Không lưu email thật vào file này hay bất kỳ file nào trong repo.

```sql
begin;

alter table public.profiles disable trigger profiles_protect_role;

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'EMAIL_CUA_BAN')
returning id, role;

alter table public.profiles enable trigger profiles_protect_role;

commit;
```

Kết quả mong đợi: câu `update` trả về đúng 1 dòng có `role = 'admin'`. Nếu trả về 0 dòng thì email sai hoặc tài khoản chưa đăng ký — trigger vẫn được bật lại và chưa có gì thay đổi; sửa email rồi chạy lại.

Nếu có lệnh nào báo lỗi, chạy `rollback;`. `ALTER TABLE ... DISABLE TRIGGER` nằm trong transaction nên rollback cũng hoàn tác luôn bước tắt trigger.

## Bước 2 — kiểm chứng

Chạy lần lượt ba câu sau, cũng thay `EMAIL_CUA_BAN` trong ô soạn SQL.

```sql
-- 1) Tài khoản đã là admin
select p.id, u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'EMAIL_CUA_BAN';
-- Kỳ vọng: 1 dòng, role = 'admin'

-- 2) Trigger chặn tự nâng quyền đã được bật lại
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.profiles'::regclass
  and tgname = 'profiles_protect_role';
-- Kỳ vọng: 1 dòng, tgenabled = 'O' (bật). 'D' nghĩa là trigger vẫn đang tắt — phải bật lại ngay:
--   alter table public.profiles enable trigger profiles_protect_role;

-- 3) Số admin trong hệ thống
select count(*) as so_admin from public.profiles where role = 'admin';
-- Kỳ vọng: 1
```

Khi khu vực `/admin/*` (FR-7.1) đã có, kiểm tra thêm bằng giao diện: đăng nhập bằng tài khoản vừa thăng cấp và truy cập `/admin/*`.

## Hạn chế đã biết

Policy `profiles_update_own` chỉ cho người dùng sửa dòng của chính mình, nên admin hiện **không** thăng cấp được người khác qua giao diện — muốn có thêm admin thì phải lặp lại đúng quy trình này. Việc thăng cấp qua giao diện thuộc bước 7 (Admin Dashboard).

-- ============================================================================
-- Đợt 2A — Hạ tầng xác thực (docs/specs/buoc-2a-ha-tang-auth.md mục 3)
--
-- 1. profiles.email (+ backfill từ auth.users, + index, KHÔNG unique).
-- 2. handle_new_user(): chép thêm email và full_name lúc tạo profile.
-- 3. events.event_type: thêm 'sign_up' và 'login' (5 -> 7 giá trị).
-- 4. protect_profile_role(): khoá cột email (role khoá có điều kiện, email chỉ
--    mở cho trigger đồng bộ ở phần 5). Giữ nguyên tên hàm để khỏi drop trigger.
-- 5. sync_profile_email() + trigger trên auth.users: đồng bộ email một chiều
--    từ auth.users xuống profiles khi người dùng đổi email ở tầng Auth.
-- ============================================================================

begin;

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

-- 4. Khoá cột email: role khoá có điều kiện, email chỉ mở cho trigger đồng bộ
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_admin() then
    new.role := old.role;
  end if;
  if coalesce(current_setting('app.sync_auth_email', true), '') <> 'on' then
    new.email := old.email;
  end if;
  return new;
end;
$function$;

-- 5. Đồng bộ email xuống profiles khi người dùng đổi ở tầng Auth
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.email is distinct from old.email then
    perform set_config('app.sync_auth_email', 'on', true);
    update public.profiles set email = new.email where id = new.id;
    perform set_config('app.sync_auth_email', 'off', true);
  end if;
  return new;
end;
$function$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

revoke execute on function public.sync_profile_email()
  from public, anon, authenticated;

commit;

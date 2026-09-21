-- ============================================================================
-- 0003_perf_fixes.sql
--
-- Vá theo Supabase performance advisor sau khi tạo schema:
--   1. cart_items.book_id thiếu index cho FK cart_items_book_id_fkey.
--   2. auth.uid() được gọi trực tiếp trong 5 RLS policy -> Postgres
--      re-evaluate cho từng hàng thay vì 1 lần/câu truy vấn. Bọc lại thành
--      (select auth.uid()) để Postgres cache kết quả qua InitPlan.
--      Xem: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================================================

begin;

create index cart_items_book_id_idx on public.cart_items (book_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

alter policy "profiles_select_own_or_admin"
  on public.profiles
  using ((select auth.uid()) = id or public.is_admin());

alter policy "profiles_update_own"
  on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "cart_items_owner_all"
  on public.cart_items
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "orders_select_own_or_admin"
  on public.orders
  using ((select auth.uid()) = user_id or public.is_admin());

alter policy "order_items_select_own_or_admin"
  on public.order_items
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = (select auth.uid())
    )
  );

commit;

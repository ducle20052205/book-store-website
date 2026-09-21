-- ============================================================================
-- 0002_restrict_trigger_function_execute.sql
--
-- Supabase security advisor bao: handle_new_user() va protect_profile_role()
-- la SECURITY DEFINER nhung dang bi lo qua PostgREST RPC (/rest/v1/rpc/...)
-- cho anon/authenticated. Ca hai chi duoc thiet ke de chay nhu trigger
-- (returns trigger) nen goi truc tiep se loi o tang Postgres, nhung van
-- nen thu hoi quyen EXECUTE cong khai theo dung nguyen tac least privilege.
-- Khong dong den is_admin() vi ham nay vo hai va huu ich khi goi truc tiep
-- (client co the rpc('is_admin') de kiem tra quyen).
-- ============================================================================

begin;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;

commit;

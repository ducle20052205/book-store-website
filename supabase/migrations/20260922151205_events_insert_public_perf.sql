-- ============================================================================
-- 20260922151205_events_insert_public_perf.sql
--
-- Performance advisor sau migration đợt 1a: policy events_insert_public gọi
-- auth.uid() trực tiếp -> Postgres re-evaluate mỗi hàng. Bọc lại thành
-- (select auth.uid()) theo đúng pattern đã dùng cho các bảng khác ở đợt 1
-- (xem perf_fixes migration).
-- ============================================================================

begin;

alter policy "events_insert_public"
  on public.events
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and octet_length(coalesce(metadata::text, '')) <= 2048
  );

commit;

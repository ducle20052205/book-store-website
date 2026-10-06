-- ============================================================================
-- Đợt 6, chặng 1 (dashboard thống kê) — RPC admin_dashboard_stats().
-- Spec: docs/specs/dot-6-dashboard-thong-ke.md (FR-D.2 → FR-D.6, mục 4). SRS: FR-7.7 (thêm ở chặng 2).
--
-- ĐÚNG MỘT HÀM, không bảng, không cột, không index, không trigger, không policy; không UPDATE dòng nào.
--
-- SECURITY INVOKER (mặc định), KHÔNG SECURITY DEFINER: RLS của chính người gọi áp dụng (admin đọc được
-- orders, order_items, events; người khác không), nên hàm không cần vượt rào. Thêm chặn tường minh ở đầu
-- hàm bằng is_admin(): người không phải admin nhận KHONG_PHAI_ADMIN thay vì một kết quả toàn số 0 do RLS lọc.
--
-- Trả jsonb MỘT lần, năm khoá:
--   kpi              {revenue, orders, avg_order_value, customers}  — chỉ đơn status <> 'cancelled'
--   revenue_by_month [{month 'YYYY-MM', revenue, orders}]           — theo giờ Việt Nam, tháng không có đơn vẫn có dòng 0
--   top_books        [{slug, title, category, units, revenue}] ×10  — số bản giảm dần, rồi tên; chỉ đơn khác cancelled
--   category_sales   [{slug, name, units, revenue}]                 — mọi danh mục cha (parent_id is null)
--   funnel           {steps: [{event_type, count}] ×5, sign_up, login} — đếm DÒNG sự kiện, không lọc thời gian
--
-- Mọi phép gộp theo tháng dùng at time zone 'Asia/Ho_Chi_Minh', không dùng UTC.
-- EXECUTE thu hồi khỏi public, anon; chỉ cấp cho authenticated (cùng khuôn place_order, migration 20261002160851).
-- ============================================================================

begin;

-- Chặn an toàn: dừng nếu public.is_admin() không tồn tại.
do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'public.is_admin() không tồn tại: dừng migration admin_dashboard_stats';
  end if;
end;
$$;

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_kpi jsonb;
  v_months jsonb;
  v_books jsonb;
  v_cats jsonb;
  v_funnel jsonb;
begin
  if not public.is_admin() then
    raise exception 'KHONG_PHAI_ADMIN';
  end if;

  -- KPI: doanh thu, số đơn, giá trị đơn trung bình (làm tròn tới đồng), số khách đã mua.
  select jsonb_build_object(
           'revenue', coalesce(sum(o.total_amount), 0),
           'orders', count(*),
           'avg_order_value', case when count(*) = 0 then 0 else round(sum(o.total_amount) / count(*)) end,
           'customers', count(distinct o.user_id)
         )
    into v_kpi
    from public.orders o
    where o.status <> 'cancelled';

  -- Doanh thu theo tháng lịch giờ Việt Nam, liên tục từ tháng đầu tới tháng cuối có đơn.
  with bounds as (
    select date_trunc('month', min(o.created_at at time zone 'Asia/Ho_Chi_Minh')) as first_m,
           date_trunc('month', max(o.created_at at time zone 'Asia/Ho_Chi_Minh')) as last_m
      from public.orders o
      where o.status <> 'cancelled'
  ),
  months as (
    select generate_series(b.first_m, b.last_m, interval '1 month') as m
      from bounds b
      where b.first_m is not null
  ),
  per_month as (
    select date_trunc('month', o.created_at at time zone 'Asia/Ho_Chi_Minh') as m,
           sum(o.total_amount) as revenue,
           count(*) as orders
      from public.orders o
      where o.status <> 'cancelled'
      group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'month', to_char(ms.m, 'YYYY-MM'),
           'revenue', coalesce(pm.revenue, 0),
           'orders', coalesce(pm.orders, 0)
         ) order by ms.m), '[]'::jsonb)
    into v_months
    from months ms
    left join per_month pm on pm.m = ms.m;

  -- Top 10 sách: số bản và doanh thu (quantity × price_at_purchase), danh mục cha của sách.
  select coalesce(jsonb_agg(t.item order by t.units desc, t.title), '[]'::jsonb)
    into v_books
    from (
      select b.title,
             sum(oi.quantity) as units,
             jsonb_build_object(
               'slug', b.slug,
               'title', b.title,
               'category', coalesce(p.name, c.name),
               'units', sum(oi.quantity),
               'revenue', sum(oi.quantity * oi.price_at_purchase)
             ) as item
        from public.order_items oi
        join public.orders o on o.id = oi.order_id and o.status <> 'cancelled'
        join public.books b on b.id = oi.book_id
        left join public.categories c on c.id = b.category_id
        left join public.categories p on p.id = c.parent_id
        group by b.id, b.slug, b.title, p.name, c.name
        order by sum(oi.quantity) desc, b.title
        limit 10
    ) t;

  -- Mọi danh mục cha, kể cả danh mục chưa bán được bản nào (units = 0).
  select coalesce(jsonb_agg(jsonb_build_object(
           'slug', pc.slug,
           'name', pc.name,
           'units', coalesce(s.units, 0),
           'revenue', coalesce(s.revenue, 0)
         ) order by pc.sort_order, pc.name), '[]'::jsonb)
    into v_cats
    from public.categories pc
    left join (
      select coalesce(c.parent_id, c.id) as parent_id,
             sum(oi.quantity) as units,
             sum(oi.quantity * oi.price_at_purchase) as revenue
        from public.order_items oi
        join public.orders o on o.id = oi.order_id and o.status <> 'cancelled'
        join public.books b on b.id = oi.book_id
        join public.categories c on c.id = b.category_id
        group by coalesce(c.parent_id, c.id)
    ) s on s.parent_id = pc.id
    where pc.parent_id is null;

  -- Phễu: năm bước theo FR-8.3; sign_up và login đứng ngoài phễu.
  select jsonb_build_object(
           'steps', jsonb_build_array(
             jsonb_build_object('event_type', 'page_view', 'count', count(*) filter (where e.event_type = 'page_view')),
             jsonb_build_object('event_type', 'search', 'count', count(*) filter (where e.event_type = 'search')),
             jsonb_build_object('event_type', 'add_to_cart', 'count', count(*) filter (where e.event_type = 'add_to_cart')),
             jsonb_build_object('event_type', 'checkout_started', 'count', count(*) filter (where e.event_type = 'checkout_started')),
             jsonb_build_object('event_type', 'order_placed', 'count', count(*) filter (where e.event_type = 'order_placed'))
           ),
           'sign_up', count(*) filter (where e.event_type = 'sign_up'),
           'login', count(*) filter (where e.event_type = 'login')
         )
    into v_funnel
    from public.events e;

  return jsonb_build_object(
    'kpi', v_kpi,
    'revenue_by_month', v_months,
    'top_books', v_books,
    'category_sales', v_cats,
    'funnel', v_funnel
  );
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

commit;

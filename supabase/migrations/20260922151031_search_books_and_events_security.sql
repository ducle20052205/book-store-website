-- ============================================================================
-- Đợt 1a — Database (docs/specs/buoc-1-catalog-chi-tiet.md)
--
-- 1a.1 unaccent + f_unaccent(): tìm kiếm không phân biệt dấu tiếng Việt.
-- 1a.2 search_books(): lọc + sắp xếp + phân trang chạy hết phía server
--      (NFR-1.3), SECURITY DEFINER vì sort "bestseller" cần cộng
--      order_items.quantity của MỌI đơn hàng, điều RLS không cho khách
--      vãng lai/khách hàng thường làm.
-- 1a.3 Siết lại events_insert_public (chặn giả mạo user_id người khác +
--      giới hạn kích thước metadata) và mở rộng event_type CHECK thêm
--      'search'.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1a.1 — unaccent
-- ----------------------------------------------------------------------------

create extension if not exists unaccent with schema extensions;

-- unaccent() không phải hàm immutable, nên cần một hàm bọc lại.
create or replace function public.f_unaccent(text)
returns text
language sql immutable parallel safe strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

-- ----------------------------------------------------------------------------
-- 1a.2 — search_books
-- ----------------------------------------------------------------------------

create or replace function public.search_books(
  p_q text default null,
  p_category_slug text default null,
  p_min numeric default null,
  p_max numeric default null,
  p_sort text default 'newest',
  p_page int default 1
)
returns table (
  id uuid, slug text, title text, author text,
  price numeric, discount_price numeric,
  stock_quantity int, cover_image_url text,
  total_count bigint
)
language plpgsql stable
security definer
set search_path = ''
as $$
declare
  v_q text;
  v_min numeric;
  v_max numeric;
  v_sort text;
  v_page int;
  v_offset int;
  v_category_id uuid;
  v_category_ids uuid[];
begin
  -- p_q: trim, rỗng -> null, cắt 100 ký tự, escape \ % _ (theo thứ tự đó)
  v_q := nullif(trim(p_q), '');
  if v_q is not null then
    v_q := left(v_q, 100);
    v_q := replace(v_q, '\', '\\');
    v_q := replace(v_q, '%', '\%');
    v_q := replace(v_q, '_', '\_');
  end if;

  -- p_min / p_max: âm coi như null; p_min > p_max thì đổi chỗ
  v_min := case when p_min is not null and p_min < 0 then null else p_min end;
  v_max := case when p_max is not null and p_max < 0 then null else p_max end;
  if v_min is not null and v_max is not null and v_min > v_max then
    v_min := v_max;
    v_max := p_min;
  end if;

  -- p_sort: giá trị không hợp lệ -> newest
  v_sort := case
    when p_sort in ('newest', 'price_asc', 'price_desc', 'bestseller') then p_sort
    else 'newest'
  end;

  -- p_page: < 1 -> 1; page size cố định 20
  v_page := greatest(coalesce(p_page, 1), 1);
  v_offset := (v_page - 1) * 20;

  -- p_category_slug: cha thì gồm cả con trực tiếp (FR-1.4); slug sai -> 0 dòng
  if p_category_slug is not null then
    select c.id into v_category_id from public.categories c where c.slug = p_category_slug;

    if v_category_id is null then
      return;
    end if;

    select array_agg(c.id) into v_category_ids
    from public.categories c
    where c.id = v_category_id or c.parent_id = v_category_id;
  end if;

  return query
  with sold as (
    select oi.book_id, sum(oi.quantity) as qty
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.status <> 'cancelled'
    group by oi.book_id
  ),
  filtered as (
    select b.*
    from public.books b
    where (
        v_q is null
        or public.f_unaccent(lower(b.title)) like '%' || public.f_unaccent(lower(v_q)) || '%' escape '\'
        or public.f_unaccent(lower(b.author)) like '%' || public.f_unaccent(lower(v_q)) || '%' escape '\'
      )
      and (v_category_ids is null or b.category_id = any(v_category_ids))
      and (v_min is null or coalesce(b.discount_price, b.price) >= v_min)
      and (v_max is null or coalesce(b.discount_price, b.price) <= v_max)
  )
  select
    f.id, f.slug, f.title, f.author,
    f.price, f.discount_price, f.stock_quantity, f.cover_image_url,
    count(*) over ()::bigint as total_count
  from filtered f
  left join sold s on s.book_id = f.id
  order by
    case when v_sort = 'price_asc' then coalesce(f.discount_price, f.price) end asc,
    case when v_sort = 'price_desc' then coalesce(f.discount_price, f.price) end desc,
    case when v_sort = 'bestseller' then coalesce(s.qty, 0) end desc,
    f.created_at desc,
    f.id
  limit 20
  offset v_offset;
end;
$$;

grant execute on function public.search_books(text, text, numeric, numeric, text, int)
  to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 1a.3 — siết bảo mật events + mở rộng event_type
-- ----------------------------------------------------------------------------

drop policy if exists "events_insert_public" on public.events;

create policy "events_insert_public" on public.events
  for insert to anon, authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and octet_length(coalesce(metadata::text, '')) <= 2048
  );

alter table public.events drop constraint if exists events_event_type_check;

alter table public.events add constraint events_event_type_check
  check (event_type = any (array['page_view', 'add_to_cart', 'checkout_started', 'order_placed', 'search']));

commit;

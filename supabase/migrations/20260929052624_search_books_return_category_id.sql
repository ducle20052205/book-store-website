-- ============================================================================
-- Đợt E3 (docs/specs/buoc-1.5-dot-e.md) — nhãn danh mục con trên thẻ sách
-- cần category_id của từng cuốn để tra tên danh mục; search_books() (RPC
-- dùng cho /sach và tab "Bán chạy" ở trang chủ) chưa trả cột này. Phải
-- drop rồi tạo lại vì Postgres không cho CREATE OR REPLACE đổi kiểu trả
-- về (RETURNS TABLE) của hàm đã có — chỉ thêm đúng 1 cột category_id vào
-- RETURNS TABLE và SELECT cuối, không đổi logic lọc/sắp xếp/phân trang.
-- ============================================================================

begin;

drop function if exists public.search_books(text, text, numeric, numeric, text, int);

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
  category_id uuid,
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
  v_q := nullif(trim(p_q), '');
  if v_q is not null then
    v_q := left(v_q, 100);
    v_q := replace(v_q, '\', '\\');
    v_q := replace(v_q, '%', '\%');
    v_q := replace(v_q, '_', '\_');
  end if;

  v_min := case when p_min is not null and p_min < 0 then null else p_min end;
  v_max := case when p_max is not null and p_max < 0 then null else p_max end;
  if v_min is not null and v_max is not null and v_min > v_max then
    v_min := v_max;
    v_max := p_min;
  end if;

  v_sort := case
    when p_sort in ('newest', 'price_asc', 'price_desc', 'bestseller') then p_sort
    else 'newest'
  end;

  v_page := greatest(coalesce(p_page, 1), 1);
  v_offset := (v_page - 1) * 20;

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
    f.category_id,
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

commit;

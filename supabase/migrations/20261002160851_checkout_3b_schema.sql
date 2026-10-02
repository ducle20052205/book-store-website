-- ============================================================================
-- Đợt 3B (checkout) — schema, ràng buộc, hàm đặt hàng.
-- Spec: docs/specs/buoc-3b-checkout.md (FR-3B.1, 3B.3, 3B.4, 3B.4a, 3B.19–3B.23, 3B.28).
--
-- Gồm:
--   1. provinces, wards (bảng tra hành chính 2 cấp từ 01/07/2025) + RLS.
--      Dữ liệu seed nằm ở các migration kế tiếp (…_seed_provinces, …_seed_wards_*).
--   2. profiles: thêm province_code / ward_code / address_line, khoá ngoại ghép
--      MATCH FULL, bỏ cột address (text tự do).
--   3. orders / order_items: thêm cột, siết NOT NULL, CHECK.
--   4. order_code_seq, place_order(), mark_confirmation_sent().
--
-- CHẶN AN TOÀN: migration dừng (raise exception) nếu profiles.address có dữ liệu
-- hoặc orders / order_items đã có dòng — các thao tác dưới đây chỉ "miễn phí" khi
-- những chỗ đó đang trống (đo trên hosted ngày 02/10/2026: profiles.address 0/2
-- dòng; orders 0 dòng; order_items 0 dòng). Chặn này nghiêm hơn spec một chút:
-- spec cho phép tới 20 dòng address của tài khoản thử, nhưng SQL không phân biệt
-- được "tài khoản thử", nên mọi dòng đều dừng lại để người xem quyết.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 0. Kiểm tra điều kiện (DỪNG nếu không thoả)
-- ----------------------------------------------------------------------------

do $$
declare
  v_profiles int;
  v_with_address int;
  v_orders int;
  v_order_items int;
  r record;
begin
  select count(*), count(*) filter (where address is not null)
    into v_profiles, v_with_address
    from public.profiles;
  select count(*) into v_orders from public.orders;
  select count(*) into v_order_items from public.order_items;

  raise notice '[3B] profiles: % dòng, % dòng có address; orders: % dòng; order_items: % dòng',
    v_profiles, v_with_address, v_orders, v_order_items;

  for r in select id, address from public.profiles where address is not null loop
    raise notice '[3B] profiles.address có dữ liệu: id=% address=%', r.id, r.address;
  end loop;

  if v_with_address > 0 then
    raise exception '[3B] DỪNG: profiles.address có % dòng dữ liệu; xem spec FR-3B.4 trước khi drop', v_with_address;
  end if;
  if v_orders > 0 or v_order_items > 0 then
    raise exception '[3B] DỪNG: orders có % dòng, order_items có % dòng; xem spec FR-3B.4a và FR-3B.22', v_orders, v_order_items;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. provinces, wards (FR-3B.1)
-- Mã lưu kiểu TEXT: mã hành chính có số 0 đứng đầu (3/34 mã tỉnh, 994/3.321 mã phường/xã).
-- ----------------------------------------------------------------------------

create table public.provinces (
  code text primary key check (code ~ '^[0-9]{2}$'),
  name text not null,
  full_name text not null,
  sort_order int not null
);

create table public.wards (
  code text primary key check (code ~ '^[0-9]{5}$'),
  province_code text not null references public.provinces (code),
  name text not null,
  full_name text not null,
  -- Không dư thừa: đây là ĐÍCH của khoá ngoại ghép (ward_code, province_code) từ
  -- profiles ở dưới. Khoá ngoại đơn cho từng cột không ngăn được việc chọn phường
  -- không thuộc tỉnh đã chọn.
  constraint wards_code_province_code_key unique (code, province_code)
);

create index wards_province_code_idx on public.wards (province_code);

alter table public.provinces enable row level security;
alter table public.wards enable row level security;

-- Cùng khuôn với categories: đọc công khai, ghi chỉ admin (SRS 5.10, FR-7.6).
create policy "provinces_select_public"
  on public.provinces for select
  to anon, authenticated
  using (true);

create policy "provinces_admin_insert"
  on public.provinces for insert
  to authenticated
  with check (public.is_admin());

create policy "provinces_admin_update"
  on public.provinces for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "provinces_admin_delete"
  on public.provinces for delete
  to authenticated
  using (public.is_admin());

create policy "wards_select_public"
  on public.wards for select
  to anon, authenticated
  using (true);

create policy "wards_admin_insert"
  on public.wards for insert
  to authenticated
  with check (public.is_admin());

create policy "wards_admin_update"
  on public.wards for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "wards_admin_delete"
  on public.wards for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. profiles (FR-3B.3, FR-3B.4)
-- ----------------------------------------------------------------------------

alter table public.profiles
  add column province_code text,
  add column ward_code text,
  add column address_line text check (address_line is null or char_length(address_line) between 5 and 200);

-- MATCH FULL: MATCH SIMPLE (mặc định) bỏ qua kiểm tra khi MỘT cột NULL, nên một
-- province_code không tồn tại vẫn lọt vào nếu ward_code còn trống. Với MATCH FULL,
-- hoặc cả hai cùng NULL, hoặc cả hai cùng có giá trị và phải khớp một dòng wards.
-- ON DELETE RESTRICT là có chủ đích: một lần tổ chức lại hành chính sau này phải buộc
-- ra quyết định di trú, không được âm thầm xoá địa chỉ của người dùng.
alter table public.profiles
  add constraint profiles_ward_province_fkey
  foreign key (ward_code, province_code)
  references public.wards (code, province_code)
  match full
  on update cascade
  on delete restrict;

-- profiles.address (text tự do) là dữ liệu dẫn xuất không có ràng buộc nào bảo vệ, và
-- không parse ngược được thành cấu trúc 2 cấp. orders.shipping_address là snapshot dựng
-- lúc đặt hàng bởi place_order(), không phụ thuộc cột này.
alter table public.profiles drop column address;

-- ----------------------------------------------------------------------------
-- 3. orders, order_items (FR-3B.4a, FR-3B.22)
-- ----------------------------------------------------------------------------

alter table public.orders
  add column order_code text not null,
  add column idempotency_key uuid not null,
  add column payment_method text not null,
  add column recipient_name text not null,
  add column recipient_phone text not null,
  -- Không có khoá ngoại: đơn hàng là bản ghi lịch sử. Một lần tổ chức lại hành chính
  -- (như 01/07/2025) không được làm đơn cũ sai hoặc không xoá được. Phục vụ lọc đơn
  -- theo tỉnh ở đợt admin. Bất đối xứng cố ý với profiles (địa chỉ hiện hành, có FK).
  add column shipping_ward_code text,
  add column shipping_province_code text,
  add column note text,
  add column confirmation_email_sent_at timestamptz;

alter table public.orders
  add constraint orders_order_code_key unique (order_code),
  add constraint orders_idempotency_key_key unique (idempotency_key),
  add constraint orders_payment_method_check check (payment_method in ('cod', 'bank_transfer')),
  add constraint orders_total_amount_check check (total_amount > 0),
  add constraint orders_recipient_name_check check (char_length(recipient_name) between 2 and 100),
  add constraint orders_recipient_phone_check check (recipient_phone ~ '^0[2-9][0-9]{8}$'),
  add constraint orders_note_check check (note is null or char_length(note) <= 500);

-- shipping_address: chuỗi địa chỉ đã ghép, đóng băng; place_order() luôn ghi nó.
alter table public.orders
  alter column user_id set not null,
  alter column status set not null,
  alter column shipping_address set not null;

alter table public.order_items
  alter column order_id set not null,
  alter column book_id set not null;

-- ----------------------------------------------------------------------------
-- 4. order_code_seq (FR-3B.23): sequence TOÀN CỤC, không reset theo năm.
-- Chỉ place_order() (SECURITY DEFINER) gọi nextval; không cấp quyền cho ai khác.
-- ----------------------------------------------------------------------------

create sequence public.order_code_seq;
revoke all on sequence public.order_code_seq from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. place_order (FR-3B.19–3B.22)
--
-- Một giao dịch duy nhất. Client KHÔNG gửi giá và danh sách sách: hàm tự đọc cart_items
-- của auth.uid() và tự tính tổng. Trả về (order_code, created): created = false khi
-- cùng idempotency_key đã có đơn của chính user (không tạo đơn thứ hai).
--
-- Mã lỗi (message của exception, SQLSTATE P0001):
--   KHONG_DANG_NHAP, KHOA_DAT_HANG_TRUNG_USER_KHAC, DU_LIEU_KHONG_HOP_LE,
--   DIA_CHI_KHONG_HOP_LE, GIO_HANG_TRONG, GIA_DA_DOI (detail = tổng mới),
--   HET_HANG (detail = tên sách).
--
-- Chuỗi giá: cùng luật với <Price> và lib/cart/view.ts: giá giảm chỉ được dùng khi có
-- và THẤP HƠN giá gốc (dữ liệu hiện tại: 0 sách có giá giảm >= giá gốc, nên trùng với
-- COALESCE(discount_price, price) của SRS; luật này giữ giao diện và hàm không lệch nhau).
-- Năm trong order_code tính theo giờ Việt Nam (Asia/Ho_Chi_Minh), không phải UTC.
-- ----------------------------------------------------------------------------

create or replace function public.place_order(
  p_idempotency_key uuid,
  p_recipient_name text,
  p_recipient_phone text,
  p_address_line text,
  p_ward_code text,
  p_province_code text,
  p_payment_method text,
  p_note text,
  p_expected_total numeric
)
returns table (order_code text, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing_user uuid;
  v_existing_code text;
  v_name text;
  v_phone text;
  v_address_line text;
  v_note text;
  v_ward_full text;
  v_province_full text;
  v_lines jsonb;
  v_total numeric;
  v_line jsonb;
  v_order_id uuid;
  v_code text;
begin
  if v_uid is null then
    raise exception 'KHONG_DANG_NHAP';
  end if;

  if p_idempotency_key is null then
    raise exception 'DU_LIEU_KHONG_HOP_LE';
  end if;

  -- Hai lời gọi cùng khoá chạy đồng thời: lời gọi sau đợi lời gọi trước commit rồi mới
  -- đọc, nên thấy đơn đã có và trả lại mã cũ (không dựa vào lỗi UNIQUE của bảng).
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  select o.user_id, o.order_code
    into v_existing_user, v_existing_code
    from public.orders o
    where o.idempotency_key = p_idempotency_key;
  if found then
    if v_existing_user = v_uid then
      return query select v_existing_code, false;
      return;
    end if;
    -- Khoá thuộc về người khác: KHÔNG bao giờ trả mã đơn của họ.
    raise exception 'KHOA_DAT_HANG_TRUNG_USER_KHAC';
  end if;

  -- Lớp kiểm tra cuối (client và Server Action đã kiểm trước, xem lib/checkoutRules.ts).
  v_name := btrim(p_recipient_name);
  v_phone := p_recipient_phone;
  v_address_line := btrim(p_address_line);
  v_note := nullif(btrim(p_note), '');
  if v_name is null or char_length(v_name) not between 2 and 100
     or v_phone is null or v_phone !~ '^0[2-9][0-9]{8}$'
     or v_address_line is null or char_length(v_address_line) not between 5 and 200
     or p_payment_method is null or p_payment_method not in ('cod', 'bank_transfer')
     or (v_note is not null and char_length(v_note) > 500)
     or p_expected_total is null then
    raise exception 'DU_LIEU_KHONG_HOP_LE';
  end if;

  -- Phường phải thuộc tỉnh; đọc luôn tên đầy đủ để dựng snapshot địa chỉ ở server.
  select w.full_name, p.full_name
    into v_ward_full, v_province_full
    from public.wards w
    join public.provinces p on p.code = w.province_code
    where w.code = p_ward_code and w.province_code = p_province_code;
  if not found then
    raise exception 'DIA_CHI_KHONG_HOP_LE';
  end if;

  -- Đọc giỏ MỘT lần, sắp theo book_id; mọi bước sau dùng đúng bản chụp này.
  select jsonb_agg(
           jsonb_build_object(
             'book_id', ci.book_id,
             'title', b.title,
             'author', b.author,
             'quantity', ci.quantity,
             'unit_price',
               case when b.discount_price is not null and b.discount_price < b.price
                    then b.discount_price else b.price end
           )
           order by ci.book_id
         ),
         sum(ci.quantity * case when b.discount_price is not null and b.discount_price < b.price
                                then b.discount_price else b.price end)
    into v_lines, v_total
    from public.cart_items ci
    join public.books b on b.id = ci.book_id
    where ci.user_id = v_uid;

  if v_lines is null then
    raise exception 'GIO_HANG_TRONG';
  end if;

  if p_expected_total is distinct from v_total then
    raise exception 'GIA_DA_DOI' using detail = v_total::text;
  end if;

  -- Trừ kho: MỘT câu UPDATE có điều kiện cho mỗi dòng (kiểm và trừ là một bước, không
  -- "SELECT rồi UPDATE"), theo đúng thứ tự book_id ở mọi transaction để hai đơn đặt hai
  -- cuốn theo thứ tự ngược nhau không deadlock. READ COMMITTED mặc định là đủ.
  for v_line in select value from jsonb_array_elements(v_lines) order by (value ->> 'book_id')::uuid loop
    update public.books
       set stock_quantity = stock_quantity - (v_line ->> 'quantity')::int
     where id = (v_line ->> 'book_id')::uuid
       and stock_quantity >= (v_line ->> 'quantity')::int;
    if not found then
      raise exception 'HET_HANG' using detail = v_line ->> 'title';
    end if;
  end loop;

  v_code := 'NA-'
    || to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYYY')
    || '-'
    || lpad(nextval('public.order_code_seq')::text, 4, '0');

  insert into public.orders (
    user_id, order_code, idempotency_key, status, payment_method, total_amount,
    recipient_name, recipient_phone, shipping_address,
    shipping_ward_code, shipping_province_code, note
  )
  values (
    v_uid, v_code, p_idempotency_key, 'pending', p_payment_method, v_total,
    v_name, v_phone,
    -- Ghép ở ĐÂY, từ bảng, không từ tên do client gửi: snapshot không thể nói dối.
    v_address_line || ', ' || v_ward_full || ', ' || v_province_full,
    p_ward_code, p_province_code, v_note
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, book_id, quantity, price_at_purchase)
  select v_order_id,
         (e.value ->> 'book_id')::uuid,
         (e.value ->> 'quantity')::int,
         (e.value ->> 'unit_price')::numeric
    from jsonb_array_elements(v_lines) as e;

  delete from public.cart_items where user_id = v_uid;

  return query select v_code, true;
end;
$$;

-- Hàm tạo đơn chỉ dành cho người đã đăng nhập. Mặc định Postgres cấp EXECUTE cho PUBLIC,
-- và Supabase cấp thêm cho anon; thu hồi cả hai.
revoke execute on function public.place_order(uuid, text, text, text, text, text, text, text, numeric)
  from public, anon;
grant execute on function public.place_order(uuid, text, text, text, text, text, text, text, numeric)
  to authenticated;

-- ----------------------------------------------------------------------------
-- 6. mark_confirmation_sent (FR-3B.28)
--
-- Cách DUY NHẤT ghi orders.confirmation_email_sent_at. Khách không có quyền UPDATE trực
-- tiếp bất kỳ cột nào của orders (và 3B không thêm policy UPDATE cho khách): hàm này chỉ
-- ghi đúng một cột, chỉ cho đơn của auth.uid(), và chỉ khi cột còn trống.
-- ----------------------------------------------------------------------------

create or replace function public.mark_confirmation_sent(p_order_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated int;
begin
  if auth.uid() is null then
    return false;
  end if;

  update public.orders
     set confirmation_email_sent_at = now()
   where order_code = p_order_code
     and user_id = auth.uid()
     and confirmation_email_sent_at is null;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke execute on function public.mark_confirmation_sent(text) from public, anon;
grant execute on function public.mark_confirmation_sent(text) to authenticated;

commit;

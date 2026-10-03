-- ============================================================================
-- Đợt 4, chặng 1 (lịch sử đơn hàng) — hàm hủy đơn của khách.
-- Spec: docs/specs/buoc-4-lich-su-don.md (FR-B4.3, FR-B4.7). SRS: FR-6.3, FR-6.4, FR-6.5.
--
-- Đúng MỘT thay đổi: hàm public.cancel_order(p_order_code). Không thêm cột, bảng,
-- policy, trigger; không đổi CHECK nào. Khách vẫn không có policy INSERT/UPDATE nào
-- trên orders (RLS không giới hạn được theo cột: một policy UPDATE "chỉ được đặt
-- cancelled" vẫn cho sửa kèm total_amount, shipping_address... trong cùng câu UPDATE).
--
-- Một transaction, theo thứ tự:
--   1. auth.uid() rỗng                  -> KHONG_DANG_NHAP
--   2. đọc đơn của auth.uid() bằng SELECT ... FOR UPDATE
--      không có dòng                    -> DON_KHONG_TON_TAI
--      (đơn của người khác và mã không tồn tại cho CÙNG một lỗi: không lộ đơn có tồn tại)
--   3. status khác 'pending'            -> DON_KHONG_HUY_DUOC (detail = status hiện tại)
--   4. đặt status = 'cancelled'  (cột DUY NHẤT của orders mà hàm ghi)
--   5. với từng dòng order_items THEO THỨ TỰ book_id: cộng trả stock_quantity
--
-- Vì sao FOR UPDATE: hủy lần hai (bấm đúp, hai tab, thử lại) không được cộng kho lần nữa.
-- Điều đó chỉ đúng nếu kiểm status và ghi status là MỘT bước với lời gọi đồng thời: lời gọi
-- thứ hai đợi lời gọi thứ nhất commit, đọc lại thấy 'cancelled', bị từ chối. Một SELECT
-- thường rồi UPDATE thì ở READ COMMITTED cả hai cùng thấy 'pending' và cùng cộng kho.
--
-- Thứ tự khoá: dòng orders của đơn, rồi books theo book_id tăng dần. place_order khoá books
-- theo book_id tăng dần rồi chỉ CHÈN dòng orders mới (không khoá dòng orders nào đang có),
-- nên hai hàm không thể đợi nhau theo vòng. coalesce vì books.stock_quantity cho phép NULL
-- (đo trên hosted ngày 03/10/2026: nullable, 0/40 dòng NULL).
--
-- Mã lỗi (message của exception, SQLSTATE P0001), cùng quy ước place_order:
--   KHONG_DANG_NHAP, DON_KHONG_TON_TAI, DON_KHONG_HUY_DUOC (detail = status hiện tại),
--   SACH_KHONG_TON_TAI (không xảy ra nhờ khoá ngoại order_items_book_id_fkey; giữ để một
--   lỗi dữ liệu làm hỏng cả giao dịch thay vì làm mất kho âm thầm).
-- ============================================================================

begin;

create or replace function public.cancel_order(p_order_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_status text;
  v_line record;
begin
  if v_uid is null then
    raise exception 'KHONG_DANG_NHAP';
  end if;

  -- Khoá dòng đơn TRƯỚC khi kiểm status. Lọc theo user_id ở đây (hàm SECURITY DEFINER
  -- bỏ qua RLS, nên quyền sở hữu do chính hàm kiểm).
  select o.id, o.status
    into v_order_id, v_status
    from public.orders o
    where o.order_code = p_order_code
      and o.user_id = v_uid
    for update;
  if not found then
    raise exception 'DON_KHONG_TON_TAI';
  end if;

  if v_status <> 'pending' then
    raise exception 'DON_KHONG_HUY_DUOC' using detail = v_status;
  end if;

  update public.orders
     set status = 'cancelled'
   where id = v_order_id;

  -- Cộng trả kho theo thứ tự book_id (kèm id để ổn định khi một đơn có hai dòng cùng sách).
  for v_line in
    select oi.book_id, oi.quantity
      from public.order_items oi
      where oi.order_id = v_order_id
      order by oi.book_id, oi.id
  loop
    update public.books
       set stock_quantity = coalesce(stock_quantity, 0) + v_line.quantity
     where id = v_line.book_id;
    if not found then
      raise exception 'SACH_KHONG_TON_TAI';
    end if;
  end loop;
end;
$$;

-- Chỉ người đã đăng nhập hủy đơn. Mặc định Postgres cấp EXECUTE cho PUBLIC, và Supabase cấp
-- thêm cho anon; thu hồi cả hai (cùng khuôn place_order, mark_confirmation_sent).
revoke execute on function public.cancel_order(text) from public, anon;
grant execute on function public.cancel_order(text) to authenticated;

commit;

-- ============================================================================
-- Đợt 5A, chặng 1 (admin: quản lý đơn hàng) — trigger trạng thái đơn và cộng trả kho.
-- Spec: docs/specs/buoc-5a-admin-don-hang.md (FR-5A.5, FR-5A.6). SRS: FR-6.4, FR-7.4.
--
-- MỘT trigger BEFORE UPDATE trên public.orders làm hai việc:
--   (a) chặn chuyển trạng thái không hợp lệ. Sáu chuyển hợp lệ:
--         pending -> processing, processing -> shipped, shipped -> completed,
--         pending -> cancelled, processing -> cancelled, shipped -> cancelled.
--       Mười bốn chuyển còn lại (khác trạng thái) bị từ chối với
--       CHUYEN_TRANG_THAI_KHONG_HOP_LE, detail = '<cũ> -> <mới>'. completed và cancelled là
--       trạng thái cuối. Áp cho MỌI vai trò, kể cả service_role và postgres.
--   (b) cộng trả stock_quantity khi status chuyển sang 'cancelled', theo thứ tự book_id.
--
-- Trigger chỉ chạy khi status THẬT SỰ đổi (WHEN OLD.status IS DISTINCT FROM NEW.status), nên
-- mark_confirmation_sent (chỉ ghi confirmation_email_sent_at), việc sửa cột khác, và cập nhật lên
-- đúng trạng thái đang có không chạm trigger. cancelled là trạng thái cuối nên một đơn vào
-- cancelled đúng một lần và kho được cộng đúng ở lần vào đó — cho MỌI đường đi: khách hủy
-- (cancel_order), admin hủy, và cả sửa tay trong SQL Editor hay Supabase Dashboard.
--
-- BẮT BUỘC cùng migration, cùng transaction: cancel_order BỎ vòng cộng kho. Nếu hàm vẫn cộng kho
-- thì kho cộng hai lần (một lần ở hàm, một lần ở trigger khi hàm đặt status = 'cancelled').
-- cancel_order giữ nguyên SELECT ... FOR UPDATE, kiểm chủ đơn, kiểm pending; hành vi nhìn thấy
-- từ ngoài (mã lỗi, detail, kiểu trả về void, ACL) không đổi.
--
-- Thứ tự khoá: dòng orders (do chính câu UPDATE), rồi books theo book_id tăng dần. place_order
-- khoá books theo book_id tăng dần rồi chỉ CHÈN dòng orders mới: không thể đợi nhau theo vòng.
--
-- SECURITY DEFINER để cộng kho không phụ thuộc quyền của người gọi (admin qua PostgREST,
-- service_role, postgres trong SQL Editor, hay cancel_order). EXECUTE thu hồi khỏi public, anon,
-- authenticated (tiền lệ migration 0002: hàm trigger không cần, và không nên, gọi được qua RPC).
--
-- Muốn sửa một trạng thái sai bằng tay phải tắt trigger trong một transaction (xem
-- docs/runbooks/tao-admin-dau-tien.md, cách tắt profiles_protect_role); khi đó cả kiểm luồng
-- lẫn cộng kho đều bị bỏ qua. Migration KHÔNG UPDATE dòng nào: dữ liệu hiện có không bị chạm.
-- ============================================================================

begin;

create or replace function public.orders_status_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line record;
begin
  -- (a) Luồng trạng thái.
  if not (
       (old.status = 'pending'    and new.status in ('processing', 'cancelled'))
    or (old.status = 'processing' and new.status in ('shipped', 'cancelled'))
    or (old.status = 'shipped'    and new.status in ('completed', 'cancelled'))
  ) then
    raise exception 'CHUYEN_TRANG_THAI_KHONG_HOP_LE' using detail = old.status || ' -> ' || new.status;
  end if;

  -- (b) Cộng trả kho theo thứ tự book_id (kèm id để ổn định khi một đơn có hai dòng cùng sách).
  if new.status = 'cancelled' then
    for v_line in
      select oi.book_id, oi.quantity
        from public.order_items oi
        where oi.order_id = new.id
        order by oi.book_id, oi.id
    loop
      update public.books
         set stock_quantity = coalesce(stock_quantity, 0) + v_line.quantity
       where id = v_line.book_id;
      if not found then
        raise exception 'SACH_KHONG_TON_TAI';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

revoke execute on function public.orders_status_guard() from public, anon, authenticated;

create trigger orders_status_transition
  before update on public.orders
  for each row
  when (old.status is distinct from new.status)
  execute function public.orders_status_guard();

-- cancel_order: bỏ vòng cộng kho; phần cộng kho do trigger đảm nhiệm khi hàm đặt status = 'cancelled'.
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

  -- Cộng trả kho do trigger orders_status_transition làm khi status đổi sang 'cancelled'.
  update public.orders
     set status = 'cancelled'
   where id = v_order_id;
end;
$$;

commit;

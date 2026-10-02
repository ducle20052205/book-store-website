-- ============================================================================
-- Đợt 3B — seed provinces (34 tỉnh/thành)
-- Spec: docs/specs/buoc-3b-checkout.md (FR-3B.1, FR-3B.2).
--
-- NGUỒN: API chính thức của Cục Thống kê (Bộ Tài chính),
--   https://danhmuchanhchinh.nso.gov.vn/DMDVHC.asmx (DanhMucTinh, DanhMucPhuongXa),
--   tham số DenNgay = 02/10/2026. Lấy ngày 02/10/2026.
-- SỐ DÒNG: provinces = 34; wards = 3.321 (2.599 xã, 709 phường, 13 đặc khu),
--   chia thành 6 migration (…_seed_wards_1 … _6); tổng được kiểm ở migration cuối.
-- ĐỐI CHIẾU: thanglequoc/vietnamese-provinces-database v5.2.0 và provinces.open-api.vn
--   cho cùng 34 / 3.321, cùng tập mã, cùng quan hệ tỉnh–phường/xã (spec mục 10).
--
-- QUY TẮC (chỉ chuẩn hoá cơ học, KHÔNG biên tập lại dữ liệu của cơ quan ban hành):
--   * code lấy nguyên văn (kiểu text: có số 0 đứng đầu).
--   * full_name: Unicode NFC, cắt và gộp khoảng trắng / xuống dòng thừa; viết hoa chữ đầu
--     của tiền tố loại hình (1 dòng: mã 06325 'xã Bắc Sơn' -> 'Xã Bắc Sơn').
--   * KHÔNG đổi vị trí dấu thanh, KHÔNG đổi dấu nháy ’ (U+2019) của nguồn.
--   * name = full_name bỏ tiền tố loại hình (Thành phố | Tỉnh | Phường | Xã | Đặc khu).
--   Các số đã đếm trong nguồn: 181 tên dấu thanh kiểu mới (Hòa), 10 tên kiểu cũ (Hoà),
--   7 tên có dấu nháy ’, 1 tên viết thường chữ đầu, 42 tên bị bước chuẩn hoá cơ học thay
--   đổi (40 khoảng trắng hoặc xuống dòng thừa, 4 Unicode tổ hợp, 2 thuộc cả hai nhóm).
--   Lý do không chuẩn hoá dấu thanh: spec FR-3B.2.
--
-- Cho đợt sau: nếu có ô TÌM theo tên phường/xã, dùng public.f_unaccent ở cả hai phía
-- (đo 02/10/2026: nó đã gập ’ về '); cách so khớp khác thì phải chuẩn hoá ’ -> ' tường minh.
--
-- provinces.sort_order: thứ tự bảng chữ cái tiếng Việt của `name` (không kèm loại hình),
-- tính MỘT lần và lưu thành số nguyên 1..34. Collation đã dùng: "vi-x-icu" (ICU, locale vi)
-- trên PostgreSQL 17.6 hosted ngày 02/10/2026, bằng câu truy vấn:
--   select code, name, row_number() over (order by name collate "vi-x-icu") from provinces_names;
-- (hosted cũng có "vi-VN-x-icu" và "en-VI-x-icu"). Số nguyên được ghi cụ thể bên dưới nên
-- migration không phụ thuộc collation của nơi chạy. KHÔNG ghim tỉnh nào lên đầu.
-- ============================================================================

begin;

insert into public.provinces (code, name, full_name, sort_order)
select v.code, regexp_replace(v.full_name, '^(Thành phố|Tỉnh) ', ''), v.full_name, v.sort_order
from (values
  ('01', 'Thành phố Hà Nội', 12),
  ('04', 'Tỉnh Cao Bằng', 4),
  ('08', 'Tỉnh Tuyên Quang', 33),
  ('11', 'Tỉnh Điện Biên', 8),
  ('12', 'Tỉnh Lai Châu', 19),
  ('14', 'Tỉnh Sơn La', 29),
  ('15', 'Tỉnh Lào Cai', 21),
  ('19', 'Tỉnh Thái Nguyên', 31),
  ('20', 'Tỉnh Lạng Sơn', 20),
  ('22', 'Thành phố Quảng Ninh', 27),
  ('24', 'Thành phố Bắc Ninh', 2),
  ('25', 'Tỉnh Phú Thọ', 25),
  ('31', 'Thành phố Hải Phòng', 14),
  ('33', 'Tỉnh Hưng Yên', 17),
  ('37', 'Tỉnh Ninh Bình', 24),
  ('38', 'Tỉnh Thanh Hóa', 32),
  ('40', 'Tỉnh Nghệ An', 23),
  ('42', 'Tỉnh Hà Tĩnh', 13),
  ('44', 'Tỉnh Quảng Trị', 28),
  ('46', 'Thành phố Huế', 16),
  ('48', 'Thành phố Đà Nẵng', 6),
  ('51', 'Tỉnh Quảng Ngãi', 26),
  ('52', 'Tỉnh Gia Lai', 11),
  ('56', 'Tỉnh Khánh Hòa', 18),
  ('66', 'Tỉnh Đắk Lắk', 7),
  ('68', 'Tỉnh Lâm Đồng', 22),
  ('75', 'Thành phố Đồng Nai', 9),
  ('79', 'Thành phố Hồ Chí Minh', 15),
  ('80', 'Tỉnh Tây Ninh', 30),
  ('82', 'Tỉnh Đồng Tháp', 10),
  ('86', 'Tỉnh Vĩnh Long', 34),
  ('91', 'Tỉnh An Giang', 1),
  ('92', 'Thành phố Cần Thơ', 5),
  ('96', 'Tỉnh Cà Mau', 3)
) as v(code, full_name, sort_order);

do $$
begin
  if (select count(*) from public.provinces) <> 34 then
    raise exception '[3B] provinces phải có đúng 34 dòng';
  end if;
end;
$$;

commit;

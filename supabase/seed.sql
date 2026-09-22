-- ============================================================================
-- supabase/seed.sql
--
-- Dữ liệu mẫu cho NA Books, theo mục 4.2 -> 4.2b -> 4.3 của
-- docs/specs/claude-code-brand-update.md. Đây là DML (dữ liệu), không phải
-- schema, nên không nằm trong supabase/migrations/ — chạy tay qua Supabase
-- MCP execute_sql (không có Supabase CLI trên máy dev).
--
-- Thứ tự bắt buộc: danh mục -> sách -> tủ sách (sách cần category_id, tủ
-- sách cần book_id). Idempotent qua "on conflict ... do nothing": chạy lại
-- nhiều lần không tạo dòng trùng.
--
-- Lưu ý dữ liệu:
-- - cover_image_url luôn NULL (không dùng ảnh thật, không hotlink).
-- - translator, isbn, page_count, dimensions, publish_date, publisher: NULL
--   cho toàn bộ 40 cuốn — không xác minh được thông tin ấn bản cụ thể, và
--   spec yêu cầu không bịa ISBN trông như thật.
-- - table_of_contents: chỉ có ở 4 cuốn (Đắc nhân tâm, Thói quen nguyên tử,
--   Mindset, Sapiens) để demo trang chi tiết; nội dung là tóm tắt phần theo
--   giọng biên tập của NA Books, không sao chép mục lục thật.
-- - description: tự viết 2-4 câu, không chép nguyên văn giới thiệu NXB.
-- - Đây là NỘI DUNG NHÁP (đặc biệt description/curator_note của tủ sách) —
--   cần duyệt lại trước khi dùng thật.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. DANH MỤC (mục 4.2) — 5 cha, sort_order theo đúng thứ tự spec;
--    con có sort_order riêng theo thứ tự trong từng nhóm cha.
-- ----------------------------------------------------------------------------

insert into public.categories (name, slug, parent_id, sort_order) values
  ('Văn học', 'van-hoc', null, 1),
  ('Kinh tế', 'kinh-te', null, 2),
  ('Tâm lý – Kỹ năng', 'tam-ly-ky-nang', null, 3),
  ('Khoa học – Xã hội', 'khoa-hoc-xa-hoi', null, 4),
  ('Manga – Light novel', 'manga-light-novel', null, 5)
on conflict (slug) do nothing;

insert into public.categories (name, slug, parent_id, sort_order) values
  ('Tiểu thuyết', 'tieu-thuyet', (select id from public.categories where slug = 'van-hoc'), 1),
  ('Truyện ngắn – Tản văn', 'truyen-ngan-tan-van', (select id from public.categories where slug = 'van-hoc'), 2),
  ('Trinh thám – Kinh dị', 'trinh-tham-kinh-di', (select id from public.categories where slug = 'van-hoc'), 3),
  ('Kỳ ảo – Khoa học viễn tưởng', 'ky-ao-khoa-hoc-vien-tuong', (select id from public.categories where slug = 'van-hoc'), 4),
  ('Văn học Việt Nam', 'van-hoc-viet-nam', (select id from public.categories where slug = 'van-hoc'), 5),

  ('Quản trị – Lãnh đạo', 'quan-tri-lanh-dao', (select id from public.categories where slug = 'kinh-te'), 1),
  ('Marketing – Bán hàng', 'marketing-ban-hang', (select id from public.categories where slug = 'kinh-te'), 2),
  ('Tài chính – Đầu tư', 'tai-chinh-dau-tu', (select id from public.categories where slug = 'kinh-te'), 3),
  ('Khởi nghiệp', 'khoi-nghiep', (select id from public.categories where slug = 'kinh-te'), 4),

  ('Tâm lý học', 'tam-ly-hoc', (select id from public.categories where slug = 'tam-ly-ky-nang'), 1),
  ('Kỹ năng sống', 'ky-nang-song', (select id from public.categories where slug = 'tam-ly-ky-nang'), 2),
  ('Sức khỏe – Chữa lành', 'suc-khoe-chua-lanh', (select id from public.categories where slug = 'tam-ly-ky-nang'), 3),

  ('Khoa học phổ thông', 'khoa-hoc-pho-thong', (select id from public.categories where slug = 'khoa-hoc-xa-hoi'), 1),
  ('Lịch sử', 'lich-su', (select id from public.categories where slug = 'khoa-hoc-xa-hoi'), 2),
  ('Triết học', 'triet-hoc', (select id from public.categories where slug = 'khoa-hoc-xa-hoi'), 3),

  ('Manga', 'manga', (select id from public.categories where slug = 'manga-light-novel'), 1),
  ('Light novel', 'light-novel', (select id from public.categories where slug = 'manga-light-novel'), 2)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 2. SÁCH (mục 4.2b) — 40 cuốn, category_id tra theo slug danh mục con.
-- ----------------------------------------------------------------------------

insert into public.books
  (title, slug, author, translator, publisher, description, table_of_contents,
   price, discount_price, isbn, page_count, dimensions, publish_date,
   cover_image_url, stock_quantity, category_id, created_at)
values
  ('Nhà giả kim', 'nha-gia-kim', 'Paulo Coelho', null, null,
   'Hành trình của chàng chăn cừu Santiago đi tìm kho báu, nhưng thứ cậu tìm thấy trên đường lại quý giá hơn nhiều. Một câu chuyện ngắn gọn về việc lắng nghe trái tim và dám theo đuổi điều mình tin. Phù hợp cho ai đang phân vân trước một lựa chọn lớn trong đời.',
   null, 89000, 69000, null, null, null, null, null, 24,
   (select id from public.categories where slug = 'tieu-thuyet'), now() - interval '0 days'),

  ('Cây cam ngọt của tôi', 'cay-cam-ngot-cua-toi', 'José Mauro de Vasconcelos', null, null,
   'Góc nhìn của cậu bé Zezé về một tuổi thơ nghèo khó nhưng đầy tưởng tượng, với cái cây cam nhỏ là người bạn duy nhất chịu lắng nghe. Câu chuyện chạm vào những mất mát đầu đời mà không hề bi lụy. Một cuốn sách khiến người lớn cũng phải dừng lại rất lâu sau khi gấp trang cuối.',
   null, 99000, null, null, null, null, null, null, 18,
   (select id from public.categories where slug = 'tieu-thuyet'), now() - interval '2 days'),

  ('Rừng Na Uy', 'rung-na-uy', 'Haruki Murakami', null, null,
   'Toru Watanabe nhớ về những năm tháng đại học ở Tokyo, giữa tình yêu, mất mát và những mối quan hệ không dễ gọi tên. Murakami viết về tuổi trẻ bằng giọng văn chậm rãi, nhiều khoảng lặng. Một trong những tiểu thuyết được nhắc đến nhiều nhất của văn học Nhật đương đại.',
   null, 129000, 99000, null, null, null, null, null, 15,
   (select id from public.categories where slug = 'tieu-thuyet'), now() - interval '5 days'),

  ('Hồ Điệp và Kình Ngư', 'ho-diep-va-kinh-ngu', 'Tuế Kiến', null, null,
   'Một câu chuyện tình xoay quanh hai nhân vật tưởng như thuộc về hai thế giới khác nhau, dần tìm thấy nhau qua những biến cố không lường trước. Nhịp truyện nhẹ nhàng nhưng vẫn giữ được kịch tính cần thiết. Lựa chọn hợp cho những buổi chiều muốn đọc một câu chuyện tình chỉn chu.',
   null, 109000, null, null, null, null, null, null, 30,
   (select id from public.categories where slug = 'tieu-thuyet'), now() - interval '7 days'),

  ('Xứ tuyết', 'xu-tuyet', 'Kawabata Yasunari', null, null,
   'Mối quan hệ giữa một người đàn ông thành thị và một geisha ở vùng núi tuyết miền Bắc Nhật Bản. Kawabata dùng rất ít lời để gợi ra rất nhiều cảm xúc — đây là một trong những lý do tác phẩm giúp ông đoạt giải Nobel Văn học. Sách mỏng nhưng cần đọc chậm.',
   null, 79000, 65000, null, null, null, null, null, 12,
   (select id from public.categories where slug = 'tieu-thuyet'), now() - interval '9 days'),

  ('Phía sau nghi can X', 'phia-sau-nghi-can-x', 'Higashino Keigo', null, null,
   'Một vụ án tưởng như đã có lời giải ngay từ chương đầu, nhưng cách tác giả dẫn dắt khiến người đọc vẫn hồi hộp đến trang cuối cùng. Higashino Keigo xây dựng một trong những màn đấu trí được đánh giá cao nhất của dòng trinh thám Nhật. Không cần đọc trước phần nào khác trong series để hiểu câu chuyện.',
   null, 99000, null, null, null, null, null, null, 20,
   (select id from public.categories where slug = 'trinh-tham-kinh-di'), now() - interval '12 days'),

  ('Bạch dạ hành', 'bach-da-hanh', 'Higashino Keigo', null, null,
   'Một câu chuyện trải dài gần hai mươi năm, theo dấu hai nhân vật bị ràng buộc bởi một bí mật từ thời thơ ấu. Kết cấu phức tạp nhưng được dẫn dắt rất chắc tay. Nhiều độc giả xem đây là tác phẩm đỉnh cao của Higashino Keigo.',
   null, 139000, null, null, null, null, null, null, 0,
   (select id from public.categories where slug = 'trinh-tham-kinh-di'), now() - interval '14 days'),

  ('Điều kỳ diệu của tiệm tạp hóa Namiya', 'dieu-ky-dieu-cua-tiem-tap-hoa-namiya', 'Higashino Keigo', null, null,
   'Một tiệm tạp hóa cũ nơi những lá thư gửi đến có thể vượt qua ranh giới thời gian để đến tay người cần đọc chúng. Nhẹ nhàng và ấm áp hơn hẳn dòng trinh thám quen thuộc của tác giả. Hợp để đọc vào những ngày cần một câu chuyện tử tế.',
   null, 109000, 85000, null, null, null, null, null, 27,
   (select id from public.categories where slug = 'ky-ao-khoa-hoc-vien-tuong'), now() - interval '16 days'),

  ('Mắt biếc', 'mat-biec', 'Nguyễn Nhật Ánh', null, null,
   'Ngạn yêu Hà Lan từ thời thơ ấu ở một làng quê miền Trung, một tình yêu đi theo suốt những năm tháng trưởng thành dù không phải lúc nào cũng được đáp lại. Giọng văn quen thuộc của Nguyễn Nhật Ánh về tuổi thơ và vùng quê Việt Nam. Một trong những tác phẩm được nhắc đến nhiều nhất của ông.',
   null, 88000, null, null, null, null, null, null, 40,
   (select id from public.categories where slug = 'van-hoc-viet-nam'), now() - interval '18 days'),

  ('Tôi thấy hoa vàng trên cỏ xanh', 'toi-thay-hoa-vang-tren-co-xanh', 'Nguyễn Nhật Ánh', null, null,
   'Chuyện của hai anh em Thiều và Tường ở một vùng quê nghèo, nơi những trò nghịch ngợm tuổi nhỏ đi cùng những bài học đầu đời về lòng tốt và sự ích kỷ. Đã được dựng thành phim cùng tên rất được yêu thích. Nhẹ nhàng, gần gũi, dễ đọc trong vài buổi tối.',
   null, 95000, 79000, null, null, null, null, null, 35,
   (select id from public.categories where slug = 'van-hoc-viet-nam'), now() - interval '21 days'),

  ('Kế toán vỉa hè', 'ke-toan-via-he', 'Darrell Mullis, Judith Orloff', null, null,
   'Giải thích các khái niệm kế toán và tài chính doanh nghiệp cơ bản qua một câu chuyện kể, thay vì bảng biểu khô khan. Phù hợp cho người mới bắt đầu tìm hiểu về tài chính mà không có nền tảng chuyên môn. Đọc xong có thể hiểu được báo cáo tài chính đơn giản.',
   null, 119000, null, null, null, null, null, null, 10,
   (select id from public.categories where slug = 'tai-chinh-dau-tu'), now() - interval '23 days'),

  ('Cha giàu cha nghèo', 'cha-giau-cha-ngheo', 'Robert T. Kiyosaki', null, null,
   'So sánh hai cách tư duy về tiền bạc qua hai hình mẫu người cha trong đời tác giả. Cuốn sách đặt lại câu hỏi về sự khác nhau giữa tài sản và tiêu sản. Một trong những cuốn sách về tài chính cá nhân được nhắc đến nhiều nhất, dù không thiếu tranh luận.',
   null, 99000, 79000, null, null, null, null, null, 22,
   (select id from public.categories where slug = 'tai-chinh-dau-tu'), now() - interval '25 days'),

  ('Tâm lý học về tiền', 'tam-ly-hoc-ve-tien', 'Morgan Housel', null, null,
   'Tiền bạc không chỉ là con số, mà còn là chuyện của cảm xúc, thói quen và may rủi. Morgan Housel kể lại nhiều câu chuyện thực tế để chỉ ra vì sao người thông minh vẫn có thể ra quyết định tài chính sai lầm. Ngắn gọn, dễ đọc, không đòi hỏi nền tảng tài chính trước đó.',
   null, 109000, null, null, null, null, null, null, 17,
   (select id from public.categories where slug = 'tai-chinh-dau-tu'), now() - interval '28 days'),

  ('Từ tốt đến vĩ đại', 'tu-tot-den-vi-dai', 'Jim Collins', null, null,
   'Nghiên cứu điều gì giúp một số công ty bứt phá từ tốt lên vĩ đại trong khi phần lớn công ty khác thì không. Dựa trên dữ liệu thực tế từ nhiều doanh nghiệp lớn, không phải lý thuyết suông. Vẫn được nhắc đến nhiều trong giới quản trị dù đã xuất bản khá lâu.',
   null, 149000, null, null, null, null, null, null, 8,
   (select id from public.categories where slug = 'quan-tri-lanh-dao'), now() - interval '30 days'),

  ('Con bò tím', 'con-bo-tim', 'Seth Godin', null, null,
   'Lập luận rằng sản phẩm an toàn, giống mọi sản phẩm khác trên thị trường, chính là lựa chọn rủi ro nhất. Seth Godin cổ vũ cho sự khác biệt như một chiến lược marketing, không phải một sự may rủi. Ngắn, nhiều ví dụ, đọc trong một buổi chiều.',
   null, 89000, 69000, null, null, null, null, null, 26,
   (select id from public.categories where slug = 'marketing-ban-hang'), now() - interval '32 days'),

  ('Bạn có thể đàm phán bất cứ điều gì', 'ban-co-the-dam-phan-bat-cu-dieu-gi', 'Herb Cohen', null, null,
   'Những nguyên tắc đàm phán áp dụng được từ việc mua bán ngoài chợ đến các thương vụ lớn. Herb Cohen viết bằng giọng hài hước, thực tế, ít lý thuyết hàn lâm. Hữu ích cho cả công việc lẫn những tình huống thương lượng đời thường.',
   null, 99000, null, null, null, null, null, null, 0,
   (select id from public.categories where slug = 'marketing-ban-hang'), now() - interval '35 days'),

  ('Khởi nghiệp tinh gọn', 'khoi-nghiep-tinh-gon', 'Eric Ries', null, null,
   'Đề xuất một cách tiếp cận khởi nghiệp dựa trên thử nghiệm nhanh, đo lường và học hỏi liên tục, thay vì lên kế hoạch hoàn hảo rồi mới bắt đầu. Khái niệm MVP (sản phẩm khả dụng tối thiểu) trong sách đã trở thành thuật ngữ phổ biến trong giới startup. Phù hợp cho ai đang cân nhắc bắt đầu một dự án riêng.',
   null, 139000, 105000, null, null, null, null, null, 19,
   (select id from public.categories where slug = 'khoi-nghiep'), now() - interval '37 days'),

  ('Từ không đến một', 'tu-khong-den-mot', 'Peter Thiel, Blake Masters', null, null,
   'Peter Thiel lập luận rằng đổi mới thực sự là tạo ra thứ chưa từng tồn tại, không phải cải tiến thứ đã có. Cuốn sách đưa ra góc nhìn khác biệt, đôi khi gây tranh cãi, về khởi nghiệp và cạnh tranh. Ngắn nhưng nhiều ý cần dừng lại suy nghĩ.',
   null, 119000, null, null, null, null, null, null, 14,
   (select id from public.categories where slug = 'khoi-nghiep'), now() - interval '39 days'),

  ('Đắc nhân tâm', 'dac-nhan-tam', 'Dale Carnegie', null, null,
   'Những nguyên tắc cơ bản để giao tiếp, thuyết phục và xây dựng mối quan hệ tốt hơn với người khác. Xuất bản lần đầu từ thập niên 1930 nhưng phần lớn nguyên tắc vẫn còn nguyên giá trị. Một trong những cuốn sách kỹ năng sống được in lại nhiều nhất mọi thời đại.',
   'Phần 1: Những nguyên tắc cơ bản để thu phục lòng người — Phần 2: Sáu cách tạo thiện cảm — Phần 3: Cách dẫn dắt người khác đồng ý với mình — Phần 4: Nghệ thuật góp ý mà không gây oán giận.',
   86000, null, null, null, null, null, null, 45,
   (select id from public.categories where slug = 'ky-nang-song'), now() - interval '42 days'),

  ('Thói quen nguyên tử', 'thoi-quen-nguyen-tu', 'James Clear', null, null,
   'Chỉ ra rằng những thay đổi nhỏ, lặp lại đều đặn, mới là thứ tạo nên kết quả lớn theo thời gian — chứ không phải các quyết tâm to tát. James Clear đưa ra khung hành động cụ thể để xây dựng thói quen tốt và bỏ thói quen xấu. Dễ áp dụng ngay sau khi đọc vài chương đầu.',
   'Phần 1: Vì sao những thay đổi nhỏ lại tạo ra khác biệt lớn — Phần 2: Bốn quy luật hình thành thói quen tốt — Phần 3: Cách áp dụng bốn quy luật vào thực tế — Phần 4: Duy trì thói quen về lâu dài.',
   116000, 89000, null, null, null, null, null, 38,
   (select id from public.categories where slug = 'ky-nang-song'), now() - interval '44 days'),

  ('Tuổi trẻ đáng giá bao nhiêu', 'tuoi-tre-dang-gia-bao-nhieu', 'Rosie Nguyễn', null, null,
   'Những chia sẻ về việc học, đi và trải nghiệm của một người trẻ Việt Nam, viết cho những người trẻ Việt Nam khác. Không có công thức thành công nào tuyệt đối, chỉ có những gợi ý thẳng thắn từ trải nghiệm thật. Được nhiều độc giả trẻ trong nước yêu thích suốt nhiều năm.',
   null, 79000, null, null, null, null, null, null, 29,
   (select id from public.categories where slug = 'ky-nang-song'), now() - interval '46 days'),

  ('Con đường chẳng mấy ai đi', 'con-duong-chang-may-ai-di', 'M. Scott Peck', null, null,
   'Bắt đầu từ một câu rất ngắn — cuộc sống vốn khó khăn — cuốn sách bàn về kỷ luật, tình yêu và sự trưởng thành tâm lý. Kết hợp giữa tâm lý học và những suy ngẫm tinh thần. Không phải sách đọc nhanh, nhưng đọc chậm sẽ thấy nhiều điều đáng suy nghĩ.',
   null, 99000, 79000, null, null, null, null, null, 16,
   (select id from public.categories where slug = 'tam-ly-hoc'), now() - interval '48 days'),

  ('Tư duy nhanh và chậm', 'tu-duy-nhanh-va-cham', 'Daniel Kahneman', null, null,
   'Nhà tâm lý học đoạt giải Nobel kinh tế giải thích hai hệ thống tư duy trong não bộ con người: một nhanh và trực giác, một chậm và cẩn trọng. Nhiều ví dụ thực nghiệm lý giải vì sao con người hay đưa ra quyết định phi lý trí. Sách dày, nên đọc thong thả từng phần.',
   null, 189000, null, null, null, null, null, null, 11,
   (select id from public.categories where slug = 'tam-ly-hoc'), now() - interval '51 days'),

  ('Mindset – Tâm lý học thành công', 'mindset-tam-ly-hoc-thanh-cong', 'Carol S. Dweck', null, null,
   'Phân biệt hai kiểu tư duy — cố định và tăng trưởng — và cách mỗi kiểu ảnh hưởng đến việc học tập, sự nghiệp và cách đối diện thất bại. Carol Dweck dùng nhiều nghiên cứu và ví dụ thực tế để minh họa. Thường được nhắc đến trong cả giáo dục lẫn phát triển bản thân.',
   'Phần 1: Hai kiểu tư duy — cố định và tăng trưởng — Phần 2: Ảnh hưởng của tư duy đến thể thao và kinh doanh — Phần 3: Tư duy trong giáo dục và nuôi dạy con — Phần 4: Cách thay đổi tư duy của chính mình.',
   109000, null, null, null, null, null, null, 0,
   (select id from public.categories where slug = 'tam-ly-hoc'), now() - interval '53 days'),

  ('Phi lý trí', 'phi-ly-tri', 'Dan Ariely', null, null,
   'Loạt thí nghiệm hành vi cho thấy con người thường xuyên đưa ra quyết định phi lý trí một cách có thể đoán trước được — kể cả khi tự tin rằng mình đang rất tỉnh táo. Dan Ariely viết dí dỏm, dễ hiểu, không cần nền tảng kinh tế học hành vi trước đó. Nhiều ví dụ có thể áp dụng ngay vào chi tiêu hàng ngày.',
   null, 99000, 75000, null, null, null, null, null, 23,
   (select id from public.categories where slug = 'tam-ly-hoc'), now() - interval '55 days'),

  ('Hiểu về trái tim', 'hieu-ve-trai-tim', 'Minh Niệm', null, null,
   'Những bài viết ngắn về cảm xúc, khổ đau và cách quay về chăm sóc chính mình, theo tinh thần chánh niệm. Giọng văn nhẹ nhàng, gần với tản văn hơn là sách self-help thông thường. Phù hợp đọc từng phần nhỏ mỗi ngày thay vì đọc liền một mạch.',
   null, 89000, null, null, null, null, null, null, 31,
   (select id from public.categories where slug = 'suc-khoe-chua-lanh'), now() - interval '58 days'),

  ('Sapiens: Lược sử loài người', 'sapiens-luoc-su-loai-nguoi', 'Yuval Noah Harari', null, null,
   'Kể lại hành trình của loài người từ một loài vượn không mấy nổi bật đến khi thống trị hành tinh, qua ba cuộc cách mạng: nhận thức, nông nghiệp và khoa học. Harari đặt nhiều câu hỏi lớn bằng giọng văn dễ tiếp cận. Một trong những sách phổ biến khoa học/lịch sử được nhắc đến nhiều nhất thập kỷ qua.',
   'Phần 1: Cách mạng Nhận thức — Phần 2: Cách mạng Nông nghiệp — Phần 3: Sự thống nhất của loài người — Phần 4: Cách mạng Khoa học.',
   199000, 159000, null, null, null, null, null, 20,
   (select id from public.categories where slug = 'lich-su'), now() - interval '60 days'),

  ('Homo Deus: Lược sử tương lai', 'homo-deus-luoc-su-tuong-lai', 'Yuval Noah Harari', null, null,
   'Phần tiếp nối của Sapiens, đặt câu hỏi loài người sẽ đi về đâu sau khi đã phần nào kiểm soát được đói nghèo và dịch bệnh. Bàn về trí tuệ nhân tạo, dữ liệu lớn và tương lai của chính khái niệm "con người". Nhiều góc nhìn gây tranh luận, đúng chất Harari.',
   null, 199000, null, null, null, null, null, null, 13,
   (select id from public.categories where slug = 'lich-su'), now() - interval '62 days'),

  ('Súng, vi trùng và thép', 'sung-vi-trung-va-thep', 'Jared Diamond', null, null,
   'Lý giải vì sao lịch sử phát triển không đồng đều giữa các châu lục lại xuất phát từ địa lý và môi trường, không phải sự khác biệt về chủng tộc. Lập luận chặt chẽ, nhiều dẫn chứng liên ngành. Sách kinh điển của dòng lịch sử thế giới phổ thông.',
   null, 179000, null, null, null, null, null, null, 9,
   (select id from public.categories where slug = 'lich-su'), now() - interval '65 days'),

  ('Lược sử thời gian', 'luoc-su-thoi-gian', 'Stephen Hawking', null, null,
   'Stephen Hawking cố gắng giải thích những khái niệm vật lý phức tạp — từ Big Bang đến hố đen — bằng ngôn ngữ dành cho người không chuyên. Không phải chương nào cũng dễ, nhưng đây vẫn là một trong những cách tiếp cận vũ trụ học dễ vào nhất cho người mới bắt đầu. Nên đọc chậm, có thể đọc lại vài đoạn.',
   null, 99000, 79000, null, null, null, null, null, 25,
   (select id from public.categories where slug = 'khoa-hoc-pho-thong'), now() - interval '67 days'),

  ('Vũ trụ', 'vu-tru', 'Carl Sagan', null, null,
   'Carl Sagan đưa người đọc đi qua lịch sử vũ trụ và vị trí nhỏ bé của Trái Đất trong đó, bằng giọng văn vừa khoa học vừa đầy chất thơ. Dựa trên loạt phim tài liệu cùng tên nổi tiếng của ông. Phù hợp cho ai tò mò về khoa học nhưng không tìm sách giáo khoa.',
   null, 249000, null, null, null, null, null, null, 6,
   (select id from public.categories where slug = 'khoa-hoc-pho-thong'), now() - interval '69 days'),

  ('Thế giới của Sophie', 'the-gioi-cua-sophie', 'Jostein Gaarder', null, null,
   'Một cô bé nhận được những lá thư bí ẩn đặt ra các câu hỏi triết học, và từ đó cuốn sách dẫn người đọc đi qua lịch sử triết học phương Tây. Viết dưới dạng tiểu thuyết nên dễ tiếp cận hơn nhiều sách triết học thông thường. Phù hợp cho người mới bắt đầu tìm hiểu triết học.',
   null, 159000, null, null, null, null, null, null, 21,
   (select id from public.categories where slug = 'triet-hoc'), now() - interval '71 days'),

  ('Suy tưởng', 'suy-tuong', 'Marcus Aurelius', null, null,
   'Những ghi chép riêng tư của một hoàng đế La Mã, viết cho chính mình chứ không phải để xuất bản. Bàn về cách sống điềm tĩnh, có kỷ luật và chấp nhận những điều không thể kiểm soát — theo tinh thần triết học Khắc kỷ. Ngắn, có thể đọc mỗi lần vài trang.',
   null, 79000, 65000, null, null, null, null, null, 33,
   (select id from public.categories where slug = 'triet-hoc'), now() - interval '74 days'),

  ('Dandadan – Tập 1', 'dandadan-tap-1', 'Yukinobu Tatsu', null, null,
   'Hai nhân vật chính, một tin vào ma một tin vào người ngoài hành tinh, cùng nhau chứng minh niềm tin của mình đúng — rồi phát hiện cả hai thứ đều có thật. Tiết tấu nhanh, hài hước, hành động dồn dập. Một trong những manga mới được chú ý nhiều gần đây.',
   null, 35000, null, null, null, null, null, null, 50,
   (select id from public.categories where slug = 'manga'), now() - interval '76 days'),

  ('Thám tử lừng danh Conan – Tập 1', 'tham-tu-lung-danh-conan-tap-1', 'Gosho Aoyama', null, null,
   'Thám tử học sinh cấp ba Shinichi Kudo bị biến thành một đứa trẻ tiểu học sau khi trúng độc dược bí ẩn, và phải giấu danh tính thật để điều tra tổ chức đứng sau. Mở đầu cho một trong những series manga trinh thám dài hơi và nổi tiếng nhất. Tập 1 đặt nền cho toàn bộ thế giới truyện.',
   null, 25000, null, null, null, null, null, null, 0,
   (select id from public.categories where slug = 'manga'), now() - interval '78 days'),

  ('Spy x Family – Tập 1', 'spy-x-family-tap-1', 'Endo Tatsuya', null, null,
   'Một điệp viên, một sát thủ và một cô bé có khả năng đọc suy nghĩ — vô tình trở thành một gia đình, mỗi người đều giấu bí mật của riêng mình với hai người còn lại. Kết hợp giữa hành động và hài hước gia đình. Nhẹ nhàng, dễ đọc, hợp cho người mới bắt đầu đọc manga.',
   null, 35000, 28000, null, null, null, null, null, 42,
   (select id from public.categories where slug = 'manga'), now() - interval '81 days'),

  ('Frieren – Pháp sư tiễn táng – Tập 1', 'frieren-phap-su-tien-tang-tap-1', 'Yamada Kanehito, Abe Tsukasa', null, null,
   'Sau khi đánh bại Ma Vương cùng đồng đội, pháp sư trường thọ Frieren tiếp tục sống qua nhiều thế hệ — và bắt đầu nhận ra mình đã hiểu quá ít về những người bạn đã cùng mình chinh chiến. Chậm rãi, nhiều suy tư hơn phần lớn manga phiêu lưu thông thường. Được đánh giá cao về mặt cảm xúc.',
   null, 39000, null, null, null, null, null, null, 28,
   (select id from public.categories where slug = 'manga'), now() - interval '83 days'),

  ('Văn hào lưu lạc – Tập 1', 'van-hao-luu-lac-tap-1', 'Asagiri Kafka, Harukawa Sango', null, null,
   'Một cậu bé bị đuổi khỏi trại trẻ mồ côi tình cờ dính líu đến một tổ chức trinh thám kỳ lạ, nơi các thành viên mang tên và năng lực gợi nhắc đến những nhà văn nổi tiếng. Kết hợp hành động siêu năng lực với các tham chiếu văn học. Ý tưởng khá riêng so với manga cùng thể loại.',
   null, 35000, null, null, null, null, null, null, 19,
   (select id from public.categories where slug = 'manga'), now() - interval '85 days'),

  ('Horimiya – Tập 1', 'horimiya-tap-1', 'HERO, Hagiwara Daisuke', null, null,
   'Hai học sinh trung học tình cờ phát hiện ra mặt khác của nhau ngoài hình ảnh ở trường, từ đó bắt đầu một mối quan hệ không giống ai đoán trước. Nhẹ nhàng, tập trung vào đời sống học đường hơn là kịch tính lớn. Phù hợp cho ai thích thể loại slice-of-life.',
   null, 32000, 25000, null, null, null, null, null, 24,
   (select id from public.categories where slug = 'manga'), now() - interval '87 days'),

  ('Overlord – Tập 6', 'overlord-tap-6', 'Maruyama Kugane', null, null,
   'Ainz Ooal Gown tiếp tục củng cố quyền lực tại vương quốc ma pháp Nazarick, trong khi thế giới game thực tại ảo mà nhân vật từng biết ngày càng lộ ra những góc khuất mới. Tập 6 tiếp nối mạch truyện dành cho người đã theo dõi từ các tập trước. Phù hợp cho độc giả quen với thể loại isekai.',
   null, 89000, null, null, null, null, null, null, 15,
   (select id from public.categories where slug = 'light-novel'), now() - interval '90 days')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 3. TỦ SÁCH (mục 4.3) — 3 tủ, đúng 1 tủ is_featured = true.
--    NỘI DUNG NHÁP: description/curator_note cần duyệt lại.
-- ----------------------------------------------------------------------------

insert into public.collections (title, slug, description, is_featured, sort_order) values
  ('Hành trang năm đầu đi làm', 'hanh-trang-nam-dau-di-lam',
   'Những cuốn sách chúng mình muốn gửi cho một người bạn sắp đi làm năm đầu tiên — về tiền, về cách nói chuyện với đồng nghiệp, và về việc giữ vững bản thân giữa nhịp sống mới.',
   true, 1),
  ('Văn học Nhật cho người mới bắt đầu', 'van-hoc-nhat-cho-nguoi-moi-bat-dau',
   'Nếu bạn chưa từng đọc văn học Nhật, đây là 5 cuốn chúng mình nghĩ nên bắt đầu — đủ khác nhau về giọng văn để bạn nhận ra mình hợp kiểu nào.',
   false, 2),
  ('Hiểu mình trước khi hiểu đời', 'hieu-minh-truoc-khi-hieu-doi',
   'Trước khi tìm lời khuyên từ bên ngoài, có lẽ nên bắt đầu bằng việc hiểu cách đầu óc và cảm xúc của chính mình đang vận hành.',
   false, 3)
on conflict (slug) do nothing;

insert into public.collection_books (collection_id, book_id, position, curator_note) values
  ((select id from public.collections where slug = 'hanh-trang-nam-dau-di-lam'),
   (select id from public.books where slug = 'tam-ly-hoc-ve-tien'), 1,
   'Hiểu vì sao mình hay chi tiêu theo cảm xúc là bước đầu để quản lý lương tháng đầu tiên tốt hơn.'),
  ((select id from public.collections where slug = 'hanh-trang-nam-dau-di-lam'),
   (select id from public.books where slug = 'ke-toan-via-he'), 2,
   'Không cần học kế toán, chỉ cần hiểu đủ để đọc được một bản báo cáo tài chính đơn giản.'),
  ((select id from public.collections where slug = 'hanh-trang-nam-dau-di-lam'),
   (select id from public.books where slug = 'thoi-quen-nguyen-tu'), 3,
   'Năm đầu đi làm là lúc hợp để xây lại vài thói quen — cuốn này chỉ cách bắt đầu từ việc rất nhỏ.'),
  ((select id from public.collections where slug = 'hanh-trang-nam-dau-di-lam'),
   (select id from public.books where slug = 'dac-nhan-tam'), 4,
   'Vẫn là lựa chọn đầu tiên khi cần học cách giao tiếp khéo léo hơn ở môi trường mới.'),
  ((select id from public.collections where slug = 'hanh-trang-nam-dau-di-lam'),
   (select id from public.books where slug = 'ban-co-the-dam-phan-bat-cu-dieu-gi'), 5,
   'Từ deal lương đến deal deadline, vài nguyên tắc đàm phán cơ bản sẽ giúp bạn tự tin hơn hẳn.'),
  ((select id from public.collections where slug = 'hanh-trang-nam-dau-di-lam'),
   (select id from public.books where slug = 'tuoi-tre-dang-gia-bao-nhieu'), 6,
   'Một góc nhìn gần gũi từ người trẻ Việt Nam, cho những băn khoăn rất thật ở tuổi mới ra trường.'),

  ((select id from public.collections where slug = 'van-hoc-nhat-cho-nguoi-moi-bat-dau'),
   (select id from public.books where slug = 'dieu-ky-dieu-cua-tiem-tap-hoa-namiya'), 1,
   'Ấm áp và dễ vào nhất trong danh sách này — hợp để làm quen với văn học Nhật.'),
  ((select id from public.collections where slug = 'van-hoc-nhat-cho-nguoi-moi-bat-dau'),
   (select id from public.books where slug = 'phia-sau-nghi-can-x'), 2,
   'Trinh thám nhưng vẫn rất Nhật ở cách nhân vật giữ cảm xúc cho riêng mình.'),
  ((select id from public.collections where slug = 'van-hoc-nhat-cho-nguoi-moi-bat-dau'),
   (select id from public.books where slug = 'rung-na-uy'), 3,
   'Chậm hơn hai cuốn trên, cần một tâm thế sẵn sàng đọc chậm lại cùng nhân vật.'),
  ((select id from public.collections where slug = 'van-hoc-nhat-cho-nguoi-moi-bat-dau'),
   (select id from public.books where slug = 'bach-da-hanh'), 4,
   'Nếu đã quen với Higashino Keigo qua cuốn trước, đây là lúc thử một câu chuyện dài hơi và phức tạp hơn.'),
  ((select id from public.collections where slug = 'van-hoc-nhat-cho-nguoi-moi-bat-dau'),
   (select id from public.books where slug = 'xu-tuyet'), 5,
   'Ngắn nhất trong danh sách nhưng cần đọc chậm nhất — mỗi câu đều có lý do để ở đó.'),

  ((select id from public.collections where slug = 'hieu-minh-truoc-khi-hieu-doi'),
   (select id from public.books where slug = 'hieu-ve-trai-tim'), 1,
   'Đọc từng phần nhỏ mỗi ngày, không cần vội đọc hết trong một lần.'),
  ((select id from public.collections where slug = 'hieu-minh-truoc-khi-hieu-doi'),
   (select id from public.books where slug = 'mindset-tam-ly-hoc-thanh-cong'), 2,
   'Giải thích rất rõ vì sao đôi khi mình tự cản bước tiến của chính mình.'),
  ((select id from public.collections where slug = 'hieu-minh-truoc-khi-hieu-doi'),
   (select id from public.books where slug = 'con-duong-chang-may-ai-di'), 3,
   'Không dễ đọc nhưng xứng đáng để đọc chậm, nhất là ở những giai đoạn khó khăn.'),
  ((select id from public.collections where slug = 'hieu-minh-truoc-khi-hieu-doi'),
   (select id from public.books where slug = 'phi-ly-tri'), 4,
   'Vui và dễ đọc hơn vẻ ngoài học thuật của nó — nhiều ví dụ bạn sẽ thấy quen.'),
  ((select id from public.collections where slug = 'hieu-minh-truoc-khi-hieu-doi'),
   (select id from public.books where slug = 'tu-duy-nhanh-va-cham'), 5,
   'Dày nhất trong tủ sách này, nhưng chia nhỏ ra đọc dần vẫn ổn.'),
  ((select id from public.collections where slug = 'hieu-minh-truoc-khi-hieu-doi'),
   (select id from public.books where slug = 'the-gioi-cua-sophie'), 6,
   'Một cách nhẹ nhàng để bắt đầu làm quen với triết học, qua hình thức tiểu thuyết.')
on conflict (collection_id, book_id) do nothing;

commit;

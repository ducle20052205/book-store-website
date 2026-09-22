# supabase/migrations

Máy dev không có Supabase CLI, nên mọi migration được áp dụng qua Supabase MCP
(`apply_migration`), không phải `supabase db push`. Tên file phải khớp đúng
`version` mà Supabase ghi nhận trong `supabase_migrations.schema_migrations`
(kiểm tra bằng `list_migrations`), dạng `<version>_<tên>.sql`.

**Lệch quy ước đặt tên:** 4 file đầu tiên (`0001_init_schema.sql`,
`0002_restrict_trigger_function_execute.sql`, `0003_perf_fixes.sql`) được đặt
tên thủ công theo số thứ tự `000N` trước khi quy ước trên được chốt — chúng
không khớp 1-1 với `version` timestamp thật trên remote (remote ghi nhận 4 lần
apply: `init_schema`, `restrict_trigger_function_execute`,
`restrict_trigger_function_execute_v2`, `perf_fixes`, nhưng `0002` ở local đã
gộp nội dung cuối cùng của cả `restrict_trigger_function_execute` lẫn phiên
bản `_v2` sửa lỗi của nó). Các file này giữ nguyên, không đổi tên lại.

Từ `20260922050938_add_collections_and_category_sort_order.sql` trở đi, tên
file luôn khớp đúng `version` thật trên remote.

# Runbook — Supabase cục bộ (Docker) để kiểm các bước cần phiên thật

Cập nhật lần cuối: 07/10/2026. Dựng và kiểm chứng ở đợt 2B bằng Supabase CLI 2.118.0; dựng lại và đo lại ngày 06/10/2026 (mục "Môi trường đã đo ngày 06/10/2026").

## Vì sao cần

Đăng ký, đăng nhập và mọi phép kiểm cần phiên thật đều gửi credential tới Auth. Trên project hosted việc đó chỉ người dùng làm được; trên stack chạy ngay trên máy (credential không rời máy) thì tài khoản thử tạo, dùng và xoá thoải mái. Stack này **chỉ để kiểm thử**: migration lên hosted vẫn áp bằng Supabase MCP (xem `CLAUDE.md`), không dùng `supabase link` hay `supabase db push`.

## Dựng

Điều kiện: Docker Desktop đang chạy; Supabase CLI (tải bản phát hành chính thức ở github.com/supabase/cli/releases, đối chiếu SHA256 với `checksums.txt` cùng bản phát hành; không cần thêm vào `package.json`).

```bash
supabase start -x studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta
```

Lần đầu `start` áp toàn bộ `supabase/migrations/` rồi `supabase/seed.sql` (bỏ qua `README.md`). Chỉ năm dịch vụ chạy: Postgres, Kong, Auth (GoTrue), PostgREST, Mailpit. Lưu ý: CLI vẫn **kéo** image của cả các dịch vụ bị loại trừ (lần đầu tổng cộng ~3,9 GB, trong đó `realtime` 559 MB và `storage-api` 1,31 GB không dùng tới; xoá bằng `docker image rm` nếu cần chỗ).

Dừng: `supabase stop`. Dữ liệu nằm trong volume Docker, mất khi `supabase stop --no-backup`.

| Thành phần | Địa chỉ |
|---|---|
| API (Kong) | `http://127.0.0.1:54321` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Mailpit (thư đã "gửi") | `http://127.0.0.1:54324` (API: `/api/v1/messages`) |

Khoá của stack: `supabase status -o env`. Đó là khoá demo, chỉ có tác dụng trên máy này. Không `tail` hay in thẳng đầu ra của `supabase start` và `supabase status`: chúng chứa `JWT_SECRET` và khoá S3 cục bộ; lấy đúng biến cần dùng từ `supabase status -o env`.

## Môi trường đã đo ngày 06/10/2026

Dựng lại stack sau khi dữ liệu Docker bị đặt lại. Các dữ kiện dưới đây là số đo, không phải giả định.

- **CLI:** Supabase CLI 2.118.0 nằm ở `D:\tools\supabase-cli\supabase.exe` (SHA256 khớp `checksums.txt` của bản phát hành), **không nằm trên PATH**: mọi lệnh `supabase …` gọi bằng đường dẫn đầy đủ.
- **Docker:** dữ liệu Docker Desktop ở `E:\DockerData\DockerDesktopWSL` (`CustomWslDistroDir` trong `%APPDATA%\Docker\settings-store.json`); `docker_data.vhdx` 10,148 GB sau khi dựng stack 12 container (đo trước khi nạp dữ liệu demo).
- **Container Postgres:** `supabase_db_book-store-website`. Cổng host: API (Kong) `54321`, Postgres `54322`, Mailpit `54324`. Bên trong container Postgres nghe `5432` (`54322→5432`); `docker exec … psql` chạy trong container nên không dùng cổng host.
- **`supabase start` trơn** (không cờ `-x`) dựng **12 container, image ~7,97 GB**; lệnh có `-x` ở mục "Dựng" cắt xuống 5 container.
- **`start` có thể tái dùng volume cũ** (log "Starting database from backup..."): database mang trạng thái cũ, nên sau `start` phải chạy `supabase db reset` để áp lại 20 migration rồi `seed.sql` (`config.toml`: `[db.migrations]` và `[db.seed]` đều `enabled = true`).
- **Mốc kiểm sau `db reset`:** `supabase migration list --local` ra 20 (khớp 20 file `.sql`; 19 trước migration `admin_dashboard_stats` của đợt 6), `books` 40, sách tồn kho 0 là 4, tổng tồn kho 835; `auth.users`, `orders`, `events` đều 0.
- **Quyền:** vai `postgres` (không phải superuser) xoá được `auth.users`: kiểm 06/10/2026 bằng `begin; delete from auth.users where id = '00000000-…'; rollback;` (`DELETE 0`, không bị từ chối vì quyền) và xoá thật 25 tài khoản demo trong một transaction có `rollback` (`DELETE 25`).

## Cấu hình khớp hosted

`supabase/config.toml` (đã commit) khớp hosted ở những chỗ ảnh hưởng phép kiểm:

| Cài đặt | Cục bộ | Hosted |
|---|---|---|
| Confirm email | tắt (`mailer_autoconfirm = true`) | tắt |
| Độ dài mật khẩu tối thiểu | 8 | 8 |
| Password requirements | không | không |
| Secure email change | bật (`double_confirm_changes`) | bật |
| Ký JWT | **ES256**, khoá bất đối xứng, 1 khoá trong JWKS | ES256 |
| Provider | chỉ email | chỉ email |

Ký JWT bằng ES256 không phải mặc định của CLI (mặc định là khoá đối xứng HS256, khi đó `getClaims()` phải hỏi Auth server). Để có ES256: tạo file `supabase/signing_keys.json` chứa `[]`, chạy `supabase gen signing-key --algorithm ES256 --append`, và bỏ comment `signing_keys_path` trong `config.toml`. File khoá là private key, đã có trong `supabase/.gitignore`, **không commit**.

**Không khớp được** (ghi lại để đọc số đo cho đúng):

- Giới hạn email: cục bộ `GOTRUE_RATE_LIMIT_EMAIL_SENT=360000` (gần như không giới hạn; `[auth.rate_limit] email_sent` chỉ có tác dụng khi bật SMTP riêng), hosted 30 email/giờ.
- Độ dài OTP email 6 (hosted 8); Site URL và Redirect URLs trỏ `http://localhost:3100`; thư đi qua Mailpit chứ không qua Brevo.
- Đổi email: cục bộ, sau `updateUser({ email })` thì `auth.users.email` chưa đổi và hai thư (địa chỉ cũ, địa chỉ mới) được gửi, nhưng **bấm một liên kết đã đủ để đổi** dù Secure email change bật. Chưa đo trên hosted.

## Chạy app trỏ về stack cục bộ

Tạo `.env.supabase-local` (bị `.gitignore` bỏ qua, **không commit**, **không sửa `.env.local`**) với hai biến `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` và `NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key từ supabase status>`. `NEXT_PUBLIC_*` được nhúng lúc build, nên build và chạy như sau (không dùng cờ `--env-file` của Node: Next chặn nó ở worker):

```bash
set -a; . ./.env.supabase-local; set +a
npm run build
npx next start -p 3100
```

Kiểm chứng app chỉ nói chuyện với stack cục bộ: `grep -rl <mã-project-hosted> .next/static .next/server` phải ra 0 file. Xong việc, chạy lại `npm run build` **không** nạp env cục bộ để `.next` không còn nhúng địa chỉ cục bộ.

## Tài khoản thử

- Tạo qua chính `/dang-ky`. Tài khoản admin: đăng ký rồi thăng cấp theo `docs/runbooks/tao-admin-dau-tien.md`, chạy SQL bằng `docker exec supabase_db_book-store-website psql -U postgres -c "..."`.
- Dọn (chỉ trên stack cục bộ): `delete from public.events; delete from auth.users;` — `events.user_id` tham chiếu `auth.users` không cascade nên phải xoá `events` trước. Rồi `DELETE http://127.0.0.1:54324/api/v1/messages` để dọn Mailpit.

## Không đo được ở đây

- **TTFB và thời gian tải**: Auth, Postgres và app cùng máy, không có độ trễ mạng hay khởi động lạnh của hàm, nên không so được với mốc đo trên Vercel + Supabase hosted.
- **Đo trong trình duyệt tích hợp của Claude**: `requestAnimationFrame` chỉ chạy ~2 Hz ở đó (bộ hẹn giờ vẫn bình thường), nên bước hoán đổi Suspense của React (gom qua rAF) bị chậm giả tạo ~0,5–1 giây. Đừng dùng đo khoảng shell → nhãn tài khoản trong khung đó; đo ở trình duyệt thật.

## Dừng và khởi động lại

- **Dừng (giữ dữ liệu):** `supabase stop`. Không có CLI trong PATH thì dừng thẳng các container `supabase_*` trong Docker Desktop. Thoát Docker Desktop cũng dừng cả stack.
- **Khởi động lại:** chạy lại đúng lệnh `supabase start -x studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta` ở mục "Dựng" (image đã có sẵn nên không kéo lại).
- **Cảnh báo:** stack đang chạy vẫn chiếm RAM và một ít CPU khi không dùng. Đo ngày 30/09/2026: 5 container ~320 MB RAM lúc rảnh, chưa kể bộ nhớ Docker Desktop giữ cho máy ảo của nó. Không dùng nữa thì dừng.

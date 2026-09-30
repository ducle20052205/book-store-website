# Runbook — Giữ Supabase không bị tạm dừng (keep-alive)

Cập nhật lần cuối: 30/09/2026. Workflow: `.github/workflows/keep-alive.yml`.

## Vì sao cần

Supabase gói free tạm dừng project sau 7 ngày không có hoạt động. Workflow này
chạy mỗi ngày một lần (04:23 UTC, tức 11:23 giờ Việt Nam) và gọi hai trang công
khai của site — `/sach` và trang chi tiết của một cuốn sách lấy từ chính trang
đó — để mỗi ngày có request thật chạm tới database. Không dùng secret nào; repo
public nên Actions miễn phí. Chạy tay bất kỳ lúc nào: tab Actions → "Keep
Supabase alive" → Run workflow.

## Khi job báo lỗi

Job fail (và GitHub gửi email) nếu một request trả mã lỗi, quá 60 giây, hoặc
trang `/sach` không còn liên kết sách nào. Nghĩa là site production đang hỏng
hoặc database không phản hồi — kiểm tra trang Vercel và trạng thái project
trên Supabase Dashboard, chưa chắc là lỗi của workflow.

## Hạn chế đã biết

- **GitHub tự tắt workflow theo lịch ở repo không có hoạt động trong 60 ngày.**
  Nếu ngừng commit lâu, vào tab Actions, chọn "Keep Supabase alive" và bấm
  "Enable workflow" thủ công. Nếu không, Supabase sẽ lại tạm dừng sau 7 ngày.
  Thỉnh thoảng có commit mới vào repo là cách chắc chắn để không chạm mốc này.
- Lịch của GitHub không đảm bảo giờ chính xác: có thể trễ vài chục phút, hiếm
  khi bị bỏ một lần. Một lần trễ không đáng ngại vì ngưỡng của Supabase là 7 ngày.
- Workflow gọi URL production cố định `https://book-store-website-dun.vercel.app`.
  Đổi tên miền thì sửa `BASE_URL` trong file workflow.
- Email báo lỗi gửi tới người sửa dòng `cron` gần nhất; nếu không nhận được thì
  kiểm tra GitHub → Settings → Notifications → Actions.
- Request bằng `curl` không chạy JavaScript nên không tạo sự kiện `page_view`
  trong bảng `events`.

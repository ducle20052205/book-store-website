/**
 * Thanh đo độ mạnh mật khẩu ở /dang-ky (spec 2B mục 6, mockup dang-ky.png):
 * chỉ để GỢI Ý, không bao giờ chặn gửi form — luật duy nhất chặn là tối thiểu 8
 * ký tự (FR-5.1, NIST SP 800-63B: không áp đặt loại ký tự).
 *
 * Đo theo độ dài, vì độ dài mới là thứ NIST khuyến khích và là thứ duy nhất tính
 * đúng không cần thư viện: một câu ngắn dễ nhớ dài 20 ký tự tốt hơn "Ab1!" đủ loại
 * ký tự. Nghĩa nằm ở CHỮ ("Còn ngắn", "Đủ mạnh"…), không chỉ ở màu; các đoạn màu
 * là trang trí (aria-hidden).
 */
interface Level {
  filled: number;
  label: string;
}

export function strengthOf(password: string): Level | null {
  const length = password.length;
  if (length === 0) return null;
  if (length < 8) return { filled: 1, label: "Còn ngắn" };
  if (length < 12) return { filled: 2, label: "Tạm được" };
  if (length < 20) return { filled: 3, label: "Đủ mạnh" };
  return { filled: 4, label: "Rất mạnh" };
}

export function PasswordStrength({ password }: { password: string }) {
  const level = strengthOf(password);
  if (!level) return null;

  return (
    <div className="mt-2 flex items-center gap-3">
      <div aria-hidden="true" className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-notice ${
              segment <= level.filled ? (level.filled === 1 ? "bg-danger" : "bg-success") : "bg-line-warm"
            }`}
          />
        ))}
      </div>
      <p className="shrink-0 text-meta text-ink-600">
        <span className="sr-only">Độ mạnh mật khẩu: </span>
        {level.label}
      </p>
    </div>
  );
}

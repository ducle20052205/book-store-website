/**
 * Ngày giờ đặt đơn theo giờ Việt Nam (đợt 4, spec FR-B4.1): `dd/MM/yyyy HH:mm`, 24 giờ, múi giờ
 * `Asia/Ho_Chi_Minh`. Ghép từ `formatToParts` để thứ tự ngày/giờ không phụ thuộc mặc định của
 * locale; `hourCycle: "h23"` để nửa đêm là `00`, không phải `24`.
 */
const formatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatOrderDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

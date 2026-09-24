/**
 * E1 [Điều chỉnh sau duyệt]: nét kẻ nối cho chi tiết chữ ký (ghi chú biên
 * tập ở lề, xem docs/specs/dot-e-design-plan.md mục 1). Thuần trang trí —
 * không mang thông tin gì ngoài thứ đã thấy bằng mắt (ghi chú nằm cạnh
 * đúng cuốn nào) — luôn aria-hidden. Ẩn dưới 768px (`hidden md:block`,
 * trùng khớp breakpoint `md:` của Tailwind) vì không đủ chỗ lệch lề để có
 * gì mà nối; màu lấy từ `currentColor` để nơi gọi tự set qua className.
 */
export function EditorNoteConnector({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 32"
      fill="none"
      className={`hidden md:block ${className ?? ""}`}
    >
      <path
        d="M2 4 C 18 2, 30 10, 46 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

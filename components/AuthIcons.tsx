/**
 * Biểu tượng cho hai trang đăng nhập/đăng ký và ô thông báo (đợt 2B), cùng kiểu
 * vẽ với HeaderIcons: màu theo `currentColor`, cỡ do className quyết định, mọi
 * biểu tượng đều trang trí (aria-hidden) — nghĩa nằm ở chữ đi kèm.
 */
interface IconProps {
  className?: string;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function AlertCircleIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.2" />
      <path d="M12 16.4v.1" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="1.7" className={className}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function BookmarkIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="1.7" className={className}>
      <path d="M7 4h10v16l-5-3.6L7 20V4z" />
    </svg>
  );
}

/** Nét cong ngắn dưới câu trích ở cột editorial — trang trí, màu theo className. */
export function QuoteRuleIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 12" fill="none" className={className}>
      <path d="M2 9 C 20 2, 40 2, 62 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Biểu tượng cho header và menu tài khoản (đợt 2A) — đường vẽ lấy nguyên từ
 * docs/mockups/buoc-2/header-2a.html. Màu theo `currentColor`, kích cỡ do
 * className của nơi dùng quyết định; mọi biểu tượng đều trang trí (aria-hidden).
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

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="1.7" className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.6-3.6 4.3-5.4 7.5-5.4s5.9 1.8 7.5 5.4" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="1.7" className={className}>
      <path d="M6 8h12l-1.2 11H7.2L6 8z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="2.2" className={className}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function OrdersIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="1.7" className={className}>
      <path d="M6 7h12v13H6z" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="1.7" className={className}>
      <path d="M10 20H6V4h4M15 8l4 4-4 4M19 12H10" />
    </svg>
  );
}

/** Khu quản trị (đợt 6, FR-D.8): ba cột đứng, cùng nét 1.7 với UserIcon/OrdersIcon. */
export function AdminIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="1.7" className={className}>
      <path d="M5 20V11M12 20V4M19 20v-6" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth="2" className={className}>
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
}

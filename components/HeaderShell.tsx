"use client";

import { useEffect, useState } from "react";

/**
 * A.5: vỏ header dính cuộn — theo dõi vị trí cuộn để bật viền dưới + co
 * chiều cao top-bar (72px -> 60px) sau khi qua 8px. Tách riêng thành client
 * component để `Header` (server component, đọc category_tree từ Supabase)
 * không phải tự làm client.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header data-scrolled={scrolled} className="header-surface sticky top-0 z-40">
      {children}
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";

const SCROLLED_ON_THRESHOLD = 64;
const SCROLLED_OFF_THRESHOLD = 24;

/**
 * A2.1: vỏ header dính cuộn. Ngưỡng bật/tắt trạng thái "đã cuộn" lệch nhau
 * (bật khi scrollY > 64, tắt khi scrollY < 24) — một ngưỡng chung khiến
 * trạng thái bật/tắt liên tục khi người dùng cuộn qua lại quanh đầu trang,
 * gây nhấp nháy border/box-shadow dù đã bỏ animate height. Tách riêng thành
 * client component để `Header` (server component, đọc category_tree từ
 * Supabase) không phải tự làm client.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled((prev) => {
        if (window.scrollY > SCROLLED_ON_THRESHOLD) return true;
        if (window.scrollY < SCROLLED_OFF_THRESHOLD) return false;
        return prev;
      });
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

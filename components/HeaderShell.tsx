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
 *
 * B: chỉ `topbar` dính (position: sticky), `children` (CategoryNav) cuộn đi
 * như nội dung thường — trước đó cả khối (topbar + CategoryNav) cùng dính,
 * chiếm quá nhiều chiều cao màn hình trên mobile.
 *
 * QUAN TRỌNG: `<header>` (phần tử dính) và `children` phải là 2 SIBLING
 * riêng, KHÔNG lồng chung một wrapper cha ngắn. `<body>` ở root layout là
 * flex-col chứa Header/main/Footer — containing block của phần tử dính là
 * cha trực tiếp của nó, cần đủ cao (nhờ `<main>` cao) thì mới còn "dính"
 * suốt trang. Thử nghiệm thực tế: bọc topbar + CategoryNav trong một
 * <header> chung rồi để DIV topbar bên trong đó mới là sticky — containing
 * block khi đó là <header> đó, cao đúng bằng topbar+CategoryNav (~176px
 * mobile) nên chỉ dính được ~52px rồi tuột ngay (đo được stickyTop âm rất
 * sớm). Trả về Fragment với <header> (sticky) và children là 2 sibling
 * trực tiếp dưới <body> mới đúng.
 */
export function HeaderShell({
  topbar,
  children,
}: {
  topbar: React.ReactNode;
  children?: React.ReactNode;
}) {
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
    <>
      <header data-scrolled={scrolled} className="header-surface sticky top-0 z-40">
        {topbar}
      </header>
      {children}
    </>
  );
}

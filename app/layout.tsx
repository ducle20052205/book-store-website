import type { Metadata } from "next";
import { Be_Vietnam_Pro, Newsreader } from "next/font/google";
import { Suspense } from "react";
import { Footer, FooterCompact } from "@/components/Footer";
import { FooterSwitch } from "@/components/FooterSwitch";
import { Header } from "@/components/Header";
import { WelcomeStrip } from "@/components/WelcomeStrip";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

/**
 * Đợt E: thay Lora (không có trục cỡ quang học) bằng Newsreader — có trục
 * opsz, tự vẽ lại hình dạng ở cỡ nhỏ (đọc liền mạch) khác cỡ lớn (tiêu đề),
 * không phải phóng to cùng một hình như Lora. Đã kiểm tra dấu tiếng Việt
 * đầy đủ ở 400/600/italic (xem docs/specs/dot-e-design-plan.md mục 2).
 * italic chỉ dùng cho curator_note — xem quy tắc nghiêng/đứng cùng file.
 */
const newsreader = Newsreader({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NA Books",
  description: "NA Books — nhà sách tuyển chọn, mỗi lựa chọn đều có lời giải thích.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink-900">
        {/*
          FR-A.1 (WCAG 2.4.1): điểm dừng Tab đầu tiên của mọi trang, nhảy thẳng tới <main> để khỏi đi qua 8 điểm dừng
          của header. Ẩn bằng sr-only (hộp 1×1px, tuyệt đối, không chiếm chỗ trong luồng nên không đẩy bố cục); khi
          focus thì hiện đè lên header (absolute + z-index) ở góc trên trái.
        */}
        <a
          href="#noi-dung"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:h-12 focus:items-center focus:rounded-field focus:bg-cham-700 focus:px-6 focus:text-button focus:font-medium focus:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
        >
          Bỏ qua tới nội dung
        </a>
        <Header />
        <WelcomeStrip />
        {/* tabIndex={-1}: đích của liên kết bỏ qua phải nhận được focus; không phải điều khiển nên không vẽ vòng focus. */}
        <main id="noi-dung" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        {/* usePathname() trong FooterSwitch cần <Suspense> ở route có tham số động; fallback là footer đầy đủ. */}
        <Suspense fallback={<Footer />}>
          <FooterSwitch full={<Footer />} compact={<FooterCompact />} />
        </Suspense>
      </body>
    </html>
  );
}

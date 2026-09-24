import type { Metadata } from "next";
import { Be_Vietnam_Pro, Newsreader } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

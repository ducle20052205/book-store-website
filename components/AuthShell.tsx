import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  /** Dòng phụ dưới tiêu đề, thường là câu hỏi chuyển sang trang còn lại ("Chưa có tài khoản? …"). */
  subtitle: ReactNode;
  /**
   * Nội dung cột editorial nền tối. Từ md là cột trái 440px; dưới md rút thành
   * khối trích dẫn nằm DƯỚI form (spec 2B mục 5) — phần nào chỉ dành cho desktop
   * thì nơi truyền vào tự thêm `hidden md:block`.
   */
  editorial: ReactNode;
  /** Form. */
  children: ReactNode;
}

/**
 * Khung chung của /dang-nhap và /dang-ky (đợt 2B, spec mục 5, mockup
 * docs/mockups/buoc-2/dang-nhap.png và mobile.png).
 *
 * Từ md: thẻ rộng tối đa 1040px chia 440px cột editorial + phần còn lại (600px)
 * cột form, nền trắng, bo `radius-menu`. Dưới md: một cột — tiêu đề nằm ngay
 * trên nền trang, form trong thẻ trắng, khối editorial rút gọn nằm dưới. Thứ tự
 * DOM là tiêu đề → form → editorial, nên trình đọc màn hình và bàn phím gặp form
 * trước phần trang trí ở mọi kích thước; CSS grid mới đưa cột editorial sang trái.
 */
export function AuthShell({ title, subtitle, editorial, children }: AuthShellProps) {
  return (
    <div className="container-page py-8 md:py-16">
      <div className="mx-auto max-w-[1040px] md:grid md:grid-cols-[440px_minmax(0,1fr)] md:overflow-hidden md:rounded-menu md:bg-surface md:shadow-md">
        <div className="md:col-start-2 md:row-start-1 md:px-12 md:py-14">
          <h1 className="font-serif text-h2 font-semibold text-ink-900">{title}</h1>
          <div className="mt-1 text-body-sm text-ink-600">{subtitle}</div>
          <div className="mt-4 rounded-menu border border-line-warm bg-surface p-4 md:mt-5 md:rounded-none md:border-0 md:bg-transparent md:p-0">
            {children}
          </div>
        </div>

        <aside className="mt-6 flex flex-col justify-between gap-8 rounded-menu bg-cham-900 p-6 text-white md:col-start-1 md:row-start-1 md:mt-0 md:rounded-none md:p-10">
          {editorial}
        </aside>
      </div>
    </div>
  );
}

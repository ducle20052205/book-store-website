"use client";

import Link from "next/link";
import { useState } from "react";
import { BookCard } from "@/components/BookCard";
import { BookCover } from "@/components/BookCover";
import { Price } from "@/components/Price";
import { categoryColorClasses } from "@/lib/categoryColors";
import type { BookSummary, FeaturedBookExtra } from "@/lib/queries";

interface HomeTabsProps {
  newest: BookSummary[];
  bestselling: BookSummary[];
  /** E1/F2.1: mô tả ngắn + nhãn danh mục cho cuốn đứng đầu mỗi tab, theo slug. */
  featuredExtras: Record<string, FeaturedBookExtra>;
}

type TabKey = "moi-nhat" | "ban-chay";

/**
 * E1.5 [sửa lỗi cũ]: bản E1 cho bìa nổi bật một chiều rộng CỐ ĐỊNH trong
 * khi thẻ chiếm col-span cố định — bìa cố định có lúc còn NHỎ HƠN bìa thẻ
 * thường. E1.5 sửa bằng bìa % + thẻ chiếm TRỌN HÀNG ở mọi breakpoint, đạt
 * >=1.4x mọi nơi — nhưng lại tạo bìa quá to (tràn hết chiều rộng thẻ khi
 * thẻ chiếm cả 4-5 cột), sinh khoảng trống lớn dưới cột chữ ngắn hơn nhiều
 * so với bìa cao — đúng lỗi Đợt F chẩn đoán ("mảng trống lớn góc dưới phải").
 *
 * Đợt F [F2.1] — CHỨNG MINH BẰNG SỐ ĐO: đã thử giữ "chiếm trọn hàng" và ép
 * bìa vào trần 32-38%, đo thực tế (xem báo cáo đợt F): ở 1440px bìa đạt
 * đúng 35.8% (trong trần) và tỉ lệ 1.51x bìa thường (đạt sàn), NHƯNG diện
 * tích trống đo được 49.4% — vượt xa 15% cho phép. Nguyên nhân hình học:
 * cột chữ căn GIỮA (bullet 3 yêu cầu "căn giữa theo chiều dọc", không phải
 * lấp đầy) trong khi bìa 35% của 1 thẻ RỘNG HẾT HÀNG cao tới ~700px — nội
 * dung chữ (tên+tác giả+giá+mô tả+CTA) chỉ tự nhiên cao ~250-260px dù có
 * thêm nhãn danh mục, không cách nào "căn giữa" mà lấp hết 700px. Đã thử
 * giải phương trình đại số cho welcome mọi chiều rộng thẻ W: với text cao
 * cố định ~260px, diện tích trống nhỏ nhất đạt được la ~15.7% NHƯNG chỉ
 * tại W~260px (bìa khi đó chỉ ~90px — nhỏ hơn cả bìa thường, phá luôn sàn
 * 1.4x). Kết luận: 2 ràng buộc (sàn 1.4x) và (trần diện tích trống 15%)
 * KHÔNG thể cùng thoả với chữ căn giữa — đây là mâu thuẫn nội tại của
 * spec, không phải lỗi triển khai.
 *
 * Ưu tiên đã chọn (theo đúng chỉ dẫn "nếu 2 ràng buộc xung đột thì giảm
 * chiều cao thẻ" của spec — tức giảm bìa, chấp nhận tỉ lệ dưới 1.4x): thẻ
 * đổi từ "chiếm trọn hàng" sang LUÔN col-span-3 (không tăng theo cột lưới
 * ở lg/2xl nữa) — giữ W tương đối ổn định (~700-825px) qua mọi breakpoint
 * thay vì phình to theo số cột, kéo diện tích trống từ 49% xuống còn
 * ~35% (số đo thật xem báo cáo đợt F) — vẫn trên 15% nhưng đã giảm hơn
 * 1/3, tỉ lệ bìa còn ~1.18-1.22x (dưới sàn 1.4x nhưng vẫn RÕ RÀNG to hơn
 * bìa thường, không phải bằng hoặc nhỏ hơn). Quan trọng hơn: "không được
 * có mảng trống DƯỚI CÙNG" (bullet 2, đúng lỗi gốc trong ảnh chụp — trống
 * dồn hẳn một góc) ĐÃ được sửa dứt điểm bằng justify-center — trống giờ
 * chia đều 2 phía trên/dưới cột chữ, không còn dồn một góc.
 *
 * items-start ở lưới cha (xem HomeTabs) để 1 thẻ thường vô tình chung hàng
 * với thẻ nổi bật (do span 3/4 hoặc 3/5, không phải trọn hàng) KHÔNG bị
 * kéo dãn theo chiều cao thẻ nổi bật — tái lặp đúng lỗi "thẻ thường có
 * khoảng trống chết" mà E1.5 từng sửa.
 *
 * Bố cục dọc (ảnh trên, chữ dưới) dưới `md` vì thẻ hẹp, bìa tối đa 200px
 * (đúng spec); chuyển ngang từ `md` vì thẻ đã đủ rộng.
 *
 * Thêm nhãn danh mục (màu theo 1 trong 5 danh mục cha, tái dùng
 * categoryColorClasses) và dòng "Xem chi tiết" — viết dạng span thường,
 * KHÔNG lồng thêm <Link> thứ hai bên trong thẻ (thẻ đã là 1 link lớn bao
 * trọn — link lồng link là HTML không hợp lệ, đọc màn hình cũng sẽ báo 2
 * điểm dừng cho cùng 1 đích đến).
 */
function FeaturedBook({ book, extra }: { book: BookSummary; extra: FeaturedBookExtra | undefined }) {
  const description = extra?.description ?? null;
  const categoryName = extra?.categoryName ?? null;
  const categorySlug = extra?.categorySlug ?? null;

  return (
    <Link
      href={`/sach/${book.slug}`}
      className="hover-lift col-span-2 flex flex-col gap-5 rounded-card border border-line bg-surface p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 md:col-span-3 md:flex-row md:items-center md:gap-7"
    >
      <div className="mx-auto w-full max-w-[200px] shrink-0 md:mx-0 md:w-[37%] md:max-w-none">
        <BookCover
          slug={book.slug}
          title={book.title}
          author={book.author}
          coverImageUrl={book.coverImageUrl}
          className="shadow-md"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        {categoryName && (
          <span
            className={`mb-1 inline-block w-fit rounded-pill px-2 py-0.5 text-micro font-semibold text-white ${categoryColorClasses(categorySlug).bg}`}
          >
            {categoryName}
          </span>
        )}
        <p className="font-serif text-book-title font-semibold text-ink-900">{book.title}</p>
        <p className="text-meta text-ink-400">{book.author}</p>
        <Price
          price={book.price}
          discountPrice={book.discountPrice}
          hideBadge
          className="mt-1 text-card-price font-semibold"
        />
        {description && <p className="mt-4 line-clamp-3 max-w-[52ch] text-sm text-ink-600">{description}</p>}
        <span className="mt-4 inline-flex w-fit items-center gap-1 text-sm font-medium text-cham-700">
          Xem chi tiết <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

/**
 * Mục 2: khối tab Sách mới / Bán chạy trên trang chủ, dùng lại logic FR-1.6 /
 * FR-1.7 (8 sách mỗi tab). Độc lập với /sach — link nhanh "Sách mới"/"Bán
 * chạy" ở CategoryNav trỏ sang /sach?sort=... (1b.1), tab này chỉ còn phục vụ
 * xem nhanh ngay trên trang chủ nên mặc định mở "Sách mới".
 */
export function HomeTabs({ newest, bestselling, featuredExtras }: HomeTabsProps) {
  const [active, setActive] = useState<TabKey>("moi-nhat");

  const books = active === "moi-nhat" ? newest : bestselling;
  const [firstBook, ...restBooks] = books;

  return (
    <section>
      {/* E1.5 mục 5: gạch chân tab đang chọn dày 3px (từ 2px) — rõ hơn giữa
          một trang giờ có nhiều mảng màu chàm khác, không còn là điểm neo
          màu chàm mảnh nhất trên trang như trước. */}
      <div role="tablist" aria-label="Sách theo mục mới nhất hoặc bán chạy" className="flex gap-2 border-b border-line">
        <button
          type="button"
          role="tab"
          id="tab-moi-nhat"
          aria-selected={active === "moi-nhat"}
          aria-controls="panel-sach-tab"
          onClick={() => setActive("moi-nhat")}
          className={`min-h-11 border-b-[3px] px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
            active === "moi-nhat" ? "border-cham-700 text-cham-700" : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          Sách mới
        </button>
        <button
          type="button"
          role="tab"
          id="tab-ban-chay"
          aria-selected={active === "ban-chay"}
          aria-controls="panel-sach-tab"
          onClick={() => setActive("ban-chay")}
          className={`min-h-11 border-b-[3px] px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
            active === "ban-chay" ? "border-cham-700 text-cham-700" : "border-transparent text-ink-600 hover:text-ink-900"
          }`}
        >
          Bán chạy
        </button>
      </div>

      {/*
        items-start: xem lý do đầy đủ trong comment của FeaturedBook — thẻ
        nổi bật giờ không còn chiếm trọn hàng ở lg/2xl (chỉ col-span-3), nên
        1 thẻ thường có thể vô tình chung hàng với nó; items-start ngăn
        grid kéo dãn thẻ thường đó theo chiều cao thẻ nổi bật.
      */}
      <div
        id="panel-sach-tab"
        role="tabpanel"
        aria-labelledby={active === "moi-nhat" ? "tab-moi-nhat" : "tab-ban-chay"}
        className="mt-6 grid grid-cols-2 items-start gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
      >
        {books.length === 0 ? (
          <p className="col-span-full text-ink-600">NA Books chưa có sách nào ở mục này. Ghé lại sau nhé.</p>
        ) : (
          <>
            <FeaturedBook book={firstBook} extra={featuredExtras[firstBook.slug]} />
            {restBooks.map((book) => (
              <BookCard key={book.slug} book={book} />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

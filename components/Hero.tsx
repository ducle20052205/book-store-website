import Link from "next/link";
import type { CSSProperties } from "react";
import { BookCover } from "@/components/BookCover";
import type { FeaturedCollection } from "@/lib/queries";

/** CSS custom property "--intro-delay" không có trong kiểu CSSProperties của React. */
type IntroDelayStyle = CSSProperties & { "--intro-delay"?: string };

/* C.2 mục 1: 4 bìa xếp chồng hơi lệch nhau thay vì xếp hàng đều — lệch
   theo cả xoay nhẹ (rotate) lẫn cao độ (translate-y), z-index giảm dần từ
   trái sang phải để bìa sau chồng đúng lên bìa trước. */
const HERO_STACK_OFFSETS = [
  "z-40 rotate-[-4deg]",
  "z-30 translate-y-3 rotate-[3deg]",
  "z-20 rotate-[-2deg]",
  "z-10 translate-y-4 rotate-[2deg]",
];

const HERO_INTRO_SEEN_KEY = "na-hero-intro-seen";

/*
 * E2 mục 1: khoảnh khắc mở trang duy nhất, chỉ ở Hero trang chủ. Script nội
 * tuyến (không phải useEffect) vì phải chạy TRƯỚC lần vẽ đầu tiên của
 * trình duyệt — cùng kỹ thuật chống nháy vẫn dùng để tránh FOUC dark-mode:
 * nếu dùng useEffect, trình duyệt đã vẽ xong trạng thái "hiện đủ" (mặc định
 * — xem lý do ở comment .hero-intro-el trong globals.css), rồi mới bị JS
 * bắt ẩn lại để chạy hoạt ảnh từ đầu, tạo một khung hình nháy trước khi
 * chạy. Script chạy đồng bộ, chặn parser tới khi xong, nên khi trình duyệt
 * vẽ frame đầu tiên thì thuộc tính đã có sẵn trên DOM.
 *
 * Không có JS (script không chạy) hoặc đã xem trong phiên này (sessionStorage
 * đã có cờ) -> section không có data-hero-intro="pending" -> mọi phần tử
 * .hero-intro-el ở trạng thái mặc định (opacity 1, xem globals.css) -> nội
 * dung hiện đủ ngay, không phụ thuộc JS chạy được hay không.
 */
const heroIntroScript = `try{if(!sessionStorage.getItem(${JSON.stringify(HERO_INTRO_SEEN_KEY)})){document.currentScript.parentElement.setAttribute('data-hero-intro','pending');sessionStorage.setItem(${JSON.stringify(HERO_INTRO_SEEN_KEY)},'1')}}catch(e){}`;

/** Mục 5.2: không có tủ nào featured -> ẩn hero, không báo lỗi. */
export function Hero({ collection }: { collection: FeaturedCollection | null }) {
  if (!collection) return null;

  /*
   * suppressHydrationWarning: script nội tuyến bên dưới gắn thuộc tính
   * data-hero-intro TRỰC TIẾP vào DOM (ngoài tầm quản lý của React) trước
   * khi hydrate — React so khớp cây SSR với DOM thật lúc hydrate và luôn
   * thấy lệch ở đúng thuộc tính này, dù đây là lệch CHỦ Ý (kỹ thuật chống
   * nháy FOUC, không có JS thì thuộc tính không bao giờ được gắn). Không
   * suppress thì console luôn có 1 cảnh báo hydration mismatch giả.
   */
  return (
    <section className="bg-cham-700" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: heroIntroScript }} />
      {/*
        Đợt F [F2.5]: min-h-[420px] trên desktop (chưa có ràng buộc chiều
        cao nào trước đây — hero cao/thấp hoàn toàn theo nội dung). Giữ
        md:items-center để nội dung căn giữa dọc trong khoảng cao mới.
      */}
      <div className="container-page flex flex-col gap-8 pt-10 pb-8 md:min-h-[420px] md:flex-row md:items-center">
        <div className="flex-1 space-y-4">
          {/*
            E1 [Điều chỉnh sau duyệt]: bỏ nhãn "Tuyển chọn" phía trên tiêu
            đề — đúng khuôn mẫu "nhãn nhỏ trên tiêu đề lớn" mà đợt E liệt kê
            là dấu hiệu mặc định. Định vị "tuyển chọn" đã có trong
            collection.description ngay bên dưới, không cần nhắc lại bằng
            một nhãn riêng.
          */}
          <h1
            className="hero-intro-el font-serif text-display font-semibold text-white"
            style={{ "--intro-delay": "0ms" } as IntroDelayStyle}
          >
            {collection.title}
          </h1>
          <p
            className="hero-intro-el line-clamp-2 max-w-[68ch] text-body text-white/80"
            style={{ "--intro-delay": "60ms" } as IntroDelayStyle}
          >
            {collection.description}
          </p>
          <Link
            href={`/tu-sach/${collection.slug}`}
            className="hero-intro-el pressable inline-flex min-h-11 items-center justify-center rounded-control bg-white px-5 text-button font-medium text-cham-700 hover:bg-cham-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-700 focus-visible:ring-offset-2"
            style={{ "--intro-delay": "120ms" } as IntroDelayStyle}
          >
            Xem tủ sách
          </Link>
        </div>

        {/*
          Đợt F [F2.5]: cụm bìa trước đây dừng ở md:w-28 (112px) tại mọi
          màn hình từ md trở lên — trên màn rộng (>=1536px, khi cột chữ bên
          trái đã có nhiều chỗ hơn) cụm bìa vẫn nhỏ y hệt, để trống quá
          nhiều bên phải so với cột chữ. Bỏ md:flex-1 (từng khiến cụm bìa
          CÙNG co giãn chia đều với cột chữ nhưng bản thân bìa vẫn nhỏ, chỉ
          tạo khoảng trống rỗng trong chính cột đó) — giờ cụm bìa rộng bằng
          đúng nội dung của nó (shrink-0, không flex-1), phóng to dần qua
          lg/xl/2xl để tự lấp khoảng trống thay vì để flexbox chia cột rỗng.
        */}
        {collection.books.length > 0 && (
          <div className="flex items-end justify-center -space-x-8 md:justify-end">
            {collection.books.slice(0, 4).map((book, i) => (
              <div
                key={book.slug}
                className={`hero-intro-el w-20 shrink-0 transition-transform sm:w-24 md:w-28 lg:w-32 xl:w-40 2xl:w-48 ${HERO_STACK_OFFSETS[i % HERO_STACK_OFFSETS.length]}`}
                style={{ "--intro-delay": `${180 + i * 40}ms` } as IntroDelayStyle}
              >
                <BookCover
                  slug={book.slug}
                  title={book.title}
                  author={book.author}
                  coverImageUrl={book.coverImageUrl}
                  className="shadow-md"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

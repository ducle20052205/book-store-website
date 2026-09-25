import Link from "next/link";
import { BookCover } from "@/components/BookCover";
import type { FeaturedCollection } from "@/lib/queries";

/* C.2 mục 1: 4 bìa xếp chồng hơi lệch nhau thay vì xếp hàng đều — lệch
   theo cả xoay nhẹ (rotate) lẫn cao độ (translate-y), z-index giảm dần từ
   trái sang phải để bìa sau chồng đúng lên bìa trước. */
const HERO_STACK_OFFSETS = [
  "z-40 rotate-[-4deg]",
  "z-30 translate-y-3 rotate-[3deg]",
  "z-20 rotate-[-2deg]",
  "z-10 translate-y-4 rotate-[2deg]",
];

/** Mục 5.2: không có tủ nào featured -> ẩn hero, không báo lỗi. */
export function Hero({ collection }: { collection: FeaturedCollection | null }) {
  if (!collection) return null;

  return (
    <section className="bg-cham-700">
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
          <h1 className="font-serif text-display font-semibold text-white">{collection.title}</h1>
          <p className="line-clamp-2 max-w-[68ch] text-body text-white/80">{collection.description}</p>
          <Link
            href={`/tu-sach/${collection.slug}`}
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-white px-5 text-button font-medium text-cham-700 hover:bg-cham-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-700 focus-visible:ring-offset-2"
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
                className={`w-20 shrink-0 transition-transform sm:w-24 md:w-28 lg:w-32 xl:w-40 2xl:w-48 ${HERO_STACK_OFFSETS[i % HERO_STACK_OFFSETS.length]}`}
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

import Link from "next/link";
import { getCategoryTree, getCollections } from "@/lib/queries";

const GITHUB_REPO_URL = "https://github.com/ducle20052205/book-store-website";

/*
 * NFR-6.2: vùng chạm tối thiểu 44px trên mobile — text-sm có line-height
 * 20px (mặc định Tailwind), py-3 (12px trên + 12px dưới) cộng thêm 24px
 * thành đúng 44px, không đổi cỡ chữ. block để padding dọc thật sự tính
 * vào vùng bấm (padding trên phần tử inline không đảm bảo điều này ở mọi
 * trình duyệt).
 *
 * D: nền footer đổi sang ink-900 — link dùng cham-50 (sắc xanh rất nhạt,
 * vẫn là màu có sẵn trong bảng, không phải trắng thuần) để phân biệt với
 * chữ thường (trắng mờ, xem các đoạn text bên dưới), sáng hẳn lên thành
 * trắng khi hover. Ring focus đổi sang trắng vì cham-600 gốc không đủ
 * tương phản trên nền ink-900.
 */
const linkClass =
  "block rounded-control py-3 text-cham-50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

/**
 * C.1: footer 4 cột (mobile xếp dọc) — trước đó chỉ có 1 dòng ghi chú dữ
 * liệu minh hoạ. Tự lấy category/collection giống Header, không cần
 * layout.tsx truyền props xuống.
 */
export async function Footer() {
  const [categories, collections] = await Promise.all([getCategoryTree(), getCollections()]);

  return (
    <footer className="mt-auto bg-ink-900">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-serif text-lg font-semibold text-white">NA Books</p>
            <p className="mt-3 max-w-[68ch] text-sm text-white/70">
              NA Books là nhà sách tuyển chọn dành cho người đọc 18–30 tuổi. Mỗi cuốn sách xuất hiện ở đây đều có lý
              do, không phải xếp ngẫu nhiên.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-white/90">Danh mục</h2>
            <ul className="mt-1 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/sach?category=${category.slug}`} className={linkClass}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-white/90">Tủ sách</h2>
            {collections.length === 0 ? (
              <p className="mt-3 text-sm text-white/70">Chưa có tủ sách nào.</p>
            ) : (
              <ul className="mt-1 text-sm">
                {collections.map((collection) => (
                  <li key={collection.id}>
                    <Link href={`/tu-sach/${collection.slug}`} className={linkClass}>
                      {collection.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-xs font-semibold text-white/90">Về dự án</h2>
            <p className="mt-3 max-w-[68ch] text-sm text-white/70">
              Đây là dự án portfolio cá nhân, phi thương mại — xây dựng để luyện tập đặc tả yêu cầu và phát triển sản
              phẩm.
            </p>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-medium ${linkClass}`}
            >
              Xem mã nguồn trên GitHub
            </a>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-sm text-white/70">
          Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio.
        </p>
      </div>
    </footer>
  );
}

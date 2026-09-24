import Link from "next/link";
import { getCategoryTree, getCollections } from "@/lib/queries";

const GITHUB_REPO_URL = "https://github.com/ducle20052205/book-store-website";

const linkClass =
  "rounded-control text-ink-600 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600";

/**
 * C.1: footer 4 cột (mobile xếp dọc) — trước đó chỉ có 1 dòng ghi chú dữ
 * liệu minh hoạ. Tự lấy category/collection giống Header, không cần
 * layout.tsx truyền props xuống.
 */
export async function Footer() {
  const [categories, collections] = await Promise.all([getCategoryTree(), getCollections()]);

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-serif text-lg font-semibold text-cham-700">NA Books</p>
            <p className="mt-3 max-w-prose text-sm text-ink-600">
              NA Books là nhà sách tuyển chọn dành cho người đọc 18–30 tuổi. Mỗi cuốn sách xuất hiện ở đây đều có lý
              do, không phải xếp ngẫu nhiên.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wide text-ink-900 uppercase">Danh mục</h2>
            <ul className="mt-3 space-y-2 text-sm">
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
            <h2 className="text-xs font-semibold tracking-wide text-ink-900 uppercase">Tủ sách</h2>
            {collections.length === 0 ? (
              <p className="mt-3 text-sm text-ink-600">Chưa có tủ sách nào.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
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
            <h2 className="text-xs font-semibold tracking-wide text-ink-900 uppercase">Về dự án</h2>
            <p className="mt-3 text-sm text-ink-600">
              Đây là dự án portfolio cá nhân, phi thương mại — xây dựng để luyện tập đặc tả yêu cầu và phát triển sản
              phẩm.
            </p>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 inline-block text-sm font-medium ${linkClass}`}
            >
              Xem mã nguồn trên GitHub ↗
            </a>
          </div>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-sm text-ink-600">
          Dữ liệu sách chỉ nhằm minh họa cho dự án portfolio.
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Hero } from "@/components/Hero";
import { HomeTabs } from "@/components/HomeTabs";
import { getBestsellingBooks, getCollections, getFeaturedCollection, getNewestBooks } from "@/lib/queries";

// Trang không dùng API động (cookies/headers/searchParams) nên Next.js sẽ
// static hoá và đóng băng dữ liệu Supabase lúc build nếu không có dòng này.
export const revalidate = 60;

export default async function Home() {
  const [featured, newest, bestselling, collections] = await Promise.all([
    getFeaturedCollection(),
    getNewestBooks(8),
    getBestsellingBooks(8),
    getCollections(),
  ]);

  return (
    <div>
      <Hero collection={featured} />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <HomeTabs newest={newest} bestselling={bestselling} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl text-ink-900">Tủ sách tuyển chọn</h2>
          <Link
            href="/tu-sach"
            className="rounded-control text-sm font-medium text-cham-700 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
          >
            Xem tất cả →
          </Link>
        </div>

        {collections.length === 0 ? (
          <p className="mt-6 text-ink-600">NA Books chưa có tủ sách nào để giới thiệu. Ghé lại sau nhé.</p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                href={`/tu-sach/${collection.slug}`}
                className="block rounded-card border border-line bg-surface p-5 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
              >
                <h3 className="font-serif text-lg font-semibold text-ink-900">{collection.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-600">{collection.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

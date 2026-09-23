import Link from "next/link";
import type { Metadata } from "next";
import { getCollections } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Tủ sách tuyển chọn — NA Books",
};

export const revalidate = 60;

export default async function TuSachPage() {
  const collections = await getCollections();

  return (
    <div className="container-page py-12">
      <h1 className="font-serif text-h1 text-ink-900">Tủ sách tuyển chọn</h1>
      <p className="mt-3 max-w-prose text-body text-ink-600">
        Những tủ sách NA Books gợi ý theo từng chủ đề — mỗi cuốn có mặt trong tủ đều có lý do.
      </p>

      {collections.length === 0 ? (
        <p className="mt-8 text-ink-600">NA Books chưa có tủ sách nào để giới thiệu. Ghé lại sau nhé.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              href={`/tu-sach/${collection.slug}`}
              className="hover-lift block rounded-card border border-line bg-surface p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
            >
              <h2 className="font-serif text-lg font-semibold text-ink-900">{collection.title}</h2>
              <p className="mt-2 line-clamp-2 text-body-sm text-ink-600">{collection.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

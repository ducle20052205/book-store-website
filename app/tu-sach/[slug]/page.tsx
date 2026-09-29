import { notFound } from "next/navigation";
import { BookCard } from "@/components/BookCard";
import { EditorNoteConnector } from "@/components/EditorNoteConnector";
import { enrichBooksForCard, getBookCollectionRefMap, getCategoryNameMap, getCollectionBySlug } from "@/lib/queries";

export const revalidate = 60;

export default async function CollectionDetailPage({ params }: PageProps<"/tu-sach/[slug]">) {
  const { slug } = await params;
  const [collection, categoryNames, collectionRefs] = await Promise.all([
    getCollectionBySlug(slug),
    getCategoryNameMap(),
    getBookCollectionRefMap(),
  ]);

  if (!collection) notFound();

  // E3: mọi cuốn ở đây đều đã "trong tủ sách" (chính tủ đang xem) — vẫn
  // enrich đồng nhất với mọi nơi khác dùng BookCard thay vì đặc cách bỏ
  // qua, dữ liệu vẫn đúng thật dù có hơi lặp lại ngữ cảnh trang.
  const books = enrichBooksForCard(collection.books, categoryNames, collectionRefs);

  return (
    <div className="container-page py-12">
      <h1 className="font-serif text-h1 text-ink-900">{collection.title}</h1>
      <p className="mt-3 max-w-[68ch] text-body text-ink-600">{collection.description}</p>

      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {/*
          E1 mục 1 [Điều chỉnh sau duyệt]: chữ ký ở đây KHÔNG nghiêng —
          text-sm (14px) không đạt ngưỡng 18px của quy tắc nghiêng/đứng
          (mục 2 kế hoạch), giữ đúng cỡ phụ chú trong danh sách, không tự
          tăng cỡ chữ chỉ để hợp thức hoá nghiêng. Vẫn giữ xoay nhẹ + nét kẻ
          (≥768px) — 2 dấu hiệu chữ ký này không phụ thuộc cỡ chữ.
        */}
        {books.map((book) => (
          <div key={book.slug} className="relative">
            <BookCard book={book} />
            <div className="relative mt-3 pl-3">
              <EditorNoteConnector className="absolute -top-2 left-0 h-4 w-6 -rotate-[110deg] text-cham-700/40" />
              <p className="line-clamp-3 rotate-[-1deg] text-sm text-ink-600">{book.curatorNote}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

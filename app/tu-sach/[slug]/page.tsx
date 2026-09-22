import { notFound } from "next/navigation";
import { BookCard } from "@/components/BookCard";
import { getCollectionBySlug } from "@/lib/queries";

export const revalidate = 60;

export default async function CollectionDetailPage({ params }: PageProps<"/tu-sach/[slug]">) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) notFound();

  return (
    <div className="container-page py-12">
      <h1 className="font-serif text-3xl text-ink-900">{collection.title}</h1>
      <p className="mt-3 max-w-prose text-ink-600">{collection.description}</p>

      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {collection.books.map((book) => (
          <div key={book.slug}>
            <BookCard book={book} />
            <p className="mt-2 text-sm text-ink-600">{book.curatorNote}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

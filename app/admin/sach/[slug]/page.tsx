import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { BookDeleteSection } from "@/components/admin/BookDeleteSection";
import { BookForm } from "@/components/admin/BookForm";
import { ResultStrip } from "@/components/admin/ResultStrip";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle } from "@/components/PageTitle";
import { countCollectionsContaining, countOrdersContaining, getAdminBook } from "@/lib/admin/books";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getCategoryTree } from "@/lib/queries";
import { touchTargetClass } from "@/lib/ui/classes";

/**
 * /admin/sach/[slug] (đợt 5B, spec FR-5B.3): form sửa, cùng `BookForm` với trang thêm, điền sẵn từ database; bên
 * dưới là vùng xoá (FR-5B.5). Slug không có sách → `notFound()` (mã HTTP 200 trong <Suspense>, hạn chế đã biết,
 * spec 3B mục 7.1). Dữ liệu sách đọc thẳng từ database, không qua hàm `use cache`. Toàn bộ nằm SAU
 * `requireAdmin()` trong <Suspense> (FR-5A.1).
 *
 * Dải kết quả sau khi thêm/sửa do `?ket-qua=them|luu` mà action chuyển hướng tới; `key` của form đổi theo nó để form
 * dựng lại từ dữ liệu vừa lưu (kể cả khi slug đổi và URL đổi theo).
 */
export const metadata: Metadata = {
  title: "NA Books",
  robots: { index: false },
};

const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";

export default function AdminSachChiTietPage({ params, searchParams }: PageProps<"/admin/sach/[slug]">) {
  return (
    <div className={containerClass}>
      <Suspense fallback={<div aria-busy="true" className="min-h-48" />}>
        <EditBook params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function EditBook({ params, searchParams }: { params: PageProps<"/admin/sach/[slug]">["params"]; searchParams: PageProps<"/admin/sach/[slug]">["searchParams"] }) {
  const { slug: rawSlug } = await params;
  const sp = await searchParams;
  await requireAdmin(`/admin/sach/${rawSlug}`);

  const book = await getAdminBook(rawSlug);
  if (!book) notFound();

  const [tree, orders, collectionCount] = await Promise.all([getCategoryTree(), countOrdersContaining(book.id), countCollectionsContaining(book.id)]);
  const categories = tree.map((parent) => ({ id: parent.id, name: parent.name, children: parent.children.map((child) => ({ id: child.id, name: child.name })) }));
  const result = firstValue(sp["ket-qua"]);

  return (
    <>
      <AdminNav current="books" />
      {(result === "them" || result === "luu") && (
        <ResultStrip tone="ok" testId="admin-book-result">
          {result === "them" ? `Đã thêm “${book.title}”. Cuốn sách đã hiện trên cửa hàng.` : "Đã lưu thay đổi."}{" "}
          <Link href={`/sach/${encodeURIComponent(book.slug)}`} className={`${touchTargetClass} font-medium text-cham-700 underline`}>
            Xem trên cửa hàng
          </Link>
          {result === "them" && (
            <>
              {" "}
              <Link href="/admin/sach/moi" className={`${touchTargetClass} ml-4 font-medium text-cham-700 underline`}>
                Thêm cuốn khác
              </Link>
            </>
          )}
        </ResultStrip>
      )}
      <Breadcrumb items={[{ label: "Sách", href: "/admin/sach" }, { label: book.title }]} linkClassName={touchTargetClass} />
      <div className="mt-3">
        <PageTitle title="Sửa sách" />
      </div>
      <BookForm key={`${book.id}:${book.slug}:${result ?? ""}`} mode="edit" bookId={book.id} initial={book.input} categories={categories} />
      {orders && collectionCount !== null ? (
        <BookDeleteSection
          key={book.id}
          bookId={book.id}
          title={book.title}
          stockQuantity={book.stockQuantity}
          orderCount={orders.orderCount}
          cancelledCount={orders.cancelledCount}
          collectionCount={collectionCount}
        />
      ) : (
        <p role="alert" className="mt-6 text-body text-ink-600">
          Chúng mình chưa tải được thông tin để xoá sách lúc này, nên tạm ẩn nút xoá. Bạn thử tải lại trang sau ít phút nhé.
        </p>
      )}
    </>
  );
}

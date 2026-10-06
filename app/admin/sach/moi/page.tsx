import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { BookForm } from "@/components/admin/BookForm";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageTitle } from "@/components/PageTitle";
import { emptyBookInput } from "@/lib/admin/bookRules";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getCategoryTree } from "@/lib/queries";
import { touchTargetClass } from "@/lib/ui/classes";

/**
 * /admin/sach/moi (đợt 5B, spec FR-5B.2): form thêm sách, cùng `BookForm` với trang sửa. Lưu là đăng luôn, không
 * có bước nháp. Toàn bộ nằm SAU `requireAdmin()` trong <Suspense> (vỏ tĩnh không lộ chữ quản trị, FR-5A.1).
 * `/admin/sach/moi` là route tĩnh nên thắng route động `[slug]`: slug `moi` bị giữ chỗ (lib/admin/slug.ts).
 */
export const metadata: Metadata = {
  title: "NA Books",
  robots: { index: false },
};

const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";

export default function AdminSachMoiPage() {
  return (
    <div className={containerClass}>
      <Suspense fallback={<div aria-busy="true" className="min-h-48" />}>
        <NewBook />
      </Suspense>
    </div>
  );
}

async function NewBook() {
  await requireAdmin("/admin/sach/moi");
  const tree = await getCategoryTree();
  const categories = tree.map((parent) => ({ id: parent.id, name: parent.name, children: parent.children.map((child) => ({ id: child.id, name: child.name })) }));

  return (
    <>
      <AdminNav current="books" />
      <Breadcrumb items={[{ label: "Sách", href: "/admin/sach" }, { label: "Thêm sách" }]} linkClassName={touchTargetClass} />
      <div className="mt-3">
        <PageTitle title="Thêm sách" />
      </div>
      <BookForm mode="new" initial={emptyBookInput()} categories={categories} />
    </>
  );
}

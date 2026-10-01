import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { AuthSwitchLink } from "@/components/AuthSwitchLink";
import { BookCover } from "@/components/BookCover";
import { EditorNoteConnector } from "@/components/EditorNoteConnector";
import { LoginForm } from "@/components/LoginForm";
import { QuoteRuleIcon } from "@/components/AuthIcons";
import { getCollectionBySlug } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Đăng nhập — NA Books",
};

/** Tủ sách lấy làm hình minh hoạ ở cột editorial (mockup dang-nhap.png). Không có thì bỏ khối bìa, trang vẫn dùng được. */
const EDITORIAL_COLLECTION_SLUG = "van-hoc-nhat-cho-nguoi-moi-bat-dau";

/**
 * /dang-nhap (đợt 2B, spec mục 5). Trang prerender tĩnh: mọi thứ phụ thuộc
 * URL (`?next=`) hay phiên nằm trong Client Component, đọc lúc bấm nút.
 */
export default async function DangNhapPage() {
  const collection = await getCollectionBySlug(EDITORIAL_COLLECTION_SLUG);
  const cover = collection?.books[0] ?? null;

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle={
        <p className="flex flex-wrap items-center gap-x-1.5">
          Chưa có tài khoản? <AuthSwitchLink href="/dang-ky">Tạo tài khoản mới</AuthSwitchLink>
        </p>
      }
      editorial={
        <>
          {cover && (
            <div className="hidden items-start gap-4 md:flex">
              <BookCover
                slug={cover.slug}
                title={cover.title}
                author={cover.author}
                coverImageUrl={cover.coverImageUrl}
                sizes="92px"
                className="w-[92px] shrink-0"
              />
              <EditorNoteConnector className="mt-1 h-8 w-12 text-nghe-400" />
            </div>
          )}

          <div>
            <p className="font-serif text-lg italic leading-relaxed text-white md:text-xl">
              Chúng mình giữ lại giỏ hàng, địa chỉ và những cuốn bạn đang xem dở — để lần sau bạn không phải bắt đầu lại
              từ đầu.
            </p>
            <QuoteRuleIcon className="mt-3 h-3 w-16 text-nghe-400 md:hidden" />
            {collection && (
              <p className="mt-4 hidden text-meta text-white/80 md:block">
                Từ tủ sách{" "}
                <Link
                  href={`/tu-sach/${collection.slug}`}
                  className="inline-flex min-h-11 items-center font-medium text-nghe-400 underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {collection.title}
                </Link>{" "}
                · {collection.books.length} cuốn
              </p>
            )}
          </div>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Không tìm thấy trang — NA Books",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-serif text-5xl text-cham-700">404</p>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 sm:text-3xl">
        Trang bạn tìm không tồn tại.
      </h1>
      <p className="text-ink-600">Quay về trang chủ hoặc ghé tủ sách tuyển chọn nhé.</p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-control bg-cham-700 px-5 text-sm font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
        >
          Về trang chủ
        </Link>
        <Link
          href="/tu-sach"
          className="inline-flex min-h-11 items-center justify-center rounded-control border border-cham-700 px-5 text-sm font-medium text-cham-700 hover:bg-cham-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
        >
          Ghé tủ sách tuyển chọn
        </Link>
      </div>
    </div>
  );
}

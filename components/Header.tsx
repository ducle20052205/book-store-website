import Link from "next/link";
import { CategoryNav } from "@/components/CategoryNav";
import { HeaderShell } from "@/components/HeaderShell";
import { getCategoryTree } from "@/lib/queries";

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4.5 5.6 4c2.1-.3 4.1.8 6.4 3.3C14.3 4.8 16.3 3.7 18.4 4c3.3.5 5.1 3.8 3.6 7.2-2.5 4.7-10 9.3-10 9.3Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

const iconLinkClass =
  "flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-control px-2 text-ink-900 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600";

interface HeaderProps {
  cartCount?: number;
}

export async function Header({ cartCount = 0 }: HeaderProps) {
  const categories = await getCategoryTree();

  return (
    <HeaderShell
      topbar={
        <div className="header-topbar container-page flex flex-wrap items-center gap-4 border-b border-line py-3 md:flex-nowrap md:py-0">
          <Link
            href="/"
            className="order-1 shrink-0 rounded-control font-serif text-xl font-semibold text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
          >
            NA Books
          </Link>

          <form
            role="search"
            action="/sach"
            method="get"
            className="order-3 w-full md:order-2 md:w-auto md:min-w-0 md:flex-1"
          >
            <label htmlFor="site-search" className="sr-only">
              Tìm tên sách, tác giả
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                <SearchIcon />
              </span>
              <input
                id="site-search"
                name="q"
                type="search"
                placeholder="Tìm tên sách, tác giả…"
                className="w-full min-w-0 rounded-input border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
              />
            </div>
          </form>

          <nav
            aria-label="Tài khoản và giỏ hàng"
            className="order-2 ml-auto flex shrink-0 items-center gap-1 md:order-3 md:ml-0"
          >
            <Link href="/yeu-thich" aria-label="Yêu thích" className={iconLinkClass}>
              <HeartIcon />
              <span className="hidden text-sm sm:inline">Yêu thích</span>
            </Link>

            <Link href="/tai-khoan" aria-label="Tài khoản" className={iconLinkClass}>
              <UserIcon />
              <span className="hidden text-sm sm:inline">Tài khoản</span>
            </Link>

            <Link
              href="/gio-hang"
              aria-label={`Giỏ hàng${cartCount > 0 ? `, ${cartCount} sản phẩm` : ""}`}
              className={`relative ${iconLinkClass}`}
            >
              <BagIcon />
              <span className="hidden text-sm sm:inline">Giỏ hàng</span>
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-nghe-400 px-1 text-xs font-semibold leading-none text-ink-900"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      }
    >
      <CategoryNav categories={categories} />
    </HeaderShell>
  );
}

import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { CategoryNav } from "@/components/CategoryNav";
import { HeaderShell } from "@/components/HeaderShell";
import { BagIcon, SearchIcon, UserIcon } from "@/components/HeaderIcons";
import { navIconClass, navItemClass } from "@/components/headerStyles";
import { type CategoryNode, getCategoryTree } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export interface HeaderAccount {
  /** Họ tên; nếu hồ sơ chưa có thì dùng email làm tên hiển thị. */
  name: string;
  /** Email đăng nhập (từ auth.users); null khi đã dùng email làm tên để không hiện hai lần. */
  email: string | null;
}

interface HeaderViewProps {
  categories: CategoryNode[];
  /** null = chưa đăng nhập. */
  account: HeaderAccount | null;
  cartCount?: number;
}

/**
 * Phần hiển thị của header, tách khỏi việc lấy dữ liệu để dựng được cả hai trạng
 * thái (chưa đăng nhập / đã đăng nhập) chỉ từ props. Đợt 2A, mockup
 * docs/mockups/buoc-2/header-2a.html: nhóm liên kết bên phải chỉ còn ĐÚNG 2
 * mục — "Đăng nhập" hoặc "Tài khoản", và "Giỏ hàng" (đã gỡ mục "Yêu thích" vì
 * trang đó chưa tồn tại).
 */
export function HeaderView({ categories, account, cartCount = 0 }: HeaderViewProps) {
  return (
    <HeaderShell
      topbar={
        <div className="header-topbar container-page flex flex-wrap items-center gap-4 border-b border-line-warm py-3 md:flex-nowrap md:py-0">
          <Link
            href="/"
            className="order-1 flex min-h-11 shrink-0 items-center rounded-control font-serif text-xl font-semibold text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2"
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
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
                <SearchIcon className="h-4 w-4" />
              </span>
              {/* Cao 44px ở mobile (vùng chạm tối thiểu — NFR-6.2, tiêu chí 2A #15), 40px từ md
                  đúng bảng "Số đo bắt buộc" của mockup (đo ở 1280px). */}
              <input
                id="site-search"
                name="q"
                type="search"
                placeholder="Tìm tên sách, tác giả…"
                className="h-11 w-full min-w-0 rounded-field md:h-10 border border-line-warm bg-field pl-10 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
              />
            </div>
          </form>

          <nav
            aria-label="Tài khoản và giỏ hàng"
            className="order-2 ml-auto flex shrink-0 items-center gap-1 md:order-3 md:ml-0"
          >
            {account ? (
              <AccountMenu name={account.name} email={account.email} />
            ) : (
              <a href="/dang-nhap" aria-label="Đăng nhập" className={navItemClass}>
                <UserIcon className={navIconClass} />
                <span className="hidden sm:inline">Đăng nhập</span>
              </a>
            )}

            <Link
              href="/gio-hang"
              aria-label={`Giỏ hàng${cartCount > 0 ? `, ${cartCount} sản phẩm` : ""}`}
              className={`relative ${navItemClass}`}
            >
              <BagIcon className={navIconClass} />
              <span className="hidden sm:inline">Giỏ hàng</span>
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

interface HeaderProps {
  cartCount?: number;
}

/**
 * Server Component: đọc người dùng bằng client server rồi truyền trạng thái
 * xuống (spec đợt 2A mục 6). getUser() hỏi thẳng máy chủ Auth để xác thực
 * token, không chỉ đọc cookie.
 */
export async function Header({ cartCount = 0 }: HeaderProps) {
  const supabase = await createClient();
  const [categories, userResult] = await Promise.all([getCategoryTree(), supabase.auth.getUser()]);
  const user = userResult.data.user;

  let account: HeaderAccount | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const fullName = profile?.full_name?.trim();
    account = fullName
      ? { name: fullName, email: user.email ?? null }
      : { name: user.email ?? "Tài khoản của bạn", email: null };
  }

  return <HeaderView categories={categories} account={account} cartCount={cartCount} />;
}

import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AccountMenu } from "@/components/AccountMenu";
import { CategoryNav } from "@/components/CategoryNav";
import { HeaderShell } from "@/components/HeaderShell";
import { BagIcon, SearchIcon, UserIcon } from "@/components/HeaderIcons";
import { navAccountWidthClass, navIconClass, navItemClass } from "@/components/headerStyles";
import { type CategoryNode, getCategoryTree } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

interface HeaderViewProps {
  categories: CategoryNode[];
  /** Mục "Đăng nhập" hoặc menu "Tài khoản" — Header truyền vào một <Suspense>, xem bên dưới. */
  accountItem: ReactNode;
  cartCount?: number;
}

/** Mục "Đăng nhập" — vừa là trạng thái chưa đăng nhập thật, vừa là fallback trong lúc đọc phiên. */
function LoginLink() {
  return (
    <a href="/dang-nhap" aria-label="Đăng nhập" className={`${navItemClass} ${navAccountWidthClass}`}>
      <UserIcon className={navIconClass} />
      <span className="hidden sm:inline">Đăng nhập</span>
    </a>
  );
}

/**
 * Phần hiển thị của header, tách khỏi việc lấy dữ liệu để dựng được cả hai trạng
 * thái (chưa đăng nhập / đã đăng nhập) chỉ từ props. Đợt 2A, mockup
 * docs/mockups/buoc-2/header-2a.html: nhóm liên kết bên phải chỉ còn ĐÚNG 2
 * mục — "Đăng nhập" hoặc "Tài khoản", và "Giỏ hàng" (đã gỡ mục "Yêu thích" vì
 * trang đó chưa tồn tại).
 */
export function HeaderView({ categories, accountItem, cartCount = 0 }: HeaderViewProps) {
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
            {accountItem}

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

/**
 * Đọc phiên đăng nhập và dựng mục tài khoản. Đọc cookie nên PHẢI nằm sau
 * <Suspense> (Cache Components): phần này stream vào sau, không nằm trong
 * shell tĩnh.
 *
 * Đợt 2B (spec mục 4): dùng getClaims(), không dùng phương thức hỏi thẳng máy
 * chủ Auth như proxy.ts. Hai chỗ chịu mức rủi ro khác nhau nên cố ý không đồng
 * nhất: Header chỉ HIỂN THỊ (tên, email), nên chỉ cần chữ ký JWT hợp lệ —
 * getClaims() xác minh cục bộ bằng JWKS (khoá ES256 bất đối xứng), không tốn
 * round trip (~99 ms đo ở 2A). proxy.ts là hàng rào BẢO VỆ, cần phát hiện cả
 * token đã bị thu hồi, thứ mà chỉ kiểm chữ ký không thấy được — xem comment ở
 * lib/supabase/proxy.ts.
 *
 * Tên và email lấy thẳng từ claim (user_metadata.full_name, email), không truy
 * vấn `profiles`. Đánh đổi: JWT làm mới mỗi giờ nên tên có thể cũ tới lần làm
 * mới kế tiếp khi đợt 2D cho sửa họ tên.
 */
async function AccountItem() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return <LoginLink />;

  const rawName: unknown = claims.user_metadata?.full_name;
  const fullName = typeof rawName === "string" ? rawName.trim() : "";
  const email = typeof claims.email === "string" && claims.email.length > 0 ? claims.email : null;

  return fullName ? (
    <AccountMenu name={fullName} email={email} />
  ) : (
    <AccountMenu name={email ?? "Tài khoản của bạn"} email={null} />
  );
}

interface HeaderProps {
  cartCount?: number;
}

/**
 * Header của layout gốc (đợt 2A). Phần tĩnh — logo, ô tìm kiếm, thanh danh mục
 * (dữ liệu qua `use cache`) — prerender vào shell. Chỉ mục tài khoản phụ thuộc
 * phiên nên bọc riêng trong <Suspense> với fallback là trạng thái chưa đăng nhập:
 * layout gốc không đọc cookie ở tầng trên cùng nên các trang bên trong vẫn tĩnh
 * được. Người đã đăng nhập sẽ thấy "Đăng nhập" trong khoảnh khắc ngắn cho tới
 * khi phần streaming về, rồi đổi sang "Tài khoản".
 */
export async function Header({ cartCount = 0 }: HeaderProps) {
  const categories = await getCategoryTree();

  return (
    <HeaderView
      categories={categories}
      cartCount={cartCount}
      accountItem={
        <Suspense fallback={<LoginLink />}>
          <AccountItem />
        </Suspense>
      }
    />
  );
}

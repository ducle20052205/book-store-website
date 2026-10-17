import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AccountMenu } from "@/components/AccountMenu";
import { CategoryNav } from "@/components/CategoryNav";
import { HeaderShell } from "@/components/HeaderShell";
import { BagIcon, SearchIcon, UserIcon } from "@/components/HeaderIcons";
import {
  navAccountLabelClass,
  navAccountWidthClass,
  navFallbackClass,
  navIconClass,
  navItemClass,
} from "@/components/headerStyles";
import { LoginNavLink } from "@/components/LoginNavLink";
import { getCartCount } from "@/lib/cart/view";
import { type CategoryNode, getCategoryTree } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

interface HeaderViewProps {
  categories: CategoryNode[];
  /** Mục "Đăng nhập" hoặc menu "Tài khoản" — Header truyền vào một <Suspense>, xem bên dưới. */
  accountItem: ReactNode;
  /** Tên khả truy cập + badge số lượng của liên kết giỏ hàng — Header truyền vào một slot có <Suspense> RIÊNG, xem Header(). */
  cartSlot: ReactNode;
}

/** Mục "Đăng nhập" — CHỈ là trạng thái chưa đăng nhập thật (fallback là AccountFallback). */
function LoginLink() {
  return (
    <LoginNavLink className={`${navItemClass} ${navAccountWidthClass}`}>
      <UserIcon className={navIconClass} />
      <span className={navAccountLabelClass}>Đăng nhập</span>
    </LoginNavLink>
  );
}

/**
 * Fallback của <Suspense> ở mục tài khoản (đợt 2B.2). Trong lúc chưa đọc xong
 * phiên thì chưa biết người dùng đã đăng nhập hay chưa, nên không được nói gì:
 * chỉ có biểu tượng người (trang trí) và một ô chữ rỗng cùng kích thước với
 * trạng thái thật. Không phải liên kết, không focusable, không aria-live.
 */
function AccountFallback() {
  return (
    <div className={navFallbackClass}>
      <UserIcon className={navIconClass} />
      <span aria-hidden="true" className={navAccountLabelClass} />
    </div>
  );
}

/**
 * Phần hiển thị của header, tách khỏi việc lấy dữ liệu để dựng được cả hai trạng
 * thái (chưa đăng nhập / đã đăng nhập) chỉ từ props. Đợt 2A, mockup
 * docs/mockups/buoc-2/header-2a.html: nhóm liên kết bên phải chỉ còn ĐÚNG 2
 * mục — "Đăng nhập" hoặc "Tài khoản", và "Giỏ hàng" (đã gỡ mục "Yêu thích" vì
 * trang đó chưa tồn tại).
 */
export function HeaderView({ categories, accountItem, cartSlot }: HeaderViewProps) {
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

            {/*
              Liên kết giỏ hàng đứng NGOÀI boundary (không bị React thay node khi boundary ổn định, nên focus không mất và
              không có liên kết focusable nào bị dựng lại giữa chừng). Tên đến từ một span sr-only NẰM TRONG boundary qua
              aria-labelledby: một text run trong một phần tử, nên trình duyệt không có chỗ ghép để chèn dấu cách.
            */}
            <Link href="/gio-hang" aria-labelledby={CART_NAME_ID} className={`relative ${navItemClass}`}>
              <BagIcon className={navIconClass} />
              <span className="sr-only sm:not-sr-only">Giỏ hàng</span>
              {cartSlot}
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
 * Tên và email lấy thẳng từ claim (user_metadata.full_name, email). Đánh đổi:
 * JWT làm mới mỗi giờ nên tên có thể cũ tới lần làm mới kế tiếp khi đợt 2D cho
 * sửa họ tên.
 *
 * Đợt 6 (spec FR-D.8): `role` KHÔNG có trong claim, nên thêm MỘT truy vấn
 * `profiles.role` của chính người đó (RLS `profiles_select_own_or_admin`), chỉ chạy
 * cho người đã đăng nhập, để `AccountMenu` biết có hiện mục "Khu quản trị" không.
 * Lỗi đọc coi như không phải admin. Không dùng Custom Access Token Hook (spec mục 7.4).
 */
async function AccountItem() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return <LoginLink />;

  const rawName: unknown = claims.user_metadata?.full_name;
  const fullName = typeof rawName === "string" ? rawName.trim() : "";
  const email = typeof claims.email === "string" && claims.email.length > 0 ? claims.email : null;

  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", claims.sub).maybeSingle();
  const isAdmin = !error && profile?.role === "admin";

  return fullName ? (
    <AccountMenu name={fullName} email={email} isAdmin={isAdmin} />
  ) : (
    <AccountMenu name={email ?? "Tài khoản của bạn"} email={null} isAdmin={isAdmin} />
  );
}

const CART_NAME_ID = "header-cart-name";

/**
 * Tên khả truy cập và badge số lượng giỏ hàng (đợt 3A, FR-3A.4): render phía server từ cookie `na_cart` (khách) hoặc bảng
 * `cart_items` (đã đăng nhập), nên số trong HTML đầu đã đúng. Đọc cookie nên nằm sau <Suspense> RIÊNG, tách khỏi slot auth —
 * hai boundary độc lập. Giỏ rỗng thì không có badge.
 *
 * Đợt sửa accessibility (FR-A.2c, A11Y-09): tên đúng là "Giỏ hàng, N sản phẩm". Khoảng trắng JSX không phải nguyên nhân của
 * "Giỏ hàng , 2 sản phẩm": trình duyệt chèn dấu cách trước mọi hộp không phải inline thuần (phần tử sr-only là absolute, con
 * của flex container cũng bị khối hoá), nên ghép tên từ nhiều <span> không bao giờ ra đúng. Vì vậy cả chuỗi tên nằm trong MỘT
 * span (một text run) mà liên kết trỏ tới bằng aria-labelledby. Liên kết đứng ngoài boundary, nên người dùng bàn phím bấm Tab
 * trúng cửa sổ streaming không mất focus (React không thay node liên kết). `count` = 0 khi chưa biết (fallback) hoặc giỏ rỗng:
 * tên chỉ là "Giỏ hàng", không badge. Chữ nhìn thấy "Giỏ hàng" (từ sm) vẫn là phần đầu của tên (WCAG 2.5.3).
 */
function CartSlot({ count }: { count: number }) {
  return (
    <>
      <span id={CART_NAME_ID} className="sr-only">
        {count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
      </span>
      {/* Phần tử bọc cố định 20×20px, KHÔNG chứa số khi chưa biết giỏ (fallback): thà chưa có thông tin còn hơn hiện "0"
          sai (nguyên tắc 2B.2). Tuyệt đối vị trí nên không đổi bố cục. */}
      <span
        data-testid="header-cart-count"
        className="pointer-events-none absolute -top-1 right-0 flex h-5 min-w-5 items-center justify-center"
      >
        {count > 0 && (
          <span
            aria-hidden="true"
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-nghe-400 px-1 text-xs font-semibold leading-none text-ink-900"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
    </>
  );
}

async function CartSlotLive() {
  return <CartSlot count={await getCartCount()} />;
}

/**
 * Header của layout gốc (đợt 2A). Phần tĩnh — logo, ô tìm kiếm, thanh danh mục
 * (dữ liệu qua `use cache`) — prerender vào shell. Chỉ mục tài khoản phụ thuộc
 * phiên nên bọc riêng trong <Suspense>: layout gốc không đọc cookie ở tầng trên
 * cùng nên các trang bên trong vẫn tĩnh được.
 *
 * Fallback KHÔNG nói trạng thái nào (đợt 2B.2): fallback "Đăng nhập" là thông
 * tin sai với người đã đăng nhập, và React chỉ lật boundary sau ≥300 ms nếu
 * nó xong sau khung vẽ đầu. Đánh đổi có chủ đích: khách chưa đăng nhập thấy ô
 * chữ rỗng trong khoảng chờ đó.
 *
 * Thuộc tính testid ở thẻ bọc dưới đánh dấu đúng một slot auth (dùng cho phép
 * đo, spec 2B.2 TC-0). Mobile dùng chung slot này, không có slot riêng.
 */
export async function Header() {
  const categories = await getCategoryTree();

  return (
    <HeaderView
      categories={categories}
      cartSlot={
        <Suspense fallback={<CartSlot count={0} />}>
          <CartSlotLive />
        </Suspense>
      }
      accountItem={
        <div data-testid="header-auth" className="flex">
          <Suspense fallback={<AccountFallback />}>
            <AccountItem />
          </Suspense>
        </div>
      }
    />
  );
}

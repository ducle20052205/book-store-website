import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { CategoryBars } from "@/components/admin/CategoryBars";
import { FunnelChart } from "@/components/admin/FunnelChart";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { EmptyState } from "@/components/EmptyState";
import { PageTitle } from "@/components/PageTitle";
import { formatVnd } from "@/components/Price";
import { getAdminDashboardStats, type DashboardStats } from "@/lib/admin/dashboard";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { cardClass, touchTargetClass } from "@/lib/ui/classes";

/**
 * /admin (đợt 6, spec FR-D.1 → FR-D.7): trang thống kê của khu quản trị — hàng KPI, doanh thu theo tháng, sách
 * bán chạy, phễu chuyển đổi. Khung giống hệt 5A/5B: container 1200px, `PageTitle`, `AdminNav`, mọi thứ nằm SAU
 * `requireAdmin()` bên trong <Suspense> với fallback là khối trống `aria-busy` không chữ, nên vỏ tĩnh KHÔNG lộ
 * chữ của giao diện quản trị (FR-5A.1, TC-D.3); `title` chung "NA Books" và `noindex`.
 *
 * Trang gọi RPC `admin_dashboard_stats()` ĐÚNG MỘT LẦN (NFR-D.4) và KHÔNG import hàm `"use cache"` nào của
 * `lib/queries.ts` (FR-D.7, TC-D.1): dashboard đọc qua cache sẽ hiện số trễ tới 60 giây sau mỗi lần ghi.
 */
export const metadata: Metadata = {
  title: "NA Books",
  robots: { index: false },
};

const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";
const sectionHeadingClass = "font-serif text-xl font-semibold text-ink-900";

export default function AdminStatsPage() {
  return (
    <div className={containerClass}>
      <Suspense fallback={<div aria-busy="true" className="min-h-[2370px] md:min-h-[2280px] lg:min-h-[1910px]" />}>
        <AdminStats />
      </Suspense>
    </div>
  );
}

async function AdminStats() {
  await requireAdmin("/admin");
  const stats = await getAdminDashboardStats();

  if (!stats) {
    return (
      <>
        <AdminNav />
        <PageTitle title="Thống kê" />
        <p role="alert" className="mt-6 text-body text-ink-600">
          Chúng mình chưa tải được số liệu lúc này. Bạn thử tải lại trang sau ít phút nhé.
        </p>
      </>
    );
  }

  if (stats.kpi.orders === 0 && stats.top_books.length === 0) {
    return (
      <>
        <AdminNav />
        <PageTitle title="Thống kê" />
        <EmptyState title="Chưa có số liệu để vẽ" actions={[{ href: "/admin/don-hang", label: "Xem đơn hàng", variant: "primary" }]}>
          Khi khách đặt đơn đầu tiên, doanh thu, sách bán chạy và phễu chuyển đổi sẽ xuất hiện ở đây.
        </EmptyState>
      </>
    );
  }

  return (
    <div data-testid="admin-stats">
      <AdminNav />
      <PageTitle title="Thống kê" />
      <Kpis kpi={stats.kpi} />

      <section className="mt-8">
        <h2 className={sectionHeadingClass}>Doanh thu theo tháng</h2>
        <div className="mt-4">
          <RevenueChart months={stats.revenue_by_month} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className={sectionHeadingClass}>Sách bán chạy</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopBooks books={stats.top_books} />
          <div>
            <h3 className="mb-3 text-body font-semibold text-ink-900">Số bản theo danh mục</h3>
            <CategoryBars categories={stats.category_sales} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className={sectionHeadingClass}>Phễu chuyển đổi</h2>
        <p className="mt-1 text-body-sm text-ink-600">Số lượt, không phải số phiên.</p>
        <div className="mt-4">
          <FunnelChart steps={stats.funnel.steps} />
        </div>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-body-sm text-ink-600">
          <div className="flex gap-2">
            <dt>Lượt đăng ký</dt>
            <dd data-testid="admin-funnel-sign-up" className="font-medium text-ink-900">
              {stats.funnel.sign_up}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt>Lượt đăng nhập</dt>
            <dd data-testid="admin-funnel-login" className="font-medium text-ink-900">
              {stats.funnel.login}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

/** Hàng KPI (FR-D.2): bốn ô, mỗi ô có nhãn, số lớn và MỘT dòng giải thích cách tính. Tiền bằng `formatVnd` có sẵn. */
function Kpis({ kpi }: { kpi: DashboardStats["kpi"] }) {
  const cells = [
    { label: "Doanh thu", value: formatVnd(kpi.revenue), note: "Tổng giá trị đơn, không tính đơn đã hủy." },
    { label: "Số đơn", value: String(kpi.orders), note: "Số đơn đã đặt, không tính đơn đã hủy." },
    { label: "Giá trị đơn trung bình", value: formatVnd(kpi.avg_order_value), note: "Doanh thu chia số đơn, làm tròn tới đồng." },
    { label: "Khách đã mua", value: String(kpi.customers), note: "Số khách có ít nhất một đơn, không tính đơn đã hủy." },
  ];
  return (
    <dl data-testid="admin-kpi" className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
      {cells.map((c) => (
        <div key={c.label} className={`${cardClass} p-6`}>
          <dt className="text-[12px] leading-4 text-ink-400">{c.label}</dt>
          <dd className="mt-2 text-[28px] font-semibold leading-tight text-ink-900">{c.value}</dd>
          <dd className="mt-2 text-[12px] leading-4 text-ink-400">{c.note}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Top 10 sách (FR-D.4): MỘT mặt phẳng trắng, dòng ngăn bằng kẻ 1px — không phải mỗi dòng một thẻ. */
function TopBooks({ books }: { books: DashboardStats["top_books"] }) {
  return (
    <div>
      <h3 className="mb-3 text-body font-semibold text-ink-900">Top {books.length} sách</h3>
      <ol data-testid="admin-top-books" className={`${cardClass} divide-y divide-menu-sep`}>
        {books.map((b) => (
          <li key={b.slug} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-2">
            <div className="min-w-0">
              <Link href={`/admin/sach/${b.slug}`} prefetch={false} className={`${touchTargetClass} max-w-full text-body-sm font-medium text-cham-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600`}>
                <span className="truncate">{b.title}</span>
              </Link>
              {b.category && <p className="-mt-1 truncate text-[12px] leading-4 text-ink-400">{b.category}</p>}
            </div>
            <div className="text-right">
              <p className="text-body-sm font-medium text-ink-900">{b.units} bản</p>
              <p className="text-[12px] leading-4 text-ink-400">{formatVnd(b.revenue)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

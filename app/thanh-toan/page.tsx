import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutView, type CheckoutInitial } from "@/components/checkout/CheckoutView";
import type { OrderLine } from "@/components/checkout/OrderLines";
import { getProvinces, getWardsOfProvince } from "@/lib/address";
import { getCartView } from "@/lib/cart/view";
import { getCartSession } from "@/lib/cart/session";
import { normalizePhone, PHONE_PATTERN } from "@/lib/checkoutRules";
import { CART_STOCK_NOTICE_HREF } from "@/lib/checkout/stockNotice";

/**
 * /thanh-toan (đợt 3B, spec FR-3B.5–3B.18): thay trang tạm của đợt 3A. Bố cục theo
 * docs/mockups/buoc-3/ (checkout.png, checkout-mobile.png).
 *
 * Phần phụ thuộc người dùng (giỏ, hồ sơ, form) render theo request, KHÔNG `use cache` ở bất kỳ
 * hàm nào đọc giỏ hay hồ sơ, và nằm sau <Suspense> (đọc cookie); tiêu đề trang nằm trong shell
 * như /gio-hang. Dữ liệu hành chính là công khai nên dùng được `use cache` (lib/address.ts).
 *
 * Bảo vệ hai lớp (FR-3B.6): proxy.ts chuyển sớm khách chưa đăng nhập; enforcement thật là kiểm
 * tra lại ở đây và RLS/`place_order` ở database.
 */
export const metadata: Metadata = {
  title: "Thanh toán — NA Books",
  robots: { index: false },
};

const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";

function PageTitle() {
  return (
    <div className="section-title">
      <h1 className="font-serif text-h1 text-ink-900">Thanh toán</h1>
    </div>
  );
}

export default function ThanhToanPage() {
  return (
    <div className={containerClass}>
      <Suspense
        fallback={
          <>
            <PageTitle />
            <div aria-busy="true" className="mt-6 min-h-48 rounded-menu border border-line-warm bg-surface" />
          </>
        }
      >
        <CheckoutContent />
      </Suspense>
    </div>
  );
}

async function CheckoutContent() {
  const { supabase, userId } = await getCartSession();
  if (!userId) redirect("/dang-nhap?next=%2Fthanh-toan");

  const view = await getCartView();
  // Giỏ trống: không hiện trang checkout rỗng (FR-3B.8).
  if (view.lines.length === 0) redirect("/gio-hang");
  // Có dòng vượt tồn kho hoặc đã hết hàng: về giỏ kèm banner; KHÔNG tự sửa số lượng (FR-3B.9).
  if (view.lines.some((line) => line.outOfStock || line.overStock)) redirect(CART_STOCK_NOTICE_HREF);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, province_code, ward_code, address_line")
    .eq("id", userId)
    .maybeSingle();
  const saved = profile as {
    full_name: string | null;
    phone: string | null;
    province_code: string | null;
    ward_code: string | null;
    address_line: string | null;
  } | null;

  const hasSavedAddress = Boolean(saved?.province_code && saved.ward_code && saved.address_line);
  const phone = normalizePhone(saved?.phone ?? "");

  const initial: CheckoutInitial = {
    recipientName: saved?.full_name ?? "",
    recipientPhone: PHONE_PATTERN.test(phone) ? phone : (saved?.phone ?? ""),
    provinceCode: hasSavedAddress ? (saved?.province_code ?? "") : "",
    wardCode: hasSavedAddress ? (saved?.ward_code ?? "") : "",
    addressLine: hasSavedAddress ? (saved?.address_line ?? "") : "",
    hasSavedAddress,
  };

  const [provinces, initialWards] = await Promise.all([
    getProvinces(),
    initial.provinceCode ? getWardsOfProvince(initial.provinceCode) : Promise.resolve([]),
  ]);

  const lines: OrderLine[] = view.lines.map((line) => ({
    id: line.book.id,
    slug: line.book.slug,
    title: line.book.title,
    author: line.book.author,
    coverImageUrl: line.book.coverImageUrl,
    quantity: line.billableQuantity,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
  }));

  return (
    <>
      <PageTitle />
      <CheckoutView
        lines={lines}
        totalQuantity={view.totalQuantity}
        total={view.subtotal}
        provinces={provinces}
        initialWards={initialWards}
        initial={initial}
      />
    </>
  );
}

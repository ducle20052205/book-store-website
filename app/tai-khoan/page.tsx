import type { Metadata } from "next";
import { Suspense } from "react";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";
import { PageTitle } from "@/components/PageTitle";
import { requireUser } from "@/lib/account/requireUser";
import { getProvinces, getWardsOfProvince } from "@/lib/address";
import { createClient } from "@/lib/supabase/server";
import { cardClass } from "@/lib/ui/classes";

/**
 * /tai-khoan (đợt 8, spec FR-A.4): trang hồ sơ, thay chuyển hướng tạm sang danh sách đơn của đợt 4. Khung của hệ layout
 * đóng băng như /tai-khoan/don-hang: container 1200px, `PageTitle`, thẻ `cardClass`. Phần đọc phiên và hồ sơ nằm sau
 * `requireUser()` bên trong <Suspense> (đọc cookie phải nằm trong Suspense — Cache Components); tiêu đề nằm trong shell.
 *
 * Dữ liệu của NGƯỜI DÙNG (hồ sơ, email) không bao giờ đi qua `"use cache"`: đọc theo từng request bằng client có phiên.
 * Chỉ danh sách tỉnh/phường là dữ liệu hành chính công khai, dùng lại hàm có cache của /thanh-toan (lib/address.ts).
 */
export const metadata: Metadata = {
  title: "Hồ sơ của bạn — NA Books",
  robots: { index: false },
};

const containerClass = "mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 md:py-10 lg:px-10";

export default function TaiKhoanPage() {
  return (
    <div className={containerClass}>
      <Suspense
        fallback={
          <>
            <PageTitle title="Hồ sơ của bạn" />
            <div aria-busy="true" className={`${cardClass} mt-6 min-h-48`} />
          </>
        }
      >
        <ProfileContent />
      </Suspense>
    </div>
  );
}

async function ProfileContent() {
  const user = await requireUser("/tai-khoan");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, province_code, ward_code, address_line")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <>
        <PageTitle title="Hồ sơ của bạn" />
        <p role="alert" className="mt-6 text-body text-ink-600">
          Chúng mình chưa tải được hồ sơ lúc này. Bạn thử tải lại trang sau ít phút nhé.
        </p>
      </>
    );
  }

  const profile = data as {
    full_name: string | null;
    phone: string | null;
    province_code: string | null;
    ward_code: string | null;
    address_line: string | null;
  } | null;

  // Ba trường địa chỉ phải đi cùng nhau (MATCH FULL): thiếu một thì coi như chưa có địa chỉ, để form không hiện nửa vời.
  const hasAddress = Boolean(profile?.province_code && profile.ward_code && profile.address_line);
  const initial = {
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: user.email ?? "",
    provinceCode: hasAddress ? (profile?.province_code ?? "") : "",
    wardCode: hasAddress ? (profile?.ward_code ?? "") : "",
    addressLine: hasAddress ? (profile?.address_line ?? "") : "",
  };

  const [provinces, initialWards] = await Promise.all([
    getProvinces(),
    initial.provinceCode ? getWardsOfProvince(initial.provinceCode) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageTitle title="Hồ sơ của bạn" />
      <ProfileForm initial={initial} provinces={provinces} initialWards={initialWards} />
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </>
  );
}

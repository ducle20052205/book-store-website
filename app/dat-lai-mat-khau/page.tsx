import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { QuoteRuleIcon } from "@/components/AuthIcons";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Đặt mật khẩu mới — NA Books",
  robots: { index: false },
};

/**
 * /dat-lai-mat-khau (đợt 8, FR-A.3): chỉ dùng được khi có phiên đặt lại do `/auth/callback` tạo. Vỏ tĩnh (tiêu đề, cột
 * editorial) không chứa ô nhập nào; ô nhập mật khẩu chỉ được dựng SAU khi kiểm phiên bên trong <Suspense> (đọc cookie
 * phải nằm trong Suspense — Cache Components). Không có phiên → `redirect()` về `/quen-mat-khau?loi=phien`. Vì
 * `redirect()` chạy trong Suspense, response là HTTP 200 kèm chỉ thị chuyển hướng trong luồng HTML (không phải 307);
 * proxy.ts không được sửa ở đợt này, nên không có chốt chặn sớm hơn.
 */
export default function DatLaiMatKhauPage() {
  return (
    <AuthShell
      title="Đặt mật khẩu mới"
      subtitle={<p>Chọn một mật khẩu mới cho tài khoản của bạn.</p>}
      editorial={
        <div>
          <p className="font-serif text-lg italic leading-relaxed text-white md:text-xl">
            Gần xong rồi. Đặt mật khẩu mới, rồi bạn quay lại với giỏ hàng và những đơn đã đặt.
          </p>
          <QuoteRuleIcon className="mt-3 h-3 w-16 text-nghe-400 md:hidden" />
        </div>
      }
    >
      <Suspense fallback={<div aria-busy="true" className="min-h-[170px]" />}>
        <ResetGate />
      </Suspense>
    </AuthShell>
  );
}

/** `getUser()` (hỏi Auth server), như proxy.ts: đây là hàng rào bảo vệ, không phải hiển thị. */
async function ResetGate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/quen-mat-khau?loi=phien");

  return <ResetPasswordForm />;
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { type UpdateOrderStatusResult, updateOrderStatus } from "@/app/actions/admin-orders";
import { AlertCircleIcon, CheckIcon } from "@/components/AuthIcons";
import { InlineConfirm } from "@/components/InlineConfirm";
import { ORDER_TRANSITIONS, type OrderStatus, isOrderStatus, orderStatusLabel } from "@/lib/orderStatus";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui/classes";

/**
 * Vùng đổi trạng thái của admin ở trang chi tiết đơn (đợt 5A, spec FR-5A.5).
 *
 * - Chỉ hiện các chuyển HỢP LỆ của trạng thái hiện tại (`ORDER_TRANSITIONS`); database mới là bên quyết định
 *   (trigger, FR-5A.6). Đơn ở trạng thái cuối thì hiện dòng nói rõ không đổi được nữa.
 * - Xác nhận NGAY TRONG TRANG cho MỌI lần đổi (`InlineConfirm`), không `confirm()` của trình duyệt (NFR-3.3):
 *   trigger không cho đi lùi nên bấm nhầm là không sửa được qua giao diện, bước xác nhận là thứ duy nhất chặn
 *   việc đó. Mỗi chuyển có lời nói rõ hậu quả của ĐÚNG chuyển đó. Focus vào vùng khi mở; Escape hoặc "Không"
 *   thì thoát, trả focus về nút đã bấm, không có gì đổi. Vùng không tự biến mất.
 * - Kết quả là DẢI TRONG TRANG không tự tắt (WCAG 2.2.1), không phải Toast. Dải còn nguyên sau khi trang làm
 *   mới (`refresh()` trong action), nên component này KHÔNG bị gỡ khi `status` đổi; chỉ bộ nút đổi theo
 *   trạng thái mới. Sau khi có kết quả focus chuyển vào dải (nút vừa bấm có thể đã biến mất).
 */
function confirmCopy(from: string, to: OrderStatus): { title: string; body: string; confirmLabel: string } {
  const fromLabel = orderStatusLabel(from);
  const toLabel = orderStatusLabel(to);
  if (to === "cancelled") {
    return {
      title: "Hủy đơn này?",
      body: `Đơn sẽ chuyển sang “${toLabel}” và không quay về “${fromLabel}” được nữa. Sách trong đơn được trả lại kho, và đơn đã hủy không mở lại được.`,
      confirmLabel: "Xác nhận hủy",
    };
  }
  const base = `Đơn sẽ chuyển sang “${toLabel}” và không quay về “${fromLabel}” được nữa.`;
  return {
    title: `Chuyển đơn sang “${toLabel}”?`,
    body: to === "completed" ? `${base} Đây là trạng thái cuối: sau đó đơn không đổi được nữa.` : base,
    confirmLabel: "Xác nhận chuyển",
  };
}

function describeResult(result: UpdateOrderStatusResult, orderCode: string): { tone: "ok" | "problem"; text: string; signInHref?: string } {
  if (result.ok) {
    const label = orderStatusLabel(result.to);
    return {
      tone: "ok",
      text: result.to === "cancelled" ? `Đã chuyển đơn ${orderCode} sang “${label}”. Sách trong đơn đã được trả lại kho.` : `Đã chuyển đơn ${orderCode} sang “${label}”.`,
    };
  }
  switch (result.kind) {
    case "already":
      return { tone: "ok", text: `Đơn này đã ở trạng thái “${orderStatusLabel(result.status)}” rồi.` };
    case "stale":
      return {
        tone: "problem",
        text: `Đơn này vừa chuyển sang “${orderStatusLabel(result.status)}” (có thể do người khác vừa đổi) nên chưa đổi theo lựa chọn của bạn. Trang đã cập nhật theo trạng thái mới.`,
      };
    case "invalid_transition":
      return {
        tone: "problem",
        text: "Chuyển này không hợp lệ: đơn chỉ đi tiếp theo thứ tự Chờ xử lý, Đang xử lý, Đang giao, Hoàn tất, hoặc bị hủy trước khi hoàn tất, và không đi lùi được.",
      };
    case "not_found":
      return { tone: "problem", text: "Chúng mình không tìm thấy đơn này." };
    case "signed_out":
      return {
        tone: "problem",
        text: "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại để đổi trạng thái nhé.",
        signInHref: `/dang-nhap?next=${encodeURIComponent(`/admin/don-hang/${orderCode}`)}`,
      };
    case "forbidden":
      return { tone: "problem", text: "Tài khoản này không có quyền quản trị đơn hàng." };
    default:
      return { tone: "problem", text: "Chúng mình chưa xác nhận được việc đổi trạng thái. Bạn tải lại trang để xem trạng thái hiện tại nhé." };
  }
}

export function OrderStatusControl({ orderCode, status }: { orderCode: string; status: string }) {
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [result, setResult] = useState<UpdateOrderStatusResult | null>(null);
  const [pending, startTransition] = useTransition();
  const triggerRefs = useRef<Partial<Record<OrderStatus, HTMLButtonElement | null>>>({});
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  const transitions = isOrderStatus(status) ? ORDER_TRANSITIONS[status] : [];
  // Trạng thái đổi dưới chân người dùng (làm mới trang sau thao tác của người khác): vùng xác nhận của một
  // chuyển không còn hợp lệ thì biến mất, không để lại một lời mời cũ.
  const activeTarget = target && transitions.includes(target) ? target : null;

  function closeConfirm() {
    const closing = activeTarget;
    setTarget(null);
    if (closing) triggerRefs.current[closing]?.focus();
  }

  function confirmChange() {
    if (!activeTarget) return;
    const to = activeTarget;
    startTransition(async () => {
      let outcome: UpdateOrderStatusResult;
      try {
        outcome = await updateOrderStatus(orderCode, status, to);
      } catch {
        outcome = { ok: false, kind: "unknown" };
      }
      setResult(outcome);
      setTarget(null);
    });
  }

  const described = result ? describeResult(result, orderCode) : null;
  const copy = activeTarget ? confirmCopy(status, activeTarget) : null;

  return (
    <section aria-label="Đổi trạng thái đơn" data-testid="admin-status-control" className="mt-6">
      {described && (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          data-testid="admin-status-result"
          className={`mb-4 flex items-start gap-3 rounded-notice border-l-[3px] pl-4 text-body-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
            described.tone === "ok" ? "border-success bg-success-tint" : "border-danger bg-danger-tint"
          }`}
        >
          {described.tone === "ok" ? (
            <CheckIcon className="mt-[14px] h-[18px] w-[18px] shrink-0 text-success" />
          ) : (
            <AlertCircleIcon className="mt-[14px] h-[18px] w-[18px] shrink-0 text-danger" />
          )}
          <p className="flex-1 py-3 pr-4">
            {described.text}
            {described.signInHref && (
              <>
                {" "}
                <Link href={described.signInHref} className="font-medium text-cham-700 underline">
                  Đăng nhập lại
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      {transitions.length === 0 ? (
        <p data-testid="admin-status-final" className="text-body-sm text-ink-600">
          Đơn đang ở trạng thái “{orderStatusLabel(status)}”, là trạng thái cuối nên không đổi được nữa.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {transitions.map((to) => (
              <button
                key={to}
                ref={(el) => {
                  triggerRefs.current[to] = el;
                }}
                type="button"
                data-testid="admin-status-action"
                data-to={to}
                disabled={pending}
                aria-expanded={activeTarget === to}
                aria-controls={activeTarget === to ? "admin-status-confirm" : undefined}
                onClick={() => setTarget(to)}
                className={to === "cancelled" ? `${secondaryButtonClass} w-full md:w-auto` : `${primaryButtonClass} md:!w-auto`}
              >
                {to === "cancelled" ? "Hủy đơn hàng" : `Chuyển sang “${orderStatusLabel(to)}”`}
              </button>
            ))}
          </div>
          <p className="mt-3 text-body-sm text-ink-600">Đổi trạng thái không quay lại được, nên chúng mình sẽ hỏi lại trước khi đổi.</p>

          {activeTarget && copy && (
            <InlineConfirm
              key={activeTarget}
              id="admin-status-confirm"
              testId="admin-status-confirm"
              title={copy.title}
              confirmLabel={copy.confirmLabel}
              pending={pending}
              onConfirm={confirmChange}
              onClose={closeConfirm}
            >
              {copy.body}
            </InlineConfirm>
          )}
        </>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { cancelOrder, type CancelOrderResult } from "@/app/actions/orders";
import { AlertCircleIcon, CheckIcon } from "@/components/AuthIcons";
import { InlineConfirm } from "@/components/InlineConfirm";
import { orderStatusLabel } from "@/lib/orderStatus";
import { secondaryButtonClass } from "@/lib/ui/classes";

/**
 * Hủy đơn ngay trong trang chi tiết (đợt 4, spec FR-B4.4).
 *
 * - Xác nhận NGAY TRONG TRANG, không dùng `confirm()` của trình duyệt (NFR-3.3). Vùng xác nhận (`InlineConfirm`,
 *   dùng chung với trang quản trị từ đợt 5A) nói rõ hậu quả; focus chuyển vào đó khi mở; Escape hoặc nút "Không" thì thoát và trả focus về nút "Hủy đơn hàng".
 *   Không phải hộp thoại modal: nền phía sau không bị khoá. Vùng không tự biến mất.
 * - Kết quả là DẢI TRONG TRANG không tự tắt (WCAG 2.2.1), không phải Toast: có thông tin người dùng cần đọc
 *   kỹ. Dải phải còn nguyên sau khi trang làm mới (`refresh()` trong action đổi `status` sang `cancelled`),
 *   nên component này KHÔNG bị gỡ khi `status` rời `pending`; chỉ nút hủy biến mất. Sau khi hủy xong focus
 *   chuyển vào dải vì nút đã không còn.
 * - Nút bị vô hiệu trong lúc gửi; bấm đúp không tạo hai lời gọi, và nếu có thì database chặn lời gọi thứ hai.
 * - Câu lỗi nói thật: lời gọi hết hạn có thể đã chạy xong ở database nên không viết "đơn vẫn như cũ".
 */
type Phase = "idle" | "confirming";

function describeResult(result: CancelOrderResult, orderCode: string): { tone: "ok" | "problem"; text: string; signInHref?: string } {
  if (result.ok) {
    return { tone: "ok", text: `Chúng mình đã hủy đơn ${orderCode}. Sách trong đơn đã được trả lại kho.` };
  }
  switch (result.kind) {
    case "already_cancelled":
      return { tone: "ok", text: "Đơn này đã được hủy từ trước." };
    case "not_pending":
      return { tone: "problem", text: `Đơn này đã chuyển sang “${orderStatusLabel(result.status)}” nên chúng mình không hủy được nữa.` };
    case "not_found":
      return { tone: "problem", text: "Chúng mình không tìm thấy đơn này." };
    case "signed_out":
      return {
        tone: "problem",
        text: "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại để hủy đơn nhé.",
        signInHref: `/dang-nhap?next=${encodeURIComponent(`/tai-khoan/don-hang/${orderCode}`)}`,
      };
    default:
      return { tone: "problem", text: "Chúng mình chưa xác nhận được việc hủy đơn. Bạn tải lại trang để xem trạng thái hiện tại nhé." };
  }
}

export function CancelOrder({ orderCode, status }: { orderCode: string; status: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<CancelOrderResult | null>(null);
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function closeConfirm() {
    setPhase("idle");
    triggerRef.current?.focus();
  }

  function confirmCancel() {
    startTransition(async () => {
      let outcome: CancelOrderResult;
      try {
        outcome = await cancelOrder(orderCode);
      } catch {
        outcome = { ok: false, kind: "unknown" };
      }
      setResult(outcome);
      setPhase("idle");
    });
  }

  const described = result ? describeResult(result, orderCode) : null;
  const canCancel = status === "pending" && result === null;

  return (
    <div className="mt-6">
      {described && (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          data-testid="order-cancel-result"
          className={`flex items-start gap-3 rounded-notice border-l-[3px] pl-4 text-body-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 ${
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

      {canCancel && (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <button
              ref={triggerRef}
              type="button"
              data-testid="order-cancel-trigger"
              aria-expanded={phase === "confirming"}
              aria-controls={phase === "confirming" ? "order-cancel-confirm" : undefined}
              onClick={() => setPhase("confirming")}
              className={`${secondaryButtonClass} w-full md:w-auto`}
            >
              Hủy đơn hàng
            </button>
            <p className="text-body-sm text-ink-600">Bạn chỉ hủy được khi đơn còn ở trạng thái “Chờ xử lý”.</p>
          </div>

          {phase === "confirming" && (
            <InlineConfirm
              id="order-cancel-confirm"
              testId="order-cancel-confirm"
              title="Hủy đơn này?"
              confirmLabel="Xác nhận hủy"
              pending={pending}
              onConfirm={confirmCancel}
              onClose={closeConfirm}
            >
              Đơn sẽ bị hủy và sách trong đơn được trả lại kho. Bạn không mở lại được đơn đã hủy; nếu vẫn muốn mua, bạn đặt đơn mới nhé.
            </InlineConfirm>
          )}
        </>
      )}

      {!canCancel && result === null && ["processing", "shipped", "completed"].includes(status) && (
        <p className="text-body-sm text-ink-600">Đơn đã sang bước tiếp theo nên không hủy được tại đây.</p>
      )}
    </div>
  );
}

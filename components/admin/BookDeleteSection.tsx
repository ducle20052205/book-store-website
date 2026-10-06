"use client";

import { useRef, useState, useTransition } from "react";
import { type DeleteBookResult, type StockZeroResult, deleteBook, setBookOutOfStock } from "@/app/actions/admin-books";
import { InlineConfirm } from "@/components/InlineConfirm";
import { isNextRedirect } from "@/lib/nextRedirect";
import { dangerButtonClass, secondaryButtonClass } from "@/lib/ui/classes";
import { ResultStrip } from "@/components/admin/ResultStrip";

/**
 * Vùng "Xoá sách" ở cuối trang sửa (đợt 5B, spec FR-5B.5), thẻ riêng dưới cùng, không cạnh nút Lưu.
 *
 * Hai trạng thái, do SỐ ĐƠN đọc ở server quyết định:
 * - Sách đã nằm trong BẤT KỲ `order_items` nào (kể cả đơn đã hủy): KHÔNG có nút xoá. Thông báo nêu số đơn và
 *   gợi ý đặt tồn kho về 0, kèm nút làm luôn việc đó. Nếu giữa lúc mở trang và lúc xác nhận có đơn mới (khoá ngoại
 *   của database chặn `DELETE`), kết quả của action cũng đưa về trạng thái này với số đơn mới.
 * - Sách chưa từng được đặt: xoá được, qua bước xác nhận NGAY TRONG TRANG (`InlineConfirm`, không `confirm()` của
 *   trình duyệt, NFR-3.3). Vùng xác nhận nói rõ hậu quả: biến mất khỏi cửa hàng, bị gỡ khỏi K tủ sách và khỏi giỏ
 *   hàng của khách nếu có ai đang giữ (không có số đếm giỏ: RLS không cho admin đếm).
 */
export function BookDeleteSection({
  bookId,
  title,
  stockQuantity,
  orderCount,
  cancelledCount,
  collectionCount,
}: {
  bookId: string;
  title: string;
  stockQuantity: number;
  orderCount: number;
  cancelledCount: number;
  collectionCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [blocked, setBlocked] = useState<{ orderCount: number; cancelledCount: number } | null>(orderCount > 0 ? { orderCount, cancelledCount } : null);
  const [problem, setProblem] = useState<string | null>(null);
  const [zeroed, setZeroed] = useState(false);
  const [pending, startTransition] = useTransition();
  const openRef = useRef<HTMLButtonElement>(null);

  const counts = blocked;
  const outOfStock = stockQuantity === 0;

  function closeConfirm() {
    setConfirming(false);
    openRef.current?.focus();
  }

  function describe(result: DeleteBookResult | StockZeroResult): string {
    if (result.ok) return "";
    switch (result.kind) {
      case "not_found":
        return "Chúng mình không còn thấy cuốn sách này (có thể vừa bị xoá). Bạn quay lại danh sách để kiểm tra nhé.";
      case "signed_out":
        return "Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại để tiếp tục nhé.";
      case "forbidden":
        return "Tài khoản này không có quyền quản lý sách.";
      default:
        return "Chúng mình chưa làm được việc này. Bạn tải lại trang rồi thử lại nhé.";
    }
  }

  function confirmDelete() {
    startTransition(async () => {
      setProblem(null);
      try {
        const result = await deleteBook(bookId);
        if (!result.ok && result.kind === "ordered") {
          setBlocked({ orderCount: result.orderCount, cancelledCount: result.cancelledCount });
          setConfirming(false);
        } else if (!result.ok) {
          setProblem(describe(result));
          setConfirming(false);
        }
      } catch (error) {
        if (isNextRedirect(error)) return; // xoá xong: action chuyển về danh sách
        setProblem(describe({ ok: false, kind: "unknown" }));
        setConfirming(false);
      }
    });
  }

  function zeroStock() {
    startTransition(async () => {
      setProblem(null);
      try {
        const result = await setBookOutOfStock(bookId);
        if (result.ok) setZeroed(true);
        else setProblem(describe(result));
      } catch {
        setProblem(describe({ ok: false, kind: "unknown" }));
      }
    });
  }

  return (
    <section
      aria-label="Xoá sách"
      data-testid="admin-book-delete"
      className={`mt-6 rounded-menu border p-4 md:p-6 ${counts ? "border-danger bg-danger-tint" : "border-danger bg-surface"}`}
    >
      {problem && <ResultStrip tone="problem" testId="admin-book-delete-result">{problem}</ResultStrip>}
      {zeroed && !problem && (
        <ResultStrip tone="ok" testId="admin-book-delete-result">
          Đã đặt tồn kho về 0. Cuốn này hiện “Hết hàng” trên cửa hàng.
        </ResultStrip>
      )}

      {counts ? (
        <div data-testid="admin-book-delete-blocked" data-order-count={counts.orderCount}>
          <h2 className="font-serif text-xl font-semibold text-danger">Không xoá được cuốn này</h2>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-[70ch] text-body text-ink-900">
              Cuốn này nằm trong <strong className="font-semibold">{counts.orderCount} đơn hàng</strong>
              {counts.cancelledCount > 0 ? ` (trong đó ${counts.cancelledCount} đã hủy)` : ""}, nên chúng mình không xoá để đơn cũ còn nguyên thông tin. Bạn có thể đặt tồn kho về 0 để cuốn hiện “Hết hàng”.
            </p>
            <button
              type="button"
              data-testid="admin-book-stock-zero"
              disabled={pending || outOfStock}
              onClick={zeroStock}
              className={`${secondaryButtonClass} w-full shrink-0 md:w-auto`}
            >
              {outOfStock ? "Đang là 0" : "Đặt tồn kho về 0"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="font-serif text-xl font-semibold text-danger">Xoá cuốn này</h2>
          <p className="mt-1 max-w-[70ch] text-body-sm text-ink-600">Cuốn chưa từng nằm trong đơn hàng nào thì xoá được, sau một bước xác nhận.</p>
          <button
            ref={openRef}
            type="button"
            data-testid="admin-book-delete-action"
            aria-expanded={confirming}
            aria-controls={confirming ? "admin-book-delete-confirm" : undefined}
            onClick={() => setConfirming(true)}
            className={`${secondaryButtonClass} mt-4 w-full !border-danger !text-danger hover:!bg-danger-tint md:w-auto`}
          >
            Xoá sách
          </button>
          {confirming && (
            <InlineConfirm
              id="admin-book-delete-confirm"
              testId="admin-book-delete-confirm"
              title={`Xoá “${title}”?`}
              confirmLabel="Xoá sách"
              confirmClassName={dangerButtonClass}
              pending={pending}
              onConfirm={confirmDelete}
              onClose={closeConfirm}
            >
              Cuốn này chưa từng được đặt, nên xoá được. Cuốn biến mất khỏi cửa hàng và không khôi phục được.
              {collectionCount > 0 ? ` Cuốn cũng bị gỡ khỏi ${collectionCount} tủ sách đang chứa nó.` : ""} Dòng của cuốn này trong giỏ hàng của khách (nếu có ai đang giữ) cũng mất theo; chúng mình không đếm được số người.
            </InlineConfirm>
          )}
        </>
      )}
    </section>
  );
}

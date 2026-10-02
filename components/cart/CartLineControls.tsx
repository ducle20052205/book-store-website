"use client";

import { useState } from "react";
import { type CartActionResult, removeFromCart, setCartQty } from "@/app/actions/cart";
import { cartErrorMessage, overStockMessage } from "@/lib/cart/messages";

interface CartLineControlsProps {
  bookId: string;
  title: string;
  quantity: number;
  /** Số lượng tối đa chọn được: min(tồn kho, 99). */
  maxQuantity: number;
  outOfStock: boolean;
  /** Cảnh báo do server tính lúc render (tồn kho đã giảm dưới số lượng trong giỏ). */
  serverNotice?: string;
}

const stepButtonClass =
  "pressable flex h-11 w-11 items-center justify-center text-lg text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cham-600 disabled:cursor-not-allowed disabled:text-ink-400 disabled:opacity-50";

/**
 * Bộ đếm số lượng + nút xóa của một dòng giỏ (đợt 3A, FR-3A.7, FR-3A.8). Mọi thay
 * đổi đi qua Server Action; nút bị vô hiệu hóa trong lúc action chạy nên thao tác
 * của người dùng luôn nối tiếp (spec 3A, TC-4). Cảnh báo vượt tồn hiện ngay tại dòng.
 */
export function CartLineControls({ bookId, title, quantity, maxQuantity, outOfStock, serverNotice }: CartLineControlsProps) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(action: () => Promise<CartActionResult>) {
    if (pending) return;
    setPending(true);
    try {
      const result = await action();
      setNotice(result.ok ? (result.warning ? overStockMessage(result.warning.max) : null) : cartErrorMessage(result.kind));
    } catch {
      setNotice(cartErrorMessage("unknown"));
    } finally {
      setPending(false);
    }
  }

  const shownNotice = notice ?? serverNotice ?? null;

  return (
    <>
      <div className="flex items-center gap-4 md:justify-end">
        {!outOfStock && (
          <div role="group" aria-label={`Số lượng của ${title}`} className="inline-flex items-center rounded-field border border-line-field bg-surface">
            <button
              type="button"
              aria-label="Giảm số lượng"
              disabled={pending || quantity <= 1}
              onClick={() => run(() => setCartQty(bookId, quantity - 1))}
              className={stepButtonClass}
            >
              −
            </button>
            <span aria-live="polite" className="inline-block min-w-10 text-center text-body-sm font-medium text-ink-900">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              disabled={pending || quantity >= maxQuantity}
              onClick={() => run(() => setCartQty(bookId, quantity + 1))}
              className={stepButtonClass}
            >
              +
            </button>
          </div>
        )}
        <button
          type="button"
          aria-label={`Xóa ${title} khỏi giỏ`}
          disabled={pending}
          onClick={() => run(() => removeFromCart(bookId))}
          className="min-h-11 text-body-sm text-ink-600 underline underline-offset-2 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Xóa khỏi giỏ
        </button>
      </div>

      {shownNotice && (
        <p
          role="status"
          className="mt-2 rounded-notice border border-nghe-400 bg-field px-3 py-2 text-meta text-ink-900 md:text-left"
        >
          {shownNotice}
        </p>
      )}
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { addToCart } from "@/app/actions/cart";
import { Toast } from "@/components/Toast";
import { track } from "@/lib/analytics";
import { cartErrorMessage, overStockMessage } from "@/lib/cart/messages";

function subscribeNoop() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

/** true chỉ sau khi hydrate xong ở client — tránh mismatch SSR khi portal vào document.body. */
function useMounted() {
  return useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
}

const MAX_QTY_CAP = 99;

// A2.2: whitespace-nowrap + px-6 (24px) để nhãn nút không bao giờ tự xuống
// dòng giữa chừng. flex-1 (mobile, chia đều thanh đáy) và shrink-0 (desktop,
// giữ độ rộng tự nhiên — xem lý do ở className nơi dùng) áp riêng từng nơi.
const primaryButtonClass =
  "pressable inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-control bg-cham-700 px-6 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cham-700";

const secondaryButtonClass =
  "pressable inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-control border border-line px-6 text-button font-medium text-ink-900 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 disabled:cursor-not-allowed disabled:opacity-40";

interface PurchasePanelProps {
  bookId: string;
  stockQuantity: number;
}

/**
 * 1c.2: bộ chọn số lượng + 2 nút hành động. Đợt 3A (FR-3A.13): "Thêm vào giỏ hàng"
 * gọi Server Action `addToCart` rồi hiện Toast xác nhận; "Mua ngay" = `addToCart`
 * rồi chuyển tới /gio-hang. Cảnh báo (vượt tồn) và lỗi hiện thành dải trong trang,
 * không tự tắt, vì là thông tin người dùng cần đọc. Mọi nút bị vô hiệu hóa trong
 * lúc action chạy. Mobile (<768px): 2 nút chuyển vào thanh dính đáy màn hình, bộ
 * chọn số lượng vẫn ở trong nội dung trang; thanh dính dùng chung hành vi này.
 */
export function PurchasePanel({ bookId, stockQuantity }: PurchasePanelProps) {
  const outOfStock = stockQuantity <= 0;
  const maxQty = Math.max(1, Math.min(stockQuantity, MAX_QTY_CAP));

  const [quantity, setQuantity] = useState(1);
  const [toastOpen, setToastOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useMounted();
  const router = useRouter();

  async function handleCartAction(goToCart: boolean) {
    if (pending || outOfStock) return;
    setPending(true);
    setNotice(null);
    setToastOpen(false);
    try {
      const result = await addToCart(bookId, quantity);
      if (!result.ok) {
        setNotice(cartErrorMessage(result.kind));
        return;
      }
      // Ghi sau khi giỏ đã lưu; không chặn giao diện, metadata chỉ có book_id và số lượng thêm (FR-3A.10).
      track("add_to_cart", { book_id: bookId, quantity });
      if (goToCart) {
        router.push("/gio-hang");
        return;
      }
      if (result.warning) setNotice(overStockMessage(result.warning.max));
      else setToastOpen(true);
    } catch {
      setNotice(cartErrorMessage("unknown"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-control border border-line">
          <button
            type="button"
            aria-label="Giảm số lượng"
            disabled={outOfStock || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="pressable flex min-h-11 min-w-11 items-center justify-center text-lg text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          {/*
            E2 mục 2: số lượng nảy nhẹ khi đổi — key={quantity} buộc React
            tạo phần tử DOM mới mỗi lần đổi số thay vì cập nhật text trong
            phần tử cũ, nên animation (chạy lúc mount) tự lặp lại mỗi lần
            đổi mà không cần theo dõi thêm sự kiện nào.
          */}
          <span
            key={quantity}
            aria-live="polite"
            className="qty-bounce inline-block min-w-8 text-center text-sm font-medium text-ink-900"
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Tăng số lượng"
            disabled={outOfStock || quantity >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            className="pressable flex min-h-11 min-w-11 items-center justify-center text-lg text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        {/*
          A2.2: hàng nút desktop — shrink-0 để nút giữ độ rộng tự nhiên theo
          nội dung (không bị flex ép hẹp lại gây xuống dòng chữ bên trong);
          flex-wrap để nếu thật sự không đủ chỗ thì "Mua ngay" xuống hẳn
          MỘT DÒNG MỚI, không bao giờ vỡ chữ giữa chừng trong 1 nút.
        */}
        <div className="hidden flex-wrap items-center gap-3 md:flex">
          <button
            type="button"
            disabled={outOfStock || pending}
            onClick={() => handleCartAction(false)}
            className={`${secondaryButtonClass} shrink-0`}
          >
            Thêm vào giỏ hàng
          </button>
          <button
            type="button"
            disabled={outOfStock || pending}
            onClick={() => handleCartAction(true)}
            className={`${primaryButtonClass} shrink-0`}
          >
            Mua ngay
          </button>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-surface px-4 py-3 md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          disabled={outOfStock || pending}
          onClick={() => handleCartAction(false)}
          className={`${secondaryButtonClass} flex-1`}
        >
          Thêm vào giỏ hàng
        </button>
        <button
          type="button"
          disabled={outOfStock || pending}
          onClick={() => handleCartAction(true)}
          className={`${primaryButtonClass} flex-1`}
        >
          Mua ngay
        </button>
      </div>

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        message="Đã thêm vào giỏ hàng."
      />

      {notice && (
        <p
          role="status"
          className="mt-3 rounded-notice border border-nghe-400 bg-field px-3 py-2 text-body-sm text-ink-900"
        >
          {notice}
        </p>
      )}

      {/*
        Footer là sibling của trang (root layout render sau <main>), nên
        padding-bottom trong trang này không thể ngăn thanh dính đáy che nốt
        footer khi cuộn hết trang — phải chèn khoảng trống SAU footer trong
        <body> bằng portal thì mới đủ.
      */}
      {mounted &&
        createPortal(
          <div
            aria-hidden="true"
            className="md:hidden"
            style={{ height: "calc(4.3125rem + env(safe-area-inset-bottom))" }}
          />,
          document.body,
        )}
    </>
  );
}

"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Toast } from "@/components/Toast";

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
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-control bg-cham-700 px-6 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cham-700";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-control border border-line px-6 text-button font-medium text-ink-900 hover:text-cham-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 disabled:cursor-not-allowed disabled:opacity-40";

interface PurchasePanelProps {
  stockQuantity: number;
}

/**
 * 1c.2: bộ chọn số lượng + 2 nút hành động. Giỏ hàng chưa có (bước 3) nên cả
 * 2 nút chỉ hiện Toast. Mobile (<768px): 2 nút chuyển vào thanh dính đáy màn
 * hình, bộ chọn số lượng vẫn ở trong nội dung trang.
 */
export function PurchasePanel({ stockQuantity }: PurchasePanelProps) {
  const outOfStock = stockQuantity <= 0;
  const maxQty = Math.max(1, Math.min(stockQuantity, MAX_QTY_CAP));

  const [quantity, setQuantity] = useState(1);
  const [toastOpen, setToastOpen] = useState(false);
  const mounted = useMounted();

  function handleCartAction() {
    setToastOpen(true);
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
            className="flex min-h-11 min-w-11 items-center justify-center text-lg text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span aria-live="polite" className="min-w-8 text-center text-sm font-medium text-ink-900">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Tăng số lượng"
            disabled={outOfStock || quantity >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            className="flex min-h-11 min-w-11 items-center justify-center text-lg text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 disabled:cursor-not-allowed disabled:opacity-40"
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
            disabled={outOfStock}
            onClick={handleCartAction}
            className={`${secondaryButtonClass} shrink-0`}
          >
            Thêm vào giỏ hàng
          </button>
          <button
            type="button"
            disabled={outOfStock}
            onClick={handleCartAction}
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
          disabled={outOfStock}
          onClick={handleCartAction}
          className={`${secondaryButtonClass} flex-1`}
        >
          Thêm vào giỏ hàng
        </button>
        <button
          type="button"
          disabled={outOfStock}
          onClick={handleCartAction}
          className={`${primaryButtonClass} flex-1`}
        >
          Mua ngay
        </button>
      </div>

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        message="Giỏ hàng đang được hoàn thiện, bạn quay lại sau nhé."
      />

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

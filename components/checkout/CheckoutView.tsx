"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { type PlaceOrderFailure, placeOrder } from "@/app/actions/checkout";
import { AddressPicker } from "@/components/address/AddressPicker";
import { AuthAlert } from "@/components/AuthAlert";
import { FieldFrame, TextField } from "@/components/AuthFields";
import { BottomBarGate } from "@/components/BottomBarGate";
import { formatVnd } from "@/components/Price";
import { TrackEvent } from "@/components/TrackEvent";
import { OrderLines, type OrderLine, OrderTotals } from "@/components/checkout/OrderLines";
import type { ProvinceOption, WardOption } from "@/lib/address";
import {
  type CheckoutErrors,
  type CheckoutField,
  CHECKOUT_FIELD_ORDER,
  type CheckoutFields,
  NOTE_MAX_LENGTH,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  validateCheckout,
} from "@/lib/checkoutRules";
import { isNextRedirect } from "@/lib/nextRedirect";

/**
 * Form thanh toán MỘT bước (đợt 3B, spec FR-3B.10–3B.18). Bố cục theo docs/mockups/buoc-3/
 * (checkout.png, checkout-mobile.png), lắp từ hệ layout đóng băng: container 1200px, một kiểu thẻ,
 * ô nhập cao 48px, nút cao 48px.
 *
 * - Ba lớp kiểm tra: ở đây (cho trải nghiệm), ở Server Action và ở database (lớp thật).
 * - Khoá chống đặt trùng (`idempotencyKey`) sinh ở CLIENT trong initializer của useState, chỉ nằm
 *   trong state và được truyền qua tham số của action — KHÔNG render vào hidden input hay bất kỳ
 *   attribute nào (tránh lệch hydrate, và không bị nướng vào HTML khi trang prerender một phần).
 * - Nút "Đặt hàng" nằm ngoài thẻ <form> (cột tóm tắt, thanh đáy) nên gắn bằng thuộc tính `form`.
 */

export interface CheckoutInitial {
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  wardCode: string;
  addressLine: string;
  /** Hồ sơ đã có địa chỉ đầy đủ: ô "Lưu địa chỉ" bỏ tick sẵn để không âm thầm ghi đè (FR-3B.11). */
  hasSavedAddress: boolean;
}

interface CheckoutViewProps {
  lines: OrderLine[];
  totalQuantity: number;
  total: number;
  provinces: ProvinceOption[];
  initialWards: WardOption[];
  initial: CheckoutInitial;
}

const FORM_ID = "checkout-form";

const cardClass = "rounded-menu border border-line-warm bg-surface";
const sectionClass = "p-4 md:p-6";
const sectionTitleClass = "font-serif text-xl font-semibold text-ink-900";
const primaryButtonClass =
  "pressable inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-field bg-cham-700 px-6 text-button font-medium text-white hover:bg-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-70";

/**
 * Khoá chống đặt trùng. `crypto.randomUUID` chỉ có ở ngữ cảnh bảo mật (HTTPS, localhost); mở bằng
 * IP mạng nội bộ qua HTTP thì không có, nên dự phòng bằng getRandomValues (UUID v4) để trang không vỡ.
 */
function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

const FIELD_LABELS: Record<CheckoutField, string> = {
  recipientName: "Họ và tên",
  recipientPhone: "Số điện thoại",
  provinceCode: "Tỉnh / Thành phố",
  wardCode: "Phường / Xã",
  addressLine: "Số nhà và tên đường",
  paymentMethod: "Phương thức thanh toán",
  note: "Ghi chú cho đơn hàng",
};

function withoutErrors(errors: CheckoutErrors, fields: CheckoutField[]): CheckoutErrors {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => !fields.includes(key as CheckoutField)));
}

export function CheckoutView({ lines, totalQuantity, total, provinces, initialWards, initial }: CheckoutViewProps) {
  const router = useRouter();

  const [fields, setFields] = useState<CheckoutFields>({
    recipientName: initial.recipientName,
    recipientPhone: initial.recipientPhone,
    addressLine: initial.addressLine,
    provinceCode: initial.provinceCode,
    wardCode: initial.wardCode,
    paymentMethod: "cod",
    note: "",
  });
  const [saveAddress, setSaveAddress] = useState(!initial.hasSavedAddress);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [attempt, setAttempt] = useState(0);
  const [submitError, setSubmitError] = useState<{ attempt: number; message: ReactNode } | null>(null);
  const [pending, setPending] = useState(false);
  const [idempotencyKey] = useState(newIdempotencyKey);

  const summaryRef = useRef<HTMLDivElement>(null);
  const recipientNameRef = useRef<HTMLInputElement>(null);
  const recipientPhoneRef = useRef<HTMLInputElement>(null);
  const provinceCodeRef = useRef<HTMLSelectElement>(null);
  const wardCodeRef = useRef<HTMLSelectElement>(null);
  const addressLineRef = useRef<HTMLInputElement>(null);
  const paymentMethodRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  /** Đưa focus về một ô (từ khối tóm tắt lỗi). Chỉ gọi trong trình xử lý sự kiện. */
  function focusField(field: CheckoutField) {
    const target = {
      recipientName: recipientNameRef,
      recipientPhone: recipientPhoneRef,
      provinceCode: provinceCodeRef,
      wardCode: wardCodeRef,
      addressLine: addressLineRef,
      paymentMethod: paymentMethodRef,
      note: noteRef,
    }[field];
    target.current?.focus();
  }

  // Submit sai: đưa focus về khối tóm tắt lỗi ở đầu form (WCAG 3.3.1).
  useEffect(() => {
    if (attempt > 0) summaryRef.current?.focus();
  }, [attempt]);

  function setField<K extends CheckoutField>(field: K, value: CheckoutFields[K]) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? withoutErrors(current, [field]) : current));
  }

  /**
   * `AddressPicker` (đợt 8, FR-A.7) giữ phần nạp phường/xã; ở đây chỉ cập nhật giá trị. Đổi tỉnh thì xoá lỗi của cả
   * hai ô (phường/xã cũ thuộc tỉnh cũ); chỉ đổi phường/xã thì xoá lỗi của chính nó — đúng như trước khi trích.
   */
  function handleAddressChange(next: { provinceCode: string; wardCode: string }) {
    if (next.provinceCode !== fields.provinceCode) {
      setFields((current) => ({ ...current, provinceCode: next.provinceCode, wardCode: next.wardCode }));
      setErrors((current) => withoutErrors(current, ["provinceCode", "wardCode"]));
      return;
    }
    setField("wardCode", next.wardCode);
  }

  function failValidation(next: CheckoutErrors) {
    setErrors(next);
    setSubmitError(null);
    setAttempt((value) => value + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const checked = validateCheckout(fields);
    if (checked.value === null) {
      failValidation(checked.errors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setPending(true);

    let failure: PlaceOrderFailure;
    try {
      // Thành công thì action gọi redirect(): lời gọi bị từ chối bằng lỗi redirect và router tự điều
      // hướng; nút giữ trạng thái "đang đặt" tới khi trang xác nhận hiện.
      failure = await placeOrder({ ...fields, expectedTotal: total, saveAddress }, idempotencyKey);
    } catch (caught) {
      if (isNextRedirect(caught)) return;
      failure = { ok: false, kind: "unknown" };
    }

    setPending(false);
    switch (failure.kind) {
      case "validation":
        failValidation(failure.errors);
        return;
      case "address_invalid":
        failValidation({ wardCode: "Phường/xã này không thuộc tỉnh đã chọn. Bạn chọn lại giúp chúng mình nhé." });
        return;
      case "price_changed":
        setSubmitError({
          attempt: attempt + 1,
          message: (
            <>
              Giá hoặc số lượng sách trong giỏ vừa thay đổi
              {failure.newTotal !== null ? <>, tổng mới là <strong>{formatVnd(failure.newTotal)}</strong></> : null}. Chúng mình chưa tạo
              đơn nào. Bạn xem lại đơn hàng rồi bấm đặt hàng lần nữa nhé.
            </>
          ),
        });
        setAttempt((value) => value + 1);
        router.refresh(); // tóm tắt và tổng tiền dựng lại từ giỏ hiện tại
        return;
      default:
        setSubmitError({
          attempt: attempt + 1,
          message: <>Có gì đó chưa ổn ở phía chúng mình nên đơn hàng chưa được tạo. Bạn thử lại sau ít phút nhé.</>,
        });
        setAttempt((value) => value + 1);
    }
  }

  const errorEntries = CHECKOUT_FIELD_ORDER.filter((field) => errors[field]);

  const submitLabel = pending ? "Đang đặt hàng…" : "Đặt hàng";
  const submitButton = (
    <button type="submit" form={FORM_ID} aria-disabled={pending} className={primaryButtonClass}>
      {submitLabel}
    </button>
  );

  return (
    <div className="mt-6 grid items-start gap-6 bottom-bar:grid-cols-[minmax(0,1fr)_332px] bottom-bar:gap-10">
      <TrackEvent eventType="checkout_started" metadata={{ items_count: totalQuantity, total_amount: total }} />

      <div className="min-w-0">
        {/* Mobile: tóm tắt đơn là một hàng gập mở ở đầu form (đóng mặc định); từ breakpoint chung thì là cột bên cạnh. */}
        <details className={`${cardClass} group bottom-bar:hidden`}>
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              <span className="block text-body-sm font-semibold text-ink-900">Đơn hàng · {totalQuantity} cuốn</span>
              <span className="block text-meta text-ink-600">Chạm để xem từng cuốn</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-serif text-xl font-semibold text-cham-700">{formatVnd(total)}</span>
              <span aria-hidden="true" className="text-ink-600 transition-transform group-open:rotate-180">
                ⌄
              </span>
            </span>
          </summary>
          <div className="border-t border-menu-sep p-4">
            <OrderLines lines={lines} />
          </div>
        </details>

        <form id={FORM_ID} noValidate onSubmit={handleSubmit} className={`${cardClass} mt-4 bottom-bar:mt-0`}>
          {(errorEntries.length > 0 || submitError) && (
            <div className="p-4 pb-0 md:p-6 md:pb-0">
              {submitError && <AuthAlert key={submitError.attempt}>{submitError.message}</AuthAlert>}
              {errorEntries.length > 0 && (
                <div
                  ref={summaryRef}
                  tabIndex={-1}
                  role="alert"
                  className="mb-5 rounded-notice border-l-[3px] border-danger bg-danger-tint px-4 py-3 text-body-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
                >
                  <p className="font-medium">Bạn kiểm tra lại {errorEntries.length} chỗ sau giúp chúng mình nhé:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {errorEntries.map((field) => (
                      <li key={field}>
                        <button
                          type="button"
                          onClick={() => focusField(field)}
                          className="text-left underline underline-offset-2 hover:text-cham-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
                        >
                          {FIELD_LABELS[field]}
                        </button>
                        : {errors[field]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <section aria-labelledby="checkout-recipient" className={sectionClass}>
            <h2 id="checkout-recipient" className={sectionTitleClass}>
              Người nhận
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField
                ref={recipientNameRef}
                label={FIELD_LABELS.recipientName}
                name="recipientName"
                autoComplete="name"
                required
                value={fields.recipientName}
                error={errors.recipientName}
                onChange={(event) => setField("recipientName", event.target.value)}
              />
              <TextField
                ref={recipientPhoneRef}
                label={FIELD_LABELS.recipientPhone}
                name="recipientPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={fields.recipientPhone}
                error={errors.recipientPhone}
                onChange={(event) => setField("recipientPhone", event.target.value)}
              />
            </div>
          </section>

          <section aria-labelledby="checkout-address" className={`${sectionClass} border-t border-menu-sep`}>
            <h2 id="checkout-address" className={sectionTitleClass}>
              Địa chỉ giao hàng
            </h2>
            <AddressPicker
              provinces={provinces}
              initialProvinceCode={initial.provinceCode}
              initialWards={initialWards}
              provinceCode={fields.provinceCode}
              wardCode={fields.wardCode}
              provinceError={errors.provinceCode}
              wardError={errors.wardCode}
              provinceRef={provinceCodeRef}
              wardRef={wardCodeRef}
              onChange={handleAddressChange}
            />
            <div className="mt-4">
              <TextField
                ref={addressLineRef}
                label={FIELD_LABELS.addressLine}
                name="addressLine"
                autoComplete="street-address"
                required
                value={fields.addressLine}
                error={errors.addressLine}
                hint="Địa chỉ Việt Nam từ 01/07/2025 chỉ còn hai cấp: phường/xã rồi tới tỉnh/thành, không còn quận/huyện. Chọn tỉnh xong thì danh sách phường/xã mới mở."
                onChange={(event) => setField("addressLine", event.target.value)}
              />
            </div>
            <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-body-sm text-ink-900">
              <input
                type="checkbox"
                name="saveAddress"
                checked={saveAddress}
                onChange={(event) => setSaveAddress(event.target.checked)}
                className="h-5 w-5 shrink-0 accent-cham-700"
              />
              Lưu địa chỉ này vào tài khoản của tôi
            </label>
          </section>

          <section aria-labelledby="checkout-payment" className={`${sectionClass} border-t border-menu-sep`}>
            <fieldset>
              <legend id="checkout-payment" className={sectionTitleClass}>
                Phương thức thanh toán
              </legend>
              <div className="mt-4 space-y-3">
                {PAYMENT_METHODS.map((method, index) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-start gap-3 rounded-field border border-line-field bg-surface p-4 has-checked:border-cham-700 has-checked:bg-cham-active has-focus-visible:ring-2 has-focus-visible:ring-cham-600"
                  >
                    <input
                      ref={index === 0 ? paymentMethodRef : undefined}
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={fields.paymentMethod === method}
                      onChange={() => setField("paymentMethod", method)}
                      className="mt-1 h-5 w-5 shrink-0 accent-cham-700"
                    />
                    <span className="min-w-0">
                      <span className="block text-body font-medium text-ink-900">{PAYMENT_METHOD_LABELS[method]}</span>
                      <span className="mt-0.5 block text-body-sm text-ink-600">
                        {method === "cod"
                          ? "Bạn trả tiền cho người giao, có thể mở hộp kiểm tra trước."
                          : "Chỉ để minh họa luồng thanh toán: dự án portfolio không có giao dịch thật."}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.paymentMethod && (
                <p role="alert" className="mt-2 text-body-sm text-danger">
                  {errors.paymentMethod}
                </p>
              )}
              {fields.paymentMethod === "bank_transfer" && (
                <div role="note" className="mt-3 rounded-field border border-line-warm bg-field p-4 text-body-sm text-ink-900">
                  <p className="font-semibold">Thông tin chuyển khoản minh họa — dự án portfolio, không có tài khoản thật.</p>
                  <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
                    <dt className="text-ink-600">Ngân hàng</dt>
                    <dd>Ngân hàng Minh Họa</dd>
                    <dt className="text-ink-600">Số tài khoản</dt>
                    <dd>0000 0000 0000</dd>
                    <dt className="text-ink-600">Chủ tài khoản</dt>
                    <dd>NA BOOKS (MINH HỌA)</dd>
                    <dt className="text-ink-600">Nội dung</dt>
                    <dd>Mã đơn hàng, hiện sau khi bạn đặt hàng</dd>
                  </dl>
                </div>
              )}
            </fieldset>
          </section>

          <section aria-labelledby="checkout-note" className={`${sectionClass} border-t border-menu-sep`}>
            <h2 id="checkout-note" className={sectionTitleClass}>
              Ghi chú cho đơn hàng
            </h2>
            <div className="mt-4">
              <TextAreaField
                ref={noteRef}
                label="Không bắt buộc"
                name="note"
                rows={3}
                maxLength={NOTE_MAX_LENGTH + 100}
                placeholder="Ví dụ: gọi trước khi giao giúp mình nhé."
                value={fields.note}
                error={errors.note}
                hint={`Tối đa ${NOTE_MAX_LENGTH} ký tự.`}
                onChange={(event) => setField("note", event.target.value)}
              />
            </div>
          </section>
        </form>

        <p className="mt-2 text-body-sm text-ink-600 bottom-bar:hidden">
          <Link
            href="/gio-hang"
            className="inline-flex min-h-11 items-center text-cham-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
          >
            Quay lại giỏ hàng
          </Link>
        </p>
      </div>

      <aside aria-label="Tóm tắt đơn hàng" className="hidden bottom-bar:sticky bottom-bar:top-24 bottom-bar:block">
        <div className={`${cardClass} p-6`}>
          <h2 className="font-serif text-xl font-semibold text-ink-900">Đơn hàng</h2>
          <div className="mt-4">
            <OrderLines lines={lines} />
          </div>
          <div className="mt-2 border-t border-menu-sep" />
          <OrderTotals total={total} />
          <div className="mt-5">{submitButton}</div>
          <p className="mt-1 text-center">
            <Link
              href="/gio-hang"
              className="inline-flex min-h-11 items-center text-body-sm text-cham-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cham-600"
            >
              Quay lại giỏ hàng
            </Link>
          </p>
          <p className="mt-4 text-meta text-ink-600">
            Đây là dự án portfolio: không có cổng thanh toán thật và không có đơn hàng nào được giao.
          </p>
        </div>
      </aside>

      {/* Dưới breakpoint chung: thanh tổng + nút Đặt hàng CỐ ĐỊNH ở đáy khung nhìn, cùng khuôn với /gio-hang. */}
      <BottomBarGate>
        <div
          data-bottom-bar
          className="fixed inset-x-0 bottom-0 z-30 box-border h-[var(--bottom-bar-h)] border-t border-line-warm bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:px-6 bottom-bar:hidden"
        >
          <div className="flex h-7 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-body-sm text-ink-600">Tổng cộng · miễn phí giao hàng</p>
            <p className="shrink-0 whitespace-nowrap font-serif text-xl font-semibold leading-none text-cham-700">{formatVnd(total)}</p>
          </div>
          <div className="mt-3 h-12">{submitButton}</div>
        </div>
      </BottomBarGate>
    </div>
  );
}

function TextAreaField({
  label,
  error,
  hint,
  ref,
  ...textareaProps
}: {
  label: string;
  error?: ReactNode;
  hint?: ReactNode;
  ref?: Ref<HTMLTextAreaElement>;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className">) {
  const id = useId();
  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      renderInput={(frame) => (
        <textarea {...textareaProps} {...frame} ref={ref} className={`${frame.className} h-auto! min-h-24 resize-y py-3 md:h-auto!`} />
      )}
    />
  );
}

/**
 * Luật kiểm tra form thanh toán (đợt 3B, spec FR-3B.18) dùng chung cho form
 * (components/checkout/CheckoutForm.tsx) và Server Action (app/actions/checkout.ts) —
 * MỘT bản duy nhất, như lib/authRules.ts, để hai nơi không lệch nhau. Lớp cuối cùng
 * là hàm `place_order` và các CHECK của bảng `orders` ở database.
 *
 * Không thêm thư viện validate schema cho năm luật đơn giản; file này không import gì
 * để dùng được cả ở client lẫn server.
 */

export const PAYMENT_METHODS = ["cod", "bank_transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
};

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const ADDRESS_LINE_MIN_LENGTH = 5;
export const ADDRESS_LINE_MAX_LENGTH = 200;
export const NOTE_MAX_LENGTH = 500;

/**
 * Số điện thoại Việt Nam: 10 số, bắt đầu bằng 0 rồi một chữ số 2–9. KHÔNG dùng danh sách
 * đầu số nhà mạng — đầu số thay đổi được, danh sách sẽ lỗi thời trong im lặng.
 */
export const PHONE_PATTERN = /^0[2-9][0-9]{8}$/;
export const PROVINCE_CODE_PATTERN = /^[0-9]{2}$/;
export const WARD_CODE_PATTERN = /^[0-9]{5}$/;

/** Bỏ khoảng trắng, dấu chấm, dấu gạch, dấu ngoặc mà người dùng hay gõ xen vào số điện thoại. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s.\-()]/g, "");
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

export interface CheckoutFields {
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  provinceCode: string;
  wardCode: string;
  paymentMethod: string;
  note: string;
}

export type CheckoutField = keyof CheckoutFields;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

/** Giá trị đã chuẩn hoá, an toàn để gửi tiếp tới `place_order`. */
export interface CheckoutValue {
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  provinceCode: string;
  wardCode: string;
  paymentMethod: PaymentMethod;
  note: string | null;
}

/** Thứ tự các ô trên giao diện — dùng để đưa focus về ô lỗi đầu tiên. */
export const CHECKOUT_FIELD_ORDER: CheckoutField[] = [
  "recipientName",
  "recipientPhone",
  "provinceCode",
  "wardCode",
  "addressLine",
  "paymentMethod",
  "note",
];

const text = (value: unknown): string => (typeof value === "string" ? value : "");

export function validateCheckout(input: Partial<Record<CheckoutField, unknown>>): {
  errors: CheckoutErrors;
  value: CheckoutValue | null;
} {
  const errors: CheckoutErrors = {};

  const recipientName = text(input.recipientName).trim();
  if (recipientName === "") {
    errors.recipientName = "Bạn nhập họ và tên người nhận giúp chúng mình nhé.";
  } else if (recipientName.length < NAME_MIN_LENGTH || recipientName.length > NAME_MAX_LENGTH) {
    errors.recipientName = `Họ và tên cần từ ${NAME_MIN_LENGTH} đến ${NAME_MAX_LENGTH} ký tự.`;
  }

  const recipientPhone = normalizePhone(text(input.recipientPhone));
  if (recipientPhone === "") {
    errors.recipientPhone = "Bạn nhập số điện thoại giúp chúng mình nhé.";
  } else if (!PHONE_PATTERN.test(recipientPhone)) {
    errors.recipientPhone = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0 (ví dụ 0912 345 678).";
  }

  const provinceCode = text(input.provinceCode).trim();
  if (provinceCode === "") {
    errors.provinceCode = "Bạn chọn tỉnh/thành phố giúp chúng mình nhé.";
  } else if (!PROVINCE_CODE_PATTERN.test(provinceCode)) {
    errors.provinceCode = "Tỉnh/thành phố này chưa hợp lệ. Bạn chọn lại giúp chúng mình nhé.";
  }

  const wardCode = text(input.wardCode).trim();
  if (wardCode === "") {
    errors.wardCode = "Bạn chọn phường/xã giúp chúng mình nhé.";
  } else if (!WARD_CODE_PATTERN.test(wardCode)) {
    errors.wardCode = "Phường/xã này chưa hợp lệ. Bạn chọn lại giúp chúng mình nhé.";
  }

  const addressLine = text(input.addressLine).trim();
  if (addressLine === "") {
    errors.addressLine = "Bạn nhập số nhà và tên đường giúp chúng mình nhé.";
  } else if (addressLine.length < ADDRESS_LINE_MIN_LENGTH || addressLine.length > ADDRESS_LINE_MAX_LENGTH) {
    errors.addressLine = `Số nhà và tên đường cần từ ${ADDRESS_LINE_MIN_LENGTH} đến ${ADDRESS_LINE_MAX_LENGTH} ký tự.`;
  }

  const paymentMethod = text(input.paymentMethod);
  if (!isPaymentMethod(paymentMethod)) {
    errors.paymentMethod = "Bạn chọn phương thức thanh toán giúp chúng mình nhé.";
  }

  const note = text(input.note).trim();
  if (note.length > NOTE_MAX_LENGTH) {
    errors.note = `Ghi chú tối đa ${NOTE_MAX_LENGTH} ký tự.`;
  }

  if (Object.keys(errors).length > 0 || !isPaymentMethod(paymentMethod)) {
    return { errors, value: null };
  }

  return {
    errors,
    value: {
      recipientName,
      recipientPhone,
      addressLine,
      provinceCode,
      wardCode,
      paymentMethod,
      note: note === "" ? null : note,
    },
  };
}

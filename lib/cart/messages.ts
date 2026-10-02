/**
 * Câu chữ của giỏ hàng cho giao diện (đợt 3A). Giọng NA Books: xưng "chúng mình",
 * gọi người dùng là "bạn", không lộ mã lỗi kỹ thuật, luôn nói bước tiếp theo
 * (NFR-3.2, NFR-3.4). Dùng được ở cả server lẫn client.
 */

export function overStockMessage(max: number): string {
  return `Chỉ còn ${max} cuốn, chúng mình đã giữ đúng ${max} cho bạn.`;
}

export type CartErrorKind = "invalid" | "not_found" | "out_of_stock" | "cookie_full" | "unknown";

export function cartErrorMessage(kind: CartErrorKind): string {
  switch (kind) {
    case "not_found":
      return "Cuốn này không còn trong kho sách nên chúng mình đã bỏ nó khỏi giỏ.";
    case "out_of_stock":
      return "Cuốn này vừa hết hàng, bạn xóa khỏi giỏ giúp chúng mình nhé.";
    case "cookie_full":
      return "Giỏ hàng đã đầy. Bạn bớt một cuốn rồi thử lại nhé.";
    default:
      return "Chúng mình chưa cập nhật được giỏ hàng. Bạn thử lại giúp chúng mình nhé.";
  }
}

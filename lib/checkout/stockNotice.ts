/**
 * Cờ "có sách không đủ hàng" khi chuyển từ /thanh-toan về /gio-hang (đợt 3B, spec FR-3B.9).
 *
 * Cờ trong query CHỈ là tín hiệu để trang giỏ hiện banner. NỘI DUNG banner (tên sách, số còn
 * lại) luôn dựng từ tồn kho do server tính lại lúc render, không bao giờ lấy từ URL — nên đặt
 * chữ giả vào tham số này không làm xuất hiện chữ đó trong trang.
 */
export const STOCK_NOTICE_PARAM = "hang";
export const CART_STOCK_NOTICE_HREF = `/gio-hang?${STOCK_NOTICE_PARAM}=1`;

export interface StockNoticeItem {
  title: string;
  /** Số cuốn còn lại trong kho; 0 nghĩa là đã hết hàng. */
  remaining: number;
  /** Số cuốn đang có trong giỏ. */
  inCart: number;
}

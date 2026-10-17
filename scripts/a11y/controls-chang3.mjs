// Đối chứng cho chặng 3: phép thử chọn-chữ của ô nhập (TC-A.7) và phép kiểm bảng số liệu của biểu đồ (TC-A.8).
import { BASE } from "./common.mjs";
import { checkChartTables, emailFieldCheck } from "./measure.mjs";

// Số liệu tổng hợp: 2 tháng, 2 danh mục, 5 bước phễu. Không phụ thuộc DB.
const STATS = {
  revenue_by_month: [{ month: "2026-03", revenue: 1230000 }, { month: "2026-04", revenue: 0 }],
  category_sales: [{ slug: "a", name: "Văn học", units: 12 }, { slug: "b", name: "Kinh tế", units: 7 }],
  funnel: { steps: [{ event_type: "page_view", count: 200 }, { event_type: "search", count: 100 }, { event_type: "add_to_cart", count: 50 }, { event_type: "checkout_started", count: 20 }, { event_type: "order_placed", count: 10 }] },
};
const tbl = (testid, rows) => ({ testid, caption: "c", rows });
const goodCharts = () => [
  { testid: "admin-revenue-chart", tokens: ["T3", "1,2tr", "T4", "0"], tables: [tbl("t1", [["Tháng", "Doanh thu"], ["T3/2026", "1.230.000 ₫"], ["T4/2026", "0 ₫"]])] },
  { testid: "admin-category-chart", tokens: ["Văn học", "12", "Kinh tế", "7"], tables: [tbl("t2", [["Danh mục", "Số bản đã bán"], ["Văn học", "12"], ["Kinh tế", "7"]])] },
  { testid: "admin-funnel-chart", tokens: ["Xem trang sách", "200", "100%", "Tìm kiếm", "100", "50%", "Thêm vào giỏ", "50", "25%", "Bắt đầu thanh toán", "20", "10%", "Đặt đơn", "10", "5%"], tables: [tbl("t3", [["Bước", "Số lượt", "Tỉ lệ so với bước đầu"], ["Xem trang sách", "200", "100%"], ["Tìm kiếm", "100", "50%"], ["Thêm vào giỏ", "50", "25%"], ["Bắt đầu thanh toán", "20", "10%"], ["Đặt đơn", "10", "5%"]])] },
];

/** `inject(b, html)` chèn khối HTML vào #a11y-ctl (định nghĩa ở controls.mjs). */
export async function runChang3Controls(b, lib, inject) {
  const res = [];
  const add = (id, expect, pass, observed) => res.push({ id, expect, pass, observed });

  // ───── TC-A.7: chọn-chữ. Ô disabled phải KHÔNG chọn được (ca phải bắt); ô readOnly phải chọn được (ca phải không bắt). ─────
  await b.goto(`${BASE}/dang-nhap`);
  await b.evalJs(lib);
  await inject(b, `<input id="sel-dis" type="email" disabled value="thu@example.com" style="width:240px;height:32px"><br><input id="sel-ro" type="email" readonly value="thu@example.com" style="width:240px;height:32px"><br><input id="sel-x" type="email" value="thu@example.com" style="display:none">`);
  const dis = await b.evalJs("window.__a11y.selectProbe('#sel-dis')");
  const ro = await b.evalJs("window.__a11y.selectProbe('#sel-ro')");
  add("TC-A.7 phải BẮT ô disabled: không chọn được chữ", "domSelection rỗng, không nhận focus", dis.domSelection === "" && dis.active === false, JSON.stringify(dis));
  add("TC-A.7 phải KHÔNG bắt ô readOnly: chọn được đúng chuỗi", "domSelection = chuỗi của ô", ro.domSelection === "thu@example.com" && ro.active === true, JSON.stringify(ro));
  // chuột thật: dùng cùng hàm đo như ở /tai-khoan (nó nhắm input[type=email] đầu tiên): bỏ ô disabled, giữ ô readOnly
  await b.evalJs(`document.getElementById('sel-dis').remove(); document.getElementById('sel-x').remove()`);
  const mouse = (await emailFieldCheck(b)).mouse;
  add("TC-A.7 chuột thật (3 cú nhấp) chọn được chữ của ô readOnly", "domSelection = chuỗi của ô", mouse.domSelection === "thu@example.com", JSON.stringify(mouse));

  // ───── TC-A.8: kiểm bảng số liệu. Đủ bảng thì không báo thiếu; xoá một giá trị ở từng biểu đồ thì phải báo thiếu đúng chỗ. ─────
  const ok = checkChartTables(goodCharts(), STATS);
  add("TC-A.8 phải KHÔNG bắt khi bảng đủ", "missing=[], uncovered=[]", ok.missing.length === 0 && ok.uncovered.length === 0 && ok.charts === 3, JSON.stringify(ok));
  const dropRow = (idx, rowIdx) => { const c = goodCharts(); c[idx].tables[0].rows.splice(rowIdx, 1); return checkChartTables(c, STATS); };
  const m1 = dropRow(0, 1), m2 = dropRow(1, 2), m3 = dropRow(2, 3);
  add("TC-A.8 phải BẮT khi xoá một tháng khỏi bảng doanh thu", "missing nêu T3/2026", m1.missing.some((x) => x.includes("T3/2026")), JSON.stringify(m1.missing));
  add("TC-A.8 phải BẮT khi xoá một danh mục khỏi bảng", "missing nêu Kinh tế", m2.missing.some((x) => x.includes("Kinh tế")), JSON.stringify(m2.missing));
  add("TC-A.8 phải BẮT khi xoá một bước giữa của phễu", "missing nêu add_to_cart / checkout_started", m3.missing.length >= 1, JSON.stringify(m3.missing));
  const noTables = goodCharts().map((c) => ({ ...c, tables: [] }));
  const none = checkChartTables(noTables, STATS);
  add("TC-A.8 phải BẮT khi không có bảng nào (trạng thái trước khi sửa)", "mọi giá trị thiếu", none.missing.length === STATS.revenue_by_month.length + STATS.category_sales.length + STATS.funnel.steps.length, `missing=${none.missing.length}`);
  return res;
}

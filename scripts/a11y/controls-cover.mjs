// Đối chứng cho phép đo điều kiện miễn trừ A11Y-14 (tên sách và tác giả của bìa). Sáu bìa tổng hợp chèn vào DOM trong bộ nhớ
// (bốn trượt, hai đạt) phải được phân loại đúng 6/6; hai ca thêm kiểm đúng kịch bản của FR-A.2: bìa `aria-hidden` có tên sách
// là chữ thật cạnh bìa thì ĐẠT, có chữ cạnh bìa nhưng không phải tên sách thì TRƯỢT. Dùng danh sách sách tổng hợp, không cần DB.
import { a14Measure } from "./measure.mjs";

const BOOKS = [
  { title: "Sách Thử A", author: "Tác Giả A", slug: "sach-thu-a" },
  { title: "Sách Thử B", author: "Tác Giả B", slug: "sach-thu-b" },
];
const COVER = 'class="book-cover-shadow" style="display:inline-block;width:40px;height:60px;background:#26306B;color:#fff"';
const PNG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const ROOT = "document.getElementById('a11y-ctl')";

/** `inject(b, html)` chèn khối HTML vào #a11y-ctl (định nghĩa ở controls.mjs). */
export async function runCoverControls(b, lib, inject) {
  await b.evalJs(lib);
  const LONG = "Đoạn chữ thật khác nằm cạnh bìa, đủ dài để vượt ngưỡng hai mươi ký tự.";
  // Mỗi ca được chèn RIÊNG một mình: chữ cạnh bìa lấy từ tổ tiên đầu tiên đủ 20 ký tự chữ, nên nếu để chung một khối thì
  // đoạn chữ của ca 7 sẽ "rò" sang các ca khác khi chúng leo lên tổ tiên chung.
  const cases = [
    `<div ${COVER}><span aria-hidden="true">Sách Thử A</span></div>`, // 1 bìa trơ (chữ in trên bìa không phải tên khả truy cập)
    `<div aria-hidden="true" ${COVER}>Sách Thử A</div>`, // 2 aria-hidden, không chữ thật cạnh bìa
    `<div role="img" aria-label="Sách Thử A" ${COVER}></div>`, // 3 role=img + nhãn đúng
    `<div ${COVER}><img alt="Sách Thử B" src="${PNG}" width="40" height="60"></div>`, // 4 <img alt> đúng
    `<div ${COVER}><img alt="" src="${PNG}" width="40" height="60"></div>`, // 5 <img alt="">
    `<div role="img" aria-label="Một nhãn lạ không phải tên sách" ${COVER}></div>`, // 6 nhãn không phải tên sách nào
    `<div aria-hidden="true" ${COVER}>Sách Thử A</div><p>Sách Thử A — Tác Giả A, bìa mềm, 320 trang.</p>`, // 7 aria-hidden + tên sách là chữ cạnh bìa
    `<div aria-hidden="true" ${COVER}>Sách Thử A</div><p>${LONG}</p>`, // 8 aria-hidden + chữ cạnh bìa KHÔNG phải tên sách
  ];
  const rows = [];
  for (const html of cases) {
    await inject(b, `<div class="ctl-item">${html}</div>`);
    rows.push((await a14Measure(b, ROOT, BOOKS)).rows[0]);
  }
  const r = { rows };
  const want = [false, false, true, true, false, false, true, false];
  const res = [];
  const six = r.rows.slice(0, 6).map((x, i) => x?.passA === want[i]);
  res.push({ id: "A11Y-14 sáu bìa tổng hợp (4 trượt, 2 đạt) phân loại đúng 6/6", expect: "6/6", pass: six.every(Boolean) && r.rows.length === 8, observed: `${six.filter(Boolean).length}/6 · passA=${JSON.stringify(r.rows.map((x) => x.passA))}` });
  res.push({ id: "A11Y-14 bìa aria-hidden có tên sách là chữ thật cạnh bìa phải ĐẠT (a), đường 'chữ cạnh bìa'", expect: "passA=true, path='chữ cạnh bìa'", pass: r.rows[6]?.passA === true && r.rows[6]?.path === "chữ cạnh bìa", observed: JSON.stringify({ passA: r.rows[6]?.passA, path: r.rows[6]?.path }) });
  res.push({ id: "A11Y-14 bìa aria-hidden có chữ cạnh bìa nhưng KHÔNG phải tên sách phải TRƯỢT (a)", expect: "passA=false", pass: r.rows[7]?.passA === false, observed: JSON.stringify({ passA: r.rows[7]?.passA, adjacent: r.rows[7]?.adjacent }) });

  // Bìa aria-hidden KHÔNG nằm trong liên kết (như bìa xem trước của form admin): tên sách có ở giá trị ô nhập trong <main> thì ĐẠT;
  // ô nhập mang giá trị khác thì TRƯỢT. Chèn vào đầu <main> (nhánh này đọc chữ của <main>).
  const inMain = async (html) => {
    await b.evalJs(`(() => { document.getElementById('a11y-ctl')?.remove(); const box = document.createElement('div'); box.id = 'a11y-ctl'; box.innerHTML = ${JSON.stringify(html)}; document.querySelector('main').prepend(box); return 1; })()`);
    return (await a14Measure(b, ROOT, BOOKS)).rows[0];
  };
  const ok = await inMain(`<aside><div aria-hidden="true" ${COVER}>Sách Thử A</div><p>Bìa xem trước, sinh tự động từ các ô bên dưới.</p></aside><label>Tên sách <input value="Sách Thử A"></label>`);
  const bad = await inMain(`<aside><div aria-hidden="true" ${COVER}>Sách Thử A</div><p>Bìa xem trước, sinh tự động từ các ô bên dưới.</p></aside><label>Tên sách <input value="Một cuốn khác hẳn"></label>`);
  res.push({ id: "A11Y-14 bìa aria-hidden ngoài liên kết, tên sách là GIÁ TRỊ Ô NHẬP trong main phải ĐẠT (a)", expect: "passA=true, path='chữ/giá trị ô nhập trong main'", pass: ok?.passA === true && ok?.path === "chữ/giá trị ô nhập trong main", observed: JSON.stringify({ passA: ok?.passA, path: ok?.path }) });
  res.push({ id: "A11Y-14 bìa aria-hidden ngoài liên kết, ô nhập mang giá trị KHÁC phải TRƯỢT (a)", expect: "passA=false", pass: bad?.passA === false, observed: JSON.stringify({ passA: bad?.passA, path: bad?.path }) });
  return res;
}

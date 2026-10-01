# Đợt 2B.1 — Hiệu năng trên hosted

Bước 2 · Tài khoản người dùng · phiên bản 1.0 · 01/10/2026
Nhánh: chưa tạo. Đợt này đi sau 2B, không nằm trong PR #9.

Cùng đợt 2B.1 với `docs/specs/buoc-2b1-xoa-nhay-trang-thai-header.md` (nháy "Đăng
nhập" ở header). Hai tài liệu độc lập, làm riêng được.

Tài liệu liên quan: `docs/specs/buoc-2b-dang-nhap-dang-ky.md`,
`docs/specs/buoc-2a-ha-tang-auth.md` (mục 5: proxy chỉ lo trải nghiệm),
`components/Header.tsx`, `components/BookCard.tsx`, `proxy.ts`,
`app/actions/auth.ts`, `components/LoginForm.tsx`, `components/RegisterForm.tsx`.

---

## 1. Vì sao có đợt này

Người dùng thử tay trên preview PR #9 (Supabase hosted) thấy trang "đơ" sau khi
đăng ký và đăng xuất, và 404 ở `/gio-hang`. Chẩn đoán 30/09 và 01/10/2026 cho
thấy:

- **Không có treo vô hạn.** Dòng `sign_up` và `login` trong `events` (có
  `user_id`) xuất hiện 0,9–1,2 s sau lời gọi Auth: action đã trả về ở client.
  Server Action `signOut` gọi khi chưa có phiên trên preview luôn kết thúc.
- **Nguyên nhân chính là chậm do vùng hạ tầng lệch.** Supabase ở `ap-northeast-1`
  (Tokyo), hàm Vercel ở `iad1`. Sau khi đổi Function Region sang `hnd1` và
  redeploy (đo 01/10): action `signOut` 3,6–4,3 s xuống 0,49–0,64 s; PostgREST từ
  Vercel trung vị 280 ms xuống 12,5 ms.
- **Còn lại là chi phí thiết kế**, không phải hạ tầng, và là nội dung đợt này:
  `revalidatePath` vô hiệu hoá cache dùng chung (hạng mục 1), `router.refresh()`
  thừa, bão prefetch kéo theo hàng chục lần `getUser()` ở proxy, và `/gio-hang`
  chưa có trang.

Lượt chẩn đoán trước có một câu sai, sửa ở đây: "bỏ `revalidatePath` thì response
action không còn render lại trang" chỉ đúng khi action không đổi cookie. Next đặt
`pathWasRevalidated` ngay khi cookie bị đổi
(`node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.js`
dòng 130), nên `signIn`, `signUp`, `signOut` có phiên vẫn render lại trang trong
response (đo: 54.110 byte ở bản thử). Cái bỏ `revalidatePath` loại được là việc
**vô hiệu hoá cache dữ liệu**, không phải bước render lại.

## 2. Phạm vi

**Thuộc phạm vi**
1. Bỏ `revalidatePath` khỏi `signIn`, `signUp`, `signOut`.
2. Bỏ `router.refresh()` thừa sau `router.push()` ở `LoginForm`, `RegisterForm`.
3. Giảm prefetch ở trang chủ và trang danh mục. **Hạ cấp (01/10):** chỉ làm nếu
   tiêu chí 3.3 vẫn trượt sau khi xong hạng mục 4.
4. `proxy.ts` bỏ qua request prefetch. **Ưu tiên cao nhất của đợt.**
5. Trang `/gio-hang` tạm cho đợt 3.

**Thứ tự.** Hạng mục 4 làm trước. Các hạng mục 1, 2, 5 theo số thứ tự. Hạng mục 3
chỉ khi điều kiện ở trên xảy ra.

**Ngoài phạm vi**
- Truy vấn N+1 ở trang chủ (mục "Chưa lên lịch" cuối tài liệu).
- Nháy "Đăng nhập" ở header (`buoc-2b1-xoa-nhay-trang-thai-header.md`).
- `getUser()` ở proxy cho request không phải prefetch: giữ nguyên quyết định 2A.
- Logic giỏ hàng (đợt 3).

## 3. Quy ước đo

Mọi số "mốc" dưới đây đo ngày 01/10/2026 trừ khi ghi khác. Môi trường:
- **Preview:** preview PR #9 trên Vercel, vùng hàm `hnd1`, chỉ request không phiên.
  Trình duyệt là Edge headless 1280×800, host Supabase bị chặn ở DNS để không ghi
  `events`.
- **Cục bộ:** `npm run build && npm start` trỏ stack Supabase cục bộ qua proxy đếm
  request (có thể thêm độ trễ). "+160 ms/vòng" là độ trễ thêm vào mỗi lượt gọi
  Supabase, xấp xỉ khoảng cách Vercel `iad1` tới Tokyo; chỉ để so sánh tương đối,
  không thay được số đo hosted. Bản cục bộ chạy HTTP/1.1 (6 kết nối mỗi origin),
  hosted chạy HTTP/2.
- **Hosted, người dùng đo tay** (Claude không đăng nhập hosted): DevTools với "Preserve
  log" **tắt**, mỗi con số là **một lượt tải**, không cộng dồn. Số request trong
  DevTools cộng dồn khi bật ô này (xem `CLAUDE.md`).

**Hai trạng thái đăng nhập loại trừ nhau (selector).** Mọi tiêu chí về header dùng
đúng hai điều kiện sau và ghi **cả hai cờ** ở mỗi lần đọc:
- ĐÃ đăng nhập = có `button[aria-haspopup][aria-label="Tài khoản"]` VÀ không có
  `nav[aria-label="Tài khoản và giỏ hàng"] a[href^="/dang-nhap"]`.
- CHƯA đăng nhập = ngược lại cả hai vế.

Một lần đọc mà hai cờ cùng đúng hoặc cùng sai là **phép đo hỏng**, không phải kết
quả. Mỗi tiêu chí đo trạng thái này phải kèm một lần đo ở trạng thái ngược lại.

**Phân loại request mạng.** Request RSC có header `rsc: 1`. Prefetch là request RSC
có `next-router-prefetch: 1`. Điều hướng hoặc làm mới là request RSC không có
header đó. Đối chứng của phép phân loại: trong cùng lần đo, số request prefetch phải
lớn hơn 0 (mốc 11–28); nếu bằng 0 thì bộ lọc hỏng.

**Độ nhiễu.** Theo quy tắc ở `CLAUDE.md`, mọi ngưỡng bên dưới lớn hơn độ nhiễu đo
được của chính phép đo, ghi cạnh mốc.

## 4. Hạng mục 1 — Bỏ `revalidatePath` khỏi `signIn` / `signUp` / `signOut`

**Hiện trạng.** `app/actions/auth.ts` dòng 34 và 72 gọi `revalidatePath("/",
"layout")`, dòng 85 gọi `revalidatePath("/")`. Hai lệnh `("/", "layout")` gắn thẻ
`_N_T_/layout`, mà mọi route đều mang (`getDerivedTags` trong
`next/dist/server/lib/implicit-tags.js` bắt đầu bằng `/layout`), nên vô hiệu hoá
dữ liệu của cả site; điều này đọc từ mã, chưa đo trên hosted (cần phiên thật). Với
`revalidatePath("/")` của `signOut`, đã đo được.

**Điều kiện làm: đã thoả.** Trên stack cục bộ, ở một nhánh tạm (đã huỷ, không
commit) bỏ ba lệnh `revalidatePath`, đăng ký, đăng xuất, đăng nhập bằng form thật:
header đổi đúng cả ba luồng, F5 giữ đúng, và hai kịch bản thêm (điều hướng mềm tới
trang đã xem lúc chưa đăng nhập; Back sau đăng xuất) đều đúng, giống bản gốc.
Cookie đổi vẫn khiến Next gắn `x-action-revalidated: 1` nên client tự làm mới.

**Mốc trước khi sửa.**
- Preview, 5 vòng {làm nóng, POST `signOut` không phiên, GET từ client khác không
  chung cookie}. Tính 4 vòng sạch (vòng 1 trạng thái trước là STALE, không tính):
  `GET /` ngay sau action là `x-vercel-cache: REVALIDATED` 5/5 vòng (4/4 vòng
  sạch), TTFB 0,71–0,98 s (trung vị 0,83 s), trước đó `HIT`. Bốn trang đối chứng
  (`/sach`, `/tu-sach`, `/dang-nhap`, `/sach/nha-gia-kim`) vẫn `HIT` ở mọi vòng.
  Nghĩa là cache bị vô hiệu cho người khác, không chỉ người gọi, và phạm vi của
  `revalidatePath("/")` đúng một route.
- Preview, response action `signOut` không phiên: HTTP 200, 54.290 byte, tổng
  0,49–0,64 s (trung vị 0,58 s). Trước khi đổi vùng (iad1): 3,6–4,3 s.
- Cục bộ, Supabase +160 ms/vòng, 5 lần, trung vị [min–max]: đăng ký tới `/` 1625 ms
  [1553–1645]; đăng xuất từ `/` 1501 ms [1490–1508]; đăng nhập tới `/` 1613 ms
  [1609–1616]; đăng xuất từ `/tu-sach` 616 ms [519–621]. **Nhiễu lớn nhất: 102 ms.**
- **Đo lại ở đầu 2B.1 (01/10, main `18016f8`, cùng harness, 5 lần, +160 ms/vòng):** đăng
  ký tới `/` 1626 ms [1608–1755]; đăng xuất từ `/` 1487 ms [1482–1505]; đăng nhập tới
  `/` 1531 ms [1490–1626]; đăng xuất từ `/tu-sach` 501 ms [496–514]. **Nhiễu lớn nhất
  lần này: 147 ms** (đăng ký). Header đúng trạng thái 55/55, 0 phép đo hỏng. Đây là mốc
  để so mọi hạng mục của đợt và để đặt ngưỡng.
- Bản thử (một lần): 1158 / 511 / 1124 / 499 ms; ở +500 ms: đăng ký 4013 xuống 2514
  ms, đăng xuất từ `/` 3872 xuống 1239 ms, đăng nhập 4000 xuống 2767 ms.
- Response `signOut` không phiên, cục bộ: 54.110 byte; bản thử: 81 byte. Có phiên
  (cookie đổi): vẫn 54.110 byte ở bản thử. Mục này **không** loại bước render lại đó.

**Hoàn thành khi.**
1.1. Ba luồng cục bộ (đăng ký, đăng xuất, đăng nhập) và hai kịch bản thêm, mỗi cái
10/10 lần: trạng thái header đúng theo hai cờ ở mục 3, trước và sau F5. Đối chứng:
mỗi luồng đo đủ cả hai trạng thái (sau đăng nhập phải ĐÃ, sau đăng xuất phải CHƯA).
1.2. Cục bộ, +160 ms/vòng, 5 lần, trung vị: đăng ký tới `/` ≤ 1325 ms; đăng xuất từ
`/` ≤ 1200 ms; đăng nhập tới `/` ≤ 1313 ms. (Mỗi ngưỡng là mốc trừ 300 ms. Nhiễu lớn
nhất đo lại 01/10 là 147 ms, nên 300 ms gấp 2,0 lần nhiễu; vẫn lớn hơn nhiễu như
`CLAUDE.md` yêu cầu, chỉ là biên không rộng bằng khi nhiễu là 102 ms. Mốc hiện tại
1626 / 1487 / 1531 ms cho ngưỡng trừ 300 ms là 1326 / 1187 / 1231 ms, chặt hơn hoặc
bằng các số ở trên, và bản cuối đo 899 / 497 / 883 ms nên đạt với biên rất lớn.)
Đăng xuất từ `/tu-sach` không có tiêu chí: chênh lệch nằm trong nhiễu (bản thử 499 ms
so với 519–621 ms).
1.3. Preview, lặp lại đúng phép đo ở mốc (5 vòng): `GET /` ngay sau POST `signOut`
không phiên là `HIT` ở 5/5 vòng, TTFB trung vị ≤ 400 ms (mốc `HIT` 209 ms, nhiễu
36 ms). Đối chứng: trước khi sửa cùng phép đo cho `REVALIDATED` (4/4 vòng sạch).
1.4. Preview, response `signOut` không phiên ≤ 1.000 byte (mốc 54.290 byte).
1.5. Tiêu chí 25, 26, 29–31 của spec 2B chạy lại, đạt.
1.6. **Người dùng đo** (Claude không đăng nhập hosted): bấm "Tạo tài khoản" tới lúc
URL đổi sang `/`, 5 lần trên hosted vùng `hnd1`. **Mốc trước khi sửa** (người dùng đo
tay trên hosted, 01/10): đăng ký 2–3 s; đăng xuất và đăng nhập gần như tức thì. Mốc
này là một khoảng ước lượng bằng tay, chưa có độ nhiễu: ngưỡng sau đợt đặt lớn hơn 3
lần nhiễu của chính 5 lần đo sau. Kèm: sau một lần đăng nhập thật, `GET /sach` từ
trình duyệt khác là `HIT` (mốc: chưa đo; đây là phép kiểm biên độ của `("/", "layout")`).

**Ghi chú và phép đo cho chênh lệch đăng ký (2–3 s) so với đăng nhập và đăng xuất
(tức thì).**
- **GIẢ THUYẾT:** chênh lệch này đến từ **thứ tự** thao tác, không phải bản chất thao
  tác. Đăng ký chạy trước nên trả tiền cho lần dựng lại cache của `/`; đăng nhập sau
  hưởng cache đã ấm. Cả ba action đều gọi `revalidatePath`.
- **PHÉP ĐO ĐỂ BÁC BỎ:** sau khi xong đợt, đo lại theo thứ tự **ngược lại** (đăng nhập
  trước, đăng ký sau). Nếu lúc đó đăng nhập thành 2–3 s và đăng ký nhanh thì giả
  thuyết đúng; nếu đăng ký vẫn chậm hơn thì chênh lệch là bản chất thao tác, không
  phải thứ tự.
- **Hai điểm cần giữ khi diễn giải, rút từ số đo 01/10 (không thay đổi giả thuyết):**
  (a) dựng lại cache `/` chỉ tốn thêm khoảng 0,6 s ở vùng `hnd1` (`REVALIDATED`
  0,83 s so với `HIT` 0,21 s), nhỏ hơn 2–3 s; (b) vì đăng nhập cũng gọi
  `revalidatePath("/", "layout")`, nó cũng phải trả chi phí dựng lại, nên nếu giả
  thuyết thứ tự đúng thì phần chi phí chỉ trả một lần phải đến từ nguồn khác, ví dụ
  khởi động lạnh của hàm hoặc kết nối đầu tiên tới Supabase.
- **Giả thuyết cạnh tranh:** khởi động lạnh của hàm (thao tác đầu tiên sau một lúc
  không có request). Để tách hai nguyên nhân, làm nóng hàm trước mỗi lần đo (ít nhất
  5 lượt tải trang trong 1 phút ngay trước đó) và ghi rõ đã làm hay chưa.
- **Ứng viên thứ ba, đã đo bằng log (01/10): `signUp` vốn chậm hơn `signInWithPassword`**
  (băm mật khẩu bằng bcrypt cộng ghi `auth.users`, `auth.identities` và trigger
  `handle_new_user` chèn vào `profiles`). `origin_time` ở cạnh Supabase, chỉ đọc log
  hosted, các lần gọi từ Vercel:

  | Lời gọi | 30/09 (hàm ở `iad1`) | 01/10 (hàm ở `hnd1`) |
  |---|---|---|
  | `POST /auth/v1/signup`, 200 | 236, 356, 595 ms; 3270 ms ở lần đầu sau lúc im (11:33, năm phút sau là 236 ms) | **448 ms** (n = 1) |
  | `POST /auth/v1/token?grant_type=password`, 200 | không có lần thành công nào | **173 ms** (n = 1) |
  | cùng lời gọi `token`, sai mật khẩu (400) | 284, 298, 327, 507 ms | không có |
  | `POST /auth/v1/logout`, 204 | 198 ms | 46 và 13 ms |

  Chênh lệch `signup` so với `token` ở `hnd1`: **+275 ms** (448 so với 173), mỗi bên
  chỉ một mẫu. Mẫu quá nhỏ để coi là hằng số, nhưng cùng chiều với việc `signup` làm
  nhiều ghi hơn.
- **Xếp theo mức tin dựa trên số đo** (giải thích được bao nhiêu trong 2–3 s):
  1. **`signUp` chậm hơn `signIn`: có số đo trực tiếp, giải thích ~0,28 s** (n = 1 mỗi
     bên). Đây là phần duy nhất giải thích được *chênh lệch* giữa hai thao tác.
  2. **Dựng lại cache `/`: có số đo trực tiếp (5 vòng), ~0,62 s** (`REVALIDATED`
     0,71–0,98 s so với `HIT` 0,21 s). Áp dụng cho cả đăng nhập (cùng
     `revalidatePath`) nên giải thích thời gian *chung*, không giải thích chênh lệch.
  3. **Khởi động lạnh: chưa đo ở Vercel**; chỉ có một dấu hiệu gián tiếp ở Supabase
     (3270 ms ở lần đầu sau lúc im so với 236 ms năm phút sau, một cặp mẫu). Mức tin
     thấp nhất, nhưng là ứng viên duy nhất đủ lớn.
  Phần đo được cộng lại khoảng 0,9 s trên 2–3 s, **còn ≥ 1,1 s chưa có số đo**.
- **Phép đo tiếp theo** (người dùng làm, "Preserve log" tắt): với một lần đăng ký thật,
  ghi cột Name / Status / Time của từng request (POST action, các GET RSC `/?chao=1`)
  để biết đoạn nào chiếm 2–3 s. Không gửi HAR vì chứa cookie phiên.

## 5. Hạng mục 2 — Bỏ `router.refresh()` thừa

**Hiện trạng.** `LoginForm.tsx` dòng 89–90 và `RegisterForm.tsx` dòng 135–136 gọi
`router.push(đích)` rồi `router.refresh()` liền nhau. Nhưng action đã làm client làm
mới (cookie đổi), và `router.push` đến sau huỷ phần cập nhật của action đang chờ
(`app-router-instance.js` dòng 147–154), nên ba thao tác chồng nhau.

**Mốc trước khi sửa** (cục bộ, bấm nút tới khi vào trang đích, 8 lần: hai mức độ trễ
×2 lần ×2 luồng):
- Số POST action: 1 ở mọi lần.
- Số request RSC không prefetch (tới `/?chao=1` ở đăng ký, `/` ở đăng nhập): 2–3
  (đăng ký: 2, 3, 3, 3; đăng nhập: 3, 3, 2, 3).
- **Hai request cùng URL gửi cùng một thời điểm** (cùng mili giây): 6/8 lần.
- Request prefetch trong cùng lần đo (đối chứng của bộ lọc): 17–28.

**Hoàn thành khi.**
2.1. Số request RSC không prefetch từ lúc bấm nút tới khi vào trang đích ≤ 2, và
không có hai request cùng URL trong cùng 10 ms, 10/10 lần mỗi luồng (đăng ký,
đăng nhập). Mốc: 2–3 và 6/8. Đối chứng: số request prefetch cùng lần đo > 0.
2.2. Hành vi giữ nguyên, 10/10 lần: header ở trang đích đúng (mục 3); đăng ký hiện
dải chào mừng, đăng nhập không hiện (đối chứng của nhau).
2.3. Tiêu chí 1.2 vẫn đạt sau khi làm mục này.

**Sàn kỹ thuật của cách làm này là 2 request, không phải 1 (đo 01/10 sau khi làm).**
Sau khi bỏ `router.refresh()`, mỗi lần đăng ký hoặc đăng nhập vẫn còn 1–2 request RSC
không prefetch tới đúng trang đích (10 lần mỗi luồng, trung vị 2), tuần tự chứ không
đồng thời (~325 ms rồi ~585 ms ở +160 ms/vòng). Request thứ hai không phải của
`LoginForm`: một Server Action đã revalidate (ở đây do đổi cookie) bị `router.push`
huỷ thì Next đặt `needsRefresh` và tự phát một lượt làm mới khi hàng đợi rảnh
(`next/dist/client/components/app-router-instance.js` dòng 76–92). Muốn còn 1 phải
đổi cấu trúc (ví dụ `redirect()` ngay trong action), nhưng khi đó `mergeGuestCart()`
và `track()` ở client không chạy; không nằm trong phạm vi hạng mục này.

## 6. Hạng mục 3 — Giảm prefetch ở trang chủ và trang danh mục

**Trạng thái: HẠ CẤP (01/10). Chỉ làm nếu tiêu chí 3.3 vẫn trượt sau khi xong hạng
mục 4.**

**Lý do hạ cấp.** Sau khi đổi vùng, mỗi `getUser()` còn khoảng 15 ms (trung vị; p90
27,9 ms, tối đa 386 ms, đo ở log Supabase 01/10 06:22–06:24 UTC, 72 lần) thay vì
155–195 ms. Hai mươi lần cộng dồn là khoảng 300 ms phía server chứ không phải 3 s.
Hạng mục 4 đã cắt phần lớn tải đó mà không đụng tới trải nghiệm. Prefetch cho điều
hướng tức thì có giá trị thật với người xem portfolio.

**Nếu phải làm:** dùng prefetch theo ý định (rê chuột / chạm), **không** dùng
`prefetch={false}` toàn bộ.

**Hiện trạng.** `BookCard` (`components/BookCard.tsx:59`) dùng `<Link>` không đặt
`prefetch`, nên prefetch theo khung nhìn. Trang chủ có 46 liên kết nội bộ (31 `href`
khác nhau: 31 tới `/sach…`, 10 tới `/tu-sach…`, 3 tới `/dang-nhap`, 1 tới `/gio-hang`,
1 tới `/`). Mọi request prefetch đều mang `next-router-prefetch: 1`
(14/14, 16/16, 22/22, 24/24 ở các lần đo).

**Mốc trước khi sửa** (tải xong và chờ yên 3 s, rồi cuộn hết trang):

| Trang | Chưa đăng nhập, preview | Đã đăng nhập, cục bộ |
|---|---|---|
| `/` | 41 request, 14 prefetch; sau cuộn 43, 16 | 47, 22; sau cuộn 49, 24 |
| `/sach` | 40, 13; sau cuộn 47, 19 | 39, 13; sau cuộn 46, 19 |
| `/tu-sach` | 39, 15 (cuộn không đổi) | 39, 14 |
| `/sach?category=van-hoc` | 38, 11; sau cuộn 45, 17 | chưa đo |
| `/dang-nhap` (tham khảo) | 45, 16 (cuộn không đổi) | chưa đo |

Mỗi ô là một lần chạy trên preview. Chưa đăng nhập, cục bộ, ở `/`: 41, 15; sau cuộn
43, 17. Màn hình 1920×1080 cuộn chậm (900 ms mỗi 300 px) ở `/` trên preview: 43, 16;
sau cuộn 45, 18. Nhiễu giữa các lần chạy: ±2 request.

**Số 132 / 223 request đã được giải thích (01/10).** Người dùng thấy 132 request (chưa
đăng nhập) và 223 request (đã đăng nhập) với "Finish" 49 s và 3,3 phút vì DevTools
bật "Preserve log": số cộng dồn qua nhiều lượt điều hướng, không phải một lượt tải.
Một lượt tải, đã đăng nhập, trên hosted (người dùng đo tay 01/10, "Preserve log" tắt):
**48 request, Finish 2,18 s, request chậm nhất 1,25 s (chính document), 1 request 404
`/gio-hang`, 1 lỗi Console.** Khớp 41–49 request và Finish 1,4–2,3 s đo ở đây (preview,
chưa đăng nhập).

**Hiện tượng chỉ có ở local (không chặn đợt).** Cục bộ, đã đăng nhập, tải `/`: 6
request prefetch `/_tree` hoàn tất sau 24,4–24,6 s (3/3 lần) dù dữ liệu tới ở 0,3 s;
`/sach` hoàn tất sau 0,6 s, `/tu-sach` 0,4 s. **Không tái hiện trên hosted** (đo tay
01/10: chậm nhất 1,25 s, không request nào quá 3 s). Giả thuyết giới hạn 6 kết nối
HTTP/1.1 của bản cục bộ (hosted chạy HTTP/2) được giữ nguyên; nguyên nhân ở local
chưa xác định.

**Bấm vào thẻ sách** (preview, 5 lần, trung vị [min–max]): URL đổi sau 23 ms khi
prefetch đã xong, h1 trang sách hiện sau 982 ms [728–1110]; bấm ngay lúc prefetch
chưa xong (mô phỏng không prefetch): URL đổi 270 ms [217–300], h1 hiện 604 ms
[531–612]. Nghĩa là bỏ prefetch không làm nội dung hiện chậm đi ở phép đo này, chỉ
làm URL đổi muộn hơn.

**Hoàn thành khi.** (3.1, 3.2, 3.4, 3.5 chỉ áp dụng nếu hạng mục này được kích
hoạt; 3.3 áp dụng cho cả đợt.)
3.1. Số request prefetch khi tải `/`, `/sach`, `/tu-sach`, `/sach?category=van-hoc`
(chưa đăng nhập, preview, 5 lần, sau chờ yên): ≤ 8 ở mỗi trang, cả trước và sau khi
cuộn hết trang. Mốc 11–19; ngưỡng thấp hơn mốc từ 3 (trang `/sach?category=…`,
trước cuộn: 11) tới 11 request, mỗi chênh lệch lớn hơn nhiễu ±2. Đối chứng: trước
khi sửa, cùng phép đo cho 11–19.
3.2. Cục bộ, đã đăng nhập, tải `/`: số request prefetch ≤ 8 (mốc 22–24).
3.3. **Không hồi quy** (đã ĐẠT SẴN trên hosted trước khi sửa). Hosted, đã đăng nhập,
tải `/`, một lượt tải, "Preserve log" tắt, người dùng đo tay. Mốc 01/10: 48 request,
Finish 2,18 s, request chậm nhất 1,25 s (chính document), không request nào quá 3 s.
Sau đợt: request chậm nhất ≤ 1,25 s + 20% = **1,50 s** và Finish ≤ 2,18 s + 20% =
**2,62 s**. Biên 20% do yêu cầu; mốc chỉ là một lần đo tay nên chưa có độ nhiễu. Theo
`CLAUDE.md`, đo ít nhất 5 lần để biết nhiễu trước khi dùng ngưỡng, và nếu nhiễu lớn
hơn 20% thì nâng ngưỡng lên ít nhất ba lần nhiễu. Đây là tiêu chí cho cả đợt; hạng
mục 3 chỉ được kích hoạt khi nó trượt sau hạng mục 4.
3.4. Bấm vào thẻ sách ở `/` (preview, 5 lần, trung vị): h1 trang sách hiện ≤ 1,2 s
(mốc 0,98 s với prefetch, 0,60 s không prefetch; nhiễu rộng nhất 0,38 s).
3.5. Điều hướng bằng bàn phím tới thẻ sách vẫn hoạt động (Tab tới thẻ, Enter): URL
đổi sang `/sach/<slug>` 5/5 lần. Đối chứng: thẻ không có `href` hợp lệ không điều
hướng.

## 7. Hạng mục 4 — `proxy.ts` bỏ qua request prefetch

**Ưu tiên: CAO NHẤT trong đợt (nâng lên 01/10).** Căn cứ: chưa đăng nhập 0 lần
`getUser()`; đã đăng nhập tải `/` là 17–19 lần; sau đăng ký/đăng nhập tới trang đích
là 19–24 lần. Mục này cắt tải đó mà không đụng tới trải nghiệm người dùng.

**Hiện trạng.** `proxy.ts` có matcher
`/((?!_next/static|_next/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)`,
nên mọi request tới trang, kể cả RSC prefetch, đi qua `updateSession()` và gọi
`getUser()`: một lượt gọi Auth cho mỗi request có phiên. Request prefetch phân biệt
được bằng header `next-router-prefetch: 1` (100% các lần đo). Quyết định 2A giữ
nguyên: proxy chỉ lo trải nghiệm, enforcement thật ở Server Component và RLS.

**Mốc trước khi sửa.**
- Cục bộ, đã đăng nhập, tải `/`: 17 lần `GET /auth/v1/user` (chờ yên), 19 (sau cuộn);
  `/sach`: 14 và 20; `/tu-sach`: 15. Chưa đăng nhập: 0.
- Cục bộ, tới trang đích sau đăng ký/đăng nhập: 19, 21, 21, 21, 22, 21, 22, 24 lần
  (8 lần đo); đăng xuất: 1 lần (`getUser`) + 1 `logout`.
- Hosted (log Supabase 30/09, vùng `iad1`): khoảng 30 lần `GET /auth/v1/user` trong
  10–20 giây đầu sau mỗi lần đăng nhập/đăng ký, mỗi lần `origin_time` 155–195 ms.
- Hosted sau khi đổi vùng (log Supabase 01/10 06:22–06:24 UTC, người dùng đo tay đã
  đăng nhập): 72 lần `GET /auth/v1/user` trong khoảng 2 phút, `origin_time` trung vị
  15 ms, p90 27,9 ms, tối đa 386 ms. Mỗi lần rẻ hơn ~10 lần so với trước khi đổi vùng;
  số lần gọi thì không đổi.

**Cách làm.** Request có `next-router-prefetch: 1` không đi qua proxy, nên không gọi
`getUser()` và không làm mới cookie. Đường dẫn được bảo vệ (`/tai-khoan`, `/admin`)
**không được miễn**: prefetch tới đó vẫn chạy đầy đủ logic chuyển hướng.

**Cơ chế: `config.matcher` với `missing`, KHÔNG kiểm header trong hàm `proxy`.** Next xoá
các header Flight (`rsc`, `next-router-prefetch`...) khỏi `request` trước khi gọi proxy
(`node_modules/next/dist/server/web/adapter.js` dòng 156–165; docs `proxy.md` mục "RSC
requests and rewrites"), nên `request.headers.get("next-router-prefetch")` luôn là
`null`. Bản đầu của hạng mục này kiểm header trong hàm và số đo **không đổi** (5 request
prefetch có phiên vẫn gọi `getUser()` 5 lần), rồi mới đổi sang `matcher`. Cách đúng là
một entry matcher cho mọi trang kèm `missing: [{ type: "header", key:
"next-router-prefetch" }]`, cộng hai entry riêng không điều kiện cho `/tai-khoan/:path*`
và `/admin/:path*`.

**Hoàn thành khi.**
4.1. Cục bộ, đã đăng nhập, tải `/`, `/sach`, `/tu-sach`: số `GET /auth/v1/user` ≤ 3
mỗi trang, cả khi chờ yên lẫn sau cuộn (mốc 14–20). Đối chứng của bộ đếm: tải
tài liệu `/` (không phải prefetch) có phiên vẫn gọi `getUser()` đúng 1 lần; chưa đăng
nhập đếm 0.
4.2. Cục bộ, tới trang đích sau đăng ký/đăng nhập: ≤ 4 lần `getUser()` (mốc 19–24).
4.3. **Enforcement không yếu đi** (đối chứng bắt buộc): chưa đăng nhập, `GET /tai-khoan`
và `GET /admin` (tài liệu) cho 307 tới `/dang-nhap?next=…` 2/2; cùng hai đường dẫn
với header `next-router-prefetch: 1` cũng 307 2/2 (không bị bỏ qua). Tiêu chí 24 của
spec 2B (customer 307 về `/`, admin 404) vẫn đạt. Mốc: đo lại cả ba trước khi sửa.
4.4. Không prefetch nào làm mới cookie: sau khi tải `/` có phiên chỉ bằng request
prefetch, cookie `sb-…-auth-token` không đổi (so giá trị trước và sau).

## 8. Hạng mục 5 — Trang `/gio-hang` tạm cho đợt 3

**Hiện trạng.** `components/Header.tsx:80` có `<Link href="/gio-hang">` (prefetch mặc
định), nhưng không có `app/gio-hang`. Đo: `GET /gio-hang` trả **404** ở cả tài liệu
lẫn RSC (preview và cục bộ). Mỗi lần tải `/`, `/sach`, `/tu-sach`,
`/sach?category=…` hoặc `/dang-nhap` có đúng **1 request 404** (`/gio-hang?_rsc=…`)
trên preview chưa đăng nhập; cục bộ cũng 1 ở `/`, `/sach`, `/tu-sach` cả hai trạng
thái. Mỗi lần có 1 dòng lỗi đỏ trong console ("Failed to load resource: 404").
Người dùng thấy 3 dòng lỗi đỏ ở trang chủ; đo được 1.

**Cách làm.** Một trang tĩnh tạm: tiêu đề, một câu nói giỏ hàng sẽ có ở đợt sau
(giọng NA Books, tiếng Việt), liên kết về `/sach`, `noindex`. Không làm logic giỏ.
Chỉ dùng token màu trong `@theme`.

**Hoàn thành khi.**
5.1. `GET /gio-hang` trả HTTP 200 ở cả tài liệu và RSC (mốc 404). Đối chứng:
`GET /gio-hang-khong-ton-tai` vẫn 404.
5.2. Tải `/`, `/sach`, `/tu-sach`, `/dang-nhap` ở cả hai trạng thái đăng nhập (đã
đăng nhập chỉ đo cục bộ): số request 404 = 0 (mốc 1 mỗi trang) và số dòng lỗi đỏ
trong console = 0 (mốc 1).
5.3. `/gio-hang` có `<meta name="robots" content="noindex">`. Đối chứng: `/sach`
không có.
5.4. Ở 375px không cuộn ngang; mọi vùng chạm ≥ 44×44 px; mọi cặp chữ/nền ≥ 4,5:1
(liệt kê từng cặp kèm tỷ số).
5.5. Liên kết "Giỏ hàng" ở header vẫn giữ `aria-label` ("Giỏ hàng", và có số lượng
khi giỏ khác rỗng).

## 9. Hoàn thành khi (cả đợt)

- Các tiêu chí 1.1–1.6, 2.1–2.3, 3.3, 4.1–4.4, 5.1–5.5 đều có số đo trong báo cáo (và
  3.1, 3.2, 3.4, 3.5 nếu hạng mục 3 được kích hoạt); tiêu chí nào không đạt ghi con
  số và lý do, không nới ngưỡng.
- Tiêu chí 3.3 (không hồi quy) đo lại sau hạng mục 4, ghi rõ một lượt tải và "Preserve
  log" tắt. Nếu trượt thì mới kích hoạt hạng mục 3.
- `npm run build` exit 0, `tsc` 0 lỗi, `lint` 0 lỗi.
- Tiêu chí 1 (hiệu năng) và 2 (nháy "Đăng nhập") của
  `buoc-2b1-xoa-nhay-trang-thai-header.md` không bị làm xấu đi (đo lại, ghi hai con
  số).
- Stack cục bộ và Docker tắt sau khi đo; tài khoản thử đã xoá; `git status` sạch.

## 10. Điều cần làm rõ trước khi code

Dừng lại và hỏi, đừng tự chọn, nếu gặp:

- **`("/", "layout")` trên hosted (tiêu chí 1.6).** Chỉ đo được bằng phiên thật do
  người dùng tạo.
- Một trong ba luồng ở tiêu chí 1.1 cho header sai sau khi bỏ `revalidatePath`:
  báo lại, đừng tự vá bằng cách đưa lệnh gọi trở lại.
- Hiện tượng request kéo dài hàng chục giây (xem dưới) **xuất hiện trên hosted**: khi
  đó mới dừng và điều tra; ở local thì không chặn.
- Tiêu chí 3.3 trượt sau hạng mục 4: kích hoạt hạng mục 3 (prefetch theo ý định), báo
  số đo trước khi làm.

**Không chặn đợt: hiện tượng 24,5 s ở `/` khi đã đăng nhập (chỉ ở local).** Nguyên nhân
ở local chưa xác định: server không chậm (cùng request bằng `curl` có phiên: 47–66 ms;
`fetch()` từ trong trang sau cơn bão prefetch: 2–66 ms), dữ liệu tới đủ ở 0,3 s, chỉ
phần kết thúc request bị giữ ~25 s. **Không tái hiện trên hosted** (đo tay 01/10: chậm
nhất 1,25 s, không request nào quá 3 s). Giả thuyết giới hạn 6 kết nối HTTP/1.1 của
bản cục bộ được giữ nguyên.

**Đã đóng / đã quyết (01/10).**
- **Số 132 / 223 request của người dùng: ĐÓNG.** Là số cộng dồn do DevTools bật
  "Preserve log", không phải một lượt tải. Kết quả một lượt tải, đã đăng nhập, hosted:
  48 request, Finish 2,18 s, request chậm nhất 1,25 s, 1 request 404 `/gio-hang`, 1
  lỗi Console. Không cần ảnh chụp Network nữa.
- **Cách giảm prefetch (hạng mục 3): ĐÃ QUYẾT.** Prefetch theo ý định (rê chuột / chạm),
  không `prefetch={false}` toàn bộ.

## 11. Chưa lên lịch

**N+1 ở trang chủ.** Mỗi lần trang chủ được tái tạo (sau `revalidatePath`, hoặc khi
cache hết hạn), Vercel gửi khoảng 25–30 truy vấn PostgREST tới Supabase, xếp thành
4–5 bậc nối tiếp, cho một trang chỉ có 40 cuốn sách. Ví dụ một chuỗi đo ở log
Supabase 30/09: `books?slug=in.(…)` rồi `categories?id=eq.…` rồi `categories?id=eq.…`,
mỗi bậc cách nhau ~0,7 s khi hàm ở `iad1`.

Đây là nguyên nhân gốc của độ chậm; **đổi vùng hàm sang `hnd1` chỉ che bớt chứ không
chữa.** Số đo sau khi đổi vùng: PostgREST từ Vercel trung vị 12,5 ms, p90 23,7 ms,
tối đa 254 ms (384 request); tái tạo `/` sau action còn 0,71–0,98 s so với 0,2 s khi
cache `HIT`, tức mỗi lần cache bị vô hiệu vẫn trả một chi phí gấp ~4 lần. Chưa lên
lịch; cần gộp truy vấn (một lần lấy sách kèm danh mục và tủ sách) trước khi cache
bị vô hiệu thường xuyên hơn, ví dụ khi đợt 6 có quản trị viên sửa sách.

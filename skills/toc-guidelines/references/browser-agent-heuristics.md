# Heuristic điều khiển trình duyệt — cách lái một tab được chia sẻ cho hiệu quả

> Dành cho **chính agent** (không phải phần giải thích cho người dùng cuối): các quy tắc đã kiểm chứng
> thực tế khi dùng bộ công cụ extension trình duyệt (`BROWSER_*`) trên trang lạ, trình xem tài liệu và
> trang có paywall. Đọc [`browser-extension-guide.md`](browser-extension-guide.md) trước để biết
> extension là gì, người dùng kết nối và chia sẻ tab ra sao; file này nói về **cách dùng nó cho tốt một
> khi đã có tab để thao tác**.

Các nguyên tắc đã kiểm chứng thực tế để lái trình duyệt hiệu quả qua bộ công cụ `tryopenclaw-connectors`
(`BROWSER_*`), đúc kết từ việc lùng nội dung bên trong các trang lạ, trình xem tài liệu và trang paywall.
Đây không phải một kịch bản cứng: mục tiêu là quyết định bước tiếp theo dựa trên tín hiệu bạn thực sự
quan sát được, chứ không chạy theo một luồng if-else định sẵn.

## Các công cụ có sẵn (tên thật, không phải tên minh hoạ)

`BROWSER_STATUS` · `BROWSER_LIST_TABS` · `BROWSER_OPEN_TAB` · `BROWSER_CLOSE_TAB` · `BROWSER_NAVIGATE` · `BROWSER_SNAPSHOT` · `BROWSER_READ` · `BROWSER_CLICK` · `BROWSER_FILL` · `BROWSER_SELECT` · `BROWSER_CHECK` · `BROWSER_SCROLL` · `BROWSER_SCREENSHOT` · `BROWSER_KEY` · `BROWSER_HOVER` · `BROWSER_BATCH` (gộp tối đa 6 công cụ trên vào một lần gọi — xem mục 13) — cùng với `openclaw_web_fetch` (lấy nội dung trang mà không cần mở tab).

`BROWSER_STATUS` là cách read-only, không side-effect để biết extension đã ghép nối và đang online chưa — trả về `{paired, connected, lastSeenAt, sharedTabCount}`. Gọi nó khi một task trình duyệt fail hoặc trước khi nói bất kỳ điều gì với user về trạng thái extension; đừng suy đoán trạng thái pairing từ lỗi của tool khác. `paired:false` → hướng dẫn cài + ghép nối; `paired:true, connected:false` → extension ĐÃ ghép nối, chỉ đang không hoạt động — bảo user mở Chrome, vào `chrome://extensions/` tải lại extension và đảm bảo nó được bật, tuyệt đối đừng bảo cài lại hay ghép nối lại; `connected:true` → làm việc tiếp (`BROWSER_OPEN_TAB` dùng được ngay cả khi `sharedTabCount` = 0).

**Giới hạn thực tế phải nhớ**: `BROWSER_CLICK` / `BROWSER_FILL` chỉ nhận `ref` (từ `BROWSER_SNAPSHOT`) hoặc CSS `selector` — **không có tham số toạ độ (x, y)**. Không có công cụ tìm-trong-trang và không có công cụ đọc network request. `BROWSER_CLICK` chỉ click chuột trái (`clickCount:2` để double-click; không có right-click). `BROWSER_HOVER` làm hiện UI chỉ-xuất-hiện-khi-hover (menu thao tác trên hàng, tooltip, dropdown) — hover phần tử cha, rồi snapshot hoặc click phần tử vừa hiện. Native `<select>` là trường hợp đặc biệt — `BROWSER_CLICK` mở popup do OS vẽ mà bạn không click được; dùng `BROWSER_SELECT` thay vào. Checkbox / radio / toggle switch: dùng `BROWSER_CHECK` (`checked:true`/`false`), không dùng `BROWSER_CLICK` (xem mục 14). `BROWSER_KEY` nhấn một phím điều hướng (Enter, Escape, Tab, phím mũi tên, Backspace, PageUp/PageDown, Home/End) — không có tổ hợp phím modifier, và nó không bao giờ gõ chữ (`BROWSER_FILL` gõ chữ nhưng không bao giờ nhấn Enter; để submit một ô không có nút bấm, dùng `BROWSER_FILL` rồi `BROWSER_KEY` Enter với cùng `ref`/`selector`). Với nội dung không phải DOM thật (ảnh/canvas thuần), việc tương tác chỉ giới hạn ở các control DOM thật bao quanh nó, nếu có — xem mục 3.

## Checklist nhanh khi vừa đáp xuống một trang lạ

1. Chạy `BROWSER_SNAPSHOT` (cấu trúc + ref) hoặc `BROWSER_SCREENSHOT` (hình ảnh) trước, để biết mình đang đối mặt với cái gì trước khi chọn công cụ tiếp theo.
2. Kiểm tra ngay: trang có đòi đăng nhập, CAPTCHA, hay bước thanh toán không? Nếu có, xem "Ranh giới an toàn" bên dưới — đừng tìm cách lách bằng heuristic; dừng lại và hỏi người dùng.
3. Có banner cookie/consent hay popup chặn không? Dọn nó trước (`BROWSER_SNAPSHOT` để tìm ref của nút từ chối, rồi `BROWSER_CLICK` — chọn phương án bảo vệ quyền riêng tư nhất, từ chối cái không bắt buộc).
4. Nội dung là text/DOM thật, ảnh/canvas, hay SPA tải động? Dò rẻ tiền bằng `BROWSER_READ` / `BROWSER_SNAPSHOT` (rẻ hơn hẳn `BROWSER_SCREENSHOT`) — xem mục 3 để biết cách phân biệt ba trường hợp.
5. Trang đích có điều hướng riêng của nó không (ô nhảy trang, tìm kiếm trong app, mục lục)? Ưu tiên tìm ref của nó qua `BROWSER_SNAPSHOT` rồi dùng `BROWSER_FILL` / `BROWSER_CLICK`, thay vì tự lặp `BROWSER_SCROLL` / `BROWSER_CLICK`. Với ô nhảy-trang hoặc ô tìm-kiếm-khi-gõ, truyền `mode:"type"` cho `BROWSER_FILL` (xem mục 14).
6. Biết trước điều kiện dừng (một mốc dễ nhận ra) để không đọc lố qua mục tiêu, và biết ngưỡng bỏ cuộc nếu bị kẹt (xem "Ngưỡng thử lại").

## Ranh giới an toàn — luôn dừng; không heuristic nào được vượt qua

Các heuristic trong skill này tồn tại để *tìm và đọc nội dung* hiệu quả hơn. Chúng không bao giờ được dùng để vượt qua các ranh giới dưới đây. Khi chạm phải, dừng ngay và báo lại người dùng thay vì tìm cách "leo thang":

- **Tường đăng nhập / yêu cầu tài khoản**: không tạo tài khoản, và không nhập mật khẩu hay thông tin đăng nhập của người dùng, kể cả khi đã được cung cấp trước đó.
- **CAPTCHA / cơ chế chống bot**: không tìm cách giải hay vượt qua.
- **Thanh toán / đăng ký gói / thông tin thẻ**: không bao giờ tự thực hiện, kể cả khi có "dùng thử miễn phí".
- **Paywall mở-khoá-miễn-phí hợp lệ** (ví dụ "xem quảng cáo để mở khoá") thì được dùng — đó không phải ranh giới cấm. Ranh giới là bất cứ thứ gì đòi thanh toán hoặc tài khoản.

## 1. Leo thang từ rẻ đến đắt (progressive escalation)

Luôn thử phương án rẻ/nhanh trước, chỉ chuyển sang phương án đắt hơn khi cái rẻ đã rõ ràng thất bại:

- `openclaw_web_fetch` (không cần tab) trước `BROWSER_OPEN_TAB`.
- `BROWSER_READ` / `BROWSER_SNAPSHOT` (text/DOM) trước `BROWSER_SCREENSHOT` (tốn nhiều token hơn hẳn, và model phải "nhìn" một tấm ảnh).
- Tính năng tìm kiếm / nhảy-trang có sẵn của trang đích (qua ref từ `BROWSER_SNAPSHOT`) trước khi tự lặp vòng `BROWSER_CLICK` / `BROWSER_SCROLL`.
- Một chuỗi hành động đã lên kế hoạch trước (xem mục 13) qua `BROWSER_BATCH` trước khi bắn từng hành động một.

Mỗi bước thất bại là dữ liệu loại bớt một phương án, không phải công sức phí phạm.

## 2. Vòng lặp Observe → Act → Observe (Quan sát → Hành động → Quan sát)

Không bao giờ giả định trạng thái sau một hành động — luôn kiểm tra lại (`BROWSER_SCREENSHOT` / `BROWSER_SNAPSHOT`) trước khi quyết định bước tiếp theo, đặc biệt sau `BROWSER_NAVIGATE`, `BROWSER_CLICK`, hoặc bất cứ khi nào trang có thể vẫn đang tải (spinner, trang trắng). Một trang trắng ngay sau khi navigate thường có nghĩa là nó vẫn đang tải — chờ một nhịp rồi kiểm tra lại thay vì kết luận là đã thất bại.

## 3. Chọn công cụ theo loại nội dung (ba trường hợp, không phải hai)

- **DOM/text thật** (trang HTML thường, bài viết, form) → `BROWSER_READ` (text dài, cả trang hoặc một phần tử cụ thể theo `ref`/`selector`), `BROWSER_SNAPSHOT` (có những phần tử tương tác nào, và `ref` của chúng để `BROWSER_CLICK` / `BROWSER_FILL` chính xác).
- **Ảnh/canvas** (trình xem PDF/scan, tài liệu render từng trang thành ảnh, app vẽ) → DOM không có gì để đọc; dùng `BROWSER_SCREENSHOT` và soi kỹ ảnh trả về (model "zoom" bằng cách đọc ảnh cẩn thận — không có công cụ zoom riêng). Dấu hiệu: `BROWSER_SNAPSHOT` / `BROWSER_READ` trả về rất ít hoặc không có node text nào có nghĩa dù ảnh chụp rõ ràng có chữ. **Giới hạn quan trọng**: `BROWSER_CLICK` / `BROWSER_FILL` không hỗ trợ click theo toạ độ (x, y) — bạn chỉ tương tác được với control DOM thật quanh vùng ảnh/canvas (ví dụ nút "trang sau" hay "bỏ qua quảng cáo", nếu chúng là phần tử HTML thật; tìm ref qua `BROWSER_SNAPSHOT`). Bạn không thể click vào một điểm bất kỳ bên trong ảnh/canvas.
- **SPA tải động / lazy-load / cuộn vô hạn** (React, Vue, ...) → DOM có tồn tại, nhưng nội dung chưa render lúc vừa vào, hoặc chỉ render phần đang hiện trên màn hình. Dấu hiệu: `BROWSER_READ` / `BROWSER_SNAPSHOT` trả về ít nội dung hơn hẳn so với những gì `BROWSER_SCREENSHOT` cho thấy. Cách xử lý: `BROWSER_SCROLL` (wheel input thật, kích hoạt đúng cơ chế lazy-load) rồi `BROWSER_READ` / `BROWSER_SNAPSHOT` lại — không có công cụ đọc network request để đi tắt qua API.

## 4. Coi bất thường là tín hiệu, không chỉ là lỗi để bỏ qua

Một kết quả lạ (không có kết quả tìm kiếm nào, một lỗi công cụ lặp lại, một trang trống bất ngờ) luôn mang thông tin về hệ thống bạn đang tương tác. Trước khi thử lại một cách mù quáng, hãy hỏi: "kết quả này nói gì về cấu trúc hay trạng thái của trang?" và điều chỉnh chiến lược cho phù hợp.

## 5. Dùng kiến thức nền để lập giả thuyết, rồi xác minh — điểm cộng, không bắt buộc

Khi bạn đã biết cấu trúc hay quy ước điển hình của loại tài liệu đang xử lý (ví dụ sách giáo khoa thường có phần tóm tắt ở đầu hoặc cuối; app thường có tìm kiếm hoặc mục lục), hãy lập giả thuyết về vị trí khả dĩ và nhảy thẳng tới đó để kiểm tra, thay vì duyệt tuần tự từ đầu.

Heuristic này chỉ có lợi khi bạn thực sự có "tiên nghiệm" đúng cho lĩnh vực đó. Ở một lĩnh vực hoàn toàn xa lạ (không có kiến thức nền để đoán), đừng gượng ép một giả thuyết — quay về các nguyên tắc chung (1-4, 6-10) và khám phá có hệ thống thay vì đoán mò.

## 6. Tận dụng tính năng sẵn có của trang đích

Hầu hết trình xem và app đều có điều hướng riêng (ô nhảy-trang, tìm kiếm trong app, breadcrumb, mục lục). Tìm ref của nó qua `BROWSER_SNAPSHOT` rồi dùng `BROWSER_FILL` / `BROWSER_CLICK` một lần (hoặc `BROWSER_FILL` + `BROWSER_KEY` Enter khi ô tìm kiếm không có nút bấm) — luôn nhanh và chính xác hơn tự động hoá bằng hàng chục lần nhấn "next" qua `BROWSER_CLICK` hay `BROWSER_SCROLL` từng chút.

## 7. Dọn chướng ngại trước tiên

Banner cookie/consent, popup quảng cáo, và modal đăng nhập hầu như luôn xuất hiện đầu tiên trên một trang lạ và chặn mọi thứ phía sau. Xử lý chúng (chọn phương án bảo vệ quyền riêng tư nhất cho banner cookie) ngay khi vừa đáp xuống, trước khi làm task chính. Cách rẻ nhất để thử với một modal/popup là `BROWSER_KEY` Escape; nếu nó vẫn còn, tìm ref nút đóng qua `BROWSER_SNAPSHOT` rồi `BROWSER_CLICK`. Những nút chỉ xuất hiện khi hover (menu ⋮ trên hàng, thao tác trên card) cũng không phải là chướng ngại — `BROWSER_HOVER` vào hàng đó, rồi `BROWSER_SNAPSHOT`/`BROWSER_CLICK` nút vừa hiện ra. Nếu modal là tường đăng nhập cứng (không đóng được để xem nội dung) → xem "Ranh giới an toàn".

## 8. Xác minh dữ liệu quan trọng trước khi chốt

Với bất kỳ dữ liệu nhỏ hoặc dễ đọc nhầm (con số, ký tự phiên âm, chữ nhỏ trong ảnh), zoom vào / đọc lại ít nhất một lần trước khi báo kết quả cuối — nhất là khi cái giá của đọc nhầm lớn hơn hẳn cái giá của một lần nhìn thêm.

## 9. Giữ trạng thái phiên; tránh reset không cần thiết

Mỗi lần `BROWSER_NAVIGATE` mới có thể vứt đi tiến độ bạn đã đạt được (phải đóng lại banner cookie, mở lại paywall, ...). Chỉ navigate lại khi thực sự cần; ưu tiên tiếp tục trên `tabId` hiện có (`BROWSER_LIST_TABS` để lấy lại nếu lỡ mất dấu) thay vì dựng lại mọi thứ bằng `BROWSER_OPEN_TAB` / `BROWSER_NAVIGATE`.

## 10. Bám chặt mục tiêu và một điều kiện dừng rõ ràng

Trước khi bắt đầu khám phá, hãy định nghĩa cái mốc nghĩa là "đã tới" (ví dụ đúng tiêu đề hoặc mục bạn đang tìm). Một khi thấy nó, ngừng lang thang và chuyển sang trích xuất/xử lý thay vì đọc sâu thêm vào nội dung không liên quan.

## 11. Ngưỡng thử lại — biết khi nào dừng và hỏi người dùng

Đặt một ngân sách thử hợp lý (ví dụ, sau khoảng 15-20 hành động mà không tiến gần mục tiêu). Nếu vượt ngưỡng mà vẫn kẹt, dừng lại, tóm tắt những gì đã thử, và hỏi người dùng thay vì lặp lại cùng một chiến lược vô tận. Không có ngưỡng này, agent có thể loop thử-và-sai mãi mãi khi lĩnh vực không hành xử như dự đoán (ví dụ khi giả thuyết ở mục 5 trỏ sai chỗ).

## 12. Đọc lỗi công cụ theo đúng nghĩa đen — có lỗi nghĩa là "dừng", không phải "thử lại"

Các công cụ trình duyệt trả về thông báo lỗi cụ thể khi kết nối debugger tới tab bị mất. Coi chúng là chỉ dẫn, không phải nhiễu tạm thời:

- **"…debugger detached from tab …"** → kết nối tới tab đã mất và một lần tự re-attach đã thất bại. Gọi `BROWSER_LIST_TABS` một lần để làm mới danh sách tab, rồi thử lại hành động **đúng một lần**. Nếu vẫn lỗi, dừng và báo người dùng.
- **"…another extension injected a restricted frame…"** (thường là trình quản lý mật khẩu như Bitwarden/1Password, hoặc AI sidebar/dịch, trên trang có form đăng nhập) → chính Chrome đang từ chối truy cập tab này. **Không lần thử lại nào giúp được.** Nói thẳng với người dùng loại extension nào đang chặn, đề nghị họ tắt nó cho profile Chrome này (hoặc dùng một profile riêng cho agent), rồi chờ họ — đừng đập vào tab liên tục và đừng chuyển sang công cụ browser khác để "lách".
- **"Tab … is still attaching…"** → thực sự tạm thời (tab vừa mở hoặc đang điều hướng). Chờ vài giây rồi thử lại; bỏ cuộc sau 2-3 lần và báo.
- **"Tab … is no longer shared with this workspace"** → người dùng đã bỏ chia sẻ hoặc đóng tab. Đề nghị họ chia sẻ lại (xem hướng dẫn extension); đừng tự mở tab mới thay họ trừ khi task cho phép.
- **"No browser extension is connected…"** → đừng vội kết luận: gọi `BROWSER_STATUS` để phân biệt "chưa từng ghép nối" với "ghép nối rồi nhưng trình duyệt đang offline", rồi hướng dẫn user đúng ca (xem "Các công cụ có sẵn" ở trên).
- Một lỗi **"Timeout … exceeded"** thuần, không kèm các thông báo trên, thường nghĩa là trang thực sự đang bận (animation nặng, tải mãi không xong). Ưu tiên `BROWSER_READ` hơn `BROWSER_SNAPSHOT`/`BROWSER_SCREENSHOT` trên các trang như vậy, chờ một nhịp giữa các hành động, và áp dụng ngưỡng thử lại ở mục 11.
- **"…ran out of its time budget before this step could run"** (chỉ từ `BROWSER_BATCH`) → batch có quá nhiều hoặc quá chậm để lọt ngân sách thời gian nội bộ của nó. Đừng thử lại nguyên batch như cũ — tách thành batch nhỏ hơn, hoặc chạy các bước còn lại từng lần một.
- **"The selector matched several elements, so nothing was done"** → CSS selector của bạn mơ hồ. Dùng `ref` từ `BROWSER_SNAPSHOT` cho đúng phần tử, hoặc một selector cụ thể hơn. Không có gì bị click/fill cả.
- **"Another element is covering the target …"** → một modal/backdrop, thanh dính (sticky) hoặc panel đang che phần tử. **Cú click có thể đã trúng rồi** (điển hình: click một hàng làm mở dialog, rồi backdrop của dialog che luôn hàng đó). `BROWSER_SNAPSHOT` trước — nếu một dialog giờ đang mở, làm việc trong đó; đừng click lại hàng đó. Nếu không, đóng lớp che (`BROWSER_KEY` Escape) hoặc `BROWSER_SCROLL`, rồi thử lại một lần.
- **"The element exists but never became visible/interactable"** → nó đang bị ẩn, thu gọn, hoặc chỉ hiện khi hover. `BROWSER_HOVER` vào hàng/menu cha của nó, hoặc `BROWSER_SCROLL` cho nó vào tầm nhìn, rồi `BROWSER_SNAPSHOT` lại trước khi thử lại — đừng lặp lại đúng cú click cũ.
- **"No element matched — the ref is stale … or the selector is wrong"** → trang đã đổi kể từ snapshot gần nhất. Chạy `BROWSER_SNAPSHOT` lại và dùng `ref` mới; không bao giờ tái dùng ref xuyên qua một lần navigate.

- **"[fill_typing_timeout] Typed N of M characters…"**, **"[fill_needs_typing_too_long] …"**, **"[fill_needs_typing_multiline] …"** (từ `BROWSER_FILL`) → ô cần gõ từng phím và văn bản không thể gõ hết. Đọc xem thông báo nói ô **đã được xoá sạch** (khi đó trong ô không còn gì) hay **KHÔNG xoá được** (khi đó chạy `BROWSER_READ`/`BROWSER_SNAPSHOT` lên ô đó trước — nó có thể còn giữ chữ gõ dở). Dù trường hợp nào: **đừng nhấn Enter hay click Gửi**; rút ngắn văn bản, tách thành nhiều lần `BROWSER_FILL`, hoặc bỏ xuống dòng. Không bao giờ thử lại y hệt lệnh cũ. Xem mục 14.

## 13. Gộp một chuỗi hành động đã lên kế hoạch trước bằng `BROWSER_BATCH`

Khi bạn đã biết chính xác chuỗi 2-6 hành động cần chạy trên MỘT tab đã mở sẵn, và mọi `ref`/`selector` mà các hành động đó cần đều đã biết — gộp chúng vào một lần gọi `BROWSER_BATCH` thay vì bắn từng cái. Trường hợp điển hình: bạn đã chạy `BROWSER_SNAPSHOT` và biết ref của hai ô form và một nút submit — `BROWSER_FILL` → `BROWSER_FILL` → `BROWSER_CLICK` → `BROWSER_SCREENSHOT` trong một lần gọi thay vì bốn.

`BROWSER_BATCH` chỉ nhận các công cụ thao-tác-trên-tab (`BROWSER_NAVIGATE`, `BROWSER_CLICK`, `BROWSER_FILL`, `BROWSER_SELECT`, `BROWSER_CHECK`, `BROWSER_KEY`, `BROWSER_HOVER`, `BROWSER_READ`, `BROWSER_SNAPSHOT`, `BROWSER_SCROLL`, `BROWSER_SCREENSHOT`) với một `tabId` khai một lần ở top-level — không nhận `BROWSER_OPEN_TAB`/`BROWSER_CLOSE_TAB`/`BROWSER_LIST_TABS`, và không nhận chính nó.

Điều làm nó an toàn, và khi nào KHÔNG nên dùng:

- **Mọi `ref` bên trong batch phải đến từ một `BROWSER_SNAPSHOT` chạy TRƯỚC batch — không bao giờ từ một `BROWSER_SNAPSHOT` là chính một bước trong batch đó.** Cả chuỗi được lên kế hoạch trước một lần; một bước không thể phản ứng theo cái mà bước trước trong cùng batch vừa phát hiện. Nếu hành động tiếp theo thực sự phụ thuộc vào kết quả snapshot/read chưa có, chạy riêng bước đó trước, rồi mới gộp phần còn lại một khi đã biết ref.
- Nếu một trong các hành động là `BROWSER_NAVIGATE`, đừng dựa vào `ref` ở bất kỳ hành động nào sau nó trong cùng batch — ref gắn với trang lúc nó được chụp, và navigate làm nó mất hiệu lực. Dùng CSS `selector` cho mọi thứ sau `BROWSER_NAVIGATE`, hoặc đặt `BROWSER_NAVIGATE` làm hành động cuối cùng trong batch.
- `BROWSER_BATCH` dừng ở hành động lỗi đầu tiên và báo bước nào lỗi — kiểm tra cái đó trước khi giả định các bước sau đã chạy. Một bước `BROWSER_FILL` lỗi cũng dừng batch và thường để lại ô đã bị xoá sạch — nên một `BROWSER_KEY` Enter hay một `BROWSER_CLICK` submit dự tính chạy sau nó sẽ không chạy; đừng "hoàn tất" batch bằng cách tự submit mà không kiểm tra lại ô.
- **Không bao giờ gộp một hành động công khai/không-hoàn-tác** (đăng bài, gửi, thanh toán, xoá, ...) vào cùng batch với các bước trước nó, kể cả khi mọi `ref` cho nó đã biết và việc gộp về mặt kỹ thuật là làm được. Chạy nó như một lần gọi riêng SAU KHI bạn đã xác minh (screenshot/read) rằng các bước trước thực sự thành công và nội dung đúng — batch không có checkpoint tích hợp để bắt một cú fill lỗi/sai trước khi bước không-hoàn-tác kích hoạt. Không có bước xác nhận nào trong batch: một lần bị nav-policy từ chối sẽ dừng nó như mọi lỗi khác, nhưng không có gì dừng lại để hỏi người dùng trước khi một cú gửi/đăng/submit kích hoạt. Nhấn Enter bằng `BROWSER_KEY` trong ô chat/comment/post chính là một hành động như vậy — Enter trong ô tìm kiếm thì vô hại, Enter trong ô tin nhắn thì gửi đi.
- **Tối đa một `BROWSER_SCREENSHOT` hoặc `BROWSER_SNAPSHOT` mỗi batch, và chỉ được đặt làm hành động CUỐI** — công cụ từ chối mọi trường hợp khác. Hai cái trong một kết quả sẽ vượt trần kích thước tin nhắn chat và cả kết quả batch bị âm thầm loại khỏi lịch sử; hơn nữa một lần quan sát giữa batch vô dụng, vì không bước sau nào phản ứng được với nó. Với dữ liệu cần lấy giữa batch, dùng `BROWSER_READ` với một `selector`.
- Giữa các batch, quan sát lại trước khi lên kế hoạch batch tiếp theo: `SCREENSHOT`/`SNAPSHOT`/`READ` cuối cùng của batch là cái cho bạn biết trạng thái thật. Vòng lặp Observe → Act → Observe (mục 2) vẫn áp dụng — chỉ là ở mức từng batch.
- Ưu tiên dùng cho chuỗi điền-form-rồi-verify, `HOVER → CLICK` trên menu chỉ-hiện-khi-hover, đọc nhiều trường (`READ` × N → `SCREENSHOT`), và vòng cuộn (`SCROLL → READ → SCROLL → READ`, hoặc `SCROLL → SCROLL → SCREENSHOT`) — những cái này cần ít hoặc không cần `ref`, nên không dính rủi ro ref-cũ ở trên. Đừng ép các hành động không liên quan vào một batch chỉ để tiết kiệm một lần gọi — gọi rời tuần tự `BROWSER_*` vẫn ổn, và rõ ràng hơn, khi bước sau thực sự phụ thuộc vào kết quả bước trước.

## 14. Điền field: tin vào `verified`, và không bao giờ submit sau một lỗi `BROWSER_FILL`

`BROWSER_FILL` đặt cả giá trị trong một lần và **đọc lại field**. Kết quả của nó cho bạn biết cái gì thực sự đã vào:

- `{ filled, verified: true, method: "fill" | "type" }` → field giữ đúng giá trị của bạn. An toàn để tiếp tục (ví dụ `BROWSER_KEY` Enter với cùng `ref`, hoặc `BROWSER_CLICK` nút gửi/submit — nhưng với nút submit/tiến-tới **của chính một dialog**, ưu tiên Enter; xem mục 15).
- `{ filled, verified: false, actual: "…" }` → trang giữ các ký tự của bạn nhưng **định dạng lại** chúng (mặt nạ số điện thoại/ngày/thẻ, ép in hoa, cắt khoảng trắng). So sánh `actual` với cái bạn định nhập; thường thì ổn và bạn tiếp tục. **Đừng** fill lại trong vòng lặp mong khớp y hệt.
- Một lỗi bắt đầu bằng `[fill_typing_timeout]`, `[fill_needs_typing_too_long]` hoặc `[fill_needs_typing_multiline]` → xem mục 12. Không có gì được submit; thông báo cho biết field giờ có rỗng hay không. Rút ngắn hoặc tách văn bản — một tin nhắn dài tốt hơn nên gửi thành hai lần fill ngắn vào cùng ô chỉ khi trang cho phép, nếu không thì hỏi người dùng cách xử lý.

Cơ chế bên dưới, để bạn đoán trước được: công cụ trước tiên chèn cả đoạn văn bản một lần (rẻ, không phụ thuộc độ dài). Chỉ khi field bỏ qua kiểu chèn hàng loạt (hiếm: ô nhảy-trang, một số widget tìm-kiếm-khi-gõ) thì nó mới rơi về gõ từng phím — và gõ tốn thời gian cho mỗi ký tự qua relay, nên văn bản dài có thể bị từ chối thay vì gõ nửa chừng. Chỉ tự truyền `mode:"type"` khi bạn đã biết chắc field thuộc loại đó; không bao giờ dùng làm mặc định.

Enter là một hành động riêng: `BROWSER_FILL` không bao giờ nhấn nó. Sau một kết quả `verified: true`, dùng `BROWSER_KEY` với `key:"Enter"` và cùng `ref` khi ô không có nút, hoặc `BROWSER_CLICK` cái nút. Trong một ô chat/comment/post mà việc đó **gửi đi** — coi nó là không-hoàn-tác (mục 13) và verify trước.

Chọn công cụ theo loại field — `BROWSER_FILL` chỉ dành cho text:

- **Text / số / ngày / textarea / rich-text (contenteditable)** → `BROWSER_FILL`.
- **Native `<select>` dropdown** → `BROWSER_SELECT` — truyền `value` là nhãn hiển thị của option (ưu tiên), value bên dưới, hoặc index; truyền một mảng để chọn nhiều trong multi-select. **Đừng** `BROWSER_CLICK` một native `<select>`: nó mở popup do OS vẽ mà option không nằm trong DOM, nên bạn không click được và mọi snapshot/read sau đó bị timeout. Khi không khớp, lỗi sẽ liệt kê các option thật — đọc nó, đừng đoán mò trong vòng lặp.
- **Checkbox / radio / toggle switch** → `BROWSER_CHECK` với `checked:true`/`false`. Nó idempotent (đưa control về đúng trạng thái yêu cầu, không bao giờ lật sai chiều khi retry), nên ưu tiên hơn `BROWSER_CLICK` vốn lật và có thể ra ngược. Radio chỉ có thể `checked:true`.
- **Custom dropdown dựng từ div** (`role="combobox"`/`role="listbox"`, không phải `<select>` thật) → đây không phải native select: `BROWSER_CLICK` để mở, rồi `BROWSER_CLICK` option (hoặc `BROWSER_HOVER` trước nếu nó chỉ hiện khi hover). `BROWSER_SELECT` sẽ báo target không phải `<select>` — đó là tín hiệu chuyển sang click.

## 15. Submit bên trong một dialog — ưu tiên Enter, và đừng đổ lỗi cho tab

Những nút tiến-tới hoặc submit một **modal/dialog** (Continue, Next, Send, Save, "Tiếp tục") là chỗ một cú click theo toạ độ kém chắc chắn nhất: nếu layout của dialog dịch chuyển giữa lúc con trỏ của cú click di chuyển và lúc nhấn, cú nhấn có thể rơi vào backdrop và **đóng dialog thay vì submit**. `BROWSER_KEY` Enter kích hoạt control đang focus mà không cần toạ độ, nên né hẳn được chuyện này — sau một cú fill `verified: true`, focus vào nút submit theo `ref` của nó rồi nhấn `BROWSER_KEY` Enter. Chỉ click nút nếu nó không phản hồi với Enter.

- **Một dialog đóng bất ngờ ngay sau khi bạn click nút của nó chính là vấn đề này — không phải do tab.** **Đừng** kết luận tab "đang ở nền", và **đừng** `BROWSER_CLOSE_TAB` rồi mở lại để sửa: đóng tab vứt đi mọi tiến độ, và một tab vừa mở chưa sẵn sàng ngay — một `BROWSER_SNAPSHOT` ngay lập tức trên nó thường timeout. Thay vào đó: `BROWSER_SNAPSHOT` để đọc trạng thái thật, mở lại dialog nếu nó đã đóng, fill lại, và submit bằng `BROWSER_KEY` Enter.
- Sau bất kỳ `BROWSER_OPEN_TAB` nào, tab cần một chút thời gian để attach trước khi có thể soi được. Nếu `BROWSER_SNAPSHOT` đầu tiên trên đó timeout, đó là tab chưa-sẵn-sàng, không phải tab chết — `BROWSER_NAVIGATE` cùng tab đó (hoặc chờ và thử lại một lần) trước khi bỏ cuộc.

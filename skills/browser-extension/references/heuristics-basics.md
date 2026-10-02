# Heuristic điều khiển trình duyệt — phần 1: quan sát & chọn công cụ

> File hướng dẫn của skill `browser-extension`, dành cho **chính agent**: các quy tắc đã kiểm chứng
> thực tế khi dùng bộ công cụ `BROWSER_*` trên trang lạ, trình xem tài liệu và trang có paywall.
> Phần 1 (file này): công cụ có sẵn, checklist khi vào trang lạ, ranh giới an toàn, mục 1–11.
> Phần 2 (`heuristics-actions.md`): đọc lỗi công cụ (mục 12), `BROWSER_BATCH` (13), điền field (14),
> submit trong dialog (15), SNAPSHOT vs FIND + `depth` (16), overlay & control trùng tên (17).
> Cách cài / kết nối extension: `setup-guide.md`.

Đây không phải một kịch bản cứng: mục tiêu là quyết định bước tiếp theo dựa trên tín hiệu bạn thực sự
quan sát được, chứ không chạy theo một luồng if-else định sẵn.

## Các công cụ có sẵn (tên thật, không phải tên minh hoạ)

`BROWSER_STATUS` · `BROWSER_LIST_TABS` · `BROWSER_OPEN_TAB` · `BROWSER_CLOSE_TAB` · `BROWSER_NAVIGATE` · `BROWSER_SNAPSHOT` · `BROWSER_FIND` · `BROWSER_READ` · `BROWSER_CLICK` · `BROWSER_FILL` · `BROWSER_SELECT` · `BROWSER_CHECK` · `BROWSER_SCROLL` · `BROWSER_SCREENSHOT` · `BROWSER_KEY` · `BROWSER_HOVER` · `BROWSER_BATCH` (gộp tối đa 6 công cụ trên vào một lần gọi — xem mục 13 ở `heuristics-actions.md`) — cùng với `openclaw_web_fetch` (lấy nội dung trang mà không cần mở tab).

`BROWSER_STATUS` là cách read-only, không side-effect để biết extension đã ghép nối và đang online chưa — trả về `{paired, connected, lastSeenAt, sharedTabCount}`. Gọi nó khi một task trình duyệt fail hoặc trước khi nói bất kỳ điều gì với user về trạng thái extension; đừng suy đoán trạng thái pairing từ lỗi của tool khác. `paired:false` → hướng dẫn cài + ghép nối; `paired:true, connected:false` → extension ĐÃ ghép nối, chỉ đang không hoạt động — bảo user mở Chrome, vào `chrome://extensions/` tải lại extension và đảm bảo nó được bật, tuyệt đối đừng bảo cài lại hay ghép nối lại; `connected:true` → làm việc tiếp (`BROWSER_OPEN_TAB` dùng được ngay cả khi `sharedTabCount` = 0).

**Giới hạn thực tế phải nhớ**: `BROWSER_CLICK` / `BROWSER_FILL` nhận `ref` (từ `BROWSER_SNAPSHOT` hoặc `BROWSER_FIND`) hoặc CSS `selector` — **không có tham số toạ độ (x, y)**, và **luôn ưu tiên `ref`**; CSS `selector` chỉ là phương án chót khi bạn có selector CHẮC CHẮN ổn định, đừng đoán mò (xem mục 1). Không có công cụ tìm-trong-trang và không có công cụ đọc network request. `BROWSER_CLICK` chỉ click chuột trái (`clickCount:2` để double-click; không có right-click). `BROWSER_HOVER` làm hiện UI chỉ-xuất-hiện-khi-hover (menu thao tác trên hàng, tooltip, dropdown) — hover phần tử cha, rồi snapshot hoặc click phần tử vừa hiện. Native `<select>` là trường hợp đặc biệt — `BROWSER_CLICK` mở popup do OS vẽ mà bạn không click được; dùng `BROWSER_SELECT` thay vào. Checkbox / radio / toggle switch: dùng `BROWSER_CHECK` (`checked:true`/`false`), không dùng `BROWSER_CLICK` (xem mục 14 ở `heuristics-actions.md`). `BROWSER_KEY` nhấn một phím điều hướng (Enter, Escape, Tab, phím mũi tên, Backspace, PageUp/PageDown, Home/End) — không có tổ hợp phím modifier, và nó không bao giờ gõ chữ (`BROWSER_FILL` gõ chữ nhưng không bao giờ nhấn Enter; để submit một ô không có nút bấm, dùng `BROWSER_FILL` rồi `BROWSER_KEY` Enter với cùng `ref`/`selector`). Với nội dung không phải DOM thật (ảnh/canvas thuần), việc tương tác chỉ giới hạn ở các control DOM thật bao quanh nó, nếu có — xem mục 3.

## Checklist nhanh khi vừa đáp xuống một trang lạ

1. Chạy `BROWSER_SNAPSHOT` (cấu trúc + ref) hoặc `BROWSER_SCREENSHOT` (hình ảnh) trước, để biết mình đang đối mặt với cái gì trước khi chọn công cụ tiếp theo.
2. Kiểm tra ngay: trang có đòi đăng nhập, CAPTCHA, hay bước thanh toán không? Nếu có, xem "Ranh giới an toàn" bên dưới — đừng tìm cách lách bằng heuristic; dừng lại và hỏi người dùng.
3. Có banner cookie/consent hay popup chặn không? Dọn nó trước (`BROWSER_SNAPSHOT` để tìm ref của nút từ chối, rồi `BROWSER_CLICK` — chọn phương án bảo vệ quyền riêng tư nhất, từ chối cái không bắt buộc).
4. Nội dung là text/DOM thật, ảnh/canvas, hay SPA tải động? Dò rẻ tiền bằng `BROWSER_READ` / `BROWSER_SNAPSHOT` (rẻ hơn hẳn `BROWSER_SCREENSHOT`) — xem mục 3 để biết cách phân biệt ba trường hợp.
5. Trang đích có điều hướng riêng của nó không (ô nhảy trang, tìm kiếm trong app, mục lục)? Ưu tiên tìm ref của nó qua `BROWSER_SNAPSHOT` rồi dùng `BROWSER_FILL` / `BROWSER_CLICK`, thay vì tự lặp `BROWSER_SCROLL` / `BROWSER_CLICK`. Với ô nhảy-trang hoặc ô tìm-kiếm-khi-gõ, truyền `mode:"type"` cho `BROWSER_FILL` (xem mục 14 ở `heuristics-actions.md`).
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
- Một chuỗi hành động đã lên kế hoạch trước (xem mục 13 ở `heuristics-actions.md`) qua `BROWSER_BATCH` trước khi bắn từng hành động một.

**Lấy `ref` TRƯỚC khi click/fill — KHÔNG bao giờ đoán CSS `selector`.** Cần thao tác một control cụ thể: `BROWSER_FIND {role, name}` (đích danh — vd nút `"Edit <tên item>"`) hoặc `BROWSER_SNAPSHOT` (toàn cảnh) để lấy `ref` THẬT, rồi mới `BROWSER_CLICK`/`BROWSER_FILL` theo `ref` đó. Một `selector` đoán mò gần như luôn timeout 20s rồi vẫn phải snapshot lại — phí gấp đôi. Chỉ dùng CSS `selector` khi bạn có id/name/attribute CHẮC CHẮN ổn định, không phải phỏng đoán. Khi nào dùng SNAPSHOT (toàn cảnh) vs FIND (đích danh): xem mục 16 ở `heuristics-actions.md`.

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

> Tiếp theo: gặp lỗi công cụ, cần gộp nhiều bước, điền form, submit dialog, hay chọn giữa `BROWSER_SNAPSHOT` và `BROWSER_FIND` (và scoped snapshot cho overlay) → đọc `heuristics-actions.md`.

# Heuristic điều khiển trình duyệt — phần 2: lỗi, batch, form, dialog

> File hướng dẫn của skill `browser-extension`, dành cho **chính agent**. Phần 1 (`heuristics-basics.md`)
> có danh sách công cụ, checklist trang lạ, ranh giới an toàn và mục 1–11; file này tiếp mục 12–15.
> Các chỗ nhắc "mục 2", "mục 3", "mục 11" là ở phần 1.

## 12. Đọc lỗi công cụ theo đúng nghĩa đen — có lỗi nghĩa là "dừng", không phải "thử lại"

Các công cụ trình duyệt trả về thông báo lỗi cụ thể khi kết nối debugger tới tab bị mất. Coi chúng là chỉ dẫn, không phải nhiễu tạm thời:

- **"…debugger detached from tab …"** → kết nối tới tab đã mất và một lần tự re-attach đã thất bại. Gọi `BROWSER_LIST_TABS` một lần để làm mới danh sách tab, rồi thử lại hành động **đúng một lần**. Nếu vẫn lỗi, dừng và báo người dùng.
- **"…another extension injected a restricted frame…"** (thường là trình quản lý mật khẩu như Bitwarden/1Password, hoặc AI sidebar/dịch, trên trang có form đăng nhập) → chính Chrome đang từ chối truy cập tab này. **Không lần thử lại nào giúp được.** Nói thẳng với người dùng loại extension nào đang chặn, đề nghị họ tắt nó cho profile Chrome này (hoặc dùng một profile riêng cho agent), rồi chờ họ — đừng đập vào tab liên tục và đừng chuyển sang công cụ browser khác để "lách".
- **"Tab … is still attaching…"** → thực sự tạm thời (tab vừa mở hoặc đang điều hướng). Chờ vài giây rồi thử lại; bỏ cuộc sau 2-3 lần và báo.
- **"Tab … is no longer shared with this workspace"** → người dùng đã bỏ chia sẻ hoặc đóng tab. Đề nghị họ chia sẻ lại (xem `setup-guide.md`); đừng tự mở tab mới thay họ trừ khi task cho phép.
- **"No browser extension is connected…"** → đừng vội kết luận: gọi `BROWSER_STATUS` để phân biệt "chưa từng ghép nối" với "ghép nối rồi nhưng trình duyệt đang offline", rồi hướng dẫn user đúng ca (xem SKILL.md, bước kiểm tra trạng thái).
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

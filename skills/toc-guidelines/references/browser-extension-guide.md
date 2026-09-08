# Extension trình duyệt — Agent thao tác trực tiếp trên trình duyệt của bạn

> **Extension trình duyệt** cho agent thấy và thao tác trên **một tab trình duyệt thật** của bạn (Chrome) —
> mở trang, đọc nội dung, bấm nút, điền form — y như bạn tự làm bằng chuột/bàn phím. Khác Connector
> (agent gọi API chính thức của app như Gmail/Slack), extension hoạt động trên **bất kỳ trang web nào**,
> kể cả trang chưa có connector, vì agent điều khiển ngay trình duyệt bạn đang đăng nhập.

## Khác gì Connector / Skill

- **Connector** = agent dùng **API chính thức** của app (Gmail, Slack, Notion...) — nhanh, ổn định, nhưng chỉ với app đã có connector.
- **Extension trình duyệt** = agent dùng **chính trình duyệt của bạn** — hoạt động trên mọi trang web, kể cả trang nội bộ hoặc chưa hỗ trợ connector, nhưng cần bạn cài extension và chọn tab muốn chia sẻ.

## ⚠️ Trạng thái hiện tại — chưa lên Chrome Web Store

Extension **chưa có trên Chrome Web Store** — cài thủ công (unpacked, developer mode). Mọi user đều
tự cài được: trang **Cài đặt → Extension** có sẵn card **Hướng dẫn cài đặt** 5 bước + nút
**Tải extension (.zip)** tải trực tiếp, kèm nút **Kết nối extension**. Khi hướng dẫn, trỏ user vào
trang này thay vì tự viết lại các bước cài.

## Cần gì trước

- Extension đã được cài trên trình duyệt Chrome — tự cài theo **Hướng dẫn cài đặt** trong trang
  **Cài đặt → Extension**.
- Đã kết nối extension với đúng tài khoản ClawExpert của bạn.

## Cách kết nối (khi đã có extension)

1. Vào **Cài đặt → Extension** trong ClawExpert (chưa cài extension thì làm theo **Hướng dẫn cài đặt** + nút tải zip ngay trong trang).
2. Bấm **Kết nối extension** — extension sẽ tự ghép nối với tài khoản đang đăng nhập.

## Chia sẻ một tab cho agent

1. Mở tab bạn muốn agent thấy/thao tác.
2. Bấm icon extension trên thanh công cụ Chrome.
3. Chọn đúng **workspace** đang muốn dùng ở khung **"Select a workspace…"** — tab đó chỉ agent của workspace này thấy được, không lộ cho workspace khác.
4. Muốn dừng chia sẻ: mở lại icon extension → **Un-share this tab**.

## Agent tự mở tab mới

Nếu **chủ workspace** đã cài và kết nối extension, agent có thể **tự mở tab mới khi cần** (ví dụ để tra thông tin trên một trang web) mà không cần bạn tự tay chọn chia sẻ trước — chỉ khi chưa có tab nào được chia sẻ mới cần bước 3 ở trên.

## Tool kỹ thuật — agent gọi gì để dùng tab đã chia sẻ

Phần này dành cho **chính agent** (không phải nội dung giải thích cho user):

- Bộ tool đầy đủ: `BROWSER_LIST_TABS`, `BROWSER_OPEN_TAB`, `BROWSER_CLOSE_TAB`, `BROWSER_NAVIGATE`, `BROWSER_SNAPSHOT`, `BROWSER_READ`, `BROWSER_CLICK`, `BROWSER_FILL`, `BROWSER_SELECT`, `BROWSER_CHECK`, `BROWSER_SCROLL`, `BROWSER_SCREENSHOT`, `BROWSER_KEY`, `BROWSER_HOVER`, `BROWSER_BATCH` — chi tiết cách chọn và dùng từng cái ở [`browser-agent-heuristics.md`](browser-agent-heuristics.md). **Chọn đúng tool đầu tiên theo ý định, đừng luôn bắt đầu bằng `BROWSER_LIST_TABS`:**
  - Cần **research / mở một trang mới** mà chưa có tab liên quan nào đang mở sẵn (ví dụ "research Google về X") → gọi thẳng `BROWSER_OPEN_TAB` với `url`. Tool này tự bootstrap trên thiết bị đã ghép nối (paired) của **chủ workspace**, **không đòi hỏi** phải có tab nào được chia sẻ từ trước — chỉ cần extension đã **kết nối** (bước "Cách kết nối" ở trên) là đủ, không cần bước "Chia sẻ một tab" trước đó.
  - Cần đọc/thao tác trên **tab người dùng đang xem** (ví dụ "trang tôi vừa mở", "bấm nút trên trang này") → gọi `BROWSER_LIST_TABS` trước để lấy `tabId`, rồi mới `BROWSER_NAVIGATE`/`BROWSER_CLICK`/`BROWSER_FILL`/`BROWSER_READ`/`BROWSER_SCREENSHOT` theo `tabId` đó.
- Nếu **`BROWSER_OPEN_TAB` báo lỗi** "No browser extension is connected..." → nghĩa là **thật sự chưa kết nối** (chủ workspace chưa bấm Kết nối extension, hoặc đã bị thu hồi) — hướng dẫn user theo phần "Cách kết nối" ở trên.
- Nếu **`BROWSER_LIST_TABS` trả về rỗng** nhưng `BROWSER_OPEN_TAB` không phù hợp (task cần đúng tab user đang xem, không phải mở tab mới) → đừng kết luận "extension chưa kết nối"; hướng dẫn user theo phần "Chia sẻ một tab cho agent" ở trên rồi thử lại — extension có thể đã kết nối tốt, chỉ là chưa tab nào được chia sẻ.
- **KHÔNG** dùng tool `browser` chung (built-in của OpenClaw) với `profile="user"` để truy cập tab người dùng đã chia sẻ — tool đó cố gắn vào một Chrome desktop chạy cục bộ trên máy chủ backend, **không hề** kết nối với extension trình duyệt của ClawExpert, và sẽ luôn thất bại trên nền tảng này. Tool `browser` (không truyền `profile`, hoặc `profile="openclaw"`) chỉ là trình duyệt cô lập dùng để tra cứu vãng lai — không có đăng nhập, không có cookie, không liên quan gì tới tab người dùng. Đừng âm thầm chuyển sang tool đó rồi báo như đã đọc được trang thật.

## Lưu ý cần thiết

- Chỉ tab bạn **chủ động chọn workspace** mới lộ cho agent — extension không tự chia sẻ mọi tab đang mở.
- Agent chỉ thấy/thao tác trong đúng workspace bạn chọn, không đụng tới tab của workspace khác.
- Đóng trình duyệt hoặc gỡ chia sẻ thì agent mất quyền truy cập tab đó ngay.

## Khi chính bạn (agent) thao tác trên tab — đọc thêm heuristics

File này chỉ nói **extension là gì và kết nối/chia sẻ tab thế nào**. Trước khi tự tay dùng `BROWSER_*` trên
một trang lạ, document viewer, trang có paywall hay form nhiều bước, đọc
[`browser-agent-heuristics.md`](browser-agent-heuristics.md): chọn tool nào trước (snapshot/read rẻ hơn
screenshot), phân biệt 3 loại nội dung (DOM thật / ảnh-canvas / SPA lazy-load), ranh giới an toàn (không
đăng nhập, không CAPTCHA, không thanh toán), cách đọc đúng lỗi tool (lỗi nào retry được, lỗi nào phải dừng
và báo user tắt extension khác đang chặn), và ngưỡng thử lại.

## Gợi ý cho agent khi hướng dẫn

- **Extension chưa có trên Chrome Web Store** (xem lưu ý ở đầu file) — khi hướng dẫn cài, LUÔN trỏ user vào **Cài đặt → Extension**: trong trang có sẵn hướng dẫn 5 bước + nút tải zip, đừng để user đi tìm trên Web Store.
- Nếu người dùng hỏi "agent điều khiển được trình duyệt của tôi không" hoặc "làm sao cho agent tự mở web": hướng dẫn theo các bước trên.
- Nhắc rõ khác biệt với Connector nếu người dùng đang nhầm hai khái niệm.
- Sau khi người dùng báo đã kết nối + chia sẻ tab xong, gợi ý thử ngay: nhờ agent đọc hoặc thao tác trên trang vừa chia sẻ.

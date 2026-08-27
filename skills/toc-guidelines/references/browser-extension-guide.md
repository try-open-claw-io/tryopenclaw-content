# Extension trình duyệt — Agent thao tác trực tiếp trên trình duyệt của bạn

> **Extension trình duyệt** cho agent thấy và thao tác trên **một tab trình duyệt thật** của bạn (Chrome) —
> mở trang, đọc nội dung, bấm nút, điền form — y như bạn tự làm bằng chuột/bàn phím. Khác Connector
> (agent gọi API chính thức của app như Gmail/Slack), extension hoạt động trên **bất kỳ trang web nào**,
> kể cả trang chưa có connector, vì agent điều khiển ngay trình duyệt bạn đang đăng nhập.

## Khác gì Connector / Skill

- **Connector** = agent dùng **API chính thức** của app (Gmail, Slack, Notion...) — nhanh, ổn định, nhưng chỉ với app đã có connector.
- **Extension trình duyệt** = agent dùng **chính trình duyệt của bạn** — hoạt động trên mọi trang web, kể cả trang nội bộ hoặc chưa hỗ trợ connector, nhưng cần bạn cài extension và chọn tab muốn chia sẻ.

## ⚠️ Trạng thái hiện tại — chưa public

Extension **chưa có trên Chrome Web Store** — chỉ cài được thủ công (unpacked, developer mode), do đội
ngũ ClawExpert hỗ trợ trực tiếp. Trang **Cài đặt → Extension** chỉ có nút **Kết nối extension** (ghép
nối tài khoản), **không có** hướng dẫn cài đặt trong trang. Nếu người dùng chưa được cấp extension,
**đừng bịa hướng dẫn cài** — nói rõ tính năng này hiện giới hạn, cần liên hệ đội ngũ ClawExpert để được hỗ trợ cài.

## Cần gì trước

- Extension đã được cài trên trình duyệt Chrome (qua đội ngũ ClawExpert hỗ trợ, xem lưu ý ở trên).
- Đã kết nối extension với đúng tài khoản ClawExpert của bạn.

## Cách kết nối (khi đã có extension)

1. Vào **Cài đặt → Extension** trong ClawExpert.
2. Bấm **Kết nối extension** — extension sẽ tự ghép nối với tài khoản đang đăng nhập.

## Chia sẻ một tab cho agent

1. Mở tab bạn muốn agent thấy/thao tác.
2. Bấm icon extension trên thanh công cụ Chrome.
3. Chọn đúng **workspace** đang muốn dùng ở khung **"Select a workspace…"** — tab đó chỉ agent của workspace này thấy được, không lộ cho workspace khác.
4. Muốn dừng chia sẻ: mở lại icon extension → **Un-share this tab**.

## Agent tự mở tab mới

Nếu **chủ workspace** đã cài và kết nối extension, agent có thể **tự mở tab mới khi cần** (ví dụ để tra thông tin trên một trang web) mà không cần bạn tự tay chọn chia sẻ trước — chỉ khi chưa có tab nào được chia sẻ mới cần bước 3 ở trên.

## Lưu ý cần thiết

- Chỉ tab bạn **chủ động chọn workspace** mới lộ cho agent — extension không tự chia sẻ mọi tab đang mở.
- Agent chỉ thấy/thao tác trong đúng workspace bạn chọn, không đụng tới tab của workspace khác.
- Đóng trình duyệt hoặc gỡ chia sẻ thì agent mất quyền truy cập tab đó ngay.

## Gợi ý cho agent khi hướng dẫn

- **Extension chưa public trên Chrome Web Store** (xem cảnh báo ở đầu file) — dù nằm trong 7 tính năng, khi hướng dẫn LUÔN nhắc trạng thái này trước, đừng để user tưởng có thể tự cài ngay.
- Nếu người dùng hỏi "agent điều khiển được trình duyệt của tôi không" hoặc "làm sao cho agent tự mở web": hướng dẫn theo các bước trên.
- Nhắc rõ khác biệt với Connector nếu người dùng đang nhầm hai khái niệm.
- Sau khi người dùng báo đã kết nối + chia sẻ tab xong, gợi ý thử ngay: nhờ agent đọc hoặc thao tác trên trang vừa chia sẻ.

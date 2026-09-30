# Extension trình duyệt — giới thiệu, cài đặt, kết nối

> File hướng dẫn của skill `browser-extension`. Dùng khi người dùng hỏi extension là gì, cài / kết nối /
> chia sẻ tab thế nào, hoặc khi `BROWSER_STATUS` báo chưa kết nối. Cách **thao tác** trên tab nằm ở
> `heuristics-basics.md` và `heuristics-actions.md`.

> **Extension trình duyệt** cho agent thấy và thao tác trên **một tab trình duyệt thật** của bạn (Chrome) —
> mở trang, đọc nội dung, bấm nút, điền form — y như bạn tự làm bằng chuột/bàn phím. Khác Connector
> (agent gọi API chính thức của app như Gmail/Slack), extension hoạt động trên **bất kỳ trang web nào**,
> kể cả trang chưa có connector, vì agent điều khiển ngay trình duyệt bạn đang đăng nhập.

## Khác gì Connector / Skill

- **Connector** = agent dùng **API chính thức** của app (Gmail, Slack, Notion...) — nhanh, ổn định, nhưng chỉ với app đã có connector.
- **Extension trình duyệt** = agent dùng **chính trình duyệt của bạn** — hoạt động trên mọi trang web, kể cả trang nội bộ hoặc chưa hỗ trợ connector, nhưng cần bạn cài extension và chọn tab muốn chia sẻ.

## Cài từ Chrome Web Store

Extension có trên **Chrome Web Store** với tên **ClawExperts Co-Work**. Trang **Cài đặt → Extension** có
sẵn **Hướng dẫn cài đặt** 3 bước, nút **Mở Chrome Web Store** và nút **Kết nối extension**. Khi hướng dẫn,
trỏ user vào trang này thay vì tự viết lại các bước cài.

## Cần gì trước

- Extension đã được cài trên trình duyệt Chrome (máy tính) — cài từ Chrome Web Store theo **Hướng dẫn cài
  đặt** trong trang **Cài đặt → Extension**.
- Đã kết nối extension với đúng tài khoản ClawExpert của bạn.

## Cách kết nối (khi đã có extension)

1. Vào **Cài đặt → Extension** trong ClawExpert (chưa cài extension thì bấm **Mở Chrome Web Store** → **Add to Chrome**, rồi quay lại trang).
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

- Khi hướng dẫn cài, trỏ user vào **Cài đặt → Extension**: trong trang có sẵn hướng dẫn và nút **Mở Chrome Web Store** dẫn đúng trang của extension, tránh user tìm nhầm extension khác trên store.
- Nếu người dùng hỏi "agent điều khiển được trình duyệt của tôi không" hoặc "làm sao cho agent tự mở web": hướng dẫn theo các bước trên.
- Nhắc rõ khác biệt với Connector nếu người dùng đang nhầm hai khái niệm.
- Sau khi người dùng báo đã kết nối xong: gọi lại `BROWSER_STATUS` để xác nhận, rồi làm tiếp yêu cầu họ đã nêu (theo SKILL.md), hoặc gợi ý vài việc thử ngay như "mở trang X và tóm tắt".

# Channels — Trò chuyện với agent qua app quen thuộc

> **Channel** = kênh nhắn tin để **bạn chat với và điều khiển agent ngay trong một app quen** (Telegram, Zalo, Discord, Slack, WhatsApp), thay vì chỉ dùng web ClawExpert.
> Kết nối xong, mọi tin bạn nhắn trong app đó sẽ được agent tự trả lời.

## ⚠️ Đừng nhầm Channel với Connector

Slack / Discord / WhatsApp có ở cả hai, nhưng khác nhau:

- **Channel** = **bạn nhắn cho agent** qua app đó (chiều vào). Ví dụ: bạn mở Telegram gõ tin, agent trả lời.
- **Connector** = **agent dùng app đó làm công cụ** để làm việc cho bạn (chiều ra). Ví dụ: "@slack gửi thông báo vào #sales".

Câu chốt: *Channel = bạn CHAT VỚI agent. Connector = agent làm việc VỚI app.*

## Kênh đang hỗ trợ

Telegram, Zalo, Discord, Slack, WhatsApp. (Messenger đang "sắp ra mắt".)

## Cần gì trước

- Một **instance đang chạy** (xem `platform-basics.md`). Chưa có instance sẽ thấy "Tạo instance để cấu hình kênh nhắn tin" kèm nút **Create instance**.
- Với đa số kênh: một **token bot** từ chính nền tảng đó (trừ WhatsApp — quét QR).

## Cách kết nối (chung)

1. Vào trang **Kết nối kênh** (Channels) từ sidebar.
2. Chọn thẻ kênh muốn dùng → bấm **Start connecting** (hoặc **Manage** nếu đã nối).
3. Làm theo **Setup guide** hiện trong panel (mỗi kênh có số bước + thời gian ước tính).
4. Dán token (nếu cần) → bấm nút **Connect …**. Có nhiều agent thì chọn agent nào sẽ trả lời ở mục **"Xử lý tin nhắn bằng"**.
5. Đã nối xong: có thể **Kết nối lại**, ngắt kết nối, và chỉnh **"Ai được phép nhắn tin?"** (Công khai / Danh sách cho phép / Ghép đôi).

## Chi tiết từng kênh

### Telegram (~2 phút)
1. Mở **@BotFather** trên Telegram.
2. Gửi lệnh **/newbot**, đặt tên bot → BotFather trả về **token**.
3. Dán token vào ClawExpert → **Connect Telegram**.

### Zalo (~5 phút)
1. Vào trang quản trị Zalo Bot / Official Account, lấy **Access Token** (cần OA đã được duyệt).
2. Dán token → **Connect Zalo**.

### Discord (~7 phút)
1. Tạo bot trong **Discord Developer Portal**.
2. Bật **Message Content Intent**, rồi **Reset Token** và copy token.
3. Mời bot vào server của bạn.
4. Dán token → **Connect Discord**.

### Slack (~6 phút)
1. Tạo Slack app (từ manifest).
2. Lấy **2 token**: **Bot User OAuth Token** (bắt đầu `xoxb-`) và **App-Level Token** (bắt đầu `xapp-`, scope `connections:write`).
3. Dán cả hai → **Connect Slack**.

### WhatsApp (không cần token)
1. Bấm **Enable WhatsApp** → **Show QR code to pair**.
2. Trên điện thoại: WhatsApp → **Thiết bị đã liên kết** → **Liên kết thiết bị** → quét QR.
   (Hoặc nhắn cho agent "log me into WhatsApp" để lấy QR.)

## Lưu ý cần thiết

- **Instance phải đang chạy** thì bot mới nhận tin. Nếu instance tắt, kênh vẫn "kết nối" nhưng không nhận tin cho tới khi instance chạy lại.
- Discord / Zalo / Slack / WhatsApp cần cài plugin nền → thường **có hiệu lực sau khi khởi động lại**. Nếu bot chưa phản hồi sau khi nối, thử **Kết nối lại**.

## Gợi ý cho agent khi hướng dẫn

- Hỏi khách muốn dùng kênh nào, rồi đưa đúng các bước của kênh đó ở trên.
- Nhắc khách chuẩn bị token trước (trừ WhatsApp) để nối nhanh.
- Nối xong, gợi ý khách thử: mở app đó và nhắn một câu cho agent.

# Hướng dẫn cài Skill & kết nối Connector (qua giao diện ClawExpert)

> Tên menu có thể khác đôi chút theo phiên bản UI — hướng người dùng theo ý chính dưới đây.
> Điều kiện chung: hầu hết thao tác cần một **instance đang chạy** (xem `platform-basics.md`).

## Cài một skill (mục "Kỹ năng")

1. Mở ClawExpert → mục **Kỹ năng** (Skills).
2. Tìm skill cần cài theo tên → bấm **Cài đặt** (Install).
3. Chờ cài xong (có thể khởi động lại instance một chút); agent sẽ dùng được skill đó — **agent tự chọn skill phù hợp**, hoặc gõ `/<slug>` trong chat để gọi tay.
4. Bật/tắt skill bằng công tắc trên thẻ (không cần khởi động lại).
5. (Nâng cao) **Thêm kỹ năng riêng**: tải lên file `.zip` (tối đa 10 MB), nén **cả thư mục** chứa file `SKILL.md`.

## Kết nối một connector (mục "Ứng dụng")

1. Mở ClawExpert → mục **Ứng dụng** (Connectors).
2. Chọn app cần kết nối → bấm **Kết nối** hoặc **Thêm tài khoản**. Đặt tên profile dễ phân biệt nếu cần. Có 2 kiểu:
   - **Đăng nhập OAuth** (đa số app: Gmail, Slack, Notion, GitHub, Google Calendar/Drive/Sheets, HubSpot, Stripe, Shopify, Zoom...): mở popup đăng nhập của app đó → **cấp quyền**.
   - **Nhập App ID + App Secret** (chỉ vài app tự quản, hiện có Lark Suite self-managed).
3. Sau khi kết nối, profile xuất hiện trong danh sách account của app. Agent lấy danh sách hiện tại rồi chọn
   profile theo yêu cầu; có nhiều account mà chưa rõ thì hỏi lại.
4. Trong chat có thể gõ `@<id>` (vd `@gmail`) để tham chiếu app; chỉ định thêm tên profile khi có nhiều account.
5. Các profile dùng chung trong workspace. Thêm account không tăng hạn mức Connector và không tạo quyền riêng cho từng agent.
   Nếu nền tảng báo cần cập nhật instance trước khi thêm account, hoàn tất cập nhật rồi thử lại; không xóa kết nối cũ để lách bước này.

## Gỡ / tắt / ngắt

- **Skill**: vào Kỹ năng → chọn skill → **Gỡ cài đặt**, hoặc tắt bằng công tắc.
- **Connector**: vào Ứng dụng → chọn app → chọn đúng profile để **Đổi tên**, **Ngắt kết nối** hoặc **Kết nối lại**.
  Ngắt profile này ảnh hưởng các agent đang dùng nó trong workspace, không ngắt account khác của cùng app.
  Kết nối lại phải dùng đúng account cũ; nếu muốn đổi account của profile, xác nhận rõ trên giao diện.

## Connector vs Channel — đừng nhầm

- **Connector** = agent **dùng app** làm công cụ để làm việc cho bạn (vd "@slack gửi thông báo").
- **Channel** = **bạn nhắn cho agent** qua app quen (Telegram, Zalo, Discord, Slack, WhatsApp). Xem `channels-guide.md`.
- Slack/Discord/WhatsApp có ở cả hai — hỏi rõ khách muốn "agent làm việc với app" (connector) hay "chat với agent qua app" (channel).

## Mẹo cho agent khi hướng dẫn

- Nói đúng tên skill/connector và nhóm (category) để người dùng dễ tìm trong UI.
- Với connector: nhắc người dùng sau khi kết nối có thể gõ `@<id>` (vd `@gmail`) để gọi nhanh.
- Sau khi người dùng báo đã cài/kết nối xong, gợi ý ngay một câu lệnh mẫu để họ thử.

# Hướng dẫn cài Skill & kết nối Connector (qua giao diện OpenClaw)

> Tên menu có thể khác đôi chút theo phiên bản UI — hướng người dùng theo ý chính dưới đây.
> Điều kiện chung: hầu hết thao tác cần một **instance đang chạy** (xem `platform-basics.md`).

## Cài một skill (mục "Kỹ năng")

1. Mở OpenClaw → mục **Kỹ năng** (Skills).
2. Tìm skill cần cài theo tên → bấm **Cài đặt** (Install).
3. Chờ cài xong (có thể khởi động lại instance một chút); agent sẽ dùng được skill đó — **agent tự chọn skill phù hợp**, hoặc gõ `/<slug>` trong chat để gọi tay.
4. Bật/tắt skill bằng công tắc trên thẻ (không cần khởi động lại).
5. (Nâng cao) **Thêm kỹ năng riêng**: tải lên file `.zip` (tối đa 10 MB), nén **cả thư mục** chứa file `SKILL.md`.

## Kết nối một connector (mục "Ứng dụng")

1. Mở OpenClaw → mục **Ứng dụng** (Connectors).
2. Chọn app cần kết nối → bấm **Kết nối**. Có 2 kiểu:
   - **Đăng nhập OAuth** (đa số app: Gmail, Slack, Notion, GitHub, Google Calendar/Drive/Sheets, HubSpot, Stripe, Shopify, Zoom...): mở popup đăng nhập của app đó → **cấp quyền**.
   - **Nhập App ID + App Secret** (chỉ vài app tự quản, hiện có Lark Suite self-managed).
3. Sau khi kết nối, các tool của app **tự xuất hiện** cho agent — agent tự dùng khi cần; không phải khởi động lại.
4. Trong chat có thể gõ `@<id>` (vd `@gmail`) để tham chiếu nhanh tới app.

## Gỡ / tắt / ngắt

- **Skill**: vào Kỹ năng → chọn skill → **Gỡ cài đặt**, hoặc tắt bằng công tắc.
- **Connector**: vào Ứng dụng → chọn app → **Ngắt kết nối** (ảnh hưởng cả workspace) hoặc **Kết nối lại** khi hết hạn.

## Connector vs Channel — đừng nhầm

- **Connector** = agent **dùng app** làm công cụ để làm việc cho bạn (vd "@slack gửi thông báo").
- **Channel** = **bạn nhắn cho agent** qua app quen (Telegram, Zalo, Discord, Slack, WhatsApp). Xem `channels-guide.md`.
- Slack/Discord/WhatsApp có ở cả hai — hỏi rõ khách muốn "agent làm việc với app" (connector) hay "chat với agent qua app" (channel).

## Mẹo cho agent khi hướng dẫn

- Nói đúng tên skill/connector và nhóm (category) để người dùng dễ tìm trong UI.
- Với connector: nhắc người dùng sau khi kết nối có thể gõ `@<id>` (vd `@gmail`) để gọi nhanh.
- Sau khi người dùng báo đã cài/kết nối xong, gợi ý ngay một câu lệnh mẫu để họ thử.

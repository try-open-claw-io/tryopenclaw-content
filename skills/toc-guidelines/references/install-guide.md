# Hướng dẫn cài Skill & kết nối Connector (qua giao diện OpenClaw)

> Tên menu có thể khác đôi chút theo phiên bản UI — hướng người dùng theo ý chính dưới đây.

## Cài một skill

1. Mở OpenClaw.
2. Vào mục Skills (kho/Catalog).
3. Tìm skill cần cài theo tên → bấm Cài (Install).
4. Chờ cài xong; agent sẽ nhận cấu hình mới và dùng được skill đó.

## Kết nối một connector (app ngoài)

1. Mở OpenClaw.
2. Vào mục Connectors / Integrations.
3. Chọn app cần kết nối → bấm Kết nối → đăng nhập & cấp quyền.
4. Sau khi kết nối, các tool của app (dạng `<APP>_<ACTION>`) xuất hiện cho agent; danh sách tự cập nhật, không cần khởi động lại.

## Gỡ / tắt

- Skill: vào Skills → chọn skill → Gỡ (Uninstall) hoặc tắt (disable).
- Connector: vào Connectors → chọn app → Ngắt kết nối.

## Mẹo cho agent khi hướng dẫn

- Nói đúng tên skill/connector và nhóm (category) để người dùng dễ tìm trong UI.
- Với connector: nhắc người dùng rằng sau khi kết nối có thể gõ `@<id>` (vd `@gmail`) để gọi nhanh.
- Sau khi người dùng báo đã cài/kết nối xong, gợi ý ngay một câu lệnh mẫu để họ thử.

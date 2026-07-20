# BOOTSTRAP.md — Cấu hình lần đầu (BSV · Kiểm tra tiếp nhận công nhân)

Chạy 1 lần khi khởi tạo agent. Mục đích: biết **Google Sheet nào** cần kiểm tra. KHÔNG hardcode sheet.

## QUAN TRỌNG — Agent không mở lời trước được

Bạn KHÔNG tự gửi tin nhắn đầu. Cấu hình khởi động khi **người vận hành nhắn tin** (bấm starter chip hoặc gõ tự do).

## Việc cần làm khi người vận hành mở chat lần đầu

1. Nếu **chưa cấu hình sheet** (mọi lệnh kiểm tra sẽ báo cần link, hoặc người dùng chưa từng gửi link):
   → Hỏi: *"Cho tôi xin **link Google Sheet** danh sách công nhân cần kiểm tra (dán link `https://docs.google.com/spreadsheets/d/…`)."*
2. Khi người dùng gửi link → gọi tool **`chamcong_set_sheet`** với `{ url: "<link họ gửi>" }`. Xác nhận lại: *"Đã lưu sheet, từ giờ tôi kiểm tra trên sheet này."*
   - Nếu tab dữ liệu / tab ngân hàng có tên khác mặc định, truyền thêm `dataTab` / `bankTab`.
3. Sau khi có sheet → hướng dẫn ngắn: *"Nhắn 'kiểm tra công nhân chưa xác nhận' để tôi quét và báo cáo tóm tắt."*

## Đảm bảo quyền

Nhắc người vận hành: tài khoản Google đã kết nối (connector) phải có **quyền xem + sửa** sheet đó (agent ghi kết quả vào cột riêng).

## Sau khi xong

Xoá file này sau khi bootstrap xong (đã có sheet cấu hình).

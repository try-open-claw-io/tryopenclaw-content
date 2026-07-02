# Nền tảng OpenClaw hoạt động thế nào (mô hình cơ bản)

> File này giúp agent giải thích cách OpenClaw vận hành và **vì sao đôi khi một tính năng "chưa dùng được"**.
> Đọc file này trước khi hướng dẫn các tính năng cần "instance đang chạy".

## Mô hình 3 tầng

```
Workspace  →  Instance (OpenClaw đang chạy)  →  Agent (trợ lý trò chuyện)
```

- **Workspace**: không gian làm việc của bạn (hoặc của team). Chứa gói cước, số dư credit, các app đã kết nối.
- **Instance**: một "máy" OpenClaw đang chạy trong workspace. Đây là nơi agent thực sự hoạt động. **Rất nhiều tính năng chỉ dùng được khi instance đang chạy.**
- **Agent**: trợ lý bạn trò chuyện cùng. Một instance có thể có nhiều agent; mỗi agent có tên, tính cách, model AI và bộ kỹ năng riêng.

## Điều kiện chung hay gặp

Khi khách nói "tôi không cài được / không tạo được / không thấy nút", thường vì một trong các lý do sau:

1. **Chưa có instance, hoặc instance chưa chạy.** Cài skill, kết nối kênh, cài agent từ marketplace, lên lịch tác vụ, kết nối AI provider — tất cả cần **một instance đang chạy**. Nếu chưa có, thường sẽ thấy banner mời "Tạo instance".
2. **Đang dùng gói miễn phí.** Tạo instance cần **gói trả phí** (không tạo được instance ở gói free). Hướng khách nâng cấp gói nếu cần tạo instance.
3. **Workspace bị tạm ngưng do nợ phí.** Sẽ gặp thông báo kiểu "Workspace bị tạm ngưng — hãy nâng cấp gói để tiếp tục". Cần xử lý thanh toán để mở lại.
4. **Hết credit.** Các tính năng AI cần credit (khi dùng model của platform). Hết credit thì AI không chạy cho tới khi nạp thêm.

## Credit & gói cước (nói ngắn gọn cho khách)

- **Credit** được tính **theo mỗi lần gọi AI** (pay-as-you-go), không tính khi tạo/triển khai. Dùng model của platform (Auto) sẽ trừ credit.
- Nếu khách **dùng API key riêng** của mình (BYOK), họ trả tiền trực tiếp cho nhà cung cấp AI, không trừ credit platform.
- Chi tiết nạp credit / đổi gói nằm ở mục **AI Credits** và **Billing** trong Cài đặt — hướng khách vào đó, agent không tự thao tác thanh toán.

## Nguyên tắc cho agent

- Khi một tính năng "chưa dùng được", **đừng chỉ báo lỗi** — kiểm tra nhanh 4 điều kiện trên và hướng khách bước cụ thể (tạo/khởi động instance, nâng gói, nạp credit).
- Agent **chỉ hướng dẫn**, không tự tạo instance, tự thanh toán hay tự kết nối thay khách.

# Scheduled Tasks — Cho agent tự chạy theo lịch

> **Scheduled Task (Tác vụ định kỳ)** = để một agent **tự động làm việc theo lịch** mà bạn không cần có mặt.
> Mỗi tác vụ = **một agent + một prompt (việc cần làm) + một lịch**. Đến giờ, agent chạy prompt và **gửi kết quả vào cuộc trò chuyện** cho bạn xem.

## Dùng khi nào

- Báo cáo/nhắc việc định kỳ: tóm tắt cuối ngày, báo cáo tuần cho sếp, nhắc deadline.
- Nhắc thói quen: chào buổi sáng, nhắc uống nước, nhắc uống thuốc.
- Việc lặp lại: gợi ý nội dung standup mỗi sáng, tổng hợp theo tuần.

## Cần gì trước

- Một **instance đang chạy** và **ít nhất một agent** trên instance (không có agent thì không chọn được ai chạy).

## Cách tạo một tác vụ

1. Mở **Tác vụ định kỳ** (sidebar) → bấm **Tạo tác vụ**.
2. **Chọn agent** — ai sẽ chạy tác vụ này (bắt buộc).
3. Nhập **Tên** tác vụ.
4. Nhập **Prompt** — "Agent cần làm gì ở mỗi lần chạy?" (đây là việc agent thực hiện mỗi lần đến giờ).
5. Đặt **Lịch chạy** — chọn 1 trong 3 chế độ:
   - **Lặp lại** (mặc định): chọn **giờ** + các **thứ trong tuần** (vd "Các ngày trong tuần lúc 09:00").
   - **Một lần**: chọn **ngày + giờ** cho một lần chạy duy nhất (phải ở tương lai).
   - **Định kỳ**: "Mỗi" **N** + đơn vị (**phút / giờ / ngày**), tối thiểu N = 1.
   Bên cạnh sẽ hiện tóm tắt lịch bằng lời (vd "Mỗi ngày lúc 07:00").
6. (Tuỳ chọn) mở **Cài đặt nâng cao** để chọn **Model** riêng cho tác vụ; để trống thì dùng model mặc định của agent.
7. Bấm **Tạo tác vụ**. Xong sẽ có thông báo "Đã tạo tác vụ".

## Bắt đầu nhanh từ mẫu

- Chuyển sang tab **Templates** (hoặc dùng thẻ mẫu ở màn hình trống): có sẵn nhiều mẫu (chào buổi sáng, nhắc uống nước, báo cáo tuần, nhật ký 3 dòng...).
- Chọn một mẫu → mẫu đã điền sẵn agent/tên/prompt/lịch, bạn **chỉnh lại được** → bấm **Thêm tác vụ này**.

## Quản lý tác vụ

- **Bật/tạm dừng**: dùng công tắc trên thẻ (Đang chạy / Đã tạm dừng).
- **Sửa**: mở thẻ → chỉnh các trường → **Lưu**.
- **Xoá**: mở thẻ → **Xoá** → xác nhận. (Xoá xong tác vụ ngừng chạy ngay.)
- **Lịch sử chạy**: trong phần chi tiết, xem tối đa 10 lần chạy gần nhất (đạt / bỏ qua / lỗi).

## Lưu ý cần thiết

- **Múi giờ = giờ trên trình duyệt lúc bạn tạo** tác vụ (chưa có bộ chọn múi giờ). Nếu đặt "Một lần", nên kiểm tra lại giờ cho đúng.
- Mỗi lần chạy là một lượt của agent → **dùng model/credit như một tin nhắn chat** bình thường.
- Hiện **chưa có nút "Chạy ngay"** trong giao diện — tác vụ chạy theo lịch.

## Gợi ý cho agent khi hướng dẫn

- Hỏi khách: việc gì, chạy vào lúc nào, lặp lại ra sao → map vào 3 chế độ Lặp lại/Một lần/Định kỳ.
- Nếu khách mô tả một việc phổ biến, gợi ý dùng **Templates** cho nhanh.
- Nhắc khách viết prompt rõ ràng vì agent sẽ chạy đúng câu đó mỗi lần.

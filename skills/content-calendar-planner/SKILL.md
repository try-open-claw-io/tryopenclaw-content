---
name: content-calendar-planner
description: Lập và kiểm tra lịch nội dung theo tuần/tháng cho Content Marketing Agent. Dùng khi user hỏi "Kiểm tra content calendar", "hôm nay cần viết/đăng gì", "lịch content tuần này", "tuần sau đăng gì", "cập nhật content calendar", "thêm content vào lịch", "dời deadline bài viết" và tương đương tiếng Anh như "check content calendar", "what's due today", "this week's content schedule", "add to content calendar", "reschedule this post". Trigger khi request liên quan tới xem/lập/sửa lịch xuất bản nội dung (viết, gửi review, đăng), không trigger khi user chỉ muốn viết nội dung mới (dùng skill viết nội dung tương ứng).
---

Skill quản lý lịch nội dung — nguồn sự thật cho "cái gì, khi nào, ai làm".

## Input cần

- Nguồn lịch: Google Sheets (bảng calendar chính) hoặc Notion (database content). Agent phải biết connector nào đang dùng — hỏi user nếu chưa rõ, không tự bịa spreadsheet ID/database ID.
- Khung thời gian cần xem: hôm nay / tuần này / tuần sau / tháng này. Nếu user không nói rõ, mặc định "hôm nay".
- Nếu thêm/sửa entry: tên content, format (blog/social/email/case study/landing page...), ngày draft, ngày review, ngày publish, kênh đăng, người phụ trách (nếu có).

## Cách hoạt động

1. Đọc calendar hiện tại từ Google Sheets/Notion — KHÔNG suy diễn lịch từ trí nhớ.
2. Lọc theo khung thời gian được hỏi. Với "hôm nay cần làm gì" — trả về danh sách item có deadline draft/review/publish rơi vào hôm nay hoặc quá hạn.
3. Trả kết quả dạng danh sách ngắn: tên content — format — trạng thái (draft/review/scheduled/published) — deadline — kênh.
4. Nếu user yêu cầu thêm/sửa/dời entry — xác nhận thay đổi với user trước khi viết vào Sheets/Notion. Không tự dời deadline mà không hỏi.
5. Nếu phát hiện xung đột lịch (2 content cùng kênh cùng ngày, hoặc deadline đã quá hạn nhiều ngày chưa xử lý) — cảnh báo user, không tự âm thầm bỏ qua.
6. Nếu có Google Calendar liên kết (lịch review/publish dạng event) — đồng bộ 2 chiều nếu user đã setup; nếu chưa setup thì chỉ dùng Sheets/Notion làm nguồn chính.

## Quy tắc cứng

- Không tự tạo idea/content mới trong skill này — chỉ quản lý lịch. Idea mới → dùng `content-idea-generator`.
- Không xoá entry khỏi calendar mà không xác nhận.
- Ngày/deadline luôn hiển thị theo format rõ ràng (YYYY-MM-DD), tránh mơ hồ.

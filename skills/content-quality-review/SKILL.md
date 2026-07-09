---
name: content-quality-review
description: Review chất lượng nội dung (hook, clarity, CTA, logic, tone), theo dõi performance content đã đăng, và gửi nội dung để review qua Slack. Dùng khi user nói "Review chất lượng bài này", "content này ổn chưa", "theo dõi performance content", "content nào đang tốt/tệ", "gửi bài này để review", "gửi qua Slack cho team review" và tương đương tiếng Anh như "review this content quality", "check content performance", "send this for review on Slack". Trigger cho 3 nhóm việc — review nội dung trước publish, theo dõi performance sau publish (GA4/Search Console/Facebook Page/LinkedIn Page), và gửi bản review ngắn qua Slack.
---

Skill review — 3 chế độ, chọn đúng chế độ theo yêu cầu.

## Chế độ 1: Review chất lượng nội dung (trước publish)

Input: draft/nội dung cần review.

Đánh giá theo 5 tiêu chí, mỗi tiêu chí có nhận xét ngắn + điểm cần sửa (nếu có):

1. **Hook** — câu/đoạn mở có giữ được người đọc không.
2. **Clarity** — nội dung có rõ ràng, dễ hiểu, tránh jargon không cần thiết.
3. **CTA** — CTA có rõ ràng, đúng vị trí, khớp mục tiêu content.
4. **Logic** — mạch lập luận có nhất quán, không mâu thuẫn, không thiếu bước.
5. **Tone** — có khớp brand voice không (nếu brand voice đã xác định; nếu chưa, chỉ nhận xét tone chung, không áp chuẩn brand).

Kết luận: liệt kê điểm cần sửa theo mức độ ưu tiên (must-fix / nice-to-have).

## Chế độ 2: Theo dõi performance content (sau publish)

Input: content đã đăng, khung thời gian cần xem.

- Blog/article → kéo data GA4 (traffic, time on page, bounce rate, conversion nếu có goal setup) và Google Search Console (impression, CTR, ranking keyword).
- Social post → kéo data Facebook Page và LinkedIn Page (reach, engagement, click, comment).
- Trả bảng tóm tắt: content nào đang tốt (traffic/engagement cao), content nào đang kém, gợi ý hành động (ví dụ: bài có impression cao CTR thấp → cần sửa title/meta description).
- KHÔNG tự bịa số liệu nếu connector chưa kết nối — báo user cần kết nối GA4/Search Console/Facebook Page/LinkedIn Page trước.

## Chế độ 3: Gửi nội dung để review qua Slack

Input: nội dung cần gửi review + channel/người nhận trên Slack (hỏi nếu chưa rõ).

- Đóng gói bản review NGẮN: tóm tắt content (1-2 câu), link/đoạn trích chính, điểm cần feedback cụ thể (không gửi nguyên bài dài vào Slack).
- Gửi qua Slack đúng channel/người được chỉ định.
- Xác nhận với user nội dung tóm tắt trước khi gửi, tránh gửi nhầm channel.

## Quy tắc cứng

- Không tự publish/sửa content trong skill này — chỉ review và báo cáo, sửa thật do skill viết nội dung tương ứng xử lý.
- Không bịa số liệu performance khi connector (GA4/Search Console/Facebook Page/LinkedIn Page) chưa kết nối hoặc không trả data.
- Bản gửi Slack luôn ngắn gọn — mục đích là dễ feedback nhanh, không phải copy nguyên văn bản.

## Copy Health Check — chấm nhanh Chế độ 1 (community-distilled)

Ngoài 5 tiêu chí trên, chấm draft qua 8 câu yes/no, mỗi "no" là 1 điểm phải sửa:
1. Headline qua test "so what?" (người đọc thấy lợi ích ngay)?
2. Đã xử lý nỗi nghi ngại/objection số 1 chưa?
3. Trẻ 12 tuổi đọc có hiểu (không jargon)?
4. Mỗi section chỉ 1 CTA rõ?
5. Dẫn bằng lợi ích, không liệt kê tính năng?
6. Có đáng dừng lướt để đọc không?
7. Mọi câu đều kiếm được chỗ đứng (không câu thừa)?
8. Đọc ra giọng người, không phải máy?
Điểm < 6/8 → viết lại trước khi publish.

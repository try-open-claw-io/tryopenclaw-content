---
name: content-quality-review
description: Review chất lượng draft nội dung trước khi xuất bản (hook, clarity, CTA, logic, tone). Dùng khi user nói "Review chất lượng bài này", "content này ổn chưa", "check giúp bài này", "góp ý draft này" và tương đương tiếng Anh như "review this content", "is this draft good", "give feedback on this". CHỈ review draft — không theo dõi performance, không gửi qua kênh ngoài (agent này viết-focused, không có connector data/social/Slack).
---

Skill review chất lượng draft nội dung — bản viết-focused (chỉ 1 chế độ: review trước publish).

## Input cần

- Draft/nội dung cần review (paste text hoặc link Google Docs).
- Nếu brand voice đã xác định (xem SOUL.md/MEMORY.md), review tone theo đúng brand voice; nếu chưa, chỉ nhận xét tone chung.

## Cách hoạt động

Đánh giá theo 5 tiêu chí, mỗi tiêu chí có nhận xét ngắn + điểm cần sửa (nếu có):

1. **Hook** — câu/đoạn mở có giữ được người đọc không.
2. **Clarity** — nội dung rõ ràng, dễ hiểu, tránh jargon không cần thiết.
3. **CTA** — CTA rõ ràng, đúng vị trí, khớp mục tiêu content.
4. **Logic** — mạch lập luận nhất quán, không mâu thuẫn, không thiếu bước.
5. **Tone** — khớp brand voice không (nếu đã xác định; chưa thì nhận xét tone chung).

Kết luận: liệt kê điểm cần sửa theo mức độ ưu tiên (must-fix / nice-to-have).

## Quy tắc cứng

- Chỉ review và báo cáo — KHÔNG tự sửa content (sửa thật do skill viết tương ứng xử lý).
- KHÔNG bịa nhận xét về số liệu/nguồn nếu draft không có; chỉ đánh giá chất lượng viết.
- Ngoài phạm vi agent này: xem performance sau publish (cần data GA4/GSC) và gửi review qua Slack — nếu user cần, nói rõ ngoài phạm vi agent viết.

---
name: content-idea-generator
description: Tạo ý tưởng nội dung mới dựa trên persona, campaign và keyword. Dùng khi user nói "Tạo idea mới", "gợi ý idea content", "cần idea cho campaign X", "idea content theo keyword Y", "brainstorm content cho persona Z" và tương đương tiếng Anh như "generate content ideas", "brainstorm topics for campaign X", "idea based on keyword", "what should we write about". Trigger khi user cần đề xuất chủ đề/idea mới, không trigger khi đã có idea rồi và cần biến thành brief (dùng `content-brief-builder`).
---

Skill sinh idea nội dung có căn cứ — brainstorm từ input user cung cấp, không phụ thuộc data analytics (agent này viết-focused, không có connector GA4/GSC).

## Input cần

- Ít nhất 1 trong: persona/pain point, campaign đang chạy, keyword mục tiêu. Nếu user không cho gì, HỎI user muốn generate theo hướng nào trước khi generate — không tự bịa hướng.
- Tài liệu tham khảo nếu user cung cấp (brand guideline, persona doc trong Google Drive) — đọc để idea bám đúng đối tượng.

## Cách hoạt động

1. Xác định hướng generate: theo persona, theo campaign, hay theo keyword. Có thể kết hợp nếu user yêu cầu.
2. Sinh danh sách idea, mỗi idea gồm:
   - Tiêu đề/chủ đề đề xuất
   - Format phù hợp (blog, social, email, case study, landing page, newsletter...)
   - Lý do chọn (bám vào persona/pain point/keyword nào)
   - Mức độ liên quan tới campaign hiện tại (nếu có)
3. Sắp theo mức độ ưu tiên nếu có nhiều idea — dựa trên độ khớp với persona/campaign user nêu.
4. Hỏi user chọn idea nào để đẩy tiếp sang `content-brief-builder`.

## Quy tắc cứng

- KHÔNG tự khẳng định "trend" hay "đang hot" nếu không có nguồn user cung cấp — nói rõ đây là gợi ý dựa trên suy luận, không phải data xác nhận.
- Idea đề xuất phải có format cụ thể, không để chung "viết content về X".
- Ngoài phạm vi agent này: chấm điểm idea bằng data traffic/search thật (cần GA4/Search Console) — nếu user cần, nói rõ ngoài phạm vi agent viết.

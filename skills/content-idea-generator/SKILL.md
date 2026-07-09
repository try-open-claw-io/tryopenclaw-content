---
name: content-idea-generator
description: Tạo ý tưởng nội dung mới dựa trên persona, campaign, keyword và trend. Dùng khi user nói "Tạo idea mới", "gợi ý idea content", "cần idea cho campaign X", "idea content theo keyword Y", "content nào đang trend", "brainstorm content cho persona Z" và tương đương tiếng Anh như "generate content ideas", "brainstorm topics for campaign X", "idea based on keyword", "what should we write about". Trigger khi user cần đề xuất chủ đề/idea mới, không trigger khi đã có idea rồi và cần biến thành brief (dùng `content-brief-builder`).
---

Skill sinh idea nội dung có căn cứ — không bốc từ không khí.

## Input cần

- Ít nhất 1 trong: persona/pain point, campaign đang chạy, keyword mục tiêu, trend đang nổi. Nếu user không cho gì, hỏi user muốn generate theo hướng nào trước khi generate.
- Dữ liệu tham khảo (nếu có sẵn):
  - GA4: nội dung nào đang có traffic tốt/kém, trang nào bounce cao.
  - Google Search Console: query nào có impression cao nhưng CTR thấp, query đang lên nhưng chưa có content trả lời.
  - Google Sheets: danh sách persona, pain point, campaign brief đã có sẵn.

## Cách hoạt động

1. Xác định hướng generate: theo persona, theo campaign, theo keyword, hay theo trend. Có thể kết hợp nhiều hướng nếu user yêu cầu.
2. Nếu có GA4/Search Console — kéo dữ liệu thật (query, traffic, ranking gap) làm căn cứ, không tự đoán con số.
3. Sinh danh sách idea, mỗi idea gồm:
   - Tiêu đề/chủ đề đề xuất
   - Format phù hợp (blog, social, email, case study, landing page...)
   - Lý do chọn (bám vào persona/pain point/keyword/trend/data nào)
   - Mức độ liên quan tới campaign hiện tại (nếu có)
4. Sắp theo mức độ ưu tiên nếu có nhiều idea — dựa trên độ khớp với campaign + cơ hội SEO (nếu có data Search Console).
5. Hỏi user chọn idea nào để đẩy tiếp sang `content-brief-builder`.

## Quy tắc cứng

- Không tự khẳng định "trend" nếu không có nguồn (Search Console, GA4, hoặc user cung cấp) — nói rõ đây là gợi ý dựa trên suy luận, không phải data xác nhận.
- Không lặp lại idea đã có sẵn trong content calendar (kiểm tra nếu user có Sheets/Notion calendar) trừ khi là góc nhìn mới rõ rệt.
- Idea đề xuất phải có format cụ thể, không để chung "viết content về X".

## Sinh idea theo tầng nhận biết (community-distilled)

Khi brainstorm từ persona, trải idea qua 5 mức awareness thay vì dồn 1 chỗ: Unaware/Problem-aware → idea giáo dục, gọi tên pain bằng chữ của khách; Solution-aware → so sánh cách tiếp cận, phá lầm tưởng; Product-aware/Most-aware → idea gần chuyển đổi (demo/so sánh/case). Lấy chữ từ Voice-of-Customer (review/forum/support) làm hook idea, không dùng chữ marketing sáo.

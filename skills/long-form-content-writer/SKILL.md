---
name: long-form-content-writer
description: Viết draft nội dung dài — blog post, article, guide, case study, thought leadership — dựa trên brief/outline đã có. Dùng khi user nói "Viết draft", "viết bài blog này", "viết full bài theo outline", "viết thought leadership về X" và tương đương tiếng Anh như "write the draft", "write this blog post", "draft the article", "write a thought leadership piece". Trigger khi cần viết nội dung dài hoàn chỉnh, không trigger cho social post ngắn (`social-post-writer`), email/newsletter (`newsletter-writer`), hay landing page (`landing-page-copywriter`).
---

Skill viết draft dài. Output là **bài viết hoàn chỉnh**, đọc như người viết — không phải một khung phân tích có nhãn.

## Input cần

- Brief (mục tiêu, audience, angle, key message, CTA, format) — bắt buộc, đề xuất chạy `content-brief-builder` nếu chưa có.
- Outline (nếu có, từ `blog-outline-generator`) — dùng làm khung, khuyến nghị cho bài dài.
- Data/số liệu/quote thật nếu bài cần trích dẫn — hỏi user cung cấp, không tự bịa.

## Output — bài viết, không phải template

Tư duy nội bộ về mục tiêu, audience, angle, CTA, phương án tiêu đề, và điểm cần verify — nhưng **KHÔNG in cái khung đó ra**. User nhận đúng bài viết:

- Chỉ trả **nội dung bài** (tiêu đề + thân bài theo heading structure + CTA nằm tự nhiên trong bài). KHÔNG bọc trong "Content objective / Target audience / Main angle / Draft content / Suggested variations / Review notes". Cái template 7-nhãn đó là dấu hiệu rõ nhất của văn máy — đừng bao giờ xuất ra.
- Nếu có điểm cần user xác minh (số liệu chưa có nguồn, quote còn thiếu, giọng brand còn tạm), ghi **một dòng ngắn cuối bài** ("Cần bạn xác nhận: …"), không phải mục "Review notes" trang trọng.
- Nếu muốn gợi ý tiêu đề/hook khác, đưa **tối đa một phương án**, nói như người, không phải danh sách "Suggested variations".

## Cách hoạt động

1. Đọc brief + outline. Thiếu brief thì chạy `content-brief-builder` trước hoặc hỏi user thông tin tối thiểu — không viết mù.
2. Viết bám outline, đúng độ dài yêu cầu, đúng brand voice nếu đã xác định (xem `brand-voice-editor`/SOUL.md; chưa xác định thì viết tone trung lập chuyên nghiệp và nói rõ ở dòng cuối rằng cần chỉnh giọng sau).
3. **Chạy `humanizer` trước khi trả**: cắt từ sáo AI, bỏ kiểu liệt kê "**Mục:** giải thích", bỏ lạm dụng gạch ngang dài/in đậm, phá "rule of three", cho câu có nhịp và có quan điểm. Bài phải đọc như người, không như AI đọc thuộc.
4. Lưu vào Google Docs nếu user yêu cầu, đúng folder campaign.

## Quy tắc cứng

- KHÔNG bịa số liệu, quote, tên khách hàng, kết quả case study. Thiếu thì để placeholder `[[NEEDS SOURCE: ...]]` và nêu ở dòng cuối.
- KHÔNG tự publish — chỉ lưu draft; đăng bài là việc của user/quy trình khác.
- KHÔNG mở bài bằng câu sáo ("Trong thời đại số ngày nay…"), KHÔNG nhồi bullet khi nội dung là văn xuôi.

## Bộ khung viết (community-distilled) — chọn 1 khung theo mục tiêu

- **PAS** (Problem → Agitate → Solution): giải pain, thuyết phục.
- **AIDA** (Attention → Interest → Desire → Action): dẫn tới hành động.
- **BAB** (Before → After → Bridge): transformation, kể chuyện.
- **PASTOR** (Problem, Amplify, Story, Testimony, Offer, Response): bài dài/sales.
Dẫn đúng awareness level người đọc (unaware → most-aware). Headline làm 80% việc — dồn lực vào tiêu đề + 2 câu hook đầu. Feature → Benefit → ý nghĩa ("có X" → "bạn được Y, nghĩa là Z").

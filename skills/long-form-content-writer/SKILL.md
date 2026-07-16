---
name: long-form-content-writer
description: Viết draft nội dung dài — blog post, article, guide, case study, thought leadership — dựa trên brief/outline đã có. Dùng khi user nói "Viết draft", "viết bài blog này", "viết full bài theo outline", "viết thought leadership về X" và tương đương tiếng Anh như "write the draft", "write this blog post", "draft the article", "write a thought leadership piece". Trigger khi cần viết nội dung dài hoàn chỉnh, không trigger cho social post ngắn (`social-post-writer`), email/newsletter (`newsletter-writer`), hay landing page (`landing-page-copywriter`).
---

Skill viết draft dài — output BẮT BUỘC theo 7-part output contract của agent, không phải văn bản tự do.

## Input cần

- Brief (mục tiêu, audience, angle, key message, CTA, format) — bắt buộc, đề xuất chạy `content-brief-builder` nếu chưa có.
- Outline (nếu có, từ `blog-outline-generator`) — dùng làm khung, không bắt buộc nhưng khuyến nghị cho bài dài.
- Data/số liệu/quote thật nếu bài cần trích dẫn — hỏi user cung cấp, không tự bịa.

## Output — 7-part contract (BẮT BUỘC đúng thứ tự, đúng đủ 7 phần)

1. **Content objective** — mục tiêu bài viết đạt được.
2. **Target audience** — persona/đối tượng đọc.
3. **Main angle** — góc nhìn chính của bài.
4. **Draft content** — nội dung đầy đủ, viết theo outline (nếu có), đúng heading structure, đủ độ dài yêu cầu.
5. **CTA** — call-to-action cụ thể ở cuối bài (và giữa bài nếu outline có chỉ định).
6. **Suggested variations** — 1-2 phương án khác cho tiêu đề hoặc hook mở bài, để user chọn.
7. **Review notes** — điểm cần user xác minh trước khi publish (số liệu chưa verify, claim cần nguồn, đoạn cần feedback từ chuyên gia).

Đây là contract cố định của agent — không bỏ phần nào, không đổi thứ tự, không gộp phần.

## Cách hoạt động

1. Đọc brief + outline (nếu có). Không viết nếu thiếu brief — brief thiếu thì chạy `content-brief-builder` trước hoặc hỏi user cung cấp thông tin tối thiểu.
2. Viết draft bám outline structure, đúng tone mong muốn (nếu brand voice đã xác định — xem `brand-voice-editor`/SOUL.md agent; nếu chưa xác định, viết theo tone trung lập chuyên nghiệp và ghi rõ trong Review notes rằng cần chỉnh theo brand voice sau).
3. Đóng gói output đúng 7 phần theo contract trên — không thiếu, không thừa phần.
4. Lưu draft vào Google Docs (khuyến nghị) hoặc đẩy trực tiếp WordPress dạng draft (không publish) nếu user yêu cầu, lưu vào đúng folder Google Drive của campaign.
5. Nếu bài dùng số liệu/quote khách hàng thật, liệt kê rõ trong Review notes phần nào cần user xác minh lại nguồn.

## Quy tắc cứng

- KHÔNG bịa số liệu, quote, tên khách hàng, kết quả case study. Nếu thiếu, để placeholder rõ ràng (ví dụ "[cần số liệu thật từ khách hàng]") và nêu trong Review notes.
- KHÔNG publish trực tiếp lên WordPress — chỉ lưu draft, publish là hành động của user hoặc do skill/quy trình khác xử lý riêng.
- KHÔNG bỏ qua phần nào trong 7-part contract dù bài ngắn hay dài.

---
name: newsletter-writer
description: Viết nội dung newsletter/email. Dùng khi user nói "Viết newsletter tuần này", "viết email content cho campaign X", "soạn nội dung email gửi khách hàng" và tương đương tiếng Anh như "write this week's newsletter", "draft the email content for campaign X", "write a customer newsletter". Trigger khi cần viết nội dung email dạng newsletter/campaign gửi hàng loạt, không trigger cho social post hay landing page.
---

Skill viết nội dung newsletter/email — ngắn, scannable, có CTA rõ.

## Input cần

- Mục tiêu email (thông báo, nuôi dưỡng lead, giới thiệu content mới, promo...).
- Audience/segment nhận (nếu có phân segment).
- Nội dung/nguồn để đưa vào (bài blog mới, case study, sản phẩm mới...) — nếu derive từ content có sẵn, có thể phối hợp với `content-repurposer`.

## Output

1. **Subject line** — 1-2 phương án, ngắn, gây tò mò hoặc nêu giá trị rõ, tránh spam-trigger words.
2. **Preview text** — dòng preview hiển thị trong inbox, bổ sung cho subject line.
3. **Nội dung email** — mở đầu ngắn, 1-3 nội dung chính (mỗi phần ngắn, scannable, có thể dùng bullet), mỗi phần có CTA/link riêng nếu phù hợp.
4. **CTA chính** — 1 CTA chính rõ ràng nhất, đặt nổi bật.
5. **Suggested send time** (nếu user hỏi) — gợi ý thời điểm gửi hợp lý, không bắt buộc.

## Cách hoạt động

1. Xác nhận mục tiêu + audience/segment trước khi viết.
2. Viết ngắn — email không phải nơi viết dài như blog, ưu tiên scannable, mỗi đoạn ngắn.
3. Nếu nhiều nội dung trong 1 email, sắp theo độ quan trọng giảm dần.
4. Đảm bảo mọi link/CTA trong email trỏ đúng nguồn (bài blog, landing page, form) mà user cung cấp — không tự bịa link.
5. Lưu draft vào Google Docs để review trước khi đẩy qua hệ thống gửi email (ngoài phạm vi skill này nếu cần tích hợp thêm).

## Quy tắc cứng

- Không tự viết nội dung quá dài kiểu blog vào email — giữ đúng format scannable của newsletter.
- Không bịa link/CTA không có nguồn thật từ user.
- Nếu chưa rõ audience/segment, hỏi trước khi viết — nội dung nuôi dưỡng lead khác nội dung promo khách cũ.

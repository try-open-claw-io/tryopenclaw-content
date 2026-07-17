---
name: landing-page-copywriter
description: Viết copy cho landing page. Dùng khi user nói "Viết copy landing page cho X", "viết nội dung trang landing", "làm copy cho trang đăng ký sự kiện Y" và tương đương tiếng Anh như "write landing page copy", "draft copy for this landing page", "write the copy for our signup page". Trigger khi cần viết toàn bộ hoặc từng phần copy của 1 landing page, không trigger cho bài blog dài hay email.
---

Skill viết copy landing page — tối ưu cho conversion, không phải để đọc dài.

## Input cần

- Mục tiêu landing page (đăng ký event, download tài liệu, mua hàng, demo request...) — bắt buộc.
- Audience/persona đích.
- Offer cụ thể (cái gì được cho/bán, giá trị gì nhận được).
- Nếu có brief từ `content-brief-builder`, dùng làm nền.

## Output — cấu trúc landing page copy

1. **Headline** — câu chính, nêu giá trị/offer rõ ràng trong 1 câu.
2. **Subheadline** — bổ sung ngữ cảnh/giá trị phụ.
3. **Body/benefit bullets** — 3-5 điểm lợi ích chính, ngắn, cụ thể (tránh mô tả tính năng suông, nêu lợi ích cho người đọc).
4. **Social proof** (nếu có data thật — số khách hàng, logo, testimonial thật) — không tự bịa nếu chưa có.
5. **CTA chính** — 1 CTA rõ ràng, lặp lại ở đầu và cuối trang nếu trang dài.
6. **FAQ/objection handling** (nếu cần) — trả lời trước các câu hỏi/nghi ngại thường gặp.

## Cách hoạt động

1. Xác nhận mục tiêu + offer + audience trước khi viết.
2. Viết copy ngắn, mạnh, tập trung conversion — câu ngắn, mỗi bullet 1 ý.
3. CTA phải nhất quán xuyên suốt trang (không đổi CTA giữa các section trừ khi có lý do rõ).
4. Lưu vào Google Docs để review, sau khi user approve thì đẩy vào WordPress dạng draft/page nếu user yêu cầu deploy qua WordPress.
5. Nếu thiếu social proof/testimonial thật, để placeholder rõ ràng, không tự sáng tác testimonial.

## Quy tắc cứng

- Không bịa số liệu/testimonial/social proof không có nguồn thật.
- Không đưa nhiều CTA cạnh tranh nhau trên cùng 1 trang — 1 mục tiêu conversion chính.
- Không publish trực tiếp lên WordPress mà không qua bước user approve draft trước.

## Homepage sections
Khi merchant cần copy trang chủ (hero / category / trust strip / product cards / brand promise), đọc `references/homepage.md` (pattern + example + guardrail). Hero chỉ một message chính; trust strip chỉ hiển thị chính sách đã xác minh.

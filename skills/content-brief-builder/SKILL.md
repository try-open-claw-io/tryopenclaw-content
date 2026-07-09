---
name: content-brief-builder
description: Biến 1 idea đã chọn thành content brief đầy đủ trước khi viết draft. Dùng khi user nói "Viết content brief", "làm brief cho idea này", "lên brief bài blog X", "brief cho case study Y" và tương đương tiếng Anh như "write a content brief", "build a brief for this idea", "create brief for blog post". Trigger sau khi đã có idea cụ thể (từ `content-idea-generator` hoặc user tự đưa), trước khi viết outline/draft. Không trigger nếu user muốn viết draft luôn — vẫn nên build brief trước, nhưng nếu user từ chối brief và yêu cầu viết thẳng thì chuyển sang skill viết nội dung tương ứng.
---

Skill dựng brief — cầu nối giữa idea và outline/draft.

## Input cần

- Idea/chủ đề đã chọn (bắt buộc).
- Nếu thiếu, hỏi user: mục tiêu content (awareness/consideration/conversion/SEO/retention), audience/persona, format đích (blog/social/case study/landing page/newsletter), campaign liên quan (nếu có).

## Output

Brief gồm đúng các phần sau, theo thứ tự:

1. **Mục tiêu** — content này đạt được gì (traffic, lead, brand awareness, sales enablement...).
2. **Audience** — persona cụ thể, pain point họ đang có.
3. **Angle** — góc nhìn/tiếp cận riêng, tránh chung chung.
4. **Key message** — 1-3 message chính phải truyền tải.
5. **CTA** — hành động mong muốn từ người đọc.
6. **Format** — loại content + độ dài dự kiến + kênh đăng.
7. **Outline sơ bộ** (nếu đủ thông tin) — các mục lớn sẽ triển khai, chưa cần chi tiết (outline chi tiết dùng `blog-outline-generator`).

## Cách hoạt động

1. Xác nhận idea + mục tiêu + audience với user trước khi viết brief đầy đủ.
2. Viết brief theo cấu trúc trên, ngắn gọn, cụ thể — tránh câu chữ chung chung ("nội dung hấp dẫn", "thu hút khách hàng").
3. Lưu brief vào Google Docs hoặc Notion (theo connector user đang dùng) trong đúng thư mục/database content của workspace. Nếu chưa rõ vị trí lưu, hỏi user.
4. Nếu có Google Drive, đặt brief cùng folder với các brief khác của campaign đó để dễ tra cứu.
5. Sau khi brief xong, hỏi user có muốn chuyển tiếp sang outline (`blog-outline-generator`) hoặc viết thẳng draft.

## Quy tắc cứng

- Không bỏ qua phần nào trong 6 phần bắt buộc (Mục tiêu, Audience, Angle, Key message, CTA, Format).
- Không tự chọn campaign nếu có nhiều campaign đang chạy — hỏi user gắn vào campaign nào.
- Brief phải đủ cụ thể để người khác viết draft mà không cần hỏi lại — nếu thiếu thông tin, hỏi user trước khi hoàn thiện brief.

## Nâng chất brief — Voice-of-Customer + Awareness (community-distilled)

- **Voice-of-Customer:** ghi current state → desired state, frustration số 1 *bằng đúng chữ khách dùng* (từ review/forum/support ticket/sales call), top 3 objection, và "từ khách hay dùng / từ cần tránh". Đưa các cụm này vào brief để draft nói đúng giọng thị trường, không sáo.
- **Awareness level** — người đọc ở 1 trong 5 mức, brief ghi rõ để draft dẫn đúng: (1) Unaware → story/pattern interrupt; (2) Problem-aware → đồng cảm + "có cách tốt hơn"; (3) Solution-aware → khác biệt + proof; (4) Product-aware → vì sao mua NGAY + risk reversal; (5) Most-aware → giá + CTA. Sai awareness level là lý do phổ biến nhất khiến content trượt.

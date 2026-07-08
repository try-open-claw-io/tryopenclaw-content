---
name: social-post-writer
description: Viết nội dung đăng social — Facebook, LinkedIn, Instagram. Dùng khi user nói "Chuẩn bị nội dung đăng social", "viết caption Facebook", "viết post LinkedIn về X", "viết caption Instagram cho campaign Y" và tương đương tiếng Anh như "write a social post", "prepare Facebook caption", "draft a LinkedIn post", "write Instagram caption". Trigger khi cần viết post ngắn cho 1 hoặc nhiều kênh social cụ thể, không trigger cho bài blog dài (`long-form-content-writer`) hay khi cần chuyển 1 nội dung có sẵn thành nhiều post (`content-repurposer`).
---

Skill viết post social theo kênh — mỗi kênh có văn phong/độ dài/format riêng.

## Input cần

- Chủ đề/nội dung cốt lõi muốn truyền tải, hoặc brief/content gốc nếu đang derive từ nội dung khác (nếu derive từ content có sẵn để ra nhiều post, dùng `content-repurposer` thay).
- Kênh đích: Facebook Page, LinkedIn Page, và/hoặc Instagram. Hỏi nếu chưa rõ kênh nào.
- CTA mong muốn (nếu có).

## Output — mỗi kênh gồm

1. **Caption** — viết đúng văn phong kênh (Facebook: gần gũi, có thể dài hơn; LinkedIn: chuyên nghiệp, có insight/số liệu; Instagram: ngắn, hook mạnh ở câu đầu, caption hỗ trợ visual).
2. **Hashtag** — set hashtag phù hợp kênh + ngành, số lượng hợp lý theo convention kênh (Instagram nhiều hơn LinkedIn/Facebook).
3. **CTA** — hành động cụ thể (comment, click link, DM, share...).
4. **Visual brief** — mô tả ngắn loại visual cần (ảnh, carousel, video, đồ họa text) để designer/agent khác dựng, không tự tạo ảnh.

## Cách hoạt động

1. Xác nhận kênh + chủ đề với user.
2. Viết riêng caption cho mỗi kênh được yêu cầu — không copy-paste 1 caption cho tất cả kênh, phải điều chỉnh tone/độ dài/hashtag theo từng kênh.
3. Đưa visual brief đủ cụ thể để người dựng hình hiểu (không cần tự generate ảnh trong skill này).
4. Nếu có content calendar, hỏi user muốn ghi post này vào lịch (đẩy qua `content-calendar-planner`) không.

## Quy tắc cứng

- Không viết CTA yêu cầu hành động mà brand chưa có (ví dụ CTA "mua ngay" khi chưa có link/sản phẩm cụ thể) — hỏi user nếu thiếu thông tin CTA.
- Không tự đăng bài lên Facebook Page/LinkedIn Page/Instagram — skill này chỉ soạn nội dung, việc đăng do user hoặc quy trình publish riêng xử lý.
- Hashtag phải liên quan trực tiếp nội dung, không nhồi hashtag không liên quan để tăng reach.

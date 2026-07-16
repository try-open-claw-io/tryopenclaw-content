---
name: blog-outline-generator
description: Tạo outline chi tiết cho bài blog từ content brief đã có. Dùng khi user nói "tạo outline cho bài blog", "lên outline bài X", "outline cho article Y", "cấu trúc bài viết theo brief này" và tương đương tiếng Anh như "generate a blog outline", "create outline from this brief", "structure this article". Trigger khi đã có brief (từ `content-brief-builder` hoặc user tự đưa) và cần outline chi tiết trước khi viết draft đầy đủ. Không trigger cho social post, email, hay landing page — các format đó dùng skill viết riêng.
---

Skill triển khai brief thành outline chi tiết cho bài blog/article/guide.

## Input cần

- Content brief (mục tiêu, audience, angle, key message, CTA, format) — bắt buộc. Nếu chưa có brief, đề xuất chạy `content-brief-builder` trước.
- Độ dài mong muốn của bài (ngắn ~800 từ, trung ~1500 từ, dài ~2500+ từ) — hỏi nếu chưa rõ.

## Output

Outline gồm:

1. **Working title** — 1-2 phương án tiêu đề bám angle của brief.
2. **Hook mở bài** — ý tưởng câu mở đầu, không cần viết full.
3. **Cấu trúc heading (H2/H3)** — danh sách heading theo thứ tự logic, mỗi heading kèm 1-2 câu mô tả nội dung sẽ triển khai bên trong.
4. **Điểm chèn CTA** — vị trí gợi ý (giữa bài, cuối bài) và nội dung CTA bám theo brief.
5. **Nguồn/số liệu cần** — nếu bài cần data/quote/case study, ghi rõ cần tìm ở đâu (không tự bịa số liệu).

## Cách hoạt động

1. Đọc brief, bám đúng angle + key message, không lệch hướng.
2. Triển khai heading theo logic đọc tự nhiên: mở vấn đề → phân tích → giải pháp → CTA. Điều chỉnh theo format cụ thể (guide vs thought leadership vs listicle) nếu brief có ghi rõ.
3. Đánh dấu rõ phần nào cần data thật (số liệu, quote khách hàng, kết quả) để người viết draft biết cần xác minh, không tự điền số liệu giả vào outline.
4. Lưu outline vào Google Docs (cùng file với brief nếu có, thêm section mới) hoặc theo yêu cầu user.
5. Sau khi outline xong, hỏi user có OK để chuyển sang `long-form-content-writer` viết draft đầy đủ không.

## Quy tắc cứng

- Không viết outline nếu chưa có brief — brief thiếu thì brief trước, không đoán mục tiêu/audience.
- Không tự thêm data/số liệu/case study cụ thể vào outline — chỉ đánh dấu "cần xác minh".
- Outline phải bám sát 1 angle duy nhất từ brief, không lan man nhiều góc nhìn trong 1 bài.

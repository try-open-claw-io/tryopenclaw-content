---
name: content-repurposer
description: Chuyển 1 nội dung gốc thành nhiều format khác nhau. Dùng khi user nói "Tái sử dụng nội dung", "biến bài blog này thành post LinkedIn", "repurpose bài này", "làm carousel từ bài blog", "cắt bài này ra nhiều nội dung nhỏ" và tương đương tiếng Anh như "repurpose this content", "turn this blog into social posts", "break this article into multiple formats". Trigger khi có 1 nội dung gốc (blog, case study, guide...) đã hoàn chỉnh và cần derive ra nhiều format phái sinh, không trigger khi viết post social từ đầu không có nguồn gốc (`social-post-writer`).
---

Skill derive 1 nội dung gốc thành nhiều output phái sinh, giữ đúng key message gốc.

## Input cần

- Nội dung gốc (link Google Docs/WordPress, hoặc paste text) — bắt buộc.
- Danh sách format đích muốn tạo, mặc định nếu user không chỉ định cụ thể số lượng: 5 post LinkedIn, 3 email, 1 video script, 1 carousel brief (theo spec agent). User có thể yêu cầu số lượng/format khác.

## Cách hoạt động

1. Đọc nội dung gốc, xác định key message, số liệu/insight chính, CTA gốc.
2. Với mỗi format đích, trích 1 góc nhìn/đoạn/insight khác nhau từ nội dung gốc — KHÔNG lặp lại đúng 1 đoạn cho nhiều post, mỗi phái sinh phải có lý do đứng độc lập được.
3. Output theo từng format:
   - **LinkedIn post (x5)**: mỗi post 1 insight/luận điểm riêng từ bài gốc, văn phong chuyên nghiệp, kèm CTA link về nội dung gốc.
   - **Email (x3)**: mỗi email 1 góc tiếp cận khác (ví dụ: intro insight, case study trong bài, CTA hành động), ngắn gọn, có subject line.
   - **Video script (x1)**: script ngắn (dạng note kịch bản, không cần full lời thoại) bám key message chính, có hook mở đầu.
   - **Carousel brief (x1)**: số slide đề xuất + nội dung ngắn mỗi slide + gợi ý visual, không tự dựng hình.
4. Giữ nhất quán CTA/key message với nội dung gốc — không tạo message mâu thuẫn với bài gốc.
5. Lưu tất cả output derive vào cùng 1 nơi (Google Docs section mới, hoặc file riêng) để dễ đối chiếu với nguồn.

## Quy tắc cứng

- Không bịa thêm số liệu/claim không có trong nội dung gốc.
- Không tạo phái sinh mâu thuẫn tone/message với bài gốc — nếu brand voice đã xác định, áp dụng luôn (xem `brand-voice-editor`).
- Nếu nội dung gốc thiếu thông tin để derive đủ số lượng yêu cầu (ví dụ bài quá ngắn không đủ ý cho 5 LinkedIn post riêng biệt), báo cho user thay vì lặp ý.

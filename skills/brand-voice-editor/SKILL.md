---
name: brand-voice-editor
description: Chỉnh sửa nội dung có sẵn theo brand voice đã xác định — tone, độ dài, cách diễn đạt, claim, CTA. Dùng khi user nói "Chỉnh theo brand voice", "sửa tone cho đúng brand", "chỉnh lại claim/CTA theo voice công ty", "làm nội dung này giống văn phong thương hiệu" và tương đương tiếng Anh như "edit to match brand voice", "adjust tone to brand guidelines", "rewrite this in our brand voice". Trigger khi cần chỉnh nội dung ĐÃ CÓ theo chuẩn brand voice, không trigger khi viết nội dung mới từ đầu.
---

Skill chỉnh nội dung theo brand voice — CHỈ chạy khi brand voice đã được xác định.

## Điều kiện bắt buộc trước khi chỉnh

1. Kiểm tra brand voice đã được định nghĩa ở đâu — thường trong SOUL.md của agent hoặc tài liệu brand guideline (Google Docs/Notion) user đã cung cấp.
2. **Nếu brand voice CHƯA được xác định rõ** (SOUL.md không có phần brand voice, hoặc không có brand guideline nào được chỉ ra) → **DỪNG LẠI, KHÔNG tự đoán brand voice**. Hỏi user cung cấp:
   - Tone mong muốn (formal/casual, nghiêm túc/vui vẻ, chuyên gia/gần gũi...)
   - Độ dài câu/đoạn ưu tiên
   - Từ ngữ/cụm từ nên dùng hoặc tránh
   - Quy tắc claim (được nói gì, không được nói gì — ví dụ số liệu phải có nguồn, không dùng superlative không kiểm chứng được)
   - Style CTA đặc trưng của brand (nếu có)
3. Chỉ tiến hành chỉnh sửa sau khi có đủ thông tin brand voice, từ SOUL.md/brand guideline có sẵn hoặc từ câu trả lời của user.

## Cách hoạt động (khi đã có brand voice)

1. Đọc nội dung gốc cần chỉnh.
2. Áp brand voice vào các lớp:
   - **Tone** — điều chỉnh giọng văn tổng thể.
   - **Độ dài** — cắt/mở rộng câu đoạn theo chuẩn brand (ví dụ brand ưu tiên câu ngắn, đoạn ngắn).
   - **Cách diễn đạt** — thay từ ngữ/cụm từ không đúng voice bằng từ ngữ chuẩn brand.
   - **Claim** — rà soát claim/số liệu, đảm bảo đúng quy tắc brand (không phóng đại, có nguồn nếu brand yêu cầu).
   - **CTA** — chuẩn hoá theo style CTA brand.
3. Trả lại bản đã chỉnh + tóm tắt ngắn những gì đã thay đổi (không cần diff từng câu, nêu các nhóm thay đổi chính).
4. Nếu phát hiện claim không có nguồn hoặc không chỉnh được vì thiếu thông tin — giữ nguyên và ghi chú cần user xác minh, không tự xoá hoặc tự bịa số liệu thay thế.

## Quy tắc cứng

- KHÔNG tự suy đoán brand voice nếu chưa được xác định — đây là rule cứng nhất của skill này, dừng và hỏi trước.
- KHÔNG thay đổi ý nghĩa/key message gốc của nội dung, chỉ chỉnh tone/diễn đạt/hình thức.
- KHÔNG tự thêm claim mới để "nghe brand hơn" — chỉ chỉnh claim đã có sẵn theo đúng quy tắc brand.

---
name: humanizer
description: 'Bước cuối bắt buộc, làm sạch dấu vết AI trên mọi text Agent tạo ra trước khi giao cho merchant, viết lại cho đọc như người viết thật. Chạy tự động sau mọi draft content (mô tả sản phẩm, caption, blog, email, landing, ad copy). Cũng dùng khi user nói "làm tự nhiên hơn", "bớt giọng AI", "nghe giống người thật", "humanize", "đọc đang giống máy quá" và tương đương tiếng Anh như "make it sound human", "less AI", "humanize this", "de-AI". Chỉ viết lại STYLE, KHÔNG thêm hay đổi fact.'
---

Skill làm sạch dấu vết AI. Đây là pass CUỐI CÙNG trên mọi text Agent giao cho merchant. Không phải bước tuỳ chọn, không phải bước bỏ qua khi vội. Nó viết lại và mài giũa văn phong; nó KHÔNG bịa, không thêm, không đổi bất kỳ fact nào.

> Bản này là humanizer do chính merchant sở hữu, tự author cho Merchant Content Agent. Bản catalog chuẩn (canonical) chưa có lúc build; đây là bản thay thế đầy đủ, chạy độc lập.

## Required environment

No API key. Pure text rewriting, chạy local. Skill nhận text draft (từ skill viết content khác hoặc user dán vào) và trả lại bản đã viết lại.

## Khi nào chạy (bắt buộc)

- **Sau mọi draft** — là step cuối trước khi giao, luôn luôn. Skill viết content khác (`product-description-writer`, `social-post-writer`, `long-form-content-writer`, `landing-page-copywriter`, `newsletter-writer`, ...) gọi humanizer ở bước cuối trước khi trả kết quả.
- Khi user yêu cầu trực tiếp ("làm tự nhiên hơn", "bớt giọng AI", "humanize").

## Nguyên tắc gốc (không thoả hiệp)

**Chỉ sửa STYLE, không đụng SUBSTANCE.** Humanizer viết lại cách diễn đạt, nhịp câu, từ ngữ. Nó KHÔNG được:

- Thêm fact, số liệu, tính năng, claim mới nào không có trong bản gốc.
- Đổi con số, thông số, giá, tên sản phẩm, cam kết, mức độ chắc chắn của claim (không đổi "có thể hỗ trợ" thành "đảm bảo").
- Thêm khuyến mãi, deadline, scarcity, social proof, review, testimonial giả.
- Đổi ý định gốc hay thông điệp của merchant, hay áp một brand voice lên.

Nếu bản gốc có placeholder `[cần số liệu thật]` / `[[NEEDS SOURCE]]` → giữ nguyên, KHÔNG tự điền.

## Strip — dấu vết AI phải loại

1. **Em-dash (—)**: bỏ hết. Thay bằng dấu phẩy, dấu chấm, dấu hai chấm, hoặc tách thành câu ngắn. Không để một em-dash nào sót lại.
2. **Cụm sáo AI rỗng nghĩa**: "Trong thế giới ... ngày nay", "Không thể phủ nhận rằng", "Điều quan trọng cần lưu ý", "khai phá/mở khóa tiềm năng", "nâng tầm", "bứt phá", "giải pháp toàn diện hàng đầu", "tối ưu hóa", "đột phá", "tiên tiến nhất" khi không có nội dung thật đỡ lưng. Viết lại thành câu cụ thể, hoặc cắt bỏ.
3. **Mở bài kiểu định nghĩa từ điển**: "X là ...". Thay bằng hook chạm nhu cầu hoặc vào thẳng.
4. **Kết bài "tóm lại" chung chung**: đoạn tổng kết rỗng cuối bài. Cắt, hoặc thay bằng câu kết cụ thể / CTA thật.
5. **Liệt kê đều đều máy móc**: kiểu "chất lượng, uy tín, tận tâm" hay bullet ba tính từ song song không thông tin. Thay bằng nội dung cụ thể hoặc gộp lại thành câu có ý.
6. **Bôi đậm / emoji rải rác vô nghĩa**: bỏ, trừ khi brand voice của merchant thật sự dùng.
7. **Nhịp câu robot đều tăm tắp**: câu nào cũng cùng độ dài, cùng cấu trúc. Phá vỡ: trộn câu ngắn với câu dài, đổi cách mở câu.

## Cách hoạt động

1. Đọc toàn bộ text gốc. Ghi nhận fact, số, claim, ý định, brand voice hiện có (đây là phần BẤT KHẢ XÂM PHẠM).
2. Quét từng mục Strip ở trên, sửa tại chỗ. Đặc biệt: search hết em-dash `—`, không sót.
3. Viết lại cho có nhịp người: câu ngắn xen câu dài, mở câu đa dạng, giọng tự nhiên, bỏ filler và hedging thừa.
4. **Đối chiếu lại**: bản viết lại phải mang đúng mọi fact/số/claim của bản gốc, không thừa không thiếu. Nếu lỡ đổi một fact → sửa về đúng bản gốc.
5. Trả về text đã viết lại. Không kèm giải thích dài; nếu có chỗ đáng lưu ý (vd đã bỏ một câu vì rỗng nghĩa) thì note một dòng ngắn.

## Quy tắc cứng

- **KHÔNG bịa, KHÔNG thêm fact.** Humanizer chỉ đổi cách nói. Nghi ngờ một câu là claim mới → không thêm.
- **KHÔNG đổi mức độ chắc chắn** của claim gốc.
- **Không em-dash sót lại.** Đây là lỗi thường gặp nhất; check kỹ.
- **Giữ brand voice của merchant**, không áp giọng riêng lên.
- **Không tự đăng.** Trả draft đã làm sạch; đăng do merchant quyết.

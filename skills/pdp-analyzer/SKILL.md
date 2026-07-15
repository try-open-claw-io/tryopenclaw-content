---
name: pdp-analyzer
description: 'Đọc 1 link trang sản phẩm (PDP) và trích ra bảng facts sạch — tên sản phẩm, giá, tính năng/thành phần, USP, đối tượng khách gợi ý, tín hiệu tone — để các skill viết khác dùng làm nguyên liệu. Dùng khi user nói "phân tích trang sản phẩm này", "đọc link sản phẩm", "trích thông tin từ link PDP", "lấy facts từ link này", và tương đương tiếng Anh "analyze this product page", "extract facts from this product URL", "read this PDP link". Trigger khi có 1 URL sản phẩm cần bóc thông tin có cấu trúc. Không trigger khi user muốn VIẾT mô tả sản phẩm (dùng `product-description-writer`), viết bài bất kỳ (các skill viết), nghiên cứu thị trường/đối thủ (dùng `market-insight-researcher`), hay khi user dán sẵn nội dung mà không có link (dùng `brief-from-input`).'
---

Skill bóc tách trang sản phẩm — chỉ trích những gì có thật trên trang, không sinh văn, không đoán.

## Công cụ cần

- `web-fetch` — đọc nội dung URL. Bắt buộc để chạy.
- `web-search` — chỉ dùng để phân giải URL rút gọn hoặc tìm lại trang khi link user đưa bị hỏng; KHÔNG dùng để bổ sung thông tin không có trên trang gốc.
- Không cần API key, không cần env. Chạy được ngay khi agent có `web-fetch`.

## Input cần

- 1 URL trang sản phẩm (PDP). Bắt buộc. Không có link → hỏi user link, không tự bịa nội dung sản phẩm.
- (Tùy chọn) ngữ cảnh user thêm: kênh sẽ dùng để viết, đối tượng khách thực tế, điểm muốn nhấn. Nếu có thì ghi vào phần ghi chú, không trộn vào facts trích từ trang.

## Cách hoạt động

1. Nhận URL. Gọi `web-fetch` đọc trang.
2. Nếu đọc được → trích theo checklist cố định dưới đây, mỗi trường chỉ điền thứ trang thật sự nói:
   - **Tên sản phẩm** — đúng tên hiển thị trên trang.
   - **Giá** — số + đơn vị tiền tệ nếu trang có. Nếu trang không niêm yết → ghi `[không có trên trang]`, không suy ra.
   - **Tính năng / thành phần / thông số** — gạch đầu dòng, bám sát chữ trên trang.
   - **USP / điểm khác biệt** — điểm bán hàng trang nêu rõ (cam kết, chứng nhận, khác biệt so với loại thường).
   - **Đối tượng khách gợi ý** — chỉ khi trang nêu; nếu chỉ suy luận thì đánh dấu `(suy luận từ nội dung, cần xác minh)`.
   - **Tín hiệu tone** — giọng văn trang đang dùng (vd trẻ trung, chuyên gia, thân mật), kèm 1-2 cụm chữ trích nguyên văn làm bằng chứng.
   - **Proof / bảo chứng** (nếu có) — review, số sao, số đã bán, bảo hành, chính sách đổi trả.
   - **CTA hiện có** (nếu có) — nút/lời kêu gọi trang đang dùng.
3. Trả về **bảng facts** dạng markdown: cột trường | cột nội dung. Trường trang không có → để `[không có trên trang]`. Trường không chắc chắn → `[cần xác minh]`.
4. Nếu trang thiếu trường quan trọng (không tên, không giá, không mô tả) → liệt kê rõ những gì thiếu và HỎI user bổ sung trước khi chốt bảng.
5. Kết bằng 1 dòng: bảng này là nguyên liệu cho các skill viết (`product-description-writer`, `content-brief-builder`, `social-post-writer`...), không phải bài hoàn chỉnh.

## Quy tắc cứng

- **Không bịa.** Không thêm thông tin, số liệu, thành phần, hay claim không có trên trang. Thiếu → hỏi user hoặc để marker `[cần xác minh]` / `[không có trên trang]`. Tuyệt đối không "làm tròn" hay đoán giá, công dụng, chứng nhận.
- **Không đọc được thì báo thẳng.** Nếu `web-fetch` lỗi, trang chặn bot, trang rỗng, hay trả về nội dung không phải trang sản phẩm → nói rõ "không đọc được trang" + lý do quan sát được, KHÔNG suy diễn nội dung sản phẩm từ URL hay tên miền. Đề nghị user kiểm tra link hoặc dán nội dung trang.
- **Phân ranh chức năng.** Skill này CHỈ phân tích 1 PDP và xuất facts. Việc viết mô tả/bài là của các skill viết (`product-description-writer` và anh em); việc nghiên cứu thị trường/đối thủ/từ khóa là của `market-insight-researcher`. Không lấn sân.
- **Chủ yếu trích, không sinh văn.** Output là bảng facts, không phải đoạn quảng cáo. Phần chữ ít ỏi do skill tự viết (ghi chú, câu kết) vẫn phải đọc như người: không em-dash, không sáo ngữ AI ("giải pháp toàn diện", "tối ưu hóa", "đột phá"), không in đậm máy móc.
- **Không trộn nguồn.** Facts trích từ trang để riêng; ngữ cảnh user thêm để riêng phần ghi chú. Không gộp lẫn khiến người đọc tưởng trang có thông tin mà thực ra là user nói.

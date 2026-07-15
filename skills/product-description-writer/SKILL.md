---
name: product-description-writer
description: 'Viết mô tả sản phẩm cho trang bán hàng e-commerce (PDP / trang collection). Dùng khi user nói "viết mô tả sản phẩm cho X", "viết mô tả cho SP này", "làm phần mô tả cho trang sản phẩm", "viết description cho collection Y" và tương đương tiếng Anh như "write a product description", "write the PDP copy for X", "describe this product for my store". Trigger khi cần viết mô tả bán hàng cho 1 sản phẩm hoặc 1 collection trên store. KHÔNG trigger cho: caption social (`social-post-writer`), copy landing page dài (`landing-page-copywriter`), bài blog / bài dài (`long-form-content-writer`).'
---

Skill viết mô tả sản phẩm e-commerce bán được — dựa trên facts thật, bám brand voice trong memory, đọc dễ lướt, có CTA. Đây là mô tả cho PDP (product detail page) hoặc trang collection, không phải caption social hay landing dài.

## Required environment

No API key required. Pure text writing, runs locally. Skill đọc facts sản phẩm từ output của `pdp-analyzer` hoặc do user cung cấp, và brand voice từ memory nếu có.

## Input cần

- Facts sản phẩm — bắt buộc. Lấy từ `pdp-analyzer` hoặc user cung cấp: tên SP, tính năng, thông số, chất liệu/thành phần, công dụng, đối tượng dùng, giá/ưu đãi nếu có.
- Kênh/nơi đăng (Shopee, website, TikTok Shop, Lazada...) — quyết định độ dài + format. Hỏi nếu chưa rõ.
- Keyword SEO chính (nếu có) — để chèn tự nhiên.
- Brand voice — đọc từ memory. Nếu chưa xác định → đánh dấu provisional + hỏi (xem Quy tắc cứng).

## Output — cấu trúc mô tả sản phẩm

1. **Hook mở đầu (PAS)** — 1-2 câu chạm pain/mong muốn của người mua rồi mở ra sản phẩm. Không phải câu khẩu hiệu rỗng.
2. **Feature → Benefit (FAB)** — mỗi tính năng/thông số nối thẳng tới lợi ích cụ thể cho người dùng. Không liệt kê thông số suông; nói "để làm được gì" cho khách.
3. **Điểm khác biệt** — 1-2 điều SP này hơn/khác lựa chọn thay thế. Chỉ nêu khi có fact thật đỡ lưng, không tự bịa "tốt nhất thị trường".
4. **Phần dễ lướt** — bullet ngắn cho thông số/điểm chính (kích thước, chất liệu, cách dùng, bảo hành...) để người mua quét nhanh.
5. **CTA** — 1 lời mời hành động hợp kênh (thêm vào giỏ, nhắn shop, đặt ngay), không nhồi nhiều CTA.

## Độ dài theo kênh (community-distilled)

- **Marketplace (Shopee/Lazada/TikTok Shop)**: mô tả ngắn–vừa, ưu tiên bullet + keyword ở đầu; người mua lướt trên mobile, chèn thông số sớm.
- **Website tự chủ (WordPress/Haravan/Shopify)**: dài hơn được, có thể mở bằng đoạn kể + FAB đầy đủ + bullet spec, kết CTA.
- **Collection/danh mục**: 2-4 câu giới thiệu nhóm SP, không đi sâu 1 SP.

## Cách hoạt động

1. Thu facts trước. Nếu thiếu thông số/thành phần/công dụng cần thiết → để `[cần số liệu thật]` ngay tại chỗ đó và hỏi user, KHÔNG tự điền.
2. Kiểm brand voice trong memory. Chưa có → viết bản provisional với ghi chú "[[giọng tạm — cần xác nhận brand voice]]" và hỏi, không mặc định một giọng.
3. Viết theo cấu trúc trên, khớp độ dài theo kênh. FAB: mỗi feature phải kèm benefit; câu người, nhịp thay đổi.
4. Chèn keyword SEO tự nhiên (tiêu đề + 1-2 lần trong body), không nhồi.
5. Chạy `humanizer` như bước cuối trước khi giao — bỏ em-dash, bỏ sáo ngữ, phá liệt kê đều đều.
6. Giao **draft + vài biến thể** (vd 1 bản ngắn cho marketplace, 1 bản dài cho web). Không tự đăng.

## Quy tắc cứng

- **Không bịa fact.** Thông số kỹ thuật, thành phần, công dụng, hiệu quả, chứng nhận — tất cả phải có nguồn thật (pdp-analyzer hoặc user). Thiếu → `[cần số liệu thật]` + hỏi, tuyệt đối không phịa.
- **Không phịa hiệu quả/cam kết** kiểu "trị dứt điểm", "hiệu quả 100%", "đạt chuẩn FDA" khi không có bằng chứng.
- **Brand voice chưa xác định** → provisional + hỏi, không tự chọn giọng.
- **Anti-AI cứng:** không em-dash; không sáo ngữ rỗng nghĩa ("giải pháp toàn diện hàng đầu", "tối ưu hóa", "đột phá", "tiên tiến nhất"); không liệt kê đều đều máy móc; viết câu người, nhịp thay đổi; bước cuối luôn humanize.
- **Không tự đăng** lên bất kỳ store/kênh nào — chỉ giao draft + biến thể; việc đăng do user.
- **Phân ranh:** đây là MÔ TẢ SẢN PHẨM (PDP/collection). Caption social → `social-post-writer`. Landing page dài → `landing-page-copywriter`. Bài dài/blog → `long-form-content-writer`.

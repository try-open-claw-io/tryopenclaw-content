---
name: ad-copy-writer
description: 'Viết text quảng cáo (ad copy) cho Facebook/Instagram/Google Ads để tối ưu chuyển đổi khi creative/hình ảnh đã có sẵn. Dùng khi user nói "viết ad copy", "text quảng cáo", "content chạy ads", "viết quảng cáo Facebook cho SP này", "caption chạy ads", "headline + primary text cho campaign", "viết mô tả quảng cáo Google" và tương đương tiếng Anh như "write ad copy", "write Facebook ad text", "ad copy for this product", "write Google ad headlines". Trigger khi cần viết PHẦN CHỮ của một quảng cáo trả phí (headline, primary text, CTA, hook) để chạy ads. KHÔNG trigger cho caption social organic (dùng social-post-writer), mô tả sản phẩm PDP (dùng product-description-writer), copy landing page dài (dùng landing-page-copywriter).'
---

Skill viết text quảng cáo trả phí bán được: giả định creative/hình ảnh đã có, agent viết PHẦN CHỮ để tối ưu chuyển đổi. Đây là ad copy chạy ads (Facebook/Instagram/Google), không phải caption organic, không phải mô tả PDP, không phải landing dài.

## Required environment

Không cần API key. Text writing thuần, chạy local. Skill đọc facts sản phẩm/offer từ output `pdp-analyzer` hoặc do user cung cấp, và brand voice từ memory nếu có.

## Input cần

- Facts sản phẩm/offer — bắt buộc. Tên SP, tính năng, lợi ích, thông số, đối tượng; nếu là offer thì amount + condition + deadline + terms. Lấy từ `pdp-analyzer` hoặc user cung cấp.
- Nền tảng chạy ads — Facebook / Instagram / Google Search. Quyết định format (primary text + headline vs. headline/description) và giới hạn ký tự. Hỏi nếu chưa rõ.
- Funnel stage — awareness / consideration / conversion. Quyết định angle + độ mạnh của CTA.
- Brand voice — đọc từ memory. Chưa có thì đánh dấu provisional + hỏi.

## Output mặc định

Mặc định giao **3–5 copy variants**, mỗi variant một angle KHÁC nhau:

1. **Product-benefit** — feature nối thẳng tới lợi ích thực tế.
2. **Offer** — ưu đãi/điều kiện/deadline (chỉ khi có offer thật, đủ terms).
3. **Problem/solution** — chạm objection/pain rồi mở ra cách SP xử lý.
4. **Identity/community** — dành cho ai, prompt tương tác nhẹ.
5. **High-consideration** — SP giá trị cao, CTA mềm (xem thông số / đặt lịch).

Mỗi variant HOÀN CHỈNH, sẵn dùng, gồm: **Headline** + **Primary text** (hoặc Description với Google) + **CTA**.

Kèm một block **HOOK OPTIONS** riêng: tối thiểu 3 hook có thể A/B test (dòng mở đầu khác nhau), để user thay thử.

Với Google Search: giao nhiều headline ngắn + description theo mô hình responsive search ad, không phải primary text dài.

## Cách hoạt động

1. Thu facts trước. Thiếu số liệu/offer term cần thiết → để `[cần số liệu thật]` ngay tại chỗ + hỏi user, KHÔNG tự điền.
2. Kiểm brand voice trong memory. Chưa có → bản provisional + ghi chú "[[giọng tạm — cần xác nhận brand voice]]" + hỏi.
3. Chọn angle theo funnel + facts sẵn có. Mỗi variant MỘT angle chính (không trộn nhiều angle vào một ad).
4. Chọn hook: đọc `references/hooks.md`, chọn theo thứ tự objective → funnel → facts → channel → brand voice. Chỉ dùng hook có đủ `required_facts`.
5. Viết theo pattern phù hợp: đọc `references/patterns.md` cho 5 ad pattern + gold example mẫu để học cơ chế viết (không chép nguyên văn).
6. Front-load: đẩy product/value quan trọng lên đầu vì mobile có thể truncate.
7. Kiểm rule trước khi giao: đọc `references/rules.md` — one-angle-per-ad, message match, benefit-before-proof, CTA-matches-funnel, offer completeness, no fabricated proof.
8. Chạy `humanizer` bước cuối: bỏ em-dash, bỏ sáo ngữ, phá liệt kê đều đều.
9. Giao 3–5 variant + block HOOK OPTIONS. KHÔNG tự chạy/đăng ad.

## Reference files

- `references/patterns.md` — 5 ad pattern (customer-language, benefit-no-tradeoff, plain value prop, feature-to-benefit, funnel-matched CTA) + gold example mẫu. Đọc khi chọn cấu trúc variant.
- `references/hooks.md` — 20 hook pattern production-ready + hook selection rule. Đọc khi soạn block HOOK OPTIONS.
- `references/rules.md` — ad-copy rule set (AD-RULE) + global fact/modality rule + nguồn best-practice Google/Meta. Đọc để QA trước khi giao.

## Quy tắc cứng

- **Không bịa fact/số liệu/proof/urgency.** Thông số, hiệu quả, chứng nhận, "đã có N khách", scarcity ("chỉ còn 3 suất"), deadline — tất cả phải có nguồn thật (pdp-analyzer hoặc user). Thiếu → `[cần số liệu thật]` + hỏi.
- **Giữ nguyên modality.** Không đổi "có thể", "hỗ trợ", "được công bố" thành khẳng định tuyệt đối. "Quãng đường công bố 120km trong điều kiện thử nghiệm" KHÔNG được rút thành "đi 120km".
- **Offer phải đủ term.** Nêu discount/deadline → phải kèm điều kiện + terms, nhất quán giữa ad và landing.
- **Một angle mỗi variant.** Không nhồi nhiều thông điệp vào một ad; muốn nhiều angle → nhiều variant.
- **CTA khớp funnel.** Không đòi cam kết cao hơn mức sẵn sàng của audience (awareness → "tìm hiểu thêm", không "mua ngay").
- **Brand voice chưa xác định** → provisional + hỏi, không tự chọn giọng.
- **Anti-AI cứng:** không em-dash; không sáo ngữ rỗng ("giải pháp toàn diện hàng đầu", "đột phá", "tối ưu hóa"); không liệt kê đều đều máy móc; câu người, nhịp thay đổi; bước cuối luôn humanize.
- **Không tự chạy/đăng ad** — chỉ giao variant + hook options; việc set campaign do user.
- **Phân ranh:** đây là AD COPY trả phí. Caption organic → `social-post-writer`. Mô tả PDP → `product-description-writer`. Landing dài → `landing-page-copywriter`.

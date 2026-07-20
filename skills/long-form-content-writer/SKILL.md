---
name: long-form-content-writer
description: Viết draft nội dung dài — blog post, article, guide, case study, thought leadership — dựa trên brief/outline đã có. Dùng khi user nói "Viết draft", "viết bài blog này", "viết full bài theo outline", "viết thought leadership về X" và tương đương tiếng Anh như "write the draft", "write this blog post", "draft the article", "write a thought leadership piece". Trigger khi cần viết nội dung dài hoàn chỉnh, không trigger cho social post ngắn (`social-post-writer`), email/newsletter (`newsletter-writer`), hay landing page (`landing-page-copywriter`).
---

Skill viết draft dài. 7-part contract dưới đây là **khung nội bộ để tự soát**, KHÔNG phải định dạng dán thẳng cho merchant. Bản GIAO cuối cùng phải theo Clean Room của agent (AGENTS.md): bài đăng SẠCH (không nhãn biên tập, không URL nguồn, không cờ) + khối "Ghi chú nội bộ (không đăng)" tách riêng ở cuối.

## Gate research — BẮT BUỘC (blog / bài website / SEO / bài từ link sản phẩm)
Skill này CHỈ được viết bài full khi đã có **research package** (từ `market-insight-researcher`, theo HARD GATE blog trong AGENTS.md):
- 1 nguồn chính chủ (PDP/merchant) + **2-3 nguồn organic ngoài (có URL thật)**
- 1 outline tổng hợp từ các nguồn đó

Nếu input CHƯA có research package → **DỪNG, KHÔNG draft full article.** Chuyển về `market-insight-researcher` chạy research trước, không tự viết từ trí nhớ training. Ngoại lệ DUY NHẤT: merchant nói rõ "viết không cần research" → khi đó viết nháp + disclaimer "chưa kiểm chứng" + placeholder `[cần số liệu/nguồn thật]` cho chỗ cần verify. Bài giao PHẢI kèm khối "Đã research" liệt kê việc đã làm (keyword đã search · nguồn + URL · ý top nguồn cover · giữ/bỏ/thêm theo USP).

## Input cần

- Brief (mục tiêu, audience, angle, key message, CTA, format) — bắt buộc, đề xuất chạy `content-brief-builder` nếu chưa có.
- Outline (nếu có, từ `blog-outline-generator`) — dùng làm khung, không bắt buộc nhưng khuyến nghị cho bài dài.
- Data/số liệu/quote thật nếu bài cần trích dẫn — hỏi user cung cấp, không tự bịa.

## 7-part contract — KHUNG NỘI BỘ để tự soát (KHÔNG dán nhãn ra bản đăng)

Chạy đủ 7 mục trong đầu để không sót, nhưng **chỉ mục 4+5 là copy sẵn đăng**; các mục còn lại là ghi chú:

1. **Content objective** *(nội bộ)* — mục tiêu bài viết đạt được.
2. **Target audience** *(nội bộ)* — persona/đối tượng đọc.
3. **Main angle** *(nội bộ)* — góc nhìn chính của bài.
4. **Draft content** *(→ BẢN ĐĂNG)* — bài đầy đủ theo outline, đúng heading structure, đủ độ dài. CTA dệt tự nhiên vào bài, KHÔNG in chữ "CTA" làm nhãn.
5. **CTA** *(→ nằm trong bản đăng)* — câu kêu gọi ở cuối bài (và giữa bài nếu outline chỉ định), viết như câu văn, không như nhãn.
6. **Suggested variations** *(→ Ghi chú nội bộ)* — 1-2 phương án tiêu đề/hook để user chọn.
7. **Review notes** *(→ Ghi chú nội bộ)* — điểm cần user xác minh trước khi publish (số liệu chưa verify, claim cần nguồn).

**Cách GIAO cho merchant:** bản đăng (mục 4+5, sạch, bưng lên web được ngay) đứng trước; khối `Ghi chú nội bộ (không đăng):` gói mục 1/2/3/6/7 đứng sau. Không trộn nhãn nội bộ vào giữa copy. Không có bằng chứng thì KHÔNG viết claim tuyệt đối vào bản đăng — xem Claim validator (AGENTS.md).

## Cách hoạt động

1. Đọc brief + outline (nếu có). Không viết nếu thiếu brief — brief thiếu thì chạy `content-brief-builder` trước hoặc hỏi user cung cấp thông tin tối thiểu.
2. Viết draft bám outline structure, đúng tone mong muốn (nếu brand voice đã xác định — xem `brand-voice-editor`/SOUL.md agent; nếu chưa xác định, viết theo tone trung lập chuyên nghiệp và ghi rõ trong Review notes rằng cần chỉnh theo brand voice sau).
3. Đóng gói output đúng 7 phần theo contract trên — không thiếu, không thừa phần.
4. Lưu draft vào Google Docs (khuyến nghị) hoặc đẩy trực tiếp WordPress dạng draft (không publish) nếu user yêu cầu, lưu vào đúng folder Google Drive của campaign.
5. Nếu bài dùng số liệu/quote khách hàng thật, liệt kê rõ trong Review notes phần nào cần user xác minh lại nguồn.

## Quy tắc cứng

- **KHÔNG draft blog/SEO/web long-form khi thiếu research package** (xem "Gate research" trên) — thiếu nguồn ngoài + outline tổng hợp thì chuyển về `market-insight-researcher`, không tự viết từ trí nhớ. Thiếu khối "Đã research" = chưa được xuất bài full.
- KHÔNG bịa số liệu, quote, tên khách hàng, kết quả case study. Nếu thiếu, để placeholder rõ ràng (ví dụ "[cần số liệu thật từ khách hàng]") và nêu trong Review notes.
- KHÔNG publish trực tiếp lên WordPress — chỉ lưu draft, publish là hành động của user hoặc do skill/quy trình khác xử lý riêng.
- KHÔNG bỏ qua phần nào trong 7-part contract dù bài ngắn hay dài.

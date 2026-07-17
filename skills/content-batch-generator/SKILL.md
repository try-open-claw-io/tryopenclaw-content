---
name: content-batch-generator
description: 'Lập kế hoạch rồi sinh MỘT LOẠT bài content đa dạng cho cả đợt/lịch — mỗi bài một angle + framework khác nhau, không na ná. Dùng khi user nói "viết cả loạt bài cho campaign X", "sinh content cho cả tuần/tháng", "tạo 10 bài cho đợt sale", "làm content calendar cho ra mắt sản phẩm", "1 sản phẩm này ra hết các định dạng social + mô tả + email" và tương đương tiếng Anh như "generate a batch of posts", "write content for the whole month", "create a content calendar for this campaign", "turn this product into all formats". Không trigger khi chỉ viết 1 bài lẻ — post lẻ dùng `social-post-writer`, mô tả sản phẩm dùng `product-description-writer`, blog dài dùng `long-form-content-writer`; biến 1 nội dung gốc thành phái sinh dùng `content-repurposer`; chỉ ra idea (chưa viết) dùng `content-idea-generator`; chỉ xem/sửa lịch xuất bản dùng `content-calendar-planner`.'
---

Skill điều phối: sinh một LOẠT bài cho cả đợt/lịch, đa dạng hoá có chủ đích để không bài nào na ná bài nào. Điểm cốt lõi không phải viết cho nhanh — mà là PHÂN TÍCH MỤC TIÊU của cả loạt trước, rồi lập ma trận phân bổ angle/framework/hook phục vụ mục tiêu đó, cuối cùng mới gọi các skill viết cho từng bài.

## Required environment

No API key required. Skill này thuần điều phối + soạn text, chạy local. Nếu output cần lưu vào Google Sheets/Docs hay lịch xuất bản thì việc đọc/ghi đó do các skill/connector khác lo (`content-calendar-planner`), không thuộc skill này.

## Input cần

- **Phạm vi loạt bài** (bắt buộc, hỏi nếu chưa rõ): bao nhiêu bài, cho khung nào (1 đợt campaign / 1 tuần / 1 tháng), kênh/định dạng nào (social post, mô tả sản phẩm, email, blog, landing...).
- **Mục tiêu kinh doanh của loạt** (bắt buộc — đây là trục chính): đang đẩy sản phẩm/chiến dịch nào, muốn khách ở giai đoạn nào chuyển sang giai đoạn nào (awareness → consideration → conversion → retention), thông điệp kinh doanh muốn đọng lại.
- **Nguyên liệu**: sản phẩm/persona/pain point/USP/seed catalog hoặc KB. Thiếu thì hỏi, không tự bịa.
- **One-click multi-format** (chế độ phụ): 1 sản phẩm → nhiều định dạng cùng lúc. Vẫn chạy đúng thuật toán đa dạng hoá bên dưới, chỉ khác nguồn là 1 sản phẩm thay vì nhiều chủ đề.

## Thuật toán: phân tích goal calendar → ma trận đa dạng hoá

Đây là phần làm nên giá trị skill. Làm đúng thứ tự, KHÔNG nhảy thẳng vào viết.

**Bước 1 — Phân tích mục tiêu cả loạt (trước khi viết bất kỳ bài nào).**
- Loạt này phục vụ sản phẩm/chiến dịch gì, KPI/kết quả mong muốn là gì.
- Khách đang ở tầng nhận biết nào và cần đẩy tới đâu: Unaware/Problem-aware → Solution-aware → Product-aware/Most-aware → Retention. Một loạt tốt trải khách qua nhiều tầng, không dồn hết vào 1 tầng.
- Thông điệp kinh doanh xuyên suốt (1 câu) mà mọi bài cùng phục vụ.

**Bước 2 — Lập MA TRẬN phân bổ.** Kẻ bảng, mỗi dòng = 1 bài, các cột:
- **Vai trò trong hành trình**: bài này kéo khách ở tầng nào tiến thêm bước nào (giáo dục / gọi tên pain / phá lầm tưởng / so sánh / proof-case / demo / chốt / giữ chân).
- **Angle** (góc tiếp cận): pain-first, benefit-first, story/khách hàng, hậu trường, so sánh, phản-lầm-tưởng, hướng dẫn/how-to, dữ liệu-thật (nếu có nguồn), mùa vụ/dịp...
- **Framework viết**: AIDA, PAS (Problem-Agitate-Solve), BAB (Before-After-Bridge), FAB (Feature-Advantage-Benefit), 4U, storytelling, listicle, Q&A... (chọn theo vai trò, không rải ngẫu nhiên).
- **Kiểu hook**: câu hỏi / con số-thật / tuyên bố ngược đời / mini-story / cảnh quen thuộc / lời khách nói thật (VoC)...
- **Định dạng + kênh**: khớp vai trò (vd bài chốt → mô tả sản phẩm/landing; bài giáo dục → blog/carousel).

**Bước 3 — Chống na ná (ràng buộc cứng của ma trận).**
- KHÔNG để 2 bài liền nhau trùng **angle + framework + kiểu hook**. Đổi ít nhất 1 trong 3 giữa hai bài kề nhau; ưu tiên đổi cả angle lẫn hook.
- Cả loạt phải phủ nhiều tầng nhận biết, không dồn 1 tầng.
- Không lặp cùng 1 câu mở đầu/cùng 1 công thức tiêu đề. Không lặp cùng 1 số liệu/ví dụ cho nhiều bài.
- Nếu số bài yêu cầu vượt số angle/vai trò hợp lý cho mục tiêu (dễ sinh trùng lặp) → báo user, đề xuất giảm số bài hoặc mở thêm sản phẩm/persona, thay vì nhồi bài na ná.

**Bước 4 — Sắp trình tự phục vụ mục tiêu.** Xếp thứ tự các bài theo mạch dẫn khách đi (thường mở bằng awareness/giáo dục, chèn proof ở giữa, dồn conversion về cuối đợt) — không xếp ngẫu nhiên.

**Bước 5 — Gọi skill viết cho từng bài.** Với mỗi dòng ma trận, gọi đúng skill viết theo định dạng, truyền kèm angle + framework + kiểu hook đã gán:
- Post social → `social-post-writer`
- Mô tả sản phẩm → `product-description-writer`
- Blog/bài dài → `long-form-content-writer` (dàn ý trước bằng `blog-outline-generator` nếu cần)
- Email/newsletter → `newsletter-writer`
- Landing → `landing-page-copywriter`
- Case study → `case-study-writer`
Sau khi có draft từng bài, chạy `humanizer` trên từng bài. Nếu brand voice đã xác định thì áp `brand-voice-editor`.

## Output

Giao **gói loạt bài** để user duyệt, gồm:
1. **Bảng ma trận** (bài | vai trò/tầng | angle | framework | hook | định dạng-kênh | thứ tự) — để user thấy loạt đa dạng và bám mục tiêu.
2. **Đúng 1 dòng lý do**: vì sao bố cục/trình tự này hợp mục tiêu đã nêu (vd "mở bằng 2 bài problem-aware để hâm nóng, 3 bài giữa đưa proof/so sánh, 2 bài cuối đẩy conversion trước ngày sale").
3. **Nội dung từng bài** đã viết sẵn (đã qua humanizer), sắp đúng thứ tự, sẵn để copy đi đăng.

Không tự đăng, không tự ghi vào lịch — chỉ giao gói để user duyệt.

## Ranh giới với skill khác

- **1 bài lẻ** → KHÔNG dùng skill này; gọi thẳng skill viết tương ứng (`social-post-writer` / `product-description-writer` / `long-form-content-writer`...). Skill này chỉ dùng khi cần NHIỀU bài + đa dạng hoá theo goal.
- **`content-repurposer`**: biến 1 nội dung GỐC đã có thành nhiều format phái sinh giữ nguyên key message. Còn skill này lập KẾ HOẠCH + sinh loạt bài MỚI, mỗi bài một góc/khung khác, theo mục tiêu cả lịch. Nếu user đã có 1 bài gốc và chỉ muốn xé nhỏ ra nhiều format → đó là repurposer.
- **`content-idea-generator`**: chỉ ra idea (chưa viết). Skill này đi tiếp: từ mục tiêu → ma trận → viết thật.
- **`content-calendar-planner`**: xem/sửa lịch xuất bản (cái gì đăng khi nào). Skill này sinh nội dung; việc xếp vào lịch/ghi Sheets do planner lo.

## Guardrails

- KHÔNG bịa số liệu, claim, quote, testimonial trong bất kỳ bài nào. Thiếu số liệu → để marker `[[NEEDS SOURCE: ...]]` cho user điền, không tự chế.
- Anti-AI cứng, áp cho MỌI bài: không em-dash (—), không từ sáo ("giải pháp toàn diện", "tối ưu hoá", "đột phá", "seamless", "elevate"...), không kiểu liệt kê "**Mục:** giải thích" máy móc, không "rule of three" gượng. Chính mục tiêu skill là chống sự na ná/đều đều — hai bài kề nhau phải nghe như hai bài khác nhau thật.
- Không tự đăng lên bất kỳ kênh nào, kể cả khi chạy theo lịch/cron — chỉ giao gói bài để user duyệt. Việc đăng do quy trình publish riêng của user.
- Brand voice chưa có → hỏi user, hoặc ghi rõ đang dùng giọng provisional (nêu giả định) để user chỉnh sau; không im lặng chọn giọng.
- Không viết CTA đòi hành động mà brand chưa có hạ tầng (link mua, mã giảm giá...) — hỏi user nếu thiếu.

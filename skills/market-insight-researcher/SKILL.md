---
name: market-insight-researcher
description: 'Dùng tool web-search + web-fetch tìm insight thị trường có nguồn (đối thủ, xu hướng, keyword/search-intent quanh sản phẩm hoặc chủ đề), rồi đề xuất angle nội dung kèm lý do. Dùng khi user nói "nghiên cứu thị trường cho sản phẩm này", "đối thủ đang viết gì", "keyword nào quanh chủ đề X", "search intent của từ khóa Y", "có angle nào đáng viết không", "tìm gap nội dung" và tương đương tiếng Anh "research the market for this product", "what are competitors writing", "keyword/search intent around X", "find a content gap/angle". Trigger khi user cần dữ liệu thị trường/đối thủ/keyword có nguồn để làm căn cứ viết. Không trigger khi chỉ cần brainstorm idea không cần nguồn (dùng content-idea-generator), khi cần viết bài (dùng skill viết tương ứng), hay khi phân tích 1 trang sản phẩm cụ thể (dùng pdp-analyzer).'
---

Skill research thị trường có căn cứ cho agent viết content. Nhiệm vụ: dùng web-search + web-fetch tìm insight thật (đối thủ, xu hướng, keyword/search-intent), rồi trả về insight brief ngắn + vài angle đề xuất kèm lý do. Không viết bài, không phân tích 1 trang sản phẩm, chỉ research và gợi ý hướng.

## Required environment

No API key required. Dùng tool `web-search` và `web-fetch` có sẵn trong runtime của agent. Nếu môi trường không bật được 2 tool này thì skill không chạy được. Báo rõ cho user, không tự bịa kết quả.

## Input cần

- Ít nhất 1 trong: tên/loại sản phẩm, chủ đề định viết, hoặc keyword mục tiêu. Nếu user chưa cho gì, hỏi trước khi search.
- (Tùy chọn) thị trường/ngôn ngữ target (VN, EN...), tên vài đối thủ đã biết, góc user muốn nhắm.

## Cách hoạt động

1. Khoanh phạm vi: xác định research theo sản phẩm, theo chủ đề, hay theo keyword. Chốt thị trường + ngôn ngữ trước khi search.
2. Chạy web-search theo 3 nhánh (bỏ nhánh không liên quan):
   - **Đối thủ**: ai đang xếp hạng / đang viết về chủ đề này, họ nói gì, bỏ sót gì.
   - **Xu hướng**: chủ đề/định dạng đang lên quanh sản phẩm (chỉ gọi là "trend" khi có nguồn xác nhận).
   - **Keyword / search-intent**: cụm người ta search, ý định đứng sau (thông tin, so sánh, mua), câu hỏi hay gặp.
3. Với nguồn đáng đào sâu, dùng web-fetch mở trang lấy chi tiết. Ghi lại URL cho từng phát hiện.
4. Tìm **gap**: câu hỏi chưa ai trả lời tốt, góc chưa ai khai thác, khoảng trống giữa cái người ta search và cái đối thủ đang viết.
5. Trả về **insight brief** gọn:
   - 3-6 phát hiện chính, **mỗi phát hiện kèm URL nguồn**.
   - Keyword/cụm search đáng nhắm (đánh dấu ý định của từng cụm nếu suy ra được).
   - Đối thủ nổi bật + họ mạnh/yếu chỗ nào.
6. Đề xuất **2-4 angle** nội dung, mỗi angle gồm: góc tiếp cận, gap/insight nó bám vào (dẫn nguồn), vì sao đáng viết. Không viết bài, bàn giao angle cho skill viết.

## Quy tắc cứng

- **Mọi claim phải kèm URL nguồn.** Số liệu / benchmark ngành / thống kê KHÔNG có nguồn thì đánh dấu `[[NEEDS SOURCE]]`, không đoán, không bịa con số.
- **Không bịa kết quả search.** Tool chưa search được (lỗi, rate limit, môi trường tắt tool) → báo rõ tình trạng, dừng lại, không dựng kết quả từ trí nhớ.
- **Chỉ gọi "trend" khi có nguồn.** Không có nguồn xác nhận thì nói rõ đây là suy luận, không phải dữ liệu.
- **Giữ ranh giới**: chỉ research + đề xuất angle. Không viết nội dung hoàn chỉnh (để skill viết lo). Không phân tích 1 trang sản phẩm cụ thể (để `pdp-analyzer` lo). Không dừng ở brainstorm idea thuần không nguồn (đó là `content-idea-generator`).
- **Trình bày như người viết**: câu ngắn xen câu dài, có nhận định, không gạch ngang dài (—), không sáo ngữ marketing. Insight nói thẳng, dẫn nguồn rõ.

## Tài liệu tham khảo (đọc trước khi research)

- `references/keyword-workflow.md` — workflow keyword research định tính (không dùng volume API): input cần, quy trình, format báo cáo. **Nhớ: chỉ dùng tín hiệu định tính; TUYỆT ĐỐI không claim search volume khi không có dữ liệu đo volume.**
- `references/blog-workflow.md` — flow blog SEO: keyword → search Google → fetch top organic + AI Overview → extract outline → synthesize → lọc ý không hợp USP + thêm heading USP → viết 1 bài hoàn chỉnh. **Phải SHOW chain-of-thought các bước research trước khi xuất bài.** Kèm bộ ví dụ GOLD-SEO.

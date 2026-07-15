---
name: brief-from-input
description: 'Biến input tối giản/lộn xộn của merchant (một link, một ý tưởng thô, vài chữ) thành content brief làm việc để bắt đầu ngay. Dùng khi user nói "làm brief nhanh từ cái này", "biến ý này thành brief", "brief từ link", "tôi mới có mỗi ý tưởng thô", "chưa biết viết gì, có mỗi link sản phẩm" và tương đương tiếng Anh như "quick brief from this", "turn this rough idea into a brief", "brief from this link", "I only have a link/a few words". Trigger khi input còn THÔ/thiếu và cần suy nhanh + nêu giả định. Không trigger khi user đã có idea rõ và muốn brief đầy đủ chuẩn hoá (dùng `content-brief-builder`), cũng không trigger khi user muốn viết thẳng bài (dùng skill viết nội dung tương ứng).'
---

Skill biến input thô thành content brief làm việc — inference-first, không bắt điền form.

## Required environment

No API key required. Suy luận + soạn text, chạy local. Nếu input là link sản phẩm và có connector đọc web/`pdp-analyzer`, có thể dùng để lấy dữ liệu thật; không bắt buộc.

## Vấn đề skill này giải

Merchant solo thường mở chat với input tối giản: một link sản phẩm, một câu ý tưởng, vài chữ gạch đầu dòng. Skill KHÔNG được bắt họ điền form brief đầy đủ trước khi bắt đầu. Nhiệm vụ: đọc những gì đã có → suy ra một brief làm việc đủ để khởi động → nêu rõ giả định → chỉ hỏi những câu còn thiếu có giá trị cao.

## Input

- Bất kỳ mẩu input nào: 1 link, 1 câu ý tưởng thô, vài keyword, ảnh sản phẩm, đoạn mô tả lộn xộn. Không có ngưỡng tối thiểu — có gì làm nấy.
- Nếu là link sản phẩm: đọc/suy từ nội dung link (tên, loại sản phẩm, giá, đối tượng gợi ý). Không bịa thông số không thấy.

## Output — content brief làm việc

Brief gồm các phần, mỗi phần ngắn gọn, cụ thể:

1. **Mục tiêu** — content này để làm gì (awareness / cân nhắc / chuyển đổi / SEO / giữ chân).
2. **Audience** — ai đọc, pain/mong muốn chính.
3. **Angle** — góc tiếp cận riêng, tránh chung chung.
4. **Key message** — 1-3 ý chính phải truyền tải.
5. **Format** — loại content + độ dài dự kiến + kênh đăng.
6. **CTA** — hành động mong muốn từ người đọc.

Ngay dưới brief, LUÔN kèm 2 khối phân định rõ:

- **Giả định đang dùng** — mọi thứ skill tự suy mà chưa được xác nhận, đánh dấu rõ là giả định (vd "Giả định: mục tiêu là chuyển đổi vì đây là link trang sản phẩm").
- **Cần xác nhận (tối đa 1-2 câu giá trị cao)** — chỉ những câu thật sự đổi hướng brief nếu trả lời khác đi. Không hỏi lan man.

## Cách hoạt động

1. Đọc hết input, tách rõ 3 loại thông tin:
   - **Đã cung cấp** — sự kiện lấy trực tiếp từ input/link.
   - **Giả định làm việc** — suy luận hợp lý để lấp chỗ trống, ghi rõ là giả định.
   - **Cần xác nhận** — chỗ trống mà đoán sai sẽ hỏng brief → gom thành 1-2 câu hỏi.
2. Soạn brief 6 phần dựa trên "đã cung cấp" + "giả định", KHÔNG chờ user trả lời câu hỏi mới bắt đầu — brief phải dùng được ngay như bản nháp làm việc.
3. Đặt 2 khối "Giả định đang dùng" + "Cần xác nhận" ngay sau brief.
4. Gợi ý bước tiếp: nếu user muốn brief đầy đủ chuẩn hoá (mục tiêu/audience/angle chuẩn, Voice-of-Customer, awareness level) → chuyển `content-brief-builder`; nếu muốn viết luôn → skill viết nội dung tương ứng (`blog-outline-generator`, `social-post-writer`, `long-form-content-writer`...).

## Ranh giới với skill khác

- **Chỉ TẠO BRIEF.** Không viết outline, không viết draft — đó là skill khác.
- **`brief-from-input` vs `content-brief-builder`:** skill này xử lý input THÔ/tối giản và suy nhanh ra brief làm việc để không kẹt ở khâu bắt đầu; `content-brief-builder` dựng brief ĐẦY ĐỦ, chuẩn hoá từ một idea đã chọn (thường đã qua `content-idea-generator`), nặng hơn về Voice-of-Customer + awareness level. Input còn thô → skill này trước; idea đã rõ, cần brief bài bản → chuyển `content-brief-builder`.

## Quy tắc cứng (guardrails)

- **Phân biệt rõ 3 loại thông tin** trong output: điều user đã cung cấp / giả định làm việc / điều cần xác nhận. Mọi suy luận phải gắn nhãn "giả định" — không trình bày phỏng đoán như sự thật.
- **Không bịa fact sản phẩm** (giá, thành phần, xuất xứ, công dụng, chứng nhận). Thiếu → hỏi 1-2 câu giá trị cao, hoặc nêu rõ giả định; không điền số/đặc điểm không có trong input.
- **Brand voice chưa xác định → không tự đoán giọng.** Hỏi, hoặc đánh dấu giọng là *provisional* (tạm) và ghi rõ cần chốt lại. Không mặc định một tông cụ thể như thể đã chốt.
- **Không bắt điền form đầy đủ trước khi bắt đầu.** Luôn giao được một brief nháp từ input hiện có; câu hỏi chỉ để tinh chỉnh, không phải điều kiện tiên quyết.
- Câu hỏi phải là loại cao-giá-trị (đổi hướng brief nếu trả lời khác), tối đa 1-2 câu. Không hỏi những thứ đã suy được hợp lý.

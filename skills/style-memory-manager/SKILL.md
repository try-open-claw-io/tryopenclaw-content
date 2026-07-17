---
name: style-memory-manager
description: 'Học và lưu "style memory" của chủ shop để giọng viết ngày càng giống họ — ghi lại preference từ feedback và rút preference từ bản do chính user tự sửa lại. Dùng khi user sửa/nhận xét output ("bớt trang trọng", "hook mạnh hơn", "câu ngắn lại") hoặc gửi lại BẢN HỌ TỰ SỬA để mình học. Tiếng Anh tương đương "remember how I write", "learn my style from my edits", "save this as my voice preference". KHÔNG trigger khi chỉ cần chỉnh 1 bài theo voice đã biết (đó là brand-voice-editor), khi viết nội dung mới từ đầu, hay khi humanize câu chữ.'
---

Skill HỌC + LƯU giọng viết của chủ shop vào MEMORY.md, để các bài sau viết gần chất riêng của họ hơn. Không viết nội dung mới, không chỉnh bài theo voice có sẵn — việc đó là của các skill khác.

## Required environment

No API key required. Chỉ đọc/ghi file `MEMORY.md` của workspace agent (thao tác dữ liệu local).

## Ranh giới với skill khác

- **brand-voice-editor** CHỈNH một bài theo voice đã biết. **style-memory-manager** HỌC voice/preference từ hành vi sửa của user rồi LƯU lại để dùng về sau. Nếu user chỉ muốn sửa 1 bài, không phải việc của skill này.
- **humanizer** bỏ dấu vết văn AI ở câu chữ. Skill này không sửa câu, chỉ quan sát và ghi nhớ.

## Hai việc skill làm

### (a) Ghi preference từ feedback trực tiếp

Khi user nói rõ ý muốn ("bớt trang trọng", "hook mạnh hơn", "đừng xưng em", "câu ngắn lại"):

1. Xác nhận đây là preference thật user nêu, không phải mình suy diễn.
2. Phân loại lâu dài vs nhất thời (xem mục Phân loại bên dưới).
3. Nếu là lâu dài → ghi entry vào MEMORY.md mục "Style memory".

### (b) Rút preference từ BẢN USER TỰ SỬA (việc quan trọng nhất)

Khi user gửi lại bản họ đã tự chỉnh output của agent:

1. **Diff hai bản** — đặt bản agent cạnh bản user sửa, đọc từng thay đổi, không đọc lướt.
2. **Phân loại từng thay đổi** vào các trục quan sát được:
   - **Từ ngữ ưa dùng / né tránh** — user đổi từ A thành từ B lặp lại ở nhiều chỗ.
   - **Độ dài câu** — user cắt câu dài thành câu ngắn, hay gộp lại.
   - **Cách xưng hô** — "shop/mình/em/bên mình" → dạng user chọn.
   - **Chi tiết thêm/bỏ** — user thêm chi tiết sản phẩm cụ thể, hay bỏ đoạn chung chung.
   - **Chỗ làm mềm / làm cứng** — user hạ giọng cam kết, hay tăng lời kêu gọi.
3. **Rút thành preference cụ thể**, kèm bằng chứng before → after.
4. **Chống over-fit** (xem mục dưới) trước khi quyết định ghi.
5. Ghi entry đạt ngưỡng vào MEMORY.md mục "Style memory".
6. Báo minh bạch cho user: đã ghi gì, dựa trên thay đổi nào.

## Phân loại: preference lâu dài vs nhất thời

- **Preference nhất thời (1 bài)** — hợp lý chỉ trong ngữ cảnh bài đó (sản phẩm này, dịp sale này, kênh này). KHÔNG ghi thành rule giọng lâu dài; nếu cần thì ghi chú riêng cho bài, không đưa vào "Style memory".
- **Preference lâu dài (rule giọng)** — cách viết user muốn áp cho mọi bài sau. CHỈ loại này mới ghi thành entry trong "Style memory".
- Khi chưa chắc → mặc định coi là nhất thời, hỏi user một câu ngắn để xác nhận trước khi nâng thành rule lâu dài.

## Chống over-fit (bắt buộc)

- Một lần sửa = một giả thuyết, KHÔNG phải quy tắc. Không biến 1 thay đổi đơn lẻ thành rule cứng.
- Chỉ nâng thành preference lâu dài khi: (1) tín hiệu lặp lại nhất quán ≥ 2 lần, HOẶC (2) user nói rõ "từ giờ luôn...".
- Phân biệt thay đổi gắn nội dung (đặc thù sản phẩm/bài này) với pattern văn phong (áp mọi bài) — chỉ pattern văn phong mới thành rule.
- Nếu hai lần sửa mâu thuẫn nhau → không ghi, nêu mâu thuẫn cho user chọn.

## Cấu trúc entry ghi vào MEMORY.md mục "Style memory"

Nếu MEMORY.md chưa có heading `## Style memory` thì tạo. Mỗi entry:

```
### <YYYY-MM-DD> — <nguồn: feedback | diff bản user tự sửa>
- Trục: <từ ngữ | độ dài câu | xưng hô | chi tiết | mềm/cứng>
- Preference: <mô tả cụ thể cách user muốn viết>
- Bằng chứng: "<trích bản agent>" → "<trích bản user sửa>"
- Loại: lâu dài
- Áp dụng: <cách áp ở bài sau>
```

Chỉ ghi entry `Loại: lâu dài`. Gộp vào trục đã có nếu trùng, đừng tạo entry trùng lặp.

## Áp preference ở bài sau

Trước khi các skill viết bài chạy, đọc mục "Style memory" và áp các rule lâu dài một cách nhất quán. Nếu một rule mới mâu thuẫn brand voice cốt lõi trong SOUL.md → không tự đè, nêu cho user quyết.

## Guardrails

- KHÔNG bịa preference user chưa thể hiện. Chỉ hệ thống hoá cái quan sát được từ feedback/chỉnh sửa THẬT; mọi entry phải có bằng chứng before → after hoặc câu feedback gốc.
- KHÔNG tự ý đổi brand voice cốt lõi. Chỉ preference lâu dài đã đạt ngưỡng mới ghi thành rule; nhất thời thì không đụng vào giọng nền.
- Ghi/sửa MEMORY.md là thao tác dữ liệu → LUÔN nêu rõ đã ghi/sửa gì và cho user thấy nội dung entry (minh bạch).
- Khi diễn đạt với user: không dùng gạch ngang dài, không sáo ngữ, viết như người thật.

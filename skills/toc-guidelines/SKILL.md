---
name: toc-guidelines
description: >-
  Mục lục năng lực ClawExpert/tryopenclaw: giải thích và HƯỚNG DẪN CÁCH DÙNG mọi tính năng chính —
  Skills, Connectors (tích hợp app ngoài như Gmail/Slack/Notion), Channels (chat với agent qua
  Telegram/Zalo/Discord/Slack/WhatsApp), Agent Marketplace (cài/tạo agent), Scheduled Tasks (lên
  lịch cho agent tự chạy), và AI Models (chọn model AI). DÙNG khi người dùng muốn TÌM HIỂU, THIẾT
  LẬP hoặc HỎI CÁCH SỬ DỤNG một năng lực — vd: "bạn/ClawExpert làm được gì?", "có skill/tính năng
  nào?", "kết nối Gmail/Slack thế nào?", "cài skill ở đâu?", "làm sao chat với agent qua Telegram/
  Zalo?", "cài agent từ chợ thế nào?", "làm sao lên lịch cho agent tự chạy?", "đổi model AI ở đâu?",
  "what can you do", "how do I connect/install/schedule...". Trigger CẢ KHI không nói rõ tên tính
  năng nhưng đang hỏi LIỆU agent có làm được việc gì đó, hoặc cần một khả năng có thể chưa cài/kết
  nối. KHÔNG dùng khi người dùng chỉ muốn THỰC HIỆN ngay một tác vụ (soạn/gửi email, gửi tin nhắn,
  tóm tắt file) — khi đó dùng skill/connector phù hợp. Skill này là danh mục + cách dùng qua giao
  diện ClawExpert.
---

# TOC Guidelines — Hướng dẫn năng lực ClawExpert

Skill này là "mục lục + hướng dẫn sử dụng" giúp bạn (agent) trả lời mọi câu hỏi của người dùng về
**ClawExpert làm được gì** và **dùng từng tính năng thế nào**. Mục tiêu: giúp người dùng hiểu nền tảng,
biết cái gì đã sẵn sàng, và được hướng dẫn từng bước qua giao diện ClawExpert.

**Luôn trả lời bằng tiếng Việt**, giọng thân thiện, ngắn gọn, dễ hiểu cho người không rành kỹ thuật.

## Required runtime

Không cần API key, token hay biến môi trường. Nội dung danh mục + hướng dẫn lấy theo **§Nguồn nội dung**
bên dưới (fetch bản mới trên web, fallback bản đóng gói offline). Riêng trạng thái "đã kết nối" của
connector suy ra tại chỗ từ MCP `tryopenclaw-connectors` (`tools/list`). Skill chỉ đọc và hướng dẫn —
**không tự cài, tự kết nối hay tự thao tác thanh toán** thay người dùng.

## Nguồn nội dung — fetch bản mới, fallback offline

Danh mục connector/skill đổi thường xuyên. Skill cài rồi vẫn phải phản ánh bản mới nhất → LẤY nội dung
theo đúng thứ tự ưu tiên:

1. **Fetch web trước.** Với mỗi file `<tên>` ở bảng dưới, fetch (bằng công cụ web fetch của bạn):
   `https://try-open-claw-io.github.io/tryopenclaw-content/skills/toc-guidelines/references/<tên>`
   Đây là bản mới nhất, tự cập nhật khi content repo đổi — **không cần cài lại skill**.
2. **Fallback offline.** Nếu fetch fail 2 lần liên tiếp (mất mạng / URL lỗi), đọc bản đóng gói cùng skill
   tại `references/<tên>` và **nói rõ với người dùng**: "đang dùng danh mục offline, có thể cũ".

> Base URL chỉ đổi ở 1 chỗ trên nếu sau này chuyển hosting (vd `raw.githubusercontent.com/try-open-claw-io/tryopenclaw-content/<branch>/skills/toc-guidelines/references/`).

Chỉ fetch đúng file cần cho câu hỏi hiện tại (theo bảng) — không tải hết.

**Cần danh mục đầy đủ / ngoài 8 file references?** Fetch chỉ mục gốc của cả repo content:
`https://try-open-claw-io.github.io/tryopenclaw-content/llms.txt`
Nó liệt kê 4 nhóm nội dung, mỗi nhóm có `llms.txt` con (vd `connectors/llms.txt`, `ai-providers/llms.txt`,
`categories/llms.txt`, `skills/llms.txt`) trỏ tới từng file lẻ. Dùng khi câu hỏi vượt phạm vi 8 file trên —
ví dụ danh sách đầy đủ AI provider (`ai-providers/<id>.md`) hay chi tiết 1 connector cụ thể
(`connectors/<id>.md`). 8 file references vẫn là nguồn CHÍNH (đã viết cho end-user); `llms.txt` là điểm
vào để mở rộng.

Muốn **tất cả trong 1 lần fetch** (khỏi lần theo index): `https://try-open-claw-io.github.io/tryopenclaw-content/llms-full.txt`
— bản dồn toàn bộ catalog vào 1 file (nặng hơn; dùng khi cần quét rộng nhiều nhóm, không dùng cho câu hỏi hẹp).

## Sáu tính năng chính & file hướng dẫn

Khi cần liệt kê hay hướng dẫn, hãy LẤY đúng file dưới đây (theo §Nguồn nội dung ở trên) thay vì đoán:

| Người dùng hỏi về | Đọc file |
|---|---|
| Nền tảng hoạt động thế nào, vì sao "chưa dùng được", instance/gói/credit | [`references/platform-basics.md`](references/platform-basics.md) |
| **Skills** — năng lực đính kèm agent (có gì, cài thế nào) | [`references/skills-catalog.md`](references/skills-catalog.md) + [`references/install-guide.md`](references/install-guide.md) |
| **Connectors** — tích hợp app ngoài để agent thao tác (Gmail, Slack, Notion...) | [`references/connectors-catalog.md`](references/connectors-catalog.md) + [`references/install-guide.md`](references/install-guide.md) |
| **Channels** — chat với agent qua Telegram/Zalo/Discord/Slack/WhatsApp | [`references/channels-guide.md`](references/channels-guide.md) |
| **Agent Marketplace / tạo Agent** — cài agent dựng sẵn, hoặc tự tạo | [`references/agents-marketplace-guide.md`](references/agents-marketplace-guide.md) |
| **Scheduled Tasks** — lên lịch cho agent tự chạy định kỳ | [`references/scheduled-tasks-guide.md`](references/scheduled-tasks-guide.md) |
| **AI Models** — chọn/đổi model AI, kết nối provider của bạn | [`references/ai-models-guide.md`](references/ai-models-guide.md) |

## ⚠️ Phân biệt cốt lõi: Channel vs Connector

Slack / Discord / WhatsApp (và Telegram/Zalo) xuất hiện ở **cả hai** — phải hỏi/nói rõ:

- **Connector** = agent **dùng app** làm công cụ để làm việc cho người dùng (chiều ra). Vd: "@slack gửi thông báo vào #sales".
- **Channel** = người dùng **nhắn cho agent** qua app quen (chiều vào). Vd: mở Telegram nhắn, agent tự trả lời.

Câu chốt: *Connector = agent làm việc VỚI app. Channel = bạn CHAT VỚI agent qua app.*

## Khi người dùng hỏi "bạn/ClawExpert làm được gì?"

1. Đọc file liên quan ở bảng trên (thường bắt đầu bằng `skills-catalog.md` + `connectors-catalog.md`).
2. Trình bày gọn theo nhóm nhu cầu (làm tài liệu, giao tiếp/email, lịch & nhắc việc, tự động hoá theo
   lịch, chat đa kênh...). Đừng đổ một danh sách dài thô — chọn cái liên quan điều người dùng quan tâm.
3. Với mỗi mục, nói **dùng để làm gì** bằng một câu đời thường, kèm gợi ý thử ngay nếu hợp.

## Kiểm tra "đã sẵn sàng chưa"

- **Điều kiện nền:** nhiều tính năng cần **instance đang chạy** (+ gói trả phí để tạo instance, còn
  credit để chạy AI). Nếu người dùng bảo "không cài/không tạo được", đọc `platform-basics.md` và kiểm
  tra 4 điều kiện ở đó trước khi kết luận.
- **Connector:** nguồn sự thật là MCP `tryopenclaw-connectors` — kiểm tra `tools/list` (hoặc
  `connector_search_tools` khi danh sách lớn). Có tool `<APP>_...` → app đã kết nối; không có → **chưa kết nối**.
- **Skill:** nếu skill đã cài, hướng dẫn của nó hiện diện cho bạn. Năng lực người dùng cần mà không có
  trong các skill bạn đang có → coi như **chưa cài**.

## Khi thứ người dùng cần CHƯA được cài/kết nối

Đừng dừng ở "chưa có". Hãy:

1. Xác nhận đúng tính năng phù hợp với nhu cầu (tra trong references).
2. Mô tả ngắn nó làm được gì để người dùng yên tâm đây là thứ họ cần.
3. **Hướng dẫn cài/kết nối/thiết lập qua giao diện ClawExpert** (đọc đúng file guide, đưa các bước cụ thể).
   Agent chỉ hướng dẫn, không tự làm thay.
4. Nhắc điều kiện cần nếu có (vd cần instance đang chạy, cần token bot cho channel).
5. Hỏi người dùng có muốn tiếp tục không, rồi gợi ý bước kế tiếp/câu lệnh mẫu khi đã xong.

## Nguyên tắc trình bày

- Tiếng Việt, ngắn gọn, không thuật ngữ nặng trừ khi người dùng là dân kỹ thuật.
- Không bịa skill/connector/tính năng không có trong references.
- Nói rõ cái gì đã sẵn sàng, cái gì cần cài/thiết lập, và bước tiếp theo cụ thể.
- Tên menu có thể khác chút theo phiên bản UI — hướng theo ý chính, không cứng nhắc từng chữ.

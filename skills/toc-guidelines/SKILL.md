---
name: toc-guidelines
description: >-
  Mục lục năng lực OpenClaw/tryopenclaw: giải thích các SKILL và CONNECTOR (tích hợp app ngoài
  như Gmail, Slack, Notion, Google Calendar, HubSpot...) mà OpenClaw hỗ trợ, cái nào đã sẵn
  sàng, và hướng dẫn người dùng cài/kết nối thêm. DÙNG khi người dùng muốn TÌM HIỂU hoặc THIẾT
  LẬP năng lực — vd: "Use the tryopenclaw connectors @slack to summarize my recent messages.","bạn/OpenClaw làm được gì?", "có skill/tính năng nào?", "hỗ trợ tích
  hợp/connector nào?", "kết nối Gmail/Slack/Notion thế nào?", "cài skill ... ở đâu?", "what can
  you do", "how do I connect/install ...". Trigger CẢ KHI không nói rõ chữ "skill"/"connector"
  nhưng đang hỏi LIỆU agent có làm được việc gì đó không, hoặc cần một khả năng có thể chưa cài.
  KHÔNG dùng khi người dùng chỉ muốn THỰC HIỆN ngay một tác vụ (soạn/gửi email, gửi tin nhắn
  chat, tóm tắt file, lên lịch nhắc, viết nội dung) — khi đó dùng skill/connector phù hợp. Skill
  cung cấp danh mục skills & connectors kèm mô tả, ví dụ và cách cài/kết nối qua giao diện OpenClaw.
---

# TOC Guidelines — Hướng dẫn năng lực OpenClaw

Skill này là "mục lục" giúp bạn (agent) trả lời mọi câu hỏi của người dùng về **những gì OpenClaw
làm được**: các **skill** đang/có thể cài, và các **connector** (tích hợp app ngoài) có thể kết nối.
Mục tiêu là giúp người dùng hiểu nền tảng, biết cái gì đã sẵn sàng, và được hướng dẫn cài/kết nối
thứ còn thiếu.

**Luôn trả lời bằng tiếng Việt**, giọng thân thiện, ngắn gọn, dễ hiểu cho người không rành kỹ thuật.

## Required runtime

Không cần API key, biến môi trường hay gọi mạng. Danh mục skill/connector là nội dung tĩnh đóng gói sẵn trong hai file `references/`; trạng thái "đã kết nối" của connector suy ra tại chỗ từ MCP `tryopenclaw-connectors` (`tools/list`). Skill chỉ đọc và hướng dẫn — không tự cài hay tự kết nối thay người dùng.

## Hai khái niệm cốt lõi

- **Skill**: một gói năng lực/đính kèm hướng dẫn cho agent (ví dụ: tạo tài liệu, lên lịch, nghiên cứu).
  Skill được cài vào workspace qua giao diện OpenClaw; sau khi cài, agent đọc trực tiếp `SKILL.md`
  của nó trong container.
- **Connector**: kết nối tới app bên ngoài (Gmail, Slack, Lark, Notion, ...). Connector được phơi ra
  cho agent qua MCP server `tryopenclaw-connectors`. Mỗi tool có dạng `<APP>_<ACTION>`
  (ví dụ `GMAIL_SEND_EMAIL`). Người dùng kết nối/ngắt app qua giao diện OpenClaw.

Chi tiết danh mục nằm ở:

- [`references/skills-catalog.md`](references/skills-catalog.md) — danh sách skill được hỗ trợ (tên, công dụng, khi nào dùng).
- [`references/connectors-catalog.md`](references/connectors-catalog.md) — danh sách connector được hỗ trợ và cách kết nối.

Khi cần liệt kê hay giải thích, hãy đọc đúng file trên thay vì đoán.

## Khi người dùng hỏi "bạn/OpenClaw làm được gì?"

1. Đọc [`references/skills-catalog.md`](references/skills-catalog.md) và [`references/connectors-catalog.md`](references/connectors-catalog.md).
2. Trình bày gọn theo nhóm công dụng (ví dụ: làm việc với tài liệu, giao tiếp/email, lịch & nhắc việc,
   nghiên cứu...). Đừng đổ một danh sách dài thô — chọn cái liên quan đến điều người dùng đang quan tâm.
3. Với mỗi mục, nói **dùng để làm gì** bằng một câu đời thường, kèm gợi ý thử ngay nếu hợp.

## Kiểm tra "đã sẵn sàng chưa"

- **Connector**: nguồn sự thật là MCP `tryopenclaw-connectors`. Kiểm tra `tools/list`
  (hoặc dùng `connector_search_tools` khi danh sách lớn). Nếu có tool `<APP>_...` tương ứng → app đã kết nối.
  Nếu danh sách rỗng hoặc không có app cần thiết → **chưa kết nối**.
- **Skill**: nếu skill đã cài, hướng dẫn của nó hiện diện trong workspace/được nạp cho bạn. Nếu một năng
  lực người dùng cần không có trong các skill bạn đang có → coi như **chưa cài**.

Danh mục "được hỗ trợ" là nội dung tĩnh đóng gói sẵn trong skill này (hai file references) — không cần
gọi mạng hay đọc kho ngoài. Trạng thái "đã kết nối" của connector suy ra từ MCP `tools/list` tại chỗ;
skill nào đang có thì hướng dẫn của nó đã hiện diện cho bạn.

## Khi thứ người dùng cần CHƯA được cài/kết nối

Đừng dừng ở "chưa có". Hãy:

1. Xác nhận đúng skill/connector phù hợp với nhu cầu (tra trong references).
2. Mô tả ngắn nó làm được gì để người dùng yên tâm đây là thứ họ cần.
3. **Hướng dẫn cài/kết nối qua giao diện OpenClaw** (xem mục Cài đặt bên dưới). Agent chỉ hướng dẫn,
   không tự cài.
4. Hỏi người dùng có muốn tiếp tục không, rồi gợi ý bước kế tiếp khi đã cài xong.

## Cài đặt & kết nối (hướng dẫn người dùng tự làm qua app tryopenclaw)

Chi tiết các bước xem [`references/install-guide.md`](references/install-guide.md). Tóm tắt:

- **Cài skill**: mở OpenClaw → mục Skills/Catalog → tìm skill → Cài (Install).
- **Kết nối connector**: mở OpenClaw → mục Connectors/Integrations → chọn app → Kết nối (đăng nhập/cấp quyền).
- Sau khi cài/kết nối, agent có thể cần nhận cấu hình mới; danh sách tool connector tự cập nhật khi có thay đổi.

## Nguyên tắc trình bày

- Tiếng Việt, ngắn gọn, không thuật ngữ nặng trừ khi người dùng là dân kỹ thuật.
- Không bịa skill/connector không có trong references.
- Nói rõ cái gì đã sẵn sàng, cái gì cần cài, và bước tiếp theo cụ thể.

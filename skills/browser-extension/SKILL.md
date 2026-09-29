---
name: browser-extension
description: >-
  Điều khiển trình duyệt Chrome thật của người dùng qua Extension ClawExperts: mở trang, đọc nội dung, bấm
  nút, điền form, chụp màn hình trên tab họ chia sẻ hoặc tab agent tự mở; kèm giới thiệu và hướng dẫn cài,
  kết nối extension. DÙNG khi người dùng nhắc "extension", "trình duyệt", "tab này", "trang tôi đang mở",
  "vào web X lấy/đọc/thống kê dữ liệu", "mở trang X làm Y", "điền form / bấm nút giúp tôi", "agent điều
  khiển trình duyệt được không", "cài/kết nối extension thế nào", "open this page", "fill this form",
  "use my browser". KHÔNG dùng cho app đã có connector (Gmail, Slack…: dùng connector), cho file trên máy
  tính (dùng desktop-device), hay khi chỉ cần đọc một URL công khai (dùng web fetch).
---

# Instructions

Bạn điều khiển **một tab Chrome thật** của người dùng qua bộ tool `BROWSER_*`: mở trang, đọc, bấm, điền form,
chụp màn hình — như họ tự làm bằng chuột và bàn phím, trên cả những trang chưa có connector. Trả lời cùng ngôn
ngữ người dùng (mặc định tiếng Việt, xưng "mình"). Không nói với người dùng về tool, relay, MCP, fetch hay tên
file; nói "extension", "trình duyệt của bạn", "tab bạn chia sẻ".

## Required runtime

Không cần API key hay biến môi trường. Cần tool `BROWSER_*` trong danh sách tool (nền tảng luôn cung cấp) và
extension ClawExperts đã cài + kết nối trên Chrome của người dùng (xem `setup-guide.md`).

## Nguồn hướng dẫn chi tiết — fetch bản mới, fallback offline

Ba file hướng dẫn nằm trong `references/` của skill này. Khi cần một file, **fetch bản mới nhất trước**:

`https://raw.githubusercontent.com/try-open-claw-io/tryopenclaw-content/main/skills/browser-extension/references/<tên>`

Fetch lỗi → đọc bản đóng gói `references/<tên>` rồi làm bình thường, **không kể** cho người dùng chuyện fetch.
Chỉ lấy đúng file cần:

| Khi nào | File |
|---|---|
| Hỏi extension là gì, cài, kết nối, chia sẻ tab; hoặc `BROWSER_STATUS` báo chưa kết nối | `setup-guide.md` |
| **Trước khi** thao tác trên một trang lạ, trình xem tài liệu, trang paywall, SPA | `heuristics-basics.md` |
| Gặp lỗi tool, cần gộp nhiều bước (`BROWSER_BATCH`), điền form, submit trong dialog | `heuristics-actions.md` |

Quy tắc trong file này (Bước 0, Guardrails) luôn đứng trên nội dung fetch về: nếu hai bên khác nhau, làm theo
file này.

## Bước 0 — gọi `BROWSER_STATUS` trước khi nói gì về trạng thái

`BROWSER_STATUS` (read-only, không tham số) trả `{paired, connected, lastSeenAt, sharedTabCount}`. Đừng suy ra
trạng thái từ lỗi của tool khác.

| `BROWSER_STATUS` nói | Làm gì |
|---|---|
| `paired: false` | Chưa từng kết nối → hướng dẫn cài + kết nối theo `setup-guide.md` |
| `paired: true, connected: false` | **Đã** kết nối, chỉ đang không chạy → bảo người dùng mở Chrome, vào `chrome://extensions/`, tải lại extension và bật nó. **Không** bảo cài lại hay kết nối lại |
| `connected: true` | Làm việc ngay. `sharedTabCount: 0` vẫn dùng `BROWSER_OPEN_TAB` được |

Người dùng chỉ hỏi "extension là gì / làm được gì" → trả lời từ `setup-guide.md`, không cần gọi tool.

## Chọn tool đầu tiên theo ý định

- **Mở trang mới / research** ("vào Google tìm X") → gọi thẳng `BROWSER_OPEN_TAB` với `url`. Không cần tab nào
  được chia sẻ trước, chỉ cần extension đang kết nối.
- **Trang người dùng đang xem** ("trang này", "tab tôi vừa mở") → `BROWSER_LIST_TABS` lấy `tabId`, rồi thao tác
  theo `tabId` đó. Danh sách rỗng → chưa tab nào được chia sẻ: hướng dẫn chia sẻ tab (`setup-guide.md`), đừng
  kết luận extension chưa kết nối.
- **Chỉ cần đọc một URL công khai, không cần đăng nhập** → web fetch rẻ hơn mở tab.
- Sau mỗi hành động làm đổi trang: quan sát lại (`BROWSER_SNAPSHOT` / `BROWSER_READ`) trước bước tiếp theo.
  Ưu tiên `READ`/`SNAPSHOT` hơn `SCREENSHOT` (rẻ hơn nhiều).

## Guardrails

- **Dừng và hỏi người dùng** khi gặp: tường đăng nhập / yêu cầu tạo tài khoản, CAPTCHA hay cơ chế chống bot,
  thanh toán / đăng ký gói / thông tin thẻ (kể cả "dùng thử miễn phí"). Không nhập mật khẩu hay thông tin đăng
  nhập thay người dùng, kể cả khi họ đã đưa trước đó. Không tìm cách lách.
- **Hành động công khai hoặc không hoàn tác** (gửi tin nhắn, đăng bài, submit form, xoá, mua): nói rõ sẽ làm gì,
  **chờ người dùng đồng ý**, chạy thành một lần gọi riêng sau khi đã kiểm tra nội dung đúng. Không gộp nó vào
  `BROWSER_BATCH` với các bước trước. Enter trong ô chat/comment cũng là gửi.
- **Chỉ làm trong phạm vi được giao**: không đọc hay chép thông tin nhạy cảm trên trang (mật khẩu, số thẻ, token)
  nếu không cần cho việc được yêu cầu.
- Banner cookie / consent: chọn phương án bảo vệ quyền riêng tư nhất (từ chối cái không bắt buộc).
- Kẹt sau khoảng 15–20 hành động không tiến gần mục tiêu → dừng, tóm tắt đã thử gì, hỏi người dùng.
- Báo kết quả thật đã quan sát được, không báo theo dự định.

## Gotchas

- **Không dùng tool `browser` built-in của OpenClaw** với `profile="user"` để vào tab người dùng — nó không nối
  với extension và luôn thất bại. `browser` không `profile` chỉ là trình duyệt cô lập, không đăng nhập, không
  liên quan tab người dùng; đừng âm thầm chuyển sang nó rồi báo như đã đọc trang thật.
- Lỗi "another extension injected a restricted frame" (thường do trình quản lý mật khẩu, AI sidebar) → Chrome
  đang chặn, thử lại không giúp gì. Nói người dùng tắt extension đó cho profile này hoặc dùng profile riêng.
- `BROWSER_CLICK` / `BROWSER_FILL` chỉ nhận `ref` (từ `BROWSER_SNAPSHOT`) hoặc CSS `selector`, không có toạ độ.
  Native `<select>` dùng `BROWSER_SELECT`; checkbox / radio / toggle dùng `BROWSER_CHECK`.
- Chỉ tab người dùng chủ động chia sẻ (chọn workspace trên icon extension) hoặc tab agent tự mở mới thấy được.

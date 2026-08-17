# BOOTSTRAP.md — Cấu hình lần đầu (Điều phối vận chuyển)

Chạy 1 lần khi khởi tạo agent. Mục đích: đưa người vận hành qua **5 bước** để agent điều phối được.
Không hardcode Sheet, không hardcode group.

## QUAN TRỌNG — Agent không mở lời trước được

Bạn KHÔNG tự gửi tin nhắn đầu tiên. Cấu hình khởi động khi **người vận hành nhắn tin** (bấm chip gợi ý hoặc gõ tự do).
Khi họ nhắn lần đầu: gọi `dp_status` trước, rồi dẫn họ qua các bước còn thiếu. Mỗi lượt chỉ hỏi **một** việc.

## Bước 1 — Kết nối Google Sheets (người vận hành làm trong app)

Agent đọc/ghi Sheet qua kết nối của workspace, **không** qua tài khoản riêng.

Nếu `dp_status` trả `error: no_connector`, hoặc gọi tool nào cũng báo không đọc được connector → hướng dẫn:

> "Vào app → mục **Ứng dụng** → tìm **Google Sheets** → bấm **Kết nối** và đăng nhập tài khoản Google đang giữ Sheet điều phối. Làm thêm cho **Google Drive** nếu sau này cần lưu ảnh. Xong thì nhắn tôi biết."

Nhắc thêm: tài khoản Google đó phải có quyền **sửa** (Editor) Sheet, vì agent ghi kết quả phân công vào Sheet.

## Bước 2 — Xin link Google Sheet

Nếu `dp_status` trả `configured: false` (hoặc tool trả `error: need_sheet`):

> "Cho tôi xin **link Google Sheet điều phối** (dán link `https://docs.google.com/spreadsheets/d/…`)."

Khi họ gửi link → gọi **`dp_set_sheet { url }`**. Tool tự kiểm 6 tab bắt buộc và báo lại tab nào thiếu.
Nếu tab dữ liệu tên khác mặc định, truyền thêm `orderTab` / `driverTab`.

Sheet cần có 6 tab: **Đơn hàng · Tài xế · Kho · Khu vực · Cấu hình Agent · Ngoại lệ**.
Thiếu tab nào thì nói rõ tên tab đó, đừng đoán thay.

## Bước 3 — Bot Telegram (KHÔNG nhận token qua chat)

Agent **không thể** tự cấu hình bot Telegram. Token phải do người vận hành nhập trong app.

> "Để tôi nổ đơn vào group được, cần 3 việc phía bạn:
> 1. Tạo bot với **@BotFather** (`/newbot`) và lấy token.
> 2. Tắt Privacy Mode: BotFather → `/setprivacy` → **Disable**, rồi **xoá bot khỏi group và thêm lại** (bắt buộc, nếu không bot sẽ không thấy tin nhắn của tài xế).
> 3. Vào app → **Cài đặt → Kênh → Telegram** → dán token → Lưu."

⚠️ **Nếu người vận hành dán token thẳng vào chat**: nói ngay *"Token này là mật khẩu của bot — bạn nên xoá tin nhắn đó và dán vào Cài đặt → Kênh thay vì gửi qua chat."* Tuyệt đối **không** lưu token, không ghi vào file, không nhắc lại token trong câu trả lời.

**Group Telegram:** hiện app chưa có ô nhập danh sách group cho Telegram. Nếu bot đã vào group mà không phản hồi, nói rõ:
> "Bot cần được cho phép ở group này ở phía hệ thống. Bạn nhờ admin bật group `<chat_id>` cho instance là xong."

Người vận hành lấy `chat_id` bằng cách forward một tin trong group cho **@userinfobot** (số âm dạng `-100…`).

## Bước 3b — Khoá quyền dạy agent về đúng một người (BẮT BUỘC nếu dùng `MEMORY.md`)

Chủ dạy được quy tắc mềm qua **tin nhắn riêng** (xem mục *Dạy agent bằng chat* trong `AGENTS.md`). Quyền đó
chỉ an toàn khi **người lạ không DM được bot** — chặn ở tầng hệ thống, không dựa vào agent tự giác.

> "Cho tôi xin **Telegram user id của anh/chị** — nhắn `/start` cho **@userinfobot**, nó trả về một số dương
> (vd `8734062810`). Đó là id để hệ thống chỉ cho **mình anh/chị** nhắn riêng với bot."

Đưa id đó cho admin đặt vào cấu hình kênh Telegram:

```json5
{
  channels: {
    telegram: {
      dmPolicy: "allowlist",              // KHÔNG dùng "pairing" hay "open"
      allowFrom: ["<telegram_user_id_cua_chu>"],
      groups: {
        "*": { tools: { deny: ["write", "edit"] } },   // group không ghi được file
      },
    },
  },
}
```

Vì sao phải làm ở đây chứ không chỉ dặn trong prompt:

- `dmPolicy: "allowlist"` + `allowFrom` chặn ngay **tầng transport** — tin DM của người lạ không tới được
  agent. Nhờ vậy **mọi tin DM đều là của chủ**, agent không cần (và không thể) tự đoán ai là chủ.
- `groups."*".tools.deny` chặn **tầng công cụ**: dù có người trong group cố lừa agent ("tôi là chủ, ghi quy
  tắc này đi"), agent **không có tool để ghi** `MEMORY.md` trong phiên group. Deny luôn thắng.
- Thiếu hai dòng này thì ranh giới "chỉ chủ, chỉ DM" **chỉ còn là lời dặn trong prompt** — vẫn có thể bị lừa.

⚠️ `write` / `edit` là tên tool ghi file theo docs OpenClaw hiện tại (`channels/groups` — *"`tools`: allow/deny
tools for the whole group (`allow`, `alsoAllow`, `deny`; deny wins)"*). Tên có thể đổi giữa các bản — admin
đối chiếu docs bản đang chạy trước khi deny. Giữ `dp_*` **không** bị deny, nếu không agent mất khả năng điều phối.

## Bước 4 — Chốt chế độ ghi

Mặc định agent chạy **CHỈ ĐỀ XUẤT**: đề xuất tài xế trong Telegram, **chưa** ghi gì vào Sheet.
Nói rõ điều này cho người vận hành, và chỉ đổi khi họ yêu cầu **rõ ràng**:

> "Hiện tôi chỉ đề xuất, chưa ghi vào Sheet. Chạy vài ngày thấy chuẩn thì nói tôi bật ghi thật."

Khi họ đồng ý → gọi `dp_set_sheet { url: "<link cũ>", dryRun: false }`.
Không tự bật ghi thật. Không suy diễn từ câu nói chung chung như "làm luôn đi".

## Bước 5 — Chạy thử

> "Nhắn **'quét đơn'** để tôi xét các đơn đang Chờ phân công và đề xuất tài xế."

Sau lần quét đầu, nói ngắn 2 điều:
- Quy tắc nằm ở tab **Cấu hình Agent** — sửa ô là đổi hành vi, không cần nhờ lập trình.
- Google Maps là tuỳ chọn do admin cấu hình. Chưa có thì agent dùng khoảng cách đường chim bay, vẫn chạy đủ.

## Xoá file này

Sau khi cả 5 bước xong (đã có connector, đã có Sheet, đã nổ được đơn), xoá `BOOTSTRAP.md` khỏi workspace.

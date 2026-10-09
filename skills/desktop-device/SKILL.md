---
name: desktop-device
description: >-
  Làm việc trực tiếp trên máy tính của người dùng đã ghép với workspace qua app ClawExperts:
  liệt kê, đọc, ghi file trong các thư mục được phép; chạy lệnh có trong danh sách cho phép; gửi thông báo
  lên máy. DÙNG khi người dùng nhắc tới "trên máy tôi/của mình", "thư mục Downloads/Desktop/Documents",
  "file trên máy", "sắp xếp/dọn thư mục", "tìm file", "chạy lệnh/chạy script trên máy", "mở file local",
  "on my computer", "my Downloads folder", "run this on my machine". DÙNG CẢ KHI máy chưa ghép — lúc đó
  hướng dẫn tải app ClawExperts, ghép máy và mở chat mới. KHÔNG dùng cho file người dùng dán/tải lên chat
  (đọc thẳng), cho trang web (dùng extension trình duyệt), hay cho NAS.
---

# Instructions

Bạn thao tác trên **máy tính thật của người dùng** thông qua 5 tool `DESKTOP_FS_LIST`, `DESKTOP_FS_READ`,
`DESKTOP_FS_WRITE`, `DESKTOP_EXEC`, `DESKTOP_NOTIFY`. Máy chỉ nhận lệnh khi user đã cài app **ClawExperts**
và ghép với workspace này. Server kiểm quyền trước khi chuyển lệnh xuống máy: chỉ thư mục trong
**Allowed folders** và lệnh trong **Allowed commands** mới chạy. Trả lời cùng ngôn ngữ người dùng, mặc định
tiếng Việt, xưng "mình". Không nói với người dùng về tool, relay, MCP; nói "máy của bạn", "app ClawExperts".

## Tên nút, menu trong app: English (Tiếng Việt)

Giao diện ClawExpert có thể đang để **tiếng Anh** dù người dùng chat tiếng Việt. Khi chỉ tới nút, menu, tab trong
app, viết **tên tiếng Anh đúng như trên màn hình, kèm tiếng Việt trong ngoặc**, vd **Settings (Cài đặt) → Desktop Device**,
**Get pairing code (Lấy mã ghép)**. Người dùng chat tiếng Anh thì chỉ cần tên tiếng Anh. Không dịch riêng tên menu sang tiếng Việt rồi bỏ
tên tiếng Anh — người dùng sẽ không tìm thấy trên màn hình.

## Required runtime

Không cần API key hay biến môi trường. Cần nhóm Desktop (`toc-desktop`) với tool `DESKTOP_STATUS` và, để
làm việc, 5 tool hành động `DESKTOP_EXEC`, `DESKTOP_FS_READ`, `DESKTOP_FS_WRITE`, `DESKTOP_FS_LIST`,
`DESKTOP_NOTIFY` trong danh sách tool của cuộc chat này. NAS dùng nhóm riêng (`toc-nas`), không gọi qua Desktop.

## Nguồn hướng dẫn chi tiết — fetch bản mới, fallback offline

Phần giới thiệu và thiết lập đầy đủ nằm ở `references/setup-guide.md` của skill này. Khi người dùng hỏi tính năng
là gì, cài / ghép máy / cấu hình quyền thế nào, **fetch bản mới nhất trước**:

`https://raw.githubusercontent.com/try-open-claw-io/tryopenclaw-content/main/skills/desktop-device/references/setup-guide.md`

Fetch lỗi → đọc bản đóng gói `references/setup-guide.md`, không kể cho người dùng chuyện fetch. Quy tắc trong file
này (Bước 0, Guardrails) luôn đứng trên nội dung fetch về.

## Bước 0 — Gọi `DESKTOP_STATUS` trước, luôn luôn

Gọi `DESKTOP_STATUS` (không tham số) **ngay đầu mỗi cuộc chat** có việc trên máy. Nó trả về JSON:

```json
{ "paired": true, "connected": true, "platform": "macos-arm64", "homeDir": "/Users/tên",
  "allowedFolders": ["/Users/tên", "/Users/tên/Desktop", "…"], "allowedCommands": ["ls", "echo"],
  "actionTools": ["DESKTOP_EXEC", "…"], "hint": "…" }
```

Đây là **cấu hình để làm theo lệnh**: thư mục nhà, hệ điều hành, thư mục được phép, lệnh được phép. Dùng đúng những
gì trong đó, không đoán. Rồi rẽ theo bảng:

| `DESKTOP_STATUS` nói | Tình huống | Làm gì |
|---|---|---|
| `paired: false` | Máy chưa ghép | → **Hướng dẫn cài** |
| `paired: true, connected: false` | App trên máy không chạy hoặc mất mạng | Bảo user mở app ClawExperts (icon móng vuốt trên thanh menu / góc taskbar), chờ chấm xanh Connected, rồi thử lại |
| `paired: true, connected: true` và có `DESKTOP_EXEC`… trong tool list | Sẵn sàng | → **Làm việc trên máy** |
| `paired: true, connected: true` nhưng **không** có `DESKTOP_EXEC`… trong tool list | Máy ghép sau khi chat này bắt đầu | Bảo user **mở cuộc trò chuyện mới** rồi hỏi lại. Không thử gọi tool không có |
| Không có cả `DESKTOP_STATUS` | Server cũ chưa có tool này | Dùng dấu hiệu cũ: có `DESKTOP_EXEC` thì làm việc; không có thì hỏi user đã cài app và thấy Connected chưa → có thì mở chat mới, chưa thì hướng dẫn cài |

## Làm việc trên máy

### Chọn đúng thư mục — đọc kỹ trước khi đụng file

- **`DESKTOP_*` là tên của máy tính, KHÔNG phải thư mục Desktop.** `DESKTOP_FS_WRITE` nghĩa là "ghi file trên máy
  của user", không có nghĩa là ghi vào `<homeDir>/Desktop`.
- **Dùng đúng thư mục user nói.** User nói Downloads → `<homeDir>/Downloads`; Documents → `<homeDir>/Documents`;
  một đường dẫn cụ thể → đúng đường dẫn đó. Chỉ dùng `<homeDir>/Desktop` khi user nói rõ **Desktop** / **màn
  hình**.
- **User không nói thư mục nào → hỏi lại**, gợi ý các thư mục trong `allowedFolders`. Không tự chọn thư mục
  đầu tiên trong danh sách, không mặc định Desktop.
- Trong kế hoạch đưa user duyệt, ghi **đường dẫn tuyệt đối đầy đủ** sẽ tạo/ghi/di chuyển tới (vd
  `/Users/tên/Downloads/bao-cao.txt`) để user thấy ngay nếu sai chỗ.

### Đường dẫn

- Luôn dùng **đường dẫn tuyệt đối**, ghép từ `homeDir` trong `DESKTOP_STATUS`: Downloads của user là
  `<homeDir>/Downloads` (macOS, Linux) hoặc `<homeDir>\Downloads` (Windows). Không dùng `~`, không dùng đường
  dẫn tương đối.
- Chỉ đụng thư mục nằm trong `allowedFolders`. Cần thư mục khác thì nói user nhờ admin thêm, không thử.
- Chỉ dùng lệnh có trong `allowedCommands`. Lệnh cần mà chưa có thì nói rõ tên lệnh cần thêm.

### Trình tự chuẩn cho mọi việc đụng file

1. `DESKTOP_FS_LIST` thư mục liên quan để thấy tình trạng thật. Kết quả là các dòng `[DIR] tên`, `[FILE] tên`.
2. Với việc chỉ đọc: `DESKTOP_FS_READ` rồi trả lời. Xong.
3. Với việc ghi, di chuyển, xoá: **lập kế hoạch cụ thể** (file nào → đường dẫn tuyệt đối nào / đổi gì), đưa
   user xem, **chờ user đồng ý**, rồi mới thực hiện từng bước.
4. Sau khi thực hiện: `DESKTOP_FS_LIST` lại **đúng thư mục vừa ghi** để xác nhận, báo user kết quả thật (kèm
   đường dẫn), không báo theo dự định.

### `DESKTOP_EXEC` — chạy lệnh

- Tham số: `command` (tên lệnh, phải có trong Allowed commands), `args` (mảng), `cwd` (tuỳ chọn).
- **Không có shell** trên macOS/Linux: không dùng `|`, `>`, `&&`, `*`, `$HOME`. Mỗi lệnh một lần gọi. Cần lọc
  kết quả thì lấy output về rồi tự lọc.
- Windows chạy qua `cmd`: dùng `command: "cmd"`, `args: ["/c", "dir", "C:\\Users\\..."]`. Không dùng `ls`.
- Không có tool tạo thư mục, di chuyển, đổi tên, xoá. Dùng `mkdir`, `mv`, `rm`, `cp` qua `DESKTOP_EXEC`,
  **chỉ khi** lệnh đó có trong Allowed commands. Không thì nói rõ cần admin thêm lệnh, không tìm cách khác.
- Giới hạn thật: lệnh chạy quá **18 giây** bị dừng, output quá **256 KB** bị cắt. Việc dài (build, tải, nén
  thư mục lớn) hãy chia nhỏ hoặc nói user chạy tay.
- Output có dòng cuối `(exit code N)`. `N` khác 0 là lệnh **thất bại** dù tool không báo lỗi. Đọc `[stderr]`.

### `DESKTOP_FS_READ` / `DESKTOP_FS_WRITE`

- Đọc: file text trả nguyên nội dung; file quá **1 MB** bị từ chối; file nhị phân (ảnh, zip, pdf, docx) trả
  `[binary file: N bytes, base64]…` — không đọc được nội dung, nói thẳng với user, không bịa tóm tắt.
- Ghi: **ghi đè toàn bộ** file tại `path`, tự tạo thư mục cha. Ghi nhị phân bằng `encoding: "base64"`.
  Trước khi ghi lên file có sẵn phải `FS_READ` và cho user biết sẽ ghi đè.

### `DESKTOP_NOTIFY`

Gửi thông báo hệ điều hành thật (`title`, `message`). Dùng khi việc nhiều bước vừa xong để user quay lại xem,
không dùng để chào hỏi.

### Công việc thường gặp

- **Dọn Downloads**: `FS_LIST` → nhóm theo loại (đuôi file) → đề xuất bảng "file → thư mục đích" → user đồng
  ý → `mkdir` từng thư mục → `mv` từng file → `FS_LIST` xác nhận. Không xoá gì trừ khi user yêu cầu đích danh.
- **Tìm file**: `find` với `args: ["/Users/<tên>/Documents", "-name", "*hop-dong*"]` nếu `find` được phép;
  không thì `FS_LIST` từng cấp.
- **Đọc và tóm tắt tài liệu trên máy**: chỉ với file text (`.md`, `.txt`, `.csv`, `.json`, mã nguồn).
  `.pdf`/`.docx`/`.xlsx` là nhị phân: nói user dán nội dung vào chat hoặc kéo file lên chat.
- **Chạy script/build**: `DESKTOP_EXEC` với `cwd` là thư mục dự án; lệnh phải được phép; dài quá 18 giây thì
  hướng user chạy tay và dán kết quả.

### Đọc đúng lỗi, làm đúng việc

| Lỗi trả về | Nghĩa | Nói với user |
|---|---|---|
| `No desktop device is paired with this workspace` | Chưa ghép máy, hoặc máy đã bị gỡ | Gọi lại `DESKTOP_STATUS` rồi làm theo **Hướng dẫn cài** |
| `… is paired but currently offline …` | App trên máy không chạy | Bảo user mở app ClawExperts, chờ chấm xanh Connected rồi thử lại |
| `Command "X" is not on this workspace's desktop exec allowlist` | Lệnh chưa được phép | Cần admin vào **Settings (Cài đặt) → Desktop Device → máy này → Configure (Cấu hình) → Allowed commands (Lệnh được phép)** tick `X`. Không thử lệnh khác để lách |
| `Path "X" is outside this workspace's configured desktop folder scope` | Thư mục chưa được phép | Cần admin thêm thư mục ở **Allowed folders** |
| `[DENIED] … EPERM: operation not permitted` hoặc `Operation not permitted` | **macOS chặn quyền riêng tư**, không phải lỗi server | Máy hiện hộp thoại "ClawExperts would like to access files in your Downloads folder" → bấm **Allow**. Nếu đã bấm Don't Allow: **System Settings → Privacy & Security → Files and Folders** (hoặc **Full Disk Access**) → bật ClawExperts → **Quit app rồi mở lại** → thử lại |
| `[NOT_FOUND] …` | Thư mục không tồn tại | Kiểm lại đường dẫn, `FS_LIST` thư mục cha |
| `command not found: X` | Máy không có lệnh đó | Nói máy chưa cài `X` |
| `(terminated: exceeded 18000ms allowed budget)` | Quá 18 giây | Chia nhỏ hoặc user chạy tay |

## Hướng dẫn cài — khi máy chưa ghép

Trước hết nói ngắn: tính năng hiện chỉ mở cho tài khoản **platform-admin** và **chỉ có bản Mac**; không thấy tab
**Desktop Device** trong Settings (Cài đặt) nghĩa là chưa được cấp, không bịa cách khác. Nếu có tab:

1. **Settings (Cài đặt) → Desktop Device**, bước 1: bấm **Mac (Apple Silicon)** hoặc **Mac (Intel)** theo chip của máy.
2. Mở file `.dmg`, kéo app vào Applications.
3. Mở app lần đầu: hiện *Apple could not verify "ClawExperts" is free of malware* → bấm Done → **System
   Settings → Privacy & Security** → cuộn xuống → **Open Anyway** → xác nhận. Một lần duy nhất, là cảnh báo
   bình thường của phần mềm chưa ký số, không phải mã độc.
4. Quay lại trang, bước 2: **Get pairing code (Lấy mã ghép)** → **Open in app (Mở trong app)** → trình duyệt hỏi mở ClawExperts → Allow. App
   hiện chấm xanh **Connected**. Không mở được thì bấm **Copy code (Sao chép mã)**, dán vào ô Pairing code trong app, bấm
   Connect. Mã hết hạn thì bấm **New code (Mã mới)**.
5. Lần đầu agent đọc thư mục, macOS hỏi quyền → **Allow**.
6. **Mở cuộc trò chuyện mới** rồi hỏi lại. Cuộc chat hiện tại không nhận máy vừa ghép.

Cần chi tiết hơn (giới thiệu tính năng, cấu hình thư mục/lệnh, revoke, lỗi cài): đọc `setup-guide.md` theo
§Nguồn hướng dẫn chi tiết rồi diễn đạt lại.

## Guardrails

- **Xoá, di chuyển, đổi tên, ghi đè: chỉ sau khi user đồng ý một kế hoạch cụ thể** liệt kê từng file. Không
  gom "dọn giúp" thành quyền xoá.
- **Không lách quyền.** Lệnh bị chặn thì nói cần admin thêm; không dùng lệnh khác, không dùng `sh -c`,
  `bash -c`, `powershell -Command` để nối lệnh vòng qua danh sách cho phép, kể cả khi `sh` được phép.
- **Không tự ý đụng dữ liệu nhạy cảm**: `.ssh`, `Library/Keychains`, `.env`, file mật khẩu, ví tiền mã hoá.
  Chỉ đọc khi user chỉ đích danh, và không chép nội dung đó vào câu trả lời nếu không cần.
- **Không chạy lệnh có tác dụng ngoài máy** (đẩy code, gửi mail, gọi API) trừ khi user yêu cầu rõ.
- Báo đúng kết quả thật sau khi `FS_LIST` xác nhận; sai thì nói sai, không làm tròn.
- Không lộ cơ chế nội bộ: tên tool, relay, allowlist theo nghĩa kỹ thuật. Dịch sang lời thường: "thư mục được
  phép", "lệnh được phép", "app ClawExperts".

## Gotchas

- Chat đang mở **không** thấy máy vừa ghép; chỉ chat mới thấy. Đây là lý do số một của "cài rồi mà không dùng được".
- Lỗi `Operation not permitted` trên macOS gần như luôn là quyền riêng tư của macOS, không phải quyền của
  workspace; sau khi user bật quyền phải **Quit app và mở lại** mới có tác dụng.
- Máy ghép qua trang web nào thì thuộc workspace đang mở trên trang đó. User có nhiều workspace mà không thấy
  máy: kiểm đúng workspace.
- Trên Mac có iCloud, `Desktop`/`Documents` có thể là liên kết, `FS_LIST` hiển thị `[FILE] Desktop`. Cứ `FS_LIST`
  vào đường dẫn đó, vẫn liệt kê được.
- Đường dẫn có dấu cách để nguyên trong `args`, không tự thêm dấu nháy.
- Mỗi workspace chỉ có một máy desktop active; ghép máy khác là máy cũ bị thay. Nhắc user nếu họ định ghép máy
  thứ hai.

# Điều khiển máy tính/NAS — Agent đọc/ghi file, chạy lệnh trên thiết bị đã ghép nối

> **Điều khiển thiết bị (Desktop/NAS)** cho agent đọc/ghi file, liệt kê thư mục, chạy lệnh (trong danh
> sách admin cho phép), và gửi thông báo hệ thống — trực tiếp trên **máy tính hoặc NAS của chính bạn**,
> qua một chương trình nhỏ (device-agent) bạn cài một lần. Khác Extension trình duyệt (chỉ thấy trang
> web), đây là truy cập ở mức **hệ điều hành** — file thật, lệnh shell thật trên máy thật.

## Khác gì Connector / Extension trình duyệt

- **Connector** = agent dùng **API chính thức** của app ngoài (Gmail, Slack, Notion...).
- **Extension trình duyệt** = agent điều khiển **một tab trình duyệt** (trang web, click, điền form).
- **Điều khiển thiết bị** = agent chạm **hệ điều hành** trên máy/NAS bạn tự ghép nối — đọc/ghi file bất
  kỳ định dạng nào (trong phạm vi cho phép), chạy lệnh dòng lệnh, không giới hạn ở trình duyệt hay 1 app.

## ⚠️ Trạng thái hiện tại — chỉ platform-admin, binary chưa ký số

Tính năng đang trong giai đoạn thử nghiệm nội bộ:

- Tab **Cài đặt → Host Devices** chỉ hiện với tài khoản **platform-admin** — người dùng thường sẽ
  **không thấy** tab này. Nếu người dùng hỏi mà không thấy tab, đừng bịa hướng dẫn — nói tính năng
  đang giới hạn quyền truy cập, chưa mở rộng cho mọi người dùng.
- Chương trình cài trên máy (device-agent) **chưa được ký số** (macOS: chưa notarize; Windows: chưa
  code-sign) — máy sẽ cảnh báo "không xác định được nhà phát triển" (macOS Gatekeeper) hoặc "Windows
  protected your PC" (SmartScreen) ở lần chạy đầu. Đây là cảnh báo hệ điều hành bình thường với phần
  mềm nội bộ chưa ký số, không phải lỗi — hướng dẫn người dùng bấm "More info → Run anyway" (Windows)
  hoặc cho phép trong System Settings → Privacy & Security (macOS) nếu họ hỏi.
- NAS (Synology/QNAP/TrueNAS/Unraid) dùng chung cơ chế với desktop nhưng ít được kiểm thử hơn — ưu
  tiên desktop khi hướng dẫn nếu người dùng không nói rõ.

## Cần gì trước

- Tài khoản platform-admin (xem cảnh báo ở trên).
- Workspace đang có ít nhất 1 **instance đang chạy** — tool chỉ xuất hiện cho agent bên trong 1
  instance thật, không phải một khái niệm trừu tượng.
- Máy tính/NAS muốn điều khiển phải cài được chương trình nhỏ (device-agent) — không cần tài khoản
  admin trên máy đó, chỉ cần chạy được 1 dòng lệnh (macOS/Linux) hoặc PowerShell (Windows).

## Cách kết nối

1. Vào **Cài đặt → Host Devices** trong ClawExpert.
2. Bấm **"Get pairing code"** ở mục Desktop hoặc NAS — hiện lệnh cài sẵn kèm mã ghép nối (hết hạn sau
   5 phút).
3. Copy lệnh, chạy trên máy muốn điều khiển (terminal cho macOS/Linux, PowerShell cho Windows). Lệnh
   tự tải đúng bản cho hệ điều hành/kiến trúc máy, ghép nối, và cài chạy nền (không cần mở lại thủ công
   mỗi lần khởi động máy).
4. Quay lại trang, thiết bị hiện **"Connected"** khi đã kết nối thành công (vài giây sau bước 3).

## Cấu hình quyền truy cập — bắt buộc trước khi dùng được

Mặc định **không cho phép gì cả** (deny-by-default) — phải cấu hình mới dùng được `EXEC`/`FS_*`:

1. Trên thiết bị đã pair, bấm **"Configure"**.
2. **Allowed commands**: tick chọn lệnh cho phép chạy (checkbox có sẵn danh sách phổ biến: `ls`, `git`,
   `npm`, `node`, `python3`...; gõ thêm vào ô "Other command…" nếu cần lệnh khác).
3. **Allowed folders**: bấm nút gợi ý (Home/Desktop/Documents/Downloads — tính theo đúng máy đã pair)
   hoặc gõ path tuyệt đối. Chỉ file/thư mục trong danh sách này mới đọc/ghi/liệt kê được.
4. Bấm **Save**.

`NOTIFY` (gửi thông báo) không cần cấu hình gì — luôn dùng được ngay sau khi pair.

## Tool kỹ thuật — agent gọi gì để dùng thiết bị đã ghép nối

Phần này dành cho **chính agent** (không phải nội dung giải thích cho user). Tool chỉ xuất hiện trong
`tools/list` khi workspace có thiết bị đang **active-paired** đúng loại (desktop hoặc NAS) — không phải
mọi workspace đều thấy, khác các tool luôn có sẵn.

- Bộ tool desktop: `DESKTOP_EXEC`, `DESKTOP_FS_READ`, `DESKTOP_FS_WRITE`, `DESKTOP_FS_LIST`,
  `DESKTOP_NOTIFY`. NAS dùng đúng 5 tool song song với tiền tố `NAS_` (`NAS_EXEC`, `NAS_FS_READ`...).
- **`DESKTOP_FS_LIST`/`DESKTOP_FS_READ`**: liệt kê/đọc file trong phạm vi `Allowed folders` đã cấu hình.
- **`DESKTOP_FS_WRITE`**: ghi/tạo mới file **text** ở path chỉ định (`content` + `path`, tuỳ chọn
  `encoding: "base64"` — chỉ decode được nếu ra đúng UTF-8 hợp lệ, không ghi được binary thật như ảnh).
  **Không di chuyển/đổi tên file có sẵn** — chỉ ghi nội dung mới tại đúng path đưa vào.
- **`DESKTOP_EXEC`**: chạy lệnh (`command` + `args` tuỳ chọn + `cwd` tuỳ chọn) — CHỈ lệnh có trong
  `Allowed commands`, lệnh khác bị từ chối trước khi chạm tới máy.
  ⚠️ **Không có tool tạo thư mục/di chuyển/xoá file riêng** — muốn tạo folder, di chuyển, đổi tên hay
  xoá file, dùng `DESKTOP_EXEC` với lệnh tương ứng (`mkdir`, `mv`, `rm`) **nếu đã có trong allowlist**.
  Đây là hạn chế thật của tool hiện tại, không phải bạn thiếu bước — nếu người dùng cần thao tác này mà
  lệnh chưa được allow-list, nói rõ cần thêm lệnh đó vào `Allowed commands` (mục Configure) trước.
- **`DESKTOP_NOTIFY`**: gửi thông báo hệ điều hành thật (`title` + `message`) — không giới hạn allowlist.

**Đọc đúng lỗi trả về, đừng đoán:**
- `"No {desktop|nas} device is paired with this workspace..."` → chưa ghép nối thiết bị nào, hoặc
  thiết bị đã ngắt kết nối — hướng dẫn theo phần "Cách kết nối" ở trên.
- `"Command "X" is not on this workspace's {desktop|nas} exec allowlist..."` → lệnh `X` chưa được cho
  phép — hướng dẫn admin vào Configure thêm lệnh (phần "Cấu hình quyền truy cập" ở trên), không tự ý
  thử lệnh khác thay thế nếu người dùng cần đúng lệnh đó.
- `"Path "X" is outside this workspace's configured {desktop|nas} folder scope..."` → path ngoài phạm
  vi cho phép — hướng dẫn admin thêm folder vào Allowed folders, hoặc dùng path khác đã có trong scope.

**Gợi ý workflow:** trước khi `DESKTOP_FS_WRITE` đè lên 1 file có thể đã tồn tại, nên `DESKTOP_FS_LIST`
hoặc `DESKTOP_FS_READ` trước để tránh ghi đè nhầm nội dung người dùng đang cần giữ.

## Lưu ý cần thiết

- Bất kỳ thành viên nào trong workspace cũng gọi được tool trên thiết bị đang active-paired (không chỉ
  người đã pair) — giống cơ chế Extension trình duyệt.
- Mỗi workspace chỉ có **1 thiết bị active mỗi loại** (desktop/NAS) tại một thời điểm — pair thiết bị
  thứ 2 cùng loại sẽ thay thế thiết bị active hiện tại.
- Tắt device-agent trên máy hoặc revoke từ trang Cài đặt thì agent mất quyền truy cập ngay.

## Gợi ý cho agent khi hướng dẫn

- Nếu người dùng không thấy tab **Host Devices**: nói rõ tính năng hiện giới hạn platform-admin, đừng
  bịa cách khác để truy cập.
- Nếu `DESKTOP_EXEC`/`FS_*` báo lỗi do allowlist/scope: luôn trỏ đúng người dùng tới **Configure** của
  đúng thiết bị, không tự ý "làm tắt" bằng cách khác.
- Nếu người dùng cần "sắp xếp/dọn thư mục" (tạo folder, di chuyển file): nhắc rõ cần `mkdir`/`mv` trong
  `Allowed commands` trước — đây là thao tác qua `EXEC`, không phải tool `FS_*` riêng.
- Cảnh báo Gatekeeper/SmartScreen khi cài lần đầu (xem phần "Trạng thái hiện tại") là bình thường —
  đừng khiến người dùng nghĩ máy họ có mã độc.

# Điều khiển máy tính/NAS — Agent đọc/ghi file, chạy lệnh trên thiết bị đã ghép nối

> **Điều khiển thiết bị (Desktop/NAS)** cho agent đọc/ghi file, liệt kê thư mục, chạy lệnh (trong danh
> sách admin cho phép), và gửi thông báo hệ thống — trực tiếp trên **máy tính hoặc NAS của chính bạn**.
> Máy tính cài **app ClawExperts** (Mac/Windows) một lần; NAS/Linux cài bằng một dòng lệnh. Khác Extension
> trình duyệt (chỉ thấy trang web), đây là truy cập ở mức **hệ điều hành** — file thật, lệnh thật trên máy thật.
>
> Muốn **làm việc** trên máy đã ghép (dọn thư mục, tìm file, chạy lệnh) thì dùng skill `/desktop-device`;
> file này là phần **tìm hiểu và thiết lập**.

## Khác gì Connector / Extension trình duyệt

- **Connector** = agent dùng **API chính thức** của app ngoài (Gmail, Slack, Notion...).
- **Extension trình duyệt** = agent điều khiển **một tab trình duyệt** (trang web, click, điền form).
- **Điều khiển thiết bị** = agent chạm **hệ điều hành** trên máy/NAS bạn tự ghép nối — đọc/ghi file bất
  kỳ định dạng nào (trong phạm vi cho phép), chạy lệnh dòng lệnh, không giới hạn ở trình duyệt hay 1 app.

## ⚠️ Trạng thái hiện tại — chỉ platform-admin, app chưa ký số chính thức

Tính năng đang trong giai đoạn thử nghiệm nội bộ:

- Tab **Cài đặt → Host Devices** chỉ hiện với tài khoản **platform-admin** — người dùng thường sẽ
  **không thấy** tab này. Nếu người dùng hỏi mà không thấy tab, đừng bịa hướng dẫn — nói tính năng
  đang giới hạn quyền truy cập, chưa mở rộng cho mọi người dùng.
- App **ClawExperts** chưa ký bằng tài khoản Apple Developer / chứng chỉ Windows, nên lần mở đầu máy cảnh
  báo. Câu chữ thật: **macOS** *Apple could not verify "ClawExperts" is free of malware…* → bấm **Done** →
  **System Settings → Privacy & Security** → cuộn xuống → **Open Anyway** → xác nhận. **Windows** *Windows
  protected your PC* → **More info → Run anyway**. Một lần duy nhất, là cảnh báo bình thường với phần mềm
  chưa ký số, không phải mã độc. Nếu macOS nói *"is damaged and can't be opened"* thì đó là bản cũ trước
  1.0.2 — tải lại bản mới.
- NAS (Synology/QNAP/TrueNAS/Unraid) dùng chung cơ chế với desktop nhưng ít được kiểm thử hơn — ưu
  tiên desktop khi hướng dẫn nếu người dùng không nói rõ.

## Cần gì trước

- Tài khoản platform-admin (xem cảnh báo ở trên).
- Workspace đang có ít nhất 1 **instance đang chạy** — tool chỉ xuất hiện cho agent bên trong 1
  instance thật, không phải một khái niệm trừu tượng.
- Máy tính muốn điều khiển phải cài được app ClawExperts (Mac chip Apple/Intel, Windows 10/11) — không cần
  tài khoản admin trên máy đó, không cần cài thêm gì khác. NAS/Linux cài bằng một dòng lệnh.

## Cách kết nối máy tính (app ClawExperts)

1. Vào **Cài đặt → Host Devices** trong ClawExpert, mục **Desktop**, bấm **"Get pairing code"** (mã hết
   hạn sau 5 phút).
2. Bấm nút tải đúng máy: **Mac (Apple Silicon)**, **Mac (Intel)** hoặc **Windows**. Cài: Mac kéo app vào
   Applications; Windows chạy file `.exe`.
3. Mở app lần đầu, bấm qua cảnh báo hệ điều hành như mục "Trạng thái hiện tại". Icon móng vuốt hiện ở thanh
   menu (Mac) hoặc góc taskbar (Windows).
4. Quay lại trang, bấm **"Open in app"** → trình duyệt hỏi mở ClawExperts → Allow. App hiện chấm xanh
   **Connected**, trang hiện máy Connected. Không mở được thì bấm **"Copy code"**, dán vào ô Pairing code trong
   app, bấm Connect (mã đã kèm địa chỉ máy chủ, không phải chọn gì).
5. **Mở cuộc trò chuyện mới** để agent nhận máy vừa ghép — cuộc chat đang mở không thấy máy mới.
6. Lần đầu agent đọc thư mục Downloads/Desktop/Documents, macOS hỏi quyền → **Allow**. Nếu lỡ bấm Don't Allow:
   **System Settings → Privacy & Security → Files and Folders** (hoặc **Full Disk Access**) → bật ClawExperts →
   Quit app và mở lại.

App tự chạy khi đăng nhập máy, tự nối lại khi mất mạng, tự báo khi có bản mới. Bấm icon → **Disconnect** là gỡ
máy khỏi workspace ngay.

**NAS / Linux:** mở mục **"Advanced: install from a terminal"** dưới khối app, copy dòng lệnh chạy trên máy
đó (terminal). Lệnh tự tải đúng bản, ghép nối, cài chạy nền.

## Cấu hình quyền truy cập

Máy tính mới ghép được **mở sẵn 4 thư mục người dùng**: Home, Desktop, Documents, Downloads (tính theo đúng
máy đã ghép). Agent đọc/ghi/liệt kê file trong đó được ngay. **Lệnh chạy thì mặc định chưa cho phép gì** —
phải cấu hình:

1. Trên thiết bị đã pair, bấm **"Configure"**.
2. **Allowed commands**: tick chọn lệnh cho phép chạy (checkbox có sẵn danh sách phổ biến: `ls`, `git`,
   `npm`, `node`, `python3`...; gõ thêm vào ô "Other command…" nếu cần lệnh khác). Muốn agent tạo thư mục,
   di chuyển, xoá file thì tick `mkdir`, `mv`, `rm`.
3. **Allowed folders**: thêm hoặc bớt thư mục (gợi ý sẵn Home/Desktop/Documents/Downloads, hoặc gõ path tuyệt
   đối, hoặc **Browse…** chọn trên máy thật). Chỉ file/thư mục trong danh sách này mới đọc/ghi/liệt kê được.
4. Bấm **Save**.

`NOTIFY` (gửi thông báo) không cần cấu hình gì — luôn dùng được ngay sau khi pair. NAS ghép mới **không** được
mở sẵn thư mục nào, admin phải thêm.

## Tool kỹ thuật — agent gọi gì để dùng thiết bị đã ghép nối

Phần này dành cho **chính agent** (không phải nội dung giải thích cho user). Tool chỉ xuất hiện trong
`tools/list` khi workspace có thiết bị đang **active-paired** đúng loại (desktop hoặc NAS) — không phải
mọi workspace đều thấy, khác các tool luôn có sẵn.

- Bộ tool desktop: `DESKTOP_EXEC`, `DESKTOP_FS_READ`, `DESKTOP_FS_WRITE`, `DESKTOP_FS_LIST`,
  `DESKTOP_NOTIFY`. NAS dùng đúng 5 tool song song với tiền tố `NAS_` (`NAS_EXEC`, `NAS_FS_READ`...).
- **`DESKTOP_FS_LIST`/`DESKTOP_FS_READ`**: liệt kê/đọc file trong phạm vi `Allowed folders` đã cấu hình.
- **`DESKTOP_FS_WRITE`**: ghi/tạo mới file ở path chỉ định (`content` + `path`); ghi đè toàn bộ, tự tạo thư
  mục cha. File nhị phân (ảnh, zip) ghi bằng `encoding: "base64"`. **Không di chuyển/đổi tên file có sẵn** — chỉ
  ghi nội dung mới tại đúng path đưa vào. `DESKTOP_FS_READ` từ chối file trên 1 MB; file nhị phân trả về dạng
  `[binary file: N bytes, base64]`, không đọc được nội dung.
- **`DESKTOP_EXEC`**: chạy lệnh (`command` + `args` tuỳ chọn + `cwd` tuỳ chọn) — CHỈ lệnh có trong
  `Allowed commands`, lệnh khác bị từ chối trước khi chạm tới máy. Không có shell trên macOS/Linux (không
  `|`, `>`, `&&`); Windows chạy qua `cmd`. Quá 18 giây bị dừng, output quá 256 KB bị cắt; dòng cuối
  `(exit code N)` — N khác 0 là lệnh thất bại dù tool không báo lỗi.
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
- `"[DENIED] ... EPERM: operation not permitted"` → **macOS chặn quyền riêng tư** trên máy, không phải
  server. User bấm **Allow** khi macOS hỏi; nếu đã Don't Allow thì System Settings → Privacy & Security →
  Files and Folders / Full Disk Access → bật ClawExperts → Quit app mở lại.
- `"...paired but currently offline..."` → app trên máy không chạy — bảo user mở app, chờ Connected.

**Gợi ý workflow:** trước khi `DESKTOP_FS_WRITE` đè lên 1 file có thể đã tồn tại, nên `DESKTOP_FS_LIST`
hoặc `DESKTOP_FS_READ` trước để tránh ghi đè nhầm nội dung người dùng đang cần giữ.

## Lưu ý cần thiết

- Bất kỳ thành viên nào trong workspace cũng gọi được tool trên thiết bị đang active-paired (không chỉ
  người đã pair) — giống cơ chế Extension trình duyệt.
- Mỗi workspace chỉ có **1 thiết bị active mỗi loại** (desktop/NAS) tại một thời điểm — pair thiết bị
  thứ 2 cùng loại sẽ thay thế thiết bị active hiện tại.
- Bấm **Disconnect** trong app ClawExperts, Quit app, hoặc **Revoke** từ trang Cài đặt thì agent mất quyền
  truy cập ngay.
- Ghép xong phải **mở cuộc trò chuyện mới** thì agent mới thấy máy; chat đang mở không nhận máy mới.

## Gợi ý cho agent khi hướng dẫn

- Nếu người dùng không thấy tab **Host Devices**: nói rõ tính năng hiện giới hạn platform-admin, đừng
  bịa cách khác để truy cập.
- Nếu `DESKTOP_EXEC`/`FS_*` báo lỗi do allowlist/scope: luôn trỏ đúng người dùng tới **Configure** của
  đúng thiết bị, không tự ý "làm tắt" bằng cách khác.
- Nếu người dùng cần "sắp xếp/dọn thư mục" (tạo folder, di chuyển file): nhắc rõ cần `mkdir`/`mv` trong
  `Allowed commands` trước — đây là thao tác qua `EXEC`, không phải tool `FS_*` riêng.
- Cảnh báo Gatekeeper/SmartScreen khi cài lần đầu (xem phần "Trạng thái hiện tại") là bình thường —
  đừng khiến người dùng nghĩ máy họ có mã độc.

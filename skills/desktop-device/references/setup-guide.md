# Điều khiển máy tính/NAS — Agent đọc/ghi file, chạy lệnh trên thiết bị đã ghép nối

> **Điều khiển thiết bị (Desktop/NAS)** cho agent đọc/ghi file, liệt kê thư mục, chạy lệnh (trong danh
> sách admin cho phép), và gửi thông báo hệ thống — trực tiếp trên **máy tính hoặc NAS của chính bạn**.
> Máy tính cài **app ClawExperts** (Mac/Windows) một lần; NAS/Linux cài bằng một dòng lệnh. Khác Extension
> trình duyệt (chỉ thấy trang web), đây là truy cập ở mức **hệ điều hành** — file thật, lệnh thật trên máy thật.
>
> File hướng dẫn của skill `desktop-device`: phần **tìm hiểu và thiết lập** (cài app, ghép máy, cấu hình quyền).
> Cách **làm việc** trên máy đã ghép nằm trong SKILL.md của skill.

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

## Hai thứ cần có: app trên máy + skill trong workspace

| | Ở đâu | Ai làm |
|---|---|---|
| **App ClawExperts** trên máy tính | Cài đặt → Host Devices → tải, cài, Open in app | platform-admin (tab chỉ admin thấy) |
| **Skill "Điều khiển máy tính"** (`desktop-device`) trong workspace | Mục **Kỹ năng (Skills)** → tìm "Điều khiển máy tính" → **Cài** | bất kỳ thành viên; skill không cài sẵn |

Không có app thì không có máy để làm. Không có skill thì agent chỉ hướng dẫn được, chưa làm việc trên máy
(skill mang quy trình an toàn: kế hoạch → duyệt → làm → kiểm). Cài xong một trong hai đều phải **mở cuộc trò chuyện mới**.

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

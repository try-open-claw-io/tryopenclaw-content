# Điều khiển máy tính — Agent đọc/ghi file, chạy lệnh trên máy đã ghép nối

> **Điều khiển máy tính** cho agent đọc/ghi file, liệt kê thư mục, chạy lệnh (trong danh sách admin cho
> phép), và gửi thông báo hệ thống — trực tiếp trên **máy tính của chính bạn**. Máy cài **app ClawExperts**
> một lần (hiện có bản **Mac**; Windows, NAS/Linux tạm chưa mở). Khác Extension
> trình duyệt (chỉ thấy trang web), đây là truy cập ở mức **hệ điều hành** — file thật, lệnh thật trên máy thật.
>
> File hướng dẫn của skill `desktop-device`: phần **tìm hiểu và thiết lập** (cài app, ghép máy, cấu hình quyền).
> Cách **làm việc** trên máy đã ghép nằm trong SKILL.md của skill.

## Khác gì Connector / Extension trình duyệt

- **Connector** = agent dùng **API chính thức** của app ngoài (Gmail, Slack, Notion...).
- **Extension trình duyệt** = agent điều khiển **một tab trình duyệt** (trang web, click, điền form).
- **Điều khiển máy tính** = agent chạm **hệ điều hành** trên máy bạn tự ghép nối — đọc/ghi file bất
  kỳ định dạng nào (trong phạm vi cho phép), chạy lệnh dòng lệnh, không giới hạn ở trình duyệt hay 1 app.

## ⚠️ Trạng thái hiện tại — chỉ platform-admin, app chưa ký số chính thức

Tính năng đang trong giai đoạn thử nghiệm nội bộ:

- Tab **Settings (Cài đặt) → Desktop Device** chỉ hiện với tài khoản **platform-admin** — người dùng thường sẽ
  **không thấy** tab này. Nếu người dùng hỏi mà không thấy tab, đừng bịa hướng dẫn — nói tính năng
  đang giới hạn quyền truy cập, chưa mở rộng cho mọi người dùng.
- App **ClawExperts** chưa ký bằng tài khoản Apple Developer, nên lần mở đầu macOS cảnh báo. Câu chữ thật:
  *Apple could not verify "ClawExperts" is free of malware…* → bấm **Done** → **System Settings → Privacy &
  Security** → cuộn xuống → **Open Anyway** → xác nhận. Một lần duy nhất, là cảnh báo bình thường với phần
  mềm chưa ký số, không phải mã độc. Nếu macOS nói *"is damaged and can't be opened"* thì đó là bản cũ trước
  1.0.2 — tải lại bản mới.
- **Hiện chỉ có bản Mac** (chip Apple hoặc Intel). Windows và NAS/Linux tạm chưa mở trên trang cài đặt —
  người dùng hỏi thì nói rõ là chưa hỗ trợ, đừng bịa cách cài.

## Cần gì trước

- Tài khoản platform-admin (xem cảnh báo ở trên).
- Workspace đang có ít nhất 1 **instance đang chạy** — tool chỉ xuất hiện cho agent bên trong 1
  instance thật, không phải một khái niệm trừu tượng.
- Máy Mac (chip Apple hoặc Intel) cài được app ClawExperts — không cần tài khoản admin trên máy đó, không
  cần cài thêm gì khác.

## Hai thứ cần có: app trên máy + skill trong workspace

| | Ở đâu | Ai làm |
|---|---|---|
| **App ClawExperts** trên máy tính | Settings (Cài đặt) → Desktop Device → tải, cài, Open in app | platform-admin (tab chỉ admin thấy) |
| **Skill "Điều khiển máy tính"** (`desktop-device`) trong workspace | Mục **Kỹ năng (Skills)** → tìm "Điều khiển máy tính" → **Cài** | bất kỳ thành viên; skill không cài sẵn |

Không có app thì không có máy để làm. Không có skill thì agent chỉ hướng dẫn được, chưa làm việc trên máy
(skill mang quy trình an toàn: kế hoạch → duyệt → làm → kiểm). Cài xong một trong hai đều phải **mở cuộc trò chuyện mới**.

## Cách kết nối máy tính (app ClawExperts)

Trang **Settings (Cài đặt) → Desktop Device** chia 3 bước (bước 3 là cài skill **Desktop Control (Điều khiển máy tính)** ở trang Skills (Kỹ năng)):

1. **Bước 1 — tải và cài app:** bấm **Mac (Apple Silicon)** hoặc **Mac (Intel)** theo chip của máy (menu Apple →
   About This Mac). Mở file `.dmg`, kéo app vào Applications. Mở app lần đầu, bấm qua cảnh báo như mục
   "Trạng thái hiện tại". Icon móng vuốt hiện ở thanh menu.
2. **Bước 2 — ghép máy:** bấm **"Get pairing code"** → **"Open in app"** → trình duyệt hỏi mở ClawExperts →
   Allow. App hiện chấm xanh **Connected**, trang hiện "Your computer is ready". Không mở được thì bấm
   **"Copy code"**, dán vào ô Pairing code trong app, bấm Connect (mã đã kèm địa chỉ máy chủ). Mã dùng 1 lần,
   hết hạn sau 5 phút — hết hạn thì bấm **"New code"**.
3. **Mở cuộc trò chuyện mới** để agent nhận máy vừa ghép — cuộc chat đang mở không thấy máy mới.
4. Lần đầu agent đọc thư mục Downloads/Desktop/Documents, macOS hỏi quyền → **Allow**. Nếu lỡ bấm Don't Allow:
   **System Settings → Privacy & Security → Files and Folders** (hoặc **Full Disk Access**) → bật ClawExperts →
   Quit app và mở lại.

App tự chạy khi đăng nhập máy, tự nối lại khi mất mạng, tự báo khi có bản mới. Bấm icon → **Disconnect** là gỡ
máy khỏi workspace ngay.

Máy đã ghép thì 2 bước tự ẩn, bấm **"Show setup guide"** để mở lại. Ghép lại từ đó sẽ **thay** máy hiện tại
(mỗi workspace một máy).

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

`NOTIFY` (gửi thông báo) không cần cấu hình gì — luôn dùng được ngay sau khi pair.

## Lưu ý cần thiết

- Bất kỳ thành viên nào trong workspace cũng gọi được tool trên thiết bị đang active-paired (không chỉ
  người đã pair) — giống cơ chế Extension trình duyệt.
- Mỗi workspace chỉ có **1 máy tính active** tại một thời điểm — ghép máy thứ 2 sẽ thay thế máy hiện tại.
- Bấm **Disconnect** trong app ClawExperts, Quit app, hoặc **Revoke** từ trang Cài đặt thì agent mất quyền
  truy cập ngay.
- Ghép xong phải **mở cuộc trò chuyện mới** thì agent mới thấy máy; chat đang mở không nhận máy mới.

## Gợi ý cho agent khi hướng dẫn

- Nếu người dùng không thấy tab **Desktop Device**: nói rõ tính năng hiện giới hạn platform-admin, đừng
  bịa cách khác để truy cập.
- Nếu `DESKTOP_EXEC`/`FS_*` báo lỗi do allowlist/scope: luôn trỏ đúng người dùng tới **Configure** của
  đúng thiết bị, không tự ý "làm tắt" bằng cách khác.
- Nếu người dùng cần "sắp xếp/dọn thư mục" (tạo folder, di chuyển file): nhắc rõ cần `mkdir`/`mv` trong
  `Allowed commands` trước — đây là thao tác qua `EXEC`, không phải tool `FS_*` riêng.
- Cảnh báo Gatekeeper khi cài lần đầu (xem phần "Trạng thái hiện tại") là bình thường —
  đừng khiến người dùng nghĩ máy họ có mã độc.

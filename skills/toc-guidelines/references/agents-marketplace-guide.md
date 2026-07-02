# Agent Marketplace & Tạo Agent

> **Agent Marketplace (Chợ Agent)** = kho agent dựng sẵn bởi chuyên gia cho từng công việc (bán hàng Facebook/Zalo, chăm sóc khách, quản lý shop...).
> Cài một agent về workspace là dùng được ngay; hoặc bạn tự **tạo agent riêng** từ mẫu.

## 3 khái niệm dễ nhầm

- **Duyệt (browse)**: xem kho agent ở trang **Chợ Agent** (`Marketplace`). Chỉ xem, chưa ảnh hưởng gì.
- **Cài (install)**: mang một agent dựng sẵn về workspace của bạn. Hệ thống tự đẩy agent + kỹ năng + tích hợp lên instance và chạy setup giúp bạn.
- **Tạo agent (create)**: tự dựng agent của riêng bạn từ một mẫu (hoặc từ trống), qua wizard 4 bước.

> Cả "Cài từ marketplace" và "Tạo agent mới" đều cho ra một agent để chat, nhưng là **2 nút / 2 luồng khác nhau**.

## Cần gì trước

- Một **workspace có instance đang chạy** (xem `platform-basics.md`). Nếu chưa có/instance chưa chạy, nút Cài sẽ bị chặn kèm link mở chat để tạo/khởi động instance.

## Luồng A — Duyệt & cài một agent từ Marketplace

1. Mở **Chợ Agent** (sidebar) → trang **Kho Agent (Marketplace)**.
2. Dùng ô tìm "Tìm agent, lĩnh vực, chuyên gia…" hoặc lọc theo nhóm.
3. Mở một thẻ agent để xem chi tiết: **Giới thiệu / Khi nào dùng / Cách dùng**, ảnh minh hoạ, phiên bản.
4. Bấm **Cài đặt**. Hộp thoại hiện "Các bước sẽ diễn ra": *Cài agent vào workspace → Chạy kiểm tra bảo mật → Sẵn sàng chat*.
5. Bấm **Install** → chờ tiến trình (Tải lên → Cài đặt → Kiểm tra & xác minh). Quá trình chạy tự động.
6. Xong: "{tên} đã sẵn sàng" → bấm **Chat** để bắt đầu.

Sau này thẻ agent đã cài sẽ hiện **Mở** (thay cho Cài đặt); có bản mới sẽ hiện "Có phiên bản mới" và nút **Cài lại**.

## Luồng B — Vận hành agent đã cài (Operate)

- Lần đầu, một số agent cần **Setup Wizard**: kết nối các tài khoản cần thiết (vd quét QR, nối Google Sheet), rồi hệ thống **xác minh** (Đang kiểm tra… → ✓ Kiểm tra đạt).
- Sau khi setup xong → màn **Quản lý + Chat**. Muốn chỉnh lại các kết nối, bấm **Cài đặt** để mở lại wizard.

## Luồng C — Tạo agent riêng

1. Bấm **Tạo agent mới** (ở Marketplace) hoặc **Tạo Agent mới** (ở trang Agents).
2. Wizard 4 bước: **Mẫu → Danh tính → Kỹ năng → Xem lại**.
   - **Mẫu**: chọn một mẫu có sẵn, hoặc **Blank** để bắt đầu từ trống.
   - **Danh tính**: đặt **tên** (bắt buộc), mô tả, tông giọng, model, ảnh đại diện.
   - **Kỹ năng**: bật các kỹ năng/công cụ agent được dùng.
   - **Xem lại**: kiểm tra rồi bấm **Tạo agent**.
3. Xong: "Agent mới sẵn sàng để chat" → **Mở chat**.
   (Nếu tên bị trùng, hệ thống nhắc đặt tên khác.)

## Lưu ý cần thiết

- Chỉ agent **đã phát hành (Published)** mới cài được từ marketplace.
- **Đăng agent của mình lên (Upload app)** và **phát hành** chỉ dành cho chủ/quản trị workspace.
- Cài xong thường **khởi động lại instance** một chút để nạp tích hợp mới — bình thường.

## Gợi ý cho agent khi hướng dẫn

- Hỏi khách cần agent cho việc gì → gợi ý duyệt Marketplace tìm agent hợp, hoặc tạo mới nếu muốn tuỳ biến.
- Nhắc khách cần có instance đang chạy trước khi cài.
- Cài xong, gợi ý mở chat và thử một yêu cầu mẫu đúng với công việc của agent.

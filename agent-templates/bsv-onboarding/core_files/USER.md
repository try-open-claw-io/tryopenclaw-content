# USER.md — Bối cảnh công việc

- **Công ty:** Bông Sen Vàng (BSV) — Mã NS công nhân dạng `BSV#####`.
- **Việc:** Giai đoạn 1 quy trình tiếp nhận công nhân mới — kiểm tra thông tin đăng ký trước/ngày đầu làm việc.
- **Nguồn dữ liệu (Google Sheet):**
  - Sheet cụ thể **do người vận hành cung cấp lần đầu** (Bước 0 trong `AGENTS.md` → lưu qua `chamcong_set_sheet`).
    Không tự dùng một sheet id nào khi chưa được cấu hình — phải hỏi link trước.
  - Bố cục kỳ vọng: tab dữ liệu `THÔNG TIN CÔNG NHÂN ALL` (38 cột, ~1244 dòng), tab tra cứu ngân hàng `Bank`.
- **Kênh báo cáo:** người vận hành thường chat với agent qua Zalo. Agent **chỉ cần trả lời trực tiếp** —
  hệ thống tự đưa reply về đúng kênh Zalo (KHÔNG tự đi tìm/gửi vào một nhóm Zalo cụ thể).
- **Đăng ký FaceID (HANET):** sau khi đối chiếu xong và quản lý **tick cột `Duyệt FaceID`** trên các dòng `OK`, agent đăng ký FaceID lên HANET (ảnh lấy từ cột T). Địa điểm (place) + phòng ban (MEGA/CASA/SUNCASA/PHÚ QUỐC) map theo **Công trình**. Secret HANET do admin nạp lúc cài (`.env`), **không qua chat**.
- **Ngoài phạm vi:** quét khuôn mặt tại máy, hướng dẫn công nhân (việc vật lý — không tự động hoá).

# MEMORY.md — Quy tắc mềm do chủ dạy

Nơi lưu **quy tắc mềm** (soft rule) mà chủ dạy agent qua tin nhắn riêng.
Cách nhận / duyệt / huỷ rule: xem mục **DẠY AGENT BẰNG CHAT** trong `AGENTS.md`.

Ba điều bắt buộc, không có ngoại lệ:

1. **Chỉ ghi khi tin đến từ DM của chủ.** Ở group tuyệt đối không ghi gì vào file này.
2. **Rule mới luôn ở trạng thái `đề xuất`.** Chưa `đã duyệt` thì chưa được áp dụng.
3. **Không xoá dòng.** Huỷ rule = đổi trạng thái sang `đã huỷ`, giữ nguyên để truy vết.

## Định dạng mỗi rule

Id chạy tăng dần, không dùng lại id đã huỷ. Mỗi rule đúng 5 gạch đầu dòng dưới đây:

```
### R-003 · Ưu tiên TX-047 cho đơn COD cao ở Quận 7
- Trạng thái: đã duyệt | đề xuất | đã huỷ
- Điều kiện: quận = Quận 7 VÀ tiền thu hộ > 3.000.000
- Hành động: ưu tiên TX-047 lên đầu danh sách ứng viên
- Người duyệt: <tên>, lúc 2026-08-15 09:12
- Câu gốc của owner: "..."
```

| Ô | Viết gì |
|---|---|
| **Trạng thái** | đúng 1 trong 3 giá trị: `đề xuất` · `đã duyệt` · `đã huỷ` |
| **Điều kiện** | mệnh đề kiểm được trên dữ liệu Sheet (quận, COD, khối lượng, hạn giao, mã tài xế). Không viết mơ hồ kiểu "đơn quan trọng" |
| **Hành động** | chỉ 3 loại: thu hẹp điều kiện · đổi thứ tự ưu tiên ứng viên · thêm ghi chú nghiệp vụ |
| **Người duyệt** | để trống khi còn `đề xuất`; điền tên + thời điểm lúc chủ gõ `duyệt R-xxx` |
| **Câu gốc của owner** | chép **nguyên văn** câu chủ nói, không diễn giải lại |

## Ví dụ (đã comment — KHÔNG phải rule đang chạy)

Ví dụ dưới đây **không tính là rule** và **không giữ chỗ id**: rule thật đầu tiên vẫn là **`R-001`**.

<!--
### R-001 · Ưu tiên TX-047 cho đơn COD cao ở Quận 7
- Trạng thái: đã duyệt
- Điều kiện: quận = Quận 7 VÀ tiền thu hộ > 3.000.000
- Hành động: ưu tiên TX-047 lên đầu danh sách ứng viên
- Người duyệt: anh Tuấn, lúc 2026-08-15 09:12
- Câu gốc của owner: "đơn COD cao ở quận 7 thì ưu tiên thằng TX-047, nó quen khách bên đó"
-->

## Danh sách rule

<!-- Ghi rule mới xuống dưới dòng này. File khởi tạo rỗng — chưa có rule nào. -->

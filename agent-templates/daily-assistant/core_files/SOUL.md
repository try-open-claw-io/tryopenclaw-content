# Daily log

Đây là bộ nhớ dài hạn của agent qua nhiều phiên. Agent đọc + ghi liên tục.
Chủ agent cũng có thể edit trực tiếp file này để thêm/xoá/sửa entry.

## Last reviewed

(chưa có)

## Việc đang đọng

Format mỗi dòng:

```
- [YYYY-MM-DD added] <P1|P2|P3> | <tên việc> | hạn: <ngày hoặc "chưa rõ"> | nguồn: <chat|email|họp|tự nghĩ>
```

Ghi chú format:
- **P1** = quan trọng + gấp (hôm nay/ngày mai). **P2** = quan trọng nhưng chưa
  gấp. **P3** = nên làm khi rảnh.
- Một việc chỉ thuộc 1 priority — nếu owner đổi ưu tiên, sửa dòng tại chỗ.
- Khi việc xong → di chuyển sang `## Việc đã xong (7 ngày gần)` với
  `[YYYY-MM-DD done]`, không giữ lại ở đây.

(chưa có việc — agent sẽ thêm khi chủ giao)

## Việc đã xong (7 ngày gần)

Format:

```
- [YYYY-MM-DD done] <tên việc>
```

Agent rotate: giữ tối đa ~7 ngày, dòng cũ hơn 7 ngày thì lược bỏ khi sang
ngày mới (giữ cảm giác "vừa làm xong").

(rỗng)

## Dự án / nhóm việc

Khi nhận thấy ≥2 việc thuộc cùng dự án / chủ đề, gom vào group ở đây để
nhìn pipeline rõ hơn. Format:

```
### <tên dự án>
- <tên việc 1> (P? | hạn ?)
- <tên việc 2> (P? | hạn ?)
```

(rỗng — chờ pattern xuất hiện)

## Ưu tiên thường lệ

Các quy tắc / nhịp lặp lại của chủ. Agent tham chiếu khi đề xuất khung giờ
cho kế hoạch ngày.

Ví dụ:
- Deepwork buổi sáng 9-11h, không cắt cuộc gọi.
- Thứ Hai có standup 10h.
- Chiều thứ Sáu không nhận việc mới.

(chủ điền — hoặc agent học dần qua quan sát)

## Pattern / quy luật chủ

Quan sát của agent về cách chủ làm việc. Chỉ append khi đã thấy lặp ≥3 lần,
để tránh ghi đoán mò.

Format:

```
- [YYYY-MM-DD seen 3+ times] <quan sát>
```

Ví dụ:
- [2026-04-12 seen 3+ times] Việc <30 phút thường bị quên — đề xuất gom 3
  việc nhỏ thành 1 block.
- [2026-04-18 seen 3+ times] Họp dài >60 phút thường trễ — đặt hạn việc
  sau họp +30 phút buffer.

(rỗng — chờ quan sát)

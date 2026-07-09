---
name: social-post-writer
description: Viết nội dung đăng social — Facebook, LinkedIn, Instagram. Dùng khi user nói "Chuẩn bị nội dung đăng social", "viết caption Facebook", "viết post LinkedIn về X", "viết caption Instagram cho campaign Y" và tương đương tiếng Anh như "write a social post", "prepare Facebook caption", "draft a LinkedIn post", "write Instagram caption". Trigger khi cần viết post ngắn cho 1 hoặc nhiều kênh social cụ thể, không trigger cho bài blog dài (`long-form-content-writer`) hay khi cần chuyển 1 nội dung có sẵn thành nhiều post (`content-repurposer`).
---

Skill viết post social theo kênh. Mỗi kênh có văn phong, độ dài, cách xuống dòng và mật độ hashtag riêng — viết đúng format native của kênh đó, không dùng một khối chung.

## Input cần

- Chủ đề/nội dung cốt lõi muốn truyền tải, hoặc brief/content gốc nếu đang derive từ nội dung khác (nếu derive từ content có sẵn để ra nhiều post, dùng `content-repurposer`).
- Kênh đích: Facebook, LinkedIn, và/hoặc Instagram. Hỏi nếu chưa rõ kênh nào.
- CTA mong muốn (nếu có).

## Format native theo kênh

Viết đúng cách người ta thật sự đọc trên từng nền tảng. Đây là điểm khác biệt chính giữa các kênh — không chỉ đổi hashtag.

**LinkedIn**
- Câu đầu là hook độc lập — chỉ ~2 dòng đầu hiện trước nút "see more", dồn lực vào đó.
- Đoạn ngắn 1–2 câu, cách nhau bằng dòng trống để tạo khoảng thở, dễ lướt.
- Giọng chuyên nghiệp nhưng có quan điểm/insight thật, viết ở ngôi thứ nhất được. Không sáo, không "khoe".
- Hashtag ít: 3–5 cái, đặt cuối bài. Emoji tối thiểu.
- CTA nhẹ: mời bình luận góc nhìn, hoặc "link ở comment".

**Facebook**
- Giọng đời, gần gũi, kể chuyện được. Câu đầu vẫn phải là hook (bị cắt sau ~5 dòng).
- Có thể dài hơn LinkedIn nếu đang kể chuyện; nhưng vẫn xuống dòng thoáng.
- Emoji dùng vừa phải, tự nhiên. Hashtag 0–3, không nhồi.
- Link đặt trực tiếp trong post được. CTA: bình luận, tag bạn, share.

**Instagram**
- Caption phục vụ visual, không thay visual. Hook mạnh ở câu đầu (bị cắt ~125 ký tự).
- Nhịp ngắn, xuống dòng nhiều, dễ đọc trên mobile. Emoji tự nhiên hơn 2 kênh kia.
- Hashtag nhiều hơn: 5–15, gom thành block cuối caption hoặc đưa xuống comment đầu.
- Link không click được trong caption → dùng "link in bio". CTA: save, share, DM, "link in bio".

## Output

Trả về **chính các caption** — mỗi kênh một caption viết sẵn, đúng format trên, sẵn để copy đi đăng. Kèm mỗi kênh một dòng visual brief ngắn (loại ảnh/carousel/video cần) để người dựng hình làm — skill này không tạo ảnh.

Không bọc output trong khung phân tích (không "Content objective / Target audience / Main angle…"). Người dùng chỉ cần caption. Nếu có gì cần họ xác nhận (thiếu link, CTA chưa rõ), ghi một dòng ngắn cuối cùng.

## Cách hoạt động

1. Xác nhận kênh + chủ đề nếu chưa rõ.
2. Viết riêng từng kênh theo format native ở trên — không copy-paste một caption rồi đổi hashtag. Tone, độ dài, cách xuống dòng, mật độ hashtag phải khác nhau thật.
3. Chạy `humanizer` trên từng caption trước khi trả: bỏ từ sáo, bỏ kiểu liệt kê máy móc, phá "rule of three", cho có giọng người.
4. Đưa visual brief đủ cụ thể để người dựng hình hiểu.

## Quy tắc cứng

- Không viết CTA yêu cầu hành động mà brand chưa có (ví dụ "mua ngay" khi chưa có link/sản phẩm) — hỏi user nếu thiếu.
- Không tự đăng lên bất kỳ kênh nào — skill này chỉ soạn nội dung, việc đăng do user/quy trình publish riêng.
- Hashtag phải liên quan trực tiếp nội dung, không nhồi hashtag để câu reach.
- Không bịa số liệu/quote/testimonial trong caption.

## Khung 1 post + đặc thù kênh (community-distilled)

Mỗi caption theo mạch: Hook (1 dòng dừng lướt) → Pain/đồng cảm (1-2 dòng) → Giá trị/giải pháp (1-2 dòng) → Proof (1 kết quả/ví dụ cụ thể, không bịa) → CTA ít ma sát.
- LinkedIn: số liệu ăn đứt câu chuyện, dùng "bạn" nhiều hơn "chúng tôi", dẫn bằng insight ngành.
- Facebook: câu chuyện + cảm xúc thắng số liệu.
- Instagram: hook + hình, chữ phục vụ visual.
Hook đầu dòng quyết định có người đọc tiếp hay không.

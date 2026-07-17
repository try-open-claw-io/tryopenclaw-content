# Ad Copy Rule Set — QA trước khi giao

## Ad copy rules (AD-RULE)

| ID | Priority | Rule |
|---|---|---|
| AD-RULE-01 | MUST | One angle per ad — một quảng cáo một angle chính, không trộn nhiều thông điệp. |
| AD-RULE-02 | MUST | Message match — ad, creative và landing page phải cùng offer, product và claim. |
| AD-RULE-03 | SHOULD | Benefit before supporting proof — nêu lợi ích trước, proof đỡ lưng sau. |
| AD-RULE-04 | MUST | CTA matches funnel — CTA không đòi cam kết cao hơn mức sẵn sàng của audience. |
| AD-RULE-05 | SHOULD | Front-load mobile copy — đưa product/value quan trọng lên đầu vì nội dung có thể bị truncate. |
| AD-RULE-06 | SHOULD | Variation with one controlled change — mỗi variation đổi MỘT biến (angle, hook hoặc proof) để dễ học từ test. |
| AD-RULE-07 | PROHIBITED | No performance claim from example article — không gọi ví dụ/bài mẫu là "proven converter". |
| AD-RULE-08 | MUST | Offer completeness — giá/discount/deadline phải nhất quán và có terms khi cần. |
| AD-RULE-09 | MUST | Platform limits validation — kiểm character/asset requirement tại thời điểm chạy campaign. |

## Global rules áp cho mọi copy

| ID | Priority | Rule |
|---|---|---|
| GLOBAL-RULE-01 | MUST | Facts before fluency — mọi claim phải truy về brief hoặc nguồn đã kiểm tra. QA: có câu nào nghe hợp lý nhưng không có supporting fact không? |
| GLOBAL-RULE-02 | MUST | Preserve modality — không đổi "có thể", "hỗ trợ", "được công bố" thành lời khẳng định tuyệt đối. |
| GLOBAL-RULE-03 | MUST | Mark inference — mọi suy luận gắn `Inferred`; không đưa thành fact trong final copy nếu chưa xác nhận. |

## QA checklist trước khi giao

- [ ] Mỗi variant CHỈ một angle chính (AD-RULE-01).
- [ ] Offer (nếu có) đủ amount + condition + deadline + terms, nhất quán ad↔landing (AD-RULE-02, AD-RULE-08).
- [ ] CTA khớp funnel stage (AD-RULE-04).
- [ ] Value/product ở phần đầu primary text (AD-RULE-05).
- [ ] Các variant đổi có chủ đích một biến để A/B (AD-RULE-06).
- [ ] Không claim/số liệu/scarcity/proof bịa; modality giữ nguyên (GLOBAL-RULE-01/02).
- [ ] Đã humanize: không em-dash, không sáo ngữ, không liệt kê đều đều.

## Nguồn best-practice (build rule, không phải performance database)

### Google Ads (Search)
- [About responsive search ads](https://support.google.com/google-ads/answer/7684791?hl=en) — multiple headlines/descriptions; asset combination behavior.
- [Responsive search ad best practices](https://support.google.com/google-ads/answer/6167122?hl=en) — relevance, asset diversity, quality, testing.
- [Create effective responsive search ads](https://support.google.com/google-ads/answer/10530456?hl=en) — keyword relevance, asset quality, ad strength workflow.
- [Google Ads Transparency Center](https://adstransparency.google.com/) — real published ads; KHÔNG dùng làm performance database.

### Meta / Facebook / Instagram
- [Best practices for image ads](https://www.facebook.com/business/help/388369961318508/) — creative-copy fit và image-ad considerations.
- [Instagram advertising best practices](https://www.facebook.com/business/help/1057599754429122/) — chọn nội dung phù hợp để quảng bá và quan sát hiệu quả trên chính tài khoản.
- [Meta Ad Library](https://www.facebook.com/ads/library/) — real active/published ad copy; KHÔNG suy ra conversion.

# Keyword research workflow — KHÔNG dùng volume API

> Trích từ playbook e-commerce §2. Đây là workflow keyword research định tính.
>
> **Nguyên tắc cốt lõi: chỉ dùng tín hiệu định tính từ Search/Fetch. TUYỆT ĐỐI không claim search volume khi không có dữ liệu đo volume.**

## Input tối thiểu từ end-user (§2.1)

Agent cần yêu cầu hoặc nhận được các dữ liệu sau trước khi nghiên cứu keyword:

```yaml
product_name:
product_category:
product_facts:
  materials_or_ingredients: []
  specifications: []
  verified_benefits: []
  use_cases: []
  variants: []
price_and_offer:
  price:
  promotion:
customer:
  target_segments: []
  pain_points: []
  desired_outcomes: []
market:
  country: VN
  language: vi
brand_voice:
restrictions:
  prohibited_claims: []
  required_disclosures: []
```

## Quy trình Agent phải thực hiện (§2.2)

1. Tạo seed keyword từ tên loại sản phẩm, thuộc tính xác thực, use case, pain point và câu hỏi mua hàng.
2. Search từng nhóm keyword bằng ngôn ngữ và thị trường mục tiêu.
3. Fetch các kết quả đại diện để xác định search intent và cấu trúc nội dung đang được dùng.
4. Ghi nhận các **Observed Search Signals**:
   - Autocomplete được nhìn thấy tại thời điểm kiểm tra, nếu có.
   - People Also Ask, nếu có.
   - Related Searches, nếu có.
   - Loại trang chiếm ưu thế: product, category, blog hướng dẫn, review, comparison, forum hoặc marketplace.
   - Brand/marketplace xuất hiện trong nhóm kết quả đầu.
   - Mức độ cập nhật của nội dung.
   - Khoảng trống thông tin mà các kết quả hiện tại chưa trả lời tốt.
5. Gắn nhãn định tính:

```yaml
demand_signal: strong | medium | weak | unknown
competition_signal: high | medium | low | unknown
intent:
  primary: informational | commercial | transactional | navigational | mixed
  secondary: []
```

6. Chọn:
   - 1 primary keyword.
   - 3–8 secondary keywords/entities.
   - 3–10 câu hỏi hoặc subtopics.
   - Các keyword phải loại bỏ vì sai intent hoặc không được hỗ trợ bởi dữ liệu sản phẩm.

## Điều Agent TUYỆT ĐỐI KHÔNG được kết luận (§2.3)

- Không nói keyword có "volume cao" hoặc nêu số volume khi không có nguồn đo volume.
- Không coi autocomplete là bằng chứng về lượng tìm kiếm.
- Không coi vị trí hiện tại của một bài là bằng chứng cho conversion.
- Không gọi một bài là "top-ranking" nếu chưa ghi keyword, thị trường, ngày và vị trí quan sát.
- Không dùng số lượng kết quả Google làm search volume.

## Format báo cáo keyword bắt buộc (§2.4)

```md
## Keyword Observation

- Market: Vietnam
- Language: Vietnamese
- Checked at: YYYY-MM-DD
- Primary keyword candidate:
- Search intent:
- Demand signal: Strong / Medium / Weak / Unknown
- Competition signal: High / Medium / Low / Unknown
- Observed SERP composition:
- People Also Ask / related questions:
- Content gaps:
- Recommended content angle:
- Limitation: Đánh giá định tính từ Search/Fetch, không phải dữ liệu search volume.
```

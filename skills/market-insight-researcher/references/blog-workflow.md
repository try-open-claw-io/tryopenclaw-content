# Blog SEO workflow — research → synthesize → write ONE article

> Trích từ playbook e-commerce §44 (Blog SEO — Final example set) + phần blog của §51 (OpenClaw Agent Operating Workflow).

## Blog SEO flow (bắt buộc SHOW chain-of-thought từng bước research TRƯỚC khi xuất output)

1. **Keyword** — chạy keyword workflow (xem `keyword-workflow.md`): chốt primary keyword + intent.
2. **Search Google** cho keyword ở đúng thị trường + ngôn ngữ.
3. **Fetch top organic + AI Overview (best-effort)** — mở các kết quả top organic; lấy AI Overview nếu hiển thị (best-effort, không bắt buộc phải có).
4. **Extract outline** của các bài top-ranking — họ cấu trúc nội dung thế nào, cover mục gì.
5. **Synthesize ideas** từ các outline đó.
6. **Lọc ý** — bỏ các ý KHÔNG hợp USP của store; **thêm heading bám USP** của store.
7. **Viết MỘT bài hoàn chỉnh** (không phải outline rời, không phải nhiều bản nháp).

> Agent phải **hiển thị chain-of-thought** của các bước research (2–5) ra cho user thấy trước khi giao bài viết. Không giấu quá trình, không nhảy thẳng tới output.

---

## Ví dụ chuẩn Blog SEO (§44)

### SEO-FINAL-01 — Canifa: list/how-to fashion article
- Evidence: REAL-E1
- Source: https://canifa.com/blog/cach-phoi-ao-khoac-croptop-dep
- Search intent: Informational with commercial bridge.
- Structure: Quick answer → outfit options → fit/body/use-case notes → internal product links.
- Agent should learn: Mỗi mục phải tạo ra lựa chọn thực tế, không chỉ đổi tên item.
- Weakness to avoid: Listicle dài nhưng các ý lặp lại.

#### GOLD-SEO-01 — Cách phối áo polo nam

**Recommended Outline**

1. Trả lời nhanh: ba nguyên tắc về fit, màu và hoàn cảnh.
2. Polo + quần kaki cho smart casual.
3. Polo + jeans cho cuối tuần.
4. Polo + short cho thời tiết nóng.
5. Cách chọn giày và phụ kiện.
6. Các lỗi thường gặp.
7. FAQ theo câu hỏi quan sát từ Search.

### SEO-FINAL-02 — Thế Giới Di Động: data-scoped commercial investigation
- Evidence: REAL-E1/E2
- Source: https://www.thegioididong.com/hoi-dap/top-10-dien-thoai-ban-chay-nhat-nam-tai-the-gioi-1447690
- Search intent: Commercial investigation.
- Structure: Scope/date disclosure → comparison list/table → who each item is for → price/availability CTA.
- Agent should learn: Mọi "bán chạy" phải có retailer, time range và data source.
- Prohibited transformation: "Bán chạy tại TGDĐ" → "bán chạy nhất Việt Nam".

#### GOLD-SEO-02 — 7 điện thoại được mua nhiều tại Retailer X trong tháng 6/2026

**Required disclosure**

Danh sách dựa trên số lượng bán ra tại Retailer X trong tháng 6/2026; không đại diện cho toàn bộ thị trường Việt Nam.

### SEO-FINAL-03 — Tiki: step-by-step marketplace content
- Evidence: REAL-E1
- Source: https://tiki.vn/blog/cac-buoc-skincare/
- Search intent: Informational.
- Structure: Routine overview → ordered steps → product type examples → optional commerce modules.
- Agent should learn: Product recommendation phải xuất hiện sau khi giải thích tiêu chí chọn.
- Risk: Không dùng marketplace article làm nguồn duy nhất cho claim sức khỏe.

#### GOLD-SEO-03 — Routine chăm sóc da cơ bản cho người mới

**Content rules**

- Giải thích mục tiêu của từng bước.
- Tách bước cần thiết và bước tùy chọn.
- Không đề xuất hoạt chất điều trị dựa trên chẩn đoán suy đoán.
- Khuyến nghị patch test và tư vấn chuyên gia khi có vấn đề kéo dài.

### SEO-FINAL-04 — Paula's Choice: brand education to product bridge
- Evidence: REAL-E1
- Source: https://paulaschoice.vn/blogs/kien-thuc-cham-soc-da/chu-trinh-cham-soc-da-co-ban-cua-paulas-choice-hoat-dong-nhu-the-nao
- Search intent: Informational/commercial mixed.
- Structure: Education framework → steps → ingredient/product categories → brand product bridge.
- Agent should learn: Phân biệt knowledge chung với recommendation của brand.

#### GOLD-SEO-04 — Cách xây dựng routine theo mục tiêu da

**Required source handling**

- Mọi claim về hoạt chất phải có nguồn tin cậy.
- Gắn nhãn khi recommendation là quan điểm của brand.
- Không cá nhân hóa như tư vấn y khoa nếu thiếu đánh giá chuyên môn.

### SEO-FINAL-05 — Kettle & Fire: comprehensive how-to
- Evidence: REAL-E1
- Source: https://blog.kettleandfire.com/how-to-make-bone-broth/
- Search intent: How-to.
- Structure: Outcome promise → ingredients/tools → ordered method → troubleshooting → storage/use cases → product alternative.
- Agent should learn: How-to tốt cần cảnh báo, lỗi thường gặp và tiêu chí hoàn thành.
- Risk: Không tái sử dụng health claims không được kiểm chứng.

#### GOLD-SEO-05 — Cách nấu nước dùng xương tại nhà

**Outline**

- Chuẩn bị nguyên liệu và dụng cụ.
- Cách sơ chế.
- Thời gian nấu theo từng phương pháp.
- Dấu hiệu nước dùng đạt yêu cầu.
- Bảo quản an toàn.
- Những lỗi phổ biến.
- Khi nào sản phẩm đóng gói là lựa chọn tiện hơn.

---

## Agent Operating Workflow — phần liên quan blog (§51)

### Step 4 — Research only what is needed (§51.4)
- Keyword: dùng workflow keyword research (`keyword-workflow.md`).
- Product facts: ưu tiên website/tài liệu do end-user cung cấp.
- Best practices: ưu tiên tài liệu chính thức và nguồn chuyên môn.
- Không research để tìm "fact thay thế" cho thông tin nội bộ mà brand chưa cung cấp.

### Step 5 — Select patterns, not prose (§51.5)
Agent chọn tối đa:
- 1 real/source-derived example có cùng output.
- 1 example có cùng funnel stage.
- 1 Gold Example có cùng structure.
- 3–8 rules liên quan trực tiếp.

Không trộn quá nhiều pattern khiến output thiếu trọng tâm.

### Step 6 — Draft (§51.6)
Draft theo thứ tự:
1. Message hierarchy.
2. Hook.
3. Benefit/proof.
4. Objection or detail.
5. CTA.
6. Channel formatting.

### Step 8 — Output format (§51.8)
```md
## Final Copy

...

## Assumptions / Missing Inputs

- Chỉ hiển thị khi có.

## Sources / Verified Facts

- Chỉ hiển thị khi user yêu cầu hoặc output cần audit.
```

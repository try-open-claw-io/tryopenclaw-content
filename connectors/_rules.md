# Connector Content — Style Rules & Audit Checklist

> **Mục đích:** Đảm bảo nội dung `*.md` connector trong folder này luôn **general** (universal), không gắn cá nhân hoá cụ thể. File này là style guide canonical cho lúc viết content connector mới và audit content cũ.

---

## A. Hard rules (audit ❌ nếu vi phạm)

### A1. Không tên người
- **Cấm:** mọi first name người (Mai, An, Lan, Huy, John, Alice, Sarah, Bob...) — VN lẫn EN.
- **Cấm:** mọi xưng hô gắn cá nhân ("chị Mai", "anh An", "Mr. Smith", "@alice").
- **Thay bằng:** "khách", "khách hàng", "đối tác", "team", "thành viên", "đồng nghiệp", "the customer", "a teammate", "the team".

### A2. Không brand/công ty thật ngoài chính connector
- **Cấm:** tên công ty thật của khách hàng giả định ("Shop Hoa Mai", "công ty FPT", "Acme Corp").
- **OK:** placeholder generic ("shop X", "công ty A", "the team", "your company").
- **OK:** brand của chính connector đó (Gmail, Slack, HubSpot) — viết đúng casing chính chủ.

### A3. Không email/SĐT/ID thật
- **Cấm:** email thật (john@example.com), SĐT thật (0901xxx), ID khách thật.
- **OK:** placeholder rõ ("email khách", "SĐT khách", "ID đơn hàng"). Nếu phải nêu mẫu → dùng `khach@example.com`, `09xx-xxx-xxx`.

### A4. Không event/lễ/địa danh quá local
- **Cấm:** event chỉ 1 vùng hiểu được (vd "lễ Quốc Khánh 2/9" trừ khi connector phục vụ riêng VN).
- **OK:** thời điểm generic ("cuối tuần", "tháng này", "tuần trước", "Q2"). Lễ phổ biến toàn cầu (Tết, Black Friday, Christmas) OK nếu phục vụ context shopping/marketing — nhưng ưu tiên generic.

### A5. Description đúng định dạng — flow "Agent có thể…"
Đúng **2 câu**, theo flow:
- **Câu 1 — connector là gì:** `{Brand} là {dịch vụ gì}.` (vd "Gmail là dịch vụ email của Google.").
- **Câu 2 — Agent làm được gì:** mở đầu bằng `Với kết nối này, Agent có thể` (en: `With this connection, the Agent can`) + liệt kê 3-4 động từ năng lực + đối tượng, kết bằng dấu chấm. **Không** thêm đuôi "v.v." / "and more".
  - vd vi: "Với kết nối này, Agent có thể đọc, gửi, sắp xếp và tìm kiếm thư trong hộp thư của bạn."

Ràng buộc giữ nguyên:
- Không > 200 ký tự / lang. Câu chủ động, lợi ích end-user trước.
- Không jargon API ("OAuth", "webhook", "rate-limit").
- Cả `vi` + `en` đều **bắt buộc filled**, không để rỗng.

### A6. Category nằm trong enum
Chỉ được dùng 1 trong các slug folder đang dùng:

```
commerce | communication | crm-sales | documents |
engineering | productivity | scheduling | storage | support
```

Slug mới phải PR riêng để add vào enum + cập nhật file này.

### A7. Slug `id` khớp Composio + filename
- `id` (frontmatter) === filename (không `.md`) === Composio app slug.
- Pattern: `^[a-z0-9_-]+$` (xem `_schema.json`).

---

## B. Soft rules (audit ⚠️ nếu lệch)

### B1. Chỉ 1 tutorial = hành động đơn giản & phổ quát nhất
Mỗi connector chỉ giữ **đúng 1 row** trong `tutorials` — phản ánh **hành động đơn giản & phổ quát nhất** của connector (thường là đọc/kiểm tra/liệt kê) mà **mọi end-user copy-paste là chạy được ngay, không cần điền gì, không phụ thuộc bối cảnh riêng**. Không liệt kê use-case phụ.

### B1b. Prompt bắt đầu bằng @mention
`prompt.vi` và `prompt.en` **phải bắt đầu** bằng `@<id>` của connector (vd `@gmail`, `@googlecalendar`, `@larksuite-tenant`) — đây là cú "gọi" connector trong khung chat.
- Sau `@<id>` viết thường, là 1 câu mệnh lệnh tự nhiên (vd `@gmail mở 5 mail chưa đọc hôm nay.`).
- **Không lặp lại tên brand** trong câu vì @mention đã chỉ rõ connector (❌ `@gmail mở mail Gmail...`).
- Chỉ 1 câu duy nhất / lang.

### B2. Tone & xưng hô
- **VN:** xưng "mình" hoặc lược chủ ngữ. Tránh "tôi/bạn" formal. Đuôi "giúp mình", "cho mình" được khuyến khích → giống user gõ thật.
- **EN:** imperative ("Show...", "Schedule...", "Find..."). Tránh "Please".

### B3. Tutorial title
- 2-5 từ. Mệnh lệnh hoặc danh động từ ("Tạo link đặt lịch", "Create booking link").
- Không lặp tên connector trong title ("Tạo Gmail mail" ❌ — connector đã rõ trong context).

### B4. Prompt = lệnh đơn giản nhất, ưu tiên zero-input
- Prompt phải **chạy được ngay khi copy-paste** cho mọi tài khoản — **không hardcode ngữ cảnh cụ thể** (số liệu, ngày "hôm nay", tên doc/board/kênh thật, scenario riêng).
- **Mặc định: zero-input.** Chọn 1 hành động đọc/kiểm tra/liệt kê tự khoanh phạm vi bằng "của mình" / "gần đây" / "giao cho mình" / "đang chờ" — không cần user điền gì.
  - ✅ "@gmail kiểm tra mail chưa đọc của mình."
  - ✅ "@shopify xem các đơn hàng gần đây."
  - ✅ "@jira xem các task đang giao cho mình."
- **Placeholder chỉ là ngoại lệ.** Chỉ khi connector **thuần gửi/tạo** và không có hành động đọc có nghĩa → dùng **đúng 1** `[noun]` cho phần bắt buộc nhập. Format `[mô tả tham số]` (danh từ tiếng Việt, không `X`/`Y`).
  - ✅ "@twilio gửi SMS cho [số điện thoại]." (Twilio không có inbox để đọc)
  - ✅ "@linkedin tìm ứng viên cho [vị trí cần tuyển]."
- **Tránh:**
  - ❌ "@gmail mở 5 mail chưa đọc từ khách hàng hôm nay." (hardcode số/nguồn/ngày)
  - ❌ "@slack gửi thông báo vào #sales: có đơn mới 500k." (scenario cứng)
  - ❌ nhồi nhiều `[noun]` vào 1 prompt — chỉ tối đa 1, và chỉ khi bắt buộc.

### B5. Length prompt
- ≤ 25 từ / lang. Dài hơn → user khó hình dung gõ.

### B6. Format `howToUse` — đúng 1 dòng "Kích hoạt kết nối"
`howToUse.vi` và `howToUse.en` mỗi bên là array **đúng 1 phần tử**, mở đầu bằng nhãn in đậm:

- **vi:** `**Kích hoạt kết nối:** viết rõ cụm "dùng tryopenclaw connector @<id>" trong câu chat để Agent biết và {làm gì với connector}. Ví dụ: "dùng tryopenclaw connector @<id> để {hành động} giúp tôi".`
- **en:** `**Activate the connection:** write the exact phrase "use the tryopenclaw connector @<id>" in your chat so the Agent knows to {do what}. Example: "use the tryopenclaw connector @<id> to {action}".`

Yêu cầu:
- Phải chứa cụm trigger chuẩn `dùng tryopenclaw connector @<id>` (en: `use the tryopenclaw connector @<id>`) — chỉ 1 cụm, không dùng "dùng kết nối @<id>".
- Phải có 1 `Ví dụ:` (en: `Example:`), câu lệnh bắt đầu bằng `dùng tryopenclaw connector @<id>`, đuôi vi "giúp tôi".
- Xưng hô: dùng "bạn" + "Agent" (viết hoa) — đây là copy hướng dẫn end-user, **khác** tone prompt ở §B2.
- **Chỉ read-only:** cả mục đích lẫn `Ví dụ:` chỉ được mô tả hành động **xem / kiểm tra / liệt kê / tóm tắt / tìm / theo dõi** — **cấm** gửi, đăng, nhắn, tạo, cập nhật, xoá hay bất kỳ thao tác tương tác/ghi nào. Kể cả connector thuần gửi (sendgrid, twilio…) cũng lấy ví dụ xem (vd "xem hoạt động gửi mail gần đây", "xem lịch sử tin nhắn"). Đây là copy demo an toàn để user không vô tình kích hoạt thao tác gửi đi.

---

## C. Audit checklist (1 file = 1 lần check)

Trước khi merge file connector mới, đi từ trên xuống:

- [ ] **C1.** Frontmatter validate với `_schema.json` (required: id, name, category, tutorials).
- [ ] **C2.** `id` khớp filename khớp Composio slug.
- [ ] **C3.** `name.vi` + `name.en` giữ đúng brand casing (vd "Google Calendar" không phải "Googlecalendar").
- [ ] **C4.** `description.vi` + `description.en` đều ≥ 1 câu, không rỗng, không quá 200 ký tự.
- [ ] **C5.** `category` ∈ enum §A6.
- [ ] **C6.** `tutorials` có đúng 1 row, đủ `title` + `prompt` cả vi + en; `prompt.vi`/`prompt.en` bắt đầu bằng `@<id>` (xem §B1b).
- [ ] **C7.** Grep `[A-Z][a-zà-ỹ]+` trong tất cả `prompt.vi` và `prompt.en` → không có first name người (Mai/An/Lan/John/Alice/Sarah/Bob/Carol/David/Emma...).
- [ ] **C8.** Grep "chị |anh |em |ông |bà |Mr\\.|Ms\\.|Mrs\\." → không có xưng hô gắn cá nhân.
- [ ] **C9.** Grep email/SĐT pattern (`\\S+@\\S+`, `\\d{4,}`) → không có dữ liệu thật.
- [ ] **C10.** Prompt là hành động phổ quát zero-input — copy-paste chạy được mọi tài khoản, không hardcode ngữ cảnh; chỉ dùng `[noun]` khi connector thuần gửi/tạo (xem §B1, §B4).
- [ ] **C11.** Đọc lại description: end-user (không phải dev) có hiểu app này làm gì không?
- [ ] **C12.** Đọc lại prompt: nếu copy-paste vào agent chat, agent có gọi đúng connector ko?
- [ ] **C13.** Description đúng flow §A5: câu 1 `{Brand} là …`, câu 2 mở đầu `Với kết nối này, Agent có thể …, v.v.`.
- [ ] **C14.** `howToUse.vi`/`.en` đúng 1 phần tử, mở đầu `**Kích hoạt kết nối:**`, có cụm `dùng tryopenclaw connector @<id>` + 1 `Ví dụ:` (§B6).
- [ ] **C15.** `howToUse` read-only: mục đích + `Ví dụ:` chỉ xem/kiểm tra/liệt kê/tóm tắt/tìm/theo dõi — không gửi/đăng/nhắn/tạo/cập nhật/xoá (§B6).

---

## D. Audit grep nhanh (chạy trước khi merge PR)

```bash
# D1. Tìm first name người + company giả định.
# Bỏ token ngắn dễ trùng VN word (Tu/Tu/Nam/An/Hoa) — audit thủ công riêng.
grep -nE "\\b(Mai|Lan|Huy|Linh|Trang|Tuan|Hoang|Phuong|Quang|Thanh|Khoa|Khanh|Thao|Phuc|Quynh|Thuy|John|Alice|Sarah|Bob|Mike|Emma|David|Carol|Smith|Jones|Brown|Acme)\\b" \
  /Users/admin/tryopenclaw-content/connectors/*.md | grep -v _rules.md

# D2. Xưng hô gắn cá nhân (word-boundary trước pronoun)
grep -nE "\\b(chị|anh|ông|bà) [A-ZĐÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÊẾỀỂỄỆÔỐỒỔỖỘƠỚỜỞỠỢÚỨỪỬỮỰÍÌỈĨỊÝỲỶỸỴ]" \
  /Users/admin/tryopenclaw-content/connectors/*.md | grep -v _rules.md
grep -nE "\\b(Mr|Ms|Mrs|Dr)\\. [A-Z]" \
  /Users/admin/tryopenclaw-content/connectors/*.md | grep -v _rules.md

# D3. Email/SĐT thật
grep -nE "([a-z0-9._-]+@[a-z0-9.-]+\\.[a-z]{2,}|\\b0[0-9]{9}\\b)" \
  /Users/admin/tryopenclaw-content/connectors/*.md | grep -v _rules.md

# D4. Description rỗng
grep -B1 -A1 "vi: \"\"" /Users/admin/tryopenclaw-content/connectors/*.md

# D5. Category ngoài enum
grep "^category:" /Users/admin/tryopenclaw-content/connectors/*.md \
  | grep -vE "(commerce|communication|crm-sales|documents|engineering|productivity|scheduling|storage|support)$"

# D6. Name brand sai casing (vd "Googlecalendar" thay vì "Google Calendar")
grep -nE "^  (vi|en): \"[A-Z][a-z]+[a-z]{4,}\"" \
  /Users/admin/tryopenclaw-content/connectors/*.md | grep -v _rules.md

# D7. Description.vi thiếu flow "Với kết nối này, Agent có thể" (§A5)
for f in /Users/admin/tryopenclaw-content/connectors/*.md; do
  case "$f" in */_*.md) continue;; esac
  grep -q "Với kết nối này, Agent có thể" "$f" || echo "FAIL §A5: $f thiếu flow 'Với kết nối này, Agent có thể'"
done

# D8. howToUse thiếu nhãn Kích hoạt kết nối / sai cụm trigger (§B6)
for f in /Users/admin/tryopenclaw-content/connectors/*.md; do
  case "$f" in */_*.md) continue;; esac
  grep -q '\*\*Kích hoạt kết nối:\*\*' "$f" || echo "FAIL §B6: $f thiếu nhãn '**Kích hoạt kết nối:**'"
  grep -q 'dùng tryopenclaw connector @' "$f" || echo "FAIL §B6: $f thiếu cụm trigger 'dùng tryopenclaw connector @<id>'"
  grep -q 'dùng kết nối @' "$f" && echo "FAIL §B6: $f còn sót cụm cũ 'dùng kết nối @<id>'"
done

# D9. howToUse phải đúng 1 bullet mỗi lang (§B6)
for f in /Users/admin/tryopenclaw-content/connectors/*.md; do
  case "$f" in */_*.md) continue;; esac
  vi=$(awk '/^  vi:/{f=1;next} /^  en:/{f=0} /^tutorials:/{f=0} f&&/^    - /{c++} END{print c+0}' "$f")
  en=$(awk '/^  en:/{f=1;next} /^tutorials:/{f=0} f&&/^    - /{c++} END{print c+0}' "$f")
  [ "$vi" = "1" ] && [ "$en" = "1" ] || echo "FAIL §B6: $f howToUse vi=$vi en=$en (cần 1/1)"
done

# D10. howToUse Ví dụ phải read-only — cấm động từ ghi ngay sau "để"/"to" (§B6, C15)
for f in /Users/admin/tryopenclaw-content/connectors/*.md; do
  case "$f" in */_*.md) continue;; esac
  grep -nE 'Ví dụ:.*để (gửi|đăng|nhắn|tạo|cập nhật|xoá|xóa|thêm|trả lời)' "$f" \
    && echo "FAIL §B6: $f Ví dụ.vi có thao tác ghi (cần read-only)"
  grep -nE 'Example:.*to (send|post|message|create|update|delete|add|reply|write)' "$f" \
    && echo "FAIL §B6: $f Example.en có thao tác ghi (cần read-only)"
done
```

Mọi grep output **non-empty** = audit fail → sửa rồi PR.

---

## E. Khi nào được phá rule

Hard rule §A cấm tuyệt đối — không có ngoại lệ trong content render production.

Soft rule §B được lệch nếu connector có use-case đặc biệt làm chuẩn chung không hợp. Ghi note trong PR body lý do lệch.

---

**Liên quan:**

- `_schema.json` — JSON Schema validation cho frontmatter.
- `_template.md` — template file mẫu để copy khi tạo connector mới.

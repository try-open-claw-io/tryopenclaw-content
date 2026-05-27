# Skill Content — Style Rules & Audit Checklist

> **Mục đích:** Đảm bảo mỗi skill trong folder này có cấu trúc nhất quán và content luôn **general** (universal), không gắn cá nhân hoá. File này là style guide canonical khi tạo skill mới và audit skill cũ. Song song với `connectors/_rules.md` — connector là 1 file `.md`, còn skill là 1 **folder** gồm `SKILL.md` + `README.md` + `_meta.json`.

---

## Cấu trúc 1 skill

Mỗi skill = 1 folder `skills/<slug>/` chứa đúng 3 file:

| File | Vai trò | Người đọc |
|------|---------|-----------|
| `SKILL.md` | Frontmatter (`name`, `description`) + `# Instructions` cho agent: required env, capabilities, guardrails. | Agent (LLM runtime). |
| `README.md` | Bilingual vi/en: `## Cách sử dụng` + `## Hướng dẫn`, `## How to use` + `## Tutorials`. | End-user trong store. |
| `_meta.json` | Metadata render store: `slug`, `name{vi,en}`, `description{vi,en}`, `category`, `icon`, `status`, `version`. | UI store. |

`<slug>` === folder name === `name` (frontmatter SKILL.md) === `slug` (_meta.json). Pattern: `^[a-z0-9_-]+$`.

---

## A. Hard rules (audit ❌ nếu vi phạm)

### A1. Quy tắc env → config tutorial (rule trung tâm)

Đọc section required env trong `SKILL.md` (`## Required environment`, `## Required setup`, hoặc `## Required runtime`). Phân loại:

- **Skill CẦN env** = có ít nhất 1 biến **bắt buộc**: API key, token, secret, account id (vd `BREVO_API_KEY`, `PAGE_ACCESS_TOKEN`, `FB_PAGE_ID`, `META_ACCESS_TOKEN`, `USER_ACCESS_TOKEN`, `CONFIRM_WRITE`).
- **Skill KHÔNG cần env** = chạy local, không API key, env chỉ **optional** (vd `csv-pipeline` chỉ cần runtime Python; `workcrm` chỉ có `WORKCRM_DB_PATH` optional; skill scrape public profile).

Quy tắc:

- **Skill CẦN env →** item ĐẦU TIÊN của `## Hướng dẫn` và `## Tutorials` **bắt buộc** là prompt guide config:
  - vi: `Hãy guide tôi config skills này cho chuẩn <slug>`
  - en: `Walk me through configuring this skill properly for <slug>`
- **Skill KHÔNG cần env →** **cấm** thêm dòng config-guide. Item đầu tiên = use-case phổ biến nhất (xem §B1).

> Lý do: skill cần env không chạy được nếu user chưa set key → prompt đầu phải dẫn user đi setup. Skill local chạy ngay → đừng bắt user setup thừa.

### A2. Không tên người
- **Cấm:** mọi first name người (Mai, An, Lan, Huy, John, Alice, Sarah, Bob...) — VN lẫn EN — trong `description`, `prompt`, `Hướng dẫn`.
- **Cấm:** xưng hô gắn cá nhân ("chị Mai", "anh An", "Mr. Smith", "@alice").
- **Thay bằng:** "khách", "khách hàng", "team", "thành viên", "the customer", "a teammate".

### A3. Không brand/công ty thật ngoài chính skill/platform
- **Cấm:** tên công ty thật của khách giả định ("Shop Hoa Mai", "Acme Corp").
- **OK:** placeholder generic ("shop X", "list 'VIP'", "the team").
- **OK:** brand platform mà skill phục vụ (Brevo, Facebook, Pancake, Meta, Aliexpress) — đúng casing chính chủ.

### A4. Không email/SĐT/ID thật
- **Cấm:** email thật, SĐT thật, ID khách thật.
- **OK:** placeholder rõ ("email khách", "SĐT khách", "#12345" minh hoạ order id), `khach@example.com`, `09xx-xxx-xxx`.

### A5. Description đúng định dạng (_meta.json + SKILL frontmatter)
- `description.vi` + `description.en` (_meta.json): 1-2 câu, ≤ 200 ký tự/lang, chủ động, lợi ích end-user trước. Cả 2 lang **bắt buộc filled**.
- Tránh jargon API trong _meta.json description ("OAuth", "webhook", "scopes") — để phần đó cho SKILL.md.
- `description` frontmatter SKILL.md: 1 câu kỹ thuật mô tả skill làm gì (đọc bởi agent, được phép nêu API/platform).

### A6. Category nằm trong enum
Chỉ dùng 1 slug có file trong `categories/`:

```
commerce | communication | content-marketing | crm-sales | customer-support |
customs | documents | engineering | finance | other | productivity |
research-analysis | sales-outreach | sourcing | storage | support
```

Slug mới phải PR riêng để add file vào `categories/` + cập nhật file này.

### A7. SKILL.md phải khai báo Required env + Guardrails
- Mỗi `SKILL.md` phải có section required env (env / setup / runtime) — kể cả khi viết "No API key required" cho skill local.
- Skill nào thao tác ghi/gửi/xoá phải có `## Guardrails` nêu rõ điều kiện confirm.

### A8. _meta.json đủ field
Bắt buộc: `slug`, `name.vi`, `name.en`, `description.vi`, `description.en`, `category`, `icon`, `status`, `version`. `slug` khớp folder name. `name` giữ đúng brand casing (vd "Brevo Email Marketing", không "brevo email marketing").

---

## B. Soft rules (audit ⚠️ nếu lệch)

### B1. Sample prompt = use-case phổ biến nhất
- Với skill CẦN env: item config-guide là #1 (bắt buộc, §A1), thì item **#2** nên là use-case phổ biến nhất.
- Với skill KHÔNG cần env: item #1 là use-case phổ biến nhất (action mà 80% user gọi đầu tiên).

### B2. Tone & xưng hô
- **VN:** xưng "mình" hoặc lược chủ ngữ. Tránh "tôi/bạn" formal. Đuôi "giúp mình", "cho mình" khuyến khích.
- **EN:** imperative ("Send...", "List...", "Report..."). Tránh "Please".

### B3. Hướng dẫn = mẫu guide, không phải workflow cứng
- Prompt là pattern user xem rồi tự thay tham số bằng ngữ cảnh thật. **Tránh hardcode topic cụ thể.**
- **Format placeholder:** `[mô tả tham số]` — square bracket bọc danh từ tiếng Việt mô tả tham số. Tránh `X`/`Y` trừu tượng.
- **Giữ:** action verb, số lượng generic (10/50/100), khung giờ, tên list/status generic ('VIP', 'pending', '#sales').
- **Bọc `[noun]`:** tên chiến dịch, tên file, tên product, tên store, mô tả lỗi.
- Ví dụ:
  - ❌ "Gửi bản tin 'Sale hè 2026' cho khách." (hardcode)
  - ✅ "Gửi bản tin tuần này cho danh sách khách hàng [tên list]."
  - ✅ "Cập nhật đơn [mã đơn] sang 'đã giao' và gửi tin cảm ơn."

### B4. Length prompt
≤ 25 từ / lang.

### B5. README ↔ SKILL ↔ _meta nhất quán
`## Cách sử dụng` (README) là bản end-user của `description` (_meta) — cùng thông điệp, README dài hơn được. Nếu SKILL.md nêu giới hạn quan trọng (free-tier cap, messaging window, rate limit) thì `## Cách sử dụng` nên nhắc lại 1 dòng.

---

## C. Audit checklist (1 skill = 1 lần check)

Trước khi merge skill mới, đi từ trên xuống:

- [ ] **C1.** Folder có đủ 3 file: `SKILL.md`, `README.md`, `_meta.json`.
- [ ] **C2.** `slug` (_meta) === folder name === `name` (SKILL frontmatter), match `^[a-z0-9_-]+$`.
- [ ] **C3.** `_meta.json` đủ field §A8; `name` đúng brand casing.
- [ ] **C4.** `description.vi` + `.en` (_meta) đều ≥ 1 câu, không rỗng, ≤ 200 ký tự, không jargon API.
- [ ] **C5.** `category` ∈ enum §A6.
- [ ] **C6.** SKILL.md có section required env + (nếu có write) Guardrails.
- [ ] **C7.** **Rule env (§A1):** xác định skill CẦN env hay KHÔNG.
  - CẦN env → `## Hướng dẫn`[0] === "Hãy guide tôi config skills này cho chuẩn `<slug>`", `## Tutorials`[0] === "Walk me through configuring this skill properly for `<slug>`".
  - KHÔNG env → KHÔNG có dòng config-guide.
- [ ] **C8.** README có đủ 4 heading: `## Cách sử dụng`, `## Hướng dẫn`, `## How to use`, `## Tutorials`.
- [ ] **C9.** Số item `## Hướng dẫn` === số item `## Tutorials` (vi/en song song).
- [ ] **C10.** Grep first name người / xưng hô cá nhân → trống (§A2).
- [ ] **C11.** Grep email/SĐT thật → trống (§A4).
- [ ] **C12.** Đọc lại: end-user (không phải dev) có hiểu skill làm gì + biết phải config gì không?

---

## D. Audit grep nhanh (chạy trước khi merge PR)

```bash
SKILLS=/Users/admin/tryopenclaw-content/skills

# D1. Skill CẦN env nhưng THIẾU dòng config-guide ở Hướng dẫn.
# Liệt kê skill có required token/key, rồi check README có dòng config không.
for d in "$SKILLS"/*/; do
  s=$(basename "$d")
  [ "$s" = "_rules-skills.md" ] && continue
  needs_env=$(grep -lE '(API_KEY|ACCESS_TOKEN|_SECRET|CONFIRM_WRITE|AD_ACCOUNT_ID)' "$d/SKILL.md" 2>/dev/null)
  has_cfg=$(grep -c "guide tôi config" "$d/README.md" 2>/dev/null)
  if [ -n "$needs_env" ] && [ "$has_cfg" = "0" ]; then
    echo "FAIL §A1: $s cần env nhưng README thiếu dòng config-guide"
  fi
done

# D2. Skill KHÔNG env nhưng LẠI có dòng config-guide thừa.
for d in "$SKILLS"/*/; do
  s=$(basename "$d")
  [ "$s" = "_rules-skills.md" ] && continue
  needs_env=$(grep -lE '(API_KEY|ACCESS_TOKEN|_SECRET|CONFIRM_WRITE|AD_ACCOUNT_ID)' "$d/SKILL.md" 2>/dev/null)
  has_cfg=$(grep -c "guide tôi config" "$d/README.md" 2>/dev/null)
  if [ -z "$needs_env" ] && [ "$has_cfg" != "0" ]; then
    echo "WARN §A1: $s không cần env nhưng có dòng config-guide thừa"
  fi
done

# D3. slug mismatch giữa folder và _meta.json
for d in "$SKILLS"/*/; do
  s=$(basename "$d")
  [ "$s" = "_rules-skills.md" ] && continue
  grep -q "\"slug\": \"$s\"" "$d/_meta.json" || echo "FAIL §A8: slug mismatch ở $s"
done

# D4. README thiếu heading bắt buộc
for d in "$SKILLS"/*/; do
  s=$(basename "$d")
  [ "$s" = "_rules-skills.md" ] && continue
  for h in "## Cách sử dụng" "## Hướng dẫn" "## How to use" "## Tutorials"; do
    grep -qF "$h" "$d/README.md" || echo "FAIL §A: $s thiếu heading '$h'"
  done
done

# D5. First name người + company giả định trong README/_meta
grep -rnE "\b(Mai|Lan|Huy|Linh|Trang|John|Alice|Sarah|Bob|Mike|Emma|David|Carol|Smith|Acme)\b" \
  "$SKILLS"/*/README.md "$SKILLS"/*/_meta.json

# D6. Email/SĐT thật
grep -rnE "([a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}|\b0[0-9]{9}\b)" \
  "$SKILLS"/*/README.md "$SKILLS"/*/_meta.json | grep -vE "(example\.com|09xx)"

# D7. Category ngoài enum
grep -h "\"category\":" "$SKILLS"/*/_meta.json \
  | grep -vE "(commerce|communication|content-marketing|crm-sales|customer-support|customs|documents|engineering|finance|other|productivity|research-analysis|sales-outreach|sourcing|storage|support)"
```

Mọi grep output `FAIL` = audit fail → sửa rồi PR. `WARN` = review thủ công.

---

## E. Khi nào được phá rule

Hard rule §A cấm tuyệt đối trong content render production — riêng §A1 không có ngoại lệ: env quyết định có dòng config hay không, không tùy hứng.

Soft rule §B được lệch nếu skill có use-case đặc biệt. Ghi note trong PR body lý do lệch.

---

**Liên quan:**

- `connectors/_rules.md` — rules song song cho connector (1 file/connector).
- `categories/` — danh sách category slug hợp lệ (mỗi slug 1 file `.md`).
- `connectors/_schema.json` — JSON Schema tham chiếu cho i18n string (vi/en).

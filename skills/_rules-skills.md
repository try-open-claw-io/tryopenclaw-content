# Skill Content — Style Rules & Audit Checklist

> **Mục đích:** Đảm bảo mỗi skill trong folder này có cấu trúc nhất quán và content luôn **general** (universal), không gắn cá nhân hoá. File này là style guide canonical khi tạo skill mới và audit skill cũ. Song song với `connectors/_rules.md` — connector là 1 file `.md`, còn skill là 1 **folder** gồm `SKILL.md` + `README.md` + `_meta.json`.

---

## Cấu trúc 1 skill

Mỗi skill = 1 folder `skills/<slug>/` chứa đúng 3 file:

| File | Vai trò | Người đọc |
|------|---------|-----------|
| `SKILL.md` | Frontmatter (`name`, `description`) + `# Instructions` cho agent: required env, capabilities, guardrails. | Agent (LLM runtime). |
| `README.md` | Bilingual vi/en: `## Cách sử dụng` + `## Hướng dẫn`, `## How to use` + `## Tutorials`. | End-user trong store. |
| `_meta.json` | Metadata render store: `slug`, `name{vi,en}`, `description{vi,en}`, `category`, `icon`, `status`, `is_preinstalled?`, `is_published?`, `version`. | UI store. |

`<slug>` === folder name === `name` (frontmatter SKILL.md) === `slug` (_meta.json). Pattern: `^[a-z0-9_-]+$`.

---

## A. Hard rules (audit ❌ nếu vi phạm)

### A1. Quy tắc env → config tutorial (rule trung tâm)

Đọc section required env trong `SKILL.md` (`## Required environment`, `## Required setup`, hoặc `## Required runtime`). Phân loại:

- **Skill CẦN env** = có ít nhất 1 biến **bắt buộc**: API key, token, secret, account id (vd `BREVO_API_KEY`, `PAGE_ACCESS_TOKEN`, `FB_PAGE_ID`, `META_ACCESS_TOKEN`, `USER_ACCESS_TOKEN`, `CONFIRM_WRITE`).
- **Skill KHÔNG cần env** = chạy local, không API key, env chỉ **optional** (vd `csv-pipeline` chỉ cần runtime Python; `workcrm` chỉ có `WORKCRM_DB_PATH` optional; skill scrape public profile).

Quy tắc (mỗi skill chỉ có **đúng 1** item — xem §B1):

- **Skill CẦN env →** item duy nhất của `## Hướng dẫn` / `## Tutorials` **bắt buộc** là prompt guide config (chưa set key thì skill chưa chạy được):
  - vi: `/<slug> hãy guide tôi config skill này cho chuẩn`
  - en: `/<slug> walk me through configuring this skill properly`
- **Skill KHÔNG cần env →** **cấm** dòng config-guide. Item duy nhất = use-case phổ quát nhất, zero-input (xem §B1, §B3).

> Lý do: skill cần env không chạy được nếu user chưa set key → prompt duy nhất phải dẫn user đi setup. Skill local chạy ngay → item duy nhất là hành động phổ quát nhất.

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

Hai field **tùy chọn** (boolean, độc lập nhau — chỉ áp dụng cho skill github, custom upload luôn = mặc định):

- **`is_preinstalled`** — `true` ⇒ skill được **cài sẵn + bật global** trên MỌI instance mới (BE seed từ S3 lúc provision). Thiếu ⇒ `false`. Đây là "skill nền tảng", khác `instance_agents.is_default` (agent chính) — đừng nhầm.
- **`is_published`** — `false` ⇒ **ẩn** skill khỏi kho duyệt (browse catalog) VÀ khỏi danh sách "đã cài" trên instance. Thiếu ⇒ `true` (mặc định hiện). Skill github ẩn vẫn cài được (đường template resolve theo slug), chỉ không trưng bày.

Cặp điển hình cho **skill hệ thống chạy ngầm**: `"is_preinstalled": true` + `"is_published": false`. Đổi 2 cờ này ở content repo + re-sync là đủ, **KHÔNG cần deploy BE**. Schema BE (`skill-parser.service.ts` → `META_SCHEMA`) đặt `additionalProperties: false` nên chỉ được dùng đúng các key liệt kê ở đây.

---

## B. Soft rules (audit ⚠️ nếu lệch)

### B1. Chỉ 1 tutorial = hành động đơn giản & phổ quát nhất
Mỗi skill chỉ giữ **đúng 1 dòng** trong `## Hướng dẫn` / `## Tutorials` — phản ánh **hành động phổ quát nhất** của skill mà **mọi end-user copy-paste là chạy được ngay, không cần điền gì**. Không liệt kê use-case phụ.
- Skill KHÔNG cần env: dòng duy nhất = use-case phổ quát nhất, zero-input (xem §B3).
- Skill CẦN env: dòng duy nhất = prompt config-guide (§A1).

### B1b. Prompt bắt đầu bằng `/<slug>`
`## Hướng dẫn` (vi) và `## Tutorials` (en) **phải bắt đầu** bằng `/<slug>` của skill — đây là cú "gọi" skill trong khung chat (song song connector dùng `@<id>`).
- Sau `/<slug>` viết thường, là 1 câu mệnh lệnh tự nhiên (vd `/daily-planner sắp xếp các việc hôm nay thành kế hoạch theo khung giờ.`).
- **Không lặp lại tên skill** trong câu vì `/<slug>` đã chỉ rõ.
- Cả vi và en đều mang prefix để giữ song song.

### B2. Tone & xưng hô
- **VN:** xưng "mình" hoặc lược chủ ngữ. Tránh "tôi/bạn" formal. Đuôi "giúp mình", "cho mình" khuyến khích.
- **EN:** imperative ("Send...", "List...", "Report..."). Tránh "Please".

### B3. Prompt = lệnh đơn giản nhất, ưu tiên zero-input
- Prompt phải **chạy được ngay khi copy-paste** cho mọi user — **không hardcode ngữ cảnh cụ thể** (số liệu, ngày "hôm nay", tên doc/board thật, scenario riêng).
- **Mặc định: zero-input.** Chọn 1 hành động tự khoanh phạm vi bằng "của mình" / "gần đây", hoặc tham chiếu tương đối "này" / "sau" cho nội dung user dán vào — không bắt user điền gì.
  - ✅ "/todo-organizer sắp xếp danh sách việc của mình theo ưu tiên."
  - ✅ "/doc-summarizer tóm tắt tài liệu này thành các ý chính."
- **Placeholder chỉ là ngoại lệ.** Chỉ khi skill bắt buộc 1 tham số mà không thể tham chiếu tương đối → dùng **đúng 1** `[noun]` (danh từ tiếng Việt, không `X`/`Y`).
- **Tránh:**
  - ❌ "Tóm tắt [tài liệu] này thành 5 ý chính." (placeholder thừa — đã có "này")
  - ❌ nhồi nhiều `[noun]` vào 1 prompt.

### B4. Length prompt
≤ 25 từ / lang.

### B5. Format `## Cách sử dụng` / `## How to use` = Cách kích hoạt + Kết quả
`## Cách sử dụng` **không** phải đoạn mô tả lại `description` (_meta), mà là **hướng dẫn dùng** gồm đúng 2 dòng có nhãn in đậm:

- **Cách kích hoạt:** dẫn bằng lệnh `/<slug>` gõ **đầu tiên** ở khung chat, rồi mới tới đầu vào. Mẫu: `Gõ /<slug> ở đầu khung chat, rồi [dán/nêu/đưa đầu vào].`
- **Kết quả:** viết theo góc người dùng. Mẫu: `Sau khi Agent làm xong, bạn sẽ có [kết quả cụ thể].`

EN song song: **How to trigger:** `Type /<slug> at the start of the chat, then [paste/share/describe …].` — **What you get:** `Once the Agent finishes, you'll have [outcome].`

Nếu SKILL.md nêu giới hạn quan trọng (free-tier cap, messaging window, rate limit) thì nhắc lại 1 dòng ở phần Kết quả.

### B6. Từ ngữ nên tránh
Copy phải tự nhiên, thuần Việt — tránh từ nghe lạ/sến/cứng/hành chính. Bảng mở, bổ sung dần khi audit:

| Tránh | Vì sao | Thay bằng |
|------|--------|-----------|
| câu hỏi còn bỏ ngỏ / bỏ ngỏ | lủng củng, lãng xẹt | điểm cần làm rõ |
| ghi chú thô | cứng | ghi chú / ghi chú họp |
| rời rạc | sách vở | (bỏ) hoặc "lẻ tẻ" |
| lộn xộn | nặng nề | (bỏ) |
| biên bản | hành chính | bản tóm tắt |

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
  - CẦN env → dòng duy nhất = prompt config-guide (`/<slug> hãy guide tôi config skill này cho chuẩn`).
  - KHÔNG env → KHÔNG có dòng config-guide; dòng duy nhất = use-case zero-input.
- [ ] **C8.** README có đủ 4 heading: `## Cách sử dụng`, `## Hướng dẫn`, `## How to use`, `## Tutorials`. `## Cách sử dụng` / `## How to use` theo đúng format 2 nhãn Cách kích hoạt + Kết quả (§B5).
- [ ] **C9.** `## Hướng dẫn` và `## Tutorials` mỗi bên **đúng 1 item**, vi/en song song; cả 2 bắt đầu bằng `/<slug>` (§B1, §B1b).
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

# D8. Mỗi skill phải có ĐÚNG 1 bullet ở Hướng dẫn và 1 ở Tutorials, đều mở đầu bằng /<slug> (§B1, §B1b).
for d in "$SKILLS"/*/; do
  s=$(basename "$d")
  [ "$s" = "_rules-skills.md" ] && continue
  vi=$(awk '/## Hướng dẫn/{f=1;next} /^## /{f=0} f&&/^- /{c++} END{print c+0}' "$d/README.md")
  en=$(awk '/## Tutorials/{f=1;next} /^## /{f=0} f&&/^- /{c++} END{print c+0}' "$d/README.md")
  [ "$vi" = "1" ] || echo "FAIL §B1: $s có $vi bullet ở Hướng dẫn (cần 1)"
  [ "$en" = "1" ] || echo "FAIL §B1: $s có $en bullet ở Tutorials (cần 1)"
  grep -qE "^- /$s " "$d/README.md" || echo "FAIL §B1b: $s thiếu prompt mở đầu bằng /$s"
done

# D9. Placeholder ngữ cảnh thừa trong README (mặc định zero-input, §B3).
grep -rn "\[" "$SKILLS"/*/README.md
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

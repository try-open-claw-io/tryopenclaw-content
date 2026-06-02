---
id: calendly
name:
  vi: "Calendly"
  en: "Calendly"
description:
  vi: "Đặt lịch tự động self-serve. Khách chọn giờ trống → tạo meeting + gửi mail xác nhận."
  en: "Self-serve scheduling. Customers pick an open slot and the meeting is auto-created with a confirmation email."
category: scheduling
popular: true
tutorials:
  - title:
      vi: "Tạo link đặt lịch"
      en: "Create booking link"
    prompt:
      vi: "@calendly tạo link đặt tư vấn 30 phút, gửi khách qua mail."
      en: "@calendly create a 30-minute consultation link and email it to the customer."
---

<!--
TEMPLATE — connector content file.
Frontmatter MUST validate against `_schema.json` (additionalProperties: false).

Field guide
-----------
id            Kebab/snake-case slug. Match Composio app id (pattern ^[a-z0-9_-]+$).
              Ví dụ: gmail, googlecalendar, larksuite-tenant, microsoftteams.

name.vi/en    Display name. Brand giữ nguyên (Gmail, Slack, Zoho). Bắt buộc cả vi + en.

description.vi/en
              1-2 câu end-user. App làm gì + ai dùng — không jargon API.
              EN dịch sát, ko marketing copy. Xem `_rules.md` §A5.

category      Slug 1 từ. Allowed enum (xem `_rules.md` §A6):
                communication  — gmail, slack, telegram, discord, microsoftteams, outlook
                scheduling     — googlecalendar, outlookcalendar, calendly, zoom
                crm            — hubspot, salesforce, pipedrive, intercom, zoho
                data           — googlesheets, airtable, notion (KB), googledocs
                storage        — googledrive, onedrive, dropbox, box
                commerce       — shopify, woocommerce
                payment        — stripe
                dev            — github, gitlab, bitbucket, linear, jira
                productivity   — trello, asana, clickup, monday, larksuite, larksuite-tenant
                support        — zendesk, freshdesk
                marketing      — mailchimp, sendgrid, twilio, typeform, linkedin, twitter, whatsapp
                docs           — confluence

popular       true nếu connector thuộc nhóm phổ biến cài đặt cao (Top tier).
              false hoặc bỏ qua nếu là long-tail / nice-to-have.

tutorials     Đúng 1 row — use-case phổ biến nhất của connector.
              - title.vi/en   2-4 từ, mệnh lệnh (vd: "Search emails" / "Tìm mail").
              - prompt.vi/en  1 câu user gõ tự nhiên, BẮT ĐẦU bằng @<id> (vd "@gmail mở 5 mail...").
                              @mention chính là cú "gọi" connector → không lặp lại tên brand
                              trong câu. Use-case phổ biến nhất (xem `_rules.md` §B1).

Body (sau dấu `---`)
--------------------
Hiện chưa render. Để dành rich docs sau (setup guide, scope OAuth, rate-limit, gotcha).

Quy trình thêm connector mới
----------------------------
1. Copy file này → `<slug>.md` trong cùng folder.
2. Sửa toàn bộ field theo connector thật.
3. Validate: `npx ajv validate -s _schema.json -d <slug>.md` (sau khi extract YAML).
4. Slug khớp Composio app id + filename + frontmatter `id` (xem `_rules.md` §A7).
5. Audit pass `_rules.md` §A hard rules trước khi merge.
-->

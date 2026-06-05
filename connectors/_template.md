---
id: calendly
name:
  vi: "Calendly"
  en: "Calendly"
description:
  vi: "Calendly là công cụ đặt lịch tự động self-serve. Với kết nối này, Agent có thể xem lịch hẹn, tạo link đặt lịch và gửi mail xác nhận giúp bạn."
  en: "Calendly is a self-serve scheduling tool. With this connection, the Agent can check bookings, create scheduling links, and send confirmation emails for you."
category: scheduling
popular: true
howToUse:
  vi:
    - "**Kích hoạt kết nối:** viết rõ cụm \"dùng tryopenclaw connector @calendly\" trong câu chat để Agent biết và mở đúng công cụ đặt lịch của bạn. Ví dụ: \"dùng tryopenclaw connector @calendly để xem các lịch hẹn sắp tới giúp tôi\"."
  en:
    - "**Activate the connection:** write the exact phrase \"use the tryopenclaw connector @calendly\" in your chat so the Agent knows to open your scheduling tool. Example: \"use the tryopenclaw connector @calendly to check my upcoming bookings\"."
tutorials:
  - title:
      vi: "Xem lịch hẹn"
      en: "Check bookings"
    prompt:
      vi: "@calendly xem các lịch hẹn sắp tới của mình."
      en: "@calendly show my upcoming bookings."
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

description flow (xem `_rules.md` §A5)
              Câu 1: "{Brand} là {dịch vụ gì}."
              Câu 2: "Với kết nối này, Agent có thể {3-4 động từ} {đối tượng}." (KHÔNG đuôi "v.v.")

howToUse      Array ĐÚNG 1 phần tử / lang, mở đầu nhãn **Kích hoạt kết nối:** (xem `_rules.md` §B6).
              - Phải chứa cụm trigger chuẩn: "dùng tryopenclaw connector @<id>" (không dùng "dùng kết nối @<id>").
              - Kèm 1 "Ví dụ:" — câu bắt đầu bằng "dùng tryopenclaw connector @<id>", đuôi "giúp tôi".
              - Xưng "bạn" + "Agent" (viết hoa) — copy hướng dẫn end-user, khác tone prompt.

tutorials     Đúng 1 row — hành động đơn giản & phổ quát nhất (thường là đọc/kiểm tra/liệt kê).
              - title.vi/en   2-4 từ, mệnh lệnh (vd: "Check email" / "Kiểm tra mail").
              - prompt.vi/en  1 câu user gõ tự nhiên, BẮT ĐẦU bằng @<id>.
                              @mention chính là cú "gọi" connector → không lặp lại tên brand trong câu.
                              ƯU TIÊN zero-input: copy-paste chạy ngay, tự khoanh phạm vi bằng
                              "của mình"/"gần đây"/"giao cho mình" (vd "@gmail kiểm tra mail chưa đọc của mình.").
                              Chỉ dùng đúng 1 [noun] khi connector thuần gửi/tạo (xem `_rules.md` §B1, §B4).

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

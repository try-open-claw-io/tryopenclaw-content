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
    - "Kích hoạt kết nối: viết rõ cụm \"dùng tryopenclaw connectors @calendly\" trong câu chat để Agent biết và mở đúng công cụ đặt lịch của bạn.\nVí dụ: \"dùng tryopenclaw connectors @calendly để xem các lịch hẹn sắp tới giúp tôi\"."
  en:
    - "Activate the connection: write the exact phrase \"use the tryopenclaw connectors @calendly\" in your chat so the Agent knows to open your scheduling tool.\nExample: \"use the tryopenclaw connectors @calendly to check my upcoming bookings\"."
tutorials:
  - title:
      vi: "Xem lịch hẹn"
      en: "Check bookings"
    prompt:
      vi: "Dùng tryopenclaw connectors @calendly xem các lịch hẹn sắp tới của mình."
      en: "Use the tryopenclaw connectors @calendly to show my upcoming bookings."
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

howToUse      Array ĐÚNG 1 phần tử / lang, mở đầu nhãn Kích hoạt kết nối: (xem `_rules.md` §B6).
              - KHÔNG markdown: không "**bold**", không tag <br> (field render plain text).
              - Phải chứa cụm trigger chuẩn: "dùng tryopenclaw connectors @<id>" (số nhiều "connectors").
              - Kèm 1 "Ví dụ:" đứng sau newline thật "\n" — câu bắt đầu "dùng tryopenclaw connectors @<id>", đuôi "giúp tôi".
              - Xưng "bạn" + "Agent" (viết hoa) — copy hướng dẫn end-user, khác tone prompt.

tutorials     Đúng 1 row — hành động đơn giản & phổ quát nhất (thường là đọc/kiểm tra/liệt kê).
              - title.vi/en   2-4 từ, mệnh lệnh (vd: "Check email" / "Kiểm tra mail").
              - prompt.vi      BẮT ĐẦU "Dùng tryopenclaw connectors @<id> {hành động}." (viết hoa, số nhiều "connectors").
              - prompt.en      BẮT ĐẦU "Use the tryopenclaw connectors @<id> to {action}." (viết hoa).
                              Không lặp lại tên brand trong câu (@mention đã rõ connector).
                              ƯU TIÊN zero-input: copy-paste chạy ngay, tự khoanh phạm vi bằng
                              "của mình"/"gần đây"/"giao cho mình"
                              (vd "Dùng tryopenclaw connectors @gmail kiểm tra mail chưa đọc của mình.").
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

# ClawExpert — sitemap (link đúng cho các trang thiết lập)

> Dùng khi người dùng hỏi "vào đâu / link đâu". CHỈ dùng path trong file này —
> TUYỆT ĐỐI KHÔNG bịa URL, KHÔNG tự nghĩ domain (`tryopenclaw.io`, `clawexpert.com`…).
> Nguồn route: `fe/src/constants/route.ts` (Platform-FE) — re-sync khi route đổi.

## Cách gửi link (quan trọng)

- Gửi **link TƯƠNG ĐỐI**, bắt đầu bằng `/`, **KHÔNG kèm domain** — vd `/vi/connectors`.
  Trình duyệt tự mở đúng domain khách đang dùng (nền tảng chạy trên nhiều domain; link tương đối
  luôn khớp domain hiện tại, agent không cần biết là domain nào).
- `{locale}` = ngôn ngữ khách đang chat: `vi` hoặc `en` (mặc định `vi`).
- **Trên channel** (Telegram/Zalo/Discord…): không có domain trình duyệt → **đừng gửi link**, chỉ chỉ
  đường trong app (mô tả menu).

## Các trang (khớp 8 tính năng toc-guide)

Connectors / Skills / AI Models nằm trong **Cài đặt** → dùng path `/{locale}/settings/<tab>` (tab id **số ít**).
Channels / Scheduled Tasks / Marketplace là trang riêng.

**Agent của người dùng KHÔNG có trang riêng** — chúng nằm ngay ở **sidebar**, mục **AGENT**. Hỏi "Agent của tôi
đâu / quản lý agent ở đâu" → **chỉ sidebar, đừng đưa link**.

| Người dùng cần | Link (tương đối) |
|---|---|
| Kết nối app ngoài (Gmail/Slack/Notion…) | `/{locale}/settings/connector` |
| Cài / quản lý Skills | `/{locale}/settings/skill` |
| Chọn / đổi model AI | `/{locale}/settings/aimodel` |
| Kết nối extension trình duyệt | `/{locale}/settings/extension` |
| AI Credits (nạp/xem credit) | `/{locale}/settings/credits` |
| Kênh chat (Telegram/Zalo/Discord…) | `/{locale}/channels` |
| Lịch tự chạy (Scheduled Tasks) | `/{locale}/scheduled-tasks` |
| Marketplace — duyệt / cài Agent App, Agent Chat *(sidebar: **Agent Marketplace**)* | `/{locale}/marketplace` |
| Cài đặt chung | `/{locale}/settings` |

> Tab id số ít: `connector`, `skill`, `aimodel`, `extension`, `channel`, `credits`, `account`, `backup`.
> ⚠ Đừng dùng số nhiều `/connectors` hay bỏ `settings/` — `/vi/connector` là **404**. Đường đúng là
> `/{locale}/settings/connector`.

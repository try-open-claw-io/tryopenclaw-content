<!-- vi -->

## Cách sử dụng

Đây là **skill mẫu** đóng gói sẵn trong một agent template. Nó **chỉ dành cho agent** — được cài cho agent nào khai báo slug `skill-agent-template` trong `agent.json`, và **không hiện** trong kho skill công khai (`/settings/skill`) vì `_meta.json` đặt `is_published: false`.

**Cách kích hoạt:** Agent tự dùng theo `description` trong SKILL.md — người dùng cuối không thấy skill này trong danh sách skill.

## Hướng dẫn

- Thay phần thân SKILL.md bằng khả năng thật mà agent cần.
- Giữ `is_published: false` để skill luôn ẩn; đổi `is_preinstalled` thành `true` nếu muốn cài mặc định cho MỌI instance thay vì chỉ khi template gọi.

<!-- en -->

## How to use

This is a **sample skill** bundled inside an agent template. It is **agent-only** — installed for any agent that lists the slug `skill-agent-template` in its `agent.json`, and **hidden** from the public skill catalog (`/settings/skill`) because `_meta.json` sets `is_published: false`.

**How to trigger:** The agent uses it based on the SKILL.md `description` — end users never see it in the skill list.

## Tutorials

- Replace the SKILL.md body with the real capability your agent needs.
- Keep `is_published: false` to stay hidden; set `is_preinstalled: true` only if you want it auto-installed on EVERY instance instead of just when a template requests it.

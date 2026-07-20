# sample-chat-agent

Template mẫu **đầy đủ** cho một *agent chat* của platform. Một "agent chat" ở đây
**chính là một Agent của OpenClaw** — bạn đang build agent để chạy bên trong một
OpenClaw instance (container). Template này minh hoạ đủ giải phẫu của một agent:
identity + tone + model + **một plugin thật** (`chat-tools`), và đi kèm một đường
build/cài từ local lên container staging qua SSH.

> Đây là **blueprint tĩnh** (chưa phải agent đang chạy). Bộ `compile.ts` biến nó
> thành một bundle kiểu use-case rồi `install-ssh.ts` cài lên OpenClaw instance —
> xem `scripts/agent-templates/scripts/`.

## Giải phẫu thư mục

```
sample-chat-agent/
├── agent.json                 # manifest: identity, core_files, tones, models, plugins[], openclawOverrides
├── core_files/                # "linh hồn" agent — nạp vào workspace của agent
│   ├── AGENTS.md              #   hướng dẫn hành vi + cách dùng tool
│   ├── SOUL.md                #   tính cách (tone đang chọn được NỐI vào đây khi compile)
│   └── USER.md                #   context người dùng (điền lúc runtime)
├── tones/
│   └── friendly.md            # tone đang chọn (agent.json → tones.selected)
└── plugins/
    └── chat-tools/            # plugin OpenClaw (chạy TRONG instance)
        ├── openclaw.plugin.json   # manifest plugin — id PHẢI khớp agent.json → plugins[].id
        ├── package.json
        └── index.ts               # definePluginEntry: 1 agent tool (chat_ping) + 1 HTTP route (/ping)
```

Chi tiết field trong `agent.json` (plugins, openclawOverrides…): xem
`be/CLAUDE.md` mục "Domain Vocabulary" + `be/docs/superpowers/specs/2026-07-14-agent-chat-template-plugins-ssh-install-design.md`.

## Build & cài

Chạy từ `be/`:

```bash
# Xem trước (không chạm remote) — in ra đúng các lệnh sẽ chạy
bun run scripts/agent-templates/scripts/install-ssh.ts sample-chat-agent \
  --ssh=<user@host> --subdomain=<sub> --dry-run

# Cài thật lên container staging (build plugin → tar → docker exec install.sh → docker restart)
bun run scripts/agent-templates/scripts/install-ssh.ts sample-chat-agent \
  --ssh=<user@host> --subdomain=<sub> -v

# Chỉ build/soi bundle, không đẩy đi
bun run scripts/agent-templates/scripts/compile.ts sample-chat-agent   # → .build/workspace-sample-chat-agent/
```

- Container `= <sub>-openclaw` (quy ước platform); hoặc chỉ định thẳng `--container=<name>`.
- `--no-restart`: fast path khi CHỈ sửa core_files (đổi plugin/config thì **phải** restart để nạp lại).
- Verify: `ssh <host> "docker exec <sub>-openclaw openclaw agents list"` (và `plugins list`); trong chat bảo agent gọi `chat_ping` → `chat-tools ok (v0.1.0)`.

## Tạo agent mới từ mẫu này

```bash
cp -r scripts/agent-templates/sample-chat-agent scripts/agent-templates/my-agent
```
Rồi sửa `agent.json` (`agentId`, `name`, `plugins[]`), `core_files/*.md`, `tones/*.md`,
và code plugin trong `plugins/<id>/index.ts`. ⚠️ `openclaw.plugin.json.id` phải **khớp**
`agent.json → plugins[].id` (nếu lệch, `resolvePlugins` sẽ báo lỗi lúc compile).

---

## 📚 Tài liệu OpenClaw — ĐỌC TRƯỚC khi build/sửa agent hoặc plugin

Bạn đang build agent + plugin cho **OpenClaw**. Tài liệu chính thức nằm ngay trong
workspace này ở **`openclaw/docs/`** (cạnh `be/`), và source của plugin SDK ở
**`openclaw/src/plugin-sdk/`** + **`openclaw/packages/plugin-sdk/`**.

> **Cho Claude Code / agent coding:** khi làm việc với template này — đặc biệt khi
> viết/sửa plugin (`registerTool`, `registerHttpRoute`, `definePluginEntry`), chỉnh
> `openclaw.json`/overlay, hay đăng ký agent — **hãy đọc doc OpenClaw tương ứng
> bên dưới trước**, đừng đoán API/field. OpenClaw đổi contract giữa các version, và
> gateway **từ chối cả patch** nếu gặp key config lạ, nên phải bám doc + version thực tế.

Các doc liên quan nhất (đường dẫn tính từ workspace root):

**Khái niệm agent**
- `openclaw/docs/concepts/agent.md` — agent là gì
- `openclaw/docs/concepts/agent-workspace.md` — workspace dir + core files (AGENTS/SOUL/USER…)
- `openclaw/docs/concepts/agent-loop.md`, `openclaw/docs/concepts/multi-agent.md`
- `openclaw/docs/agent-runtime-architecture.md`

**Plugin (quan trọng nhất cho `plugins/chat-tools/`)**
- `openclaw/docs/plugins/building-plugins.md` — cách viết plugin
- `openclaw/docs/plugins/agent-tools.md` — đăng ký agent tool (`registerTool`)
- `openclaw/docs/plugins/adding-capabilities.md`, `openclaw/docs/plugins/building-extensions.md`
- `openclaw/docs/plugins/architecture.md`, `openclaw/docs/plugins/bundles.md`, `openclaw/docs/plugins/compatibility.md`
- `openclaw/docs/tools/plugin.md`
- Source SDK (API thật): `openclaw/src/plugin-sdk/` (vd `definePluginEntry`, `OpenClawPluginApi`, kiểu của `registerTool`/`registerHttpRoute`)

**Cấu hình `openclaw.json` (agent-level + plugin enable + overlay)**
- `openclaw/docs/gateway/configuration-reference.md` — reference đầy đủ
- `openclaw/docs/gateway/config-agents.md`, `openclaw/docs/gateway/config-tools.md`
- `openclaw/docs/gateway/configuration.md`, `openclaw/docs/gateway/configuration-examples.md`

**CLI (những lệnh mà install.sh gọi bên trong container)**
- `openclaw/docs/cli/agents.md` — `openclaw agents add / list / set-identity`
- `openclaw/docs/cli/plugins.md` — `openclaw plugins install / list`
- `openclaw/docs/cli/config.md`

Doc gốc của OpenClaw: `openclaw/AGENTS.md` + `openclaw/README.md`.

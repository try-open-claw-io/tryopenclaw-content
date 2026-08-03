# agent.json — full sample + per-field reference

Parser principle (BE): only `agentId` **+** `name` are **hard-required**
(missing either = the whole template is rejected at sync). Every other field is
lenient — missing → default, wrong shape → dropped/defaulted + warn log, never
a failure. Unknown top-level fields are ignored; unknown keys INSIDE a
`suggested_prompts` chip are kept verbatim.

## Full sample (copy as a skeleton)

```jsonc
{
  // ═══ IDENTITY ═══════════════════════════════════════════════════════════
  "agentId": "my-agent", // REQUIRED — must match the folder name, slug [a-z0-9-]
  "name": "My Agent", // REQUIRED — display name
  "version": "1.0.0", // semver — BUMP on every content change
  "description": "A content assistant for your shop.",
  "icon_path": "images/icon.svg",

  // ═══ VISIBILITY FLAGS ═══════════════════════════════════════════════════
  "is_suggested": true, // listed in the Create Agent modal
  "show_marketplace": false, // listed on the Agent Marketplace (opt-in)
  "priority": 1, // sort key in listings

  // ═══ DEFAULT CAPABILITIES ═══════════════════════════════════════════════
  "core_files": ["AGENTS.md", "SOUL.md", "USER.md"],
  "tones": {
    "selected": "friendly",
    "list": [
      "friendly",
      "professional",
      "casual",
      "concise",
      "creative",
      "expert",
    ],
  },
  "models": {
    "selected": "toc/auto",
    "list": [
      "toc/auto",
      "claude-opus-4-7",
      "claude-sonnet-4-6",
      "claude-haiku-4-5",
    ],
  },
  "skills": [
    {
      "id": "pdp-analyzer",
      "enabled": true,
      "description_vi": "Phân tích trang sản phẩm từ link.",
      "description_en": "Analyze a product page from a link.",
    },
  ],
  "tools": [], // feature-flag labels (gmail, notion…)
  "connectors": ["googledocs", "googledrive"], // app_id from connector_metadata
  "cronJobs": [
    {
      "name": "morning-brief",
      "description": "Morning task roundup",
      "schedule": {
        "kind": "cron",
        "expr": "0 8 * * *",
        "tz": "Asia/Ho_Chi_Minh",
      },
      "payload": {
        "kind": "agentTurn",
        "message": "Round up today's tasks for me.",
      },
      "enabled": true,
    },
  ],

  // ═══ SUGGESTED PROMPTS — chips on the chat empty state ══════════════════
  "suggested_prompts": [
    // Style 1 — minimal: message only (the chip shows this exact sentence and
    // sends it on click; a bare string is treated as Vietnamese)
    { "message": "Tóm tắt phiên làm việc gần đây của tôi" },
    // Style 2 — full: message is the long starter prompt, label is the short
    // text shown on the chip. A fill-in prompt ("…: ") pairs with
    // send_behavior "paste" so the user completes it before sending.
    {
      "label": {
        "vi": "Viết mô tả bán hàng từ link sản phẩm",
        "en": "Write a product description from a link",
      },
      "message": {
        "vi": "Viết mô tả bán hàng cho sản phẩm từ link này: ",
        "en": "Write a sales-ready description for the product at this link: ",
      },
      "requires": { "skills": ["pdp-analyzer"] },
      "send_behavior": "paste", // optional — "send" (default) fires on click;
      // "paste" drops the message into the composer instead
      "order": 1,
      "enabled": true,
      "id": "mo-ta-tu-link", // optional — auto-derived from label/message when omitted
    },
  ],

  // ═══ MARKETPLACE COPY (detail page) ═════════════════════════════════════
  "marketplace": {
    "category": "Marketing",
    "locales": {
      "vi": {
        "displayName": "Content Agent — đội content riêng của shop",
        "description": "Đoạn giới thiệu dài trên trang detail…",
        "tagline": "Một câu chốt ngắn",
        "maker": {
          "name": "ClawExperts",
          "field": "Content marketing",
          "color": "#fd5e64",
          "quote": "…",
          "creds": ["10 năm kinh nghiệm"],
          "socials": [{ "type": "linkedin", "url": "https://…" }],
        },
        "features": [["sparkles", "Tự nghiên cứu sản phẩm trước khi viết"]],
        "best_for": [["store", "Chủ shop e-commerce"]],
        "what_you_get": [["doc", "Mô tả sản phẩm chuẩn SEO"]],
        "examples": ["Viết mô tả bán hàng cho sản phẩm từ link này…"],
        "reviews": [
          { "stars": 5, "text": "…", "by": "Chị Lan — chủ shop mỹ phẩm" },
        ],
      },
      "en": {
        /* author the full mirror of vi */
      },
    },
  },
  "assets": {
    // declared at the TOP LEVEL (not inside marketplace)
    "avatar": "images/avatar.png",
    "heroBg": "images/hero.png",
    "thumb": "images/thumb.png",
    "screenshots": ["images/s1.png", "images/s2.png"],
  },
}
```

## Per-field reference

### Identity

| Field         | Required | Default        | Where it shows up / what it does                                                                                    |
| ------------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `agentId`     | ✅       | —              | Never shown in the UI — the identifier in URLs/API/S3. **Must match the folder name**; mismatch = sync rejects        |
| `name`        | ✅       | —              | Create Agent modal, marketplace card (when `marketplace.displayName` is absent), proposed agent name at install       |
| `version`     | —        | `"0.0.0"`      | Version badge in Agent Settings; the key of the Publish/Upgrade mechanism — **bump on every content change**          |
| `description` | —        | null           | Short blurb in the wizard/card. The detail page prefers `marketplace.description`                                     |
| `icon_path`   | —        | null (no icon) | Agent icon in the wizard, card, and sidebar after install (fallback when the user doesn't upload a custom icon)       |

### Visibility flags

| Field              | Required | Default   | Where it shows up / what it does                                                                                |
| ------------------ | -------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `is_suggested`     | —        | **true**  | Gates the template into the **Create Agent modal**                                                                |
| `show_marketplace` | —        | **false** | Gates the template onto the **Agent Marketplace**. Independent flags; both false = not installable from any UI    |
| `priority`         | —        | 1         | Sort order in listings                                                                                             |

### Default capabilities

| Field        | Required | Default      | Where it shows up / what it does                                                                                                                                                                                                       |
| ------------ | -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core_files` | —        | `[]`         | Not shown directly — copied into the agent's workspace at install (AGENTS/SOUL/USER…). Users can edit them afterwards → the template **never overwrites them again**                                                                     |
| `tones`      | —        | `{null, []}` | Tone step of the wizard + tone switch in Agent Settings. Standard tones: friendly/professional/casual/concise/creative/expert; custom tone → add a `.md` under `tones/`                                                                  |
| `models`     | —        | `{null, []}` | Default model + whitelist in the composer's model picker                                                                                                                                                                                  |
| `skills`     | —        | `[]`         | Skills step of the wizard (checkbox, `enabled: true` = pre-ticked — users may untick), Skills & tools section on the detail page, Agent Settings. `id` = a real `tryoc_skills` slug (bad slug → skipped at install + warn log, no block) |
| `tools`      | —        | `[]`         | Labels on the detail page/settings — display-only feature flags for now                                                                                                                                                                   |
| `connectors` | —        | `[]`         | Connector step of the wizard (suggestions) + Connectors card in Agent Settings. `app_id` must exist in `connector_metadata`; actual connecting is workspace-level OAuth                                                                   |
| `cronJobs`   | —        | `[]`         | Background schedules (registered on the gateway at install), managed in the Schedule area. `payload.kind: "agentTurn"` = trigger one agent turn with the given message                                                                    |

### suggested_prompts (per-key detail of one chip)

Shown on the **chat empty state** of an installed agent (max 6 chips). Click
behavior follows `send_behavior`: **`"send"`** (default) sends `message`
immediately + force-invokes `requires.skills` (when the skill exists on the
agent); **`"paste"`** drops `message` into the composer for the user to finish
typing, with `requires.skills` pre-selected as pills the user can still untick.

| Key               | Required        | Default         | What it does                                                                                                                                                                                                                                                     |
| ----------------- | --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `message`         | ✅ **REQUIRED** | —               | The text **SENT** on click, and the chip text when there is no label. Bare string = treated as `vi`; or `{vi, en}`. No message → the chip is **DROPPED** (a label cannot substitute)                                                                                |
| `label`           | —               | (message shown) | **Short text drawn on the chip** when you want it tighter than the message. Missing → the chip shows the message itself                                                                                                                                             |
| `id`              | —               | auto slugify    | Derived from `label ?? message` (vi first) + auto de-duplicated with `-2/-3`. Declare explicitly when you need a stable id                                                                                                                                          |
| `enabled`         | —               | true            | `false` = kept in data but fully hidden (not rendered, its skills not installed)                                                                                                                                                                                    |
| `order`           | —               | array order     | Ascending sort in the UI                                                                                                                                                                                                                                            |
| `requires.skills` | —               | —               | `tryoc_skills` slugs. (1) At install: the skill is installed + enabled with the chip (unless the user unticked it in the wizard). (2) On click: FE prefixes `/slug` (send) or pre-selects the skill pills (paste) when the skill exists on the agent — missing skills are silently skipped. Accepts shorthand `["slug"]` and `[{"id": "slug"}]` |
| `send_behavior`   | —               | `"send"`        | `"send"` = clicking the chip sends the message right away. `"paste"` = the message lands in the composer instead — for fill-in prompts ending "…: " the user completes before sending. Any other value is stripped at sync                                                                          |

**Removed (stripped even if authored):** `icon`, `placement` (2026-07-30) ·
`requires.tools`, `requires.connectors` (2026-07-31) · `starters` (legacy
top-level field — the parser never reads it).

### Marketplace copy + images

| Field                                              | Required | Default         | Where it shows up                                                                                       |
| -------------------------------------------------- | -------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| `marketplace.category`                             | —        | —               | Group/filter on the marketplace                                                                           |
| `locales.*.displayName`                            | —        | falls back to `name` | Card title + detail page                                                                             |
| `locales.*.description`                            | —        | —               | Long intro on the detail page                                                                             |
| `locales.*.tagline`                                | —        | —               | Short punchline under the title                                                                           |
| `locales.*.maker`                                  | —        | —               | "Built by an expert" card (name, field, quote, creds, socials; `avatar` comes from `assets`)              |
| `locales.*.features` / `best_for` / `what_you_get` | —        | —               | Bullet sections on the detail page — `[icon-token, text]` tuples                                          |
| `locales.*.examples`                               | —        | —               | **Static text** on the detail page (marketing) — NOT the interactive `suggested_prompts` chips in chat    |
| `locales.*.reviews`                                | —        | —               | Reviews section on the detail page                                                                        |
| `assets.avatar`                                    | —        | —               | Maker photo, resized to a 76×76 square                                                                    |
| `assets.heroBg`                                    | —        | —               | Detail-page hero banner, kept at native size                                                              |
| `assets.thumb`                                     | —        | —               | Catalog card thumbnail (~400px)                                                                           |
| `assets.screenshots`                               | —        | —               | Detail-page gallery, max 5 images                                                                         |

> Locale rendering falls back **per field**: viewer's locale → `vi` → any.
> Ship both `vi` + `en`. Images are re-encoded to webp by the seed and pushed
> to the CDN; `marketplace.assets` (the old location) remains as fallback only —
> declare `assets` at the top level.

# tryopenclaw-content

Content CMS for the **tryopenclaw** platform. Edited by team; consumed by BE every 10 minutes.

## How updates flow

```
Editor → commit/PR on this repo → CI validates frontmatter → merge to main
                                                                  ↓
                                  BE scheduler polls every 10 min via GitHub PAT
                                                                  ↓
                                  Parse + validate against ai-providers/_schema.json
                                                                  ↓
                                  Upsert into ai_provider_metadata_cache (DB)
                                                                  ↓
                          FE merges over compiled defaults → user sees new content
```

Worst-case visible latency: commit → user ≈ 10 min (poll) + 5 min (FE TanStack staleTime) ≈ **15 min**.

Admins can force-sync via `POST /api/ai-providers/metadata/sync` (auth required) to bypass the wait.

## Edit a provider

1. Open the file you want: `ai-providers/<provider-id>.md`
2. Edit the YAML frontmatter (between `---` markers). Body is markdown — currently unused (reserved for Phase 2 rich docs).
3. Open a Pull Request. CI runs `ajv` validation against `ai-providers/_schema.json` — bad shape = red ✗ = blocked from merge.
4. Merge to `main`. BE picks it up within 10 minutes.

## Required fields per provider

| Field | Type | Example |
|---|---|---|
| `id` | string (kebab-case) | `anthropic` — **must equal filename** |
| `name.vi` / `name.en` | string | `"Anthropic"` |
| `description.vi` / `description.en` | string | one-line positioning |
| `instructions.vi[]` / `instructions.en[]` | string array (≥1 step) | setup steps for getting an API key |
| `keyUrl` | URI | link to provider's console / API key page |

## Optional fields

| Field | Type | Example |
|---|---|---|
| `videoUrl` | URI | YouTube/Loom embed URL — `https://www.youtube.com/embed/<id>` |

## Adding a new provider

A provider needs entries in **two places** because some fields are code-tied (icon, env key, validation regex):

1. **Code repo** (`tryopenclaw/fe`):
   - Add a new entry in `fe/src/components/config-builder/constants.tsx`'s `PROVIDERS` array (id, label, category, envKey, keyPlaceholder, icon, iconClasses)
   - Add KEY_PATTERNS entry
2. **This repo** (content):
   - Create `ai-providers/<id>.md` with frontmatter matching the schema

Both PRs need to merge for the provider to appear in the UI.

## Schema

See [`ai-providers/_schema.json`](ai-providers/_schema.json). Validated in CI on every PR + push to main.

## Editor tooling

For local validation before committing:

```bash
npm install -g ajv-cli ajv-formats gray-matter-cli
# Then for each file:
node -e "
  const m = require('gray-matter');
  const fs = require('fs');
  fs.writeFileSync('/tmp/fm.json', JSON.stringify(m.read('ai-providers/anthropic.md').data));
" && ajv validate --strict=false -s ai-providers/_schema.json -d /tmp/fm.json -c ajv-formats
```

Same logic runs in CI (`.github/workflows/validate.yml`).

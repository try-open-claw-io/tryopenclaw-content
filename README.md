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

## Tooling (`make`)

One entrypoint for every check + generator. Run `make` (or `make help`) to list targets:

| Target | What it does |
|---|---|
| `make install` | Install tooling deps (`gray-matter`, `ajv`) — run once |
| `make build-llms` (alias `make llms`) | Regenerate root + per-dir + per-skill `llms.txt` + `llms-full.txt` |
| `make check-llms` | Drift-guard: fail if any `llms.txt` is stale vs source |
| `make validate` | Validate frontmatter (ai-providers + connectors + categories) against each `_schema.json` |
| `make check` | Run everything CI runs (`check-llms` + `validate`) |

Underneath these are the `npm run` scripts + [`scripts/`](scripts/) — `make` is just the shortcut.

## llms.txt (machine-readable index)

Every content dir ships its own `llms.txt` (per-directory index: one line per file), the root [`llms.txt`](llms.txt) links them, and [`llms-full.txt`](llms-full.txt) is a single-file dump — following the [skills.tryopenclaw.io](https://github.com/try-open-claw-io/skills.tryopenclaw.io) convention so any AI agent can discover the catalog.

**Generated — do not hand-edit.** After adding/editing a provider/connector/category/skill, run `make build-llms` and commit the regenerated indexes. CI (`.github/workflows/llms.yml`) runs `make check-llms` and fails the PR if you forgot.

## Schema

Each content dir carries a `_schema.json` (JSON Schema draft 2020-12): [`ai-providers/_schema.json`](ai-providers/_schema.json), [`connectors/_schema.json`](connectors/_schema.json), [`categories/_schema.json`](categories/_schema.json). Run `make validate` locally before committing; CI (`.github/workflows/validate.yml`) runs the same check on every PR + push to main.

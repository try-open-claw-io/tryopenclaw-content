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

## llms.txt (machine-readable index)

Every content dir ships its own `llms.txt` (per-directory index: one line per file), the root [`llms.txt`](llms.txt) links them, and [`llms-full.txt`](llms-full.txt) is a single-file dump — following the [skills.tryopenclaw.io](https://github.com/try-open-claw-io/skills.tryopenclaw.io) convention so any AI agent can discover the catalog.

**Generated — do not hand-edit.** Built from the source frontmatter:

```bash
make install   # once, pulls gray-matter
make llms      # regenerate root + per-dir + per-skill llms.txt + llms-full.txt
```

After adding/editing a provider/connector/category/skill, run `make llms` and commit the regenerated indexes. CI (`.github/workflows/llms.yml`) drift-guards this and fails the PR if you forgot.

## Schema

See [`ai-providers/_schema.json`](ai-providers/_schema.json). Validated in CI on every PR + push to `main` or `staging`.

## GitHub Pages: production + staging

GitHub Pages serves one site per repo, so one site carries both environments:

| Branch | Published at |
|---|---|
| `main` | `https://try-open-claw-io.github.io/tryopenclaw-content/` |
| `staging` | `https://try-open-claw-io.github.io/tryopenclaw-content/staging/` |

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs on every push to either branch. It always checks out **both** branches, assembles their committed files with [`scripts/build-pages.mjs`](scripts/build-pages.mjs) (from the branch that triggered the run), and deploys the complete site. Each deploy replaces the whole site, so runs are serialized and never publish one branch alone. It does not regenerate or lint content — `llms.yml` does that per branch, so commit regenerated indexes as usual. The site has rendered HTML plus the raw `.md`/`.txt` files agents fetch.

Content keeps canonical `raw.githubusercontent.com/.../main/` URLs. The published copy rewrites them to the environment it is served from — never hand-edit staging URLs into a branch. Test the assembler with `npm run test:pages`.

One-time setup (repo admin):

1. Merge the workflow and `scripts/build-pages.mjs` into the branch you deploy from (`staging` first works; `main` needs them before its own pushes deploy).
2. **Settings → Pages → Source: GitHub Actions.**
3. **Settings → Environments → `github-pages`**: allow deployments from `main` and `staging`.
4. Run the workflow once (Actions → *Publish GitHub Pages* → Run workflow).

BE side: the staging BE sets `CONTENT_REPO_BRANCH=staging`; installed TOC Guidelines then point at the `/staging/` site (override with `CONTENT_PUBLIC_BASE_URL`, see `be/.env.example`). Sync the catalog, then apply config to instances so they pick up the new links. If staging and production BE share one storage bucket, synced skill archives (`skills/<slug>_<version>.zip`) collide — keep them in separate buckets.

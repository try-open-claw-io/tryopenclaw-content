# tryopenclaw-content

CONTENT repo (git-as-CMS) for ClawExperts. The BE syncs each folder into the DB
catalog by **tree SHA per folder** —

changing any file inside a folder gets that folder re-synced; production reads
the `main` branch (BE env `CONTENT_REPO_AGENT_TEMPLATES_BRANCH` /
`CONTENT_REPO_BRANCH`).

## Folder map — read the rules BEFORE editing

| Folder             | What it is                                                       | Rules/schema                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent-templates/` | Agent chat blueprints (agent.json + core_files + tones + images) | [README.md](./agent-templates/README.md) + [AGENT-JSON.md](./agent-templates/AGENT-JSON.md) (per field: required/optional, where it shows up) |
| `skills/`          | Skill catalog (SKILL.md + _meta.json per folder)                 | [skills/_rules-skills.md](./skills/_rules-skills.md)                                                                                          |
| `connectors/`      | Connector metadata (one .md per connector)                       | `connectors/_rules.md` + `_schema.json` + `_template.md`                                                                                      |
| `categories/`      | Shared categories (connectors + skills validate against these)   | —                                                                                                                                             |
| `ai-providers/`    | Provider/model metadata                                          | —                                                                                                                                             |

## Hard rules (apply everywhere)

1. **Any agent-template content change = MUST bump** `version` in agent.json —
   the "publish update" mechanism for already-installed agents is keyed by
   version; without a bump the admin cannot publish a new release and existing
   users never see the Upgrade button.
2. **⚠️ New SCHEMA field → deploy BE FIRST, merge to main AFTER.** Merging
   content that uses a new field while production BE lacks the parser → old BE
   drops the field AND records the folder SHA → sync skips forever (the only
   fix is touching a file to change the SHA).
3. **Deleting a folder = soft-delete from the catalog** (installed agents keep
   running; re-adding the folder restores it). Don't rename folders casually —
   the folder name IS the `agentId`.
4. **Localized text must ship the full `vi` + `en` pair** (rendering falls back
   per field: viewer's locale → vi → any — uneven authoring shows users mixed
   languages).
5. **Test changes on a branch**, never experiment on `main`: push a branch →
   point local BE `CONTENT_REPO_AGENT_TEMPLATES_BRANCH=<branch>` → hit the
   GitHub Sync button.

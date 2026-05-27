---
name: todo-organizer
description: Sort and group a chaotic to-do list by project, priority, or effort. Text-only, no external service.
---

# Instructions

Use this skill to bring order to a messy list of tasks the user pastes in.

## Required runtime

No API key, no environment variable, no network call. Works entirely from the list the user provides.

## Capabilities

- Group tasks by project, context, or theme inferred from the text
- Sort within each group by priority or by quick-wins-first
- Tag each item with rough effort (quick / medium / long)
- Detect duplicates and near-duplicates and merge them
- Spot vague items and suggest a clearer rewrite
- Output as grouped checklists ready to copy

## Guardrails

- Never drop a task silently — if merging duplicates, say which were merged.
- Do not invent deadlines or priorities the user did not imply; ask if unclear.
- Preserve the user's original wording where possible.

---
name: weekly-report
description: Turn a week of scattered notes into a tidy status report for a manager or team. Text-only, no external service.
---

# Instructions

Use this skill to compile what the user did this week into a clear report.

## Required runtime

No API key, no environment variable, no network call. The user pastes their notes, commit messages, task list, or a brain-dump of the week.

## Capabilities

- Group work into Done / In progress / Blocked / Next week
- Rewrite terse notes into reader-friendly sentences for a manager
- Quantify where possible (count of items shipped, tickets closed)
- Surface blockers and what is needed to unblock them
- Match the user's preferred length: 5-line update or a fuller report
- Write in vi or en

## Guardrails

- Never inflate or invent accomplishments not in the input.
- Keep blockers honest; do not soften a real risk into vague language.
- Use the user's own project and task names as given.

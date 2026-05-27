---
name: meeting-notes
description: Turn raw meeting notes into a clean summary with decisions and action items. Text-only, no external service.
---

# Instructions

Use this skill to convert rough meeting notes or a transcript into a structured record.

## Required runtime

No API key, no environment variable, no network call. The user pastes the raw notes or transcript.

## Capabilities

- Summarize the discussion into a short paragraph of key points
- Extract decisions made, each on its own line
- Extract action items with owner and due date when stated
- Flag open questions / unresolved items separately
- Output in the user's language (vi or en), matching the input
- Produce a copy-ready format (markdown or plain bullets)

## Guardrails

- Never invent an owner or due date that was not in the notes — mark as "unassigned" / "no date" instead.
- Do not editorialize; report what was said, not opinions about it.
- Keep names exactly as written by the user; do not guess full names.

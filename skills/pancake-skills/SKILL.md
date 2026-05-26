---
name: pancake-skills
description: Manage unified Facebook/Instagram inboxes and multi-channel POS orders via Pancake (pages.fm).
---

# Instructions

Use this skill to read and act on conversations and orders inside a Pancake (pages.fm) workspace.

## Required environment

- `USER_ACCESS_TOKEN` — Pancake user token (valid 90 days)
- `PAGE_ACCESS_TOKEN` — token for the specific Facebook/Instagram page
- `CONFIRM_WRITE=YES` — must be set explicitly before any write action (send message, update order)

If any env is missing, return a setup error referencing the user's `clawskills.sh/skills/suminhthanh-pancake-skills` config and stop.

## Capabilities

- Count unread conversations across pages connected to Pancake
- Fetch the last N conversations with filter by tag, label, or assignee
- Reply to a conversation with text + optional attachment
- Create / update / cancel POS orders
- List orders by status (`pending`, `confirmed`, `shipping`, `delivered`, `returned`)
- Sync customer record back into the connected CRM

## Guardrails

- Never send a reply automatically without an explicit user instruction or pre-approved template.
- Refuse to cancel orders worth more than 5,000,000 VND without a second confirmation.
- Rate limit: max 60 API calls per minute per page; back off on `429`.

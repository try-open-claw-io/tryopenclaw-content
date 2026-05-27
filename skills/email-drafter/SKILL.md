---
name: email-drafter
description: Draft clear, well-toned emails from a few bullet points. Writes text only — never sends.
---

# Instructions

Use this skill to write email drafts from the user's intent. This skill only produces text; it does not connect to any mailbox.

## Required runtime

No API key, no environment variable, no network call, no mailbox access. The user describes what they want to say; the skill returns a draft they copy elsewhere to send.

## Capabilities

- Draft an email from a few bullet points or a one-line intent
- Adjust tone: formal, friendly, firm, apologetic, concise
- Write in vi or en, matching the user's request
- Produce subject line + body, plus a shorter variant on request
- Rewrite or shorten an existing draft the user pastes
- Suggest a polite follow-up or reminder version

## Guardrails

- This skill never sends mail and has no access to any inbox — say so if the user expects sending.
- Never fabricate facts, figures, names, or commitments the user did not provide.
- Keep recipient-specific details as placeholders ("[tên người nhận]") unless the user gives them.

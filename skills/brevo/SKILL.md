---
name: brevo
description: Send marketing emails and manage contact lists through Brevo (formerly Sendinblue).
---

# Instructions

Use this skill to send transactional and marketing emails, manage lists, and run basic campaigns via Brevo.

## Required environment

- `BREVO_API_KEY` — Brevo API v3 key (generated in Brevo console → SMTP & API)

If missing, return setup instructions linking to `app.brevo.com/settings/keys/api`.

## Capabilities

- Send a single transactional email (subject, html body, to, cc, bcc, attachments)
- Send a bulk campaign to a contact list with personalization tokens (`{{ contact.FIRSTNAME }}` etc.)
- Create / update / delete a contact list
- Add or update a contact (email, attributes, list membership)
- Segment contacts by attribute (e.g. `LASTORDER > 2026-01-01`)
- Get campaign stats (delivered, opened, clicked, bounced, unsubscribed)
- Schedule a campaign for a future timestamp (ISO 8601)

## Guardrails

- Daily free-tier cap is 300 emails per Brevo account; warn the user when nearing the limit.
- Refuse to send a campaign to a list of more than 1,000 recipients without explicit confirmation.
- Always honor the unsubscribe header; never bypass it.
- Strip any PII beyond what is necessary from log output.

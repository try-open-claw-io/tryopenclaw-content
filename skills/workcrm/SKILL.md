---
name: workcrm
description: A lightweight local CRM for storing contacts, deals, and notes in a single SQLite file.
---

# Instructions

Use this skill as a self-hosted, single-user CRM. State lives in a local SQLite database — no cloud, no third-party API.

## Required environment

- Optional `WORKCRM_DB_PATH` — absolute path to the SQLite file. Defaults to `~/.workcrm/db.sqlite`.

No API key is required. If the database file does not exist, the skill creates it on first use.

## Schema

- `contacts(id, name, phone, email, channel, tags, created_at)`
- `deals(id, contact_id, title, stage, value_vnd, expected_close, created_at)`
- `notes(id, contact_id, body, created_at)`

`channel` is one of: `zalo`, `fanpage`, `shopee`, `tiktok`, `lazada`, `phone`, `referral`, `walk-in`, `other`.
`stage` is one of: `lead`, `qualified`, `quoted`, `negotiating`, `won`, `lost`.

## Capabilities

- Create a contact and infer `channel` from the message source
- Find contacts by name, phone (E.164 or local), email, or tag
- Add a note pinned to a contact
- Move a deal between stages and record the timestamp
- Report pipeline: count of deals per stage and total VND value
- Export contacts or deals to CSV
- Search free text across contact name, deal title, and notes

## Guardrails

- Never delete a contact with one or more `won` deals; soft-archive it via a `tags` flag instead.
- Phone numbers are stored in E.164 format; convert before insert.
- All writes happen inside a single SQL transaction; on error the database is unchanged.
- No PII is logged outside the database file.

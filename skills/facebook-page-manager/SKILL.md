---
name: facebook-page-manager
description: Publish posts, moderate comments, and reply to inbox on a Facebook Page via Graph API.
---

# Instructions

Use this skill to run day-to-day operations on a Facebook Page.

## Required setup

- Meta developer account with an App (App ID + App Secret)
- Page admin or developer role on the target page
- OAuth long-lived Page Access Token with scopes:
  - `pages_show_list`
  - `pages_read_engagement`
  - `pages_manage_posts`
  - `pages_manage_engagement`
  - `pages_messaging` (only if you intend to reply to inbox)

Token must be stored in `PAGE_ACCESS_TOKEN`. The page id must be in `FB_PAGE_ID`.

## Capabilities

- Publish a text, photo, or video post (with optional schedule time)
- List recent posts with engagement metrics
- List comments on a given post and filter by keyword, sentiment, or author
- Hide / unhide / delete a specific comment
- Reply to a comment or to a private inbox thread
- Pin / unpin a post

## Guardrails

- Never publish a post without explicit user approval of the final text.
- Never delete a comment from a verified user without explicit confirmation.
- Respect Meta rate limits; back off on `4` error code (rate limit) and `190` (token expired).
- Refuse to reply if the inbox thread is older than 24 hours unless explicitly told (Meta messaging window rule).

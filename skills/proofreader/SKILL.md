---
name: proofreader
description: Fix spelling, grammar, and clarity in Vietnamese or English text, with tracked changes. Text-only, no external service.
---

# Instructions

Use this skill to proofread and tighten text the user pastes in.

## Required runtime

No API key, no environment variable, no network call. Works from the text the user provides.

## Capabilities

- Fix spelling, grammar, punctuation, and spacing in vi and en
- Tighten wordy sentences without changing the meaning
- Offer a clean corrected version plus a list of what changed and why
- Match a requested register: keep it casual, or make it more formal
- Flag ambiguous sentences rather than silently rewriting them
- Check consistency of terms, capitalization, and number formatting

## Guardrails

- Never change the author's intended meaning; when unsure, ask or flag instead of guessing.
- Preserve domain terms, names, and quotes exactly.
- Keep edits minimal by default; only do a heavy rewrite when the user asks.

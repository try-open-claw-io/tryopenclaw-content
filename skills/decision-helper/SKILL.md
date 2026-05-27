---
name: decision-helper
description: Compare options with a weighted pros/cons table to reach a clear decision. Text-only, no external service.
---

# Instructions

Use this skill to help the user think through a choice between options.

## Required runtime

No API key, no environment variable, no network call. Works from the options and criteria the user describes.

## Capabilities

- Lay out 2+ options side by side
- Build a pros / cons list for each
- Score against criteria the user cares about, with weights when given
- Surface the trade-off in one sentence and a tentative recommendation
- Stress-test the leading option with a "what could go wrong" check
- Handle vi or en

## Guardrails

- Present a recommendation as a suggestion, not a command — the decision is the user's.
- Make assumptions explicit; if a criterion weight is missing, ask or state the default used.
- Do not pretend certainty about outcomes that depend on unknown facts.

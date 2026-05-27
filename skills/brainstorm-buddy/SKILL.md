---
name: brainstorm-buddy
description: Generate and expand ideas on a topic, then cluster them into themes. Text-only, no external service.
---

# Instructions

Use this skill to help the user explore ideas around a topic or problem.

## Required runtime

No API key, no environment variable, no network call. Works from the prompt the user gives.

## Capabilities

- Produce a broad list of ideas on a topic (quantity-first divergent pass)
- Expand any single idea into sub-ideas or concrete next steps
- Cluster a raw idea dump into named themes
- Apply lenses: cheaper, faster, weirder, lower-risk, for a different audience
- Combine two ideas into a hybrid
- Pick a shortlist with a one-line rationale each, on request

## Guardrails

- During divergent passes, do not self-censor for feasibility — that is a separate step.
- When asked to shortlist, be honest about weak ideas rather than padding the list.
- Keep ideas concrete enough to act on; avoid empty buzzwords.

---
name: doc-summarizer
description: Summarize long text or documents into key points, TL;DR, or an outline. Text-only, no external service.
---

# Instructions

Use this skill to condense long content the user pastes into the chat.

## Required runtime

No API key, no environment variable, no network call. The user pastes the text or document content directly.

## Capabilities

- One-line TL;DR plus a short bullet summary
- Adjustable depth: 3 bullets, 10 bullets, or a full outline
- Pull out key numbers, dates, and named entities into a facts list
- Highlight the main argument and any caveats or conditions
- Summarize in vi or en, matching the user's request
- Compare two pasted documents and list the differences

## Guardrails

- Summarize only what is in the provided text; never add outside facts.
- If the text is ambiguous, note the ambiguity rather than resolving it silently.
- Preserve figures and dates exactly; do not round unless asked.

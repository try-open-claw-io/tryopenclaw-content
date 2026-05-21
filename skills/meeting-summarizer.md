---
id: meeting-summarizer
name:
  vi: "Meeting Summarizer Pro"
  en: "Meeting Summarizer Pro"
summary:
  vi: "Turn long transcripts into decisions, owners, and follow-ups in under a minute."
  en: "Turn long transcripts into decisions, owners, and follow-ups in under a minute."
category: productivity
icon: "Sparkles"
author: "Sync Labs"
tags:
  - "meetings"
  - "summary"
  - "actions"
tutorials:
  - prompt:
      vi: "Summarize this 60-minute Zoom transcript into 5 decisions and 8 actions"
      en: "Summarize this 60-minute Zoom transcript into 5 decisions and 8 actions"
  - prompt:
      vi: "Write tomorrow's agenda from yesterday's follow-ups"
      en: "Write tomorrow's agenda from yesterday's follow-ups"
status: "Ready"
version: "2.4"
---

# Meeting Summarizer Pro

Accepts raw transcripts (or recordings via integration) and emits a structured note: decisions made, blockers raised, action items with owners, and next-meeting agenda seed.

## How to use

Drop a transcript. Skill emits a structured note with decisions, owners, and follow-ups.

```bash
summarize(transcript, audience="exec")
```

### Steps

| Step | Command |
| --- | --- |
| Parse transcript | `diarize + clean` |
| Extract decisions | `extract("decisions")` |
| Action items | `extract("actions")` |

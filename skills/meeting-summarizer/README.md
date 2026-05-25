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

## Tutorials

- Summarize this 60-minute Zoom transcript into 5 decisions and 8 actions
- Write tomorrow's agenda from yesterday's follow-ups

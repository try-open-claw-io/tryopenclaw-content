# Competitor Radar

Monitors a configurable competitor list. Each run collects launches, pricing updates, hiring signals, and press mentions, then drafts a short briefing with a diff vs last week.

## How to use

List 3-10 competitors. The skill stores their footprint and emits a diff-aware report each cycle.

```bash
track(["acme.com","nova.co"])
run_weekly()
```

### Steps

| Step | Command |
| --- | --- |
| Seed competitors | `track(list)` |
| Crawl signal sources | `press, careers, pricing` |
| Draft diff brief | `report(format="md")` |

## Tutorials

- What changed at Nova Co since last Friday?
- Summarize the top 3 launches in our category this week

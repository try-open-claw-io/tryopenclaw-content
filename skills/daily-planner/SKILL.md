---
name: daily-planner
description: Turn a messy task dump into a prioritized day plan with time blocks. Text-only, no external service.
---

# Instructions

Use this skill to help the user plan their day: collect tasks, prioritize them, and lay out a realistic schedule.

## Required runtime

No API key, no environment variable, no network call. The skill works purely from the conversation — the user pastes or dictates their tasks.

## Capabilities

- Collect a raw list of tasks from free text and split into atomic items
- Prioritize with Eisenhower (urgent/important) or simple high/med/low
- Estimate effort per task and warn if the day is overbooked
- Lay out time blocks across the working hours the user gives (default 9:00–18:00)
- Insert breaks and a buffer for unplanned work
- Re-plan when the user reports a task slipped or a new one arrived

## Guardrails

- Never invent tasks the user did not mention.
- If the total estimated effort exceeds available hours, say so and ask what to drop or defer.
- Keep the plan editable — present it as a list the user can adjust, not a fixed contract.

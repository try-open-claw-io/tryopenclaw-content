# Agent Templates — how to build a template

Every subfolder here is **one agent template** (a blueprint for an agent chat
on ClawExperts). The BE syncs this folder into the DB catalog; from the
catalog, users install agents via the marketplace / Create Agent wizard.

## Template structure

```
<agent-id>/                     ← folder name = agentId (MUST match)
├── agent.json                  ← manifest (schema below) — the only required file
├── core_files/                 ← the agent's "soul", pushed into its workspace on install
│   ├── AGENTS.md               ← behavior + working process
│   ├── SOUL.md                 ← personality
│   ├── USER.md                 ← user info (the agent fills this in over time)
│   ├── MEMORY.md / BOOTSTRAP.md / HEARTBEAT.md …  (template-specific)
├── tones/                      ← one .md per tone (if the template ships custom tones)
├── images/                     ← icon + marketplace images (paths declared in agent.json)
└── plugins/                    ← (rare) bundled plugins — see bsv-onboarding
```

## agent.json — schema

Only `agentId` + `name` are hard-required; every other field has a default and
the parser is **lenient** (odd shapes never fail the sync — they get
dropped/defaulted + a warn log).

→ Per-field explanations (required/optional, defaults, where each shows up):  
**[AGENT-JSON.md](./AGENT-JSON.md)**

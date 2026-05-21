---
id: cold-email-composer
name:
  vi: "Cold Email Composer"
  en: "Cold Email Composer"
summary:
  vi: "Write personalized cold emails that pass spam filters and earn replies."
  en: "Write personalized cold emails that pass spam filters and earn replies."
category: sales-outreach
icon: "Mail"
author: "Outbound Labs"
tags:
  - "cold-email"
  - "outreach"
  - "personalization"
tutorials:
  - prompt:
      vi: "Cold email to Mai Tran, Head of Ops at Tiki, for our supplier-risk tool"
      en: "Cold email to Mai Tran, Head of Ops at Tiki, for our supplier-risk tool"
  - prompt:
      vi: "3 variants pitching our QA platform to a fintech CTO"
      en: "3 variants pitching our QA platform to a fintech CTO"
status: "Ready"
version: "2.0"
---

# Cold Email Composer

Combines prospect research with proven cold-email frameworks (AIDA, PAS). Personalizes the opener with a non-fake research line and emits 3 variants.

## How to use

Provide prospect info + your offer. The skill researches the prospect, picks an angle, and drafts 3 variants.

### Steps

| Step | Command |
| --- | --- |
| Research prospect | `lookup(name, company)` |
| Pick angle | `select_hook(angles)` |
| Draft variants | `compose(n=3)` |

---
name: meta-ads-report
description: Pull Facebook/Instagram ad performance metrics from Meta Graph API and summarize them in chat.
---

# Instructions

Use this skill to surface ad performance from a Meta Ads account without opening Ads Manager.

## Required environment

- `META_ACCESS_TOKEN` — Meta Graph API token
- `META_AD_ACCOUNT_ID` — must be in `act_<numeric>` format

Required Graph permissions:
- `ads_read`
- `read_insights`

If either env or permission is missing, return a setup error referencing Meta Business Manager.

## Capabilities

- Account-level spend, impressions, reach, CTR, CPM, CPC, CPA for a custom date range
- Campaign-level breakdown sorted by spend, ROAS, or conversions
- Ad set / ad creative drill-down on a flagged campaign
- Compare two date ranges (week-over-week, month-over-month)
- Flag campaigns with CPA above a user-set threshold
- Currency: report in VND if account is VND-billed, otherwise in account currency

## Guardrails

- Read-only: this skill never edits a campaign, ad set, or ad.
- Round monetary values to the nearest 1,000 VND when summarizing for chat.
- Cap a single request at 90 days of data; chunk longer ranges.

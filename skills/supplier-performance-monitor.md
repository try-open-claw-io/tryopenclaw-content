---
id: supplier-performance-monitor
name:
  vi: "Supplier Performance Monitor"
  en: "Supplier Performance Monitor"
summary:
  vi: "Track supplier performance with on-time delivery, quality, and complaint trends."
  en: "Track supplier performance with on-time delivery, quality, and complaint trends."
category: sourcing
icon: "Activity"
author: "OpsBridge"
tags:
  - "operations"
  - "scorecard"
  - "alerts"
tutorials:
  - prompt:
      vi: "Show suppliers that breached 95% OTD this quarter"
      en: "Show suppliers that breached 95% OTD this quarter"
  - prompt:
      vi: "Alert me if any supplier's defect rate spikes 2x WoW"
      en: "Alert me if any supplier's defect rate spikes 2x WoW"
status: "Beta"
version: "0.9"
---

# Supplier Performance Monitor

Pulls performance data from your ERP/order log, computes rolling OTD, defect rate, and complaint volume per supplier, and pages you when a supplier breaches your SLA threshold.

## How to use

Connect your order log once, set SLA thresholds, then check the weekly scorecard.

### Steps

| Step | Command |
| --- | --- |
| Connect data source | `connect(source="erp")` |
| Set thresholds | `set_sla(otd>=95, defect<=2)` |
| Run weekly job | `schedule("every monday 8am")` |

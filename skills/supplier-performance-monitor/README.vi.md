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

## Tutorials

- Show suppliers that breached 95% OTD this quarter
- Alert me if any supplier's defect rate spikes 2x WoW

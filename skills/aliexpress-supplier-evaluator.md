---
id: aliexpress-supplier-evaluator
name:
  vi: "Aliexpress Supplier Evaluator"
  en: "Aliexpress Supplier Evaluator"
summary:
  vi: "Evaluate overseas supplier reliability with rating, lead time, and complaint signals."
  en: "Evaluate overseas supplier reliability with rating, lead time, and complaint signals."
category: sourcing
icon: "ShoppingBag"
author: "TryOpenClaw"
tags:
  - "aliexpress"
  - "supplier"
  - "scoring"
tutorials:
  - prompt:
      vi: "Rate supplier 'GreatHome Store' on Aliexpress for kitchenware"
      en: "Rate supplier 'GreatHome Store' on Aliexpress for kitchenware"
  - prompt:
      vi: "Compare 3 Aliexpress sellers of silicone molds and pick the safest"
      en: "Compare 3 Aliexpress sellers of silicone molds and pick the safest"
status: "Ready"
version: "1.4"
---

# Aliexpress Supplier Evaluator

Scores Aliexpress suppliers across rating, on-time delivery, return rate, communication speed, and dispute history. Aggregates into a single trust score and surfaces red flags before you place a real order.

## How to use

Pass a supplier ID or store URL. The skill fetches the public profile, scrapes recent reviews, and emits a JSON trust report with weighted sub-scores.

```bash
evaluate(supplier_id="1101234567", window_days=90)
```

### Steps

| Step | Command |
| --- | --- |
| Resolve store identity | `GET store?store_id=…` |
| Sample 200 latest reviews | `GET feedback?page=1..10` |
| Score 5 dimensions | `compute_trust(profile, reviews)` |

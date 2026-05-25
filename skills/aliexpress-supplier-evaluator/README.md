# Aliexpress Supplier Evaluator

Scores Aliexpress suppliers across rating, on-time delivery, return rate, communication speed, and dispute history. Aggregates into a single trust score and surfaces red flags before you place a real order.

## How to use

Pass a supplier ID or store URL. The skill fetches the public profile, scrapes recent reviews, and emits a JSON trust report with weighted sub-scores.

```bash
evaluate(supplier_id="1101234567", window_days=90)
```

### Steps

| Step                      | Command                           |
| ------------------------- | --------------------------------- |
| Resolve store identity    | `GET store?store_id=…`            |
| Sample 200 latest reviews | `GET feedback?page=1..10`         |
| Score 5 dimensions        | `compute_trust(profile, reviews)` |

## Tutorials

- Rate supplier 'GreatHome Store' on Aliexpress for kitchenware
- Compare 3 Aliexpress sellers of silicone molds and pick the safest

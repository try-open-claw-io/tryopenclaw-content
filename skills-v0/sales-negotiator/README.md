# Sales Negotiator

Builds a negotiation playbook: anchor price, walk-away, concession ladder, and counter-objection bank. Coaches you message-by-message and tracks what you've already given away.

## How to use

Brief the deal: counterparty, baseline ask, your floor and ceiling. The skill emits a 3-round plan with talk tracks.

### Steps

| Step | Command |
| --- | --- |
| Set BATNA | `set_batna(value, evidence)` |
| Generate concession ladder | `ladder(rounds=3)` |
| Suggest next message | `next_move(history)` |

## Tutorials

- Help me push the supplier from $4.20 to $3.60 with sample-cost concession
- Draft a 3-round playbook for renewing the Acme MSA

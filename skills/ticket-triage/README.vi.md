# Ticket Triage

Reads incoming tickets, classifies intent (bug, billing, request, abuse), assigns priority based on language signals and customer tier, and routes to the right queue.

## How to use

Subscribe to your inbound queue. Skill classifies and tags each ticket; routing rules are editable.

### Steps

| Step | Command |
| --- | --- |
| Connect inbound queue | `connect(zendesk\|intercom)` |
| Classify ticket | `classify(text)` |
| Route + tag | `route(queue, priority)` |

## Tutorials

- Triage the last 50 tickets in our support queue
- Set priority high if the customer is on enterprise plan

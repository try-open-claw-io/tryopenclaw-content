# Product Supplier Sourcing

Federated product search across major sourcing networks. Filters by MOQ, lead time, port of dispatch, and certification. Outputs a comparable spec sheet ready for negotiation.

## How to use

Provide a product brief in natural language. The skill expands keywords (EN + CN) and queries each network in parallel.

```bash
search("ceramic pet bowl, MOQ<=50, lead<=15d", networks=["cj","1688","ali"])
```

### Steps

| Step | Command |
| --- | --- |
| Expand query | `translate + synonyms` |
| Fan-out search | `parallel network calls` |
| Normalize results | `to common spec schema` |

## Tutorials

- Source ceramic pet bowls, MOQ under 50, lead time under 15 days
- Find waterproof Bluetooth speakers IP67-rated below $4 FOB

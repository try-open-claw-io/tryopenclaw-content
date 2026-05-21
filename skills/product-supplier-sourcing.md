---
id: product-supplier-sourcing
name:
  vi: "Product Supplier Sourcing"
  en: "Product Supplier Sourcing"
summary:
  vi: "Search for products and suppliers across CJ, Aliexpress, 1688, and DHgate."
  en: "Search for products and suppliers across CJ, Aliexpress, 1688, and DHgate."
category: sourcing
icon: "Search"
author: "TryOpenClaw"
tags:
  - "sourcing"
  - "marketplace"
  - "spec-sheet"
tutorials:
  - prompt:
      vi: "Source ceramic pet bowls, MOQ under 50, lead time under 15 days"
      en: "Source ceramic pet bowls, MOQ under 50, lead time under 15 days"
  - prompt:
      vi: "Find waterproof Bluetooth speakers IP67-rated below $4 FOB"
      en: "Find waterproof Bluetooth speakers IP67-rated below $4 FOB"
status: "Ready"
version: "1.2"
---

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

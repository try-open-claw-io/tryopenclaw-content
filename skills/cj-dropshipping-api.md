---
id: cj-dropshipping-api
name:
  vi: "CJ Dropshipping API"
  en: "CJ Dropshipping API"
summary:
  vi: "Integrate with CJ Dropshipping API V2.0 for product management, orders, logistics, and webhook automation."
  en: "Integrate with CJ Dropshipping API V2.0 for product management, orders, logistics, and webhook automation."
category: sourcing
icon: "Package"
author: "TryOpenClaw"
tags:
  - "dropshipping"
  - "supplier"
  - "api"
status: "Ready"
version: "2.0"
---

# CJ Dropshipping API

Calls https://developers.cjdropshipping.com/api2.0/v1/... with a CJ-Access-Token bearer header. Supports product search, order placement, logistics tracking, webhook subscription, and partner listings. Use accio-mcp-cli for OAuth and token reads — everything else is REST.

## How to use

accio-mcp-cli is used only for CJ OAuth and reading the stored token (start_cj_auth, get_cj_access_token). Everything else — product search, orders, logistics, webhooks, partner listing — follows the REST API in sections 2 onward: call https://developers.cjdropshipping.com/api2.0/v1/... with header CJ-Access-Token from get_cj_access_token.

```bash
accio-mcp-cli call start_cj_auth
accio-mcp-cli call get_cj_access_token
```

### Steps

| Step | Command |
| --- | --- |
| Start OAuth (user completes link in browser) | `accio-mcp-cli call start_cj_auth` |
| Read stored access token | `accio-mcp-cli call get_cj_access_token` |
| Search products via REST | `GET /product/list?pageNum=1&pageSize=20` |
| Create dropshipping order | `POST /shopping/order/createOrder` |

## Tutorials

- Find me 10 best-selling kitchen gadgets under $5 with shipping under 14 days
- Place a CJ order for SKU 1530245-A to ship to my last buyer
- Subscribe a webhook to fire on tracking-status changes

## Tags

`dropshipping`, `supplier`, `api`

## Author

TryOpenClaw

Version: 2.0

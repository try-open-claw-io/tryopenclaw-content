---
id: api-doc-writer
name:
  vi: "API Doc Writer"
  en: "API Doc Writer"
summary:
  vi: "Generate clean OpenAPI docs from your code annotations."
  en: "Generate clean OpenAPI docs from your code annotations."
category: engineering
icon: "Code"
author: "Doc Tools"
tags:
  - "openapi"
  - "docs"
  - "engineering"
tutorials:
  - prompt:
      vi: "Generate OpenAPI docs from this Next.js app/api directory"
      en: "Generate OpenAPI docs from this Next.js app/api directory"
  - prompt:
      vi: "What endpoints changed shape between v2.3 and main?"
      en: "What endpoints changed shape between v2.3 and main?"
status: "Ready"
version: "1.2"
---

# API Doc Writer

Parses your route files, infers schemas, and emits OpenAPI 3.1 + a human-readable reference. Diffs against the existing doc to highlight breaking changes.

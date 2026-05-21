---
id: sql-explainer
name:
  vi: "SQL Explainer"
  en: "SQL Explainer"
summary:
  vi: "Translate complex SQL into plain English and back again."
  en: "Translate complex SQL into plain English and back again."
category: engineering
icon: "Database"
author: "Tidy Pipelines"
tags:
  - "sql"
  - "data"
  - "translate"
tutorials:
  - prompt:
      vi: "Explain this CTE step by step in plain English"
      en: "Explain this CTE step by step in plain English"
  - prompt:
      vi: "Write me a Postgres query that returns DAU by cohort"
      en: "Write me a Postgres query that returns DAU by cohort"
status: "Ready"
version: "1.5"
---

# SQL Explainer

Reads gnarly SQL (CTEs, window functions, lateral joins) and walks through each clause in plain English. Reverse mode: translates a plain-English request into a working query for your dialect.

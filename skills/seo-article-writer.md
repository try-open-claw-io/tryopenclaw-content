---
id: seo-article-writer
name:
  vi: "SEO Article Writer"
  en: "SEO Article Writer"
summary:
  vi: "Write long-form SEO articles tuned to your target keyword and intent."
  en: "Write long-form SEO articles tuned to your target keyword and intent."
category: content-marketing
icon: "FileText"
author: "Rank Lab"
tags:
  - "seo"
  - "longform"
  - "writing"
tutorials:
  - prompt:
      vi: "Write a 1500-word guide ranking for 'AI agent platform' (B2B)"
      en: "Write a 1500-word guide ranking for 'AI agent platform' (B2B)"
  - prompt:
      vi: "Draft a buying guide for 'best air purifier under 5 trieu'"
      en: "Draft a buying guide for 'best air purifier under 5 trieu'"
status: "Ready"
version: "2.1"
---

# SEO Article Writer

Researches the SERP, outlines under intent, drafts the article with internal-link suggestions, and emits SEO meta (title, description, schema).

## How to use

Pass keyword + audience. Skill plans an outline, then drafts section-by-section so you can edit live.

### Steps

| Step | Command |
| --- | --- |
| SERP scrape | `fetch_top_10(keyword)` |
| Outline by intent | `outline(intent)` |
| Section drafts | `draft(section)` |

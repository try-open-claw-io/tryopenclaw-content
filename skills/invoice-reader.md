---
id: invoice-reader
name:
  vi: "Invoice Reader"
  en: "Invoice Reader"
summary:
  vi: "Extract structured fields from invoices and receipts (PDF, image, email)."
  en: "Extract structured fields from invoices and receipts (PDF, image, email)."
category: finance
icon: "Receipt"
author: "Ledger Lab"
tags:
  - "ocr"
  - "invoice"
  - "extraction"
tutorials:
  - prompt:
      vi: "Extract line items from these 5 supplier invoices"
      en: "Extract line items from these 5 supplier invoices"
  - prompt:
      vi: "Flag any invoice where line totals don't match the grand total"
      en: "Flag any invoice where line totals don't match the grand total"
status: "Ready"
version: "2.0"
---

# Invoice Reader

OCR + structure: pulls vendor, line items, totals, tax, and dates from invoices. Validates totals against line math and flags mismatches.

## How to use

Send a file or URL. Skill OCRs, parses, and validates the result, then emits structured JSON.

### Steps

| Step | Command |
| --- | --- |
| OCR document | `ocr(file)` |
| Extract fields | `extract(schema)` |
| Validate totals | `verify(math)` |

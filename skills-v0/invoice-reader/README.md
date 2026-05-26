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

## Tutorials

- Extract line items from these 5 supplier invoices
- Flag any invoice where line totals don't match the grand total

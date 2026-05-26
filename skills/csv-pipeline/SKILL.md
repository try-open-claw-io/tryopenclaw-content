---
name: csv-pipeline
description: Local CSV and JSON cleanup, dedupe, normalize, merge, and report. No external API.
---

# Instructions

Use this skill to run common data-cleanup operations on CSV and JSON files entirely on the local machine.

## Required runtime

- Python 3.9+
- `pandas` and `phonenumbers` Python packages installed in the active environment
- Standard POSIX shell tools (`awk`, `sort`, `uniq`, `jq`)

No API key, no network call required.

## Capabilities

- Load a CSV or JSON file with auto-detected delimiter and encoding (UTF-8 / Windows-1258 for Vietnamese)
- Dedupe rows by one column or a composite key
- Normalize Vietnamese phone numbers to `+84` E.164 format
- Trim, lowercase, or title-case a text column
- Filter rows by a column predicate (e.g. `total > 500000`)
- Join two files on a shared key (inner / left / outer)
- Pivot a long table to wide and vice versa
- Export back to CSV, JSON, or Excel
- Summary report: row count, null percentage per column, unique count per column

## Guardrails

- Never write back to the input file in place; always write to a new path.
- Refuse to operate on a file larger than 500 MB without explicit user confirmation.
- Preserve column order and original header casing on output unless the user asks otherwise.
- Phone normalization treats invalid Vietnamese numbers as `null`, not as a guess.

/**
 * Resolve the sheet's output columns (status note + last-checked timestamp) by
 * HEADER NAME, creating them past the last used column when the sheet lacks
 * them. Keeps the plugin robust across sheets that don't already have the
 * "Lưu ý" / "Đã check" columns. Pure — unit-tested.
 */

export interface ResolvedColumn {
  index:   number; // 0-based
  letter:  string; // A1 column letter (X, Y, AM, …)
  created: boolean; // true → header must be written before use
  header:  string;  // header text to write when created
}

/** 0-based column index → A1 letter (0→A, 25→Z, 26→AA, 39→AN). */
export function columnLetter(index0: number): string {
  let n = index0;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function norm(s: string): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * Google Sheets auto-labels empty header cells in an expanded grid as "Cột N" /
 * "Column N". Treat those as EMPTY so the agent's columns land right after the
 * real data instead of being pushed past a block of placeholder columns.
 */
export function isPlaceholderHeader(h: string): boolean {
  return /^(cột|column)\s*\d+$/i.test((h ?? "").trim());
}

/**
 * For each wanted column (by header name), find its index in `header`; if absent
 * assign the next free column after the last used one and flag it for creation.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → write-back — locates/creates Lưu ý + Đã check columns
 */
export function resolveColumns(
  header: string[],
  wanted: string[],
): Map<string, ResolvedColumn> {
  let lastUsed = -1;
  header.forEach((h, i) => {
    if (h && h.trim() && !isPlaceholderHeader(h)) lastUsed = i;
  });
  let nextFree = lastUsed + 1;

  const out = new Map<string, ResolvedColumn>();
  for (const name of wanted) {
    const idx = header.findIndex((h) => norm(h) === norm(name));
    if (idx >= 0) {
      out.set(name, { index: idx, letter: columnLetter(idx), created: false, header: name });
    } else {
      out.set(name, { index: nextFree, letter: columnLetter(nextFree), created: true, header: name });
      nextFree++;
    }
  }
  return out;
}

/** Human-readable GMT+7 timestamp "YYYY-MM-DD HH:mm" for the last-checked column. */
export function nowStampGmt7(nowMs: number): string {
  const d = new Date(nowMs + 7 * 3600 * 1000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

// ── Status column colors (conditional formatting) ────────────────────────────

export interface Rgb {
  red:   number;
  green: number;
  blue:  number;
}

export interface ConditionalFormatRule {
  ranges: Array<{
    sheetId:          number;
    startRowIndex:    number;
    endRowIndex:      number;
    startColumnIndex: number;
    endColumnIndex:   number;
  }>;
  booleanRule: {
    condition: { type: "TEXT_EQ"; values: Array<{ userEnteredValue: string }> };
    format:    { backgroundColor: Rgb; textFormat: { bold: true } };
  };
}

/**
 * Build one conditional-format rule per status value → background color, over the
 * status column (rows 2..endRow). Lets operators tell OK / needs-fix rows apart at
 * a glance instead of reading text. Pure.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → ensureAgentHeaders() — colors the status column on creation
 */
export function statusColorRules(
  sheetId: number,
  colIndex: number,
  endRow: number,
  entries: Array<{ value: string; bg: Rgb }>,
): ConditionalFormatRule[] {
  return entries.map(({ value, bg }) => ({
    ranges: [{ sheetId, startRowIndex: 1, endRowIndex: endRow, startColumnIndex: colIndex, endColumnIndex: colIndex + 1 }],
    booleanRule: {
      condition: { type: "TEXT_EQ", values: [{ userEnteredValue: value }] },
      format: { backgroundColor: bg, textFormat: { bold: true } },
    },
  }));
}

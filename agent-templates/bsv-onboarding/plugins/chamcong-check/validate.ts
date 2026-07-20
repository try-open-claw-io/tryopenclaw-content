/**
 * chamcong-check — pure, deterministic validation of worker-onboarding rows.
 *
 * NO openclaw import here on purpose: this module is unit-tested in isolation
 * (index.ts, which imports the plugin SDK, is excluded from tsc/bun test). The
 * plugin's registered tool is a thin wrapper that calls validateRows().
 *
 * Column layout is fixed to the "THÔNG TIN CÔNG NHÂN ALL" sheet (0-based A..AL):
 * see COL below. Values arrive as the raw 2D cell matrix from a sheets read.
 */

// ── Column indices (0-based, A=0 … AL=37) ────────────────────────────────────
export const COL = {
  hoTen:      1,  // B  Họ và tên
  soDienThoai:2,  // C  Số điện thoại
  ngaySinh:   3,  // D  Ngày sinh
  gioiTinh:   4,  // E  Giới tính
  soCCCD:     5,  // F  Số căn cước
  ngayCap:    6,  // G  Ngày cấp
  noiCap:     7,  // H  Nơi cấp
  nhomCN:     8,  // I  Nhóm công nhân
  congTrinh: 10,  // K  Công trình
  ngayVaoLam:11,  // L  Ngày vào làm
  tenTK:     14,  // O  Tên tài khoản
  soTK:      15,  // P  Số tài khoản
  tenNH:     16,  // Q  Tên ngân hàng
  anhMat:    19,  // T  Ảnh khuôn mặt FaceID
  cccdTruoc: 20,  // U  CCCD mặt trước
  cccdSau:   21,  // V  CCCD mặt sau
  luuY:      23,  // X  Lưu ý  (ghi kết quả kiểm tra vào đây)
  daCheck:   24,  // Y  Đã check all thông tin
  maNS:      26,  // AA Mã NS
  mucLuong:  12,  // M  Mức lương          (đối chiếu phiếu)
  loaiLuong: 13,  // N  Loại lương         (đối chiếu phiếu)
  chiNhanh:  17,  // R  Chi nhánh ngân hàng (đối chiếu phiếu)
  phieuScan: 18,  // S  File scan phiếu tiếp nhận (nguồn ảnh cho chamcong_check_phieu)
} as const;

// ── Types ────────────────────────────────────────────────────────────────────
export type Severity = 'error' | 'warn';

export interface Finding {
  rowNumber: number;   // 1-based sheet row (header = 1)
  field:     string;   // canonical field key from COL
  code:      string;   // machine code, e.g. MISSING, BAD_PHONE, DUP_CCCD
  message:   string;   // Vietnamese, ready to write into "Lưu ý"
  severity:  Severity;
}

export interface WorkerRow {
  rowNumber: number;
  cells:     string[];
}

export interface ValidateOptions {
  /** Valid bank names (from the "Bank" tab). When empty, bank cross-check is skipped. */
  bankNames?: string[];
  /** When true, rows whose "last checked" column is non-blank are skipped. Default true. */
  skipChecked?: boolean;
  /** 0-based index of the "last checked" column to read for skipping. Default COL.daCheck. */
  checkedColIndex?: number;
  /** Input column indices resolved by header (from resolveInputCols). Default COL. */
  cols?: InputCols;
  /** Precomputed sheet-wide duplicate findings per row (from duplicateFindingsByRow).
   *  When set, replaces the in-batch duplicate scan so scan_new gets duplicate
   *  detection across the whole sheet, not just within a 200-row read chunk. */
  dupByRow?: Map<number, Finding[]>;
}

export interface RowResult {
  rowNumber: number;
  ten:       string;
  findings:  Finding[];
  note:      string;   // "Lưu ý" text — joined error/warn messages, or '' when clean
  ok:        boolean;
}

export interface ValidateResult {
  results:  RowResult[];
  findings: Finding[];   // flat, all rows
  checked:  number;
  clean:    number;
  flagged:  number;
}

// ── Small deterministic helpers ──────────────────────────────────────────────
// Always required (non-bank fields).
const REQUIRED_CORE: Array<[keyof typeof COL, string]> = [
  ['hoTen', 'Họ tên'], ['soDienThoai', 'SĐT'], ['ngaySinh', 'Ngày sinh'],
  ['soCCCD', 'Số CCCD'], ['nhomCN', 'Nhóm CN'], ['congTrinh', 'Công trình'],
  ['ngayVaoLam', 'Ngày vào làm'], ['anhMat', 'Ảnh mặt'], ['cccdTruoc', 'CCCD mặt trước'],
  ['cccdSau', 'CCCD mặt sau'],
];
// Bank fields — checked ONLY when the row is not "bank pending": a worker whose
// account the company will create (Tên NH = "CTY TẠO") or who has no account
// number yet ("0") is deferred on purpose, so we skip all bank validation.
const REQUIRED_BANK: Array<[keyof typeof COL, string]> = [
  ['tenTK', 'Tên TK'], ['soTK', 'Số TK'], ['tenNH', 'Tên NH'],
];

export type InputCols = Record<keyof typeof COL, number>;

export function cell(row: WorkerRow, cols: InputCols, key: keyof typeof COL): string {
  return (row.cells[cols[key]] ?? '').trim();
}

export function isBlank(v: string): boolean {
  return v.trim().length === 0;
}

export function digits(v: string): string {
  return v.replace(/\D/g, '');
}

/** A value meaning "not filled / not applicable": blank or all zeros ("0", "00"). */
export function isPlaceholder(v: string): boolean {
  const s = (v ?? '').trim();
  return s.length === 0 || /^0+$/.test(s);
}

/** VN mobile: 10 digits starting with 0. */
export function isPhone(v: string): boolean {
  return /^0\d{9}$/.test(v.trim());
}

/** CCCD: exactly 12 digits. */
export function isCccd(v: string): boolean {
  return /^\d{12}$/.test(v.trim());
}

/** Parse dd/MM/yyyy → Date, or null when invalid. */
export function parseDmy(v: string): Date | null {
  const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]), mon = Number(m[2]), year = Number(m[3]);
  const d = new Date(Date.UTC(year, mon - 1, day));
  const valid = d.getUTCFullYear() === year && d.getUTCMonth() === mon - 1 && d.getUTCDate() === day;
  return valid ? d : null;
}

function norm(v: string): string {
  return v.trim().toLowerCase();
}

// ── Input columns resolved by HEADER NAME (robust to column reorder) ──────────
const DIA: Array<[RegExp, string]> = [
  [/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a'], [/[èéẹẻẽêềếệểễ]/g, 'e'], [/[ìíịỉĩ]/g, 'i'],
  [/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o'], [/[ùúụủũưừứựửữ]/g, 'u'], [/[ỳýỵỷỹ]/g, 'y'], [/đ/g, 'd'],
];

function normHeader(s: string): string {
  let out = (s ?? '').toLowerCase();
  for (const [re, ch] of DIA) out = out.replace(re, ch);
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Bank sentinel meaning the company will create the account later (no bank yet).
 *
 * @usedBy {plugins/chamcong-check/phieu.ts} → comparePhieu — skip bank comparison for deferred accounts
 */
export function isBankCreateSentinel(tenNH: string): boolean {
  const h = normHeader(tenNH); // lowercased + diacritics stripped → "cty tao"
  return h.includes('cty tao') || h.includes('cong ty tao');
}

/**
 * True when a row's bank/account section is intentionally deferred — the bank is
 * the "company creates" sentinel (Tên NH = "CTY TẠO"), or the account number is a
 * placeholder ("0"/blank). Such rows skip ALL bank validation + comparison. Pure.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_phieu — skip comparing a deferred bank section
 */
export function isBankPending(cells: string[], cols: InputCols): boolean {
  const nh = (cells[cols.tenNH] ?? '').trim();
  const stk = (cells[cols.soTK] ?? '').trim();
  return isBankCreateSentinel(nh) || isPlaceholder(stk);
}

/** Compact bank key: lowercase, strip diacritics, remove all non-alphanumeric. */
export function compactBank(v: string): string {
  return normHeader(v).replace(/[^a-z0-9]/g, '');
}

/**
 * Soft catalog match for a bank name — tolerant of spacing/diacritics/punctuation
 * ("Vietcom bank" = "Vietcombank") and of a code appearing inside a longer written
 * form ("Ngân hàng HDBank" ⊇ "hdbank"). `catalogCompact` is the Bank tab mapped
 * through compactBank. Pure.
 *
 * @usedBy {plugins/chamcong-check/validate.ts} → checkRow — UNKNOWN_BANK cross-check
 */
export function isKnownBank(nh: string, catalogCompact: Set<string>): boolean {
  const k = compactBank(nh);
  if (!k) return true;
  if (catalogCompact.has(k)) return true;
  // A catalog CODE of 3+ chars either contains or is contained by the input
  // (2-char codes like "MB" match only exactly, to avoid false substrings).
  for (const c of catalogCompact) {
    if (c.length >= 3 && (k.includes(c) || c.includes(k))) return true;
  }
  return false;
}

const HEADER_MATCHERS: Partial<Record<keyof typeof COL, (h: string) => boolean>> = {
  hoTen:       (h) => h.includes('ho va ten') || h.includes('ho ten'),
  soDienThoai: (h) => h.includes('dien thoai') || h === 'sdt',
  ngaySinh:    (h) => h.includes('ngay sinh'),
  gioiTinh:    (h) => h.includes('gioi tinh'),
  soCCCD:      (h) => h.startsWith('so can cuoc') || h === 'so cccd',
  ngayCap:     (h) => h.includes('ngay cap'),
  noiCap:      (h) => h.includes('noi cap'),
  nhomCN:      (h) => h.includes('nhom cong nhan'),
  congTrinh:   (h) => h.includes('cong trinh'),
  ngayVaoLam:  (h) => h.includes('ngay vao lam'),
  tenTK:       (h) => h.includes('ten tai khoan'),
  soTK:        (h) => h.includes('so tai khoan'),
  tenNH:       (h) => h.includes('ten ngan hang'),
  anhMat:      (h) => h.includes('khuon mat') || h.includes('faceid') || h.includes('face id'),
  cccdTruoc:   (h) => h.includes('cccd') && h.includes('truoc'),
  cccdSau:     (h) => h.includes('cccd') && h.includes('sau'),
  maNS:        (h) => h.includes('ma ns'),
  mucLuong:    (h) => h.includes('muc luong'),
  loaiLuong:   (h) => h.includes('loai luong'),
  chiNhanh:    (h) => h.includes('chi nhanh'),
  phieuScan:   (h) => h.includes('phieu tiep nhan'),
};

/**
 * Resolve each input field to its column index by matching the HEADER ROW; falls
 * back to the fixed default index when a header isn't found. Robust to columns
 * being reordered on the source sheet.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → check tools — maps fields to columns for the current sheet
 */
export function resolveInputCols(header: string[]): InputCols {
  const out = { ...COL } as InputCols;
  const normed = header.map(normHeader);
  for (const key of Object.keys(HEADER_MATCHERS) as Array<keyof typeof COL>) {
    const matcher = HEADER_MATCHERS[key]!;
    const idx = normed.findIndex((h) => h.length > 0 && matcher(h));
    if (idx >= 0) out[key] = idx;
  }
  return out;
}

// ── Per-row checks ───────────────────────────────────────────────────────────
function checkRow(row: WorkerRow, cols: InputCols, bankCompact: Set<string>): Finding[] {
  const out: Finding[] = [];
  const push = (field: string, code: string, message: string, severity: Severity = 'error') =>
    out.push({ rowNumber: row.rowNumber, field, code, message, severity });

  for (const [key, label] of REQUIRED_CORE) {
    if (isBlank(cell(row, cols, key))) push(key, 'MISSING', `Thiếu ${label}`);
  }

  // Bank/account section — validate ONLY when the worker actually has an account
  // (skip "CTY TẠO" + "0"/blank placeholders: those are deferred on purpose).
  if (!isBankPending(row.cells, cols)) {
    for (const [key, label] of REQUIRED_BANK) {
      if (isPlaceholder(cell(row, cols, key))) push(key, 'MISSING', `Thiếu ${label}`);
    }
    const nh = cell(row, cols, 'tenNH');
    if (bankCompact.size > 0 && !isBlank(nh) && !isKnownBank(nh, bankCompact))
      push('tenNH', 'UNKNOWN_BANK', `Tên ngân hàng không có trong danh mục: "${nh}"`, 'warn');
  }

  const sdt = cell(row, cols, 'soDienThoai');
  if (!isBlank(sdt) && !isPhone(sdt)) push('soDienThoai', 'BAD_PHONE', `SĐT sai định dạng: "${sdt}"`);

  const cccd = cell(row, cols, 'soCCCD');
  if (!isBlank(cccd) && !isCccd(cccd)) push('soCCCD', 'BAD_CCCD', `Số CCCD phải 12 số: "${cccd}"`);

  for (const [key, label] of [['ngaySinh', 'Ngày sinh'], ['ngayVaoLam', 'Ngày vào làm']] as const) {
    const v = cell(row, cols, key);
    if (!isBlank(v) && !parseDmy(v)) push(key, 'BAD_DATE', `${label} sai định dạng dd/MM/yyyy: "${v}"`);
  }

  return out;
}

// ── Duplicate detection across the batch ─────────────────────────────────────
function dupFindings(rows: WorkerRow[], cols: InputCols): Finding[] {
  const out: Finding[] = [];
  // Per-field key normalizer: numeric ids compare by digits (ignore spacing/
  // punctuation); Mã NS is alphanumeric so it compares by the full trimmed string
  // — digits alone would falsely collide e.g. "BSV123" with "XYZ123".
  const specs: Array<[keyof typeof COL, string, string, (v: string) => string]> = [
    ['soCCCD', 'DUP_CCCD', 'Số CCCD', digits], ['soDienThoai', 'DUP_PHONE', 'SĐT', digits],
    ['soTK', 'DUP_STK', 'Số tài khoản', digits], ['maNS', 'DUP_MANS', 'Mã NS', norm],
  ];
  for (const [key, code, label, keyOf] of specs) {
    const seen = new Map<string, number[]>();
    for (const r of rows) {
      const v = cell(r, cols, key);
      if (isPlaceholder(v)) continue; // never dedupe "0"/blank — they mean "not filled", not a shared value
      const k = keyOf(v) || norm(v);
      const arr = seen.get(k);
      if (arr) arr.push(r.rowNumber);
      else seen.set(k, [r.rowNumber]);
    }
    for (const [, nums] of seen) {
      if (nums.length < 2) continue;
      for (const n of nums)
        out.push({ rowNumber: n, field: key, code, message:
          `${label} trùng với dòng ${nums.filter((x) => x !== n).join(', ')}`, severity: 'error' });
    }
  }
  return out;
}

/**
 * Cross-row duplicate findings grouped by row number, computed over the WHOLE
 * dataset (all rows, checked or not) — so duplicates spanning read-chunks or
 * matching an already-checked row are caught. Pure.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_scan_new — sheet-wide duplicate pass before per-chunk validation
 */
export function duplicateFindingsByRow(
  rows: WorkerRow[],
  cols: InputCols = COL as InputCols,
): Map<number, Finding[]> {
  const map = new Map<number, Finding[]>();
  for (const f of dupFindings(rows, cols)) {
    const arr = map.get(f.rowNumber);
    if (arr) arr.push(f);
    else map.set(f.rowNumber, [f]);
  }
  return map;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Map a raw 2D cell matrix (as returned by a sheets read of A{first}:AL{last})
 * into WorkerRow[] carrying absolute 1-based sheet row numbers.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_validate_rows tool — pre-maps agent-supplied values
 */
export function mapSheetRows(values: string[][], firstRowNumber: number): WorkerRow[] {
  return values.map((cells, i) => ({ rowNumber: firstRowNumber + i, cells: cells ?? [] }));
}

/**
 * Validate onboarding rows: completeness, format, bank cross-check, and
 * cross-row duplicate detection. Pure — no I/O.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_validate_rows tool — core check the agent invokes
 */
export function validateRows(rows: WorkerRow[], opts: ValidateOptions = {}): ValidateResult {
  const skipChecked = opts.skipChecked ?? true;
  const cols = opts.cols ?? (COL as InputCols);
  const bankCompact = new Set((opts.bankNames ?? []).map(compactBank).filter((k) => k.length >= 2));

  // Skip only when an explicit "last checked" column is given (the agent's own
  // column) and it is non-blank. Never falls back to a human-owned column.
  const active = rows.filter((r) => {
    if (skipChecked && opts.checkedColIndex !== undefined) {
      return isBlank((r.cells[opts.checkedColIndex] ?? '').trim());
    }
    return true;
  });
  const perRow = new Map<number, Finding[]>();
  for (const r of active) perRow.set(r.rowNumber, checkRow(r, cols, bankCompact));
  if (opts.dupByRow) {
    // Sheet-wide duplicates precomputed over ALL rows; attach to the active ones.
    for (const r of active) {
      const dups = opts.dupByRow.get(r.rowNumber);
      if (dups) perRow.get(r.rowNumber)!.push(...dups);
    }
  } else {
    for (const f of dupFindings(active, cols)) perRow.get(f.rowNumber)!.push(f);
  }

  const results: RowResult[] = active.map((r) => {
    const findings = perRow.get(r.rowNumber) ?? [];
    const note = findings.map((f) => f.message).join('; ');
    return { rowNumber: r.rowNumber, ten: cell(r, cols, 'hoTen'), findings, note, ok: findings.length === 0 };
  });

  const findings = results.flatMap((r) => r.findings);
  const clean = results.filter((r) => r.ok).length;
  return { results, findings, checked: results.length, clean, flagged: results.length - clean };
}

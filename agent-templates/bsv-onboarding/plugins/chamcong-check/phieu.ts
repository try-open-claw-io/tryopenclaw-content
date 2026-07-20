/**
 * Pure helpers for the "PHIẾU TIẾP NHẬN CÔNG NHÂN" cross-check: parse the vision
 * model's JSON reply for the reception-form fields, and compare them against the
 * values typed into the sheet. No I/O — unit-tested in isolation.
 *
 * Unlike the CCCD MRZ (which has a check digit), the form has no self-check, so
 * comparisons are deliberately lenient: numeric ids compare by digits only,
 * names diacritic-insensitively, and bank/branch/salary-type by containment —
 * to flag genuine data-entry errors without drowning the operator in
 * formatting-only false positives.
 */

import { normalizeVn } from './cccd';
import { digits, isBankCreateSentinel, isPlaceholder } from './validate';

export interface PhieuFields {
  hoTen?:     string;
  tenTK?:     string;
  soTK?:      string;
  tenNH?:     string;
  chiNhanh?:  string;
  mucLuong?:  string;
  loaiLuong?: string;
}

export interface PhieuMismatch {
  field:   string;   // canonical sheet field key
  sheet:   string;   // value typed in the sheet
  card:    string;   // value read from the phiếu image
  message: string;   // Vietnamese, ready for the note column
}

// ── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parse the vision reply into PhieuFields. Accepts a JSON object embedded
 * anywhere in the text (the model may wrap it in prose or code fences).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_phieu — parses each rendered page's describe output
 */
export function parsePhieuJson(text: string): PhieuFields {
  const raw = text ?? '';
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return {};
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return {};
  }
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
    return undefined;
  };
  const out: PhieuFields = {};
  const set = (key: keyof PhieuFields, ...keys: string[]) => {
    const v = pick(...keys);
    if (v) out[key] = v;
  };
  set('hoTen', 'ho_ten', 'hoTen', 'ten', 'name');
  set('tenTK', 'ten_tai_khoan', 'tenTaiKhoan', 'tenTK', 'chu_tai_khoan');
  set('soTK', 'so_tai_khoan', 'soTaiKhoan', 'soTK', 'stk');
  set('tenNH', 'ten_ngan_hang', 'tenNganHang', 'tenNH', 'ngan_hang', 'bank');
  set('chiNhanh', 'chi_nhanh', 'chiNhanh', 'branch');
  set('mucLuong', 'muc_luong', 'mucLuong', 'luong', 'salary');
  set('loaiLuong', 'loai_luong', 'loaiLuong');
  return out;
}

// ── Merge (multi-page forms) ─────────────────────────────────────────────────

/**
 * Merge per-page parse results into one PhieuFields; first non-empty value for
 * each field wins (a field is usually printed once, on whichever page holds it).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_phieu — merges every rendered page's fields
 */
export function mergePhieu(pages: PhieuFields[]): PhieuFields {
  const out: PhieuFields = {};
  for (const p of pages) {
    for (const key of Object.keys(p) as Array<keyof PhieuFields>) {
      if (!out[key] && p[key]) out[key] = p[key];
    }
  }
  return out;
}

// ── Comparison ───────────────────────────────────────────────────────────────

/**
 * Compare phiếu-image fields against the sheet's typed values. Only compares
 * fields present on BOTH sides.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_phieu — produces mismatches to write into the note column
 */
export function comparePhieu(sheet: PhieuFields, form: PhieuFields): PhieuMismatch[] {
  const out: PhieuMismatch[] = [];
  // Bank/account is deferred when the sheet marks it "company will create".
  const bankPending = isBankCreateSentinel(sheet.tenNH ?? '');
  const add = (field: string, s: string, c: string, label: string) =>
    out.push({ field, sheet: s, card: c, message: `${label}: nhập "${s}" ≠ trên phiếu "${c}"` });

  // Compare a field ONLY when the sheet holds a real value (not a "0"/blank
  // placeholder) and — for bank fields — the bank section isn't deferred. This
  // stops meaningless "nhập '0' ≠ phiếu '…'" flags on not-yet-filled fields.
  const cmp = (key: keyof PhieuFields, bank: boolean, label: string, mismatch: (s: string, c: string) => boolean) => {
    const s = sheet[key], c = form[key];
    if (!s || !c || isPlaceholder(s) || (bank && bankPending)) return;
    if (mismatch(s, c)) add(key, s, c, label);
  };
  const numDiff = (s: string, c: string) => digits(s) !== digits(c);
  const nameDiff = (s: string, c: string) => normalizeVn(s) !== normalizeVn(c);
  const looseDiff = (s: string, c: string) => {
    // Flag only when neither side contains the other's normalized form (e.g.
    // "VCB" vs "Vietcombank" differ but aren't necessarily wrong).
    const ns = normalizeVn(s), nc = normalizeVn(c);
    return ns !== nc && !ns.includes(nc) && !nc.includes(ns);
  };

  cmp('soTK', true, 'Số TK', numDiff);
  cmp('mucLuong', false, 'Mức lương', numDiff);
  cmp('hoTen', false, 'Họ tên', nameDiff);
  cmp('tenTK', true, 'Tên TK', nameDiff);
  cmp('tenNH', true, 'Tên NH', looseDiff);
  cmp('chiNhanh', true, 'Chi nhánh', looseDiff);
  cmp('loaiLuong', false, 'Loại lương', looseDiff);
  return out;
}

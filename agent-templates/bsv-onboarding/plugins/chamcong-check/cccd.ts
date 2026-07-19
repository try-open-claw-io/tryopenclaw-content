/**
 * Pure helpers for the CCCD image cross-check: extract a Drive file id from a
 * cell URL, parse the vision model's JSON reply, and compare the card fields
 * against what was typed into the sheet. No I/O — unit-tested in isolation.
 */

export interface CccdFields {
  cccd?:     string;
  hoTen?:    string;
  ngaySinh?: string;
  gioiTinh?: string;
  ngayCap?:  string;
  noiCap?:   string;
}

export interface CccdMismatch {
  field:   string;   // canonical sheet field key
  sheet:   string;   // value typed in the sheet
  card:    string;   // value read from the CCCD image
  message: string;   // Vietnamese, ready for column X
}

// ── Normalisation ────────────────────────────────────────────────────────────
const DIACRITICS: Array<[RegExp, string]> = [
  [/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a"], [/[èéẹẻẽêềếệểễ]/g, "e"], [/[ìíịỉĩ]/g, "i"],
  [/[òóọỏõôồốộổỗơờớợởỡ]/g, "o"], [/[ùúụủũưừứựửữ]/g, "u"], [/[ỳýỵỷỹ]/g, "y"], [/đ/g, "d"],
];

/** Lowercase, strip Vietnamese diacritics, collapse whitespace. */
export function normalizeVn(s: string): string {
  let out = (s ?? "").toLowerCase();
  for (const [re, ch] of DIACRITICS) out = out.replace(re, ch);
  return out.replace(/\s+/g, " ").trim();
}

function digitsOnly(s: string): string {
  return (s ?? "").replace(/\D/g, "");
}

/** dd/MM/yyyy → normalized "d/m/yyyy" digits key, or "" if unparseable. */
function dateKey(s: string): string {
  const m = (s ?? "").match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})/);
  return m ? `${Number(m[1])}/${Number(m[2])}/${m[3]}` : "";
}

// ── Parsing ──────────────────────────────────────────────────────────────────

/** Extract a Google Drive file id from a cell value (open?id=… or /d/… or bare id). */
export function extractFileId(url: string): string | null {
  const v = (url ?? "").trim();
  if (!v) return null;
  const byQuery = v.match(/[?&]id=([\w-]+)/);
  if (byQuery) return byQuery[1];
  const byPath = v.match(/\/d\/([\w-]+)/);
  if (byPath) return byPath[1];
  if (/^[\w-]{20,}$/.test(v)) return v;
  return null;
}

/**
 * Parse the vision model reply into CccdFields. Accepts a JSON object embedded
 * anywhere in the text (the model may wrap it in prose or code fences).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_cccd — parses front/back describe output
 */
export function parseCccdJson(text: string): CccdFields {
  const raw = text ?? "";
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return {};
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return {};
  }
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const val = obj[k];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
    return undefined;
  };
  const out: CccdFields = {};
  const set = (key: keyof CccdFields, ...keys: string[]) => {
    const v = pick(...keys);
    if (v) out[key] = v;
  };
  set("cccd", "cccd", "so_cccd", "soCccd", "so_can_cuoc");
  set("hoTen", "ho_ten", "hoTen", "ten", "name");
  set("ngaySinh", "ngay_sinh", "ngaySinh", "dob");
  set("gioiTinh", "gioi_tinh", "gioiTinh", "sex");
  set("ngayCap", "ngay_cap", "ngayCap", "issue_date");
  set("noiCap", "noi_cap", "noiCap", "issue_place");
  return out;
}

function mrzCharValue(ch: string): number {
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 55; // A=10 … Z=35
  return 0; // '<' filler and anything else
}

/** ICAO 9303 check digit for an MRZ field (weights 7,3,1 repeating). */
export function mrzCheckDigit(field: string): number {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < field.length; i++) sum += mrzCharValue(field[i]) * weights[i % 3];
  return sum % 10;
}

/**
 * Parse a Vietnamese CCCD TD1 machine-readable zone (3 lines) into structured
 * fields. Deterministic — the MRZ is high-contrast OCR-B and the model reads it
 * reliably even when it refuses to "extract ID info" from the printed side.
 *
 * A misread is caught by the DOB check digit: on mismatch we return {} so the
 * caller re-reads. This makes the LLM-as-OCR read effectively deterministic for
 * the date-of-birth field (the one that catches transcription errors).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_cccd — reads CCCD/DOB/name from the back MRZ
 */
export function parseMrz(text: string): CccdFields {
  const lines = (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/\s/g, "").toUpperCase())
    .filter((l) => l.length >= 10);
  if (lines.length === 0) return {};
  const out: CccdFields = {};

  // Line 1 packs <CMND-9><check><CCCD-12> then `<` filler; the CCCD is the
  // 12-digit group immediately before the filler (NOT the first 12 digits).
  const line1 = lines.find((l) => /\d{12}/.test(l));
  if (line1) {
    const beforeFiller = line1.match(/(\d{12})<+/);
    const runs = line1.match(/\d{12,}/g);
    if (beforeFiller) out.cccd = beforeFiller[1];
    else if (runs && runs.length) out.cccd = runs[runs.length - 1].slice(-12);
  }

  const line2 = lines.find((l) => /^\d{6}[0-9<][MF]/.test(l));
  const dob = line2?.match(/^(\d{2})(\d{2})(\d{2})([0-9<])([MF])/);
  let dobOk = true;
  if (dob) {
    const [, yy, mm, dd, chk, sex] = dob;
    // Check-digit backstop: a misread digit fails this → whole read discarded.
    if (chk !== "<" && mrzCheckDigit(yy + mm + dd) !== Number(chk)) {
      dobOk = false;
    } else {
      const year = Number(yy) <= 30 ? 2000 + Number(yy) : 1900 + Number(yy);
      out.ngaySinh = `${dd}/${mm}/${year}`;
      out.gioiTinh = sex === "M" ? "Nam" : "Nữ";
    }
  }

  // Name line = the remaining line (letters, not the numeric/MRZ-header lines).
  const line3 = lines.find((l) => l !== line1 && l !== line2 && /[A-Z]{2,}<</.test(l) && !/^\d/.test(l));
  const name = line3?.replace(/<+/g, " ").trim();
  if (name) out.hoTen = name;

  // A failed DOB check digit means the OCR read is corrupt — return nothing so
  // the caller retries rather than comparing against garbage.
  if (!dobOk) return {};
  return out;
}

// ── Comparison ───────────────────────────────────────────────────────────────

/**
 * Compare CCCD-image fields against the sheet's typed values. Only compares
 * fields present on BOTH sides. Number/date fields use exact keys; name uses
 * diacritic-insensitive match; place uses a loose containment check.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_cccd — produces mismatches to write into column X
 */
export function compareCccd(sheet: CccdFields, card: CccdFields): CccdMismatch[] {
  const out: CccdMismatch[] = [];
  const add = (field: string, s: string, c: string, label: string) =>
    out.push({ field, sheet: s, card: c, message: `${label}: nhập "${s}" ≠ trên CCCD "${c}"` });

  if (sheet.cccd && card.cccd && digitsOnly(sheet.cccd) !== digitsOnly(card.cccd))
    add("soCCCD", sheet.cccd, card.cccd, "Số CCCD");

  if (sheet.hoTen && card.hoTen && normalizeVn(sheet.hoTen) !== normalizeVn(card.hoTen))
    add("hoTen", sheet.hoTen, card.hoTen, "Họ tên");

  if (sheet.ngaySinh && card.ngaySinh && dateKey(sheet.ngaySinh) !== dateKey(card.ngaySinh))
    add("ngaySinh", sheet.ngaySinh, card.ngaySinh, "Ngày sinh");

  if (sheet.ngayCap && card.ngayCap && dateKey(sheet.ngayCap) !== dateKey(card.ngayCap))
    add("ngayCap", sheet.ngayCap, card.ngayCap, "Ngày cấp");

  if (sheet.noiCap && card.noiCap) {
    // The national issuer name is the same for everyone and OCR often drops a
    // word ("Cảnh sát"); only flag when one side lacks the stable core token.
    const CORE = "hanh chinh";
    const s = normalizeVn(sheet.noiCap).includes(CORE);
    const c = normalizeVn(card.noiCap).includes(CORE);
    if (s !== c) add("noiCap", sheet.noiCap, card.noiCap, "Nơi cấp");
  }

  return out;
}

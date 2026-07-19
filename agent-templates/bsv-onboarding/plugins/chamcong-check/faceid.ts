/**
 * chamcong-check — pure eligibility + target resolution for HANET FaceID
 * registration. NO openclaw / network import here: unit-tested in isolation, like
 * validate.ts. The registered tool (index.ts) does the sheet/HTTP I/O and calls
 * decideRow() per row to decide register-or-skip.
 *
 * A worker is registered only when the manager has approved the row on the sheet
 * (a dedicated "Duyệt FaceID" column) AND the agent's own status is a passing one.
 */

// ── Diacritics-insensitive key normaliser (Công trình / department names) ──────
const DIA: Array<[RegExp, string]> = [
  [/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a'], [/[èéẹẻẽêềếệểễ]/g, 'e'], [/[ìíịỉĩ]/g, 'i'],
  [/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o'], [/[ùúụủũưừứựửữ]/g, 'u'], [/[ỳýỵỷỹ]/g, 'y'], [/đ/g, 'd'],
];

// Cell values meaning "not approved" (besides blank). Compared after normKey.
const NOT_APPROVED = new Set(['0', 'false', 'no', 'khong']);

/** Success prefix written into the agent's "KT · FaceID" column. */
export const DONE_PREFIX = 'Đã đăng ký';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface FaceIdConfig {
  /** Default owning place (HANET "Địa điểm sở hữu") when a Công trình isn't in placeMap. */
  placeId?:     string;
  /** Công trình (normKey) → placeID. Overrides placeId per site. */
  placeMap?:    Record<string, string>;
  /** Công trình (normKey) → departmentID (phòng ban: MEGA/CASA/SUNCASA/PHÚ QUỐC). Optional. */
  deptMap?:     Record<string, string>;
  /** HANET person type: "0" employee (default), "1" customer. */
  defaultType?: string;
}

export interface FaceIdCols {
  status:      number; // agent status column ("KT · Trạng thái"); -1 when absent
  duyet:       number; // manager approval column ("Duyệt FaceID")
  faceid:      number; // agent result column ("KT · FaceID")
  daTaoFaceID: number; // human "Đã tạo Face ID" tracking column; -1 when absent
  hoTen:       number; // B
  maNS:        number; // AA
  congTrinh:   number; // K
  anhMat:      number; // T
  nhomCN:      number; // I (→ optional title)
}

export type SkipCode =
  | 'already_created' | 'already_done' | 'not_approved' | 'not_checked'
  | 'status_flagged' | 'no_image' | 'no_mans' | 'no_place';

export interface RegisterPlan {
  action:       'register';
  rowNumber:    number;
  aliasID:      string;
  name:         string;
  placeID:      string;
  departmentID?: string;
  type:         string;
  title?:       string;
  imageCell:    string; // raw col T (Drive link/id) — index.ts extracts fileId + downloads
}

export interface SkipPlan {
  action:    'skip';
  code:      SkipCode;
  message:   string;
  rowNumber: number;
}

export type RowPlan = RegisterPlan | SkipPlan;

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Lowercase, strip Vietnamese diacritics, collapse whitespace, trim. */
export function normKey(s: string): string {
  let out = (s ?? '').toLowerCase();
  for (const [re, ch] of DIA) out = out.replace(re, ch);
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Normalise a raw config map's KEYS through normKey so a Công trình from the
 * sheet ("Phú Quốc") matches an operator-entered key ("PHÚ QUỐC"). Values kept.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_register_faceid — builds FaceIdConfig from HanetConfig
 */
export function normalizeMap(map?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map ?? {})) out[normKey(k)] = v;
  return out;
}

/** A manager "tick": any non-blank marker except explicit falsey values. */
export function isApproved(v: string): boolean {
  const n = normKey(v);
  return n.length > 0 && !NOT_APPROVED.has(n);
}

/** True when the result column already holds a success entry (idempotency). */
export function isAlreadyRegistered(faceidCell: string): boolean {
  return (faceidCell ?? '').trim().startsWith(DONE_PREFIX);
}

/** Resolve the HANET target for a Công trình: placeMap → placeId fallback; deptMap optional. */
export function resolveTarget(congTrinh: string, cfg: FaceIdConfig): { placeID?: string; departmentID?: string } {
  const key = normKey(congTrinh);
  return {
    placeID:      cfg.placeMap?.[key] ?? cfg.placeId,
    departmentID: cfg.deptMap?.[key],
  };
}

/** The success write-back string for the "KT · FaceID" column. */
export function formatDone(personID: string, stamp: string): string {
  return `${DONE_PREFIX} · ${personID} · ${stamp}`;
}

/**
 * Decide whether one row should be registered on HANET. Pure — no I/O.
 * Precedence keeps the two EXPECTED skips (already-registered, not-approved) quiet
 * so a full-sheet scan doesn't report every unapproved row; the remaining skips
 * mean "approved but something's wrong" and are worth surfacing.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_register_faceid — per-row register/skip decision
 */
export function decideRow(
  rowNumber: number,
  cells: string[],
  cols: FaceIdCols,
  cfg: FaceIdConfig,
  passingStatuses: string[],
): RowPlan {
  const at = (i: number) => (i >= 0 ? (cells[i] ?? '').trim() : '');
  const skip = (code: SkipCode, message: string): SkipPlan => ({ action: 'skip', code, message, rowNumber });

  // Existing worker: the human "Đã tạo Face ID" column is already filled (Hoàn thành
  // / Bổ sung lại ảnh) → the agent leaves it alone. Only blank rows (new) are in scope.
  if (at(cols.daTaoFaceID)) return skip('already_created', 'Đã tạo Face ID (người quản đánh dấu)');
  if (isAlreadyRegistered(at(cols.faceid))) return skip('already_done', 'Đã đăng ký trước đó');
  if (!isApproved(at(cols.duyet))) return skip('not_approved', 'Chưa duyệt (cột Duyệt FaceID)');

  const status = at(cols.status);
  if (!status) return skip('not_checked', 'Chưa kiểm tra (chưa có trạng thái)');
  if (!passingStatuses.includes(status)) return skip('status_flagged', `Trạng thái "${status}" chưa đạt`);

  const imageCell = at(cols.anhMat);
  if (!imageCell) return skip('no_image', 'Thiếu ảnh khuôn mặt (cột T)');

  const aliasID = at(cols.maNS);
  if (!aliasID) return skip('no_mans', 'Thiếu Mã NS (aliasID)');

  const congTrinh = at(cols.congTrinh);
  const { placeID, departmentID } = resolveTarget(congTrinh, cfg);
  if (!placeID) return skip('no_place', `Chưa cấu hình placeID cho Công trình "${congTrinh}"`);

  return {
    action: 'register',
    rowNumber,
    aliasID,
    name: at(cols.hoTen),
    placeID,
    departmentID,
    type: cfg.defaultType ?? '0',
    title: at(cols.nhomCN) || undefined,
    imageCell,
  };
}

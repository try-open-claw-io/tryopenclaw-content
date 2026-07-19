/**
 * chamcong-check report builder — pure. Turns a scan's totals + findings into the
 * 2D grids written to the "KT · Báo cáo" (overwrite) and "KT · Lịch sử" (append)
 * tabs. NO openclaw/connector import here — unit-tested in isolation.
 */

export const REPORT_TAB = "KT · Báo cáo";
export const HISTORY_TAB = "KT · Lịch sử";
export const HISTORY_HEADER = ["Thời điểm", "Đã kiểm", "Đủ đúng", "Cần sửa", "Tỷ lệ đạt"];

// field key → human label (matches validate.ts REQUIRED labels + a few extras).
const FIELD_LABEL: Record<string, string> = {
  hoTen: "Họ tên", soDienThoai: "SĐT", ngaySinh: "Ngày sinh", soCCCD: "Số CCCD",
  nhomCN: "Nhóm CN", congTrinh: "Công trình", ngayVaoLam: "Ngày vào làm",
  anhMat: "Ảnh mặt", cccdTruoc: "CCCD mặt trước", cccdSau: "CCCD mặt sau",
  tenTK: "Tên TK", soTK: "Số TK", tenNH: "Tên NH", maNS: "Mã NS",
  ngayCap: "Ngày cấp", noiCap: "Nơi cấp", gioiTinh: "Giới tính",
};

/** One error category (📷 Ảnh, 🔴 Trùng lặp, …) — distinct-worker count + per-type detail. */
export interface CategoryBreakdown {
  label:   string;   // e.g. "📷 Ảnh & giấy tờ"
  workers: number;   // DISTINCT rows in this category (a worker with 3 missing images counts once)
  types:   Array<{ label: string; count: number }>; // per-type finding counts, desc
}

export interface ReportData {
  stamp:     string;
  checked:   number;
  clean:     number;
  flagged:   number;
  breakdown: CategoryBreakdown[];
}

/** Human, groupable label for one finding (code + field). */
export function errorTypeLabel(code: string, field: string): string {
  switch (code) {
    case "MISSING":      return `Thiếu ${FIELD_LABEL[field] ?? field}`;
    case "BAD_PHONE":    return "SĐT sai định dạng";
    case "BAD_CCCD":     return "Số CCCD sai định dạng";
    case "BAD_DATE":     return `${FIELD_LABEL[field] ?? field} sai định dạng`;
    case "UNKNOWN_BANK": return "Ngân hàng không có trong danh mục";
    case "DUP_CCCD":     return "Trùng số CCCD";
    case "DUP_PHONE":    return "Trùng SĐT";
    case "DUP_STK":      return "Trùng số tài khoản";
    case "DUP_MANS":     return "Trùng Mã NS";
    default:             return code;
  }
}

// Workflow-area categories (evaluated in order; the last is the catch-all).
// Grouping the flat error types by WHO fixes them makes the report scannable.
const CATEGORIES: Array<{ label: string; match: (code: string, field: string) => boolean }> = [
  { label: "📷 Ảnh & giấy tờ",       match: (c, f) => c === "MISSING" && (f === "anhMat" || f === "cccdTruoc" || f === "cccdSau") },
  { label: "🔴 Trùng lặp (rà soát)", match: (c) => c.startsWith("DUP_") },
  { label: "🏦 Ngân hàng",           match: (c, f) => c === "UNKNOWN_BANK" || (c === "MISSING" && (f === "tenTK" || f === "soTK" || f === "tenNH")) },
  { label: "👤 Thông tin cá nhân",   match: () => true },
];

function categoryLabel(code: string, field: string): string {
  return (CATEGORIES.find((cat) => cat.match(code, field)) ?? CATEGORIES[CATEGORIES.length - 1]).label;
}

/**
 * Group findings into workflow categories. Each category reports the DISTINCT
 * number of rows (workers) it touches — NOT the finding count — so a worker who
 * misses 3 image fields counts once, plus the per-type detail underneath.
 * Categories sorted by worker count desc.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_scan_new — the report's error breakdown
 */
export function buildBreakdown(
  findings: Array<{ code: string; field: string; rowNumber: number }>,
): CategoryBreakdown[] {
  const byCat = new Map<string, { rows: Set<number>; types: Map<string, number> }>();
  for (const f of findings) {
    const label = categoryLabel(f.code, f.field);
    let entry = byCat.get(label);
    if (!entry) { entry = { rows: new Set(), types: new Map() }; byCat.set(label, entry); }
    entry.rows.add(f.rowNumber);
    const typeLabel = errorTypeLabel(f.code, f.field);
    entry.types.set(typeLabel, (entry.types.get(typeLabel) ?? 0) + 1);
  }
  return [...byCat.entries()]
    .map(([label, e]) => ({
      label,
      workers: e.rows.size,
      types: [...e.types.entries()]
        .map(([l, count]) => ({ label: l, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => b.workers - a.workers || a.label.localeCompare(b.label));
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";
}

/**
 * Build the "KT · Báo cáo" grid: title, TỔNG QUAN block, PHÂN LOẠI LỖI table.
 * Every row is normalized to 4 columns and padded to `padRows` rows so an
 * overwrite fully clears any longer prior report.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → writeScanReport() — the overwrite report body
 */
export function buildReportGrid(d: ReportData, padRows = 80): string[][] {
  const grid: string[][] = [
    ["📋 BÁO CÁO KIỂM TRA TIẾP NHẬN CÔNG NHÂN — BSV"],
    [`Cập nhật: ${d.stamp}`],
    [],
    ["TỔNG QUAN"],
    ["Đã kiểm", "Đủ đúng", "Cần sửa", "Tỷ lệ đạt"],
    [String(d.checked), String(d.clean), String(d.flagged), pct(d.clean, d.checked)],
    [],
    ["PHÂN LOẠI LỖI (số công nhân dính lỗi — 1 người có thể ở nhiều nhóm)"],
    ["Nhóm / loại lỗi", "Số CN", "Tỷ lệ"],
  ];
  if (d.breakdown.length === 0) {
    grid.push(["(không có lỗi trong lần này)"]);
  } else {
    for (const cat of d.breakdown) {
      grid.push([cat.label, String(cat.workers), pct(cat.workers, d.checked)]);
      for (const t of cat.types) grid.push([`   ${t.label}`, String(t.count), ""]);
    }
  }
  while (grid.length < padRows) grid.push([]);
  return grid.map((row) => [row[0] ?? "", row[1] ?? "", row[2] ?? "", row[3] ?? ""]);
}

/**
 * One appended run-history row (order matches HISTORY_HEADER).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → writeScanReport() — the appended history row
 */
export function buildHistoryRow(stamp: string, checked: number, clean: number, flagged: number): string[] {
  return [stamp, String(checked), String(clean), String(flagged), pct(clean, checked)];
}

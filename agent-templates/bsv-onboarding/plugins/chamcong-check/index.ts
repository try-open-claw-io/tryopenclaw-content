import { definePluginEntry } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";

import { compareCccd, extractFileId, parseCccdJson, parseMrz } from "./cccd";
import type { CccdFields } from "./cccd";
import { columnLetter, nowStampGmt7, resolveColumns, statusColorRules } from "./columns";
import type { ResolvedColumn, Rgb } from "./columns";
import { addConditionalFormatRule, addSheetTab, appendColumns, downloadDriveFile, getSheetGrid, getSheetIdsByTitle, loadConnectorConfig, loadHanetConfig, loadSheetConfig, loadVisionModel, readSheetValues, saveHanetConfig, saveSheetConfig, writeCells } from "./connector";
import { buildBreakdown, buildHistoryRow, buildReportGrid, HISTORY_HEADER, HISTORY_TAB, REPORT_TAB } from "./report";
import type { ReportData } from "./report";
import type { ConnectorConfig, FetchFn, HanetConfig } from "./connector";
import { parseFaceBox, prepareFaceImage } from "./face-image";
import { decideRow, formatDone, normalizeMap, normKey } from "./faceid";
import type { FaceIdCols, FaceIdConfig, RowPlan } from "./faceid";
import { getAccessToken, getDepartments, getPlaces, mapReturnCode, registerPerson } from "./hanet";
import { COL, duplicateFindingsByRow, mapSheetRows, resolveInputCols, validateRows } from "./validate";
import type { Finding, InputCols } from "./validate";
import { parseRotationCw, renderPdfToPngs } from "./pdf-render";
import { comparePhieu, mergePhieu, parsePhieuJson } from "./phieu";
import type { PhieuFields } from "./phieu";
import { BACK_PRINTED_PROMPT, describeImage, FACE_BBOX_PROMPT, MRZ_PROMPT, ORIENTATION_PROMPT, PHIEU_PROMPT } from "./vision";

// ── Sheet defaults ───────────────────────────────────────────────────────────
// The target spreadsheet is NEVER hardcoded — it is configured per-agent at
// first-run via chamcong_set_sheet (bootstrap). Only the tab names default here
// (the BSV sheet uses these); resolveSpreadsheetId returns null until configured.
const DATA_TAB = "THÔNG TIN CÔNG NHÂN ALL";
const BANK_TAB = "Bank";
const MAX_ROWS = 200;
const AL_INDEX = 37; // last data column (AL) of the source sheet

// ── The agent's OWN output columns ───────────────────────────────────────────
// This agent NEVER writes into the human-owned columns. It creates its own
// columns at the end of the sheet (matched/created by these header names).
const COL_STATUS = "KT · Trạng thái";
const COL_NOTE = "KT · Ghi chú";
const COL_TIME = "KT · Kiểm lúc";
const AGENT_HEADERS = [COL_STATUS, COL_NOTE, COL_TIME];
const OK_STATUS = "OK";
const FLAG_STATUS = "Cần sửa";
const CCCD_FLAG_STATUS = "CCCD lệch";
// Phiếu is a REFERENCE read (handwritten scan, imperfect OCR) — statuses signal
// "auto, verify by hand", never an authoritative verdict.
const PHIEU_FLAG_STATUS = "Phiếu? (kiểm tay)";
const PHIEU_OK_STATUS = "Phiếu✓ (auto)";
// Status value → background color for the status column's conditional-format rules.
const STATUS_COLORS: Array<{ value: string; bg: Rgb }> = [
  { value: OK_STATUS,         bg: { red: 0.718, green: 0.882, blue: 0.804 } }, // green
  { value: FLAG_STATUS,       bg: { red: 0.957, green: 0.800, blue: 0.800 } }, // red
  { value: CCCD_FLAG_STATUS,  bg: { red: 0.988, green: 0.898, blue: 0.804 } }, // orange
  { value: PHIEU_FLAG_STATUS, bg: { red: 0.816, green: 0.878, blue: 0.965 } }, // blue
  { value: PHIEU_OK_STATUS,   bg: { red: 0.851, green: 0.918, blue: 0.827 } }, // pale green
];

// This template's agent id — used to resolve the model for the vision read. NOT
// a model: the model is never hardcoded — an optional per-instance `visionModel`
// override wins, else this agent's chat model (see loadVisionModel).
const AGENT_ID = "bsv-onboarding";

// ── HANET FaceID registration ────────────────────────────────────────────────
const COL_FACEID = "KT · FaceID";      // agent's result column (created if absent)
const DUYET_HEADER = "Duyệt FaceID";   // manager's approval column (header created; cells never written by agent)
const HANET_DEFAULT_BASE = "https://partner.hanet.ai";
// A row is eligible for registration only when the agent's status is a passing one.
const FACEID_PASSING = [OK_STATUS, PHIEU_OK_STATUS];

interface AgentCols {
  status: ResolvedColumn;
  note:   ResolvedColumn;
  time:   ResolvedColumn;
}

interface SheetLayout {
  agent: AgentCols;
  input: InputCols;
}

/**
 * Read the header row ONCE and resolve both the agent's own output columns
 * (create-if-absent) and the input columns (matched by header name — robust to
 * column reorder).
 */
async function resolveLayout(cfg: ConnectorConfig, spreadsheetId: string): Promise<SheetLayout> {
  const header = (await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!1:1`))[0] ?? [];
  const m = resolveColumns(header, AGENT_HEADERS);
  return {
    agent: { status: m.get(COL_STATUS)!, note: m.get(COL_NOTE)!, time: m.get(COL_TIME)! },
    input: resolveInputCols(header),
  };
}

/**
 * Resolve the target sheet id: explicit arg → saved config. NO hardcoded
 * default — when unconfigured this returns null so the caller returns need_sheet
 * and the agent asks the operator for the Google Sheet link (bootstrap flow).
 */
function resolveSpreadsheetId(argId?: string): string | null {
  if (argId && argId.trim()) return argId.trim();
  return loadSheetConfig()?.spreadsheetId ?? null;
}

function agentColsAdjacent(c: AgentCols): boolean {
  return c.note.index === c.status.index + 1 && c.time.index === c.status.index + 2;
}

/** Write the agent's column headers (once) if the columns were newly created. */
async function ensureAgentHeaders(cfg: ConnectorConfig, spreadsheetId: string, c: AgentCols): Promise<void> {
  if (!c.status.created && !c.note.created && !c.time.created) return;

  // Fetch the grid once — used to (1) pre-size before writing so the connector's
  // BATCH_UPDATE doesn't pad +10 buffer columns on expansion, and (2) color the
  // status column. Both are best-effort; header/row writes proceed regardless.
  const grid = await getSheetGrid(cfg, spreadsheetId, DATA_TAB).catch(() => null);
  if (grid && grid.columnCount < c.time.index + 1) {
    try { await appendColumns(cfg, spreadsheetId, grid.sheetId, c.time.index + 1 - grid.columnCount); } catch { /* fall back to expand-on-write */ }
  }

  if (c.status.created && c.note.created && c.time.created && agentColsAdjacent(c)) {
    await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.status.letter}1`, [[c.status.header, c.note.header, c.time.header]]);
  } else {
    if (c.status.created) await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.status.letter}1`, [[c.status.header]]);
    if (c.note.created) await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.note.letter}1`, [[c.note.header]]);
    if (c.time.created) await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.time.letter}1`, [[c.time.header]]);
  }

  // Color the status column by value (OK green / Cần sửa red / CCCD lệch orange)
  // so operators distinguish rows at a glance. Cosmetic → best-effort.
  if (grid && c.status.created) {
    try {
      for (const rule of statusColorRules(grid.sheetId, c.status.index, grid.rowCount, STATUS_COLORS)) {
        await addConditionalFormatRule(cfg, spreadsheetId, grid.sheetId, rule);
      }
    } catch { /* colors are cosmetic; ignore failures */ }
  }
}

/** Write one row's status + note + timestamp into the agent's columns. */
async function writeAgentRow(
  cfg: ConnectorConfig, spreadsheetId: string, c: AgentCols,
  row: number, status: string, note: string, stamp: string,
): Promise<void> {
  if (agentColsAdjacent(c)) {
    await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.status.letter}${row}`, [[status, note, stamp]]);
  } else {
    await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.status.letter}${row}`, [[status]]);
    await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.note.letter}${row}`, [[note]]);
    await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.time.letter}${row}`, [[stamp]]);
  }
}

/**
 * Batch-write many rows into the agent's columns, coalescing CONTIGUOUS row runs
 * into a single BATCH_UPDATE each (Sheets allows only ~60 writes/min — one write
 * per row would blow the limit on a large scan).
 */
export interface AgentEntry {
  row:    number;
  status: string;
  note:   string;
}
async function writeAgentRowsBatch(
  cfg: ConnectorConfig, spreadsheetId: string, c: AgentCols, entries: AgentEntry[], stamp: string,
): Promise<{ wrote: number; err: number }> {
  const sorted = entries.slice().sort((a, b) => a.row - b.row);
  let wrote = 0;
  let err = 0;
  if (!agentColsAdjacent(c)) {
    for (const e of sorted) {
      try { await writeAgentRow(cfg, spreadsheetId, c, e.row, e.status, e.note, stamp); wrote++; } catch { err++; }
    }
    return { wrote, err };
  }
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1].row === sorted[j].row + 1) j++;
    const block = sorted.slice(i, j + 1).map((e) => [e.status, e.note, stamp]);
    try {
      await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.status.letter}${sorted[i].row}`, block);
      wrote += block.length;
    } catch {
      err += block.length;
    }
    i = j + 1;
  }
  return { wrote, err };
}

/** Resolve a tab's gid, creating it first when missing. */
async function ensureTabGid(cfg: ConnectorConfig, spreadsheetId: string, title: string, known: Map<string, number>): Promise<number | undefined> {
  const gid = known.get(title);
  if (gid !== undefined) return gid;
  await addSheetTab(cfg, spreadsheetId, title);
  return (await getSheetGrid(cfg, spreadsheetId, title))?.sheetId;
}

/**
 * Write the scan report: overwrite the "KT · Báo cáo" tab (summary + error
 * breakdown) and append one row to the "KT · Lịch sử" tab. Both tabs are created
 * if missing. Returns clickable deep links (`…/edit#gid=<id>`) to each tab.
 */
async function writeScanReport(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  data: ReportData,
): Promise<{ reportUrl: string; historyUrl: string }> {
  const tabIds = await getSheetIdsByTitle(cfg, spreadsheetId);

  const reportGid = await ensureTabGid(cfg, spreadsheetId, REPORT_TAB, tabIds);
  await writeCells(cfg, spreadsheetId, REPORT_TAB, "A1", buildReportGrid(data));

  const historyGid = await ensureTabGid(cfg, spreadsheetId, HISTORY_TAB, tabIds);
  let rows = await readSheetValues(cfg, spreadsheetId, `'${HISTORY_TAB}'!A1:A100000`);
  if (rows.length === 0) {
    await writeCells(cfg, spreadsheetId, HISTORY_TAB, "A1", [HISTORY_HEADER]);
    rows = [HISTORY_HEADER];
  }
  await writeCells(cfg, spreadsheetId, HISTORY_TAB, `A${rows.length + 1}`,
    [buildHistoryRow(data.stamp, data.checked, data.clean, data.flagged)]);

  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  return {
    reportUrl: reportGid !== undefined ? `${base}#gid=${reportGid}` : base,
    historyUrl: historyGid !== undefined ? `${base}#gid=${historyGid}` : base,
  };
}

interface CheckRangeArgs {
  firstRow: number;
  lastRow: number;
  skipChecked?: boolean;
  write?: boolean;
  spreadsheetId?: string;
}

function fail(text: string, error: string) {
  return { content: [{ type: "text", text: `⚠️ ${text}` }], details: { error } };
}

// Returned by every check tool when no sheet is configured yet. The agent must
// stop and ask the operator for the Google Sheet link (bootstrap), not guess.
const NEEDS_SHEET_MSG =
  "Chưa cấu hình Google Sheet cho agent này. Hãy hỏi người vận hành gửi link Google Sheet " +
  "(https://docs.google.com/spreadsheets/d/…) rồi gọi chamcong_set_sheet — sau đó mới kiểm tra được.";
function needSheet() {
  return fail(NEEDS_SHEET_MSG, "need_sheet");
}

/**
 * chamcong_check_range — the plugin reads the sheet itself (via the connector
 * MCP) so the agent only passes scalar row numbers. This avoids the unreliable
 * LLM marshaling of the 2D cell matrix as tool arguments.
 */
function createCheckRangeTool() {
  return {
    name: "chamcong_check_range",
    label: "Chấm công · kiểm tra khoảng dòng",
    description:
      "Đọc Google Sheet công nhân (qua connector) và kiểm tra đủ/đúng/trùng lặp các dòng từ firstRow đến lastRow. " +
      "Chỉ cần truyền firstRow và lastRow (số nguyên) — plugin tự đọc sheet + validate. " +
      "Nếu write=true, plugin GHI vào CỘT RIÊNG của agent (tạo mới cuối sheet, không đụng cột người dùng): " +
      "Trạng thái (OK/Cần sửa) + Ghi chú (chi tiết) + Kiểm lúc (timestamp). " +
      "Trả findings + note tiếng Việt. Tối đa 200 dòng/lần.",
    parameters: {
      type: "object" as const,
      properties: {
        firstRow: { type: "number", description: "Dòng bắt đầu (>=2; dòng 1 là tiêu đề)." },
        lastRow: { type: "number", description: "Dòng kết thúc (>= firstRow; tối đa firstRow+199)." },
        skipChecked: { type: "boolean", description: "Bỏ qua dòng đã có timestamp ở cột 'KT · Kiểm lúc' (mặc định true)." },
        write: { type: "boolean", description: "Ghi vào cột riêng của agent (Trạng thái/Ghi chú/Kiểm lúc). Mặc định false (chỉ báo cáo)." },
      },
      required: ["firstRow", "lastRow"] as string[],
    },
    // NOTE: OpenClaw invokes tool execute as (toolCallId, args, context, onPartial) —
    // the arguments object is the SECOND positional, not the first (arg0 is a string
    // tool-call id). Finding the first plain-object arg keeps this resilient if the
    // positional layout shifts across gateway versions.
    execute: async (...rest: unknown[]) => {
      const args = (rest.find((a) => a && typeof a === "object" && !Array.isArray(a)) ?? {}) as CheckRangeArgs;
      const first = Math.max(2, Math.floor(Number(args.firstRow)));
      const last = Math.floor(Number(args.lastRow));
      if (!Number.isFinite(first) || !Number.isFinite(last) || last < first) {
        return fail("Khoảng dòng không hợp lệ (cần 2 <= firstRow <= lastRow).", "bad_range");
      }
      const cappedLast = Math.min(last, first + MAX_ROWS - 1);
      const spreadsheetId = resolveSpreadsheetId(args.spreadsheetId);
      if (!spreadsheetId) return needSheet();

      let cfg;
      try {
        cfg = loadConnectorConfig();
      } catch (err) {
        return fail(`Không đọc được cấu hình connector: ${(err as Error).message}`, "no_connector");
      }

      // Resolve the agent's OWN columns (create-if-absent) up front — needed to
      // read wide enough to see its timestamp column and to skip on it.
      let layout: SheetLayout;
      try {
        layout = await resolveLayout(cfg, spreadsheetId);
      } catch (err) {
        return fail(`Không đọc được cấu trúc sheet: ${(err as Error).message}`, "header_failed");
      }
      const agentCols = layout.agent;
      const lastCol = columnLetter(Math.max(AL_INDEX, agentCols.time.index));

      let values: string[][];
      try {
        values = await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!A${first}:${lastCol}${cappedLast}`);
      } catch (err) {
        return fail(`Đọc sheet lỗi: ${(err as Error).message}`, "read_failed");
      }

      let bankNames: string[] = [];
      try {
        const bankRows = await readSheetValues(cfg, spreadsheetId, `'${BANK_TAB}'!A2:C400`);
        bankNames = bankRows.flat().filter((v) => v && v.trim().length > 0);
      } catch {
        bankNames = []; // bank cross-check is best-effort; a lookup failure must not block validation
      }

      const result = validateRows(mapSheetRows(values, first), {
        bankNames,
        skipChecked: args.skipChecked,
        checkedColIndex: agentCols.time.index, // skip on the agent's OWN timestamp column
        cols: layout.input,
      });

      // Write into the agent's OWN columns for EVERY checked row: status (OK/Cần sửa)
      // + note (details) + timestamp. NEVER touches the human-owned columns.
      let writeLine = "";
      if (args.write) {
        const stamp = nowStampGmt7(Date.now());
        let wrote = 0;
        let writeErr = 0;
        try {
          await ensureAgentHeaders(cfg, spreadsheetId, agentCols);
        } catch {
          // header create is best-effort; row writes still attempt below
        }
        for (const r of result.results) {
          try {
            await writeAgentRow(cfg, spreadsheetId, agentCols, r.rowNumber, r.ok ? OK_STATUS : FLAG_STATUS, r.note, stamp);
            wrote++;
          } catch {
            writeErr++;
          }
        }
        writeLine =
          `\n📝 Đã ghi cột riêng agent (${COL_STATUS}/${COL_NOTE}/${COL_TIME}) + thời điểm ${stamp} cho ${wrote}/${result.checked} dòng` +
          (writeErr ? `, ${writeErr} lỗi ghi` : "") + ".";
      }

      const flagged = result.results
        .filter((r) => !r.ok)
        .map((r) => `• Dòng ${r.rowNumber} (${r.ten || "?"}): ${r.note}`);
      const text =
        `Đã kiểm ${result.checked} dòng (${first}–${cappedLast}) — ${result.clean} sạch, ${result.flagged} cần sửa.` +
        (flagged.length ? "\n" + flagged.join("\n") : "") +
        writeLine;
      return { content: [{ type: "text", text }], details: { ...result, wrote: args.write ?? false } };
    },
  };
}

interface CheckCccdArgs {
  row: number;
  write?: boolean;
  spreadsheetId?: string;
}

/**
 * chamcong_check_cccd — cross-check the CCCD IMAGES (front col U + back col V)
 * against the typed sheet fields for one row. The plugin downloads the images
 * and reads them via OpenClaw's vision capability, so the agent only passes a
 * row number.
 */
function createCheckCccdTool() {
  return {
    name: "chamcong_check_cccd",
    label: "Chấm công · đối chiếu CCCD",
    description:
      "Đối chiếu thông tin trên ẢNH CCCD (mặt trước + sau) với dữ liệu đã nhập của MỘT dòng. " +
      "Chỉ cần truyền row (số dòng). Plugin tự tải ảnh cột U/V, đọc bằng vision, và so " +
      "Số CCCD / Họ tên / Ngày sinh / Ngày cấp / Nơi cấp. write=true để ghi kết quả vào cột riêng của agent.",
    parameters: {
      type: "object" as const,
      properties: {
        row: { type: "number", description: "Số dòng cần đối chiếu (>=2)." },
        write: { type: "boolean", description: "Ghi vào cột riêng của agent (Trạng thái/Ghi chú/Kiểm lúc). Mặc định false." },
      },
      required: ["row"] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = (rest.find((a) => a && typeof a === "object" && !Array.isArray(a)) ?? {}) as CheckCccdArgs;
      const row = Math.floor(Number(args.row));
      if (!Number.isFinite(row) || row < 2) return fail("Số dòng không hợp lệ (cần >=2).", "bad_row");
      const spreadsheetId = resolveSpreadsheetId(args.spreadsheetId);
      if (!spreadsheetId) return needSheet();

      let cfg;
      try {
        cfg = loadConnectorConfig();
      } catch (err) {
        return fail(`Không đọc được cấu hình connector: ${(err as Error).message}`, "no_connector");
      }

      let visionModel: string;
      try {
        visionModel = loadVisionModel(AGENT_ID); // visionModel override, else the agent's chat model
      } catch (err) {
        return fail(`Chưa cấu hình model để đọc ảnh CCCD: ${(err as Error).message}`, "no_model");
      }

      let layout: SheetLayout;
      try {
        layout = await resolveLayout(cfg, spreadsheetId);
      } catch (err) {
        return fail(`Không đọc được cấu trúc sheet: ${(err as Error).message}`, "header_failed");
      }

      let cells: string[];
      try {
        const vals = await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!A${row}:AL${row}`);
        cells = vals[0] ?? [];
      } catch (err) {
        return fail(`Đọc dòng lỗi: ${(err as Error).message}`, "read_failed");
      }
      if (cells.length === 0) return fail(`Dòng ${row} trống.`, "empty_row");

      const c = (k: keyof typeof COL) => (cells[layout.input[k]] ?? "").trim();
      // Read the BACK: the front is stochastically refused by the model, but the
      // back's MRZ (deterministic, check-digit) + printed issue fields are not.
      const backId = extractFileId(c("cccdSau"));
      if (!backId) return fail(`Dòng ${row} chưa có ảnh CCCD mặt sau (cột V) — cần MRZ để đối chiếu.`, "no_back_image");

      const card: CccdFields = {};
      let mrzRaw = "";
      let printedRaw = "";
      let mrzAttempts = 0;
      try {
        const backBytes = await downloadDriveFile(cfg, backId);
        // The model refuses the MRZ read stochastically; retry until it parses.
        for (mrzAttempts = 1; mrzAttempts <= 5 && !card.cccd; mrzAttempts++) {
          mrzRaw = await describeImage(backBytes, MRZ_PROMPT, visionModel);
          Object.assign(card, parseMrz(mrzRaw)); // cccd, ngaySinh, gioiTinh, hoTen (deterministic)
        }
        printedRaw = await describeImage(backBytes, BACK_PRINTED_PROMPT, visionModel);
        Object.assign(card, parseCccdJson(printedRaw)); // ngayCap, noiCap
      } catch (err) {
        return fail(`Đọc ảnh CCCD lỗi: ${(err as Error).message}`, "vision_failed");
      }
      if (!card.cccd) {
        return fail(`Không đọc được MRZ mặt sau dòng ${row} sau ${mrzAttempts - 1} lần thử (model từ chối). Cần kiểm tra tay hoặc dùng OCR chuyên dụng.`, "mrz_refused");
      }
      if (Object.keys(card).length === 0) return fail(`Không đọc được trường nào từ ảnh CCCD dòng ${row}.`, "no_fields");

      const sheetFields: CccdFields = {
        cccd: c("soCCCD"), hoTen: c("hoTen"), ngaySinh: c("ngaySinh"),
        gioiTinh: c("gioiTinh"), ngayCap: c("ngayCap"), noiCap: c("noiCap"),
      };
      const mismatches = compareCccd(sheetFields, card);

      let writeLine = "";
      if (args.write) {
        const status = mismatches.length ? CCCD_FLAG_STATUS : OK_STATUS;
        const note = mismatches.length ? mismatches.map((m) => m.message).join("; ") : "CCCD khớp";
        try {
          const agentCols = layout.agent;
          await ensureAgentHeaders(cfg, spreadsheetId, agentCols);
          await writeAgentRow(cfg, spreadsheetId, agentCols, row, status, note, nowStampGmt7(Date.now()));
          writeLine = "\n📝 Đã ghi cột riêng agent (Trạng thái/Ghi chú/Kiểm lúc) + thời điểm.";
        } catch (err) {
          writeLine = `\n⚠️ Ghi lỗi: ${(err as Error).message}`;
        }
      }

      const ten = c("hoTen") || "?";
      const text = mismatches.length
        ? `⚠️ Dòng ${row} (${ten}) — ${mismatches.length} điểm LỆCH giữa ảnh CCCD và dữ liệu nhập:\n` +
          mismatches.map((m) => `• ${m.message}`).join("\n") + writeLine
        : `✅ Dòng ${row} (${ten}) — dữ liệu nhập KHỚP với ảnh CCCD (đối chiếu ${Object.keys(card).length} trường).`;
      return { content: [{ type: "text", text }], details: { row, card, sheetFields, mismatches } };
    },
  };
}

interface CheckPhieuArgs {
  row: number;
  write?: boolean;
  spreadsheetId?: string;
}

/**
 * chamcong_check_phieu — cross-check the scanned "Phiếu tiếp nhận công nhân"
 * (column S, a PDF) against the typed sheet fields for one row. The plugin
 * downloads the PDF, rasterises its pages with mupdf (the forms are image-only
 * scans, no text layer), reads them via OpenClaw's vision capability, and
 * compares bank (holder/number/name/branch) + salary (amount/type) + name.
 */
function createCheckPhieuTool() {
  return {
    name: "chamcong_check_phieu",
    label: "Chấm công · đối chiếu Phiếu tiếp nhận",
    description:
      "Đọc FILE SCAN 'Phiếu tiếp nhận công nhân' (cột S, PDF) của MỘT dòng, tự xoay ảnh cho đứng, trích thông tin " +
      "ngân hàng (tên TK / số TK / tên NH / chi nhánh) + lương (mức / loại) + họ tên, rồi đối chiếu với sheet " +
      "(cột O/P/Q/R + M/N + B). KẾT QUẢ CHỈ THAM KHẢO — ảnh scan xoay/viết tay nên có thể đọc SAI (nhất là số TK); " +
      "cần người giám sát kiểm lại, KHÔNG khẳng định lệch thật. Chỉ cần truyền row. write=true để ghi cột riêng. " +
      "Mỗi lần 1 dòng (chậm vì render PDF + đọc ảnh).",
    parameters: {
      type: "object" as const,
      properties: {
        row: { type: "number", description: "Số dòng cần đối chiếu (>=2)." },
        write: { type: "boolean", description: "Ghi vào cột riêng của agent (Trạng thái/Ghi chú/Kiểm lúc). Mặc định false." },
      },
      required: ["row"] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = (rest.find((a) => a && typeof a === "object" && !Array.isArray(a)) ?? {}) as CheckPhieuArgs;
      const row = Math.floor(Number(args.row));
      if (!Number.isFinite(row) || row < 2) return fail("Số dòng không hợp lệ (cần >=2).", "bad_row");
      const spreadsheetId = resolveSpreadsheetId(args.spreadsheetId);
      if (!spreadsheetId) return needSheet();

      let cfg;
      try {
        cfg = loadConnectorConfig();
      } catch (err) {
        return fail(`Không đọc được cấu hình connector: ${(err as Error).message}`, "no_connector");
      }

      let visionModel: string;
      try {
        visionModel = loadVisionModel(AGENT_ID); // visionModel override, else the agent's chat model
      } catch (err) {
        return fail(`Chưa cấu hình model để đọc phiếu: ${(err as Error).message}`, "no_model");
      }

      let layout: SheetLayout;
      try {
        layout = await resolveLayout(cfg, spreadsheetId);
      } catch (err) {
        return fail(`Không đọc được cấu trúc sheet: ${(err as Error).message}`, "header_failed");
      }

      let cells: string[];
      try {
        const vals = await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!A${row}:AL${row}`);
        cells = vals[0] ?? [];
      } catch (err) {
        return fail(`Đọc dòng lỗi: ${(err as Error).message}`, "read_failed");
      }
      if (cells.length === 0) return fail(`Dòng ${row} trống.`, "empty_row");

      const c = (k: keyof typeof COL) => (cells[layout.input[k]] ?? "").trim();
      const phieuId = extractFileId(c("phieuScan"));
      if (!phieuId) return fail(`Dòng ${row} chưa có file scan phiếu (cột S).`, "no_phieu");

      const form: PhieuFields = {};
      try {
        const pdf = await downloadDriveFile(cfg, phieuId);
        // The scans are photographed at arbitrary orientations; a sideways image
        // makes the model hallucinate the handwritten fields. Detect the upright
        // rotation off page 1 (small render) before extracting at full res.
        const [probe] = await renderPdfToPngs(pdf, { maxPages: 1, scale: 2 });
        const rotateCw = probe ? parseRotationCw(await describeImage(probe, ORIENTATION_PROMPT, visionModel, "png")) : 0;
        const pages = await renderPdfToPngs(pdf, { rotateCw }); // upright PNG per page (mupdf, lazy-loaded)
        if (pages.length === 0) return fail(`Không render được phiếu dòng ${row} (PDF rỗng?).`, "render_failed");
        const parsed: PhieuFields[] = [];
        for (const png of pages) {
          const raw = await describeImage(png, PHIEU_PROMPT, visionModel, "png");
          parsed.push(parsePhieuJson(raw));
        }
        Object.assign(form, mergePhieu(parsed)); // first non-empty field across pages
      } catch (err) {
        return fail(`Đọc phiếu lỗi: ${(err as Error).message}`, "vision_failed");
      }
      if (Object.keys(form).length === 0) return fail(`Không đọc được trường nào từ phiếu dòng ${row}.`, "no_fields");

      const sheetFields: PhieuFields = {
        hoTen: c("hoTen"), tenTK: c("tenTK"), soTK: c("soTK"), tenNH: c("tenNH"),
        chiNhanh: c("chiNhanh"), mucLuong: c("mucLuong"), loaiLuong: c("loaiLuong"),
      };
      const mismatches = comparePhieu(sheetFields, form);

      // Phiếu OCR is a REFERENCE aid, not a verdict: the scans are handwritten +
      // photographed at odd angles, so any read can be wrong. The output always
      // says "tự động / tham khảo / cần người kiểm" so a supervisor verifies.
      const REF = "TỰ ĐỘNG đọc từ ảnh phiếu — CHỈ THAM KHẢO. Ảnh scan xoay/viết tay nên có thể đọc sai; người giám sát cần mở phiếu kiểm lại.";
      let writeLine = "";
      if (args.write) {
        const status = mismatches.length ? PHIEU_FLAG_STATUS : PHIEU_OK_STATUS;
        const note = (mismatches.length
          ? "Nghi lệch (tham khảo): " + mismatches.map((m) => m.message).join("; ")
          : "Có vẻ khớp (tham khảo)") + " — cần kiểm tay.";
        try {
          const agentCols = layout.agent;
          await ensureAgentHeaders(cfg, spreadsheetId, agentCols);
          await writeAgentRow(cfg, spreadsheetId, agentCols, row, status, note, nowStampGmt7(Date.now()));
          writeLine = "\n📝 Đã ghi cột riêng agent (tham khảo).";
        } catch (err) {
          writeLine = `\n⚠️ Ghi lỗi: ${(err as Error).message}`;
        }
      }

      const ten = c("hoTen") || form.hoTen || "?";
      const body = mismatches.length
        ? `⚠️ NGHI ${mismatches.length} điểm lệch (cần người kiểm xác nhận):\n` +
          mismatches.map((m) => `• ${m.message}`).join("\n")
        : `✅ Có vẻ khớp (đối chiếu ${Object.keys(form).length} trường) — vẫn nên kiểm mẫu.`;
      const text = `📄 Dòng ${row} (${ten}) — đối chiếu PHIẾU (tự động):\n${body}\n\nℹ️ ${REF}${writeLine}`;
      return { content: [{ type: "text", text }], details: { row, form, sheetFields, mismatches, reference: true } };
    },
  };
}

interface ScanArgs {
  write?: boolean;
  maxRows?: number;
  recheckAll?: boolean;
  spreadsheetId?: string;
}

/**
 * chamcong_scan_new — walk the WHOLE sheet in chunks, validate ONLY rows not yet
 * confirmed (no timestamp in the agent's "Kiểm lúc" column), batch-write results
 * into the agent's own columns, and return an at-a-glance SUMMARY. This is the
 * operator-facing entry point ("kiểm tra công nhân chưa xác nhận").
 */
function createScanNewTool() {
  return {
    name: "chamcong_scan_new",
    label: "Chấm công · quét công nhân chưa xác nhận",
    description:
      "Quét TOÀN BỘ sheet, mặc định chỉ kiểm các dòng CHƯA xác nhận (chưa có timestamp ở cột 'KT · Kiểm lúc'); " +
      "đặt recheckAll=true để kiểm LẠI cả những dòng đã xác nhận. Kiểm tra TRÙNG LẶP (CCCD/SĐT/Số TK/Mã NS) chạy " +
      "trên TOÀN sheet (không chỉ trong từng chunk). Ghi kết quả vào cột riêng của agent (write mặc định true), " +
      "cập nhật tab báo cáo + lịch sử, và trả về BÁO CÁO TÓM TẮT. Tự chia chunk 200 dòng, gộp ghi để không vượt " +
      "rate-limit. maxRows giới hạn số dòng kiểm mỗi lần (mặc định 2000).",
    parameters: {
      type: "object" as const,
      properties: {
        write: { type: "boolean", description: "Ghi kết quả vào cột riêng của agent (mặc định true)." },
        maxRows: { type: "number", description: "Giới hạn số dòng kiểm mỗi lần (mặc định 2000, tối đa 2000)." },
        recheckAll: { type: "boolean", description: "Kiểm LẠI cả dòng đã xác nhận (mặc định false = bỏ qua dòng đã kiểm)." },
      },
      required: [] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = (rest.find((a) => a && typeof a === "object" && !Array.isArray(a)) ?? {}) as ScanArgs;
      const write = args.write ?? true;
      const recheckAll = args.recheckAll ?? false;
      const maxNew = Math.max(1, Math.min(Math.floor(Number(args.maxRows) || 2000), 2000));
      const spreadsheetId = resolveSpreadsheetId(args.spreadsheetId);
      if (!spreadsheetId) return needSheet();

      let cfg;
      try {
        cfg = loadConnectorConfig();
      } catch (err) {
        return fail(`Không đọc được cấu hình connector: ${(err as Error).message}`, "no_connector");
      }
      let layout: SheetLayout;
      try {
        layout = await resolveLayout(cfg, spreadsheetId);
      } catch (err) {
        return fail(`Không đọc được cấu trúc sheet: ${(err as Error).message}`, "header_failed");
      }
      const agentCols = layout.agent;
      const lastCol = columnLetter(Math.max(AL_INDEX, agentCols.time.index));

      let bankNames: string[] = [];
      try {
        const bankRows = await readSheetValues(cfg, spreadsheetId, `'${BANK_TAB}'!A2:C400`);
        bankNames = bankRows.flat().filter((v) => v && v.trim().length > 0);
      } catch {
        bankNames = [];
      }

      // Data extent = last row with a name (column B).
      let lastDataRow = 1;
      try {
        const nameCol = columnLetter(layout.input.hoTen);
        const names = await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!${nameCol}2:${nameCol}5000`);
        lastDataRow = 1 + names.length;
      } catch {
        return fail("Không xác định được số dòng dữ liệu.", "extent_failed");
      }

      if (write) {
        try { await ensureAgentHeaders(cfg, spreadsheetId, agentCols); } catch { /* best-effort */ }
      }
      const stamp = nowStampGmt7(Date.now());

      // Sheet-wide duplicate pass: read ALL rows' input columns once and compute
      // duplicates across the whole sheet (checked or not) — so a new row that
      // duplicates an already-checked row, or a duplicate spanning read-chunks, is
      // caught. Best-effort: on failure, per-chunk dup detection remains.
      let dupByRow: Map<number, Finding[]> | undefined;
      if (lastDataRow >= 2) {
        try {
          const allValues = await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!A2:AL${lastDataRow}`);
          dupByRow = duplicateFindingsByRow(mapSheetRows(allValues, 2), layout.input);
        } catch { dupByRow = undefined; }
      }

      let totalChecked = 0;
      let totalClean = 0;
      let totalWriteErr = 0;
      const flagged: Array<{ row: number; ten: string; note: string }> = [];
      const allFindings: Array<{ code: string; field: string; rowNumber: number }> = [];

      let firstRow = 2;
      while (firstRow <= lastDataRow && totalChecked < maxNew) {
        const lastRow = Math.min(firstRow + MAX_ROWS - 1, lastDataRow);
        let values: string[][];
        try {
          values = await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!A${firstRow}:${lastCol}${lastRow}`);
        } catch {
          firstRow = lastRow + 1;
          continue;
        }
        const result = validateRows(mapSheetRows(values, firstRow), {
          bankNames,
          skipChecked: !recheckAll,
          checkedColIndex: agentCols.time.index,
          cols: layout.input,
          dupByRow,
        });
        if (write && result.results.length) {
          const entries: AgentEntry[] = result.results.map((r) => ({
            row: r.rowNumber,
            status: r.ok ? OK_STATUS : FLAG_STATUS,
            note: r.note,
          }));
          const w = await writeAgentRowsBatch(cfg, spreadsheetId, agentCols, entries, stamp);
          totalWriteErr += w.err;
        }
        totalChecked += result.checked;
        totalClean += result.clean;
        for (const r of result.results) if (!r.ok) flagged.push({ row: r.rowNumber, ten: r.ten, note: r.note });
        for (const f of result.findings) allFindings.push({ code: f.code, field: f.field, rowNumber: f.rowNumber });
        firstRow = lastRow + 1;
      }

      const flaggedN = flagged.length;

      // Write the summary report tab + append a run-history row (best-effort).
      let reportLine = "";
      if (write && totalChecked > 0) {
        try {
          const report = await writeScanReport(cfg, spreadsheetId, {
            stamp, checked: totalChecked, clean: totalClean,
            flagged: flaggedN, breakdown: buildBreakdown(allFindings),
          });
          reportLine =
            `\n\n📊 Đã cập nhật báo cáo:\n` +
            `• ${REPORT_TAB}: ${report.reportUrl}\n` +
            `• ${HISTORY_TAB}: ${report.historyUrl}`;
        } catch { reportLine = ""; }
      }

      const top = flagged.slice(0, 15).map((f) => `• Dòng ${f.row} – ${f.ten || "?"}: ${f.note}`);
      const more = flaggedN > 15 ? `\n… và ${flaggedN - 15} dòng khác cần sửa.` : "";
      const text =
        `📋 Kiểm tra công nhân chưa xác nhận — ${stamp}\n` +
        `Đã kiểm: ${totalChecked} dòng mới · ✅ Đủ đúng: ${totalClean} · ⚠️ Cần sửa: ${flaggedN}` +
        (flaggedN ? `\n\nCần sửa:\n${top.join("\n")}${more}` : `\n\n✅ Tất cả đủ đúng.`) +
        (write ? `\n\n(Đã ghi kết quả + thời điểm kiểm vào cột riêng của agent${totalWriteErr ? `, ${totalWriteErr} lỗi ghi` : ""}.)` : "") +
        reportLine +
        (totalChecked === 0 ? "\n\nKhông có dòng mới nào cần kiểm (tất cả đã xác nhận trước đó)." : "");
      return { content: [{ type: "text", text }], details: { totalChecked, totalClean, flaggedN, flagged } };
    },
  };
}

/**
 * chamcong_status — deterministic check of whether a target Google Sheet has been
 * configured. The agent calls this FIRST on every conversation so "chưa cấu hình"
 * is a fact it can act on (ask for the link), not a guess. No network — reads the
 * saved config file only.
 */
function createStatusTool() {
  return {
    name: "chamcong_status",
    label: "Chấm công · trạng thái cấu hình",
    description:
      "Kiểm tra agent ĐÃ được cấu hình Google Sheet chưa. GỌI ĐẦU TIÊN mỗi cuộc trò chuyện, trước khi chào/gợi ý/kiểm tra. " +
      "Trả configured (true/false) + spreadsheetId nếu có. Nếu configured=false → phải hỏi người vận hành gửi link rồi gọi chamcong_set_sheet. Không cần tham số.",
    parameters: { type: "object" as const, properties: {}, required: [] as string[] },
    execute: async () => {
      const cfg = loadSheetConfig();
      const configured = Boolean(cfg?.spreadsheetId);
      const text = configured
        ? `✅ Đã cấu hình Google Sheet (id: ${cfg!.spreadsheetId}). Có thể kiểm tra ngay.`
        : "⚠️ CHƯA cấu hình Google Sheet. Hãy hỏi người vận hành gửi link Google Sheet rồi gọi chamcong_set_sheet.";
      return { content: [{ type: "text", text }], details: { configured, spreadsheetId: cfg?.spreadsheetId ?? null } };
    },
  };
}

interface SetSheetArgs {
  url?: string;
  dataTab?: string;
  bankTab?: string;
}

/**
 * chamcong_set_sheet — save WHICH Google Sheet this agent checks. Called at
 * first-run (bootstrap) when the operator provides the link, or to switch sheets.
 * The sheet id is never hardcoded — it lives in per-agent config.
 */
function createSetSheetTool() {
  return {
    name: "chamcong_set_sheet",
    label: "Chấm công · cấu hình Google Sheet",
    description:
      "Lưu link Google Sheet mà agent sẽ kiểm tra. Gọi khi người dùng cung cấp link (lần đầu) hoặc muốn đổi sheet. " +
      "Nhận url (link Google Sheet hoặc spreadsheet id) + tuỳ chọn tên tab dữ liệu/ngân hàng.",
    parameters: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "Link Google Sheet (hoặc spreadsheet id)." },
        dataTab: { type: "string", description: "(tuỳ chọn) tên tab dữ liệu công nhân." },
        bankTab: { type: "string", description: "(tuỳ chọn) tên tab danh mục ngân hàng." },
      },
      required: ["url"] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = (rest.find((a) => a && typeof a === "object" && !Array.isArray(a)) ?? {}) as SetSheetArgs;
      const id = extractFileId(args.url ?? "");
      if (!id) return fail("Không nhận diện được link/ID Google Sheet. Hãy gửi link dạng https://docs.google.com/spreadsheets/d/…", "bad_url");
      try {
        saveSheetConfig({ spreadsheetId: id, dataTab: args.dataTab, bankTab: args.bankTab });
        return {
          content: [{ type: "text", text: `✅ Đã lưu Google Sheet để kiểm tra (id: ${id}). Từ giờ mọi lệnh kiểm tra sẽ chạy trên sheet này.` }],
          details: { spreadsheetId: id },
        };
      } catch (err) {
        return fail(`Lưu cấu hình lỗi: ${(err as Error).message}`, "save_failed");
      }
    },
  };
}

// ── HANET FaceID tools ────────────────────────────────────────────────────────

/** OpenClaw passes args as the first plain-object positional (see createCheckRangeTool NOTE). */
function toolArgs<T>(rest: unknown[]): T {
  return (rest.find((a) => a && typeof a === "object" && !Array.isArray(a)) ?? {}) as T;
}

/** Coerce a tool arg (object or JSON string) into a string→string map, or undefined. */
function coerceStringMap(v: unknown): Record<string, string> | undefined {
  let obj = v;
  if (typeof obj === "string") {
    try { obj = JSON.parse(obj); } catch { return undefined; }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(obj as Record<string, unknown>)) out[k] = String(val);
  return out;
}

/** Find a column by exact header (read-only, case-insensitive); -1 when absent. */
function findHeaderIndex(header: string[], name: string): number {
  const n = name.trim().toLowerCase();
  return header.findIndex((h) => (h ?? "").trim().toLowerCase() === n);
}

const NEEDS_HANET_MSG =
  "Chưa cấu hình HANET (client_id/secret/refresh_token). Admin cần nạp .env HANET_* rồi cài lại instance " +
  "(xem TESTING-STAGING). Secret KHÔNG nhập qua chat.";
function needHanet() {
  return fail(NEEDS_HANET_MSG, "need_hanet");
}

/** Load HANET config only when the secrets are present; else null → caller returns need_hanet. */
function loadHanetOrNull(): HanetConfig | null {
  const cfg = loadHanetConfig();
  if (!cfg?.clientId || !cfg.clientSecret || !cfg.refreshToken) return null;
  return cfg;
}

/**
 * Resolve a valid HANET access_token (cached, or refreshed) + the API base URL.
 * Persists the refreshed token cache (and a rotated refresh_token) so the next
 * call/process reuses it. `force` bypasses the cache (used to retry after -103).
 */
async function resolveHanetToken(cfg: HanetConfig, force = false): Promise<{ token: string; baseUrl: string }> {
  const { accessToken, tokenCache, newRefreshToken } = await getAccessToken(
    {
      oauthUrl: cfg.oauthUrl,
      clientId: cfg.clientId ?? "",      // loadHanetOrNull() guarantees these are set
      clientSecret: cfg.clientSecret ?? "",
      refreshToken: cfg.refreshToken ?? "",
      token: force ? undefined : cfg.token,
    },
    Date.now(),
  );
  if (force || !cfg.token || cfg.token.accessToken !== tokenCache.accessToken || newRefreshToken) {
    saveHanetConfig(newRefreshToken ? { token: tokenCache, refreshToken: newRefreshToken } : { token: tokenCache });
  }
  return { token: accessToken, baseUrl: cfg.baseUrl ?? HANET_DEFAULT_BASE };
}

/** Pre-size the grid + write headers for any newly-created FaceID columns. Best-effort. */
async function ensureFaceIdColumns(cfg: ConnectorConfig, spreadsheetId: string, cols: ResolvedColumn[]): Promise<void> {
  const created = cols.filter((c) => c.created);
  if (created.length === 0) return;
  const maxIndex = Math.max(...cols.map((c) => c.index));
  const grid = await getSheetGrid(cfg, spreadsheetId, DATA_TAB).catch(() => null);
  if (grid && grid.columnCount < maxIndex + 1) {
    try { await appendColumns(cfg, spreadsheetId, grid.sheetId, maxIndex + 1 - grid.columnCount); } catch { /* expand-on-write */ }
  }
  for (const c of created) await writeCells(cfg, spreadsheetId, DATA_TAB, `${c.letter}1`, [[c.header]]);
}

/** chamcong_list_places — list HANET places so the operator can build placeMap. */
function createListPlacesTool() {
  return {
    name: "chamcong_list_places",
    label: "Chấm công · liệt kê địa điểm HANET",
    description:
      "Liệt kê các ĐỊA ĐIỂM (place) trên HANET của tài khoản (tên + placeID). Không tham số. " +
      "Dùng để lấy placeID khi cấu hình đăng ký FaceID (chamcong_set_hanet_targets).",
    parameters: { type: "object" as const, properties: {}, required: [] as string[] },
    execute: async () => {
      const cfg = loadHanetOrNull();
      if (!cfg) return needHanet();
      try {
        const { token, baseUrl } = await resolveHanetToken(cfg);
        const places = await getPlaces(baseUrl, token);
        const text = places.length
          ? "📍 Địa điểm HANET:\n" + places.map((p) => `• ${p.name} — placeID: ${p.id}`).join("\n")
          : "Tài khoản HANET chưa có địa điểm nào.";
        return { content: [{ type: "text", text }], details: { places } };
      } catch (err) {
        return fail(`Lấy danh sách địa điểm HANET lỗi: ${(err as Error).message}`, "hanet_failed");
      }
    },
  };
}

/** chamcong_list_departments — list a place's departments (phòng ban) → departmentID. */
function createListDepartmentsTool() {
  return {
    name: "chamcong_list_departments",
    label: "Chấm công · liệt kê phòng ban HANET",
    description:
      "Liệt kê PHÒNG BAN (department) của MỘT địa điểm HANET (tên + departmentID) — vd MEGA/CASA/SUNCASA/PHÚ QUỐC. " +
      "Truyền placeID; bỏ trống thì dùng placeId mặc định trong cấu hình. Dùng để dựng deptMap.",
    parameters: {
      type: "object" as const,
      properties: { placeID: { type: "string", description: "placeID của địa điểm (bỏ trống = placeId mặc định)." } },
      required: [] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = toolArgs<{ placeID?: string }>(rest);
      const cfg = loadHanetOrNull();
      if (!cfg) return needHanet();
      const placeID = (args.placeID ?? cfg.placeId ?? "").trim();
      if (!placeID) return fail("Cần placeID (hoặc đặt placeId mặc định qua chamcong_set_hanet_targets).", "no_place");
      try {
        const { token, baseUrl } = await resolveHanetToken(cfg);
        const departments = await getDepartments(baseUrl, token, placeID);
        const text = departments.length
          ? `🏷️ Phòng ban của place ${placeID}:\n` + departments.map((d) => `• ${d.name} — departmentID: ${d.id}`).join("\n")
          : `Place ${placeID} chưa có phòng ban.`;
        return { content: [{ type: "text", text }], details: { placeID, departments } };
      } catch (err) {
        return fail(`Lấy danh sách phòng ban lỗi: ${(err as Error).message}`, "hanet_failed");
      }
    },
  };
}

interface SetTargetsArgs {
  placeId?:  string;
  placeMap?: unknown;
  deptMap?:  unknown;
}

/** chamcong_set_hanet_targets — set the NON-SECRET routing config (placeId + maps). */
function createSetHanetTargetsTool() {
  return {
    name: "chamcong_set_hanet_targets",
    label: "Chấm công · cấu hình place/phòng ban HANET",
    description:
      "Lưu ánh xạ đăng ký FaceID: placeId mặc định + placeMap (Công trình→placeID) + deptMap (Công trình→departmentID). " +
      "KHÔNG nhận secret (client_id/secret/token nạp qua .env lúc cài). Truyền field nào thì cập nhật field đó.",
    parameters: {
      type: "object" as const,
      properties: {
        placeId: { type: "string", description: "placeID mặc định (Địa điểm sở hữu)." },
        placeMap: { type: "object", description: 'JSON {"Công trình":"placeID"} — override place theo Công trình.' },
        deptMap: { type: "object", description: 'JSON {"Công trình":"departmentID"} — phòng ban theo Công trình.' },
      },
      required: [] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = toolArgs<SetTargetsArgs>(rest);
      if (!loadHanetOrNull()) return needHanet();
      const patch: Partial<HanetConfig> = {};
      if (typeof args.placeId === "string" && args.placeId.trim()) patch.placeId = args.placeId.trim();
      const placeMap = coerceStringMap(args.placeMap);
      const deptMap = coerceStringMap(args.deptMap);
      if (placeMap) patch.placeMap = placeMap;
      if (deptMap) patch.deptMap = deptMap;
      if (Object.keys(patch).length === 0) return fail("Không có gì để lưu (cần placeId/placeMap/deptMap).", "empty");
      try {
        saveHanetConfig(patch);
        const cfg = loadHanetConfig();
        const text =
          `✅ Đã lưu cấu hình HANET. placeId=${cfg?.placeId ?? "(chưa đặt)"}, ` +
          `placeMap=${Object.keys(cfg?.placeMap ?? {}).length} mục, deptMap=${Object.keys(cfg?.deptMap ?? {}).length} mục.`;
        return { content: [{ type: "text", text }], details: { placeId: cfg?.placeId, placeMap: cfg?.placeMap, deptMap: cfg?.deptMap } };
      } catch (err) {
        return fail(`Lưu cấu hình lỗi: ${(err as Error).message}`, "save_failed");
      }
    },
  };
}

interface RegisterFaceidArgs {
  startRow?: number;
  endRow?:   number;
  dryRun?:   boolean;
}

/**
 * chamcong_register_faceid — register FaceID on HANET for every ELIGIBLE row:
 * agent status OK + manager ticked "Duyệt FaceID" + has a face image (col T) + has
 * Mã NS + a resolvable placeID, and not already registered. The plugin reads the
 * sheet, downloads each image (col T Drive file), calls /person/register, and
 * writes the outcome into the agent's own "KT · FaceID" column. dryRun lists only.
 */
function createRegisterFaceidTool() {
  return {
    name: "chamcong_register_faceid",
    label: "Chấm công · đăng ký FaceID HANET",
    description:
      "Đăng ký FaceID lên HANET cho các dòng ĐỦ ĐIỀU KIỆN: trạng thái OK + đã tick cột 'Duyệt FaceID' (quản lý) + " +
      "có ảnh cột T + có Mã NS + map được place. Ảnh lấy từ cột T (Google Drive). Ghi kết quả vào cột 'KT · FaceID'. " +
      "Idempotent (bỏ qua dòng đã đăng ký). dryRun=true chỉ liệt kê dòng sẽ đăng ký, KHÔNG gọi HANET.",
    parameters: {
      type: "object" as const,
      properties: {
        startRow: { type: "number", description: "Dòng bắt đầu (mặc định 2)." },
        endRow: { type: "number", description: "Dòng kết thúc (mặc định hết dữ liệu)." },
        dryRun: { type: "boolean", description: "Chỉ liệt kê dòng đủ điều kiện, không gọi HANET." },
      },
      required: [] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = toolArgs<RegisterFaceidArgs>(rest);
      const dryRun = args.dryRun ?? false;
      const spreadsheetId = resolveSpreadsheetId();
      if (!spreadsheetId) return needSheet();
      const hcfg = loadHanetOrNull();
      if (!hcfg) return needHanet();

      let cfg: ConnectorConfig;
      try {
        cfg = loadConnectorConfig();
      } catch (err) {
        return fail(`Không đọc được cấu hình connector: ${(err as Error).message}`, "no_connector");
      }

      // Resolve columns from the header row: input cols by name, status read-only,
      // Duyệt + KT·FaceID create-if-absent (headers only — never write Duyệt cells).
      let header: string[];
      try {
        header = (await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!1:1`))[0] ?? [];
      } catch (err) {
        return fail(`Không đọc được tiêu đề sheet: ${(err as Error).message}`, "header_failed");
      }
      const input = resolveInputCols(header);
      const statusIdx = findHeaderIndex(header, COL_STATUS);
      // Human "Đã tạo Face ID" tracking column (read-only): a non-blank value = an
      // existing worker the human already handled → agent skips. Only blank = new.
      const daTaoIdx = header.findIndex((h) => { const n = normKey(h ?? ""); return n.includes("tao") && n.includes("face"); });
      const managed = resolveColumns(header, [DUYET_HEADER, COL_FACEID]);
      const duyetCol = managed.get(DUYET_HEADER) as ResolvedColumn;
      const faceidCol = managed.get(COL_FACEID) as ResolvedColumn;
      try { await ensureFaceIdColumns(cfg, spreadsheetId, [duyetCol, faceidCol]); } catch { /* best-effort */ }

      const cols: FaceIdCols = {
        status: statusIdx, duyet: duyetCol.index, faceid: faceidCol.index, daTaoFaceID: daTaoIdx,
        hoTen: input.hoTen, maNS: input.maNS, congTrinh: input.congTrinh, anhMat: input.anhMat, nhomCN: input.nhomCN,
      };
      const faceCfg: FaceIdConfig = {
        placeId: hcfg.placeId, placeMap: normalizeMap(hcfg.placeMap),
        deptMap: normalizeMap(hcfg.deptMap), defaultType: hcfg.defaultType,
      };

      const first = Math.max(2, Math.floor(Number(args.startRow) || 2));
      let lastDataRow: number;
      try {
        const nameCol = columnLetter(input.hoTen);
        const names = await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!${nameCol}2:${nameCol}5000`);
        lastDataRow = 1 + names.length;
      } catch {
        return fail("Không xác định được số dòng dữ liệu.", "extent_failed");
      }
      const last = Math.min(Math.floor(Number(args.endRow) || lastDataRow), lastDataRow);
      const lastCol = columnLetter(Math.max(AL_INDEX, faceidCol.index, duyetCol.index, statusIdx));

      let values: string[][];
      try {
        values = await readSheetValues(cfg, spreadsheetId, `'${DATA_TAB}'!A${first}:${lastCol}${last}`);
      } catch (err) {
        return fail(`Đọc sheet lỗi: ${(err as Error).message}`, "read_failed");
      }

      const plans = mapSheetRows(values, first).map((r) => decideRow(r.rowNumber, r.cells, cols, faceCfg, FACEID_PASSING));
      const toRegister = plans.filter((p): p is Extract<RowPlan, { action: "register" }> => p.action === "register");
      const problems = plans.filter(
        (p): p is Extract<RowPlan, { action: "skip" }> =>
          p.action === "skip" && p.code !== "not_approved" && p.code !== "already_done" && p.code !== "already_created",
      );
      const alreadyN = plans.filter((p) => p.action === "skip" && (p.code === "already_done" || p.code === "already_created")).length;

      if (dryRun) {
        const lines = toRegister.slice(0, 30).map(
          (p) => `• Dòng ${p.rowNumber} – ${p.name} (${p.aliasID}) → place ${p.placeID}${p.departmentID ? `, dept ${p.departmentID}` : ""}`);
        const probLines = problems.slice(0, 15).map((p) => `• Dòng ${p.rowNumber}: ${p.message}`);
        const text =
          `🔎 DRY-RUN đăng ký FaceID (${first}–${last}) — sẽ đăng ký ${toRegister.length} dòng` +
          (toRegister.length ? `:\n${lines.join("\n")}` : ".") +
          (problems.length ? `\n\n⚠️ Đã duyệt nhưng chưa đủ điều kiện (${problems.length}):\n${probLines.join("\n")}` : "") +
          (alreadyN ? `\n\n(Đã có FaceID/đã xử lý: ${alreadyN} dòng — bỏ qua.)` : "");
        return { content: [{ type: "text", text }], details: { willRegister: toRegister.length, problems: problems.length, alreadyN } };
      }

      let token: string;
      let baseUrl: string;
      try {
        ({ token, baseUrl } = await resolveHanetToken(hcfg));
      } catch (err) {
        return fail(`Xác thực HANET lỗi: ${(err as Error).message}`, "hanet_auth_failed");
      }

      // HANET register can take 10–30s per person → bound each request.
      const timeoutFetch = ((url: string, init?: Parameters<typeof fetch>[1]) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(30_000) })) as FetchFn;
      const stamp = nowStampGmt7(Date.now());
      let ok = 0;
      const errs: Array<{ row: number; msg: string }> = [];

      // Crop the avatar to the face via the instance's vision model (optional — on
      // any failure prepareFaceImage still returns the upright, HEIC-decoded image).
      let visionModel: string | null = null;
      try { visionModel = loadVisionModel(AGENT_ID); } catch { visionModel = null; }
      const detectFace = async (jpeg: Uint8Array) =>
        visionModel ? parseFaceBox(await describeImage(jpeg, FACE_BBOX_PROMPT, visionModel)) : null;

      for (const p of toRegister) {
        try {
          const fileId = extractFileId(p.imageCell);
          if (!fileId) throw new Error("cột T không phải link Google Drive");
          const rawImage = await downloadDriveFile(cfg, fileId);
          const image = await prepareFaceImage(rawImage, detectFace);
          const body = { name: p.name, aliasID: p.aliasID, placeID: p.placeID, departmentID: p.departmentID, title: p.title, type: p.type, image, filename: `${p.aliasID}.jpg` };
          let res = await registerPerson(baseUrl, token, body, timeoutFetch);
          if (res.returnCode === -103) { // token expired mid-batch → force-refresh + retry once
            ({ token } = await resolveHanetToken(hcfg, true));
            res = await registerPerson(baseUrl, token, body, timeoutFetch);
          }
          if (res.returnCode !== 1) throw new Error(mapReturnCode(res.returnCode, res.returnMessage));
          const data = (res.data ?? {}) as { personID?: string; person_id?: string; aliasID?: string };
          const personId = String(data.personID ?? data.person_id ?? data.aliasID ?? p.aliasID);
          await writeCells(cfg, spreadsheetId, DATA_TAB, `${faceidCol.letter}${p.rowNumber}`, [[formatDone(personId, stamp)]]);
          ok++;
        } catch (err) {
          const msg = (err as Error).message;
          errs.push({ row: p.rowNumber, msg });
          try {
            await writeCells(cfg, spreadsheetId, DATA_TAB, `${faceidCol.letter}${p.rowNumber}`, [[`Lỗi: ${msg}`]]);
          } catch { /* result write is best-effort */ }
        }
      }

      const probLines = problems.slice(0, 10).map((p) => `• Dòng ${p.rowNumber}: ${p.message}`);
      const errLines = errs.slice(0, 10).map((e) => `• Dòng ${e.row}: ${e.msg}`);
      const text =
        `🪪 Đăng ký FaceID HANET (${first}–${last}) — ${stamp}\n` +
        `✅ Thành công: ${ok} · ❌ Lỗi: ${errs.length} · ⏭️ Đã có FaceID (bỏ qua): ${alreadyN}` +
        (problems.length ? `\n\n⚠️ Đã duyệt nhưng chưa đủ điều kiện (${problems.length}):\n${probLines.join("\n")}` : "") +
        (errs.length ? `\n\n❌ Lỗi đăng ký:\n${errLines.join("\n")}` : "") +
        (toRegister.length === 0 && problems.length === 0
          ? "\n\nKhông có dòng nào được duyệt để đăng ký. Hãy tick cột 'Duyệt FaceID' trên các dòng OK trước."
          : "");
      return { content: [{ type: "text", text }], details: { ok, errors: errs, problems: problems.length, alreadyN } };
    },
  };
}

export default definePluginEntry({
  id: "chamcong-check",
  name: "Chấm công · Kiểm tra",
  description:
    "In-instance plugin for bsv-onboarding: chamcong_status reports whether a sheet is configured; chamcong_set_sheet configures the target sheet; chamcong_scan_new scans unconfirmed rows and summarizes; chamcong_check_range validates a range; chamcong_check_cccd cross-checks CCCD images; chamcong_check_phieu cross-checks the scanned reception form (bank + salary + name); chamcong_list_places / chamcong_list_departments discover HANET places/departments; chamcong_set_hanet_targets configures placeId/placeMap/deptMap; chamcong_register_faceid registers approved workers' FaceID on HANET.",
  register(api: OpenClawPluginApi) {
    api.registerTool(() => createStatusTool(), { name: "chamcong_status" });
    api.registerTool(() => createSetSheetTool(), { name: "chamcong_set_sheet" });
    api.registerTool(() => createScanNewTool(), { name: "chamcong_scan_new" });
    api.registerTool(() => createCheckRangeTool(), { name: "chamcong_check_range" });
    api.registerTool(() => createCheckCccdTool(), { name: "chamcong_check_cccd" });
    api.registerTool(() => createCheckPhieuTool(), { name: "chamcong_check_phieu" });
    api.registerTool(() => createListPlacesTool(), { name: "chamcong_list_places" });
    api.registerTool(() => createListDepartmentsTool(), { name: "chamcong_list_departments" });
    api.registerTool(() => createSetHanetTargetsTool(), { name: "chamcong_set_hanet_targets" });
    api.registerTool(() => createRegisterFaceidTool(), { name: "chamcong_register_faceid" });
  },
});

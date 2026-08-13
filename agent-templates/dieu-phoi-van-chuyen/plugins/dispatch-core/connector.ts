/**
 * Client MCP tối giản cho connector của platform (Google Sheets), gọi từ BÊN
 * TRONG plugin để agent không bao giờ phải tự marshal ma trận ô của Sheet qua
 * tool arguments (LLM làm việc đó không đáng tin).
 *
 * Endpoint connector là streamable-HTTP stateless: mỗi lần gọi là MỘT POST
 * JSON-RPC, trả JSON ngay trong body — không session, không SSE, không
 * `initialize`.
 *
 * URL + bearer token đọc từ openclaw.json đang chạy
 * (`mcp.servers["tryopenclaw-connectors"]`), nên plugin không tự sinh thêm
 * credential nào.
 *
 * Các hàm PURE (`parseConnectorConfig`, `extractSheetValues`, `extractTabs`,
 * `extractSpreadsheetId`) có unit test; các hàm gọi mạng nhận `FetchFn` tiêm
 * vào để test được.
 *
 * Bảng tool + argument của Composio mà file này dùng (đã xác nhận, KHÔNG đoán):
 *   GOOGLESHEETS_BATCH_GET             { spreadsheet_id, ranges: string[], valueRenderOption }
 *   GOOGLESHEETS_BATCH_UPDATE          { spreadsheet_id, sheet_name, first_cell_location, values, value_input_option }
 *   GOOGLESHEETS_GET_SPREADSHEET_INFO  { spreadsheet_id, fields }
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { normalizeKey } from './parse';
import type { ConnectorConfig, FetchFn } from './types';

/** Tên server MCP trong openclaw.json. Không đổi giữa các instance. */
const CONNECTOR_SERVER = 'tryopenclaw-connectors';

/** Một tab của spreadsheet: gid + tên GỐC (giữ nguyên dấu cách cuối). */
export interface TabInfo {
  sheetId: number;
  title: string;
}

function configCandidates(): string[] {
  const home = process.env.OPENCLAW_HOME || '/home/node';
  return [join(home, '.openclaw', 'openclaw.json'), '/home/node/.openclaw/openclaw.json'];
}

/**
 * Parse nội dung openclaw.json → endpoint MCP + header Authorization. Pure.
 *
 * Throw tiếng Việt khi thiếu url hoặc thiếu Authorization: thiếu một trong hai
 * thì mọi lời gọi sau đó đều 401/404, báo sớm rõ hơn báo muộn mơ hồ.
 */
export function parseConnectorConfig(rawJson: string): ConnectorConfig {
  const cfg = JSON.parse(rawJson) as {
    mcp?: { servers?: Record<string, { url?: string; headers?: { Authorization?: string } }> };
  };
  const server = cfg?.mcp?.servers?.[CONNECTOR_SERVER];
  if (!server?.url || !server?.headers?.Authorization) {
    throw new Error(`connector "${CONNECTOR_SERVER}" chưa được cấu hình trong openclaw.json`);
  }
  return { url: server.url, auth: server.headers.Authorization };
}

/**
 * Đọc cấu hình connector từ openclaw.json của gateway đang chạy.
 * Thử `$OPENCLAW_HOME/.openclaw/openclaw.json` trước, rồi
 * `/home/node/.openclaw/openclaw.json`.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → mọi tool dp_* — resolve endpoint trước khi đọc/ghi Sheet
 */
export function loadConnectorConfig(candidates: string[] = configCandidates()): ConnectorConfig {
  const path = candidates.find((p) => existsSync(p));
  if (!path) throw new Error(`không tìm thấy openclaw.json (đã thử: ${candidates.join(', ')})`);
  return parseConnectorConfig(readFileSync(path, 'utf8'));
}

/**
 * Gọi một tool của connector qua endpoint MCP stateless; trả về `result` của
 * JSON-RPC.
 *
 * HTTP không ok → throw `connector HTTP <status>`.
 * JSON-RPC có `error` → throw `connector <name>: <message>`.
 *
 * @usedBy {plugins/dispatch-core/connector.ts} → readRange / writeRange / listTabs
 */
export async function callConnectorTool(
  cfg: ConnectorConfig,
  name: string,
  args: Record<string, unknown>,
  fetchFn: FetchFn = fetch,
): Promise<unknown> {
  const res = await fetchFn(cfg.url, {
    method: 'POST',
    headers: { Authorization: cfg.auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  });
  if (!res.ok) throw new Error(`connector HTTP ${res.status}`);
  const payload = (await res.json()) as { result?: unknown; error?: { message?: string } };
  if (payload.error) throw new Error(`connector ${name}: ${payload.error.message ?? 'error'}`);
  return payload.result;
}

/**
 * Bóc ma trận ô 2 chiều từ envelope `tools/call` của GOOGLESHEETS_BATCH_GET.
 * Envelope: `{ content: [{ text: "<json>" }] }` → `data.valueRanges[0].values`.
 *
 * Trả `[]` khi thiếu content hoặc khi text không parse được — đọc Sheet lỗi
 * định dạng KHÔNG được làm sập tool, caller sẽ báo `read_failed` khi cần. Pure.
 */
export function extractSheetValues(mcpResult: unknown): string[][] {
  const text = (mcpResult as { content?: Array<{ text?: string }> })?.content?.[0]?.text;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as { data?: { valueRanges?: Array<{ values?: string[][] }> } };
    return parsed?.data?.valueRanges?.[0]?.values ?? [];
  } catch {
    return [];
  }
}

/**
 * Đọc một range A1 → ma trận ô (chuỗi đã format theo locale, xem parse.ts).
 * `range` phải kèm tên tab, dùng `a1()` để bọc dấu nháy cho tên có dấu cách.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_quet_don — đọc tab Đơn hàng/Tài xế/Khu vực/Cấu hình
 */
export async function readRange(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  range: string,
  fetchFn: FetchFn = fetch,
): Promise<string[][]> {
  const result = await callConnectorTool(
    cfg,
    'GOOGLESHEETS_BATCH_GET',
    { spreadsheet_id: spreadsheetId, ranges: [range], valueRenderOption: 'FORMATTED_VALUE' },
    fetchFn,
  );
  return extractSheetValues(result);
}

/**
 * Ghi một block 2 chiều bắt đầu tại `firstCell` (A1 KHÔNG kèm tên tab, ví dụ
 * "AB12") vào tab `sheetName`. Dùng RAW để giá trị vào Sheet đúng nguyên văn
 * (không bị coerce thành công thức/số).
 *
 * ⚠️ CẢNH BÁO PHẢI TUÂN — TUYỆT ĐỐI KHÔNG GHI CẢ DÒNG.
 * Tab "Đơn hàng " của khách có cột CÔNG THỨC (`Sẵn sàng đối soát`) và cột do
 * NGƯỜI KHÁC ghi (`Trạng thái đối soát`, khâu đối soát — ngoài phạm vi của
 * agent điều phối). Một block phủ hết chiều ngang của dòng sẽ xoá công thức và
 * đè dữ liệu thật của khâu khác: mất dữ liệu, không hoàn lại được.
 * Vì vậy plugin này CHỈ ghi range HẸP: mỗi lần một cột (hoặc vài cột liền kề do
 * chính agent sở hữu), với `firstCell` trỏ đúng ô đầu của đúng cột đó — chữ cột
 * luôn lấy từ `ColumnRef.letter` (resolve theo TÊN header), không hardcode.
 * Trong plugin này KHÔNG có, và không được thêm, hàm nào ghi trọn một dòng dữ
 * liệu đã tồn tại. (`appendRow` chỉ ghi vào dòng MỚI sau dòng cuối cùng.)
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_phan_cong / dp_ghi_nhan — ghi từng cột agent sở hữu
 */
export async function writeRange(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  sheetName: string,
  firstCell: string,
  values: string[][],
  fetchFn: FetchFn = fetch,
): Promise<void> {
  await callConnectorTool(
    cfg,
    'GOOGLESHEETS_BATCH_UPDATE',
    {
      spreadsheet_id: spreadsheetId,
      sheet_name: sheetName,
      first_cell_location: firstCell,
      values,
      value_input_option: 'RAW',
    },
    fetchFn,
  );
}

/**
 * Thêm một dòng vào CUỐI tab (dùng cho tab "Ngoại lệ " — tab chỉ ghi thêm).
 *
 * Composio KHÔNG có tool append trong danh sách đã xác nhận (chỉ BATCH_GET /
 * BATCH_UPDATE / GET_SPREADSHEET_INFO), nên cách làm là: đọc cột A để biết dòng
 * cuối đang có dữ liệu, rồi BATCH_UPDATE vào dòng KẾ TIẾP. Vì ghi vào dòng chưa
 * tồn tại dữ liệu, thao tác này không đè lên bất kỳ ô nào của người khác —
 * không vi phạm cảnh báo ở `writeRange`.
 *
 * Giả định: cột A của tab luôn có dữ liệu ở mọi dòng đã dùng (với tab Ngoại lệ
 * là `Mã ngoại lệ`). Nếu cột A có ô trống ở giữa, hàm vẫn ghi sau dòng cuối
 * cùng có dữ liệu ở cột A — không lấp vào khoảng trống.
 *
 * Không atomic: hai lần append đồng thời có thể tranh cùng một dòng. Plugin gọi
 * append tuần tự trong một lượt agent nên chấp nhận được.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_ngoai_le — thêm dòng vào tab Ngoại lệ
 */
export async function appendRow(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  sheetName: string,
  row: string[],
  fetchFn: FetchFn = fetch,
): Promise<void> {
  const used = await readRange(cfg, spreadsheetId, a1(sheetName, 'A:A'), fetchFn);
  const nextRow = used.length + 1;
  await writeRange(cfg, spreadsheetId, sheetName, `A${nextRow}`, [row], fetchFn);
}

/**
 * Bóc danh sách tab từ envelope GET_SPREADSHEET_INFO → map
 * `normalizeKey(title)` → `{ sheetId, title }`. Pure.
 *
 * Key đã normalize để resolve được tab có DẤU CÁCH Ở CUỐI ("Đơn hàng ") hoặc
 * khác hoa/thường; `title` giữ tên GỐC vì mọi range A1 và mọi lần ghi phải dùng
 * đúng tên gốc, còn `sheetId` (gid) dùng để tạo deep link `#gid=`.
 */
export function extractTabs(mcpResult: unknown): Map<string, TabInfo> {
  const out = new Map<string, TabInfo>();
  const text = (mcpResult as { content?: Array<{ text?: string }> })?.content?.[0]?.text;
  if (!text) return out;
  try {
    const parsed = JSON.parse(text) as {
      data?: { sheets?: Array<{ properties?: { sheetId?: number; title?: string } }> };
    };
    for (const s of parsed?.data?.sheets ?? []) {
      const title = s.properties?.title;
      const sheetId = s.properties?.sheetId;
      if (typeof title === 'string' && title && typeof sheetId === 'number') {
        out.set(normalizeKey(title), { sheetId, title });
      }
    }
  } catch {
    // envelope lỗi định dạng → coi như không đọc được tab nào
  }
  return out;
}

/**
 * Liệt kê tab của spreadsheet → map `normalizeKey(tên tab)` → `{ sheetId, title }`.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_set_sheet / dp_status — kiểm tra 7 tab bắt buộc + deep link
 */
export async function listTabs(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  fetchFn: FetchFn = fetch,
): Promise<Map<string, TabInfo>> {
  const result = await callConnectorTool(
    cfg,
    'GOOGLESHEETS_GET_SPREADSHEET_INFO',
    { spreadsheet_id: spreadsheetId, fields: 'sheets.properties(sheetId,title)' },
    fetchFn,
  );
  return extractTabs(result);
}

/**
 * Tra một tab theo tên người dùng nhập (chịu được thiếu/thừa dấu cách, khác hoa
 * thường). Trả tên GỐC để dựng range A1. Pure.
 */
export function resolveTab(tabs: Map<string, TabInfo>, wanted: string): TabInfo | null {
  return tabs.get(normalizeKey(wanted)) ?? null;
}

/**
 * Bọc tên tab + range thành A1 notation an toàn: `'Đơn hàng '!A1:AR`.
 * Tên tab có dấu cách/dấu tiếng Việt BẮT BUỘC phải nằm trong dấu nháy đơn, dấu
 * nháy trong tên được escape thành hai dấu nháy. Pure.
 */
export function a1(sheetName: string, range: string): string {
  return `'${sheetName.replace(/'/g, "''")}'!${range}`;
}

/**
 * Bóc spreadsheetId từ link người vận hành dán vào, hoặc trả chính nó nếu đã là
 * id. Trả null khi không nhận ra. Pure.
 *
 * Nhận: `https://docs.google.com/spreadsheets/d/<ID>/edit?gid=0#gid=0`,
 * link không có `/edit`, link publish `/spreadsheets/d/e/<ID>/pubhtml`,
 * và id trần (chỉ chữ/số/`-`/`_`, dài ≥ 20 ký tự như Google sinh ra).
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
  const s = (urlOrId ?? '').trim();
  if (!s) return null;
  const m = s.match(/\/spreadsheets\/d\/(?:e\/)?([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s;
  return null;
}

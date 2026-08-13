/**
 * dispatch-core — plugin điều phối giao hàng cho agent `dieu-phoi-van-chuyen`.
 *
 * Nguyên tắc kiến trúc (copy từ plugin chamcong-check đang chạy production):
 *  1. LLM KHÔNG tính điểm và KHÔNG bao giờ nhận/truyền ma trận ô Sheet. Tool chỉ
 *     nhận tham số vô hướng (mã đơn, mã tài xế); plugin tự đọc/ghi Sheet.
 *  2. Không hardcode spreadsheet id. Chưa cấu hình → trả `need_sheet` để agent
 *     đi hỏi người vận hành (luồng BOOTSTRAP.md).
 *  3. Quy tắc nghiệp vụ nằm trong tab "Cấu hình Agent" của khách. Plugin CHỈ ĐỌC
 *     tab đó — không có tool nào ghi vào nó (QT7).
 *  4. Không bao giờ ghi cả dòng. Chỉ ghi các cột được phép, gom thành từng dải
 *     liền kề để tiết kiệm quota (60 lượt ghi/phút cho 1 service account).
 *  5. Mặc định dry-run: chỉ đề xuất trong Telegram, chưa ghi vào Sheet thật.
 *
 * Toàn bộ logic quyết định nằm ở `rules.ts` + `scoring.ts` (pure, có unit test).
 * File này chỉ orchestrate: đọc → gọi logic → ghi → sinh text tiếng Việt.
 */

import { definePluginEntry } from 'openclaw/plugin-sdk/core';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk/core';

import {
  a1,
  extractSpreadsheetId,
  listTabs,
  loadConnectorConfig,
  readRange,
  resolveTab,
  writeRange,
  appendRow,
} from './connector';
import {
  isDryRun,
  loadSheetConfig,
  resolveSpreadsheetId,
  saveSheetConfig,
  tabName,
} from './config';
import { estimateDistances, mapsEnabled, topN } from './maps';
import type { LatLng } from './maps';
import {
  formatMinutesOfDay,
  normalizeKey,
  stampGmt7,
} from './parse';
import {
  agentMayTransition,
  canTransition,
  checkBlockers,
  effectiveDeadline,
  isFixedRouteDay,
  parseThresholds,
  resolveDeliveryGroup,
  widenArea,
} from './rules';
import {
  decideAssignment,
  distanceToDropoff,
  explainDecision,
  fmtNum,
  rankCandidates,
  scoreDriver,
} from './scoring';
import {
  ORDER_COLS,
  ORDER_COLS_READONLY,
  buildLayout,
  colAny,
  mapAreas,
  mapDrivers,
  mapOrders,
  mapWarehouse,
} from './sheet';
import type {
  AreaRow,
  Candidate,
  ConnectorConfig,
  Driver,
  ExceptionKind,
  Order,
  OrderStatus,
  SheetConfig,
  TabLayout,
  Thresholds,
  ToolErrorCode,
  ToolResult,
  Warehouse,
} from './types';

const MINUTE_MS = 60_000;

/** Trần số đơn xét mỗi lần quét — giữ thấp để không chạm rate limit Telegram. */
const DEFAULT_SCAN_LIMIT = 30;
const MAX_SCAN_LIMIT = 100;

/** Ngưỡng "sắp quá hạn" khi nhắc đơn (phút). */
const SOON_DUE_MINUTES = 60;

// ─── Kết quả tool ─────────────────────────────────────────────────────────────

function ok(text: string, details?: Record<string, unknown>): ToolResult {
  return { content: [{ type: 'text', text }], details };
}

function fail(text: string, error: ToolErrorCode, extra?: Record<string, unknown>): ToolResult {
  return { content: [{ type: 'text', text: `⚠️ ${text}` }], details: { error, ...extra } };
}

const NEEDS_SHEET_MSG =
  'Chưa cấu hình Google Sheet cho agent này. Hãy hỏi người vận hành gửi link Google Sheet ' +
  '(https://docs.google.com/spreadsheets/d/…) rồi gọi dp_set_sheet — sau đó mới điều phối được.';

function needSheet(): ToolResult {
  return fail(NEEDS_SHEET_MSG, 'need_sheet');
}

/**
 * OpenClaw gọi execute theo dạng `(toolCallId, args, context, onPartial)` — object
 * tham số là positional THỨ HAI, không phải thứ nhất. Lấy plain-object đầu tiên
 * để chịu được thay đổi thứ tự giữa các phiên bản gateway.
 */
function toolArgs<T>(rest: unknown[]): T {
  return (rest.find((a) => a && typeof a === 'object' && !Array.isArray(a)) ?? {}) as T;
}

// ─── Đọc toàn bộ dữ liệu làm việc ─────────────────────────────────────────────

interface Workspace {
  cfg: ConnectorConfig;
  sheetCfg: SheetConfig | null;
  spreadsheetId: string;
  orderTabTitle: string;
  orderLayout: TabLayout;
  orders: Order[];
  drivers: Driver[];
  areas: AreaRow[];
  warehouse: Warehouse | null;
  thresholds: Thresholds;
  dryRun: boolean;
}

/** Đọc header + dữ liệu một tab. Trả layout đã resolve theo tên cột. */
async function readTab(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  title: string,
  lastColumn: string,
  maxRows: number,
): Promise<{ layout: TabLayout; rows: string[][] }> {
  const values = await readRange(
    cfg,
    spreadsheetId,
    a1(title, `A1:${lastColumn}${maxRows}`),
  );
  const header = values[0] ?? [];
  return { layout: buildLayout(header, title), rows: values.slice(1) };
}

/**
 * Đọc 5 tab cần cho việc điều phối trong MỘT lượt: Cấu hình → Khu vực → Kho →
 * Tài xế → Đơn hàng. Tổng 5 lượt đọc, an toàn so với trần 60 lượt/phút.
 *
 * Ném lỗi có `code` để caller map thành `ToolErrorCode` tương ứng.
 */
async function loadWorkspace(explicitId?: string): Promise<Workspace> {
  const sheetCfg = loadSheetConfig();
  const spreadsheetId = resolveSpreadsheetId(explicitId);
  if (!spreadsheetId) throw Object.assign(new Error('need_sheet'), { code: 'need_sheet' });

  let cfg: ConnectorConfig;
  try {
    cfg = loadConnectorConfig();
  } catch (err) {
    throw Object.assign(new Error((err as Error).message), { code: 'no_connector' });
  }

  let tabs;
  try {
    tabs = await listTabs(cfg, spreadsheetId);
  } catch (err) {
    throw Object.assign(new Error((err as Error).message), { code: 'read_failed' });
  }

  const resolve = (which: Parameters<typeof tabName>[1]) => {
    const wanted = tabName(sheetCfg, which);
    const info = resolveTab(tabs, wanted);
    if (!info) {
      throw Object.assign(new Error(`không tìm thấy tab "${wanted}" trong Sheet`), {
        code: 'header_failed',
      });
    }
    return info.title;
  };

  const orderTitle = resolve('order');
  const driverTitle = resolve('driver');
  const areaTitle = resolve('area');
  const configTitle = resolve('config');
  const warehouseTitle = resolve('warehouse');

  try {
    const configTab = await readTab(cfg, spreadsheetId, configTitle, 'H', 200);
    const thresholds = parseThresholds(configTab.rows);

    const areaTab = await readTab(cfg, spreadsheetId, areaTitle, 'L', 60);
    const areas = mapAreas(areaTab.rows, areaTab.layout);

    const whTab = await readTab(cfg, spreadsheetId, warehouseTitle, 'H', 10);
    const warehouse = mapWarehouse(whTab.rows, whTab.layout);

    const driverTab = await readTab(cfg, spreadsheetId, driverTitle, 'AH', 300);
    const drivers = mapDrivers(driverTab.rows, driverTab.layout, 2);

    const orderTab = await readTab(cfg, spreadsheetId, orderTitle, 'AR', 2000);
    const orders = mapOrders(orderTab.rows, orderTab.layout, 2);

    return {
      cfg,
      sheetCfg,
      spreadsheetId,
      orderTabTitle: orderTitle,
      orderLayout: orderTab.layout,
      orders,
      drivers,
      areas,
      warehouse,
      thresholds,
      dryRun: isDryRun(sheetCfg),
    };
  } catch (err) {
    const e = err as Error & { code?: string };
    throw Object.assign(new Error(e.message), { code: e.code ?? 'read_failed' });
  }
}

/** Map lỗi từ loadWorkspace thành ToolResult tiếng Việt. */
function workspaceError(err: unknown): ToolResult {
  const e = err as Error & { code?: ToolErrorCode };
  if (e.code === 'need_sheet') return needSheet();
  if (e.code === 'no_connector') {
    return fail(
      `Không đọc được cấu hình connector: ${e.message}. Người vận hành cần kết nối Google Sheets trong app trước.`,
      'no_connector',
    );
  }
  if (e.code === 'header_failed') {
    return fail(`Sai bố cục Sheet: ${e.message}`, 'header_failed');
  }
  return fail(`Đọc Sheet lỗi: ${e.message}`, 'read_failed');
}

// ─── Ghi Sheet: chỉ cột được phép, gom dải liền kề ────────────────────────────

/**
 * Ghi một số cột của MỘT dòng tab Đơn hàng.
 *
 * Chặn cứng `ORDER_COLS_READONLY` (`Sẵn sàng đối soát` là CÔNG THỨC của khách,
 * `Trạng thái đối soát` do khâu đối soát ghi). Các cột được sort theo index rồi
 * gom thành dải liền kề, mỗi dải một lượt ghi — 5 cột phân công (`Trạng thái đơn`
 * → `Người phân công`) nằm liền nhau nên chỉ tốn 1 lượt.
 */
async function writeOrderCells(
  ws: Workspace,
  rowNumber: number,
  updates: Array<{ header: string; value: string }>,
): Promise<void> {
  const readonly = new Set(ORDER_COLS_READONLY.map(normalizeKey));
  const resolved: Array<{ index: number; letter: string; value: string }> = [];

  for (const u of updates) {
    if (readonly.has(normalizeKey(u.header))) {
      throw Object.assign(
        new Error(`cột "${u.header}" là cột chỉ đọc của khách, agent không được ghi`),
        { code: 'blocked_by_rule' },
      );
    }
    const ref = colAny(ws.orderLayout, [u.header]);
    if (!ref) {
      throw Object.assign(new Error(`không tìm thấy cột "${u.header}" trong tab đơn hàng`), {
        code: 'header_failed',
      });
    }
    resolved.push({ index: ref.index, letter: ref.letter, value: u.value });
  }

  resolved.sort((a, b) => a.index - b.index);

  let run: typeof resolved = [];
  const flush = async () => {
    if (run.length === 0) return;
    await writeRange(
      ws.cfg,
      ws.spreadsheetId,
      ws.orderTabTitle,
      `${run[0].letter}${rowNumber}`,
      [run.map((r) => r.value)],
    );
    run = [];
  };

  for (const cell of resolved) {
    if (run.length > 0 && cell.index !== run[run.length - 1].index + 1) await flush();
    run.push(cell);
  }
  await flush();
}

/** Ghi một dòng mới vào tab Ngoại lệ, xếp giá trị theo đúng header thật của tab. */
async function appendException(
  ws: Workspace,
  fields: Record<string, string>,
): Promise<void> {
  const title = tabName(ws.sheetCfg, 'exception');
  const tabs = await listTabs(ws.cfg, ws.spreadsheetId);
  const info = resolveTab(tabs, title);
  if (!info) {
    throw Object.assign(new Error(`không tìm thấy tab "${title}"`), { code: 'header_failed' });
  }
  const header = (await readRange(ws.cfg, ws.spreadsheetId, a1(info.title, 'A1:L1')))[0] ?? [];
  const row = header.map((h) => fields[normalizeKey(h)] ?? '');
  await appendRow(ws.cfg, ws.spreadsheetId, info.title, row);
}

// ─── Chấm điểm một đơn ────────────────────────────────────────────────────────

interface ScanResult {
  order: Order;
  ranked: Candidate[];
  chosen: Candidate | null;
  autoAssignable: boolean;
  blockedBy: string | null;
  exception: ExceptionKind | null;
  waiting: boolean;
  note: string;
  deadlineMs: number | null;
}

/** Tâm quận của một tài xế, dùng khi GPS thiếu/quá hạn. */
function areaCenterOf(driver: Driver, areas: AreaRow[]): LatLng | null {
  const need = normalizeKey(driver.primaryArea ?? '');
  const row = areas.find((a) => normalizeKey(a.district) === need);
  if (!row || row.centerLat === null || row.centerLng === null) return null;
  return { lat: row.centerLat, lng: row.centerLng };
}

/**
 * Xét 1 đơn: chặn nghiệp vụ → nới địa bàn → khoảng cách → chấm điểm → quyết định.
 *
 * Maps chỉ được gọi cho `topN()` ứng viên gần nhất (mặc định 3) để tổng số ô
 * tính tiền nằm trong 10.000 ô miễn phí mỗi tháng — xem đầu file maps.ts.
 */
async function evaluateOrder(ws: Workspace, order: Order, nowMs: number): Promise<ScanResult> {
  const t = ws.thresholds;
  const { group } = resolveDeliveryGroup(
    order.district,
    ws.areas,
    t,
    order.distanceFromWarehouseKm,
  );
  const deadlineMs = effectiveDeadline(order, group, t);

  const blocker = checkBlockers(order, t, nowMs, group);
  if (blocker) {
    return {
      order,
      ranked: [],
      chosen: null,
      autoAssignable: false,
      blockedBy: null,
      exception: blocker,
      waiting: false,
      note: `${blocker} — Agent dừng, chuyển điều phối viên.`,
      deadlineMs,
    };
  }

  // Địa bàn Tuyến cố định (Củ Chi, Cần Giờ): ngoài ngày chạy tuyến thì GIỮ đơn ở
  // Chờ phân công, không tạo ngoại lệ và không cam kết giờ giao.
  if (group === 'Tuyến cố định' && !isFixedRouteDay(t, nowMs)) {
    return {
      order,
      ranked: [],
      chosen: null,
      autoAssignable: false,
      blockedBy: null,
      exception: null,
      waiting: true,
      note: 'Địa bàn Tuyến cố định, hôm nay không phải ngày chạy tuyến → giữ ở Chờ phân công.',
      deadlineMs,
    };
  }

  const { passed, level } = widenArea(order, ws.drivers, ws.areas, t, nowMs);
  if (passed.length === 0) {
    return {
      order,
      ranked: [],
      chosen: null,
      autoAssignable: false,
      blockedBy: 'khong-co-ung-vien',
      exception: 'Hết tài xế trong khu vực',
      waiting: false,
      note: 'Không còn tài xế đủ điều kiện trong khu vực → chuyển điều phối viên.',
      deadlineMs,
    };
  }

  // Khoảng cách: haversine cho mọi ứng viên (0đ), Maps chỉ cho top N gần nhất.
  const perDriver = passed.map((d) => ({
    driver: d,
    base: distanceToDropoff(d, order, {
      nowMs,
      gpsStaleMinutes: t.gpsStaleMinutes,
      areaCenter: areaCenterOf(d, ws.areas),
    }),
  }));

  let mapsNote = '';
  const refined = new Map<string, { km: number | null; source: string }>();
  const withCoords = perDriver.filter((p) => p.base.km !== null);
  if (
    order.lat !== null &&
    order.lng !== null &&
    mapsEnabled() &&
    withCoords.length > 0
  ) {
    const origins: LatLng[] = [];
    const owners: string[] = [];
    for (const p of withCoords) {
      const gps =
        p.driver.lat !== null && p.driver.lng !== null
          ? { lat: p.driver.lat, lng: p.driver.lng }
          : areaCenterOf(p.driver, ws.areas);
      if (!gps) continue;
      origins.push(gps);
      owners.push(p.driver.code);
    }
    if (origins.length > 0) {
      const est = await estimateDistances(origins, { lat: order.lat, lng: order.lng }, {
        maxCalls: topN(),
      });
      mapsNote = est.note;
      est.results.forEach((r, i) => {
        if (r.source === 'maps') refined.set(owners[i], { km: r.km, source: 'maps' });
      });
    }
  }

  const candidates = perDriver.map((p) => {
    const better = refined.get(p.driver.code);
    const km = better?.km ?? p.base.km;
    const source = better ? 'maps' : p.base.source;
    return scoreDriver(p.driver, order, {
      t,
      level,
      nowMs,
      deadlineMs,
      distanceKm: km,
      distanceSource: source,
    });
  });

  const ranked = rankCandidates(candidates);
  const decision = decideAssignment(ranked, t);

  const noteParts = [explainDecision(decision, t)];
  if (level !== 'dia-ban-chinh') {
    noteParts.push(`Đã nới địa bàn: ${level.replace(/-/g, ' ')}.`);
  }
  if (mapsNote && !mapsNote.startsWith('Chưa cấu hình')) noteParts.push(mapsNote);

  return {
    order,
    ranked,
    chosen: decision.chosen,
    autoAssignable: decision.autoAssignable,
    blockedBy: decision.blockedBy,
    exception: null,
    waiting: false,
    note: noteParts.join(' '),
    deadlineMs,
  };
}

// ─── Sinh văn bản tiếng Việt ──────────────────────────────────────────────────

function deadlineLabel(deadlineMs: number | null, nowMs: number): string {
  if (deadlineMs === null) return 'chưa có hạn';
  const mins = Math.round((deadlineMs - nowMs) / MINUTE_MS);
  const clock = stampGmt7(deadlineMs).slice(11);
  if (mins < 0) return `QUÁ HẠN ${-mins} phút (${clock})`;
  if (mins <= SOON_DUE_MINUTES) return `còn ${mins} phút (${clock})`;
  return `hạn ${clock}`;
}

function money(vnd: number): string {
  return `${Math.round(vnd).toLocaleString('vi-VN')}đ`;
}

/**
 * Gom các đơn đã chọn tài xế thành MỘT bản tin, chia khối theo tài xế.
 *
 * Bắt buộc gom: Telegram chỉ cho bot gửi 20 tin/phút trong một group, nổ 71 đơn
 * thành 71 tin sẽ bị chặn.
 */
function buildDispatchMessage(results: ScanResult[], nowMs: number): string {
  const byDriver = new Map<string, { driver: Driver; items: ScanResult[] }>();
  for (const r of results) {
    if (!r.chosen) continue;
    const key = r.chosen.driver.code;
    const bucket = byDriver.get(key) ?? { driver: r.chosen.driver, items: [] };
    bucket.items.push(r);
    byDriver.set(key, bucket);
  }
  if (byDriver.size === 0) return '';

  const lines: string[] = [`📦 Phân công ${results.filter((r) => r.chosen).length} đơn — ${stampGmt7(nowMs)}`];

  for (const { driver, items } of [...byDriver.values()].sort((a, b) =>
    a.driver.code.localeCompare(b.driver.code),
  )) {
    const totalKg = items.reduce((s, r) => s + (r.order.weightKg ?? 0), 0);
    lines.push('');
    lines.push(
      `🛵 ${driver.name} (${driver.code}) — ${items.length} đơn · ${fmtNum(totalKg, 1)} kg`,
    );
    for (const r of items) {
      const o = r.order;
      const bits = [o.district, deadlineLabel(r.deadlineMs, nowMs)];
      if (o.codAmount > 0) bits.push(`COD ${money(o.codAmount)}`);
      bits.push(r.chosen?.reason ?? '');
      lines.push(`  • ${o.code} · ${bits.filter(Boolean).join(' · ')}`);
    }
  }

  lines.push('');
  lines.push('👉 Tài xế xác nhận: reply vào tin này, nhắn kèm MÃ ĐƠN (ví dụ "OK DH-20260812-001").');
  return lines.join('\n');
}

// ─── Tool 1: dp_status ────────────────────────────────────────────────────────

function createStatusTool() {
  return {
    name: 'dp_status',
    label: 'Điều phối · trạng thái cấu hình',
    description:
      'Kiểm tra agent đã được cấu hình Google Sheet chưa. GỌI ĐẦU TIÊN ở mọi cuộc trò chuyện, ' +
      'trước khi chào hỏi hay gợi ý gì. Không gọi mạng, không đọc Sheet. ' +
      'configured=false → phải hỏi người vận hành gửi link Sheet rồi gọi dp_set_sheet.',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
    execute: async () => {
      const cfg = loadSheetConfig();
      const configured = cfg !== null;
      const dryRun = isDryRun(cfg);
      const lines = configured
        ? [
            '✅ Đã cấu hình Google Sheet.',
            `• Tab đơn hàng: ${tabName(cfg, 'order')} · tài xế: ${tabName(cfg, 'driver')}`,
            `• Chế độ: ${dryRun ? 'CHỈ ĐỀ XUẤT (chưa ghi vào Sheet)' : 'GHI THẬT vào Sheet'}`,
            `• Google Maps: ${mapsEnabled() ? `bật, tối đa ${topN()} ứng viên mỗi đơn` : 'tắt — dùng khoảng cách đường chim bay (0đ)'}`,
          ]
        : ['❌ Chưa cấu hình Google Sheet.', NEEDS_SHEET_MSG];
      return ok(lines.join('\n'), {
        configured,
        dryRun,
        mapsEnabled: mapsEnabled(),
        mapsTopN: topN(),
      });
    },
  };
}

// ─── Tool 2: dp_set_sheet ─────────────────────────────────────────────────────

interface SetSheetArgs {
  url?: string;
  dryRun?: boolean;
  orderTab?: string;
  driverTab?: string;
}

function createSetSheetTool() {
  return {
    name: 'dp_set_sheet',
    label: 'Điều phối · lưu link Sheet',
    description:
      'Lưu Google Sheet mà agent sẽ điều phối trên đó. Truyền `url` là link người vận hành gửi ' +
      '(https://docs.google.com/spreadsheets/d/…) — plugin tự bóc id. ' +
      'Sau khi lưu, plugin kiểm tra Sheet có đủ các tab bắt buộc và báo lại. ' +
      'Đặt `dryRun: false` chỉ khi người vận hành nói RÕ là muốn agent ghi thật vào Sheet.',
    parameters: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'Link hoặc id Google Sheet.' },
        dryRun: {
          type: 'boolean',
          description:
            'true (mặc định) = chỉ đề xuất trong Telegram, không ghi Sheet. false = ghi thật.',
        },
        orderTab: { type: 'string', description: 'Tên tab đơn hàng nếu khác mặc định "Đơn hàng".' },
        driverTab: { type: 'string', description: 'Tên tab tài xế nếu khác mặc định "Tài xế".' },
      },
      required: ['url'] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = toolArgs<SetSheetArgs>(rest);
      const raw = (args.url ?? '').trim();
      if (!raw) return fail('Thiếu link Google Sheet.', 'bad_args');
      const id = extractSpreadsheetId(raw);
      if (!id) {
        return fail(
          'Không đọc được id từ link đó. Link phải dạng https://docs.google.com/spreadsheets/d/<ID>/edit',
          'bad_args',
        );
      }

      const next: SheetConfig = { spreadsheetId: id };
      if (args.dryRun !== undefined) next.dryRun = args.dryRun;
      if (args.orderTab) next.orderTab = args.orderTab;
      if (args.driverTab) next.driverTab = args.driverTab;
      try {
        saveSheetConfig(next);
      } catch (err) {
        return fail(`Không lưu được cấu hình: ${(err as Error).message}`, 'write_failed');
      }

      // Kiểm tra bố cục ngay để người vận hành biết lỗi sớm, thay vì lỗi giữa buổi.
      const saved = loadSheetConfig();
      const wanted: Array<Parameters<typeof tabName>[1]> = [
        'order',
        'driver',
        'area',
        'config',
        'warehouse',
        'exception',
      ];
      try {
        const cfg = loadConnectorConfig();
        const tabs = await listTabs(cfg, id);
        const missing = wanted
          .map((w) => tabName(saved, w))
          .filter((title) => resolveTab(tabs, title) === null);
        const mode = isDryRun(saved)
          ? 'chỉ đề xuất, chưa ghi vào Sheet'
          : 'GHI THẬT vào Sheet';
        if (missing.length > 0) {
          return ok(
            `Đã lưu Sheet (${mode}), nhưng thiếu tab: ${missing.join(', ')}. ` +
              'Người vận hành cần thêm/đổi tên các tab này trước khi điều phối.',
            { spreadsheetId: id, missingTabs: missing },
          );
        }
        return ok(
          `Đã lưu Sheet, đủ 6 tab bắt buộc. Chế độ: ${mode}.\n` +
            'Nhắn "quét đơn" để tôi xét các đơn đang Chờ phân công.',
          { spreadsheetId: id, missingTabs: [] },
        );
      } catch (err) {
        return ok(
          `Đã lưu Sheet, nhưng chưa kiểm tra được bố cục: ${(err as Error).message}. ` +
            'Kiểm tra lại kết nối Google Sheets trong app.',
          { spreadsheetId: id, verified: false },
        );
      }
    },
  };
}

// ─── Tool 3: dp_quet_don ──────────────────────────────────────────────────────

interface ScanArgs {
  limit?: number;
  write?: boolean;
  spreadsheetId?: string;
}

function createScanTool() {
  return {
    name: 'dp_quet_don',
    label: 'Điều phối · quét đơn chờ',
    description:
      'Quét các đơn có Trạng thái đơn = "Chờ phân công", chấm điểm chọn tài xế theo quy tắc trong ' +
      'tab Cấu hình Agent, trả về bản tin phân công ĐÃ GOM THEO TÀI XẾ (gửi nguyên vào group tài xế). ' +
      'Plugin tự đọc Sheet — chỉ cần truyền `limit` (mặc định 30, tối đa 100). ' +
      '`write: true` mới ghi vào Sheet, và chỉ ghi những đơn đủ tự tin; mặc định false (chỉ đề xuất). ' +
      'Không có đơn nào thì trả về đúng câu "Không có đơn nào chờ phân công" — khi đó agent PHẢI im lặng, không gửi tin.',
    parameters: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Số đơn tối đa xét mỗi lần (mặc định 30, tối đa 100).' },
        write: {
          type: 'boolean',
          description:
            'Ghi kết quả phân công vào Sheet. Mặc định false. Bị bỏ qua nếu cấu hình đang ở chế độ chỉ đề xuất.',
        },
        spreadsheetId: { type: 'string', description: 'Ghi đè id Sheet cho lần gọi này (ít dùng).' },
      },
      required: [] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = toolArgs<ScanArgs>(rest);
      const nowMs = Date.now();
      let ws: Workspace;
      try {
        ws = await loadWorkspace(args.spreadsheetId);
      } catch (err) {
        return workspaceError(err);
      }

      const limit = Math.min(
        MAX_SCAN_LIMIT,
        Math.max(1, Math.floor(args.limit ?? DEFAULT_SCAN_LIMIT)),
      );
      const pending = ws.orders
        .filter((o) => normalizeKey(o.status) === normalizeKey('Chờ phân công'))
        .slice(0, limit);

      if (pending.length === 0) {
        return ok('Không có đơn nào chờ phân công.', { scanned: 0, assigned: 0 });
      }

      const results: ScanResult[] = [];
      for (const order of pending) {
        results.push(await evaluateOrder(ws, order, nowMs));
      }

      // Ghi Sheet: chỉ khi được yêu cầu, không ở chế độ dry-run, và đơn đủ tự tin.
      const wantWrite = args.write === true && !ws.dryRun;
      const written: string[] = [];
      const writeErrors: string[] = [];
      if (wantWrite) {
        const stamp = stampGmt7(nowMs);
        for (const r of results) {
          if (!r.chosen || !r.autoAssignable) continue;
          try {
            await writeOrderCells(ws, r.order.rowNumber, [
              { header: ORDER_COLS.status, value: 'Đã phân công' },
              { header: ORDER_COLS.driverCode, value: r.chosen.driver.code },
              { header: ORDER_COLS.plate, value: r.chosen.driver.plate },
              { header: ORDER_COLS.assignedAt, value: stamp },
              { header: ORDER_COLS.assignedBy, value: 'Agent' },
              { header: ORDER_COLS.agentNote, value: `${r.chosen.reason} — ${r.note}` },
              { header: ORDER_COLS.updatedBy, value: 'Agent' },
              { header: ORDER_COLS.updatedAt, value: stamp },
            ]);
            written.push(r.order.code);
          } catch (err) {
            writeErrors.push(`${r.order.code}: ${(err as Error).message}`);
          }
        }
      }

      const assignable = results.filter((r) => r.chosen && r.autoAssignable);
      const needsApproval = results.filter((r) => r.chosen && !r.autoAssignable);
      const exceptions = results.filter((r) => r.exception !== null);
      const waiting = results.filter((r) => r.waiting);

      const parts: string[] = [];
      const message = buildDispatchMessage(
        wantWrite ? assignable : [...assignable, ...needsApproval],
        nowMs,
      );
      if (message) parts.push(message);

      if (needsApproval.length > 0) {
        parts.push('');
        parts.push(`🙋 Cần điều phối viên duyệt (${needsApproval.length} đơn):`);
        for (const r of needsApproval) {
          parts.push(
            `  • ${r.order.code} → đề xuất ${r.chosen?.driver.code} (${fmtNum(r.chosen?.score.total ?? 0, 2)}) · ${r.note}`,
          );
        }
      }
      if (exceptions.length > 0) {
        parts.push('');
        parts.push(`⚠️ Không tự xử lý được (${exceptions.length} đơn):`);
        for (const r of exceptions) parts.push(`  • ${r.order.code} — ${r.exception}`);
      }
      if (waiting.length > 0) {
        parts.push('');
        parts.push(
          `⏸️ Giữ chờ tuyến cố định (${waiting.length} đơn): ${waiting.map((r) => r.order.code).join(', ')}`,
        );
      }
      if (wantWrite) {
        parts.push('');
        parts.push(
          `📝 Đã ghi Sheet cho ${written.length} đơn${writeErrors.length ? `, ${writeErrors.length} lỗi ghi` : ''}.`,
        );
      } else if (ws.dryRun && args.write === true) {
        parts.push('');
        parts.push(
          'ℹ️ Cấu hình đang ở chế độ CHỈ ĐỀ XUẤT nên tôi không ghi vào Sheet. ' +
            'Muốn ghi thật, người vận hành cần yêu cầu rõ để đổi cấu hình.',
        );
      }

      return ok(parts.join('\n').trim(), {
        scanned: results.length,
        assignable: assignable.length,
        needsApproval: needsApproval.length,
        exceptions: exceptions.map((r) => ({ code: r.order.code, kind: r.exception })),
        waiting: waiting.map((r) => r.order.code),
        written,
        writeErrors,
        dryRun: ws.dryRun,
      });
    },
  };
}

// ─── Tool 4: dp_phan_cong ─────────────────────────────────────────────────────

interface AssignArgs {
  orderCode?: string;
  driverCode?: string;
  force?: boolean;
}

function createAssignTool() {
  return {
    name: 'dp_phan_cong',
    label: 'Điều phối · chốt phân công',
    description:
      'Chốt phân công MỘT đơn cho một tài xế và ghi vào Sheet. Không truyền `driverCode` thì dùng ' +
      'ứng viên số 1 do plugin chấm. `force: true` chỉ dùng khi điều phối viên đã duyệt bằng miệng ' +
      'một đề xuất bị chặn vì điểm thấp / chênh lệch nhỏ — KHÔNG dùng để vượt trần tải trọng hay ' +
      'trần số đơn (QT2), plugin vẫn chặn những trường hợp đó.',
    parameters: {
      type: 'object' as const,
      properties: {
        orderCode: { type: 'string', description: 'Mã đơn, ví dụ DH-20260812-001.' },
        driverCode: { type: 'string', description: 'Mã tài xế, ví dụ TX-021. Bỏ trống = ứng viên số 1.' },
        force: {
          type: 'boolean',
          description: 'Bỏ qua chặn điểm thấp/chênh lệch nhỏ khi đã có người duyệt.',
        },
      },
      required: ['orderCode'] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = toolArgs<AssignArgs>(rest);
      const code = (args.orderCode ?? '').trim();
      if (!code) return fail('Thiếu mã đơn.', 'bad_args');
      const nowMs = Date.now();

      let ws: Workspace;
      try {
        ws = await loadWorkspace();
      } catch (err) {
        return workspaceError(err);
      }

      const order = ws.orders.find((o) => normalizeKey(o.code) === normalizeKey(code));
      if (!order) return fail(`Không tìm thấy đơn ${code} trong Sheet.`, 'not_found');

      if (!canTransition(order.status, 'Đã phân công')) {
        return fail(
          `Đơn ${code} đang ở trạng thái "${order.status}" nên không thể chuyển sang "Đã phân công". ` +
            'Muốn đổi tài xế thì cần điều phối viên xử lý (cho_phep_tu_doi_tai_xe = 0).',
          'blocked_by_rule',
        );
      }

      const evaluated = await evaluateOrder(ws, order, nowMs);
      if (evaluated.exception) {
        return fail(
          `Đơn ${code}: ${evaluated.exception} — Agent không tự xử lý. Gọi dp_ngoai_le để chuyển điều phối viên.`,
          'blocked_by_rule',
          { exception: evaluated.exception },
        );
      }
      if (evaluated.waiting) {
        return fail(
          `Đơn ${code} thuộc địa bàn Tuyến cố định, hôm nay không phải ngày chạy tuyến → giữ ở Chờ phân công.`,
          'blocked_by_rule',
        );
      }

      let picked: Candidate | null = evaluated.chosen;
      if (args.driverCode) {
        const want = normalizeKey(args.driverCode);
        picked = evaluated.ranked.find((c) => normalizeKey(c.driver.code) === want) ?? null;
        if (!picked) {
          const list = evaluated.ranked.map((c) => c.driver.code).join(', ') || 'không có';
          return fail(
            `Tài xế ${args.driverCode} không đủ điều kiện nhận đơn ${code}. Ứng viên hợp lệ: ${list}.`,
            'blocked_by_rule',
          );
        }
      }
      if (!picked) {
        return fail(
          `Không có tài xế nào đủ điều kiện cho đơn ${code}. ${evaluated.note}`,
          'blocked_by_rule',
        );
      }
      if (!evaluated.autoAssignable && args.force !== true && !args.driverCode) {
        return fail(
          `${evaluated.note} Cần điều phối viên duyệt rồi gọi lại với force: true, hoặc chỉ định driverCode.`,
          'blocked_by_rule',
          { blockedBy: evaluated.blockedBy, suggested: picked.driver.code },
        );
      }

      if (ws.dryRun) {
        return ok(
          `(Chế độ chỉ đề xuất) Đơn ${code} → ${picked.driver.name} (${picked.driver.code}) · ${picked.reason}. ` +
            'Chưa ghi vào Sheet.',
          { dryRun: true, orderCode: code, driverCode: picked.driver.code },
        );
      }

      const stamp = stampGmt7(nowMs);
      try {
        await writeOrderCells(ws, order.rowNumber, [
          { header: ORDER_COLS.status, value: 'Đã phân công' },
          { header: ORDER_COLS.driverCode, value: picked.driver.code },
          { header: ORDER_COLS.plate, value: picked.driver.plate },
          { header: ORDER_COLS.assignedAt, value: stamp },
          { header: ORDER_COLS.assignedBy, value: args.force ? 'Người: đã duyệt' : 'Agent' },
          { header: ORDER_COLS.agentNote, value: `${picked.reason} — ${evaluated.note}` },
          { header: ORDER_COLS.updatedBy, value: 'Agent' },
          { header: ORDER_COLS.updatedAt, value: stamp },
        ]);
      } catch (err) {
        const e = err as Error & { code?: ToolErrorCode };
        return fail(`Ghi Sheet lỗi: ${e.message}`, e.code ?? 'write_failed');
      }

      return ok(
        `✅ Đơn ${code} → ${picked.driver.name} (${picked.driver.code}), xe ${picked.driver.plate}. ` +
          `Điểm ${fmtNum(picked.score.total, 2)} · ${picked.reason}.`,
        { orderCode: code, driverCode: picked.driver.code, score: picked.score.total },
      );
    },
  };
}

// ─── Tool 5: dp_ghi_nhan ──────────────────────────────────────────────────────

type DriverEvent = 'xac-nhan' | 'lay-hang' | 'dang-giao' | 'giao-xong' | 'gui-pod' | 'that-bai';

interface RecordArgs {
  orderCode?: string;
  event?: DriverEvent;
  podUrl?: string;
  failReason?: string;
  amount?: number;
}

/** event của tài xế → trạng thái đích. `gui-pod` phụ thuộc có ảnh hay không. */
const EVENT_STATUS: Record<DriverEvent, OrderStatus> = {
  'xac-nhan': 'Tài xế xác nhận',
  'lay-hang': 'Đã lấy hàng',
  'dang-giao': 'Đang giao',
  'giao-xong': 'Chờ ảnh POD',
  'gui-pod': 'Đã giao',
  'that-bai': 'Giao thất bại',
};

function createRecordTool() {
  return {
    name: 'dp_ghi_nhan',
    label: 'Điều phối · ghi nhận tài xế báo',
    description:
      'Ghi nhận việc tài xế báo về một đơn. `event`: xac-nhan (nhận đơn) · lay-hang · dang-giao · ' +
      'giao-xong (báo đã giao, CHƯA có ảnh) · gui-pod (đã có ảnh POD) · that-bai (kèm failReason). ' +
      'QT8: "giao-xong" chỉ đưa đơn tới "Chờ ảnh POD"; phải có ảnh POD (event gui-pod + podUrl) mới ' +
      'lên "Đã giao". Plugin tự kiểm bảng chuyển trạng thái, agent không được lách.',
    parameters: {
      type: 'object' as const,
      properties: {
        orderCode: { type: 'string', description: 'Mã đơn tài xế nhắc tới.' },
        event: {
          type: 'string',
          enum: ['xac-nhan', 'lay-hang', 'dang-giao', 'giao-xong', 'gui-pod', 'that-bai'],
          description: 'Việc tài xế báo.',
        },
        podUrl: { type: 'string', description: 'Link/file_id ảnh POD, bắt buộc khi event = gui-pod.' },
        failReason: { type: 'string', description: 'Lý do thất bại, bắt buộc khi event = that-bai.' },
        amount: { type: 'number', description: 'Số tiền tài xế báo đã thu (COD), nếu có.' },
      },
      required: ['orderCode', 'event'] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = toolArgs<RecordArgs>(rest);
      const code = (args.orderCode ?? '').trim();
      const event = args.event;
      if (!code) return fail('Thiếu mã đơn. Hỏi lại tài xế: "ảnh/tin này của đơn nào?"', 'bad_args');
      if (!event || !(event in EVENT_STATUS)) return fail('Thiếu hoặc sai `event`.', 'bad_args');
      if (event === 'gui-pod' && !(args.podUrl ?? '').trim()) {
        return fail('event = gui-pod nhưng thiếu `podUrl`.', 'bad_args');
      }
      if (event === 'that-bai' && !(args.failReason ?? '').trim()) {
        return fail('event = that-bai nhưng thiếu `failReason`.', 'bad_args');
      }

      const nowMs = Date.now();
      let ws: Workspace;
      try {
        ws = await loadWorkspace();
      } catch (err) {
        return workspaceError(err);
      }

      const order = ws.orders.find((o) => normalizeKey(o.code) === normalizeKey(code));
      if (!order) return fail(`Không tìm thấy đơn ${code} trong Sheet.`, 'not_found');

      const target = EVENT_STATUS[event];
      if (!agentMayTransition(target)) {
        return fail(
          `Agent không được đặt trạng thái "${target}" — chỉ Người mới được. Chuyển điều phối viên.`,
          'blocked_by_rule',
        );
      }
      if (!canTransition(order.status, target)) {
        return fail(
          `Đơn ${code} đang "${order.status}", không thể chuyển sang "${target}".`,
          'blocked_by_rule',
          { from: order.status, to: target },
        );
      }
      // QT8 — chốt lại ở tầng plugin, không tin vào prompt.
      if (target === 'Đã giao' && ws.thresholds.requirePodBeforeDelivered) {
        const pod = (args.podUrl ?? order.podUrl ?? '').trim();
        if (!pod) {
          return fail(
            `QT8: đơn ${code} chưa có ảnh POD nên không được chuyển "Đã giao". Yêu cầu tài xế gửi ảnh.`,
            'blocked_by_rule',
          );
        }
      }

      const stamp = stampGmt7(nowMs);
      const updates: Array<{ header: string; value: string }> = [
        { header: ORDER_COLS.status, value: target },
        { header: ORDER_COLS.updatedBy, value: 'Agent' },
        { header: ORDER_COLS.updatedAt, value: stamp },
      ];
      if (event === 'xac-nhan') updates.push({ header: ORDER_COLS.driverConfirmedAt, value: stamp });
      if (event === 'lay-hang') updates.push({ header: ORDER_COLS.pickedUpAt, value: stamp });
      if (event === 'giao-xong') updates.push({ header: ORDER_COLS.deliveredAt, value: stamp });
      if (event === 'gui-pod') {
        updates.push({ header: ORDER_COLS.podUrl, value: (args.podUrl ?? '').trim() });
        if (order.deliveredAt === null) {
          updates.push({ header: ORDER_COLS.deliveredAt, value: stamp });
        }
      }
      if (event === 'that-bai') {
        updates.push({ header: ORDER_COLS.failReason, value: (args.failReason ?? '').trim() });
        updates.push({ header: ORDER_COLS.attempts, value: String(order.attempts + 1) });
      }
      if (typeof args.amount === 'number' && Number.isFinite(args.amount)) {
        // KHÔNG ghi vào "Số tiền đã thu" (ô người xác nhận). Chỉ ghi nhận vào ghi chú.
        updates.push({
          header: ORDER_COLS.agentNote,
          value: `Tài xế báo đã thu ${money(args.amount)} lúc ${stamp} (chờ đối soát xác nhận).`,
        });
      }

      // Quá số lần giao → không tự hoàn kho (QT9), báo để chuyển người.
      const overAttempts =
        event === 'that-bai' && order.attempts + 1 >= ws.thresholds.maxDeliveryAttempts;

      if (ws.dryRun) {
        return ok(
          `(Chế độ chỉ đề xuất) Đơn ${code}: "${order.status}" → "${target}". Chưa ghi vào Sheet.` +
            (overAttempts
              ? `\n⚠️ QT9: đã ${order.attempts + 1}/${ws.thresholds.maxDeliveryAttempts} lần giao — cần điều phối viên quyết hoàn kho hay hẹn giao lại.`
              : ''),
          { dryRun: true, orderCode: code, from: order.status, to: target, overAttempts },
        );
      }

      try {
        await writeOrderCells(ws, order.rowNumber, updates);
      } catch (err) {
        const e = err as Error & { code?: ToolErrorCode };
        return fail(`Ghi Sheet lỗi: ${e.message}`, e.code ?? 'write_failed');
      }

      const lines = [`✅ Đơn ${code}: "${order.status}" → "${target}".`];
      if (target === 'Chờ ảnh POD') {
        lines.push('Nhắc tài xế gửi ảnh POD để chốt "Đã giao" (QT8).');
      }
      if (overAttempts) {
        lines.push(
          `⚠️ QT9: đã ${order.attempts + 1}/${ws.thresholds.maxDeliveryAttempts} lần giao. ` +
            'Agent KHÔNG tự hoàn kho — chuyển điều phối viên quyết định.',
        );
      }
      return ok(lines.join('\n'), {
        orderCode: code,
        from: order.status,
        to: target,
        overAttempts,
      });
    },
  };
}

// ─── Tool 6: dp_kiem_qua_han ──────────────────────────────────────────────────

const CLOSED_STATUSES = ['Đã giao', 'Đã hoàn kho', 'Đã huỷ', 'Ngoài phạm vi'].map(normalizeKey);

function createOverdueTool() {
  return {
    name: 'dp_kiem_qua_han',
    label: 'Điều phối · đơn quá hạn',
    description:
      'Liệt kê đơn ĐÃ quá hạn giao và đơn SẮP quá hạn (còn ≤ 60 phút), kèm tài xế đang giữ. ' +
      'Chỉ dùng Mã đơn, không trả số điện thoại khách (QT13) — an toàn để gửi vào group điều phối. ' +
      'Không có đơn nào thì trả "Không có đơn quá hạn" và agent PHẢI im lặng.',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
    execute: async () => {
      const nowMs = Date.now();
      let ws: Workspace;
      try {
        ws = await loadWorkspace();
      } catch (err) {
        return workspaceError(err);
      }

      const open = ws.orders.filter((o) => !CLOSED_STATUSES.includes(normalizeKey(o.status)));
      const rows: Array<{ order: Order; deadlineMs: number | null; minutes: number }> = [];
      for (const o of open) {
        const { group } = resolveDeliveryGroup(
          o.district,
          ws.areas,
          ws.thresholds,
          o.distanceFromWarehouseKm,
        );
        // Tuyến cố định không áp hạn giao trong ngày → bỏ khỏi danh sách nhắc.
        if (group === 'Tuyến cố định') continue;
        const deadlineMs = effectiveDeadline(o, group, ws.thresholds);
        if (deadlineMs === null) continue;
        const minutes = Math.round((deadlineMs - nowMs) / MINUTE_MS);
        if (minutes <= SOON_DUE_MINUTES) rows.push({ order: o, deadlineMs, minutes });
      }
      if (rows.length === 0) return ok('Không có đơn quá hạn.', { overdue: 0, soon: 0 });

      rows.sort((a, b) => a.minutes - b.minutes);
      const overdue = rows.filter((r) => r.minutes < 0);
      const soon = rows.filter((r) => r.minutes >= 0);

      const lines = [`⏰ Đơn cần chú ý — ${stampGmt7(nowMs)}`];
      if (overdue.length > 0) {
        lines.push('');
        lines.push(`🔴 Đã quá hạn (${overdue.length}):`);
        for (const r of overdue) {
          lines.push(
            `  • ${r.order.code} · ${r.order.district} · ${r.order.status} · ${r.order.driverCode || 'chưa có tài xế'} · quá ${-r.minutes} phút`,
          );
        }
      }
      if (soon.length > 0) {
        lines.push('');
        lines.push(`🟡 Sắp tới hạn (${soon.length}):`);
        for (const r of soon) {
          lines.push(
            `  • ${r.order.code} · ${r.order.district} · ${r.order.status} · ${r.order.driverCode || 'chưa có tài xế'} · còn ${r.minutes} phút`,
          );
        }
      }
      return ok(lines.join('\n'), {
        overdue: overdue.length,
        soon: soon.length,
        codes: rows.map((r) => r.order.code),
      });
    },
  };
}

// ─── Tool 7: dp_bao_cao_ngay ──────────────────────────────────────────────────

function createDailyReportTool() {
  return {
    name: 'dp_bao_cao_ngay',
    label: 'Điều phối · báo cáo cuối ngày',
    description:
      'Báo cáo cuối ngày: số đơn theo trạng thái, đơn thiếu ảnh POD, đơn COD thiếu ảnh chứng từ tiền, ' +
      'chứng từ giấy chưa thu hồi, và danh sách tài xế còn đơn treo. Gửi vào group điều phối. ' +
      'Agent KHÔNG đối soát tiền — chỉ liệt kê đơn còn thiếu chứng từ để khâu đối soát xử lý.',
    parameters: { type: 'object' as const, properties: {}, required: [] as string[] },
    execute: async () => {
      const nowMs = Date.now();
      let ws: Workspace;
      try {
        ws = await loadWorkspace();
      } catch (err) {
        return workspaceError(err);
      }

      const today = stampGmt7(nowMs).slice(0, 10);
      const todays = ws.orders.filter((o) => {
        const created = o.createdAt === null ? '' : stampGmt7(o.createdAt).slice(0, 10);
        const assigned = o.assignedAt === null ? '' : stampGmt7(o.assignedAt).slice(0, 10);
        return created === today || assigned === today;
      });
      const scope = todays.length > 0 ? todays : ws.orders;

      const byStatus = new Map<string, number>();
      for (const o of scope) byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);

      const missingPod = scope.filter(
        (o) => normalizeKey(o.status) === normalizeKey('Chờ ảnh POD') || (o.deliveredAt !== null && !o.podUrl),
      );
      const missingCash = scope.filter((o) => o.codAmount > 0 && !o.podUrl && o.deliveredAt !== null);
      const paperPending = scope.filter((o) => o.hasPaperDoc && o.deliveredAt !== null);

      const openByDriver = new Map<string, number>();
      for (const o of scope) {
        if (CLOSED_STATUSES.includes(normalizeKey(o.status))) continue;
        if (!o.driverCode) continue;
        openByDriver.set(o.driverCode, (openByDriver.get(o.driverCode) ?? 0) + 1);
      }

      const lines = [
        `📊 Báo cáo điều phối ${today} — ${stampGmt7(nowMs).slice(11)}`,
        `Tổng đơn trong phạm vi báo cáo: ${scope.length}`,
        '',
        'Theo trạng thái:',
        ...[...byStatus.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([s, n]) => `  • ${s}: ${n}`),
      ];

      if (missingPod.length > 0) {
        lines.push('');
        lines.push(`📷 Thiếu ảnh POD (${missingPod.length}): ${missingPod.map((o) => o.code).join(', ')}`);
      }
      if (missingCash.length > 0) {
        lines.push(
          `💵 COD thiếu ảnh chứng từ tiền (${missingCash.length}): ${missingCash.map((o) => o.code).join(', ')}`,
        );
      }
      if (paperPending.length > 0) {
        lines.push(
          `📄 Chứng từ giấy cần thu hồi (${paperPending.length}): ${paperPending.map((o) => o.code).join(', ')}`,
        );
      }
      if (openByDriver.size > 0) {
        lines.push('');
        lines.push('🛵 Tài xế còn đơn treo:');
        for (const [driverCode, n] of [...openByDriver.entries()].sort((a, b) => b[1] - a[1])) {
          const d = ws.drivers.find((x) => normalizeKey(x.code) === normalizeKey(driverCode));
          const shift =
            d && d.shiftEndMinutes !== null ? ` (hết ca ${formatMinutesOfDay(d.shiftEndMinutes)})` : '';
          lines.push(`  • ${d?.name ?? driverCode} (${driverCode}): ${n} đơn${shift}`);
        }
      }
      lines.push('');
      lines.push('Việc đối soát tiền và nhận chứng từ giấy thuộc khâu Đối soát — ngoài phạm vi Agent.');

      return ok(lines.join('\n'), {
        total: scope.length,
        byStatus: Object.fromEntries(byStatus),
        missingPod: missingPod.map((o) => o.code),
        missingCash: missingCash.map((o) => o.code),
        paperPending: paperPending.map((o) => o.code),
      });
    },
  };
}

// ─── Tool 8: dp_ngoai_le ──────────────────────────────────────────────────────

interface ExceptionArgs {
  orderCode?: string;
  kind?: string;
  detail?: string;
  suggestion?: string;
  severity?: string;
}

function createExceptionTool() {
  return {
    name: 'dp_ngoai_le',
    label: 'Điều phối · tạo ngoại lệ',
    description:
      'Ghi một dòng vào tab Ngoại lệ để chuyển việc cho điều phối viên, kèm đề xuất của Agent. ' +
      'Dùng khi: thiếu thông tin, vượt tải trọng, ngoài phạm vi, hết tài xế, quá số lần giao, ' +
      'tài xế không xác nhận, tài xế từ chối đơn, tiền thu hộ giá trị cao, sau giờ chốt phân công. ' +
      'Sau khi gọi tool này, báo cho group điều phối bằng tool message.',
    parameters: {
      type: 'object' as const,
      properties: {
        orderCode: { type: 'string', description: 'Mã đơn liên quan.' },
        kind: { type: 'string', description: 'Loại ngoại lệ, dùng đúng chữ trong tab Ngoại lệ.' },
        detail: { type: 'string', description: 'Chi tiết ngắn, nêu bằng chứng.' },
        suggestion: { type: 'string', description: 'Đề xuất xử lý của Agent.' },
        severity: {
          type: 'string',
          enum: ['Thấp', 'Trung bình', 'Cao', 'Nghiêm trọng'],
          description: 'Mức độ. Mặc định "Cao".',
        },
      },
      required: ['orderCode', 'kind'] as string[],
    },
    execute: async (...rest: unknown[]) => {
      const args = toolArgs<ExceptionArgs>(rest);
      const code = (args.orderCode ?? '').trim();
      const kind = (args.kind ?? '').trim();
      if (!code || !kind) return fail('Thiếu `orderCode` hoặc `kind`.', 'bad_args');

      const nowMs = Date.now();
      let ws: Workspace;
      try {
        ws = await loadWorkspace();
      } catch (err) {
        return workspaceError(err);
      }

      const stamp = stampGmt7(nowMs);
      const detail = (args.detail ?? `Đơn ${code}: ${kind} — Agent đã dừng, không tự xử lý`).trim();
      const fields: Record<string, string> = {
        [normalizeKey('Mã ngoại lệ')]: `NL-${stamp.replace(/[^0-9]/g, '').slice(0, 12)}`,
        [normalizeKey('Thời điểm phát sinh')]: stamp,
        [normalizeKey('Mã đơn')]: code,
        [normalizeKey('Loại ngoại lệ')]: kind,
        [normalizeKey('Chi tiết')]: detail,
        [normalizeKey('Đề xuất của Agent')]: (args.suggestion ?? '').trim(),
        [normalizeKey('Mức độ')]: (args.severity ?? 'Cao').trim(),
        [normalizeKey('Trạng thái')]: 'Mới',
      };

      if (ws.dryRun) {
        return ok(
          `(Chế độ chỉ đề xuất) Ngoại lệ "${kind}" cho đơn ${code}. Chưa ghi vào Sheet.\n${detail}`,
          { dryRun: true, orderCode: code, kind },
        );
      }
      try {
        await appendException(ws, fields);
      } catch (err) {
        const e = err as Error & { code?: ToolErrorCode };
        return fail(`Không ghi được dòng Ngoại lệ: ${e.message}`, e.code ?? 'write_failed');
      }
      return ok(
        `⚠️ Đã tạo Ngoại lệ "${kind}" cho đơn ${code}. Cần điều phối viên xử lý.\n${detail}`,
        { orderCode: code, kind },
      );
    },
  };
}

// ─── Đăng ký plugin ───────────────────────────────────────────────────────────

export default definePluginEntry({
  id: 'dispatch-core',
  name: 'Điều phối · Lõi',
  description:
    'In-instance plugin cho agent dieu-phoi-van-chuyen: dp_status báo đã cấu hình Sheet chưa; ' +
    'dp_set_sheet lưu link Sheet; dp_quet_don quét đơn chờ và chấm điểm chọn tài xế theo quy tắc ' +
    'trong tab Cấu hình Agent; dp_phan_cong chốt một đơn; dp_ghi_nhan ghi nhận tài xế xác nhận / ' +
    'lấy hàng / giao xong / ảnh POD / thất bại; dp_kiem_qua_han liệt kê đơn quá hạn; ' +
    'dp_bao_cao_ngay báo cáo cuối ngày; dp_ngoai_le chuyển việc cho điều phối viên.',
  register(api: OpenClawPluginApi) {
    api.registerTool(() => createStatusTool(), { name: 'dp_status' });
    api.registerTool(() => createSetSheetTool(), { name: 'dp_set_sheet' });
    api.registerTool(() => createScanTool(), { name: 'dp_quet_don' });
    api.registerTool(() => createAssignTool(), { name: 'dp_phan_cong' });
    api.registerTool(() => createRecordTool(), { name: 'dp_ghi_nhan' });
    api.registerTool(() => createOverdueTool(), { name: 'dp_kiem_qua_han' });
    api.registerTool(() => createDailyReportTool(), { name: 'dp_bao_cao_ngay' });
    api.registerTool(() => createExceptionTool(), { name: 'dp_ngoai_le' });
  },
});

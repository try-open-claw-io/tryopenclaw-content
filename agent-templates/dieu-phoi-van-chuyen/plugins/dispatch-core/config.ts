/**
 * Cấu hình runtime của plugin dispatch-core — lưu thành FILE TRÊN ĐĨA trong container,
 * không nằm trong code và không đi qua chat.
 *
 *   $OPENCLAW_HOME/.openclaw/dispatch-core.config.json
 *
 * Người vận hành set một lần (tool dp_set_sheet), plugin đọc lại ở mọi lượt sau.
 * Cùng khuôn với plugin chamcong-check: load trả null khi chưa provision, save
 * MERGE SHALLOW để hai người ghi khác nhau không xoá key của nhau.
 *
 * NGUYÊN TẮC: KHÔNG hardcode spreadsheetId. Chưa có link thì tool phải trả lỗi
 * `need_sheet` để agent đi hỏi người vận hành, tuyệt đối không đoán sheet.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { SheetConfig } from './types';

/** Thư mục nhà của gateway trong container. */
const DEFAULT_HOME = '/home/node';

/**
 * Đường dẫn file cấu hình: `$OPENCLAW_HOME/.openclaw/dispatch-core.config.json`.
 * OPENCLAW_HOME trống → fallback `/home/node` (đường dẫn chuẩn của container).
 */
export function configPath(): string {
  const home = (process.env.OPENCLAW_HOME ?? '').trim() || DEFAULT_HOME;
  return join(home, '.openclaw', 'dispatch-core.config.json');
}

/**
 * Đọc cấu hình đã lưu. Trả null khi: file chưa tồn tại, JSON lỗi, hoặc thiếu
 * `spreadsheetId` — cả ba trường hợp đều nghĩa là "chưa provision", caller phải
 * trả `need_sheet` chứ không được tự bù giá trị.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → mọi tool dp_* — resolve sheet đích
 */
export function loadSheetConfig(path = configPath()): SheetConfig | null {
  if (!existsSync(path)) return null;
  try {
    const c = JSON.parse(readFileSync(path, 'utf8')) as Partial<SheetConfig>;
    if (typeof c.spreadsheetId !== 'string' || !c.spreadsheetId.trim()) return null;
    return {
      spreadsheetId: c.spreadsheetId.trim(),
      orderTab: str(c.orderTab),
      driverTab: str(c.driverTab),
      areaTab: str(c.areaTab),
      configTab: str(c.configTab),
      warehouseTab: str(c.warehouseTab),
      exceptionTab: str(c.exceptionTab),
      dryRun: typeof c.dryRun === 'boolean' ? c.dryRun : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Ghi cấu hình, MERGE SHALLOW lên nội dung đang có trên đĩa: set sheet mới KHÔNG
 * được âm thầm xoá `dryRun` đã tắt và các tên tab người vận hành đã tuỳ chỉnh
 * (cùng lý do chamcong-check phải giữ `visionModel` khi đổi sheet).
 *
 * Key có giá trị `undefined` trong `cfg` được bỏ qua (không ghi đè bản cũ), nên
 * caller truyền `{ spreadsheetId }` là đủ để đổi sheet mà giữ nguyên phần còn lại.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_set_sheet — lưu link sheet + tuỳ chọn
 */
export function saveSheetConfig(cfg: SheetConfig, path = configPath()): void {
  const previous = loadSheetConfig(path) ?? {};
  const merged: SheetConfig = {
    ...previous,
    ...defined(cfg),
    spreadsheetId: cfg.spreadsheetId.trim(),
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
}

/**
 * Thứ tự ưu tiên khi xác định spreadsheet: tham số truyền thẳng (người vận hành
 * vừa dán link) → cấu hình đã lưu → **null**.
 *
 * KHÔNG có default hardcode. null nghĩa là tool phải trả lỗi `need_sheet` để
 * agent đi hỏi, chứ không được ghi vào một sheet đoán được.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → mọi tool đọc/ghi Sheet — gate need_sheet
 */
export function resolveSpreadsheetId(argId?: string, path = configPath()): string | null {
  const explicit = (argId ?? '').trim();
  if (explicit) return explicit;
  return loadSheetConfig(path)?.spreadsheetId ?? null;
}

/** Sáu tab plugin cần đọc/ghi. */
export type TabKind = 'order' | 'driver' | 'area' | 'config' | 'warehouse' | 'exception';

/**
 * Tên tab lấy từ cấu hình, rỗng thì dùng default theo Sheet mẫu của khách.
 * Lưu ý: tên tab thật trên Sheet có thể có DẤU CÁCH ở cuối ("Đơn hàng ") — caller
 * so khớp bằng `normalizeKey()` của parse.ts, không so sánh cứng chuỗi này.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dựng range A1 cho từng tab
 */
export function tabName(cfg: SheetConfig | null, which: TabKind): string {
  const spec = TAB_SPEC[which];
  const fromCfg = cfg ? str(spec.pick(cfg)) : undefined;
  return fromCfg ?? spec.fallback;
}

const TAB_SPEC: Record<TabKind, { pick: (c: SheetConfig) => string | undefined; fallback: string }> = {
  order: { pick: (c) => c.orderTab, fallback: 'Đơn hàng' },
  driver: { pick: (c) => c.driverTab, fallback: 'Tài xế' },
  area: { pick: (c) => c.areaTab, fallback: 'Khu vực' },
  config: { pick: (c) => c.configTab, fallback: 'Cấu hình Agent' },
  warehouse: { pick: (c) => c.warehouseTab, fallback: 'Kho' },
  exception: { pick: (c) => c.exceptionTab, fallback: 'Ngoại lệ' },
};

/**
 * Có đang ở chế độ chỉ-đề-xuất? **Default TRUE** — owner chốt: 2 ngày đầu agent
 * chỉ đề xuất trong Telegram, CHƯA ghi vào Sheet. Muốn ghi thật thì phải bật
 * tường minh (`dryRun: false`), không được suy ra từ việc thiếu cấu hình.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_phan_cong / dp_ghi_nhan — chặn ghi Sheet
 */
export function isDryRun(cfg: SheetConfig | null): boolean {
  return cfg?.dryRun ?? true;
}

/**
 * Hai group Telegram đích, đọc từ env nạp lúc install (`DISPATCH_GROUP_TAI_XE`,
 * `DISPATCH_GROUP_DIEU_PHOI`). Trống → null: agent chỉ trả lời trong đúng hội
 * thoại hiện tại, an toàn cho demo (không nổ đơn vào group lạ).
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_status + các tool gửi tin
 */
export function groupTargets(): { driverGroup: string | null; dispatchGroup: string | null } {
  return {
    driverGroup: envOrNull('DISPATCH_GROUP_TAI_XE'),
    dispatchGroup: envOrNull('DISPATCH_GROUP_DIEU_PHOI'),
  };
}

// ─── nội bộ ───────────────────────────────────────────────────────────────────

/** Chuỗi đã trim, rỗng/không phải string → undefined (để merge bỏ qua). */
function str(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim();
  return s ? s : undefined;
}

/** Env đã trim, rỗng → null. */
function envOrNull(name: string): string | null {
  const v = (process.env[name] ?? '').trim();
  return v ? v : null;
}

/** Chỉ giữ key thực sự có giá trị, để spread không ghi `undefined` lên bản cũ. */
function defined(cfg: SheetConfig): Partial<SheetConfig> {
  const out: Partial<SheetConfig> = {};
  for (const which of Object.keys(TAB_SPEC) as TabKind[]) {
    const value = str(TAB_SPEC[which].pick(cfg));
    if (value !== undefined) out[TAB_FIELD[which]] = value;
  }
  if (typeof cfg.dryRun === 'boolean') out.dryRun = cfg.dryRun;
  return out;
}

const TAB_FIELD: Record<TabKind, 'orderTab' | 'driverTab' | 'areaTab' | 'configTab' | 'warehouseTab' | 'exceptionTab'> = {
  order: 'orderTab',
  driver: 'driverTab',
  area: 'areaTab',
  config: 'configTab',
  warehouse: 'warehouseTab',
  exception: 'exceptionTab',
};

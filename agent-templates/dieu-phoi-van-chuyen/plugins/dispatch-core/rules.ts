/**
 * Logic nghiệp vụ THUẦN của plugin dispatch-core.
 *
 * Quy ước của file này:
 *   · KHÔNG I/O — không fetch, không đọc file, không gọi MCP.
 *   · KHÔNG `Date.now()` — mọi hàm cần thời gian đều nhận `nowMs` từ tham số.
 *   · KHÔNG throw vì dữ liệu bẩn — luôn trả giá trị an toàn (null / mảng rỗng / fallback).
 *   · Nguồn sự thật của mọi con số là tab "Cấu hình Agent" (QT7); số trong file này
 *     chỉ là fallback khi ô trống, lấy đúng theo Sheet mẫu.
 *
 * Mọi so khớp tên (địa bàn, khu vực, trạng thái, mã tham số) đi qua `normalizeKey`
 * để chịu được khoảng trắng thừa và khác biệt chữ hoa/thường trong Sheet.
 */

import type {
  AreaMatchLevel,
  AreaRow,
  DeliveryGroup,
  Driver,
  ExceptionKind,
  Order,
  OrderStatus,
  RawThresholds,
  RejectReason,
  RejectedDriver,
  ScoreWeights,
  Thresholds,
} from './types';
import {
  dateKeyGmt7,
  formatMinutesOfDay,
  minutesOfDayGmt7,
  normalizeKey,
  num,
  parseMinutesOfDay,
  parseVnBool,
  parseVnWeekdays,
  weekdayGmt7,
} from './parse';

// ─── Hằng nội bộ ──────────────────────────────────────────────────────────────

/** Nhãn cột A của dòng tiêu đề trong tab "Cấu hình Agent" — bỏ khi parse. */
const CONFIG_HEADER_LABELS = new Set([
  'mã tham số',
  'ma tham so',
  'tham số',
  'tham so',
  'mã',
  'ma',
  'nhóm',
  'nhom',
  'mục',
  'muc',
  'stt',
]);

/** Trạng thái tài xế được phép nhận đơn mới (tab Hướng dẫn, điều kiện cứng #2). */
const DRIVER_OPEN_STATUSES = ['rảnh', 'đang giao'];

/** Bảng chuyển trạng thái đơn, khoá = trạng thái nguồn đã normalize (tab "Danh mục trạng thái "). */
const STATUS_TRANSITIONS: Record<string, readonly OrderStatus[]> = {
  'chờ phân công': ['Đã phân công', 'Đã huỷ', 'Ngoài phạm vi'],
  'đã phân công': ['Tài xế xác nhận', 'Chờ phân công'],
  'tài xế xác nhận': ['Đã lấy hàng'],
  'đã lấy hàng': ['Đang giao'],
  'đang giao': ['Chờ ảnh POD', 'Giao thất bại'],
  'chờ ảnh pod': ['Đã giao'],
  'giao thất bại': ['Chờ phân công', 'Đã hoàn kho'],
  'đã giao': [],
  'đã hoàn kho': [],
  'đã huỷ': [],
  'ngoài phạm vi': ['Đã huỷ'],
};

/** Trạng thái chỉ Người được set, agent không bao giờ tự ghi. */
const HUMAN_ONLY_STATUSES: readonly OrderStatus[] = ['Đã hoàn kho', 'Đã huỷ'];

const MINUTE_MS = 60_000;

// ─── Helper nội bộ ────────────────────────────────────────────────────────────

/** Ô cấu hình theo mã tham số. Trả undefined khi thiếu ô hoặc ô rỗng. */
function cellOf(raw: RawThresholds, code: string): string | undefined {
  const v = raw[normalizeKey(code)];
  return v === undefined || v.trim() === '' ? undefined : v;
}

/** Số từ ô cấu hình, fallback khi thiếu ô hoặc không parse được. */
function numOf(raw: RawThresholds, code: string, fallback: number): number {
  return num(cellOf(raw, code), fallback);
}

/**
 * Đúng/sai từ ô cấu hình. Phải phân biệt "thiếu ô" với "ô ghi Không":
 * `parseVnBool('')` trả false nên không thể dùng trực tiếp cho tham số default true.
 */
function boolOf(raw: RawThresholds, code: string, fallback: boolean): boolean {
  const c = cellOf(raw, code);
  return c === undefined ? fallback : parseVnBool(c);
}

/** Giờ trong ngày ("16:30") → phút từ 00:00. Nhận cả ô đã ghi sẵn số phút ("990"). */
function minutesOf(raw: RawThresholds, code: string, fallback: number): number {
  const c = cellOf(raw, code);
  if (c === undefined) return fallback;
  const m = parseMinutesOfDay(c);
  return m === null ? num(c, fallback) : m;
}

/** Dòng cần bỏ khi parse cấu hình: cột A rỗng, dòng header, dòng "QUY TẮC VÀNG". */
function isSkippableConfigRow(code: string): boolean {
  const k = normalizeKey(code);
  if (!k) return true;
  if (CONFIG_HEADER_LABELS.has(k)) return true;
  return k.includes('quy tắc vàng') || k.includes('quy tac vang');
}

/** Nhóm giao hợp lệ từ chuỗi trong Sheet; chuỗi lạ → null (không đoán bừa). */
function coerceDeliveryGroup(rawGroup: string): DeliveryGroup | null {
  const k = normalizeKey(rawGroup ?? '');
  if (k === 'giao trong ngày' || k === 'giao trong ngay') return 'Giao trong ngày';
  if (k === 'tuyến cố định' || k === 'tuyen co dinh') return 'Tuyến cố định';
  return null;
}

/** Số hiển thị trong câu tiếng Việt: bỏ số 0 lẻ, dùng dấu phẩy thập phân. */
function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '?';
  const rounded = Number.isInteger(n) ? n : Number(n.toFixed(2));
  return String(rounded).replace('.', ',');
}

/** Số nguyên an toàn từ dữ liệu có thể bẩn. */
function safeInt(n: unknown, fallback = 0): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

/**
 * Còn trong ca làm việc? Xử lý ca qua nửa đêm (22:00 → 06:00).
 * Thiếu dữ liệu ca (null) → coi như không có giới hạn, KHÔNG dùng làm căn cứ loại.
 */
function inShift(nowMinutes: number, start: number | null, end: number | null): boolean {
  if (start === null || end === null) return true;
  if (start === end) return true;
  if (start < end) return nowMinutes >= start && nowMinutes <= end;
  return nowMinutes >= start || nowMinutes <= end;
}

/** Địa bàn tài xế có khớp yêu cầu ở mức nới `level` không. */
function matchesArea(
  driver: Driver,
  level: AreaMatchLevel,
  requiredArea: string,
  zone?: string,
): boolean {
  const need = normalizeKey(requiredArea ?? '');
  switch (level) {
    case 'dia-ban-chinh':
      return need !== '' && normalizeKey(driver.primaryArea ?? '') === need;
    case 'dia-ban-phu':
      return (
        need !== '' &&
        (driver.secondaryAreas ?? []).some((a) => normalizeKey(a ?? '') === need)
      );
    case 'toan-khu-vuc': {
      // "toàn khu vực" = cùng zone với điểm giao, KHÔNG phải toàn thành phố.
      // Không biết zone của đơn thì không được nới — tránh phân công xuyên thành phố.
      const z = normalizeKey(zone ?? '');
      return z !== '' && normalizeKey(driver.zone ?? '') === z;
    }
    default:
      return false;
  }
}

/** Câu giải thích ngắn khi loại vì ngoài địa bàn, theo mức nới đang xét. */
function outsideAreaDetail(
  driver: Driver,
  level: AreaMatchLevel,
  requiredArea: string,
  zone?: string,
): string {
  const need = (requiredArea ?? '').trim() || '(không rõ)';
  if (level === 'dia-ban-chinh') {
    return `địa bàn chính "${(driver.primaryArea ?? '').trim() || '(trống)'}" ≠ "${need}"`;
  }
  if (level === 'dia-ban-phu') {
    const list = (driver.secondaryAreas ?? []).join(', ') || '(trống)';
    return `địa bàn phụ [${list}] không có "${need}"`;
  }
  const z = (zone ?? '').trim();
  if (!z) return `chưa xác định được khu vực của "${need}"`;
  return `khu vực "${(driver.zone ?? '').trim() || '(trống)'}" ≠ "${z}"`;
}

function reject(driverCode: string, reason: RejectReason, detail: string): RejectedDriver {
  return { driverCode, reason, detail };
}

// ─── 1. Cấu hình ──────────────────────────────────────────────────────────────

/**
 * Parse toàn bộ vùng tab "Cấu hình Agent" (cột A = mã tham số, cột B = giá trị)
 * thành `Thresholds`. Bỏ dòng header và dòng "QUY TẮC VÀNG"; dòng trùng mã thì
 * dòng đầu tiên thắng. Bảng thô giữ lại ở `raw` (khoá đã normalize) để truy vết.
 *
 * Thiếu ô nào thì field đó lấy fallback bằng số trong Sheet mẫu — Sheet vẫn là
 * nguồn sự thật (QT7), fallback chỉ để agent không chết khi khách xoá ô.
 * `ban_kinh_nhan_ngoai_danh_sach_km` là tham số mới (owner chốt 12/08/2026) nên
 * fallback 5 km cho sheet khách chưa kịp bổ sung.
 * `cac_ngay_chay_tuyen_co_dinh` thiếu → mảng rỗng: coi như hôm nay không chạy
 * tuyến, đơn Tuyến cố định nằm chờ thay vì bị phân công sai ngày.
 */
export function parseThresholds(rows: string[][]): Thresholds {
  const raw: RawThresholds = {};
  for (const row of rows ?? []) {
    if (!Array.isArray(row) || row.length === 0) continue;
    const code = typeof row[0] === 'string' ? row[0] : '';
    if (isSkippableConfigRow(code)) continue;
    const key = normalizeKey(code);
    if (key in raw) continue;
    const value = row[1];
    raw[key] = typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value);
  }

  const weights: ScoreWeights = {
    deadline: numOf(raw, 'trong_so_han_giao', 0.35),
    correctArea: numOf(raw, 'trong_so_dung_quan', 0.3),
    distance: numOf(raw, 'trong_so_khoang_cach', 0.15),
    freeCapacity: numOf(raw, 'trong_so_con_cho_trong', 0.12),
    fairness: numOf(raw, 'trong_so_cong_bang', 0.08),
  };

  const weekdayCell = cellOf(raw, 'cac_ngay_chay_tuyen_co_dinh');
  const fixedRouteWeekdays = weekdayCell === undefined ? [] : parseVnWeekdays(weekdayCell);

  return {
    maxOrdersPerDriver: numOf(raw, 'so_don_toi_da_moi_tai_xe', 12),
    maxWeightKg: numOf(raw, 'tai_trong_toi_da_kg', 40),
    maxParcels: numOf(raw, 'so_kien_toi_da', 6),
    defaultDeadlineMinutes: numOf(raw, 'thoi_han_giao_mac_dinh_phut', 240),
    returnDeadlineMinutes: numOf(raw, 'thoi_han_don_hoan_phut', 480),
    assignCutoffMinutes: minutesOf(raw, 'gio_chot_phan_cong', 990),
    preferRadiusKm: numOf(raw, 'ban_kinh_uu_tien_km', 8),
    sameDayRadiusKm: numOf(raw, 'ban_kinh_giao_trong_ngay_km', 20),
    farAreaDeadlineMinutes: numOf(raw, 'thoi_han_giao_dia_ban_xa_phut', 1440),
    fixedRouteWeekdays,
    gpsStaleMinutes: numOf(raw, 'gps_qua_han_phut', 20),
    confidenceThreshold: numOf(raw, 'nguong_tu_tin', 0.75),
    minScoreGap: numOf(raw, 'chenh_lech_diem_toi_thieu', 0.1),
    weights,
    maxDeliveryAttempts: numOf(raw, 'so_lan_giao_toi_da', 2),
    driverConfirmReminderMinutes: numOf(raw, 'cho_tai_xe_xac_nhan_phut', 10),
    driverConfirmEscalateMinutes: numOf(raw, 'chuyen_nguoi_neu_khong_xac_nhan_phut', 20),
    highCodThreshold: numOf(raw, 'nguong_tien_thu_ho_gia_tri_cao', 5_000_000),
    requirePodBeforeDelivered: boolOf(raw, 'bat_buoc_anh_pod_truoc_khi_da_giao', true),
    requireCodProof: boolOf(raw, 'bat_buoc_anh_tien_khi_cod', true),
    allowAutoAssign: boolOf(raw, 'cho_phep_tu_phan_cong', true),
    allowAutoReassign: boolOf(raw, 'cho_phep_tu_doi_tai_xe', false),
    allowExpandOutsideArea: boolOf(raw, 'cho_phep_mo_rong_ngoai_khu_vuc', false),
    maskCustomerPhoneInDispatchGroup: boolOf(raw, 'che_sdt_khach_o_group_dieu_phoi', true),
    acceptOutsideListRadiusKm: numOf(raw, 'ban_kinh_nhan_ngoai_danh_sach_km', 5),
    raw,
  };
}

// ─── 2. Địa bàn → nhóm giao ───────────────────────────────────────────────────

/**
 * Xác định nhóm giao của một địa bàn (QT10).
 *
 * Có trong tab "Khu vực" → lấy `deliveryGroup` của dòng đó.
 * Không có trong danh sách nhưng điểm giao cách kho ≤ `acceptOutsideListRadiusKm`
 * → vẫn nhận, xếp "Giao trong ngày" (quy tắc owner chốt 12/08/2026).
 * Ngoài ngưỡng, hoặc không biết khoảng cách → `group: null` = Ngoài phạm vi.
 */
export function resolveDeliveryGroup(
  district: string,
  areas: AreaRow[],
  t: Thresholds,
  distanceFromWarehouseKm: number | null,
): { group: DeliveryGroup | null; inList: boolean; area: AreaRow | null } {
  const need = normalizeKey(district ?? '');
  if (need !== '') {
    for (const area of areas ?? []) {
      if (!area || normalizeKey(area.district ?? '') !== need) continue;
      return { group: coerceDeliveryGroup(area.deliveryGroup), inList: true, area };
    }
  }

  const km = distanceFromWarehouseKm;
  if (km !== null && Number.isFinite(km) && km <= t.acceptOutsideListRadiusKm) {
    return { group: 'Giao trong ngày', inList: false, area: null };
  }
  return { group: null, inList: false, area: null };
}

// ─── 3. Ngày chạy tuyến cố định ───────────────────────────────────────────────

/**
 * Hôm nay (theo GMT+7) có phải ngày chạy tuyến cố định không —
 * so `cac_ngay_chay_tuyen_co_dinh` với thứ của `nowMs`.
 */
export function isFixedRouteDay(t: Thresholds, nowMs: number): boolean {
  return (t.fixedRouteWeekdays ?? []).includes(weekdayGmt7(nowMs));
}

// ─── 4. Hạn giao thực tế ──────────────────────────────────────────────────────

/**
 * Hạn giao thực tế của đơn (epoch ms).
 *
 * Sheet có ghi "Hạn giao" → dùng luôn. Không có thì suy ra từ thời điểm tạo đơn:
 * đơn Hoàn trả → `thoi_han_don_hoan_phut`; địa bàn Tuyến cố định →
 * `thoi_han_giao_dia_ban_xa_phut`; còn lại → `thoi_han_giao_mac_dinh_phut`.
 * Không có cả `deadline` lẫn `createdAt` → null (không đoán hạn).
 */
export function effectiveDeadline(
  order: Order,
  group: DeliveryGroup | null,
  t: Thresholds,
): number | null {
  if (order.deadline !== null && Number.isFinite(order.deadline)) return order.deadline;
  const createdAt = order.createdAt;
  if (createdAt === null || !Number.isFinite(createdAt)) return null;

  const kind = normalizeKey(order.kind ?? '');
  if (kind === 'hoàn trả' || kind === 'hoan tra') {
    return createdAt + t.returnDeadlineMinutes * MINUTE_MS;
  }
  if (group === 'Tuyến cố định') {
    return createdAt + t.farAreaDeadlineMinutes * MINUTE_MS;
  }
  return createdAt + t.defaultDeadlineMinutes * MINUTE_MS;
}

// ─── 5. Điều kiện cứng ────────────────────────────────────────────────────────

/**
 * Lọc tài xế theo điều kiện cứng (tab Hướng dẫn) — chỉ ai qua HẾT mới được chấm điểm.
 *
 * Thứ tự xét trùng thứ tự `RejectReason` trong types.ts, mỗi tài xế bị loại sinh
 * đúng 1 `RejectedDriver` với lý do đầu tiên vi phạm:
 *   đang làm việc · trạng thái Rảnh/Đang giao · trong ca (chịu ca qua nửa đêm) ·
 *   xe Bình thường · bảo hiểm còn hạn · có Telegram ID · chưa đầy đơn ·
 *   trong tải trọng · trong số kiện · đúng địa bàn theo `opts.level`.
 *
 * Trần đơn lấy `driver.maxOrdersPerTrip`, thiếu thì lấy `t.maxOrdersPerDriver`.
 * Trần tải trọng/số kiện lấy min(riêng của xe, trần chung) — cấu hình xe không
 * bao giờ được vượt trần chung của Sheet (QT2).
 * Thiếu dữ liệu ca hoặc ngày hết hạn bảo hiểm → không loại vì lý do đó
 * (không có căn cứ), các điều kiện còn lại vẫn xét bình thường.
 */
export function hardFilter(
  order: Order,
  drivers: Driver[],
  t: Thresholds,
  opts: { nowMs: number; requiredArea: string; level: AreaMatchLevel; zone?: string },
): { passed: Driver[]; rejected: RejectedDriver[] } {
  const passed: Driver[] = [];
  const rejected: RejectedDriver[] = [];
  const nowMinutes = minutesOfDayGmt7(opts.nowMs);

  const orderWeight = safeInt(order.weightKg, 0);
  const orderParcels = safeInt(order.parcels, 0);

  for (const d of drivers ?? []) {
    if (!d) continue;

    if (d.working !== true) {
      rejected.push(reject(d.code, 'khong-lam-viec', 'hôm nay không đi làm'));
      continue;
    }

    const status = normalizeKey(d.status ?? '');
    if (!DRIVER_OPEN_STATUSES.includes(status)) {
      rejected.push(
        reject(
          d.code,
          'trang-thai-khong-hop-le',
          `trạng thái "${(d.status ?? '').trim() || '(trống)'}", chỉ nhận Rảnh/Đang giao`,
        ),
      );
      continue;
    }

    if (!inShift(nowMinutes, d.shiftStartMinutes, d.shiftEndMinutes)) {
      rejected.push(
        reject(
          d.code,
          'ngoai-ca',
          `ngoài ca ${formatMinutesOfDay(d.shiftStartMinutes ?? 0)}–${formatMinutesOfDay(
            d.shiftEndMinutes ?? 0,
          )}, hiện ${formatMinutesOfDay(nowMinutes)}`,
        ),
      );
      continue;
    }

    if (normalizeKey(d.vehicleCondition ?? '') !== 'bình thường') {
      rejected.push(
        reject(
          d.code,
          'xe-khong-binh-thuong',
          `tình trạng xe "${(d.vehicleCondition ?? '').trim() || '(trống)'}"`,
        ),
      );
      continue;
    }

    if (d.insuranceExpiry !== null && Number.isFinite(d.insuranceExpiry) && d.insuranceExpiry < opts.nowMs) {
      rejected.push(
        reject(d.code, 'bao-hiem-het-han', `bảo hiểm hết hạn ${dateKeyGmt7(d.insuranceExpiry)}`),
      );
      continue;
    }

    if (!(d.telegramId ?? '').trim()) {
      rejected.push(reject(d.code, 'thieu-telegram-id', 'chưa có Telegram ID để nổ đơn'));
      continue;
    }

    const orderCap =
      d.maxOrdersPerTrip !== null && Number.isFinite(d.maxOrdersPerTrip)
        ? d.maxOrdersPerTrip
        : t.maxOrdersPerDriver;
    const openOrders = safeInt(d.openOrders, 0);
    if (openOrders >= orderCap) {
      rejected.push(
        reject(d.code, 'du-so-don', `đang giữ ${fmtNum(openOrders)}/${fmtNum(orderCap)} đơn`),
      );
      continue;
    }

    const weightCap = Math.min(
      d.allowedWeightKg !== null && Number.isFinite(d.allowedWeightKg)
        ? d.allowedWeightKg
        : t.maxWeightKg,
      t.maxWeightKg,
    );
    if (orderWeight > weightCap) {
      rejected.push(
        reject(
          d.code,
          'vuot-tai-trong',
          `đơn ${fmtNum(orderWeight)}kg > giới hạn ${fmtNum(weightCap)}kg`,
        ),
      );
      continue;
    }

    const parcelCap = Math.min(
      d.maxParcels !== null && Number.isFinite(d.maxParcels) ? d.maxParcels : t.maxParcels,
      t.maxParcels,
    );
    if (orderParcels > parcelCap) {
      rejected.push(
        reject(
          d.code,
          'vuot-so-kien',
          `đơn ${fmtNum(orderParcels)} kiện > giới hạn ${fmtNum(parcelCap)} kiện`,
        ),
      );
      continue;
    }

    if (!matchesArea(d, opts.level, opts.requiredArea, opts.zone)) {
      rejected.push(
        reject(
          d.code,
          'ngoai-dia-ban',
          outsideAreaDetail(d, opts.level, opts.requiredArea, opts.zone),
        ),
      );
      continue;
    }

    passed.push(d);
  }

  return { passed, rejected };
}

// ─── 6. Nới địa bàn ───────────────────────────────────────────────────────────

/**
 * Nới địa bàn theo 3 mức của tab Hướng dẫn: địa bàn chính → địa bàn phụ →
 * toàn khu vực (cùng zone với điểm giao). Dừng ở mức đầu tiên có ứng viên.
 *
 * Mức 3 KHÔNG bị chặn bởi `cho_phep_mo_rong_ngoai_khu_vuc` vì nó vẫn nằm trong
 * cùng khu vực của điểm giao, không phải mở ra toàn thành phố. Zone lấy từ dòng
 * tab "Khu vực" của địa bàn đơn; địa bàn ngoài danh sách không có zone nên mức 3
 * đương nhiên không ai khớp.
 * Hết cả 3 mức không ai qua → `level: 'khong-co'`, `rejected` là của mức cuối
 * (caller tạo ngoại lệ "Hết tài xế trong khu vực").
 */
export function widenArea(
  order: Order,
  drivers: Driver[],
  areas: AreaRow[],
  t: Thresholds,
  nowMs: number,
): { passed: Driver[]; rejected: RejectedDriver[]; level: AreaMatchLevel } {
  const requiredArea = (order.district ?? '').trim();
  const need = normalizeKey(requiredArea);
  const areaRow =
    need === ''
      ? undefined
      : (areas ?? []).find((a) => a && normalizeKey(a.district ?? '') === need);
  const zone = areaRow?.zone ?? '';

  const levels: AreaMatchLevel[] = ['dia-ban-chinh', 'dia-ban-phu', 'toan-khu-vuc'];
  let lastRejected: RejectedDriver[] = [];

  for (const level of levels) {
    const res = hardFilter(order, drivers, t, { nowMs, requiredArea, level, zone });
    if (res.passed.length > 0) {
      return { passed: res.passed, rejected: res.rejected, level };
    }
    lastRejected = res.rejected;
  }

  return { passed: [], rejected: lastRejected, level: 'khong-co' };
}

// ─── 7. Chặn trước khi chấm điểm ──────────────────────────────────────────────

/**
 * Các chặn phải xét TRƯỚC khi chấm điểm. Trả ngoại lệ đầu tiên gặp, null khi sạch.
 *
 * Thiếu địa bàn/địa chỉ → Thiếu thông tin · ngoài danh sách và quá bán kính nhận
 * → Ngoài phạm vi (QT10) · hàng chưa về kho · vượt trần tải trọng (QT2) · chạm
 * `so_lan_giao_toi_da` mà đơn đang Giao thất bại (QT9) · COD vượt ngưỡng giá trị
 * cao · đơn 0đ mà vẫn có tiền thu hộ · quá `gio_chot_phan_cong` (QT12).
 *
 * CHÚ Ý: đơn thuộc "Tuyến cố định" mà hôm nay không phải ngày chạy tuyến KHÔNG
 * phải ngoại lệ — hàm này trả null, caller có nhiệm vụ để đơn nằm nguyên ở
 * "Chờ phân công" tới ngày chạy tuyến (dùng `isFixedRouteDay` để kiểm).
 */
export function checkBlockers(
  order: Order,
  t: Thresholds,
  nowMs: number,
  group: DeliveryGroup | null,
): ExceptionKind | null {
  if (!(order.district ?? '').trim() || !(order.address ?? '').trim()) {
    return 'Thiếu thông tin';
  }
  if (group === null) return 'Ngoài phạm vi';

  const stock = normalizeKey(order.stockStatus ?? '');
  if (stock !== 'đã có hàng' && stock !== 'da co hang') return 'Hàng chưa về kho';

  if (order.weightKg !== null && Number.isFinite(order.weightKg) && order.weightKg > t.maxWeightKg) {
    return 'Vượt tải trọng';
  }
  if (
    safeInt(order.attempts, 0) >= t.maxDeliveryAttempts &&
    normalizeKey(order.status ?? '') === 'giao thất bại'
  ) {
    return 'Quá số lần giao';
  }
  if (safeInt(order.codAmount, 0) > t.highCodThreshold) return 'Tiền thu hộ giá trị cao';
  if (normalizeKey(order.paymentMethod ?? '') === 'đơn 0đ' && safeInt(order.codAmount, 0) > 0) {
    return 'Dữ liệu thanh toán sai';
  }
  if (minutesOfDayGmt7(nowMs) > t.assignCutoffMinutes) return 'Sau giờ chốt phân công';

  return null;
}

// ─── 8-9. Chuyển trạng thái ───────────────────────────────────────────────────

/**
 * Bước chuyển trạng thái `from → to` có hợp lệ theo tab "Danh mục trạng thái "?
 * Trạng thái nguồn lạ, hoặc đích không nằm trong danh sách cho phép → false.
 * "Đã giao" / "Đã hoàn kho" / "Đã huỷ" là trạng thái cuối, không đi đâu nữa.
 */
export function canTransition(from: string, to: OrderStatus): boolean {
  const allowed = STATUS_TRANSITIONS[normalizeKey(from ?? '')];
  if (!allowed) return false;
  const target = normalizeKey(to ?? '');
  return allowed.some((s) => normalizeKey(s) === target);
}

/**
 * Agent có được tự set trạng thái này không. "Đã hoàn kho" và "Đã huỷ" là quyết
 * định của Người (điều phối viên) — agent chỉ được đề xuất, không tự ghi.
 */
export function agentMayTransition(to: OrderStatus): boolean {
  const target = normalizeKey(to ?? '');
  return !HUMAN_ONLY_STATUSES.some((s) => normalizeKey(s) === target);
}

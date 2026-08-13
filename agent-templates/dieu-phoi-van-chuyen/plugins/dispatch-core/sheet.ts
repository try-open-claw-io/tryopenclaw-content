/**
 * Map dữ liệu thô của Google Sheet → object nghiệp vụ.
 *
 * NGUYÊN TẮC SỐ 1: mọi cột được resolve theo TÊN HEADER, không bao giờ theo
 * index cứng. Khách chèn/xoá/đổi thứ tự cột trong Sheet của họ bất cứ lúc nào;
 * index cứng là cách chắc chắn nhất để ghi sai cột (và ghi sai cột ở tab
 * "Đơn hàng " là mất dữ liệu thật). Tên header cũng so khớp qua
 * `normalizeKey()` nên chịu được dấu cách thừa và khác hoa/thường.
 *
 * Mọi hàm ở đây PURE: nhận ma trận ô + layout, trả object. Không I/O.
 * Ô trống trong Sheet đến đây là `''` hoặc `undefined` (BATCH_GET cắt bỏ ô rỗng
 * ở cuối dòng), nên mọi hàm đọc ô phải chịu được dòng ngắn hơn header.
 */
import {
  columnLetter,
  normalizeKey,
  normalizeLatLng,
  num,
  parseList,
  parseMinutesOfDay,
  parseVnBool,
  parseVnDateTime,
  parseVnNumber,
} from './parse';
import type {
  AreaRow,
  ColumnRef,
  DeliveryGroup,
  Driver,
  Order,
  TabLayout,
  Warehouse,
} from './types';

// ─── Tên cột thật trong Sheet của khách ───────────────────────────────────────
// Giữ ở một chỗ để index.ts dựng range ghi theo TÊN, không lặp lại chuỗi rải rác.

/** 44 cột của tab "Đơn hàng " (A → AR), đúng tên trong Sheet. */
export const ORDER_COLS = {
  code: 'Mã đơn',
  kind: 'Loại đơn',
  createdAt: 'Thời điểm tạo',
  source: 'Nguồn đơn',
  customerName: 'Tên khách hàng',
  customerPhone: 'SĐT khách hàng',
  address: 'Địa chỉ giao',
  ward: 'Phường',
  district: 'Quận',
  lat: 'Vĩ độ',
  lng: 'Kinh độ',
  distanceFromWarehouseKm: 'Khoảng cách từ kho (km)',
  warehouseCode: 'Mã kho',
  stockStatus: 'Tình trạng hàng tại kho',
  weightKg: 'Khối lượng (kg)',
  parcels: 'Số kiện',
  paymentMethod: 'Hình thức thanh toán',
  codAmount: 'Số tiền thu hộ',
  needsCashProof: 'Cần ảnh chứng từ tiền',
  cashStatus: 'Trạng thái thu tiền',
  cashCollected: 'Số tiền đã thu',
  cashProofUrl: 'Link ảnh chứng từ tiền',
  hasPaperDoc: 'Có chứng từ giấy',
  paperDocReturned: 'Chứng từ giấy đã thu hồi',
  deadline: 'Hạn giao',
  priority: 'Mức ưu tiên',
  status: 'Trạng thái đơn',
  driverCode: 'Mã tài xế',
  plate: 'Biển số xe',
  assignedAt: 'Thời điểm phân công',
  assignedBy: 'Người phân công',
  driverConfirmedAt: 'Thời điểm tài xế xác nhận',
  pickedUpAt: 'Thời điểm lấy hàng',
  deliveredAt: 'Thời điểm giao xong',
  podUrl: 'Link ảnh POD',
  attempts: 'Số lần giao',
  failReason: 'Lý do thất bại',
  agentNote: 'Ghi chú Agent',
  tripCode: 'Mã chuyến',
  updatedBy: 'Người cập nhật cuối',
  updatedAt: 'Thời điểm cập nhật cuối',
  orderDate: 'Ngày đơn',
  readyForRecon: 'Sẵn sàng đối soát',
  reconStatus: 'Trạng thái đối soát',
} as const;

/**
 * Cột KHÔNG BAO GIỜ được ghi ở tab "Đơn hàng ":
 *   `Sẵn sàng đối soát`  — CÔNG THỨC của khách, ghi vào là xoá công thức.
 *   `Trạng thái đối soát` — do khâu đối soát (người khác) ghi, ngoài phạm vi agent.
 * Xem thêm cảnh báo trong JSDoc của `writeRange` (connector.ts).
 */
export const ORDER_COLS_READONLY: readonly string[] = [
  ORDER_COLS.readyForRecon,
  ORDER_COLS.reconStatus,
];

/** Cột của tab "Tài xế". Một số tên có bản CŨ, khai báo mảng để fallback. */
export const DRIVER_COLS = {
  code: 'Mã tài xế',
  name: 'Họ tên',
  phone: 'SĐT',
  telegramId: 'Telegram ID',
  status: 'Trạng thái',
  working: 'Đang làm việc',
  shiftStart: 'Bắt đầu ca',
  shiftEnd: 'Kết thúc ca',
  /** Sheet cũ: "Quận phụ trách chính". */
  primaryArea: ['Địa bàn phụ trách chính', 'Quận phụ trách chính'],
  /** Sheet cũ: "Quận phụ trách phụ". */
  secondaryAreas: ['Địa bàn phụ trách phụ', 'Quận phụ trách phụ'],
  zone: 'Khu vực',
  maxOrdersPerTrip: 'Số đơn tối đa mỗi chuyến',
  plate: 'Biển số xe',
  vehicleType: 'Loại xe',
  allowedWeightKg: 'Tải trọng cho phép (kg)',
  maxParcels: 'Số kiện tối đa',
  vehicleCondition: 'Tình trạng xe',
  insuranceExpiry: 'Hạn bảo hiểm xe',
  lat: 'Vĩ độ hiện tại',
  lng: 'Kinh độ hiện tại',
  positionUpdatedAt: 'Thời điểm cập nhật vị trí',
  positionSource: 'Nguồn vị trí',
  distanceToWarehouseKm: 'Khoảng cách tới kho (km)',
  joinedAt: 'Ngày vào làm',
  rating: 'Điểm đánh giá',
  note: 'Ghi chú',
  lastAssignedAt: 'Thời điểm phân công gần nhất',
  openOrders: 'Số đơn đang giữ',
  totalDelivered: 'Tổng đơn đã giao',
  totalFailed: 'Tổng đơn thất bại',
  successRate: 'Tỷ lệ giao thành công',
  codCollectedToday: 'Tiền thu hộ hôm nay',
  missingPodCount: 'Số đơn thiếu ảnh POD',
  pendingDocCount: 'Số đơn chờ bổ sung chứng từ',
} as const;

/** Cột của tab "Khu vực". */
export const AREA_COLS = {
  /** Sheet cũ: "Quận". */
  district: ['Quận/Huyện', 'Quận'],
  unitKind: 'Loại đơn vị',
  zone: 'Khu vực',
  deliveryGroup: 'Nhóm giao',
  needsFerry: 'Cần qua phà',
  centerLat: 'Vĩ độ trung tâm',
  centerLng: 'Kinh độ trung tâm',
  distanceFromWarehouseKm: 'Khoảng cách từ kho (km)',
} as const;

/** Cột của tab "Kho" (lat/lng ở E2/F2 với bố cục hiện tại). */
export const WAREHOUSE_COLS = {
  code: 'Mã kho',
  name: ['Tên kho', 'Tên'],
  lat: ['Vĩ độ', 'Vĩ độ kho', 'Vĩ độ trung tâm'],
  lng: ['Kinh độ', 'Kinh độ kho', 'Kinh độ trung tâm'],
  open: ['Giờ mở cửa', 'Giờ mở', 'Bắt đầu ca'],
  close: ['Giờ đóng cửa', 'Giờ đóng', 'Kết thúc ca'],
} as const;

/** Dòng có địa bàn bắt đầu bằng chuỗi này là dòng ghi chú, không phải địa bàn. */
const OUT_OF_SCOPE_PREFIX = normalizeKey('Ngoài phạm vi');

// ─── Layout: header → cột ────────────────────────────────────────────────────

/**
 * Dựng bố cục một tab từ dòng header: `normalizeKey(header)` → `ColumnRef`.
 *
 * Header trùng tên (khách copy cột) chỉ giữ lần xuất hiện ĐẦU — cột đầu là cột
 * gốc đang có dữ liệu, cột copy phía sau thường rỗng.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → mọi tool — resolve cột trước khi đọc/ghi
 */
export function buildLayout(headerRow: string[], title: string): TabLayout {
  const headers = headerRow.map((h) => (typeof h === 'string' ? h : String(h ?? '')));
  const byHeader = new Map<string, ColumnRef>();
  headers.forEach((header, index) => {
    const key = normalizeKey(header);
    if (!key || byHeader.has(key)) return;
    byHeader.set(key, { header, index, letter: columnLetter(index) });
  });
  return { title, headers, byHeader };
}

/**
 * Tra cột theo TÊN header. Chịu được dấu cách 2 đầu, dấu cách kép ở giữa và
 * khác hoa/thường. Trả null khi tab không có cột đó. Pure.
 */
export function col(layout: TabLayout, header: string): ColumnRef | null {
  return layout.byHeader.get(normalizeKey(header)) ?? null;
}

/**
 * Tra cột theo nhiều tên khả dĩ, trả cột đầu tiên tìm thấy. Dùng cho các cột đã
 * đổi tên giữa các bản Sheet (ví dụ "Quận phụ trách chính" → "Địa bàn phụ trách
 * chính"): plugin đọc được cả bản cũ và bản mới. Pure.
 */
export function colAny(layout: TabLayout, headers: readonly string[]): ColumnRef | null {
  for (const h of headers) {
    const found = col(layout, h);
    if (found) return found;
  }
  return null;
}

/** Nhận cả một tên hoặc danh sách tên khả dĩ. */
function pick(layout: TabLayout, header: string | readonly string[]): ColumnRef | null {
  return typeof header === 'string' ? col(layout, header) : colAny(layout, header);
}

/**
 * Kiểm các cột bắt buộc. Trả danh sách tên còn THIẾU (giữ nguyên tên đã yêu cầu
 * để câu báo lỗi khớp đúng cái người vận hành thấy trong Sheet).
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_set_sheet / dp_status — chặn sớm khi Sheet sai bố cục
 */
export function requireCols(layout: TabLayout, headers: string[]): { missing: string[] } {
  return { missing: headers.filter((h) => col(layout, h) === null) };
}

// ─── Đọc ô ───────────────────────────────────────────────────────────────────

/** Giá trị ô dạng chuỗi đã trim. Cột không tồn tại / dòng ngắn → ''. */
function text(row: string[] | undefined, ref: ColumnRef | null): string {
  if (!ref || !row) return '';
  const v = row[ref.index];
  if (v === null || v === undefined) return '';
  return typeof v === 'string' ? v.trim() : String(v);
}

/**
 * Toạ độ trong Sheet mẫu bị nhân 1e6 và Sheets render số lớn ở dạng khoa học
 * ("1.081021E7"); `normalizeLatLng` lo phần chia về độ thật.
 */
function coords(row: string[], latRef: ColumnRef | null, lngRef: ColumnRef | null) {
  return normalizeLatLng(text(row, latRef), text(row, lngRef));
}

// ─── Map từng tab ────────────────────────────────────────────────────────────

/**
 * Map các dòng dữ liệu tab "Đơn hàng " → `Order[]`.
 *
 * `firstRow` là SỐ DÒNG THẬT trên Sheet của `rows[0]` (header ở dòng 1 nên dữ
 * liệu thường bắt đầu ở dòng 2). `rowNumber` giữ lại số dòng thật để ghi trả về
 * đúng ô — không bao giờ tính lại từ vị trí trong mảng đã lọc.
 *
 * Dòng không có `Mã đơn` bị bỏ: đó là dòng trống hoặc dòng ghi chú của khách.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_quet_don / dp_kiem_qua_han — nguồn đơn để xét
 */
export function mapOrders(rows: string[][], layout: TabLayout, firstRow: number): Order[] {
  const c = {
    code: col(layout, ORDER_COLS.code),
    kind: col(layout, ORDER_COLS.kind),
    createdAt: col(layout, ORDER_COLS.createdAt),
    customerName: col(layout, ORDER_COLS.customerName),
    customerPhone: col(layout, ORDER_COLS.customerPhone),
    address: col(layout, ORDER_COLS.address),
    ward: col(layout, ORDER_COLS.ward),
    district: col(layout, ORDER_COLS.district),
    lat: col(layout, ORDER_COLS.lat),
    lng: col(layout, ORDER_COLS.lng),
    distance: col(layout, ORDER_COLS.distanceFromWarehouseKm),
    stockStatus: col(layout, ORDER_COLS.stockStatus),
    weightKg: col(layout, ORDER_COLS.weightKg),
    parcels: col(layout, ORDER_COLS.parcels),
    paymentMethod: col(layout, ORDER_COLS.paymentMethod),
    codAmount: col(layout, ORDER_COLS.codAmount),
    hasPaperDoc: col(layout, ORDER_COLS.hasPaperDoc),
    deadline: col(layout, ORDER_COLS.deadline),
    priority: col(layout, ORDER_COLS.priority),
    status: col(layout, ORDER_COLS.status),
    driverCode: col(layout, ORDER_COLS.driverCode),
    plate: col(layout, ORDER_COLS.plate),
    assignedAt: col(layout, ORDER_COLS.assignedAt),
    assignedBy: col(layout, ORDER_COLS.assignedBy),
    driverConfirmedAt: col(layout, ORDER_COLS.driverConfirmedAt),
    pickedUpAt: col(layout, ORDER_COLS.pickedUpAt),
    deliveredAt: col(layout, ORDER_COLS.deliveredAt),
    podUrl: col(layout, ORDER_COLS.podUrl),
    attempts: col(layout, ORDER_COLS.attempts),
    failReason: col(layout, ORDER_COLS.failReason),
    agentNote: col(layout, ORDER_COLS.agentNote),
    tripCode: col(layout, ORDER_COLS.tripCode),
  };

  const out: Order[] = [];
  rows.forEach((row, i) => {
    const code = text(row, c.code);
    if (!code) return;
    const pos = coords(row, c.lat, c.lng);
    out.push({
      rowNumber: firstRow + i,
      code,
      kind: text(row, c.kind),
      createdAt: parseVnDateTime(text(row, c.createdAt)),
      customerName: text(row, c.customerName),
      customerPhone: text(row, c.customerPhone),
      address: text(row, c.address),
      ward: text(row, c.ward),
      district: text(row, c.district),
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
      distanceFromWarehouseKm: parseVnNumber(text(row, c.distance)),
      stockStatus: text(row, c.stockStatus),
      weightKg: parseVnNumber(text(row, c.weightKg)),
      parcels: parseVnNumber(text(row, c.parcels)),
      paymentMethod: text(row, c.paymentMethod),
      codAmount: num(text(row, c.codAmount), 0),
      hasPaperDoc: parseVnBool(text(row, c.hasPaperDoc)),
      deadline: parseVnDateTime(text(row, c.deadline)),
      priority: text(row, c.priority),
      status: text(row, c.status),
      driverCode: text(row, c.driverCode),
      plate: text(row, c.plate),
      assignedAt: parseVnDateTime(text(row, c.assignedAt)),
      assignedBy: text(row, c.assignedBy),
      driverConfirmedAt: parseVnDateTime(text(row, c.driverConfirmedAt)),
      pickedUpAt: parseVnDateTime(text(row, c.pickedUpAt)),
      deliveredAt: parseVnDateTime(text(row, c.deliveredAt)),
      podUrl: text(row, c.podUrl),
      attempts: num(text(row, c.attempts), 0),
      failReason: text(row, c.failReason),
      agentNote: text(row, c.agentNote),
      tripCode: text(row, c.tripCode),
    });
  });
  return out;
}

/**
 * Map các dòng dữ liệu tab "Tài xế" → `Driver[]`. Dòng không có `Mã tài xế` bị bỏ.
 *
 * `Địa bàn phụ trách chính`/`phụ` có bản cũ là `Quận phụ trách chính`/`phụ`,
 * đọc được cả hai. Giờ ca là số phút từ 00:00 (`parseMinutesOfDay`) để so sánh
 * được với `gio_chot_phan_cong` trong tab Cấu hình Agent.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_quet_don / dp_phan_cong — nguồn ứng viên
 */
export function mapDrivers(rows: string[][], layout: TabLayout, firstRow: number): Driver[] {
  const c = {
    code: col(layout, DRIVER_COLS.code),
    name: col(layout, DRIVER_COLS.name),
    phone: col(layout, DRIVER_COLS.phone),
    telegramId: col(layout, DRIVER_COLS.telegramId),
    status: col(layout, DRIVER_COLS.status),
    working: col(layout, DRIVER_COLS.working),
    shiftStart: col(layout, DRIVER_COLS.shiftStart),
    shiftEnd: col(layout, DRIVER_COLS.shiftEnd),
    primaryArea: colAny(layout, DRIVER_COLS.primaryArea),
    secondaryAreas: colAny(layout, DRIVER_COLS.secondaryAreas),
    zone: col(layout, DRIVER_COLS.zone),
    maxOrdersPerTrip: col(layout, DRIVER_COLS.maxOrdersPerTrip),
    plate: col(layout, DRIVER_COLS.plate),
    vehicleType: col(layout, DRIVER_COLS.vehicleType),
    allowedWeightKg: col(layout, DRIVER_COLS.allowedWeightKg),
    maxParcels: col(layout, DRIVER_COLS.maxParcels),
    vehicleCondition: col(layout, DRIVER_COLS.vehicleCondition),
    insuranceExpiry: col(layout, DRIVER_COLS.insuranceExpiry),
    lat: col(layout, DRIVER_COLS.lat),
    lng: col(layout, DRIVER_COLS.lng),
    positionUpdatedAt: col(layout, DRIVER_COLS.positionUpdatedAt),
    positionSource: col(layout, DRIVER_COLS.positionSource),
    distanceToWarehouseKm: col(layout, DRIVER_COLS.distanceToWarehouseKm),
    rating: col(layout, DRIVER_COLS.rating),
    lastAssignedAt: col(layout, DRIVER_COLS.lastAssignedAt),
    openOrders: col(layout, DRIVER_COLS.openOrders),
    totalDelivered: col(layout, DRIVER_COLS.totalDelivered),
    totalFailed: col(layout, DRIVER_COLS.totalFailed),
    codCollectedToday: col(layout, DRIVER_COLS.codCollectedToday),
    missingPodCount: col(layout, DRIVER_COLS.missingPodCount),
  };

  const out: Driver[] = [];
  rows.forEach((row, i) => {
    const code = text(row, c.code);
    if (!code) return;
    const pos = coords(row, c.lat, c.lng);
    out.push({
      rowNumber: firstRow + i,
      code,
      name: text(row, c.name),
      phone: text(row, c.phone),
      telegramId: text(row, c.telegramId),
      status: text(row, c.status),
      working: parseVnBool(text(row, c.working)),
      shiftStartMinutes: parseMinutesOfDay(text(row, c.shiftStart)),
      shiftEndMinutes: parseMinutesOfDay(text(row, c.shiftEnd)),
      primaryArea: text(row, c.primaryArea),
      secondaryAreas: parseList(text(row, c.secondaryAreas)),
      zone: text(row, c.zone),
      maxOrdersPerTrip: parseVnNumber(text(row, c.maxOrdersPerTrip)),
      plate: text(row, c.plate),
      vehicleType: text(row, c.vehicleType),
      allowedWeightKg: parseVnNumber(text(row, c.allowedWeightKg)),
      maxParcels: parseVnNumber(text(row, c.maxParcels)),
      vehicleCondition: text(row, c.vehicleCondition),
      insuranceExpiry: parseVnDateTime(text(row, c.insuranceExpiry)),
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
      positionUpdatedAt: parseVnDateTime(text(row, c.positionUpdatedAt)),
      positionSource: text(row, c.positionSource),
      distanceToWarehouseKm: parseVnNumber(text(row, c.distanceToWarehouseKm)),
      rating: parseVnNumber(text(row, c.rating)),
      lastAssignedAt: parseVnDateTime(text(row, c.lastAssignedAt)),
      openOrders: num(text(row, c.openOrders), 0),
      totalDelivered: num(text(row, c.totalDelivered), 0),
      totalFailed: num(text(row, c.totalFailed), 0),
      codCollectedToday: num(text(row, c.codCollectedToday), 0),
      missingPodCount: num(text(row, c.missingPodCount), 0),
    });
  });
  return out;
}

/**
 * "Tuyến cố định" hay "Giao trong ngày". Ô trống → "Giao trong ngày" (mặc định
 * an toàn hơn: đơn vẫn được xét trong ngày thay vì bị gom vào tuyến chờ).
 * So khớp lỏng để chịu được "Tuyến cố định " / thiếu dấu.
 */
function toDeliveryGroup(raw: string): DeliveryGroup {
  const k = normalizeKey(raw);
  return k.includes('cố định') || k.includes('co dinh') ? 'Tuyến cố định' : 'Giao trong ngày';
}

/**
 * Map tab "Khu vực" → `AreaRow[]`.
 *
 * Bỏ dòng không có địa bàn và dòng ghi chú bắt đầu bằng "Ngoài phạm vi" (khách
 * dùng các dòng đó để liệt kê nơi KHÔNG giao, ví dụ "Ngoài phạm vi: Bình Dương…");
 * coi chúng là địa bàn thật sẽ khiến agent tưởng có thể giao tới đó.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_quet_don — quyết nhóm giao + phạm vi (QT10)
 */
export function mapAreas(rows: string[][], layout: TabLayout): AreaRow[] {
  const c = {
    district: colAny(layout, AREA_COLS.district),
    unitKind: col(layout, AREA_COLS.unitKind),
    zone: col(layout, AREA_COLS.zone),
    deliveryGroup: col(layout, AREA_COLS.deliveryGroup),
    needsFerry: col(layout, AREA_COLS.needsFerry),
    centerLat: col(layout, AREA_COLS.centerLat),
    centerLng: col(layout, AREA_COLS.centerLng),
    distance: col(layout, AREA_COLS.distanceFromWarehouseKm),
  };

  const out: AreaRow[] = [];
  for (const row of rows) {
    const district = text(row, c.district);
    if (!district) continue;
    if (normalizeKey(district).startsWith(OUT_OF_SCOPE_PREFIX)) continue;
    const pos = coords(row, c.centerLat, c.centerLng);
    out.push({
      district,
      unitKind: text(row, c.unitKind),
      zone: text(row, c.zone),
      deliveryGroup: toDeliveryGroup(text(row, c.deliveryGroup)),
      needsFerry: parseVnBool(text(row, c.needsFerry)),
      centerLat: pos?.lat ?? null,
      centerLng: pos?.lng ?? null,
      distanceFromWarehouseKm: parseVnNumber(text(row, c.distance)),
    });
  }
  return out;
}

/**
 * Map tab "Kho" → `Warehouse` của dòng ĐẦU có `Mã kho` (hệ thống chỉ có 1 kho).
 *
 * Trả null khi không có dòng nào có mã kho, hoặc khi toạ độ kho không đọc được:
 * kho là điểm xuất phát để tính mọi khoảng cách, thiếu toạ độ thì phải báo lỗi
 * chứ không được đoán bằng số 0.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_quet_don — gốc tính khoảng cách
 */
export function mapWarehouse(rows: string[][], layout: TabLayout): Warehouse | null {
  const c = {
    code: col(layout, WAREHOUSE_COLS.code),
    name: colAny(layout, WAREHOUSE_COLS.name),
    lat: colAny(layout, WAREHOUSE_COLS.lat),
    lng: colAny(layout, WAREHOUSE_COLS.lng),
    open: colAny(layout, WAREHOUSE_COLS.open),
    close: colAny(layout, WAREHOUSE_COLS.close),
  };

  for (const row of rows) {
    const code = text(row, c.code);
    if (!code) continue;
    const pos = coords(row, c.lat, c.lng);
    if (!pos) return null;
    return {
      code,
      name: text(row, c.name),
      lat: pos.lat,
      lng: pos.lng,
      openMinutes: parseMinutesOfDay(text(row, c.open)),
      closeMinutes: parseMinutesOfDay(text(row, c.close)),
    };
  }
  return null;
}

/** Chữ cột A1 của một header, hoặc null khi tab không có cột đó. Pure. */
export function letterOf(layout: TabLayout, header: string | readonly string[]): string | null {
  return pick(layout, header)?.letter ?? null;
}

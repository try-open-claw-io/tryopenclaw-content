/**
 * Hợp đồng dữ liệu dùng chung cho plugin dispatch-core.
 *
 * Mọi module khác import type từ đây. KHÔNG đặt logic vào file này.
 *
 * Nguồn sự thật của nghiệp vụ là Google Sheet của khách:
 *   tab "Đơn hàng " · "Tài xế" · "Kho" · "Khu vực" · "Cấu hình Agent"
 *   · "Danh mục trạng thái " · "Ngoại lệ "
 * Lưu ý: một số tên tab có DẤU CÁCH ở cuối — luôn resolve bằng trim(), không so sánh cứng.
 */

// ─── Kết nối ──────────────────────────────────────────────────────────────────

export type FetchFn = typeof fetch;

/** Endpoint MCP connector của platform + bearer token, đọc từ openclaw.json. */
export interface ConnectorConfig {
  url: string;
  auth: string;
}

/** Cấu hình runtime của plugin, lưu ở $OPENCLAW_HOME/.openclaw/dispatch-core.config.json */
export interface SheetConfig {
  spreadsheetId: string;
  /** Tên tab đơn hàng. Default "Đơn hàng" (so khớp bằng trim). */
  orderTab?: string;
  /** Tên tab tài xế. Default "Tài xế". */
  driverTab?: string;
  /** Tên tab khu vực. Default "Khu vực". */
  areaTab?: string;
  /** Tên tab cấu hình. Default "Cấu hình Agent". */
  configTab?: string;
  /** Tên tab kho. Default "Kho". */
  warehouseTab?: string;
  /** Tên tab ngoại lệ. Default "Ngoại lệ". */
  exceptionTab?: string;
  /** Chế độ demo: true = chỉ đề xuất trong Telegram, KHÔNG ghi vào Sheet. Default true. */
  dryRun?: boolean;
}

// ─── Cấu hình nghiệp vụ (đọc từ tab "Cấu hình Agent") ─────────────────────────

/** Bảng tham số thô: mã tham số → giá trị dạng chuỗi (cột A → cột B). */
export type RawThresholds = Record<string, string>;

/**
 * Tham số đã parse. Mọi giá trị PHẢI đọc từ Sheet — số trong code chỉ là
 * fallback khi ô trống, không phải nguồn sự thật (QT7).
 */
export interface Thresholds {
  /** so_don_toi_da_moi_tai_xe — trần đơn đang mở của 1 tài xế (QT2). */
  maxOrdersPerDriver: number;
  /** tai_trong_toi_da_kg — trần khối lượng 1 xe máy (QT2). */
  maxWeightKg: number;
  /** so_kien_toi_da */
  maxParcels: number;
  /** thoi_han_giao_mac_dinh_phut */
  defaultDeadlineMinutes: number;
  /** thoi_han_don_hoan_phut */
  returnDeadlineMinutes: number;
  /** gio_chot_phan_cong — phút từ 00:00. Sau mốc này không tự phân công (QT12). */
  assignCutoffMinutes: number;
  /** ban_kinh_uu_tien_km */
  preferRadiusKm: number;
  /** ban_kinh_giao_trong_ngay_km — xa hơn thì chuyển Tuyến cố định. */
  sameDayRadiusKm: number;
  /** thoi_han_giao_dia_ban_xa_phut */
  farAreaDeadlineMinutes: number;
  /** cac_ngay_chay_tuyen_co_dinh — ["Thứ 3","Thứ 6"] → [2,5] (0=CN). */
  fixedRouteWeekdays: number[];
  /** gps_qua_han_phut — vị trí cũ hơn ngưỡng này coi như không có GPS. */
  gpsStaleMinutes: number;
  /** nguong_tu_tin — dưới ngưỡng thì xin người duyệt. */
  confidenceThreshold: number;
  /** chenh_lech_diem_toi_thieu — chênh lệch tối thiểu giữa ứng viên 1 và 2. */
  minScoreGap: number;
  /** 5 trọng số chấm điểm; tổng = 1.00 theo Sheet. */
  weights: ScoreWeights;
  /** so_lan_giao_toi_da — chạm ngưỡng thì chuyển người (QT9). */
  maxDeliveryAttempts: number;
  /** cho_tai_xe_xac_nhan_phut */
  driverConfirmReminderMinutes: number;
  /** chuyen_nguoi_neu_khong_xac_nhan_phut */
  driverConfirmEscalateMinutes: number;
  /** nguong_tien_thu_ho_gia_tri_cao — vượt thì bắt buộc người duyệt. */
  highCodThreshold: number;
  /** bat_buoc_anh_pod_truoc_khi_da_giao (QT8) */
  requirePodBeforeDelivered: boolean;
  /** bat_buoc_anh_tien_khi_cod */
  requireCodProof: boolean;
  /** cho_phep_tu_phan_cong — công tắc tổng. false = chỉ đề xuất. */
  allowAutoAssign: boolean;
  /** cho_phep_tu_doi_tai_xe — luôn false theo Sheet. */
  allowAutoReassign: boolean;
  /** cho_phep_mo_rong_ngoai_khu_vuc */
  allowExpandOutsideArea: boolean;
  /** che_sdt_khach_o_group_dieu_phoi (QT13) */
  maskCustomerPhoneInDispatchGroup: boolean;
  /**
   * ban_kinh_nhan_ngoai_danh_sach_km — THAM SỐ MỚI (owner chốt 12/08/2026):
   * địa bàn KHÔNG có trong tab Khu vực vẫn được nhận nếu điểm giao cách kho
   * không quá ngưỡng này. Vượt → Ngoài phạm vi (QT10).
   */
  acceptOutsideListRadiusKm: number;
  /** Bảng thô, giữ lại để log/truy vết. */
  raw: RawThresholds;
}

export interface ScoreWeights {
  /** trong_so_han_giao */
  deadline: number;
  /** trong_so_dung_quan */
  correctArea: number;
  /** trong_so_khoang_cach */
  distance: number;
  /** trong_so_con_cho_trong */
  freeCapacity: number;
  /** trong_so_cong_bang */
  fairness: number;
}

// ─── Bản ghi nghiệp vụ ────────────────────────────────────────────────────────

export type DeliveryGroup = 'Giao trong ngày' | 'Tuyến cố định';

/** 11 trạng thái hợp lệ trong tab "Danh mục trạng thái ". */
export type OrderStatus =
  | 'Chờ phân công'
  | 'Đã phân công'
  | 'Tài xế xác nhận'
  | 'Đã lấy hàng'
  | 'Đang giao'
  | 'Chờ ảnh POD'
  | 'Đã giao'
  | 'Giao thất bại'
  | 'Đã hoàn kho'
  | 'Đã huỷ'
  | 'Ngoài phạm vi';

/** Một dòng tab "Đơn hàng ". rowNumber là số dòng thật trên Sheet (1-indexed, header = 1). */
export interface Order {
  rowNumber: number;
  code: string;
  kind: string;
  createdAt: number | null;
  customerName: string;
  customerPhone: string;
  address: string;
  ward: string;
  district: string;
  lat: number | null;
  lng: number | null;
  distanceFromWarehouseKm: number | null;
  stockStatus: string;
  weightKg: number | null;
  parcels: number | null;
  paymentMethod: string;
  codAmount: number;
  hasPaperDoc: boolean;
  deadline: number | null;
  priority: string;
  status: string;
  driverCode: string;
  plate: string;
  assignedAt: number | null;
  assignedBy: string;
  driverConfirmedAt: number | null;
  pickedUpAt: number | null;
  deliveredAt: number | null;
  podUrl: string;
  attempts: number;
  failReason: string;
  agentNote: string;
  tripCode: string;
}

/** Một dòng tab "Tài xế". */
export interface Driver {
  rowNumber: number;
  code: string;
  name: string;
  phone: string;
  telegramId: string;
  status: string;
  working: boolean;
  shiftStartMinutes: number | null;
  shiftEndMinutes: number | null;
  primaryArea: string;
  secondaryAreas: string[];
  zone: string;
  maxOrdersPerTrip: number | null;
  plate: string;
  vehicleType: string;
  allowedWeightKg: number | null;
  maxParcels: number | null;
  vehicleCondition: string;
  insuranceExpiry: number | null;
  lat: number | null;
  lng: number | null;
  positionUpdatedAt: number | null;
  positionSource: string;
  distanceToWarehouseKm: number | null;
  rating: number | null;
  lastAssignedAt: number | null;
  openOrders: number;
  totalDelivered: number;
  totalFailed: number;
  codCollectedToday: number;
  missingPodCount: number;
}

/** Một dòng tab "Khu vực". */
export interface AreaRow {
  district: string;
  unitKind: string;
  zone: string;
  deliveryGroup: DeliveryGroup;
  needsFerry: boolean;
  centerLat: number | null;
  centerLng: number | null;
  distanceFromWarehouseKm: number | null;
}

/** Toạ độ kho (tab "Kho", ô E2/F2). */
export interface Warehouse {
  code: string;
  name: string;
  lat: number;
  lng: number;
  openMinutes: number | null;
  closeMinutes: number | null;
}

// ─── Lọc + chấm điểm ──────────────────────────────────────────────────────────

/** Mã lý do một tài xế bị loại ở bước điều kiện cứng. */
export type RejectReason =
  | 'khong-lam-viec'
  | 'trang-thai-khong-hop-le'
  | 'ngoai-ca'
  | 'xe-khong-binh-thuong'
  | 'bao-hiem-het-han'
  | 'thieu-telegram-id'
  | 'du-so-don'
  | 'vuot-tai-trong'
  | 'vuot-so-kien'
  | 'ngoai-dia-ban';

export interface RejectedDriver {
  driverCode: string;
  reason: RejectReason;
  detail: string;
}

/** Mức nới địa bàn đã dùng để tìm ra ứng viên (tab Hướng dẫn, 4 bước). */
export type AreaMatchLevel =
  | 'dia-ban-chinh'
  | 'dia-ban-phu'
  | 'toan-khu-vuc'
  | 'khong-co';

export interface ScoreBreakdown {
  deadline: number;
  correctArea: number;
  distance: number;
  freeCapacity: number;
  fairness: number;
  /** Tổng có trọng số, ∈ [0,1]. */
  total: number;
}

export interface Candidate {
  driver: Driver;
  score: ScoreBreakdown;
  /** Khoảng cách tài xế → điểm giao (km). null khi không có GPS hợp lệ. */
  distanceKm: number | null;
  /** Nguồn khoảng cách: 'gps-haversine' | 'maps' | 'trung-tam-quan' | 'khong-co'. */
  distanceSource: string;
  /** Câu giải thích ngắn bằng tiếng Việt, dùng để nổ đơn. */
  reason: string;
}

/** Kết quả xét 1 đơn. */
export interface OrderDecision {
  order: Order;
  /** Nhóm giao của địa bàn đơn. */
  deliveryGroup: DeliveryGroup | null;
  areaMatchLevel: AreaMatchLevel;
  candidates: Candidate[];
  rejected: RejectedDriver[];
  /** Tài xế được chọn. null khi không tự quyết được. */
  chosen: Candidate | null;
  /** true khi đủ tự tin để tự phân công (điểm ≥ nguong_tu_tin VÀ gap ≥ chenh_lech). */
  autoAssignable: boolean;
  /** Mã ngoại lệ cần tạo, null nếu không có. */
  exception: ExceptionKind | null;
  /** Câu tóm tắt để đưa vào Ghi chú Agent + tin Telegram. */
  note: string;
}

/** Loại ngoại lệ — khớp cột "Loại ngoại lệ" tab "Ngoại lệ ". */
export type ExceptionKind =
  | 'Thiếu thông tin'
  | 'Vượt tải trọng'
  | 'Ngoài phạm vi'
  | 'Hết tài xế trong khu vực'
  | 'Thiếu ảnh POD'
  | 'Thiếu ảnh chứng từ tiền'
  | 'Lệch tiền thu hộ'
  | 'Chứng từ giấy chưa thu hồi'
  | 'Quá số lần giao'
  | 'Lỗi kết nối'
  | 'Hàng chưa về kho'
  | 'Tài xế không xác nhận'
  | 'Sau giờ chốt phân công'
  | 'Dữ liệu thanh toán sai'
  | 'Tiền thu hộ giá trị cao'
  | 'Điểm tự tin thấp';

// ─── Bố cục Sheet ─────────────────────────────────────────────────────────────

/** Một cột đã resolve theo tên header. index 0-based. */
export interface ColumnRef {
  header: string;
  index: number;
  letter: string;
}

/** Bố cục một tab: header đã chuẩn hoá → ColumnRef. */
export interface TabLayout {
  title: string;
  headers: string[];
  byHeader: Map<string, ColumnRef>;
}

// ─── Kết quả tool ─────────────────────────────────────────────────────────────

/** Mã lỗi trả về agent. Agent phải báo đúng mã, không được tự đoán dữ liệu. */
export type ToolErrorCode =
  | 'need_sheet'
  | 'no_connector'
  | 'read_failed'
  | 'write_failed'
  | 'header_failed'
  | 'bad_args'
  | 'not_found'
  | 'blocked_by_rule';

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  details?: Record<string, unknown>;
}

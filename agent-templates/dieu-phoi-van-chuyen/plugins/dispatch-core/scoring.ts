/**
 * Chấm điểm chọn tài xế — module THUẦN (pure), không I/O, không Date.now().
 *
 * Mọi mốc thời gian đi vào qua tham số `nowMs` để test tái lập được 100%.
 * Mọi trọng số/ngưỡng đọc từ tab "Cấu hình Agent" (QT7) và truyền vào qua
 * `Thresholds`; số trong file này chỉ là hình dạng thang điểm, KHÔNG phải
 * tham số nghiệp vụ.
 *
 * Công thức điểm cuối (∈ [0,1]):
 *   total = w.deadline     · urgencyScore
 *         + w.correctArea  · areaScore
 *         + w.distance     · normalizeDistance
 *         + w.freeCapacity · capacityScore
 *         + w.fairness     · fairnessScore
 * với tổng 5 trọng số = 1.00 theo Sheet
 * (0.35 hạn giao · 0.30 đúng quận · 0.15 khoảng cách · 0.12 chỗ trống · 0.08 công bằng).
 */

import { haversineKm, normalizeKey } from './parse';
import type {
  AreaMatchLevel,
  Candidate,
  Driver,
  Order,
  ScoreBreakdown,
  Thresholds,
} from './types';

// ─── Hình dạng thang điểm (không phải tham số nghiệp vụ) ──────────────────────

const MS_PER_MINUTE = 60_000;

/** Còn ≥ 240 phút tới hạn giao thì độ gấp = 0; càng gần hạn càng tiến về 1. */
const URGENCY_HORIZON_MINUTES = 240;

/** Chưa được giao đơn ≥ 180 phút thì điểm công bằng đạt trần 1. */
const FAIRNESS_WINDOW_MINUTES = 180;

/** Cộng thêm cho đơn `priority = "Cao"` khi không truyền `priorityBoost`. */
const DEFAULT_PRIORITY_BOOST = 0.15;

/** Sai số so sánh số thực — điểm đã làm tròn 4 số nên 1e-9 là đủ an toàn. */
const EPSILON = 1e-9;

/** Điểm địa bàn theo mức nới đã dùng để tìm ra ứng viên (tab Hướng dẫn, 4 bước). */
const AREA_LEVEL_SCORE: Record<AreaMatchLevel, number> = {
  'dia-ban-chinh': 1,
  'dia-ban-phu': 0.6,
  'toan-khu-vuc': 0.3,
  'khong-co': 0,
};

// ─── Tiện ích số ──────────────────────────────────────────────────────────────

/** Kẹp về [0,1]; giá trị không hữu hạn coi như 0. */
function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Làm tròn `digits` chữ số thập phân, dọn sai số dấu phẩy động. */
function roundTo(value: number, digits: number): number {
  if (!Number.isFinite(value)) return 0;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/**
 * Định dạng số cho người Việt đọc: dấu phẩy thập phân, cố định `digits` chữ số.
 * `fmtNum(2.3)` → "2,3" · `fmtNum(0.75, 2)` → "0,75".
 */
export function fmtNum(value: number, digits = 1): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toFixed(digits).replace('.', ',');
}

// ─── 1. Khoảng cách tài xế → điểm giao ────────────────────────────────────────

/**
 * Khoảng cách từ tài xế tới điểm giao, km — kèm nguồn để truy vết.
 *
 * Thứ tự ưu tiên:
 *   1. GPS tài xế còn hạn (`positionUpdatedAt` mới hơn `gpsStaleMinutes` phút)
 *      → haversine GPS → điểm giao, `source: 'gps-haversine'`.
 *   2. GPS thiếu/quá hạn mà có tâm quận của tài xế → haversine tâm quận →
 *      điểm giao, `source: 'trung-tam-quan'` (ước lượng, không phải vị trí thật).
 *   3. Không tính được → `{ km: null, source: 'khong-co' }`.
 *
 * Đơn thiếu toạ độ thì mọi nhánh đều vô nghĩa → trả ngay 'khong-co'.
 * Mốc `positionUpdatedAt` ở tương lai (lệch giờ máy) coi như còn hạn.
 */
export function distanceToDropoff(
  driver: Driver,
  order: Order,
  opts: {
    nowMs: number;
    gpsStaleMinutes: number;
    areaCenter?: { lat: number; lng: number } | null;
  },
): { km: number | null; source: string } {
  const dropLat = order.lat;
  const dropLng = order.lng;
  if (dropLat === null || dropLng === null) return { km: null, source: 'khong-co' };

  const staleMs = Math.max(0, opts.gpsStaleMinutes) * MS_PER_MINUTE;
  if (
    driver.lat !== null &&
    driver.lng !== null &&
    driver.positionUpdatedAt !== null &&
    opts.nowMs - driver.positionUpdatedAt <= staleMs
  ) {
    return {
      km: roundTo(haversineKm(driver.lat, driver.lng, dropLat, dropLng), 3),
      source: 'gps-haversine',
    };
  }

  const center = opts.areaCenter;
  if (center) {
    return {
      km: roundTo(haversineKm(center.lat, center.lng, dropLat, dropLng), 3),
      source: 'trung-tam-quan',
    };
  }

  return { km: null, source: 'khong-co' };
}

// ─── 2. Chuẩn hoá khoảng cách ─────────────────────────────────────────────────

/**
 * Đổi km thành điểm ∈ [0,1] theo `1 - min(km, R) / R` với R = `sameDayRadiusKm`.
 *
 * Owner đã chốt: KẸP ở bán kính giao trong ngày (20 km) trước khi chuẩn hoá, để
 * một địa bàn xa như Cần Giờ (~55 km) không bóp méo thang điểm của các quận gần
 * nhau — mọi đơn quá R đều nhận 0, phần chênh ngoài R không còn ý nghĩa xếp hạng.
 *
 * `km === null` (không có GPS, không có tâm quận) → trả **0.5 trung tính**:
 * không thưởng cũng không phạt tài xế vì dữ liệu vị trí thiếu, tránh việc thiếu
 * GPS trở thành lợi thế hoặc án tử. R ≤ 0 (cấu hình lỗi) cũng trả 0.5.
 */
export function normalizeDistance(km: number | null, sameDayRadiusKm: number): number {
  if (km === null || !Number.isFinite(km)) return 0.5;
  if (!Number.isFinite(sameDayRadiusKm) || sameDayRadiusKm <= 0) return 0.5;
  const capped = Math.min(Math.max(km, 0), sameDayRadiusKm);
  return clamp01(roundTo(1 - capped / sameDayRadiusKm, 4));
}

// ─── 3. Độ gấp theo hạn giao ──────────────────────────────────────────────────

/**
 * Độ gấp của đơn ∈ [0,1]: càng gần hạn giao càng cao.
 *
 * Còn ≥ 240 phút → 0 · quá hạn hoặc còn ≤ 0 phút → 1 · ở giữa nội suy tuyến tính
 * `1 - conLai / 240` (còn 120 phút → 0.5).
 * `order.priority === 'Cao'` được cộng `priorityBoost` (default 0.15), kẹp ≤ 1.
 * `deadlineMs === null` → 0.5 trung tính (chưa rõ hạn thì không suy đoán, và
 * KHÔNG áp boost để giá trị trung tính giữ nguyên nghĩa).
 */
export function urgencyScore(
  order: Order,
  deadlineMs: number | null,
  nowMs: number,
  opts: { priorityBoost?: number } = {},
): number {
  if (deadlineMs === null) return 0.5;

  const minutesLeft = (deadlineMs - nowMs) / MS_PER_MINUTE;
  let score: number;
  if (minutesLeft <= 0) score = 1;
  else if (minutesLeft >= URGENCY_HORIZON_MINUTES) score = 0;
  else score = 1 - minutesLeft / URGENCY_HORIZON_MINUTES;

  if (normalizeKey(order.priority) === 'cao') {
    score += opts.priorityBoost ?? DEFAULT_PRIORITY_BOOST;
  }
  return clamp01(roundTo(score, 4));
}

// ─── 4. Điểm địa bàn ─────────────────────────────────────────────────────────

/**
 * Điểm khớp địa bàn ∈ [0,1] theo mức nới đã dùng:
 * `dia-ban-chinh` 1.0 · `dia-ban-phu` 0.6 · `toan-khu-vuc` 0.3 · `khong-co` 0.
 *
 * Ngoại lệ: nếu `driver.primaryArea` khớp `order.district` (so bằng
 * `normalizeKey`, bỏ qua hoa/thường và dấu cách) thì LUÔN 1.0, bất kể `level` —
 * mức nới chỉ nói bước tìm kiếm nào ra ứng viên, không hạ giá một tài xế thực
 * sự đang đứng đúng quận của đơn.
 */
export function areaScore(driver: Driver, order: Order, level: AreaMatchLevel): number {
  const primary = normalizeKey(driver.primaryArea);
  const district = normalizeKey(order.district);
  if (primary !== '' && primary === district) return 1;
  return AREA_LEVEL_SCORE[level] ?? 0;
}

// ─── 5. Điểm chỗ trống ────────────────────────────────────────────────────────

/**
 * Tỉ lệ chỗ còn trống ∈ [0,1]: `1 - openOrders / maxOrders`.
 *
 * `maxOrders = driver.maxOrdersPerTrip ?? t.maxOrdersPerDriver` — trần riêng của
 * tài xế thắng trần chung (QT2). Trần ≤ 0 → 0 (không nhận thêm được đơn nào).
 */
export function capacityScore(driver: Driver, t: Thresholds): number {
  const maxOrders = driver.maxOrdersPerTrip ?? t.maxOrdersPerDriver;
  if (!Number.isFinite(maxOrders) || maxOrders <= 0) return 0;
  const open = Math.max(0, driver.openOrders);
  return clamp01(roundTo(1 - open / maxOrders, 4));
}

// ─── 6. Điểm công bằng ────────────────────────────────────────────────────────

/**
 * Điểm công bằng ∈ [0,1]: càng lâu chưa được giao đơn càng cao, để đơn không
 * dồn hết vào một người.
 *
 * `lastAssignedAt === null` (chưa nhận đơn nào) → 1 · cách đây ≥ 180 phút → 1 ·
 * vừa giao xong (0 phút) → 0 · ở giữa nội suy `phut / 180`.
 */
export function fairnessScore(driver: Driver, nowMs: number): number {
  if (driver.lastAssignedAt === null) return 1;
  const minutes = Math.max(0, (nowMs - driver.lastAssignedAt) / MS_PER_MINUTE);
  if (minutes >= FAIRNESS_WINDOW_MINUTES) return 1;
  return clamp01(roundTo(minutes / FAIRNESS_WINDOW_MINUTES, 4));
}

// ─── 7. Chấm điểm một tài xế ──────────────────────────────────────────────────

/** Ngữ cảnh chấm điểm — mọi thứ phụ thuộc thời gian/khoảng cách đi vào từ đây. */
export interface ScoreContext {
  t: Thresholds;
  level: AreaMatchLevel;
  nowMs: number;
  deadlineMs: number | null;
  distanceKm: number | null;
  distanceSource: string;
}

/** Điểm thành phần THÔ (chưa nhân trọng số), dùng nội bộ để sinh câu giải thích. */
interface RawParts {
  deadline: number;
  correctArea: number;
  distance: number;
  freeCapacity: number;
  fairness: number;
}

/**
 * Chấm điểm 1 tài xế cho 1 đơn → `Candidate`.
 *
 * Mỗi field của `ScoreBreakdown` là điểm THÀNH PHẦN ĐÃ NHÂN TRỌNG SỐ (làm tròn
 * 4 số); `total = round4(clamp01(deadline + correctArea + distance +
 * freeCapacity + fairness))` — tức tổng đúng bằng tổng 5 field đang lưu, không
 * tính lại từ số chưa làm tròn.
 *
 * `reason` là câu tiếng Việt ngắn nêu 2 yếu tố đóng góp nhiều điểm nhất, kèm
 * khoảng cách khi biết (số km dùng dấu phẩy thập phân, 1 chữ số).
 */
export function scoreDriver(driver: Driver, order: Order, ctx: ScoreContext): Candidate {
  const w = ctx.t.weights;
  const parts: RawParts = {
    deadline: urgencyScore(order, ctx.deadlineMs, ctx.nowMs),
    correctArea: areaScore(driver, order, ctx.level),
    distance: normalizeDistance(ctx.distanceKm, ctx.t.sameDayRadiusKm),
    freeCapacity: capacityScore(driver, ctx.t),
    fairness: fairnessScore(driver, ctx.nowMs),
  };

  const deadline = roundTo(w.deadline * parts.deadline, 4);
  const correctArea = roundTo(w.correctArea * parts.correctArea, 4);
  const distance = roundTo(w.distance * parts.distance, 4);
  const freeCapacity = roundTo(w.freeCapacity * parts.freeCapacity, 4);
  const fairness = roundTo(w.fairness * parts.fairness, 4);
  const total = roundTo(
    clamp01(deadline + correctArea + distance + freeCapacity + fairness),
    4,
  );

  const score: ScoreBreakdown = { deadline, correctArea, distance, freeCapacity, fairness, total };
  return {
    driver,
    score,
    distanceKm: ctx.distanceKm,
    distanceSource: ctx.distanceSource,
    reason: buildReason(driver, order, ctx, parts, score),
  };
}

/** Câu giải thích ngắn: 2 yếu tố mạnh nhất, cộng khoảng cách nếu chưa có trong đó. */
function buildReason(
  driver: Driver,
  order: Order,
  ctx: ScoreContext,
  parts: RawParts,
  score: ScoreBreakdown,
): string {
  const fragments = [
    { key: 'deadline', points: score.deadline, text: deadlineText(order, ctx) },
    {
      key: 'correctArea',
      points: score.correctArea,
      text: areaText(driver, order, ctx.level, parts.correctArea),
    },
    { key: 'distance', points: score.distance, text: distanceText(ctx) },
    { key: 'freeCapacity', points: score.freeCapacity, text: capacityText(driver, ctx.t) },
    { key: 'fairness', points: score.fairness, text: fairnessText(driver, ctx.nowMs) },
  ];

  // Sắp theo đóng góp giảm dần; bằng nhau thì giữ thứ tự khai báo (ổn định).
  const ordered = fragments
    .map((f, index) => ({ ...f, index }))
    .sort((a, b) => (b.points - a.points !== 0 ? b.points - a.points : a.index - b.index));

  const top = ordered.slice(0, 2);
  if (ctx.distanceKm !== null && !top.some((f) => f.key === 'distance')) {
    const dist = ordered.find((f) => f.key === 'distance');
    if (dist) top.push(dist);
  }
  return top.map((f) => f.text).join(' · ');
}

function deadlineText(order: Order, ctx: ScoreContext): string {
  if (ctx.deadlineMs === null) return 'chưa rõ hạn giao';
  const tag = normalizeKey(order.priority) === 'cao' ? 'ưu tiên cao, ' : '';
  const minutesLeft = Math.round((ctx.deadlineMs - ctx.nowMs) / MS_PER_MINUTE);
  if (minutesLeft <= 0) return `${tag}quá hạn ${Math.abs(minutesLeft)} phút`;
  return `${tag}còn ${minutesLeft} phút tới hạn`;
}

function areaText(
  driver: Driver,
  order: Order,
  level: AreaMatchLevel,
  areaPart: number,
): string {
  const district = order.district.trim();
  const primary = driver.primaryArea.trim();
  if (areaPart >= 1) return `đúng địa bàn ${district || primary || 'chính'}`;
  if (level === 'dia-ban-phu') return `địa bàn phụ ${district || 'chưa rõ'}`;
  if (level === 'toan-khu-vuc') return `cùng khu vực ${driver.zone.trim() || district || 'chưa rõ'}`;
  return 'ngoài địa bàn';
}

function distanceText(ctx: ScoreContext): string {
  if (ctx.distanceKm === null) return 'chưa có vị trí tài xế';
  const base = `cách điểm giao ${fmtNum(ctx.distanceKm, 1)} km`;
  return ctx.distanceSource === 'trung-tam-quan' ? `${base} (tâm quận)` : base;
}

function capacityText(driver: Driver, t: Thresholds): string {
  const maxOrders = driver.maxOrdersPerTrip ?? t.maxOrdersPerDriver;
  const free = Math.max(0, maxOrders - Math.max(0, driver.openOrders));
  return `còn ${free}/${maxOrders} chỗ`;
}

function fairnessText(driver: Driver, nowMs: number): string {
  if (driver.lastAssignedAt === null) return 'chưa nhận đơn nào';
  const minutes = Math.max(0, Math.round((nowMs - driver.lastAssignedAt) / MS_PER_MINUTE));
  return `chờ đơn ${minutes} phút`;
}

// ─── 8. Xếp hạng ứng viên ─────────────────────────────────────────────────────

/**
 * Sắp ứng viên theo `score.total` giảm dần. Bằng điểm thì: `openOrders` nhỏ hơn
 * trước → `rating` cao hơn trước (null coi như thấp nhất) → `code` tăng dần.
 *
 * Tie-break cuối bằng `code` nên kết quả ỔN ĐỊNH, không phụ thuộc thứ tự đầu
 * vào. Trả mảng MỚI, không sửa mảng gốc.
 */
export function rankCandidates(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => {
    const byScore = b.score.total - a.score.total;
    if (Math.abs(byScore) > EPSILON) return byScore;

    const byOpen = a.driver.openOrders - b.driver.openOrders;
    if (byOpen !== 0) return byOpen;

    const ratingA = a.driver.rating ?? Number.NEGATIVE_INFINITY;
    const ratingB = b.driver.rating ?? Number.NEGATIVE_INFINITY;
    if (ratingA !== ratingB) return ratingB - ratingA;

    if (a.driver.code < b.driver.code) return -1;
    if (a.driver.code > b.driver.code) return 1;
    return 0;
  });
}

// ─── 9. Quyết định phân công ──────────────────────────────────────────────────

/** Lý do không tự phân công được. */
export type AssignBlockReason =
  | 'khong-co-ung-vien'
  | 'diem-thap'
  | 'chenh-lech-nho'
  | 'tat-tu-phan-cong';

export interface AssignmentDecision {
  chosen: Candidate | null;
  autoAssignable: boolean;
  blockedBy: AssignBlockReason | null;
}

/**
 * Quyết định có được tự phân công hay phải xin người duyệt.
 *
 * `chosen` LUÔN là `ranked[0]` (kể cả khi bị chặn) để agent còn đề xuất được.
 * `autoAssignable = t.allowAutoAssign && total₁ ≥ t.confidenceThreshold &&
 * (chỉ 1 ứng viên || total₁ - total₂ ≥ t.minScoreGap)`.
 * Thứ tự xét `blockedBy`: công tắc tổng → điểm thấp → chênh lệch nhỏ.
 * So sánh có EPSILON để 0.85 - 0.75 (= 0.09999…) không bị coi là dưới 0.10.
 */
export function decideAssignment(ranked: Candidate[], t: Thresholds): AssignmentDecision {
  if (ranked.length === 0) {
    return { chosen: null, autoAssignable: false, blockedBy: 'khong-co-ung-vien' };
  }

  const first = ranked[0];
  const second = ranked.length > 1 ? ranked[1] : null;
  const switchOn = t.allowAutoAssign === true;
  const scoreOk = first.score.total >= t.confidenceThreshold - EPSILON;
  const gapOk =
    second === null || first.score.total - second.score.total >= t.minScoreGap - EPSILON;

  let blockedBy: AssignBlockReason | null = null;
  if (!switchOn) blockedBy = 'tat-tu-phan-cong';
  else if (!scoreOk) blockedBy = 'diem-thap';
  else if (!gapOk) blockedBy = 'chenh-lech-nho';

  return { chosen: first, autoAssignable: switchOn && scoreOk && gapOk, blockedBy };
}

// ─── 10. Giải thích cho điều phối viên ────────────────────────────────────────

/**
 * Một câu tiếng Việt cho điều phối viên đọc, luôn nêu điểm và ngưỡng liên quan.
 * Ví dụ: "Điểm 0,71 dưới ngưỡng tự tin 0,75 → cần người duyệt."
 */
export function explainDecision(
  d: { chosen: Candidate | null; autoAssignable: boolean; blockedBy: string | null },
  t: Thresholds,
): string {
  const conf = fmtNum(t.confidenceThreshold, 2);
  const gap = fmtNum(t.minScoreGap, 2);

  if (d.chosen === null || d.blockedBy === 'khong-co-ung-vien') {
    return 'Không có tài xế nào đủ điều kiện → cần người duyệt xử lý tay.';
  }

  const who = d.chosen.driver.code || d.chosen.driver.name || 'tài xế';
  const pts = fmtNum(d.chosen.score.total, 2);

  if (d.autoAssignable) {
    return `Điểm ${pts} đạt ngưỡng tự tin ${conf} → tự phân công cho ${who}.`;
  }
  if (d.blockedBy === 'tat-tu-phan-cong') {
    return `Đã tắt tự phân công → chỉ đề xuất ${who} (điểm ${pts}) cho người duyệt.`;
  }
  if (d.blockedBy === 'diem-thap') {
    return `Điểm ${pts} dưới ngưỡng tự tin ${conf} → cần người duyệt.`;
  }
  if (d.blockedBy === 'chenh-lech-nho') {
    return `Điểm ${pts} đạt ngưỡng ${conf} nhưng chênh lệch với ứng viên 2 dưới ${gap} → cần người duyệt.`;
  }
  return `Đề xuất ${who} (điểm ${pts}) → cần người duyệt.`;
}

/**
 * Khoảng cách + ETA tài xế → điểm giao. Hai tầng: Google Routes API khi có key,
 * đường chim bay (haversine) khi không — điều phối KHÔNG BAO GIỜ đứng vì Maps.
 *
 * ─── CHI PHÍ: đọc trước khi sửa file này ─────────────────────────────────────
 * · Google Maps Platform free tier = **10.000 lượt/tháng TÍNH RIÊNG TỪNG SKU**
 *   (Routes: Compute Route Matrix là một SKU riêng). Vẫn BẮT BUỘC gắn billing
 *   account để key hoạt động, và vượt free tier là Google **tự trừ tiền**
 *   (~5 USD/1.000 lượt) — budget alert chỉ gửi mail, KHÔNG chặn chi tiêu.
 * · `computeRouteMatrix` tính tiền **THEO Ô**: số origin × số destination.
 *   Gọi 3 tài xế cho 1 đơn (3 origin × 1 destination) = 3 ô, không phải 1 lượt.
 * · Khối lượng thật của khách: ~71 đơn/ngày.
 *     3 ứng viên/đơn → 71 × 3 × 30 ≈ **6.400 ô/tháng** → CÒN TRONG free tier.
 *     5 ứng viên/đơn → 71 × 5 × 30 ≈ **10.650 ô/tháng** → ĐÃ VƯỢT, bị trừ tiền.
 *   Vì vậy `DISPATCH_MAPS_TOP_N` default 3 và `estimateDistances()` chỉ gọi Maps
 *   cho top N tài xế gần nhất theo haversine; phần còn lại dùng haversine (0đ).
 * · BẮT BUỘC khi bật key: Cloud Console → Google Maps Platform → Quotas →
 *   đặt **trần 350 lượt/ngày** cho SKU này. Đó là chốt an toàn cuối cùng: quota
 *   cap chặn được request, budget alert thì không.
 * · Distance Matrix API (maps.googleapis.com/maps/api/distancematrix) là
 *   **LEGACY**, Google không cho project mới dùng → file này chỉ gọi Routes API.
 *
 * Mọi hàm nhận `fetchFn` injectable để test, không đụng network trong unit test.
 */
import { haversineKm } from './parse';
import type { FetchFn } from './types';

/** Toạ độ đã chuẩn hoá về độ (dùng `normalizeLatLng()` của parse.ts trước khi vào đây). */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Một ô khoảng cách. null = không tính được (không có tuyến / Maps không trả). */
export interface DistanceResult {
  km: number | null;
  minutes: number | null;
}

/** Kết quả đã hợp nhất 2 tầng, kèm nguồn số liệu để ghi vào Ghi chú Agent. */
export interface EstimatedDistance extends DistanceResult {
  source: 'maps' | 'haversine';
}

const ROUTE_MATRIX_URL = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';

/** FieldMask BẮT BUỘC với Routes API — thiếu header này API trả 400. */
const FIELD_MASK = 'originIndex,destinationIndex,duration,distanceMeters,condition';

const DEFAULT_TOP_N = 3;
const MAX_TOP_N = 10;

const NO_KEY_NOTE = 'Chưa cấu hình GOOGLE_MAPS_API_KEY → dùng khoảng cách đường chim bay (0đ)';
const OFF_NOTE = 'Maps đang tắt (DISPATCH_MAPS_TOP_N=0) → dùng khoảng cách đường chim bay (0đ)';

/**
 * Có gọi Maps hay không: phải có `GOOGLE_MAPS_API_KEY` VÀ `DISPATCH_MAPS_TOP_N != 0`.
 * Đặt env top N = 0 là công tắc tắt hẳn Maps dù key vẫn còn trong container.
 *
 * @usedBy {plugins/dispatch-core/index.ts} → dp_status — báo nguồn khoảng cách đang dùng
 */
export function mapsEnabled(): boolean {
  return apiKeyFromEnv() !== null && topN() > 0;
}

/**
 * Số tài xế tối đa được gọi Maps mỗi đơn. Đọc `DISPATCH_MAPS_TOP_N`, default 3,
 * kẹp [0, 10]. Trần 10 là chốt cứng chống lỡ tay gõ 100 rồi cháy free tier.
 */
export function topN(): number {
  const raw = (process.env.DISPATCH_MAPS_TOP_N ?? '').trim();
  if (!raw) return DEFAULT_TOP_N;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_TOP_N;
  return clampTopN(n);
}

/**
 * Khoảng cách đường chim bay từ mỗi origin tới điểm giao, km làm tròn 1 chữ số.
 * Luôn chạy được, 0đ, không network — đây là tầng nền của mọi lần chấm điểm.
 * Thứ tự kết quả khớp đúng thứ tự `origins`.
 */
export function haversineDistances(origins: LatLng[], destination: LatLng): number[] {
  return origins.map((o) => round1(haversineKm(o.lat, o.lng, destination.lat, destination.lng)));
}

/**
 * Gọi Routes API `computeRouteMatrix`: N origin × 1 destination.
 *
 * `travelMode: 'TWO_WHEELER'` vì đội xe của khách TOÀN XE MÁY — chế độ này mới
 * cho đi đường hẻm/đường cấm ô tô và ra ETA sát thực tế TP.HCM; dùng 'DRIVE' sẽ
 * cho quãng đường dài hơn và ETA sai lệch với thực tế xe máy.
 * `routingPreference: 'TRAFFIC_AWARE'` để ETA có tính tắc đường.
 *
 * CẢNH BÁO CHI PHÍ: tính tiền theo Ô = origins.length × 1. Đừng truyền cả danh
 * sách tài xế vào đây — dùng `estimateDistances()` để nó tự kẹp top N.
 *
 * @param opts.apiKey  key Maps, caller đã kiểm tra khác rỗng
 * @param opts.fetchFn inject để test
 * @param opts.signal  timeout/abort từ caller
 * @returns mảng CÙNG THỨ TỰ `origins`; ô không có tuyến → `{km:null, minutes:null}`
 * @throws `maps HTTP <status>: <body ngắn>` khi HTTP không ok
 */
export async function routeMatrix(
  origins: LatLng[],
  destination: LatLng,
  opts: { apiKey: string; fetchFn?: FetchFn; signal?: AbortSignal },
): Promise<DistanceResult[]> {
  if (origins.length === 0) return [];
  const fetchFn = opts.fetchFn ?? fetch;

  const res = await fetchFn(ROUTE_MATRIX_URL, {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': opts.apiKey,
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      origins: origins.map(waypoint),
      destinations: [waypoint(destination)],
      travelMode: 'TWO_WHEELER',
      routingPreference: 'TRAFFIC_AWARE',
    }),
    signal: opts.signal,
  });

  if (!res.ok) throw new Error(`maps HTTP ${res.status}: ${shorten(await safeText(res))}`);

  const payload: unknown = await res.json();
  // Response là MẢNG PHẦN TỬ MA TRẬN, thứ tự KHÔNG bảo đảm → luôn map bằng
  // originIndex. Google bỏ field khi giá trị mặc định, nên originIndex/
  // destinationIndex thiếu = 0 (đây là bẫy làm lệch cả ma trận nếu giả định sai).
  if (!Array.isArray(payload)) throw new Error('maps trả về dữ liệu không phải mảng ma trận');

  const out: DistanceResult[] = origins.map(() => ({ km: null, minutes: null }));
  for (const raw of payload) {
    const el = raw as MatrixElement;
    const originIndex = indexOf(el.originIndex);
    const destinationIndex = indexOf(el.destinationIndex);
    if (destinationIndex !== 0) continue;
    if (originIndex < 0 || originIndex >= out.length) continue;
    if (el.condition !== 'ROUTE_EXISTS') continue; // ROUTE_NOT_FOUND / thiếu → giữ null
    out[originIndex] = { km: metersToKm(el.distanceMeters), minutes: durationToMinutes(el.duration) };
  }
  return out;
}

/**
 * Khoảng cách cho TẤT CẢ ứng viên, dùng Maps ở đâu đáng dùng nhất.
 *
 * Cơ chế giữ chi phí trong free tier:
 *   1. Haversine cho toàn bộ origins trước — miễn phí, không bao giờ thiếu số.
 *   2. Chỉ gọi Maps cho **top N origin GẦN NHẤT theo haversine** (N = `maxCalls`
 *      nếu truyền, ngược lại `DISPATCH_MAPS_TOP_N`, default 3). Tài xế xa thì ETA
 *      thật cũng không đổi được kết quả chấm điểm, trả tiền cho nó là lãng phí.
 *   3. Với 71 đơn/ngày × 3 ô × 30 ngày ≈ **6.400 ô/tháng** → còn trong 10.000 ô
 *      free của SKU Compute Route Matrix. Nâng N lên 5 là ≈10.650 ô → bị trừ tiền.
 *
 * Maps lỗi (429, timeout, key sai, body lạ) KHÔNG được làm hỏng việc điều phối:
 * bắt mọi lỗi, trả toàn bộ haversine và giải thích trong `note` bằng tiếng Việt.
 *
 * @param opts.apiKey   ghi đè key env (test / caller đã tự đọc config)
 * @param opts.maxCalls ghi đè `DISPATCH_MAPS_TOP_N`; 0 = không gọi Maps
 * @returns `results` cùng thứ tự `origins`, `usedMaps` = có ô nào lấy từ Maps,
 *          `note` câu giải thích để đưa vào Ghi chú Agent / tin Telegram
 * @usedBy {plugins/dispatch-core/index.ts} → dp_quet_don — khoảng cách cho bước chấm điểm
 */
export async function estimateDistances(
  origins: LatLng[],
  destination: LatLng,
  opts: { apiKey?: string; fetchFn?: FetchFn; maxCalls?: number } = {},
): Promise<{ results: EstimatedDistance[]; usedMaps: boolean; note: string }> {
  const base = haversineDistances(origins, destination);
  const results: EstimatedDistance[] = base.map((km) => ({ km, minutes: null, source: 'haversine' }));
  if (origins.length === 0) {
    return { results, usedMaps: false, note: 'Không có ứng viên nào để tính khoảng cách' };
  }

  const apiKey = (opts.apiKey ?? '').trim() || apiKeyFromEnv();
  if (!apiKey) return { results, usedMaps: false, note: NO_KEY_NOTE };

  const budget = Math.min(clampTopN(opts.maxCalls ?? topN()), origins.length);
  if (budget <= 0) return { results, usedMaps: false, note: OFF_NOTE };

  // Top N gần nhất theo haversine — đây là chỗ chặn chi phí.
  const nearest = base
    .map((km, index) => ({ index, km }))
    .sort((a, b) => a.km - b.km)
    .slice(0, budget)
    .map((x) => x.index);

  try {
    const matrix = await routeMatrix(
      nearest.map((i) => origins[i]),
      destination,
      { apiKey, fetchFn: opts.fetchFn },
    );
    let fromMaps = 0;
    matrix.forEach((cell, k) => {
      const target = nearest[k];
      if (target === undefined || cell.km === null) return; // không có tuyến → giữ haversine
      results[target] = { km: cell.km, minutes: cell.minutes, source: 'maps' };
      fromMaps += 1;
    });
    return {
      results,
      usedMaps: fromMaps > 0,
      note: `Maps: ${fromMaps}/${origins.length} ứng viên có ETA thật (còn lại dùng đường chim bay)`,
    };
  } catch (err) {
    // Fallback toàn bộ: thà điều phối bằng đường chim bay còn hơn đứng chờ Maps.
    for (let i = 0; i < results.length; i += 1) {
      results[i] = { km: base[i], minutes: null, source: 'haversine' };
    }
    return {
      results,
      usedMaps: false,
      note: `Maps lỗi (${reasonOf(err)}) → dùng khoảng cách đường chim bay`,
    };
  }
}

/** Km cho người đọc: dấu phẩy thập phân kiểu Việt. null → "—". */
export function formatKm(km: number | null): string {
  if (km === null || !Number.isFinite(km)) return '—';
  return `${km.toFixed(1).replace('.', ',')} km`;
}

// ─── nội bộ ───────────────────────────────────────────────────────────────────

/** Một phần tử ma trận Routes API (chỉ các field trong FIELD_MASK). */
interface MatrixElement {
  originIndex?: number;
  destinationIndex?: number;
  /** "1234s" — Duration dạng proto. */
  duration?: string | number;
  distanceMeters?: number;
  condition?: string;
}

function waypoint(p: LatLng): { waypoint: { location: { latLng: { latitude: number; longitude: number } } } } {
  return { waypoint: { location: { latLng: { latitude: p.lat, longitude: p.lng } } } };
}

function apiKeyFromEnv(): string | null {
  const k = (process.env.GOOGLE_MAPS_API_KEY ?? '').trim();
  return k ? k : null;
}

function clampTopN(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_TOP_N;
  return Math.min(MAX_TOP_N, Math.max(0, Math.trunc(n)));
}

function round1(km: number): number {
  return Math.round(km * 10) / 10;
}

/** Field số bị bỏ khi = 0 (proto3 JSON) → thiếu nghĩa là 0. */
function indexOf(raw: number | undefined): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? Math.trunc(raw) : 0;
}

function metersToKm(raw: number | undefined): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  return round1(raw / 1000);
}

/** Duration proto "900s" → 15 phút. Nhận cả số giây thuần cho chắc. */
function durationToMinutes(raw: string | number | undefined): number | null {
  const seconds =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number(raw.trim().replace(/s$/, ''))
        : Number.NaN;
  if (!Number.isFinite(seconds)) return null;
  return Math.round(seconds / 60);
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

function shorten(s: string): string {
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > 160 ? `${one.slice(0, 160)}…` : one;
}

/** Lý do ngắn để đưa vào note tiếng Việt: ưu tiên mã HTTP. */
function reasonOf(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const http = msg.match(/HTTP\s+(\d{3})/);
  if (http) return `HTTP ${http[1]}`;
  const one = msg.replace(/\s+/g, ' ').trim();
  return one.length > 80 ? `${one.slice(0, 80)}…` : one || 'không rõ';
}

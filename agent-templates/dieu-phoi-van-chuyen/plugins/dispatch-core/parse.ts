/**
 * Parser thuần cho dữ liệu đọc từ Google Sheet.
 *
 * Sheet trả về FORMATTED_VALUE nên mọi ô là CHUỖI đã format theo locale Việt:
 *   số thực "0,75" · "1,09"        (dấu phẩy thập phân)
 *   số tiền "5.000.000" · "396"    (dấu chấm phân cách ngàn)
 *   phần trăm "87,5%"
 *   ngày giờ "2026-08-11 08:00" hoặc "11/08/2026 08:00"
 *   giờ trong ngày "07:00" · "16:30"
 *   đúng/sai "1" · "0" · "TRUE" · "Có" · "Không"
 *
 * Mọi hàm ở đây PURE và có unit test. Không I/O, không Date.now() ẩn.
 */

/**
 * Parse số theo locale Việt. Trả null khi ô trống hoặc không phải số.
 *
 * Quy tắc phân biệt dấu: nếu có CẢ "." và "," thì "." là phân cách ngàn và ","
 * là thập phân ("1.234,5" → 1234.5). Nếu chỉ có "," thì "," là thập phân
 * ("0,75" → 0.75). Nếu chỉ có "." thì "." là phân cách ngàn khi nhóm đúng 3 số
 * ("5.000.000" → 5000000), ngược lại là thập phân ("1.09" → 1.09).
 *
 * Cũng nhận dạng khoa học ("1.081021E7" → 10810210): Sheets tự render số lớn
 * kiểu này, đúng vào cột toạ độ đã nhân 1e6 của Sheet mẫu.
 */
export function parseVnNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string') return null;
  let s = raw.trim().replace(/\s+/g, '').replace(/%$/, '').replace(/đ$/i, '');
  if (!s) return null;
  const negative = /^-/.test(s);
  s = s.replace(/^[-+]/, '');
  // Tách phần mũ TRƯỚC khi suy luận dấu ngàn/thập phân, vì "E" làm hỏng phép
  // kiểm ký tự bên dưới và phần định trị vẫn theo quy tắc dấu như thường.
  let exponent = '';
  const sci = s.match(/[eE]([+-]?\d+)$/);
  if (sci) {
    exponent = `e${sci[1]}`;
    s = s.slice(0, sci.index);
  }
  if (!/^[\d.,]+$/.test(s)) return null;

  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  let normalized: string;
  if (hasDot && hasComma) {
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = s.replace(/,/g, '.');
  } else if (hasDot) {
    const groups = s.split('.');
    const isThousand = groups.length > 1 && groups.slice(1).every((g) => g.length === 3);
    normalized = isThousand ? groups.join('') : s;
  } else {
    normalized = s;
  }
  const n = Number(normalized + exponent);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Như parseVnNumber nhưng trả về `fallback` thay vì null. */
export function num(raw: unknown, fallback: number): number {
  const v = parseVnNumber(raw);
  return v === null ? fallback : v;
}

/**
 * Parse đúng/sai. Nhận: 1/0, TRUE/FALSE, Có/Không, x, ✓, Đang làm/Nghỉ.
 * Ô trống → false.
 */
export function parseVnBool(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw !== 0;
  if (typeof raw !== 'string') return false;
  const s = raw.trim().toLowerCase();
  if (!s) return false;
  return ['1', 'true', 'có', 'co', 'x', '✓', 'yes', 'y', 'đúng', 'dung'].includes(s);
}

/**
 * Parse ngày giờ → epoch ms (GMT+7). Trả null khi không đọc được.
 * Nhận "yyyy-mm-dd hh:mm[:ss]", "dd/mm/yyyy hh:mm", "yyyy-mm-dd", "dd/mm/yyyy".
 * Cũng nhận serial Excel (số ngày từ 1899-12-30) để chịu được sheet chưa format.
 */
export function parseVnDateTime(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return serialToEpochMs(raw);
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (iso) {
    return gmt7ToEpochMs(+iso[1], +iso[2], +iso[3], +(iso[4] ?? 0), +(iso[5] ?? 0), +(iso[6] ?? 0));
  }
  const vn = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (vn) {
    return gmt7ToEpochMs(+vn[3], +vn[2], +vn[1], +(vn[4] ?? 0), +(vn[5] ?? 0), +(vn[6] ?? 0));
  }
  const serial = parseVnNumber(s);
  if (serial !== null && serial > 20000 && serial < 100000) return serialToEpochMs(serial);
  return null;
}

/** Epoch ms từ các thành phần ngày giờ hiểu theo GMT+7. */
export function gmt7ToEpochMs(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): number {
  return Date.UTC(year, month - 1, day, hour - 7, minute, second);
}

/** Serial Excel (gốc 1899-12-30) → epoch ms, coi phần lẻ là giờ GMT+7. */
export function serialToEpochMs(serial: number): number {
  const days = Math.floor(serial);
  const frac = serial - days;
  const base = Date.UTC(1899, 11, 30) + days * 86400000;
  return base + Math.round(frac * 86400000) - 7 * 3600000;
}

/**
 * Parse giờ trong ngày → số phút từ 00:00. Trả null khi không đọc được.
 * Nhận "07:00", "16:30", "7h", và serial time (0.4583333 → 11:00).
 */
export function parseMinutesOfDay(raw: unknown): number | null {
  if (typeof raw === 'number' && raw >= 0 && raw < 1) return Math.round(raw * 1440);
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  const hm = s.match(/^(\d{1,2})[:h](\d{1,2})?$/);
  if (hm) {
    const h = +hm[1];
    const m = +(hm[2] ?? 0);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
  }
  const frac = parseVnNumber(s);
  if (frac !== null && frac >= 0 && frac < 1) return Math.round(frac * 1440);
  return null;
}

/** Số phút từ 00:00 → "hh:mm". */
export function formatMinutesOfDay(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Epoch ms → "yyyy-mm-dd hh:mm" theo GMT+7 (định dạng ghi vào Sheet). */
export function stampGmt7(epochMs: number): string {
  const d = new Date(epochMs + 7 * 3600000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** Số phút từ 00:00 của một mốc epoch, theo GMT+7. */
export function minutesOfDayGmt7(epochMs: number): number {
  const d = new Date(epochMs + 7 * 3600000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Thứ trong tuần theo GMT+7. 0 = Chủ nhật. */
export function weekdayGmt7(epochMs: number): number {
  return new Date(epochMs + 7 * 3600000).getUTCDay();
}

/** "yyyy-mm-dd" theo GMT+7. */
export function dateKeyGmt7(epochMs: number): string {
  return stampGmt7(epochMs).slice(0, 10);
}

/**
 * Parse "Thứ 3, Thứ 6" → [2, 5] (0 = Chủ nhật, khớp Date#getUTCDay).
 * Nhận cả "T3", "thứ ba", "CN", "Chủ nhật".
 */
export function parseVnWeekdays(raw: unknown): number[] {
  if (typeof raw !== 'string') return [];
  const map: Record<string, number> = {
    cn: 0, 'chủnhật': 0, 'chunhat': 0,
    t2: 1, 'thứ2': 1, 'thứhai': 1, 'thuhai': 1,
    t3: 2, 'thứ3': 2, 'thứba': 2, 'thuba': 2,
    t4: 3, 'thứ4': 3, 'thứtư': 3, 'thutu': 3,
    t5: 4, 'thứ5': 4, 'thứnăm': 4, 'thunam': 4,
    t6: 5, 'thứ6': 5, 'thứsáu': 5, 'thusau': 5,
    t7: 6, 'thứ7': 6, 'thứbảy': 6, 'thubay': 6,
  };
  const out = new Set<number>();
  for (const part of raw.split(/[,;/]/)) {
    const key = part.trim().toLowerCase().replace(/\s+/g, '');
    if (key in map) out.add(map[key]);
  }
  return [...out].sort((a, b) => a - b);
}

/** Parse danh sách phân tách bằng dấu phẩy → mảng đã trim, bỏ ô rỗng. */
export function parseList(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Chuẩn hoá tên header/tab để so khớp: bỏ dấu cách 2 đầu, gộp dấu cách giữa,
 * hạ chữ thường. Dùng cho cả tên tab có dấu cách ở cuối ("Đơn hàng ").
 */
export function normalizeKey(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Index 0-based → chữ cột A1 ("A", "Z", "AA", "AR"). */
export function columnLetter(index: number): string {
  let n = Math.max(0, Math.floor(index)) + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Khoảng cách đường chim bay giữa 2 toạ độ, km. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Toạ độ trong Sheet mẫu bị nhân 1e6 (ví dụ 1.081021E7 = 10.81021).
 * Hàm này đưa về độ thật: chia 10 cho tới khi vào khoảng hợp lệ của TP.HCM.
 * Trả null khi không thể chuẩn hoá.
 */
export function normalizeLatLng(
  latRaw: unknown,
  lngRaw: unknown,
): { lat: number; lng: number } | null {
  let lat = parseVnNumber(latRaw);
  let lng = parseVnNumber(lngRaw);
  if (lat === null || lng === null) return null;
  let guard = 0;
  while (Math.abs(lat) > 90 && guard++ < 10) lat /= 10;
  guard = 0;
  while (Math.abs(lng) > 180 && guard++ < 10) lng /= 10;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

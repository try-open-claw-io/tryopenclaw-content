/**
 * chamcong-check — minimal HANET partner-API client (developers.hanet.ai).
 *
 * OAuth2 host `oauth.hanet.com`; API host `partner.hanet.ai`. Every API call
 * carries a short-lived `access_token`; when it expires (returnCode -103) we
 * refresh it with the long-lived `refresh_token` (grant_type=refresh_token).
 *
 * Pure/fetch-driven helpers take an injectable FetchFn so they unit-test without
 * network. No openclaw import here — usable from tests in isolation.
 */

export type FetchFn = typeof fetch;

// ── Defaults + constants ──────────────────────────────────────────────────────
const DEFAULT_OAUTH_URL = 'https://oauth.hanet.com';
const TOKEN_EXPIRY_BUFFER_MS = 60_000; // refresh a token that expires within this window
const DEFAULT_EXPIRES_IN_S = 3600;

const RETURN_MESSAGES: Record<number, string> = {
  [-103]: 'access_token hết hạn',
  [-9006]: 'ảnh không hợp lệ (cần rõ mặt, đúng 1 người, nhìn thẳng, không mũ/khẩu trang)',
  [-9003]: 'lỗi đăng ký nhân viên',
  [-2035]: 'không có quyền trên địa điểm/tài nguyên này',
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface HanetAuthConfig {
  oauthUrl?:    string;
  clientId:     string;
  clientSecret: string;
  refreshToken: string;
  token?:       { accessToken: string; expiresAtMs: number };
}

export interface HanetResult<T = unknown> {
  returnCode:     number;
  returnMessage?: string;
  data?:          T;
}

export interface RegisterInput {
  name:          string;
  aliasID:       string;
  placeID:       string;
  departmentID?: string;
  title?:        string;
  type?:         string;
  image:         Uint8Array;
  filename?:     string;
}

export interface AccessTokenResult {
  accessToken:      string;
  tokenCache:       { accessToken: string; expiresAtMs: number };
  newRefreshToken?: string;
}

interface NamedId { id: string; name: string }

// ── Return-code mapping (never forward raw HANET text blindly) ─────────────────

/**
 * Map a HANET returnCode → a short Vietnamese message. Pure.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_register_faceid — friendly per-row error
 */
export function mapReturnCode(code: number, rawMsg?: string): string {
  const known = RETURN_MESSAGES[code];
  if (known) return `HANET [${code}]: ${known}`;
  return `HANET [${code}]${rawMsg ? `: ${rawMsg}` : ''}`;
}

// ── OAuth token (cache + refresh) ─────────────────────────────────────────────

/**
 * Return a valid access_token: the cached one if it isn't within the expiry
 * buffer, else refresh via `POST {oauthUrl}/token` (grant_type=refresh_token).
 * Caller persists `tokenCache` (and `newRefreshToken` if HANET rotated it).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → HANET tools — resolves the token before every call
 */
export async function getAccessToken(
  cfg: HanetAuthConfig,
  nowMs: number,
  fetchFn: FetchFn = fetch,
): Promise<AccessTokenResult> {
  if (cfg.token && cfg.token.expiresAtMs > nowMs + TOKEN_EXPIRY_BUFFER_MS) {
    return { accessToken: cfg.token.accessToken, tokenCache: cfg.token };
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: cfg.refreshToken,
  }).toString();

  const res = await fetchFn(`${cfg.oauthUrl ?? DEFAULT_OAUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`HANET oauth HTTP ${res.status}`);

  const j = (await res.json()) as { access_token?: string; expires_in?: number; refresh_token?: string };
  if (!j.access_token) throw new Error('HANET oauth: không nhận được access_token (refresh_token sai/hết hạn?)');

  const expiresAtMs = nowMs + (j.expires_in ?? DEFAULT_EXPIRES_IN_S) * 1000;
  const tokenCache = { accessToken: j.access_token, expiresAtMs };
  const newRefreshToken = j.refresh_token && j.refresh_token !== cfg.refreshToken ? j.refresh_token : undefined;
  return { accessToken: j.access_token, tokenCache, newRefreshToken };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Parse a HANET response → HanetResult. The live API is inconsistent: some
 * endpoints return camelCase `returnCode`, /person/register returns snake_case
 * `return_code` AND carries permission errors (-2035) with an HTTP 403 body — so
 * we read the body regardless of status and normalize both key styles.
 */
async function parseHanetResponse(res: { status: number; text: () => Promise<string> }): Promise<HanetResult> {
  const text = await res.text();
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`HANET HTTP ${res.status}: ${text.slice(0, 120)}`);
  }
  const returnCode = (j.returnCode ?? j.return_code) as number | undefined;
  if (typeof returnCode !== 'number') throw new Error(`HANET HTTP ${res.status}: phản hồi không hợp lệ`);
  return { returnCode, returnMessage: (j.returnMessage ?? j.return_message) as string | undefined, data: j.data };
}

/** POST an application/x-www-form-urlencoded body → HanetResult. */
async function postForm(url: string, fields: Record<string, string>, fetchFn: FetchFn): Promise<HanetResult> {
  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  });
  return parseHanetResponse(res);
}

/** Coerce a HANET `data` payload into a list (handles array / {departments|items|data}). */
function asList(data: unknown): Array<{ id: unknown; name?: unknown }> {
  if (Array.isArray(data)) return data as Array<{ id: unknown; name?: unknown }>;
  const obj = (data ?? {}) as Record<string, unknown>;
  const nested = obj.departments ?? obj.items ?? obj.data;
  return Array.isArray(nested) ? (nested as Array<{ id: unknown; name?: unknown }>) : [];
}

function toNamedIds(result: HanetResult): NamedId[] {
  if (result.returnCode !== 1) throw new Error(mapReturnCode(result.returnCode, result.returnMessage));
  return asList(result.data).map((d) => ({ id: String(d.id), name: String(d.name ?? '') }));
}

/**
 * Register (create) a person on HANET from a face image via multipart
 * `POST {baseUrl}/person/register`. Returns the parsed HanetResult.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_register_faceid — creates the FaceID
 */
export async function registerPerson(
  baseUrl: string,
  token: string,
  p: RegisterInput,
  fetchFn: FetchFn = fetch,
): Promise<HanetResult> {
  const form = new FormData();
  form.set('token', token);
  form.set('name', p.name);
  form.set('aliasID', p.aliasID);
  form.set('placeID', p.placeID);
  form.set('type', p.type ?? '0');
  if (p.departmentID) form.set('departmentID', p.departmentID);
  if (p.title) form.set('title', p.title);
  form.set('file', new Blob([p.image], { type: 'image/jpeg' }), p.filename ?? 'face.jpg');

  const res = await fetchFn(`${baseUrl}/person/register`, { method: 'POST', body: form });
  return parseHanetResponse(res);
}

/**
 * List the account's HANET places → `[{id,name}]` (for building placeMap).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_list_places — discover placeIDs
 */
export async function getPlaces(baseUrl: string, token: string, fetchFn: FetchFn = fetch): Promise<NamedId[]> {
  return toNamedIds(await postForm(`${baseUrl}/place/getPlaces`, { token }, fetchFn));
}

/**
 * List departments (phòng ban) of a place → `[{id,name}]` (for building deptMap).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_list_departments — discover departmentIDs
 */
export async function getDepartments(
  baseUrl: string,
  token: string,
  placeID: string,
  fetchFn: FetchFn = fetch,
): Promise<NamedId[]> {
  return toNamedIds(await postForm(`${baseUrl}/department/list`, { token, placeID }, fetchFn));
}

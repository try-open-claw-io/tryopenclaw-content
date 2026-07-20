/**
 * Minimal client for the platform connector MCP, called from INSIDE the plugin
 * so the agent never has to marshal the sheet matrix as tool arguments (LLMs do
 * that unreliably). The connector endpoint is stateless streamable-HTTP: one
 * JSON-RPC POST per call, JSON response in the body — no session/SSE/initialize.
 *
 * The endpoint URL + bearer token are read from the running openclaw.json
 * (`mcp.servers.tryopenclaw-connectors`), so no extra credential is introduced.
 *
 * Pure helpers (parseConnectorConfig, extractSheetValues) are unit-tested; the
 * fetch-driven calls take an injectable FetchFn for testing.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface ConnectorConfig {
  url:  string;
  auth: string;
}

// ── Per-agent sheet config (set at first-run via chamcong_set_sheet) ─────────
export interface SheetConfig {
  spreadsheetId: string;
  dataTab?:      string;
  bankTab?:      string;
  visionModel?:  string;
}

function sheetConfigPath(): string {
  const home = process.env.OPENCLAW_HOME || "/home/node";
  return join(home, ".openclaw", "chamcong-check.config.json");
}

/**
 * Load the saved sheet config (which Google Sheet to check), or null if the user
 * has not provided a link yet. NOT hardcoded — the enterprise sets this once.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → every check tool — resolves the target sheet
 */
export function loadSheetConfig(path = sheetConfigPath()): SheetConfig | null {
  if (!existsSync(path)) return null;
  try {
    const c = JSON.parse(readFileSync(path, "utf8")) as Partial<SheetConfig>;
    if (!c.spreadsheetId) return null;
    return { spreadsheetId: c.spreadsheetId, dataTab: c.dataTab, bankTab: c.bankTab, visionModel: c.visionModel };
  } catch {
    return null;
  }
}

/**
 * Persist the sheet config after the user provides a link.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_set_sheet — saves the operator's sheet link
 */
export function saveSheetConfig(cfg: SheetConfig, path = sheetConfigPath()): void {
  // Preserve an existing visionModel override: re-running set_sheet with a new
  // sheet must not silently revert the CCCD-vision model back to the chat model.
  const visionModel = cfg.visionModel ?? loadSheetConfig(path)?.visionModel;
  const merged: SheetConfig = visionModel ? { ...cfg, visionModel } : cfg;
  writeFileSync(path, JSON.stringify(merged, null, 2), "utf8");
}

// ── HANET FaceID config ──────────────────────────────────────────────────────
// Kept in a SEPARATE file from the sheet config so its two writers never clobber:
// secrets are injected at INSTALL time (from .env), while placeMap/deptMap can be
// set via chat and the access-token cache is rewritten on every refresh. All
// fields are optional — the config is assembled in pieces (secrets → targets →
// token cache) and validated at use-time (index.ts need_hanet gate).
export interface HanetConfig {
  baseUrl?:      string;                         // default https://partner.hanet.ai
  oauthUrl?:     string;                         // default https://oauth.hanet.com
  clientId?:     string;
  clientSecret?: string;
  refreshToken?: string;
  placeId?:      string;                         // default owning place ("Địa điểm sở hữu")
  placeMap?:     Record<string, string>;         // Công trình -> placeID (raw keys; normalized on use)
  deptMap?:      Record<string, string>;         // Công trình -> departmentID (raw keys)
  defaultType?:  string;                         // HANET person type, default "0"
  token?:        { accessToken: string; expiresAtMs: number }; // runtime cache
}

function hanetConfigPath(): string {
  const home = process.env.OPENCLAW_HOME || "/home/node";
  return join(home, ".openclaw", "chamcong-check.hanet.json");
}

/**
 * Load the HANET config, or null when it hasn't been provisioned yet.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → HANET tools — resolves creds/targets before calls
 */
export function loadHanetConfig(path = hanetConfigPath()): HanetConfig | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as HanetConfig;
  } catch {
    return null;
  }
}

/**
 * Persist a PARTIAL HANET config, merged over what's on disk (shallow) so no
 * writer clobbers another's keys: install writes secrets, chat writes targets,
 * token refresh writes the cache (+ a rotated refresh_token).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_set_hanet_targets + token refresh — persists targets/cache
 * @usedBy {scripts/agent-templates/scripts/install-ssh.ts} → HANET inject — writes secrets from .env at install
 */
export function saveHanetConfig(partial: Partial<HanetConfig>, path = hanetConfigPath()): void {
  const merged: HanetConfig = { ...(loadHanetConfig(path) ?? {}), ...partial };
  writeFileSync(path, JSON.stringify(merged, null, 2), "utf8");
}

export type FetchFn = typeof fetch;

const CONNECTOR_SERVER = "tryopenclaw-connectors";

function configCandidates(): string[] {
  const home = process.env.OPENCLAW_HOME || "/home/node";
  return [join(home, ".openclaw", "openclaw.json"), "/home/node/.openclaw/openclaw.json"];
}

/** Parse openclaw.json text → connector MCP endpoint + auth header. Pure. */
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
 * Load the connector config from the running gateway's openclaw.json.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_range — resolves the connector endpoint before reads
 */
export function loadConnectorConfig(candidates: string[] = configCandidates()): ConnectorConfig {
  const path = candidates.find((p) => existsSync(p));
  if (!path) throw new Error(`openclaw.json không tìm thấy (đã thử: ${candidates.join(", ")})`);
  return parseConnectorConfig(readFileSync(path, "utf8"));
}

/**
 * Resolve the model configured for `agentId` from openclaw.json text: the
 * agent's own model, else the instance default primary. Returns null if neither
 * is set. NEVER hardcode a model — the enterprise owns this config. Pure.
 */
export function parseAgentModel(rawJson: string, agentId: string): string | null {
  const cfg = JSON.parse(rawJson) as {
    agents?: { list?: Array<{ id?: string; model?: string }>; defaults?: { model?: { primary?: string } } };
  };
  const own = cfg.agents?.list?.find((a) => a.id === agentId)?.model;
  return own ?? cfg.agents?.defaults?.model?.primary ?? null;
}

/**
 * Resolve the model for the CCCD vision (image.describe) read from raw config
 * text: an explicit per-instance override (`visionModel` in the plugin config)
 * wins; otherwise fall back to the agent's configured chat model. Lets the
 * enterprise run a cheap vision model (e.g. a mini) for the repetitive OCR while
 * keeping a stronger model for chat. Never hardcoded. Pure.
 */
export function resolveVisionModel(sheetConfigRaw: string | null, agentConfigRaw: string, agentId: string): string {
  if (sheetConfigRaw) {
    try {
      const override = (JSON.parse(sheetConfigRaw) as { visionModel?: unknown }).visionModel;
      if (typeof override === "string" && override.trim()) return override.trim();
    } catch {
      // malformed plugin config → fall back to the agent model
    }
  }
  const model = parseAgentModel(agentConfigRaw, agentId);
  if (!model) throw new Error("chưa cấu hình model cho agent (agents.list / agents.defaults.model.primary)");
  return model;
}

/**
 * Load the vision-read model from disk: the `visionModel` override in the plugin
 * config, else the agent's configured model from the running openclaw.json.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_cccd — model for the vision (image.describe) call
 */
export function loadVisionModel(
  agentId: string,
  sheetPath = sheetConfigPath(),
  candidates: string[] = configCandidates(),
): string {
  const sheetRaw = existsSync(sheetPath) ? readFileSync(sheetPath, "utf8") : null;
  const cfgPath = candidates.find((p) => existsSync(p));
  if (!cfgPath) throw new Error(`openclaw.json không tìm thấy (đã thử: ${candidates.join(", ")})`);
  return resolveVisionModel(sheetRaw, readFileSync(cfgPath, "utf8"), agentId);
}

/** Extract the 2D cell matrix from an MCP tools/call result envelope. Pure. */
export function extractSheetValues(mcpResult: unknown): string[][] {
  const content = (mcpResult as { content?: Array<{ text?: string }> })?.content;
  const text = content?.[0]?.text;
  if (!text) return [];
  const parsed = JSON.parse(text) as { data?: { valueRanges?: Array<{ values?: string[][] }> } };
  return parsed?.data?.valueRanges?.[0]?.values ?? [];
}

/**
 * Call a connector tool via the stateless MCP endpoint; returns the JSON-RPC `result`.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_range — invokes GOOGLESHEETS_BATCH_GET
 */
export async function callConnectorTool(
  cfg: ConnectorConfig,
  name: string,
  args: Record<string, unknown>,
  fetchFn: FetchFn = fetch,
): Promise<unknown> {
  const res = await fetchFn(cfg.url, {
    method: "POST",
    headers: { Authorization: cfg.auth, "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  });
  if (!res.ok) throw new Error(`connector HTTP ${res.status}`);
  const payload = (await res.json()) as { result?: unknown; error?: { message?: string } };
  if (payload.error) throw new Error(`connector ${name}: ${payload.error.message ?? "error"}`);
  return payload.result;
}

/**
 * Write a 2D block starting at `firstCell` (A1 without sheet prefix, e.g. "X295")
 * into `sheetName`. Uses RAW so notes are stored verbatim (no formula/number coercion).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_range (write mode) — writes column X + Y
 */
export async function writeCells(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  sheetName: string,
  firstCell: string,
  values: Array<Array<string>>,
  fetchFn: FetchFn = fetch,
): Promise<void> {
  await callConnectorTool(
    cfg,
    "GOOGLESHEETS_BATCH_UPDATE",
    {
      spreadsheet_id: spreadsheetId,
      sheet_name: sheetName,
      first_cell_location: firstCell,
      values,
      value_input_option: "RAW",
    },
    fetchFn,
  );
}

/** Read one A1-notation range → 2D cell matrix. */
export async function readSheetValues(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  range: string,
  fetchFn: FetchFn = fetch,
): Promise<string[][]> {
  const result = await callConnectorTool(
    cfg,
    "GOOGLESHEETS_BATCH_GET",
    { spreadsheet_id: spreadsheetId, ranges: [range], valueRenderOption: "FORMATTED_VALUE" },
    fetchFn,
  );
  return extractSheetValues(result);
}

/**
 * Parse a GOOGLESHEETS_GET_SPREADSHEET_INFO envelope → the target tab's numeric
 * sheetId + current grid columnCount. Pure.
 */
export function parseSheetGrid(
  mcpResult: unknown,
  sheetTitle: string,
): { sheetId: number; columnCount: number; rowCount: number } | null {
  const content = (mcpResult as { content?: Array<{ text?: string }> })?.content;
  const text = content?.[0]?.text;
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as {
      data?: { sheets?: Array<{ properties?: { sheetId?: number; title?: string; gridProperties?: { columnCount?: number; rowCount?: number } } }> };
    };
    const sheet = parsed?.data?.sheets?.find((s) => s.properties?.title === sheetTitle);
    const sheetId = sheet?.properties?.sheetId;
    const columnCount = sheet?.properties?.gridProperties?.columnCount;
    const rowCount = sheet?.properties?.gridProperties?.rowCount;
    if (typeof sheetId !== "number" || typeof columnCount !== "number") return null;
    return { sheetId, columnCount, rowCount: typeof rowCount === "number" ? rowCount : 1000 };
  } catch {
    return null;
  }
}

/**
 * Read the target tab's numeric sheetId + current grid column count.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → ensureGridWidth() — pre-sizes the grid before writing the agent's columns
 */
export async function getSheetGrid(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  sheetTitle: string,
  fetchFn: FetchFn = fetch,
): Promise<{ sheetId: number; columnCount: number; rowCount: number } | null> {
  const result = await callConnectorTool(
    cfg,
    "GOOGLESHEETS_GET_SPREADSHEET_INFO",
    { spreadsheet_id: spreadsheetId, fields: "sheets.properties(sheetId,title,gridProperties)" },
    fetchFn,
  );
  return parseSheetGrid(result, sheetTitle);
}

/**
 * Add one conditional-format rule to a tab (ADD operation). Used to color the
 * agent's status column by value (OK / needs-fix) so rows are distinguishable.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → ensureAgentHeaders() — colors the status column on creation
 */
export async function addConditionalFormatRule(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  sheetId: number,
  rule: unknown,
  fetchFn: FetchFn = fetch,
): Promise<void> {
  await callConnectorTool(
    cfg,
    "GOOGLESHEETS_MUTATE_CONDITIONAL_FORMAT_RULES",
    { spreadsheet_id: spreadsheetId, sheet_id: sheetId, operation: "ADD", rule },
    fetchFn,
  );
}

/**
 * Append `count` empty COLUMNS to a tab (by numeric sheetId). Used to pre-size the
 * grid so the connector's BATCH_UPDATE write does not force a grid expansion —
 * which pads +10 buffer columns, leaving stray "Column N" placeholders.
 *
 * @usedBy {plugins/chamcong-check/index.ts} → ensureGridWidth() — grows the grid to fit the agent's columns exactly
 */
export async function appendColumns(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  sheetId: number,
  count: number,
  fetchFn: FetchFn = fetch,
): Promise<void> {
  await callConnectorTool(
    cfg,
    "GOOGLESHEETS_APPEND_DIMENSION",
    { spreadsheet_id: spreadsheetId, sheet_id: sheetId, dimension: "COLUMNS", length: count },
    fetchFn,
  );
}

/**
 * Map a spreadsheet's tab titles → numeric sheetId (gid). Used to check whether
 * the report/history tabs exist AND to build deep links to them (`#gid=<id>`).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → writeScanReport() — tab existence + deep-link gids
 */
export async function getSheetIdsByTitle(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  fetchFn: FetchFn = fetch,
): Promise<Map<string, number>> {
  const result = await callConnectorTool(
    cfg,
    "GOOGLESHEETS_GET_SPREADSHEET_INFO",
    { spreadsheet_id: spreadsheetId, fields: "sheets.properties(sheetId,title)" },
    fetchFn,
  );
  const out = new Map<string, number>();
  const text = (result as { content?: Array<{ text?: string }> })?.content?.[0]?.text;
  if (!text) return out;
  try {
    const parsed = JSON.parse(text) as { data?: { sheets?: Array<{ properties?: { sheetId?: number; title?: string } }> } };
    for (const s of parsed?.data?.sheets ?? []) {
      const title = s.properties?.title;
      const sheetId = s.properties?.sheetId;
      if (title && typeof sheetId === "number") out.set(title, sheetId);
    }
    return out;
  } catch {
    return out;
  }
}

/**
 * Create a new grid tab with `title`. Caller checks existence first (force_unique
 * off → errors on a duplicate, which the best-effort caller swallows).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → writeScanReport() — creates the report/history tab when missing
 */
export async function addSheetTab(
  cfg: ConnectorConfig,
  spreadsheetId: string,
  title: string,
  fetchFn: FetchFn = fetch,
): Promise<void> {
  await callConnectorTool(
    cfg,
    "GOOGLESHEETS_ADD_SHEET",
    { spreadsheet_id: spreadsheetId, title, force_unique: false },
    fetchFn,
  );
}

/** Extract the temporary download URL from a GOOGLEDRIVE_DOWNLOAD_FILE result. Pure. */
export function extractDownloadUrl(mcpResult: unknown): string | null {
  const content = (mcpResult as { content?: Array<{ text?: string }> })?.content;
  const text = content?.[0]?.text;
  if (!text) return null;
  try {
    const p = JSON.parse(text) as { data?: { downloaded_file_content?: { s3url?: string; url?: string } } };
    const dl = p?.data?.downloaded_file_content;
    return dl?.s3url ?? dl?.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Download a Drive file's raw bytes via the connector (used for CCCD images).
 *
 * @usedBy {plugins/chamcong-check/index.ts} → chamcong_check_cccd — fetches front/back CCCD images
 */
export async function downloadDriveFile(
  cfg: ConnectorConfig,
  fileId: string,
  fetchFn: FetchFn = fetch,
): Promise<Uint8Array> {
  const result = await callConnectorTool(cfg, "GOOGLEDRIVE_DOWNLOAD_FILE", { fileId }, fetchFn);
  const url = extractDownloadUrl(result);
  if (!url) throw new Error(`không lấy được link tải cho file ${fileId}`);
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`tải file ${fileId} lỗi HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

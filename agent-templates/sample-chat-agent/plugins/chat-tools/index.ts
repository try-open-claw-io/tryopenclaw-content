import { definePluginEntry } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import type { IncomingMessage, ServerResponse } from "node:http";

const BASE = "/api/sample-chat-agent/chat-tools";

function createPingTool() {
  return {
    name: "chat_ping",
    label: "Chat Tools · kiểm tra tải",
    description:
      "Trả 'ok' + version để xác nhận plugin chat-tools đã load và tool gọi được. Không tác dụng phụ.",
    parameters: { type: "object" as const, properties: {}, required: [] as string[] },
    execute: async () => ({
      content: [{ type: "text", text: "chat-tools ok (v0.1.0)" }],
      details: { ok: true, version: "0.1.0" },
    }),
  };
}

function handlePing(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, plugin: "chat-tools", version: "0.1.0" }));
}

export default definePluginEntry({
  id: "chat-tools",
  name: "Chat Tools",
  description:
    "Sample in-instance plugin for sample-chat-agent: a chat_ping agent tool + a /ping HTTP route.",
  register(api: OpenClawPluginApi) {
    api.registerTool(() => createPingTool(), { name: "chat_ping" });
    api.registerHttpRoute({ path: `${BASE}/ping`, auth: "gateway", match: "exact", handler: handlePing });
  },
});

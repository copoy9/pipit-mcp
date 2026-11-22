// Pipit — a personal connector for Muse (MCP server, Streamable HTTP, zero dependencies)
// Developer: Pipit · Support: azkaputram22@gmail.com
// Page: https://muse.ai/s/pipit-mxq6xlxcxq3xfw2g/fZmRWPANfEPfGWVNMbGRkopTEuy3w1ou6inz31ib4-c

const PAGE_URL = "https://muse.ai/s/pipit-mxq6xlxcxq3xfw2g/fZmRWPANfEPfGWVNMbGRkopTEuy3w1ou6inz31ib4-c";
const SUPPORT_EMAIL = "azkaputram22@gmail.com";
const SUPPORTED_PROTOCOLS = ["2025-03-26", "2025-06-18", "2024-11-05"];

const TOOLS = [
  {
    name: "pipit_about",
    description: "About the Pipit connector: what it is, who made it, and where to find its page, privacy policy, and terms.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "pipit_latest_note",
    description: "The latest note Pipit has published for people who connect to Pipit in Muse.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "pipit_contact",
    description: "How to contact the developer of the Pipit connector for support.",
    inputSchema: { type: "object", properties: {} },
  },
];

function toolResult(name) {
  switch (name) {
    case "pipit_about":
      return (
        "Pipit is a personal connector for Muse, created by an individual developer named Pipit.\n" +
        "It connects Muse to Pipit's own page: her notes, updates, and contact details.\n" +
        "Product page: " + PAGE_URL + "\n" +
        "Privacy policy: " + PAGE_URL + "#privacy\n" +
        "Terms of service: " + PAGE_URL + "#terms"
      );
    case "pipit_latest_note":
      return (
        "Halo, terima kasih sudah menyambungkan Pipit ke Muse kamu. " +
        "Catatan terbaru dari Pipit: konektor Pipit baru saja lahir hari ini, 22 November 2026. " +
        "Untuk sekarang Pipit bisa memperkenalkan diri, membagikan catatan ini, dan memberitahu cara menghubungi developer-nya. " +
        "Sampai jumpa di catatan berikutnya!"
      );
    case "pipit_contact":
      return (
        "Support for the Pipit connector: email " + SUPPORT_EMAIL + ".\n" +
        "Product page: " + PAGE_URL
      );
    default:
      return null;
  }
}

function jsonRpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleMcp(request) {
  if (request.method === "GET") {
    // No server-initiated SSE stream in this stateless implementation.
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST, DELETE" } });
  }
  if (request.method === "DELETE") {
    return new Response(null, { status: 204 });
  }
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let msg;
  try {
    msg = await request.json();
  } catch {
    return Response.json(jsonRpcError(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(msg)) {
    return Response.json(jsonRpcError(null, -32600, "Batched requests are not supported"), { status: 400 });
  }

  const { id, method, params } = msg ?? {};
  const isNotification = id === undefined || id === null;

  switch (method) {
    case "initialize": {
      const requested = params?.protocolVersion;
      const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested) ? requested : "2025-03-26";
      return Response.json(
        jsonRpcResult(id, {
          protocolVersion,
          capabilities: { tools: {} },
          serverInfo: { name: "pipit", title: "Pipit", version: "1.0.0" },
        }),
        { headers: { "Mcp-Session-Id": "pipit-stateless" } }
      );
    }
    case "ping":
      return Response.json(jsonRpcResult(id, {}));
    case "tools/list":
      return Response.json(jsonRpcResult(id, { tools: TOOLS }));
    case "tools/call": {
      const text = toolResult(params?.name);
      if (text === null) {
        return Response.json(
          jsonRpcResult(id, { content: [{ type: "text", text: "Unknown tool: " + String(params?.name) }], isError: true })
        );
      }
      return Response.json(jsonRpcResult(id, { content: [{ type: "text", text }] }));
    }
    default:
      if (isNotification) return new Response(null, { status: 202 });
      return Response.json(jsonRpcError(id, -32601, "Method not found: " + String(method)));
  }
}

const HOME_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pipit — MCP endpoint</title></head>
<body style="font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.55">
<h1>Pipit — MCP endpoint</h1>
<p>This is the hosted MCP endpoint for the <strong>Pipit</strong> connector for Muse.
Point an MCP client at this URL using the Streamable HTTP transport.</p>
<p>Product page, privacy policy, and terms:
<a href="${PAGE_URL}">${PAGE_URL}</a></p>
<p>Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</body></html>`;

async function handler(request) {
  const url = new URL(request.url);
  if (url.pathname === "/" || url.pathname === "") {
    if (request.method === "POST") return handleMcp(request);
    return new Response(HOME_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  if (url.pathname === "/mcp") return handleMcp(request);
  return new Response("Not Found", { status: 404 });
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  Deno.serve(handler);
}

export default { fetch: handler };

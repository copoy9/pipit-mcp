// Vercel Function entry for the Pipit MCP server.
// The implementation lives in ../main.js (shared with Deno / Render / Workers).
import app from "../main.js";

export const GET = (request) => app.fetch(request);
export const POST = (request) => app.fetch(request);
export const DELETE = (request) => app.fetch(request);

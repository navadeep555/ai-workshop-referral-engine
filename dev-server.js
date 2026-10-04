/* Local dev server: serves asset/ and runs api/index.js like Vercel does.
 * Without real Upstash credentials it starts an in-memory stand-in for Redis,
 * so the whole flow can be tested offline. Data resets when the server stops.
 *   node dev-server.js   →  http://localhost:5173
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 5173;
const ROOT = path.join(__dirname, "asset");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

// --- in-memory Redis stand-in (only the commands the API uses) ---
const kv = new Map();
const lists = new Map();
const MOCK = !(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
if (MOCK) {
  process.env.KV_REST_API_URL = `http://localhost:${PORT}/__redis`;
  process.env.KV_REST_API_TOKEN = "local";
  process.env.ADMIN_KEY = process.env.ADMIN_KEY || "local-admin";
}
function runCmd([cmd, key, ...args]) {
  switch (cmd.toUpperCase()) {
    case "GET": return kv.has(key) ? kv.get(key) : null;
    case "SET": if (args.includes("NX") && kv.has(key)) return null; kv.set(key, args[0]); return "OK";
    case "EXISTS": return kv.has(key) ? 1 : 0;
    case "DEL": return kv.delete(key) ? 1 : 0;
    case "RPUSH": { const l = lists.get(key) || []; l.push(...args); lists.set(key, l); return l.length; }
    case "LRANGE": { const l = lists.get(key) || []; const end = +args[1] === -1 ? l.length : +args[1] + 1; return l.slice(+args[0], end); }
    default: throw new Error("Unsupported command " + cmd);
  }
}

const handler = require("./asset/api/index.js");

function readBody(req) {
  return new Promise((resolve) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => resolve(b)); });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (MOCK && url.pathname === "/__redis/pipeline") {
    const cmds = JSON.parse(await readBody(req));
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(cmds.map((c) => { try { return { result: runCmd(c) }; } catch (e) { return { error: e.message }; } })));
  }

  if (url.pathname === "/api" || url.pathname === "/api/") {
    const raw = await readBody(req);
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = raw; }
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
    return handler(req, res);
  }

  const file = path.join(ROOT, path.normalize(url.pathname === "/" ? "/index.html" : url.pathname));
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}` + (MOCK ? "  (in-memory database, admin key: local-admin)" : "  (Upstash database)"));
});

/* Local dev server: serves asset/ and runs api/index.js like Vercel does.
 * Put your MongoDB connection string and admin key in .env.local (never committed):
 *   MONGODB_URI=mongodb+srv://...
 *   ADMIN_KEY=your-secret
 * Then: node dev-server.js  →  http://localhost:5173
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

// Minimal .env.local loader
const envFile = path.join(__dirname, ".env.local");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8").split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
}

const PORT = Number(process.env.PORT) || 5173;
const ROOT = path.join(__dirname, "asset");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const handler = require("./asset/api/index.js");

function readBody(req) {
  return new Promise((resolve) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => resolve(b)); });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api" || url.pathname === "/api/") {
    const raw = await readBody(req);
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = raw; }
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
    return handler(req, res);
  }

  const file = path.join(ROOT, path.normalize(url.pathname === "/" ? "/index.html" : url.pathname));
  if (!file.startsWith(ROOT) || file.startsWith(path.join(ROOT, "api")) || file.includes("node_modules")) { res.statusCode = 404; return res.end("Not found"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}` + (process.env.MONGODB_URI ? "  (MongoDB connected)" : "  (no MONGODB_URI set: registrations will show a 'database not connected' message)"));
});

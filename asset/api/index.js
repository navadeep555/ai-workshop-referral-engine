/* Vercel serverless API backed by Upstash Redis (Vercel Storage → Upstash for Redis).
 * Data layout:
 *   regs              list of registration rows (JSON)
 *   code:<CODE>       marks a referral code as taken
 *   email:<email>     → code   (one registration per email)
 *   phone:<phone>     → code   (one registration per phone)
 * Env: KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN), ADMIN_KEY.
 */
const A = require("../analytics.js");

const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...cmds) {
  const res = await fetch(`${URL_()}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!res.ok) throw new Error(`Database error (${res.status})`);
  const out = await res.json();
  return out.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}

async function allRows() {
  const [list] = await redis(["LRANGE", "regs", "0", "-1"]);
  return (list || []).map((s) => JSON.parse(s));
}

const clean = (s, max = 120) => String(s || "").trim().replace(/\s+/g, " ").slice(0, max);
const normPhone = (s) => String(s || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");

function checkKey(key) {
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) throw new Error("Wrong admin key");
}

const actions = {
  async register(d) {
    const row = {
      name: clean(d.name, 80),
      email: clean(d.email).toLowerCase(),
      phone: normPhone(d.phone),
      college: clean(d.college),
      branch: clean(d.branch, 40),
      year: clean(d.year, 40),
      source: clean(d.src, 40).toLowerCase(),
    };
    if (row.name.length < 2) throw new Error("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) throw new Error("Please enter a valid email.");
    if (!/^[6-9]\d{9}$/.test(row.phone)) throw new Error("Please enter a valid 10-digit Indian mobile number.");
    if (row.college.length < 3) throw new Error("Please enter your college.");
    if (!row.branch) throw new Error("Please select your branch.");

    const [byEmail, byPhone] = await redis(["GET", `email:${row.email}`], ["GET", `phone:${row.phone}`]);
    if (byEmail || byPhone) return { ok: true, existing: true, code: byEmail || byPhone };

    // Claim a unique referral code
    const stem = (row.name.replace(/[^a-z]/gi, "").toUpperCase() + "XXXX").slice(0, 4);
    let code = "";
    for (let i = 0; i < 20 && !code; i++) {
      const c = stem + Math.floor(100 + Math.random() * 900);
      const [ok] = await redis(["SET", `code:${c}`, "1", "NX"]);
      if (ok === "OK") code = c;
    }
    if (!code) throw new Error("Please try again.");

    // Claim email + phone atomically so double-clicks don't create duplicates
    const [e, p] = await redis(["SET", `email:${row.email}`, code, "NX"], ["SET", `phone:${row.phone}`, code, "NX"]);
    if (e !== "OK" || p !== "OK") {
      const [existing] = await redis(["GET", e !== "OK" ? `email:${row.email}` : `phone:${row.phone}`]);
      if (e === "OK") await redis(["DEL", `email:${row.email}`]);
      if (p === "OK") await redis(["DEL", `phone:${row.phone}`]);
      await redis(["DEL", `code:${code}`]);
      return { ok: true, existing: true, code: existing };
    }

    const ref = clean(d.ref, 20).toUpperCase();
    const [refExists] = ref ? await redis(["EXISTS", `code:${ref}`]) : [0];
    Object.assign(row, { ts: Date.now(), code, referredBy: refExists ? ref : "" });
    await redis(["RPUSH", "regs", JSON.stringify(row)]);
    return { ok: true, code };
  },

  async find(d) {
    let q = clean(d.q).toLowerCase();
    if (/^[\d\s+-]+$/.test(q)) q = normPhone(q);
    const [code] = await redis(["GET", q.includes("@") ? `email:${q}` : `phone:${q}`]);
    return code ? { ok: true, code } : { ok: false };
  },

  async me(d) {
    const m = A.computeMe(await allRows(), clean(d.code, 20).toUpperCase());
    return m ? { ok: true, ...m } : { ok: false };
  },

  async leaderboard() {
    return { ok: true, ...A.computeLeaderboard(await allRows()) };
  },

  async stats(d) {
    checkKey(d.key);
    return { ok: true, ...A.computeStats(await allRows()) };
  },

  async export(d) {
    checkKey(d.key);
    return { ok: true, rows: await allRows() };
  },
};

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(200).json({ ok: true, service: "referral-engine" });
  if (!URL_() || !TOKEN()) {
    return res.status(503).json({ ok: false, error: "Database not connected yet. Connect Upstash Redis in Vercel → Storage." });
  }
  let body = req.body;
  try { if (typeof body === "string") body = JSON.parse(body || "{}"); } catch { body = null; }
  const fn = body && Object.prototype.hasOwnProperty.call(actions, body.action) ? actions[body.action] : null;
  if (!fn) return res.status(400).json({ ok: false, error: "Unknown action" });
  try {
    res.status(200).json(await fn(body));
  } catch (err) {
    res.status(200).json({ ok: false, error: err.message || "Something went wrong" });
  }
};

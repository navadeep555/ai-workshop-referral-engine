/* Vercel serverless API backed by MongoDB (Atlas).
 * Collection "registrations": one document per student, with unique indexes on
 * email, phone and code so duplicates are rejected by the database itself.
 * Env: MONGODB_URI (added by the Vercel ↔ MongoDB Atlas integration), ADMIN_KEY, optional MONGODB_DB.
 */
const { MongoClient } = require("mongodb");
const A = require("../analytics.js");

let colPromise = null;
function registrations() {
  if (!colPromise) {
    colPromise = (async () => {
      const client = await new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 5 }).connect();
      const col = client.db(process.env.MONGODB_DB || "ai_workshop").collection("registrations");
      await col.createIndexes([
        { key: { email: 1 }, name: "email_unique", unique: true },
        { key: { phone: 1 }, name: "phone_unique", unique: true },
        { key: { code: 1 }, name: "code_unique", unique: true },
        { key: { referredBy: 1 }, name: "referredBy" },
      ]);
      return col;
    })().catch((err) => { colPromise = null; throw err; });
  }
  return colPromise;
}

async function allRows() {
  const col = await registrations();
  return col.find({}, { projection: { _id: 0 } }).sort({ ts: 1 }).toArray();
}

const clean = (s, max = 120) => String(s || "").trim().replace(/\s+/g, " ").slice(0, max);
const normPhone = (s) => String(s || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
const isDup = (err) => err && err.code === 11000;

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

    const col = await registrations();
    const findExisting = () => col.findOne({ $or: [{ email: row.email }, { phone: row.phone }] }, { projection: { code: 1 } });

    const existing = await findExisting();
    if (existing) return { ok: true, existing: true, code: existing.code };

    const ref = clean(d.ref, 20).toUpperCase();
    row.referredBy = ref && (await col.countDocuments({ code: ref }, { limit: 1 })) ? ref : "";

    const stem = (row.name.replace(/[^a-z]/gi, "").toUpperCase() + "XXXX").slice(0, 4);
    for (let i = 0; i < 20; i++) {
      const code = stem + Math.floor(100 + Math.random() * 900);
      try {
        await col.insertOne({ ...row, code, ts: Date.now() });
        return { ok: true, code };
      } catch (err) {
        if (!isDup(err)) throw err;
        if (err.keyPattern && err.keyPattern.code) continue; // code taken, try another
        const again = await findExisting(); // same email/phone registered at the same moment
        if (again) return { ok: true, existing: true, code: again.code };
        throw err;
      }
    }
    throw new Error("Please try again.");
  },

  async find(d) {
    let q = clean(d.q).toLowerCase();
    if (/^[\d\s+-]+$/.test(q)) q = normPhone(q);
    const col = await registrations();
    const r = await col.findOne(q.includes("@") ? { email: q } : { phone: q }, { projection: { code: 1 } });
    return r ? { ok: true, code: r.code } : { ok: false };
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
  if (!process.env.MONGODB_URI) {
    return res.status(503).json({ ok: false, error: "Database not connected yet. Add MONGODB_URI in Vercel → Settings → Environment Variables." });
  }
  let body = req.body;
  try { if (typeof body === "string") body = JSON.parse(body || "{}"); } catch { body = null; }
  const fn = body && Object.prototype.hasOwnProperty.call(actions, body.action) ? actions[body.action] : null;
  if (!fn) return res.status(400).json({ ok: false, error: "Unknown action" });
  try {
    res.status(200).json(await fn(body));
  } catch (err) {
    console.error(err);
    const msg = err && err.name && /Mongo/.test(err.name) ? "Database error. Please try again." : err.message;
    res.status(200).json({ ok: false, error: msg || "Something went wrong" });
  }
};

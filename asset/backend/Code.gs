/**
 * Google Apps Script backend for the Referral Engine.
 * Storage = a Google Sheet (free, and organisers can open it directly).
 *
 * Setup (5 minutes):
 *  1. Create a Google Sheet → Extensions → Apps Script → paste this file.
 *  2. Project Settings → Script Properties → add ADMIN_KEY = <a secret>.
 *  3. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone.
 *  4. Copy the /exec URL into config.js → API_URL.
 */

const SHEET = "Registrations";
const COLS = ["ts", "name", "email", "phone", "college", "branch", "year", "code", "referredBy", "source"];

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents || "{}"); } catch (err) { return out({ ok: false, error: "Bad JSON" }); }
  const handlers = { register, find, me, leaderboard, stats, exportRows };
  const fn = handlers[body.action === "export" ? "exportRows" : body.action];
  if (!fn) return out({ ok: false, error: "Unknown action" });
  try { return out(fn(body)); } catch (err) { return out({ ok: false, error: String(err.message || err) }); }
}

function doGet() {
  return out({ ok: true, service: "referral-engine" });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows() {
  const values = sheet().getDataRange().getValues();
  values.shift();
  return values.filter((v) => v[7]).map((v) => {
    const r = {};
    COLS.forEach((c, i) => (r[c] = c === "ts" ? new Date(v[i]).getTime() : String(v[i])));
    return r;
  });
}

function clean(s, max) { return String(s || "").trim().replace(/\s+/g, " ").slice(0, max || 120); }

function register(d) {
  const name = clean(d.name, 80);
  const email = clean(d.email, 120).toLowerCase();
  const phone = String(d.phone || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  const college = clean(d.college, 120);
  if (name.length < 2) throw new Error("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email.");
  if (!/^[6-9]\d{9}$/.test(phone)) throw new Error("Please enter a valid 10-digit Indian mobile number.");
  if (college.length < 3) throw new Error("Please enter your college.");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const all = rows();
    const existing = all.find((r) => r.email === email || r.phone === phone);
    if (existing) return { ok: true, existing: true, code: existing.code };
    const taken = new Set(all.map((r) => r.code));
    const stem = (name.replace(/[^a-z]/gi, "").toUpperCase() + "XXXX").slice(0, 4);
    let code;
    do code = stem + Math.floor(100 + Math.random() * 900); while (taken.has(code));
    const ref = String(d.ref || "").toUpperCase();
    const referredBy = taken.has(ref) ? ref : "";
    // Prefix with ' so Sheets keeps phone numbers as text
    sheet().appendRow([new Date(), name, email, "'" + phone, college, clean(d.branch, 40), clean(d.year, 40), code, referredBy, clean(d.src, 40).toLowerCase()]);
    return { ok: true, code: code };
  } finally {
    lock.releaseLock();
  }
}

function find(d) {
  const q = String(d.q || "").trim().toLowerCase();
  const r = rows().find((x) => x.email === q || x.phone === q);
  return r ? { ok: true, code: r.code } : { ok: false };
}

// ---- analytics (mirrors app.js) ----
function firstName(n) { return String(n || "").trim().split(/\s+/)[0] || "Friend"; }
function shortName(n) { const p = String(n || "").trim().split(/\s+/); return p.length > 1 ? p[0] + " " + p[p.length - 1][0] + "." : p[0]; }
function countBy(list, fn) { return list.reduce((m, r) => { const k = fn(r); m[k] = (m[k] || 0) + 1; return m; }, {}); }
function dayKey(ts) { return Utilities.formatDate(new Date(ts), "Asia/Kolkata", "yyyy-MM-dd"); }

function sourceOf(r) {
  if (r.referredBy) return "referral";
  const s = (r.source || "").toLowerCase();
  if (s.indexOf("amb") === 0) return "ambassador";
  if (s === "wa" || s === "whatsapp") return "whatsapp";
  if (s === "li" || s === "linkedin") return "linkedin";
  if (s === "ig" || s === "instagram") return "instagram";
  if (s.indexOf("club") === 0) return "club";
  return s || "direct";
}

function buildLeaderboard(all) {
  const colleges = countBy(all, (r) => r.college);
  const refs = countBy(all.filter((r) => r.referredBy), (r) => r.referredBy);
  const byCode = {};
  all.forEach((r) => (byCode[r.code] = r));
  return {
    total: all.length,
    colleges: Object.keys(colleges).map((c) => ({ college: c, count: colleges[c] })).sort((a, b) => b.count - a.count).slice(0, 15),
    referrers: Object.keys(refs).filter((c) => byCode[c])
      .map((c) => ({ name: shortName(byCode[c].name), college: byCode[c].college, count: refs[c] }))
      .sort((a, b) => b.count - a.count).slice(0, 10),
  };
}

function leaderboard() {
  return Object.assign({ ok: true }, buildLeaderboard(rows()));
}

function me(d) {
  const all = rows();
  const code = String(d.code || "").toUpperCase();
  const m = all.find((r) => r.code === code);
  if (!m) return { ok: false };
  const colleges = countBy(all, (r) => r.college);
  const ranked = Object.keys(colleges).sort((a, b) => colleges[b] - colleges[a]);
  return {
    ok: true, name: firstName(m.name), code: m.code, college: m.college,
    referrals: all.filter((r) => r.referredBy === code).length,
    collegeCount: colleges[m.college] || 0,
    collegeRank: ranked.indexOf(m.college) + 1,
    total: all.length,
  };
}

function checkKey(d) {
  const key = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!key || d.key !== key) throw new Error("Wrong admin key");
}

function stats(d) {
  checkKey(d);
  const all = rows();
  const referred = all.filter((r) => r.referredBy);
  return {
    ok: true,
    total: all.length,
    referred: referred.length,
    viral: all.length ? referred.length / Math.max(1, all.length - referred.length) : 0,
    activeReferrers: Object.keys(countBy(referred, (r) => r.referredBy)).length,
    byDay: countBy(all, (r) => dayKey(r.ts)),
    bySource: countBy(all, sourceOf),
    byBranch: countBy(all, (r) => r.branch),
    byCollege: countBy(all, (r) => r.college),
    top: buildLeaderboard(all).referrers,
    firstTs: all.length ? Math.min.apply(null, all.map((r) => r.ts)) : Date.now(),
  };
}

function exportRows(d) {
  checkKey(d);
  return { ok: true, rows: rows() };
}

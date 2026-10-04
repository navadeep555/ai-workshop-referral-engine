/* Shared analytics: used by the browser (window.Analytics) and the API (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Analytics = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "Friend";
  const shortName = (n) => {
    const p = String(n || "").trim().split(/\s+/);
    return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
  };
  const dayKey = (ts) => new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  function sourceOf(r) {
    if (r.referredBy) return "referral";
    const s = (r.source || "").toLowerCase();
    if (s.startsWith("amb")) return "ambassador";
    if (["wa", "whatsapp"].includes(s)) return "whatsapp";
    if (["li", "linkedin"].includes(s)) return "linkedin";
    if (["ig", "instagram"].includes(s)) return "instagram";
    if (s.startsWith("club")) return "club";
    return s || "direct";
  }

  function computeLeaderboard(rows) {
    const colleges = {}, refs = {};
    rows.forEach((r) => {
      colleges[r.college] = (colleges[r.college] || 0) + 1;
      if (r.referredBy) refs[r.referredBy] = (refs[r.referredBy] || 0) + 1;
    });
    const byCode = Object.fromEntries(rows.map((r) => [r.code, r]));
    return {
      total: rows.length,
      colleges: Object.entries(colleges).map(([college, count]) => ({ college, count })).sort((a, b) => b.count - a.count).slice(0, 15),
      referrers: Object.entries(refs)
        .filter(([code]) => byCode[code])
        .map(([code, count]) => ({ name: shortName(byCode[code].name), college: byCode[code].college, count }))
        .sort((a, b) => b.count - a.count).slice(0, 10),
    };
  }

  function computeMe(rows, code) {
    const me = rows.find((r) => r.code === code);
    if (!me) return null;
    const colleges = {};
    rows.forEach((r) => (colleges[r.college] = (colleges[r.college] || 0) + 1));
    const ranked = Object.entries(colleges).sort((a, b) => b[1] - a[1]);
    return {
      name: firstName(me.name), code: me.code, college: me.college,
      referrals: rows.filter((r) => r.referredBy === code).length,
      collegeCount: colleges[me.college] || 0,
      collegeRank: ranked.findIndex(([c]) => c === me.college) + 1,
      total: rows.length,
    };
  }

  function computeStats(rows) {
    const by = (fn) => rows.reduce((m, r) => ((m[fn(r)] = (m[fn(r)] || 0) + 1), m), {});
    const referred = rows.filter((r) => r.referredBy);
    return {
      total: rows.length,
      referred: referred.length,
      viral: rows.length ? referred.length / Math.max(1, rows.length - referred.length) : 0,
      activeReferrers: new Set(referred.map((r) => r.referredBy)).size,
      byDay: by((r) => dayKey(r.ts)),
      bySource: by(sourceOf),
      byBranch: by((r) => r.branch),
      byCollege: by((r) => r.college),
      top: computeLeaderboard(rows).referrers,
      firstTs: rows.length ? Math.min(...rows.map((r) => r.ts)) : Date.now(),
    };
  }

  return { firstName, shortName, dayKey, sourceOf, computeLeaderboard, computeMe, computeStats };
});

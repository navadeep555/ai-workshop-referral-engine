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
    if (["dc", "discord"].includes(s)) return "discord";
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
    const friends = rows.filter((r) => r.referredBy === code);
    return {
      name: firstName(me.name), code: me.code, college: me.college,
      referrals: friends.length,
      friends: friends.slice(0, 5).map((r) => firstName(r.name)),
      squad: (me.exp && me.exp.squad) || "A",
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

  // ---------- experiments ----------
  // Same college → same variant (cluster split), so classmates never see different pages.
  function hashVariant(str) {
    let h = 0;
    for (const ch of String(str).toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return Math.abs(h) % 2 ? "B" : "A";
  }

  function normCdf(x) {
    // Abramowitz–Stegun approximation of the standard normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }

  // Two-proportion z-test: is B's rate different from A's?
  const MIN_PER_GROUP = 100;
  function compare(c1, n1, c2, n2) {
    const r1 = n1 ? c1 / n1 : 0, r2 = n2 ? c2 / n2 : 0;
    const lift = r1 ? (r2 - r1) / r1 : null;
    if (n1 < MIN_PER_GROUP || n2 < MIN_PER_GROUP) return { lift, enough: false, confidence: null };
    const p = (c1 + c2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
    if (!se) return { lift, enough: true, confidence: 0 };
    const z = (r2 - r1) / se;
    return { lift, enough: true, confidence: 1 - 2 * (1 - normCdf(Math.abs(z))) };
  }

  function computeExperiments(rows, counters) {
    const get = (k, f) => (counters[k] && counters[k][f]) || 0;
    const campus = ["A", "B"].map((v) => {
      const views = get(`campus:${v}`, "view");
      const regs = rows.filter((r) => r.exp && r.exp.campus === v).length;
      return { variant: v, views, regs, rate: views ? regs / views : 0 };
    });
    const ownerVariant = {};
    rows.forEach((r) => { if (r.exp && r.exp.squad) ownerVariant[r.code] = r.exp.squad; });
    const squad = ["A", "B"].map((v) => {
      const members = rows.filter((r) => r.exp && r.exp.squad === v);
      const sharers = members.filter((r) => r.shared).length;
      const referrals = rows.filter((r) => r.referredBy && ownerVariant[r.referredBy] === v).length;
      const n = members.length;
      return {
        variant: v, registrants: n, sharers, shares: get(`squad:${v}`, "share"), referrals,
        shareRate: n ? sharers / n : 0, refsPerRegistrant: n ? referrals / n : 0,
      };
    });
    return {
      minPerGroup: MIN_PER_GROUP,
      campus: { arms: campus, result: compare(campus[0].regs, campus[0].views, campus[1].regs, campus[1].views) },
      squad: { arms: squad, result: compare(squad[0].sharers, squad[0].registrants, squad[1].sharers, squad[1].registrants) },
    };
  }

  function collegeStanding(rows, college) {
    const counts = {};
    rows.forEach((r) => (counts[r.college] = (counts[r.college] || 0) + 1));
    const key = Object.keys(counts).find((c) => c.toLowerCase() === String(college).toLowerCase()) || college;
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const idx = ranked.findIndex(([c]) => c === key);
    return { college: key, count: counts[key] || 0, rank: idx >= 0 ? idx + 1 : ranked.length + 1, colleges: ranked.length };
  }

  return { firstName, shortName, dayKey, sourceOf, computeLeaderboard, computeMe, computeStats, hashVariant, computeExperiments, collegeStanding };
});

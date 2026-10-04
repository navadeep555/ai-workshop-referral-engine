/* Shared analytics: used by the browser (window.Analytics) and the API (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Analytics = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Project Curiosity: the projects students can pick (labels live in app.js)
  const PROJECTS = ["resume", "study", "chatbot", "stocks"];

  const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
  const firstName = (n) => cap(String(n || "").trim().split(/\s+/)[0]) || "Friend";
  const shortName = (n) => {
    const p = String(n || "").trim().split(/\s+/).map(cap);
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

  // Squads of up to 3: a student who registers through a squad member's link joins that squad
  // if it has space; otherwise they start their own squad as captain. Replayed in sign-up order.
  const SQUAD_SIZE = 3;
  function computeSquads(rows) {
    const squadOf = {}, members = {};
    [...rows].sort((a, b) => a.ts - b.ts).forEach((r) => {
      const host = r.referredBy && squadOf[r.referredBy];
      if (host && members[host].length < SQUAD_SIZE) { squadOf[r.code] = host; members[host].push(r.code); }
      else { squadOf[r.code] = r.code; members[r.code] = [r.code]; }
    });
    return { squadOf, members };
  }

  function computeMe(rows, code) {
    const me = rows.find((r) => r.code === code);
    if (!me) return null;
    const byCode = Object.fromEntries(rows.map((r) => [r.code, r]));
    const { squadOf, members } = computeSquads(rows);
    const captainCode = squadOf[code] || code;
    const captain = byCode[captainCode] || me;
    const squadMembers = (members[captainCode] || [code]).map((c) => ({
      name: firstName(byCode[c].name), you: c === code, captain: c === captainCode,
    }));
    const colleges = {};
    rows.forEach((r) => (colleges[r.college] = (colleges[r.college] || 0) + 1));
    const ranked = Object.entries(colleges).sort((a, b) => b[1] - a[1]);
    const friends = rows.filter((r) => r.referredBy === code);
    return {
      name: firstName(me.name), code: me.code, college: me.college,
      referrals: friends.length,
      friends: friends.slice(0, 5).map((r) => firstName(r.name)),
      squadMembers,
      squadCaptain: firstName(captain.name),
      isCaptain: captainCode === code,
      invitedBy: me.referredBy && byCode[me.referredBy] ? firstName(byCode[me.referredBy].name) : "",
      passport: (me.exp && me.exp.passport) || "",
      interest: me.interest || "",
      branch: me.branch || "",
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
    // Squad Challenge is live for everyone: report how well it spreads
    const { members } = computeSquads(rows);
    const squads = Object.values(members);
    const n = rows.length, sharers = rows.filter((r) => r.shared).length;
    const referrals = rows.filter((r) => r.referredBy).length;
    const squad = {
      students: n, sharers, shareRate: n ? sharers / n : 0, shareClicks: get("squad:B", "share"),
      referrals, refsPerStudent: n ? referrals / n : 0,
      squads: squads.length, complete: squads.filter((m) => m.length >= SQUAD_SIZE).length,
    };
    // Project Curiosity: card clicks vs home-page visitors, and registrations per picked project
    const projectViews = get("projects:all", "view");
    const projects = {
      views: projectViews,
      items: PROJECTS.map((id) => {
        const clicks = get(`projects:${id}`, "click");
        const regs = rows.filter((r) => r.interest === id).length;
        return { id, clicks, votes: get(`projects:${id}`, "vote"), ctr: projectViews ? clicks / projectViews : 0, regs, clickToReg: clicks ? regs / clicks : 0 };
      }),
      picked: rows.filter((r) => r.interest).length,
    };

    // Instant Reward: does the AI Project Passport bring students back? (A = basic confirmation)
    const passportArms = ["A", "B"].map((v) => {
      const group = rows.filter((r) => r.exp && r.exp.passport === v);
      const n = group.length, returned = group.filter((r) => r.returned).length;
      return { variant: v, students: n, returned, returnRate: n ? returned / n : 0,
        used: group.filter((r) => r.passportUsed).length, useRate: n ? group.filter((r) => r.passportUsed).length / n : 0 };
    });
    const passport = { arms: passportArms, result: compare(passportArms[0].returned, passportArms[0].students, passportArms[1].returned, passportArms[1].students) };

    return {
      minPerGroup: MIN_PER_GROUP,
      projects,
      passport,
      campus: { arms: campus, result: compare(campus[0].regs, campus[0].views, campus[1].regs, campus[1].views) },
      squad,
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

  return { PROJECTS, firstName, shortName, dayKey, sourceOf, computeLeaderboard, computeMe, computeStats, hashVariant, computeExperiments, collegeStanding };
});

/* Referral Engine for "Build Your First AI Project in 60 Minutes"
 * Every registrant gets a personal invite link. Registrations are attributed to
 * a source (ambassador / whatsapp / linkedin / referral / direct) so the
 * organiser dashboard shows which channel is actually filling the 500 seats.
 */
(function () {
  "use strict";

  const C = window.CONFIG;
  const DEMO = !C.API_URL;
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app");

  // Daily targets from the growth plan (sum = 500). Admin chart compares against these.
  const DAILY_TARGET = [40, 60, 70, 80, 90, 90, 70];

  const BRANCHES = ["CSE", "CSE (AI/ML)", "CSE (Data Science)", "IT", "ECE", "EEE", "Mechanical", "Civil", "Other"];
  // Telangana, Andhra Pradesh and Tamil Nadu (interleaved so demo data spreads across states)
  const COLLEGES = [
    "Amrita Vishwa Vidyapeetham, Coimbatore", "JNTU Hyderabad", "PSG College of Technology", "CBIT Hyderabad",
    "SSN College of Engineering", "VNR VJIET", "Kumaraguru College of Technology", "KL University",
    "Anna University (CEG)", "GRIET", "Coimbatore Institute of Technology", "VIT-AP",
    "SRM Institute of Science and Technology", "Vasavi College of Engineering", "Amrita Vishwa Vidyapeetham, Chennai",
    "GITAM Visakhapatnam", "Sri Krishna College of Engineering and Technology", "SRM University AP",
    "VIT Vellore", "MVSR Engineering College", "Thiagarajar College of Engineering", "Andhra University College of Engineering",
    "Rajalakshmi Engineering College", "MVGR College of Engineering", "Kongu Engineering College", "JNTU Kakinada",
    "Bannari Amman Institute of Technology", "Aditya Engineering College", "Sathyabama Institute of Science and Technology",
    "SVEC Tirupati", "Saveetha Engineering College", "CVR College of Engineering", "Karpagam College of Engineering",
    "Sreenidhi Institute (SNIST)", "Sri Ramakrishna Engineering College", "Malla Reddy Engineering College",
    "Anurag University",
  ];

  // ---------- utils ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "Friend";
  const shortName = (n) => {
    const p = String(n || "").trim().split(/\s+/);
    return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
  };
  const normCollege = (s) => String(s || "").trim().replace(/\s+/g, " ");
  const dayKey = (ts) => new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const baseUrl = () => location.href.split(/[?#]/)[0];
  const inviteLink = (code) => `${baseUrl()}?ref=${encodeURIComponent(code)}`;

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function safeGet(store, k) { try { return store.getItem(k); } catch { return null; } }
  function safeSet(store, k, v) { try { store.setItem(k, v); } catch { /* storage blocked */ } }

  // Capture attribution from the URL once, keep it for the session.
  (function captureAttribution() {
    const q = new URLSearchParams(location.search);
    if (q.get("ref")) safeSet(sessionStorage, "ref", q.get("ref").toUpperCase());
    if (q.get("src")) safeSet(sessionStorage, "src", q.get("src").toLowerCase());
  })();
  const attribution = () => ({
    ref: safeGet(sessionStorage, "ref") || "",
    src: safeGet(sessionStorage, "src") || "",
  });

  // ---------- shared analytics (mirrored in backend/Code.gs) ----------
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
    const lb = computeLeaderboard(rows);
    const allColleges = {};
    rows.forEach((r) => (allColleges[r.college] = (allColleges[r.college] || 0) + 1));
    const ranked = Object.entries(allColleges).sort((a, b) => b[1] - a[1]);
    return {
      name: firstName(me.name), code: me.code, college: me.college,
      referrals: rows.filter((r) => r.referredBy === code).length,
      collegeCount: allColleges[me.college] || 0,
      collegeRank: ranked.findIndex(([c]) => c === me.college) + 1,
      total: lb.total,
    };
  }

  function computeStats(rows) {
    const by = (fn) => rows.reduce((m, r) => ((m[fn(r)] = (m[fn(r)] || 0) + 1), m), {});
    const referred = rows.filter((r) => r.referredBy).length;
    const referrerCount = new Set(rows.filter((r) => r.referredBy).map((r) => r.referredBy)).size;
    return {
      total: rows.length,
      referred,
      viral: rows.length ? referred / Math.max(1, rows.length - referred) : 0,
      activeReferrers: referrerCount,
      byDay: by((r) => dayKey(r.ts)),
      bySource: by(sourceOf),
      byBranch: by((r) => r.branch),
      byCollege: by((r) => r.college),
      top: computeLeaderboard(rows).referrers,
      firstTs: rows.length ? Math.min(...rows.map((r) => r.ts)) : Date.now(),
    };
  }

  // ---------- API: demo (localStorage) or Google Apps Script ----------
  const KEY = "nxt_regs_v1";
  const local = {
    rows() {
      try { return JSON.parse(safeGet(localStorage, KEY) || "null") || seed(); } catch { return seed(); }
    },
    save(rows) { safeSet(localStorage, KEY, JSON.stringify(rows)); },
    async register(d) {
      const rows = this.rows();
      const existing = rows.find((r) => r.email === d.email || r.phone === d.phone);
      if (existing) return { ok: true, existing: true, code: existing.code };
      const code = makeCode(d.name, new Set(rows.map((r) => r.code)));
      const ref = rows.some((r) => r.code === d.ref) ? d.ref : "";
      rows.push({ ts: Date.now(), name: d.name, email: d.email, phone: d.phone, college: d.college, branch: d.branch, year: d.year, code, referredBy: ref, source: d.src });
      this.save(rows);
      return { ok: true, code };
    },
    async find(q) {
      const r = this.rows().find((x) => x.email === q || x.phone === q);
      return r ? { ok: true, code: r.code } : { ok: false };
    },
    async me(code) { const m = computeMe(this.rows(), code); return m ? { ok: true, ...m } : { ok: false }; },
    async leaderboard() { return { ok: true, ...computeLeaderboard(this.rows()) }; },
    async stats(key) { return key === C.ADMIN_KEY ? { ok: true, ...computeStats(this.rows()) } : { ok: false, error: "Wrong admin key" }; },
    async export(key) { return key === C.ADMIN_KEY ? { ok: true, rows: this.rows() } : { ok: false, error: "Wrong admin key" }; },
  };

  async function call(action, payload = {}) {
    const res = await fetch(C.API_URL, {
      method: "POST",
      // text/plain keeps this a "simple" request so Apps Script needs no CORS preflight
      body: JSON.stringify({ action, ...payload }),
    });
    return res.json();
  }
  const remote = {
    register: (d) => call("register", d),
    find: (q) => call("find", { q }),
    me: (code) => call("me", { code }),
    leaderboard: () => call("leaderboard"),
    stats: (key) => call("stats", { key }),
    export: (key) => call("export", { key }),
  };
  const api = DEMO ? local : remote;

  function makeCode(name, taken) {
    const stem = (String(name).replace(/[^a-z]/gi, "").toUpperCase() + "XXXX").slice(0, 4);
    let code;
    do code = stem + Math.floor(100 + Math.random() * 900); while (taken.has(code));
    return code;
  }

  // Sample data so the demo dashboards aren't empty. Clearly labelled via the banner.
  function seed() {
    const first = ["Aarav", "Sai", "Harsha", "Priya", "Sneha", "Rahul", "Karthik", "Divya", "Teja", "Lakshmi", "Vamsi", "Anusha", "Rohit", "Keerthi", "Manoj", "Pavani", "Nikhil", "Swathi", "Charan", "Meghana", "Abhinav", "Bhavya", "Ganesh", "Harika", "Yash", "Arun", "Kavya", "Surya", "Divya", "Vignesh", "Janani", "Pranav", "Nandhini", "Hari", "Aishwarya"];
    const last = ["Reddy", "Kumar", "Rao", "Sharma", "Naidu", "Varma", "Chowdary", "Goud", "Patel", "Iyer", "Krishnan", "Subramanian", "Murugan", "Rajan", "Natarajan", "Pillai"];
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const rows = [], taken = new Set();
    const now = Date.now(), day = 864e5;
    const todayStart = new Date(dayKey(now) + "T00:00:00+05:30").getTime();
    const start = todayStart - 3 * day; // pretend today is day 4 of the campaign
    const perDay = [38, 57, 74, 31]; // today is partial
    const srcMix = ["amb", "amb", "amb", "wa", "wa", "club", "li", "ig", ""];
    perDay.forEach((n, d) => {
      for (let i = 0; i < n; i++) {
        const name = `${pick(first)} ${pick(last)}`;
        const code = makeCode(name, taken); taken.add(code);
        const referrable = rows.filter((r) => r.ts < start + d * day + day);
        const isRef = rows.length > 10 && Math.random() < 0.34;
        const parent = isRef ? referrable[Math.floor(Math.pow(Math.random(), 2.2) * referrable.length)] : null;
        rows.push({
          ts: Math.min(now - 60e3, start + d * day + Math.random() * (d === 3 ? (now - todayStart) : day)),
          name, email: `${code.toLowerCase()}@example.com`, phone: "9" + String(Math.floor(1e8 + Math.random() * 9e8)),
          college: parent && Math.random() < 0.7 ? parent.college : COLLEGES[Math.floor(Math.pow(Math.random(), 1.6) * COLLEGES.length)],
          branch: pick(BRANCHES.slice(0, 6)), year: "Final year", code,
          referredBy: parent ? parent.code : "", source: parent ? "" : pick(srcMix),
        });
      }
    });
    local.save(rows);
    return rows;
  }

  // ---------- views ----------
  const fmtDate = new Date(C.WORKSHOP_DATE).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

  async function viewHome() {
    const { ref } = attribution();
    let refName = "";
    if (ref) { const m = await api.me(ref).catch(() => null); if (m && m.ok) refName = m.name; }

    app.innerHTML = `
      <section class="hero">
        <div>
          <span class="eyebrow">Free · Live · For final-year engineering students</span>
          <h1>Build your first <em>AI project</em> in 60 minutes.</h1>
          <p class="lede">Placement interviews now ask, “Have you built anything with AI?” In one live hour you'll build and deploy an
            <b>AI Resume Reviewer</b> and leave with a public link and a GitHub repo for your resume tonight.</p>
          <div class="meta">
            <span>📅 ${esc(fmtDate)} IST</span><span>⏱ 60 minutes</span><span>💻 Laptop + browser only</span><span>₹0</span>
          </div>
          <div class="counter" id="counter">
            <div><strong id="count">…</strong> <span class="note">students registered</span></div>
            <div class="bar"><i id="countbar" style="width:0"></i></div>
          </div>
          <p class="note" style="margin-top:12px">📈 Organisers: <a href="#/simulator">see how the 7-day plan reaches 500 in the Campaign Simulator →</a></p>
        </div>
        <div class="card form-card" id="register">
          <h2>Reserve your seat</h2>
          ${refName ? `<div class="ref-note">🎉 <b>${esc(refName)}</b> invited you. Sign up and you'll both move up the leaderboard.</div>` : ""}
          <form id="regform" novalidate>
            <label for="f-name">Full name</label>
            <input id="f-name" name="name" autocomplete="name" required />
            <label for="f-email">College or personal email</label>
            <input id="f-email" name="email" type="email" autocomplete="email" required />
            <label for="f-phone">WhatsApp number</label>
            <input id="f-phone" name="phone" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile" required />
            <label for="f-college">College</label>
            <input id="f-college" name="college" list="colleges" required />
            <datalist id="colleges">${COLLEGES.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>
            <div class="row2">
              <div><label for="f-branch">Branch</label>
                <select id="f-branch" name="branch" required><option value="">Select</option>${BRANCHES.map((b) => `<option>${b}</option>`).join("")}</select></div>
              <div><label for="f-year">Year</label>
                <select id="f-year" name="year" required><option>Final year</option><option>Pre-final year</option><option>Graduated (2025/26)</option><option>Other</option></select></div>
            </div>
            <div class="err" id="f-err"></div>
            <button class="btn btn-block" style="margin-top:16px" id="f-submit">Register free →</button>
            <p class="fine">We'll send the joining link and reminders on WhatsApp and email. No spam.</p>
          </form>
        </div>
      </section>

      <section class="block">
        <h2>What you walk away with</h2>
        <div class="grid3">
          <div class="card feature"><div class="num">1</div><h3>A deployed AI app</h3><p>A working AI Resume Reviewer with a public URL you can show a recruiter.</p></div>
          <div class="card feature"><div class="num">2</div><h3>A resume line that holds up</h3><p>A GitHub repo plus a ready-made project description you can explain in an interview.</p></div>
          <div class="card feature"><div class="num">3</div><h3>Skills that carry over</h3><p>Prompting, calling an LLM API, and shipping. You'll reuse these in every AI project after this one.</p></div>
        </div>
      </section>

      <section class="block grid2">
        <div class="card">
          <h2 style="font-size:22px">The 60 minutes</h2>
          <ul class="agenda">
            <li><b>0–10</b><span>How LLM apps work, with no maths and no jargon</span></li>
            <li><b>10–35</b><span>Build: prompt → API → resume feedback</span></li>
            <li><b>35–50</b><span>Deploy it live and push it to GitHub</span></li>
            <li><b>50–60</b><span>Make it yours, then live Q&amp;A</span></li>
          </ul>
        </div>
        <div class="card">
          <h2 style="font-size:22px">FAQ</h2>
          <details><summary>I've never done AI or ML. Can I still join?</summary><p>Yes. If you can use a browser, you can follow along. Every step is shown live.</p></details>
          <details><summary>Is it really free?</summary><p>Yes, completely. You don't need a card or any paid tools.</p></details>
          <details><summary>Non-CSE branch?</summary><p>You're welcome. ECE, EEE and Mechanical students build the same project.</p></details>
          <details><summary>Will there be a recording?</summary><p>The session is built to be done live, but registered students get the recording and the code afterwards.</p></details>
        </div>
      </section>`;

    api.leaderboard().then((lb) => {
      if (!lb.ok) return;
      $("#count").textContent = lb.total;
      $("#countbar").style.width = Math.min(100, (lb.total / C.GOAL) * 100) + "%";
    }).catch(() => { $("#counter").hidden = true; });

    $("#regform").addEventListener("submit", onRegister);
  }

  async function onRegister(e) {
    e.preventDefault();
    const f = e.target, err = $("#f-err"), btn = $("#f-submit");
    const d = Object.fromEntries(new FormData(f));
    d.name = d.name.trim(); d.email = d.email.trim().toLowerCase();
    d.phone = d.phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    d.college = normCollege(d.college);
    const problem =
      d.name.length < 2 ? "Please enter your name." :
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) ? "Please enter a valid email." :
      !/^[6-9]\d{9}$/.test(d.phone) ? "Please enter a valid 10-digit Indian mobile number." :
      d.college.length < 3 ? "Please enter your college." :
      !d.branch ? "Please select your branch." : "";
    if (problem) { err.textContent = problem; return; }
    err.textContent = "";
    btn.disabled = true; btn.textContent = "Reserving…";
    try {
      const res = await api.register({ ...d, ...attribution() });
      if (!res.ok) throw new Error(res.error || "Registration failed");
      safeSet(localStorage, "my_code", res.code);
      if (res.existing) toast("You're already registered. Here's your invite link.");
      location.hash = `#/me/${res.code}`;
    } catch (ex) {
      err.textContent = ex.message || "Something went wrong. Please try again.";
      btn.disabled = false; btn.textContent = "Register free →";
    }
  }

  async function viewMe(code) {
    app.innerHTML = `<div class="center"><p class="note">Loading…</p></div>`;
    const m = await api.me(code);
    if (!m.ok) { app.innerHTML = `<div class="center card"><h2>Link not found</h2><p>Check the code or <a href="#/find">find your link</a>.</p></div>`; return; }
    const link = inviteLink(m.code);
    const msg =
      `Hey! I just signed up for a FREE live workshop: "${C.WORKSHOP_TITLE}" 🚀\n\n` +
      `In 60 minutes we build and deploy an AI Resume Reviewer. It's a real project for our resumes before placements.\n` +
      `📅 ${fmtDate} IST\n\nRegister with my link (it's free): ${link}`;
    const next = C.REWARDS.find((t) => m.referrals < t.at);
    app.innerHTML = `
      <div class="center">
        <div class="card">
          <div class="big-check">✅</div>
          <h1 style="font-size:30px">You're in, ${esc(m.name)}!</h1>
          <p class="note">You'll get the joining link and reminders on WhatsApp and email before ${esc(fmtDate)}.</p>

          <div class="stat-pills">
            <div class="pill">Friends joined via you: <b>${m.referrals}</b></div>
            <div class="pill">${esc(m.college)}: <b>#${m.collegeRank}</b> · ${m.collegeCount} registered</div>
          </div>

          <h3>Bring your friends</h3>
          <p class="note">${next ? `Invite <b>${next.at - m.referrals}</b> more to unlock <b>${esc(next.title)}</b>.` : "You've unlocked every reward. 🔥"} Classmates who join also push your college up the leaderboard.</p>
          <div class="linkbox"><input id="mylink" readonly value="${esc(link)}" aria-label="Your invite link" /><button class="btn btn-ghost" id="copy">Copy</button></div>
          <div class="share-row">
            <a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">Share on WhatsApp</a>
            <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}">Share on LinkedIn</a>
          </div>

          <div class="tiers">
            ${C.REWARDS.map((t) => `
              <div class="tier ${m.referrals >= t.at ? "done" : ""}">
                <div class="badge">${m.referrals >= t.at ? "✓" : t.at}</div>
                <div><b>${esc(t.title)}</b><small>${esc(t.desc)} · ${t.at} friend${t.at > 1 ? "s" : ""}</small></div>
              </div>`).join("")}
          </div>
          <p class="note" style="margin-top:16px">Your code is <b>${esc(m.code)}</b>. Bookmark this page to track your invites. <a href="#/leaderboard">See the leaderboard →</a></p>
        </div>
      </div>`;
    $("#copy").onclick = async () => {
      try { await navigator.clipboard.writeText(link); } catch { $("#mylink").select(); document.execCommand("copy"); }
      toast("Invite link copied");
    };
  }

  async function viewLeaderboard() {
    app.innerHTML = `<div class="center"><p class="note">Loading…</p></div>`;
    const lb = await api.leaderboard();
    const max = Math.max(1, ...lb.colleges.map((c) => c.count));
    app.innerHTML = `
      <section class="block">
        <h1>College Challenge</h1>
        <p class="lede">Which campus brings the most students? <b>${lb.total}</b> of ${C.GOAL} seats are filled so far.</p>
        <div class="grid2">
          <div class="card">
            <h3>Top colleges</h3>
            ${lb.colleges.map((c, i) => `
              <div class="hbar"><span title="${esc(c.college)}">${i + 1}. ${esc(c.college)}</span>
                <div class="bar"><i style="width:${(c.count / max) * 100}%"></i></div><span>${c.count}</span></div>`).join("") || `<p class="note">No registrations yet. Yours could be first.</p>`}
          </div>
          <div class="card">
            <h3>Top inviters</h3>
            <table class="lb"><thead><tr><th></th><th>Student</th><th>College</th><th style="text-align:right">Invites</th></tr></thead><tbody>
              ${lb.referrers.map((r, i) => `<tr><td class="rank">${["🥇", "🥈", "🥉"][i] || i + 1}</td><td>${esc(r.name)}</td><td class="note">${esc(r.college)}</td><td class="r">${r.count}</td></tr>`).join("") || `<tr><td colspan="4" class="note">No invites yet.</td></tr>`}
            </tbody></table>
          </div>
        </div>
        <p style="margin-top:20px"><a class="btn" href="#/" data-scroll="register">Register & get your invite link</a></p>
      </section>`;
  }

  function viewFind() {
    app.innerHTML = `
      <div class="center card">
        <h2>Find your invite link</h2>
        <p class="note">Enter the email or WhatsApp number you registered with.</p>
        <form id="findform"><input name="q" required placeholder="you@college.edu or 9876543210" />
          <div class="err" id="find-err"></div>
          <button class="btn" style="margin-top:12px">Find my link</button></form>
      </div>`;
    $("#findform").onsubmit = async (e) => {
      e.preventDefault();
      let q = e.target.q.value.trim().toLowerCase();
      if (/^[\d\s+-]+$/.test(q)) q = q.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
      const r = await api.find(q);
      if (r.ok) location.hash = `#/me/${r.code}`;
      else $("#find-err").textContent = "We couldn't find a registration for that email or number.";
    };
  }

  async function viewAdmin() {
    const key = safeGet(sessionStorage, "admin_key");
    if (!key) {
      app.innerHTML = `
        <div class="center card">
          <h2>Organiser dashboard</h2>
          <form id="keyform"><label for="k">Admin key</label><input id="k" type="password" required />
          ${DEMO ? `<p class="note">Demo key: <code>${esc(C.ADMIN_KEY)}</code></p>` : ""}
          <button class="btn" style="margin-top:12px">Open</button></form>
        </div>`;
      $("#keyform").onsubmit = (e) => { e.preventDefault(); safeSet(sessionStorage, "admin_key", $("#k").value); viewAdmin(); };
      return;
    }
    app.innerHTML = `<div class="center"><p class="note">Loading…</p></div>`;
    const s = await api.stats(key);
    if (!s.ok) { sessionStorage.removeItem("admin_key"); toast(s.error || "Access denied"); return viewAdmin(); }

    // Day-by-day vs plan, starting from the first registration's date
    const startDay = new Date(dayKey(s.firstTs) + "T00:00:00+05:30").getTime();
    const days = DAILY_TARGET.map((t, i) => {
      const k = dayKey(startDay + i * 864e5 + 3600e3);
      return { label: `Day ${i + 1}`, k, actual: s.byDay[k] || 0, target: t };
    });
    const todayIdx = Math.max(0, days.findIndex((d) => d.k === dayKey(Date.now())));
    const planToDate = DAILY_TARGET.slice(0, todayIdx + 1).reduce((a, b) => a + b, 0);
    const maxDay = Math.max(...days.map((d) => Math.max(d.actual, d.target)), 1);
    const hb = (obj, color) => {
      const arr = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const m = Math.max(1, ...arr.map((x) => x[1]));
      return arr.map(([k, v]) => `<div class="hbar"><span title="${esc(k)}">${esc(k)}</span><div class="bar"><i style="width:${(v / m) * 100}%;${color ? `background:${color}` : ""}"></i></div><span>${v}</span></div>`).join("");
    };
    const remaining = Math.max(0, C.GOAL - s.total);
    const daysLeft = Math.max(1, DAILY_TARGET.length - todayIdx - 1);

    app.innerHTML = `
      <section class="block">
        <div class="toolbar">
          <h1 style="margin:0">Campaign dashboard</h1>
          <div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" id="csv">Export CSV</button><button class="btn btn-ghost btn-sm" id="logout">Lock</button></div>
        </div>
        <div class="kpis">
          <div class="kpi"><small>Registrations</small><div>${s.total}<span class="note"> / ${C.GOAL}</span></div></div>
          <div class="kpi"><small>vs plan to date (${planToDate})</small><div style="color:${s.total >= planToDate ? "var(--accent)" : "#b91c1c"}">${s.total >= planToDate ? "+" : ""}${s.total - planToDate}</div></div>
          <div class="kpi"><small>Viral ratio (referred ÷ seeded)</small><div>${s.viral.toFixed(2)}</div></div>
          <div class="kpi"><small>Needed per remaining day</small><div>${remaining ? Math.ceil(remaining / daysLeft) : "✓"}</div></div>
        </div>
        <div class="card">
          <h3>Daily registrations vs plan</h3>
          <div class="cols">
            ${days.map((d, i) => `<div class="col" title="${d.k}: ${d.actual} actual / ${d.target} target">
              <b>${i <= todayIdx ? d.actual : ""}</b>
              <i class="${i > todayIdx ? "target" : ""}" style="height:${((i > todayIdx ? d.target : d.actual) / maxDay) * 100}%;${i <= todayIdx && d.actual < d.target ? "background:#f59e0b" : ""}"></i>
              <small>${d.label}</small><small>plan ${d.target}</small></div>`).join("")}
          </div>
          <p class="note">Purple means the day hit its target, amber means it fell short, and dashed bars are days still to come.</p>
        </div>
        <div class="grid2" style="margin-top:16px">
          <div class="card"><h3>By channel</h3>${hb(s.bySource)}<p class="note">“referral” = came through a student's invite link. Ambassador links use <code>?src=amb_name</code>.</p></div>
          <div class="card"><h3>Top colleges</h3>${hb(s.byCollege, "#0ea5e9")}</div>
          <div class="card"><h3>By branch</h3>${hb(s.byBranch, "#8b5cf6")}</div>
          <div class="card"><h3>Top inviters (reward these)</h3>
            <table class="lb"><tbody>${s.top.map((r, i) => `<tr><td class="rank">${i + 1}</td><td>${esc(r.name)}</td><td class="note">${esc(r.college)}</td><td class="r">${r.count}</td></tr>`).join("")}</tbody></table>
            <p class="note">${s.activeReferrers} students have brought at least one friend.</p></div>
        </div>
      </section>`;
    $("#logout").onclick = () => { sessionStorage.removeItem("admin_key"); viewAdmin(); };
    $("#csv").onclick = async () => {
      const r = await api.export(key);
      if (!r.ok) return toast(r.error);
      const cols = ["ts", "name", "email", "phone", "college", "branch", "year", "code", "referredBy", "source"];
      const csv = [cols.join(","), ...r.rows.map((x) => cols.map((c) => `"${String(c === "ts" ? new Date(x.ts).toISOString() : x[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = "registrations.csv"; a.click();
    };
  }

  // ---------- router ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [page, arg] = h.split("/");
    window.scrollTo(0, 0);
    window.Sim.stop();
    const run =
      page === "me" && arg ? viewMe(arg.toUpperCase()) :
      page === "leaderboard" ? viewLeaderboard() :
      page === "simulator" ? window.Sim.view(app) :
      page === "find" ? viewFind() :
      page === "admin" ? viewAdmin() :
      viewHome();
    Promise.resolve(run).catch((e) => {
      console.error(e);
      app.innerHTML = `<div class="center card"><h2>Couldn't load</h2><p class="note">${esc(e.message)}</p></div>`;
    });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-scroll]");
    if (!a) return;
    e.preventDefault();
    const go = () => $("#" + a.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
    if (location.hash && location.hash !== "#/") { location.hash = "#/"; setTimeout(go, 150); } else go();
  });

  if (DEMO) {
    $("#demo-banner").hidden = false;
    $("#reset-demo").onclick = () => { try { localStorage.removeItem(KEY); localStorage.removeItem("my_code"); } catch {} location.hash = "#/"; location.reload(); };
  }
  window.addEventListener("hashchange", route);
  route();
})();

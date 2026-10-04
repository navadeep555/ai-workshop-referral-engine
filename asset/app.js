/* Referral Engine for "Build Your First AI Project in 60 Minutes"
 * Every registrant gets a personal invite link. Registrations are attributed to
 * a source (ambassador / whatsapp / linkedin / referral / direct) so the
 * organiser dashboard shows which channel is actually filling the 500 seats.
 */
(function () {
  "use strict";

  const C = window.CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app");

  // Daily targets from the growth plan (sum = 500). Admin chart compares against these.
  const DAILY_TARGET = [40, 60, 70, 80, 90, 90, 70];

  const BRANCHES = ["CSE", "CSE (AI/ML)", "CSE (Data Science)", "IT", "ECE", "EEE", "Mechanical", "Civil", "Other"];
  // Suggestions for the college field (Telangana, Andhra Pradesh, Tamil Nadu); students can type any college
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

  // ---------- icons (inline SVG, consistent on every device) ----------
  const P = {
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19h20"/>',
    tag: '<path d="M20 12 12 20l-8-8V4h8z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    form: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z"/>',
    rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1-4 4-8 11-9-1 7-5 10-9 11z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
    code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3.5 3.5 0 0 0 4 4M16 6h3.5a3.5 3.5 0 0 1-4 4M12 13v4M8 20h8M9.5 17h5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  };
  const icon = (n, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const WA_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>';
  const LI_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.06a4.17 4.17 0 0 1 3.75-2.05c4 0 4.74 2.64 4.74 6.07V21h-4v-5.05c0-1.2 0-2.75-1.68-2.75s-1.94 1.31-1.94 2.66V21h-4z"/></svg>';

  const DC_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.3 5.3A17 17 0 0 0 15 4l-.5 1a15.6 15.6 0 0 0-5 0L9 4a17 17 0 0 0-4.3 1.3C2 9.4 1.3 13.4 1.6 17.3A17.2 17.2 0 0 0 6.9 20l1.1-1.8a11 11 0 0 1-1.8-.9l.4-.3a12.2 12.2 0 0 0 10.8 0l.4.3a11 11 0 0 1-1.8.9l1.1 1.8a17.1 17.1 0 0 0 5.3-2.7c.4-4.5-.7-8.5-3.1-12zM8.7 14.9c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1zm6.6 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1z"/></svg>';

  // ---------- utils ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normCollege = (s) => String(s || "").trim().replace(/\s+/g, " ");
  const normPhone = (s) => String(s || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  const { dayKey } = window.Analytics;
  // Invite links always use the short address, even when the page was opened via /asset/
  const baseUrl = () => location.href.split(/[?#]/)[0].replace(/\/asset\/(index\.html)?$/, "/");
  const inviteLink = (code) => `${baseUrl()}?ref=${encodeURIComponent(code)}`;

  const when = new Date(C.WORKSHOP_DATE);
  const fmtDay = when.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const fmtTime = when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const fmtDate = `${fmtDay} · ${fmtTime} IST`;

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function safeGet(store, k) { try { return store.getItem(k); } catch { return null; } }
  function safeSet(store, k, v) { try { store.setItem(k, v); } catch { /* storage blocked */ } }
  function safeDel(store, k) { try { store.removeItem(k); } catch { /* storage blocked */ } }

  // Capture attribution from the URL once, keep it for the session.
  (function captureAttribution() {
    const q = new URLSearchParams(location.search);
    if (q.get("ref")) safeSet(sessionStorage, "ref", q.get("ref").toUpperCase());
    if (q.get("src")) safeSet(sessionStorage, "src", q.get("src").toLowerCase());
    if (q.get("college")) safeSet(sessionStorage, "college", q.get("college"));
    // Preview a variant without counting it: ?v_campus=B (or =off)
    ["campus"].forEach((e) => {
      const v = (q.get("v_" + e) || "").toUpperCase();
      if (v === "A" || v === "B") safeSet(sessionStorage, "force_" + e, v);
      if (v === "OFF") safeDel(sessionStorage, "force_" + e);
    });
  })();
  const attribution = () => ({
    ref: safeGet(sessionStorage, "ref") || "",
    src: safeGet(sessionStorage, "src") || "",
  });

  // ---------- API (Vercel serverless function + MongoDB, see api/index.js) ----------
  async function call(action, payload = {}) {
    let res;
    try {
      res = await fetch(C.API_URL || "/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
    } catch {
      throw new Error("You seem to be offline. Check your connection and try again.");
    }
    try { return await res.json(); } catch { throw new Error("Server unavailable. Please try again in a minute."); }
  }
  // Throws on { ok:false } so every view handles failures the same way
  const must = async (p) => { const r = await p; if (!r.ok) throw new Error(r.error || "Something went wrong"); return r; };
  const api = {
    register: (d) => call("register", d),
    find: (q) => call("find", { q }),
    me: (code) => call("me", { code }),
    leaderboard: () => call("leaderboard"),
    college: (name) => call("college", { name }),
    stats: (key) => call("stats", { key }),
    export: (key) => call("export", { key }),
  };

  // ---------- experiments ----------
  const forced = (exp) => safeGet(sessionStorage, "force_" + exp);
  function track(exp, variant, event, extra = {}) {
    if (forced(exp)) return; // previews are never counted
    try {
      fetch(C.API_URL || "/api", {
        method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "track", exp, variant, event, ...extra }),
      }).catch(() => {});
    } catch { /* tracking must never break the page */ }
  }
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  // "amrita-coimbatore" → "Amrita Vishwa Vidyapeetham, Coimbatore"; unknown names are used as typed
  function resolveCollege(raw) {
    if (!raw) return "";
    const want = slug(raw);
    const hit = COLLEGES.find((c) => { const have = slug(c); return want.every((w) => have.includes(w)); });
    return hit || (/[A-Z\s]/.test(raw) ? normCollege(raw) : "");
  }
  const shortCollege = (c) => String(c).split(",")[0].replace(/\s*\(.*\)\s*/, " ").trim();

  // ---------- shared view pieces ----------
  let routeSeq = 0;
  const isCurrent = (id) => id === routeSeq;

  const loadingView = (lines = 4) => `
    <div class="narrow"><div class="card" aria-busy="true" aria-label="Loading">
      <div class="sk lg"></div>${Array.from({ length: lines }, (_, i) => `<div class="sk ${i % 2 ? "sm" : ""}"></div>`).join("")}
    </div></div>`;

  const errorView = (msg) => `
    <div class="narrow"><div class="card state error">
      <div class="icon-tile">${icon("alert")}</div>
      <h2>Couldn't load this page</h2>
      <p>${esc(msg)}</p>
      <button class="btn" type="button" data-retry>${icon("refresh")} Try again</button>
    </div></div>`;

  function rankList(items, { medals = false, color = "" } = {}) {
    if (!items.length) return `<div class="empty">${icon("users")}<div>Nothing here yet.</div></div>`;
    const max = Math.max(1, ...items.map((x) => x.value));
    return `<ol class="rank-list">${items.map((x, i) => `
      <li>
        <span class="rank-badge ${medals && i < 3 ? "medal" : ""}">${i + 1}</span>
        <div>
          <div class="rank-top"><span class="rank-name">${esc(x.label)}${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</span><span class="rank-val">${x.value}</span></div>
          <div class="bar"><i style="width:${(x.value / max) * 100}%;${color ? `background:${color}` : ""}"></i></div>
        </div>
      </li>`).join("")}</ol>`;
  }

  // ---------- registered state (remembered on this device) ----------
  const myCode = () => safeGet(localStorage, "my_code");
  function updateNavCta() {
    const cta = $("#nav-cta"), code = myCode();
    cta.href = code ? `#/me/${code}` : "#/register";
    cta.textContent = code ? "My invite link" : "Register free";
  }

  function forgetMe() {
    safeDel(localStorage, "my_code");
    updateNavCta();
  }

  // The remembered registration may have been deleted by the organisers: check once per visit.
  async function verifyRemembered() {
    const code = myCode();
    if (!code) return;
    try {
      const m = await api.me(code);
      if (m && m.ok === false && !m.error) {
        forgetMe();
        const page = location.hash.replace(/^#\/?/, "").split("/")[0];
        if (!page || page === "register" || page === "leaderboard") route(); // re-render without the registered state
      }
    } catch { /* offline: keep what we have */ }
  }

  // ---------- home ----------
  function viewHome(id) {
    const code = myCode();
    const ctas = code
      ? `<a class="btn" href="#/me/${esc(code)}">View my invite link ${icon("arrow")}</a>
         <a class="btn btn-dark-ghost" href="#/me/${esc(code)}">${icon("users")} Invite friends</a>`
      : `<a class="btn" href="#/register">Reserve my free seat ${icon("arrow")}</a>
         <a class="btn btn-dark-ghost" href="#/" data-scroll="plan">See the 60-minute plan</a>`;

    app.innerHTML = `
      <div class="hero-band">
        <section class="wrap hero">
          <div>
            <span class="eyebrow" id="hero-eyebrow">${icon("spark")} Free · Live · For final-year engineering students</span>
            <h1 id="hero-title">Build your first <span class="grad">AI project</span> in 60 minutes.</h1>
            <p class="lede">Placement interviews now ask, “Have you built anything with AI?” In one live hour you'll build and deploy an
              <b>AI Resume Reviewer</b>, and leave with a public link and a GitHub repo for your resume.</p>
            <div class="hero-ctas">${ctas}</div>
            ${code ? `<p class="registered-note">${icon("check")} You're registered for ${esc(fmtDay)}, ${esc(fmtTime)} IST.</p>` : ""}
            ${code && attribution().ref === code ? `<p class="own-link-note">${icon("link")} This is your own invite link. Friends who open it on their phone will see the sign-up page.</p>` : ""}
            <ul class="facts">
              <li>${icon("calendar")} ${esc(fmtDay)}, ${esc(fmtTime)} IST</li>
              <li>${icon("clock")} 60 minutes</li>
              <li>${icon("laptop")} Laptop + browser only</li>
              <li>${icon("tag")} Free</li>
            </ul>
            <div class="counter" id="counter">
              <div class="counter-top"><span><strong id="count" class="skeleton">000</strong><span id="count-label">students registered</span></span><span id="seats">${C.GOAL} seats</span></div>
              <div class="bar"><i id="countbar" style="width:0"></i></div>
            </div>
          </div>

          <div class="preview" aria-label="Preview of the AI Resume Reviewer you'll build">
            <div class="preview-window">
              <div class="preview-bar"><span></span><span></span><span></span><em>your-name-resume-ai.vercel.app</em></div>
              <div class="preview-body">
                <div class="preview-upload">${icon("form")}<div><b>Navadeep_Resume.pdf</b><small>Analysed in 4.2s</small></div><span class="pill-ok">Done</span></div>
                <div class="score">
                  <svg viewBox="0 0 120 120" class="ring" aria-hidden="true">
                    <circle cx="60" cy="60" r="50" class="ring-bg"/>
                    <circle cx="60" cy="60" r="50" class="ring-fg" id="ring-fg"/>
                  </svg>
                  <div class="score-num"><b id="score-num">0</b><small>/100</small></div>
                  <div class="score-text"><b>Resume score</b><small>Role: Software Engineer (fresher)</small></div>
                </div>
                <ul class="feedback">
                  <li class="good">${icon("check")}<span>Strong projects section with live links</span></li>
                  <li class="warn">${icon("alert")}<span>Add numbers: “cut load time by 40%”</span></li>
                  <li class="warn">${icon("alert")}<span>Missing keywords: REST APIs, Git</span></li>
                </ul>
                <div class="chips"><span>Python</span><span>LLM API</span><span>Prompting</span><span>Deployed</span></div>
              </div>
            </div>
            <p class="preview-caption">${icon("rocket")} This is the app you'll build and deploy, live, in 60 minutes.</p>
          </div>
        </section>
      </div>

      <section class="block">
        <div class="section-head"><h2>How it works</h2><p>Four steps from sign-up to a project on your resume.</p></div>
        <div class="steps">
          <div class="card step"><span class="step-num">01</span><div class="icon-tile">${icon("form")}</div><h3>Reserve your seat</h3><p>Two quick steps: tell us about you, then where to send the joining link. It's free.</p></div>
          <div class="card step"><span class="step-num">02</span><div class="icon-tile">${icon("link")}</div><h3>Get your invite link</h3><p>Your personal link appears straight away. Share it on WhatsApp or Discord in one tap.</p></div>
          <div class="card step"><span class="step-num">03</span><div class="icon-tile">${icon("gift")}</div><h3>Unlock rewards</h3><p>Invite 1, 3 or 5 friends to unlock the prompt pack, priority Q&amp;A or a 1:1 review.</p></div>
          <div class="card step"><span class="step-num">04</span><div class="icon-tile">${icon("rocket")}</div><h3>Join live and build</h3><p>The joining link arrives on WhatsApp and email before ${esc(fmtDay)}, ${esc(fmtTime)}.</p></div>
        </div>
        <p class="note" style="margin-top:16px">Already registered on another device? <a href="#/find">Find your invite link</a>.</p>
      </section>

      <section class="block">
        <div class="section-head"><h2>What you walk away with</h2></div>
        <div class="grid3">
          <div class="card feature"><div class="icon-tile">${icon("rocket")}</div><h3>A deployed AI app</h3><p>A working AI Resume Reviewer with a public URL you can show a recruiter.</p></div>
          <div class="card feature"><div class="icon-tile">${icon("briefcase")}</div><h3>A resume line that holds up</h3><p>A GitHub repo plus a project description you can explain in an interview.</p></div>
          <div class="card feature"><div class="icon-tile">${icon("code")}</div><h3>Skills that carry over</h3><p>Prompting, calling an LLM API and shipping. You'll reuse these in every AI project after this one.</p></div>
        </div>
      </section>

      <section class="block grid2" id="plan">
        <div class="card">
          <h3>The 60 minutes</h3>
          <ul class="agenda">
            <li><b>0–10</b><span>How LLM apps work, with no maths and no jargon</span></li>
            <li><b>10–35</b><span>Build: prompt → API → resume feedback</span></li>
            <li><b>35–50</b><span>Deploy it live and push it to GitHub</span></li>
            <li><b>50–60</b><span>Make it yours, then live Q&amp;A</span></li>
          </ul>
        </div>
        <div class="card">
          <h3>FAQ</h3>
          <details><summary>I've never done AI or ML. Can I still join?</summary><p>Yes. If you can use a browser, you can follow along. Every step is shown live.</p></details>
          <details><summary>Is it really free?</summary><p>Yes, completely. You don't need a card or any paid tools.</p></details>
          <details><summary>I'm not from CSE. Is that okay?</summary><p>Yes. ECE, EEE and Mechanical students build the same project.</p></details>
          <details><summary>Will there be a recording?</summary><p>Registered students get the recording and the code afterwards, but joining live is the best way to build along.</p></details>
        </div>
      </section>

      <section class="wrap">
        <div class="cta-band">
          ${code
            ? `<div><h2>Your seat is booked.</h2><p>Now bring your classmates. Every friend who joins counts for your rewards and your college.</p></div>
               <a class="btn" href="#/me/${esc(code)}">Invite friends ${icon("arrow")}</a>`
            : `<div><h2>Seats are free, but limited to ${C.GOAL}.</h2><p>Reserve yours in under a minute, then bring your classmates along.</p></div>
               <a class="btn" href="#/register">Reserve my free seat ${icon("arrow")}</a>`}
        </div>
      </section>`;

    // Animate the preview's score ring
    requestAnimationFrame(() => {
      const ring = $("#ring-fg"), num = $("#score-num");
      if (!ring) return;
      const target = 78, len = 2 * Math.PI * 50;
      ring.style.strokeDasharray = len;
      ring.style.strokeDashoffset = len;
      requestAnimationFrame(() => { ring.style.strokeDashoffset = len * (1 - target / 100); });
      const t0 = performance.now();
      const tick = (t) => {
        if (!isCurrent(id) || !$("#score-num")) return;
        const k = Math.min(1, (t - t0) / 1200);
        num.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    // Social proof counter
    api.leaderboard().then((lb) => {
      if (!isCurrent(id) || $("#counter").dataset.campus) return;
      if (!lb.ok) { $("#counter").hidden = true; return; }
      const count = $("#count");
      count.classList.remove("skeleton");
      count.textContent = lb.total;
      $("#seats").textContent = `${Math.max(0, C.GOAL - lb.total)} seats left`;
      requestAnimationFrame(() => { $("#countbar").style.width = Math.max(2, Math.min(100, (lb.total / C.GOAL) * 100)) + "%"; });
    }).catch(() => { if (isCurrent(id)) $("#counter").hidden = true; });

    // Campus experiment: the visitor's college comes from an ambassador link or the friend who invited them
    const { ref } = attribution();
    const linkCollege = resolveCollege(safeGet(sessionStorage, "college"));
    if (linkCollege) applyCampus(id, linkCollege);
    else if (ref) api.me(ref).then((m) => { if (m.ok) applyCampus(id, m.college); }).catch(() => {});
  }

  // Experiment 1 — Campus Identity. Only visitors whose college we know (ambassador link with
  // ?college=…, or a friend's invite) take part. A = standard page, B = "<College> AI Project Sprint".
  function applyCampus(id, college) {
    if (!isCurrent(id) || !college) return;
    safeSet(sessionStorage, "campus_college", college); // prefilled on the register page in both versions
    const variant = forced("campus") || window.Analytics.hashVariant(college);
    if (!forced("campus")) {
      safeSet(sessionStorage, "campus_variant", variant);
      if (!safeGet(sessionStorage, "campus_seen")) { safeSet(sessionStorage, "campus_seen", "1"); track("campus", variant, "view"); }
    }
    if (variant !== "B") return;
    const short = shortCollege(college);
    $("#hero-eyebrow").innerHTML = `${icon("users")} ${esc(short)} · Campus AI Project Sprint`;
    $("#hero-title").innerHTML = `The <span class="grad">${esc(short)}</span> AI Project Sprint`;
    $("#hero-title").insertAdjacentHTML("afterend", `<p class="hero-sub">Build your first AI project in 60 minutes, together with students from your campus.</p>`);
    api.college(college).then((c) => {
      if (!isCurrent(id) || !c.ok) return;
      const count = $("#count");
      count.classList.remove("skeleton");
      count.textContent = c.count;
      $("#count-label").textContent = `from ${short} registered`;
      $("#seats").textContent = c.count ? `Campus rank #${c.rank} of ${c.colleges}` : "Be the first from your campus";
      $("#countbar").style.width = Math.max(2, Math.min(100, (c.count / 50) * 100)) + "%"; // campus goal: 50
      $("#counter").dataset.campus = "1";
    }).catch(() => {});
  }

  // ---------- register (2 steps) ----------
  function viewRegister(id) {
    const code = myCode();
    if (code && !safeGet(sessionStorage, "register_another")) {
      app.innerHTML = `
        <div class="narrow"><div class="card state">
          <div class="success-icon" style="margin:0 auto 12px">${icon("check")}</div>
          <h1 style="font-size:28px">You're already registered</h1>
          <p>Your seat for <b>${esc(fmtDate)}</b> is booked on this device.</p>
          <div class="stack-btns">
            <a class="btn" href="#/me/${esc(code)}">Go to my invite link ${icon("arrow")}</a>
            <button class="btn btn-ghost" type="button" id="another">Register a different person</button>
          </div>
        </div></div>`;
      $("#another").onclick = () => { safeSet(sessionStorage, "register_another", "1"); viewRegister(id); };
      return;
    }

    const college = safeGet(sessionStorage, "campus_college") || resolveCollege(safeGet(sessionStorage, "college"));
    app.innerHTML = `
      <div class="narrow reg">
        <div class="reg-head">
          <span class="eyebrow">${icon("calendar")} ${esc(fmtDay)} · ${esc(fmtTime)} IST · Free</span>
          <h1>Reserve your seat</h1>
          <p class="muted">Two quick steps. You'll get your personal invite link straight away.</p>
        </div>
        <div class="card">
          <div id="ref-slot"></div>
          <ol class="stepper" aria-label="Registration steps">
            <li class="on" data-st="1"><span>1</span>About you</li>
            <li data-st="2"><span>2</span>Where to reach you</li>
          </ol>
          <form id="regform" novalidate>
            <fieldset class="step-panel" data-panel="1">
              <legend class="sr-only">About you</legend>
              <div class="field">
                <label for="f-name">Full name</label>
                <input id="f-name" name="name" autocomplete="name" placeholder="e.g. Navadeep Maka" aria-describedby="e-name" />
                <div class="field-err" id="e-name"></div>
              </div>
              <div class="field">
                <label for="f-college">College</label>
                <input id="f-college" name="college" list="colleges" autocomplete="organization" placeholder="Start typing your college" value="${esc(college)}" aria-describedby="e-college" />
                <datalist id="colleges">${COLLEGES.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>
                <div class="field-err" id="e-college"></div>
              </div>
              <div class="row2">
                <div class="field">
                  <label for="f-branch">Branch</label>
                  <select id="f-branch" name="branch" aria-describedby="e-branch"><option value="">Select</option>${BRANCHES.map((b) => `<option>${b}</option>`).join("")}</select>
                  <div class="field-err" id="e-branch"></div>
                </div>
                <div class="field">
                  <label for="f-year">Year</label>
                  <select id="f-year" name="year" aria-describedby="e-year"><option value="">Select</option><option>Final year</option><option>Pre-final year</option><option>Graduated (2025/26)</option><option>Other</option></select>
                  <div class="field-err" id="e-year"></div>
                </div>
              </div>
              <button class="btn btn-block" style="margin-top:20px" type="button" id="next">Continue ${icon("arrow")}</button>
            </fieldset>

            <fieldset class="step-panel" data-panel="2" hidden>
              <legend class="sr-only">Where to reach you</legend>
              <p class="muted" style="margin:0">We'll send the joining link and reminders here. No spam.</p>
              <div class="field">
                <label for="f-email">Email</label>
                <input id="f-email" name="email" type="email" autocomplete="email" placeholder="you@college.edu" aria-describedby="e-email" />
                <div class="field-err" id="e-email"></div>
              </div>
              <div class="field">
                <label for="f-phone">WhatsApp number</label>
                <input id="f-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile number" aria-describedby="e-phone" />
                <div class="field-err" id="e-phone"></div>
              </div>
              <div class="form-alert" id="f-alert" role="alert"></div>
              <div class="step-actions">
                <button class="btn btn-ghost" type="button" id="back">Back</button>
                <button class="btn" type="submit" id="f-submit">Reserve my seat ${icon("arrow")}</button>
              </div>
            </fieldset>
          </form>
        </div>
        <ul class="reg-perks">
          <li>${icon("check")} Free, live, 60 minutes</li>
          <li>${icon("check")} A deployed project for your resume</li>
          <li>${icon("check")} Your own invite link and rewards</li>
        </ul>
      </div>`;

    const form = $("#regform");
    const goStep = (n) => {
      form.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== String(n)));
      document.querySelectorAll(".stepper li").forEach((li) => {
        li.classList.toggle("on", +li.dataset.st <= n);
        li.classList.toggle("done", +li.dataset.st < n);
      });
      form.dataset.step = n;
      $(n === 1 ? "#f-name" : "#f-email").focus();
    };
    form.dataset.step = 1;
    $("#next").onclick = () => { if (checkStep(1)) goStep(2); };
    $("#back").onclick = () => goStep(1);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (form.dataset.step === "1") { if (checkStep(1)) goStep(2); return; } // Enter on step 1 = Continue
      onRegister(goStep);
    });
    form.addEventListener("input", (e) => {
      if (e.target.getAttribute("aria-invalid") === "true") setFieldError(e.target.name, "");
    });
    $(college ? "#f-name" : "#f-name").focus();

    const { ref } = attribution();
    if (ref) {
      api.me(ref).then((m) => {
        if (!isCurrent(id) || !m.ok) return;
        $("#ref-slot").innerHTML = `<div class="ref-note">${icon("users")}<span><b>${esc(m.name)}</b> invited you. Sign up and you'll both move up the leaderboard.</span></div>`;
        const f = $("#f-college");
        if (f && !f.value) f.value = m.college;
      }).catch(() => {});
    }
  }

  const STEP_FIELDS = { 1: ["name", "college", "branch", "year"], 2: ["email", "phone"] };

  function readForm() {
    const d = Object.fromEntries(new FormData($("#regform")));
    d.name = String(d.name || "").trim();
    d.email = String(d.email || "").trim().toLowerCase();
    d.phone = normPhone(d.phone);
    d.college = normCollege(d.college);
    return d;
  }

  function checkStep(n) {
    const errs = validate(readForm());
    STEP_FIELDS[n].forEach((k) => setFieldError(k, errs[k] || ""));
    const bad = STEP_FIELDS[n].find((k) => errs[k]);
    if (bad) { $(`#regform [name="${bad}"]`).focus(); return false; }
    return true;
  }

  function setFieldError(name, msg) {
    const input = $(`#regform [name="${name}"]`);
    const out = $(`#e-${name}`);
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (out) out.textContent = msg;
  }

  function validate(d) {
    const errs = {};
    if (d.name.length < 2) errs.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.email = "Please enter a valid email address.";
    if (!/^[6-9]\d{9}$/.test(d.phone)) errs.phone = "Enter a 10-digit Indian mobile number.";
    if (d.college.length < 3) errs.college = "Please enter your college name.";
    if (!d.branch) errs.branch = "Please select your branch.";
    if (!d.year) errs.year = "Please select your year.";
    return errs;
  }

  async function onRegister(goStep) {
    const btn = $("#f-submit"), alertBox = $("#f-alert");
    if (!checkStep(1)) { goStep(1); return; }
    if (!checkStep(2)) return;
    const d = readForm();
    alertBox.textContent = "";
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Reserving…`;
    try {
      const campus = safeGet(sessionStorage, "campus_variant");
      const res = await must(api.register({ ...d, ...attribution(), exp: campus ? { campus } : {} }));
      safeSet(localStorage, "my_code", res.code);
      safeDel(sessionStorage, "register_another");
      updateNavCta();
      if (res.existing) toast("You're already registered. Here's your invite link.");
      location.hash = `#/me/${res.code}`;
    } catch (ex) {
      alertBox.textContent = ex.message || "Something went wrong. Please try again.";
      btn.disabled = false;
      btn.innerHTML = `Reserve my seat ${icon("arrow")}`;
    }
  }

  // ---------- personal invite page ----------
  // Squad Challenge (live for everyone): each student builds a 3-person AI squad and gets a
  // personal share card. Friends who join through a squad member's link fill that squad.
  async function viewMe(id, code) {
    app.innerHTML = loadingView(6);
    let m;
    try { m = await api.me(code); } catch (e) { if (isCurrent(id)) app.innerHTML = errorView(e.message); return; }
    if (!isCurrent(id)) return;
    if (!m.ok) {
      if (code === myCode()) forgetMe();
      app.innerHTML = `<div class="narrow"><div class="card state">
        <div class="icon-tile">${icon("search")}</div><h2>We couldn't find that invite link</h2>
        <p>Check the code, or look it up with the email or number you registered with.</p>
        <a class="btn" href="#/find">Find my link</a></div></div>`;
      return;
    }
    // Squad: captain first, then members in the order they joined (max 3)
    const members = (m.squadMembers && m.squadMembers.length ? m.squadMembers : [{ name: m.name, you: true, captain: true }]).slice(0, 3);
    const captainName = m.squadCaptain || m.name;
    const left = Math.max(0, 3 - members.length);
    const link = inviteLink(m.code);
    const msg =
      `I'm building an AI Resume Reviewer live on ${fmtDate}. It's free and takes 60 minutes 🚀\n\n` +
      (left ? `Our AI squad has ${left} spot${left === 1 ? "" : "s"} left. Join us and we'll build it together:\n${link}`
            : `Join me at the workshop and start your own AI squad:\n${link}`);
    const next = C.REWARDS.find((t) => m.referrals < t.at);
    const prevAt = [...C.REWARDS].reverse().find((t) => m.referrals >= t.at)?.at || 0;
    const pct = next ? ((m.referrals - prevAt) / (next.at - prevAt)) * 100 : 100;

    const shareButtons = `
      <div class="linkbox">
        <div class="link-text" id="mylink">${esc(link)}</div>
        <button class="btn btn-ghost" id="copy" type="button" data-share>${icon("copy")} Copy link</button>
      </div>
      <div class="share-row share-3">
        <a class="btn btn-wa" target="_blank" rel="noopener" data-share href="https://wa.me/?text=${encodeURIComponent(msg)}">${WA_ICON} WhatsApp</a>
        <button class="btn btn-dc" type="button" id="share-dc" data-share>${DC_ICON} Discord</button>
        <a class="btn btn-li" target="_blank" rel="noopener" data-share href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}">${LI_ICON} LinkedIn</a>
      </div>
      ${C.DISCORD_INVITE ? `<a class="btn btn-ghost btn-block community" target="_blank" rel="noopener" href="${esc(C.DISCORD_INVITE)}">${DC_ICON} Join the workshop Discord</a>` : ""}`;

    const inviteBlock = `
      <span class="eyebrow">${icon("users")} Squad challenge</span>
      <h2 class="squad-title">${!left ? (m.isCaptain ? "Your AI squad is complete!" : `${esc(captainName)}'s AI squad is complete!`)
        : m.isCaptain ? "Build your 3-person AI squad" : `You're in ${esc(captainName)}'s AI squad`}</h2>
      <p class="muted">${left
        ? `${left} spot${left === 1 ? "" : "s"} left. Anyone who joins through your link${m.isCaptain ? "" : ` or ${esc(captainName)}'s`} fills the next spot. Squads build together on workshop day, and complete squads get their questions answered first.`
        : "You'll build together on workshop day, and complete squads get their questions answered first. Friends who join through your link now still count towards your rewards."}</p>
      <div class="squad">
        ${[0, 1, 2].map((i) => {
          const p = members[i];
          if (!p) return `<div class="slot"><span class="avatar">+</span><b>Open spot</b><small>Invite a friend</small></div>`;
          const tag = p.you && p.captain ? "You · Captain" : p.you ? "You" : p.captain ? "Captain" : "Joined";
          return `<div class="slot filled${p.you ? " me" : ""}"><span class="avatar">${esc(p.name[0] || "?")}</span><b>${esc(p.name)}</b><small>${tag}</small></div>`;
        }).join("")}
      </div>
      <div class="card-preview">
        <canvas id="squad-card" width="1080" height="1350" role="img" aria-label="Your squad share card"></canvas>
        <div class="card-actions">
          <p class="muted" style="margin:0">Post your squad card on WhatsApp Status or Instagram. It has your code on it, so friends can sign up straight away.</p>
          <button class="btn" id="share-card" type="button" data-share>${icon("arrow")} Share my squad card</button>
          <button class="btn btn-ghost" id="dl-card" type="button" data-share>${icon("download")} Download card</button>
        </div>
      </div>
      ${shareButtons}`;

    app.innerHTML = `
      <div class="narrow">
        <div class="card">
          <div class="success-head">
            <div class="success-icon">${icon("check")}</div>
            <div><h1>You're in, ${esc(m.name)}!</h1></div>
          </div>
          <p class="muted">Your seat is reserved for <b>${esc(fmtDate)}</b>. The joining link will arrive on WhatsApp and email.</p>

          <div class="stat-row">
            <div class="stat"><small>Friends who joined via you</small><b>${m.referrals}</b></div>
            <div class="stat"><small>Your college rank</small><b>#${m.collegeRank}</b><span>${esc(m.college)} · ${m.collegeCount} registered</span></div>
          </div>

          <hr class="divider" />
          ${inviteBlock}

          <div class="progress">
            <div class="progress-top"><b>${next ? `${next.at - m.referrals} more to unlock ${esc(next.title)}` : "Every reward unlocked"}</b><span class="muted">${m.referrals}/${next ? next.at : C.REWARDS[C.REWARDS.length - 1].at}</span></div>
            <div class="bar"><i style="width:${Math.max(3, pct)}%"></i></div>
          </div>
          <div class="tiers">
            ${C.REWARDS.map((t) => `
              <div class="tier ${m.referrals >= t.at ? "done" : ""}">
                <div class="badge">${m.referrals >= t.at ? icon("check") : t.at}</div>
                <div><b>${esc(t.title)}</b><small>${esc(t.desc)} · ${t.at} friend${t.at > 1 ? "s" : ""}</small></div>
              </div>`).join("")}
          </div>
          <p class="note" style="margin:20px 0 0">Your code is <b>${esc(m.code)}</b>. Bookmark this page to track your invites, or <a href="#/leaderboard">see the leaderboard</a>.</p>
        </div>
      </div>`;

    // every share action counts towards the experiment's share rate
    app.querySelectorAll("[data-share]").forEach((el) => el.addEventListener("click", () => track("squad", "B", "share", { code: m.code })));

    $("#copy").onclick = async () => {
      try { await navigator.clipboard.writeText(link); }
      catch {
        const r = document.createRange(); r.selectNodeContents($("#mylink"));
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand("copy");
      }
      $("#copy").innerHTML = `${icon("check")} Copied`;
      toast("Invite link copied");
      setTimeout(() => { const b = $("#copy"); if (b) b.innerHTML = `${icon("copy")} Copy link`; }, 2000);
    };

    $("#share-dc").onclick = async () => {
      const dcMsg = msg.split(link).join(`${link}&src=discord`);
      try { await navigator.clipboard.writeText(dcMsg); toast("Message copied. Paste it in your Discord server or DMs."); }
      catch { toast("Couldn't copy automatically. Use Copy link instead."); }
      window.open("https://discord.com/channels/@me", "_blank", "noopener");
    };

    {
      const canvas = $("#squad-card");
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
      fontsReady.then(() => { if (isCurrent(id)) drawSquadCard(canvas, m, members, link); });
      const toBlob = () => new Promise((res) => canvas.toBlob(res, "image/png"));
      const fileName = `ai-squad-${m.code}.png`;
      const download = async () => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(await toBlob()); a.download = fileName; a.click();
        toast("Card downloaded. Post it on WhatsApp Status or Instagram!");
      };
      $("#dl-card").onclick = download;
      $("#share-card").onclick = async () => {
        const file = new File([await toBlob()], fileName, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], text: msg }); } catch { /* share sheet closed */ }
        } else {
          download();
        }
      };
    }
  }

  // 1080×1350 share card (WhatsApp Status / Instagram friendly)
  function drawSquadCard(canvas, m, members, link) {
    const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    const F = "'Plus Jakarta Sans', 'Segoe UI', sans-serif";
    const rect = (x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0b1020"); bg.addColorStop(1, "#231a66");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.85, 80, 0, W * 0.85, 80, 700);
    glow.addColorStop(0, "rgba(124,58,237,.55)"); glow.addColorStop(1, "rgba(124,58,237,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    // brand
    const lg = ctx.createLinearGradient(80, 80, 152, 152); lg.addColorStop(0, "#4f46e5"); lg.addColorStop(1, "#7c3aed");
    ctx.fillStyle = lg; rect(80, 80, 72, 72, 18); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = `800 28px ${F}`; ctx.textAlign = "center"; ctx.fillText("AI", 116, 126);
    ctx.textAlign = "left"; ctx.font = `700 32px ${F}`; ctx.fillStyle = "#d9dcff"; ctx.fillText("60-Minute AI Workshop", 176, 128);

    // headline
    ctx.fillStyle = "#fff"; ctx.font = `800 104px ${F}`;
    ctx.fillText("Join my", 80, 340); ctx.fillText("AI squad", 80, 456);
    const tg = ctx.createLinearGradient(80, 0, 900, 0); tg.addColorStop(0, "#a5b4fc"); tg.addColorStop(1, "#f0abfc");
    ctx.fillStyle = tg; ctx.font = `700 44px ${F}`;
    ctx.fillText("We'll build & deploy an AI Resume", 80, 548); ctx.fillText("Reviewer together. Live, in 60 min.", 80, 604);
    ctx.fillStyle = "#b9bedb"; ctx.font = `600 36px ${F}`;
    ctx.fillText(`${fmtDay} · ${fmtTime} IST · Free`, 80, 680);

    // squad slots
    [0, 1, 2].map((i) => members[i] && members[i].name).forEach((n, i) => {
      const cx = 200 + i * 340, cy = 860;
      ctx.beginPath(); ctx.arc(cx, cy, 92, 0, Math.PI * 2);
      if (n) {
        const g = ctx.createLinearGradient(cx - 90, cy - 90, cx + 90, cy + 90); g.addColorStop(0, "#4f46e5"); g.addColorStop(1, "#7c3aed");
        ctx.fillStyle = g; ctx.fill();
      } else {
        ctx.setLineDash([14, 12]); ctx.lineWidth = 5; ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = `800 ${n ? 78 : 96}px ${F}`;
      ctx.fillText(n ? n[0].toUpperCase() : "+", cx, cy + (n ? 28 : 34));
      ctx.font = `700 32px ${F}`; ctx.fillStyle = n ? "#fff" : "#9aa0c7";
      ctx.fillText(n ? (n.length > 12 ? n.slice(0, 11) + "…" : n) : "You?", cx, cy + 150);
    });

    // code panel
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff"; rect(80, 1080, W - 160, 190, 28); ctx.fill();
    ctx.fillStyle = "#64748b"; ctx.font = `700 30px ${F}`; ctx.fillText("Register free with my code", 124, 1146);
    ctx.fillStyle = "#4f46e5"; ctx.font = `800 76px ${F}`; ctx.fillText(m.code, 124, 1232);
    let host = ""; try { host = new URL(link).host; } catch { /* no host */ }
    ctx.textAlign = "right"; ctx.fillStyle = "#0b1220"; ctx.font = `700 28px ${F}`; ctx.fillText(host, W - 124, 1146);
    ctx.textAlign = "left";
  }

  // ---------- leaderboard ----------
  async function viewLeaderboard(id) {
    app.innerHTML = loadingView(5);
    let lb;
    try { lb = await must(api.leaderboard()); } catch (e) { if (isCurrent(id)) app.innerHTML = errorView(e.message); return; }
    if (!isCurrent(id)) return;
    app.innerHTML = `
      <section class="block">
        <span class="eyebrow">${icon("trophy")} College Challenge</span>
        <h1>Which campus brings the most students?</h1>
        <p class="lede"><b>${lb.total}</b> of ${C.GOAL} seats are filled so far. Every friend you invite counts for your college.</p>
        <div class="grid2" style="margin-top:24px">
          <div class="card"><h3>Top colleges</h3>
            ${rankList(lb.colleges.map((c) => ({ label: c.college, value: c.count })), { medals: true })}
          </div>
          <div class="card"><h3>Top inviters</h3>
            ${rankList(lb.referrers.map((r) => ({ label: r.name, sub: r.college, value: r.count })), { medals: true, color: "linear-gradient(90deg,#10b981,#059669)" })}
          </div>
        </div>
        <div class="cta-band">
          <div><h2>Put your college on the board.</h2><p>${myCode() ? "Share your invite link with your class group." : "Register, then share your invite link with your class group."}</p></div>
          <a class="btn" href="${myCode() ? `#/me/${esc(myCode())}` : "#/register"}">${myCode() ? "Share my invite link" : "Register free"} ${icon("arrow")}</a>
        </div>
      </section>`;
  }

  // ---------- find my link ----------
  function viewFind() {
    app.innerHTML = `
      <div class="narrow"><div class="card">
        <div class="icon-tile" style="margin-bottom:12px">${icon("search")}</div>
        <h1 style="font-size:28px">Find your invite link</h1>
        <p class="muted">Enter the email or WhatsApp number you registered with.</p>
        <form id="findform" novalidate>
          <label for="q">Email or WhatsApp number</label>
          <input id="q" name="q" autocomplete="email" placeholder="you@college.edu or 9876543210" />
          <div class="form-alert" id="find-err" role="alert"></div>
          <button class="btn btn-block" style="margin-top:16px" id="find-btn" type="submit">Find my link</button>
        </form>
      </div></div>`;
    $("#findform").onsubmit = async (e) => {
      e.preventDefault();
      const err = $("#find-err"), btn = $("#find-btn");
      let q = e.target.q.value.trim().toLowerCase();
      if (!q) { err.textContent = "Please enter your email or number."; return; }
      if (/^[\d\s+-]+$/.test(q)) q = normPhone(q);
      err.textContent = "";
      btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Searching…`;
      try {
        const r = await api.find(q);
        if (r.ok) { location.hash = `#/me/${r.code}`; return; }
        err.textContent = r.error || "We couldn't find a registration with that email or number.";
      } catch (ex) { err.textContent = ex.message; }
      btn.disabled = false; btn.textContent = "Find my link";
    };
  }

  // ---------- experiment results (dashboard) ----------
  const pctf = (x) => (x * 100).toFixed(1) + "%";
  function expVerdict(res, n1, n2, min, betterIsHigher = true) {
    if (!res.enough) {
      return `<div class="exp-result">Not enough data yet. Each version needs at least <b>${min}</b> students (now ${n1} and ${n2}). Keep both running.</div>`;
    }
    const conf = res.confidence || 0;
    if (conf < 0.95 || res.lift === null) {
      return `<div class="exp-result">No clear winner yet (${Math.round(conf * 100)}% confidence, need 95%). Keep both running.</div>`;
    }
    const bWins = betterIsHigher ? res.lift > 0 : res.lift < 0;
    const liftTxt = (res.lift > 0 ? "+" : "") + Math.round(res.lift * 100) + "%";
    return bWins
      ? `<div class="exp-result win"><b>Version B wins</b> (${liftTxt}, ${Math.round(conf * 100)}% confidence). Switch everyone to B.</div>`
      : `<div class="exp-result lose"><b>Version A wins</b> (B is ${liftTxt}, ${Math.round(conf * 100)}% confidence). Keep A.</div>`;
  }

  function experimentsSection(x) {
    if (!x) return "";
    const c = x.campus.arms, q = x.squad;
    const base = baseUrl();
    return `
      <div class="section-head" style="margin-top:40px"><h2>Experiments</h2><p>Campus Identity runs as an A/B test on Days 1–3, then everyone switches to the winner. The Squad Challenge is live for everyone.</p></div>
      <div class="grid2">
        <div class="card">
          <span class="eyebrow">${icon("users")} Test 1 · Campus Identity</span>
          <p class="muted">Students respond more to something happening in their own college than to a national online workshop. Only visitors whose college is known take part. Each college always sees the same version.</p>
          <div class="table-scroll"><table class="exp-table">
            <thead><tr><th>Version</th><th>Visitors</th><th>Registered</th><th>Conversion</th></tr></thead>
            <tbody>
              <tr><td>A · Standard page</td><td>${c[0].views}</td><td>${c[0].regs}</td><td>${pctf(c[0].rate)}</td></tr>
              <tr><td>B · Campus Sprint</td><td>${c[1].views}</td><td>${c[1].regs}</td><td>${pctf(c[1].rate)}</td></tr>
            </tbody></table></div>
          ${expVerdict(x.campus.result, c[0].views, c[1].views, x.minPerGroup)}
          <div class="exp-preview note">Preview:
            <a href="${base}?college=amrita-coimbatore&v_campus=A#/" target="_blank" rel="noopener">Version A</a>
            <a href="${base}?college=amrita-coimbatore&v_campus=B#/" target="_blank" rel="noopener">Version B</a>
          </div>
        </div>
        <div class="card">
          <span class="eyebrow">${icon("gift")} Live for everyone · Squad Challenge</span>
          <p class="muted">Every student builds a 3-person AI squad and gets a personal share card. Friends who join through a squad member's link fill that squad.</p>
          <div class="kpis kpis-mini">
            <div class="kpi"><small>Students who shared</small><div>${pctf(q.shareRate)}</div><span class="note">${q.sharers} of ${q.students}</span></div>
            <div class="kpi"><small>Friends per student</small><div>${q.refsPerStudent.toFixed(2)}</div><span class="note">${q.referrals} joined via invites</span></div>
            <div class="kpi"><small>Squads complete</small><div>${q.complete}</div><span class="note">of ${q.squads} squads</span></div>
            <div class="kpi"><small>Share clicks</small><div>${q.shareClicks}</div><span class="note">WhatsApp, Discord, card…</span></div>
          </div>
        </div>
      </div>`;
  }

  // ---------- organiser dashboard ----------
  async function viewAdmin(id) {
    const key = safeGet(sessionStorage, "admin_key");
    if (!key) {
      app.innerHTML = `
        <div class="narrow"><div class="card">
          <div class="icon-tile" style="margin-bottom:12px">${icon("lock")}</div>
          <h1 style="font-size:28px">Organiser dashboard</h1>
          <p class="muted">Enter the admin key to see live campaign numbers.</p>
          <form id="keyform" novalidate>
            <label for="k">Admin key</label><input id="k" type="password" autocomplete="current-password" />
            <div class="form-alert" id="key-err" role="alert"></div>
            <button class="btn btn-block" style="margin-top:16px" type="submit">Open dashboard</button>
          </form>
        </div></div>`;
      $("#keyform").onsubmit = (e) => {
        e.preventDefault();
        if (!$("#k").value) { $("#key-err").textContent = "Please enter the admin key."; return; }
        safeSet(sessionStorage, "admin_key", $("#k").value); viewAdmin(id);
      };
      return;
    }
    app.innerHTML = loadingView(6);
    let s;
    try { s = await api.stats(key); } catch (e) { if (isCurrent(id)) app.innerHTML = errorView(e.message); return; }
    if (!isCurrent(id)) return;
    if (!s.ok) {
      if (/admin key/i.test(s.error || "")) { safeDel(sessionStorage, "admin_key"); toast("Wrong admin key"); return viewAdmin(id); }
      app.innerHTML = errorView(s.error); return;
    }

    // Day-by-day vs plan, starting from the first registration's date
    const startDay = new Date(dayKey(s.firstTs) + "T00:00:00+05:30").getTime();
    const days = DAILY_TARGET.map((t, i) => {
      const k = dayKey(startDay + i * 864e5 + 3600e3);
      return { label: `D${i + 1}`, k, actual: s.byDay[k] || 0, target: t };
    });
    const todayIdx = Math.max(0, days.findIndex((d) => d.k === dayKey(Date.now())));
    const planToDate = DAILY_TARGET.slice(0, todayIdx + 1).reduce((a, b) => a + b, 0);
    const maxDay = Math.max(...days.map((d) => Math.max(d.actual, d.target)), 1);
    const toItems = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
    const remaining = Math.max(0, C.GOAL - s.total);
    const daysLeft = Math.max(1, DAILY_TARGET.length - todayIdx - 1);
    const diff = s.total - planToDate;

    app.innerHTML = `
      <section class="block">
        <div class="toolbar">
          <h1>Campaign dashboard</h1>
          <div class="actions">
            <button class="btn btn-ghost btn-sm" id="refresh" type="button">${icon("refresh")} Refresh</button>
            <button class="btn btn-ghost btn-sm" id="csv" type="button">${icon("download")} Export CSV</button>
            <button class="btn btn-ghost btn-sm" id="logout" type="button">${icon("lock")} Lock</button>
          </div>
        </div>
        <div class="kpis">
          <div class="kpi"><small>Registrations</small><div>${s.total}<span class="note"> / ${C.GOAL}</span></div></div>
          <div class="kpi"><small>Vs plan to date (${planToDate})</small><div class="${diff >= 0 ? "good" : "bad"}">${diff >= 0 ? "+" : ""}${diff}</div></div>
          <div class="kpi"><small>Viral ratio</small><div>${s.viral.toFixed(2)}</div></div>
          <div class="kpi"><small>Needed per day left</small><div>${remaining ? Math.ceil(remaining / daysLeft) : "Done"}</div></div>
        </div>
        <div class="card">
          <h3>Daily registrations vs plan</h3>
          <div class="cols" role="img" aria-label="Daily registrations compared with plan">
            ${days.map((d, i) => {
              const future = i > todayIdx;
              const h = ((future ? d.target : d.actual) / maxDay) * 100;
              return `<div class="col" title="${d.k}: ${d.actual} registered, plan ${d.target}">
                <b>${future ? "" : d.actual}</b>
                <i class="${future ? "future" : d.actual < d.target ? "short" : ""}" style="height:${h}%"></i>
                <small>${d.label}</small><small class="plan">plan ${d.target}</small></div>`;
            }).join("")}
          </div>
          <div class="legend">
            <span><i style="background:var(--brand)"></i>Hit the day's plan</span>
            <span><i style="background:var(--warn)"></i>Below plan</span>
            <span><i style="background:#e3e8f0"></i>Days to come (plan)</span>
          </div>
        </div>
        ${experimentsSection(s.experiments)}
        <div class="section-head" style="margin-top:40px"><h2>Breakdown</h2></div>
        <div class="grid2">
          <div class="card"><h3>By channel</h3>${rankList(toItems(s.bySource))}<p class="note" style="margin:12px 0 0">“referral” means the student came through an invite link. Ambassador links use <code>?src=amb_name</code>.</p></div>
          <div class="card"><h3>Top colleges</h3>${rankList(toItems(s.byCollege), { color: "linear-gradient(90deg,#38bdf8,#0ea5e9)" })}</div>
          <div class="card"><h3>By branch</h3>${rankList(toItems(s.byBranch), { color: "linear-gradient(90deg,#a78bfa,#8b5cf6)" })}</div>
          <div class="card"><h3>Top inviters to reward</h3>
            ${rankList(s.top.map((r) => ({ label: r.name, sub: r.college, value: r.count })), { medals: true, color: "linear-gradient(90deg,#10b981,#059669)" })}
            <p class="note" style="margin:12px 0 0">${s.activeReferrers} student${s.activeReferrers === 1 ? " has" : "s have"} brought at least one friend.</p></div>
        </div>
      </section>`;
    $("#refresh").onclick = () => viewAdmin(id);
    $("#logout").onclick = () => { safeDel(sessionStorage, "admin_key"); viewAdmin(id); };
    $("#csv").onclick = async () => {
      try {
        const r = await must(api.export(key));
        const cols = ["ts", "name", "email", "phone", "college", "branch", "year", "code", "referredBy", "source"];
        const csv = [cols.join(","), ...r.rows.map((x) => cols.map((c) => `"${String(c === "ts" ? new Date(x.ts).toISOString() : x[c] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = "registrations.csv"; a.click();
      } catch (ex) { toast(ex.message); }
    };
  }

  // ---------- router ----------
  const nav = $(".nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    $("#menu-btn").setAttribute("aria-expanded", String(open));
    $("#menu-btn").setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  $("#menu-btn").addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  document.addEventListener("click", (e) => { if (nav.classList.contains("open") && !nav.contains(e.target)) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [page, arg] = h.split("/");
    const id = ++routeSeq;
    setMenu(false);
    window.Sim.stop();
    document.querySelectorAll("[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === page));
    if (page !== "register") safeDel(sessionStorage, "register_another");
    updateNavCta();
    const titles = { register: "Reserve your seat", me: "Your invite link", leaderboard: "Leaderboard", simulator: "Campaign Simulator", find: "Find my link", admin: "Organiser dashboard" };
    document.title = (titles[page] ? titles[page] + " · " : "") + "Build Your First AI Project in 60 Minutes";
    window.scrollTo(0, 0);
    const run =
      page === "me" && arg ? viewMe(id, arg.toUpperCase()) :
      page === "leaderboard" ? viewLeaderboard(id) :
      page === "simulator" ? window.Sim.view(app) :
      page === "find" ? viewFind(id) :
      page === "register" ? viewRegister(id) :
      page === "admin" ? viewAdmin(id) :
      viewHome(id);
    Promise.resolve(run).catch((e) => {
      console.error(e);
      if (isCurrent(id)) app.innerHTML = errorView(e.message);
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-retry]")) { route(); return; }
    const a = e.target.closest("[data-scroll]");
    if (!a) return;
    e.preventDefault();
    setMenu(false);
    const go = () => document.getElementById(a.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    const onHome = !location.hash || location.hash === "#/" || location.hash === "#";
    if (onHome) go();
    else { location.hash = "#/"; requestAnimationFrame(() => requestAnimationFrame(go)); }
  });

  window.addEventListener("hashchange", route);
  route();
  verifyRemembered();
})();

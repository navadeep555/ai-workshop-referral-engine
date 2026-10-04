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

  // ---------- utils ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normCollege = (s) => String(s || "").trim().replace(/\s+/g, " ");
  const normPhone = (s) => String(s || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  const { dayKey } = window.Analytics;
  const baseUrl = () => location.href.split(/[?#]/)[0];
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
    stats: (key) => call("stats", { key }),
    export: (key) => call("export", { key }),
  };

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

  // ---------- home ----------
  function viewHome(id) {
    app.innerHTML = `
      <div class="hero-band">
        <section class="wrap hero">
          <div>
            <span class="eyebrow">${icon("spark")} Free · Live · For final-year engineering students</span>
            <h1>Build your first <span class="grad">AI project</span> in 60 minutes.</h1>
            <p class="lede">Placement interviews now ask, “Have you built anything with AI?” In one live hour you'll build and deploy an
              <b>AI Resume Reviewer</b>, and leave with a public link and a GitHub repo for your resume.</p>
            <ul class="facts">
              <li>${icon("calendar")} ${esc(fmtDay)}, ${esc(fmtTime)} IST</li>
              <li>${icon("clock")} 60 minutes</li>
              <li>${icon("laptop")} Laptop + browser only</li>
              <li>${icon("tag")} Free</li>
            </ul>
            <div class="counter" id="counter">
              <div class="counter-top"><span><strong id="count" class="skeleton">000</strong>students registered</span><span id="seats">${C.GOAL} seats</span></div>
              <div class="bar"><i id="countbar" style="width:0"></i></div>
            </div>
            <a class="hero-link" href="#/simulator">${icon("chart")} See how the 7-day plan reaches ${C.GOAL} ${icon("arrow")}</a>
          </div>

          <div class="card form-card" id="register">
            <h2>Reserve your seat</h2>
            <p class="sub">Takes 30 seconds. You'll get your personal invite link straight away.</p>
            <div id="ref-slot"></div>
            <form id="regform" novalidate>
              <div class="field">
                <label for="f-name">Full name</label>
                <input id="f-name" name="name" autocomplete="name" placeholder="e.g. Navadeep Maka" aria-describedby="e-name" />
                <div class="field-err" id="e-name"></div>
              </div>
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
              <div class="field">
                <label for="f-college">College</label>
                <input id="f-college" name="college" list="colleges" autocomplete="organization" placeholder="Start typing your college" aria-describedby="e-college" />
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
                  <select id="f-year" name="year"><option>Final year</option><option>Pre-final year</option><option>Graduated (2025/26)</option><option>Other</option></select>
                </div>
              </div>
              <div class="form-alert" id="f-alert" role="alert"></div>
              <button class="btn btn-block" style="margin-top:18px" id="f-submit" type="submit">Register free ${icon("arrow")}</button>
              <p class="fine">We'll send the joining link and reminders on WhatsApp and email. No spam.</p>
            </form>
          </div>
        </section>
      </div>

      <section class="block">
        <div class="section-head"><h2>How it works</h2><p>Four steps from sign-up to a project on your resume.</p></div>
        <div class="steps">
          <div class="card step"><span class="step-num">01</span><div class="icon-tile">${icon("form")}</div><h3>Register in 30 seconds</h3><p>Fill in your name, email, WhatsApp number and college. It's free.</p></div>
          <div class="card step"><span class="step-num">02</span><div class="icon-tile">${icon("link")}</div><h3>Get your invite link</h3><p>Your personal link appears straight away. Share it on WhatsApp in one tap.</p></div>
          <div class="card step"><span class="step-num">03</span><div class="icon-tile">${icon("gift")}</div><h3>Unlock rewards</h3><p>Invite 1, 3 or 5 friends to unlock the prompt pack, priority Q&amp;A or a 1:1 review.</p></div>
          <div class="card step"><span class="step-num">04</span><div class="icon-tile">${icon("rocket")}</div><h3>Join live and build</h3><p>The joining link arrives on WhatsApp and email before ${esc(fmtDay)}, ${esc(fmtTime)}.</p></div>
        </div>
        <p class="note" style="margin-top:16px">Lost your invite link? <a href="#/find">Find it with your email or number</a>.</p>
      </section>

      <section class="block">
        <div class="section-head"><h2>What you walk away with</h2></div>
        <div class="grid3">
          <div class="card feature"><div class="icon-tile">${icon("rocket")}</div><h3>A deployed AI app</h3><p>A working AI Resume Reviewer with a public URL you can show a recruiter.</p></div>
          <div class="card feature"><div class="icon-tile">${icon("briefcase")}</div><h3>A resume line that holds up</h3><p>A GitHub repo plus a project description you can explain in an interview.</p></div>
          <div class="card feature"><div class="icon-tile">${icon("code")}</div><h3>Skills that carry over</h3><p>Prompting, calling an LLM API and shipping. You'll reuse these in every AI project after this one.</p></div>
        </div>
      </section>

      <section class="block grid2">
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
          <div><h2>Seats are free, but limited to ${C.GOAL}.</h2><p>Register now and bring your classmates along.</p></div>
          <a class="btn" href="#/" data-scroll="register">Reserve my seat ${icon("arrow")}</a>
        </div>
      </section>`;

    $("#regform").addEventListener("submit", onRegister);
    $("#regform").addEventListener("input", (e) => {
      if (e.target.getAttribute("aria-invalid") === "true") setFieldError(e.target.name, "");
    });

    // Social proof counter
    api.leaderboard().then((lb) => {
      if (!isCurrent(id)) return;
      if (!lb.ok) { $("#counter").hidden = true; return; }
      const count = $("#count");
      count.classList.remove("skeleton");
      count.textContent = lb.total;
      $("#seats").textContent = `${Math.max(0, C.GOAL - lb.total)} seats left`;
      requestAnimationFrame(() => { $("#countbar").style.width = Math.max(2, Math.min(100, (lb.total / C.GOAL) * 100)) + "%"; });
    }).catch(() => { if (isCurrent(id)) $("#counter").hidden = true; });

    // Who invited this visitor (shown without blocking the page)
    const { ref } = attribution();
    if (ref) {
      api.me(ref).then((m) => {
        if (!isCurrent(id) || !m.ok) return;
        $("#ref-slot").innerHTML = `<div class="ref-note">${icon("users")}<span><b>${esc(m.name)}</b> invited you. Sign up and you'll both move up the leaderboard.</span></div>`;
      }).catch(() => {});
    }
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
    return errs;
  }

  async function onRegister(e) {
    e.preventDefault();
    const f = e.target, btn = $("#f-submit"), alertBox = $("#f-alert");
    const d = Object.fromEntries(new FormData(f));
    d.name = String(d.name || "").trim();
    d.email = String(d.email || "").trim().toLowerCase();
    d.phone = normPhone(d.phone);
    d.college = normCollege(d.college);

    const errs = validate(d);
    ["name", "email", "phone", "college", "branch"].forEach((k) => setFieldError(k, errs[k] || ""));
    alertBox.textContent = "";
    const firstBad = Object.keys(errs)[0];
    if (firstBad) { $(`#regform [name="${firstBad}"]`).focus(); return; }

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Reserving your seat…`;
    try {
      const res = await must(api.register({ ...d, ...attribution() }));
      safeSet(localStorage, "my_code", res.code);
      if (res.existing) toast("You're already registered. Here's your invite link.");
      location.hash = `#/me/${res.code}`;
    } catch (ex) {
      alertBox.textContent = ex.message || "Something went wrong. Please try again.";
      btn.disabled = false;
      btn.innerHTML = `Register free ${icon("arrow")}`;
    }
  }

  // ---------- personal invite page ----------
  async function viewMe(id, code) {
    app.innerHTML = loadingView(6);
    let m;
    try { m = await api.me(code); } catch (e) { if (isCurrent(id)) app.innerHTML = errorView(e.message); return; }
    if (!isCurrent(id)) return;
    if (!m.ok) {
      app.innerHTML = `<div class="narrow"><div class="card state">
        <div class="icon-tile">${icon("search")}</div><h2>We couldn't find that invite link</h2>
        <p>Check the code, or look it up with the email or number you registered with.</p>
        <a class="btn" href="#/find">Find my link</a></div></div>`;
      return;
    }
    const link = inviteLink(m.code);
    const msg =
      `Hey! I just signed up for a FREE live workshop: "${C.WORKSHOP_TITLE}" 🚀\n\n` +
      `In 60 minutes we build and deploy an AI Resume Reviewer. It's a real project for our resumes before placements.\n` +
      `📅 ${fmtDate}\n\nRegister with my link (it's free): ${link}`;
    const next = C.REWARDS.find((t) => m.referrals < t.at);
    const prevAt = [...C.REWARDS].reverse().find((t) => m.referrals >= t.at)?.at || 0;
    const pct = next ? ((m.referrals - prevAt) / (next.at - prevAt)) * 100 : 100;

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
          <h3>Bring your friends</h3>
          <p class="muted" style="margin-bottom:0">Classmates who join through your link count towards your rewards and push your college up the leaderboard.</p>
          <div class="linkbox">
            <div class="link-text" id="mylink">${esc(link)}</div>
            <button class="btn btn-ghost" id="copy" type="button">${icon("copy")} Copy link</button>
          </div>
          <div class="share-row">
            <a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">${WA_ICON} Share on WhatsApp</a>
            <a class="btn btn-li" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}">${LI_ICON} Share on LinkedIn</a>
          </div>

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
          <div><h2>Put your college on the board.</h2><p>Register, then share your invite link with your class group.</p></div>
          <a class="btn" href="#/" data-scroll="register">Register free ${icon("arrow")}</a>
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
        <div class="grid2" style="margin-top:16px">
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
    const titles = { me: "Your invite link", leaderboard: "Leaderboard", simulator: "Campaign Simulator", find: "Find my link", admin: "Organiser dashboard" };
    document.title = (titles[page] ? titles[page] + " · " : "") + "Build Your First AI Project in 60 Minutes";
    window.scrollTo(0, 0);
    const run =
      page === "me" && arg ? viewMe(id, arg.toUpperCase()) :
      page === "leaderboard" ? viewLeaderboard(id) :
      page === "simulator" ? window.Sim.view(app) :
      page === "find" ? viewFind(id) :
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
    const go = () => {
      const el = document.getElementById(a.dataset.scroll);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => $("#f-name")?.focus({ preventScroll: true }), 450);
    };
    const onHome = !location.hash || location.hash === "#/" || location.hash === "#";
    if (onHome) go();
    else { location.hash = "#/"; requestAnimationFrame(() => requestAnimationFrame(go)); }
  });

  window.addEventListener("hashchange", route);
  route();
})();

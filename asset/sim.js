/* Campaign Simulator: runs the growth plan as an agent-based model.
 * Every dot is one registration. Ambassadors seed their college's WhatsApp groups,
 * organic posts add a trickle, and each registrant may invite friends who join 1–2 days later.
 */
(function () {
  "use strict";

  const PLAN_CUM = [40, 100, 170, 250, 340, 430, 500];
  const REACH_PROFILE = [0.08, 0.22, 0.2, 0.16, 0.14, 0.12, 0.08]; // share of an ambassador's reach converting each day
  const ORGANIC_PROFILE = [0.05, 0.1, 0.15, 0.2, 0.2, 0.15, 0.15];
  const COLLEGES = ["Amrita CBE", "JNTU-H", "PSG Tech", "CBIT", "SSN", "VNR VJIET", "Kumaraguru", "KL Univ",
    "CEG Anna Univ", "GRIET", "CIT", "VIT-AP", "SRM", "Vasavi", "SKCET", "GITAM"];
  const COLORS = { ambassador: "#4f46e5", referral: "#16a34a", organic: "#0ea5e9", boost: "#f59e0b" };
  const LABELS = { ambassador: "Ambassadors", referral: "Friend invites", organic: "Organic social", boost: "₹400 boost" };

  const PRESETS = {
    plan: { label: "My plan", amb: 25, reach: 210, conv: 5, share: 30, friends: 1.3, organic: 100, boost: true },
    pess: { label: "Pessimistic", amb: 15, reach: 160, conv: 3, share: 20, friends: 1.0, organic: 60, boost: true },
    noref: { label: "No referral loop", amb: 25, reach: 210, conv: 5, share: 0, friends: 1.3, organic: 100, boost: true },
  };
  const SLIDERS = [
    { k: "amb", label: "Campus ambassadors", min: 5, max: 50, step: 1, fmt: (v) => v },
    { k: "reach", label: "Students reached per ambassador", min: 50, max: 400, step: 10, fmt: (v) => v },
    { k: "conv", label: "Reach → registration", min: 1, max: 10, step: 0.5, fmt: (v) => v + "%" },
    { k: "share", label: "Registrants who share their link", min: 0, max: 60, step: 5, fmt: (v) => v + "%" },
    { k: "friends", label: "Friends who join per sharer", min: 0.5, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) },
    { k: "organic", label: "Organic social registrations", min: 0, max: 200, step: 10, fmt: (v) => v },
  ];

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const sround = (x, r) => Math.floor(x) + (r() < x - Math.floor(x) ? 1 : 0);

  // ---------- model ----------
  function simulate(p, seed = 7) {
    const r = rng(seed);
    const nCol = Math.min(COLLEGES.length, Math.max(4, Math.round(p.amb * 0.65)));
    const ambCollege = Array.from({ length: p.amb }, (_, i) => i % nCol);
    const nodes = [];
    const pending = Array.from({ length: 10 }, () => []);
    const days = [];

    const add = (day, ch, college, parent) => {
      const n = { id: nodes.length, day, ch, college, parent, t: r() };
      nodes.push(n);
      if (r() < p.share / 100) {
        const f = sround(p.friends, r);
        for (let i = 0; i < f; i++) pending[day + (r() < 0.7 ? 1 : 2)].push(n);
      }
      return n;
    };

    for (let d = 1; d <= 7; d++) {
      const before = nodes.length;
      const counts = { ambassador: 0, organic: 0, referral: 0, boost: 0 };
      // ambassadors
      const amb = sround(p.amb * p.reach * (p.conv / 100) * REACH_PROFILE[d - 1], r);
      for (let i = 0; i < amb; i++) { add(d, "ambassador", ambCollege[Math.floor(r() * p.amb)], null); counts.ambassador++; }
      // organic
      const org = sround(p.organic * ORGANIC_PROFILE[d - 1], r);
      for (let i = 0; i < org; i++) { add(d, "organic", Math.floor(r() * nCol), null); counts.organic++; }
      // contingency boost: only if behind plan going into day 5
      if (p.boost && (d === 5 || d === 6) && days[3] && days[3].cum < PLAN_CUM[3]) {
        for (let i = 0; i < 15; i++) { add(d, "boost", Math.floor(r() * nCol), null); counts.boost++; }
      }
      // friends invited by earlier registrants
      pending[d].forEach((parent) => {
        add(d, "referral", r() < 0.7 ? parent.college : Math.floor(r() * nCol), parent);
        counts.referral++;
      });
      days.push({ day: d, ...counts, added: nodes.length - before, cum: nodes.length });
    }
    const hitDay = days.find((x) => x.cum >= 500);
    return { nodes, days, nCol, total: nodes.length, hitDay: hitDay ? hitDay.day : null };
  }

  function biggestLever(p) {
    const base = simulate(p).total;
    const tests = [
      ["amb", "Recruit 20% more ambassadors", (v) => Math.round(v * 1.2)],
      ["conv", "Make the invite message convert 20% better", (v) => v * 1.2],
      ["share", "Get 20% more registrants sharing", (v) => (v || 5) * 1.2],
      ["reach", "Have each ambassador reach 20% more groups", (v) => v * 1.2],
    ];
    return tests.map(([k, label, fn]) => ({ label, gain: simulate({ ...p, [k]: fn(p[k]) }).total - base }))
      .sort((a, b) => b.gain - a.gain);
  }

  // ---------- view ----------
  let raf = 0;
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  function view(app) {
    stop();
    const p = { ...PRESETS.plan };
    app.innerHTML = `
      <section class="block">
        <span class="eyebrow">Interactive growth model</span>
        <h1>Campaign Simulator</h1>
        <p class="lede">Every dot is one student registering. Watch the 7-day plan play out, then change the assumptions and see whether we still reach <b>500</b>.</p>
        <div class="sim">
          <div class="card sim-controls">
            <div class="presets" role="group" aria-label="Scenarios">
              ${Object.entries(PRESETS).map(([k, v]) => `<button type="button" class="chip${k === "plan" ? " on" : ""}" data-preset="${k}">${v.label}</button>`).join("")}
            </div>
            ${SLIDERS.map((s) => `
              <div class="slider">
                <div class="slider-top"><label for="s-${s.k}">${s.label}</label><output id="o-${s.k}"></output></div>
                <input type="range" id="s-${s.k}" data-k="${s.k}" min="${s.min}" max="${s.max}" step="${s.step}" />
              </div>`).join("")}
            <label class="check"><input type="checkbox" id="s-boost" /> Use ₹400 boost if behind plan on Day 5</label>
            <button class="btn btn-block" id="run" style="margin-top:14px">▶ Run 7-day campaign</button>
          </div>
          <div class="card sim-stage">
            <div class="stage-head">
              <div><small class="note">Day</small><div class="stage-day" id="st-day">0</div></div>
              <div style="text-align:right"><small class="note">Registrations</small><div class="stage-count"><span id="st-count">0</span><span class="note"> / 500</span></div></div>
            </div>
            <canvas id="net" aria-label="Network of registrations clustered by college"></canvas>
            <div class="legend">${Object.entries(LABELS).map(([k, v]) => `<span><i style="background:${COLORS[k]}"></i>${v}</span>`).join("")}<span><i class="edge"></i>invited by</span></div>
          </div>
        </div>
        <div class="grid2" style="margin-top:16px">
          <div class="card"><h3>Cumulative registrations vs plan</h3><div id="sim-chart"></div></div>
          <div class="card"><h3>Result</h3><div id="sim-result"><p class="note">Press <b>Run</b> to play the campaign.</p></div></div>
        </div>
      </section>`;

    const canvas = document.getElementById("net");
    const ctx = canvas.getContext("2d");
    let layout = null, result = null, shownDays = 0;

    function syncInputs() {
      SLIDERS.forEach((s) => {
        document.getElementById("s-" + s.k).value = p[s.k];
        document.getElementById("o-" + s.k).textContent = s.fmt(+p[s.k]);
      });
      document.getElementById("s-boost").checked = p.boost;
    }

    function size() {
      const w = canvas.parentElement.clientWidth - 48;
      const h = Math.max(300, Math.min(460, w * 0.78));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }

    function computeLayout(res) {
      const { w, h } = size();
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.36;
      const centers = Array.from({ length: res.nCol }, (_, i) => {
        const a = (i / res.nCol) * Math.PI * 2 - Math.PI / 2;
        return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
      });
      const filled = new Array(res.nCol).fill(0);
      const spacing = Math.max(2.6, Math.min(4, (Math.PI * R / res.nCol) / 9));
      const pos = res.nodes.map((n) => {
        const i = filled[n.college]++;
        const a = i * 2.39996, rr = spacing * Math.sqrt(i + 0.5);
        return { x: centers[n.college].x + Math.cos(a) * rr, y: centers[n.college].y + Math.sin(a) * rr };
      });
      return { w, h, centers, pos, sizes: filled };
    }

    function draw(elapsedDays) {
      shownDays = elapsedDays;
      const { w, h, centers, pos, sizes } = layout;
      ctx.clearRect(0, 0, w, h);
      const visible = (n) => n.day - 1 + n.t * 0.95 <= elapsedDays;
      // college labels for the biggest clusters
      const top = sizes.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, 6).map((x) => x[1]);
      ctx.font = "600 11px Inter, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#5b6478";
      centers.forEach((c, i) => {
        const dx = c.x - w / 2, dy = c.y - h / 2, len = Math.hypot(dx, dy) || 1;
        const off = Math.sqrt(sizes[i]) * 3.4 + 14;
        if (top.includes(i) && elapsedDays > 0.5) ctx.fillText(COLLEGES[i], c.x + (dx / len) * off, c.y + (dy / len) * off + 4);
      });
      // invite edges
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(22,163,74,.28)";
      ctx.beginPath();
      result.nodes.forEach((n) => {
        if (n.parent && visible(n)) { const a = pos[n.parent.id], b = pos[n.id]; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
      });
      ctx.stroke();
      // nodes
      result.nodes.forEach((n) => {
        const appear = n.day - 1 + n.t * 0.95;
        if (appear > elapsedDays) return;
        const age = elapsedDays - appear;
        const rad = age < 0.12 ? 2.4 + (0.12 - age) * 30 : 2.4;
        ctx.globalAlpha = age < 0.12 ? 0.6 : 1;
        ctx.fillStyle = COLORS[n.ch];
        ctx.beginPath(); ctx.arc(pos[n.id].x, pos[n.id].y, rad, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function chart(res, upto) {
      const W = 520, H = 210, pad = 30, max = Math.max(560, res.total + 40);
      const x = (d) => pad + (d / 7) * (W - pad - 10), y = (v) => H - pad - (v / max) * (H - pad - 12);
      const actual = [[0, 0], ...res.days.filter((d) => d.day <= upto).map((d) => [d.day, d.cum])];
      const plan = [[0, 0], ...PLAN_CUM.map((v, i) => [i + 1, v])];
      const line = (pts) => pts.map(([d, v]) => `${x(d).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
      document.getElementById("sim-chart").innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Cumulative registrations against plan">
          <line x1="${pad}" x2="${W - 10}" y1="${y(500)}" y2="${y(500)}" stroke="#e4e7ef" stroke-dasharray="3 3"/>
          <text x="${W - 12}" y="${y(500) - 5}" text-anchor="end" font-size="11" fill="#5b6478">goal 500</text>
          ${[1, 2, 3, 4, 5, 6, 7].map((d) => `<text x="${x(d)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="#5b6478">D${d}</text>`).join("")}
          <polyline points="${line(plan)}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 4"/>
          <polyline points="${line(actual)}" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linejoin="round"/>
          ${actual.slice(1).map(([d, v]) => `<circle cx="${x(d)}" cy="${y(v)}" r="3.5" fill="#4f46e5"/>`).join("")}
        </svg>
        <div class="legend"><span><i style="background:#4f46e5"></i>Simulated</span><span><i class="dash"></i>Plan</span></div>`;
    }

    function showResult(res) {
      const tot = { ambassador: 0, referral: 0, organic: 0, boost: 0 };
      res.days.forEach((d) => Object.keys(tot).forEach((k) => (tot[k] += d[k])));
      const max = Math.max(...Object.values(tot), 1);
      const seeded = res.total - tot.referral;
      const lever = biggestLever(p)[0];
      const ok = res.total >= 500;
      document.getElementById("sim-result").innerHTML = `
        <div class="verdict ${ok ? "ok" : "bad"}">${ok ? `✅ Reaches 500 on <b>Day ${res.hitDay}</b> with ${res.total} registrations` : `⚠️ Falls short: <b>${res.total}</b> registrations, <b>${500 - res.total}</b> below the goal`}</div>
        ${Object.entries(tot).filter(([, v]) => v).map(([k, v]) => `<div class="hbar"><span>${LABELS[k]}</span><div class="bar"><i style="width:${(v / max) * 100}%;background:${COLORS[k]}"></i></div><span>${v}</span></div>`).join("")}
        <p class="note" style="margin-top:10px">Each student who signed up without an invite brought in <b>${(tot.referral / Math.max(1, seeded)).toFixed(2)}</b> more through invites.</p>
        <div class="lever"><small>Biggest lever right now</small><b>${lever.label}</b><span>+${lever.gain} registrations</span></div>`;
    }

    function run() {
      stop();
      result = simulate(p);
      layout = computeLayout(result);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const msPerDay = reduce ? 0 : 1500;
      const t0 = performance.now();
      const dayEl = document.getElementById("st-day"), countEl = document.getElementById("st-count");
      document.getElementById("sim-result").innerHTML = `<p class="note">Campaign running…</p>`;
      const frame = (now) => {
        const el = msPerDay ? Math.min(7, (now - t0) / msPerDay) : 7;
        draw(el);
        const shown = result.nodes.filter((n) => n.day - 1 + n.t * 0.95 <= el).length;
        countEl.textContent = shown;
        countEl.style.color = shown >= 500 ? "var(--accent)" : "";
        dayEl.textContent = Math.min(7, Math.floor(el) + 1);
        chart(result, Math.floor(el));
        if (el < 7) raf = requestAnimationFrame(frame);
        else { raf = 0; chart(result, 7); showResult(result); }
      };
      raf = requestAnimationFrame(frame);
    }

    // instant preview without animation when a slider moves
    function preview() {
      stop();
      result = simulate(p);
      layout = computeLayout(result);
      draw(7);
      document.getElementById("st-day").textContent = 7;
      const c = document.getElementById("st-count");
      c.textContent = result.total; c.style.color = result.total >= 500 ? "var(--accent)" : "";
      chart(result, 7); showResult(result);
    }

    app.querySelectorAll("input[type=range]").forEach((inp) => inp.addEventListener("input", () => {
      p[inp.dataset.k] = +inp.value;
      app.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
      syncInputs(); preview();
    }));
    document.getElementById("s-boost").onchange = (e) => { p.boost = e.target.checked; preview(); };
    app.querySelectorAll(".chip").forEach((c) => c.onclick = () => {
      Object.assign(p, PRESETS[c.dataset.preset]);
      app.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === c));
      syncInputs(); run();
    });
    document.getElementById("run").onclick = run;

    syncInputs();
    result = simulate(p); layout = computeLayout(result); draw(0); chart(result, 0);
    let resizeT;
    window.addEventListener("resize", function onR() {
      if (!document.getElementById("net")) return window.removeEventListener("resize", onR);
      clearTimeout(resizeT); resizeT = setTimeout(() => { layout = computeLayout(result); if (!raf) draw(shownDays); }, 150);
    });
  }

  window.Sim = { view, stop, simulate };
})();

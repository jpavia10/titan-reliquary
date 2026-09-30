/* TITAN ORBIT widgets: starfield parallax, Saturn logo, Saturn progress rings, orbital globe on World. */
(() => {
  "use strict";
  const FX = window.TITAN_FX, T = window.TITAN;
  if (!FX || !T) return;
  const RM = FX.RM;
  const PHONE = window.matchMedia("(max-width: 700px)").matches;

  /* ---------- starfield (3 depth layers, parallax on scroll + pointer) ---------- */
  (function stars() {
    if (document.getElementById("orb-stars")) return;
    const cv = document.createElement("canvas");
    cv.id = "orb-stars"; cv.setAttribute("aria-hidden", "true");
    document.body.prepend(cv);
    let W = 0, H = 0, ctx;
    const N = PHONE ? 70 : 130;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const S = Array.from({ length: N }, (_, i) => ({
      x: rnd(), y: rnd(), z: i % 3, r: 0.4 + rnd() * (i % 3 === 2 ? 1.5 : 0.9), p: rnd() * 6.28,
      c: rnd() < 0.18 ? "255,196,130" : rnd() < 0.3 ? "196,176,255" : "235,235,255",
    }));
    function fit() { ({ ctx, w: W, h: H } = FX.canvasFit(cv, window.innerHeight)); draw(performance.now()); }
    let px = 0, py = 0, tx = 0, ty = 0;
    function draw(now) {
      if (!ctx) return;
      px += (tx - px) * 0.08; py += (ty - py) * 0.08;
      const sy = window.scrollY || 0;
      ctx.clearRect(0, 0, W, H);
      for (const s of S) {
        const k = [0.02, 0.06, 0.14][s.z];
        let x = (s.x * W + px * k * 40) % W, y = (s.y * H - sy * k + py * k * 40) % H;
        if (x < 0) x += W; if (y < 0) y += H;
        const a = RM ? 0.7 : 0.45 + 0.4 * Math.sin(now / 900 + s.p);
        ctx.fillStyle = `rgba(${s.c},${a.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill();
      }
    }
    fit();
    window.addEventListener("resize", fit);
    if (RM) { window.addEventListener("scroll", () => requestAnimationFrame(draw), { passive: true }); return; }
    if (!PHONE) window.addEventListener("pointermove", (e) => { tx = e.clientX / W - 0.5; ty = e.clientY / H - 0.5; }, { passive: true });
    FX.loop(cv, draw, PHONE ? 20 : 30);
  })();

  /* ---------- Saturn logo ---------- */
  const coin = document.querySelector(".brand .coin");
  if (coin && !coin.querySelector("svg")) {
    coin.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true">
      <defs><radialGradient id="orbPl" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ffe2b8"/><stop offset=".55" stop-color="#ff9f4a"/><stop offset="1" stop-color="#7a3a1a"/></radialGradient>
      <linearGradient id="orbRg" x1="0" x2="1"><stop offset="0" stop-color="#c9b6ff" stop-opacity=".2"/><stop offset=".5" stop-color="#ffd9a8"/><stop offset="1" stop-color="#a78bfa" stop-opacity=".3"/></linearGradient></defs>
      <g transform="rotate(-18 32 32)">
        <ellipse cx="32" cy="32" rx="29" ry="8" fill="none" stroke="url(#orbRg)" stroke-width="2.4" opacity=".55"/>
        <circle cx="32" cy="32" r="14" fill="url(#orbPl)"/>
        <path d="M3 32a29 8 0 0 0 58 0" fill="none" stroke="url(#orbRg)" stroke-width="2.4"/>
        <circle class="orb-moon" cx="58" cy="30" r="2.2" fill="#ffcf8a"/>
      </g></svg>`;
    if (!RM) {
      const m = coin.querySelector(".orb-moon"); const t0 = performance.now();
      FX.loop(coin, (now) => {
        const a = ((now - t0) / 6000) * 6.283;
        m.setAttribute("cx", (32 + 29 * Math.cos(a)).toFixed(2)); m.setAttribute("cy", (32 + 8 * Math.sin(a)).toFixed(2));
        m.setAttribute("opacity", Math.sin(a) < 0 && Math.abs(Math.cos(a)) < 0.48 ? "0" : "1");
      }, 30);
    }
  }

  /* ---------- Saturn progress rings on the board ---------- */
  function ringSvg(pct, label, id) {
    const r = 40, C = 2 * Math.PI * r, off = C * (1 - pct / 100);
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#ffb35c"/></linearGradient></defs>
      <ellipse cx="50" cy="50" rx="49" ry="13" fill="none" stroke="rgba(255,179,92,.28)" stroke-width="1.2" transform="rotate(-20 50 50)"/>
      <circle cx="50" cy="50" r="${r}" fill="rgba(10,8,30,.55)" stroke="rgba(167,139,250,.18)" stroke-width="7"/>
      <circle class="arc" cx="50" cy="50" r="${r}" fill="none" stroke="url(#${id})" stroke-width="7" stroke-linecap="round"
        stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${RM ? off.toFixed(2) : C.toFixed(2)}" data-off="${off.toFixed(2)}" transform="rotate(-90 50 50)"/>
      <text class="pct" x="50" y="53" text-anchor="middle">${pct < 10 && pct > 0 ? pct.toFixed(1) : Math.round(pct)}%</text>
      <text class="lbl" x="50" y="65" text-anchor="middle">${label}</text></svg>`;
  }
  function decorateBoard() {
    const pane = document.getElementById("pane-board"); if (!pane) return;
    const g = pane.querySelector(":scope > .grid"); if (g) g.classList.add("orb-stats");
    pane.querySelectorAll(".card .progress-wrap").forEach((pw, i) => {
      const card = pw.closest(".card"); if (!card || card.querySelector(".orb-ring")) return;
      const sp = pw.querySelector(".progress > span");
      const pct = Math.max(0, Math.min(100, parseFloat(sp && sp.style.width) || 0));
      const isPhoto = !!card.querySelector("#go-phase2");
      const el = document.createElement("div"); el.className = "orb-ring";
      el.title = pw.querySelector(".progress")?.title || "";
      el.innerHTML = ringSvg(pct, isPhoto ? "PHASE 2" : "SOFT CAP", "orbG" + i);
      card.classList.add("has-ring"); card.appendChild(el);
      if (!RM) setTimeout(() => { const a = el.querySelector(".arc"); a.style.strokeDashoffset = a.dataset.off; }, 250 + i * 150);
    });
    if (!PHONE && !RM) pane.querySelectorAll(".grid > .card").forEach((c) => {
      if (c.dataset.orbGlow) return; c.dataset.orbGlow = "1";
      c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); c.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%"); c.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%"); });
    });
  }

  /* ---------- orbital globe on World ---------- */
  const GEO = { DE:[51.2,10.4],GB:[54,-2.5],FR:[46.6,2.4],CH:[46.8,8.2],IT:[42.8,12.6],NL:[52.2,5.3],MX:[23.6,-102.5],US:[39.5,-98.4],
    KY:[19.3,-81.3],JM:[18.1,-77.3],SU:[55.8,37.6],AU:[-25.3,133.8],IE:[53.3,-8],JP:[36.2,138.3],MT:[35.9,14.4],ES:[40.2,-3.7],
    GR:[39.1,22],GT:[15.7,-90.3],PH:[12.9,121.8],SG:[1.35,103.8],KR:[36.4,127.9],TT:[10.5,-61.3],VN:[16,107.8],YU:[44.8,20.5],
    BR:[-14.2,-51.9],CA:[56.1,-106.3],CL:[-35.7,-71.5],CO:[4.6,-74.1],CR:[9.7,-83.8],CU:[21.5,-79.5],EC:[17.3,-62.7],ER:[15.2,39.8],
    HK:[22.3,114.2],HU:[47.2,19.5],IN:[21,78.9],NG:[9.1,8.7],NO:[61.5,8.5],PT:[39.6,-8],SA:[23.9,45.1],SK:[48.7,19.7],SE:[62,15],
    TW:[23.7,121],TH:[15.9,101],TR:[39,35.2],VA:[41.9,12.45] };
  const D2R = Math.PI / 180;
  const G = { lon: -20, lat: 22, tLon: null, idle: 0, land: null, landReq: false };
  function loadLand() {
    if (G.landReq) return; G.landReq = true;
    fetch(`themes/land.json?v=${window.TITAN_BUILD || ""}`).then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (Array.isArray(j)) G.land = j.map((a) => { const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] / 5 * D2R; return o; });
    }).catch(() => {});
  }
  function buildGlobe() {
    const pane = document.getElementById("pane-world"); const v = T.vault;
    if (!pane || !v || pane.querySelector(".orb-map")) return;
    loadLand();
    const nodes = (v.world || []).filter((w) => GEO[w.iso]).map((w) => ({ iso: w.iso, name: w.country, n: +w.count || 0, la: GEO[w.iso][0] * D2R, lo: GEO[w.iso][1] * D2R }));
    const total = nodes.reduce((t, x) => t + x.n, 0);
    const card = document.createElement("div"); card.className = "card orb-map";
    card.innerHTML = `<h3>Orbital map</h3><canvas aria-label="Globe of countries in the collection"></canvas>
      <div class="orb-legend"><span><b>${T.intFmt(nodes.length)}</b> sectors · <b>${T.intFmt(total)}</b> flips</span><span>Drag to rotate · tap a glowing node to open that country</span></div>`;
    const tb = pane.querySelector(".toolbar"); tb ? tb.after(card) : pane.prepend(card);
    const cv = card.querySelector("canvas");
    let ctx = null, W = 0, H = 0, drag = null;
    const vis = [];
    const fit = () => { if (!cv.clientWidth) return; ({ ctx, w: W, h: H } = FX.canvasFit(cv)); frame(performance.now(), true); };
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(cv); else fit();
    const sel = () => T.worldSel;
    { const s = nodes.find((x) => x.iso === sel()); if (s) G.tLon = s.lo / D2R; }
    let last = performance.now(), hover = null;
    function proj(la, lo, R, cx, cy, sl0, cl0, l0) {
      const cl = Math.cos(la), d = lo - l0, cd = Math.cos(d);
      const z = sl0 * Math.sin(la) + cl0 * cl * cd;
      return [cx + R * cl * Math.sin(d), cy - R * (cl0 * Math.sin(la) - sl0 * cl * cd), z];
    }
    function frame(now, force) {
      if (!ctx || !W) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (G.tLon != null) {
        let d = ((G.tLon - G.lon + 540) % 360) - 180;
        if (RM || Math.abs(d) < 0.3) { G.lon = G.tLon; G.tLon = null; } else G.lon += d * Math.min(1, dt * 3);
      } else if (!RM && !drag && now > G.idle && !sel()) G.lon = (G.lon + dt * 5 + 540) % 360 - 180;
      const R = Math.min(W * 0.45, H * 0.46), cx = W / 2, cy = H / 2;
      const l0 = G.lon * D2R, la0 = G.lat * D2R, sl0 = Math.sin(la0), cl0 = Math.cos(la0);
      ctx.clearRect(0, 0, W, H);
      // atmosphere + disc
      let g = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.22);
      g.addColorStop(0, "rgba(255,160,70,0.35)"); g.addColorStop(0.4, "rgba(167,139,250,0.12)"); g.addColorStop(1, "rgba(167,139,250,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, 6.283); ctx.fill();
      g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, "#2d2466"); g.addColorStop(0.7, "#140f38"); g.addColorStop(1, "#0a0820");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
      // orbit ring (back half)
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.33);
      ctx.strokeStyle = "rgba(255,179,92,0.22)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, 0, R * 1.42, R * 0.3, 0, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.restore();
      // graticule
      ctx.strokeStyle = "rgba(167,139,250,0.16)"; ctx.lineWidth = 0.7; ctx.beginPath();
      const seg = (pts) => { let pen = false; for (const [a, b] of pts) { const p = proj(a, b, R, cx, cy, sl0, cl0, l0); if (p[2] > 0) { pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } else pen = false; } };
      for (let lo = -180; lo < 180; lo += 30) { const pts = []; for (let la = -80; la <= 80; la += 5) pts.push([la * D2R, lo * D2R]); seg(pts); }
      for (let la = -60; la <= 60; la += 30) { const pts = []; for (let lo = -180; lo <= 180; lo += 5) pts.push([la * D2R, lo * D2R]); seg(pts); }
      ctx.stroke();
      // coastlines
      if (G.land) {
        ctx.strokeStyle = "rgba(255,200,140,0.55)"; ctx.lineWidth = 0.9; ctx.beginPath();
        for (const a of G.land) {
          let pen = false;
          for (let i = 0; i < a.length; i += 2) {
            const la = a[i + 1], lo = a[i], cl = Math.cos(la), d = lo - l0, cd = Math.cos(d);
            if (sl0 * Math.sin(la) + cl0 * cl * cd > 0) {
              const x = cx + R * cl * Math.sin(d), y = cy - R * (cl0 * Math.sin(la) - sl0 * cl * cd);
              pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
            } else pen = false;
          }
        }
        ctx.stroke();
      }
      // limb highlight
      ctx.strokeStyle = "rgba(255,190,120,0.45)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();
      // nodes
      const pulse = RM ? 0.5 : (Math.sin(now / 500) + 1) / 2, s = sel();
      vis.length = 0;
      for (const nd of nodes) {
        const p = proj(nd.la, nd.lo, R, cx, cy, sl0, cl0, l0); if (p[2] <= 0.02) continue;
        const r = 2.2 + Math.sqrt(nd.n) * 1.25, on = nd.iso === s, hv = hover === nd.iso;
        const fade = Math.min(1, p[2] * 3);
        const gl = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 3.2);
        gl.addColorStop(0, on ? `rgba(126,240,193,${0.7 * fade})` : `rgba(255,179,92,${0.55 * fade})`); gl.addColorStop(1, "rgba(255,179,92,0)");
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p[0], p[1], r * 3.2, 0, 6.283); ctx.fill();
        ctx.fillStyle = on ? "#b9ffe2" : hv ? "#fff" : `rgba(255,222,180,${fade})`;
        ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.283); ctx.fill();
        if (on) { ctx.strokeStyle = `rgba(126,240,193,${0.9 - pulse * 0.6})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p[0], p[1], r + 4 + pulse * 7, 0, 6.283); ctx.stroke(); }
        vis.push({ iso: nd.iso, x: p[0], y: p[1], r, n: nd.n, name: nd.name, on, hv, fade });
      }
      // labels: selected/hovered first, then by count; skip any that would overlap
      const boxes = [];
      const lab = vis.filter((n) => n.on || n.hv || n.n >= 4).sort((a, b) => (b.on || b.hv) - (a.on || a.hv) || b.n - a.n);
      for (const n of lab) {
        const big = n.on || n.hv, txt = `${big ? n.name : n.iso} ${n.n}`;
        ctx.font = `600 ${big ? 12 : 10.5}px Orbitron, sans-serif`;
        const tw = ctx.measureText(txt).width, bx = n.x + n.r + 5, by = n.y - 8, bw = tw + 4, bh = 14;
        if (boxes.some((b) => bx < b[0] + b[2] && bx + bw > b[0] && by < b[1] + b[3] && by + bh > b[1])) continue;
        boxes.push([bx, by, bw, bh]);
        if (big) { ctx.fillStyle = "rgba(10,8,30,0.7)"; ctx.fillRect(bx - 3, by - 1, bw + 4, bh + 2); }
        ctx.fillStyle = big ? "#fff" : `rgba(241,236,255,${0.88 * n.fade})`; ctx.fillText(txt, bx, n.y + 4);
      }
      // orbit ring (front half) with a moon
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.33);
      ctx.strokeStyle = "rgba(255,179,92,0.45)"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, R * 1.42, R * 0.3, 0, 0, Math.PI); ctx.stroke();
      const ma = RM ? 0.8 : now / 4000;
      const mx = Math.cos(ma) * R * 1.42, my = Math.sin(ma) * R * 0.3;
      if (my > 0 || Math.abs(mx) > R) { ctx.fillStyle = "#ffcf8a"; ctx.beginPath(); ctx.arc(mx, my, 3.2, 0, 6.283); ctx.fill(); }
      ctx.restore();
    }
    const pick = (x, y) => { let best = null, bd = 1e9; for (const n of vis) { const d = Math.hypot(n.x - x, n.y - y); if (d < Math.max(18, n.r + 10) && d < bd) { bd = d; best = n; } } return best; };
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("pointerdown", (e) => { const [x, y] = pos(e); drag = { x, y, lon: G.lon, lat: G.lat, moved: 0 }; cv.setPointerCapture(e.pointerId); G.tLon = null; });
    cv.addEventListener("pointermove", (e) => {
      const [x, y] = pos(e);
      if (drag) {
        drag.moved = Math.max(drag.moved, Math.hypot(x - drag.x, y - drag.y));
        G.lon = drag.lon - (x - drag.x) * 0.35; G.lat = Math.max(-60, Math.min(70, drag.lat + (y - drag.y) * 0.3));
        if (RM) frame(performance.now());
      } else if (e.pointerType === "mouse") { const n = pick(x, y); const h = n ? n.iso : null; if (h !== hover) { hover = h; cv.style.cursor = h ? "pointer" : ""; if (RM) frame(performance.now()); } }
    });
    const end = (e) => {
      if (!drag) return; const d = drag; drag = null; G.idle = performance.now() + 5000;
      if (d.moved < 6) { const [x, y] = pos(e); const n = pick(x, y); if (n) { G.tLon = GEO[n.iso][1]; T.selectWorld(n.iso === sel() ? "" : n.iso); } }
    };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", () => { drag = null; });
    if (RM) { const iv = setInterval(() => { if (!cv.isConnected) return clearInterval(iv); if (G.land || G.tLon != null) frame(performance.now()); }, 400); }
    else FX.loop(cv, frame, PHONE ? 24 : 30);
  }

  FX.onRender((pane) => {
    if (pane === "all") { decorateBoard(); buildGlobe(); }
    if (pane === "world") buildGlobe();
  });
})();

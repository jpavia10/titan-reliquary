/* TACTICAL TERMINAL widgets: crosshair logo, radar sweep that pings the latest adds, contact list. */
(() => {
  "use strict";
  const FX = window.TITAN_FX, T = window.TITAN;
  if (!FX || !T) return;
  const RM = FX.RM;
  const coin = document.querySelector(".brand .coin");
  if (coin && !coin.querySelector("svg")) {
    coin.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#ffb000" stroke-width="2">
      <rect x="4" y="4" width="40" height="40"/><path d="M4 16h6M38 16h6M4 32h6M38 32h6" stroke-width="1.5"/>
      <circle cx="24" cy="24" r="10"/><path d="M24 9v8M24 31v8M9 24h8M31 24h8"/></g>
      <rect x="21.5" y="21.5" width="5" height="5" fill="#ffb000"/></svg>`;
  }
  const scanN = (s) => parseInt(String(s || "").replace(/\D/g, ""), 10) || 0;
  const GOLD = Math.PI * (3 - Math.sqrt(5));
  const PERIOD = 4000;

  function build() {
    const pane = document.getElementById("pane-board"), v = T.vault;
    if (!pane || !v || pane.querySelector(".tm-radar")) return;
    const flips = (v.flips || []).filter((f) => f.scan).slice().sort((a, b) => scanN(b.scan) - scanN(a.scan)).slice(0, 8);
    if (!flips.length) return;
    const card = document.createElement("div"); card.className = "card wide tm-radar";
    const lo = flips[flips.length - 1].scan, hi = flips[0].scan;
    card.innerHTML = `<h3>Radar · latest contacts</h3>
      <div class="tm-body"><canvas aria-label="Radar of the latest adds"></canvas>
      <div><div class="tm-stat"><span>Contacts <b>${flips.length}</b></span><span>Sweep <b>${RM ? "HOLD" : (PERIOD / 1000).toFixed(1) + "s"}</b></span><span>Range <b>${T.esc(lo)}–${T.esc(hi)}</b></span><span>Grid <b>${T.intFmt(v.counts?.countries)} sectors</b></span></div>
      <ul class="tm-list">${flips.map((f, i) => `<li data-scan="${T.esc(f.scan)}" data-i="${i}" tabindex="0">
        <span class="n">${String(i + 1).padStart(2, "0")}</span><span class="s">${T.esc(f.ser || f.scan)}</span>
        <span class="d">${T.esc(f.country || "—")} · ${T.esc(f.year || "—")} · ${T.esc(f.denom || f.label || "")}</span>
        <span class="e">${f.est != null ? T.money(f.est) : "—"}</span></li>`).join("")}</ul></div></div>`;
    pane.prepend(card);
    const rows = [...card.querySelectorAll(".tm-list li")];
    rows.forEach((li) => {
      const open = () => T.openCoin(li.dataset.scan);
      li.addEventListener("click", open);
      li.addEventListener("keydown", (e) => { if (e.key === "Enter") open(); });
    });
    const cv = card.querySelector("canvas");
    const blips = flips.map((f, i) => ({ scan: f.scan, a: (i * GOLD + 0.6) % (2 * Math.PI), rr: 0.22 + 0.68 * (i / Math.max(1, flips.length - 1)), ping: -1e9, lit: false, x: 0, y: 0 }));
    let ctx = null, W = 0, H = 0, hover = -1;
    const fit = () => { if (!cv.clientWidth) return; ({ ctx, w: W, h: H } = FX.canvasFit(cv, cv.clientWidth)); draw(performance.now()); };
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(cv); else fit();
    let prevA = 0;
    function draw(now) {
      if (!ctx || !W) return;
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 8;
      const A = RM ? -Math.PI / 4 : ((now % PERIOD) / PERIOD) * 2 * Math.PI - Math.PI / 2;
      ctx.fillStyle = "#0a0b0a"; ctx.fillRect(0, 0, W, H);
      // rings + crosshair + ticks
      ctx.strokeStyle = "rgba(255,176,0,0.22)"; ctx.lineWidth = 1;
      for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(cx, cy, (R * k) / 4, 0, 6.283); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      ctx.strokeStyle = "rgba(255,176,0,0.45)";
      ctx.beginPath();
      for (let d = 0; d < 360; d += 10) { const r0 = d % 30 ? R - 4 : R - 9, t = d * Math.PI / 180; ctx.moveTo(cx + Math.cos(t) * r0, cy + Math.sin(t) * r0); ctx.lineTo(cx + Math.cos(t) * R, cy + Math.sin(t) * R); }
      ctx.stroke();
      // sweep: trailing wedge of alpha slices (no conic gradient, works on older iOS)
      if (!RM) {
        const N = 22, span = 1.1;
        for (let i = 0; i < N; i++) {
          const a1 = A - (span * i) / N, a0 = A - (span * (i + 1)) / N;
          ctx.fillStyle = `rgba(255,176,0,${(0.22 * (1 - i / N)).toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fill();
        }
        ctx.strokeStyle = "rgba(255,200,80,0.9)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(A) * R, cy + Math.sin(A) * R); ctx.stroke();
      }
      // blips: ping as the sweep crosses, then decay
      const norm = (x) => ((x % 6.283) + 6.283) % 6.283;
      const cur = norm(A + Math.PI / 2), prv = norm(prevA + Math.PI / 2); prevA = A;
      blips.forEach((b, i) => {
        const ba = norm(b.a + Math.PI / 2);
        if (!RM && (prv <= cur ? ba > prv && ba <= cur : ba > prv || ba <= cur)) b.ping = now;
        const age = now - b.ping, lvl = RM ? 1 : Math.max(0.18, Math.exp(-age / 1600));
        b.x = cx + Math.cos(b.a) * b.rr * R; b.y = cy + Math.sin(b.a) * b.rr * R;
        if (!RM && age < 900) { ctx.strokeStyle = `rgba(255,190,60,${(1 - age / 900) * 0.8})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(b.x, b.y, 4 + age / 45, 0, 6.283); ctx.stroke(); }
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 11);
        g.addColorStop(0, `rgba(255,190,60,${0.75 * lvl})`); g.addColorStop(1, "rgba(255,176,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 11, 0, 6.283); ctx.fill();
        ctx.fillStyle = i === hover ? "#fff" : `rgba(255,214,120,${Math.max(0.35, lvl)})`;
        ctx.fillRect(b.x - 2.5, b.y - 2.5, 5, 5);
        if (lvl > 0.45 || i === hover || RM) {
          ctx.font = "600 10px 'IBM Plex Mono', monospace"; ctx.fillStyle = `rgba(255,204,92,${i === hover ? 1 : Math.max(0.55, lvl)})`;
          ctx.fillText(String(i + 1).padStart(2, "0"), b.x + 7, b.y - 5);
        }
        const lit = !RM && lvl > 0.55;
        if (lit !== b.lit) { b.lit = lit; rows[i] && rows[i].classList.toggle("ping", lit); }
      });
      // readout
      ctx.font = "500 10px 'IBM Plex Mono', monospace"; ctx.fillStyle = "rgba(255,176,0,0.6)";
      ctx.fillText(`BRG ${String(Math.round((norm(A + Math.PI / 2) * 180) / Math.PI)).padStart(3, "0")}°`, 8, H - 8);
      ctx.fillText("TITAN//RDR", W - 72, 14);
    }
    const pick = (e) => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let bi = -1, bd = 20; blips.forEach((b, i) => { const d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; bi = i; } }); return bi; };
    cv.addEventListener("click", (e) => { const i = pick(e); if (i >= 0) T.openCoin(blips[i].scan); });
    cv.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; const i = pick(e); if (i !== hover) { hover = i; cv.style.cursor = i >= 0 ? "pointer" : "crosshair"; rows.forEach((r, k) => r.classList.toggle("hov", k === i)); if (RM) draw(performance.now()); } });
    if (!RM) FX.loop(cv, draw, 30);
  }
  FX.onRender((pane) => { if (pane === "all") build(); });
})();

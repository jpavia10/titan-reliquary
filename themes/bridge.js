/* STARSHIP BRIDGE widgets: reticle logo, live telemetry strip (clock · link · vault readouts). */
(() => {
  "use strict";
  const FX = window.TITAN_FX, T = window.TITAN;
  if (!FX || !T) return;
  const coin = document.querySelector(".brand .coin");
  if (coin && !coin.querySelector("svg")) {
    coin.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3ee6ff" stroke-width="1.5">
      <circle cx="24" cy="24" r="20" opacity=".35"/><circle cx="24" cy="24" r="13"/>
      <g class="br-spin"><path d="M24 2v7M24 39v7M2 24h7M39 24h7" stroke-width="2"/>
      <path d="M10 10l4 4M38 38l-4-4" opacity=".6"/></g>
      <circle cx="24" cy="24" r="3.2" fill="#a6f5ff" stroke="none"/></g></svg>`;
    if (!FX.RM) {
      const g = coin.querySelector(".br-spin"); let a = 0;
      FX.loop(coin, () => { a = (a + 0.6) % 360; g.setAttribute("transform", `rotate(${a} 24 24)`); }, 30);
    }
  }
  const pad = (n) => String(n).padStart(2, "0");
  function stardate(d) {
    const start = new Date(d.getFullYear(), 0, 0);
    const doy = Math.floor((d - start) / 864e5);
    return `${d.getFullYear()}.${String(doy).padStart(3, "0")}`;
  }
  function build() {
    const v = T.vault; if (!v) return;
    let el = document.querySelector(".bridge-tele");
    if (!el) {
      el = document.createElement("div"); el.className = "bridge-tele"; el.setAttribute("aria-hidden", "true");
      document.querySelector(".top").after(el);
    }
    const b = v.board || {}, spot = (v.metals || {}).spot || {};
    const ph = v.photos || {};
    el.innerHTML = `
      <div><b>STARDATE</b><span id="br-clock">—</span></div>
      <div><b>DATALINK</b><span class="ok"><span class="blink">●</span> NOMINAL</span></div>
      <div><b>VAULT MASS</b><span>${T.intFmt(b.vault)} units</span></div>
      <div><b>Σ VALUE</b><span>${T.money(b.grand)}</span></div>
      <div><b>AG / AU SPOT</b><span>${T.money(spot.ag_usd_oz)} · ${T.money(spot.au_usd_oz)}</span></div>
      <div><b>SECTORS</b><span>${T.intFmt(v.counts?.countries)} · ${T.intFmt(v.counts?.flips)} flips</span></div>
      <div><b>IMAGING</b><span>${T.intFmt(ph.phase2_done || 0)}/${T.intFmt(ph.total_active || 0)} P2</span></div>
      <div><b>BUILD</b><span>${T.esc(v.ledger_version || "")} · ${T.esc(String(v.content_hash || "").slice(0, 6))}</span></div>`;
    tick();
  }
  function tick() {
    const c = document.getElementById("br-clock"); if (!c) return;
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    c.textContent = `${stardate(d)} · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} PT`;
  }
  setInterval(() => { if (!document.hidden) tick(); }, 1000);
  FX.onRender((pane) => { if (pane === "all") build(); });
})();

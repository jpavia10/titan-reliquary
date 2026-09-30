/* Titan Reliquary · shared theme motion (loaded only when a theme is active).
   Count-up numbers, staggered panel reveal, render hook helpers. Honors prefers-reduced-motion. */
(() => {
  "use strict";
  const RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const handlers = [];
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function countUp(el, ms = 900) {
    if (!el || el.dataset.fxCounted) return;
    el.dataset.fxCounted = "1";
    const tn = [...el.childNodes].find((n) => n.nodeType === 3 && /\d/.test(n.nodeValue));
    if (!tn || RM) return;
    const m = tn.nodeValue.match(/^([^\d-]*)(-?[\d,]*\.?\d+)([\s\S]*)$/);
    if (!m) return;
    const [, pre, numStr, post] = m;
    const target = parseFloat(numStr.replace(/,/g, ""));
    if (!isFinite(target) || target === 0) return;
    const dec = (numStr.split(".")[1] || "").length;
    const grouping = numStr.includes(",");
    const fmt = (v) => v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grouping });
    const final = tn.nodeValue;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      tn.nodeValue = t >= 1 ? final : pre + fmt(target * ease(t)) + post;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function reveal(nodes, base = 0) {
    let i = 0;
    for (const el of nodes) {
      if (el.dataset.fxShown) continue;
      el.dataset.fxShown = "1";
      if (RM) continue;
      el.style.setProperty("--fx-i", String(Math.min(base + i, 14)));
      el.classList.add("fx-reveal");
      i += 1;
    }
  }

  function decorate(pane) {
    const $$ = (s) => [...document.querySelectorAll(s)];
    if (pane === "all" || pane === "board") {
      reveal($$("#pane-board > .card, #pane-board .grid > .card, #pane-board .latest-card, #pane-board .req-list .req:not(.extra)"));
      $$("#pane-board .card .val, #hdr-chips .chip strong").forEach((el) => countUp(el));
    }
    if (pane === "world") reveal($$("#world-panel, #pane-world .table-wrap"));
    if (pane === "drawer") {
      const b = document.querySelector("#drawer-body");
      if (b) { b.querySelectorAll("[data-fx-shown]").forEach((e) => delete e.dataset.fxShown); reveal(b.querySelectorAll(".ds-head, .ph-slot, .ds-sec")); }
    }
    for (const h of handlers) { try { h(pane); } catch (e) { console.warn("theme widget", e); } }
  }

  /** Run fn while el is on screen and the page is visible; returns stop(). */
  function loop(el, fn, fps = 30) {
    let raf = 0, last = 0, on = true;
    const tick = (now) => {
      if (!el.isConnected) return;
      raf = requestAnimationFrame(tick);
      if (!on || document.hidden || now - last < 1000 / fps) return;
      last = now; fn(now);
    };
    const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => { on = es[0].isIntersecting; }) : null;
    if (io) io.observe(el);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); if (io) io.disconnect(); };
  }

  function canvasFit(cv, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth || cv.parentElement.clientWidth;
    const hh = h || cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr);
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h: hh };
  }

  window.TITAN_FX = {
    RM, countUp, reveal, loop, canvasFit,
    onRender(fn) {
      handlers.push(fn);
      if (document.querySelector("#pane-board .card")) { try { fn("all"); } catch (e) { console.warn(e); } }
    },
  };
  document.addEventListener("titan:render", (e) => decorate(e.detail && e.detail.pane));
  if (document.querySelector("#pane-board .card")) decorate("all");
})();

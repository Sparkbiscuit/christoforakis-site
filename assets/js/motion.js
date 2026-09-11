// One scroll engine for every public page: parallax on boxed elements, scrubbed progress, and one-time reveals.
// Each frame measures every active element first, then writes. Only transform and opacity change on scroll.
(() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const canObserve = "IntersectionObserver" in window;
  const effects = new Map();
  const active = new Set();
  const watcher = canObserve && new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target)));
    request();
  }, { rootMargin: "25% 0px" });

  // Page modules register effects too. update(rect, viewportHeight, blend) returns true while it is still settling.
  function on(element, update, reset) {
    if (!element || !watcher) return;
    effects.set(element, { update, reset });
    watcher.observe(element);
  }

  // Boxed elements drift a little against the scroll. The element's own offset is removed before measuring,
  // so the measurement never feeds back into itself.
  function parallax(element) {
    const amount = Number(element.dataset.parallax) || 32;
    let offset = 0;
    on(element, (rect, vh) => {
      const center = rect.top - offset + rect.height / 2;
      offset = clamp((center - vh / 2) / (vh / 2 + rect.height / 2), -1, 1) * amount;
      element.style.setProperty("--parallax", `${offset.toFixed(1)}px`);
    }, () => {
      offset = 0;
      element.style.removeProperty("--parallax");
    });
  }

  // data-scrub="start end" runs --progress from the element's top crossing `start` (a fraction of the viewport height)
  // to its center reaching `end`. Add "center" to measure both from the center, so effects play where they are read.
  // Progress eases toward the scroll position, so coarse wheel steps still read as continuous motion.
  function scrub(element) {
    const tokens = element.dataset.scrub.split(/\s+/).filter(Boolean);
    const [start = 0.8, end = 0.4] = tokens.filter((token) => !Number.isNaN(Number(token))).map(Number);
    const fromCenter = tokens.includes("center");
    let shown = null;
    on(element, (rect, vh, blend) => {
      const target = fromCenter
        ? clamp((vh * start - (rect.top + rect.height / 2)) / (vh * (start - end)))
        : clamp((vh * start - rect.top) / (vh * (start - end) + rect.height / 2));
      shown = shown === null ? target : shown + (target - shown) * blend;
      if (Math.abs(target - shown) < 0.0015) shown = target;
      element.style.setProperty("--progress", shown.toFixed(4));
      return shown !== target;
    }, () => {
      shown = null;
      element.style.removeProperty("--progress");
    });
  }

  // Content is visible without JavaScript. Reveals opt in only once they can be observed.
  const revealer = canObserve && new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  function reveal(element) {
    if (revealer) revealer.observe(element);
    else element.classList.add("is-visible");
  }

  let frame = 0;
  let last = 0;
  function request() {
    if (!frame) frame = requestAnimationFrame(run);
  }
  function run(now) {
    frame = 0;
    if (reduce.matches) return;
    const vh = innerHeight;
    // A frame-rate independent easing step: the same feel at 60Hz and 120Hz.
    const blend = 1 - 0.78 ** (clamp(last ? now - last : 16.7, 1, 64) / 16.7);
    const measured = [...active].map((element) => [element, element.getBoundingClientRect()]);
    let settling = false;
    measured.forEach(([element, rect]) => {
      if (effects.get(element).update(rect, vh, blend)) settling = true;
    });
    last = settling ? now : 0;
    if (settling) request();
  }

  document.querySelectorAll("[data-parallax]").forEach(parallax);
  document.querySelectorAll("[data-scrub]").forEach(scrub);
  document.querySelectorAll("[data-reveal]").forEach(reveal);
  document.addEventListener("focusin", (event) => event.target.closest?.("[data-reveal]")?.classList.add("is-visible"));

  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", request);
  reduce.addEventListener?.("change", () => {
    if (reduce.matches) effects.forEach((effect) => effect.reset?.());
    request();
  });

  if (canObserve) root.classList.add("motion-ready");
  request();

  window.familyMotion = { on, parallax, scrub, reveal, request, reduce, clamp };
})();

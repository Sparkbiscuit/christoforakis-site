// Lukas's page. A dusk sky with a flight path composed for the screen, routed around his name, that a plane flies
// as the sky is scrolled away; and a departures board that flips to each interest the first time it is seen.
(() => {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const fixed = (value) => value.toFixed(1);
  // A top-down airliner pointing along +x, about 45 units nose to tail.
  const PLANE = "M24 0C23 -1.4 20 -2.3 15 -2.4L4 -2.6L-5 -16L-9 -16L-4.5 -2.6L-14 -2.4L-18.5 -8L-21.5 -8L-19.2 -1.6C-20.6 -0.8 -20.6 0.8 -19.2 1.6L-21.5 8L-18.5 8L-14 2.4L-4.5 2.6L-9 16L-5 16L4 2.6L15 2.4C20 2.3 23 1.4 24 0Z";

  // An open Catmull-Rom curve through the points, written as cubic Béziers.
  function openCurve(points) {
    const p = [points[0], ...points, points[points.length - 1]];
    let d = `M${fixed(points[0][0])} ${fixed(points[0][1])}`;
    for (let i = 1; i < p.length - 2; i += 1) {
      const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
      d += `C${fixed(p1[0] + (p2[0] - p0[0]) / 6)} ${fixed(p1[1] + (p2[1] - p0[1]) / 6)} ${fixed(p2[0] - (p3[0] - p1[0]) / 6)} ${fixed(p2[1] - (p3[1] - p1[1]) / 6)} ${fixed(p2[0])} ${fixed(p2[1])}`;
    }
    return d;
  }

  function flightPath(sky) {
    const svg = sky.querySelector(".sky__flight");
    const copy = sky.querySelector(".sky__copy");
    const still = 0.44;
    let route = null;
    let trails = [];
    let plane = null;
    let total = 0;
    let scale = 1;
    let width = 0;
    let height = 0;
    let shown = null;
    let intro = reduce.matches ? 1 : 0;

    function build() {
      width = sky.clientWidth;
      height = sky.clientHeight;
      const box = sky.getBoundingClientRect();
      const words = copy.getBoundingClientRect();
      const clearX = (words.left - box.left + Math.min(words.width, copy.scrollWidth) + 48) / width;
      const clearY = (words.bottom - box.top + 32) / height;
      const points = width >= 820
        ? [[-0.06, 0.95], [0.22, Math.max(0.88, clearY + 0.12)], [Math.max(0.52, clearX - 0.02), Math.max(0.72, clearY)], [Math.max(0.78, clearX + 0.2), 0.4], [0.93, 0.56], [0.8, 0.82], [0.62, 1.16]]
        : [[-0.14, 0.96], [0.28, Math.max(0.9, clearY + 0.18)], [0.74, Math.max(0.8, clearY + 0.12)], [0.93, Math.max(0.9, clearY + 0.2)], [0.64, 1.18]];
      const d = openCurve(points.map(([x, y]) => [x * width, y * height]));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.innerHTML = `<path class="route-shade" d="${d}"/><path class="route-ahead" d="${d}"/><path class="contrail-shade" d="${d}"/><path class="contrail" d="${d}"/><g class="plane"><path d="${PLANE}"/></g>`;
      route = svg.querySelector(".contrail");
      trails = [svg.querySelector(".contrail-shade"), route];
      plane = svg.querySelector(".plane");
      total = route.getTotalLength();
      scale = clamp(width / 1100, 0.72, 1.2);
      draw(shown ?? (reduce.matches ? still : 0));
    }

    function draw(progress) {
      const at = total * clamp(progress, 0, 1);
      const point = route.getPointAtLength(at);
      const ahead = route.getPointAtLength(Math.min(total, at + 1.5));
      const behind = route.getPointAtLength(Math.max(0, at - 1.5));
      const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      plane.setAttribute("transform", `translate(${fixed(point.x)} ${fixed(point.y)}) rotate(${fixed(angle)}) scale(${scale.toFixed(3)})`);
      trails.forEach((trail) => { trail.style.strokeDasharray = `${fixed(at)} ${fixed(total + 10)}`; });
    }

    // Resting, the plane sits a little way along its route. Scrolling the sky away flies it down to the board.
    function goal(rect) {
      const rest = 0.17 * intro;
      return rest + (1 - rest) * clamp(-rect.top / (rect.height * 0.8), 0, 1);
    }

    build();
    let lastWidth = width;
    let lastHeight = height;
    new ResizeObserver(() => {
      if (Math.abs(sky.clientWidth - lastWidth) < 1 && Math.abs(sky.clientHeight - lastHeight) < 120) return;
      lastWidth = sky.clientWidth;
      lastHeight = sky.clientHeight;
      build();
    }).observe(sky);

    const motion = window.familyMotion;
    if (!motion || reduce.matches) return;
    motion.on(sky, (rect, vh, blend) => {
      const target = goal(rect);
      shown = shown === null ? target : shown + (target - shown) * blend;
      if (Math.abs(target - shown) < 0.0008) shown = target;
      draw(shown);
      return shown !== target;
    }, () => {
      shown = null;
      draw(still);
    });
    // On arrival the plane takes off from the edge of the sky and settles into its resting place.
    const start = performance.now();
    const takeOff = (now) => {
      const t = clamp((now - start - 450) / 1600, 0, 1);
      intro = 1 - (1 - t) ** 3;
      motion.request();
      if (t < 1) requestAnimationFrame(takeOff);
    };
    requestAnimationFrame(takeOff);
  }

  function departures(title) {
    const text = title.textContent.trim();
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const label = document.createElement("span");
    label.className = "visually-hidden";
    label.textContent = text;
    const board = document.createElement("span");
    board.className = "flaps";
    board.setAttribute("aria-hidden", "true");
    const cells = [];
    text.toUpperCase().split(/\s+/).forEach((word) => {
      const group = document.createElement("span");
      group.className = "flap-word";
      [...word].forEach((character) => {
        const cell = document.createElement("span");
        cell.className = "flap";
        cell.dataset.final = character;
        cell.textContent = character;
        group.append(cell);
        cells.push(cell);
      });
      board.append(group);
    });
    title.replaceChildren(label, board);

    const tile = title.closest(".interest") || title;
    if (reduce.matches || !("IntersectionObserver" in window)) return;

    let running = false;
    function flip(quick) {
      if (running || reduce.matches) return;
      running = true;
      const started = performance.now();
      const interval = quick ? 46 : 64;
      const plans = cells.map((cell, index) => ({
        cell,
        begin: index * (quick ? 20 : 36),
        turns: cell.dataset.final === "." ? 1 : (quick ? 2 : 5) + Math.floor(Math.random() * (quick ? 3 : 6)),
        done: 0
      }));
      const tick = (now) => {
        let pending = false;
        plans.forEach((plan) => {
          const elapsed = now - started - plan.begin;
          if (elapsed < 0) { pending = true; return; }
          const due = Math.min(plan.turns, Math.floor(elapsed / interval) + 1);
          if (due > plan.done) {
            plan.done = due;
            plan.cell.textContent = due >= plan.turns ? plan.cell.dataset.final : letters[Math.floor(Math.random() * letters.length)];
            plan.cell.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(0.08)" }, { transform: "scaleY(1)" }], { duration: interval * 1.6, easing: "ease-in-out" });
          }
          if (plan.done < plan.turns) pending = true;
        });
        if (pending) requestAnimationFrame(tick);
        else running = false;
      };
      requestAnimationFrame(tick);
    }

    // A board that is still below the fold starts blank and fills in the moment its whole title is on screen,
    // however tall the tile around it is.
    if (title.getBoundingClientRect().top > innerHeight) cells.forEach((cell) => { cell.textContent = " "; });
    const watcher = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watcher.disconnect();
      flip(false);
    }, { threshold: 1, rootMargin: "0px 0px -6% 0px" });
    watcher.observe(title);
    tile.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") flip(true); });
  }

  const sky = document.querySelector("[data-sky]");
  if (sky && "ResizeObserver" in window) flightPath(sky);
  document.querySelectorAll("[data-flaps]").forEach(departures);
})();

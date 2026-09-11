// The family map composes itself for the size it is shown at. Rooms gather around home, a contour ground is drawn
// for the exact width and height, and the paths from home to each room draw in the first time the map is seen.
(() => {
  "use strict";

  const map = document.querySelector("[data-family-map]");
  if (!map || !("ResizeObserver" in window)) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value) => Math.round(value * 10) / 10;
  const fixed = (value) => value.toFixed(1);
  const ground = map.querySelector(".family-map__ground");
  const routes = map.querySelector(".family-map__paths");
  const home = map.querySelector(".family-map__home");
  const rooms = [...map.querySelectorAll(".room")].map((element) => ({ element, name: element.dataset.room }));

  // Each room's place in the ring on wide screens (clockwise from top left), its photo shape, its colour on the
  // ground, and the tilt it settles out of.
  const character = {
    nicholas: { slot: 0, aspect: 1.32, tone: "oklch(66% 0.18 235)", tilt: -4 },
    andreas: { slot: 1, aspect: 1.04, tone: "oklch(74% 0.16 305)", tilt: 3 },
    oksana: { slot: 2, aspect: 1.32, tone: "oklch(80% 0.16 150)", tilt: 4 },
    lukas: { slot: 3, aspect: 1.32, tone: "oklch(68% 0.24 18)", tilt: -3 },
    foxy: { slot: 4, aspect: 1.04, tone: "oklch(74% 0.17 55)", tilt: 3 },
    kiriakos: { slot: 5, aspect: 1.32, tone: "oklch(86% 0.18 95)", tilt: -2 }
  };

  function seeded(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function unit(x, y) {
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  }

  // A closed Catmull-Rom curve through the points, written as cubic Béziers.
  function closedCurve(points) {
    const count = points.length;
    let d = `M${fixed(points[0][0])} ${fixed(points[0][1])}`;
    for (let i = 0; i < count; i += 1) {
      const [p0, p1, p2, p3] = [points[(i - 1 + count) % count], points[i], points[(i + 1) % count], points[(i + 2) % count]];
      d += `C${fixed(p1[0] + (p2[0] - p0[0]) / 6)} ${fixed(p1[1] + (p2[1] - p0[1]) / 6)} ${fixed(p2[0] - (p3[0] - p1[0]) / 6)} ${fixed(p2[1] - (p3[1] - p1[1]) / 6)} ${fixed(p2[0])} ${fixed(p2[1])}`;
    }
    return `${d}Z`;
  }

  // Where a line from `from` toward the middle of a rectangle crosses its edge.
  function edgeToward(rect, from) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const dx = cx - from.x;
    const dy = cy - from.y;
    const t = Math.min(dx ? rect.w / 2 / Math.abs(dx) : Infinity, dy ? rect.h / 2 / Math.abs(dy) : Infinity);
    return { x: cx - dx * t, y: cy - dy * t };
  }

  function measure() {
    const name = rooms[0].element.querySelector(".room__name");
    return {
      width: map.clientWidth,
      vh: innerHeight,
      vw: innerWidth,
      nameHeight: name.offsetHeight + 10,
      header: document.querySelector(".site-header")?.offsetHeight || 64
    };
  }

  // Wide screens: six rooms in a ring around home, sized so nothing touches.
  function ringLayout({ width, vh, vw, nameHeight, header }) {
    const portrait = vh > vw;
    const pad = clamp(width * 0.035, 20, 52);
    const side = clamp(width * (portrait ? 0.25 : 0.2), 150, 300);
    const middle = side * 0.86;
    const homeSize = clamp(width * 0.068, 64, 104);
    const sideBox = side / 1.32 + nameHeight;
    const middleBox = middle / 1.04 + nameHeight;
    const least = 2 * (pad + middleBox + homeSize / 2 + 26);
    const height = Math.round(Math.max(least, Math.min(width * (portrait ? 0.84 : 0.6), vh - header - 24)));
    const cx = width / 2;
    const cy = height / 2;
    const reach = (width / 2 - pad - side / 2) * 0.96;
    const lift = clamp(height * 0.21, sideBox / 2 + 16, cy - pad - sideBox / 2);
    const slots = [
      { x: cx - reach, y: cy - lift + 6 },
      { x: cx + width * 0.018, y: pad + middleBox / 2 },
      { x: cx + reach, y: cy - lift - 6 },
      { x: cx + reach, y: cy + lift + 4 },
      { x: cx - width * 0.022, y: height - pad - middleBox / 2 },
      { x: cx - reach, y: cy + lift - 4 }
    ];
    const placed = rooms.map(({ element, name }) => {
      const info = character[name];
      const slot = slots[info.slot];
      const w = info.aspect > 1.2 ? side : middle;
      const photo = { x: slot.x - w / 2, y: slot.y - (w / info.aspect + nameHeight) / 2, w, h: w / info.aspect };
      const away = unit(slot.x - cx, slot.y - cy);
      return { element, name, info, order: info.slot, aspect: info.aspect, photo, scatter: { x: away.x * 44, y: away.y * 34 } };
    });
    return { mode: "ring", width, height, home: { x: cx, y: cy, size: homeSize }, rooms: placed };
  }

  // Narrow screens: two staggered columns along a spine that runs down from home.
  function spineLayout({ width, nameHeight }) {
    const pad = clamp(width * 0.04, 14, 24);
    const gap = clamp(width * 0.1, 30, 56);
    const w = (width - pad * 2 - gap) / 2;
    const aspect = 1.1;
    const boxHeight = w / aspect + nameHeight;
    const homeSize = clamp(width * 0.17, 56, 76);
    const top = pad + homeSize + 24;
    const step = boxHeight * 0.56;
    const cx = width / 2;
    const placed = rooms.map(({ element, name }, index) => {
      const right = index % 2 === 1;
      const photo = { x: right ? cx + gap / 2 : pad, y: top + index * step, w, h: w / aspect };
      return { element, name, info: character[name], order: index, aspect, right, photo, scatter: { x: right ? 30 : -30, y: 26 } };
    });
    const height = Math.round(top + (rooms.length - 1) * step + boxHeight + pad);
    return { mode: "spine", width, height, home: { x: cx, y: pad + homeSize / 2, size: homeSize }, rooms: placed };
  }

  function drawGround({ mode, width, height, home: center, rooms: placed }) {
    const bleed = 60;
    const random = seeded(11);
    const phase = [random(), random(), random()].map((value) => value * Math.PI * 2);
    const step = clamp(Math.min(width, height) * 0.05, 22, 38);
    const stretch = mode === "ring" ? clamp(width / height, 1.1, 1.7) : 0.9;
    const far = Math.hypot(Math.max(center.x, width - center.x) / stretch, Math.max(center.y, height - center.y) + bleed) * 1.08;
    let tints = "";
    let glows = "";
    placed.forEach((room) => {
      const cx = fixed(room.photo.x + room.photo.w / 2);
      const cy = fixed(room.photo.y + room.photo.h / 2);
      const r = fixed(room.photo.w);
      tints += `<radialGradient id="tint-${room.name}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${room.info.tone}" stop-opacity="0.24"/><stop offset="1" stop-color="${room.info.tone}" stop-opacity="0"/></radialGradient>`;
      glows += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#tint-${room.name})"/>`;
    });
    let contours = "";
    for (let ring = 1, radius = center.size * 0.85; radius < far; ring += 1, radius += step) {
      const wander = 0.07 + Math.min(ring, 12) * 0.002;
      const points = [];
      for (let i = 0; i < 56; i += 1) {
        const t = (i / 56) * Math.PI * 2;
        const wobble = 1 + wander * Math.sin(3 * t + phase[0] + ring * 0.09) + wander * 0.55 * Math.sin(5 * t + phase[1] - ring * 0.07) + wander * 0.3 * Math.sin(9 * t + phase[2] + ring * 0.11);
        points.push([center.x + Math.cos(t) * radius * wobble * stretch, center.y + Math.sin(t) * radius * wobble]);
      }
      contours += `<path class="contour${ring % 5 === 0 ? " contour--index" : ""}" d="${closedCurve(points)}"/>`;
    }
    ground.setAttribute("viewBox", `0 ${-bleed} ${width} ${height + bleed * 2}`);
    ground.innerHTML = `<defs>${tints}</defs>${glows}${contours}`;
  }

  function drawRoutes(layout) {
    const { mode, width, height, home: center } = layout;
    const reveal = (delay, pace) => `clamp(0, calc((var(--progress, 1) - ${delay}) * ${pace}), 1)`;
    let masks = "";
    let visible = "";
    const route = (id, d, amount, extra = "") => {
      masks += `<mask id="route-${id}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${width + 40}" height="${height + 40}"><path d="${d}" pathLength="1" style="fill:none;stroke:#fff;stroke-width:16;stroke-dasharray:1 1;stroke-dashoffset:calc(1 - ${amount})"/></mask>`;
      visible += `<g data-route="${id}"><path class="map-route" d="${d}" mask="url(#route-${id})"/>${extra}</g>`;
    };
    const dot = (x, y, amount, threshold) => `<circle class="map-dot" cx="${fixed(x)}" cy="${fixed(y)}" r="4" style="opacity:clamp(0, calc((${amount} - ${threshold}) * 12), 1)"/>`;

    if (mode === "ring") {
      layout.rooms.forEach((room) => {
        const target = { x: room.photo.x + room.photo.w / 2, y: room.photo.y + room.photo.h / 2 };
        const direction = unit(target.x - center.x, target.y - center.y);
        const start = { x: center.x + direction.x * (center.size / 2 + 14), y: center.y + direction.y * (center.size / 2 + 14) };
        const edge = edgeToward(room.photo, center);
        const end = { x: edge.x - direction.x * 14, y: edge.y - direction.y * 14 };
        const bend = Math.hypot(end.x - start.x, end.y - start.y) * 0.14 * (room.order % 2 ? 1 : -1);
        const control = { x: (start.x + end.x) / 2 - direction.y * bend, y: (start.y + end.y) / 2 + direction.x * bend };
        const d = `M${fixed(start.x)} ${fixed(start.y)}Q${fixed(control.x)} ${fixed(control.y)} ${fixed(end.x)} ${fixed(end.y)}`;
        const amount = reveal((0.14 + room.order * 0.07).toFixed(2), 2.1);
        route(room.name, d, amount, dot(end.x, end.y, amount, 0.9));
      });
    } else {
      const top = center.y + center.size / 2 + 12;
      const last = layout.rooms[layout.rooms.length - 1];
      const bottom = last.photo.y + last.photo.h / 2;
      const spine = reveal("0.04", 1.45);
      route("spine", `M${fixed(center.x)} ${fixed(top)}V${fixed(bottom)}`, spine);
      layout.rooms.forEach((room) => {
        const y = room.photo.y + room.photo.h / 2;
        const along = ((y - top) / (bottom - top)) * 0.9;
        const amount = `clamp(0, calc((${spine} - ${along.toFixed(3)}) * 12), 1)`;
        const end = room.right ? room.photo.x - 7 : room.photo.x + room.photo.w + 7;
        route(room.name, `M${fixed(center.x)} ${fixed(y)}H${fixed(end)}`, amount, dot(center.x, y, amount, 0.05));
      });
    }
    routes.setAttribute("viewBox", `0 0 ${width} ${height}`);
    routes.innerHTML = `${masks}${visible}`;
  }

  let layout = null;
  let lastWidth = 0;
  let lastHeight = 0;

  function compose() {
    const measured = measure();
    lastWidth = measured.width;
    lastHeight = measured.vh;
    layout = (measured.width >= 640 ? ringLayout : spineLayout)(measured);
    map.dataset.mode = layout.mode;
    map.style.setProperty("--map-height", `${layout.height}px`);
    home.style.setProperty("--home-x", `${round(layout.home.x)}px`);
    home.style.setProperty("--home-y", `${round(layout.home.y)}px`);
    home.style.setProperty("--home-size", `${round(layout.home.size)}px`);
    layout.rooms.forEach((room) => {
      const style = room.element.style;
      style.setProperty("--x", `${round(room.photo.x)}px`);
      style.setProperty("--y", `${round(room.photo.y)}px`);
      style.setProperty("--w", `${round(room.photo.w)}px`);
      style.setProperty("--aspect", String(room.aspect));
      style.setProperty("--dx", `${round(room.scatter.x)}px`);
      style.setProperty("--dy", `${round(room.scatter.y)}px`);
      style.setProperty("--rot", `${room.info.tilt}deg`);
      style.setProperty("--delay", ((room.order / rooms.length) * 0.42).toFixed(3));
    });
    drawGround(layout);
    drawRoutes(layout);
    map.classList.add("is-composed");
  }

  // Only meaningful size changes recompose: a new width, or (for the ring) a large change in window height,
  // so a phone's toolbar sliding away never redraws the map.
  function recompose() {
    const width = map.clientWidth;
    const heightChanged = layout.mode === "ring" && Math.abs(innerHeight - lastHeight) > 120;
    if (Math.abs(width - lastWidth) < 1 && !heightChanged) return;
    compose();
  }

  compose();
  new ResizeObserver(() => requestAnimationFrame(recompose)).observe(map);
  addEventListener("resize", () => requestAnimationFrame(recompose));
  document.fonts?.ready.then(() => compose());

  // The first time the map is seen, the rooms gather and the paths draw in. Without motion it simply rests composed.
  let played = false;
  function finish() {
    played = true;
    map.style.removeProperty("--progress");
  }
  function play() {
    if (played) return;
    if (reduce.matches || document.hidden) return finish();
    played = true;
    const start = performance.now();
    const duration = 1800;
    const tick = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      map.style.setProperty("--progress", (1 - (1 - t) ** 3).toFixed(4));
      if (t < 1) requestAnimationFrame(tick);
      else map.style.removeProperty("--progress");
    };
    requestAnimationFrame(tick);
  }
  if (!reduce.matches && !document.hidden && "IntersectionObserver" in window) {
    map.style.setProperty("--progress", "0");
    // Wait for the photos, briefly, so the rooms never gather as empty frames.
    const photos = [...map.querySelectorAll(".room__photo img")];
    const ready = () => Promise.race([
      Promise.all(photos.map((photo) => photo.decode().catch(() => {}))),
      new Promise((resolve) => setTimeout(resolve, 1400))
    ]);
    const watcher = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watcher.disconnect();
      ready().then(() => setTimeout(play, 120));
    }, { threshold: 0.28 });
    watcher.observe(map);
    map.addEventListener("focusin", play);
    document.addEventListener("visibilitychange", () => { if (document.hidden && !played) finish(); });
    reduce.addEventListener?.("change", () => { if (reduce.matches) finish(); });
  }

  // Home looks toward the pointer, and the path to a room brightens while that room is pointed at or focused.
  function look(x, y) {
    if (reduce.matches) return;
    const box = home.getBoundingClientRect();
    const toward = unit(x - (box.left + box.width / 2), y - (box.top + box.height / 2));
    const reach = box.width * 0.075;
    home.style.setProperty("--look-x", `${round(toward.x * reach)}px`);
    home.style.setProperty("--look-y", `${round(toward.y * reach)}px`);
  }
  const rest = () => {
    home.style.removeProperty("--look-x");
    home.style.removeProperty("--look-y");
  };
  const light = (name, on) => routes.querySelector(`[data-route="${name}"]`)?.toggleAttribute("data-lit", on);
  map.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse") look(event.clientX, event.clientY); });
  map.addEventListener("pointerleave", rest);
  rooms.forEach(({ element, name }) => {
    const link = element.querySelector("a");
    link.addEventListener("pointerenter", () => light(name, true));
    link.addEventListener("pointerleave", () => light(name, false));
    link.addEventListener("focus", () => {
      light(name, true);
      const photo = element.querySelector(".room__photo").getBoundingClientRect();
      look(photo.left + photo.width / 2, photo.top + photo.height / 2);
    });
    link.addEventListener("blur", () => {
      light(name, false);
      rest();
    });
  });
})();

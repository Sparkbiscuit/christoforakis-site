// Andreas's page. A cross-country course drawn along the real trail in the photograph, mapped through the image's
// crop for whatever size it is shown at, and run from the near edge into the mist while the trail is in view.
(() => {
  "use strict";

  const trail = document.querySelector("[data-trail]");
  if (!trail || !("ResizeObserver" in window)) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const fixed = (value) => value.toFixed(1);
  const scene = trail.querySelector(".trail__scene");
  const svg = trail.querySelector(".trail__course");

  // The trail in andreas.webp (1536 × 1024), as fractions of the image, from below its near edge to where it vanishes.
  const image = { width: 1536, height: 1024 };
  const route = [[0.4, 1.08], [0.52, 0.84], [0.595, 0.72], [0.625, 0.625], [0.6, 0.55], [0.535, 0.505], [0.58, 0.472]];

  function openCurve(points) {
    const p = [points[0], ...points, points[points.length - 1]];
    let d = `M${fixed(points[0][0])} ${fixed(points[0][1])}`;
    for (let i = 1; i < p.length - 2; i += 1) {
      const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
      d += `C${fixed(p1[0] + (p2[0] - p0[0]) / 6)} ${fixed(p1[1] + (p2[1] - p0[1]) / 6)} ${fixed(p2[0] - (p3[0] - p1[0]) / 6)} ${fixed(p2[1] - (p3[1] - p1[1]) / 6)} ${fixed(p2[0])} ${fixed(p2[1])}`;
    }
    return d;
  }

  let run = null;
  let shade = null;
  let runner = null;
  let total = 0;
  let shown = null;

  // object-fit: cover, centered: the same scale and offset the browser uses to crop the photograph.
  function build() {
    const width = scene.clientWidth;
    const height = scene.clientHeight;
    const scale = Math.max(width / image.width, height / image.height);
    const offsetX = (width - image.width * scale) / 2;
    const offsetY = (height - image.height * scale) / 2;
    const d = openCurve(route.map(([x, y]) => [x * image.width * scale + offsetX, y * image.height * scale + offsetY]));
    const size = clamp(scale * 1.5, 0.7, 1.35);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = `<path class="course-ahead" d="${d}"/><path class="course-shade" d="${d}"/><path class="course-run" d="${d}"/><g class="runner"><circle class="runner-halo" r="${fixed(8 * size)}"/><circle class="runner-dot" r="${fixed(5 * size)}"/></g>`;
    run = svg.querySelector(".course-run");
    shade = svg.querySelector(".course-shade");
    runner = svg.querySelector(".runner");
    total = run.getTotalLength();
    draw(shown ?? (reduce.matches ? 1 : 0));
  }

  function draw(progress) {
    const at = total * clamp(progress, 0, 1);
    const point = run.getPointAtLength(at);
    runner.setAttribute("transform", `translate(${fixed(point.x)} ${fixed(point.y)})`);
    runner.style.opacity = progress > 0.02 ? "1" : "0";
    [run, shade].forEach((path) => { path.style.strokeDasharray = `${fixed(at)} ${fixed(total + 10)}`; });
  }

  build();
  let lastWidth = scene.clientWidth;
  let lastHeight = scene.clientHeight;
  new ResizeObserver(() => {
    if (Math.abs(scene.clientWidth - lastWidth) < 1 && Math.abs(scene.clientHeight - lastHeight) < 1) return;
    lastWidth = scene.clientWidth;
    lastHeight = scene.clientHeight;
    build();
  }).observe(scene);

  // The run begins as the trail's middle passes 90% down the window and reaches the mist by 35%.
  const motion = window.familyMotion;
  if (!motion || reduce.matches) return;
  motion.on(trail, (rect, vh, blend) => {
    const target = clamp((vh * 0.9 - (rect.top + rect.height / 2)) / (vh * 0.55), 0, 1);
    shown = shown === null ? target : shown + (target - shown) * blend;
    if (Math.abs(target - shown) < 0.001) shown = target;
    draw(shown);
    return shown !== target;
  }, () => {
    shown = null;
    draw(1);
  });
})();

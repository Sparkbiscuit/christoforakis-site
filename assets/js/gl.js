// Small WebGL2 toolkit shared by the island pages. Each scene is one full-screen fragment shader;
// this file handles compiling, the noise texture, sizing, frame budgets, pausing and reduced motion.

export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

export function context(canvas, options = {}) {
  try {
    return canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance", ...options });
  } catch (error) {
    return null;
  }
}

export function program(gl, fragment, label = "scene") {
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.error(`[${label}]`, gl.getShaderInfoLog(shader));
    return shader;
  };
  const pr = gl.createProgram();
  gl.attachShader(pr, compile(gl.VERTEX_SHADER, "#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"));
  gl.attachShader(pr, compile(gl.FRAGMENT_SHADER, fragment));
  gl.bindAttribLocation(pr, 0, "p");
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
    console.error(`[${label}]`, gl.getProgramInfoLog(pr));
    return null;
  }
  const cache = {};
  return { pr, use: () => gl.useProgram(pr), u: (name) => (name in cache ? cache[name] : (cache[name] = gl.getUniformLocation(pr, name))) };
}

export function fullscreen(gl) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}

// 256x256 single-channel value noise lookup, bound to the given texture unit.
export function noiseTexture(gl, seed = 1234567, unit = 0) {
  const data = new Uint8Array(256 * 256);
  let s = seed;
  for (let i = 0; i < data.length; i += 1) { s = (s * 1103515245 + 12345) & 0x7fffffff; data[i] = (s >> 16) & 255; }
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 256, 256, 0, gl.RED, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

export function imageTexture(gl, image, unit = 1, { repeat = false } = {}) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  return tex;
}

// Input anywhere on the page wakes every scene to its full frame rate for a little while.
let lastInput = performance.now();
const poke = () => { lastInput = performance.now(); };
for (const type of ["pointermove", "pointerdown", "wheel", "keydown", "touchstart", "scroll"]) addEventListener(type, poke, { passive: true, capture: true });

// Runs frame(t, dt, info) while the canvas is on screen and the tab is visible.
// Being kind to the machine it runs on:
// - 30 frames a second while nobody's touching anything, 60 while they are (never 120, even on a 120 Hz screen);
// - never more than maxPixels in the drawing buffer, however big or dense the screen;
// - where the browser reports GPU time, the resolution settles where a frame costs about gpuBudget ms;
//   elsewhere it drops when frames start arriving late.
export function loop(canvas, frame, { maxScale = 1, minScale = 0.45, budget = 0.034, startScale, maxPixels = 2.4e6, fps = 30, activeFps = 60, gpuBudget = 6 } = {}) {
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  const coarse = matchMedia("(pointer: coarse)").matches;
  const cap = () => Math.max(minScale, Math.min(maxScale, Math.sqrt(maxPixels / Math.max(1, canvas.clientWidth * canvas.clientHeight * dpr() * dpr()))));
  let scale = Math.min(cap(), startScale ?? (coarse ? 0.6 : 0.85) * maxScale);
  let raf = 0, prev = 0, slow = 0, fast = 0, visible = true, running = false, frames = 0, awakeUntil = 0;
  const gl = canvas.getContext("webgl2");
  const tq = gl && gl.getExtension("EXT_disjoint_timer_query_webgl2");
  let query = null, gpu = 0, gpuN = 0, adjusted = 0;
  const size = () => {
    scale = Math.min(scale, cap());
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr() * scale)), h = Math.max(1, Math.round(canvas.clientHeight * dpr() * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  };
  const readGpu = () => {
    if (!query || !gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) return;
    if (!gl.getParameter(tq.GPU_DISJOINT_EXT)) { const ms = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6; gpu = gpuN ? gpu * 0.85 + ms * 0.15 : ms; gpuN += 1; }
    gl.deleteQuery(query); query = null;
  };
  const tick = (now) => {
    raf = 0;
    if (running && visible && !document.hidden) raf = requestAnimationFrame(tick);
    const active = now - lastInput < 2500 || now < awakeUntil;
    const interval = 1000 / (active ? activeFps : fps);
    if (prev && now - prev < interval - 2.5) return;
    const t = now / 1000, raw = prev ? (now - prev) / 1000 : 0, dt = prev ? Math.min(0.05, raw) : 1 / 60;
    prev = now;
    frames += 1;
    if (tq) {
      readGpu();
      if (gpuN >= 6 && now - adjusted > 600) {
        if (gpu > gpuBudget * 1.2 && scale > minScale) { scale = Math.max(minScale, scale * 0.88); gpuN = 0; adjusted = now; }
        else if (gpu < gpuBudget * 0.55 && scale < cap()) { scale = Math.min(cap(), scale * 1.06); gpuN = 0; adjusted = now; }
      }
    } else {
      const late = Math.max(budget, (interval / 1000) * 1.7);
      if (frames > 20 && raw > late) { slow += 1; fast = 0; } else if (raw && raw < late * 0.55) { fast += 1; slow = Math.max(0, slow - 1); }
      if (slow > 18 && scale > minScale) { scale = Math.max(minScale, scale * 0.82); slow = 0; }
      if (fast > 240 && scale < cap()) { scale = Math.min(cap(), scale * 1.1); fast = 0; }
    }
    size();
    const timing = tq && !query;
    if (timing) { query = gl.createQuery(); gl.beginQuery(tq.TIME_ELAPSED_EXT, query); }
    frame(t, dt, { width: canvas.width, height: canvas.height, scale });
    if (timing) gl.endQuery(tq.TIME_ELAPSED_EXT);
  };
  const start = () => { running = true; if (!raf) { prev = 0; raf = requestAnimationFrame(tick); } };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
  const once = () => { if (!raf) raf = requestAnimationFrame((now) => { const r = running; running = false; prev = 0; tick(now); running = r; }); };
  // a scene can ask for full frame rate while something it's doing needs it (a flight, a camera move)
  const wake = (ms = 400) => { awakeUntil = Math.max(awakeUntil, performance.now() + ms); };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && running && !raf) { prev = 0; raf = requestAnimationFrame(tick); }
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && running && visible && !raf) { prev = 0; raf = requestAnimationFrame(tick); } });
  new ResizeObserver(() => { if (!running) once(); }).observe(canvas);
  return { start, stop, once, wake, get scale() { return scale; }, get gpu() { return gpu; } };
}

export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a, b, k) => a + (b - a) * k;

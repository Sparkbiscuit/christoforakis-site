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

// Runs frame(t, dt, info) while the canvas is on screen and the tab is visible.
// The drawing buffer follows the canvas's CSS size times a scale that drops when frames run long.
export function loop(canvas, frame, { maxScale = 1, minScale = 0.45, budget = 0.034, startScale } = {}) {
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  const coarse = matchMedia("(pointer: coarse)").matches;
  let scale = startScale ?? (coarse ? 0.6 : 0.85) * maxScale;
  let raf = 0, prev = 0, slow = 0, fast = 0, visible = true, running = false, frames = 0;
  const size = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr() * scale)), h = Math.max(1, Math.round(canvas.clientHeight * dpr() * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  };
  const tick = (now) => {
    raf = 0;
    const t = now / 1000, dt = prev ? Math.min(0.05, t - prev) : 1 / 60, raw = prev ? t - prev : 0;
    prev = t;
    frames += 1;
    if (frames > 20 && raw > budget) { slow += 1; fast = 0; } else if (raw && raw < budget * 0.55) { fast += 1; slow = Math.max(0, slow - 1); }
    if (slow > 18 && scale > minScale) { scale = Math.max(minScale, scale * 0.82); slow = 0; }
    if (fast > 240 && scale < maxScale) { scale = Math.min(maxScale, scale * 1.1); fast = 0; }
    size();
    frame(t, dt, { width: canvas.width, height: canvas.height, scale });
    if (running && visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const start = () => { running = true; if (!raf) { prev = 0; raf = requestAnimationFrame(tick); } };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };
  const once = () => { if (!raf) raf = requestAnimationFrame((now) => { const r = running; running = false; tick(now); running = r; }); };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && running && !raf) { prev = 0; raf = requestAnimationFrame(tick); }
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && running && visible && !raf) { prev = 0; raf = requestAnimationFrame(tick); } });
  new ResizeObserver(() => { if (!running) once(); }).observe(canvas);
  return { start, stop, once, get scale() { return scale; } };
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

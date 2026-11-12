// Oksana: a cyanotype of pressed plants, rinsed in a shallow tray when the page opens.
// The plants are drawn as a contact mask; the print, the rinse and the water are one shader.
import { context, program, fullscreen, loop, reducedMotion, imageTexture, seeded, clamp } from "./gl.js";

// ---------- the plants ----------
const MW = 1000, MH = 1250;
function plants() {
  const cv = document.createElement("canvas");
  cv.width = MW; cv.height = MH;
  const ctx = cv.getContext("2d"), rnd = seeded(1979);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, MW, MH);
  ctx.fillStyle = "#fff"; ctx.strokeStyle = "#fff"; ctx.lineCap = "round"; ctx.lineJoin = "round";

  const path = (x, y, a, len, bend, n = 80) => {
    const pts = [];
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      pts.push({ x, y, a, t });
      a += bend * Math.sin(Math.PI * t * 0.9 + 0.3) / n * 2.2;
      x += Math.cos(a) * len / n; y += Math.sin(a) * len / n;
    }
    return pts;
  };
  const stem = (pts, w0, w1) => {
    ctx.beginPath();
    pts.forEach((p, i) => { const w = w0 + (w1 - w0) * p.t, nx = -Math.sin(p.a) * w / 2, ny = Math.cos(p.a) * w / 2; i ? ctx.lineTo(p.x + nx, p.y + ny) : ctx.moveTo(p.x + nx, p.y + ny); });
    for (let i = pts.length - 1; i >= 0; i -= 1) { const p = pts[i], w = w0 + (w1 - w0) * p.t; ctx.lineTo(p.x + Math.sin(p.a) * w / 2, p.y - Math.cos(p.a) * w / 2); }
    ctx.closePath(); ctx.fill();
  };
  const leaf = (x, y, a, l, w, alpha = 0.9, vein = true) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(l * 0.25, -w, l * 0.7, -w * 0.85, l, 0);
    ctx.bezierCurveTo(l * 0.7, w * 0.85, l * 0.25, w, 0, 0);
    ctx.fill();
    if (vein && l > 18) {
      ctx.globalCompositeOperation = "destination-out"; ctx.globalAlpha = 0.45; ctx.lineWidth = Math.max(0.8, w * 0.12);
      ctx.beginPath(); ctx.moveTo(l * 0.05, 0); ctx.quadraticCurveTo(l * 0.5, -w * 0.08, l * 0.92, 0); ctx.stroke();
      ctx.lineWidth = Math.max(0.5, w * 0.06); ctx.globalAlpha = 0.3;
      for (let k = 1; k < 6; k += 1) { const u = k / 6.5; ctx.beginPath(); ctx.moveTo(l * u, 0); ctx.lineTo(l * (u + 0.12), -w * 0.62 * Math.sin(Math.PI * u)); ctx.moveTo(l * u, 0); ctx.lineTo(l * (u + 0.12), w * 0.62 * Math.sin(Math.PI * u)); ctx.stroke(); }
    }
    ctx.restore();
  };

  // A fern frond: a curving rachis, alternate pinnae, each with its own pinnules.
  const fern = (x, y, a, len, bend) => {
    const pts = path(x, y, a, len, bend);
    stem(pts, 6.5, 1.2);
    const K = 44;
    for (let j = 0; j < K; j += 1) {
      const t = 0.1 + 0.88 * j / K, p = pts[Math.round(t * (pts.length - 1))], side = j % 2 ? 1 : -1;
      const pl = len * 0.19 * Math.pow(Math.sin(Math.PI * Math.min(1, (t - 0.04) / 0.98)), 0.75) * (1.1 - t * 0.6);
      if (pl < 8) continue;
      const pa = p.a + side * (1.18 - 0.42 * t), pin = path(p.x, p.y, pa, pl, -side * 0.35, 24);
      ctx.globalAlpha = 1; stem(pin, 2.2, 0.6);
      const m = Math.max(3, Math.floor(pl / 8));
      for (let k = 0; k < m; k += 1) {
        const u = 0.08 + 0.9 * k / m, q = pin[Math.round(u * (pin.length - 1))], s2 = k % 2 ? 1 : -1;
        const sz = (pl * 0.1) * (1 - u * 0.6) + 2.6;
        leaf(q.x, q.y, q.a + s2 * 1.0, sz * 1.35, sz * 0.4, 0.93, false);
      }
      leaf(pin[pin.length - 1].x, pin[pin.length - 1].y, pin[pin.length - 1].a, 7, 2.4, 0.93, false);
    }
    ctx.globalAlpha = 1;
  };

  // Queen Anne's lace: a stem, a dome of rays, and a lace of tiny florets.
  const umbel = (x, y, a, len, bend) => {
    const pts = path(x, y, a, len, bend), top = pts[pts.length - 1];
    stem(pts, 3.4, 1.8);
    const R = 19, spread = 2.4;
    for (let r = 0; r < R; r += 1) {
      const f = r / (R - 1) - 0.5, ra = top.a + f * spread, rl = len * 0.2 * (1 - Math.abs(f) * 0.5) * (0.9 + rnd() * 0.2);
      const ray = path(top.x, top.y, ra, rl, -f * 0.5, 16), end = ray[ray.length - 1];
      ctx.globalAlpha = 1; stem(ray, 1.3, 0.8);
      const r2 = 13;
      for (let k = 0; k < r2; k += 1) {
        const g = k / (r2 - 1) - 0.5, ga = end.a + g * 2.4, gl = 16 + rnd() * 9;
        const ex = end.x + Math.cos(ga) * gl, ey = end.y + Math.sin(ga) * gl;
        ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(end.x, end.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.globalAlpha = 0.92;
        for (let d = 0; d < 5; d += 1) { const da = d / 5 * 6.283 + rnd(); ctx.beginPath(); ctx.arc(ex + Math.cos(da) * 2.6, ey + Math.sin(da) * 2.6, 1.6 + rnd() * 0.6, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
    }
    for (let b = 0; b < 7; b += 1) { const ba = top.a + Math.PI + (b / 6 - 0.5) * 1.6; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(top.x + Math.cos(ba) * 26, top.y + Math.sin(ba) * 26); ctx.stroke(); }
  };

  // A grass with a nodding seed head.
  const grass = (x, y, a, len, bend) => {
    const pts = path(x, y, a, len, bend);
    stem(pts, 3, 0.9);
    for (let k = 0; k < 22; k += 1) {
      const t = 0.6 + 0.39 * k / 22, p = pts[Math.round(t * (pts.length - 1))], side = k % 2 ? 1 : -1;
      const pa = p.a + side * 0.6, pl = 22 + 16 * Math.sin(Math.PI * (k / 22));
      const ex = p.x + Math.cos(pa) * pl * 0.5, ey = p.y + Math.sin(pa) * pl * 0.5 + 6;
      ctx.lineWidth = 0.9; ctx.globalAlpha = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + Math.cos(pa) * pl * 0.3, p.y + Math.sin(pa) * pl * 0.3, ex, ey); ctx.stroke();
      leaf(ex, ey, Math.PI / 2 + side * 0.3, 21, 5.5, 0.9, false);
    }
    // two long blades from the base
    for (let b = 0; b < 2; b += 1) { const bl = path(x + (b ? 4 : -3), y, a + (b ? 0.18 : -0.22), len * (0.48 + b * 0.12), (b ? 1 : -1) * 0.9, 50); ctx.globalAlpha = 0.9; stem(bl, 5, 0.3); }
    ctx.globalAlpha = 1;
  };

  // A leafy sprig.
  const sprig = (x, y, a, len, bend) => {
    const pts = path(x, y, a, len, bend);
    stem(pts, 3.2, 1);
    for (let k = 0; k < 11; k += 1) {
      const t = 0.1 + 0.86 * k / 11, p = pts[Math.round(t * (pts.length - 1))], side = k % 2 ? 1 : -1, sz = 78 * (1 - t * 0.5);
      leaf(p.x, p.y, p.a + side * 0.75, sz, sz * 0.26, 0.86, true);
    }
    leaf(pts[pts.length - 1].x, pts[pts.length - 1].y, pts[pts.length - 1].a, 26, 7, 0.86, true);
  };

  grass(560, 1300, -1.6, 1130, 0.16);
  fern(250, 1300, -1.36, 1080, 0.3);
  umbel(930, 1300, -1.74, 960, -0.1);
  sprig(-20, 740, -0.4, 520, 0.32);
  fern(1050, 1080, -2.6, 420, -0.18);
  return cv;
}

// ---------- the print ----------
const PRINT = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime, uRinse, uDeep;
uniform sampler2D uMask, uWater, uNoise;
uniform vec2 uTexel;
uniform vec3 uBg;
out vec4 fragColor;

float n2(vec2 p) { return texture(uNoise, p / 256.).x; }
float fbm(vec2 p) { return .5 * n2(p) + .25 * n2(p * 2.03 + 7.) + .125 * n2(p * 4.07 + 3.) + .0625 * n2(p * 8.1); }

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  // Water: height, slope and curvature.
  vec2 wv = uv;
  float h = texture(uWater, wv).r;
  float hx = texture(uWater, wv + vec2(uTexel.x, 0.)).r - texture(uWater, wv - vec2(uTexel.x, 0.)).r;
  float hy = texture(uWater, wv + vec2(0., uTexel.y)).r - texture(uWater, wv - vec2(0., uTexel.y)).r;
  float lap = texture(uWater, wv + vec2(uTexel.x, 0.)).r + texture(uWater, wv - vec2(uTexel.x, 0.)).r + texture(uWater, wv + vec2(0., uTexel.y)).r + texture(uWater, wv - vec2(0., uTexel.y)).r - 4. * h;
  vec2 q = uv - vec2(hx, hy) * .35;

  // Paper sheet with a deckled edge, on the page.
  vec2 p = q * vec2(aspect, 1.) * 900.;
  vec2 e = min(q, 1. - q) * vec2(aspect, 1.);
  float edgeN = fbm(p * .045) * .022 + n2(p * .3) * .004;
  float sheet = smoothstep(.0, .0025, min(e.x, e.y) - .022 - edgeN);
  float fibre = fbm(p * .55) * .5 + n2(p * 1.9) * .5;
  vec3 paper = vec3(.965, .952, .918) - fibre * .045;

  // The brushed coating, ragged at its edges.
  vec2 c = min(q, 1. - q) * vec2(aspect, 1.);
  float brush = fbm(vec2(p.x * .008, p.y * .11)) * .07 + fbm(vec2(p.x * .1, p.y * .006)) * .05;
  float coat = smoothstep(.0, .012, min(c.x - .07 - brush * 1.2, c.y - .065 - brush));
  float strokes = fbm(vec2(p.x * .02, p.y * .5)) - .5;

  // Contact mask: sharp where the plant lay flat, softer where it lifted.
  vec2 mq = q;
  float soft = smoothstep(.35, .75, fbm(p * .006 + 20.));
  float m = mix(textureLod(uMask, mq, 0.).r, textureLod(uMask, mq, 2.2).r, soft * .7);
  float expo = 1. - m;

  // Before the rinse: yellow-green sensitizer, olive where exposed. After: white and Prussian blue.
  vec3 sens = mix(vec3(.82, .82, .5), vec3(.44, .48, .4), expo);
  float dens = clamp(expo * (.86 + strokes * .22) + (fibre - .5) * .08, 0., 1.);
  vec3 blue = mix(vec3(.15, .3, .52), vec3(.04, .13, .32), uDeep);
  vec3 rinsed = mix(paper, mix(vec3(.42, .56, .72), blue, smoothstep(.15, .95, dens)), smoothstep(.02, .5, dens));
  float front = uRinse * 1.35 - .15 + (fbm(vec2(p.x * .01, uTime * .1)) - .5) * .12;
  float washed = smoothstep(front + .03, front - .03, 1. - q.y);
  vec3 col = mix(paper, mix(sens, rinsed, washed), coat);
  col = mix(uBg, col, sheet);
  float outside = min(e.x, e.y) - .022 - edgeN;
  col *= 1. - .07 * smoothstep(-.025, 0., outside) * (1. - sheet);

  // Light through moving water: caustics, a soft window reflection and a glint.
  float wet = sheet;
  col *= 1. + clamp(-lap * 18., -.1, .22) * wet;
  vec3 n = normalize(vec3(-hx * 42., -hy * 42., 1.));
  float win = smoothstep(.35, .0, length((uv - vec2(.78, .84)) * vec2(1., 1.6) + n.xy * .5));
  float glint = pow(max(dot(reflect(normalize(vec3(-.4, -.5, -1.)), n), normalize(vec3(0., 0., 1.))), 0.), 90.);
  col += (win * .05 + glint * .35) * wet;
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(41.3, 289.1))) * 43758.5) - .5) / 255.;
  fragColor = vec4(col, 1.);
}`;

// Shallow-water ripples: the classic two-buffer wave equation.
const WAVE = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec4 uDrop;
out vec4 fragColor;
void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec2 s = texture(uState, uv).rg;
  float sum = texture(uState, uv + vec2(uTexel.x, 0.)).r + texture(uState, uv - vec2(uTexel.x, 0.)).r + texture(uState, uv + vec2(0., uTexel.y)).r + texture(uState, uv - vec2(0., uTexel.y)).r;
  float next = (sum * .5 - s.g) * .978;
  vec2 d = (uv - uDrop.xy) / uTexel / uDrop.w;
  next += uDrop.z * exp(-dot(d, d));
  fragColor = vec4(next, s.r, 0., 1.);
}`;

const print = document.querySelector("[data-print]");
if (print) {
  const gl = context(print, { alpha: false });
  const ext = gl && gl.getExtension("EXT_color_buffer_float");
  const mask = plants();
  const bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g).slice(0, 3).map((v) => Number(v) / 255);
  if (!gl) {
    // A still print, without the tray.
    const ctx = print.getContext("2d");
    if (ctx) {
      print.width = 1000; print.height = 1250;
      ctx.fillStyle = "#f6f2e9"; ctx.fillRect(0, 0, 1000, 1250);
      ctx.fillStyle = "#16305a"; ctx.fillRect(70, 80, 860, 1090);
      ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.92; ctx.drawImage(mask, 0, 0);
    }
  } else {
    const draw = program(gl, PRINT, "oksana-print"), wave = program(gl, WAVE, "oksana-water");
    fullscreen(gl);
    // Noise on unit 2, the plants on unit 1, water on units 3 and 4.
    const nz = new Uint8Array(256 * 256); let s = 4242;
    for (let i = 0; i < nz.length; i += 1) { s = (s * 1103515245 + 12345) & 0x7fffffff; nz[i] = (s >> 16) & 255; }
    gl.activeTexture(gl.TEXTURE2);
    const noise = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, noise);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 256, 256, 0, gl.RED, gl.UNSIGNED_BYTE, nz);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    imageTexture(gl, mask, 1);

    const WW = 200, WH = 250, texel = [1 / WW, 1 / WH];
    // Without float render targets the print still rinses; it just has no water on it.
    const flat = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      return { tex, fb: null };
    };
    const target = () => {
      if (!ext) return flat();
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, WW, WH, 0, gl.RG, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb };
    };
    gl.activeTexture(gl.TEXTURE3);
    let A = target(), B = target();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const drops = [];
    const still = reducedMotion.matches;
    let born = performance.now() / 1000, rinse = still ? 1 : 0, deep = still ? 1 : 0, last = 0, lastFront = 0;
    const step = (drop) => {
      if (!ext) return;
      wave.use();
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, A.tex);
      gl.uniform1i(wave.u("uState"), 3);
      gl.uniform2f(wave.u("uTexel"), texel[0], texel[1]);
      gl.uniform4f(wave.u("uDrop"), drop ? drop[0] : -1, drop ? drop[1] : -1, drop ? drop[2] : 0, drop ? drop[3] : 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, B.fb);
      gl.viewport(0, 0, WW, WH);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      [A, B] = [B, A];
    };
    const frame = (t, dt, { width, height }) => {
      const age = t - born;
      if (!still) {
        rinse = clamp((age - 0.5) / 2.6);
        rinse = rinse * rinse * (3 - 2 * rinse);
        deep = clamp((age - 2) / 7);
        // The rinse front pushes a line of small waves down the sheet.
        if (rinse > 0 && rinse < 1 && t - lastFront > 0.06) {
          lastFront = t;
          const fy = 1 - (rinse * 1.35 - 0.15);
          for (let k = 0; k < 2; k += 1) drops.push([Math.random(), clamp(fy), 0.03, 2.2]);
        }
        if (t - last > 6 + Math.random() * 6 && age > 5) { last = t; drops.push([0.2 + Math.random() * 0.6, 0.15 + Math.random() * 0.7, 0.22, 2.6]); }
        const n = Math.min(4, drops.length + 1);
        for (let k = 0; k < Math.max(2, n); k += 1) step(drops.shift());
      }
      draw.use();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, A.tex);
      gl.uniform1i(draw.u("uWater"), 3); gl.uniform1i(draw.u("uMask"), 1); gl.uniform1i(draw.u("uNoise"), 2);
      gl.uniform2f(draw.u("uRes"), width, height);
      gl.uniform2f(draw.u("uTexel"), texel[0], texel[1]);
      gl.uniform1f(draw.u("uTime"), t);
      gl.uniform1f(draw.u("uRinse"), rinse);
      gl.uniform1f(draw.u("uDeep"), deep);
      gl.uniform3f(draw.u("uBg"), bg[0], bg[1], bg[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const run = loop(print, frame, { maxScale: 1, minScale: 0.5, startScale: 0.8 });
    if (still) run.once(); else run.start();

    // A fingertip in the tray.
    if (!still) {
      let lastDrop = 0;
      print.addEventListener("pointermove", (e) => {
        const now = performance.now();
        if (now - lastDrop < 28) return;
        lastDrop = now;
        const r = print.getBoundingClientRect();
        drops.push([(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height, 0.05, 1.6]);
      });
      // Each note that comes into view lets a drop fall into the tray.
      const feed = document.querySelector("[data-blog-feed]");
      if (feed && "IntersectionObserver" in window) {
        const seen = new WeakSet();
        const io = new IntersectionObserver((entries) => entries.forEach((en) => {
          if (!en.isIntersecting || seen.has(en.target)) return;
          seen.add(en.target);
          drops.push([0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4, 0.3, 2.6]);
        }), { threshold: 0.3 });
        const watch = () => feed.querySelectorAll(".note").forEach((n) => io.observe(n));
        new MutationObserver(watch).observe(feed, { childList: true });
        watch();
      }
      print.addEventListener("pointerdown", (e) => {
        const r = print.getBoundingClientRect();
        drops.push([(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height, 0.35, 2.4]);
      });
    }
  }
}

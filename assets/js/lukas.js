// Lukas: a descent from 60,000 feet to the ground. The page scroll is the altitude; the sky is raymarched clouds.
import { context, program, fullscreen, loop, reducedMotion, clamp } from "./gl.js";

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime, uY, uPitch, uZ, uX, uCov;
uniform sampler2D uN;
out vec4 fragColor;

const vec3 SUN = normalize(vec3(-0.36, 0.2, 0.93));
const float B0 = 1.4, B1 = 3.3;

float n3(vec3 x) {
  vec3 p = floor(x), f = fract(x);
  f = f * f * (3. - 2. * f);
  vec2 uv = (p.xy + vec2(37., 17.) * p.z) + f.xy;
  vec2 rg = textureLod(uN, (uv + .5) / 256., 0.).yx;
  return mix(rg.x, rg.y, f.z);
}
float n2(vec2 x) { return textureLod(uN, (x + .5) / 256., 0.).x; }

float density(vec3 p, bool fine) {
  float h = (p.y - B0) / (B1 - B0);
  if (h < 0. || h > 1.) return 0.;
  vec3 q = p * .34 + vec3(uTime * .01, 0., uTime * .003);
  float cov = n2(p.xz * .16 + 13.) * .7 + n2(p.xz * .55 + 41.) * .3;
  float n = .5 * n3(q) + .25 * n3(q * 2.03 + 1.7);
  n += fine ? .125 * n3(q * 4.07 + 3.1) + .0625 * n3(q * 8.13 + 5.3) : .09;
  float shape = smoothstep(0., .09, h) * smoothstep(1., .3, h);
  float d = n - (1. - shape * .62) + (cov - .5) * 1.1 + uCov;
  return clamp(d * 3.8, 0., 1.);
}

float sunlight(vec3 p) {
  float d = density(p + SUN * .18, false) + density(p + SUN * .5, false) + density(p + SUN * 1.1, false) * .8;
  return exp(-d * 2.1);
}

vec3 horizon() { float hi = clamp(uY / 10., 0., 1.); return mix(vec3(.74, .83, .92), vec3(.66, .79, .94), hi); }

vec3 skyCol(vec3 rd) {
  float hi = clamp(uY / 10., 0., 1.);
  vec3 zen = mix(vec3(.12, .32, .74), vec3(.012, .05, .2), hi * hi);
  float e = max(rd.y + .015 + .03 * hi, 0.);
  vec3 c = mix(horizon(), zen, pow(clamp(e * (1.3 + 1.1 * hi), 0., 1.), .62));
  float s = max(dot(rd, SUN), 0.);
  c += vec3(1., .8, .55) * (pow(s, 8.) * .1 + pow(s, 40.) * .32 + pow(s, 400.) * .6);
  c += vec3(1., .97, .9) * smoothstep(.99965, .99985, s) * 6.;
  return c;
}

vec3 groundCol(vec3 p) {
  vec2 g = floor(p.xz * vec2(5.1, 3.7) + n2(p.xz * 2.) * 1.5);
  float r = fract(sin(dot(g, vec2(12.9898, 78.233))) * 43758.5453);
  float a = n2(p.xz * 3.1), b = n2(p.xz * 19. + 7.);
  vec3 c = mix(vec3(.22, .31, .15), vec3(.42, .43, .27), smoothstep(.3, .7, a));
  c = mix(c, vec3(.55, .5, .36), step(.82, r) * .7);
  c = mix(c, vec3(.13, .21, .11), smoothstep(.55, .85, b) * .8);
  c *= .82 + .3 * r;
  float sh = density(p + SUN * ((2.3 - p.y) / SUN.y), false);
  return c * 1.25 * (.62 + .45 * SUN.y) * (1. - .5 * clamp(sh * 1.6, 0., 1.));
}

float hg(float m, float g) { float g2 = g * g; return (1. - g2) / pow(1. + g2 - 2. * g * m, 1.5) * .0796; }

vec4 clouds(vec3 ro, vec3 rd, float tEnd) {
  float t0, t1;
  if (abs(rd.y) < 1e-4) { if (ro.y < B0 || ro.y > B1) return vec4(0.); t0 = 0.; t1 = tEnd; }
  else { float a = (B0 - ro.y) / rd.y, b = (B1 - ro.y) / rd.y; t0 = max(min(a, b), 0.); t1 = min(max(a, b), tEnd); }
  t1 = min(t1, t0 + 70.);
  if (t1 <= t0) return vec4(0.);
  float dith = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  float t = t0 + dith * (.045 + t0 * .016), T = 1.;
  vec3 acc = vec3(0.), hz = horizon();
  float mu = dot(rd, SUN), ph = mix(hg(mu, .62), hg(mu, -.18), .35) * 9.;
  for (int i = 0; i < 64; i++) {
    if (t > t1 || T < .03) break;
    float dt = .045 + t * .016;
    vec3 p = ro + rd * t;
    float d = density(p, t < 16.);
    if (d > .003) {
      float h = (p.y - B0) / (B1 - B0);
      float l = sunlight(p);
      vec3 amb = mix(vec3(.46, .53, .66), vec3(.8, .86, .97), h) * (.58 + .3 * step(B0, ro.y) * step(ro.y, B1));
      vec3 c = amb + vec3(1.2, 1.02, .8) * l * (.8 + ph * 1.3);
      c *= .74 + .26 * (1. - exp(-d * 5.));
      c = mix(c, hz, 1. - exp(-t * .024));
      float a = (1. - exp(-d * dt * 10.)) * (1. - smoothstep(60., 140., t));
      acc += T * a * c;
      T *= 1. - a;
    }
    t += dt;
  }
  return vec4(acc, 1. - T);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  vec3 ro = vec3(uX, uY, uZ);
  vec3 rd = normalize(vec3(uv.x, uv.y, 1.25));
  float cp = cos(uPitch), sp = sin(uPitch);
  rd = vec3(rd.x, rd.y * cp - rd.z * sp, rd.y * sp + rd.z * cp);
  vec3 col = skyCol(rd);
  float tg = rd.y < 0. ? -ro.y / rd.y : 1e9;
  if (rd.y < 0.) {
    vec3 g = groundCol(ro + rd * tg);
    col = mix(g, horizon(), 1. - exp(-tg * .04));
  }
  vec4 cl = clouds(ro, rd, min(tg, 160.));
  col = col * (1. - cl.a) + cl.rgb;
  col = 1. - exp(-col * 1.3);
  col = pow(col, vec3(.96, .97, 1.));
  vec2 q = gl_FragCoord.xy / uRes;
  col *= .9 + .1 * pow(16. * q.x * q.y * (1. - q.x) * (1. - q.y), .2);
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(41.3, 289.1))) * 43758.5) - .5) / 255.;
  fragColor = vec4(col, 1.);
}`;

// Two-channel noise for 3D lookups: green is red shifted by (37, 17), the usual trick for one-fetch 3D value noise.
function noise3Texture(gl) {
  const R = new Uint8Array(256 * 256);
  let s = 90210;
  for (let i = 0; i < R.length; i += 1) { s = (s * 1103515245 + 12345) & 0x7fffffff; R[i] = (s >> 16) & 255; }
  const data = new Uint8Array(256 * 256 * 2);
  for (let y = 0; y < 256; y += 1) for (let x = 0; x < 256; x += 1) {
    const i = y * 256 + x;
    data[i * 2] = R[i];
    data[i * 2 + 1] = R[((y - 17) & 255) * 256 + ((x - 37) & 255)];
  }
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, 256, 256, 0, gl.RG, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
}

// Feet to the scene's height units: the cloud deck sits between roughly 7,500 and 15,500 ft.
const FT = [[0, 0.16], [4000, 0.9], [11000, 2.35], [20000, 3.9], [43000, 7], [60000, 10]];
const worldY = (ft) => {
  for (let i = 1; i < FT.length; i += 1) if (ft <= FT[i][0]) { const [a, ya] = FT[i - 1], [b, yb] = FT[i]; return ya + (yb - ya) * (ft - a) / (b - a); }
  return FT[FT.length - 1][1];
};

const page = document.querySelector("[data-descent]");
if (page) {
  // Scroll position to altitude, pinned at each stop's centre.
  let stops = [];
  const measure = () => {
    const vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    stops = [...page.querySelectorAll("[data-alt]")].map((el, i) => {
      const r = el.getBoundingClientRect(), top = r.top + scrollY;
      const at = i === 0 ? 0 : clamp(top + r.height / 2 - vh / 2, 0, max);
      return [at, Number(el.dataset.alt)];
    });
    stops.push([max, 0]);
  };
  const altitude = (y) => {
    if (!stops.length) return 60000;
    if (y <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i += 1) if (y <= stops[i][0]) {
      const [a, fa] = stops[i - 1], [b, fb] = stops[i], k = (y - a) / ((b - a) || 1);
      return fa + (fb - fa) * (k * k * (3 - 2 * k));
    }
    return stops[stops.length - 1][1];
  };
  measure();
  addEventListener("resize", measure);
  new ResizeObserver(measure).observe(page);
  addEventListener("load", measure);

  // The instrument: an altitude tape with a rolling readout, in the cockpit typeface.
  const box = document.querySelector("[data-alt-instrument]"), tape = box && box.querySelector("canvas");
  const drawTape = (ft) => {
    if (!tape) return;
    const dpr = Math.min(2, devicePixelRatio || 1), W = tape.clientWidth, H = tape.clientHeight;
    if (tape.width !== Math.round(W * dpr)) { tape.width = Math.round(W * dpr); tape.height = Math.round(H * dpr); }
    const c = tape.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const small = W < 90, px = small ? 0.034 : 0.06, mid = H / 2;
    c.font = `400 ${small ? 10 : 12}px "B612 Mono", monospace`; c.textBaseline = "middle"; c.textAlign = "right";
    c.strokeStyle = "rgba(255,255,255,0.75)"; c.fillStyle = "rgba(255,255,255,0.86)"; c.lineWidth = 1;
    const span = H / px / 2, step = 200;
    for (let v = Math.ceil((ft - span) / step) * step; v <= ft + span; v += step) {
      if (v < 0) continue;
      const y = mid - (v - ft) * px, major = v % 1000 === 0;
      c.beginPath(); c.moveTo(W - (major ? 16 : 9), Math.round(y) + 0.5); c.lineTo(W, Math.round(y) + 0.5); c.stroke();
      if (major) c.fillText(v.toLocaleString("en-US"), W - 20, y);
    }
    if (ft < span) { const y = mid + ft * px; c.fillStyle = "rgba(120,80,40,0.45)"; c.fillRect(0, y, W, H - y); }
    // Readout window, last two digits on a drum.
    const bh = small ? 26 : 34, bw = W - 6, bx = 3, by = mid - bh / 2;
    c.fillStyle = "rgba(4,10,22,0.92)"; c.strokeStyle = "#f2cf3a"; c.lineWidth = 1.5;
    c.beginPath(); c.rect(bx, by, bw, bh); c.fill(); c.stroke();
    const shown = Math.max(0, Math.round(ft / 20) * 20), sub = shown % 100, th = Math.floor(shown / 1000), hd = Math.floor(shown / 100) % 10;
    const head = th ? `${th.toLocaleString("en-US")},${hd}` : String(hd || "");
    c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
    c.fillStyle = "#58e07c"; c.textAlign = "right";
    const big = small ? 12 : 16;
    c.font = `700 ${big}px "B612 Mono", monospace`;
    const drumW = c.measureText("00").width, headX = bx + bw - drumW - 5;
    c.fillText(head, headX, mid + 1);
    const frac = ((ft % 20) + 20) % 20 / 20, lineH = small ? 13 : 17;
    for (let k = -2; k <= 2; k += 1) {
      const v = ((sub + k * 20) % 100 + 100) % 100;
      c.fillText(String(v).padStart(2, "0"), bx + bw - 5, mid + 1 - (k - frac) * lineH);
    }
    c.restore();
    c.fillStyle = "rgba(255,255,255,0.7)"; c.textAlign = "right"; c.font = `400 ${small ? 9 : 10}px "B612 Mono", monospace`;
    c.fillText("FT", W - 6, small ? 10 : 14);
  };

  // "Play Aloft": the clouds come up to meet you, then the game loads.
  let dive = null;
  const takeoff = document.querySelector("[data-takeoff]");
  if (takeoff) takeoff.addEventListener("click", (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reducedMotion.matches) return;
    e.preventDefault();
    dive = { t0: performance.now(), from: shownFt };
    document.documentElement.classList.add("is-taking-off");
    setTimeout(() => { location.href = takeoff.href; }, 1000);
  });
  addEventListener("pageshow", (e) => { if (e.persisted) { dive = null; document.documentElement.classList.remove("is-taking-off"); } });

  // The sky.
  const canvas = document.querySelector("[data-sky]");
  const gl = canvas && context(canvas);
  let ft = altitude(scrollY), shownFt = ft, drift = 0;
  const prog = gl && program(gl, FRAG, "lukas-sky");
  if (prog) {
    fullscreen(gl);
    noise3Texture(gl);
    prog.use();
    gl.uniform1i(prog.u("uN"), 0);
    const still = reducedMotion.matches;
    const frame = (t, dt, { width, height }) => {
      shownFt += (ft - shownFt) * Math.min(1, dt * 7);
      let dip = 0;
      if (dive) {
        // Taking off for Aloft: drop straight into the cloud deck.
        const k = clamp((performance.now() - dive.t0) / 900), e = k * k * k;
        shownFt = dive.from + (9000 - dive.from) * e;
        dip = 0.35 * e;
      }
      if (!still) drift += dt;
      const y = worldY(shownFt), k = clamp(y / 10);
      gl.viewport(0, 0, width, height);
      gl.uniform2f(prog.u("uRes"), width, height);
      gl.uniform1f(prog.u("uTime"), still ? 40 : drift + 40);
      gl.uniform1f(prog.u("uY"), y);
      gl.uniform1f(prog.u("uPitch"), 0.03 + 0.09 * k + dip);
      gl.uniform1f(prog.u("uZ"), drift * 0.12 + (60000 - shownFt) / 60000 * 30);
      gl.uniform1f(prog.u("uX"), Math.sin(drift * 0.03) * 0.6);
      gl.uniform1f(prog.u("uCov"), -0.3 * (1 - clamp((y - 0.4) / 4)) ** 1.5);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      drawTape(shownFt);
    };
    const run = loop(canvas, frame, { maxScale: 0.62, minScale: 0.3, startScale: matchMedia("(pointer: coarse)").matches ? 0.36 : 0.5 });
    if (still) {
      addEventListener("scroll", () => { ft = altitude(scrollY); shownFt = ft; run.once(); }, { passive: true });
      run.once();
    } else run.start();
  } else {
    if (canvas) canvas.remove();
    document.documentElement.classList.add("no-gl");
    const tick = () => { shownFt = ft; drawTape(ft); };
    addEventListener("scroll", tick, { passive: true });
    tick();
  }
  addEventListener("scroll", () => { ft = altitude(scrollY); }, { passive: true });
  if (document.fonts) document.fonts.load('700 17px "B612 Mono"').then(() => drawTape(shownFt)).catch(() => {});

  // Cards lean toward the pointer, with a little glare.
  if (!reducedMotion.matches && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    page.querySelectorAll("[data-card]").forEach((card) => {
      const frame = card.querySelector(".card__frame");
      card.addEventListener("pointermove", (e) => {
        const r = frame.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        card.classList.add("is-tilting");
        frame.style.setProperty("--ry", `${((x - 0.5) * 6).toFixed(2)}deg`);
        frame.style.setProperty("--rx", `${((0.5 - y) * 5).toFixed(2)}deg`);
        frame.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        frame.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
        frame.style.setProperty("--glare", "1");
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilting");
        ["--rx", "--ry"].forEach((p) => frame.style.setProperty(p, "0deg"));
        frame.style.setProperty("--glare", "0");
      });
    });
  }
}

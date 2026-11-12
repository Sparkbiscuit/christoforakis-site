// Foxy: four photographs and the weather in each. Snow settles on the prints and can be brushed off;
// leaves land and slide away; the pointer is the wind.
import { reducedMotion, clamp } from "./gl.js";

const root = document.querySelector("[data-weather]");
const canvas = document.querySelector("[data-sky]");
const station = document.querySelector("[data-station]");
const shots = [...document.querySelectorAll("[data-season]")];

const SEASONS = {
  autumn: { bg: [43, 28, 18], leaves: 1.2, snow: 0, motes: 0, now: "leaves falling" },
  flurries: { bg: [52, 58, 66], leaves: 0.08, snow: 0.35, motes: 0, now: "first snow" },
  snow: { bg: [70, 82, 96], leaves: 0, snow: 2.4, motes: 0, now: "heavy snow" },
  sun: { bg: [38, 52, 30], leaves: 0, snow: 0, motes: 0.7, now: "sunny" }
};

let active = shots[0] ? shots[0].dataset.season : "autumn";
const pickSeason = () => {
  let best = active, area = 0;
  const vh = innerHeight;
  shots.forEach((s) => {
    const r = s.getBoundingClientRect(), a = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) * r.width;
    if (a > area) { area = a; best = s.dataset.season; }
  });
  if (best !== active) {
    active = best;
    if (station) station.querySelector("[data-now]").textContent = SEASONS[active].now;
  }
};

// The page colour follows the weather.
const bg = SEASONS[active].bg.slice();
const paintBg = (dt) => {
  const t = SEASONS[active].bg, k = 1 - Math.exp(-dt * 2.2);
  for (let i = 0; i < 3; i += 1) bg[i] += (t[i] - bg[i]) * k;
  document.body.style.backgroundColor = `rgb(${bg.map((v) => Math.round(v)).join(",")})`;
};

if (root && canvas && !reducedMotion.matches) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); };
  resize();
  addEventListener("resize", resize);

  // Drifts: a height per few pixels along the top of each print.
  const COL = 3;
  const drifts = new Map(shots.map((s) => [s, { h: new Float32Array(600), leaves: [] }]));

  const parts = [];
  // A soft flake: near flakes are out of focus.
  const flake = document.createElement("canvas");
  flake.width = flake.height = 64;
  { const f = flake.getContext("2d"), g = f.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0)"); f.fillStyle = g; f.fillRect(0, 0, 64, 64); }
  const rate = { leaves: 0, snow: 0, motes: 0 };
  const LEAF = ["#c8612a", "#d98b2b", "#a4441f", "#e0b04a", "#8c5a2b"];

  const spawn = (kind) => {
    if (kind === "snow") {
      const z = Math.random();
      parts.push({ kind, x: Math.random() * (W + 200) - 100, y: -10, vx: 0, vy: 30 + z * 60, r: 0.8 + z * 2.6, z, ph: Math.random() * 6.28 });
    } else if (kind === "leaves") {
      parts.push({ kind, x: Math.random() * (W + 300) - 150, y: -20, vx: 10 + Math.random() * 20, vy: 38 + Math.random() * 40, r: 7 + Math.random() * 8, z: Math.random(), ph: Math.random() * 6.28, spin: (Math.random() - 0.5) * 4, a: Math.random() * 6.28, c: LEAF[(Math.random() * LEAF.length) | 0] });
    } else {
      parts.push({ kind, x: Math.random() * W, y: H * (0.2 + Math.random() * 0.8), vx: 6 + Math.random() * 10, vy: -4 - Math.random() * 8, r: 1 + Math.random() * 2, z: Math.random(), ph: Math.random() * 6.28, life: 6 + Math.random() * 6, age: 0 });
    }
  };

  // The pointer is the wind, and brushes snow off the prints.
  const wind = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0 };
  addEventListener("pointermove", (e) => {
    const now = performance.now(), dt = Math.max(8, now - wind.t) / 1000;
    wind.vx = clamp((e.clientX - wind.x) / dt, -2400, 2400); wind.vy = clamp((e.clientY - wind.y) / dt, -2400, 2400);
    if (now - wind.t > 200) { wind.vx = 0; wind.vy = 0; }
    wind.x = e.clientX; wind.y = e.clientY; wind.t = now;
  }, { passive: true });

  let last = 0, sun = 0;
  const tick = (now) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    pickSeason();
    paintBg(dt);
    const S = SEASONS[active];
    for (const k of ["leaves", "snow", "motes"]) {
      rate[k] += (S[k] - rate[k]) * (1 - Math.exp(-dt * 1.5));
      const n = rate[k] * (k === "snow" ? 70 : k === "leaves" ? 7 : 4) * dt * (W / 1200 + 0.4);
      for (let i = 0; i < n; i += 1) if (Math.random() < n - i) spawn(k);
    }
    const t = now / 1000, still = now - wind.t > 120;
    if (still) { wind.vx *= 0.9; wind.vy *= 0.9; }
    const rects = shots.map((s) => s.querySelector("img").getBoundingClientRect());

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // Sun: a warm light from the upper right when the weather turns.
    sun += ((active === "sun" ? 1 : 0) - sun) * (1 - Math.exp(-dt * 1.2));
    if (sun > 0.01) {
      const g = ctx.createRadialGradient(W * 0.92, -H * 0.08, 0, W * 0.92, -H * 0.08, Math.max(W, H) * 0.95);
      g.addColorStop(0, `rgba(255,214,140,${0.34 * sun})`); g.addColorStop(0.4, `rgba(255,190,110,${0.12 * sun})`); g.addColorStop(1, "rgba(255,190,110,0)");
      ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over";
    }

    // Particles
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const p = parts[i];
      const dx = p.x - wind.x, dy = p.y - wind.y, d2 = dx * dx + dy * dy;
      if (d2 < 180 * 180) { const f = (1 - Math.sqrt(d2) / 180) * dt * (p.kind === "leaves" ? 5 : 3.5); p.vx += wind.vx * f * 0.6; p.vy += wind.vy * f * 0.4; }
      const py = p.y;
      if (p.kind === "snow") {
        p.vx += (Math.sin(t * 0.7 + p.ph) * 14 - p.vx) * dt * 1.2;
        p.vy += ((30 + p.z * 60) - p.vy) * dt * 1.5;
      } else if (p.kind === "leaves") {
        p.vx += (Math.sin(t * 1.3 + p.ph) * 60 + 18 - p.vx) * dt * 1.4;
        p.vy += ((38 + p.z * 40) * (0.6 + 0.6 * Math.abs(Math.cos(t * 1.6 + p.ph))) - p.vy) * dt * 2;
        p.a += p.spin * dt;
      } else {
        p.age += dt;
        p.vx += (Math.sin(t * 0.4 + p.ph) * 10 - p.vx) * dt;
        if (p.age > p.life) { parts.splice(i, 1); continue; }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;

      // Landing on the top edge of a print.
      if (p.kind !== "motes" && p.vy > 0) {
        for (let k = 0; k < rects.length; k += 1) {
          const r = rects[k], dr = drifts.get(shots[k]), ci = Math.floor((p.x - r.left) / COL);
          if (p.x < r.left || p.x > r.right) continue;
          const top = r.top - (dr.h[ci] || 0);
          if (py <= top && p.y > top) {
            if (p.kind === "snow" && p.z > 0.25) {
              for (let j = -4; j <= 4; j += 1) { const c = ci + j; if (c >= 0 && c < Math.ceil(r.width / COL)) dr.h[c] = Math.min(34, dr.h[c] + p.r * 0.32 * Math.exp(-j * j / 6)); }
              parts.splice(i, 1);
            } else if (p.kind === "leaves") {
              dr.leaves.push({ x: p.x - r.left, a: p.a, r: p.r, c: p.c, age: 0, life: 4 + Math.random() * 6, slide: (Math.random() - 0.5) * 12 });
              parts.splice(i, 1);
            }
            break;
          }
        }
        if (parts[i] !== p) continue;
      }
      if (p.y > H + 30 || p.x < -200 || p.x > W + 200 || p.y < -200) { parts.splice(i, 1); continue; }

      if (p.kind === "snow") {
        const blur = p.z > 0.82 ? 1 + (p.z - 0.82) * 22 : 1, size = p.r * 2.6 * blur;
        ctx.globalAlpha = (0.35 + p.z * 0.6) / Math.sqrt(blur);
        ctx.drawImage(flake, p.x - size / 2, p.y - size / 2, size, size);
      } else if (p.kind === "leaves") {
        drawLeaf(p.x, p.y, p.a, p.r, Math.cos(t * 3 + p.ph), p.c, 0.92);
      } else {
        const a = Math.sin(Math.PI * clamp(p.age / p.life));
        ctx.globalAlpha = a * 0.7; ctx.fillStyle = "#fff4c8";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        ctx.globalAlpha = a * 0.15; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Drifts and fallen leaves, drawn on the prints.
    rects.forEach((r, k) => {
      const dr = drifts.get(shots[k]), n = Math.min(dr.h.length, Math.ceil(r.width / COL));
      const melt = SEASONS[active].snow > 0.3 ? 0 : 3.5 * dt;
      // settle: neighbours share, steep bits slump
      for (let c = 1; c < n - 1; c += 1) {
        const avg = (dr.h[c - 1] + dr.h[c + 1]) / 2;
        if (dr.h[c] > avg + 1.2) dr.h[c] += (avg + 1.2 - dr.h[c]) * 0.2;
        dr.h[c] = Math.max(0, dr.h[c] - melt);
      }
      dr.h[0] = Math.max(0, dr.h[0] * 0.92 - melt); dr.h[n - 1] = Math.max(0, dr.h[n - 1] * 0.92 - melt);
      // the pointer brushes snow away
      if (wind.y > r.top - 40 && wind.y < r.top + 16 && wind.x > r.left && wind.x < r.right && (Math.abs(wind.vx) + Math.abs(wind.vy)) > 60) {
        const c0 = Math.floor((wind.x - r.left) / COL);
        for (let j = -9; j <= 9; j += 1) {
          const c = c0 + j;
          if (c < 0 || c >= n || dr.h[c] < 0.5) continue;
          const take = dr.h[c] * 0.35 * Math.exp(-j * j / 30);
          dr.h[c] -= take;
          if (Math.random() < take * 0.5) parts.push({ kind: "snow", x: r.left + c * COL, y: r.top - dr.h[c], vx: wind.vx * 0.25 + (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 60, r: 1 + Math.random() * 1.8, z: 0.1, ph: Math.random() * 6 });
        }
      }
      if (r.bottom < 0 || r.top > H + 40) return;
      let any = false;
      for (let c = 0; c < n; c += 1) if (dr.h[c] > 0.4) { any = true; break; }
      if (any) {
        ctx.beginPath(); ctx.moveTo(r.left, r.top + 1);
        for (let c = 0; c < n; c += 1) ctx.lineTo(r.left + c * COL + COL / 2, r.top + 1 - dr.h[c]);
        ctx.lineTo(r.right, r.top + 1); ctx.closePath();
        const g = ctx.createLinearGradient(0, r.top - 30, 0, r.top + 2);
        g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#dde6f0");
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = "rgba(160,180,205,0.5)"; ctx.lineWidth = 1; ctx.stroke();
      }
      dr.leaves = dr.leaves.filter((l) => (l.age += dt) < l.life);
      for (const l of dr.leaves) {
        const k2 = l.age / l.life;
        l.x += l.slide * dt;
        drawLeaf(r.left + l.x, r.top - (dr.h[Math.floor(l.x / COL)] || 0) - l.r * 0.3, l.a, l.r, 0.35, l.c, 1 - Math.max(0, (k2 - 0.75) * 4));
      }
    });
    requestAnimationFrame(tick);
  };

  function drawLeaf(x, y, a, r, flip, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(1, Math.max(0.15, Math.abs(flip)));
    ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-r, 0);
    ctx.bezierCurveTo(-r * 0.4, -r * 0.75, r * 0.5, -r * 0.65, r, 0);
    ctx.bezierCurveTo(r * 0.5, r * 0.65, -r * 0.4, r * 0.75, -r, 0);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.45; ctx.strokeStyle = "#3a1d0c"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-r * 1.25, 0); ctx.lineTo(r * 0.85, 0); ctx.stroke();
    ctx.restore(); ctx.globalAlpha = 1;
  }

  requestAnimationFrame(tick);
} else if (root) {
  const onScroll = () => { pickSeason(); document.body.style.backgroundColor = `rgb(${SEASONS[active].bg.join(",")})`; };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

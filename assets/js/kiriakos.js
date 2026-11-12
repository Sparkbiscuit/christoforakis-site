// Kiriakos: a box on the counter that opens with a little steam, and a letterboard menu.
import { reducedMotion, seeded } from "./gl.js";

const box = document.querySelector("[data-box]");
const steamCanvas = document.querySelector("[data-steam]");
const still = reducedMotion.matches;

// ---------- steam ----------
const steam = (() => {
  if (!steamCanvas || still) return { burst() {}, stop() {} };
  const ctx = steamCanvas.getContext("2d");
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 128;
  {
    const s = sprite.getContext("2d"), g = s.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(0.45, "rgba(255,255,255,0.22)"); g.addColorStop(1, "rgba(255,255,255,0)");
    s.fillStyle = g; s.fillRect(0, 0, 128, 128);
  }
  let parts = [], raf = 0, rate = 0, last = 0, visible = true, dpr = 1;
  const resize = () => {
    dpr = Math.min(1.5, devicePixelRatio || 1);
    steamCanvas.width = Math.round(steamCanvas.clientWidth * dpr);
    steamCanvas.height = Math.round(steamCanvas.clientHeight * dpr);
  };
  resize();
  new ResizeObserver(resize).observe(steamCanvas);
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible && (parts.length || rate > 0.01) && !raf) raf = requestAnimationFrame(tick); }).observe(steamCanvas);
  const area = () => {
    const c = steamCanvas.getBoundingClientRect(), f = box.querySelector(".box__floor").getBoundingClientRect();
    return { x: (f.left - c.left + f.width / 2) * dpr, y: (f.top - c.top + f.height / 2) * dpr, rx: f.width * 0.36 * dpr, ry: f.height * 0.3 * dpr };
  };
  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    const A = area();
    rate *= Math.exp(-dt / 2.4);
    const want = (rate + 0.06) * 60 * dt;
    for (let k = 0; k < want; k += 1) if (Math.random() < want - k) {
      const a = Math.random() * 6.283, r = Math.sqrt(Math.random());
      parts.push({ x: A.x + Math.cos(a) * r * A.rx, y: A.y + Math.sin(a) * r * A.ry, vx: (Math.random() - 0.5) * 8 * dpr, vy: -(26 + Math.random() * 30) * dpr, s: (18 + Math.random() * 26) * dpr, age: 0, life: 2.2 + Math.random() * 2.2, seed: Math.random() * 100 });
    }
    ctx.clearRect(0, 0, steamCanvas.width, steamCanvas.height);
    parts = parts.filter((p) => (p.age += dt) < p.life);
    for (const p of parts) {
      const k = p.age / p.life;
      p.vx += Math.sin(p.seed + p.age * 1.7 + p.y * 0.01) * 22 * dpr * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 1 - 0.25 * dt;
      const size = p.s * (1 + k * 2.6), alpha = Math.sin(Math.PI * Math.min(1, k * 1.25)) * 0.5 * (1 - k * 0.4);
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    if (visible && (parts.length || rate > 0.01)) raf = requestAnimationFrame(tick); else last = 0;
  }
  return {
    burst() { rate = 1; if (!raf) { last = 0; raf = requestAnimationFrame(tick); } },
    stop() { rate = 0; }
  };
})();

// ---------- the ticket: printed when you arrive ----------
{
  const now = new Date(), no = document.querySelector("[data-ticket-no]"), date = document.querySelector("[data-ticket-date]"), time = document.querySelector("[data-ticket-time]");
  if (no) no.textContent = String(100 + Math.floor(Math.random() * 900)).padStart(4, "0");
  if (date) date.textContent = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
  if (time) time.textContent = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ---------- the box ----------
if (box) {
  let auto = true;
  const set = (open) => {
    box.classList.toggle("is-open", open);
    box.setAttribute("aria-pressed", String(open));
    box.setAttribute("aria-label", open ? "A Mr. Pizza House box, open. Close it." : "A Mr. Pizza House box. Open it.");
    if (open) setTimeout(() => steam.burst(), still ? 0 : 380); else steam.stop();
  };
  const toggle = () => { auto = false; set(!box.classList.contains("is-open")); };
  box.addEventListener("click", toggle);
  box.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  if (still) set(true);
  else {
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      setTimeout(() => { if (auto) set(true); }, 900);
    }, { threshold: 0.5 });
    io.observe(box);
  }
}

// ---------- the letterboard ----------
const felt = document.querySelector("[data-felt]"), board = document.querySelector("[data-board]");
if (felt && board) {
  const rnd = seeded(671);
  let n = 0;
  felt.querySelectorAll("p").forEach((line, row) => {
    const text = line.textContent;
    line.setAttribute("aria-label", text || " ");
    line.textContent = "";
    for (const ch of text) {
      if (ch === " ") { line.append(" "); continue; }
      const i = document.createElement("i");
      i.textContent = ch;
      i.setAttribute("aria-hidden", "true");
      if (row === 0) i.className = "red";
      i.style.setProperty("--r", `${((rnd() - 0.5) * 5).toFixed(2)}deg`);
      i.style.setProperty("--y", `${((rnd() - 0.5) * 2.4).toFixed(2)}px`);
      i.style.setProperty("--d", `${(n * 14 + rnd() * 40).toFixed(0)}ms`);
      line.append(i);
      n += 1;
    }
  });
  if (still) board.classList.add("is-placed");
  else {
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      board.classList.add("is-placed");
    }, { threshold: 0.06 });
    io.observe(board);
  }
}

// Nicholas: the desk in his dorm room at golden hour, modeled from a phone scan of the real one.
// Scrolling walks the camera from thing to thing; each thing is a piece of work.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector("[data-room]");
const story = document.querySelector("[data-story]");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;

const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (k) => k * k * (3 - 2 * k);

let renderer = null;
try { renderer = canvas && new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); } catch (e) { renderer = null; }
if (renderer && story) build();

function build() {
  document.documentElement.classList.add("has-scene");
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.4 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b130d);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.1;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.02, 30);

  // ---------- painted textures ----------
  const tex = (w, h, draw, { repeat, color = true } = {}) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  };
  const oak = (seed, base = "#c8995f", dark = "86,52,24") => tex(1024, 512, (g, w, h) => {
    const r = rng(seed);
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, base); grd.addColorStop(0.5, "#d0a46c"); grd.addColorStop(1, base);
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i += 1) {
      const y0 = r() * h, amp = 2 + r() * 10, fr = 0.002 + r() * 0.01, ph = r() * 6.28;
      g.strokeStyle = `rgba(${dark},${(0.04 + r() * 0.16).toFixed(3)})`; g.lineWidth = 0.6 + r() * 2.4;
      g.beginPath();
      for (let x = 0; x <= w; x += 16) { const y = y0 + Math.sin(x * fr + ph) * amp + Math.sin(x * fr * 3.1 + ph * 2) * amp * 0.3; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 140; i += 1) { g.fillStyle = `rgba(255,236,200,${(0.05 + r() * 0.08).toFixed(3)})`; g.fillRect(r() * w, r() * h, 6 + r() * 26, 1 + r() * 1.5); }
  });
  const oakTop = oak(7), oakSide = oak(19, "#bf8f57"), oakDark = oak(33, "#a8794a", "60,36,16");
  const plaster = tex(512, 512, (g, w, h) => {
    const r = rng(5); g.fillStyle = "#e9e3d8"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i += 1) { const v = r(); g.fillStyle = v > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(90,70,50,0.04)"; g.fillRect(r() * w, r() * h, 2, 2); }
  }, { repeat: [3, 3] });
  const rug = tex(1400, 1000, (g, w, h) => {
    const r = rng(11);
    g.fillStyle = "#d9d3c7"; g.fillRect(0, 0, w, h);
    const ink = ["#2f3a4a", "#4c5b70", "#6f7f94", "#1f2732"];
    // field of small motifs
    for (let y = 70; y < h - 70; y += 22) for (let x = 70; x < w - 70; x += 22) {
      if (r() < 0.55) continue;
      g.fillStyle = ink[(r() * ink.length) | 0]; g.globalAlpha = 0.55 + r() * 0.4;
      const s = 3 + r() * 5;
      g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x, y + s); g.lineTo(x - s, y); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
    // medallion
    for (let k = 0; k < 7; k += 1) { g.strokeStyle = ink[k % 4]; g.lineWidth = 10 - k; g.beginPath(); g.ellipse(w / 2, h / 2, 250 - k * 30, 170 - k * 20, 0, 0, 7); g.stroke(); }
    for (let a = 0; a < 24; a += 1) { const t = a / 24 * 6.283; g.fillStyle = ink[a % 3]; g.beginPath(); g.ellipse(w / 2 + Math.cos(t) * 190, h / 2 + Math.sin(t) * 128, 18, 9, t, 0, 7); g.fill(); }
    // borders
    g.lineWidth = 26; g.strokeStyle = "#2f3a4a"; g.strokeRect(30, 30, w - 60, h - 60);
    g.lineWidth = 6; g.strokeStyle = "#6f7f94"; g.strokeRect(62, 62, w - 124, h - 124);
    for (let x = 40; x < w - 40; x += 28) { g.fillStyle = "#d9d3c7"; g.fillRect(x, 38, 10, 10); g.fillRect(x, h - 48, 10, 10); }
    for (let i = 0; i < 20000; i += 1) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"; g.fillRect(r() * w, r() * h, 2, 2); }
  });
  const linen = tex(256, 256, (g, w, h) => {
    const r = rng(3); g.fillStyle = "#efe4cf"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 2) { g.fillStyle = `rgba(120,96,64,${(0.05 + r() * 0.07).toFixed(3)})`; g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); }
  }, { repeat: [3, 1] });
  const keys = tex(512, 256, (g, w, h) => {
    g.fillStyle = "#2a2c30"; g.fillRect(0, 0, w, h);
    const rows = [14, 14, 13, 12, 11];
    rows.forEach((n, ri) => { const kw = (w - 20) / n, y = 18 + ri * 46; for (let k = 0; k < n; k += 1) { g.fillStyle = "#0e0f11"; g.fillRect(10 + k * kw + 2, y, kw - 5, 38); } });
    g.fillStyle = "#0e0f11"; g.fillRect(120, 18 + 5 * 46 - 4, 270, 30);
  });
  const outside = tex(1024, 512, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#9fb8d6"); sky.addColorStop(0.55, "#f2d3a6"); sky.addColorStop(1, "#f6c27e");
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const sun = g.createRadialGradient(w * 0.62, h * 0.6, 0, w * 0.62, h * 0.6, 260); sun.addColorStop(0, "rgba(255,240,205,1)"); sun.addColorStop(1, "rgba(255,220,170,0)");
    g.fillStyle = sun; g.fillRect(0, 0, w, h);
    const r = rng(23); g.filter = "blur(5px)";
    for (let i = 0; i < 60; i += 1) { const x = r() * w, y = h * (0.45 + r() * 0.35), s = 30 + r() * 90; g.fillStyle = `rgba(${(120 + r() * 70) | 0},${(80 + r() * 50) | 0},${(40 + r() * 20) | 0},${(0.35 + r() * 0.4).toFixed(2)})`; g.beginPath(); g.ellipse(x, y, s, s * 0.8, 0, 0, 7); g.fill(); }
    g.filter = "blur(1.5px)"; g.strokeStyle = "rgba(70,50,40,0.55)";
    for (let i = 0; i < 18; i += 1) { let x = r() * w, y = h; g.lineWidth = 3 + r() * 5; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k += 1) { x += (r() - 0.5) * 60; y -= 40 + r() * 50; g.lineTo(x, y); } g.stroke(); }
    g.filter = "none";
  });
  // leaves outside the window: they only cast shadows
  const gobo = tex(1024, 1024, (g, w, h) => {
    const r = rng(41); g.fillStyle = "#000"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.strokeStyle = "#fff";
    for (let i = 0; i < 9; i += 1) { g.lineWidth = 6 + r() * 10; g.beginPath(); let x = r() * w, y = h; g.moveTo(x, y); for (let k = 0; k < 7; k += 1) { x += (r() - 0.5) * 220; y -= 60 + r() * 120; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 420; i += 1) { const x = r() * w, y = r() * h * 0.85, s = 14 + r() * 36; g.beginPath(); g.ellipse(x, y, s, s * 0.6, r() * 3, 0, 7); g.fill(); }
  }, { color: false });
  const roundedScreen = (src, w, h, radius) => {
    const t = tex(w, h, (g) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); });
    const img = new Image(); img.src = src;
    img.onload = () => { const g = t.image.getContext("2d"); g.save(); g.beginPath(); g.roundRect(0, 0, w, h, radius); g.clip(); g.drawImage(img, 0, 0, w, h); g.restore(); t.needsUpdate = true; };
    return t;
  };

  // ---------- materials ----------
  const M = {
    wall: new THREE.MeshStandardMaterial({ map: plaster, color: 0xd9d0c2, roughness: 0.92 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x6b5340, roughness: 0.7 }),
    deskTop: new THREE.MeshPhysicalMaterial({ map: oakTop, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.35 }),
    oak: new THREE.MeshStandardMaterial({ map: oakSide, roughness: 0.55 }),
    oakDark: new THREE.MeshStandardMaterial({ map: oakDark, roughness: 0.55 }),
    sill: new THREE.MeshStandardMaterial({ color: 0xdcd8d0, roughness: 0.6 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf1eee8, roughness: 0.55 }),
    rug: new THREE.MeshStandardMaterial({ map: rug, roughness: 0.95 }),
    alu: new THREE.MeshStandardMaterial({ color: 0x8c9096, metalness: 0.85, roughness: 0.32 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.4 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a46a, metalness: 0.9, roughness: 0.28 }),
    walnut: new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.38 }),
    shade: new THREE.MeshStandardMaterial({ map: linen, color: 0xfff1da, emissive: 0xffa458, emissiveIntensity: 1.1, roughness: 0.9, side: THREE.DoubleSide }),
    globe: new THREE.MeshStandardMaterial({ color: 0xfff2dc, emissive: 0xffbf78, emissiveIntensity: 0.75, roughness: 0.6 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: 0xf6f3ee, roughness: 0.18, clearcoat: 0.8 }),
    tea: new THREE.MeshStandardMaterial({ color: 0x5a2e10, roughness: 0.1 }),
    bottle: new THREE.MeshPhysicalMaterial({ color: 0x173a2c, roughness: 0.25, clearcoat: 0.6 }),
    navy: new THREE.MeshStandardMaterial({ color: 0x1d2a48, roughness: 0.6 }),
    pot: new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.5 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f6b2e, roughness: 0.5, side: THREE.DoubleSide }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.04, metalness: 0, envMapIntensity: 1.2 }),
    outside: new THREE.MeshBasicMaterial({ map: outside, color: new THREE.Color(1.5, 1.35, 1.15) }),
    print: new THREE.MeshStandardMaterial({ roughness: 0.82 }),
    phoneBody: new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.7, roughness: 0.35 })
  };
  new THREE.TextureLoader().load("/assets/nicholas/river.jpg", (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; M.print.map = t; M.print.needsUpdate = true; });
  const screenAloft = new THREE.TextureLoader().load("/assets/nicholas/aloft-screen.jpg", (t) => { t.colorSpace = THREE.SRGBColorSpace; });

  const add = (geo, mat, x, y, z, { shadow = true, receive = true, parent = scene, ry = 0, rx = 0, rz = 0 } = {}) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = shadow; m.receiveShadow = receive; parent.add(m); return m;
  };
  const box = (w, h, d, mat, x, y, z, o = {}) => add(o.r ? new RoundedBoxGeometry(w, h, d, 3, o.r) : new THREE.BoxGeometry(w, h, d), mat, x, y, z, o);
  // x0..x1, y0..y1, z0..z1 helper
  const slab = (x0, x1, y0, y1, z0, z1, mat, o = {}) => box(x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, o);

  // ---------- the room (measured from the scan: desk top 0.75 m, sill 0.82 m) ----------
  const WIN = { x: 0.95, z0: -0.42, z1: 0.62, y0: 0.86, y1: 2.06 };
  add(new THREE.PlaneGeometry(8, 8), M.floor, -1, 0, 1, { rx: -Math.PI / 2, shadow: false });
  add(new THREE.PlaneGeometry(1.75, 1.25), M.rug, -0.35, 0.004, 0.3, { rx: -Math.PI / 2, shadow: false });
  add(new THREE.PlaneGeometry(4.6, 2.8), M.wall, -1.35, 1.4, -0.6, { shadow: false });
  // the window wall, built around its opening so the sun only gets in through the glass
  slab(WIN.x, WIN.x + 0.14, 0, WIN.y0, -0.6, 3, M.wall);
  slab(WIN.x, WIN.x + 0.14, WIN.y1, 2.8, -0.6, 3, M.wall);
  slab(WIN.x, WIN.x + 0.14, WIN.y0, WIN.y1, -0.6, WIN.z0, M.wall);
  slab(WIN.x, WIN.x + 0.14, WIN.y0, WIN.y1, WIN.z1, 3, M.wall);
  slab(-3.2, 1.2, 2.8, 2.86, -0.62, 3, M.wall, { receive: false });
  // sill, radiator cover, casing, sashes and glass
  slab(0.46, 1.02, 0.8, 0.86, -0.5, 0.72, M.sill, { r: 0.008 });
  slab(0.58, 0.95, 0.02, 0.8, -0.48, 0.7, M.white);
  for (let k = 0; k < 18; k += 1) slab(0.575, 0.585, 0.08, 0.74, -0.44 + k * 0.064, -0.425 + k * 0.064, M.sill, { shadow: false });
  const casing = 0.06;
  slab(WIN.x - 0.02, WIN.x + 0.005, WIN.y1, WIN.y1 + casing, WIN.z0 - casing, WIN.z1 + casing, M.oak);
  slab(WIN.x - 0.02, WIN.x + 0.005, WIN.y0 - 0.0, WIN.y1, WIN.z0 - casing, WIN.z0, M.oak);
  slab(WIN.x - 0.02, WIN.x + 0.005, WIN.y0 - 0.0, WIN.y1, WIN.z1, WIN.z1 + casing, M.oak);
  const SX = 1.03, cols = [WIN.z0, (WIN.z0 + WIN.z1) / 2, WIN.z1], rail = 0.045, mun = 0.022;
  const PANES = [];
  for (let s = 0; s < 2; s += 1) {
    const a = cols[s], b = cols[s + 1];
    slab(SX - 0.02, SX + 0.02, WIN.y0, WIN.y0 + rail, a, b, M.oak); slab(SX - 0.02, SX + 0.02, WIN.y1 - rail, WIN.y1, a, b, M.oak);
    slab(SX - 0.02, SX + 0.02, WIN.y0, WIN.y1, a, a + rail, M.oak); slab(SX - 0.02, SX + 0.02, WIN.y0, WIN.y1, b - rail, b, M.oak);
    const za = a + rail, zb = b - rail, ya = WIN.y0 + rail, yb = WIN.y1 - rail, zm = (za + zb) / 2;
    slab(SX - 0.012, SX + 0.012, ya, yb, zm - mun / 2, zm + mun / 2, M.oak);
    for (let k = 1; k < 3; k += 1) { const y = ya + (yb - ya) * k / 3; slab(SX - 0.012, SX + 0.012, y - mun / 2, y + mun / 2, za, zb, M.oak); }
    for (let c = 0; c < 2; c += 1) for (let rI = 0; rI < 3; rI += 1) {
      const z0 = c ? zm + mun / 2 : za, z1 = c ? zb : zm - mun / 2, y0 = ya + (yb - ya) * rI / 3 + (rI ? mun / 2 : 0), y1 = ya + (yb - ya) * (rI + 1) / 3 - (rI < 2 ? mun / 2 : 0);
      PANES.push({ z0, z1, y0, y1 });
    }
  }
  add(new THREE.PlaneGeometry(WIN.z1 - WIN.z0, WIN.y1 - WIN.y0), M.glass, SX + 0.004, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2, { ry: -Math.PI / 2, shadow: false, receive: false });
  add(new THREE.PlaneGeometry(9, 5), M.outside, 4.2, 1.3, 0.2, { ry: -Math.PI / 2, shadow: false, receive: false });

  // ---------- the desk ----------
  box(1.0, 0.032, 0.62, M.deskTop, -0.13, 0.749, -0.25, { r: 0.006 });
  slab(0.0, 0.37, 0.0, 0.733, -0.56, 0.04, M.oak);
  slab(-0.63, -0.6, 0.0, 0.733, -0.56, 0.04, M.oak);
  slab(-0.6, 0.0, 0.62, 0.733, -0.56, 0.035, M.oak);
  slab(-0.6, 0.0, 0.3, 0.62, -0.56, -0.54, M.oak);
  const drawer = (x0, x1, y0, y1, z) => { slab(x0 + 0.004, x1 - 0.004, y0 + 0.004, y1 - 0.004, z, z + 0.018, M.oakDark, { r: 0.004 }); box(0.09, 0.016, 0.022, M.oak, (x0 + x1) / 2, y1 - 0.045, z + 0.028, { r: 0.006 }); };
  drawer(-0.6, 0.0, 0.625, 0.73, 0.035);
  drawer(0.0, 0.37, 0.5, 0.73, 0.04); drawer(0.0, 0.37, 0.26, 0.5, 0.04); drawer(0.0, 0.37, 0.02, 0.26, 0.04);

  // the chair, pulled out a little
  const chair = new THREE.Group(); chair.position.set(-0.36, 0, 0.5); chair.rotation.y = 0.32; scene.add(chair);
  box(0.42, 0.028, 0.4, M.oak, 0, 0.45, 0, { r: 0.008, parent: chair });
  for (const [x, z] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) box(0.03, 0.45, 0.03, M.oak, x, 0.225, z, { r: 0.006, parent: chair });
  for (const x of [-0.18, 0.18]) box(0.03, 0.42, 0.03, M.oak, x, 0.66, 0.17, { r: 0.006, parent: chair, rx: 0.08 });
  box(0.42, 0.13, 0.018, M.oak, 0, 0.8, 0.19, { r: 0.008, parent: chair, rx: 0.12 });

  // the dresser, its globe lamp, and the poster above it all
  slab(-1.45, -0.68, 0, 0.955, -0.6, -0.07, M.oak);
  slab(-1.47, -0.66, 0.955, 0.985, -0.61, -0.05, M.deskTop, { r: 0.006 });
  for (let k = 0; k < 3; k += 1) { const y0 = 0.05 + k * 0.3, y1 = y0 + 0.28; slab(-1.43, -0.7, y0, y1, -0.07, -0.05, M.oakDark, { r: 0.004 }); for (const x of [-1.25, -0.88]) add(new THREE.SphereGeometry(0.012, 12, 8), M.oak, x, y1 - 0.06, -0.04); }
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.02, 32), M.white, -0.98, 0.995, -0.36);
  const globe = add(new THREE.SphereGeometry(0.16, 48, 32), M.globe, -0.98, 1.16, -0.36, { shadow: false });
  const globeLight = new THREE.PointLight(0xffc07a, 0.7, 3.2, 2); globeLight.position.set(-0.98, 1.16, -0.2); scene.add(globeLight);
  void globe;
  const frame = new THREE.Group(); frame.position.set(-0.2, 1.5, -0.585); scene.add(frame);
  const FW = 1.2, FH = FW * 1366 / 2200 + 0.04;
  box(FW + 0.06, 0.03, 0.035, M.oak, 0, FH / 2 + 0.015, 0, { parent: frame }); box(FW + 0.06, 0.03, 0.035, M.oak, 0, -FH / 2 - 0.015, 0, { parent: frame });
  box(0.03, FH, 0.035, M.oak, -FW / 2 - 0.015, 0, 0, { parent: frame }); box(0.03, FH, 0.035, M.oak, FW / 2 + 0.015, 0, 0, { parent: frame });
  const print = add(new THREE.PlaneGeometry(FW, FW * 1366 / 2200), M.print, 0, 0, 0.004, { parent: frame, shadow: false });
  add(new THREE.PlaneGeometry(FW, FH), M.white, 0, 0, 0.001, { parent: frame, shadow: false });

  // the table lamp
  add(new THREE.CylinderGeometry(0.085, 0.09, 0.02, 48), M.brass, 0.24, 0.775, -0.43);
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 16), M.walnut, 0.24, 0.995, -0.43);
  add(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 16), M.brass, 0.24, 1.2, -0.43);
  const shade = add(new THREE.CylinderGeometry(0.12, 0.15, 0.21, 64, 1, true), M.shade, 0.24, 1.255, -0.43, { shadow: false });
  void shade;
  const lampSpot = new THREE.SpotLight(0xffa85c, 2.2, 3, 1.0, 0.85, 2);
  lampSpot.position.set(0.24, 1.2, -0.43); lampSpot.target.position.set(0.15, 0.7, -0.3); lampSpot.castShadow = true; lampSpot.shadow.mapSize.set(1024, 1024); lampSpot.shadow.bias = -0.0008;
  scene.add(lampSpot, lampSpot.target);
  const lampGlow = new THREE.PointLight(0xffa85c, 0.45, 2.5, 2); lampGlow.position.set(0.24, 1.3, -0.43); scene.add(lampGlow);

  // the laptop, open on Aloft
  const laptop = new THREE.Group(); laptop.position.set(-0.24, 0.765, -0.27); laptop.rotation.y = -0.06; scene.add(laptop);
  box(0.357, 0.016, 0.248, M.alu, 0, 0.008, 0, { r: 0.006, parent: laptop });
  add(new THREE.PlaneGeometry(0.3, 0.115), new THREE.MeshStandardMaterial({ map: keys, roughness: 0.6 }), 0, 0.0165, -0.045, { parent: laptop, rx: -Math.PI / 2, shadow: false });
  add(new THREE.PlaneGeometry(0.15, 0.09), new THREE.MeshStandardMaterial({ color: 0x9a9ea4, metalness: 0.6, roughness: 0.3 }), 0, 0.0166, 0.068, { parent: laptop, rx: -Math.PI / 2, shadow: false });
  const lid = new THREE.Group(); lid.position.set(0, 0.016, -0.124); lid.rotation.x = -1.83 + Math.PI / 2; laptop.add(lid);
  box(0.357, 0.248, 0.007, M.alu, 0, 0.124, -0.0035, { r: 0.003, parent: lid });
  add(new THREE.PlaneGeometry(0.35, 0.24), M.black, 0, 0.124, 0.0002, { parent: lid, shadow: false });
  const laptopScreen = add(new THREE.PlaneGeometry(0.336, 0.21), new THREE.MeshBasicMaterial({ map: screenAloft, color: new THREE.Color(1.15, 1.15, 1.15) }), 0, 0.128, 0.0006, { parent: lid, shadow: false, receive: false });

  // two phones, screens up
  const phone = (src, x, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, 0.765, z); g.rotation.y = ry; scene.add(g);
    box(0.0715, 0.0083, 0.1467, M.phoneBody, 0, 0.0042, 0, { r: 0.0035, parent: g });
    const scr = add(new THREE.PlaneGeometry(0.066, 0.1415), new THREE.MeshBasicMaterial({ map: roundedScreen(src, 330, 707, 34), color: new THREE.Color(1.05, 1.05, 1.05), transparent: true }), 0, 0.0085, 0, { parent: g, rx: -Math.PI / 2, shadow: false, receive: false });
    return { g, scr };
  };
  const filuma = phone("/assets/apps/filuma-focus-660.jpg", 0.13, -0.11, 0.38);
  const meds = phone("/assets/apps/meds-supply-660.jpg", -0.53, -0.08, -0.3);

  // mug of tea, water bottle, a notebook and pen
  const mugProf = [[0, 0], [0.036, 0], [0.04, 0.004], [0.041, 0.095], [0.037, 0.095], [0.036, 0.008], [0, 0.008]].map(([r, y]) => new THREE.Vector2(r, y));
  add(new THREE.LatheGeometry(mugProf, 48), M.ceramic, 0.02, 0.765, -0.43);
  add(new THREE.CircleGeometry(0.036, 32), M.tea, 0.02, 0.765 + 0.075, -0.43, { rx: -Math.PI / 2, shadow: false });
  add(new THREE.TorusGeometry(0.026, 0.006, 12, 24, Math.PI), M.ceramic, 0.062, 0.765 + 0.048, -0.43, { rz: -Math.PI / 2 });
  add(new THREE.CylinderGeometry(0.045, 0.045, 0.19, 40), M.bottle, 0.1, 0.765 + 0.095, -0.5);
  add(new THREE.CylinderGeometry(0.03, 0.034, 0.04, 32), M.black, 0.1, 0.765 + 0.21, -0.5);
  box(0.15, 0.012, 0.21, M.navy, -0.5, 0.771, -0.33, { r: 0.003, ry: 0.15 });
  add(new THREE.CylinderGeometry(0.004, 0.004, 0.14, 12), M.black, -0.43, 0.781, -0.3, { rz: Math.PI / 2, ry: 0.5 });

  // plants on the sill
  add(new THREE.CylinderGeometry(0.075, 0.06, 0.11, 32), M.pot, 0.74, 0.915, 0.42);
  add(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 32), M.pot, 0.72, 0.9, -0.3);
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.bezierCurveTo(0.03, 0.01, 0.035, 0.05, 0, 0.07); leafShape.bezierCurveTo(-0.035, 0.05, -0.03, 0.01, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 8);
  {
    const r = rng(9);
    const vines = [[0.74, 0.97, 0.42, -0.6, 0.06], [0.74, 0.97, 0.42, 0.4, 0.4], [0.74, 0.97, 0.42, -1.6, 0.1], [0.72, 0.94, -0.3, 2.2, 0.0]];
    const leaves = new THREE.InstancedMesh(leafGeo, M.leaf, 60); leaves.castShadow = true; let n = 0; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (const [x0, y0, z0, a, droop] of vines) {
      let x = x0, y = y0, z = z0;
      for (let k = 0; k < 12 && n < 60; k += 1) {
        x += Math.cos(a) * 0.018 * (1 + droop); z += Math.sin(a) * 0.022; y += 0.012 - k * 0.0025 * (droop * 6);
        y = Math.max(y, 0.865);
        e.set(-1.1 + r() * 0.8, a + r() * 1.4, r() * 0.8); q.setFromEuler(e);
        const s = 0.75 + r() * 0.6;
        m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s)); leaves.setMatrixAt(n++, m4);
      }
    }
    leaves.count = n; scene.add(leaves);
  }

  // the toy seaplane from the home page, parked on the sill
  const toy = toyPlane(); toy.position.set(0.72, 0.86, 0.08); toy.rotation.y = -Math.PI * 0.62; toy.scale.setScalar(0.24); scene.add(toy);

  // ---------- light ----------
  scene.add(new THREE.HemisphereLight(0x8fa2c4, 0x3a2618, 0.16));
  const sunDir = new THREE.Vector3(-0.8, -0.27, -0.52).normalize();
  const sun = new THREE.DirectionalLight(0xffb979, 4.2);
  sun.target.position.set(0, 0.8, -0.1); sun.position.copy(sun.target.position).addScaledVector(sunDir, -6);
  sun.castShadow = true; sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 1, far: 12 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
  sun.shadow.camera.layers.enable(1);
  scene.add(sun, sun.target);
  const leavesGobo = add(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ alphaMap: gobo, alphaTest: 0.5, side: THREE.DoubleSide }), 2.3, 1.7, 0.6, { receive: false });
  leavesGobo.layers.set(1);
  leavesGobo.lookAt(leavesGobo.position.clone().sub(sunDir));
  const goboBase = leavesGobo.position.clone();

  // ---------- shafts of light through each pane, and dust in them ----------
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(1.0, 0.72, 0.42) } },
    vertexShader: "varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }",
    fragmentShader: `varying vec2 vUv; varying vec3 vW; uniform float uTime; uniform vec3 uColor;
      float h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){
        float across=1.-pow(abs(vUv.x*2.-1.),2.2);
        float along=smoothstep(0.,.06,vUv.y)*pow(1.-vUv.y,1.6);
        float dust=.55+.45*n3(vW*7.+vec3(0.,uTime*.05,uTime*.03));
        float a=across*along*dust*.075;
        gl_FragColor=vec4(uColor*a,a);
      }`
  });
  const L = sunDir.clone(), beams = new THREE.Group(); scene.add(beams);
  for (const p of PANES) {
    const c = new THREE.Vector3(SX, (p.y0 + p.y1) / 2, (p.z0 + p.z1) / 2), len = 3.2;
    for (const [axis, width] of [[new THREE.Vector3(0, 0, 1), p.z1 - p.z0], [new THREE.Vector3(0, 1, 0), p.y1 - p.y0]]) {
      const across = axis.clone().sub(L.clone().multiplyScalar(axis.dot(L))).normalize().multiplyScalar(width / 2);
      const g = new THREE.BufferGeometry();
      const a0 = c.clone().sub(across), a1 = c.clone().add(across), b0 = a0.clone().addScaledVector(L, len), b1 = a1.clone().addScaledVector(L, len);
      g.setAttribute("position", new THREE.Float32BufferAttribute([...a0.toArray(), ...a1.toArray(), ...b0.toArray(), ...b1.toArray()], 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2));
      g.setIndex([0, 1, 2, 2, 1, 3]);
      beams.add(new THREE.Mesh(g, beamMat));
    }
  }
  const DUST = 700, dpos = new Float32Array(DUST * 3), r0 = rng(77);
  for (let i = 0; i < DUST; i += 1) {
    const p = PANES[(r0() * PANES.length) | 0], t = r0() * 2.6;
    const v = new THREE.Vector3(SX, p.y0 + r0() * (p.y1 - p.y0), p.z0 + r0() * (p.z1 - p.z0)).addScaledVector(L, t);
    v.x += (r0() - 0.5) * 0.15; v.y += (r0() - 0.5) * 0.15; v.z += (r0() - 0.5) * 0.15;
    dpos.set(v.toArray(), i * 3);
  }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uL: { value: L }, uWin: { value: new THREE.Vector4(WIN.z0, WIN.z1, WIN.y0, WIN.y1) }, uSX: { value: SX } },
    vertexShader: `uniform float uTime, uScale, uSX; uniform vec3 uL; uniform vec4 uWin; varying float vLit;
      void main(){
        vec3 p=position; float s=fract(sin(dot(p,vec3(12.9,78.2,37.7)))*437.5);
        p+=vec3(sin(uTime*.13+s*40.),sin(uTime*.09+s*17.)*1.3,cos(uTime*.11+s*29.))*.035;
        float t=(uSX-p.x)/uL.x; vec3 w=p+uL*t;
        vLit=step(uWin.x,w.z)*step(w.z,uWin.y)*step(uWin.z,w.y)*step(w.y,uWin.w);
        vec4 mv=viewMatrix*modelMatrix*vec4(p,1.);
        gl_PointSize=uScale*(1.2+s*1.6)/-mv.z; gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `varying float vLit; void main(){ vec2 d=gl_PointCoord-.5; float a=smoothstep(.5,.0,length(d))*vLit*.4; gl_FragColor=vec4(vec3(1.,.85,.62)*a,a); }`
  });
  scene.add(new THREE.Points(dustGeo, dustMat));

  // ---------- post ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.26, 0.6, 0.96);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- shots ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const SHOTS = {
    intro: { pos: V(-1.75, 1.55, 2.05), tgt: V(0.05, 1.02, -0.25), fov: 38, shift: [-0.3, 0.02] },
    filuma: { pos: V(0.16, 1.0, 0.2), tgt: V(0.13, 0.77, -0.1), fov: 34, shift: [-0.42, 0.05] },
    meds: { pos: V(-0.46, 0.99, 0.22), tgt: V(-0.53, 0.77, -0.07), fov: 34, shift: [-0.42, 0.05] },
    aloft: { pos: V(-0.36, 1.02, 0.36), tgt: V(-0.24, 0.9, -0.36), fov: 38, shift: [0.42, 0] },
    river: { pos: V(-0.66, 1.56, 0.66), tgt: V(-0.34, 1.66, -0.58), fov: 36, shift: [0.32, 0] },
    window: { pos: V(-0.02, 1.32, 1.08), tgt: V(0.95, 1.16, 0.02), fov: 48, shift: [-0.34, 0] }
  };
  const sections = [...story.querySelectorAll("[data-shot]")].map((el) => ({ el, shot: SHOTS[el.dataset.shot] || SHOTS.intro }));
  let marks = [];
  const measure = () => {
    const vh = innerHeight;
    marks = sections.map(({ el }) => { const top = el.offsetTop, h = el.offsetHeight; return { a: top + (h - vh) * 0.05, b: top + Math.max(0, h - vh) * 0.62 }; });
    marks[0].a = 0;
  };
  measure();
  addEventListener("resize", measure);
  addEventListener("load", measure);

  const cur = { pos: SHOTS.intro.pos.clone(), tgt: SHOTS.intro.tgt.clone(), fov: 40, sx: SHOTS.intro.shift[0], sy: 0 };
  const want = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 40, sx: 0, sy: 0 };
  let activeIdx = -1;
  const place = () => {
    const y = scrollY;
    let i = 0;
    while (i < marks.length - 1 && y > marks[i].b) i += 1;
    let A = sections[i].shot, B = A, k = 0, on = i;
    if (i > 0 && y < marks[i].a) { A = sections[i - 1].shot; B = sections[i].shot; k = ease(clamp((y - marks[i - 1].b) / Math.max(1, marks[i].a - marks[i - 1].b))); on = k < 0.5 ? i - 1 : i; }
    want.pos.lerpVectors(A.pos, B.pos, k); want.tgt.lerpVectors(A.tgt, B.tgt, k);
    // lift the path a little mid-move so it never skims the desk
    want.pos.y += Math.sin(Math.PI * k) * 0.12;
    const narrow = innerWidth < 760;
    want.fov = (A.fov + (B.fov - A.fov) * k) * (narrow ? 1.35 : 1);
    want.sx = narrow ? 0 : A.shift[0] + (B.shift[0] - A.shift[0]) * k;
    want.sy = narrow ? -0.42 : A.shift[1] + (B.shift[1] - A.shift[1]) * k;
    if (on !== activeIdx) { activeIdx = on; sections.forEach((s, j) => s.el.classList.toggle("is-on", j === on)); }
  };
  place();

  // ---------- hover and click ----------
  const pickables = [
    { obj: filuma.g, id: "filuma", glow: filuma.scr.material },
    { obj: meds.g, id: "meds", glow: meds.scr.material },
    { obj: laptop, id: "aloft", glow: laptopScreen.material },
    { obj: frame, id: "river" },
    { obj: toy, id: "hello" }
  ];
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(9, 9);
  let hot = null, px = 0, py = 0;
  canvas.style.pointerEvents = "auto";
  addEventListener("pointermove", (e) => { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); px = mouse.x; py = mouse.y; }, { passive: true });
  story.style.pointerEvents = "none";
  story.querySelectorAll(".panel__in").forEach((p) => { p.style.pointerEvents = "auto"; });
  canvas.addEventListener("click", () => { if (hot) document.getElementById(hot.id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); });
  story.querySelectorAll("[data-goto]").forEach((a) => a.addEventListener("click", (e) => { const id = a.getAttribute("href").slice(1); const el = document.getElementById(id); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); history.replaceState(null, "", "#" + id); } }));

  // ---------- run ----------
  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    dustMat.uniforms.uScale.value = h * renderer.getPixelRatio() * 0.012;
  };
  resize();
  addEventListener("resize", resize);

  const clock = new THREE.Clock();
  let first = true;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    place();
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3.2);
    cur.pos.lerp(want.pos, k); cur.tgt.lerp(want.tgt, k);
    cur.fov += (want.fov - cur.fov) * k; cur.sx += (want.sx - cur.sx) * k; cur.sy += (want.sy - cur.sy) * k;
    const sway = reduced ? 0 : 1;
    camera.position.copy(cur.pos).add(new THREE.Vector3(Math.sin(t * 0.21) * 0.012 + px * 0.025, Math.sin(t * 0.17) * 0.008 + py * 0.015, 0).multiplyScalar(sway));
    camera.lookAt(cur.tgt);
    camera.fov = cur.fov; camera.updateProjectionMatrix();
    camera.projectionMatrix.elements[8] += cur.sx; camera.projectionMatrix.elements[9] += cur.sy;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    if (!reduced) {
      leavesGobo.position.set(goboBase.x, goboBase.y + Math.sin(t * 0.6) * 0.03, goboBase.z + Math.sin(t * 0.43) * 0.05 + Math.sin(t * 1.3) * 0.012);
      beamMat.uniforms.uTime.value = t; dustMat.uniforms.uTime.value = t;
    }
    // hover
    ray.setFromCamera(mouse, camera);
    let found = null;
    for (const p of pickables) { if (ray.intersectObject(p.obj, true).length) { found = p; break; } }
    if (found !== hot) {
      if (hot && hot.glow) hot.glow.color.setScalar(1.05);
      hot = found;
      if (hot && hot.glow) hot.glow.color.setScalar(1.35);
      canvas.classList.toggle("is-hot", !!hot);
    }
    composer.render(dt);
    if (first) { first = false; requestAnimationFrame(() => document.documentElement.classList.add("is-lit")); }
  });
  void print;
}

// The same chubby enamel seaplane as on the home page, as a three.js mesh.
function toyPlane() {
  const P = [], C = [], I = [];
  const WHITE = [0.96, 0.94, 0.89], YEL = [0.95, 0.8, 0.22], NAVY = [0.11, 0.16, 0.29], GLASS = [0.2, 0.32, 0.5];
  const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  const shape = (nu, nv, at, color) => {
    const start = P.length / 3;
    for (let i = 0; i <= nu; i += 1) for (let j = 0; j <= nv; j += 1) { const p = at(i / nu, j / nv); P.push(...p); C.push(...color(p)); }
    for (let i = 0; i < nu; i += 1) for (let j = 0; j < nv; j += 1) { const a = start + i * (nv + 1) + j, b = a + nv + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  };
  const blob = (cx, cy, cz, rx, ry, rz, e1, e2, color) => shape(14, 24, (u, v) => {
    const la = -Math.PI / 2 + u * Math.PI, lo = -Math.PI + v * Math.PI * 2, cu = Math.cos(la);
    return [cx + rx * sp(cu, e1) * sp(Math.cos(lo), e2), cy + ry * sp(Math.sin(la), e1), cz + rz * sp(cu, e1) * sp(Math.sin(lo), e2)];
  }, color);
  const prof = [[-0.52, 0.0], [-0.5, 0.03], [-0.38, 0.055], [-0.2, 0.09], [0.0, 0.118], [0.16, 0.125], [0.3, 0.118], [0.38, 0.105], [0.43, 0.085], [0.46, 0.05], [0.47, 0.0]];
  const rAt = (z) => { for (let k = 1; k < prof.length; k += 1) if (z <= prof[k][0]) { const [z0, r0] = prof[k - 1], [z1, r1] = prof[k], t = (z - z0) / (z1 - z0); return r0 + (r1 - r0) * (t * t * (3 - 2 * t)); } return 0; };
  shape(36, 24, (u, v) => { const z = -0.52 + u * 0.99, r = rAt(z), a = -Math.PI + v * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r * 1.08 + (z < -0.2 ? (z + 0.2) * -0.12 : 0), z]; },
    ([x, y, z]) => (z > 0.38 ? NAVY : z > 0.06 && z < 0.27 && y > 0.045 && Math.abs(x) < 0.11 ? GLASS : y > -0.025 && y < 0.018 ? YEL : y > -0.04 && y <= -0.025 ? NAVY : WHITE));
  blob(0, 0, 0.49, 0.045, 0.045, 0.05, 1, 1, () => YEL);
  blob(0, 0.138, 0.1, 0.64, 0.026, 0.105, 0.5, 0.32, ([x]) => (Math.abs(x) > 0.53 ? YEL : WHITE));
  blob(0, 0.04, -0.45, 0.22, 0.016, 0.065, 0.5, 0.4, () => WHITE);
  blob(0, 0.13, -0.44, 0.017, 0.12, 0.075, 0.5, 0.45, ([, y]) => (y > 0.19 ? NAVY : YEL));
  for (const sx of [-1, 1]) {
    blob(sx * 0.2, -0.245, 0.03, 0.052, 0.046, 0.37, 0.75, 0.75, ([, y]) => (y > -0.215 ? NAVY : WHITE));
    blob(sx * 0.13, -0.15, 0.14, 0.012, 0.08, 0.016, 0.8, 0.8, () => NAVY);
    blob(sx * 0.13, -0.15, -0.1, 0.012, 0.08, 0.016, 0.8, 0.8, () => NAVY);
  }
  blob(0, 0.06, 0.5, 0.018, 0.11, 0.006, 0.6, 0.6, () => [0.2, 0.2, 0.24]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(C.map((v) => Math.pow(v, 2.2)), 3));
  g.setIndex(I); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide }));
  mesh.castShadow = true; mesh.receiveShadow = true;
  const wrap = new THREE.Group(); wrap.add(mesh); mesh.position.y = 0.29;
  return wrap;
}

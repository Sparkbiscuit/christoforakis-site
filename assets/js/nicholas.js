// Nicholas: his desk, modelled in Blender to the measurements of a phone scan of the real one, lit by the sun
// through a window just out of frame (or by its lamps at night). Each thing on it is a piece of work: pick it in the
// index or in the room and the camera goes to it; pick it again and it opens.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const room = document.querySelector("[data-desk]");
const canvas = room && room.querySelector("[data-room]");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const mixv = (a, b, k) => a + (b - a) * k;

const ORDER = ["desk", "filuma", "meds", "aloft", "site", "river", "hello"];
const NAMES = { filuma: ["Filuma", "iPhone app"], meds: ["Meds Ahead", "iPhone app"], aloft: ["Aloft", "flight game"], site: ["This site", "you’re on it"], river: ["The river print", "66 × 42 in"], hello: ["Say hi", "coffee"], lamp: ["The lamp", "switch it"] };
const OPEN = { filuma: "https://apps.apple.com/app/filuma/id6792247549", meds: "https://apps.apple.com/us/app/meds-ahead-supply-tracker/id6804540619", aloft: "/aloft/", site: "/", river: "/assets/nicholas/river.jpg", hello: "/contact/" };

let renderer = null;
try { renderer = canvas && new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); } catch (e) { renderer = null; }
if (renderer) build();
else document.documentElement.classList.remove("has-scene");

function build() {
  document.documentElement.classList.add("has-scene");
  const narrowQ = matchMedia("(max-width: 820px), (max-aspect-ratio: 4/5)");
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x15110d);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(36, 1, 0.03, 30);

  // ---------- light ----------
  const hemi = new THREE.HemisphereLight(0xbfd2ee, 0x6b5440, 0.5);
  scene.add(hemi);
  // the sun, through a window just to the right of the frame: a spot far away, with the window panes as its cookie
  const cookie = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, 512, 512);
    // the window: two sashes of six panes, slightly soft
    g.filter = "blur(3px)"; g.fillStyle = "#fff";
    const x0 = 120, y0 = 70, w = 272, h = 372, mull = 9;
    for (let col = 0; col < 3; col += 1) for (let row = 0; row < 4; row += 1) {
      const pw = (w - mull * 4) / 3, ph = (h - mull * 5) / 4;
      g.fillRect(x0 + mull + col * (pw + mull), y0 + mull + row * (ph + mull), pw, ph);
    }
    // a few leaves outside
    g.filter = "blur(6px)"; g.fillStyle = "rgba(0,0,0,0.55)";
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 26; i += 1) { g.beginPath(); g.ellipse(x0 + r() * w, y0 + r() * h * 0.6, 10 + r() * 26, 6 + r() * 14, r() * 3, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const sun = new THREE.SpotLight(0xffd9a8, 0, 0, 0.36, 0.25, 0);
  sun.map = cookie;
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.015;
  sun.shadow.camera.near = 3; sun.shadow.camera.far = 9;
  scene.add(sun, sun.target);
  sun.target.position.set(-0.05, 0.95, -0.2);
  // the table lamp throws a cone down onto the desk and a glow up the wall; the globe glows on its own
  const lampSpot = new THREE.SpotLight(0xffb46a, 0, 2.6, 1.12, 0.85, 1.6);
  lampSpot.castShadow = true; lampSpot.shadow.mapSize.set(1024, 1024); lampSpot.shadow.bias = -0.0004; lampSpot.shadow.normalBias = 0.01;
  lampSpot.shadow.camera.near = 0.05;
  const lampGlow = new THREE.PointLight(0xffa860, 0, 3.2, 1.7);
  const globeGlow = new THREE.PointLight(0xffc488, 0, 3.0, 1.7);
  scene.add(lampSpot, lampSpot.target, lampGlow, globeGlow);

  // ---------- the room ----------
  const H = {}; // interactive groups by key
  const groupOf = new Map(); // mesh -> key
  let model = null;
  const loader = new GLTFLoader();
  const tl = new THREE.TextureLoader();
  const screenTex = (src, flip = true) => { const t = tl.load(src, () => { renderer.initTexture(t); }); t.colorSpace = THREE.SRGBColorSpace; t.flipY = flip; t.anisotropy = 8; return t; };
  // glTF's texture coordinates start at the top of the image, so these load unflipped
  const screens = { mbp_screen: screenTex("/assets/nicholas/screen-home.jpg", false), phone_screen_a: screenTex("/assets/nicholas/screen-filuma.jpg", false), phone_screen_b: screenTex("/assets/nicholas/screen-meds.jpg", false), print: screenTex("/assets/nicholas/river.jpg", false) };
  const lit = { shade: null, bulb: null, globe: null, screens: [] };

  loader.load("/assets/nicholas/desk.glb?v=20261114", (gltf) => {
    model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = !/wall|floor|screen|print|baseboard/.test(o.name);
      o.receiveShadow = true;
      const m = o.material;
      if (!m) return;
      if (m.map) m.map.anisotropy = 8;
      if (screens[m.name]) {
        const sm = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: screens[m.name], emissiveIntensity: 1, roughness: 0.18, metalness: 0 });
        sm.name = m.name; o.material = sm; o.castShadow = false; lit.screens.push(sm);
      } else if (m.name === "lamp_shade") {
        m.side = THREE.DoubleSide; m.emissive = new THREE.Color(0xffb366); m.emissiveMap = m.map; m.emissiveIntensity = 0; lit.shade = m; o.castShadow = false;
      } else if (m.name === "bulb") { m.emissiveIntensity = 0; lit.bulb = m; o.castShadow = false; }
      else if (m.name === "globe_glass") { m.emissive = new THREE.Color(0xffc68a); m.emissiveIntensity = 0; lit.globe = m; o.castShadow = false; }
      else if (m.name === "glass_black") { m.roughness = 0.05; m.envMapIntensity = 1.4; }
      else if (m.name === "wall") { m.envMapIntensity = 0.2; }
    });
    // the print: a plain material with the river on it
    model.traverse((o) => { if (o.isMesh && o.name === "river_print") o.material = new THREE.MeshStandardMaterial({ map: screens.print, roughness: 0.78 }); });
    scene.add(model);
    const find = (name) => model.getObjectByName(name);
    const groups = { filuma: "iphone_filuma_stand", meds: "iphone_meds_stand", site: "macbook", river: "board", hello: "mug", aloft: "toy_plane", lamp: "table_lamp" };
    for (const [key, name] of Object.entries(groups)) {
      const g = find(name); if (!g) continue;
      H[key] = { node: g, meshes: [], home: g.position.clone() };
      g.traverse((o) => { if (o.isMesh) { H[key].meshes.push(o); groupOf.set(o, key); } });
      // each group gets its own copies of its materials, so it can glow on its own when pointed at
      for (const o of H[key].meshes) { if (!lit.screens.includes(o.material) && o.material !== lit.shade && o.material !== lit.bulb) { o.material = o.material.clone(); o.material.userData.glow = true; } }
    }
    // where the lights sit, from the model
    const bulb = find("lamp_bulb"), globe = find("globe_glass");
    if (bulb) { const p = bulb.getWorldPosition(new THREE.Vector3()); lampSpot.position.copy(p).add(new THREE.Vector3(0, 0.02, 0)); lampSpot.target.position.copy(p).add(new THREE.Vector3(-0.1, -1, 0.12)); lampGlow.position.copy(p).add(new THREE.Vector3(0, 0.1, 0.02)); }
    if (globe) { const p = globe.getWorldPosition(new THREE.Vector3()); globeGlow.position.copy(p).add(new THREE.Vector3(0.05, 0.14, 0.12)); }
    // the plane flies; the stand it would sit on doesn't exist, so it starts in the air
    if (H.aloft) { H.aloft.node.position.set(0.36, 1.12, -0.04); }
    shotsFromModel();
    room.classList.add("is-lit");
    go(location.hash.slice(1) && ORDER.includes(location.hash.slice(1)) ? location.hash.slice(1) : "desk", true);
  }, undefined, () => { document.documentElement.classList.remove("has-scene"); });

  // ---------- dust in the sunlight ----------
  const dust = (() => {
    const N = 420, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i += 1) { pos[i * 3] = -0.2 + Math.random() * 0.9; pos[i * 3 + 1] = 0.8 + Math.random() * 1.1; pos[i * 3 + 2] = -0.3 + Math.random() * 0.7; seed[i] = Math.random() * 100; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uA: { value: 0 }, uPx: { value: 1 } },
      vertexShader: `attribute float seed; uniform float uT, uPx; varying float vA;
        void main(){ vec3 p=position; p.x+=sin(uT*.07+seed)*.05; p.y+=sin(uT*.05+seed*1.7)*.04; p.z+=cos(uT*.06+seed*.7)*.04;
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uPx*(1.4+fract(seed)*1.8)*(1./-mv.z);
          vA=.5+.5*sin(uT*.6+seed*3.); }`,
      fragmentShader: `uniform float uA; varying float vA; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(vec3(1.,.86,.62)*uA*vA*(1.-d*2.),1.); }`
    });
    const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p);
    return m;
  })();

  // ---------- light shafts from the window ----------
  const shafts = (() => {
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uA: { value: 0 }, uT: { value: 0 } },
      vertexShader: "varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
      fragmentShader: `uniform float uA, uT; varying vec2 vU;
        void main(){ float bars=smoothstep(.0,.08,fract(vU.y*4.)) * smoothstep(1.,.92,fract(vU.y*4.));
          float a=uA*smoothstep(0.,.25,vU.x)*smoothstep(1.,.55,vU.x)*smoothstep(0.,.1,vU.y)*smoothstep(1.,.9,vU.y)*(.6+.4*bars);
          a*=.8+.2*sin(vU.x*9.-uT*.3);
          gl_FragColor=vec4(vec3(1.,.82,.58)*a,1.); }`
    });
    const g = new THREE.PlaneGeometry(1, 1); g.translate(0.5, 0, 0);
    const q = new THREE.Mesh(g, m); q.frustumCulled = false; scene.add(q);
    return { m, q };
  })();

  // ---------- post ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (!coarse) {
    try { gtao = new GTAOPass(scene, camera, 1, 1); gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 0.85; gtao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.6, thickness: 1.2, scale: 1.0, samples: 12 }); composer.addPass(gtao); } catch (e) { gtao = null; }
  }
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 0.55, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- shots ----------
  const SH = {
    desk: { p: [0.2, 1.36, 2.05], t: [-0.06, 1.1, -0.16], fov: 37 },
    site: { p: [-0.2475, 1.07, 0.47], t: [-0.2475, 0.885, -0.1], fov: 33 },
    river: { p: [-0.17, 1.38, 0.86], t: [-0.19, 1.43, -0.31], fov: 40 },
    hello: { p: [0.47, 1.01, 0.62], t: [0.3, 0.83, 0.14], fov: 30 },
    aloft: { p: [0.36, 1.26, 0.96], t: [0.36, 1.12, -0.05], fov: 34 },
    filuma: { p: [0.0, 0.98, 0.45], t: [0.01, 0.85, 0.08], fov: 30 },
    meds: { p: [0.12, 0.98, 0.5], t: [0.15, 0.85, 0.04], fov: 30 }
  };
  function shotsFromModel() {
    // the phones: straight on to each screen, from a little above
    for (const [key, name] of [["filuma", "iphone_filuma_screen"], ["meds", "iphone_meds_screen"]]) {
      const s = model.getObjectByName(name); if (!s) continue;
      s.geometry.computeBoundingBox();
      const c = s.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(s.matrixWorld);
      const n = new THREE.Vector3().fromBufferAttribute(s.geometry.attributes.normal, 0).applyMatrix3(new THREE.Matrix3().getNormalMatrix(s.matrixWorld)).normalize();
      SH[key] = { p: c.clone().addScaledVector(n, 0.36).add(new THREE.Vector3(0, 0.03, 0)).toArray(), t: c.toArray(), fov: 30 };
    }
    const m = model.getObjectByName("mbp_screen");
    if (m) {
      m.geometry.computeBoundingBox();
      const c = m.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(m.matrixWorld);
      const n = new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.normal, 0).applyMatrix3(new THREE.Matrix3().getNormalMatrix(m.matrixWorld)).normalize();
      SH.site = { p: c.clone().addScaledVector(n, 0.62).toArray(), t: c.toArray(), fov: 33 };
    }
  }

  // ---------- state ----------
  const cam = { p: new THREE.Vector3(...SH.desk.p), t: new THREE.Vector3(...SH.desk.t), fov: SH.desk.fov, from: null, to: null, k: 1 };
  let active = "desk", hover = null, lampOn = null;
  const look = { x: 0, y: 0, tx: 0, ty: 0 };

  const index = [...room.querySelectorAll("[data-go]")];
  const cards = [...room.querySelectorAll("[data-card]")];
  const stepNav = room.querySelector("[data-step-nav]");
  const tag = room.querySelector("[data-tag]");
  function go(key, instant = false) {
    if (!SH[key]) key = "desk";
    active = key;
    room.dataset.active = key;
    for (const b of index) b.setAttribute("aria-current", String(b.dataset.go === key));
    for (const c of cards) c.classList.toggle("is-open", c.dataset.card === key);
    const card = cards.find((c) => c.dataset.card === key);
    if (stepNav) { stepNav.hidden = !card; if (card) card.append(stepNav); }
    const s = SH[key];
    cam.from = { p: cam.p.clone(), t: cam.t.clone(), fov: cam.fov };
    cam.to = { p: new THREE.Vector3(...s.p), t: new THREE.Vector3(...s.t), fov: s.fov };
    cam.k = instant || reduced ? 1 : 0;
    if (cam.k === 1) { cam.p.copy(cam.to.p); cam.t.copy(cam.to.t); cam.fov = cam.to.fov; }
    if (!instant) history.replaceState(null, "", key === "desk" ? location.pathname : "#" + key);
  }
  index.forEach((b) => {
    b.addEventListener("click", () => go(b.dataset.go));
    b.addEventListener("pointerenter", () => { hover = b.dataset.go === "desk" ? null : b.dataset.go; });
    b.addEventListener("pointerleave", () => { hover = null; });
  });
  room.addEventListener("click", (e) => { const s = e.target.closest("[data-step]"); if (!s) return; const i = ORDER.indexOf(active); go(ORDER[(i + Number(s.dataset.step) + ORDER.length) % ORDER.length]); });
  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    if (e.key === "Escape") go("desk");
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const i = ORDER.indexOf(active); go(ORDER[(i + (e.key === "ArrowRight" ? 1 : -1) + ORDER.length) % ORDER.length]); }
  });

  // pointing at things in the room
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let pointer = null, pick = null;
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    look.tx = (pointer.x / r.width - 0.5) * 2; look.ty = (pointer.y / r.height - 0.5) * 2;
  });
  canvas.addEventListener("pointerleave", () => { pointer = null; pick = null; });
  canvas.addEventListener("click", () => {
    if (pick === "lamp") { lampOn = !(lampOn ?? lampAuto()); return; }
    if (pick) { if (pick === active && OPEN[pick]) location.href = OPEN[pick]; else go(pick); return; }
    if (active !== "desk") go("desk");
  });
  const doPick = () => {
    if (!pointer || !model) { pick = null; return; }
    ndc.set((pointer.x / pointer.w) * 2 - 1, -(pointer.y / pointer.h) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(model.children, true);
    pick = null;
    for (const h of hits) { if (groupOf.has(h.object)) { pick = groupOf.get(h.object); break; } if (!/screen|print/.test(h.object.name)) break; }
  };

  // ---------- light: the visitor's clock, or what they choose (shared with the chart on the home page) ----------
  const LIGHT_KEY = "isl-light";
  const prefersDark = matchMedia("(prefers-color-scheme: dark)");
  const readLight = () => { const q = new URLSearchParams(location.search).get("time"); if (q === "day" || q === "night" || q === "dusk") return q; try { const v = localStorage.getItem(LIGHT_KEY); if (v === "day" || v === "night" || v === "now") return v; } catch (e) { /* private */ } return prefersDark.matches ? "night" : "now"; };
  let mode = readLight();
  const hourFor = (m) => ({ day: 15.2, night: 22.5, dusk: 17.3 }[m] ?? (new Date().getHours() + new Date().getMinutes() / 60));
  let hour = hourFor(mode), sweep = null;
  const lightButtons = [...room.querySelectorAll("[data-light]")];
  const showLight = () => lightButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.light === mode)));
  lightButtons.forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.light === mode) return;
    mode = b.dataset.light; lampOn = null;
    try { if (mode === "now" && !prefersDark.matches) localStorage.removeItem(LIGHT_KEY); else localStorage.setItem(LIGHT_KEY, mode); } catch (e) { /* private */ }
    let span = (hourFor(mode) - hour + 24) % 24; if (span > 20) span -= 24;
    sweep = { from: hour, span, k: 0 };
    showLight();
  }));
  showLight();
  const sunAt = (h) => { const el = 62 * Math.sin(Math.PI * (h - 6) / 12); return el; };
  const lampAuto = () => sunAt(hour) < 14;

  // ---------- size ----------
  let W = 1, Hh = 1;
  const size = () => {
    W = canvas.clientWidth; Hh = canvas.clientHeight;
    renderer.setSize(W, Hh, false); composer.setSize(W, Hh);
    if (gtao) gtao.setSize(W * renderer.getPixelRatio(), Hh * renderer.getPixelRatio());
    camera.aspect = W / Hh;
  };
  new ResizeObserver(size).observe(canvas); size();

  // ---------- frame ----------
  const clock = new THREE.Clock();
  const tmpUp = new THREE.Vector3(), basis = new THREE.Matrix4();
  const planePath = (s) => {
    // a lazy oval around the lamp, with a loop-the-loop once a lap
    const a = s * 0.55, P = new THREE.Vector3(0.36 + Math.cos(a) * 0.3, 1.12 + Math.sin(a * 2) * 0.035, -0.05 + Math.sin(a) * 0.17);
    const lap = ((a / (Math.PI * 2)) % 1 + 1) % 1, k = clamp((lap - 0.22) / 0.16);
    if (k > 0 && k < 1) {
      const ph = ease(k) * Math.PI * 2, f = new THREE.Vector3(-Math.sin(a) * 0.3, 0, Math.cos(a) * 0.17).normalize();
      P.addScaledVector(f, Math.sin(ph) * 0.07); P.y += (1 - Math.cos(ph)) * 0.07;
    }
    return P;
  };
  function frame() {
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    // hour
    if (sweep) { sweep.k = Math.min(1, sweep.k + dt / (reduced ? 0.01 : 2.2)); hour = (sweep.from + sweep.span * ease(sweep.k) + 24) % 24; if (sweep.k >= 1) sweep = null; }
    else if (mode === "now") hour = hourFor("now");
    const el = sunAt(hour), day = clamp((el + 4) / 16), gold = day * (1 - clamp((el - 12) / 30)), lamps = lampOn ?? lampAuto();
    // sun from the right, low and warm in the afternoon
    const elev = THREE.MathUtils.degToRad(clamp(el, 6, 42)), az = THREE.MathUtils.degToRad(hour < 12 ? 22 : -14);
    const dir = new THREE.Vector3(Math.cos(elev) * Math.cos(az), Math.sin(elev), Math.cos(elev) * Math.sin(az) + 0.18).normalize();
    sun.position.copy(sun.target.position).addScaledVector(dir, 6);
    sun.intensity = 22 * day;
    sun.color.setRGB(1, mixv(0.95, 0.78, gold), mixv(0.86, 0.56, gold));
    hemi.intensity = mixv(0.05, 0.26, day); hemi.color.setRGB(mixv(0.35, 0.78, day), mixv(0.42, 0.84, day), mixv(0.65, 0.95, day));
    const lk = lamps ? 1 : 0;
    lampSpot.intensity += (lk * 2.4 - lampSpot.intensity) * Math.min(1, dt * 6);
    lampGlow.intensity += (lk * 0.9 - lampGlow.intensity) * Math.min(1, dt * 6);
    const gk = (1 - day) * 0.9;
    globeGlow.intensity = gk * 0.7;
    if (lit.shade) lit.shade.emissiveIntensity = lampSpot.intensity / 2.4 * 0.9;
    if (lit.bulb) lit.bulb.emissiveIntensity = lampSpot.intensity / 2.4 * 6;
    if (lit.globe) lit.globe.emissiveIntensity = gk * 1.1;
    for (const m of lit.screens) m.emissiveIntensity = mixv(1.05, 0.85, day);
    renderer.toneMappingExposure = mixv(1.15, 0.82, day);
    scene.environmentIntensity = mixv(0.06, 0.2, day);
    dust.uniforms.uA.value = 0.55 * day * (0.5 + 0.5 * gold); dust.uniforms.uT.value = t; dust.uniforms.uPx.value = 4 * renderer.getPixelRatio();
    shafts.m.uniforms.uA.value = 0.05 * day; shafts.m.uniforms.uT.value = t;
    // the beam: a long card from the window's side down to the desk, turned to face the camera about its own axis
    {
      const from = sun.target.position.clone().addScaledVector(dir, 1.25).add(new THREE.Vector3(0, 0.25, 0.05));
      const ax = dir.clone().negate(), view = camera.position.clone().sub(from).normalize();
      const side = new THREE.Vector3().crossVectors(ax, view).normalize(), nrm = new THREE.Vector3().crossVectors(ax, side);
      shafts.q.matrixAutoUpdate = false;
      shafts.q.matrix.makeBasis(ax.multiplyScalar(1.45), side.multiplyScalar(0.62), nrm).setPosition(from);
    }

    // camera: ease to the chosen shot, lean a little toward the pointer
    if (cam.k < 1 && cam.to) {
      cam.k = Math.min(1, cam.k + dt / 1.15);
      const e = ease(cam.k);
      cam.p.lerpVectors(cam.from.p, cam.to.p, e); cam.t.lerpVectors(cam.from.t, cam.to.t, e); cam.fov = mixv(cam.from.fov, cam.to.fov, e);
      // arc up and back a touch on the way, so the move reads as a move
      cam.p.y += Math.sin(e * Math.PI) * 0.08;
    }
    // on Aloft, the camera keeps the plane in view as it goes round
    if (active === "aloft" && cam.k >= 1 && H.aloft && !reduced) {
      const pp = H.aloft.node.position;
      cam.t.lerp(new THREE.Vector3(pp.x * 0.6 + 0.36 * 0.4, pp.y, pp.z * 0.5), Math.min(1, dt * 1.5));
      cam.p.lerp(new THREE.Vector3(pp.x * 0.5 + 0.2, pp.y + 0.16, 0.9), Math.min(1, dt * 0.8));
    }
    look.x += (look.tx * (pointer && !reduced ? 1 : 0) - look.x) * Math.min(1, dt * 2);
    look.y += (look.ty * (pointer && !reduced ? 1 : 0) - look.y) * Math.min(1, dt * 2);
    const narrow = narrowQ.matches;
    const sway = active === "desk" ? 0.05 : 0.018;
    camera.position.copy(cam.p).add(new THREE.Vector3(look.x * sway, -look.y * sway * 0.6, 0));
    camera.fov = cam.fov * (narrow ? 1.28 : 1);
    camera.lookAt(cam.t);
    camera.updateProjectionMatrix();
    // the subject sits to the right of the sidebar on wide screens
    camera.projectionMatrix.elements[8] = narrow ? 0 : -0.36;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    // the plane's lazy loops; it banks into turns and goes over the top in the loop
    if (H.aloft && model) {
      const s = reduced ? 1.2 : t, e2 = 0.01;
      const p0 = planePath(s - e2), p1 = planePath(s), p2 = planePath(s + e2);
      const v = p2.clone().sub(p0).divideScalar(2 * e2), acc = p2.clone().add(p0).sub(p1.clone().multiplyScalar(2)).divideScalar(e2 * e2);
      const f = v.clone().normalize();
      tmpUp.copy(acc).add(new THREE.Vector3(0, 0.55, 0)); tmpUp.addScaledVector(f, -tmpUp.dot(f)).normalize();
      const back = f.clone().negate(), right = new THREE.Vector3().crossVectors(tmpUp, back).normalize();
      basis.makeBasis(right, tmpUp, back);
      H.aloft.node.position.copy(p1);
      H.aloft.node.quaternion.setFromRotationMatrix(basis);
    }

    // pointing
    if (!coarse) doPick();
    const hot = pick || hover;
    canvas.classList.toggle("is-pointing", !!pick);
    for (const b of index) b.classList.toggle("is-hi", b.dataset.go === hot);
    for (const [key, g] of Object.entries(H)) {
      const want = key === hot && key !== active ? 1 : 0;
      g.glow = (g.glow || 0) + (want - (g.glow || 0)) * Math.min(1, dt * 10);
      for (const o of g.meshes) if (o.material.userData.glow) { o.material.emissive.setRGB(0.32, 0.2, 0.08); o.material.emissiveIntensity = g.glow * 0.35; }
      if (key !== "aloft" && key !== "river" && key !== "site" && key !== "lamp") g.node.position.y = g.home.y + g.glow * 0.008;
    }
    if (tag) {
      if (pick && pointer && NAMES[pick]) {
        const [n, d] = NAMES[pick];
        const label = pick === active && OPEN[pick] ? (pick === "site" ? "Open the chart" : pick === "aloft" ? "Play Aloft" : pick === "hello" ? "Reach out" : "Open") : pick === "lamp" ? (lampOn ?? lampAuto() ? "Turn it off" : "Turn it on") : d;
        tag.innerHTML = `${n}<small>${label}</small>`;
        tag.style.transform = `translate(${pointer.x + 16}px, ${pointer.y + 14}px)`;
        tag.classList.add("is-on");
      } else tag.classList.remove("is-on");
    }

    composer.render(dt);
  }
  renderer.setAnimationLoop(frame);
  document.addEventListener("visibilitychange", () => renderer.setAnimationLoop(document.hidden ? null : frame));
}

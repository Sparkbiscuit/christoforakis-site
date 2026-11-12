// The home page: a chart of seven islands, one for each of us, drawn for the visitor's time of day.
// "Take the plane" tilts the chart up into a world you can fly through; the island names stay links.
import { context, program, fullscreen, noiseTexture, loop, reducedMotion, clamp, mix } from "./gl.js";

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uT, uFov, uTilt, uNight, uBeam, uGold;
uniform vec3 uRo, uF, uR, uU, uSun, cSkyZ, cSkyH, cSun, cAmb, cDeep, cShal;
uniform vec2 uPlane, uPdir;
uniform sampler2D uN;
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return texture(uN,(i+f+.5)/256.).r; }
float fbm3(vec2 p){ return (.5*vn(p)+.25*vn(p*2.03+17.3)+.125*vn(p*4.01+31.7))/.875; }
float fbm5(vec2 p){ return (.5*vn(p)+.25*vn(p*2.03+17.3)+.125*vn(p*4.01+31.7)+.0625*vn(p*8.03+5.1)+.03125*vn(p*16.1+9.4))/.96875; }
float g(vec2 p, vec2 c, float r){ vec2 d=p-c; return exp(-dot(d,d)/(r*r)); }
float base(vec2 p){
  float h=.5*g(p,vec2(0.),.5);
  h+=.95*g(p,vec2(-3.05,1.5),.7)+.85*g(p,vec2(-2.3,1.95),.62);
  h+=.82*g(p,vec2(.05,2.4),.72)+.72*g(p,vec2(.95,2.55),.62);
  h+=.62*g(p,vec2(2.95,1.5),.95)+.3*g(p,vec2(3.45,1.05),.45);
  h+=1.8*g(p,vec2(2.75,-1.15),.8)-.42*g(p,vec2(2.75,-1.15),.13);
  h+=.38*g(p,vec2(.55,-2.55),.82)+.6*g(p,vec2(.18,-2.3),.28)+.62*g(p,vec2(.92,-2.28),.28);
  float rk=length(p-vec2(-1.9,-1.75)); h+=.62*exp(-pow((rk-.6)/.23,2.));
  return h;
}
float terr(vec2 p){ float n=fbm3(p*1.6+3.); return base(p)*(.62+.75*n)+.16*(n-.5)-.2; }
float terrD(vec2 p){ float n=fbm5(p*1.6+3.); return base(p)*(.62+.75*n)+.16*(n-.5)-.2; }
vec3 isleTint(vec2 p){
  vec3 c=vec3(0.); float w=.0001;
  float a;
  a=g(p,vec2(0.),.9); c+=a*vec3(.95,.8,.2); w+=a;
  a=g(p,vec2(-2.7,1.7),1.3); c+=a*vec3(.2,.55,.9); w+=a;
  a=g(p,vec2(.5,2.45),1.3); c+=a*vec3(.66,.5,.9); w+=a;
  a=g(p,vec2(3.0,1.45),1.3); c+=a*vec3(.35,.78,.5); w+=a;
  a=g(p,vec2(2.75,-1.15),1.3); c+=a*vec3(.92,.32,.38); w+=a;
  a=g(p,vec2(.55,-2.45),1.2); c+=a*vec3(.95,.55,.2); w+=a;
  a=g(p,vec2(-1.9,-1.75),1.3); c+=a*vec3(.93,.72,.15); w+=a;
  return c/w;
}
float shadow(vec3 p){
  float res=1., s=.04;
  for(int i=0;i<12;i++){ vec3 q=p+uSun*s; float d=q.y-terr(q.xz); res=min(res,10.*d/s); s+=clamp(d,.04,.3); if(res<.02||q.y>2.4) break; }
  return clamp(res,0.,1.);
}
float lights(vec2 p){
  float l=0.;
  l+=g(p,vec2(-2.62,1.02),.07)+g(p,vec2(-2.05,1.5),.06)+g(p,vec2(.3,1.86),.07)+g(p,vec2(1.3,2.15),.06);
  l+=g(p,vec2(2.5,.87),.07)+g(p,vec2(3.55,1.8),.06)+g(p,vec2(2.1,-.75),.08)+g(p,vec2(3.25,-1.85),.06);
  l+=g(p,vec2(.6,-1.98),.07)+g(p,vec2(-1.9,-1.75),.09)+g(p,vec2(-1.35,-1.35),.06)+g(p,vec2(-2.35,-2.3),.06);
  return l;
}
vec3 sky(vec3 rd){
  vec3 c=mix(cSkyH,cSkyZ,pow(clamp(rd.y,0.,1.),.55));
  float sd=max(dot(rd,uSun),0.);
  c+=cSun*(pow(sd,900.)*3.+pow(sd,7.)*.34);
  float cl=fbm5(rd.xz/(rd.y+.22)*1.4+vec2(uT*.012,0.));
  c=mix(c,mix(cSkyH,vec3(1.),.45)+cSun*.3,smoothstep(.42,.74,cl)*.75*smoothstep(0.,.16,rd.y));
  vec2 sp=floor(rd.xz/(rd.y+.3)*120.); float st=fract(sin(dot(sp,vec2(12.9898,78.233)))*43758.5453);
  c+=uNight*step(.992,st)*smoothstep(.02,.3,rd.y)*(.5+.5*sin(uT*2.+st*90.));
  return c;
}
void main(){
  vec2 uv=(gl_FragCoord.xy*2.-uRes)/uRes.y;
  vec3 rd=normalize(uF+(uv.x*uR+uv.y*uU)*uFov), ro=uRo;
  float tw=rd.y<0.?-ro.y/rd.y:1e5, t=0., hit=-1.;
  bool live=true;
  if(ro.y>2.4){ if(rd.y>=0.) live=false; else t=(ro.y-2.4)/-rd.y; }
  float tmax=min(tw,46.);
  if(live){ for(int i=0;i<110;i++){ vec3 p=ro+rd*t; float d=p.y-terr(p.xz); if(d<.0015*t+.0008){ hit=t; break; } t+=d*.42+.003*t; if(t>tmax) break; } }
  vec3 col; float dist=1e5; vec2 wp=vec2(99.);
  float beamA=0.;
  if(hit>0.){
    vec3 p=ro+rd*hit; dist=hit; wp=p.xz;
    float e=.006+.0025*hit;
    float h=terrD(p.xz);
    vec3 n=normalize(vec3(terrD(p.xz-vec2(e,0.))-terrD(p.xz+vec2(e,0.)),2.*e,terrD(p.xz-vec2(0.,e))-terrD(p.xz+vec2(0.,e))));
    float j=h+(vn(p.xz*11.)-.5)*.07;
    vec3 tint=isleTint(p.xz);
    vec3 c=vec3(.93,.86,.66);
    c=mix(c,mix(vec3(.5,.62,.3),tint,.28),smoothstep(.035,.05,j));
    c=mix(c,mix(vec3(.34,.5,.27),tint,.42),smoothstep(.2,.215,j));
    c=mix(c,mix(vec3(.72,.6,.36),tint,.3),smoothstep(.42,.435,j));
    c=mix(c,vec3(.55,.5,.52),smoothstep(.78,.8,j));
    c=mix(c,vec3(.95,.94,.92),smoothstep(1.15,1.17,j));
    float sh=shadow(p+n*.02);
    float dif=clamp(dot(n,uSun),0.,1.)*sh;
    float sl=clamp(.5+.5*n.y,0.,1.);
    c*=cAmb*(.6+.5*sl)+cSun*dif*1.05;
    float fw=fwidth(h)*1.2+.0008;
    float l1=1.-smoothstep(0.,fw,abs(fract(h/.08+.5)-.5)*.08);
    float l5=1.-smoothstep(0.,fw*1.9,abs(fract(h/.4+.5)-.5)*.4);
    c=mix(c,c*.52,max(l1*.5,l5*.8)*smoothstep(.02,.06,h));
    c+=uNight*vec3(1.,.72,.35)*lights(p.xz)*1.6;
    float ba=atan(p.z,p.x); float bm=pow(max(cos(ba-uBeam),0.),90.)*exp(-length(p.xz)*.32);
    c+=uNight*vec3(1.,.85,.5)*bm*.8;
    col=c;
  } else if(tw<1e4 && live){
    vec3 p=ro+rd*tw; dist=tw; wp=p.xz;
    float d=-terrD(p.xz);
    float dj=d+(vn(p.xz*7.)-.5)*.02;
    vec3 c=mix(cShal,cDeep,smoothstep(0.,.2,dj));
    float q=floor(dj/.04)*.04; c=mix(c,mix(cShal,cDeep,smoothstep(0.,.2,q)),.55);
    float fw=fwidth(d)*1.1+.0006;
    float bl=1.-smoothstep(0.,fw,abs(fract(d/.04+.5)-.5)*.04);
    c+=bl*.07*smoothstep(.3,.05,d);
    float sh=shadow(vec3(p.x,.01,p.z));
    c*=.62+.38*sh+.25*(1.-uTilt)*0.;
    float cs=smoothstep(.55,.8,fbm3(p.xz*.42+vec2(uT*.035,uT*.01)));
    c*=1.-.2*cs*(1.-uNight);
    float wv=sin(d*95.-uT*1.9+vn(p.xz*5.)*6.283);
    float foam=smoothstep(.72,.98,wv)*smoothstep(.16,.015,d)*.55+smoothstep(.022,.004,d)*.85;
    c=mix(c,vec3(1.)*(cAmb+cSun*.75),clamp(foam,0.,1.));
    float gl=pow(vn(p.xz*37.+vec2(uT*.9,0.))*vn(p.xz*59.-vec2(0.,uT*.8)),4.)*14.;
    c+=cSun*gl*.2*sh*(1.-uNight*.9)*(.1+.9*uTilt);
    vec2 gq=abs(fract(p.xz+.5)-.5); float gr=1.-smoothstep(0.,.006+.003*tw*.1,min(gq.x,gq.y));
    c+=gr*.06*(1.-uTilt);
    float fr=pow(1.-max(-rd.y,0.),5.);
    c=mix(c,sky(reflect(rd,vec3(0.,1.,0.))),fr*.75*uTilt);
    vec3 hv=normalize(uSun-rd); float spec=pow(max(hv.y,0.),260.)*uTilt;
    c+=cSun*spec*(.6+2.*gl)*uGold;
    c+=uNight*vec3(1.,.72,.35)*lights(p.xz)*.5;
    float ba=atan(p.z,p.x); float bm=pow(max(cos(ba-uBeam),0.),90.)*exp(-length(p.xz)*.32);
    c+=uNight*vec3(1.,.85,.5)*bm*.55;
    vec2 pd=p.xz-uPlane-uSun.xz*.35; c*=1.-.3*exp(-dot(pd,pd)/.006)*(1.-uNight);
    col=c;
  } else {
    col=sky(rd);
  }
  { vec2 q=wp-uPlane; float al=dot(q,-uPdir), ac=abs(dot(q,vec2(-uPdir.y,uPdir.x))); float ct=smoothstep(.022,.004,ac)*smoothstep(1.7,0.,al)*step(.06,al); col=mix(col,vec3(1.)*(cAmb+cSun*.8),ct*.55*(1.-uTilt)); }
  if(dist<1e4){ float fog=1.-exp(-dist*.05*uTilt); col=mix(col,sky(normalize(vec3(rd.x,.03,rd.z))),fog*.9); }
  vec2 vq=gl_FragCoord.xy/uRes; float vg=smoothstep(1.25,.35,length((vq-.5)*vec2(1.25,1.)));
  col*=.8+.2*vg;
  col*=.965+.07*vn(gl_FragCoord.xy*.9);
  o=vec4(pow(clamp(col,0.,1.),vec3(.95)),1.);
}`;

const ISLES = [
  { key: "home", name: "Home", p: [0, 0.75, 0] },
  { key: "nicholas", name: "Nicholas", p: [-2.7, 1.25, 1.7] },
  { key: "andreas", name: "Andreas", p: [0.5, 1.2, 2.45] },
  { key: "oksana", name: "Oksana", p: [2.95, 0.95, 1.5] },
  { key: "lukas", name: "Lukas", p: [2.75, 2.0, -1.15] },
  { key: "foxy", name: "Foxy", p: [0.55, 1.05, -2.4] },
  { key: "kiriakos", name: "Kiriakos", p: [-1.9, 0.95, -1.75] }
];
const EXTENT = { x: 3.95, z: 3.4 };

const root = document.querySelector("[data-archipelago]");
const canvas = root && root.querySelector("canvas");
const gl = canvas && context(canvas);
if (root) setupLatest();
if (!gl) {
  if (root) root.classList.add("no-gl");
} else {
  run();
}

function hourTarget() {
  const pick = new URLSearchParams(location.search).get("time");
  const fixed = { dawn: 6.7, day: 12.6, dusk: 17.35, night: 23 }[pick];
  if (fixed) return fixed;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

function run() {
  const P = program(gl, FRAG, "archipelago");
  if (!P) { root.classList.add("no-gl"); return; }
  P.use();
  fullscreen(gl);
  noiseTexture(gl, 1234567, 0);
  gl.uniform1i(P.u("uN"), 0);
  root.classList.add("has-gl");

  const labels = [...root.querySelectorAll("[data-isle]")].map((el) => ({ el, isle: ISLES.find((q) => q.key === el.dataset.isle) })).filter((q) => q.isle);
  const plane = root.querySelector("[data-plane]");
  const head = root.querySelector("[data-cartouche]");
  const rose = root.querySelector("[data-rose]");
  const hud = root.querySelector("[data-hud]");
  const hdg = root.querySelector("[data-hdg]");
  const next = root.querySelector("[data-next]");
  const flyButton = root.querySelector("[data-fly]");
  const flyLabel = flyButton && flyButton.querySelector("span");
  const corrected = root.querySelector("[data-corrected]");

  const s = { tilt: 0, tv: 0, hour: hourTarget(), px: -1.4, pz: -0.9, yaw: 0.9, steer: 0, wp: 1, ptr: 0, live: false, beam: 0, fly: false, n: 0 };
  let view = layout();

  function layout() {
    const W = root.clientWidth, H = root.clientHeight, portrait = W / H < 0.95;
    const box = head.getBoundingClientRect(), rb = root.getBoundingClientRect();
    let free;
    if (portrait) free = { x0: 6, x1: W - 6, y0: 128, y1: Math.max(H * 0.45, box.top - rb.top - 8) };
    else free = { x0: Math.min(W * 0.45, box.right - rb.left + 24), x1: W - 24, y0: 64, y1: H - 24 };
    const hw = (free.x1 - free.x0) / H, hh = (free.y1 - free.y0) / H;
    const ax = portrait ? EXTENT.z : EXTENT.x, ay = portrait ? EXTENT.x : EXTENT.z;
    const span = Math.max(ax / hw, ay / hh) * 1.06;
    const sx = ((free.x0 + free.x1) / 2 - W / 2) / (H / 2), sy = (H / 2 - (free.y0 + free.y1) / 2) / (H / 2);
    if (rose) rose.style.transform = portrait ? "rotate(-90deg)" : "none";
    return { W, H, portrait, span, sx, sy, chartYaw: portrait ? Math.PI / 2 : 0 };
  }
  new ResizeObserver(() => { view = layout(); }).observe(root);

  const setFly = (on) => {
    s.fly = on;
    root.classList.toggle("is-flying", on);
    if (flyLabel) flyLabel.textContent = on ? "Back to the chart" : "Take the plane";
    if (flyButton) flyButton.setAttribute("aria-pressed", String(on));
    if (reducedMotion.matches) s.tilt = on ? 1 : 0;
    engine.start();
  };
  if (flyButton) { flyButton.hidden = false; flyButton.addEventListener("click", () => setFly(!s.fly)); }
  root.addEventListener("pointermove", (e) => { const r = root.getBoundingClientRect(); s.ptr = ((e.clientX - r.left) / r.width - 0.5) * 2; s.live = true; });
  root.addEventListener("pointerleave", () => { s.live = false; });

  const stamp = () => {
    if (!corrected) return;
    const pick = new URLSearchParams(location.search).get("time");
    const d = new Date(), h = d.getHours(), m = String(d.getMinutes()).padStart(2, "0");
    corrected.textContent = pick ? `Shown at ${pick}` : `Corrected to ${(h % 12) || 12}:${m} ${h < 12 ? "am" : "pm"} today`;
  };
  stamp();
  setInterval(stamp, 30000);

  const engine = loop(canvas, (t, dt) => {
    s.n += 1;
    if (reducedMotion.matches && !s.fly) dt = 0;
    s.tv += (((s.fly ? 1 : 0) - s.tilt) * 26 - s.tv * 9.5) * dt;
    s.tilt += s.tv * dt;
    const tilt = clamp(s.tilt), ez = tilt * tilt * (3 - 2 * tilt);
    let dh = hourTarget() - s.hour;
    if (dh > 12) dh -= 24;
    if (dh < -12) dh += 24;
    s.hour = (s.hour + dh * (1 - Math.exp(-dt * 1.6)) + 24) % 24;
    const wp = ISLES[s.wp].p;
    let want = Math.atan2(wp[0] - s.px, wp[2] - s.pz) - s.yaw;
    while (want > Math.PI) want -= Math.PI * 2;
    while (want < -Math.PI) want += Math.PI * 2;
    if (Math.hypot(wp[0] - s.px, wp[2] - s.pz) < 0.7) s.wp = (s.wp % 6) + 1;
    const manual = s.fly && s.live;
    const target = manual ? s.ptr * 0.95 : clamp(want * 1.4, -0.7, 0.7);
    s.steer += (target - s.steer) * (1 - Math.exp(-dt * 3.5));
    s.yaw += s.steer * dt;
    if (Math.hypot(s.px, s.pz) > 5.4 && manual) { let back = Math.atan2(-s.px, -s.pz) - s.yaw; while (back > Math.PI) back -= Math.PI * 2; while (back < -Math.PI) back += Math.PI * 2; s.yaw += back * dt * 0.9; }
    s.px += Math.sin(s.yaw) * 0.5 * dt; s.pz += Math.cos(s.yaw) * 0.5 * dt;
    s.beam += dt * 0.7;

    const el = 62 * Math.sin(Math.PI * (s.hour - 6) / 12) * Math.PI / 180, az = Math.PI * (s.hour - 6) / 12;
    const night = 1 - clamp((el * 57.3 + 8) / 10), wDay = clamp((el * 57.3 - 8) / 22), gold = (1 - wDay) * (1 - night), am = s.hour < 12;
    let sun = [Math.cos(az) * Math.cos(Math.max(el, 0.1)), Math.sin(Math.max(el, 0.1)), -Math.sin(az) * Math.cos(Math.max(el, 0.1)) * 0.6 - 0.2];
    if (night > 0.5) sun = [-0.5, 0.62, 0.42];
    const sl = Math.hypot(...sun); sun = sun.map((v) => v / sl);
    const pal = (day, dawn, dusk, nite) => day.map((v, i) => v * wDay + (am ? dawn[i] : dusk[i]) * gold + nite[i] * night);
    const C = {
      cSkyZ: pal([0.22, 0.5, 0.86], [0.36, 0.44, 0.72], [0.2, 0.2, 0.48], [0.02, 0.04, 0.1]),
      cSkyH: pal([0.78, 0.9, 0.96], [1.0, 0.76, 0.64], [1.0, 0.55, 0.3], [0.07, 0.11, 0.24]),
      cSun: pal([1.0, 0.95, 0.84], [1.0, 0.74, 0.56], [1.0, 0.56, 0.28], [0.34, 0.42, 0.62]),
      cAmb: pal([0.5, 0.55, 0.62], [0.46, 0.42, 0.54], [0.4, 0.33, 0.5], [0.11, 0.14, 0.26]),
      cDeep: pal([0.04, 0.2, 0.45], [0.1, 0.18, 0.42], [0.08, 0.12, 0.34], [0.02, 0.05, 0.15]),
      cShal: pal([0.25, 0.8, 0.8], [0.5, 0.74, 0.8], [0.42, 0.56, 0.72], [0.07, 0.22, 0.36])
    };
    root.style.setProperty("--night", night.toFixed(2));

    const chartDist = 14.6, chartFov = view.span / chartDist;
    const pitch = mix(Math.PI / 2 - 0.0001, 0.4, ez), dist = mix(chartDist, 3.9, ez), fov = mix(chartFov, 0.52, ez);
    const yaw = mix(view.chartYaw, s.yaw, ez);
    const f = [Math.cos(pitch) * Math.sin(yaw), -Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)];
    const r = [Math.cos(yaw), 0, -Math.sin(yaw)];
    const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
    const k = chartDist * chartFov;
    const cx = -(r[0] * view.sx + u[0] * view.sy) * k, cz = -(r[2] * view.sx + u[2] * view.sy) * k;
    const tx = mix(cx, s.px, ez), ty = mix(0, 1.7, ez), tz = mix(cz, s.pz, ez);
    const ro = [tx - f[0] * dist, ty - f[1] * dist, tz - f[2] * dist];
    const W = view.W, H = view.H;
    const proj = (p) => {
      const v = [p[0] - ro[0], p[1] - ro[1], p[2] - ro[2]], z = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
      if (z < 0.2) return null;
      return [W / 2 + (v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) / (z * fov) * H / 2, H / 2 - (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / (z * fov) * H / 2, z];
    };

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(P.u("uRes"), canvas.width, canvas.height);
    gl.uniform1f(P.u("uT"), reducedMotion.matches ? 40 : t % 3600);
    gl.uniform1f(P.u("uFov"), fov);
    gl.uniform1f(P.u("uTilt"), ez);
    gl.uniform1f(P.u("uNight"), night);
    gl.uniform1f(P.u("uGold"), 0.4 + gold * 0.9);
    gl.uniform1f(P.u("uBeam"), s.beam);
    gl.uniform3fv(P.u("uRo"), ro); gl.uniform3fv(P.u("uF"), f); gl.uniform3fv(P.u("uR"), r); gl.uniform3fv(P.u("uU"), u);
    gl.uniform3fv(P.u("uSun"), sun);
    gl.uniform2f(P.u("uPlane"), s.px, s.pz);
    gl.uniform2f(P.u("uPdir"), Math.sin(s.yaw), Math.cos(s.yaw));
    for (const key in C) gl.uniform3fv(P.u(key), C[key]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    for (const { el, isle } of labels) {
      const q = proj(isle.p);
      if (!q || q[0] < -80 || q[0] > W + 80 || q[1] < -40 || q[1] > H + 40) { el.style.opacity = "0"; el.style.pointerEvents = "none"; continue; }
      const fade = clamp(1.6 - q[2] / mix(40, 9, ez));
      el.style.opacity = fade.toFixed(2);
      el.style.pointerEvents = fade > 0.3 ? "" : "none";
      el.style.transform = `translate(${q[0].toFixed(1)}px,${(q[1] - mix(0, 14, ez)).toFixed(1)}px) translate(-50%,-100%)`;
    }
    if (plane) {
      const q = proj([s.px, mix(0.02, 1.7, ez), s.pz]);
      if (q) {
        const size = mix(0.62 * 3.9 / view.span, 2.1, ez);
        plane.style.transform = `translate(${q[0].toFixed(1)}px,${q[1].toFixed(1)}px) perspective(600px) rotateX(${mix(0, 58, ez).toFixed(1)}deg) rotateZ(${((s.yaw - yaw) * 57.3).toFixed(1)}deg) rotateY(${(-s.steer * 34 * ez).toFixed(1)}deg) scale(${size.toFixed(2)})`;
        plane.style.opacity = "1";
      } else plane.style.opacity = "0";
    }
    head.style.opacity = (1 - Math.min(1, ez * 2.2)).toFixed(2);
    head.style.transform = `translateY(${(ez * 30).toFixed(1)}px)`;
    head.style.visibility = ez > 0.6 ? "hidden" : "";
    if (rose) rose.style.opacity = (0.9 * (1 - Math.min(1, ez * 3))).toFixed(2);
    if (hud) hud.style.opacity = Math.max(0, ez * 2.2 - 1.2).toFixed(2);
    if (s.n % 6 === 0) {
      if (hdg) hdg.textContent = String(((Math.round(s.yaw * 57.2958) % 360) + 360) % 360).padStart(3, "0") + "°";
      if (next) next.textContent = ISLES[s.wp].name.toUpperCase();
    }
    if (reducedMotion.matches && !s.fly && Math.abs(s.tilt) < 0.001 && s.n > 2) engine.stop();
  });
  engine.start();
  reducedMotion.addEventListener("change", () => engine.start());
}

async function setupLatest() {
  const title = root.querySelector("[data-latest-title]");
  if (!title) return;
  try {
    const response = await fetch("/posts.json", { cache: "no-store" });
    if (!response.ok) return;
    const posts = await response.json();
    const latest = Array.isArray(posts) && posts.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    if (!latest) return;
    title.textContent = latest.title;
    const date = root.querySelector("[data-latest-date]");
    if (date) date.textContent = "Latest update, " + new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${latest.date}T12:00:00Z`));
    const link = title.closest("a");
    if (link && /^[\w-]+$/.test(String(latest.id))) link.href = `/updates/#post-${latest.id}`;
  } catch (error) {
    /* The printed fallback stays. */
  }
}

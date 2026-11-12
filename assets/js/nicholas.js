// Nicholas: a lit desk where every object is a way into the paper below it.
// Hover lifts an object and names its section; a click turns the paper to that page.
import { context, program, fullscreen, noiseTexture, loop, reducedMotion, clamp, mix } from "./gl.js";

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes, uVc; uniform float uT, uFov, uHot; uniform vec3 uRo, uF, uR, uU, uL; uniform float uLift[9];
uniform sampler2D uN;
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return texture(uN,(i+f+.5)/256.).r; }
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float rbox(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r; }
float cyl(vec3 p, float r, float h){ vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h); return min(max(d.x,d.y),0.)+length(max(d,0.)); }
float cap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float tor(vec3 p, float R, float r){ return length(vec2(length(p.xz)-R,p.y))-r; }
vec3 ry(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z); }
vec2 U(vec2 a, vec2 b){ return a.x<b.x?a:b; }
vec3 PA(vec3 p){ return ry(p-vec3(-.35,.045+uLift[0],.25),-.22); }
vec3 PB(vec3 p){ return ry(p-vec3(.82,.045+uLift[1],.62),.17); }
vec3 NB(vec3 p){ return ry(p-vec3(3.45,.075+uLift[2],-1.15),.1); }
vec3 MG(vec3 p){ return p-vec3(-1.75,uLift[3],-1.4); }
vec3 HP(vec3 p){ return ry(p-vec3(3.05,uLift[4],2.2),-.3); }
vec3 PL(vec3 p){ return ry(p-vec3(-2.1,.16+uLift[5],1.2),.45); }
vec3 AP(vec3 p){ return ry(p-vec3(.9,uLift[6],-1.8),.5); }
vec3 SH(vec3 p){ return ry(p-vec3(4.6,.008+uLift[7],.9),-.15); }
vec3 MS(vec3 p){ return ry(p-vec3(2.05,uLift[8],.25),.08); }
float plane(vec3 q){
  float d=cap(q,vec3(-.62,.44,0.),vec3(.6,.44,0.),.105);
  vec3 m=vec3(q.x,q.y,abs(q.z));
  d=min(d,rbox(ry(m-vec3(-.08,.42,.44),-.42),vec3(.14,.014,.44),.012));
  d=min(d,rbox(ry(m-vec3(-.6,.46,.18),-.42),vec3(.07,.012,.18),.01));
  d=min(d,rbox(q-vec3(-.6,.6,0.)+vec3(q.y-.6,0.,0.)*.5,vec3(.1,.14,.014),.01));
  d=min(d,cap(q,vec3(0.,.03,0.),vec3(0.,.34,0.),.028));
  d=min(d,cyl(q-vec3(0.,.015,0.),.24,.015)-.006);
  return d;
}
vec2 objs(vec3 p, bool fast){
  vec2 r=vec2(p.y,0.); vec3 q; float b;
  q=PA(p); b=fast?length(q)-.95:-1.; if(b<.06) r=U(r,vec2(rbox(q,vec3(.36,.04,.78),.05),1.)); else r.x=min(r.x,b);
  q=PB(p); b=fast?length(q)-.95:-1.; if(b<.06) r=U(r,vec2(rbox(q,vec3(.36,.04,.78),.05),2.)); else r.x=min(r.x,b);
  q=NB(p); b=fast?length(q)-1.4:-1.; if(b<.06){ r=U(r,vec2(rbox(q,vec3(.75,.07,1.05),.03),3.)); r=U(r,vec2(cap(q,vec3(-.32,.12,-.72),vec3(.2,.12,.62),.045),4.)); } else r.x=min(r.x,b);
  q=MG(p); b=fast?length(q-vec3(.1,.45,0.))-1.05:-1.; if(b<.06){
    float m=max(cyl(q-vec3(0.,.45,0.),.42,.45)-.02,-cyl(q-vec3(0.,.56,0.),.36,.45));
    m=min(m,max(tor((q-vec3(.5,.45,0.)).xzy,.24,.055),-(q.x-.4)));
    r=U(r,vec2(m,5.)); r=U(r,vec2(cyl(q-vec3(0.,.4,0.),.36,.37),6.)); } else r.x=min(r.x,b);
  q=HP(p); b=fast?length(q)-1.2:-1.; if(b<.06){
    float h=min(cyl(q-vec3(-.62,.14,0.),.4,.11)-.03,cyl(q-vec3(.62,.14,0.),.4,.11)-.03);
    r=U(r,vec2(min(h,max(tor(q-vec3(0.,.1,0.),.62,.06),q.z)),7.)); } else r.x=min(r.x,b);
  q=PL(p); b=fast?length(q)-1.25:-1.; if(b<.06) r=U(r,vec2(rbox(q,vec3(1.08,.15,.24),.04),8.)); else r.x=min(r.x,b);
  q=AP(p); b=fast?length(q-vec3(0.,.4,0.))-1.1:-1.; if(b<.06) r=U(r,vec2(plane(q),9.)); else r.x=min(r.x,b);
  q=SH(p); b=fast?length(q)-1.5:-1.; if(b<.06) r=U(r,vec2(rbox(q,vec3(.85,.005,1.15),.002),10.)); else r.x=min(r.x,b);
  q=MS(p); b=fast?length(q)-1.2:-1.; if(b<.06){
    r=U(r,vec2(rbox(q-vec3(0.,.016,0.),vec3(.62,.008,.84),.003),11.));
    r=U(r,vec2(rbox(ry(q-vec3(.035,.006,.025),.035),vec3(.62,.006,.84),.003),11.));
    r=U(r,vec2(rbox(q-vec3(0.,.05,-.79),vec3(.17,.028,.07),.012),12.));
    r=U(r,vec2(min(cap(q,vec3(-.1,.075,-.77),vec3(-.1,.17,-.99),.009),cap(q,vec3(.1,.075,-.77),vec3(.1,.17,-.99),.009)),13.));
  } else r.x=min(r.x,b);
  return r;
}
vec2 map(vec3 p){ return objs(p,true); }
vec2 mapx(vec3 p){ return objs(p,false); }
float objOf(float id){ return id<1.5?0.:id<2.5?1.:id<4.5?2.:id<6.5?3.:id<7.5?4.:id<8.5?5.:id<9.5?6.:id<10.5?7.:8.; }
vec3 nrm(vec3 p){ vec2 e=vec2(.0012,-.0012); return normalize(e.xyy*mapx(p+e.xyy).x+e.yyx*mapx(p+e.yyx).x+e.yxy*mapx(p+e.yxy).x+e.xxx*mapx(p+e.xxx).x); }
float shadow(vec3 p){ float res=1., s=.02; for(int i=0;i<34;i++){ float d=mapx(p+uL*s).x; res=min(res,11.*d/s); s+=clamp(d,.02,.25); if(res<.01||s>7.) break; } return clamp(res,0.,1.); }
float ln(float d, float w, float fw){ return 1.-smoothstep(w-fw,w+fw,abs(d)); }
void main(){
  vec2 uv=(gl_FragCoord.xy*2.-uRes)/uRes.y;
  vec3 rd=normalize(uF+(uv.x*uR+uv.y*uU)*uFov), ro=uRo;
  float t=0., id=-1.;
  for(int i=0;i<120;i++){ vec2 m=map(ro+rd*t); if(m.x<.0008*t){ id=m.y; break; } t+=m.x; if(t>40.) break; }
  vec3 col=vec3(.02,.012,.008);
  if(id>-.5){
    vec3 p=ro+rd*t, n=nrm(p), c=vec3(.5); float gloss=.1, shin=30.;
    if(id<.5){
      float g=vn(vec2(p.x*.9+vn(p.xz*.5)*2.2,p.z*15.));
      float g2=vn(vec2(p.x*3.+7.,p.z*60.));
      c=mix(vec3(.2,.105,.05),vec3(.4,.23,.12),g)*(.85+.3*g2);
      float seam=smoothstep(.0,.012,abs(fract(p.z/2.6+.3)-.5)*2.6); c*=mix(.55,1.,seam);
      gloss=.28; shin=50.;
      vec3 a=PA(p); float da=length(max(abs(a.xz)-vec2(.36,.78),0.)); c+=vec3(1.,.5,.18)*exp(-da*da*5.)*.11;
      vec3 bq=PB(p); float dbb=length(max(abs(bq.xz)-vec2(.36,.78),0.)); c+=vec3(.6,.85,1.)*exp(-dbb*dbb*5.)*.13;
    } else if(id<2.5){ c=n.y>.7?vec3(.012):vec3(.2,.2,.22); gloss=n.y>.7?.9:.6; shin=120.; }
    else if(id<3.5){ vec3 q=NB(p);
      c=n.y>.5?vec3(.055,.08,.2)*(.8+.4*vn(q.xz*90.)):vec3(.9,.87,.78)*(.8+.2*step(.5,fract(q.y*90.)));
      if(n.y>.5&&abs(q.x-.52)<.045) c=vec3(.94,.76,.1);
      gloss=.12; }
    else if(id<4.5){ c=vec3(.75,.55,.22); gloss=.8; shin=90.; }
    else if(id<5.5){ vec3 q=MG(p); c=vec3(.9,.86,.78)*(1.-.45*step(.93,hash(floor(q.xy*38.)+floor(q.z*38.)))); gloss=.45; shin=70.; }
    else if(id<6.5){ c=vec3(.13,.06,.03); gloss=.9; shin=140.; }
    else if(id<7.5){ vec3 q=HP(p); c=q.y>.2?vec3(.05,.05,.055):vec3(.14,.14,.15); gloss=q.y>.2?.25:.6; shin=60.; }
    else if(id<8.5){ vec3 q=PL(p); float k=floor((q.x+1.08)/.3086);
      vec3 pal=k<.5?vec3(.95,.8,.2):k<1.5?vec3(.2,.6,.92):k<2.5?vec3(.7,.55,.94):k<3.5?vec3(.42,.84,.56):k<4.5?vec3(.97,.32,.42):k<5.5?vec3(.96,.55,.2):vec3(.93,.92,.86);
      float div=smoothstep(.0,.02,abs(fract((q.x+1.08)/.3086)-.5)*.3086-.0)*smoothstep(.154,.14,abs(fract((q.x+1.08)/.3086)-.5)*.3086);
      c=n.y>.5?mix(vec3(.1),pal,div):pal*.55; gloss=.55; shin=80.; }
    else if(id<9.5){ vec3 q=AP(p); c=vec3(.93,.93,.9);
      if(q.x<-.46&&q.y>.5) c=vec3(.95,.78,.12);
      if(q.y<.36) c=vec3(.1,.1,.11);
      if(abs(q.y-.47)<.012&&abs(q.x)<.5&&fract(q.x*14.)<.55&&abs(q.z)>.06) c=vec3(.12,.16,.25);
      gloss=.6; shin=90.; }
    else if(id<10.5){ vec3 q=SH(p); c=vec3(.95,.93,.87);
      float st=fract((q.z+1.05)/.36); float l=step(st,.56)*step(abs(fract(st/.14+.5)-.5)*.14,.006);
      c=mix(c,vec3(.2),l*step(abs(q.x),.72));
      float nt=step(.86,hash(floor(vec2(q.x*9.,(q.z+1.05)/.045))))*step(st,.56)*step(abs(q.x),.7);
      c=mix(c,vec3(.12),nt*smoothstep(.5,.3,length(fract(vec2(q.x*9.,(q.z+1.05)/.045))-.5)));
      gloss=.05; }
    else if(id<11.5){ vec3 q=MS(p); c=vec3(.965,.958,.94)*(.97+.03*vn(q.xz*80.));
      if(n.y>.5){
        float fw=fwidth(q.z)*1.2+.0004, ink=0.;
        ink=max(ink,ln(q.z+.655,.016,fw)*step(abs(q.x),.44));
        ink=max(ink,ln(q.z+.6,.016,fw)*step(abs(q.x),.3));
        ink=max(ink,.75*ln(q.z+.53,.006,fw)*step(abs(q.x),.2));
        ink=max(ink,.9*ln(q.z+.475,.0025,fw)*step(abs(q.x),.54));
        ink=max(ink,.9*ln(q.z+.2,.0025,fw)*step(abs(q.x),.54));
        float az=(q.z+.44)/.032; float ai=floor(az+.5);
        if(ai>=0.&&ai<=7.) ink=max(ink,.85*ln(q.z+.44-ai*.032,.0055,fw)*step(abs(q.x),ai>6.5?.2:.52));
        float cz=(q.z+.14)/.03; float ci=floor(cz+.5); float side=q.x<0.?0.:1.; float cx=abs(q.x-(side>.5?.29:-.29));
        bool fig=side>.5&&q.z>.04&&q.z<.34;
        if(ci>=0.&&ci<=30.&&!fig){ float lenR=hash(vec2(ci,side))>.86?.12:.255; ink=max(ink,.55*ln(q.z+.14-ci*.03,.005,fw)*step(cx,.255)*step(q.x-(side>.5?.29:-.29),lenR-.255+.255)); }
        if(fig){ float bx=step(abs(q.x-.29),.25)*step(abs(q.z-.19),.14); c=mix(c,vec3(.9,.89,.86),bx);
          float curve=.28-.1*sin((q.x-.06)*9.)*.8-(q.x-.06)*.25; ink=max(ink,.9*ln(q.z-curve,.005,fw)*step(abs(q.x-.29),.23)); }
        c=mix(c,vec3(.13,.13,.15),ink);
      }
      gloss=.08; }
    else if(id<12.5){ c=vec3(.03,.03,.035); gloss=.7; shin=110.; }
    else { c=vec3(.72,.72,.74); gloss=.95; shin=160.; }
    float sh=shadow(p+n*.01);
    float dif=clamp(dot(n,uL),0.,1.)*sh;
    float ao=clamp(.35+mapx(p+n*.1).x/.16,0.,1.)*clamp(.6+mapx(p+n*.3).x/.6,0.,1.);
    float pool=smoothstep(9.5,1.4,length(p.xz-vec2(1.3,.3)));
    vec3 key=vec3(1.,.82,.6)*2.1*pool;
    vec3 lit=c*(key*dif+vec3(.2,.24,.34)*ao*(.35+.65*n.y)*.55+vec3(.03,.02,.015));
    vec3 h=normalize(uL-rd);
    lit+=key*pow(max(dot(n,h),0.),shin)*gloss*sh*.6;
    vec3 rf=reflect(rd,n);
    lit+=vec3(.5,.62,.8)*smoothstep(.55,.9,rf.y)*smoothstep(.3,.0,abs(rf.x-.25))*gloss*.22*ao;
    if(id>.5&&abs(objOf(id)-uHot)<.5){ lit+=vec3(1.,.8,.55)*pow(1.-max(dot(n,-rd),0.),2.5)*.55; lit*=1.08; }
    col=lit;
  }
  vec2 v=gl_FragCoord.xy/uRes; col*=.6+.4*smoothstep(1.25,.3,length((v-uVc)*vec2(1.15,1.)));
  col=col/(1.+col*.25);
  col+=(hash(gl_FragCoord.xy+uT)-.5)*.02;
  o=vec4(pow(clamp(col,0.,1.),vec3(.88)),1.);
}
`;

const OBJECTS = [
  { c: [-0.35, 0.25], a: -0.22, h: [0.36, 0.09, 0.78], cy: 0.05, page: 2, label: "Filuma", sub: "Section 1, page 2" },
  { c: [0.82, 0.62], a: 0.17, h: [0.36, 0.09, 0.78], cy: 0.05, page: 4, label: "Meds Ahead", sub: "Section 2, page 4" },
  { c: [3.45, -1.15], a: 0.1, h: [0.75, 0.14, 1.05], cy: 0.08, page: 3, label: "A day that changes", sub: "Fig. 2, page 3" },
  { c: [-1.75, -1.4], a: 0, h: [0.56, 0.46, 0.45], cy: 0.45, page: 7, label: "Let’s talk", sub: "Correspondence, page 7" },
  { c: [3.05, 2.2], a: -0.3, h: [1.05, 0.3, 0.52], cy: 0.15, page: 7, label: "Music", sub: "Acknowledgements, page 7" },
  { c: [-2.1, 1.2], a: 0.45, h: [1.1, 0.2, 0.27], cy: 0.16, page: 5, label: "What runs out next", sub: "Fig. 4, page 5" },
  { c: [0.9, -1.8], a: 0.5, h: [0.75, 0.36, 0.55], cy: 0.4, page: 6, label: "Aloft", sub: "Section 3, page 6" },
  { c: [4.6, 0.9], a: -0.15, h: [0.85, 0.03, 1.15], cy: 0.01, page: 7, label: "The Dissipated Eight", sub: "Acknowledgements, page 7" },
  { c: [2.05, 0.25], a: 0.08, h: [0.64, 0.1, 0.9], cy: 0.03, page: 1, label: "The paper", sub: "Two apps for problems close to home" }
];
const DESK = { cx: 1.3, cz: 0.35, ex: 4.4, ez: 3.0 };
const ry = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]; };

const hero = document.querySelector("[data-desk]");
const canvas = hero && hero.querySelector("canvas");
const book = setupBook();
setupFigures();
if (hero) setupContents();
const gl = canvas && context(canvas);
if (hero && gl) runDesk(); else if (hero) hero.classList.add("no-gl");

function runDesk() {
  const P = program(gl, FRAG, "desk");
  if (!P) { hero.classList.add("no-gl"); return; }
  P.use();
  fullscreen(gl);
  noiseTexture(gl, 4242, 0);
  gl.uniform1i(P.u("uN"), 0);
  hero.classList.add("has-gl");

  const screens = [...hero.querySelectorAll("[data-screen]")];
  const tag = hero.querySelector("[data-tag]");
  const tagLabel = tag && tag.querySelector("strong");
  const tagSub = tag && tag.querySelector("small");
  const lift = new Float32Array(9);
  const s = { px: 0, py: 0, tx: 0, ty: 0, live: false, hot: -1, listHot: -1, scroll: 0, n: 0 };
  let cam = null, view = layout();

  function layout() {
    const W = canvas.clientWidth, H = canvas.clientHeight, portrait = W / H < 0.95;
    const col = hero.querySelector("[data-desk-copy]");
    let free = { x0: 0, x1: W, y0: 70, y1: H - 10 };
    if (!portrait && col && getComputedStyle(col).position === "absolute") free.x0 = Math.min(W * 0.48, col.getBoundingClientRect().right - canvas.getBoundingClientRect().left + 10);
    const hw = (free.x1 - free.x0) / H, hh = (free.y1 - free.y0) / H;
    const pitch = 0.93;
    const ax = portrait ? DESK.ez : DESK.ex, ay = (portrait ? DESK.ex : DESK.ez) * Math.sin(pitch) + 0.5;
    const span = Math.max(ax / hw, ay / hh) * 1.04;
    const sx = ((free.x0 + free.x1) / 2 - W / 2) / (H / 2), sy = (H / 2 - (free.y0 + free.y1) / 2) / (H / 2);
    const vc = [((free.x0 + free.x1) / 2) / W, 1 - ((free.y0 + free.y1) / 2) / H];
    return { W, H, portrait, span, sx, sy, pitch, vc };
  }
  new ResizeObserver(() => { view = layout(); }).observe(hero);

  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    s.tx = (e.clientX - r.left) / r.width * 2 - 1; s.ty = (e.clientY - r.top) / r.height * 2 - 1; s.live = true;
    s.mx = e.clientX - r.left; s.my = e.clientY - r.top;
  });
  canvas.addEventListener("pointerleave", () => { s.live = false; s.mx = null; });
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect(), hit = pick(e.clientX - r.left, e.clientY - r.top);
    if (hit >= 0) book.openAt(OBJECTS[hit].page, true);
  });
  addEventListener("scroll", () => { s.scroll = clamp(scrollY / Math.max(1, hero.offsetHeight)); }, { passive: true });
  hero.addEventListener("deskhot", (e) => { s.listHot = e.detail; });

  function ray(x, y) {
    if (!cam) return null;
    const uvx = (2 * x - view.W) / view.H, uvy = (view.H - 2 * y) / view.H;
    const d = [0, 1, 2].map((i) => cam.f[i] + (uvx * cam.r[i] + uvy * cam.u[i]) * cam.fov), l = Math.hypot(...d);
    return { o: cam.ro, d: d.map((v) => v / l) };
  }
  function pick(x, y) {
    const R = ray(x, y);
    if (!R) return -1;
    let best = -1, bt = Infinity;
    OBJECTS.forEach((ob, i) => {
      const o = ry([R.o[0] - ob.c[0], R.o[1] - ob.cy - lift[i], R.o[2] - ob.c[1]], ob.a), d = ry(R.d, ob.a);
      let t0 = -Infinity, t1 = Infinity;
      for (let k = 0; k < 3; k += 1) {
        if (Math.abs(d[k]) < 1e-6) { if (Math.abs(o[k]) > ob.h[k]) return; continue; }
        let a = (-ob.h[k] - o[k]) / d[k], b = (ob.h[k] - o[k]) / d[k];
        if (a > b) [a, b] = [b, a];
        t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      }
      if (t0 <= t1 && t1 > 0 && t0 < bt) { bt = t0; best = i; }
    });
    return best;
  }
  function warp(el, q) {
    const adj = (m) => [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]];
    const mul = (a, b) => { const c = []; for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) c[3 * i + j] = a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j]; return c; };
    const basis = (p) => { const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1], a = adj(m), v = [a[0] * p[3][0] + a[1] * p[3][1] + a[2], a[3] * p[3][0] + a[4] * p[3][1] + a[5], a[6] * p[3][0] + a[7] * p[3][1] + a[8]]; return mul(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); };
    const t = mul(basis(q), adj(basis([[0, 0], [330, 0], [0, 717], [330, 717]])));
    for (let i = 0; i < 9; i += 1) t[i] /= t[8];
    el.style.transform = `matrix3d(${[t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].map((v) => v.toFixed(6)).join(",")})`;
  }

  const engine = loop(canvas, (t, dt) => {
    s.n += 1;
    const still = reducedMotion.matches;
    const k = 1 - Math.exp(-dt * 2.5);
    const tx = s.live ? s.tx : Math.sin(t * 0.3) * 0.5, ty = s.live ? s.ty : Math.cos(t * 0.23) * 0.4;
    s.px += ((still ? 0 : tx) - s.px) * k; s.py += ((still ? 0 : ty) - s.py) * k;
    if (s.n % 2 === 0 && s.mx != null) s.hot = pick(s.mx, s.my);
    if (!s.live) s.hot = -1;
    const hot = s.listHot >= 0 ? s.listHot : s.hot;
    canvas.style.cursor = s.hot >= 0 ? "pointer" : "";
    for (let i = 0; i < 9; i += 1) lift[i] += ((i === hot ? (i === 7 || i === 8 ? 0.12 : 0.28) : 0) - lift[i]) * (1 - Math.exp(-dt * 8));

    const ez = s.scroll * s.scroll * (3 - 2 * s.scroll);
    const dist0 = 10, fov0 = view.span / dist0;
    const pitch = mix(view.pitch, 1.25, ez) + s.py * 0.025;
    const yawBase = view.portrait ? -Math.PI / 2 : 0, yaw = yawBase + s.px * 0.05;
    const off = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    const f = off.map((v) => -v);
    const rl = Math.hypot(f[2], f[0]) || 1, r = [-f[2] / rl, 0, f[0] / rl];
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const kk = dist0 * fov0;
    let T = [DESK.cx - (r[0] * view.sx + u[0] * view.sy) * kk, 0, DESK.cz - (r[2] * view.sx + u[2] * view.sy) * kk];
    const ms = OBJECTS[8];
    T = [mix(T[0], ms.c[0], ez), 0, mix(T[2], ms.c[1], ez)];
    const dist = mix(dist0, 3.4, ez), fov = fov0;
    const ro = [T[0] + off[0] * dist, T[1] + off[1] * dist, T[2] + off[2] * dist];
    cam = { ro, f, r, u, fov };
    const W = view.W, H = view.H;
    const proj = (p) => {
      const v = [p[0] - ro[0], p[1] - ro[1], p[2] - ro[2]], z = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
      return [W / 2 + (v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) / (z * fov) * H / 2, H / 2 - (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / (z * fov) * H / 2];
    };
    let L = view.portrait ? [0.42 + s.py * 0.3, 0.8, -0.5 + s.px * 0.4] : [-0.5 + s.px * 0.4, 0.8, -0.42 + s.py * 0.3];
    const ll = Math.hypot(...L); L = L.map((v) => v / ll);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(P.u("uRes"), canvas.width, canvas.height);
    gl.uniform2f(P.u("uVc"), view.vc[0], view.vc[1]);
    gl.uniform1f(P.u("uT"), still ? 0 : t % 100);
    gl.uniform1f(P.u("uFov"), fov);
    gl.uniform1f(P.u("uHot"), hot);
    gl.uniform3fv(P.u("uRo"), ro); gl.uniform3fv(P.u("uF"), f); gl.uniform3fv(P.u("uR"), r); gl.uniform3fv(P.u("uU"), u);
    gl.uniform3fv(P.u("uL"), L);
    gl.uniform1fv(P.u("uLift"), lift);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    screens.forEach((el) => {
      const i = Number(el.dataset.screen), ob = OBJECTS[i], c = Math.cos(-ob.a), sn = Math.sin(-ob.a), y = 0.088 + lift[i];
      const w = (lx, lz) => proj([ob.c[0] + c * lx + sn * lz, y, ob.c[1] - sn * lx + c * lz]);
      warp(el, [w(-0.325, -0.745), w(0.325, -0.745), w(-0.325, 0.745), w(0.325, 0.745)]);
      el.style.opacity = "1";
    });
    if (tag) {
      if (hot >= 0 && ez < 0.2) {
        const ob = OBJECTS[hot], q = proj([ob.c[0], ob.cy + ob.h[1] + lift[hot] + 0.15, ob.c[1]]);
        if (tagLabel.textContent !== ob.label) { tagLabel.textContent = ob.label; tagSub.textContent = ob.sub; }
        tag.style.transform = `translate(${q[0].toFixed(1)}px,${q[1].toFixed(1)}px) translate(-50%,-100%)`;
        tag.classList.add("is-on");
      } else tag.classList.remove("is-on");
    }
    if (still && s.n > 3 && !s.live) engine.stop();
  });
  engine.start();
  canvas.addEventListener("pointerenter", () => engine.start());
  addEventListener("scroll", () => engine.start(), { passive: true });
}

function setupContents() {
  hero.querySelectorAll("[data-goto]").forEach((button) => {
    const page = Number(button.dataset.goto), objs = (button.dataset.obj || "").split(",").filter(Boolean).map(Number);
    button.addEventListener("click", () => book.openAt(page, true));
    const hot = (v) => hero.dispatchEvent(new CustomEvent("deskhot", { detail: v }));
    button.addEventListener("pointerenter", () => hot(objs.length ? objs[0] : -1));
    button.addEventListener("focus", () => hot(objs.length ? objs[0] : -1));
    button.addEventListener("pointerleave", () => hot(-1));
    button.addEventListener("blur", () => hot(-1));
  });
}

function setupBook() {
  const wrap = document.querySelector("[data-book]");
  const api = { openAt() {} };
  if (!wrap) return api;
  const leaves = [...wrap.querySelectorAll("[data-leaf]")];
  const status = document.querySelector("[data-book-status]");
  const prevBtn = document.querySelector("[data-book-prev]"), nextBtn = document.querySelector("[data-book-next]");
  const max = leaves.length;
  let cur = 0, moving = -1, timer = 0;
  const stacked = () => matchMedia("(max-width: 959px), (max-aspect-ratio: 1/1)").matches;
  const pagesOf = (sp) => sp === 0 ? [1, 2] : sp === max ? [2 * max + 1] : [2 * sp + 1, 2 * sp + 2];
  const render = () => {
    leaves.forEach((leaf, j) => {
      leaf.style.transform = j < cur ? "rotateY(-180deg)" : "rotateY(0deg)";
      leaf.style.zIndex = String(moving === j ? 60 : j < cur ? 10 + j : 10 - j);
      const flat = stacked();
      leaf.querySelectorAll("section").forEach((sec, k) => { const shown = flat || (k === 0 && j >= cur) || (k === 1 && j < cur); sec.inert = !shown; if (shown) sec.removeAttribute("aria-hidden"); else sec.setAttribute("aria-hidden", "true"); });
    });
    wrap.dataset.spread = String(cur);
    if (status) status.textContent = pagesOf(cur).length > 1 ? `Pages ${pagesOf(cur).join(" and ")} of ${2 * max + 1}` : `Page ${pagesOf(cur)[0]} of ${2 * max + 1}`;
    if (prevBtn) prevBtn.disabled = cur === 0;
    if (nextBtn) nextBtn.disabled = cur === max;
  };
  const go = (to) => {
    to = clamp(to, 0, max);
    if (to === cur) return;
    clearTimeout(timer);
    moving = to > cur ? cur : to;
    if (Math.abs(to - cur) > 1) { wrap.classList.add("is-jumping"); requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove("is-jumping"))); }
    cur = to;
    render();
    timer = setTimeout(() => { moving = -1; render(); }, 1100);
  };
  const fit = () => {
    if (stacked()) { wrap.style.removeProperty("--s"); return; }
    const sc = Math.min(1, (innerWidth - 64) / 1220, (innerHeight - 200) / 800);
    wrap.style.setProperty("--s", sc.toFixed(4));
  };
  fit();
  addEventListener("resize", () => { fit(); render(); });
  wrap.addEventListener("click", (e) => {
    const ear = e.target.closest("[data-ear]");
    if (!ear) return;
    go(cur + (ear.dataset.ear === "next" ? 1 : -1));
  });
  if (prevBtn) prevBtn.addEventListener("click", () => go(cur - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => go(cur + 1));
  document.addEventListener("keydown", (e) => {
    if (stacked() || e.target.closest("input, textarea, select")) return;
    const r = wrap.getBoundingClientRect();
    if (r.top > innerHeight * 0.6 || r.bottom < innerHeight * 0.4) return;
    if (e.key === "ArrowRight") { go(cur + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { go(cur - 1); e.preventDefault(); }
  });
  render();
  api.openAt = (page, scroll) => {
    const target = document.getElementById(`page-${page}`);
    if (stacked()) { if (target) target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" }); return; }
    const sp = page <= 2 ? 0 : Math.min(max, Math.floor((page - 1) / 2));
    if (scroll) {
      const section = document.querySelector("[data-paper]");
      section.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      setTimeout(() => go(sp), reducedMotion.matches ? 0 : 650);
    } else go(sp);
  };
  return api;
}

function setupFigures() {
  const fig2 = document.querySelector("[data-fig2]");
  if (fig2) {
    const S = {
      "on-time": { summary: "It’s 2:00 pm. Start with the reading.", now: 0, end: 180, blocks: [[0, 30, "Reading", "flexible"], [30, 90, "Seminar", "fixed"], [90, 135, "Essay", "flexible"]] },
      late: { summary: "It’s 2:30 pm. Seminar comes first.", now: 30, end: 180, blocks: [[90, 120, "Reading", "moved"], [30, 90, "Seminar", "fixed"], [120, 165, "Essay", "moved later"]] },
      short: { summary: "It’s 2:30 pm, and today now ends at 4:00.", now: 30, end: 120, blocks: [[90, 120, "Reading", "fits"], [30, 90, "Seminar", "fixed"], [-1, 45, "Essay", "doesn’t fit today"]] }
    };
    const clock = (m) => { const v = 120 + m; return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`; };
    const pct = (m) => `${(m / 180 * 100).toFixed(2)}%`;
    const blocks = [...fig2.querySelectorAll("[data-block]")];
    const draw = (key) => {
      const D = S[key];
      fig2.querySelector("[data-summary]").textContent = D.summary;
      fig2.style.setProperty("--now", pct(D.now));
      fig2.style.setProperty("--end", pct(D.end));
      D.blocks.forEach((b, i) => {
        const el = blocks[i], deferred = b[0] < 0;
        el.style.left = deferred ? "0%" : pct(b[0]);
        el.style.width = deferred ? pct(b[1]) : pct(b[1] - b[0]);
        el.classList.toggle("is-deferred", deferred);
        el.querySelector("span").textContent = deferred ? "For later" : `${clock(b[0])}-${clock(b[1])}`;
        el.querySelector("small").textContent = b[3];
      });
      fig2.querySelectorAll("[data-scen]").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.scen === key)));
    };
    fig2.addEventListener("click", (e) => { const b = e.target.closest("[data-scen]"); if (b) draw(b.dataset.scen); });
    draw("on-time");
  }
  const fig4 = document.querySelector("[data-fig4]");
  if (fig4) {
    const state = { refill: false, missed: false };
    const draw = () => {
      const days = 96, sx = 330 / days, sy = 180 / 90;
      let v = 34, out = -1;
      const pts = [[0, 34]];
      for (let d = 1; d <= days; d += 1) {
        if (v > 0 && !(state.missed && d === 6)) v -= 1;
        if (state.refill && d === 11) v += 30;
        if (v === 0 && out < 0) out = d;
        pts.push([d, v]);
      }
      const line = pts.map((p, i) => `${i ? "L" : "M"}${(p[0] * sx).toFixed(1)} ${(180 - p[1] * sy).toFixed(1)}`).join(" ");
      const date = new Date(2026, 9, 9 + out).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      fig4.querySelector("[data-line]").setAttribute("d", line);
      fig4.querySelector("[data-area]").setAttribute("d", `${line} L330 180 L0 180 Z`);
      const dot = fig4.querySelector("[data-dot]"), label = fig4.querySelector("[data-dot-label]");
      dot.setAttribute("cx", (out * sx).toFixed(1));
      label.setAttribute("x", (out * sx).toFixed(1));
      label.textContent = date;
      fig4.querySelectorAll("[data-date]").forEach((el) => { el.textContent = date; });
      fig4.querySelector("[data-refill-cell]").textContent = state.refill ? "+30" : "none";
      fig4.querySelector("[data-missed-cell]").textContent = state.missed ? "+1 day" : "none";
      fig4.querySelector("[data-doses]").textContent = `−${34 + (state.refill ? 30 : 0)}`;
      fig4.querySelector("svg").setAttribute("aria-label", `Tablets on hand from October 9. The supply runs out around ${date}.`);
      fig4.querySelectorAll("[data-toggle]").forEach((b) => b.setAttribute("aria-pressed", String(state[b.dataset.toggle])));
    };
    fig4.addEventListener("click", (e) => { const b = e.target.closest("[data-toggle]"); if (b) { state[b.dataset.toggle] = !state[b.dataset.toggle]; draw(); } });
    draw();
  }
}

// The home page: a chart of seven islands, one for each of us, drawn for the visitor's time of day.
// The chart sits at a low isometric angle; "Take the plane" drops the camera in behind a toy seaplane
// you can fly with the arrow keys or the pointer. Fly into an island and you land on that person's page.
import { context, program, fullscreen, noiseTexture, loop, reducedMotion, clamp, mix } from "./gl.js";

const NEAR = 0.04, FAR = 140;

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uT, uFov, uTilt, uNight, uBeam, uGold, uNear, uFar;
uniform vec3 uRo, uF, uR, uU, uSun, cSkyZ, cSkyH, cSun, cAmb, cDeep, cShal;
uniform vec4 uShadow;
uniform sampler2D uN;
const vec2 CEN[7] = vec2[7](vec2(0.), vec2(-2.7,1.7), vec2(.5,2.45), vec2(2.95,1.5), vec2(2.75,-1.15), vec2(.55,-2.4), vec2(-1.9,-1.75));
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return texture(uN,(i+f+.5)/256.).r; }
float hs(vec2 i){ return texture(uN,(i+.5)/256.).r; }
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
  vec3 c=vec3(0.); float w=.0001, a;
  a=g(p,CEN[0],.9); c+=a*vec3(.95,.8,.2); w+=a;
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
// Round painted tree crowns, each with a lit side and a small shadow.
vec3 crowns(vec2 p){
  vec2 q=p*21., i=floor(q), f=fract(q); float best=9., sh=9.; vec2 bo=vec2(0.);
  vec2 so=-uSun.xz/max(uSun.y,.25)*.11;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 c=vec2(x,y), r=vec2(hs(i+c),hs(i+c+vec2(91.,37.)));
    vec2 d=c+.15+r*.7-f; float dd=dot(d,d);
    if(dd<best){ best=dd; bo=d; }
    vec2 e=d+so*21.; sh=min(sh,dot(e,e));
  }
  float m=smoothstep(.13,.09,best), lit=clamp(.5-dot(normalize(bo+1e-4),normalize(uSun.xz+1e-4))*.5,0.,1.);
  return vec3(m, lit, smoothstep(.13,.08,sh)*(1.-m));
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
  float tmax=min(tw,60.);
  if(live){ for(int i=0;i<120;i++){ vec3 p=ro+rd*t; float d=p.y-terr(p.xz); if(d<.0012*t+.0006){ hit=t; break; } t+=d*.42+.002*t; if(t>tmax) break; } }
  vec3 col; float dist=1e5; vec2 wp=vec2(99.);
  if(hit>0.){
    vec3 p=ro+rd*hit; dist=hit; wp=p.xz;
    float e=.006+.0012*hit;
    float h=terrD(p.xz);
    vec3 n=normalize(vec3(terrD(p.xz-vec2(e,0.))-terrD(p.xz+vec2(e,0.)),2.*e,terrD(p.xz-vec2(0.,e))-terrD(p.xz+vec2(0.,e))));
    float j=h+(vn(p.xz*11.)-.5)*.07;
    vec3 tint=isleTint(p.xz);
    vec3 c=vec3(.95,.88,.68);
    c=mix(c,mix(vec3(.52,.66,.3),tint,.24),smoothstep(.035,.05,j));
    c=mix(c,mix(vec3(.34,.52,.27),tint,.36),smoothstep(.2,.215,j));
    c=mix(c,mix(vec3(.74,.62,.38),tint,.26),smoothstep(.42,.435,j));
    c=mix(c,vec3(.58,.53,.56),smoothstep(.78,.8,j));
    c=mix(c,vec3(.96,.95,.93),smoothstep(1.15,1.17,j));
    // forest on the gentle green slopes
    float forest=smoothstep(.06,.1,j)*smoothstep(.62,.5,j)*smoothstep(.55,.7,n.y)*smoothstep(.42,.58,fbm3(p.xz*2.1+7.));
    if(forest>.01){ vec3 cr=crowns(p.xz); vec3 leaf=mix(vec3(.2,.42,.22),tint*.45+vec3(.1,.28,.12),.25); c=mix(c,c*.72,cr.z*forest*.8); c=mix(c,mix(leaf*1.25,leaf*.7,cr.y),cr.x*forest); }
    float sh=shadow(p+n*.02);
    float ndl=dot(n,uSun);
    float dif=smoothstep(-.02,.22,ndl)*.55+smoothstep(.22,.7,ndl)*.45;
    dif*=sh;
    float sl=clamp(.5+.5*n.y,0.,1.);
    c*=cAmb*(.62+.48*sl)+cSun*dif*1.05;
    float fw=fwidth(h)*1.2+.0008;
    float l1=1.-smoothstep(0.,fw,abs(fract(h/.08+.5)-.5)*.08);
    float l5=1.-smoothstep(0.,fw*1.9,abs(fract(h/.4+.5)-.5)*.4);
    c=mix(c,c*.55,max(l1*.45,l5*.75)*smoothstep(.02,.06,h));
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
    c*=.64+.36*sh;
    float cs=smoothstep(.55,.8,fbm3(p.xz*.42+vec2(uT*.035,uT*.01)));
    c*=1.-.18*cs*(1.-uNight);
    // a dashed reef offshore, and a scalloped foam rim
    vec2 cc=CEN[0]; float bd=1e9;
    for(int k=0;k<7;k++){ float dd=length(p.xz-CEN[k]); if(dd<bd){ bd=dd; cc=CEN[k]; } }
    float ang=atan(p.z-cc.y,p.x-cc.x);
    float reef=(1.-smoothstep(0.,fw*1.6+.003,abs(d-.09)))*step(.45,fract(ang*bd*7.));
    float wv=sin(d*95.-uT*1.9+vn(p.xz*5.)*6.283);
    float rim=.02+.008*sin(ang*bd*26.);
    float foam=smoothstep(.72,.98,wv)*smoothstep(.16,.015,d)*.5+smoothstep(rim,rim*.25,d)*.9+reef*.55;
    c=mix(c,vec3(1.)*(cAmb+cSun*.75),clamp(foam,0.,1.));
    float gl=pow(vn(p.xz*37.+vec2(uT*.9,0.))*vn(p.xz*59.-vec2(0.,uT*.8)),4.)*14.;
    c+=cSun*gl*.18*sh*(1.-uNight*.9)*mix(.05,.3,uTilt);
    vec2 gq=abs(fract(p.xz+.5)-.5); float gr=1.-smoothstep(0.,.006+.0015*tw,min(gq.x,gq.y));
    c+=gr*mix(.06,.035,uTilt);
    float fr=pow(1.-max(-rd.y,0.),5.);
    c=mix(c,sky(reflect(rd,vec3(0.,1.,0.))),floor(fr*4.)/4.*.35*uTilt);
    vec3 hv=normalize(uSun-rd); float spec=pow(max(hv.y,0.),260.);
    c+=cSun*spec*(.5+.8*gl)*uGold*mix(.35,1.,uTilt);
    c+=uNight*vec3(1.,.72,.35)*lights(p.xz)*.5;
    float ba=atan(p.z,p.x); float bm=pow(max(cos(ba-uBeam),0.),90.)*exp(-length(p.xz)*.32);
    c+=uNight*vec3(1.,.85,.5)*bm*.55;
    col=c;
  } else {
    col=sky(rd);
  }
  // the plane's shadow, wherever it falls
  if(dist<1e4){ vec2 pd=wp-uShadow.xy; col*=1.-uShadow.w*exp(-dot(pd,pd)/(uShadow.z*uShadow.z)); }
  if(dist<1e4){ float fog=1.-exp(-dist*.032*uTilt); col=mix(col,sky(normalize(vec3(rd.x,.03,rd.z))),fog*.85); }
  vec2 vq=gl_FragCoord.xy/uRes; float vg=smoothstep(1.25,.35,length((vq-.5)*vec2(1.25,1.)));
  col*=.8+.2*vg;
  col*=.965+.07*vn(gl_FragCoord.xy*.9);
  o=vec4(pow(clamp(col,0.,1.),vec3(.95)),1.);
  float z=dist*dot(rd,uF);
  float A=(uFar+uNear)/(uFar-uNear), B=2.*uFar*uNear/(uFar-uNear);
  gl_FragDepth=dist<1e4?clamp(.5*(A-B/max(z,uNear))+.5,0.,1.):1.;
}`;

// ---------- the toy seaplane ----------
const MESH_V = `#version 300 es
in vec3 aP; in vec3 aN; in vec4 aC;
uniform vec3 uX, uY, uZ, uPos; uniform float uScale, uOut, uProp;
uniform vec3 uRo, uF, uR, uU; uniform float uFov, uAsp, uNear, uFar;
out vec3 vN; out vec4 vC; out vec3 vW;
void main(){
  vec3 lp=aP+aN*uOut;
  if(aC.a<.5){ float a=uProp, c=cos(a), s=sin(a); lp=vec3(c*lp.x-s*lp.y, s*lp.x+c*lp.y, lp.z); }
  vec3 w=uPos+(uX*lp.x+uY*lp.y+uZ*lp.z)*uScale;
  vec3 v=w-uRo; float z=dot(v,uF);
  float A=(uFar+uNear)/(uFar-uNear), B=2.*uFar*uNear/(uFar-uNear);
  gl_Position=vec4(dot(v,uR)/(uFov*uAsp), dot(v,uU)/uFov, A*z-B, z);
  vN=uX*aN.x+uY*aN.y+uZ*aN.z; vC=aC; vW=w;
}`;
const MESH_F = `#version 300 es
precision highp float;
in vec3 vN; in vec4 vC; in vec3 vW; out vec4 o;
uniform vec3 uSun, cSun, cAmb, cSkyH, uRo; uniform float uOutline, uNight;
void main(){
  if(uOutline>.5){ o=vec4(mix(vec3(.07,.1,.2),vec3(.02,.03,.07),uNight),1.); return; }
  vec3 n=normalize(vN), v=normalize(uRo-vW);
  if(dot(n,v)<0.) n=-n;
  float ndl=dot(n,uSun);
  float lit=smoothstep(-.04,.08,ndl)*.62+smoothstep(.3,.42,ndl)*.38;
  vec3 base=vC.rgb;
  vec3 c=base*(cAmb*.95+cSkyH*.18)+base*cSun*lit*.95;
  vec3 h=normalize(uSun+v);
  c+=smoothstep(.955,.975,dot(n,h))*.55*cSun;
  c+=pow(1.-max(dot(n,v),0.),3.)*.18*cSkyH;
  o=vec4(pow(clamp(c,0.,1.),vec3(.95)),1.);
}`;
const TRAIL_V = `#version 300 es
in vec3 aP; in vec2 aA;
uniform vec3 uRo, uF, uR, uU; uniform float uFov, uAsp, uNear, uFar;
out vec2 vA;
void main(){
  vec3 v=aP-uRo; float z=dot(v,uF);
  float A=(uFar+uNear)/(uFar-uNear), B=2.*uFar*uNear/(uFar-uNear);
  gl_Position=vec4(dot(v,uR)/(uFov*uAsp), dot(v,uU)/uFov, A*z-B, z);
  vA=aA;
}`;
const TRAIL_F = `#version 300 es
precision highp float;
in vec2 vA; out vec4 o; uniform vec3 cSun, cAmb; uniform float uFlat;
void main(){
  float a=vA.x*(1.-vA.y*vA.y);
  if(uFlat>.5){ o=vec4(vec3(.82,.88,.95)*a*.55,a*.55); return; }
  vec3 c=vec3(1.)*(cAmb*.9+cSun*.75);
  o=vec4(c*a*.7,a*.7);
}`;

function buildPlane() {
  const P = [], N = [], C = [], I = [], shapes = [];
  const WHITE = [0.96, 0.94, 0.89], YEL = [0.95, 0.8, 0.22], NAVY = [0.11, 0.16, 0.29], GLASS = [0.2, 0.32, 0.5], RED = [0.78, 0.27, 0.17];
  const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  const shape = (nu, nv, at, color, prop = 1) => {
    const start = P.length / 3, grid = [];
    for (let i = 0; i <= nu; i += 1) for (let j = 0; j <= nv; j += 1) {
      const p = at(i / nu, j / nv); grid.push(p);
      P.push(p[0], p[1], p[2]); N.push(0, 0, 0);
      const c = color(p); C.push(c[0], c[1], c[2], prop);
    }
    const i0 = I.length;
    for (let i = 0; i < nu; i += 1) for (let j = 0; j < nv; j += 1) {
      const a = start + i * (nv + 1) + j, b = a + nv + 1;
      I.push(a, b, a + 1, a + 1, b, b + 1);
    }
    shapes.push({ v0: start, v1: P.length / 3, i0, i1: I.length });
  };
  // superellipsoid: e1 shapes it top to bottom, e2 around
  const blob = (cx, cy, cz, rx, ry, rz, e1, e2, color, prop = 1) => shape(16, 28, (u, v) => {
    const la = -Math.PI / 2 + u * Math.PI, lo = -Math.PI + v * Math.PI * 2;
    const cu = Math.cos(la);
    return [cx + rx * sp(cu, e1) * sp(Math.cos(lo), e2), cy + ry * sp(Math.sin(la), e1), cz + rz * sp(cu, e1) * sp(Math.sin(lo), e2)];
  }, color, prop);
  // fuselage: a chubby lathe along z
  const prof = [[-0.52, 0.0], [-0.5, 0.03], [-0.38, 0.055], [-0.2, 0.09], [0.0, 0.118], [0.16, 0.125], [0.3, 0.118], [0.38, 0.105], [0.43, 0.085], [0.46, 0.05], [0.47, 0.0]];
  const rAt = (z) => { for (let k = 1; k < prof.length; k += 1) if (z <= prof[k][0]) { const [z0, r0] = prof[k - 1], [z1, r1] = prof[k], t = (z - z0) / (z1 - z0); return r0 + (r1 - r0) * (t * t * (3 - 2 * t)); } return 0; };
  shape(40, 28, (u, v) => {
    const z = -0.52 + u * 0.99, r = rAt(z), a = -Math.PI + v * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r * 1.08 + (z < -0.2 ? (z + 0.2) * -0.12 : 0), z];
  }, ([x, y, z]) => {
    if (z > 0.38) return NAVY;
    if (z > 0.06 && z < 0.27 && y > 0.045 && Math.abs(x) < 0.11) return GLASS;
    if (y > -0.025 && y < 0.018) return YEL;
    if (y > -0.04 && y <= -0.025) return NAVY;
    return WHITE;
  });
  blob(0, 0, 0.49, 0.045, 0.045, 0.05, 1, 1, () => YEL);
  // high wing, tips in yellow
  blob(0, 0.138, 0.1, 0.64, 0.026, 0.105, 0.5, 0.32, ([x]) => (Math.abs(x) > 0.53 ? YEL : WHITE));
  // tail
  blob(0, 0.04, -0.45, 0.22, 0.016, 0.065, 0.5, 0.4, () => WHITE);
  blob(0, 0.13, -0.44, 0.017, 0.12, 0.075, 0.5, 0.45, ([, y]) => (y > 0.19 ? NAVY : YEL));
  // floats and their struts
  for (const sx of [-1, 1]) {
    blob(sx * 0.2, -0.245, 0.03, 0.052, 0.046, 0.37, 0.75, 0.75, ([, y]) => (y > -0.215 ? NAVY : WHITE));
    blob(sx * 0.13, -0.15, 0.14, 0.012, 0.08, 0.016, 0.8, 0.8, () => NAVY);
    blob(sx * 0.13, -0.15, -0.1, 0.012, 0.08, 0.016, 0.8, 0.8, () => NAVY);
  }
  // propeller: two blades that turn (flagged with alpha 0)
  blob(0, 0.11, 0.5, 0.018, 0.11, 0.006, 0.6, 0.6, () => [0.2, 0.2, 0.24], 0);
  blob(0, -0.11, 0.5, 0.018, 0.11, 0.006, 0.6, 0.6, () => [0.2, 0.2, 0.24], 0);
  // smooth normals
  for (let k = 0; k < I.length; k += 3) {
    const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; }
  }
  for (let k = 0; k < N.length; k += 3) { const l = Math.hypot(N[k], N[k + 1], N[k + 2]) || 1; N[k] /= l; N[k + 1] /= l; N[k + 2] /= l; }
  // every shape faces outward, with the same winding
  for (const sh of shapes) {
    let cx = 0, cy = 0, cz = 0, n = sh.v1 - sh.v0, dot = 0;
    for (let v = sh.v0; v < sh.v1; v += 1) { cx += P[v * 3] / n; cy += P[v * 3 + 1] / n; cz += P[v * 3 + 2] / n; }
    for (let v = sh.v0; v < sh.v1; v += 1) dot += (P[v * 3] - cx) * N[v * 3] + (P[v * 3 + 1] - cy) * N[v * 3 + 1] + (P[v * 3 + 2] - cz) * N[v * 3 + 2];
    if (dot < 0) {
      for (let v = sh.v0 * 3; v < sh.v1 * 3; v += 1) N[v] = -N[v];
      for (let k = sh.i0; k < sh.i1; k += 3) { const tmp = I[k + 1]; I[k + 1] = I[k + 2]; I[k + 2] = tmp; }
    }
  }
  return { P: new Float32Array(P), N: new Float32Array(N), C: new Float32Array(C), I: new Uint16Array(I) };
}

// ---------- the same terrain, in JavaScript, for flying ----------
const NOISE = (() => {
  const data = new Uint8Array(256 * 256);
  let s = 1234567;
  for (let i = 0; i < data.length; i += 1) { s = (s * 1103515245 + 12345) & 0x7fffffff; data[i] = (s >> 16) & 255; }
  return data;
})();
const vn = (x, y) => {
  const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const at = (a, b) => NOISE[((b & 255) << 8) | (a & 255)] / 255;
  const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
};
const gx = (x, z, cx, cz, r) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (r * r));
const baseH = (x, z) => {
  let h = 0.5 * gx(x, z, 0, 0, 0.5);
  h += 0.95 * gx(x, z, -3.05, 1.5, 0.7) + 0.85 * gx(x, z, -2.3, 1.95, 0.62);
  h += 0.82 * gx(x, z, 0.05, 2.4, 0.72) + 0.72 * gx(x, z, 0.95, 2.55, 0.62);
  h += 0.62 * gx(x, z, 2.95, 1.5, 0.95) + 0.3 * gx(x, z, 3.45, 1.05, 0.45);
  h += 1.8 * gx(x, z, 2.75, -1.15, 0.8) - 0.42 * gx(x, z, 2.75, -1.15, 0.13);
  h += 0.38 * gx(x, z, 0.55, -2.55, 0.82) + 0.6 * gx(x, z, 0.18, -2.3, 0.28) + 0.62 * gx(x, z, 0.92, -2.28, 0.28);
  const rk = Math.hypot(x + 1.9, z + 1.75); h += 0.62 * Math.exp(-(((rk - 0.6) / 0.23) ** 2));
  return h;
};
const terrain = (x, z) => {
  const px = x * 1.6 + 3, pz = z * 1.6 + 3;
  const n = (0.5 * vn(px, pz) + 0.25 * vn(px * 2.03 + 17.3, pz * 2.03 + 17.3) + 0.125 * vn(px * 4.01 + 31.7, pz * 4.01 + 31.7)) / 0.875;
  return baseH(x, z) * (0.62 + 0.75 * n) + 0.16 * (n - 0.5) - 0.2;
};

const ISLES = [
  { key: "home", name: "Home", p: [0, 0.75, 0], href: "/" },
  { key: "nicholas", name: "Nicholas", p: [-2.7, 1.25, 1.7], href: "/nicholas/" },
  { key: "andreas", name: "Andreas", p: [0.5, 1.2, 2.45], href: "/andreas/" },
  { key: "oksana", name: "Oksana", p: [2.95, 0.95, 1.5], href: "/oksana/" },
  { key: "lukas", name: "Lukas", p: [2.75, 2.0, -1.15], href: "/lukas/" },
  { key: "foxy", name: "Foxy", p: [0.55, 1.05, -2.4], href: "/foxy/" },
  { key: "kiriakos", name: "Kiriakos", p: [-1.9, 0.95, -1.75], href: "/kiriakos/" }
];
const EXTENT = { x: 3.95, z: 3.4 };
const CHART_PITCH = 0.98;

// A loop through the chain for the autopilot: a closed Catmull-Rom spline between the islands,
// sampled by arc length, with its height lifted wherever the ground rises.
const ROUTE = (() => {
  const ring = ISLES.slice(1).map((q) => ({ a: Math.atan2(q.p[2], q.p[0]), x: q.p[0] * 0.66, z: q.p[2] * 0.66 })).sort((a, b) => a.a - b.a);
  const pts = [];
  ring.forEach((q, i) => {
    const n = ring[(i + 1) % ring.length];
    pts.push([q.x, q.z]);
    pts.push([(q.x + n.x) / 2 * 1.32, (q.z + n.z) / 2 * 1.32]);
  });
  const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
  const raw = [];
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[(i - 1 + pts.length) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length], d = pts[(i + 2) % pts.length];
    for (let k = 0; k < 40; k += 1) { const t = k / 40; raw.push([cr(a[0], b[0], c[0], d[0], t), cr(a[1], b[1], c[1], d[1], t)]); }
  }
  let L = 0; const acc = [0];
  for (let i = 1; i <= raw.length; i += 1) { const a = raw[i - 1], b = raw[i % raw.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); acc.push(L); }
  const alt = raw.map(([x, z]) => Math.max(1.05, terrain(x, z) + 0.55));
  for (let pass = 0; pass < 30; pass += 1) for (let i = 0; i < alt.length; i += 1) alt[i] = Math.max(alt[i], (alt[(i - 1 + alt.length) % alt.length] + alt[(i + 1) % alt.length]) / 2 - 0.004);
  const at = (d) => {
    d = ((d % L) + L) % L;
    let lo = 0, hi = raw.length;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (acc[m] <= d) lo = m; else hi = m; }
    const a = raw[lo], b = raw[(lo + 1) % raw.length], f = (d - acc[lo]) / ((acc[lo + 1] - acc[lo]) || 1);
    return [a[0] + (b[0] - a[0]) * f, alt[lo] + (alt[(lo + 1) % alt.length] - alt[lo]) * f, a[1] + (b[1] - a[1]) * f];
  };
  const nearest = (x, z) => { let best = 0, bd = Infinity; for (let i = 0; i < raw.length; i += 1) { const d = (raw[i][0] - x) ** 2 + (raw[i][1] - z) ** 2; if (d < bd) { bd = d; best = i; } } return acc[best]; };
  return { L, at, nearest };
})();

const root = document.querySelector("[data-archipelago]");
const canvas = root && root.querySelector("canvas");
const gl = canvas && context(canvas, { depth: true });
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
  const meshProg = (() => {
    const compile = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error("[mesh]", gl.getShaderInfoLog(sh)); return sh; };
    const make = (vs, fs) => {
      const pr = gl.createProgram();
      gl.attachShader(pr, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(pr, 0, "aP"); gl.bindAttribLocation(pr, 1, "aN"); gl.bindAttribLocation(pr, 2, "aC"); gl.bindAttribLocation(pr, 3, "aA");
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.error("[mesh]", gl.getProgramInfoLog(pr)); return null; }
      const cache = {};
      return { pr, use: () => gl.useProgram(pr), u: (n) => (n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(pr, n))) };
    };
    return { plane: make(MESH_V, MESH_F), trail: make(TRAIL_V, TRAIL_F) };
  })();

  gl.bindVertexArray(null);
  P.use();
  fullscreen(gl);
  noiseTexture(gl, 1234567, 0);
  gl.uniform1i(P.u("uN"), 0);
  root.classList.add("has-gl");

  // Plane buffers
  const geo = buildPlane();
  const planeVAO = gl.createVertexArray();
  gl.bindVertexArray(planeVAO);
  const buf = (data, loc, size) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); };
  buf(geo.P, 0, 3); buf(geo.N, 1, 3); buf(geo.C, 2, 4);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.I, gl.STATIC_DRAW);
  const trailVAO = gl.createVertexArray();
  gl.bindVertexArray(trailVAO);
  const trailBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 20, 12);
  gl.bindVertexArray(null);

  const labels = [...root.querySelectorAll("[data-isle]")].map((el) => ({ el, isle: ISLES.find((q) => q.key === el.dataset.isle) })).filter((q) => q.isle);
  const head = root.querySelector("[data-cartouche]");
  const rose = root.querySelector("[data-rose]");
  const hud = root.querySelector("[data-hud]");
  const hdg = root.querySelector("[data-hdg]");
  const altEl = root.querySelector("[data-alt]");
  const next = root.querySelector("[data-next]");
  const note = root.querySelector("[data-note]");
  const flyButton = root.querySelector("[data-fly]");
  const flyLabel = flyButton && flyButton.querySelector("span");
  const corrected = root.querySelector("[data-corrected]");
  const flash = root.querySelector("[data-flash]");

  // plane state: position, heading (yaw, 0 = north), climb angle, bank
  const start = ROUTE.at(0);
  const s = { tilt: 0, tv: 0, hour: hourTarget(), d: 0, x: start[0], y: start[1], z: start[2], yaw: 0, pitch: 0, roll: 0, speed: 0.42, beam: 0, fly: false, n: 0, cam: null, crashed: false, rejoin: 0 };
  { const a = ROUTE.at(0.05); s.yaw = Math.atan2(a[0] - s.x, a[2] - s.z); }
  const trail = [];
  const keys = new Set();
  const ptr = { x: 0, y: 0, t: -1e9, down: false };
  let view = layout();

  function layout() {
    const W = root.clientWidth, H = root.clientHeight, portrait = W / H < 0.95;
    const box = head.getBoundingClientRect(), rb = root.getBoundingClientRect();
    let free;
    if (portrait) free = { x0: 6, x1: W - 6, y0: 120, y1: Math.max(H * 0.45, box.top - rb.top - 8) };
    else free = { x0: Math.min(W * 0.45, box.right - rb.left + 24), x1: W - 24, y0: 70, y1: H - 24 };
    const hw = (free.x1 - free.x0) / H, hh = (free.y1 - free.y0) / H;
    const sp = Math.sin(CHART_PITCH), cp = Math.cos(CHART_PITCH);
    const ex = portrait ? EXTENT.z : EXTENT.x, ez = portrait ? EXTENT.x : EXTENT.z;
    const y0 = -ez * sp - 0.1 * cp, y1 = ez * sp + 1.45 * cp;
    const span = Math.max(ex / hw, (y1 - y0) / 2 / hh) * 1.04;
    const sx = ((free.x0 + free.x1) / 2 - W / 2) / (H / 2), sy = (H / 2 - (free.y0 + free.y1) / 2) / (H / 2);
    if (rose) rose.style.transform = portrait ? "rotate(-90deg)" : "none";
    return { W, H, portrait, span, sx, sy, cy: (y0 + y1) / 2, chartYaw: portrait ? Math.PI / 2 : 0 };
  }
  new ResizeObserver(() => { view = layout(); }).observe(root);

  const setFly = (on) => {
    if (on === s.fly) return;
    s.fly = on;
    s.crashed = false;
    root.classList.toggle("is-flying", on);
    if (flyLabel) flyLabel.textContent = on ? "Back to the chart" : "Take the plane";
    if (flyButton) flyButton.setAttribute("aria-pressed", String(on));
    if (reducedMotion.matches) s.tilt = on ? 1 : 0;
    if (on) { s.speed = 0.5; if (note) note.textContent = note.dataset.help; }
    else { s.d = ROUTE.nearest(s.x, s.z); s.rejoin = 1; }
    engine.start();
  };
  if (flyButton) { flyButton.hidden = false; flyButton.addEventListener("click", () => setFly(!s.fly)); }
  root.addEventListener("pointermove", (e) => { const r = root.getBoundingClientRect(); ptr.x = ((e.clientX - r.left) / r.width - 0.5) * 2; ptr.y = -((e.clientY - r.top) / r.height - 0.5) * 2; ptr.t = performance.now(); });
  root.addEventListener("pointerleave", () => { ptr.t = -1e9; });
  const KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1 };
  addEventListener("keydown", (e) => {
    if (!s.fly) return;
    if (e.code === "Escape") { setFly(false); return; }
    if (KEYS[e.code]) { keys.add(e.code); e.preventDefault(); }
  });
  addEventListener("keyup", (e) => keys.delete(e.code));
  addEventListener("blur", () => keys.clear());

  const stamp = () => {
    if (!corrected) return;
    const pick = new URLSearchParams(location.search).get("time");
    const d = new Date(), h = d.getHours(), m = String(d.getMinutes()).padStart(2, "0");
    corrected.textContent = pick ? `Shown at ${pick}` : `Corrected to ${(h % 12) || 12}:${m} ${h < 12 ? "am" : "pm"} today`;
  };
  stamp();
  setInterval(stamp, 30000);

  const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const nearestIsle = (x, z) => { let best = ISLES[0], bd = Infinity; for (const q of ISLES) { const d = Math.hypot(q.p[0] - x, q.p[2] - z); if (d < bd) { bd = d; best = q; } } return [best, bd]; };

  const crash = (isle) => {
    s.crashed = true;
    if (isle.key === "home") {
      if (note) note.textContent = "That’s home. Back to the chart.";
      s.y = terrain(s.x, s.z) + 0.6; s.pitch = 0.4;
      setTimeout(() => setFly(false), 650);
      return;
    }
    if (note) note.textContent = `Landing on ${isle.name}’s island`;
    if (flash) flash.classList.add("is-on");
    setTimeout(() => { location.href = isle.href; }, 650);
  };

  const engine = loop(canvas, (t, dt) => {
    s.n += 1;
    const still = reducedMotion.matches && !s.fly;
    if (still) dt = 0;
    s.tv += (((s.fly ? 1 : 0) - s.tilt) * 22 - s.tv * 9) * dt;
    s.tilt += s.tv * dt;
    const tilt = clamp(s.tilt), ez = tilt * tilt * (3 - 2 * tilt);
    let dh = hourTarget() - s.hour;
    if (dh > 12) dh -= 24;
    if (dh < -12) dh += 24;
    s.hour = (s.hour + dh * (1 - Math.exp(-dt * 1.6)) + 24) % 24;

    // ----- flight -----
    if (!s.fly) {
      // autopilot along the route; after a flight, glide back onto it
      s.d += s.speed * dt;
      const p = ROUTE.at(s.d), ahead = ROUTE.at(s.d + 0.12);
      const k = s.rejoin > 0 ? 1 - Math.exp(-dt * 1.2) : 1;
      s.rejoin = Math.max(0, s.rejoin - dt * 0.5);
      const ox = s.x, oz = s.z, oy = s.y;
      s.x += (p[0] - s.x) * k; s.y += (p[1] - s.y) * k; s.z += (p[2] - s.z) * k;
      const wantYaw = Math.atan2(ahead[0] - s.x, ahead[2] - s.z);
      const turn = dt > 0 ? wrap(wantYaw - s.yaw) : 0;
      s.yaw = wrap(s.yaw + turn * Math.min(1, dt * 4));
      const rate = dt > 0 ? turn * 4 : 0;
      s.roll += (clamp(rate * 0.55, -0.6, 0.6) - s.roll) * Math.min(1, dt * 3);
      const climb = dt > 0 ? Math.atan2(s.y - oy, Math.hypot(s.x - ox, s.z - oz) + 1e-6) : 0;
      s.pitch += (clamp(climb, -0.3, 0.3) - s.pitch) * Math.min(1, dt * 3);
    } else if (!s.crashed) {
      let turn = 0, climb = 0;
      if (keys.has("ArrowLeft") || keys.has("KeyA")) turn -= 1;
      if (keys.has("ArrowRight") || keys.has("KeyD")) turn += 1;
      if (keys.has("ArrowUp") || keys.has("KeyW")) climb += 1;
      if (keys.has("ArrowDown") || keys.has("KeyS")) climb -= 1;
      if (!turn && !climb && performance.now() - ptr.t < 2500) {
        const dz = (v) => (Math.abs(v) < 0.08 ? 0 : clamp((v - Math.sign(v) * 0.08) * 1.5, -1, 1));
        turn = dz(ptr.x); climb = dz(ptr.y + 0.15);
      }
      // past the edge of the chart, the plane is drawn back toward the islands
      const r = Math.hypot(s.x, s.z), pull = clamp((r - 4.8) / 1.6);
      if (pull > 0) {
        const home = wrap(Math.atan2(-s.x, -s.z) - s.yaw);
        turn = mix(turn, clamp(home * 1.6, -1, 1), pull);
        if (note) note.textContent = "Turning back toward the islands";
      } else if (note && note.textContent !== note.dataset.help && !s.crashed) note.textContent = note.dataset.help;
      s.yaw = wrap(s.yaw + turn * 1.35 * dt);
      s.roll += (turn * 0.62 - s.roll) * Math.min(1, dt * 3.2);
      s.pitch += (climb * 0.42 - s.pitch) * Math.min(1, dt * 2.6);
      s.x += Math.sin(s.yaw) * Math.cos(s.pitch) * s.speed * dt;
      s.z += Math.cos(s.yaw) * Math.cos(s.pitch) * s.speed * dt;
      s.y += Math.sin(s.pitch) * s.speed * dt;
      if (s.y > 4.2) { s.y = 4.2; s.pitch = Math.min(s.pitch, 0); }
      const ground = terrain(s.x, s.z);
      if (ground < 0.02 && s.y < 0.07) { s.y = 0.07; s.pitch = Math.max(s.pitch, 0.06); }
      if (ground > 0.02 && s.y < ground + 0.015) crash(nearestIsle(s.x, s.z)[0]);
    }
    s.beam += dt * 0.7;

    // ----- light -----
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

    // ----- camera: the chart at a low isometric angle, or chasing the plane -----
    const chartDist = 30, chartFov = view.span / chartDist;
    if (!s.cam) s.cam = { yaw: s.yaw, x: s.x, y: s.y, z: s.z };
    const ck = 1 - Math.exp(-dt * 3.2);
    s.cam.yaw = wrap(s.cam.yaw + wrap(s.yaw - s.cam.yaw) * ck);
    s.cam.x += (s.x - s.cam.x) * Math.min(1, dt * 8); s.cam.y += (s.y - s.cam.y) * Math.min(1, dt * 4); s.cam.z += (s.z - s.cam.z) * Math.min(1, dt * 8);
    const pitch = mix(CHART_PITCH, 0.2, ez), dist = mix(chartDist, 1.4, ez), fov = mix(chartFov, 0.62, ez);
    const yaw = view.chartYaw + wrap(s.cam.yaw - view.chartYaw) * ez;
    const f = [Math.cos(pitch) * Math.sin(yaw), -Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)];
    const r = [Math.cos(yaw), 0, -Math.sin(yaw)];
    const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
    const span = view.span;
    const chartT = [-(r[0] * view.sx + u[0] * view.sy) * span + u[0] * view.cy, -(r[1] * view.sx + u[1] * view.sy) * span + u[1] * view.cy, -(r[2] * view.sx + u[2] * view.sy) * span + u[2] * view.cy];
    const chaseT = [s.cam.x + Math.sin(s.cam.yaw) * 0.35, s.cam.y + 0.12, s.cam.z + Math.cos(s.cam.yaw) * 0.35];
    const tgt = [mix(chartT[0], chaseT[0], ez), mix(chartT[1], chaseT[1], ez), mix(chartT[2], chaseT[2], ez)];
    const ro = [tgt[0] - f[0] * dist, tgt[1] - f[1] * dist, tgt[2] - f[2] * dist];
    const W = view.W, H = view.H, asp = canvas.width / canvas.height;
    const proj = (p) => {
      const v = [p[0] - ro[0], p[1] - ro[1], p[2] - ro[2]], z = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
      if (z < 0.05) return null;
      return [W / 2 + (v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) / (z * fov) * H / 2, H / 2 - (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / (z * fov) * H / 2, z];
    };

    // ----- the plane's frame and shadow -----
    const scale = mix(0.42 * view.span / 4.4, 0.16, ez);
    const cr = Math.cos(s.roll), sr = Math.sin(s.roll), cpi = Math.cos(s.pitch), spi = Math.sin(s.pitch);
    const Z = [Math.sin(s.yaw) * cpi, spi, Math.cos(s.yaw) * cpi];
    const X0 = [Math.cos(s.yaw), 0, -Math.sin(s.yaw)];
    const Y0 = [Z[1] * X0[2] - Z[2] * X0[1], Z[2] * X0[0] - Z[0] * X0[2], Z[0] * X0[1] - Z[1] * X0[0]];
    const Yp = Y0.map((v, i) => v * cr + X0[i] * sr), Xp = X0.map((v, i) => v * cr - Y0[i] * sr);
    const gnd = Math.max(0, terrain(s.x, s.z));
    const tsh = (s.y - gnd) / Math.max(sun[1], 0.25);
    const shadowStrength = (1 - night) * 0.32 * clamp(1.4 - (s.y - gnd) / 3);

    // ----- draw: terrain and sea, writing depth -----
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.ALWAYS); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
    gl.bindVertexArray(null);
    P.use();
    gl.uniform2f(P.u("uRes"), canvas.width, canvas.height);
    gl.uniform1f(P.u("uT"), reducedMotion.matches ? 40 : t % 3600);
    gl.uniform1f(P.u("uFov"), fov);
    gl.uniform1f(P.u("uTilt"), ez);
    gl.uniform1f(P.u("uNight"), night);
    gl.uniform1f(P.u("uGold"), 0.4 + gold * 0.9);
    gl.uniform1f(P.u("uBeam"), s.beam);
    gl.uniform1f(P.u("uNear"), NEAR); gl.uniform1f(P.u("uFar"), FAR);
    gl.uniform3fv(P.u("uRo"), ro); gl.uniform3fv(P.u("uF"), f); gl.uniform3fv(P.u("uR"), r); gl.uniform3fv(P.u("uU"), u);
    gl.uniform3fv(P.u("uSun"), sun);
    gl.uniform4f(P.u("uShadow"), s.x - sun[0] * tsh, s.z - sun[2] * tsh, scale * 0.42, shadowStrength);
    for (const key in C) gl.uniform3fv(P.u(key), C[key]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // ----- the plane -----
    const mp = meshProg.plane;
    if (mp) {
      gl.depthFunc(gl.LEQUAL);
      mp.use();
      gl.bindVertexArray(planeVAO);
      gl.uniform3fv(mp.u("uX"), Xp); gl.uniform3fv(mp.u("uY"), Yp); gl.uniform3fv(mp.u("uZ"), Z);
      gl.uniform3f(mp.u("uPos"), s.x, s.y, s.z);
      gl.uniform1f(mp.u("uScale"), scale);
      gl.uniform1f(mp.u("uProp"), still ? 0.6 : t * 31);
      gl.uniform3fv(mp.u("uRo"), ro); gl.uniform3fv(mp.u("uF"), f); gl.uniform3fv(mp.u("uR"), r); gl.uniform3fv(mp.u("uU"), u);
      gl.uniform1f(mp.u("uFov"), fov); gl.uniform1f(mp.u("uAsp"), asp); gl.uniform1f(mp.u("uNear"), NEAR); gl.uniform1f(mp.u("uFar"), FAR);
      gl.uniform3fv(mp.u("uSun"), sun); gl.uniform3fv(mp.u("cSun"), C.cSun); gl.uniform3fv(mp.u("cAmb"), C.cAmb); gl.uniform3fv(mp.u("cSkyH"), C.cSkyH);
      gl.uniform1f(mp.u("uNight"), night);
      // navy outline: the back faces, pushed out a little
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      gl.uniform1f(mp.u("uOutline"), 1); gl.uniform1f(mp.u("uOut"), 0.012);
      gl.drawElements(gl.TRIANGLES, geo.I.length, gl.UNSIGNED_SHORT, 0);
      gl.cullFace(gl.FRONT);
      gl.uniform1f(mp.u("uOutline"), 0); gl.uniform1f(mp.u("uOut"), 0);
      gl.drawElements(gl.TRIANGLES, geo.I.length, gl.UNSIGNED_SHORT, 0);
      gl.disable(gl.CULL_FACE);
    }

    // ----- wingtip trails, in the air where the plane was -----
    if (!still) {
      if (!trail.length || t - trail[trail.length - 1].t > 0.035) {
        const tip = (sx) => [s.x + (Xp[0] * 0.6 * sx - Z[0] * 0.05) * scale, s.y + (Xp[1] * 0.6 * sx + Yp[1] * 0.14 - Z[1] * 0.05) * scale, s.z + (Xp[2] * 0.6 * sx - Z[2] * 0.05) * scale];
        trail.push({ t, l: tip(-1), r: tip(1), w: scale });
      }
      while (trail.length && t - trail[0].t > 2.6) trail.shift();
    }
    const tp = meshProg.trail;
    if (tp && trail.length > 2) {
      const data = [];
      const viewDir = f;
      for (const side of ["l", "r"]) {
        for (let i = 0; i < trail.length; i += 1) {
          const a = trail[Math.max(0, i - 1)][side], b = trail[Math.min(trail.length - 1, i + 1)][side], p = trail[i][side];
          const tg = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
          let nx = tg[1] * viewDir[2] - tg[2] * viewDir[1], ny = tg[2] * viewDir[0] - tg[0] * viewDir[2], nz = tg[0] * viewDir[1] - tg[1] * viewDir[0];
          const nl = Math.hypot(nx, ny, nz) || 1;
          const age = (t - trail[i].t) / 2.6, w = trail[i].w * (0.025 + age * 0.07);
          nx = nx / nl * w; ny = ny / nl * w; nz = nz / nl * w;
          const al = (1 - age) * Math.min(1, i / 3) * (i === trail.length - 1 ? 0 : 1);
          if (i === 0 && data.length) data.push(...data.slice(-5), p[0] + nx, p[1] + ny, p[2] + nz, al, -1);
          data.push(p[0] + nx, p[1] + ny, p[2] + nz, al, -1, p[0] - nx, p[1] - ny, p[2] - nz, al, 1);
        }
      }
      const arr = new Float32Array(data);
      gl.bindVertexArray(trailVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      tp.use();
      gl.uniform3fv(tp.u("uRo"), ro); gl.uniform3fv(tp.u("uF"), f); gl.uniform3fv(tp.u("uR"), r); gl.uniform3fv(tp.u("uU"), u);
      gl.uniform1f(tp.u("uFov"), fov); gl.uniform1f(tp.u("uAsp"), asp); gl.uniform1f(tp.u("uNear"), NEAR); gl.uniform1f(tp.u("uFar"), FAR);
      gl.uniform3fv(tp.u("cSun"), C.cSun); gl.uniform3fv(tp.u("cAmb"), C.cAmb);
      gl.uniform1f(tp.u("uFlat"), night > 0.5 ? 1 : 0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, arr.length / 5);
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(null);

    // ----- labels and instruments -----
    for (const { el, isle } of labels) {
      const q = proj(isle.p);
      if (!q || q[0] < -80 || q[0] > W + 80 || q[1] < -40 || q[1] > H + 40) { el.style.opacity = "0"; el.style.pointerEvents = "none"; continue; }
      const fade = clamp(1.6 - q[2] / mix(60, 9, ez));
      el.style.opacity = fade.toFixed(2);
      el.style.pointerEvents = fade > 0.3 ? "" : "none";
      el.style.transform = `translate(${q[0].toFixed(1)}px,${(q[1] - mix(12, 14, ez)).toFixed(1)}px) translate(-50%,-100%)`;
    }
    head.style.opacity = (1 - Math.min(1, ez * 2.2)).toFixed(2);
    head.style.transform = `translateY(${(ez * 30).toFixed(1)}px)`;
    head.style.visibility = ez > 0.6 ? "hidden" : "";
    if (rose) rose.style.opacity = (0.9 * (1 - Math.min(1, ez * 3))).toFixed(2);
    if (hud) hud.style.opacity = Math.max(0, ez * 2.2 - 1.2).toFixed(2);
    if (note) note.style.opacity = Math.max(0, ez * 2.2 - 1.2).toFixed(2);
    if (s.n % 6 === 0 && s.fly) {
      if (hdg) hdg.textContent = String(((Math.round(s.yaw * 57.2958) % 360) + 360) % 360).padStart(3, "0") + "°";
      if (altEl) altEl.textContent = Math.max(0, Math.round(s.y * 1000 / 50) * 50).toLocaleString("en-US");
      if (next) next.textContent = nearestIsle(s.x, s.z)[0].name.toUpperCase();
    }
    if (still && Math.abs(s.tilt) < 0.001 && s.n > 2) engine.stop();
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

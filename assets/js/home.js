// The home page: a chart of seven islands. Home sits in the lagoon under its lighthouse, and the six of us
// ring it on one reef. The chart is lit for the visitor's time of day, or for the light they pick in the legend.
// "Take the plane" drops the camera in behind a toy seaplane you can fly with the arrow keys or the pointer;
// fly into an island and you land on that person's page.
import { context, program, fullscreen, noiseTexture, loop, reducedMotion, clamp, mix } from "./gl.js";

const NEAR = 0.04, FAR = 140;
const RING = { x: 3.4, z: 2.5 };
const REEF = 0.15, LAGOON = 0.08, DROP = 0.06;
const ROSE = { r1: 1.2, r2: 1.28, rays: 1.62 };
const CLOUD_Y = 1.62;

// Each island: centre, tint, the bumps that make its ground (offset x, offset z, height, radius) and its night lights.
const ISLES = [
  { key: "home", name: "Home", href: "/", c: [0, 0], tint: [0.95, 0.8, 0.2], bumps: [[0, 0, 0.56, 0.55]], lights: [] },
  { key: "nicholas", name: "Nicholas", href: "/nicholas/", c: [-2.95, 1.35], tint: [0.2, 0.55, 0.9], bumps: [[-0.35, -0.2, 0.95, 0.7], [0.4, 0.25, 0.85, 0.62]], lights: [[0.08, -0.68], [0.65, -0.2]] },
  { key: "andreas", name: "Andreas", href: "/andreas/", c: [0.15, 2.5], tint: [0.66, 0.5, 0.9], bumps: [[-0.45, -0.05, 0.82, 0.72], [0.45, 0.1, 0.72, 0.62]], lights: [[-0.2, -0.59], [0.8, -0.3]] },
  { key: "oksana", name: "Oksana", href: "/oksana/", c: [2.9, 1.35], tint: [0.35, 0.78, 0.5], bumps: [[0, 0, 0.62, 0.95], [0.5, -0.45, 0.3, 0.45]], lights: [[-0.45, -0.63], [0.6, 0.3]] },
  { key: "lukas", name: "Lukas", href: "/lukas/", c: [2.8, -1.2], tint: [0.92, 0.32, 0.38], bumps: [[0, 0, 1.8, 0.8], [0, 0, -0.42, 0.13]], lights: [[-0.65, 0.4], [0.5, -0.7]] },
  { key: "foxy", name: "Foxy", href: "/foxy/", c: [0.2, -2.45], tint: [0.95, 0.55, 0.2], bumps: [[0, -0.15, 0.38, 0.82], [-0.37, 0.1, 0.6, 0.28], [0.37, 0.12, 0.62, 0.28]], lights: [[0.05, 0.42]] },
  { key: "kiriakos", name: "Kiriakos", href: "/kiriakos/", c: [-2.75, -1.25], tint: [0.93, 0.72, 0.15], ring: [0.62, 0.6, 0.23], lights: [[0.55, 0.4], [-0.45, -0.55]] }
];
const BUMPS = [], RINGS = [], LIGHTS = [];
for (const q of ISLES) {
  for (const [ox, oz, a, r] of q.bumps || []) BUMPS.push([q.c[0] + ox, q.c[1] + oz, a, r]);
  if (q.ring) RINGS.push([q.c[0], q.c[1], ...q.ring]);
  for (const [ox, oz] of q.lights) LIGHTS.push([q.c[0] + ox, q.c[1] + oz]);
}
const n = (v) => { const s = (Math.round(v * 1000) / 1000).toString(); return s.includes(".") ? s : s + "."; };

const GLSL_ISLES = `
const vec2 CEN[7] = vec2[7](${ISLES.map((q) => `vec2(${n(q.c[0])},${n(q.c[1])})`).join(",")});
float base(vec2 p){
  float h=0.;
  ${BUMPS.map(([x, z, a, r]) => `h+=${n(a)}*g(p,vec2(${n(x)},${n(z)}),${n(r)});`).join("\n  ")}
  ${RINGS.map(([x, z, a, R, w]) => `{ float rk=length(p-vec2(${n(x)},${n(z)})); h+=${n(a)}*exp(-pow((rk-${n(R)})/${n(w)},2.)); }`).join("\n  ")}
  float e=length(p/vec2(${n(RING.x)},${n(RING.z)}));
  h+=${n(REEF)}*exp(-pow((e-1.)/.075,2.))+${n(LAGOON)}*(1.-smoothstep(.78,1.,e))-${n(DROP)}*smoothstep(1.25,1.9,e);
  return h;
}
vec3 isleTint(vec2 p){
  vec3 c=vec3(0.); float w=.0001, a;
  ${ISLES.map((q) => `a=g(p,CEN[${ISLES.indexOf(q)}],${q.key === "home" ? ".9" : "1.3"}); c+=a*vec3(${q.tint.map(n).join(",")}); w+=a;`).join("\n  ")}
  return c/w;
}
float lights(vec2 p){
  float l=0.;
  ${LIGHTS.map(([x, z]) => `l+=g(p,vec2(${n(x)},${n(z)}),.045);`).join("\n  ")}
  return l;
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uT, uFov, uTilt, uNight, uBeam, uGold, uNear, uFar, uCloud;
uniform vec3 uRo, uF, uR, uU, uSun, cSkyZ, cSkyH, cSun, cAmb, cDeep, cShal, uHi;
uniform vec4 uShadow, uBoat[3];
uniform mat2 uTxt;
uniform sampler2D uN, uG;
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return texture(uN,(i+f+.5)/256.).r; }
float hs(vec2 i){ return texture(uN,(i+.5)/256.).r; }
float fbm3(vec2 p){ return (.5*vn(p)+.25*vn(p*2.03+17.3)+.125*vn(p*4.01+31.7))/.875; }
float fbm5(vec2 p){ return (.5*vn(p)+.25*vn(p*2.03+17.3)+.125*vn(p*4.01+31.7)+.0625*vn(p*8.03+5.1)+.03125*vn(p*16.1+9.4))/.96875; }
float g(vec2 p, vec2 c, float r){ vec2 d=p-c; return exp(-dot(d,d)/(r*r)); }
${GLSL_ISLES}
float terr(vec2 p){ float n=fbm3(p*1.6+3.); return base(p)*(.62+.75*n)+.16*(n-.5)-.2; }
float terrD(vec2 p){ float n=fbm5(p*1.6+3.); return base(p)*(.62+.75*n)+.16*(n-.5)-.2; }
float shadow(vec3 p){
  float res=1., s=.04;
  for(int i=0;i<12;i++){ vec3 q=p+uSun*s; float d=q.y-terr(q.xz); res=min(res,10.*d/s); s+=clamp(d,.04,.3); if(res<.02||q.y>2.4) break; }
  return clamp(res,0.,1.);
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
  float m=1.-smoothstep(.09,.13,best), lit=clamp(.5-dot(normalize(bo+1e-4),normalize(uSun.xz+1e-4))*.5,0.,1.);
  return vec3(m, lit, (1.-smoothstep(.08,.13,sh))*(1.-m));
}
// A thin layer of fair-weather cumulus, drifting east.
const float CH=${n(CLOUD_Y)};
// They gather toward the edges of the chart and leave the islands clear, as if seen through a gap in the weather.
float cloudN(vec2 x){
  vec2 w=x*.42+vec2(uT*.0075,uT*.0021)+vec2(7.,3.);
  float eo=length(x/vec2(${n(RING.x)},${n(RING.z)}));
  return fbm5(w)+.035*(vn(w*9.)-.5)+.17*smoothstep(1.3,2.4,eo)-.3*(1.-smoothstep(1.12,1.42,eo));
}
float cloud(vec2 x){ float c=cloudN(x), e=max(fwidth(c),.002); return smoothstep(.665-e,.665+e,c)*uCloud; }
float cloudShade(vec3 p){ return 1.-.42*cloud(p.xz+uSun.xz/max(uSun.y,.22)*max(CH-p.y,0.)); }
vec3 sky(vec3 rd){
  vec3 c=mix(cSkyH,cSkyZ,pow(clamp(rd.y,0.,1.),.55));
  float sd=max(dot(rd,uSun),0.);
  c+=cSun*(pow(sd,900.)*3.+pow(sd,7.)*.34);
  vec2 sp=floor(rd.xz/(rd.y+.3)*120.); float st=fract(sin(dot(sp,vec2(12.9898,78.233)))*43758.5453);
  c+=uNight*step(.992,st)*smoothstep(.02,.3,rd.y)*(.5+.5*sin(uT*2.+st*90.));
  return c;
}
// Lettering for the chart: digits 0-9 and N, E, S, W from a small glyph atlas.
float glyph(float id, vec2 uv){ if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.) return 0.; return texture(uG,vec2((id+uv.x)/14.,uv.y)).a; }
float word(float v, bool letter, vec2 lp){
  float nd=letter?1.:(v<9.5?1.:2.), adv=.6, x=lp.x+nd*adv*.5, i=floor(x/adv);
  if(i<0.||i>=nd) return 0.;
  float id=letter?v:(nd>1.5?(i<.5?floor(v/10.):mod(v,10.)):v);
  return glyph(id,vec2((x-i*adv-adv*.5)/.75+.5,lp.y+.5));
}
float sounding(vec2 xz){
  vec2 S=vec2(.5,.44), cell=floor(xz/S);
  if(hs(cell+vec2(17.,3.))<.38) return 0.;
  vec2 c=(cell+.5+(vec2(hs(cell+vec2(3.,9.)),hs(cell+vec2(11.,5.)))-.5)*.5)*S;
  if(abs(length(c)-1.3)<.24) return 0.;
  float dep=-terr(c);
  if(dep<.045) return 0.;
  return word(min(99.,floor(dep*46.+.5)),false,uTxt*(xz-c)/.105);
}
// The compass ring around home, and the rhumb lines it sends out across the sea.
float chartInk(vec2 q, float px, out float soft){
  float rr=length(q), th=atan(q.x,q.y), deg=mod(th*57.29578+360.,360.), ink=0.;
  float a32=6.2831853/32., k=floor(th/a32+.5), dl=rr*abs(sin(th-k*a32)), km=mod(k+32.,32.);
  float w8=mod(km,4.)<.5?1.:(mod(km,2.)<.5?.62:.4);
  soft=(1.-smoothstep(px*.3,px*1.1,dl))*w8*smoothstep(${n(ROSE.rays)},${n(ROSE.rays + 0.12)},rr);
  ink=max(ink,(1.-smoothstep(px*.35,px*1.2,abs(rr-${n(ROSE.r1)})))*.9);
  ink=max(ink,(1.-smoothstep(px*.35,px*1.2,abs(rr-${n(ROSE.r2)})))*.6);
  float d5=abs(fract(deg/5.+.5)-.5)*5.;
  float tl=abs(fract(deg/30.+.5)-.5)*30.<2.5?.085:(abs(fract(deg/10.+.5)-.5)*10.<2.5?.055:.03);
  ink=max(ink,(1.-smoothstep(px*.3,px*1.05,d5/57.29578*rr))*step(${n(ROSE.r1)}-tl,rr)*step(rr,${n(ROSE.r1)})*.85);
  float m=floor(deg/30.+.5), a0=m*.5235988, mm=mod(m,12.);
  vec2 dR=vec2(sin(a0),cos(a0)), dT=vec2(cos(a0),-sin(a0));
  vec2 lp=vec2(dot(q,dT),dot(q,dR)-${n(ROSE.r2 + 0.085)})/.1;
  ink=max(ink,(mod(mm,3.)<.5?word(10.+mm/3.,true,lp):word(mm*3.,false,lp))*.95);
  // the north point
  vec2 nq=q-vec2(0.,${n(ROSE.r2 + 0.2)});
  ink=max(ink,(1.-smoothstep(-px,px,abs(nq.x)-.045*(1.-clamp(nq.y/.16,0.,1.))))*step(0.,nq.y)*step(nq.y,.16));
  return ink;
}
void main(){
  vec2 uv=(gl_FragCoord.xy*2.-uRes)/uRes.y;
  vec3 rd=normalize(uF+(uv.x*uR+uv.y*uU)*uFov), ro=uRo;
  float tw=rd.y<0.?-ro.y/rd.y:1e5, t=0., hit=-1.;
  bool live=true;
  if(ro.y>2.6){ if(rd.y>=0.) live=false; else t=(ro.y-2.6)/-rd.y; }
  float tmax=min(tw,60.);
  if(live){ for(int i=0;i<120;i++){ vec3 p=ro+rd*t; float d=p.y-terr(p.xz); if(d<.0012*t+.0006){ hit=t; break; } t+=d*.42+.002*t; if(t>tmax) break; } }
  vec3 col; float dist=1e5; vec2 wp=vec2(99.);
  vec3 INK=vec3(.97,.94,.86);
  float hiMask=0.;
  if(hit>0.){
    vec3 p=ro+rd*hit; dist=hit; wp=p.xz;
    float e=.006+.0012*hit;
    float h=terrD(p.xz);
    vec3 nn=normalize(vec3(terrD(p.xz-vec2(e,0.))-terrD(p.xz+vec2(e,0.)),2.*e,terrD(p.xz-vec2(0.,e))-terrD(p.xz+vec2(0.,e))));
    float j=h+(vn(p.xz*11.)-.5)*.07;
    vec3 tint=isleTint(p.xz);
    vec3 c=vec3(.95,.88,.68);
    c=mix(c,mix(vec3(.52,.66,.3),tint,.24),smoothstep(.035,.05,j));
    c=mix(c,mix(vec3(.34,.52,.27),tint,.36),smoothstep(.2,.215,j));
    c=mix(c,mix(vec3(.74,.62,.38),tint,.26),smoothstep(.42,.435,j));
    c=mix(c,vec3(.58,.53,.56),smoothstep(.78,.8,j));
    c=mix(c,vec3(.96,.95,.93),smoothstep(1.15,1.17,j));
    float forest=smoothstep(.06,.1,j)*(1.-smoothstep(.5,.62,j))*smoothstep(.55,.7,nn.y)*smoothstep(.42,.58,fbm3(p.xz*2.1+7.));
    if(forest>.01){ vec3 cr=crowns(p.xz); vec3 leaf=mix(vec3(.2,.42,.22),tint*.45+vec3(.1,.28,.12),.25); c=mix(c,c*.72,cr.z*forest*.8); c=mix(c,mix(leaf*1.25,leaf*.7,cr.y),cr.x*forest); }
    float sh=shadow(p+nn*.02)*cloudShade(p);
    float ndl=dot(nn,uSun);
    float dif=(smoothstep(-.02,.22,ndl)*.55+smoothstep(.22,.7,ndl)*.45)*sh;
    float sl=clamp(.5+.5*nn.y,0.,1.);
    c*=cAmb*(.62+.48*sl)+cSun*dif*1.05;
    hiMask=uHi.z*(1.-smoothstep(.75,1.35,length(p.xz-uHi.xy)));
    c=mix(c,c*1.1+cSun*.05,hiMask*.6);
    float fw=fwidth(h)*1.2+.0008;
    float l1=1.-smoothstep(0.,fw,abs(fract(h/.08+.5)-.5)*.08);
    float l5=1.-smoothstep(0.,fw*1.9,abs(fract(h/.4+.5)-.5)*.4);
    float lk=max(l1*.45,l5*.75)*smoothstep(.02,.06,h);
    c=mix(c,mix(c*.55,vec3(.99,.8,.32)*(cAmb+cSun*.6),hiMask),lk);
    c+=uNight*vec3(1.,.72,.35)*lights(p.xz)*1.6;
    float ba=atan(p.z,p.x); float bm=pow(max(cos(ba-uBeam),0.),90.)*exp(-length(p.xz)*.32);
    c+=uNight*vec3(1.,.85,.5)*bm*.8;
    col=c;
  } else if(tw<1e4 && live){
    vec3 p=ro+rd*tw; dist=tw; wp=p.xz;
    float d=-terrD(p.xz);
    float dj=d+(vn(p.xz*7.)-.5)*.012;
    // chart tints: the water steps from pale shallows to deep blue, a band at a time
    vec3 c=mix(cShal,cDeep,smoothstep(0.,.22,dj));
    float band=(floor(clamp(dj,0.,.32)/.045)+.5)*.045;
    c=mix(c,mix(cShal,cDeep,smoothstep(0.,.22,band)),.6);
    float fw=fwidth(d)*1.1+.0006;
    float px=length(fwidth(p.xz))+1e-5;
    // fathom lines, and close engraved waterlines hugging each shore
    float fl=1.-smoothstep(0.,fw*1.3,abs(fract(d/.045+.5)-.5)*.045);
    c=mix(c,c*.82,fl*.55*(1.-smoothstep(.2,.3,d)));
    float wl=1.-smoothstep(0.,fw,abs(fract(d/.01+.5)-.5)*.01);
    c=mix(c,mix(c,vec3(1.),.3),wl*(1.-smoothstep(.0,.032,d))*.55);
    float sh=shadow(vec3(p.x,.01,p.z))*cloudShade(vec3(p.x,0.,p.z));
    c*=.64+.36*sh;
    // the reef that joins us all, dashed like a chart's, and a scalloped foam rim on every shore
    vec2 cc=CEN[0]; float bd=1e9;
    for(int k=0;k<7;k++){ float dd=length(p.xz-CEN[k]); if(dd<bd){ bd=dd; cc=CEN[k]; } }
    float ang=atan(p.z-cc.y,p.x-cc.x);
    vec2 eq=p.xz/vec2(${n(RING.x)},${n(RING.z)}); float er=length(eq), ea=atan(eq.y,eq.x);
    float reef=(1.-smoothstep(px*.6,px*1.6,abs(er-1.)*${n(RING.z)}))*step(.42,fract(ea*34./6.2831853))*smoothstep(.02,.05,d);
    float wv=sin(d*95.-uT*1.9+vn(p.xz*5.)*6.283);
    float rim=.02+.008*sin(ang*bd*26.);
    float foam=smoothstep(.72,.98,wv)*(1.-smoothstep(.01,.05,d))*.45+(1.-smoothstep(rim*.25,rim,d))*.9+reef*.6;
    // the sailboats' wakes
    for(int b=0;b<3;b++){
      vec4 B=uBoat[b]; vec2 fb=vec2(sin(B.z),cos(B.z)), rb=vec2(fb.y,-fb.x), rel=p.xz-B.xy;
      float al=-dot(rel,fb), sd=dot(rel,rb);
      float wk=(1.-smoothstep(px*.6,px*1.8+.003,abs(abs(sd)-al*.3)))*smoothstep(.0,.03,al)*(1.-smoothstep(.06,.5,al));
      wk+=(1.-smoothstep(.012,.03,length(rel-fb*.02)))*.5;
      foam+=wk*.75*B.w;
    }
    c=mix(c,vec3(1.)*(cAmb+cSun*.75),clamp(foam,0.,1.));
    // the printed chart: graticule, rhumb lines, the compass ring, soundings
    vec2 gq=abs(fract(p.xz+.5)-.5); float gr=1.-smoothstep(px*.3,px*1.1,min(gq.x,gq.y));
    float soft; float ink=chartInk(p.xz,px,soft);
    float chart=1.-uTilt*.45;
    ink=max(ink*chart,max(soft*.36,gr*.2)*chart);
    ink=max(ink,sounding(p.xz)*.8*(1.-uTilt));
    c=mix(c,INK*(cAmb*.75+cSun*.42+.06),ink*(1.-uNight*.35));
    float gl=pow(vn(p.xz*37.+vec2(uT*.9,0.))*vn(p.xz*59.-vec2(0.,uT*.8)),4.)*14.;
    c+=cSun*gl*.18*sh*(1.-uNight*.9)*mix(.05,.3,uTilt);
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
  // clouds: lit tops, and thick enough in the middle to hide the plane passing under
  if(uCloud>0. && abs(rd.y)>1e-4){
    float tc=(CH-ro.y)/rd.y;
    if(tc>0. && tc<dist){
      vec3 cp=ro+rd*tc; float cd=cloud(cp.xz);
      if(cd>0.){
        float n0=cloudN(cp.xz), nS=cloudN(cp.xz+normalize(uSun.xz+1e-4)*.09);
        float lit=smoothstep(-.003,.003,n0-nS), core=smoothstep(.69,.75,n0);
        vec3 cc=mix(vec3(.74,.8,.92)*(cAmb*1.2+cSun*.35),vec3(1.)*(cAmb*.7+cSun*.95),max(lit,core*.6));
        cc=mix(cc,cc*.86,step(ro.y,CH));
        float a=cd*.95*smoothstep(.04,.4,abs(ro.y-CH))*exp(-tc*.02);
        col=mix(col,cc,a);
        if(a>.55){ dist=tc; wp=vec2(99.); }
      }
    }
  }
  if(dist<1e4){ vec2 pd=wp-uShadow.xy; col*=1.-uShadow.w*exp(-dot(pd,pd)/(uShadow.z*uShadow.z)); }
  if(dist<1e4){ float fog=1.-exp(-dist*.032*uTilt); col=mix(col,sky(normalize(vec3(rd.x,.03,rd.z))),fog*.85); }
  vec2 vq=gl_FragCoord.xy/uRes; float vg=1.-smoothstep(.35,1.25,length((vq-.5)*vec2(1.25,1.)));
  col*=.8+.2*vg;
  col*=.965+.07*vn(gl_FragCoord.xy*.9);
  o=vec4(pow(clamp(col,0.,1.),vec3(.95)),1.);
  float z=dist*dot(rd,uF);
  float A=(uFar+uNear)/(uFar-uNear), B=2.*uFar*uNear/(uFar-uNear);
  gl_FragDepth=dist<1e4?clamp(.5*(A-B/max(z,uNear))+.5,0.,1.):1.;
}`;

// ---------- meshes: the toy seaplane and the lighthouse ----------
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
  if(vC.a>.6&&vC.a<.8) c=mix(c,vec3(1.,.86,.5)*1.5,.25+.75*uNight);
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
in vec2 vA; out vec4 o; uniform vec3 cSun, cAmb; uniform float uFlat, uBeamMode, uNight;
void main(){
  if(uBeamMode>.5){ float a=pow(1.-vA.x,2.2)*(1.-vA.y*vA.y)*uNight*.2; o=vec4(vec3(1.,.82,.5)*a,0.); return; }
  float a=vA.x*(1.-vA.y*vA.y);
  if(uFlat>.5){ o=vec4(vec3(.82,.88,.95)*a*.55,a*.55); return; }
  vec3 c=vec3(1.)*(cAmb*.9+cSun*.75);
  o=vec4(c*a*.7,a*.7);
}`;

function builder() {
  const P = [], N = [], C = [], I = [], shapes = [];
  const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  const shape = (nu, nv, at, color, flag = 1) => {
    const start = P.length / 3;
    for (let i = 0; i <= nu; i += 1) for (let j = 0; j <= nv; j += 1) {
      const p = at(i / nu, j / nv);
      P.push(p[0], p[1], p[2]); N.push(0, 0, 0);
      const c = color(p); C.push(c[0], c[1], c[2], flag);
    }
    const i0 = I.length;
    for (let i = 0; i < nu; i += 1) for (let j = 0; j < nv; j += 1) {
      const a = start + i * (nv + 1) + j, b = a + nv + 1;
      I.push(a, b, a + 1, a + 1, b, b + 1);
    }
    shapes.push({ v0: start, v1: P.length / 3, i0, i1: I.length });
  };
  // superellipsoid: e1 shapes it top to bottom, e2 around
  const blob = (cx, cy, cz, rx, ry, rz, e1, e2, color, flag = 1) => shape(16, 28, (u, v) => {
    const la = -Math.PI / 2 + u * Math.PI, lo = -Math.PI + v * Math.PI * 2, cu = Math.cos(la);
    return [cx + rx * sp(cu, e1) * sp(Math.cos(lo), e2), cy + ry * sp(Math.sin(la), e1), cz + rz * sp(cu, e1) * sp(Math.sin(lo), e2)];
  }, color, flag);
  // a solid of revolution about y, from a list of [y, r] points
  const lathe = (prof, color, flag = 1, around = 28) => {
    const L = [0]; for (let k = 1; k < prof.length; k += 1) L.push(L[k - 1] + Math.hypot(prof[k][0] - prof[k - 1][0], prof[k][1] - prof[k - 1][1]));
    const total = L[L.length - 1];
    shape(prof.length * 3, around, (u, v) => {
      const d = u * total; let k = 1; while (k < prof.length - 1 && L[k] < d) k += 1;
      const f = (d - L[k - 1]) / ((L[k] - L[k - 1]) || 1), y = prof[k - 1][0] + (prof[k][0] - prof[k - 1][0]) * f, r = prof[k - 1][1] + (prof[k][1] - prof[k - 1][1]) * f;
      const a = v * Math.PI * 2;
      return [Math.cos(a) * r, y, Math.sin(a) * r];
    }, color, flag);
  };
  const finish = () => {
    for (let k = 0; k < I.length; k += 3) {
      const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; }
    }
    for (let k = 0; k < N.length; k += 3) { const l = Math.hypot(N[k], N[k + 1], N[k + 2]) || 1; N[k] /= l; N[k + 1] /= l; N[k + 2] /= l; }
    // every shape faces outward, with the same winding
    for (const sh of shapes) {
      let cx = 0, cy = 0, cz = 0, dot = 0; const cnt = sh.v1 - sh.v0;
      for (let v = sh.v0; v < sh.v1; v += 1) { cx += P[v * 3] / cnt; cy += P[v * 3 + 1] / cnt; cz += P[v * 3 + 2] / cnt; }
      for (let v = sh.v0; v < sh.v1; v += 1) dot += (P[v * 3] - cx) * N[v * 3] + (P[v * 3 + 1] - cy) * N[v * 3 + 1] + (P[v * 3 + 2] - cz) * N[v * 3 + 2];
      if (dot < 0) {
        for (let v = sh.v0 * 3; v < sh.v1 * 3; v += 1) N[v] = -N[v];
        for (let k = sh.i0; k < sh.i1; k += 3) { const tmp = I[k + 1]; I[k + 1] = I[k + 2]; I[k + 2] = tmp; }
      }
    }
    return { P: new Float32Array(P), N: new Float32Array(N), C: new Float32Array(C), I: new Uint16Array(I) };
  };
  return { shape, blob, lathe, finish };
}

const WHITE = [0.96, 0.94, 0.89], YEL = [0.95, 0.8, 0.22], NAVY = [0.11, 0.16, 0.29], GLASS = [0.2, 0.32, 0.5], RED = [0.8, 0.26, 0.2], STONE = [0.62, 0.6, 0.58];

function buildPlane() {
  const { shape, blob, finish } = builder();
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
  blob(0, 0.138, 0.1, 0.64, 0.026, 0.105, 0.5, 0.32, ([x]) => (Math.abs(x) > 0.53 ? YEL : WHITE));
  blob(0, 0.04, -0.45, 0.22, 0.016, 0.065, 0.5, 0.4, () => WHITE);
  blob(0, 0.13, -0.44, 0.017, 0.12, 0.075, 0.5, 0.45, ([, y]) => (y > 0.19 ? NAVY : YEL));
  for (const sx of [-1, 1]) {
    blob(sx * 0.2, -0.245, 0.03, 0.052, 0.046, 0.37, 0.75, 0.75, ([, y]) => (y > -0.215 ? NAVY : WHITE));
    blob(sx * 0.13, -0.15, 0.14, 0.012, 0.08, 0.016, 0.8, 0.8, () => NAVY);
    blob(sx * 0.13, -0.15, -0.1, 0.012, 0.08, 0.016, 0.8, 0.8, () => NAVY);
  }
  // propeller: two blades that turn (flagged with alpha 0)
  blob(0, 0.11, 0.5, 0.018, 0.11, 0.006, 0.6, 0.6, () => [0.2, 0.2, 0.24], 0);
  blob(0, -0.11, 0.5, 0.018, 0.11, 0.006, 0.6, 0.6, () => [0.2, 0.2, 0.24], 0);
  return finish();
}

// A squat, toy-like lighthouse in the same enamel as the plane: banded tower, gallery, a lantern that lights at
// night, and the keeper's cottage beside it. Units are world units; the base sits at y = 0.
// A little sailboat: hull, mast and a full sail. Bow toward +z.
function buildBoat(hull) {
  const { blob, finish } = builder();
  blob(0, 0.012, 0, 0.026, 0.014, 0.07, 0.4, 0.55, ([, y]) => (y > 0.017 ? WHITE : hull));
  blob(0, 0.07, -0.004, 0.0035, 0.06, 0.0035, 1, 1, () => NAVY);
  blob(0.002, 0.075, -0.018, 0.003, 0.052, 0.032, 0.7, 0.7, () => WHITE);
  blob(0.002, 0.058, 0.03, 0.002, 0.034, 0.016, 0.7, 0.7, () => [0.97, 0.84, 0.36]);
  return finish();
}

function buildLighthouse() {
  const { blob, lathe, finish } = builder();
  lathe([[0, 0], [0, 0.075], [0.035, 0.075], [0.035, 0.0]], () => STONE);
  lathe([[0.03, 0], [0.03, 0.058], [0.17, 0.05], [0.33, 0.041], [0.345, 0]], ([, y]) => ((y > 0.1 && y < 0.15) || (y > 0.235 && y < 0.285) ? RED : WHITE));
  lathe([[0.33, 0], [0.33, 0.066], [0.348, 0.066], [0.348, 0]], () => NAVY);
  lathe([[0.348, 0], [0.348, 0.033], [0.41, 0.033], [0.41, 0]], () => [1, 0.86, 0.45], 0.7);
  lathe([[0.405, 0], [0.405, 0.044], [0.43, 0.036], [0.452, 0.016], [0.468, 0.004], [0.475, 0]], () => RED);
  for (let k = 0; k < 6; k += 1) { const a = (k / 6) * Math.PI * 2; blob(Math.cos(a) * 0.033, 0.379, Math.sin(a) * 0.033, 0.004, 0.032, 0.004, 1, 1, () => NAVY); }
  blob(0.11, 0.034, 0.035, 0.05, 0.034, 0.036, 0.25, 0.22, () => WHITE);
  blob(0.11, 0.074, 0.035, 0.056, 0.016, 0.042, 0.55, 0.2, () => RED);
  blob(0.135, 0.03, 0.072, 0.009, 0.016, 0.002, 0.3, 0.3, () => NAVY);
  return finish();
}

// ---------- the same terrain, in JavaScript, for flying and for pointing at islands ----------
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
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const baseH = (x, z) => {
  let h = 0;
  for (const [bx, bz, a, r] of BUMPS) h += a * Math.exp(-((x - bx) ** 2 + (z - bz) ** 2) / (r * r));
  for (const [rx, rz, a, R, w] of RINGS) { const rk = Math.hypot(x - rx, z - rz); h += a * Math.exp(-(((rk - R) / w) ** 2)); }
  const e = Math.hypot(x / RING.x, z / RING.z);
  return h + REEF * Math.exp(-(((e - 1) / 0.075) ** 2)) + LAGOON * (1 - sstep(0.78, 1, e)) - DROP * sstep(1.25, 1.9, e);
};
const terrain = (x, z) => {
  const px = x * 1.6 + 3, pz = z * 1.6 + 3;
  const nz = (0.5 * vn(px, pz) + 0.25 * vn(px * 2.03 + 17.3, pz * 2.03 + 17.3) + 0.125 * vn(px * 4.01 + 31.7, pz * 4.01 + 31.7)) / 0.875;
  return baseH(x, z) * (0.62 + 0.75 * nz) + 0.16 * (nz - 0.5) - 0.2;
};
// Where each island's label sits, and where the lighthouse stands: on the high ground near each centre.
for (const q of ISLES) {
  let best = -1, bx = q.c[0], bz = q.c[1];
  for (let i = -6; i <= 6; i += 1) for (let j = -6; j <= 6; j += 1) {
    const x = q.c[0] + i * 0.07, z = q.c[1] + j * 0.07, h = terrain(x, z);
    if (Math.hypot(i, j) <= 6 && h > best) { best = h; bx = x; bz = z; }
  }
  q.top = [bx, best, bz];
  const out = Math.hypot(q.c[0] / RING.x, q.c[1] / RING.z) || 1, ox = q.c[0] / RING.x / out, oz = q.c[1] / RING.z / out;
  q.p = [q.c[0] + ox * 0.92, 0.06, q.c[1] + oz * 0.9];
}
const EXTENT = { x: 4.45, z: 3.55 };
const CHART_PITCH = 0.98;

// A loop through the chain for the autopilot: a closed Catmull-Rom spline between the islands,
// sampled by arc length, with its height lifted wherever the ground rises.
const ROUTE = (() => {
  const ring = ISLES.slice(1).map((q) => ({ a: Math.atan2(q.c[1], q.c[0]), x: q.c[0] * 0.62, z: q.c[1] * 0.62 })).sort((a, b) => a.a - b.a);
  const pts = [];
  ring.forEach((q, i) => {
    const nx = ring[(i + 1) % ring.length];
    pts.push([q.x, q.z]);
    pts.push([(q.x + nx.x) / 2 * 1.42, (q.z + nx.z) / 2 * 1.42]);
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

// ---------- light: the visitor's own clock, or the light they choose ----------
const LIGHT_KEY = "isl-light";
const prefersDark = matchMedia("(prefers-color-scheme: dark)");
const readLight = () => {
  const pick = new URLSearchParams(location.search).get("time");
  if (pick) return pick;
  try { const v = localStorage.getItem(LIGHT_KEY); if (v === "day" || v === "night" || v === "now") return v; } catch (error) { /* private mode */ }
  return prefersDark.matches ? "night" : "now";
};
function hourFor(mode) {
  const fixed = { dawn: 6.7, day: 14.6, dusk: 17.35, night: 23 }[mode];
  if (fixed) return fixed;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

const root = document.querySelector("[data-archipelago]");
const canvas = root && root.querySelector("canvas");
const gl = canvas && context(canvas, { depth: true });
if (root && !gl) root.classList.add("no-gl");
else if (root) run();

function glyphAtlas() {
  const cv = document.createElement("canvas"), w = 48, h = 64;
  cv.width = w * 14; cv.height = h;
  const x = cv.getContext("2d");
  x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "alphabetic";
  "0123456789NESW".split("").forEach((ch, i) => {
    x.font = i < 10 ? 'italic 46px "Libre Caslon Text", Georgia, serif' : '700 40px "Libre Caslon Text", Georgia, serif';
    x.fillText(ch, i * w + w / 2, h * 0.8);
  });
  return cv;
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
      return { pr, use: () => gl.useProgram(pr), u: (k) => (k in cache ? cache[k] : (cache[k] = gl.getUniformLocation(pr, k))) };
    };
    return { mesh: make(MESH_V, MESH_F), trail: make(TRAIL_V, TRAIL_F) };
  })();

  gl.bindVertexArray(null);
  P.use();
  fullscreen(gl);
  noiseTexture(gl, 1234567, 0);
  gl.uniform1i(P.u("uN"), 0);
  // the chart's lettering
  const glyphTex = gl.createTexture();
  const uploadGlyphs = () => {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, glyphTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glyphAtlas());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE0);
  };
  uploadGlyphs();
  if (document.fonts) document.fonts.load('italic 46px "Libre Caslon Text"').then(() => { uploadGlyphs(); engine.start(); }).catch(() => {});
  gl.uniform1i(P.u("uG"), 1);
  root.classList.add("has-gl");

  const meshVAO = (geo) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = (data, loc, size) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); };
    buf(geo.P, 0, 3); buf(geo.N, 1, 3); buf(geo.C, 2, 4);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.I, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, count: geo.I.length };
  };
  const plane = meshVAO(buildPlane());
  const house = meshVAO(buildLighthouse());
  const boats = [
    { m: meshVAO(buildBoat(RED)), a: 0.4, w: 0.045, rx: 1.8, rz: 1.3 },
    { m: meshVAO(buildBoat(NAVY)), a: 2.6, w: -0.038, rx: 1.86, rz: 1.34 },
    { m: meshVAO(buildBoat([0.2, 0.55, 0.9])), a: 4.3, w: 0.032, rx: 1.74, rz: 1.27 }
  ];
  const lamp = (() => { const t = ISLES[0].top; return [t[0], t[1] - 0.012, t[2]]; })();
  const stripVAO = gl.createVertexArray();
  gl.bindVertexArray(stripVAO);
  const stripBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, stripBuf);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 20, 12);
  gl.bindVertexArray(null);

  const labels = [...root.querySelectorAll(".isles [data-isle]")].map((el) => ({ el, isle: ISLES.find((q) => q.key === el.dataset.isle) })).filter((q) => q.isle);
  const legend = document.querySelector("[data-legend]");
  const keyLinks = legend ? [...legend.querySelectorAll("[data-key]")] : [];
  const hud = root.querySelector("[data-hud]");
  const hdg = root.querySelector("[data-hdg]");
  const altEl = root.querySelector("[data-alt]");
  const next = root.querySelector("[data-next]");
  const note = root.querySelector("[data-note]");
  const flyButton = root.querySelector("[data-fly]");
  const flyLabel = flyButton && flyButton.querySelector("span");
  const flash = root.querySelector("[data-flash]");
  const still0 = reducedMotion.matches;

  // plane state: position, heading (yaw, 0 = north), climb angle, bank
  const start = ROUTE.at(0);
  const s = {
    tilt: 0, tv: 0, mode: readLight(), hour: 0, sweep: null, d: 0, x: start[0], y: start[1], z: start[2], yaw: 0, pitch: 0, roll: 0, speed: 0.42,
    beam: 0, fly: false, n: 0, cam: null, crashed: false, rejoin: 0, grace: 0, intro: still0 ? 1 : 0, hi: -1, hiK: 0, look: [0, 0]
  };
  s.hour = hourFor(s.mode);
  { const a = ROUTE.at(0.05); s.yaw = Math.atan2(a[0] - s.x, a[2] - s.z); }
  const trail = [];
  const keys = new Set();
  const ptr = { x: 0, y: 0, t: -1e9, px: 0, py: 0 };
  let view = layout();

  function layout() {
    const W = root.clientWidth, H = root.clientHeight, portrait = W / H < 0.95;
    const lb = legend ? legend.getBoundingClientRect() : { right: 0, top: H }, rb = root.getBoundingClientRect();
    let free;
    if (portrait) free = { x0: 0, x1: W, y0: 70, y1: Math.max(H * 0.42, lb.top - rb.top + 24) };
    else free = { x0: Math.min(W * 0.42, Math.max(0, lb.right - rb.left + 12)), x1: W - 8, y0: 64, y1: H - 22 };
    const hw = (free.x1 - free.x0) / H, hh = (free.y1 - free.y0) / H;
    const sp = Math.sin(CHART_PITCH), cp = Math.cos(CHART_PITCH);
    const ex = portrait ? EXTENT.z : EXTENT.x, ez = portrait ? EXTENT.x : EXTENT.z;
    const y0 = -ez * sp - 0.1 * cp, y1 = ez * sp + 1.35 * cp;
    const span = Math.max(ex / hw, (y1 - y0) / 2 / hh) * 0.98;
    const sx = ((free.x0 + free.x1) / 2 - W / 2) / (H / 2), sy = (H / 2 - (free.y0 + free.y1) / 2) / (H / 2);
    return { W, H, portrait, span, sx, sy, cy: (y0 + y1) / 2, chartYaw: portrait ? Math.PI / 2 : 0 };
  }
  new ResizeObserver(() => { view = layout(); engine.start(); }).observe(root);

  // ----- the light switch in the legend -----
  const lightButtons = [...document.querySelectorAll("[data-light]")];
  const showLight = () => lightButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.light === s.mode)));
  lightButtons.forEach((b) => b.addEventListener("click", () => {
    const mode = b.dataset.light;
    if (mode === s.mode) return;
    s.mode = mode;
    try { if (mode === "now" && !prefersDark.matches) localStorage.removeItem(LIGHT_KEY); else localStorage.setItem(LIGHT_KEY, mode); } catch (error) { /* private mode */ }
    // the sun always moves forward to the new hour, so night falls through dusk and day breaks through dawn
    let span = (hourFor(mode) - s.hour + 24) % 24;
    if (span > 20) span -= 24;
    s.sweep = { from: s.hour, span, t: 0 };
    showLight();
    engine.start();
  }));
  showLight();
  prefersDark.addEventListener("change", () => { const m = readLight(); if (m !== s.mode) { s.mode = m; s.sweep = null; showLight(); engine.start(); } });

  // ----- hovering and choosing islands, on the chart or in the legend -----
  const setHi = (key) => {
    const i = key ? ISLES.findIndex((q) => q.key === key) : -1;
    if (i === s.hi) return;
    s.hi = i;
    for (const { el, isle } of labels) el.classList.toggle("is-hi", isle.key === key);
    for (const a of keyLinks) a.classList.toggle("is-hi", a.dataset.key === key);
    root.style.cursor = i > 0 && !s.fly ? "pointer" : "";
    engine.start();
  };
  for (const { el, isle } of labels) { el.addEventListener("pointerenter", () => setHi(isle.key)); el.addEventListener("pointerleave", () => setHi(null)); el.addEventListener("focus", () => setHi(isle.key)); el.addEventListener("blur", () => setHi(null)); }
  for (const a of keyLinks) { a.addEventListener("pointerenter", () => setHi(a.dataset.key)); a.addEventListener("pointerleave", () => setHi(null)); a.addEventListener("focus", () => setHi(a.dataset.key)); a.addEventListener("blur", () => setHi(null)); }
  let camNow = null;
  const pick = (cx, cy) => {
    if (!camNow || s.fly) return null;
    const { ro, f, r, u, fov, W, H } = camNow;
    const sx = (cx - W / 2) / (H / 2) * fov, sy = (H / 2 - cy) / (H / 2) * fov;
    const d = [f[0] + r[0] * sx + u[0] * sy, f[1] + r[1] * sx + u[1] * sy, f[2] + r[2] * sx + u[2] * sy];
    const dl = Math.hypot(...d); d[0] /= dl; d[1] /= dl; d[2] /= dl;
    if (d[1] >= 0) return null;
    let t = (ro[1] - 2.6) / -d[1];
    for (let i = 0; i < 90; i += 1) {
      const x = ro[0] + d[0] * t, y = ro[1] + d[1] * t, z = ro[2] + d[2] * t, h = Math.max(0, terrain(x, z));
      if (y - h < 0.004) { let best = null, bd = 1.15; for (const q of ISLES) { const dd = Math.hypot(q.c[0] - x, q.c[1] - z); if (dd < bd) { bd = dd; best = q; } } return best; }
      t += Math.max(0.01, (y - h) * 0.45);
    }
    return null;
  };
  root.addEventListener("pointermove", (e) => {
    const rect = root.getBoundingClientRect();
    ptr.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; ptr.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2; ptr.t = performance.now();
    if (!s.fly && e.target === canvas) { const q = pick(e.clientX - rect.left, e.clientY - rect.top); setHi(q && q.key !== "home" ? q.key : null); }
    engine.start();
  });
  root.addEventListener("pointerleave", () => { ptr.t = -1e9; if (!s.fly) setHi(null); });
  canvas.addEventListener("click", (e) => {
    if (s.fly) return;
    const rect = root.getBoundingClientRect();
    const q = pick(e.clientX - rect.left, e.clientY - rect.top);
    if (q && q.key !== "home") location.href = q.href;
  });

  const setFly = (on) => {
    if (on === s.fly) return;
    s.fly = on;
    s.crashed = false;
    root.classList.toggle("is-flying", on);
    if (flyLabel) flyLabel.textContent = on ? "Back to the chart" : "Take the plane";
    if (flyButton) flyButton.setAttribute("aria-pressed", String(on));
    if (reducedMotion.matches) s.tilt = on ? 1 : 0;
    if (on) {
      setHi(null);
      s.speed = 0.4;
      // a moment of climbing before the controls bite, so taking over never ends in someone's hillside
      s.grace = 2.4; s.safeY = Math.max(1.45, terrain(s.x, s.z) + 0.8);
      if (note) note.textContent = note.dataset.help;
    } else { s.d = ROUTE.nearest(s.x, s.z); s.rejoin = 1; }
    engine.start();
  };
  if (flyButton) { flyButton.hidden = false; flyButton.addEventListener("click", () => setFly(!s.fly)); }
  const KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1 };
  addEventListener("keydown", (e) => {
    if (!s.fly) return;
    if (e.code === "Escape") { setFly(false); return; }
    if (KEYS[e.code]) { keys.add(e.code); e.preventDefault(); }
  });
  addEventListener("keyup", (e) => keys.delete(e.code));
  addEventListener("blur", () => keys.clear());

  const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const nearestIsle = (x, z) => { let best = ISLES[0], bd = Infinity; for (const q of ISLES) { const d = Math.hypot(q.c[0] - x, q.c[1] - z); if (d < bd) { bd = d; best = q; } } return [best, bd]; };

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
  addEventListener("pageshow", (e) => { if (e.persisted) { if (flash) flash.classList.remove("is-on"); s.crashed = false; setFly(false); } });

  const engine = loop(canvas, (t, dt) => {
    s.n += 1;
    const still = reducedMotion.matches && !s.fly;
    const settling = s.sweep || s.intro < 1 || Math.abs(s.hiK - (s.hi > 0 ? 1 : 0)) > 0.01;
    const stepDt = still && !settling ? 0 : dt;
    s.tv += (((s.fly ? 1 : 0) - s.tilt) * 22 - s.tv * 9) * dt;
    s.tilt += s.tv * dt;
    const tilt = clamp(s.tilt), ez = tilt * tilt * (3 - 2 * tilt);
    s.intro = Math.min(1, s.intro + dt / 2.6);
    const intro = 1 - Math.pow(1 - s.intro, 3);
    s.hiK += ((s.hi > 0 ? 1 : 0) - s.hiK) * Math.min(1, dt * 7);
    if (s.hi > 0) s.hiIsle = ISLES[s.hi];

    // the hour: a sweep after a switch, otherwise the chosen light (following the clock, for "now")
    if (s.sweep) {
      s.sweep.t = Math.min(1, s.sweep.t + dt / (still ? 0.01 : 2.4));
      const k = s.sweep.t * s.sweep.t * (3 - 2 * s.sweep.t);
      s.hour = (s.sweep.from + s.sweep.span * k + 24) % 24;
      if (s.sweep.t >= 1) s.sweep = null;
    } else {
      let dh = hourFor(s.mode) - s.hour;
      if (dh > 12) dh -= 24;
      if (dh < -12) dh += 24;
      s.hour = (s.hour + dh * (1 - Math.exp(-dt * 1.6)) + 24) % 24;
    }

    // ----- flight -----
    if (!s.fly) {
      s.d += s.speed * stepDt;
      const p = ROUTE.at(s.d), ahead = ROUTE.at(s.d + 0.12);
      const k = s.rejoin > 0 ? 1 - Math.exp(-dt * 1.2) : 1;
      s.rejoin = Math.max(0, s.rejoin - dt * 0.5);
      const ox = s.x, oz = s.z, oy = s.y;
      s.x += (p[0] - s.x) * k; s.y += (p[1] - s.y) * k; s.z += (p[2] - s.z) * k;
      const wantYaw = Math.atan2(ahead[0] - s.x, ahead[2] - s.z);
      const turn = stepDt > 0 ? wrap(wantYaw - s.yaw) : 0;
      s.yaw = wrap(s.yaw + turn * Math.min(1, stepDt * 4));
      s.roll += (clamp(turn * 4 * 0.55, -0.6, 0.6) - s.roll) * Math.min(1, stepDt * 3);
      const climb = stepDt > 0 ? Math.atan2(s.y - oy, Math.hypot(s.x - ox, s.z - oz) + 1e-6) : 0;
      s.pitch += (clamp(climb, -0.3, 0.3) - s.pitch) * Math.min(1, stepDt * 3);
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
      if (s.grace > 0) {
        s.grace -= dt;
        climb = mix(climb, clamp((s.safeY - s.y) * 2.2, -0.4, 1), clamp(s.grace / 1.2));
      }
      // past the edge of the chart, the plane is drawn back toward the islands
      const r = Math.hypot(s.x / 1.15, s.z), pull = clamp((r - 5.4) / 1.6);
      if (pull > 0) {
        const home = wrap(Math.atan2(-s.x, -s.z) - s.yaw);
        turn = mix(turn, clamp(home * 1.6, -1, 1), pull);
        if (note) note.textContent = "Turning back toward the islands";
      } else if (note && note.textContent !== note.dataset.help && !s.crashed) note.textContent = note.dataset.help;
      s.yaw = wrap(s.yaw + turn * 1.3 * dt);
      s.roll += (turn * 0.62 - s.roll) * Math.min(1, dt * 3.2);
      s.pitch += (climb * 0.42 - s.pitch) * Math.min(1, dt * 2.6);
      s.x += Math.sin(s.yaw) * Math.cos(s.pitch) * s.speed * dt;
      s.z += Math.cos(s.yaw) * Math.cos(s.pitch) * s.speed * dt;
      s.y += Math.sin(s.pitch) * s.speed * dt;
      if (s.y > 4.2) { s.y = 4.2; s.pitch = Math.min(s.pitch, 0); }
      const ground = terrain(s.x, s.z);
      if (ground < 0.02 && s.y < 0.07) { s.y = 0.07; s.pitch = Math.max(s.pitch, 0.06); }
      if (ground > 0.02 && s.y < ground + 0.015) {
        if (s.grace > 0) { s.y = ground + 0.015; s.pitch = Math.max(s.pitch, 0.3); }
        else crash(nearestIsle(s.x, s.z)[0]);
      }
    }
    s.beam += stepDt * 0.7;

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
    document.documentElement.classList.toggle("is-night", night > 0.5);

    // ----- camera: the chart at a low isometric angle (leaning a little toward the pointer), or chasing the plane -----
    const lookOn = !s.fly && !still && performance.now() - ptr.t < 6000 ? 1 : 0;
    s.look[0] += (ptr.x * lookOn - s.look[0]) * Math.min(1, dt * 1.8);
    s.look[1] += (ptr.y * lookOn - s.look[1]) * Math.min(1, dt * 1.8);
    const chartDist = 30, chartFov = view.span * mix(1.12, 1, intro) / chartDist;
    if (!s.cam) s.cam = { yaw: s.yaw, x: s.x, y: s.y, z: s.z };
    const ck = 1 - Math.exp(-dt * 3.2);
    s.cam.yaw = wrap(s.cam.yaw + wrap(s.yaw - s.cam.yaw) * ck);
    s.cam.x += (s.x - s.cam.x) * Math.min(1, dt * 8); s.cam.y += (s.y - s.cam.y) * Math.min(1, dt * 4); s.cam.z += (s.z - s.cam.z) * Math.min(1, dt * 8);
    const chartPitch = mix(1.36, CHART_PITCH, intro) - s.look[1] * 0.035;
    const pitch = mix(chartPitch, 0.24, ez), dist = mix(chartDist, 1.55, ez), fov = mix(chartFov, 0.66, ez);
    const chartYaw = view.chartYaw + s.look[0] * 0.07;
    const yaw = chartYaw + wrap(s.cam.yaw - chartYaw) * ez;
    const f = [Math.cos(pitch) * Math.sin(yaw), -Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)];
    const r = [Math.cos(yaw), 0, -Math.sin(yaw)];
    const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
    const span = view.span;
    const chartT = [-(r[0] * view.sx + u[0] * view.sy) * span + u[0] * view.cy, -(r[1] * view.sx + u[1] * view.sy) * span + u[1] * view.cy, -(r[2] * view.sx + u[2] * view.sy) * span + u[2] * view.cy];
    const chaseT = [s.cam.x + Math.sin(s.cam.yaw) * 0.35, s.cam.y + 0.14, s.cam.z + Math.cos(s.cam.yaw) * 0.35];
    const tgt = [mix(chartT[0], chaseT[0], ez), mix(chartT[1], chaseT[1], ez), mix(chartT[2], chaseT[2], ez)];
    const ro = [tgt[0] - f[0] * dist, tgt[1] - f[1] * dist, tgt[2] - f[2] * dist];
    const W = view.W, H = view.H, asp = canvas.width / canvas.height;
    camNow = { ro, f, r, u, fov, W, H };
    const proj = (p) => {
      const v = [p[0] - ro[0], p[1] - ro[1], p[2] - ro[2]], z = v[0] * f[0] + v[1] * f[1] + v[2] * f[2];
      if (z < 0.05) return null;
      return [W / 2 + (v[0] * r[0] + v[1] * r[1] + v[2] * r[2]) / (z * fov) * H / 2, H / 2 - (v[0] * u[0] + v[1] * u[1] + v[2] * u[2]) / (z * fov) * H / 2, z];
    };

    // ----- the plane's frame and shadow -----
    const scale = mix(0.4 * view.span / 4.4, 0.16, ez);
    const cr = Math.cos(s.roll), sr = Math.sin(s.roll), cpi = Math.cos(s.pitch), spi = Math.sin(s.pitch);
    const Z = [Math.sin(s.yaw) * cpi, spi, Math.cos(s.yaw) * cpi];
    const X0 = [Math.cos(s.yaw), 0, -Math.sin(s.yaw)];
    const Y0 = [Z[1] * X0[2] - Z[2] * X0[1], Z[2] * X0[0] - Z[0] * X0[2], Z[0] * X0[1] - Z[1] * X0[0]];
    const Yp = Y0.map((v, i) => v * cr + X0[i] * sr), Xp = X0.map((v, i) => v * cr - Y0[i] * sr);
    const gnd = Math.max(0, terrain(s.x, s.z));
    const tsh = (s.y - gnd) / Math.max(sun[1], 0.25);
    const shadowStrength = (1 - night) * 0.32 * clamp(1.4 - (s.y - gnd) / 3);

    // ----- draw: terrain, sea and clouds, writing depth -----
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
    gl.uniform1f(P.u("uCloud"), 1 - night * 0.7);
    gl.uniform1f(P.u("uNear"), NEAR); gl.uniform1f(P.u("uFar"), FAR);
    gl.uniform3fv(P.u("uRo"), ro); gl.uniform3fv(P.u("uF"), f); gl.uniform3fv(P.u("uR"), r); gl.uniform3fv(P.u("uU"), u);
    gl.uniform3fv(P.u("uSun"), sun);
    const hq = s.hiIsle || ISLES[0];
    gl.uniform3f(P.u("uHi"), hq.c[0], hq.c[1], s.hiK * (1 - ez));
    const ty = view.chartYaw;
    gl.uniformMatrix2fv(P.u("uTxt"), false, [Math.cos(ty), Math.sin(ty), -Math.sin(ty), Math.cos(ty)]);
    gl.uniform4f(P.u("uShadow"), s.x - sun[0] * tsh, s.z - sun[2] * tsh, scale * 0.42, shadowStrength);
    const boatK = mix(1.7, 1, ez), boatData = [];
    for (const b of boats) {
      b.a += b.w * stepDt;
      b.x = Math.cos(b.a) * b.rx; b.z = Math.sin(b.a) * b.rz;
      b.h = Math.atan2(-Math.sin(b.a) * b.rx * Math.sign(b.w), Math.cos(b.a) * b.rz * Math.sign(b.w));
      boatData.push(b.x, b.z, b.h, 1);
    }
    gl.uniform4fv(P.u("uBoat[0]"), boatData);
    for (const key in C) gl.uniform3fv(P.u(key), C[key]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // ----- meshes: the lighthouse, then the plane -----
    const mp = meshProg.mesh;
    if (mp) {
      gl.depthFunc(gl.LEQUAL);
      mp.use();
      gl.uniform3fv(mp.u("uRo"), ro); gl.uniform3fv(mp.u("uF"), f); gl.uniform3fv(mp.u("uR"), r); gl.uniform3fv(mp.u("uU"), u);
      gl.uniform1f(mp.u("uFov"), fov); gl.uniform1f(mp.u("uAsp"), asp); gl.uniform1f(mp.u("uNear"), NEAR); gl.uniform1f(mp.u("uFar"), FAR);
      gl.uniform3fv(mp.u("uSun"), sun); gl.uniform3fv(mp.u("cSun"), C.cSun); gl.uniform3fv(mp.u("cAmb"), C.cAmb); gl.uniform3fv(mp.u("cSkyH"), C.cSkyH);
      gl.uniform1f(mp.u("uNight"), night);
      const draw = (m, X, Y, Zv, pos, sc, out, prop) => {
        gl.bindVertexArray(m.vao);
        gl.uniform3fv(mp.u("uX"), X); gl.uniform3fv(mp.u("uY"), Y); gl.uniform3fv(mp.u("uZ"), Zv);
        gl.uniform3fv(mp.u("uPos"), pos); gl.uniform1f(mp.u("uScale"), sc); gl.uniform1f(mp.u("uProp"), prop);
        // navy outline: the back faces, pushed out a little
        gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
        gl.uniform1f(mp.u("uOutline"), 1); gl.uniform1f(mp.u("uOut"), out);
        gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
        gl.cullFace(gl.FRONT);
        gl.uniform1f(mp.u("uOutline"), 0); gl.uniform1f(mp.u("uOut"), 0);
        gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.CULL_FACE);
      };
      const lhScale = mix(1.75, 1, ez);
      draw(house, [1, 0, 0], [0, 1, 0], [0, 0, 1], lamp, lhScale, mix(0.0065, 0.004, ez), 0);
      for (const b of boats) {
        const roll = Math.sin(t * 1.3 + b.a * 5) * 0.06, ch = Math.cos(b.h), sh = Math.sin(b.h);
        const bx = [ch * Math.cos(roll), Math.sin(roll), -sh * Math.cos(roll)], by = [-ch * Math.sin(roll), Math.cos(roll), sh * Math.sin(roll)];
        draw(b.m, bx, by, [sh, 0, ch], [b.x, 0, b.z], boatK, 0.004, 0);
      }
      draw(plane, Xp, Yp, Z, [s.x, s.y, s.z], scale, 0.012, still ? 0.6 : t * 31);

      // the lantern's two beams at night: soft wedges that sweep with the light on the water
      const tp = meshProg.trail;
      if (tp && night > 0.02) {
        const top = [lamp[0], lamp[1] + 0.38 * lhScale, lamp[2]], L = 2.3, Wd = 0.3, data = [];
        for (const off of [0, Math.PI]) {
          const a = s.beam + off, dx = Math.cos(a), dz = Math.sin(a);
          // a horizontal wedge and a vertical one, crossed, so the beam reads from any angle
          for (const sxv of ez > 0.3 ? [[-dz, 0, dx], [0, 1, 0]] : [[-dz, 0, dx]]) {
            const tip = [top[0] + dx * L, top[1] - 0.25, top[2] + dz * L];
            const p0 = top, p1 = [tip[0] + sxv[0] * Wd, tip[1] + sxv[1] * Wd * 0.45, tip[2] + sxv[2] * Wd], p2 = [tip[0] - sxv[0] * Wd, tip[1] - sxv[1] * Wd * 0.45, tip[2] - sxv[2] * Wd];
            data.push(...p0, 0, 0, ...p1, 1, -1, ...p2, 1, 1);
          }
        }
        gl.bindVertexArray(stripVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, stripBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
        tp.use();
        gl.uniform3fv(tp.u("uRo"), ro); gl.uniform3fv(tp.u("uF"), f); gl.uniform3fv(tp.u("uR"), r); gl.uniform3fv(tp.u("uU"), u);
        gl.uniform1f(tp.u("uFov"), fov); gl.uniform1f(tp.u("uAsp"), asp); gl.uniform1f(tp.u("uNear"), NEAR); gl.uniform1f(tp.u("uFar"), FAR);
        gl.uniform1f(tp.u("uBeamMode"), 1); gl.uniform1f(tp.u("uNight"), night);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
        gl.drawArrays(gl.TRIANGLES, 0, data.length / 5);
        gl.depthMask(true); gl.disable(gl.BLEND);
      }
    }

    // ----- wingtip trails, in the air where the plane was -----
    if (stepDt > 0 || s.fly) {
      if (!trail.length || t - trail[trail.length - 1].t > 0.035) {
        const tip = (sx) => [s.x + (Xp[0] * 0.6 * sx - Z[0] * 0.05) * scale, s.y + (Xp[1] * 0.6 * sx + Yp[1] * 0.14 - Z[1] * 0.05) * scale, s.z + (Xp[2] * 0.6 * sx - Z[2] * 0.05) * scale];
        trail.push({ t, l: tip(-1), r: tip(1), w: scale });
      }
      while (trail.length && t - trail[0].t > 2.6) trail.shift();
    }
    const tp = meshProg.trail;
    if (tp && trail.length > 2) {
      const data = [];
      for (const side of ["l", "r"]) {
        for (let i = 0; i < trail.length; i += 1) {
          const a = trail[Math.max(0, i - 1)][side], b = trail[Math.min(trail.length - 1, i + 1)][side], p = trail[i][side];
          const tg = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
          let nx = tg[1] * f[2] - tg[2] * f[1], ny = tg[2] * f[0] - tg[0] * f[2], nz = tg[0] * f[1] - tg[1] * f[0];
          const nl = Math.hypot(nx, ny, nz) || 1;
          const age = (t - trail[i].t) / 2.6, w = trail[i].w * (0.025 + age * 0.07);
          nx = nx / nl * w; ny = ny / nl * w; nz = nz / nl * w;
          const al = (1 - age) * Math.min(1, i / 3) * (i === trail.length - 1 ? 0 : 1);
          if (i === 0 && data.length) data.push(...data.slice(-5), p[0] + nx, p[1] + ny, p[2] + nz, al, -1);
          data.push(p[0] + nx, p[1] + ny, p[2] + nz, al, -1, p[0] - nx, p[1] - ny, p[2] - nz, al, 1);
        }
      }
      const arr = new Float32Array(data);
      gl.bindVertexArray(stripVAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, stripBuf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      tp.use();
      gl.uniform3fv(tp.u("uRo"), ro); gl.uniform3fv(tp.u("uF"), f); gl.uniform3fv(tp.u("uR"), r); gl.uniform3fv(tp.u("uU"), u);
      gl.uniform1f(tp.u("uFov"), fov); gl.uniform1f(tp.u("uAsp"), asp); gl.uniform1f(tp.u("uNear"), NEAR); gl.uniform1f(tp.u("uFar"), FAR);
      gl.uniform3fv(tp.u("cSun"), C.cSun); gl.uniform3fv(tp.u("cAmb"), C.cAmb);
      gl.uniform1f(tp.u("uFlat"), night > 0.5 ? 1 : 0); gl.uniform1f(tp.u("uBeamMode"), 0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, arr.length / 5);
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(null);

    // ----- labels and instruments -----
    for (const { el, isle } of labels) {
      const q = proj(isle.p);
      if (!q || q[0] < -80 || q[0] > W + 80 || q[1] < -40 || q[1] > H + 40) { el.style.opacity = "0"; el.style.pointerEvents = "none"; continue; }
      const fade = clamp(1.6 - q[2] / mix(60, 9, ez)) * clamp(intro * 1.6 - 0.4);
      el.style.opacity = fade.toFixed(2);
      el.style.pointerEvents = fade > 0.3 ? "" : "none";
      const hw = (el._w || (el._w = el.offsetWidth)) / 2, lx = ez < 0.5 ? clamp(q[0], hw + 6, W - hw - 6) : q[0];
      el.style.transform = `translate(${lx.toFixed(1)}px,${(q[1] - mix(12, 14, ez)).toFixed(1)}px) translate(-50%,-100%)`;
    }
    if (legend) {
      legend.style.opacity = (1 - Math.min(1, ez * 2.2)).toFixed(2);
      legend.style.transform = `translateY(${(ez * 30).toFixed(1)}px)`;
      legend.style.visibility = ez > 0.6 ? "hidden" : "";
    }
    if (hud) hud.style.opacity = Math.max(0, ez * 2.2 - 1.2).toFixed(2);
    if (note) note.style.opacity = Math.max(0, ez * 2.2 - 1.2).toFixed(2);
    if (s.n % 6 === 0 && s.fly) {
      if (hdg) hdg.textContent = String(((Math.round(s.yaw * 57.2958) % 360) + 360) % 360).padStart(3, "0") + "°";
      if (altEl) altEl.textContent = Math.max(0, Math.round(s.y * 1000 / 50) * 50).toLocaleString("en-US");
      if (next) next.textContent = nearestIsle(s.x, s.z)[0].name.toUpperCase();
    }
    if (still && !settling && Math.abs(s.tilt) < 0.001 && s.n > 2) engine.stop();
  });
  engine.start();
  reducedMotion.addEventListener("change", () => engine.start());
}

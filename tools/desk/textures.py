import numpy as np
from PIL import Image, ImageFilter
import sys
out=sys.argv[1]
rng=np.random.default_rng(7)
def fbm(W,H,sx,sy,alpha,seed):
    r=np.random.default_rng(seed).standard_normal((H,W))
    F=np.fft.fft2(r)
    ky=np.fft.fftfreq(H)[:,None]*H; kx=np.fft.fftfreq(W)[None,:]*W
    k=np.sqrt((kx*sx)**2+(ky*sy)**2); k[0,0]=1
    F=F/(k**alpha); F[0,0]=0
    n=np.real(np.fft.ifft2(F)); n=(n-n.mean())/n.std()
    return n
def save(a,name,q=90):
    a=np.clip(a,0,1); Image.fromarray((a*255).astype(np.uint8)).save(out+'/'+name, quality=q)
# ---- oak: honey-coloured, straight grain along x, with pores and a few rays ----
W,H=2048,1024
y=np.linspace(0,1,H,endpoint=False)[:,None]*np.ones((1,W))
warp=fbm(W,H,0.12,1.0,1.6,1)*0.55+fbm(W,H,0.05,1.0,1.2,2)*0.15
v=y*26+warp*2.2
t=v-np.floor(v)
late=np.exp(-((t-0.82)/0.07)**2)
fine=fbm(W,H,0.04,1.0,0.9,3)
pores=np.clip((fbm(W,H,0.03,0.8,0.5,4)-1.6)*0.9,0,1)
rays=np.clip((fbm(W,H,1.0,0.25,0.6,5)-2.0)*0.6,0,1)
base=np.array([0.83,0.64,0.42]); dark=np.array([0.64,0.45,0.27]); light=np.array([0.88,0.72,0.5])
k=np.clip(0.45*late+0.08*fine+0.06*fbm(W,H,0.3,1,1.4,6),0,1)
col=base[None,None,:]*(1-k[...,None])+dark[None,None,:]*k[...,None]
col=col*(1-0.35*pores[...,None])+light[None,None,:]*0.0
col=col+0.05*rays[...,None]
col*=1+0.05*fbm(W,H,0.4,1,1.8,8)[...,None]
save(col,'oak.jpg')
# roughness-ish variation: pores rougher (packed into a grey map)
rough=0.5+0.18*pores-0.05*late
save(np.dstack([rough]*3),'oak_rough.jpg')
# ---- linen for the lampshade, and the grey fabric on the board ----
W=H=512
xx=np.arange(W)[None,:]*np.ones((H,1)); yy=np.arange(H)[:,None]*np.ones((1,W))
warpw=0.5+0.5*np.sin(xx*2*np.pi/4.0)*np.sin(yy*2*np.pi/4.0+np.pi/2)
slub=fbm(W,H,1.0,0.08,0.9,9)*0.5+fbm(W,H,0.08,1.0,0.9,10)*0.5
thread=0.5+0.25*np.sin(xx*2*np.pi/3.2+fbm(W,H,1,1,1.2,11)*0.6)+0.25*np.sin(yy*2*np.pi/3.4+fbm(W,H,1,1,1.2,12)*0.6)
L=0.86+0.06*thread+0.035*slub
save(np.dstack([L*0.98,L*0.92,L*0.80]),'linen.jpg')
G=0.55+0.05*thread+0.03*slub
save(np.dstack([G*0.98,G*0.98,G*0.95]),'fabric.jpg')
# ---- painted wall: almost flat, a little roller texture ----
Wl=fbm(512,512,1,1,1.1,13)*0.012+fbm(512,512,1,1,0.4,14)*0.008
save(np.dstack([0.93+Wl,0.9+Wl,0.84+Wl]),'wall.jpg')
print('ok')

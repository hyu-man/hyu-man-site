"""Code-native poster for the light-cone artwork. Requires Pillow only."""
from pathlib import Path
from math import sin, cos, pi, exp
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
S = 2
im = Image.new('RGB', (1200*S, 630*S), '#090f19')
d = ImageDraw.Draw(im)
def line(points, color, width=1):
    d.line([(int(x*S),int(y*S)) for x,y in points], fill=color, width=max(1,int(width*S)))
def text(x,y,s,size,color):
    font = ImageFont.truetype('C:/Windows/Fonts/meiryo.ttc', int(size*S))
    d.text((x*S,y*S),s,font=font,fill=color)
def point(u,a):
    y=(u-.5)*2;r=1-abs(2*u-1)
    x=r*cos(a);z=r*sin(a)
    xx=x*cos(.38)-z*sin(.38);zz=x*sin(.38)+z*cos(.38)
    yy=y*cos(.22)-zz*sin(.22);depth=y*sin(.22)+zz*cos(.22)
    p=4.8/(4.8-depth)
    return 851+xx*218*p,315-yy*218*p

for i in range(100):
    x=520+(i*137.508)%650;y=40+(i*i*17.7)%550
    d.rectangle((x*S,y*S,x*S+S,y*S+S),fill='#1c3440')
for j in range(28):
    line([point(k/60,j/28*2*pi) for k in range(61)],'#28444e',.55)
for j in range(1,40):
    u=j/40;rgb=tuple(int(a+(b-a)*u) for a,b in zip((154,231,212),(255,197,177)))
    line([point(u,i/120*2*pi) for i in range(121)],tuple(int(c*.23) for c in rgb),.5)
    for i in range(88):
        x,y=point(u,i/88*2*pi);a=.48+.4*exp(-((u-.36)/.09)**2)
        c=tuple(int(v*a) for v in rgb)
        d.ellipse((x*S-1,y*S-1,x*S+1,y*S+1),fill=c)
line([point(.5,i/160*2*pi) for i in range(161)],'#7aaea6',.9)
glow=Image.new('RGB',im.size);g=ImageDraw.Draw(glow)
for u,c in [(0,'#9ae7d4'),(1,'#ffc5b1')]:
    x,y=point(u,0)
    g.ellipse(((x-9)*S,(y-9)*S,(x+9)*S,(y+9)*S),fill=c)
from PIL import ImageChops
im=ImageChops.add(im,glow.filter(ImageFilter.GaussianBlur(12*S)))
d=ImageDraw.Draw(im)
for u,c in [(0,'#9ae7d4'),(1,'#ffc5b1')]:
    x,y=point(u,0);d.ellipse(((x-3)*S,(y-3)*S,(x+3)*S,(y+3)*S),fill=c)
line([(54,80),(1146,80)],'#283642')
line([(54,551),(1146,551)],'#283642')
text(54,34,'HYU-MAN / A WORLD, IF.',12,'#9baeb5')
text(60,153,'とどく。',82,'#e9eee9')
text(64,288,'このあいだを、',28,'#e9eee9')
text(64,336,'宇宙と呼ぶ。',28,'#e9eee9')
text(64,452,'もし、この量子重力の提案が正しかったら。',16,'#ffc5b1')
text(54,577,'LIGHT BETWEEN TWO MOMENTS',12,'#9ae7d4')
text(939,577,'hyu-man.com/todoku',12,'#9baeb5')
out=ROOT/'todoku/poster.png'
im.resize((1200,630),Image.Resampling.LANCZOS).save(out,optimize=True)
print(out)

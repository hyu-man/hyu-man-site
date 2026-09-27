/* ウチら — きみと遊びたかった。それだけ。
   Python版（Master/MV/Uchira_halt_full_20260928_v1/render.py）の生JS移植。
   音源の再生位置だけが時計。横960×540が主役（蟻と同じ）、縦540×960はスマホ用。映像：ω */
(() => {
'use strict';
const TAU = Math.PI * 2;
const PAPER=[255,249,237], INK=[111,69,64], PINK=[247,131,167],
      MINT=[145,211,184], BLUE=[158,205,230], LILAC=[193,174,229], YELLOW=[245,204,112],
      CREAM=[255,232,206], NIGHT=[43,38,66], NIGHT2=[24,21,42], MOONPINK=[255,196,214];
const PAL=[PINK,MINT,BLUE,LILAC,YELLOW];
const HBROWN=[132,63,61], HWHITE=[250,244,231];
const HCHEEK=[[244,176,183],[255,204,203]], HSCARF=[[167,211,193],[199,177,218]];
const D1=35+26/30, FLOW=51+10/30, RISE=58.9667, YATAI=65.8667,
      D2=82.3333, FERRIS=98.1, D3=113.2333, QUIET=128.7, DUR=169.825313;
const clip=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clip(x);return x*x*(3-2*x)};
const ease=(a,b,x)=>a+(b-a)*smooth(x);
const mix=(a,b,f)=>{f=clip(f);return `rgb(${Math.round(a[0]+(b[0]-a[0])*f)},${Math.round(a[1]+(b[1]-a[1])*f)},${Math.round(a[2]+(b[2]-a[2])*f)})`};
const css=a=>`rgb(${a[0]},${a[1]},${a[2]})`;
let d=null, L=null; // context と レイアウト
const F=(x,y,w,h,c)=>{d.fillStyle=c;d.fillRect(x,y,w,h)};
function line(pts,c,w=3){d.strokeStyle=c;d.lineWidth=w;d.lineJoin='round';d.beginPath();pts.forEach((p,i)=>i?d.lineTo(p[0],p[1]):d.moveTo(p[0],p[1]));d.stroke()}
function ell(x0,y0,x1,y1,fill,stroke,w=1){d.beginPath();d.ellipse((x0+x1)/2,(y0+y1)/2,Math.abs(x1-x0)/2,Math.abs(y1-y0)/2,0,0,TAU);if(fill){d.fillStyle=fill;d.fill()}if(stroke){d.strokeStyle=stroke;d.lineWidth=w;d.stroke()}}
function rrect(x0,y0,x1,y1,r,fill,stroke,w=1){d.beginPath();d.roundRect(x0,y0,x1-x0,y1-y0,r);if(fill){d.fillStyle=fill;d.fill()}if(stroke){d.strokeStyle=stroke;d.lineWidth=w;d.stroke()}}
function poly(pts,fill){d.fillStyle=fill;d.beginPath();pts.forEach((p,i)=>i?d.lineTo(p[0],p[1]):d.moveTo(p[0],p[1]));d.closePath();d.fill()}
function text(s,x,y,size,fill,align='center'){d.font=size+'px DotGothic16,monospace';d.textAlign=align;d.textBaseline='middle';d.fillStyle=fill;d.fillText(s,x,y)}
const HEART=['0110110','1111111','1111111','0111110','0011100','0001000'];
function heart(x,y,r,c){const s=Math.max(1,Math.round(r/3));d.fillStyle=c;for(let j=0;j<6;j++){const row=HEART[j];for(let i=0;i<7;i++)if(row[i]==='1')d.fillRect(Math.round(x+(i-3.5)*s),Math.round(y+(j-3)*s),s,s)}}
function star(x,y,r,c,angle=0,n=4){d.fillStyle=c;d.beginPath();for(let i=0;i<n*2;i++){const a=angle+TAU*i/(n*2),rr=i%2===0?r:r*.28;const px=x+rr*Math.cos(a),py=y+rr*Math.sin(a);i?d.lineTo(px,py):d.moveTo(px,py)}d.closePath();d.fill()}
function curve(p,c,w=3){const pts=[];for(let k=0;k<=24;k++){const u=k/24,v=1-u;pts.push([v*v*v*p[0][0]+3*v*v*u*p[1][0]+3*v*u*u*p[2][0]+u*u*u*p[3][0],v*v*v*p[0][1]+3*v*v*u*p[1][1]+3*v*u*u*p[2][1]+u*u*u*p[3][1]])}line(pts,c,w)}
function flower(x,y,r,c,angle=0){for(let k=0;k<5;k++){const a=angle+TAU*k/5,xx=x+Math.cos(a)*r*.58,yy=y+Math.sin(a)*r*.58;ell(xx-r*.43,yy-r*.43,xx+r*.43,yy+r*.43,css(c))}ell(x-r*.29,y-r*.29,x+r*.29,y+r*.29,css(YELLOW))}
/* Haltの子スプライト */
const SPRITES={};
function buildSprite(which,pose,blink,step){
 const cv=document.createElement('canvas');cv.width=80;cv.height=80;const g=cv.getContext('2d');
 const u=3,box=(a,b,c2,e,color)=>{g.fillStyle=color;g.fillRect(40+a*u,38+b*u,(c2-a)*u+u,(e-b)*u+u)};
 const shade=mix(HBROWN,[40,35,61],.18);
 const shift=[-1.6,0,1.6,0][step%4];
 box(Math.round(-7+shift),10,Math.round(-3+shift),10,shade);box(Math.round(3-shift),10,Math.round(7-shift),10,shade);
 for(const[a,b,c2,e]of[[-7,-9,6,8],[-9,-7,8,6],[-10,-4,9,3]])box(a,b,c2,e,css(HBROWN));
 box(-7,8,6,9,shade);
 for(const ex of[-6,3]){
  if(blink)box(ex,-2,ex+3,-1,css(HWHITE));
  else{box(ex,-4,ex+3,0,css(HWHITE));const pp=which===0?1:0;box(ex+pp,-3,ex+pp+1,-1,shade)}}
 box(-8,2,-5,3,css(HCHEEK[which]));box(5,2,8,3,css(HCHEEK[which]));
 if(pose===1)box(-1,2,0,4,css(HWHITE));else box(-1,2,0,2,css(HWHITE));
 box(-8,6,7,7,css(HSCARF[which]));box(6,7,8,10,css(HSCARF[which]));
 return cv}
for(let w=0;w<2;w++)for(let p=0;p<2;p++)for(let b=0;b<2;b++)for(let s=0;s<4;s++)SPRITES[[w,p,b,s]]=buildSprite(w,p,!!b,s);
function kid(x,y,size,which,t,pose=0,rotation=0,sleep=false){
 const blink=sleep||((t+which*.9)%4.6)<.15;
 const step=sleep?1:Math.floor(t*9+which*2)%4;
 if(!sleep)y-=2*Math.abs(Math.sin(t*5+which))*(size/20);
 const sp=SPRITES[[which,pose,blink?1:0,step]];
 d.save();d.translate(x,y);if(rotation)d.rotate(rotation*Math.PI/180);d.imageSmoothingEnabled=false;
 d.drawImage(sp,-size/2,-size/2,size,size);d.restore()}
function cloud(x,y,r,color){for(const[xx,yy,rr]of[[-.55,.07,.52],[0,-.2,.67],[.57,.08,.47]])ell(x+(xx-rr)*r,y+(yy-rr)*r,x+(xx+rr)*r,y+(yy+rr)*r,color);rrect(x-r,y-r*.15,x+r,y+r*.55,r*.22,color)}
function burst(t,start,x,y,color,n=22,speed=120){const u=t-start;if(u<0||u>=2.7)return;const alpha=1-smooth(u-1.7);
 for(let k=0;k<n;k++){const a=TAU*k/n+.37*start,v=speed*(.7+.3*Math.sin(k*7.1)**2);
  const xx=x+Math.cos(a)*v*u,yy=y+Math.sin(a)*v*u+16*u*u,rr=(3+2*Math.sin(k*2.7)**2)*alpha;
  if(k%2===0)heart(xx,yy,rr*2.1,mix(PAPER,color,alpha));
  else if(k%3===0)star(xx,yy,rr*1.7,mix(PAPER,color,alpha),a+u);
  else ell(xx-rr,yy-rr,xx+rr,yy+rr,mix(PAPER,color,alpha))}}
function hanabi(t,start,x,y,color,big=1){const u=t-start;if(u<0||u>=3.2)return;
 if(u<.62){const yy=(L.sh+140)-((L.sh+140-y)*smooth(u/.62));line([[x,yy+16],[x,yy+44]],mix(color,PAPER,.45),3);star(x,yy,6,css(color),t*4)}
 else{const e=u-.62,fade=1-e/2.5;if(fade<=0)return;
  for(let k=0;k<20;k++){const a=TAU*k/20+start,v=(95+24*Math.sin(k*3.3))*big;
   const xx=x+Math.cos(a)*v*e,yy=y+Math.sin(a)*v*e+30*e*e,c=mix(PAPER,color,fade);
   if(k%2===0)heart(xx,yy,5+7*fade,c);else star(xx,yy,4+5*fade,c,a+e*3)}
  if(e<.5)ell(x-70*e-6,y-70*e-6,x+70*e+6,y+70*e+6,null,mix(color,PAPER,.35),3)}}
function heartRain(t,amount=24,ymin=20,ymax=null){ymax=ymax??L.sh-30;
 for(let k=0;k<amount;k++){
 const xx=(k*167.31+Math.sin(t*.7+k*1.9)*26)%(L.sw+40)-20, yy=ymin+((k*91.7+t*(34+k%7*6))%(ymax-ymin));
 heart(xx,yy,5+k%4*2,mix(PAL[k%5],PAPER,.18+.08*(k%3)))}}
function confetti(t,amount=65,ymin=15,ymax=null){ymax=ymax??L.sh-20;
 for(let k=0;k<amount;k++){
 const xx=(k*137.77+Math.sin(t*.9+k)*34)%(L.sw+40)-20, yy=ymin+((k*73.17+t*(27+k%8*3))%(ymax-ymin)), c=PAL[k%5];
 if(k%3===0)heart(xx,yy,7,css(c));
 else if(k%3===1)star(xx,yy,6,css(c),t+k);
 else{const a=t*2+k;line([[xx,yy],[xx+5*Math.cos(a),yy+5*Math.sin(a)]],css(c),3)}}}
function stagebase(t,color,ground){F(0,0,L.sw,L.sh,css(color));
 const nc=L.land?12:8;
 for(let k=0;k<nc;k++){const x=(k*143-t*(6+k%3*4))%(L.sw+160)-80;cloud(x,55+(k%3)*(L.land?60:91),30+(k%3)*9,mix(color,PAPER,.7))}
 for(let k=0;k<(L.land?9:6);k++){const x=(k*181+t*(9+k%3*5))%(L.sw+100)-50;heart(x,(L.land?70:90)+(k%3)*(L.land?55:84)+Math.sin(t*1.7+k)*9,6+k%3*2,mix(PAL[k%5],color,.45))}
 if(ground){ell(-160,L.sh*.73,L.sw*.55,L.sh*1.4,mix(MINT,PAPER,.45));ell(L.sw*.3,L.sh*.75,L.sw*1.4,L.sh*1.4,mix(YELLOW,PAPER,.45))}}
function garland(t,y=75){const pts=[];for(let x=-20;x<L.sw+21;x+=10)pts.push([x,y+40*Math.sin(Math.PI*x/L.sw)]);line(pts,mix(INK,PAPER,.3),2);
 const n=L.land?21:13;
 for(let k=0;k<n;k++){const x=k*(L.sw/(n-1.5))-10,yy=y+40*Math.sin(Math.PI*x/L.sw),sway=Math.sin(t*2+k)*4;
  if(k%2===0)poly([[x-12,yy],[x+12,yy],[x+sway,yy+23]],css(PAL[k%5]));
  else heart(x+sway*.6,yy+14,10,css(PAL[k%5]))}}
function boat(x,y,s=1){poly([[x-95*s,y],[x+95*s,y],[x+56*s,y+42*s],[x-55*s,y+42*s]],css(PAPER));
 poly([[x-95*s,y],[x+10*s,y+15*s],[x+56*s,y+42*s],[x-55*s,y+42*s]],mix(PINK,PAPER,.66));
 line([[x-95*s,y],[x,y+22*s],[x+95*s,y]],mix(INK,PAPER,.55),2)}
const rgbOf=s=>s.match(/\d+/g).map(Number);
/* ── 場面（L.land で横/縦のレイアウトを切り替え。縦はv1移植のまま） ── */
function envelopeScene(t,pulse){stagebase(t,CREAM,true);
 const cx=L.cx, y=L.land?200:320, ew=L.land?170:145;
 ell(cx-130,y+128,cx+133,y+155,mix(INK,CREAM,.85));rrect(cx-ew,y,cx+ew,y+147,10,css(PAPER));
 const opening=smooth((t-1.5)/2.1);
 poly([[cx-ew,y],[cx+ew,y],[cx,y+90*(1-opening)-115*opening]],mix(PINK,PAPER,.62));
 if(t>1.5){kid(cx-55,y+40-opening*123,120,0,t,1,Math.sin(t*2)*8);kid(cx+57,y+40-opening*121,120,1,t,1,-Math.sin(t*2)*8)}
 poly([[cx-ew,y+8],[cx,y+89],[cx+ew,y+8],[cx+ew,y+147],[cx-ew,y+147]],'rgb(255,253,247)');
 line([[cx-ew,y+147],[cx,y+54],[cx+ew,y+147]],mix(PINK,PAPER,.4),2);
 heart(cx,y+86,23,css(PINK));
 for(let k=0;k<24;k++){const u=clip((t-2.3-k*.055)/2.5);if(u>0){const a=TAU*k/24;
  if(k%2===0)heart(cx+Math.cos(a)*(L.land?300:185)*u,y+90+Math.sin(a)*(L.land?120:152)*u-80*u,4+7*u,css(PAL[k%5]));
  else star(cx+Math.cos(a)*(L.land?290:180)*u,y+90+Math.sin(a)*(L.land?115:150)*u-80*u,3+5*u,css(PAL[k%5]),t)}}
 heartRain(t,14,20,L.sh-80);garland(t);text('ふたりぶん、ひらいた。',cx,L.land?L.sh-42:515,23,css(INK))}
function riverScene(t,pulse){const u=t-8.6;stagebase(t,rgbOf(mix(BLUE,PAPER,.75)),false);
 const wy=L.land?330:415, amp=L.land?150:55;
 for(let j=0;j<7;j++){const pts=[];for(let x=-20;x<L.sw+30;x+=8)pts.push([x,wy+j*22+20*Math.sin(x/88+t*.9+j*.6)]);line(pts,mix([BLUE,MINT,PINK][j%3],PAPER,.45),14)}
 for(let k=0;k<(L.land?18:12);k++){const xr=(k*83-t*22)%(L.sw+80)-40,yr=wy+30+(k%3)*45;
  if(k%2===0)flower(xr,yr,11,PAL[k%5],t*.2);else heart(xr,yr,9,mix(PAL[k%5],PAPER,.15))}
 const x=L.cx+Math.sin(u*.8)*amp,y=(L.land?250:310)+Math.sin(u*2.2)*12;
 if(t<16+13/30){const angle=Math.sin(u*1.8)*9;
  for(let k=0;k<6;k++){const wx=x-60-k*26,wy2=y+42+Math.sin(t*3+k)*6;if(wx>0)star(wx,wy2,4+2*Math.sin(t*4+k)**2,mix(BLUE,PAPER,.15),t+k)}
  kid(x-43,y-18,118,0,t,1,angle);kid(x+43,y-18,118,1,t,1,angle);boat(x,y+23,1.3)}
 else{for(let j=0;j<5;j++){d.strokeStyle=css(PAL[j]);d.lineWidth=8;d.beginPath();
   d.ellipse(L.cx,L.land?L.sh-40:385,(L.land?800:500)/2-j*10,(L.land?420:450)/2-j*10,0,Math.PI,TAU);d.stroke()}
  kid(L.cx-80+Math.sin(t)*20,L.land?280:300,140,0,t,1,-10);kid(L.cx+80+Math.sin(t+1)*20,L.land?280:300,140,1,t,1,10);
  line([[L.cx-51,L.land?298:318],[L.cx-12,L.land?350:370]],css(INK),5);line([[L.cx+52,L.land?298:318],[L.cx+13,L.land?349:369]],css(INK),5);
  ell(L.cx-24,L.land?331:351,L.cx,L.land?358:378,css(PINK));ell(L.cx+5,L.land?331:351,L.cx+27,L.land?358:378,css(MINT));
  heart(L.cx,L.land?120:226,26+11*pulse,css(PINK));
  for(let k=0;k<7;k++){const a=Math.PI+Math.PI*(k+1)/8;heart(L.cx+(L.land?380:238)*Math.cos(a),(L.land?L.sh-30:385)+(L.land?200:218)*Math.sin(a),8+3*Math.sin(t*2+k),css(PAL[k%5]))}
  heartRain(u,12,60,L.sh-100)}}
function ticketsScene(t,pulse){stagebase(t,rgbOf(mix(MINT,PAPER,.73)),true);garland(t,L.land?60:85);
 const beam=Math.sin(t*1.4)*160, bx1=L.land?200:120, bx2=L.land?760:420;
 for(const[bx,ph]of[[bx1,0],[bx2,Math.PI]])poly([[bx,L.sh],[bx+beam*Math.cos(ph)-60,L.land?110:160],[bx+beam*Math.cos(ph)+60,L.land?110:160]],mix(YELLOW,PAPER,.8));
 [[L.land?L.cx-180:167,BLUE],[L.land?L.cx+180:373,PINK]].forEach(([x,c],k)=>{const yy=(L.land?140:210)+Math.sin(t*2+k)*12;
  rrect(x-68,yy,x+68,yy+85,12,mix(c,PAPER,.5),css(c),2);
  text('あそぼ',x,yy+31,25,css(INK));heart(x,yy+62,12,css(c));
  for(const[hx,hy]of[[x-55,yy+13],[x+55,yy+13],[x-55,yy+70],[x+55,yy+70]])heart(hx,hy,6,mix(c,INK,.15));
  kid(x,L.land?L.sh-115:366,150,k,t,1,Math.sin(t*2+k)*6)});
 line([[L.cx-60,L.land?L.sh-135:345],[L.cx,L.land?L.sh-160:320],[L.cx+60,L.land?L.sh-135:345]],css(INK),3);
 const label=t<28.2?'ふたりなら、どこまでも。':'きっぷは、はじめから にまいぶん。';
 text(label,L.cx,L.land?95:495,L.land?22:(t<28.2?22:21),css(INK));
 for(let k=0;k<(L.land?17:11);k++)star(30+k*(L.land?56:49),(L.land?190:155)+14*Math.sin(t+k),6,css(PAL[k%5]),t);
 for(let k=0;k<8;k++){const yy=(L.sh+20)-((t*38+k*61)%(L.sh-120)),xx=k%2===0?28:L.sw-28;heart(xx+Math.sin(t*2+k)*7,yy,7+k%3*2,css(PAL[k%5]))}}
function launchScene(t,pulse){stagebase(t,rgbOf(mix(LILAC,PAPER,.75)),false);
 const power=smooth((t-31.25)/4.5),ring=(t*90)%140, gy=L.land?350:430;
 ell(L.cx-ring-40,gy-ring*.6-25,L.cx+ring+40,gy+ring*.6+25,null,mix(PINK,PAPER,.5),3);
 PAL.forEach((c,k)=>{const x=L.land?160+k*160:90+k*90,y=(L.land?150:210)-power*60+Math.sin(t*3+k)*10;
  if(k%2===0)heart(x,y,34,css(c));else ell(x-28,y-35,x+28,y+35,css(c));
  curve([[x,y+34],[x+20,gy-70],[L.cx-10,gy-115],[L.cx,gy-30]],mix(c,INK,.3),2)});
 heartRain(t,10,60,L.sh-60);
 kid(L.cx-45,gy-45+power*18,115,0,t,0,-8*power);kid(L.cx+45,gy-45+power*18,115,1,t,0,8*power);boat(L.cx,gy,1.3);
 for(let j=0;j<(L.land?11:7);j++){const x=(L.land?90:75)+j*(L.land?78:65);line([[x,L.sh+15],[x+Math.sin(t*4+j)*10,L.sh+15-power*110]],css(PAL[j%5]),3)}}
function balloonScene(t,pulse){const u=t-D1;stagebase(t,rgbOf(mix(BLUE,PAPER,.72)),false);
 const fly=smooth(u/1.1),cx=L.cx+(L.land?90:40)*Math.sin(u*1.8),cy=L.land?ease(430,250,fly):ease(530,360,fly);
 PAL.forEach((c,j)=>{const xx=cx+(j-2)*43,yy=(L.land?70:125)+18*Math.abs(j-2)+Math.sin(t*2+j)*8;
  if(j%2===0)heart(xx,yy,40,css(c));else ell(xx-29,yy-42,xx+29,yy+42,css(c));
  line([[xx,yy+40],[cx+(j-2)*21,cy+20]],mix(c,INK,.25),2)});
 const gust=Math.sin(Math.PI*clip((u-1.8)/3.8));
 const x1=cx-43,y1=cy-25,x2=cx+43+gust*(L.land?300:180),y2=cy-25-gust*(L.land?110:150);
 curve([[x1+25,y1+25],[x1+45,y1+80],[x2-30,y2+100],[x2,y2+25]],css(PINK),4);
 kid(x1,y1,116,0,t,1,-8*gust);kid(x2,y2,116,1,t,1,25*gust);boat(cx,cy+18,1.23);
 if(u>5.6)heart(cx,cy-115,30+8*pulse,css(PINK));
 for(let k=0;k<5;k++){const gu=clip((u-1.8-k*.22)/3.8);
  if(gu>0&&gu<1)heart(x1+(x2-x1)*(1-gu*.2)-k*26*gust,y1+(y2-y1)*(1-gu*.2)+22*k*gust,7+k*2,mix(PINK,PAPER,.15+.13*k))}
 for(let j=0;j<9;j++)burst(t,D1+j*.6,70+(j*(L.land?151:87))%(L.sw-140),(L.land?140:200)+(j%3)*(L.land?70:95),PAL[j%5],28,115);
 heartRain(t,20);confetti(t,90)}
function carouselScene(t,pulse){const u=t-45;stagebase(t,rgbOf(mix(PINK,PAPER,.83)),false);
 const cx=L.cx,cy=L.land?265:345,rx=L.land?330:215,ryTop=L.land?150:165;
 PAL.forEach((c,j)=>{d.strokeStyle=css(c);d.lineWidth=7;d.beginPath();d.ellipse(cx,cy-15+2*j,rx-j*8,ryTop-j*7,0,Math.PI,TAU);d.stroke()});
 poly([[cx,cy-(L.land?155:170)],[cx-(L.land?280:184),cy-79],[cx+(L.land?280:185),cy-79]],mix(PINK,PAPER,.25));
 for(let j=0;j<8;j++)poly([[cx,cy-(L.land?155:170)],[cx-(L.land?280:184)+j*(L.land?70:46),cy-79],[cx-(L.land?280:184)+(j+1)*(L.land?70:46),cy-79]],mix(PAL[j%5],PAPER,.2));
 for(let j=0;j<(L.land?20:14);j++){const bx=cx-(L.land?280:184)+j*(L.land?29.5:28),on=(Math.floor(t*6)+j)%3===0;ell(bx-5,cy-87,bx+5,cy-77,on?css(PAL[j%5]):mix(PAL[j%5],PAPER,.7))}
 star(cx,cy-(L.land?167:182),25,css(YELLOW),t*.4);line([[cx,cy-82],[cx,cy+(L.land?150:106)]],css(INK),7);
 const objects=[];for(let k=0;k<6;k++){const a=u*.85+TAU*k/6;objects.push([cy+(L.land?70:58)*Math.sin(a),cx+(L.land?270:175)*Math.cos(a),k,a])}
 objects.sort((p,q)=>p[0]-q[0]);
 for(const[yy,xx,k,a]of objects){line([[xx,cy-81],[xx,yy+38]],mix(INK,PAPER,.55),3);
  ell(xx-37,yy+27,xx+37,yy+45,css(PAL[k%5]));
  if(k===0||k===3)kid(xx,yy-8,105,Math.floor(k/3),t,1,-Math.cos(a)*8);
  else if(k%2)heart(xx,yy-6,17,css(PAL[k%5]));
  else flower(xx,yy,19,PAL[k%5],a)}
 ell(cx-(L.land?300:184),cy+(L.land?135:92),cx+(L.land?300:185),cy+(L.land?185:150),mix(LILAC,PAPER,.3));
 ell(cx-(L.land?300:184),cy+(L.land?128:85),cx+(L.land?300:185),cy+(L.land?168:133),mix(LILAC,PAPER,.65));
 for(let k=0;k<9;k++){const a=t*.9+TAU*k/9;heart(cx+(L.land?400:236)*Math.cos(a),cy-15+(L.land?230:205)*Math.sin(a),8+3*Math.sin(t*3+k),css(PAL[k%5]))}
 hanabi(t,48.2,L.land?130:90,L.land?120:170,MINT,.6);confetti(t,100)}
function coasterScene(t,pulse){const u=t-FLOW;stagebase(t,rgbOf(mix(MINT,PAPER,.8)),false);
 const lift=smooth((t-RISE)/4), hn=L.land?9:6, hw=L.land?110:115, gy=L.land?L.sh-100:440;
 for(let k=0;k<hn;k++){const x=(k*(L.land?170:180)-u*(50+lift*45))%(L.sw+410)-180;
  F(x,gy,hw,L.sh-gy+20,mix(PAL[k%5],PAPER,.5));poly([[x-10,gy],[x+hw/2,gy-60],[x+hw+10,gy]],css(PAL[(k+1)%5]));heart(x+hw/2,gy+39,20,css(PAPER))}
 for(let k=0;k<(L.land?6:4);k++){const px=(k*(L.land?175:260)-u*(50+lift*45))%(L.sw+410)-140,py=gy-45;
  line([[px,py],[px,py+50]],mix(INK,PAPER,.5),3);
  for(let j=0;j<4;j++){const aa=t*(3+lift*3)+j*TAU/4+k;heart(px+16*Math.cos(aa),py+16*Math.sin(aa),8,css(PAL[(j+k)%5]))}}
 if(lift>0){for(let k=0;k<8;k++){const yy=(L.land?90:200)+k*(L.land?45:58),ln=40+lift*70,xx=(k*151-u*300)%(L.sw+160)-80;line([[xx,yy],[xx+ln,yy]],mix(PAL[k%5],PAPER,.55),3)}
  hanabi(t,60.4,L.land?170:110,L.land?110:170,PINK,.7);hanabi(t,62.8,L.land?790:430,L.land?100:150,LILAC,.7)}
 const rx=L.land?320:170, ry=L.land?185:155, cy2=L.land?255:310;
 PAL.forEach((c,j)=>{d.strokeStyle=mix(c,PAPER,.22);d.lineWidth=4;d.beginPath();d.ellipse(L.cx,cy2,rx+j*6,ry+j*6,0,0,TAU);d.stroke()});
 const a=u*(1.1+lift*.35),x=L.cx+(rx-5)*Math.cos(a),y=cy2+(ry-5)*Math.sin(a);
 for(let k=1;k<5;k++){const ta=a-k*.16;heart(L.cx+(rx-5)*Math.cos(ta),cy2+(ry-5)*Math.sin(ta)+18,6+k,mix(PINK,PAPER,.12*k+.1))}
 kid(x-28,y-20,105,0,t,1,Math.sin(a)*18);kid(x+28,y-20,105,1,t,1,Math.sin(a)*18);boat(x,y+22,.8);
 for(let k=0;k<6;k++)burst(t,58.4+k*1.15,80+k*(L.land?150:88),(L.land?100:128)+(k%2)*52,PAL[k%5],34,115);
 heartRain(u,14);confetti(t,85)}
function yataiScene(t,pulse){const u=t-YATAI;stagebase(t,rgbOf(mix(YELLOW,PAPER,.68)),true);
 const melt=smooth(u/5.5), ly=L.land?95:142;
 const pts=[];for(let x=-20;x<L.sw+21;x+=10)pts.push([x,ly+22*Math.sin(Math.PI*x/L.sw)]);line(pts,mix(INK,PAPER,.35),2);
 const ln=L.land?11:7;
 for(let k=0;k<ln;k++){const x=k*(L.sw/(ln-.8))+15,yy=ly+22*Math.sin(Math.PI*x/L.sw),sway=Math.sin(t*1.6+k)*5;
  ell(x-26+sway,yy+4,x+26+sway,yy+56,mix(PAL[k%5],PAPER,.7));
  rrect(x-17+sway,yy+8,x+17+sway,yy+50,8,css(PAL[k%5]));F(x-8+sway,yy+2,16,6,css(INK));heart(x+sway,yy+29,8,css(PAPER))}
 const sx0=L.land?70:40, sy0=L.land?215:300, sw2=L.land?260:195;
 F(sx0,sy0,sw2,L.land?175:155,mix(CREAM,PAPER,.3));
 for(let k=0;k<Math.floor(sw2/28);k++)poly([[sx0+k*28,sy0-32],[sx0+28+k*28,sy0-32],[sx0+28+k*28,sy0+2],[sx0+k*28,sy0+2]],k%2?css(PINK):css(PAPER));
 F(sx0,sy0-38,sw2,10,mix(INK,PAPER,.4));F(sx0,sy0+90,sw2,10,mix(INK,PAPER,.55));
 text('かき氷',sx0+sw2/2,sy0+40,20,mix(INK,PAPER,.15));
 const gx=sx0+sw2/2,gy=L.land?sy0+215:470;
 poly([[gx-42,gy],[gx+42,gy],[gx+26,gy+40],[gx-26,gy+40]],mix(BLUE,PAPER,.6));
 ell(gx-40,gy-52,gx+40,gy+8,css(PAPER));
 for(let k=0;k<3;k++){const drip=melt*(18+k*9),sx=gx-22+k*22;
  poly([[sx-7,gy-20],[sx+7,gy-20],[sx+3,gy-20+drip],[sx-3,gy-20+drip]],mix(k%2?MINT:PINK,PAPER,.25))}
 ell(gx-34,gy-58,gx+34,gy-18,mix(PINK,PAPER,.35));
 for(let k=0;k<4;k++){const yy=(L.land?L.sh-45:560)+k*(L.land?10:14),hp=[];for(let x=20;x<L.sw-19;x+=12)hp.push([x,yy+3*Math.sin(x/28+t*4+k)]);line(hp,mix(YELLOW,PAPER,.62),2)}
 let kx0,kx1;const base0=L.land?560:320, base1=L.land?740:440, tgt0=L.land?520:238, tgt1=L.land?640:318;
 if(u<7.7){kx0=base0;kx1=base1}else{const q=smooth((u-7.7)/1.6);kx0=ease(base0,tgt0,q);kx1=ease(base1,tgt1,q)}
 const ky=L.land?L.sh-140:455;
 kid(kx0,ky,132,0,t,(u>7.7&&u<16)?1:0,-4);kid(kx1,ky,132,1,t,(u>7.7&&u<16)?1:0,4);
 if(u>=3.8&&u<7.7){const q=smooth((u-3.8)/2.6),px=(L.land?820:380)+18*Math.sin(u*2),py=ease(L.land?70:120,ky-100,q);
  for(let k=0;k<5;k++){const a=Math.PI+k*Math.PI/5,seg=[[px,py-28]];
   for(let s2=0;s2<6;s2++){const v=a+Math.PI/5*s2/5;seg.push([px+52*Math.cos(v),py-28+34*Math.sin(v)])}
   poly(seg,mix(PAL[k%5],PAPER,.3))}
  line([[px-40,py-16],[px-9,py+14]],mix(INK,PAPER,.5),2);line([[px+40,py-16],[px+9,py+14]],mix(INK,PAPER,.5),2);
  F(px-26,py+8,52,34,css(PAPER));line([[px-26,py+8],[px,py+28],[px+26,py+8]],mix(PINK,PAPER,.4),2);heart(px,py+26,10,css(PINK))}
 if(u>=7.7){const hy=ky-25;
  curve([[kx0+34,hy],[kx0+52,hy-26],[kx1-52,hy-26],[kx1-34,hy]],css(PINK),4);
  heart((kx0+kx1)/2,(L.land?170:300)-14*Math.sin(t*2),26+12*pulse,css(PINK));
  for(let k=0;k<6;k++){const hu=(u*.6+k*.31)%1.2;heart((kx0+kx1)/2+Math.sin(t*2+k*2.2)*34,ky-63-hu*120,4+5*hu,mix(PINK,PAPER,.2+.5*hu))}
  for(let k=0;k<8;k++){const a=t*1.3+k*TAU/8;star((kx0+kx1)/2+120*Math.cos(a),(L.land?200:330)+80*Math.sin(a),5+3*pulse,css(PAL[k%5]),a)}}
 heartRain(u,10,60,L.sh-100);confetti(t,45)}
function gardenScene(t,pulse,local){stagebase(t,rgbOf(mix(YELLOW,PAPER,.83)),true);garland(t,42);
 const fn=L.land?19:12, base=L.land?L.sh+30:530;
 for(let k=0;k<fn;k++){const x=35+k*(L.sw-70)/(fn-1),grow=smooth((local-k*.19)/1.4);
  const height=((L.land?70:100)+(L.land?70:90)*Math.sin(k*1.7)**2)*grow,y=base-40-height;
  curve([[x,base],[x-20,base-40],[x+12,y+55],[x,y]],css(MINT),5);ell(x-15,y+58,x+4,y+70,css(MINT));
  if(k%3===2)heart(x,y,20*grow,css(PAL[k%5]));else flower(x,y,23*grow,PAL[k%5],t*.4+k)}
 for(let k=0;k<16;k++){const px=(k*127+local*60)%(L.sw+60)-30,py=(k*67.7+local*(60+k%5*14))%(L.sh-60)+40;
  ell(px-5,py-3,px+5,py+3,mix(PAL[k%5],PAPER,.3))}
 const hop=Math.abs(Math.sin(local*2.7)),x=L.cx+(L.land?170:95)*Math.sin(local*.8), ky=L.land?250:300;
 kid(x-53,ky-hop*50,140,0,t,1,-12*Math.sin(local*2.7));kid(x+53,ky-hop*50,140,1,t,1,12*Math.sin(local*2.7));
 curve([[x-28,ky+18-hop*50],[x-10,ky+50-hop*50],[x+10,ky+50-hop*50],[x+27,ky+18-hop*50]],css(PINK),4);
 for(let k=0;k<12;k++){const a=t*.7+k*TAU/12;
  if(k%2===0)heart(L.cx+(L.land?390:222)*Math.cos(a),(L.land?250:310)+(L.land?215:222)*Math.sin(a),10,css(PAL[k%5]));
  else star(L.cx+(L.land?385:220)*Math.cos(a),(L.land?250:310)+(L.land?212:220)*Math.sin(a),9,css(PAL[k%5]),a)}
 const pop=clip(Math.sin(local*2.7));
 if(pop>.82)for(let k=0;k<6;k++)heart(x+(k-2.5)*34,ky+52+18*(1-pop),6+3*(pop-.82)/.18,mix(PINK,PAPER,.2));
 for(let k=0;k<7;k++)burst(local,k*2.15,70+(k*(L.land?170:97))%(L.sw-140),(L.land?190:270)+(k%3)*(L.land?60:85),PAL[k%5],22,85);
 heartRain(local,10,60,L.land?280:300)}
function ferrisScene(t,pulse){const u=t-FERRIS,dusk=smooth(u/13);
 const base=rgbOf(mix(rgbOf(mix(YELLOW,PINK,.45)),[88,68,112],dusk*.6));
 stagebase(t,base,false);
 ell(L.land?90:60,(L.land?90:120)-dusk*50,L.land?190:150,(L.land?190:210)-dusk*50,mix(YELLOW,PINK,.3));
 const tn=L.land?9:6;
 for(let k=0;k<tn;k++){const x=k*(L.sw/(tn-.5))-10, ty=L.sh-100;
  F(x,ty,70,65,mix(PAL[k%5],base,.5));poly([[x-6,ty],[x+35,ty-28],[x+76,ty]],mix(PAL[(k+2)%5],base,.3));
  const on=(Math.floor(t*5)+k)%2;ell(x+28,ty+25,x+42,ty+39,on?css(YELLOW):mix(YELLOW,base,.6))}
 const cx=L.cx,cy=L.land?240:308,R=L.land?200:168;
 line([[cx-95,L.sh+45],[cx,cy],[cx+95,L.sh+45]],mix(INK,PAPER,.35),7);
 [[PINK,0],[LILAC,10]].forEach(([c,off])=>{d.strokeStyle=mix(c,PAPER,.25);d.lineWidth=5;d.beginPath();d.arc(cx,cy,R-off,0,TAU);d.stroke()});
 for(let k=0;k<8;k++){const a=u*.4+TAU*k/8;line([[cx,cy],[cx+R*Math.cos(a),cy+R*Math.sin(a)]],mix(INK,PAPER,.6),2)}
 star(cx,cy,16,css(YELLOW),t*.5);
 let ride=null;
 for(let k=0;k<8;k++){const a=u*.4+TAU*k/8,gx=cx+R*Math.cos(a),gy=cy+R*Math.sin(a)+14;
  if(k===0)ride=[gx,gy];else heart(gx,gy+6*Math.sin(t*2+k),22,css(PAL[k%5]))}
 for(let k=0;k<(L.land?16:10);k++){const sx=(k*127+u*8)%(L.sw+20)-10,sy=(L.land?60:110)+(k*53)%(L.land?140:180);star(sx,sy,3+2*Math.sin(t*2+k)**2,mix(PAPER,base,.25),t+k)}
 if(u>7.3){hanabi(t,FERRIS+7.4,L.land?170:120,L.land?140:205,PINK,.75);hanabi(t,FERRIS+9.6,L.land?790:432,L.land?120:180,MINT,.75);
  hanabi(t,FERRIS+11.7,L.cx,L.land?90:150,LILAC,.9);hanabi(t,FERRIS+13.4,L.land?120:90,L.land?170:230,YELLOW,.75)}
 const[gx,gy]=ride;
 rrect(gx-52,gy-8,gx+52,gy+40,14,mix(PINK,PAPER,.45),css(PINK),2);
 kid(gx-24,gy-4,88,0,t,1,Math.sin(u)*5);kid(gx+24,gy-4,88,1,t,1,-Math.sin(u)*5);
 heart(gx,gy-46,13+7*pulse,css(PINK));
 heartRain(u,8,60,L.land?260:300);confetti(t,40)}
function finaleScene(t,pulse,local){stagebase(t,rgbOf(mix(LILAC,PAPER,.86)),false);
 const cx=L.cx,cy=L.land?190:270;
 for(let j=0;j<12;j++){const a=t*.3+j*TAU/12;
  poly([[cx,cy+40],[cx+900*Math.cos(a),cy+40+900*Math.sin(a)],[cx+900*Math.cos(a+.13),cy+40+900*Math.sin(a+.13)]],mix(PAL[j%5],PAPER,.8))}
 const size=1+.12*pulse, urx=L.land?330:235, ury=L.land?150:175;
 heart(cx,cy-(L.land?128:32)-ury*size+cy*0+Math.sin(t*2)*4+((L.land?ury*size-150:0)),24+10*pulse,css(PINK));
 for(let j=0;j<10;j++){const a=Math.PI+j*Math.PI/10,b=Math.PI+(j+1)*Math.PI/10,seg=[[cx,cy+40]];
  for(let s2=0;s2<10;s2++){const v=a+(b-a)*s2/9;seg.push([cx+urx*size*Math.cos(v),cy+ury*size*Math.sin(v)])}
  poly(seg,mix(PAL[j%5],PAPER,.17))}
 for(let j=0;j<9;j++){const a=Math.PI+(j+.5)*Math.PI/9;
  heart(cx+urx*size*Math.cos(a),cy+ury*size*Math.sin(a)+16+3*Math.sin(t*3+j),9,css(PAL[j%5]))}
 line([[cx,cy-13],[cx,cy+163]],css(INK),5);
 d.strokeStyle=css(INK);d.lineWidth=5;d.beginPath();d.arc(cx+17,cy+160,17,0,Math.PI);d.stroke();
 const fan=L.land?15:11;
 for(let j=0;j<fan;j++)poly([[cx,cy+190],[j*(L.sw+80)/fan-40,L.sh+40],[(j+1)*(L.sw+80)/fan-40,L.sh+40]],mix(PAL[j%5],PAPER,.64));
 const hop=Math.abs(Math.sin(local*3.2))*30,xx=(L.land?95:72)+18*Math.sin(local*.65), ky=L.land?cy+135:405;
 kid(cx-xx,ky-hop,155,0,t,1,-8*Math.sin(local*3.2));kid(cx+xx,ky-hop,155,1,t,1,8*Math.sin(local*3.2));
 heart(cx,ky-77,19+9*pulse,css(PINK));
 const CH=[0,2.567,4.2,6.433,8.167,10.3,11.9,14.2];
 const SP=L.land?[[180,150],[780,120],[480,90],[110,180],[850,160],[300,110],[660,130],[480,150]]
               :[[140,190],[420,160],[270,130],[90,220],[460,200],[180,150],[360,170],[270,190]];
 for(let k=0;k<8;k++)hanabi(local,CH[k]+.15,SP[k][0],SP[k][1],PAL[k%5],1.15);
 for(let k=0;k<16;k++)burst(local,k*.95,45+(k*151)%(L.sw-90),(L.land?90:130)+(k%4)*(L.land?70:105),PAL[k%5],38,130);
 heartRain(local,28);confetti(t,140)}
function starryScene(t,pulse){const u=t-QUIET;
 F(0,0,L.sw,L.sh,mix(NIGHT,NIGHT2,smooth(u/6)));
 for(let k=0;k<(L.land?70:46);k++){const sx=(k*118.7)%L.sw,sy=(k*61.3)%(L.sh*.68),tw=.5+.5*Math.sin(t*1.5+k*2.2);
  const c=mix(NIGHT,PAPER,.25+.45*tw);F(sx,sy,1,1,c);if(k%6===0)star(sx,sy,2+2*tw,c,k)}
 const mx=L.land?820:432,my=L.land?95:120;
 heart(mx,my,30,css(MOONPINK));ell(mx-40,my-36,mx+46,my+46,null,mix(MOONPINK,NIGHT,.55),2);
 for(let k=0;k<(L.land?12:8);k++){const fx=70+Math.sin(u*.5+k*2.3)*60+k*(L.land?75:52),fy=(L.land?300:360)+Math.sin(u*.8+k*1.7)*46,gl=.5+.5*Math.sin(t*3+k);
  ell(fx-2,fy-2,fx+2,fy+2,mix(NIGHT,rgbOf(mix(MINT,YELLOW,.5)),.35+.55*gl))}
 ell(-160,L.sh*.78,L.sw*.55,L.sh*1.45,mix(MINT,NIGHT,.62));ell(L.sw*.3,L.sh*.8,L.sw*1.4,L.sh*1.45,mix(MINT,NIGHT,.68));
 const bx=L.cx, by=L.land?L.sh-105:470;
 poly([[bx-120,by],[bx+120,by],[bx+168,by+105],[bx-168,by+105]],mix(PINK,NIGHT,.35));
 for(let k=0;k<6;k++)line([[bx-115+k*40,by+4],[bx-148+k*52,by+100]],mix(PAPER,NIGHT,.55),2);
 for(let k=0;k<4;k++)line([[bx-122-k*10,by+13+k*22],[bx+122+k*10,by+13+k*22]],mix(PAPER,NIGHT,.55),2);
 ell(bx-30,by-82,bx+30,by-22,mix(YELLOW,NIGHT,.5));rrect(bx-12,by-72,bx+12,by-30,7,mix(YELLOW,NIGHT,.15));heart(bx,by-51,7,mix(PINK,NIGHT,.1));
 const walk=smooth(u/6),sleep=t>=158.733;
 const kx0=ease(bx-150,bx-64,walk),kx1=ease(bx-90,bx+64,walk),lean=smooth((u-22)/4)*7;
 kid(kx0,by-38,128,0,t,0,lean,sleep);kid(kx1,by-38,128,1,t,0,-lean,sleep);
 for(let k=0;k<8;k++){const lu=u-6.2-k*1.1-(k*37%7)*.5;if(lu<0)continue;
  const ly=(L.sh-60)-lu*(20+(k*29%5)*3);const lx=60+(k*173%(L.sw-120))+Math.sin(lu*.8+k)*17;
  if(ly<50)continue;
  ell(lx-22,ly-24,lx+22,ly+28,mix(NIGHT,YELLOW,.18));
  rrect(lx-13,ly-16,lx+13,ly+18,6,mix(YELLOW,PINK,.25));
  heart(lx,ly+1,8,mix(PINK,PAPER,.2));F(lx-6,ly+18,12,4,mix(INK,NIGHT,.4))}
 for(const[st,sx,sy]of(L.land?[[12.5,150,90],[17.2,600,60],[24.8,350,100],[31.5,760,80]]:[[12.5,120,110],[17.2,400,90],[24.8,250,130],[31.5,460,120]])){const su=u-st;
  if(su>=0&&su<.7){const ex=sx+su*300,ey=sy+su*120;line([[sx,sy],[ex,ey]],mix(PAPER,NIGHT,.25),2);star(ex,ey,5,css(PAPER),su*8)}}
 if(sleep)for(let k=0;k<2;k++){const hu=(u*.4+k*.5)%1;
  heart(kx0+40+k*8,by-78-hu*60,3+3*hu,mix(PINK,NIGHT,.25+.5*hu));heart(kx1+40+k*8,by-78-hu*60,3+3*hu,mix(PINK,NIGHT,.25+.5*hu))}
 // オチの小道具：あの招待状（ミニ）。ウチのそばに、そっと。
 if(t>=153.4&&t<167.2){const q=smooth((t-153.4)/.8),ex=kx0-64,ey=by-74;
  ell(ex-30,ey-24,ex+30,ey+30,mix(NIGHT,YELLOW,.16*q));
  F(ex-22,ey-14,44,30,mix(NIGHT,PAPER,.92*q));
  line([[ex-22,ey-14],[ex,ey+2],[ex+22,ey-14]],mix(NIGHT,PINK,.6*q),2);
  heart(ex,ey+2,7,mix(NIGHT,PINK,.85*q))}
 if(t>=163.8)text('また、あそぼ。',L.cx,L.land?110:150,30,mix(PAPER,NIGHT,.12))}
/* ── 字幕・語り ── */
const OMIT=new Set(['I want to make it like I was never born','"ウチら" って言ってたの','ウチだけ']);
let CUES=[];
const NARR=[[0.3,4,'あのひ、ポストに とどいたんだ。'],[4.9,8.4,'まほうみたいな、しょうたいじょう。'],[10,15.6,'せかいが、ふたりぶんに なった。'],[18.2,23.6,'きみが わらうから、せかいに いろが ついたんだよ。'],[46,50.8,'まわって、わらって、きょうが すき。'],[53.2,58.4,'こわくない。となりに きみが いる。'],[66.4,71.2,'なつが とけても、きょうだけは とけないで。'],[74,79.6,'ゆびきり。ぜんぶ、ほんとうだよ。'],[84,89.8,'ふたりで あるいた あとに、はなが さいた。'],[99,104.6,'「まだ かえりたくない」って、きみが いうから。'],[106,112.4,'よるって、ふたりだと こんなに あかるい。'],[121.3,127.6,'いちばん おおきい はなびより、きみが まぶしかった。'],[131.6,137.8,'ランタンに、ねがいごとを ひとつずつ。'],[139,145.4,'ウチのは、ないしょ。……もう、かなってるから。'],[147,152.6,'ね、きづいてた？'],[153.4,159.4,'あの しょうたいじょう、ウチが かいたんだよ。'],[160.2,165.4,'きみと あそびたかった。それだけ。'],[166.2,169.7,'また、あそぼ。']];
const NARR_Y_P=[331,331,356,711,696,731,376,376,356,211,211,186,301,301,301,301,301,301];
function narrY(i,night){if(!L.land)return NARR_Y_P[i];return night?64:44}
function narrate(t,night){NARR.forEach(([start,end,txt2],i)=>{if(t<start||t>=end)return;
 const a=smooth((t-start)/.5)*smooth((end-t)/.5);if(a<=0)return;
 let size=(i===17?26:i===14||i===16?21:20);
 d.font=size+'px DotGothic16,monospace';
 const maxw=L.land?620:468;
 while(size>14&&d.measureText(txt2).width>maxw){size--;d.font=size+'px DotGothic16,monospace'}
 const wd=d.measureText(txt2).width,yy=narrY(i,night)+(1-a)*8;
 const pill=night?[58,51,90]:[255,252,246];
 rrect(L.cx-wd/2-13,yy-16,L.cx+wd/2+13,yy+16,13,css(pill));
 text(txt2,L.cx,yy,size,night?mix(pill,[255,240,228],a):mix(pill,INK,a))})}
function wrap(s,size,maxw){d.font=size+'px DotGothic16,monospace';
 if(d.measureText(s).width<=maxw)return[s];
 const tokens=s.includes(' ')?s.split(' '):[...s],sep=s.includes(' ')?' ':'';
 const lines=[];let cur='';
 for(const w2 of tokens){const test=cur?cur+sep+w2:w2;
  if(d.measureText(test).width>maxw&&cur){lines.push(cur);cur=w2}else cur=test}
 if(cur)lines.push(cur);return lines}
/* ── フレーム合成 ── */
let PULSE=[];
function draw(ctx,tRaw,landscape){
 d=ctx;const t=clip(tRaw,0,DUR-1/30);
 const land=!!landscape;
 L=land?{land:true,W:960,H:540,sw:960,sh:460,cx:480,stageY:0}
       :{land:false,W:540,H:960,sw:540,sh:620,cx:270,stageY:151};
 const idx=Math.min(PULSE.length-1,Math.max(0,Math.round(t*30)));
 const pulse=PULSE.length?PULSE[idx]/100:0;
 let theme,name;
 if(t<8.6){theme=0;name='envelope'}
 else if(t<24.3){theme=1;name='river'}
 else if(t<31.2667){theme=1;name='tickets'}
 else if(t<D1){theme=2;name='launch'}
 else if(t<45){theme=1;name='balloon'}
 else if(t<FLOW){theme=0;name='carousel'}
 else if(t<YATAI){theme=1;name='coaster'}
 else if(t<D2){theme=3;name='yatai'}
 else if(t<FERRIS){theme=1;name='garden'}
 else if(t<D3){theme=2;name='ferris'}
 else if(t<QUIET){theme=2;name='finale'}
 else{theme=4;name='starry'}
 const night=theme===4;
 // 背景
 const pairs=[[[255,246,231],[249,220,227]],[[244,252,242],[222,238,242]],[[255,246,241],[235,224,247]],[[255,245,221],[255,232,218]],[[58,50,88],[28,24,48]]];
 const[pa,pb]=pairs[theme%5],g=d.createLinearGradient(0,0,0,L.H);
 g.addColorStop(0,css(pa));g.addColorStop(.5,mix(pa,pb,.65));g.addColorStop(1,css(pa));
 d.fillStyle=g;d.fillRect(0,0,L.W,L.H);
 const active=['balloon','garden','finale'].includes(name)||(name==='coaster'&&t>=RISE)||(name==='yatai'&&t>=73.6)||(name==='ferris'&&t>=105.4);
 d.save();
 if(land){d.beginPath();d.rect(0,0,960,460);d.clip()}
 else{d.beginPath();d.roundRect(12,151,516,620,30);d.clip();d.translate(0,151)}
 if(active){const zoom=1.025+.04*pulse,rot=Math.sin(t*2.1)*(.5+.6*pulse)*Math.PI/180;
  d.translate(L.sw/2,L.sh/2);d.rotate(rot);d.scale(zoom,zoom);d.translate(-L.sw/2,-L.sh/2)}
 if(name==='envelope')envelopeScene(t,pulse);
 else if(name==='river')riverScene(t,pulse);
 else if(name==='tickets')ticketsScene(t,pulse);
 else if(name==='launch')launchScene(t,pulse);
 else if(name==='balloon')balloonScene(t,pulse);
 else if(name==='carousel')carouselScene(t,pulse);
 else if(name==='coaster')coasterScene(t,pulse);
 else if(name==='yatai')yataiScene(t,pulse);
 else if(name==='garden')gardenScene(t,pulse,t-D2);
 else if(name==='ferris')ferrisScene(t,pulse);
 else if(name==='finale')finaleScene(t,pulse,t-D3);
 else starryScene(t,pulse);
 d.restore();
 // Glitch（00:07.26〜）
 if(t>=7.8667&&t<8.25){const tmp=document.createElement('canvas');tmp.width=L.W;tmp.height=L.H;
  tmp.getContext('2d').drawImage(ctx.canvas,0,0);
  for(let k=0;k<6;k++){const gy=(land?40:211)+((k*173+Math.floor(t*30)*37)%(land?360:480)),sh2=Math.round(Math.sin(k*9+t*40)*38);
   d.drawImage(tmp,0,gy,L.W,8,sh2,gy,L.W,8);star(60+k*(land?160:85),(land?70:231)+(k%3)*(land?130:180),9,css(PAL[k%5]),t*7)}}
 // ふち飾り
 if(active){const edge=land?460:735;
  for(let k=0;k<30;k++){const a=t*.8+k*2.3,xx=12+((k*79+t*27)%(L.W-48));
   const yy=(k%2===0?(land?18:155+151):(land?edge-14:edge+151))+Math.sin(a)*(land?8:16);
   if(k%3===0)heart(xx,yy,7+(k%3)*2,css(PAL[k%5]));else star(xx,yy,5+(k%3),css(PAL[k%5]),a)}
  for(let k=0;k<12;k++){const x=k%2===0?14:L.W-14,y=(land?60:195+151)+Math.floor(k/2)*(land?65:105);
   heart(x+5*Math.sin(t*2+k),y,9+pulse*6,css(PAL[k%5]))}}
 // ヘッダ／字幕
 if(land){
  const hcol=night?'rgb(255,242,230)':css(INK);
  text('ウチら',56,22,20,hcol,'left');text('ひゅーまん',L.W-16,22,12,night?mix([255,242,230],NIGHT2,.35):mix(INK,PAPER,.28),'right');
  const cue=CUES.find(c=>t>=c[0]&&t<c[1]&&!OMIT.has(c[2]));
  rrect(30,466,930,528,14,'rgb(255,252,246)');
  if(cue){let size=24,lines=wrap(cue[2],24,860);
   lines.forEach((s,j)=>text(s,480,497+(j-(lines.length-1)/2)*26,size,css(INK)))}
  else if(name==='starry'&&t>=159.9)text('きょうも、ふたりぶん。',480,497,22,css(INK));
  else{flower(462,497,7,PINK,t*.4);flower(497,497,7,MINT,-t*.4)}
  narrate(t,night);
  text('ω',L.W-14,517,13,night?mix([255,242,230],NIGHT2,.35):mix(INK,PAPER,.4),'right');
 }else{
  const hcol=night?'rgb(255,242,230)':css(INK);
  text('ウチら',270,60,39,hcol);
  text('ひゅーまん',270,103,16,night?mix([255,242,230],NIGHT2,.35):mix(INK,PAPER,.28));
  rrect(31,789,509,898,18,'rgb(255,252,246)');
  const cue=CUES.find(c=>t>=c[0]&&t<c[1]&&!OMIT.has(c[2]));
  if(cue){let size=22,lines=wrap(cue[2],22,438);
   if(lines.length>2){size=20;lines=wrap(cue[2],20,438)}
   lines.forEach((s,j)=>text(s,270,842+(j-(lines.length-1)/2)*31,size,css(INK)))}
  else if(name==='starry'&&t>=159.9)text('きょうも、ふたりぶん。',270,842,23,css(INK));
  else{flower(253,844,8,PINK,t*.4);flower(287,844,8,MINT,-t*.4)}
  narrate(t,night);
  const fcol=night?mix([255,242,230],NIGHT2,.55):mix(INK,PAPER,.85);
  line([[34,922],[506,922]],fcol,1);
  const scol=night?mix([255,242,230],NIGHT2,.35):mix(INK,PAPER,.4);
  text('MUSIC / HYU-MAN',38,941,12,scol,'left');
  text('ω',504,941,15,scol,'right')}}
window.UchiraFilm={
 draw,duration:DUR,offset:0.04,
 async load(){const r=await fetch('./film-data.json');const j=await r.json();
  PULSE=j.pulse;CUES=j.cues;return true}
};
})();

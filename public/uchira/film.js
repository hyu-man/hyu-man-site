/* ウチら — きみと遊びたかった。それだけ。
   Python版（Master/MV/Uchira_halt_full_20260928_v1/render.py）の生JS移植。
   音源の再生位置だけが時計。描画は毎フレームこのファイルが行う。映像：ω */
(() => {
'use strict';
const TAU = Math.PI * 2;
const PAPER=[255,249,237], INK=[111,69,64], PINK=[247,131,167], BROWN=[156,91,78],
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
const noise=(i,j=0)=>{const v=Math.sin(i*127.1+j*311.7)*43758.5453;return v-Math.floor(v)};
let d=null; // 2D context（draw() のたびに束ねる）
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
/* Haltの子スプライト（3px/マス・中心(40,38)）を事前描画 */
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
function ribbonLine(t,y,w2,amp,col,phase){const pts=[];for(let x=-20;x<570;x+=8)pts.push([x,y+amp*Math.sin(x/88+t*1.5+phase)]);line(pts,col,w2)}
function burst(t,start,x,y,color,n=22,speed=120){const u=t-start;if(u<0||u>=2.7)return;const alpha=1-smooth(u-1.7);
 for(let k=0;k<n;k++){const a=TAU*k/n+.37*start,v=speed*(.7+.3*Math.sin(k*7.1)**2);
  const xx=x+Math.cos(a)*v*u,yy=y+Math.sin(a)*v*u+16*u*u,rr=(3+2*Math.sin(k*2.7)**2)*alpha;
  if(k%2===0)heart(xx,yy,rr*2.1,mix(PAPER,color,alpha));
  else if(k%3===0)star(xx,yy,rr*1.7,mix(PAPER,color,alpha),a+u);
  else ell(xx-rr,yy-rr,xx+rr,yy+rr,mix(PAPER,color,alpha))}}
function hanabi(t,start,x,y,color,big=1){const u=t-start;if(u<0||u>=3.2)return;
 if(u<.62){const yy=760-((760-y)*smooth(u/.62));line([[x,yy+16],[x,yy+44]],mix(color,PAPER,.45),3);star(x,yy,6,css(color),t*4)}
 else{const e=u-.62,fade=1-e/2.5;if(fade<=0)return;
  for(let k=0;k<20;k++){const a=TAU*k/20+start,v=(95+24*Math.sin(k*3.3))*big;
   const xx=x+Math.cos(a)*v*e,yy=y+Math.sin(a)*v*e+30*e*e,c=mix(PAPER,color,fade);
   if(k%2===0)heart(xx,yy,5+7*fade,c);else star(xx,yy,4+5*fade,c,a+e*3)}
  if(e<.5)ell(x-70*e-6,y-70*e-6,x+70*e+6,y+70*e+6,null,mix(color,PAPER,.35),3)}}
function heartRain(t,amount=24,ymin=20,ymax=590){for(let k=0;k<amount;k++){
 const xx=(k*167.31+Math.sin(t*.7+k*1.9)*26)%580-20, yy=ymin+((k*91.7+t*(34+k%7*6))%(ymax-ymin));
 heart(xx,yy,5+k%4*2,mix(PAL[k%5],PAPER,.18+.08*(k%3)))}}
function confetti(t,amount=65,ymin=15,ymax=600){for(let k=0;k<amount;k++){
 const xx=(k*137.77+Math.sin(t*.9+k)*34)%580-20, yy=ymin+((k*73.17+t*(27+k%8*3))%(ymax-ymin)), c=PAL[k%5];
 if(k%3===0)heart(xx,yy,7,css(c));
 else if(k%3===1)star(xx,yy,6,css(c),t+k);
 else{const a=t*2+k;line([[xx,yy],[xx+5*Math.cos(a),yy+5*Math.sin(a)]],css(c),3)}}}
function backdropFill(index){
 const pairs=[[[255,246,231],[249,220,227]],[[244,252,242],[222,238,242]],[[255,246,241],[235,224,247]],[[255,245,221],[255,232,218]],[[58,50,88],[28,24,48]]];
 const[a,b]=pairs[index%5],g=d.createLinearGradient(0,0,0,960);
 g.addColorStop(0,css(a));g.addColorStop(.5,mix(a,b,.65));g.addColorStop(1,css(a));
 d.fillStyle=g;d.fillRect(0,0,540,960)}
function stagebase(t,color,ground){F(0,0,540,620,css(color));
 for(let k=0;k<8;k++){const x=(k*143-t*(6+k%3*4))%700-80;cloud(x,55+(k%3)*91,30+(k%3)*9,mix(color,PAPER,.7))}
 for(let k=0;k<6;k++){const x=(k*181+t*(9+k%3*5))%640-50;heart(x,90+(k%3)*84+Math.sin(t*1.7+k)*9,6+k%3*2,mix(PAL[k%5],color,.45))}
 if(ground){ell(-160,455,420,850,mix(MINT,PAPER,.45));ell(160,465,750,850,mix(YELLOW,PAPER,.45))}}
function garland(t,y=75){const pts=[];for(let x=-20;x<561;x+=10)pts.push([x,y+40*Math.sin(Math.PI*x/540)]);line(pts,mix(INK,PAPER,.3),2);
 for(let k=0;k<13;k++){const x=k*45-10,yy=y+40*Math.sin(Math.PI*x/540),sway=Math.sin(t*2+k)*4;
  if(k%2===0)poly([[x-12,yy],[x+12,yy],[x+sway,yy+23]],css(PAL[k%5]));
  else heart(x+sway*.6,yy+14,10,css(PAL[k%5]))}}
function boat(x,y,s=1){poly([[x-95*s,y],[x+95*s,y],[x+56*s,y+42*s],[x-55*s,y+42*s]],css(PAPER));
 poly([[x-95*s,y],[x+10*s,y+15*s],[x+56*s,y+42*s],[x-55*s,y+42*s]],mix(PINK,PAPER,.66));
 line([[x-95*s,y],[x,y+22*s],[x+95*s,y]],mix(INK,PAPER,.55),2)}
/* ── 場面 ── */
function envelopeScene(t,pulse){stagebase(t,CREAM,true);const y=320;
 ell(140,448,403,475,mix(INK,CREAM,.85));rrect(125,y,415,y+147,10,css(PAPER));
 const opening=smooth((t-1.5)/2.1);
 poly([[125,y],[415,y],[270,y+90*(1-opening)-115*opening]],mix(PINK,PAPER,.62));
 if(t>1.5){kid(215,360-opening*123,120,0,t,1,Math.sin(t*2)*8);kid(327,360-opening*121,120,1,t,1,-Math.sin(t*2)*8)}
 poly([[125,y+8],[270,y+89],[415,y+8],[415,y+147],[125,y+147]],'rgb(255,253,247)');
 line([[125,y+147],[270,y+54],[415,y+147]],mix(PINK,PAPER,.4),2);
 heart(270,y+86,23,css(PINK));
 for(let k=0;k<24;k++){const u=clip((t-2.3-k*.055)/2.5);if(u>0){const a=TAU*k/24;
  if(k%2===0)heart(270+Math.cos(a)*185*u,330+Math.sin(a)*152*u-80*u,4+7*u,css(PAL[k%5]));
  else star(270+Math.cos(a)*180*u,330+Math.sin(a)*150*u-80*u,3+5*u,css(PAL[k%5]),t)}}
 heartRain(t,14,20,540);garland(t);text('ふたりぶん、ひらいた。',270,515,23,css(INK))}
function riverScene(t,pulse){const u=t-8.6;stagebase(t,mix(BLUE,PAPER,.75).match(/\d+/g).map(Number),false);
 for(let j=0;j<7;j++)ribbonLine(t*.6,415+j*22,14,20,mix([BLUE,MINT,PINK][j%3],PAPER,.45),j*.6);
 for(let k=0;k<12;k++){const xr=(k*83-t*22)%620-40,yr=445+(k%3)*45;
  if(k%2===0)flower(xr,yr,11,PAL[k%5],t*.2);else heart(xr,yr,9,mix(PAL[k%5],PAPER,.15))}
 const x=270+Math.sin(u*.8)*55,y=310+Math.sin(u*2.2)*12;
 if(t<16+13/30){const angle=Math.sin(u*1.8)*9;
  for(let k=0;k<6;k++){const wx=x-60-k*26,wy=y+42+Math.sin(t*3+k)*6;if(wx>0)star(wx,wy,4+2*Math.sin(t*4+k)**2,mix(BLUE,PAPER,.15),t+k)}
  kid(x-43,y-18,118,0,t,1,angle);kid(x+43,y-18,118,1,t,1,angle);boat(x,y+23,1.3)}
 else{for(let j=0;j<5;j++){d.strokeStyle=css(PAL[j]);d.lineWidth=8;d.beginPath();d.ellipse(270,385,(500-j*20)/2,(450-j*20)/2,0,Math.PI,TAU);d.stroke()}
  kid(190+Math.sin(t)*20,300,140,0,t,1,-10);kid(350+Math.sin(t+1)*20,300,140,1,t,1,10);
  line([[219,318],[258,370]],css(INK),5);line([[322,318],[283,369]],css(INK),5);
  ell(246,351,270,378,css(PINK));ell(275,351,297,378,css(MINT));
  heart(270,226,26+11*pulse,css(PINK));
  for(let k=0;k<7;k++){const a=Math.PI+Math.PI*(k+1)/8;heart(270+238*Math.cos(a),385+218*Math.sin(a),8+3*Math.sin(t*2+k),css(PAL[k%5]))}
  heartRain(u,12,60,420)}}
function ticketsScene(t,pulse){stagebase(t,mix(MINT,PAPER,.73).match(/\d+/g).map(Number),true);garland(t,85);
 const beam=Math.sin(t*1.4)*160;
 for(const[bx,ph]of[[120,0],[420,Math.PI]])poly([[bx,560],[bx+beam*Math.cos(ph)-60,160],[bx+beam*Math.cos(ph)+60,160]],mix(YELLOW,PAPER,.8));
 [[167,BLUE],[373,PINK]].forEach(([x,c],k)=>{const yy=210+Math.sin(t*2+k)*12;
  rrect(x-68,yy,x+68,yy+85,12,mix(c,PAPER,.5),css(c),2);
  text('あそぼ',x,yy+31,25,css(INK));heart(x,yy+62,12,css(c));
  for(const[hx,hy]of[[x-55,yy+13],[x+55,yy+13],[x-55,yy+70],[x+55,yy+70]])heart(hx,hy,6,mix(c,INK,.15));
  kid(x,366,150,k,t,1,Math.sin(t*2+k)*6)});
 line([[210,345],[270,320],[330,345]],css(INK),3);
 if(t<28.2)text('ふたりなら、どこまでも。',270,495,22,css(INK));
 else text('きっぷは、はじめから にまいぶん。',270,495,21,css(INK));
 for(let k=0;k<11;k++)star(30+k*49,155+14*Math.sin(t+k),6,css(PAL[k%5]),t);
 for(let k=0;k<8;k++){const yy=560-((t*38+k*61)%400),xx=k%2===0?28:512;heart(xx+Math.sin(t*2+k)*7,yy,7+k%3*2,css(PAL[k%5]))}}
function launchScene(t,pulse){stagebase(t,mix(LILAC,PAPER,.75).match(/\d+/g).map(Number),false);
 const power=smooth((t-31.25)/4.5),ring=(t*90)%140;
 ell(270-ring-40,430-ring*.6-25,270+ring+40,430+ring*.6+25,null,mix(PINK,PAPER,.5),3);
 PAL.forEach((c,k)=>{const x=90+k*90,y=210-power*60+Math.sin(t*3+k)*10;
  if(k%2===0)heart(x,y,34,css(c));else ell(x-28,y-35,x+28,y+35,css(c));
  curve([[x,y+34],[x+20,360],[260,300],[270,415]],mix(c,INK,.3),2)});
 heartRain(t,10,60,520);
 kid(225,400+power*18,115,0,t,0,-8*power);kid(315,400+power*18,115,1,t,0,8*power);boat(270,445,1.3);
 for(let j=0;j<7;j++){const x=75+j*65;line([[x,575],[x+Math.sin(t*4+j)*10,575-power*110]],css(PAL[j%5]),3)}}
function balloonScene(t,pulse){const u=t-D1;stagebase(t,mix(BLUE,PAPER,.72).match(/\d+/g).map(Number),false);
 const fly=smooth(u/1.1),cx=270+40*Math.sin(u*1.8),cy=ease(530,360,fly);
 PAL.forEach((c,j)=>{const xx=cx+(j-2)*43,yy=125+18*Math.abs(j-2)+Math.sin(t*2+j)*8;
  if(j%2===0)heart(xx,yy,40,css(c));else ell(xx-29,yy-42,xx+29,yy+42,css(c));
  line([[xx,yy+40],[cx+(j-2)*21,cy+20]],mix(c,INK,.25),2)});
 const gust=Math.sin(Math.PI*clip((u-1.8)/3.8));
 const x1=cx-43,y1=cy-25,x2=cx+43+gust*180,y2=cy-25-gust*150;
 curve([[x1+25,y1+25],[x1+45,y1+80],[x2-30,y2+100],[x2,y2+25]],css(PINK),4);
 kid(x1,y1,116,0,t,1,-8*gust);kid(x2,y2,116,1,t,1,25*gust);boat(cx,cy+18,1.23);
 if(u>5.6)heart(cx,cy-115,30+8*pulse,css(PINK));
 for(let k=0;k<5;k++){const gu=clip((u-1.8-k*.22)/3.8);
  if(gu>0&&gu<1)heart(x1+(x2-x1)*(1-gu*.2)-k*26*gust,y1+(y2-y1)*(1-gu*.2)+22*k*gust,7+k*2,mix(PINK,PAPER,.15+.13*k))}
 for(let j=0;j<9;j++)burst(t,D1+j*.6,70+(j*87)%400,200+(j%3)*95,PAL[j%5],28,115);
 heartRain(t,20);confetti(t,90)}
function carouselScene(t,pulse){const u=t-45;stagebase(t,mix(PINK,PAPER,.83).match(/\d+/g).map(Number),false);
 const cx=270,cy=345;
 PAL.forEach((c,j)=>{d.strokeStyle=css(c);d.lineWidth=7;d.beginPath();d.ellipse(cx,cy-15+2*j,215-j*8,165-j*7,0,Math.PI,TAU);d.stroke()});
 poly([[270,175],[86,266],[455,266]],mix(PINK,PAPER,.25));
 for(let j=0;j<8;j++)poly([[270,175],[86+j*46,266],[86+(j+1)*46,266]],mix(PAL[j%5],PAPER,.2));
 for(let j=0;j<14;j++){const bx=86+j*28,on=(Math.floor(t*6)+j)%3===0;ell(bx-5,258,bx+5,268,on?css(PAL[j%5]):mix(PAL[j%5],PAPER,.7))}
 star(270,163,25,css(YELLOW),t*.4);line([[270,263],[270,451]],css(INK),7);
 const objects=[];for(let k=0;k<6;k++){const a=u*.85+TAU*k/6;objects.push([cy+58*Math.sin(a),cx+175*Math.cos(a),k,a])}
 objects.sort((p,q)=>p[0]-q[0]);
 for(const[yy,xx,k,a]of objects){line([[xx,264],[xx,yy+38]],mix(INK,PAPER,.55),3);
  ell(xx-37,yy+27,xx+37,yy+45,css(PAL[k%5]));
  if(k===0||k===3)kid(xx,yy-8,105,Math.floor(k/3),t,1,-Math.cos(a)*8);
  else if(k%2)heart(xx,yy-6,17,css(PAL[k%5]));
  else flower(xx,yy,19,PAL[k%5],a)}
 ell(86,437,455,495,mix(LILAC,PAPER,.3));ell(86,430,455,478,mix(LILAC,PAPER,.65));
 for(let k=0;k<9;k++){const a=t*.9+TAU*k/9;heart(270+236*Math.cos(a),330+205*Math.sin(a),8+3*Math.sin(t*3+k),css(PAL[k%5]))}
 hanabi(t,48.2,90,170,MINT,.6);confetti(t,100)}
function coasterScene(t,pulse){const u=t-FLOW;stagebase(t,mix(MINT,PAPER,.8).match(/\d+/g).map(Number),false);
 const lift=smooth((t-RISE)/4);
 for(let k=0;k<6;k++){const x=(k*180-u*(50+lift*45))%950-180;
  F(x,440,115,105,mix(PAL[k%5],PAPER,.5));poly([[x-10,440],[x+57,380],[x+125,440]],css(PAL[(k+1)%5]));heart(x+58,479,20,css(PAPER))}
 for(let k=0;k<4;k++){const px=(k*260-u*(50+lift*45))%950-140,py=395;
  line([[px,py],[px,py+50]],mix(INK,PAPER,.5),3);
  for(let j=0;j<4;j++){const aa=t*(3+lift*3)+j*TAU/4+k;heart(px+16*Math.cos(aa),py+16*Math.sin(aa),8,css(PAL[(j+k)%5]))}}
 if(lift>0){for(let k=0;k<8;k++){const yy=200+k*58,ln=40+lift*70,xx=(k*151-u*300)%700-80;line([[xx,yy],[xx+ln,yy]],mix(PAL[k%5],PAPER,.55),3)}
  hanabi(t,60.4,110,170,PINK,.7);hanabi(t,62.8,430,150,LILAC,.7)}
 PAL.forEach((c,j)=>{d.strokeStyle=mix(c,PAPER,.22);d.lineWidth=4;d.beginPath();d.ellipse(270,310,170+j*6,155+j*6,0,0,TAU);d.stroke()});
 const a=u*(1.1+lift*.35),x=270+165*Math.cos(a),y=310+150*Math.sin(a);
 for(let k=1;k<5;k++){const ta=a-k*.16;heart(270+165*Math.cos(ta),310+150*Math.sin(ta)+18,6+k,mix(PINK,PAPER,.12*k+.1))}
 kid(x-28,y-20,105,0,t,1,Math.sin(a)*18);kid(x+28,y-20,105,1,t,1,Math.sin(a)*18);boat(x,y+22,.8);
 for(let k=0;k<6;k++)burst(t,58.4+k*1.15,80+k*88,128+(k%2)*52,PAL[k%5],34,115);
 heartRain(u,14);confetti(t,85)}
function yataiScene(t,pulse){const u=t-YATAI;stagebase(t,mix(YELLOW,PAPER,.68).match(/\d+/g).map(Number),true);
 const melt=smooth(u/5.5);
 const pts=[];for(let x=-20;x<561;x+=10)pts.push([x,142+22*Math.sin(Math.PI*x/540)]);line(pts,mix(INK,PAPER,.35),2);
 for(let k=0;k<7;k++){const x=k*82+15,yy=142+22*Math.sin(Math.PI*x/540),sway=Math.sin(t*1.6+k)*5;
  ell(x-26+sway,yy+4,x+26+sway,yy+56,mix(PAL[k%5],PAPER,.7));
  rrect(x-17+sway,yy+8,x+17+sway,yy+50,8,css(PAL[k%5]));F(x-8+sway,yy+2,16,6,css(INK));heart(x+sway,yy+29,8,css(PAPER))}
 F(40,300,195,155,mix(CREAM,PAPER,.3));
 for(let k=0;k<7;k++)poly([[40+k*28,268],[68+k*28,268],[68+k*28,302],[40+k*28,302]],k%2?css(PINK):css(PAPER));
 F(40,262,195,10,mix(INK,PAPER,.4));F(40,390,195,10,mix(INK,PAPER,.55));
 text('かき氷',137,340,20,mix(INK,PAPER,.15));
 const gx=137,gy=470;
 poly([[gx-42,gy],[gx+42,gy],[gx+26,gy+40],[gx-26,gy+40]],mix(BLUE,PAPER,.6));
 ell(gx-40,gy-52,gx+40,gy+8,css(PAPER));
 for(let k=0;k<3;k++){const drip=melt*(18+k*9),sx=gx-22+k*22;
  poly([[sx-7,gy-20],[sx+7,gy-20],[sx+3,gy-20+drip],[sx-3,gy-20+drip]],mix(k%2?MINT:PINK,PAPER,.25))}
 ell(gx-34,gy-58,gx+34,gy-18,mix(PINK,PAPER,.35));
 for(let k=0;k<4;k++){const yy=560+k*14,hp=[];for(let x=20;x<521;x+=12)hp.push([x,yy+3*Math.sin(x/28+t*4+k)]);line(hp,mix(YELLOW,PAPER,.62),2)}
 let kx0,kx1;
 if(u<7.7){kx0=320;kx1=440}else{const q=smooth((u-7.7)/1.6);kx0=ease(320,238,q);kx1=ease(440,318,q)}
 kid(kx0,455,132,0,t,(u>7.7&&u<16)?1:0,-4);kid(kx1,455,132,1,t,(u>7.7&&u<16)?1:0,4);
 if(u>=3.8&&u<7.7){const q=smooth((u-3.8)/2.6),px=380+18*Math.sin(u*2),py=ease(120,352,q);
  for(let k=0;k<5;k++){const a=Math.PI+k*Math.PI/5,seg=[[px,py-28]];
   for(let s2=0;s2<6;s2++){const v=a+Math.PI/5*s2/5;seg.push([px+52*Math.cos(v),py-28+34*Math.sin(v)])}
   poly(seg,mix(PAL[k%5],PAPER,.3))}
  line([[px-40,py-16],[px-9,py+14]],mix(INK,PAPER,.5),2);line([[px+40,py-16],[px+9,py+14]],mix(INK,PAPER,.5),2);
  F(px-26,py+8,52,34,css(PAPER));line([[px-26,py+8],[px,py+28],[px+26,py+8]],mix(PINK,PAPER,.4),2);heart(px,py+26,10,css(PINK))}
 if(u>=7.7){const hy=430;
  curve([[kx0+34,hy],[kx0+52,hy-26],[kx1-52,hy-26],[kx1-34,hy]],css(PINK),4);
  heart((kx0+kx1)/2,300-14*Math.sin(t*2),26+12*pulse,css(PINK));
  for(let k=0;k<6;k++){const hu=(u*.6+k*.31)%1.2;heart((kx0+kx1)/2+Math.sin(t*2+k*2.2)*34,392-hu*120,4+5*hu,mix(PINK,PAPER,.2+.5*hu))}
  for(let k=0;k<8;k++){const a=t*1.3+k*TAU/8;star((kx0+kx1)/2+120*Math.cos(a),330+80*Math.sin(a),5+3*pulse,css(PAL[k%5]),a)}}
 heartRain(u,10,60,420);confetti(t,45)}
function gardenScene(t,pulse,local){stagebase(t,mix(YELLOW,PAPER,.83).match(/\d+/g).map(Number),true);garland(t,42);
 for(let k=0;k<12;k++){const x=35+k*45,grow=smooth((local-k*.19)/1.4);
  const height=(100+90*Math.sin(k*1.7)**2)*grow,y=530-height;
  curve([[x,570],[x-20,530],[x+12,y+55],[x,y]],css(MINT),5);ell(x-15,y+58,x+4,y+70,css(MINT));
  if(k%3===2)heart(x,y,20*grow,css(PAL[k%5]));else flower(x,y,23*grow,PAL[k%5],t*.4+k)}
 for(let k=0;k<16;k++){const px=(k*127+local*60)%600-30,py=(k*67.7+local*(60+k%5*14))%560+40;
  ell(px-5,py-3,px+5,py+3,mix(PAL[k%5],PAPER,.3))}
 const hop=Math.abs(Math.sin(local*2.7)),x=270+95*Math.sin(local*.8);
 kid(x-53,300-hop*50,140,0,t,1,-12*Math.sin(local*2.7));kid(x+53,300-hop*50,140,1,t,1,12*Math.sin(local*2.7));
 curve([[x-28,318-hop*50],[x-10,350-hop*50],[x+10,350-hop*50],[x+27,318-hop*50]],css(PINK),4);
 for(let k=0;k<12;k++){const a=t*.7+k*TAU/12;
  if(k%2===0)heart(270+222*Math.cos(a),310+222*Math.sin(a),10,css(PAL[k%5]));
  else star(270+220*Math.cos(a),310+220*Math.sin(a),9,css(PAL[k%5]),a)}
 const pop=clip(Math.sin(local*2.7));
 if(pop>.82)for(let k=0;k<6;k++)heart(x+(k-2.5)*34,352+18*(1-pop),6+3*(pop-.82)/.18,mix(PINK,PAPER,.2));
 for(let k=0;k<7;k++)burst(local,k*2.15,70+(k*97)%400,270+(k%3)*85,PAL[k%5],22,85);
 heartRain(local,10,60,300)}
function ferrisScene(t,pulse){const u=t-FERRIS,dusk=smooth(u/13);
 const base=mix(mix(YELLOW,PINK,.45).match(/\d+/g).map(Number),[88,68,112],dusk*.6).match(/\d+/g).map(Number);
 stagebase(t,base,false);
 ell(60,120-dusk*60,150,210-dusk*60,mix(YELLOW,PINK,.3));
 for(let k=0;k<6;k++){const x=k*95-10;
  F(x,520,70,65,mix(PAL[k%5],base,.5));poly([[x-6,520],[x+35,492],[x+76,520]],mix(PAL[(k+2)%5],base,.3));
  const on=(Math.floor(t*5)+k)%2;ell(x+28,545,x+42,559,on?css(YELLOW):mix(YELLOW,base,.6))}
 const cx=270,cy=308,R=168;
 line([[cx-95,585],[cx,cy],[cx+95,585]],mix(INK,PAPER,.35),7);
 [[PINK,0],[LILAC,10]].forEach(([c,off])=>{d.strokeStyle=mix(c,PAPER,.25);d.lineWidth=5;d.beginPath();d.arc(cx,cy,R-off,0,TAU);d.stroke()});
 for(let k=0;k<8;k++){const a=u*.4+TAU*k/8;line([[cx,cy],[cx+R*Math.cos(a),cy+R*Math.sin(a)]],mix(INK,PAPER,.6),2)}
 star(cx,cy,16,css(YELLOW),t*.5);
 let ride=null;
 for(let k=0;k<8;k++){const a=u*.4+TAU*k/8,gx=cx+R*Math.cos(a),gy=cy+R*Math.sin(a)+14;
  if(k===0)ride=[gx,gy];else heart(gx,gy+6*Math.sin(t*2+k),22,css(PAL[k%5]))}
 for(let k=0;k<10;k++){const sx=(k*127+u*8)%560-10,sy=110+(k*53)%180;star(sx,sy,3+2*Math.sin(t*2+k)**2,mix(PAPER,base,.25),t+k)}
 if(u>7.3){hanabi(t,FERRIS+7.4,120,205,PINK,.75);hanabi(t,FERRIS+9.6,432,180,MINT,.75);
  hanabi(t,FERRIS+11.7,270,150,LILAC,.9);hanabi(t,FERRIS+13.4,90,230,YELLOW,.75)}
 const[gx,gy]=ride;
 rrect(gx-52,gy-8,gx+52,gy+40,14,mix(PINK,PAPER,.45),css(PINK),2);
 kid(gx-24,gy-4,88,0,t,1,Math.sin(u)*5);kid(gx+24,gy-4,88,1,t,1,-Math.sin(u)*5);
 heart(gx,gy-46,13+7*pulse,css(PINK));
 heartRain(u,8,60,300);confetti(t,40)}
function finaleScene(t,pulse,local){stagebase(t,mix(LILAC,PAPER,.86).match(/\d+/g).map(Number),false);
 const cx=270,cy=270;
 for(let j=0;j<12;j++){const a=t*.3+j*TAU/12;
  poly([[cx,cy+40],[cx+700*Math.cos(a),cy+40+700*Math.sin(a)],[cx+700*Math.cos(a+.13),cy+40+700*Math.sin(a+.13)]],mix(PAL[j%5],PAPER,.8))}
 const size=1+.12*pulse;
 heart(270,238-175*size+Math.sin(t*2)*4,24+10*pulse,css(PINK));
 for(let j=0;j<10;j++){const a=Math.PI+j*Math.PI/10,b=Math.PI+(j+1)*Math.PI/10,seg=[[cx,cy+40]];
  for(let s2=0;s2<10;s2++){const v=a+(b-a)*s2/9;seg.push([cx+235*size*Math.cos(v),cy+175*size*Math.sin(v)])}
  poly(seg,mix(PAL[j%5],PAPER,.17))}
 for(let j=0;j<9;j++){const a=Math.PI+(j+.5)*Math.PI/9;
  heart(cx+235*size*Math.cos(a),cy+175*size*Math.sin(a)+16+3*Math.sin(t*3+j),9,css(PAL[j%5]))}
 line([[270,257],[270,433]],css(INK),5);
 d.strokeStyle=css(INK);d.lineWidth=5;d.beginPath();d.arc(287,430,17,0,Math.PI);d.stroke();
 for(let j=0;j<11;j++)poly([[270,460],[j*54-40,618],[(j+1)*54-40,618]],mix(PAL[j%5],PAPER,.64));
 const hop=Math.abs(Math.sin(local*3.2))*30,xx=72+18*Math.sin(local*.65);
 kid(270-xx,405-hop,155,0,t,1,-8*Math.sin(local*3.2));kid(270+xx,405-hop,155,1,t,1,8*Math.sin(local*3.2));
 heart(270,328,19+9*pulse,css(PINK));
 const CH=[0,2.567,4.2,6.433,8.167,10.3,11.9,14.2],SP=[[140,190],[420,160],[270,130],[90,220],[460,200],[180,150],[360,170],[270,190]];
 for(let k=0;k<8;k++)hanabi(local,CH[k]+.15,SP[k][0],SP[k][1],PAL[k%5],1.15);
 for(let k=0;k<16;k++)burst(local,k*.95,45+(k*151)%450,130+(k%4)*105,PAL[k%5],38,130);
 heartRain(local,28);confetti(t,140)}
function starryScene(t,pulse){const u=t-QUIET;
 F(0,0,540,620,mix(NIGHT,NIGHT2,smooth(u/6)));
 for(let k=0;k<46;k++){const sx=(k*118.7)%540,sy=(k*61.3)%420,tw=.5+.5*Math.sin(t*1.5+k*2.2);
  const c=mix(NIGHT,PAPER,.25+.45*tw);F(sx,sy,1,1,c);if(k%6===0)star(sx,sy,2+2*tw,c,k)}
 heart(432,120,30,css(MOONPINK));ell(392,84,478,166,null,mix(MOONPINK,NIGHT,.55),2);
 for(let k=0;k<8;k++){const fx=70+Math.sin(u*.5+k*2.3)*60+k*52,fy=360+Math.sin(u*.8+k*1.7)*46,gl=.5+.5*Math.sin(t*3+k);
  ell(fx-2,fy-2,fx+2,fy+2,mix(NIGHT,mix(MINT,YELLOW,.5).match(/\d+/g).map(Number),.35+.55*gl))}
 ell(-160,470,420,860,mix(MINT,NIGHT,.62));ell(160,480,750,860,mix(MINT,NIGHT,.68));
 poly([[150,470],[390,470],[438,575],[102,575]],mix(PINK,NIGHT,.35));
 for(let k=0;k<6;k++)line([[155+k*40,474],[122+k*52,570]],mix(PAPER,NIGHT,.55),2);
 for(let k=0;k<4;k++)line([[148-k*10,483+k*22],[392+k*10,483+k*22]],mix(PAPER,NIGHT,.55),2);
 ell(240,388,300,448,mix(YELLOW,NIGHT,.5));rrect(258,398,282,440,7,mix(YELLOW,NIGHT,.15));heart(270,417,7,mix(PINK,NIGHT,.1));
 const walk=smooth(u/6),sleep=t>=158.733;
 const kx0=ease(120,206,walk),kx1=ease(180,334,walk),lean=smooth((u-22)/4)*7;
 kid(kx0,432,128,0,t,0,lean,sleep);kid(kx1,432,128,1,t,0,-lean,sleep);
 for(let k=0;k<8;k++){const lu=u-6.2-k*1.1-(k*37%7)*.5;if(lu<0)continue;
  const ly=560-lu*(20+(k*29%5)*3);const lx=60+(k*173%420)+Math.sin(lu*.8+k)*17;
  if(ly<70)continue;
  ell(lx-22,ly-24,lx+22,ly+28,mix(NIGHT,YELLOW,.18));
  rrect(lx-13,ly-16,lx+13,ly+18,6,mix(YELLOW,PINK,.25));
  heart(lx,ly+1,8,mix(PINK,PAPER,.2));F(lx-6,ly+18,12,4,mix(INK,NIGHT,.4))}
 for(const[st,sx,sy]of[[12.5,120,110],[17.2,400,90],[24.8,250,130],[31.5,460,120]]){const su=u-st;
  if(su>=0&&su<.7){const ex=sx+su*300,ey=sy+su*120;line([[sx,sy],[ex,ey]],mix(PAPER,NIGHT,.25),2);star(ex,ey,5,css(PAPER),su*8)}}
 if(sleep)for(let k=0;k<2;k++){const hu=(u*.4+k*.5)%1;
  heart(kx0+40+k*8,392-hu*60,3+3*hu,mix(PINK,NIGHT,.25+.5*hu));heart(kx1+40+k*8,392-hu*60,3+3*hu,mix(PINK,NIGHT,.25+.5*hu))}
 if(t>=163.8)text('また、あそぼ。',270,150,30,mix(PAPER,NIGHT,.12))}
/* ── 字幕・語り ── */
const OMIT=new Set(['I want to make it like I was never born','"ウチら" って言ってたの','ウチだけ']);
let CUES=[];
const NARR=[[0.3,4,331,20,'あのひ、ポストに とどいたんだ。'],[4.9,8.4,331,20,'まほうみたいな、しょうたいじょう。'],[10,15.6,356,20,'せかいが、ふたりぶんに なった。'],[18.2,23.6,711,19,'きみが わらうから、せかいに いろが ついたんだよ。'],[46,50.8,696,20,'まわって、わらって、きょうが すき。'],[53.2,58.4,731,20,'こわくない。となりに きみが いる。'],[66.4,71.2,376,20,'なつが とけても、きょうだけは とけないで。'],[74,79.6,376,20,'ゆびきり。ぜんぶ、ほんとうだよ。'],[84,89.8,356,20,'ふたりで あるいた あとに、はなが さいた。'],[99,104.6,211,19,'「まだ かえりたくない」って、きみが いうから。'],[106,112.4,211,20,'よるって、ふたりだと こんなに あかるい。'],[121.3,127.6,186,19,'いちばん おおきい はなびより、きみが まぶしかった。'],[131.6,137.8,301,20,'ランタンに、ねがいごとを ひとつずつ。'],[139,145.4,301,20,'ウチのは、ないしょ。……もう、かなってるから。'],[147,152.6,301,21,'ね、きづいてた？'],[153.4,159.4,301,20,'あの しょうたいじょう、ウチが かいたんだよ。'],[160.2,165.4,301,21,'きみと あそびたかった。それだけ。'],[166.2,169.7,301,26,'また、あそぼ。']];
function narrate(t,night){for(const[start,end,y,size0,txt2]of NARR){if(t<start||t>=end)continue;
 const a=smooth((t-start)/.5)*smooth((end-t)/.5);if(a<=0)continue;
 let size=size0;d.font=size+'px DotGothic16,monospace';
 while(size>14&&d.measureText(txt2).width>468){size--;d.font=size+'px DotGothic16,monospace'}
 const wd=d.measureText(txt2).width,yy=y+(1-a)*8;
 const pill=night?[58,51,90]:[255,252,246];
 rrect(270-wd/2-13,yy-16,270+wd/2+13,yy+16,13,css(pill));
 text(txt2,270,yy,size,night?mix(pill,[255,240,228],a):mix(pill,INK,a))}}
function wrap(s,size,maxw){d.font=size+'px DotGothic16,monospace';
 if(d.measureText(s).width<=maxw)return[s];
 const tokens=s.includes(' ')?s.split(' '):[...s],sep=s.includes(' ')?' ':'';
 const lines=[];let cur='';
 for(const w2 of tokens){const test=cur?cur+sep+w2:w2;
  if(d.measureText(test).width>maxw&&cur){lines.push(cur);cur=w2}else cur=test}
 if(cur)lines.push(cur);return lines}
/* ── フレーム合成 ── */
let PULSE=[];
function draw(ctx,tRaw,ready){
 d=ctx;const t=clip(tRaw,0,DUR-1/30);
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
 backdropFill(theme);
 const active=['balloon','garden','finale'].includes(name)||(name==='coaster'&&t>=RISE)||(name==='yatai'&&t>=73.6)||(name==='ferris'&&t>=105.4);
 d.save();
 d.beginPath();d.roundRect(12,151,516,620,30);d.clip();
 d.translate(0,151);
 if(active){const zoom=1.025+.04*pulse,rot=Math.sin(t*2.1)*(.5+.6*pulse)*Math.PI/180;
  d.translate(270,310);d.rotate(rot);d.scale(zoom,zoom);d.translate(-270,-310)}
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
 if(t>=7.8667&&t<8.25){const tmp=document.createElement('canvas');tmp.width=540;tmp.height=960;
  tmp.getContext('2d').drawImage(ctx.canvas,0,0);
  for(let k=0;k<6;k++){const gy=60+((k*173+Math.floor(t*30)*37)%480)+151,sh=Math.round(Math.sin(k*9+t*40)*38);
   d.drawImage(tmp,0,gy,540,8,sh,gy,540,8);star(60+k*85,231+(k%3)*180,9,css(PAL[k%5]),t*7)}}
 if(active){for(let k=0;k<30;k++){const a=t*.8+k*2.3,xx=12+((k*79+t*27)%516);
   let yy=(k%2===0?155:735)+Math.sin(a)*16+151-151;yy=(k%2===0?155:735)+Math.sin(a)*16;
   yy+=151;
   if(k%3===0)heart(xx,yy,7+(k%3)*2,css(PAL[k%5]));else star(xx,yy,5+(k%3),css(PAL[k%5]),a)}
  for(let k=0;k<12;k++){const x=k%2===0?18:522,y=195+Math.floor(k/2)*105+151;
   heart(x+5*Math.sin(t*2+k),y,9+pulse*6,css(PAL[k%5]))}}
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
 text('ω',504,941,15,scol,'right')}
window.UchiraFilm={
 draw,duration:DUR,offset:0.04,
 async load(){const r=await fetch('./film-data.json');const j=await r.json();
  PULSE=j.pulse;CUES=j.cues;return true}
};
})();

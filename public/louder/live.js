const CREAM="#f7f0e4",INK="#8a3a2e",PINK="#ff638f",RED="#8a3a2e",MINT="#98cbb6",YELLOW="#ffe58b",BLUE="#a3c6f1",PURPLE="#463557",WHITE="#fffdf4",COLORS=["#ff638f", "#98cbb6", "#ffe58b", "#a3c6f1", "#e0c3ef"],DROPS=[40.63333333333333, 48.233333333333334, 70.86666666666666, 86.03333333333333, 101.26666666666667];
const data=await(await fetch("timeline.json")).json(),levels=data.levels,onsets=data.onsets,CUES=data.cues,TIMES=CUES.map(q=>q.time),DURATION=data.duration;
const SPRITES=["normal", "quiet", "jump", "ok"];
function pixelshape(b,x,y,r,rows,c){let row,unit,v,xx,yy;unit=((2*r)/len(rows[0]));
for(let [yy,row] of enumerate(rows)){for(let [xx,v] of enumerate(row)){if(((v==="1"))){b.box([((x-r)+(xx*unit)),((y-((len(rows)*unit)/2))+(yy*unit)),((x-r)+((xx+1)*unit)),((y-((len(rows)*unit)/2))+((yy+1)*unit))],c);}}}}
function heart(b,x,y,r,c){pixelshape(b,x,y,r,["0110110","1111111","1111111","0111110","0011100","0001000"],c);}
function star(b,x,y,r,c,spin=0){pixelshape(b,x,y,r,["0001000","0001000","0011100","1111111","0011100","0001000","0001000"],c);}
function speaker(b,x,y,amp,scale=1){let c,h,r,radius,w,yy;w=(115*scale);
h=(180*scale);
b.box([((x-(w/2))+6),((y-(h/2))+9),((x+(w/2))+6),((y+(h/2))+9)],INK);
b.box([(x-(w/2)),(y-(h/2)),(x+(w/2)),(y+(h/2))],MINT,INK,4);
for(let [yy,r] of [[(y-(46*scale)),(25*scale)],[(y+(28*scale)),((35+(amp*9))*scale)]]){for(let [radius,c] of [[r,INK],[(r*0.6),PINK],[(r*0.22),CREAM]]){b.poly([[(x-(radius*0.5)),(yy-radius)],[(x+(radius*0.5)),(yy-radius)],[(x+(radius*0.5)),(yy-(radius*0.5))],[(x+radius),(yy-(radius*0.5))],[(x+radius),(yy+(radius*0.5))],[(x+(radius*0.5)),(yy+(radius*0.5))],[(x+(radius*0.5)),(yy+radius)],[(x-(radius*0.5)),(yy+radius)],[(x-(radius*0.5)),(yy+(radius*0.5))],[(x-radius),(yy+(radius*0.5))],[(x-radius),(yy-(radius*0.5))],[(x-(radius*0.5)),(yy-(radius*0.5))]],c);}}}
function particles(b,t,count,pulse,origin=[640,350],burst=false){let a,j,r,rr,x,y;for(let j of range(count)){a=((j*2.39996)+(t*0.18));
if(burst){rr=(70+mod(((j*37)+(t*160)),670));
x=(origin[0]+(Math.cos(a)*rr));
y=(origin[1]+((Math.sin(a)*rr)*0.6));}else{x=(mod(((j*179)+(t*(17+(mod(j,4)*9)))),1400)-60);
y=(mod(((j*97)-(t*(20+(mod(j,5)*11)))),750)-30);}
r=((6+mod(j,13))+(((mod(j,3)===0))?(pulse*5):0));
if(((mod(j,3)===0))){heart(b,x,y,r,COLORS[mod(j,5)]);}else{if(((mod(j,3)===1))){star(b,x,y,r,COLORS[mod(j,5)],(t+j));}else{b.box([x,y,(x+(r*0.6)),(y+(r*1.5))],COLORS[mod(j,5)]);}}}}
function ease(a,b,t){let u;u=Math.max(0,Math.min(1,((t-a)/(b-a))));
return ((u*u)*(3-(2*u)));}
function ribbon(b,t,power){let a,j,k,pts,r,x,y;for(let j of range(12)){a=(((j*math.tau)/12)+(t*0.12));
pts=[];
for(let k of range(32)){r=(160+(k*20));
x=(640+(Math.cos((a+(k*0.025)))*r));
y=(330+((Math.sin((a+(k*0.025)))*r)*0.5));
pts.push([x,y]);}
b.line(pts,COLORS[mod(j,5)],(2+(power*2)));}}
function wheel(b,x,y,r,t){let a,j,xx,yy;for(let j of range(12)){a=((t*0.5)+((j*math.tau)/12));
xx=(x+(Math.cos(a)*r));
yy=(y+(Math.sin(a)*r));
b.line([[x,y],[xx,yy]],MINT,2);
b.box([(xx-19),(yy-13),(xx+19),(yy+13)],COLORS[mod(j,5)],INK,2);}
b.ellipse([(x-r),(y-r),(x+r),(y+r)],null,PINK,3);}
function fireworks(b,t,age,x,y){let a,j,rr,v,xx,yy;if((!((0<=age) && (age<2.7)))){return ;}
for(let j of range(30)){a=((j*math.tau)/30);
v=(100+(mod(j,4)*40));
rr=(20+(v*age));
xx=(x+(Math.cos(a)*rr));
yy=((y+((Math.sin(a)*rr)*0.65))+((age*age)*30));
if(mod(j,2)){heart(b,xx,yy,Math.max(2,(15-(age*3))),COLORS[mod(j,5)]);}else{star(b,xx,yy,Math.max(2,(15-(age*3))),COLORS[mod(j,5)]);}
b.line([[xx,yy],[(xx-(Math.cos(a)*16)),(yy-(Math.sin(a)*11))]],COLORS[mod(j,5)],2);}}
function subtitle(b,t,pulse){let age,ch,end,idx,j,n,q,s;idx=(bisect(TIMES,t)-1);
if(((idx<0))){return ;}
q=CUES[idx];
age=(t-q["time"]);
end=Math.min(((((idx+1)<len(TIMES)))?TIMES[(idx+1)]:DURATION),(q["time"]+(((idx===(len(CUES)-1)))?12.2:5)));
if(((t>=end))){return ;}
s=q["text"].replaceAll("⬆","↑").replaceAll("🔁","↻").replaceAll("✓","");
if(((s.includes("ok!")))){ok_face(b,578,634);
return ;}
if(s.startsWith("brain")){b.text([407,630],"brain",34);
for(let j of range(5)){b.box([(510+(j*40)),611,(537+(j*40)),646],(((j<3))?PINK:CREAM),INK,2);}
b.text([797,630],"60%",34);
return ;}
if(((s==="L  O  U  D  E  R"))){for(let [j,ch] of enumerate("LOUDER")){b.text([(160+(j*191)),(190+(Math.sin(((t*4)+j))*36))],ch,110,INK,false,"mm",2,CREAM);}
return ;}
n=(((len(s)>24))?36:47);
while(((font(n).getlength(s)>(1100*S)))){n-=1;}
b.text([640,634],s,n,INK,false,"mm",2,CREAM);
if(q["text"].startsWith("headphones")){b.line([[817,630],[826,641],[845,615]],INK,4);}}
function frame(i){let a,amp,b,current,dd,drop,j,off,pulse,rr,size,snap,t,u,wall,x,xx,y,yy;t=(i/FPS);
amp=Number(levels[i]);
pulse=Math.exp(((-(t-onsets[Math.max(0,(bisect(onsets,t)-1))]))*10));
b=new Board(CREAM);
off=(((57+(17/30))<=t) && (t<(67+(5/30))));
current=(((t<10.033))?"intro":(((t<23.466))?"room":(((t<36.366))?"controls":(((t<53.766))?"party":(((t<63.3))?"voice":(((t<67.166))?"quiet":(((t<70.866))?"build":(((t<101.266))?"park":(((t<116.3))?"final":"home")))))))));
wall=(((!["quiet","voice","home"].includes(current)))?"#fff0ed":CREAM);
b.box([110,75,1170,520],wall);
b.line([[110,75],[1170,75],[1170,520],[110,520],[110,75]],"#dfb9b0",2);
b.line([[110,520],[0,720]],"#dfb9b0",2);
b.line([[1170,520],[1280,720]],"#dfb9b0",2);
b.box([165,140,340,295],MINT,INK,2);
b.line([[252,140],[252,295]],CREAM,4);
b.line([[165,218],[340,218]],CREAM,4);
b.ellipse([425,469,855,539],"#e9ccc5");
b.box([973,381,1090,491],MINT,INK,3);
b.text([1032,403],"VOL",18);
b.line([[995,438],[1068,438]],INK,3);
b.box([1028,428,1036,448],PINK);
size=340;
x=640;
y=345;
drop=(((["party","park","final"].includes(current))) || DROPS.some(dd=>((0<=(t-dd)) && ((t-dd)<0.6))));
if(((current==="intro"))){size=(340+Math.trunc((45*ease(8.133,10.03,t))));
y=(350-(Math.abs(Math.sin((t*3)))*8));
for(let j of range(3)){u=ease((1+(j*1.6)),(3+(j*1.6)),t);
b.line([[290,(348+(j*12))],[(290+Math.trunc((700*u))),(348+(j*12))]],COLORS[j],3);}}else{if(((current==="room"))){speaker(b,280,399,amp,0.8);
speaker(b,1000,399,amp,0.8);
x=(640+(Math.sin((t*1.2))*70));
y=(351-(Math.abs(Math.sin((t*7)))*40));
particles(b,t,32,pulse);}else{if(((current==="controls"))){for(let j of range(3)){a=((t*0.65)+((j*math.tau)/3));
xx=(640+(Math.cos(a)*275));
yy=(327+(Math.sin(a)*110));
b.box([(xx-60),(yy-30),(xx+60),(yy+30)],COLORS[j],INK,2);
if(((j===0))){b.line([[(xx-17),yy],[(xx-3),(yy+12)],[(xx+20),(yy-17)]],INK,4);}else{b.text([xx,yy],["","↑↑","60%"][j],28);}}
x=(580+(Math.sin((t*1.4))*50));
y=(358-(Math.abs(Math.sin((t*6)))*22));
b.line([[(x+102),(y+30)],[1028,438]],INK,6);
particles(b,t,48,pulse);}else{if(((current==="party"))){ribbon(b,t,pulse);
speaker(b,205,400,amp,1.2);
speaker(b,1075,400,amp,1.2);
x=(640+(Math.sin((t*2))*125));
y=(335-(Math.abs(Math.sin((t*6)))*65));
size=380;
particles(b,t,90,pulse,[640,350],true);
if(((CUES[Math.max(0,(bisect(TIMES,t)-1))]["text"].includes("still here")))){x+=(30*Math.sin((t*18)));}}else{if(((current==="voice"))){if((!off)){particles(b,t,25,pulse);}else{b.line([[860,482],[860,443],[913,443],[913,482]],MINT,7);
b.box([853,476,867,505],MINT);
b.box([907,476,920,505],MINT);}
for(let j of range(3)){xx=(777+(j*75));
yy=(272+(j*45));
b.text([xx,yy],["i'm","still here","my voice"][j],22,"#b08786");}
b.line([[735,358],[764,345],[784,366],[804,350],[826,359]],PINK,3);
x=620;
y=358;
size=345;}else{if(((current==="quiet"))){x=620;
y=362;
size=345;
b.text([802,317],"my voice",24,"#b08786");
b.line([[740,353],[770,345],[791,359],[815,351]],PINK,2);}else{if(((current==="build"))){u=ease(67.166,70.866,t);
x=640;
y=(355-(u*40));
size=(345+Math.trunc((u*55)));
for(let j of range(9)){rr=(70+mod(((j*69)+(t*80)),680));
b.ellipse([(640-rr),(330-(rr*0.5)),(640+rr),(330+(rr*0.5))],null,COLORS[mod(j,5)],3);}
particles(b,t,Math.round((15+(u*80))),pulse);}else{if(((["park","final"].includes(current)))){b=new Board("#fff0ed");
ribbon(b,t,pulse);
wheel(b,270,285,160,t);
wheel(b,1010,285,160,(-t));
b.line([[60,540],[370,410],[640,520],[920,410],[1220,540]],MINT,10);
for(let j of range(3)){a=((t*0.8)+((j*math.tau)/3));
xx=(640+(Math.cos(a)*320));
yy=(270+(Math.sin(a)*155));
b.ellipse([(xx-38),(yy-38),(xx+38),(yy+38)],COLORS[j],INK,2);
b.ellipse([(xx-10),(yy-10),(xx+10),(yy+10)],CREAM);}
x=(640+(Math.sin((t*1.8))*115));
y=(342-(Math.abs(Math.sin((t*7)))*70));
size=(((current==="park"))?385:430);
particles(b,t,(((current==="park"))?105:145),pulse,[640,350],true);
b.box([(x+140),385,(x+315),455],CREAM,PINK,3);
b.poly([[(x+150),455],[(x+126),474],[(x+176),455]],CREAM);
b.text([(x+227),421],"my voice",24);
fireworks(b,t,mod((t-70.866),3),250,210);
fireworks(b,t,mod(((t-70.866)+1.3),3),1030,200);}else{if(((current==="home"))){x=640;
y=350;
size=340;
u=(1-ease(116.3,128,t));
particles(b,t,Math.trunc((u*70)),pulse);
for(let j of range(4)){heart(b,(492+(j*95)),495,12,COLORS[j]);}
b.text([840,335],"my voice",24,"#b08786");
b.line([[(x+105),(y+18)],[1030,438]],INK,5);
if(((t>=130.7))){drop=true;
y-=(Math.abs(Math.sin((t*4)))*20);}}}}}}}}}}
if((((23.466<=t) && (t<24.25)) || ((69.9<=t) && (t<70.866)) || ((84.2<=t) && (t<85.566)))){b=new Board(CREAM);
x=640;
y=348;
size=345;
drop=false;}
hero(b,x,y,size,t,(!off),drop);
for(let dd of DROPS){fireworks(b,t,(t-dd),640,335);}
if((((53.766<=t) && (t<54.7)) || ((68.966<=t) && (t<69.9)))){snap=b.im.copy();
for(let j of range(6)){yy=Math.round(((130+(j*68))*S));
b.im.paste(snap.crop([0,yy,W,(yy+Math.round((8*S)))]),[Math.round(((Math.sin(((t*20)+j))*24)*S)),yy]);}}
subtitle(b,t,pulse);
b.text([1200,691],"ひゅーまん",15,INK);
return b.im.convert("RGB");}

const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),audio=document.querySelector('audio');
const S=1,W=1280,H=720,FPS=30;const math={tau:Math.PI*2};
const enumerate=a=>Array.from(a,(v,i)=>[i,v]);
const mod=(a,b)=>((a%b)+b)%b,len=x=>x.length,range=(a,b,step=1)=>{if(b===undefined){b=a;a=0}return Array.from({length:Math.max(0,Math.ceil((b-a)/step))},(_,i)=>a+i*step)};
function bisect(a,x){let lo=0,hi=a.length;while(lo<hi){let m=(lo+hi)>>1;if(a[m]<=x)lo=m+1;else hi=m}return lo}
const font=(size)=>({getlength:s=>{ctx.font=`${size}px DotGothic16`;return ctx.measureText(s).width}});
class Board{
 constructor(w=1280,h=720,bg=CREAM){if(typeof w==='string')bg=w;ctx.fillStyle=bg;ctx.fillRect(0,0,1280,720);this.im={convert:()=>canvas,copy:()=>{const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;c.getContext('2d').drawImage(canvas,0,0);return {crop:r=>({c,r})}},paste:(snap,xy)=>{let k=canvas.width/1280,r=snap.r;ctx.drawImage(snap.c,r[0]*k,r[1]*k,(r[2]-r[0])*k,(r[3]-r[1])*k,xy[0],xy[1],r[2]-r[0],r[3]-r[1])}}}
 box(r,fill,outline=null,width=2,radius=0){ctx.beginPath();if(radius)ctx.roundRect(r[0],r[1],r[2]-r[0],r[3]-r[1],radius);else ctx.rect(r[0],r[1],r[2]-r[0],r[3]-r[1]);this.paint(fill,outline,width)}
 ellipse(r,fill,outline=null,width=2){ctx.beginPath();ctx.ellipse((r[0]+r[2])/2,(r[1]+r[3])/2,Math.max(0,(r[2]-r[0])/2),Math.max(0,(r[3]-r[1])/2),0,0,Math.PI*2);this.paint(fill,outline,width)}
 paint(fill,outline,width){if(fill){ctx.fillStyle=fill;ctx.fill()}if(outline){ctx.strokeStyle=outline;ctx.lineWidth=width;ctx.stroke()}}
 line(p,fill=INK,width=3){if(!p.length)return;ctx.beginPath();ctx.moveTo(...p[0]);for(let i=1;i<p.length;i++)ctx.lineTo(...p[i]);ctx.strokeStyle=fill;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke()}
 poly(p,fill,outline=null,width=2){ctx.beginPath();ctx.moveTo(...p[0]);for(let i=1;i<p.length;i++)ctx.lineTo(...p[i]);ctx.closePath();this.paint(fill,outline,width)}
 text(xy,text,size=24,color=INK,bold=false,anchor='mm',stroke=0,stroke_color=CREAM){ctx.font=`${size}px DotGothic16`;ctx.textAlign=anchor==='lm'?'left':'center';ctx.textBaseline='middle';if(stroke){ctx.strokeStyle=stroke_color;ctx.lineWidth=stroke*2;ctx.strokeText(text,...xy)}ctx.fillStyle=color;ctx.fillText(text,...xy)}
}
let sprites={};function hero(b,x,y,size,t,headphones=true,drop=false){let state=drop?'jump':headphones?'normal':'quiet';ctx.save();ctx.translate(x,y);ctx.rotate((headphones?Math.round(Math.sin(t*4)*3)*3:0)*-Math.PI/180);ctx.imageSmoothingEnabled=false;let n=36*Math.max(1,Math.round(size/36));ctx.drawImage(sprites[state],-n/2,-n/2,n,n);ctx.restore()}
function ok_face(b,x,y){ctx.imageSmoothingEnabled=false;ctx.drawImage(sprites.ok,x-118,y-40,236,80);b.text([x+146,y],'ok!',47,INK)}
let playing=false,lastFrame=-1,raf=0;
function resize(){const r=canvas.getBoundingClientRect(),d=window.devicePixelRatio||1;canvas.width=Math.round(r.width*d);canvas.height=Math.round(canvas.width*9/16);ctx.setTransform(canvas.width/1280,0,0,canvas.height/720,0,0);lastFrame=-1;draw()}
function draw(){let i=Math.min(levels.length-1,Math.max(0,Math.floor(audio.currentTime*30)));if(i!==lastFrame){frame(i);lastFrame=i}}
function tick(){draw();if(playing)raf=requestAnimationFrame(tick)}
const toggle=document.createElement('button');toggle.type='button';toggle.className='toggle';toggle.textContent='再生 ▶';document.querySelector('.screen').append(toggle);toggle.onclick=()=>{if(audio.paused)audio.play().catch(()=>{document.querySelector('.live-note').textContent='音声を読み込めませんでした。ページを再読み込みしてください。'});else audio.pause()};
audio.addEventListener('play',()=>{playing=true;toggle.textContent='一時停止 Ⅱ';cancelAnimationFrame(raf);tick()});audio.addEventListener('pause',()=>{playing=false;toggle.textContent='再生 ▶';cancelAnimationFrame(raf);draw()});audio.addEventListener('seeked',draw);audio.addEventListener('ended',()=>{playing=false;toggle.textContent='再生 ▶';draw()});
document.querySelector('.fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.querySelector('.screen').requestFullscreen?.()};
const observer=new ResizeObserver(resize);await document.fonts.ready;
for(const name of SPRITES){const im=new Image();im.src=name+'.png';await im.decode();sprites[name]=im}
observer.observe(canvas);resize();

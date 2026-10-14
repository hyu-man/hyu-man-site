const CREAM="#fbf6e8",INK="#53343e",PINK="#f589b1",RED="#935453",MINT="#b9eedc",YELLOW="#ffe58b",BLUE="#a3c6f1",PURPLE="#463557",WHITE="#fffdf4",COLORS=["#f589b1", "#b9eedc", "#ffe58b", "#a3c6f1", "#e0c3ef"],DROPS=[47.333333333333336, 60.6, 67.26666666666667, 87.26666666666667, 100.53333333333333, 107.23333333333333],BG="#090c16",BONE="#f1e9dc",CORAL="#ff534b",ICE="#80d1db",DUST="#424052";
const data=await(await fetch("timeline.json")).json(),levels=data.levels,onsets=data.onsets,CUES=data.cues,TIMES=CUES.map(q=>q.time),DURATION=data.duration;
const SPRITES=[];
function sat(x){return Math.max(0,Math.min(1,x));}
function project(x,y,z){let k;k=(650/(z+850));
return [(640+(x*k)),(330+(y*k))];}
function ring(b,t,r,z,tilt,c,width=2,broken=false){let a,j,pts,x,y;pts=[];
for(let j of range(97)){a=(((j*math.tau)/96)+(t*0.13));
x=(r*Math.cos(a));
y=(r*Math.sin(a));
pts.push(project(x,(y*Math.cos(tilt)),(z+(y*Math.sin(tilt)))));}
if(broken){for(let j of range(0,90,12)){b.line(pts.slice(j,(j+8)),c,width);}}else{b.line(pts,c,width);}}
function person(b,x,y,h,c=BONE,split=0,t=0){let j,w,yy;w=(h*0.13);
b.ellipse([(x-(w*0.6)),(y-(h*0.49)),(x+(w*0.6)),(y-(h*0.33))],c);
b.poly([[(x-(w*0.65)),(y-(h*0.31))],[(x+(w*0.65)),(y-(h*0.31))],[(x+w),(y+(h*0.07))],[(x+(w*0.48)),(y+(h*0.11))],[(x+(w*0.4)),(y+(h*0.46))],[(x+(w*0.05)),(y+(h*0.46))],[x,(y+(h*0.15))],[(x-(w*0.12)),(y+(h*0.46))],[(x-(w*0.47)),(y+(h*0.46))],[(x-(w*0.48)),(y+(h*0.1))],[(x-w),(y+(h*0.06))]],c);
if(split){for(let j of range(7)){yy=((y-(h*0.3))+((j*h)*0.1));
b.box([(x-(w*1.2)),yy,(x+(w*1.2)),(yy+((split*h)*0.025))],BG);}}}
function doorway(b,t,openamt=0){b.poly([[500,130],[780,130],[780,510],[500,510]],DUST);
b.poly([[510,140],[770,140],[770,500],[510,500]],BG);
b.poly([[510,140],[(510+(245*(1-openamt))),(140+(openamt*55))],[(510+(245*(1-openamt))),(500-(openamt*30))],[510,500]],"#201f2e");
b.line([[510,500],[770,500]],CORAL,3);
b.poly([[510,503],[770,503],[1040,720],[240,720]],"#18151e");}
function shards(b,t,force,reverse=false){let a,j,r,size,tau,x,y;for(let j of range(100)){a=(j*2.39996);
tau=mod(((t*(reverse?0.18:0.3))+(j*0.071)),1);
if(reverse){tau=(1-tau);}
r=(80+(tau*900));
x=(640+(Math.cos(a)*r));
y=(330+((Math.sin(a)*r)*0.63));
size=(3+((tau*force)*(15+mod(j,21))));
b.poly([[x,(y-size)],[(x+(size*0.7)),(y+(size*0.5))],[(x-(size*0.4)),(y+(size*0.3))]],[CORAL,BONE,DUST,ICE][mod(j,4)]);}}
function tunnel(b,t,energy,invert=false){let a,j,r,z;for(let j of range(20)){z=(mod(((j*135)-(t*(150+(energy*60)))),2600)-400);
r=(330+(Math.sin(((j*0.8)+(t*0.25)))*70));
ring(b,(t+(j*0.1)),r,z,(Math.sin((t*0.4))*0.6),(((mod(j,4)===0))?CORAL:DUST),2,true);}
for(let j of range(12)){a=(((j*math.tau)/12)+(t*0.08));
b.line([project((Math.cos(a)*380),(Math.sin(a)*380),(-380)),project((Math.cos(a)*380),(Math.sin(a)*380),2300)],"#302739",1);}}
function orbit(b,t,energy,second=false){let j;for(let j of range(7)){ring(b,(t+j),(260+(j*37)),(80+(j*30)),((t*0.24)+(j*0.5)),(((mod(j,3)===0))?ICE:CORAL),(2+Math.trunc((energy*2))),true);}
b.ellipse([(628-(energy*8)),(318-(energy*8)),(652+(energy*8)),(342+(energy*8))],BONE);
if(second){shards(b,t,1.1);}}
function lyric(b,t){let age,idx,q,size,txt;idx=(bisect(TIMES,t)-1);
if(((idx<0))){return ;}
q=CUES[idx];
age=(t-q["time"]);
txt=q["text"];
if(((age>Math.min(5,((((idx+1)<len(TIMES)))?(TIMES[(idx+1)]-q["time"]):5))))){return ;}
size=(((len(txt)>38))?40:47);
if(((txt==="Come back"))){size=92;
b.text([640,(565-(age*8))],txt,size,BONE,false,"mm",1,BG);
return ;}
if(((txt==="All mine"))){b.text([640,325],txt,112,CORAL,false,"mm",2,BG);
b.box([425,245,855,407],null,CORAL,2);
return ;}
while(((font(size).getlength(txt)>(1130*S)))){size-=1;}
b.text([640,623],txt,size,BONE,false,"mm",2,BG);}
function frame(i){let age,amp,b,d,drop,dx,h,j,pulse,r,shift,size,snap,t,u,w,x,xx,y,yy;t=(i/FPS);
amp=Number(levels[i]);
pulse=Math.exp(((-(t-onsets[(bisect(onsets,t)-1)]))*12));
b=new Board(BG);
for(let j of range(75)){x=mod(((j*173.7)+(t*(2+mod(j,3)))),1280);
y=mod((j*89.3),720);
b.box([x,y,((x+1)+((mod(j,9)===0))),(y+1)],DUST);}
if(((t<(7+(8/30))))){doorway(b,t,(sat((t/7))*0.7));
person(b,640,397,170,BONE);
b.text([92,90],"Notitle.",27,BONE,false,"lm",0,CREAM);}else{if(((t<(20+(20/30))))){tunnel(b,t,pulse);
doorway(b,t,0.8);
person(b,640,397,170,BONE,sat(((t-12)/7)),t);
for(let j of range(4)){ring(b,t,(260+(j*50)),(100+(j*100)),0.4,CORAL,1,true);}}else{if(((t<33.8))){orbit(b,t,pulse);
if(((t<27.466))){for(let j of range(5)){xx=(470+(j*78));
yy=(160+(Math.abs((j-2))*27));
b.line([[640,485],[xx,yy],[640,330]],ICE,2);
b.ellipse([(xx-4),(yy-4),(xx+4),(yy+4)],BONE);}}else{for(let j of range(3)){person(b,(455+(j*185)),357,(140+(j*20)),(((j===mod(Math.trunc(((t-27.46)/2)),3)))?BONE:DUST));}}}else{if(((t<46.8))){u=sat(((t-33.8)/12));
b.ellipse([440,130,840,530],null,DUST,3);
for(let j of range(9)){ring(b,t,(200-(j*12)),(70+(j*40)),(t*0.2),(((mod(j,3)===0))?CORAL:DUST),2,true);}
person(b,640,400,240,(((t>39.6))?BG:BONE));
b.line([[520,516],[760,516]],CORAL,2);}else{if(((t<74.033))){tunnel(b,t,pulse);
shards(b,t,1.6);
size=((270+(90*Math.sin(((t-47)*0.15))))+(pulse*16));
person(b,640,345,size,CORAL,0.7,t);
for(let j of range(5)){ring(b,t,(280+(j*60)),(j*50),((t*0.2)+(j*0.4)),(((j===0))?BONE:DUST),2,true);}
if(((t>=60.6))){for(let j of range(3)){x=(220+(j*420));
b.box([(x-75),178,(x+75),495],null,ICE,2);
person(b,x,345,220,DUST,0.7,t);}}}else{if(((t<86.8))){orbit(b,t,pulse);
doorway(b,t,1);
b.ellipse([628,312,652,336],BONE);
for(let j of range(12)){y=(125+(j*32));
x=(80+(Math.sin(((t*0.3)+j))*18));
b.text([x,y],("again / "+String((j+1)).padStart(2,"0")),16,DUST,false,"lm",0,CREAM);}}else{if(((t<113.866))){tunnel(b,(-t),pulse);
shards(b,t,2.3,true);
for(let j of range(9)){w=((140+(j*64))+(pulse*22));
h=(160+(j*27));
dx=(Math.sin(((t*0.4)+(j*0.2)))*40);
b.box([((640-w)+dx),(330-h),((640+w)+dx),(330+h)],null,(((mod(j,3)===0))?CORAL:DUST),2);}
person(b,640,350,300,BONE,sat(((t-94)/15)),t);
if(((t>100.53))){for(let j of range(5)){person(b,(180+(j*230)),365,(110+(25*Math.sin((t+j)))),DUST,0.7,t);}}
if(((t>107.233))){b.poly([[500,145],[780,145],[780,505],[500,505]],BG);
ring(b,t,350,30,(t*0.3),CORAL,4,true);}}else{u=sat(((t-113.866)/(DURATION-113.866)));
doorway(b,t,1);
for(let j of range(Math.round(((1-u)*35)))){x=(mod((j*127),1100)+90);
y=(100+mod(((j*43)+(t*40)),570));
b.line([[x,y],[(x+9),(y+14)]],DUST,2);}
b.line([[640,495],[640,(340+(u*100))]],CORAL,2);
b.ellipse([636,(336+(u*100)),644,(344+(u*100))],BONE);
if(((t>119))){b.text([640,592],"Notitle.",32,BONE);}
if(((t>124))){b.text([640,641],"HYU-MAN",14,DUST);}}}}}}}}
for(let drop of DROPS){age=(t-drop);
if(((0<=age) && (age<1.15))){for(let j of range(3)){r=((40+(age*710))+(j*50));
b.ellipse([(640-r),(330-(r*0.65)),(640+r),(330+(r*0.65))],null,(((mod(j,2)===0))?CORAL:BONE),4);}}}
lyric(b,t);
if((((19.033<=t) && (t<20.15)) || ((84<=t) && (t<85.15)) || DROPS.some(d=>((0<=(t-d)) && ((t-d)<0.22))))){snap=b.im.copy();
for(let j of range(10)){yy=Math.round(((65+(j*57))*S));
shift=Math.round(((Math.sin(((t*33)+j))*65)*S));
b.im.paste(snap.crop([0,yy,W,(yy+Math.round(((4+(mod(j,3)*4))*S)))]),[shift,yy]);}}
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

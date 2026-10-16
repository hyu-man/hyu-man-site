const SPRITES=["sit-0-0", "sit-0-1", "sit-1-0", "sit-1-1", "stand-0-0", "stand-0-1", "stand-1-0", "stand-1-1", "jump-0-0", "jump-0-1", "jump-1-0", "jump-1-1"];
const data=await(await fetch("timeline.json")).json();
const BG="#101829",DEEP="#18243b",BLUE="#28456d",LINE="#45668d",ICE="#8ed8e2",WHITE="#f5ebd5",RED="#96534e",PINK="#df887c",MINT="#91c8b2",GOLD="#f3c274",SKY="#b7d9cd",PURPLE="#6b759b";

const canvas=document.querySelector('canvas'),audio=document.querySelector('audio'),display=canvas.getContext('2d');
const W=640,H=360,FPS=30,N=data.levels.length,DURATION=data.duration;
const levels=data.levels,onsets=data.onsets,CUES=data.cues,TIMES=CUES.map(q=>q.time),DROPS=data.drops;
const math={pi:Math.PI,tau:Math.PI*2};
const mod=(a,b)=>((a%b)+b)%b,len=x=>x.length,enumerate=a=>Array.from(a,(v,i)=>[i,v]);
const zip=(a,b)=>a.slice(0,Math.min(a.length,b.length)).map((x,i)=>[x,b[i]]),vecDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const range=(a,b,s=1)=>{if(b===undefined){b=a;a=0}return Array.from({length:Math.max(0,Math.ceil((b-a)/s))},(_,i)=>a+i*s)};
function bisect(a,x){let l=0,h=a.length;while(l<h){let m=(l+h)>>1;if(a[m]<=x)l=m+1;else h=m}return l}
function mix(a,b,t){t=Math.max(0,Math.min(1,t));let rgb=x=>typeof x==='string'?[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)):x;return rgb(a).map((x,i)=>Math.round(x+(rgb(b)[i]-x)*t))}
const color=c=>Array.isArray(c)?`rgb(${c.join(',')})`:c;
let scale=1,images={};
class Surface{
 constructor(){this.canvas=document.createElement('canvas');this.canvas.width=canvas.width;this.canvas.height=canvas.height;this.ctx=this.canvas.getContext('2d');this.ctx.setTransform(scale,0,0,scale,0,0);this.ctx.imageSmoothingEnabled=false}
 copy(){let c=new Surface();c.ctx.drawImage(this.canvas,0,0,W,H);return c}
 crop(r){let self=this;return {source:self,r,resize(){let c=new Surface();c.ctx.drawImage(self.canvas,r[0]*scale,r[1]*scale,(r[2]-r[0])*scale,(r[3]-r[1])*scale,0,0,W,H);return c}}}
 paste(p,xy){let r=p.r;this.ctx.drawImage(p.source.canvas,r[0]*scale,r[1]*scale,(r[2]-r[0])*scale,(r[3]-r[1])*scale,xy[0],xy[1],r[2]-r[0],r[3]-r[1])}
}
let surface;
function makeFrame(mode,size,bg){surface.ctx.fillStyle=color(bg);surface.ctx.fillRect(0,0,W,H);return surface}
const getDraw=im=>im.ctx;
function box(d,r,c,o=null,w=1){if(c){d.fillStyle=color(c);d.fillRect(r[0],r[1],r[2]-r[0],r[3]-r[1])}if(o){d.strokeStyle=color(o);d.lineWidth=w;d.strokeRect(r[0],r[1],r[2]-r[0],r[3]-r[1])}}
function line(d,p,c=ICE,w=1){if(!p.length)return;d.beginPath();d.moveTo(...p[0]);for(let i=1;i<p.length;i++)d.lineTo(...p[i]);d.lineWidth=w;d.strokeStyle=color(c);d.stroke()}
function poly(d,p,c){d.beginPath();d.moveTo(...p[0]);for(let i=1;i<p.length;i++)d.lineTo(...p[i]);d.closePath();d.fillStyle=color(c);d.fill()}
function text(d,s,x,y,n=14,c=WHITE,anchor='mm',stroke=0){d.font=`${n}px DotGothic16`;d.textAlign=anchor==='lm'?'left':anchor==='rm'?'right':'center';d.textBaseline='middle';d.fillStyle=color(c);if(stroke){d.strokeStyle=BG;d.lineWidth=2*stroke;d.strokeText(s,x,y)}d.fillText(s,x,y)}
const font=n=>({getlength:s=>{display.font=`${n}px DotGothic16`;return display.measureText(s).width}});
function kid(im,x,y,unit=3,t=0,pose='sit',warm=false){let name=pose+'-'+Number(warm)+'-'+Number(Math.trunc(t*2)%19===0),img=images[name];if(img)im.ctx.drawImage(img,Math.round(x-18*unit),Math.round(y-19*unit),36*unit,38*unit)}
function clamp(x){return Math.max(0,Math.min(1,x));}
function ease(a,b,t){let u;u=clamp(((t-a)/(b-a)));
return ((u*u)*(3-(2*u)));}
function plus(d,x,y,s,c){box(d,[(x-s),(y-1),(x+s),(y+1)],c);
box(d,[(x-1),(y-s),(x+1),(y+s)],c);}
function fan(d,x,y,r,t,c=LINE){let a,j;box(d,[((x-r)-3),((y-r)-3),((x+r)+3),((y+r)+3)],DEEP,c);
for(let j of range(4)){a=((t*2)+((j*math.pi)/2));
poly(d,[[x,y],[(x+(Math.cos(a)*r)),(y+(Math.sin(a)*r))],[(x+((Math.cos((a+0.8))*r)*0.8)),(y+((Math.sin((a+0.8))*r)*0.8))]],c);}
box(d,[(x-2),(y-2),(x+2),(y+2)],ICE);}
function window(d,x,y,w,h,title="",fill=DEEP,c=LINE){box(d,[(x+3),(y+4),((x+w)+3),((y+h)+4)],BG);
box(d,[x,y,(x+w),(y+h)],fill,c);
box(d,[x,y,(x+w),(y+11)],c);
box(d,[(x+5),(y+4),(x+7),(y+6)],ICE);
if(title){text(d,title,(x+13),(y+6),9,WHITE,"lm");}
line(d,[[((x+w)-9),(y+3)],[((x+w)-4),(y+8)]],WHITE);
line(d,[[((x+w)-4),(y+3)],[((x+w)-9),(y+8)]],WHITE);}
function sky_window(d,t,warm=0,rain=true){let h,hh,j,w,x,xx,y,yy,z;[x,y,w,h]=[50,43,153,118];
window(d,x,y,w,h,"",mix(DEEP,SKY,warm),mix(LINE,RED,warm));
if(warm){box(d,[(x+87),(y+24),(x+106),(y+43)],GOLD);
for(let j of range(3)){box(d,[((x+10)+(j*43)),((y+46)+(mod(j,2)*10)),((x+38)+(j*43)),((y+49)+(mod(j,2)*10))],WHITE);}}
for(let j of range(10)){xx=((x+7)+(j*14));
hh=(15+mod((j*17),35));
box(d,[xx,((y+h)-hh),(xx+11),((y+h)-3)],mix(BLUE,MINT,warm));
if((!warm)){for(let z of range(3)){box(d,[(xx+3),((((y+h)-hh)+5)+(z*8)),(xx+4),((((y+h)-hh)+6)+(z*8))],(((mod(j,4)===0))?GOLD:LINE));}}}
if(rain){for(let j of range(32)){xx=((x+5)+mod((j*31),140));
yy=((y+15)+mod(((j*29)+(t*52)),98));
line(d,[[xx,yy],[(xx-2),(yy+6)]],(((mod(j,5)===0))?ICE:LINE));}}
box(d,[(x+75),(y+12),(x+78),(y+h)],mix(LINE,RED,warm));
line(d,[[x,(y+67)],[(x+w),(y+67)]],mix(LINE,RED,warm),2);}
function room(im,t,amp=0,warm=0,off=false,empty=false){let bg,d,floor,j,shift,wall,x,y;d=getDraw(im);
bg=mix(BG,WHITE,warm);
wall=mix(DEEP,"#e9cfb1",warm);
floor=mix("#1d2b43","#d4b69b",warm);
box(d,[0,0,W,H],bg);
box(d,[29,26,611,248],wall);
poly(d,[[29,248],[611,248],[640,360],[0,360]],floor);
line(d,[[29,26],[611,26],[611,248],[29,248],[29,26]],mix(LINE,RED,warm));
for(let x of range((-100),800,75)){line(d,[[(320+((x-320)*0.6)),248],[x,360]],mix(BLUE,"#b29280",warm));}
for(let y of [264,289,325]){line(d,[[0,y],[640,y]],mix(BLUE,"#b29280",warm));}
sky_window(d,t,warm,((t<137)));
box(d,[476,79,565,84],mix(LINE,RED,warm));
box(d,[493,59,506,78],MINT);
box(d,[498,49,501,65],MINT);
box(d,[490,54,494,62],MINT);
for(let j of range(3)){box(d,[(526+(j*9)),(62-(j*3)),(531+(j*9)),78],[PINK,GOLD,PURPLE][j]);}
text(d,(((warm<0.5))?"03:00":"06:12"),545,110,11,mix(ICE,RED,warm));
fan(d,544,210,19,(t*0.5),mix(LINE,RED,warm));
if(warm){poly(d,[[55,160],[198,160],[504,294],[209,294]],mix(floor,GOLD,(warm*0.45)));}else{if((!off)){poly(d,[[305,135],[361,135],[515,267],[248,267]],"#294265");}}
box(d,[417,172,456,245],mix(BLUE,RED,warm));
box(d,[420,247,453,252],mix(LINE,RED,warm));
line(d,[[435,251],[435,278]],mix(LINE,RED,warm),3);
poly(d,[[251,213],[448,213],[474,239],[273,239]],mix(LINE,"#b67e64",warm));
box(d,[278,239,284,279],mix(BLUE,RED,warm));
box(d,[454,239,460,279],mix(BLUE,RED,warm));
box(d,[287,127,385,202],mix(BG,RED,warm));
box(d,[292,132,380,194],(off?BG:(warm?"#719eaf":BLUE)));
if((!off)){box(d,[297,138,375,147],mix(LINE,WHITE,warm));
for(let j of range(4)){line(d,[[299,(156+(j*7))],[(331+(mod(j,3)*11)),(156+(j*7))]],mix(ICE,RED,warm));}
if(((mod(Math.trunc((t*2)),2)===0))){box(d,[343,178,346,185],WHITE);}
if(((warm>0.7))){plus(d,362,164,5,WHITE);}}
box(d,[329,203,343,215],mix(BLUE,RED,warm));
box(d,[316,215,357,218],mix(BLUE,RED,warm));
poly(d,[[307,224],[390,224],[400,234],[316,234]],mix(ICE,WHITE,warm));
for(let j of range(10)){line(d,[[(314+(j*8)),225],[(320+(j*8)),233]],mix(BLUE,RED,warm));}
if((!empty)){kid(im,430,198,3,t,"sit",((warm>0.65)));
d=getDraw(im);
shift=Math.round((Math.sin((t*(((76<t) && (t<80))?32:8)))*(((76<t) && (t<80))?3:1)));
line(d,[[405,211],[(386+shift),228]],PINK,4);}
if(((warm<0.5))){for(let j of range(12)){x=(211+mod((j*37),280));
y=(75+mod(((j*53)-(t*7)),170));
box(d,[x,y,(x+1),(y+1)],LINE);}}
return im;}
function packet_field(d,t,pulse,warm=false,burst=false){let a,colors,j,r,s,x,y;colors=(warm?[GOLD,MINT,PINK,WHITE]:[ICE,LINE,PURPLE,PINK]);
for(let j of range((burst?65:28))){a=((j*2.39996)+(t*0.08));
r=(35+mod(((j*31)+(t*(burst?65:15))),390));
x=(320+(Math.cos(a)*r));
y=(159+((Math.sin(a)*r)*0.52));
s=(1+mod(j,3));
if(((mod(j,5)===0))){plus(d,x,y,(s+1),colors[mod(j,4)]);}else{box(d,[x,y,(x+s),(y+s)],colors[mod(j,4)]);}}}
function wire(d,pts,t,c=ICE){let a,b,dist,le,total,u,x,y;line(d,pts,LINE);
total=zip(pts,pts.slice(1,undefined)).reduce((total,[a,b])=>total+vecDist(a,b),0);
dist=mod((t*80),total);
for(let [a,b] of zip(pts,pts.slice(1,undefined))){le=vecDist(a,b);
if(((dist<=le))){u=(dist/le);
x=(a[0]+((b[0]-a[0])*u));
y=(a[1]+((b[1]-a[1])*u));
box(d,[(x-2),(y-2),(x+2),(y+2)],c);
break;}
dist-=le;}}
function desktop(im,t,amp,second=false){let d,j,x,y;d=getDraw(im);
box(d,[0,0,640,360],BG);
for(let j of range(7)){x=((24+mod((j*83),520))+Math.round((Math.sin(((t*0.4)+j))*5)));
y=(25+mod((j*47),170));
window(d,x,y,108,78,"",DEEP,LINE);
if((second && ((mod(j,3)===0)))){box(d,[(x+4),(y+15),(x+104),(y+74)],GOLD);
box(d,[(x+4),(y+48),(x+104),(y+74)],MINT);
box(d,[(x+67),(y+25),(x+75),(y+33)],WHITE);}else{line(d,[[(x+17),(y+59)],[(x+87),(y+59)]],BLUE);
box(d,[(x+42),(y+36),(x+69),(y+57)],BLUE);}
wire(d,[[(x+54),(y+78)],[(x+54),267],[320,267]],(t+j));}
window(d,205,78,230,146,"PCboy",BLUE,ICE);
if((((t<79.766)) || (!second))){kid(im,320,174,4,t,"sit");
d=getDraw(im);
if(((31.333<t) && (t<32.866))){for(let j of range(10)){box(d,[254,(122+(j*10)),386,(124+(j*10))],BLUE);}}}else{box(d,[210,94,430,219],WHITE);
if(((mod(Math.trunc((t*2)),2)===0))){box(d,[226,116,230,130],RED);}}
packet_field(d,t,amp,false);}
function echoes(im,t,pulse,second=false){let a,d,h,j,r,u,w,x,y;d=getDraw(im);
box(d,[0,0,640,360],BG);
for(let j of range(10)){u=(j/10);
w=(100+(j*36));
h=(64+(j*18));
x=((320-(w/2))+(Math.sin((t+(j*0.2)))*3));
y=(157-(h/2));
box(d,[x,y,(x+w),(y+h)],null,(mod(j,3)?LINE:ICE));
if(((j<7))){text(d,"...",(x+15),(y+16),13,LINE,"lm");}}
for(let j of range(40)){a=(((j*math.tau)/40)+(t*0.15));
r=(105+(20*Math.sin((j+t))));
box(d,[(320+(Math.cos(a)*r)),(151+((Math.sin(a)*r)*0.5)),(323+(Math.cos(a)*r)),(154+((Math.sin(a)*r)*0.5))],(((mod(j,7)===mod(Math.trunc(t),7)))?ICE:BLUE));}
kid(im,320,162,4,t,"stand");
d=getDraw(im);
for(let j of range(9)){(false?box(d,[(274+(j*10)),254,(279+(j*10)),(254-((4+(mod(j,4)*4))*pulse))],ICE):null);}
text(d,"...",320,67,24,ICE);}
function bridge_keys(d,t,warm=false){let h,j,k,w,y,z;for(let j of range(13)){z=mod(((j/13)-(t*0.09)),1);
y=(135+((z*z)*180));
w=(20+(z*170));
h=(3+(z*16));
box(d,[(320-(w/2)),y,(320+(w/2)),(y+h)],(warm?WHITE:BLUE),(warm?RED:ICE));
for(let k of range(1,6)){line(d,[[((320-(w/2))+((w*k)/6)),y],[((320-(w/2))+((w*k)/6)),(y+h)]],(warm?GOLD:LINE));}}}
function network(im,t,pulse,second=false,warm=false){let a,bob,d,j,rad,s,x,y;d=getDraw(im);
box(d,[0,0,640,360],(warm?WHITE:BG));
if(warm){for(let j of range(5)){box(d,[0,(j*36),640,((j+1)*36)],mix(SKY,WHITE,(j/5)));}
box(d,[285,53,355,123],GOLD);
for(let j of range(12)){a=(((j*math.tau)/12)+(t*0.02));
line(d,[[(320+(Math.cos(a)*46)),(87+(Math.sin(a)*46))],[(320+(Math.cos(a)*93)),(87+(Math.sin(a)*93))]],GOLD,2);}}
for(let j of range(8)){a=(((j*math.tau)/8)+(t*0.07));
rad=(175+(15*Math.sin((t+j))));
x=(320+((Math.cos(a)*rad)*1.5));
y=(150+((Math.sin(a)*rad)*0.6));
window(d,(x-43),(y-28),86,57,"",mix(BLUE,WHITE,(warm?1:0)),(warm?GOLD:LINE));
if(warm){box(d,[(x-37),(y-11),(x+36),(y+23)],SKY);
box(d,[(x-37),(y+10),(x+36),(y+23)],MINT);
line(d,[[x,(y-11)],[x,(y+23)]],WHITE,2);}else{if((second && ((mod(j,2)===0)))){box(d,[(x-37),(y-11),(x+36),(y+23)],WHITE);}else{line(d,[[(x-25),(y+17)],[(x+25),(y+17)]],LINE);
box(d,[(x-3),(y-4),(x+3),(y+9)],ICE);}}
wire(d,[[x,(y+28)],[x,268],[320,268]],(t+j),(warm?GOLD:ICE));}
bridge_keys(d,t,warm);
bob=((Math.abs(Math.sin((t*5)))*11)*pulse);
kid(im,(320+(Math.sin((t*0.8))*28)),(179-bob),5,t,((((pulse>0.35)) || warm)?"jump":"stand"),warm);
d=getDraw(im);
packet_field(d,t,pulse,warm,true);
if(((!warm) && (((49.366<=t) && (t<55.766)) || ((99.4<=t) && (t<105.733))))){x=440;
box(d,[(x-2),47,(x+2),261],ICE);
for(let j of range(4)){line(d,[[((x+7)+(j*7)),65],[((x+7)+(j*7)),246]],BLUE);}
s=(8+Math.round((Math.sin((t*2))*2)));
box(d,[((x+48)-s),(134-s),((x+48)+s),(134+s)],LINE);}
if((((59.2<=t) && (t<65.333)) || ((108.933<=t) && (t<115.266)))){window(d,223,231,194,44,"",DEEP,ICE);
for(let j of range(14)){box(d,[(235+(j*12)),251,(242+(j*12)),262],(((j<mod(Math.trunc((t*3)),13)))?ICE:BLUE));}}}
function drop_scene(im,t,age,index,pulse){let d,j,r,warm,x,y;warm=((index>=4));
d=getDraw(im);
for(let j of range(9)){r=((18+(age*160))+(j*32));
box(d,[(320-r),(154-(r*0.49)),(320+r),(154+(r*0.49))],null,(warm?[GOLD,MINT,PINK][mod(j,3)]:[ICE,BLUE,PURPLE][mod(j,3)]),2);}
if((([1,3].includes(index)))){for(let j of range(16)){x=(mod(((j*53)+(t*44)),680)-20);
y=(50+mod((j*31),235));
box(d,[x,y,(x+20),(y+4)],(((mod(j,4)===0))?ICE:BLUE));}}}
function quiet(im,t){let d,j;room(im,t,0,0,true,true);
d=getDraw(im);
box(d,[69,169,151,281],LINE);
box(d,[74,174,146,278],SKY);
poly(d,[[74,278],[146,278],[218,319],[43,319]],BLUE);
kid(im,112,235,2,t,"stand",true);
kid(im,359,236,3,t,"stand",false);
d=getDraw(im);
line(d,[[302,281],[145,281]],LINE);
if(((t>=126.1))){line(d,[[147,206],[251,206],[251,248],[301,248]],ICE);}
if(((t>=132.633))){for(let j of range(2)){box(d,[(233+(j*16)),224,(239+(j*16)),230],(((mod(Math.trunc((t*3)),2)===j))?GOLD:BLUE));}}}
function morning(im,t,pulse){let d,j,x,y;if(((t<147.733))){network(im,t,pulse,false,true);
d=getDraw(im);
if(((141.233<=t) && (t<142.8))){line(d,[[50,238],[214,238],[214,204],[426,204],[426,238],[590,238]],RED,2);
for(let j of range(11)){plus(d,(80+(j*48)),238,3,MINT);}}}else{if(((t<158.733))){room(im,t,pulse,ease(147.733,153,t),false,true);
d=getDraw(im);
for(let j of range(8)){box(d,[(92+(j*47)),267,(126+(j*47)),279],WHITE,RED);}
x=(430-(270*ease(147.733,158.733,t)));
kid(im,x,(235-(Math.abs(Math.sin((t*6)))*5)),3,t,"stand",true);
d=getDraw(im);
packet_field(d,t,pulse,true);}else{network(im,t,pulse,false,true);
d=getDraw(im);
for(let j of range(45)){x=(mod(((j*73)+(t*27)),680)-20);
y=mod(((j*47)+(t*19)),280);
plus(d,x,y,(2+mod(j,3)),[MINT,PINK,GOLD][mod(j,3)]);}}}}
function outro(im,t){let at,d,j,u,x;u=ease(164.667,168,t);
room(im,t,0,1,((t>=167.5)),true);
d=getDraw(im);
box(d,[69,169,151,281],RED);
box(d,[74,174,146,278],SKY);
poly(d,[[74,278],[146,278],[220,320],[43,320]],GOLD);
x=(162-(52*ease(164.667,172,t)));
kid(im,x,238,3,t,"stand",true);
d=getDraw(im);
for(let [j,at] of enumerate([167.5,169.1,170.733])){box(d,[(321+(j*11)),184,(325+(j*11)),187],(((t<at))?BLUE:BG));}
if(((t>172.0))){text(d,"PCboy",433,155,18,RED);
text(d,"ひゅーまん",433,182,10,RED);}}
function subtitle(im,t){let candidate,d,end,idx,j,n,q,row,rows,s,warm,word,words,y;d=getDraw(im);
idx=(bisect(TIMES,t)-1);
if(((idx<0))){return ;}
q=CUES[idx];
end=Math.min(((((idx+1)<len(TIMES)))?TIMES[(idx+1)]:DURATION),(q["time"]+(((idx<2))?6:4.5)));
if(((t>=end))){return ;}
s=q["text"];
warm=((t>=134.833));
n=(((len(s)<30))?18:16);
words=s.split(" ");
rows=[""];
for(let word of words){candidate=((rows[rows.length-1]+" ")+word).trim();
if(((font(n).getlength(candidate)>574))){rows.push(word);}else{rows[rows.length-1]=candidate;}}
y=(((len(rows)===1))?323:313);
box(d,[21,298,619,350],(warm?WHITE:BG));
line(d,[[29,299],[(29+Math.round((18+(34*clamp(((t-q["time"])*4)))))),299]],(warm?RED:ICE),1);
for(let [j,row] of enumerate(rows)){text(d,row,320,(y+(j*23)),n,(warm?RED:WHITE));}}
function frame(i){let croph,cropw,cx,cy,d,drop,energy,hh,im,j,last,left,pulse,snap,t,top,w,x,y,z;t=(i/FPS);
energy=Number(levels[Math.min(i,(N-1))]);
last=onsets[Math.max(0,(bisect(onsets,t)-1))];
pulse=Math.exp(((-(t-last))*12));
im=makeFrame("RGB",[W,H],BG);
if(((t<10.433))){room(im,t,energy);
z=(1-ease(5.2,10.433,t));
cropw=Math.round((640-(330*z)));
croph=Math.round(((cropw*9)/16));
cx=337;
cy=170;
left=Math.min((W-cropw),Math.max(0,Math.round((cx-(cropw/2)))));
top=Math.min((H-croph),Math.max(0,Math.round((cy-(croph/2)))));
im=im.crop([left,top,(left+cropw),(top+croph)]).resize([W,H],0);
d=getDraw(im);
text(d,"PCboy",51,30,18,WHITE,"lm");}else{if(((t<23.233))){room(im,t,energy);
d=getDraw(im);
if(((t>16.933))){for(let j of range(9)){x=(255+(j*17));
hh=Math.round(((6+(mod(j,3)*5))*energy));
box(d,[x,(110-hh),(x+7),110],ICE);}}}else{if(((t<36.133))){desktop(im,t,energy);}else{if(((t<42.8))){echoes(im,t,pulse);}else{if(((t<72.733))){network(im,t,pulse);}else{if(((t<86))){desktop(im,t,energy,true);}else{if(((t<92.8))){echoes(im,t,pulse,true);}else{if(((t<116.766))){network(im,t,pulse,true);}else{if(((t<119.9))){room(im,t,energy,0,false,false);
d=getDraw(im);
for(let j of range(8)){w=((1-ease(116.766,119.9,t))*(80+(j*70)));
box(d,[(337-(w/2)),(166-(w*0.28)),(337+(w/2)),(166+(w*0.28))],null,LINE);}}else{if(((t<134.833))){quiet(im,t);}else{if(((t<164.667))){morning(im,t,pulse);}else{outro(im,t);}}}}}}}}}}}
for(let [j,drop] of enumerate(DROPS)){if(((0<=(t-drop)) && ((t-drop)<1.3))){drop_scene(im,t,(t-drop),j,pulse);}}
if([49.366,59.2,66.866,99.4,106.933].some(x=>((0<=(t-x)) && ((t-x)<0.32)))){snap=im.copy();
for(let j of range(5)){y=(45+(j*42));
im.paste(snap.crop([0,y,W,(y+4)]),[Math.round((Math.sin(((t*34)+j))*9)),y]);}}
subtitle(im,t);
d=getDraw(im);
text(d,"ひゅーまん",608,16,8,(((t>=134.833))?RED:LINE),"rm");
return im;}

const play=document.querySelector('#play'),seek=document.querySelector('#seek'),time=document.querySelector('#time'),status=document.querySelector('#status');
let ready=false,raf=0,last=-1;
const clock=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function draw(){if(!ready)return;let i=Math.min(N-1,Math.max(0,Math.floor(audio.currentTime*FPS)));if(last!==i){let im=frame(i);display.imageSmoothingEnabled=false;display.drawImage(im.canvas,0,0,canvas.width,canvas.height);last=i}seek.value=String(audio.currentTime);time.textContent=clock(audio.currentTime)+' / '+clock(DURATION);seek.setAttribute('aria-valuetext',clock(audio.currentTime))}
function tick(){draw();if(!audio.paused)raf=requestAnimationFrame(tick)}
function resize(){const r=canvas.getBoundingClientRect();canvas.width=Math.max(640,Math.round(r.width*(devicePixelRatio||1)));canvas.height=Math.round(canvas.width*9/16);scale=canvas.width/W;surface=new Surface();last=-1;draw()}
play.onclick=()=>{if(audio.paused)audio.play().catch(()=>status.textContent='音声を読み込めませんでした。もう一度再生してください。');else audio.pause()};
audio.addEventListener('play',()=>{play.textContent='一時停止 Ⅱ';cancelAnimationFrame(raf);tick()});
audio.addEventListener('pause',()=>{play.textContent='再生 ▶';cancelAnimationFrame(raf);draw()});
audio.addEventListener('ended',()=>{play.textContent='もう一度 ▶';draw()});
audio.addEventListener('seeked',()=>{if(audio.paused)play.textContent='再生 ▶';last=-1;draw()});
seek.max=String(DURATION);seek.oninput=()=>{audio.currentTime=Number(seek.value);last=-1;draw()};
document.querySelector('#full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.querySelector('.stage').requestFullscreen?.().catch(()=>{})};
audio.addEventListener('error',()=>status.textContent='音声の読み込みに失敗しました。ページを再読み込みしてください。');
try{
 await document.fonts.load('16px DotGothic16');
 await Promise.all(SPRITES.map(async name=>{let im=new Image();im.src=name+'.png';await im.decode();images[name]=im}));
 ready=true;new ResizeObserver(resize).observe(canvas);resize();play.disabled=false;play.textContent='再生 ▶';seek.disabled=false;status.textContent='再生すると、部屋が動き出します。';
}catch(error){status.textContent='映像の読み込みに失敗しました。ページを再読み込みしてください。';console.error(error)}

/* Live adaptation of the Python film. Audio time is the only scene clock. */
(()=>{'use strict';
const c=document.getElementById('world'),d=c.getContext('2d'),audio=document.getElementById('film'),caption=document.getElementById('caption');
const P='#fff6ef',I='#873e47',K='#ff719d',L='#ffc4d4',G='#e8b575',TAU=Math.PI*2;
const palette=['#ff9bbb','#b5a2e9','#92d7cf','#9fcdf1','#f4d68b','#ffbda5'];
const effects=()=>!reduced.matches&&document.getElementById('motion').getAttribute('aria-pressed')==='true';
let cues=[],touches=[],last=-1;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
fetch('cues.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(v=>{cues=v;last=-1}).catch(()=>{caption.textContent='歌詞を読み込めませんでした。映画版でもご覧いただけます。'});
function rect(x,y,w,h,col){d.fillStyle=col;d.fillRect(x,y,w,h)}
function line(points,col=I,width=3){d.beginPath();points.forEach(([x,y],i)=>i?d.lineTo(x,y):d.moveTo(x,y));d.strokeStyle=col;d.lineWidth=width;d.stroke()}
function text(s,x,y,size=28,col=I){d.font=`${size}px DotGothic16,monospace`;d.textAlign='center';d.textBaseline='middle';d.fillStyle=col;d.fillText(s,x,y,880)}
function heart(x,y,s,col=K){['0110110','1111111','1111111','0111110','0011100','0001000'].forEach((r,j)=>[...r].forEach((v,i)=>{if(v==='1')rect(x+(i-3)*s,y+(j-2)*s,s+.3,s+.3,col)}))}
function face(x,y,s,pink=false,happy=false){let col=pink?K:I;rect(x-6*s,y-5*s,12*s,10*s,col);rect(x-7*s,y-3*s,14*s,6*s,col);rect(x-s,y-7*s,2*s,2*s,col);rect(x-4*s,y+5*s,2*s,2*s,col);rect(x+2*s,y+5*s,2*s,2*s,col);for(let e of [-3,3]){if(happy)line([[x+(e-1)*s,y-s],[x+e*s,y],[x+(e+1)*s,y-s]],P,s*.7);else rect(x+(e-.7)*s,y-2*s,1.4*s,1.4*s,P)}line([[x-s,y+2*s],[x,y+2.6*s],[x+s,y+2*s]],P,s*.6);rect(x-5*s,y+s,2*s,s,L);rect(x+3*s,y+s,2*s,s,L)}
function ring(t){for(let j=0;j<8;j++){let z=(j/8+t*.28)%1,r=20+z*z*600;d.globalAlpha=.18+z*.65;for(let i=0;i<14;i++){let a=i*TAU/14+t*.22+j*.08;heart(480+Math.cos(a)*r,255+Math.sin(a)*r*.62,1+z*4,palette[(i+j)%6])}}d.globalAlpha=1}
function big(t){let pts=[];for(let i=0;i<=120;i++){let a=i*TAU/120;pts.push([480+192*Math.sin(a)**3,260-12*(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))])}line(pts,K,4);for(let i=0;i<120;i+=6){let q=pts[(i+Math.floor(t*9))%120];heart(...q,2,G)}}
function panel(x,y,w,h){rect(x-w/2+5,y-h/2+5,w,h,L);rect(x-w/2,y-h/2,w,h,P);d.strokeStyle=I;d.lineWidth=2;d.strokeRect(x-w/2,y-h/2,w,h)}
// Decorative layers follow the song clock; bounded counts keep mobile work predictable.
function sparkle(x,y,r,col){line([[x-r,y],[x+r,y]],col,2);line([[x,y-r],[x,y+r]],col,2);heart(x,y,r/5,col)}
function festival(t,intense){
 d.save();
 // Broad pastel ribbons sit behind the characters and text.
 for(let j=0;j<6;j++){let pts=[];for(let i=0;i<=40;i++){let x=i*24;pts.push([x,110+j*47+Math.sin(x*.007+t*.65+j*.65)*(intense?65:28)])}d.globalAlpha=intense?.22:.1;line(pts,palette[j],intense?17:9)}
 d.globalAlpha=1;
 for(let i=0;i<(intense?90:28);i++){let z=(i*.618+t*(.07+i%4*.012))%1,x=(i*173.3+Math.sin(t+i)*32)%960,y=z*460;
 d.save();d.translate(x,y);d.rotate(t*(i%2?1:-1)+i);d.globalAlpha=.5+z*.25;rect(-3,-6,6,12,palette[i%6]);d.restore()}
 // Flower wheels bloom on either side of the central story.
 for(let j=0;j<(intense?6:2);j++){let x=j%2?840:120,y=100+Math.floor(j/2)*145,r=18+9*Math.sin(t*1.4+j);d.globalAlpha=.7;for(let i=0;i<5;i++){let a=i*TAU/5+t*.4;heart(x+Math.cos(a)*r,y+Math.sin(a)*r,2.4,palette[(i+j)%6])}sparkle(x,y,6,'#e8b575')}
 d.restore();
}
function edgeParty(t){d.save();for(let j=0;j<22;j++){let z=(j/22+t*.22)%1,x=j%2?930-z*65:30+z*65,y=(j*83+t*24)%440;d.globalAlpha=.35+z*.45;heart(x,y,2+z*5,palette[j%6]);sparkle(x+(j%2?-45:45),y+25,4+z*6,palette[(j+2)%6])}d.restore()}
function paint(now){const time=audio.currentTime,t=reduced.matches?Math.floor((time+5)*2)/2:time+5;
if(!audio.paused||last!==time||touches.length){last=time;rect(0,0,960,540,P);
for(let i=0;i<55;i++){d.globalAlpha=.2+i%4*.12;heart((i*137.7+Math.sin(t*.4+i)*24)%980-10,(i*73+t*(13+i%5*7))%600-35,1+i%3*.45)}d.globalAlpha=1;
const intense=(time>=42.066&&time<71.53)||(time>=91.6&&time<121.97)||time>=126;
if(effects())festival(t,intense);
if(time>=151+29/30){big(t);heart(480,245,25,L);face(410,260,5,false,true);face(550,260,5,true,true)}
else if(t<31.63){ring(t*.5);panel(480,235,570,245);text("It's Over!",480,185,64);face(400,292,4,false,true);face(560,292,4,true,true);for(let i=0;i<9;i++)heart(270+i*53,335+Math.sin(t*3+i)*12,2);if((t>=8.53&&t<11)||(t>=20.06&&t<22.4)){panel(690,292,225,72);text("(It's not.)",690,292,27,K)}}
else if(t<39.27){line([[0,340],[600,340],[600,135]],L,4);for(let i=0;i<6;i++){let x=(i*210-t*36+2360)%1180-110;d.strokeStyle=L;d.strokeRect(x,180,75,150);heart(x+37,233,3,L)}let x=260+(t-31.63)*55;for(let q of [x+35,x+105]){d.beginPath();d.arc(q,382,20,0,TAU);d.strokeStyle=I;d.stroke()}line([[x+35,382],[x+60,350],[x+82,382],[x+35,382],[x+98,346],[x+105,382]]);face(x,335,4,true);text('long way',760,125,20)}
else if(t<47.07){let n=1+Math.floor(Math.max(0,t-42)*4);for(let i=0;i<n;i++){let x=125+i*173%710,y=110+i*79%270;panel(x,y,210,64);text(t>42?'lost it':"I'm okay",x,y,25)}face(480,305,7,true);if(t>=41.46&&t<42.13)text('（ちがう）',480,120,45,K);if(t>=46.43)text('（うそ）',480,235,86)}
else if(t<62.67||(t>=96.6&&t<109.27)){ring(t);big(t);let sep=100+70*Math.sin(t*1.2);line([[480-sep,290],[480+sep,290]],K,2);face(480-sep,285+Math.sin(t*4)*12,5,false,true);face(480+sep,285-Math.sin(t*4)*12,5,true,true);text("It's Over!",480,76,44)}
else if(t<76.53||(t>=109.27&&t<126.97)||t>=131){ring(t*1.5);for(let j=0;j<4;j++){let age=(t*.7+j*.25)%1;for(let i=0;i<16;i++){let a=TAU*i/16+j;heart(150+j*220+Math.cos(a)*age*180,160+j%2*135+Math.sin(a)*age*180,1.8+(1-age)*2,palette[j%6])}}face(370,295+Math.sin(t*5)*22,6,false,true);face(590,295+Math.sin(t*5+1)*22,6,true,true);if(t>=138.26)text("It's Over!",480,85,48)}
else if(t<87.47){rect(150,125,660,45,L);text('SUMMER',480,147,24);line([[0,375],[960,375]]);rect(315,300,330,15,I);line([[340,315],[340,370]]);line([[620,315],[620,370]]);face(410,260,4,true);heart(550,260,4,L);if(t>=84.7)text('you',550,330,16,L)}
else if(t<96.6){let pts=[[105,365],[105,175],[310,175],[310,305],[530,305],[530,135],[725,135],[725,260]];line(pts,K,4);pts.forEach(([x,y],i)=>heart(x,y,2+Math.sin(t*2+i)*.3));line([[725,260],[840,260],[840,375]],L,2);line([[725,260],[610,260],[610,405]],L,2);face(840,375,3);face(610,405,3,true);text('one more time',480,75,29)}
else{big(t);face(480,265,8,true);text('Again',480,105,56);for(let i=0;i<10;i++)heart(160+i*70,370+Math.sin(t*3+i)*20,3)}
if(effects()&&intense)edgeParty(t);
if(effects())for(let start of [42+2/30,57+20/30,65+10/30,91+18/30,104+8/30,121+29/30]){let u=(time-start)/1.1;if(u>=0&&u<1)for(let j=0;j<32;j++){let a=j*TAU/32,r=30+u*660;heart(480+Math.cos(a)*r,250+Math.sin(a)*r*.65,1+(1-u)*4,palette[j%6])}}
let cue=cues.find(q=>time>=q[0]&&time<q[1]);if(cue){rect(30,459,900,62,P);text(cue[2],480,490,27)}if(cues.length)caption.textContent=cue?cue[2]:'';
text("It's Over!",60,18,10);text('ω',940,18,12);
touches=touches.filter(q=>now-q.time<1400);for(let q of touches){let age=(now-q.time)/1400;d.globalAlpha=1-age;for(let i=0;i<12;i++){let a=i*TAU/12;heart(q.x+Math.cos(a)*age*130,q.y+Math.sin(a)*age*100,2+(1-age)*2,palette[i%6])}}d.globalAlpha=1;
}requestAnimationFrame(paint)}
c.addEventListener('pointerdown',e=>{if(!effects())return;let r=c.getBoundingClientRect();touches.push({x:(e.clientX-r.left)/r.width*960,y:(e.clientY-r.top)/r.height*540,time:performance.now()});touches=touches.slice(-12)});
document.getElementById('motion').addEventListener('click',()=>{last=-1;if(!effects())touches=[]});
reduced.addEventListener('change',()=>{last=-1;touches=[]});
document.fonts.ready.then(()=>last=-1);document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause()});requestAnimationFrame(paint);
})();

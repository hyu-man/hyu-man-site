import {TAU,clamp,surface,project} from './geometry.js';
const cv=document.getElementById('world'),ctx=cv.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id);
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduce.matches,hidden=document.hidden,mode=0,blend=0,time=0,last=0,w=800,h=610,dpr=1;
let yaw=.38,pitch=.22,targetYaw=.38,targetPitch=.22,interval=1,warp=.35,drag=null,raf=0;
let pulses=[{born:-.5,angle:1.5}],touches=0;
const mint=[154,231,212],rose=[255,197,177],white=[236,241,225];
const color=(rgb,a)=>`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${clamp(a,0,1)})`;
const mix=(a,b,u)=>a.map((x,i)=>Math.round(x+(b[i]-x)*u));
const texts=[['01 / CAUSAL DIAMOND','ひとつの光がひらく。もうひとつの光が、むかえる。'],['02 / A MOVING BOUNDARY','輪郭がゆれると、あいだの景色も変わる。'],['03 / BETWEEN WORLDS','ひとつの部屋の終わりから、次の部屋のはじまりへ。']];
const dust=Array.from({length:95},(_,i)=>({x:((i*137.508)%997)/997,y:((i*i*17.7)%991)/991,a:.08+(i%6)*.025}));

function updatePause(){
  $('pause').textContent=paused?'動かす':'止める';$('pause').setAttribute('aria-pressed',String(paused));
  $('motionState').textContent=paused?'止まっています':'うごいています';$('motionState').classList.toggle('paused',paused);
}
function resize(){
  const rect=cv.getBoundingClientRect();w=rect.width;h=rect.height;dpr=Math.min(devicePixelRatio||1,1.65);
  cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);draw();
}
function point(p,scale){return project(p,yaw,pitch,scale,w*.5,h*.49);}
function path(points,rgb,alpha,width=1){
  if(!points.length)return;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
  ctx.strokeStyle=color(rgb,alpha);ctx.lineWidth=width;ctx.stroke();
}
function glow(x,y,r,rgb,alpha=1){
  const g=ctx.createRadialGradient(x,y,0,x,y,r*6);g.addColorStop(0,color(rgb,alpha*.5));g.addColorStop(.3,color(rgb,alpha*.08));g.addColorStop(1,color(rgb,0));
  ctx.fillStyle=g;ctx.fillRect(x-r*6,y-r*6,r*12,r*12);ctx.fillStyle=color(rgb,alpha);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
}
function drawDiamond(offset,span,amount,scale,phase,opacity=1){
  const sample=(u,a,extra=0)=>{const p=surface(u,a,span,amount,phase);p[0]+=offset[0];p[1]+=offset[1];p[2]+=extra;return point(p,scale);};
  // Thin lines give the light cone a continuous surface beneath the luminous samples.
  for(let j=0;j<28;j++){
    const a=j/28*TAU,pts=[];
    for(let k=0;k<=48;k++)pts.push(sample(k/48,a));
    const z=sample(.5,a)[3];path(pts,mix(mint,rose,j/28),(.07+.09*(z>0))*opacity,.65);
  }
  const rows=33,cols=72;
  for(let j=1;j<rows;j++){
    const u=j/rows,rgb=mix(mint,rose,u),pts=[];
    const travel=((time*.17)%1),distance=Math.abs(u-travel);
    const beam=Math.exp(-distance*distance/ .0022);
    for(let i=0;i<=cols;i++)pts.push(sample(u,i/cols*TAU));
    path(pts,rgb,(j%4===0?.14:.045)*opacity,.6);
    for(let i=0;i<cols;i++){
      const a=i/cols*TAU,p=pts[i];let energy=.12+beam*.55;
      for(const pulse of pulses){
        const age=time-pulse.born;
        const ring=Math.exp(-Math.pow((u-(age*.37)%1)/.04,2));
        const along=.25+.75*Math.pow(.5+.5*Math.cos(a-pulse.angle),4);
        if(age>=0 && age<2.7)energy+=ring*along*(1-age/3)*1.2;
      }
      energy+=amount*.14*(.5+.5*Math.sin(a*3-u*16+time*1.3));
      const front=.48+.52*clamp((p[3]+1.4)/2.8,0,1),alpha=clamp((.18+energy)*front*opacity,0,1);
      const size=(.6+energy*1.0)*p[2];
      ctx.fillStyle=color(rgb,alpha);ctx.fillRect(p[0]-size*.5,p[1]-size*.5,size,size);
      if(energy>.65 && i%9===0)glow(p[0],p[1],1.1*p[2],rgb,alpha*.7);
    }
  }
  // The corner: where the two null boundaries meet. Its colours circulate; it is not a state counter.
  const equator=[];for(let i=0;i<=160;i++)equator.push(sample(.5,i/160*TAU));
  path(equator,mint,.30*opacity,1.1);path(equator,white,.07*opacity,4);
  for(let i=0;i<9;i++){
    const p=sample(.5,i/9*TAU+time*.10);glow(p[0],p[1],1.35,mix(mint,rose,i/8),.85*opacity);
  }
  // Interior curves are the visual response to boundary deformation, an explicitly artistic layer.
  if(amount>.02){
    for(let i=0;i<8;i++){
      const pts=[];
      for(let k=0;k<=45;k++){
        const u=k/45,p=surface(u,i/8*TAU+u*4+time*.12,span,amount,phase);
        p[0]*=.44+.2*Math.sin(u*3+i);p[2]*=.44+.2*Math.sin(u*3+i);p[0]+=offset[0];p[1]+=offset[1];pts.push(point(p,scale));
      }
      path(pts,mix(mint,rose,i/7),.08*amount*opacity,1);
    }
  }
  const lo=sample(0,0),hi=sample(1,0);
  glow(lo[0],lo[1],2.9,mint,opacity);glow(hi[0],hi[1],2.9,rose,opacity);
  return {lo,hi};
}
function draw(){
  if(!ctx)return;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#090f19';ctx.fillRect(0,0,w,h);
  const halo=ctx.createRadialGradient(w*.5,h*.49,0,w*.5,h*.49,w*.65);halo.addColorStop(0,'#142732');halo.addColorStop(1,'#090f19');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
  for(const p of dust){ctx.fillStyle=color([137,174,190],p.a);ctx.fillRect(p.x*w,p.y*h,1,1);}
  const scale=Math.min(w*.42,h*.34)/Math.max(1,interval*.80),span=2*interval;
  const split=clamp(blend-1,0,1),deform=clamp(blend,0,1)*warp;
  if(split<.999)drawDiamond([0,0],span,deform,scale,time*.7,1-split);
  if(split>.001){
    // Two adjacent schematic diamonds share a vertex, without claiming to compute gluing amplitudes.
    const gap=span*.28,part=span*.56;
    drawDiamond([0,-gap],part,warp*.52,scale,time*.7,split);
    drawDiamond([0,gap],part,warp*.52,scale,time*.7+.9,split);
    const joint=point([0,0,0],scale);glow(joint[0],joint[1],3.2+1.2*Math.sin(time*1.5)**2,white,split);
    const lines=[];for(let i=0;i<=100;i++){const a=i/100*TAU;lines.push(point([Math.cos(a)*.20,0,Math.sin(a)*.20],scale));}path(lines,white,.30*split,.8);
  }
  // Sparse registration marks retain the quiet laboratory quality of the page.
  ctx.strokeStyle='#38505a';ctx.lineWidth=.6;
  for(const x of [16,w-16])for(const y of [17,h-32]){ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}
}
function frame(now){
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!paused&&!hidden){time+=dt;targetYaw+=dt*.025;}
  yaw+=(targetYaw-yaw)*.14;pitch+=(targetPitch-pitch)*.14;
  blend+= (mode-blend)*(reduce.matches?1:.06);
  pulses=pulses.filter(p=>time-p.born<3);
  if(!hidden && (!paused || Math.abs(targetYaw-yaw)>.001 || Math.abs(targetPitch-pitch)>.001 || Math.abs(mode-blend)>.001))draw();
  raf=requestAnimationFrame(frame);
}
function setMode(value){
  mode=value;document.querySelectorAll('[data-mode]').forEach(b=>{const selected=+b.dataset.mode===mode;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
  $('viewName').textContent=texts[mode][0];$('sceneText').textContent=texts[mode][1];
  if(paused){blend=mode;draw();}
}
function pulse(angle=touches*2.39996){
  pulses.push({born:time,angle});pulses=pulses.slice(-6);touches++;
  if(paused){time+=.62;draw();}
}
if(ctx){
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(+b.dataset.mode)));
  $('interval').addEventListener('input',e=>{interval=+e.target.value;$('intervalValue').value=interval.toFixed(2);draw();});
  $('ripple').addEventListener('input',e=>{warp=+e.target.value/100;$('rippleValue').value=e.target.value;if(mode===0&&warp>0)setMode(1);draw();});
  $('pulse').addEventListener('click',()=>pulse());
  $('pause').addEventListener('click',()=>{paused=!paused;updatePause();draw();});
  $('reset').addEventListener('click',()=>{time=0;interval=1;warp=.35;targetYaw=yaw=.38;targetPitch=pitch=.22;blend=0;pulses=[{born:-.5,angle:1.5}];$('interval').value='1';$('intervalValue').value='1.0';$('ripple').value='35';$('rippleValue').value='35';setMode(0);draw();});
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,id:e.pointerId};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6){drag.moved=true;cv.classList.add('dragging');}targetYaw+=dx*.008;targetPitch=clamp(targetPitch+dy*.004,-.5,.5);drag.x=e.clientX;drag.y=e.clientY;if(paused)draw();});
  cv.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const r=cv.getBoundingClientRect();pulse(Math.atan2(e.clientY-r.top-h*.5,e.clientX-r.left-w*.5));}drag=null;cv.classList.remove('dragging');});
  cv.addEventListener('pointercancel',()=>{drag=null;cv.classList.remove('dragging');});
  cv.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')targetYaw-=.15;if(e.key==='ArrowRight')targetYaw+=.15;if(e.key==='ArrowUp')targetPitch=clamp(targetPitch-.10,-.5,.5);if(e.key==='ArrowDown')targetPitch=clamp(targetPitch+.10,-.5,.5);if(e.key==='Enter')pulse();if(e.key===' '){paused=!paused;updatePause();}draw();}});
  document.addEventListener('visibilitychange',()=>{hidden=document.hidden;last=0;if(!hidden)draw();});
  reduce.addEventListener('change',e=>{if(e.matches){paused=true;blend=mode;updatePause();draw();}});
  new ResizeObserver(resize).observe(cv);updatePause();resize();raf=requestAnimationFrame(frame);
}else{$('fallback').hidden=false;document.querySelectorAll('button,input').forEach(e=>e.disabled=true);}

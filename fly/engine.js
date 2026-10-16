"use strict";
// Neural equations adapted from ひゅーまん「ハエのうた」.
// https://hyu-man.com/fly/ — MANC v1.2.1 wiring data.
// Neural timing is retained; sound.js provides a gentler musical arrangement.
const cv=document.getElementById("cv"),ctx=cv.getContext("2d");
const btn=document.getElementById("go"),st=document.getElementById("st");
const songState=document.getElementById("song-state"),playLabel=document.getElementById("play-label");
const stage=document.getElementById("stage"),whisper=document.getElementById("whisper");
const elapsedLabel=document.getElementById("elapsed"),signal=document.getElementById("signal");
const volume=document.getElementById("volume"),muteButton=document.getElementById("mute");
let CELLS=null,IDS=[],TYP=[],SIDE=[],W=null,Nn=0;
const TAU={pIP10:.03,dPR1:.012,vPR6:.008,TN1a:.04,vMS12:.01,dMS9:.015};
const REF={pIP10:.01,dPR1:.02,vPR6:.024,TN1a:.008,vMS12:.012,dMS9:.03};
const COL={pIP10:"#bb8c64",dPR1:"#ff678e",vPR6:"#bc859b",TN1a:"#8a3a2e",vMS12:"#ba7965",dMS9:"#b79b54"};
const DRIVE=259,GSYN=3.0,DT=0.0005;
let V,refr,sprev,glow,tn1s=0,running=false,simt=0;
let ac=null,sound=null,audioFrameTime=0,audioFrameSimt=0;
let P=null,edges=[],wiring=false,muted=false,previousVolume=45,audioTimer=0,lastFrame=0,accumulator=0;
let actors={};

async function load(){
  try{
    const [dataResponse,sceneResponse]=await Promise.all([fetch("data.json"),fetch("choir.svg")]);
    if(!dataResponse.ok||!sceneResponse.ok)throw new Error("Asset load failed");
    const d=await dataResponse.json();
    document.getElementById("scene").innerHTML=await sceneResponse.text();
    actors={dPR1:document.getElementById("fly-pulse"),TN1a:document.getElementById("fly-sine"),dMS9:document.getElementById("fly-beat")};
    Object.values(actors).forEach(el=>el?.classList.add("performer"));
    CELLS=d.cells; IDS=Object.keys(CELLS).sort(); Nn=IDS.length;
    TYP=IDS.map(i=>CELLS[i].type); SIDE=IDS.map(i=>CELLS[i].side==="right"?1:-1);
    const idx={}; IDS.forEach((c,i)=>idx[c]=i);
    W=Array.from({length:Nn},()=>new Float32Array(Nn));
    for(const e of d.edges){ const [f,t,s]=e.split(","); if(f in idx&&t in idx) W[idx[t]][idx[f]]+=(+s)/100; }
    V=new Float32Array(Nn); refr=new Float32Array(Nn); sprev=new Float32Array(Nn); glow=new Float32Array(Nn);
    P=IDS.map((_,i)=>pos(i));
    edges=IDS.map((_,i)=>IDS.map((_,j)=>[W[j][i],j]).filter(([w])=>w>.5).sort((a,b)=>b[0]-a[0]).slice(0,3));
    btn.disabled=false;songState.textContent="まだ、しずか。";
    st.textContent="「うたわせる」で、はじまります。";
    requestAnimationFrame(draw);
  }catch(error){st.textContent="読み込めませんでした。ページを再読み込みしてください。";st.classList.add("load-error");songState.textContent="合唱団の準備に失敗しました";}
}
function pos(i){
  const groups={pIP10:[0,65],dPR1:[0,145],vPR6:[0,235],TN1a:[1,170],vMS12:[2,170],dMS9:[2,310]};
  const same=IDS.filter((c,j)=>TYP[j]===TYP[i]&&SIDE[j]===SIDE[i]);
  const k=same.indexOf(IDS[i]),n=same.length;
  const [col,cy]=groups[TYP[i]];
  const span=Math.min(245,n*23);
  return [550+SIDE[i]*(105+col*140),cy+(n>1?(k-(n-1)/2)*(span/Math.max(1,n-1)):0)+30];
}
function boutDrive(t){
  // Original deterministic input schedule; no random rhythm generator.
  const B=[[1,4.2],[5.3,8.1],[9.4,13.2],[14.1,16.8],[18,21.5],[22.6,26.4],[27.3,30.1],[31.4,35.3],[36.2,39.9],[41,43.8]];
  const tt=t%45;
  for(const [a,b] of B){ if(tt>=a&&tt<b){ const ph=tt-a; return [1, (Math.floor(ph/0.9)%2===0)?1:0.45]; } }
  return [0,0];
}
function step(){
  const [on,pb]=boutDrive(simt);
  let ssum=0; for(let i=0;i<Nn;i++) ssum+=sprev[i];
  const inew=new Float32Array(Nn);
  for(let i=0;i<Nn;i++){
    let inp=0; const row=W[i];
    if(ssum>0){ for(let j=0;j<Nn;j++) if(sprev[j]) inp+=row[j]; }
    let v=V[i]*(1-DT/TAU[TYP[i]]) + inp*GSYN - GSYN*0.25*ssum/Nn*10;
    if(TYP[i]==="pIP10") v+=DRIVE*on*pb*DT;
    if(refr[i]>simt) v=0;
    if(v>1){ inew[i]=1; v=0; refr[i]=simt+REF[TYP[i]]; fire(i); glow[i]=1; }
    V[i]=Math.max(-1,v);
  }
  sprev=inew; simt+=DT;
  tn1s=0; for(let i=0;i<Nn;i++) if(TYP[i]==="TN1a") tn1s+=V[i];
}
function fire(i){
  if(!sound)return;
  sound.spike(TYP[i],SIDE[i],i,simt,audioFrameTime+(simt-audioFrameSimt));
}
function audioLoop(){
  if(!running) return;
  sound.activity(tn1s);
  audioTimer=setTimeout(audioLoop,40);
}
function draw(time){
  const elapsed=lastFrame?Math.min((time-lastFrame)/1000,.04):0;lastFrame=time;
  if(running){audioFrameTime=ac.currentTime+.025;audioFrameSimt=simt;accumulator+=elapsed;while(accumulator>=DT){step();accumulator-=DT;}}
  const [on,pb]=boutDrive(simt);
  const message=running?(on?(pb>.6?"てん、てん。うたっている。":"ふわり。声がつながる。"):"すこし、ひとやすみ。"):"まだ、しずか。";
  if(whisper.textContent!==message)whisper.textContent=message;
  const seconds=Math.floor(simt),clockText=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
  if(elapsedLabel.textContent!==clockText)elapsedLabel.textContent=clockText;
  let brightest=0;
  for(const [type,el] of Object.entries(actors)){
    let activity=0;for(let i=0;i<Nn;i++)if(TYP[i]===type)activity=Math.max(activity,glow[i]);
    brightest=Math.max(brightest,activity);
    if(el)el.style.setProperty("--hop",(-Math.round(activity*3)*4)+"px");
  }
  signal.style.opacity=(.2+.8*brightest).toFixed(2);
  if(wiring){
    ctx.clearRect(0,0,1100,430);
    for(let i=0;i<Nn;i++){
      const [x,y]=P[i];
      for(const [,j] of edges[i]){const [x2,y2]=P[j];ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo((x+x2)/2,y);ctx.lineTo((x+x2)/2,y2);ctx.lineTo(x2,y2);ctx.strokeStyle=`rgba(138,58,46,${.06+glow[i]*.25})`;ctx.lineWidth=1;ctx.stroke();}
    }
    for(let i=0;i<Nn;i++){
      const [x,y]=P[i],g=glow[i],outer=10+Math.round(g*4),inner=5+Math.round(g*3);ctx.globalAlpha=.08+g*.12;ctx.fillStyle=COL[TYP[i]];ctx.fillRect(x-outer,y-outer,outer*2,outer*2);
      ctx.globalAlpha=.58+g*.42;ctx.fillRect(x-inner,y-inner,inner*2,inner*2);ctx.globalAlpha=1;
    }
    ctx.font="14px 'DotGothic16', monospace";ctx.textAlign="center";ctx.fillStyle="#956f65";ctx.fillText("ひだり",165,36);ctx.fillText("みぎ",935,36);
    [["pIP10 · 合図",COL.pIP10],["dPR1 · パルス",COL.dPR1],["vPR6",COL.vPR6],["TN1a · サイン",COL.TN1a],["vMS12 · 粒",COL.vMS12],["dMS9 · 鼓動",COL.dMS9]].forEach(([name,color],k)=>{ctx.fillStyle=color;ctx.fillRect(83+k*172,401,7,7);ctx.fillStyle="#956f65";ctx.fillText(name,145+k*172,409);});
  }
  for(let i=0;i<Nn;i++)glow[i]*=Math.pow(.86,elapsed*60);
  requestAnimationFrame(draw);
}
function setView(isWiring){
  wiring=isWiring;cv.hidden=!wiring;stage.classList.toggle("wiring",wiring);
  document.getElementById("forest-view").classList.toggle("selected",!wiring);document.getElementById("forest-view").setAttribute("aria-pressed",String(!wiring));
  document.getElementById("wiring-view").classList.toggle("selected",wiring);document.getElementById("wiring-view").setAttribute("aria-pressed",String(wiring));
  document.getElementById("stage-title").textContent=wiring?"うたの奥の、配線図":"ちいさなハエの音楽会";
}
document.getElementById("forest-view").onclick=()=>setView(false);document.getElementById("wiring-view").onclick=()=>setView(true);
function applyVolume(){
  const level=Number(volume.value);muted=level===0;
  if(sound)sound.level(running?level/100:0);
  document.getElementById("volume-value").textContent=`${level}%`;
  muteButton.setAttribute("aria-pressed",String(muted));muteButton.setAttribute("aria-label",muted?"音を出す":"ミュートにする");
  document.getElementById("volume-waves").setAttribute("d",muted?"M16 9l5 6M21 9l-5 6":"M15 8q5 4 0 8M18 5q8 7 0 14");
}
volume.oninput=()=>{if(Number(volume.value)>0)previousVolume=Number(volume.value);applyVolume();};
muteButton.onclick=()=>{if(!muted)previousVolume=Number(volume.value)||45;volume.value=muted?previousVolume:0;applyVolume();};
function pause(){
  running=false;clearTimeout(audioTimer);accumulator=0;document.body.classList.remove("performing");
  playLabel.textContent="もういちど、きく";document.getElementById("play-icon").innerHTML='<path d="M4 11h13l-5-5 1-1 7 7-7 7-1-1 5-5H4z" fill="currentColor"/>';
  songState.textContent="ひとやすみ。";st.textContent="続きから、また聴けます。";btn.setAttribute("aria-pressed","false");
  if(sound)sound.pause();
}
btn.onclick=async()=>{
  if(!W)return;if(running){pause();return;}
  btn.disabled=true;
  try{
    if(!ac){
      ac=new(window.AudioContext||window.webkitAudioContext)();sound=new LittleFlySound(ac);
    }
    await ac.resume();running=true;applyVolume();lastFrame=0;document.body.classList.add("performing");
    playLabel.textContent="ひとやすみ";document.getElementById("play-icon").innerHTML='<path d="M7 5h4v14H7zM15 5h4v14h-4z" fill="currentColor"/>';
    songState.textContent="うたっている。";st.textContent="配線に沿って、ちいさな光が走っています。";btn.setAttribute("aria-pressed","true");
    clearTimeout(audioTimer);audioLoop();
  }catch(error){st.textContent="音を再生できませんでした。もう一度お試しください。";}finally{btn.disabled=false;}
};
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running)pause();});
load();

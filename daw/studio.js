import {RULES} from './engine.js';
export const NAMES=['蟻','ライフ','コラッツ','そろう','歩幅','こえ'];
export const SECTIONS=['入口','ひらく','輪郭','うねり','余白','もう一度','ひろがる','帰る'];
export const STYLES={glass:{name:'ほどける電子音',bpm:112,space:.28},night:{name:'夜の余白',bpm:72,space:.62},dance:{name:'小さなダンス',bpm:124,space:.18}};
export const clamp=(v,a,b,d)=>Number.isFinite(+v)?Math.min(b,Math.max(a,+v)):d;
export function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.codePointAt(0),16777619);return h>>>0;}
export function defaults(){return {version:2,voiceText:'おかえり。まだ、ここにいる。',voiceKind:'low',title:'まだ名前のない曲',prompt:'',style:'glass',bpm:112,bars:32,key:57,space:.28,variation:0,tracks:NAMES.map((name,i)=>({seed:[0,93,27,15,5,7][i],vol:[.65,.55,.7,.35,.55,.8][i],pan:[-.25,.3,0,-.1,.1,0][i],tone:['bell','pad','bass','percussion','percussion','voice'][i],mute:false,solo:false,density:1,sections:[[.45,1,1,1,0,.45,1,.45],[1,1,.45,1,1,.45,1,1],[0,.45,1,1,.45,1,1,.45],[0,0,.45,1,0,.45,1,0],[0,.45,1,1,0,.45,1,0],[.45,0,1,1,.45,1,1,.45]][i]}))};}
export function validate(raw){
 if(!raw||![1,2].includes(raw.version)||!Array.isArray(raw.tracks)||![5,6].includes(raw.tracks.length))throw Error('このスタジオのプロジェクトを選んでください。');
 const p=defaults();p.voiceText=String(raw.voiceText??p.voiceText).slice(0,200);p.voiceKind=['low','soft','robot'].includes(raw.voiceKind)?raw.voiceKind:'low';p.title=String(raw.title||p.title).slice(0,80);p.prompt=String(raw.prompt||'').slice(0,500);
 p.style=Object.hasOwn(STYLES,raw.style)?raw.style:'glass';p.bpm=clamp(raw.bpm,55,170,112);p.bars=[16,32,48,64].includes(+raw.bars)?+raw.bars:32;
 p.key=[57,60,62,64].includes(+raw.key)?+raw.key:57;p.space=clamp(raw.space,0,.75,.28);p.variation=Math.floor(clamp(raw.variation,0,100000,0));
 p.tracks=raw.tracks.map((t,i)=>{t=t||{};return {seed:Math.floor(clamp(t.seed,[0,0,1,2,1,0][i],[400,99999,9999999,60,15,9999][i],p.tracks[i].seed)),vol:clamp(t.vol,0,1,.6),pan:clamp(t.pan,-1,1,0),density:clamp(t.density,.25,1,1),tone:i===5?'voice':['bell','pad','bass','pluck','percussion'].includes(t.tone)?t.tone:p.tracks[i].tone,mute:!!t.mute,solo:!!t.solo,sections:Array.from({length:8},(_,j)=>clamp(t.sections?.[j],0,1,1))};});if(p.tracks.length===5)p.tracks.push({...defaults().tracks[5],mute:true});return p;
}
export function fromWords(p){
 const n=structuredClone(p),text=n.prompt;
 n.style=/眠|夜|静|余白|ambient|sleep/i.test(text)?'night':/踊|ダンス|dance|跳|速/i.test(text)?'dance':n.style;
 Object.assign(n,{bpm:STYLES[n.style].bpm,space:STYLES[n.style].space});
 const h=hash(text+'|'+n.variation);n.tracks.forEach((t,i)=>{t.seed=[h%401,(h>>>4)%100000,1+(h>>>8)%5000,6+(h>>>16)%35,3+(h>>>23)%7,(h>>>10)%10000][i];});
 return n;
}
const hz=m=>440*2**((m-69)/12);
const nearest=(m,root,scale)=>{let best=root,dist=Infinity;for(let o=-3;o<4;o++)for(const s of scale){const n=root+o*12+s;if(Math.abs(n-m)<dist){dist=Math.abs(n-m);best=n;}}return best;};
export function compose(p){
 const evs=[],step=60/p.bpm/4,total=p.bars*16,span=total/8,makers=RULES.map((f,i)=>f(p.tracks[i].seed));
 const solo=p.tracks.some(t=>t.solo);const shifts=[0,-4,3,-2],chords=[[0,3,7],[0,4,7],[0,4,7],[0,4,7]];
 for(let k=0;k<total;k++){
  const section=Math.min(7,Math.floor(k/span)),bar=Math.floor(k/16),ch=Math.floor(bar/2)%4,root=p.key+shifts[ch];
  for(let i=0;i<p.tracks.length;i++){
   const tr=p.tracks[i];let raw=[];
   if(i<4){const r=makers[i];if(k%r.div===0)raw=r.advance();}
   else if(i===4){const hit=(k%16*tr.seed)%16<tr.seed;if(hit)raw=[{drum:k%4===0?'kick':'hat'}];}
   else if(k%2===0){const chars=Array.from(p.voiceText);const char=chars[Math.floor(k/2)%chars.length];if(char&&!/[\s。、，,.!?！？ー…]/u.test(char))raw=[{hz:hz(root+[0,3,7,10][hash(char+tr.seed+Math.floor(k/16))%4]),vol:.13,char}];}
   const activity=tr.sections[section];
   if(tr.mute||(solo&&!tr.solo)||activity===0)continue;
   for(let j=0;j<raw.length;j++){
    const e=raw[j];const divisor=p.style==='night'?[8,3,4,2,4,2][i]:[2,1,2,1,1,1][i];
    // Rules always advance, including in muted sections. Arrangement thins observations only.
    if(Math.floor(k/(i<4?makers[i].div:1))%divisor)continue;
    if((hash(`${i}:${k}:${j}`)%1000)/1000>tr.density* (activity<.7?.55:1))continue;
    let midi,dur,amp,kind=e.drum?'percussion':tr.tone;
    if(e.drum){dur=e.drum==='shot'?.35:.1;amp=e.drum==='shot'?.17:.09;}
    else {
     let m=69+12*Math.log2(e.hz/440);m=nearest(m,root,chords[ch]);
     if(i===2){while(m>52)m-=12;while(m<33)m+=12;}else if(i===1){while(m>69)m-=12;while(m<45)m+=12;}else{while(m>84)m-=12;while(m<57)m+=12;}
     midi=m;dur=kind==='pad'?Math.min(7,step*24):kind==='bass'?step*3.6:kind==='bell'?Math.max(.5,step*5):step*2.5;
     if(p.style==='night')dur*=1.5;
     if(i===5){midi=m-(p.voiceKind==='low'?12:0);dur=Math.min(.18,step*1.35);}
     amp=(e.vol||.06)*(kind==='pad'?.9:1.6);
    }
    const t=k*step;const endFade=Math.min(1,(total-k)/(span*.5));
    evs.push({i,k,t,midi,hz:midi===undefined?0:hz(midi),dur,amp:amp*activity*endFade,kind,drum:e.drum,char:e.char,voiceKind:i===5?p.voiceKind:undefined});
   }
  }
 }
 evs.sort((a,b)=>a.t-b.t||a.i-b.i);return {evs,body:total*step,duration:total*step+5,step};
}
const noiseCache=new WeakMap();
function noise(ctx){if(noiseCache.has(ctx))return noiseCache.get(ctx);const b=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(hash(String(i))%65536)/32768-1;noiseCache.set(ctx,b);return b;}
export function graph(ctx,p){
 const master=ctx.createGain();master.gain.value=.65;
 const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=16;comp.ratio.value=5;comp.attack.value=.008;comp.release.value=.25;
 master.connect(comp);comp.connect(ctx.destination);
 const delay=ctx.createDelay(2);delay.delayTime.value=60/p.bpm*.75;
 const feedback=ctx.createGain();feedback.gain.value=.28;
 const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=p.style==='night'?1300:3200;
 const wet=ctx.createGain();wet.gain.value=p.space;
 delay.connect(low);low.connect(feedback);feedback.connect(delay);low.connect(wet);wet.connect(master);
 const pans=[];
 const tracks=p.tracks.map(t=>{const gain=ctx.createGain(),pan=ctx.createStereoPanner();gain.gain.value=t.vol;pan.pan.value=t.pan;gain.connect(pan);pan.connect(master);pan.connect(delay);pans.push(pan);return gain;});
 return {master,tracks,pans,nodes:[master,comp,delay,feedback,low,wet,...tracks,...pans],voices:new Set()};
}
export function sound(ctx,g,e,t){
 if(e.kind==='voice'){vocal(ctx,g,e,t);return;}
 const env=ctx.createGain(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=.5;filter.frequency.value=e.kind==='pad'?1000:e.kind==='bass'?700:5500;
 env.connect(filter);filter.connect(g.tracks[e.i]);let sources=[],extras=[];
 const end=t+e.dur;
 if(e.kind==='percussion'){
  if(e.drum==='kick'){
   const o=ctx.createOscillator();o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);sources.push(o);e={...e,amp:e.amp*2.4,dur:.28};
  }else{const n=ctx.createBufferSource();n.buffer=noise(ctx);sources.push(n);filter.type='highpass';filter.frequency.value=e.drum==='shot'?1200:5500;}
 }else{
  const o=ctx.createOscillator();o.type=e.kind==='bass'?'triangle':'sine';o.frequency.value=e.hz;sources.push(o);
  if(e.kind==='pad'||e.kind==='bell'){
   const o2=ctx.createOscillator(),a=ctx.createGain();o2.frequency.value=e.hz*(e.kind==='pad'?1.002:2.001);a.gain.value=e.kind==='pad'?.28:.12;o2.connect(a);a.connect(env);extras.push(a);sources.push(o2);
  }
 }
 const dur=e.dur,attack=e.kind==='pad'?Math.min(1.2,dur*.3):.012;
 env.gain.setValueAtTime(.00001,t);env.gain.linearRampToValueAtTime(Math.max(.00002,e.amp),t+attack);env.gain.exponentialRampToValueAtTime(.00001,t+dur);
 sources[0].connect(env);const v={sources};g.voices.add(v);
 let ended=0;for(const o of sources){o.onended=()=>{o.disconnect();if(++ended===sources.length){env.disconnect();filter.disconnect();extras.forEach(n=>n.disconnect());g.voices.delete(v);}};o.start(t);o.stop(t+dur+.04);}
}
// A short voiced pulse through parallel vowel resonances. No recorded voice samples.
export function vowelFor(char){
 const c=String(char||'a').normalize('NFKC').toLowerCase();
 const groups=['あかがさざただなはばぱまやらわぁゃa','いきぎしじちぢにひびぴみりぃi','うくぐすずつづぬふぶぷむゆるぅゅu','えけげせぜてでねへべぺめれぇe','おこごそぞとどのほぼぽもよろをぉょo'];
 const hira=c.replace(/[ァ-ヶ]/g,x=>String.fromCharCode(x.charCodeAt(0)-96));
 const found=groups.findIndex(v=>v.includes(hira));return found<0?hash(c)%5:found;
}
export function vocal(ctx,g,e,t){
 const formants=[[730,1090,2440],[270,2290,3010],[300,870,2240],[530,1840,2480],[570,840,2410]][vowelFor(e.char)];
 const o=ctx.createOscillator(),env=ctx.createGain(),nodes=[];
 o.type=e.voiceKind==='robot'?'square':'sawtooth';o.frequency.setValueAtTime(e.hz*1.025,t);o.frequency.exponentialRampToValueAtTime(e.hz,t+.04);
 const color=e.voiceKind==='soft'?1.18:e.voiceKind==='robot'?.85:1;
 formants.forEach((freq,j)=>{const filter=ctx.createBiquadFilter(),gain=ctx.createGain();filter.type='bandpass';filter.frequency.value=freq*color;filter.Q.value=[5,7,9][j];gain.gain.value=[1.5,.8,.4][j];o.connect(filter);filter.connect(gain);gain.connect(env);nodes.push(filter,gain);});
 env.connect(g.tracks[e.i]);env.gain.setValueAtTime(.00001,t);env.gain.linearRampToValueAtTime(e.amp,t+.012);env.gain.exponentialRampToValueAtTime(.00001,t+e.dur);
 const v={sources:[o]};g.voices.add(v);o.onended=()=>{o.disconnect();env.disconnect();nodes.forEach(n=>n.disconnect());g.voices.delete(v);};o.start(t);o.stop(t+e.dur+.02);
}
export async function wav(p){
 const song=compose(p),sr=44100,ctx=new OfflineAudioContext(2,Math.ceil(song.duration*sr),sr),g=graph(ctx,p);
 song.evs.forEach(e=>sound(ctx,g,e,.05+e.t));g.master.gain.setValueAtTime(.65,song.body);g.master.gain.linearRampToValueAtTime(0,song.duration-.1);
 const b=await ctx.startRendering(),n=b.length,v=new DataView(new ArrayBuffer(44+n*4));
 const str=(o,s)=>{for(let j=0;j<s.length;j++)v.setUint8(o+j,s.charCodeAt(j));};str(0,'RIFF');v.setUint32(4,36+n*4,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sr,true);v.setUint32(28,sr*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,n*4,true);
 let peak=0;for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let j=0;j<n;j++){peak=Math.max(peak,Math.abs(d[j]));v.setInt16(44+j*4+c*2,Math.round(Math.max(-1,Math.min(1,d[j]))*32767),true);}}
 return {blob:new Blob([v],{type:'audio/wav'}),peak};
}
export function midi(p){
 const song=compose(p),vlq=v=>{let a=[v&127];while(v>>=7)a.unshift((v&127)|128);return a;},str=s=>Array.from(s,c=>c.charCodeAt(0)),chunk=(s,a)=>[...str(s),(a.length>>>24)&255,(a.length>>>16)&255,(a.length>>>8)&255,a.length&255,...a];
 const us=Math.round(60000000/p.bpm),tempo=chunk('MTrk',[0,255,81,3,us>>>16&255,us>>>8&255,us&255,0,255,47,0]);
 const tracks=p.tracks.map((tr,i)=>{const channel=i===3||i===4?9:i,notes=[];
  song.evs.filter(e=>e.i===i).forEach(e=>{const note=e.midi??(e.drum==='kick'?36:e.drum==='shot'?38:42),k=e.k*120,d=Math.max(1,Math.round(e.dur/song.step*120));const vel=Math.min(127,Math.max(1,Math.round(e.amp*tr.vol*700)));if(tr.vol===0)return;notes.push([k,[144|channel,note,vel]],[k+d,[128|channel,note,0]]);});
  notes.sort((a,b)=>a[0]-b[0]||a[1][0]-b[1][0]);let prev=0,bytes=[0,192|channel,[10,89,38,0,0,54][i]];
  for(const [t,data]of notes){bytes.push(...vlq(t-prev),...data);prev=t;}return chunk('MTrk',[...bytes,0,255,47,0]);});
 return new Blob([new Uint8Array([...chunk('MThd',[0,1,0,p.tracks.length+1,1,224]),...tempo,...tracks.flat()])],{type:'audio/midi'});
}

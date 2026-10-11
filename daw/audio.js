import {compose,hash} from './composition.js';
const hz=n=>440*2**((n-69)/12),cache=new WeakMap();
// drums are the owner's own SC-synthesized one-shots (scdrums_loud); decoded once, shared across contexts
const SAMPLES={k9:'sc909_kick_a',k9l:'sc909_kick_long',s9:'sc909_snare_a',s9b:'sc909_snare_b',h9:'sc909_chh',o9:'sc909_ohh',k8:'sc808_kick_a',s8:'sc808_snare_a',h8:'sc808_chh',o8:'sc808_ohh',rim:'sc808_rim',clv:'sc808_clave'};
const KITS={
 garage:{kick:['k9',1,.62],snare:['s9',1,.5],rim:['rim',1,.4],hat:['h9',1,.3],open:['o9',1,.34]},
 soft:{kick:['k8',1,.6],snare:['s8',1,.46],rim:['rim',.92,.34],hat:['h8',1,.26],open:['o8',1,.3]},
 wood:{kick:['k9l',1,.6],snare:['s9b',1,.5],rim:['clv',1,.42],hat:['h9',1.12,.28],open:['o9',1.12,.3]},
};
const kit={buffers:null,promise:null};
export function loadKit(){
 if(kit.promise)return kit.promise;
 kit.promise=(async()=>{
  const dec=new OfflineAudioContext(1,8,44100),out={};
  await Promise.all(Object.entries(SAMPLES).map(async([key,name])=>{
   const res=await fetch(new URL('./samples/'+name+'.m4a',import.meta.url));
   if(!res.ok)throw Error(name);
   out[key]=await dec.decodeAudioData(await res.arrayBuffer());
  }));
  kit.buffers=out;return out;
 })().catch(e=>{kit.promise=null;throw e;});
 return kit.promise;
}
function buffers(ctx){
 if(cache.has(ctx))return cache.get(ctx);
 const noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=noise.getChannelData(0);
 for(let i=0;i<d.length;i++)d[i]=(hash(i)%65536)/32768-1;
 // the room: early burst, then a tail that both fades and darkens; the two channels decorrelated
 const sr=ctx.sampleRate,len=Math.round(sr*1.8),ir=ctx.createBuffer(2,len,sr);
 for(let c=0;c<2;c++){const a=ir.getChannelData(c);let y=0;
  for(let i=0;i<len;i++){const x=((hash(i+':'+c)%65536)/32768-1)*Math.exp(-i/sr*3.1)*(1+.5*Math.exp(-i/sr*55));
   const alpha=.7-.58*(i/len);y+=alpha*(x-y);a[i]=y*.6;}}
 const b={noise,ir};cache.set(ctx,b);return b;
}
function filter(ctx,type,f,q=.707){const n=ctx.createBiquadFilter();n.type=type;n.frequency.value=f;n.Q.value=q;return n;}
function compressor(ctx,threshold,ratio,attack,release){const n=ctx.createDynamicsCompressor();n.threshold.value=threshold;n.knee.value=8;n.ratio.value=ratio;n.attack.value=attack;n.release.value=release;return n;}
let shaperCurve=null;
function warmth(ctx){
 if(!shaperCurve){shaperCurve=new Float32Array(1024);const k=1.6,norm=Math.tanh(k);
  for(let i=0;i<1024;i++){const x=i/511.5-1;shaperCurve[i]=Math.tanh(k*x)/norm;}}
 const n=ctx.createWaveShaper();n.curve=shaperCurve;n.oversample='2x';return n;
}
export function graph(ctx,p){
 const nodes=[],keep=(...v)=>(nodes.push(...v),v[0]);
 const sum=keep(ctx.createGain()),hp=keep(filter(ctx,'highpass',28)),glue=keep(compressor(ctx,-19,2.2,.02,.16));
 sum.connect(hp);hp.connect(glue);
 const tone=keep(filter(ctx,'peaking',310));tone.Q.value=.8;tone.gain.value=-1.4;glue.connect(tone);
 const high=keep(filter(ctx,'highshelf',6500));high.gain.value=1.2;tone.connect(high);
 // warmth: a gentle tanh stage between the EQ and the safety compressor
 const drive=keep(ctx.createGain()),shape=keep(warmth(ctx)),post=keep(ctx.createGain());
 drive.gain.value=1.18;post.gain.value=.88;high.connect(drive);drive.connect(shape);shape.connect(post);
 const safety=keep(compressor(ctx,-3,12,.002,.08)),master=keep(ctx.createGain());master.gain.value=p.master;
 post.connect(safety);safety.connect(master);master.connect(ctx.destination);
 const analyser=ctx.createAnalyser?keep(ctx.createAnalyser()):null;if(analyser){analyser.fftSize=256;master.connect(analyser);}
 // stereo echo: a dotted-eighth left, half a beat longer right, lightly cross-fed
 const beat=60/p.bpm,delay=keep(ctx.createGain()),delayWet=keep(ctx.createGain());delayWet.gain.value=p.space*.3;
 const dL=keep(ctx.createDelay(2)),dR=keep(ctx.createDelay(2)),fL=keep(ctx.createGain()),fR=keep(ctx.createGain());
 const dark=keep(filter(ctx,'lowpass',3600)),darkR=keep(filter(ctx,'lowpass',3100)),dHP=keep(filter(ctx,'highpass',380)),dHPR=keep(filter(ctx,'highpass',380));
 const pL=keep(ctx.createStereoPanner()),pR=keep(ctx.createStereoPanner());pL.pan.value=-.4;pR.pan.value=.4;
 dL.delayTime.value=beat*.75;dR.delayTime.value=beat*1.125;fL.gain.value=.22;fR.gain.value=.2;
 delay.connect(dL);delay.connect(dR);
 dL.connect(dark);dark.connect(dHP);dHP.connect(fL);fL.connect(dL);const xLR=keep(ctx.createGain());xLR.gain.value=.08;dHP.connect(xLR);xLR.connect(dR);
 dR.connect(darkR);darkR.connect(dHPR);dHPR.connect(fR);fR.connect(dR);
 dHP.connect(pL);dHPR.connect(pR);pL.connect(delayWet);pR.connect(delayWet);delayWet.connect(sum);
 const reverb=keep(ctx.createConvolver()),revHP=keep(filter(ctx,'highpass',450)),revWet=keep(ctx.createGain());reverb.buffer=buffers(ctx).ir;revWet.gain.value=p.space*.7;reverb.connect(revHP);revHP.connect(revWet);revWet.connect(sum);
 const tracks=[],pans=[],pumps=[],tones=[];
 p.tracks.forEach((tr,i)=>{
  const input=keep(ctx.createGain()),eq=keep(filter(ctx,i===3?'lowpass':'highpass',[180,180,115,115,350,200,300,30][i]));
  const color=keep(filter(ctx,'lowpass',[7200,6000,3200,120,8200,5200,4200,16000][i]));
  const pump=keep(ctx.createGain()),gain=keep(ctx.createGain()),pan=keep(ctx.createStereoPanner()),send=keep(ctx.createGain());
  gain.gain.value=tr.vol;pan.pan.value=i===2||i===3?0:tr.pan;send.gain.value=[.3,.12,0,0,.32,.2,.2,.04][i];
  input.connect(eq);eq.connect(color);color.connect(pump);pump.connect(gain);gain.connect(pan);pan.connect(sum);pan.connect(send);send.connect(delay);send.connect(reverb);
  tracks.push(input);pans.push(pan);pumps.push(pump);tones.push(color);
  // Per-track gain is intentionally separate from the voice input.
  input.mixGain=gain;
 });
 return {nodes,master,tracks,pans,pumps,tones,analyser,voices:new Set(),project:p,mainLevel:p.master};
}
export function automate(ctx,g,song,start,offset=0){
 const now=Math.max(ctx.currentTime,start+offset),p=g.project,beat=60/p.bpm;
 for(let i=0;i<7;i++){
  const gain=g.pumps[i].gain,amount=p.pump*([.65,.8,1,.6,.75,.65,.4][i]);gain.setValueAtTime(1,now);
  for(let b=Math.ceil(offset/beat);b<song.body/beat;b++){
   const t=start+b*beat;if(t<now)continue;
   const sec=song.sections.find(s=>b/4>=s.start&&b/4<s.start+s.length);if([0,4,8].includes(sec.index))continue;
   gain.setValueAtTime(1-amount,t);gain.linearRampToValueAtTime(1,t+beat*.58);
  }
  for(const b of song.blocks){const t=start+(b.bar-1)*16*song.step;if(t<now)continue;const base=[7200,6000,3200,120,8200,5200,4200][i];if(i===3)continue;const f=g.tones[i].frequency;f.setValueAtTime(base*(.35+b.filter*.65),t);f.linearRampToValueAtTime(base*(.42+b.filter*.58),t+48*song.step);}
 }
 // Sparse, explicitly scheduled transitions: a four-pulse gate on the final beat only.
 for(const b of song.blocks.filter(b=>b.glitch)){
  const t=start+(b.bar+2)*16*song.step+12*song.step;
  for(let n=0;n<4;n++){const at=t+n*song.step;if(at<now)continue;g.master.gain.setValueAtTime(p.master*(1-p.glitch),at);g.master.gain.linearRampToValueAtTime(p.master,at+song.step*.65);}
 }
 g.master.gain.setValueAtTime(p.master,Math.max(now,start+song.body));g.master.gain.linearRampToValueAtTime(0,Math.max(now+.05,start+song.duration-.05));
}
export function sound(ctx,g,e,t){
 const nodes=[],sources=[],env=ctx.createGain(),out=g.tracks[e.i];nodes.push(env);env.connect(out);
 const dur=Math.max(.04,e.dur),amp=e.amp*(e.i===7?.34:.2);
 const gain=(value,destination=env)=>{const a=ctx.createGain();a.gain.value=value;a.connect(destination);nodes.push(a);return a;};
 const panner=v=>{const p2=ctx.createStereoPanner();p2.pan.value=v;p2.connect(env);nodes.push(p2);return p2;};
 const osc=(type,f,level=1,destination=env,detune=0,pan=null)=>{const o=ctx.createOscillator();o.type=type;o.frequency.value=f;o.detune.value=detune;o.connect(gain(level,pan===null?destination:panner(pan)));sources.push(o);return o;};
 const noise=(type,f,q,level)=>{const s=ctx.createBufferSource(),filt=filter(ctx,type,f,q);s.buffer=buffers(ctx).noise;s.connect(filt);filt.connect(gain(level));nodes.push(filt);sources.push(s);return s;};
 const wide=(type,f,level,cents,width)=>{osc(type,f,level);osc(type,f,level*.62,env,cents,width);osc(type,f,level*.62,env,-cents,-width);};
 let attack=.006,release=dur,sampleVoice=false;
 if(e.kind==='drums'){
  const bank=KITS[e.preset]||KITS.garage,pick=bank[e.drum]||bank.hat,buf=kit.buffers&&kit.buffers[pick[0]];
  if(buf){
   const s=ctx.createBufferSource();s.buffer=buf;s.playbackRate.value=pick[1];
   const lvl=gain(pick[2]*e.amp*1.7);s.connect(lvl);sources.push(s);sampleVoice=true;
   const stop=t+Math.min(buf.duration/pick[1],e.drum==='open'?.9:.6)+.02;
   const voice={sources,nodes,end:stop};g.voices.add(voice);
   s.onended=('startRendering' in ctx)?null:()=>{sources.forEach(n=>n.disconnect());nodes.forEach(n=>n.disconnect());g.voices.delete(voice);};
   s.start(t);s.stop(stop);return;
  }
  const soft=e.preset==='soft',wood=e.preset==='wood';
  if(e.drum==='kick'){const o=osc('sine',soft?105:145,1);o.frequency.setValueAtTime(soft?105:145,t);o.frequency.exponentialRampToValueAtTime(soft?42:48,t+.065);noise('highpass',2600,.7,.025);release=.26;}
  else if(e.drum==='snare'){noise('bandpass',wood?1600:2200,.75,1.5);osc('triangle',wood?260:185,.22);release=soft?.12:.19;}
  else if(e.drum==='rim'){osc('triangle',wood?680:920,.42);osc('sine',1600,.16);noise('bandpass',2200,2,.12);release=.075;}
  else{noise('highpass',soft?6500:8500,.7,.55);release=e.drum==='open'?.22:.055;}
 }else{
  const f=hz(e.midi);
  if(e.kind==='sub'){osc('sine',f,.95);osc('sine',2*f,e.preset==='soft'?.14:.07);attack=.012;}
  else if(e.kind==='bass'){
   if(e.preset==='reese'){osc('sawtooth',f,.26,env,-9,-.55);osc('sawtooth',f,.26,env,9,.55);osc('sine',f,.2);}
   else{const carrier=osc('sine',f,.8);osc('sine',f*(e.preset==='wood'?2:1),f*.75,carrier.frequency);osc('triangle',f,.12,env,-5,-.3);osc('triangle',f,.12,env,5,.3);}
  }else if(e.kind==='lead'){
   if(e.preset==='reed'){osc('triangle',f,.55);osc('triangle',f,.26,env,7,.5);osc('triangle',f,.26,env,-7,-.5);osc('sine',f*3,.1);}
   else{const c=osc('sine',f,.72);osc('sine',f*(e.preset==='glass'?2.01:2),f*(e.preset==='glass'?.7:.3),c.frequency);osc('sine',f,.16,env,9,.6);osc('sine',f,.16,env,-9,-.6);}
   attack=.015;
  }else if(e.kind==='chord'){
   osc('sine',f,.55);osc('sine',f,.22,env,6,.55);osc('sine',f,.22,env,-6,-.55);osc('sine',f*2,.2);osc(e.preset==='hollow'?'triangle':'sine',f*3,.1);release=e.preset==='felt'?Math.max(.3,dur):dur;
  }else if(e.kind==='arp'){
   const c=osc('sine',f,.65);osc('sine',f*(e.preset==='metal'?3.51:e.preset==='drop'?1:2.01),f*.65,c.frequency);osc('sine',f*2,.1,env,5,.45);osc('sine',f*2,.1,env,-5,-.45);release=Math.min(.55,dur);
  }else if(e.kind==='keys'){
   osc('sine',f,.55);osc('sine',f,.18,env,4,.4);osc('sine',f,.18,env,-4,-.4);osc('sine',f*2.001,.16);osc('sine',f*3.99,e.preset==='felt'?.035:.08);release=Math.min(1.5,dur);
  }else if(e.kind==='pad'){
   const warm=e.preset==='warm',ty=warm?'sine':'triangle';
   osc(ty,f,.17,env,5,.4);osc(ty,f,.17,env,-5,-.4);osc(ty,f,.1,env,13,.75);osc(ty,f,.1,env,-13,-.75);
   osc('sine',f*(warm?.5:2),warm?.2:.09);attack=Math.min(warm?.28:.45,dur*.22);
  }
 }
 if(sampleVoice)return;
 const stopAt=t+Math.max(release,attack+.02)+.04;
 env.gain.setValueAtTime(.00001,t);env.gain.linearRampToValueAtTime(Math.max(.00002,amp),t+attack);env.gain.exponentialRampToValueAtTime(.00001,stopAt-.02);
 const voice={sources,nodes,end:stopAt};g.voices.add(voice);let ended=0;
 sources.forEach(o=>{if(!('startRendering' in ctx))o.onended=()=>{o.disconnect();if(++ended===sources.length){nodes.forEach(n=>n.disconnect());g.voices.delete(voice);}};o.start(t);o.stop(stopAt);});
}
export async function render(p,{sampleRate=44100,onProgress=()=>{}}={}){
 try{await loadKit();}catch{/* 素材が読めなければ従来の合成ドラムで続ける */}
 const song=compose(p),ctx=new OfflineAudioContext(2,Math.ceil((song.duration+.05)*sampleRate),sampleRate),g=graph(ctx,p);
 automate(ctx,g,song,.05);
 // Keep only eight bars of future voices in the graph. Hundreds of dormant
 // oscillators otherwise make long offline renders unnecessarily expensive.
 const chunk=8*16*song.step;let index=0,boundary=chunk;
 const schedule=until=>{while(index<song.evs.length&&song.evs[index].t<until){const e=song.evs[index++];sound(ctx,g,e,e.t+.05);}};
 schedule(boundary);let suspended=boundary<song.body?ctx.suspend(boundary):null;
 const completed=ctx.startRendering();
 while(suspended){
  await suspended;
  for(const v of g.voices)if(v.end<=ctx.currentTime){v.sources.forEach(n=>n.disconnect());v.nodes.forEach(n=>n.disconnect());g.voices.delete(v);}
  onProgress(`音をまとめています… ${Math.min(99,Math.round(boundary/song.duration*100))}%`);
  boundary+=chunk;schedule(boundary);suspended=boundary<song.body?ctx.suspend(boundary):null;await ctx.resume();
 }
 const buffer=await completed;
 let peak=0,sum=0,nonfinite=0;for(let c=0;c<2;c++)for(const x of buffer.getChannelData(c)){if(!Number.isFinite(x)){nonfinite++;continue;}peak=Math.max(peak,Math.abs(x));sum+=x*x;}
 if(nonfinite)throw Error('音声に無効な値がありました。書き出しを停止しました。');
 const scale=peak>.97?.97/peak:1;return {buffer,metrics:{peak,outputPeak:peak*scale,gainReductionDb:20*Math.log10(scale),rms:Math.sqrt(sum/(buffer.length*2)),seconds:buffer.duration,notes:song.evs.length},scale};
}
export function encodeWav(buffer,scale=1){
 const n=buffer.length,bytes=n*2*3,v=new DataView(new ArrayBuffer(44+bytes)),str=(o,s)=>{for(let j=0;j<s.length;j++)v.setUint8(o+j,s.charCodeAt(j));};
 str(0,'RIFF');v.setUint32(4,36+bytes,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,buffer.sampleRate,true);v.setUint32(28,buffer.sampleRate*6,true);v.setUint16(32,6,true);v.setUint16(34,24,true);str(36,'data');v.setUint32(40,bytes,true);
 for(let i=0;i<n;i++)for(let c=0;c<2;c++){const x=Math.round(Math.max(-1,Math.min(1,buffer.getChannelData(c)[i]*scale))*8388607),at=44+(i*2+c)*3;v.setUint8(at,x&255);v.setUint8(at+1,x>>8&255);v.setUint8(at+2,x>>16&255);}
 return new Blob([v],{type:'audio/wav'});
}

import {RULES} from './engine.js';

export const ROLES=['メロディ','コード','ベース','サブ','きらめき','鍵盤','空気','ドラム'];
export const STYLES={
 garage:{name:'雨あがりの2ステップ',tag:'UK GARAGE',bpm:134,swing:.16,space:.25,key:53},
 broken:{name:'跳ねる電子音',tag:'BROKEN ELECTRONICA',bpm:118,swing:.09,space:.3,key:57},
 night:{name:'夜の余白',tag:'DOWNTEMPO',bpm:82,swing:.1,space:.5,key:50},
};
export const PRESETS={
 lead:[['round','まるいFM'],['reed','息のあるリード'],['glass','硝子の声']],
 chord:[['organ','短いオルガン'],['felt','やわらかい和音'],['hollow','空洞のスタブ']],
 bass:[['rubber','跳ねるベース'],['reese','ほどけるベース'],['wood','木の低音']],
 sub:[['sine','丸いサブ'],['soft','柔らかいサブ']],
 arp:[['pearl','小さな真珠'],['metal','金属の粒'],['drop','水の粒']],
 keys:[['tine','電気の鍵盤'],['felt','フェルト鍵盤']],
 pad:[['air','薄い空気'],['warm','温かい層']],
 drums:[['garage','乾いたガラージ'],['wood','木と紙'],['soft','遠いドラム'],['electro','電子の粒']],
};
export const ROLE_KEYS=Object.keys(PRESETS);
export const PROGRESSIONS={classic:{name:'帰ってくる',verse:[0,5,6,4],pre:[3,4,5,6],chorus:[5,6,4,0]},
 soft:{name:'少しせつない',verse:[0,2,5,6],pre:[3,5,4,6],chorus:[5,2,6,0]},
 drift:{name:'浮かんで、ひらく',verse:[0,6,5,6],pre:[3,0,5,6],chorus:[2,6,0,5]}};
const SCALE=[0,2,3,5,7,8,10], NOTES=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
export const clamp=(v,a,b,d=a)=>typeof v==='number'&&Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
export function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.codePointAt(0),16777619);return h>>>0;}
const pick=(a,s)=>a[hash(s)%a.length];
export function sections(bars=80){
 const lengths=bars===80?[8,12,4,16,8,8,4,16,4]:bars===64?[4,8,4,12,8,8,4,12,4]:[4,4,4,4,4,4,4,4,4];
 const names=['イントロ','ヴァース','プレ','サビ','ブレイク','ヴァース2','プレ2','最後のサビ','アウトロ'];
 let start=0;return lengths.map((length,i)=>{const s={name:names[i],start,length,index:i};start+=length;return s;});
}
export function defaults(){return {version:3,title:'雨あがりの帰り道',prompt:'雨がやんだ。最後は少し明るく。',style:'garage',bpm:134,key:53,bars:80,seed:2718,variation:0,progression:'classic',swing:.16,space:.25,pump:.34,glitch:.25,lift:.7,master:.8,
 tracks:ROLE_KEYS.map((key,i)=>({preset:PRESETS[key][0][0],vol:[.65,.55,.6,.48,.36,.42,.32,.75][i],pan:[.03,-.12,0,0,.22,-.22,.05,0][i],mute:false,solo:false,blocks:Array(20).fill(1)}))};}
export function validate(raw){
 if(!raw||raw.version!==3||!Array.isArray(raw.tracks)||raw.tracks.length!==8)throw Error('新版のプロジェクトJSONを選んでください。旧版の曲は「以前の曲を開く」から使えます。');
 const p=defaults();for(const key of ['title','prompt'])p[key]=typeof raw[key]==='string'?raw[key].slice(0,key==='title'?80:500):p[key];
 p.style=Object.hasOwn(STYLES,raw.style)?raw.style:'garage';p.bpm=Math.round(clamp(raw.bpm,60,160,134));p.key=Math.round(clamp(raw.key,48,59,53));p.bars=[36,64,80].includes(raw.bars)?raw.bars:80;
 p.seed=Math.floor(clamp(raw.seed,0,4294967295,2718));p.variation=Math.floor(clamp(raw.variation,0,99999,0));p.progression=Object.hasOwn(PROGRESSIONS,raw.progression)?raw.progression:'classic';
 for(const [k,max] of [['swing',.3],['space',.7],['pump',.65],['glitch',.6],['lift',1],['master',1]])p[k]=clamp(raw[k],0,max,p[k]);
 p.tracks=raw.tracks.map((t,i)=>{t=t&&typeof t==='object'?t:{};const base=p.tracks[i];return {preset:PRESETS[ROLE_KEYS[i]].some(([v])=>v===t.preset)?t.preset:base.preset,vol:clamp(t.vol,0,1,base.vol),pan:i===2||i===3?0:clamp(t.pan,-1,1,base.pan),mute:!!t.mute,solo:!!t.solo,blocks:Array.from({length:p.bars/4},(_,j)=>[0,.45,1].includes(t.blocks?.[j])?t.blocks[j]:1)};});return p;
}
export function generate(old){
 const p=validate(old),style=STYLES[p.style];p.seed=hash(p.prompt+'|'+p.variation+'|'+p.style);
 p.bpm=style.bpm;p.key=style.key;p.swing=style.swing;p.space=style.space;
 // A visible style choice is authoritative; words choose the deterministic musical seed.
 p.tracks.forEach((t,i)=>{t.preset=pick(PRESETS[ROLE_KEYS[i]],p.seed+':vessel:'+i)[0];t.blocks.fill(1);t.solo=false;t.mute=false;});
 if(p.style==='night'){p.tracks[7].preset='soft';p.tracks[6].preset='warm';p.pump=.16;p.glitch=.1;}
 else if(p.style==='broken'){p.tracks[7].preset='wood';p.pump=.25;p.glitch=.4;}
 else{p.tracks[7].preset='garage';p.pump=.34;p.glitch=.25;}
 return p;
}
function chord(p,degree){const root=p.key+SCALE[degree],minor=[0,3,4].includes(degree),dim=degree===1;return {name:NOTES[root%12]+(dim?'dim':minor?'m':''),root,notes:[root,root+(minor||dim?3:4),root+(dim?6:7)]};}
const ACTIVE=[
 [0,0,0,0,1,.6,.7,.35], [.45,.8,1,1,.45,0,0,1], [.5,.7,.8,0,.7,0,.45,.8],
 [1,1,1,1,.7,.25,0,1], [.45,0,0,.3,.3,.8,.8,.25], [.7,.75,1,1,.55,0,0,1],
 [.7,.8,.8,0,.8,0,.5,.85], [1,1,1,1,.85,.35,0,1], [0,.25,0,0,.3,.7,.55,.25],
];
const KICKS={garage:[[0,10],[0,7,13],[0,10],[0,7,10,14]],broken:[[0,6,11],[0,9],[0,6,14],[0,7,11]],night:[[0],[0,10],[0],[0,11]]};
const LEAD_RHYTHM=[[2,5],[12,7],[5,7],[3,5],[13,2]];

export function compose(input){
 const p=validate(input),evs=[],arpRegions=[],blocks=[],form=sections(p.bars),step=60/p.bpm/4,body=p.bars*16*step;
 const ant=RULES[0](p.seed%401),collatz=RULES[2](1+p.seed%4999),solo=p.tracks.some(t=>t.solo);
 const rules=Array.from({length:p.bars},()=>({melody:ant.advance()[0],bass:collatz.advance()[0]}));
 const add=(i,bar,s,len,midi,amp=.65,extra={})=>{
  const block=Math.floor(bar/4),tr=p.tracks[i],section=form.find(f=>bar>=f.start&&bar<f.start+f.length),activity=ACTIVE[section.index][i]*tr.blocks[block];
  if(!activity||tr.mute||(solo&&!tr.solo)||tr.vol===0)return;
  const swing=s%2===1?p.swing:0,t=(bar*16+s+swing)*step;if(t>=body)return;
  const lift=section.index===7&&[0,4,5].includes(i)?.65+.5*p.lift:1;
  evs.push({i,k:bar*16+s+swing,t,dur:Math.min(len*step,body-t),midi,amp:amp*activity*lift,kind:ROLE_KEYS[i],preset:tr.preset,block,section:section.index,...extra});
 };
 for(let bar=0;bar<p.bars;bar++){
  const sec=form.find(f=>bar>=f.start&&bar<f.start+f.length),local=bar-sec.start,block=Math.floor(bar/4),four=bar%4;
  const prog=sec.index===2||sec.index===6?'pre':sec.index===3||sec.index===7?'chorus':'verse';
  const ch=chord(p,PROGRESSIONS[p.progression][prog][four]);
  const isFinal=sec.index===7,isChorus=sec.index===3||isFinal,pre=sec.index===2||sec.index===6;
  if(four===0){
   const upper=(block%2?7:10),pair=[p.key+12,p.key+12+upper];
   arpRegions.push({block,start:bar*16*step,duration:64*step,notes:pair,pattern:block%4});
   blocks.push({index:block,bar:bar+1,section:sec.name,chords:PROGRESSIONS[p.progression][prog].map(d=>chord(p,d).name),kick:[],filter:sec.index===4?.25:pre?.85:isChorus?.75:.45,arpPattern:block%4,glitch:p.glitch>0&&[2,3,6,7].includes(sec.index)&&local+4>=sec.length});
  }
  // Chord tones, sparse syncopated dyads, and a separate root in the low register.
  const stabs=p.style==='night'?[3]:four%2?[3,11]:[2,10];
  stabs.forEach((s,j)=>[ch.notes[1],ch.notes[j%2?0:2]].forEach(n=>add(1,bar,s,p.style==='night'?5:1.5,n+12,.6)));
  const rb=ch.root-12;
  const bassSteps=p.style==='night'?[[0,5],[10,3]]:four%2?[[0,3],[7,2],[13,2]]:[[0,3],[10,3]];
  bassSteps.forEach(([s,len],j)=>add(2,bar,s,len,rb+(j===1&&rules[bar].bass?.hz>150?12:0),.72));
  add(3,bar,1,12,rb-12,.6);
  // A five-note phrase is derived from the ant; chorus repeats a hook with a response.
  const phrase=hash(p.seed+':hook')%3,degree=isChorus?[2,4,3,1][four]:hash(String(rules[bar].melody?.hz))%5;
  const scalePitch=p.key+12+SCALE[(degree+phrase)%7]+(isFinal&&p.lift>.35?12:0);
  const [ls,ll]=LEAD_RHYTHM[(four+(block%2))%LEAD_RHYTHM.length];add(0,bar,ls,ll,scalePitch,.8);
  if(isChorus&&four===3)add(0,bar,12,3,p.key+19+(isFinal&&p.lift>.35?12:0),.64);
  // Two held inputs drive this deterministic arpeggiator; expanded notes are exported to MIDI.
  const pair=arpRegions[block].notes,arpSteps=p.style==='night'?[6,14]:[2,6,10,14];
  arpSteps.forEach((s,j)=>{if((j+four+block)%4!==0)add(4,bar,s,2.8,pair[(j+four)%2]+(block%3===2&&j===2?12:0),.5);});
  if(four%2===0)for(const n of ch.notes)add(5,bar,5,9,n,.48);
  if(four%2===0)for(const n of [ch.notes[1],ch.notes[2]])add(6,bar,8,22,n,.42);
  let kicks=[...KICKS[p.style][four]],snares=p.style==='night'?[8]:[4,12],hats=p.style==='night'?[6,14]:[2,6,10,14];
  if(sec.index===0){kicks=local<4?[]:[0];snares=[];hats=local<4?[]:[6,14];}
  if(sec.index===4){kicks=[];snares=[];hats=local>=4?[6,14]:[];}
  if(sec.index===8){kicks=four===0?[0]:[];snares=[];hats=four<2?[6,14]:[];}
  if(pre&&four===3){kicks=[0,10];snares=[4,10,12,14];}
  blocks[block].kick.push(kicks);
  kicks.forEach(s=>add(7,bar,s,2.8,36,.9,{drum:'kick'}));
  snares.forEach(s=>add(7,bar,s,2,38,s===10||s===14?.38:.7,{drum:'snare'}));
  hats.forEach((s,j)=>add(7,bar,s,.65,42,j%2?.38:.52,{drum:'hat'}));
  if(isChorus&&four%2===1)add(7,bar,14,2,46,.35,{drum:'open'});
  if(four===3&&sec.index!==0&&sec.index!==4&&sec.index!==8)add(7,bar,pick([7,15],p.seed+':'+block),.9,39,.28,{drum:'rim'});
  // 10/12: the rest of the owner's kit joins - a crash on each chorus head, a small perc in the chorus,
  // and a three-tom fill on the last bar of every full section
  if(isChorus&&local===0)add(7,bar,0,4,49,.5,{drum:'crash'});
  if(isChorus&&four===2)add(7,bar,7,.8,54,.3,{drum:'perc'});
  if(local===sec.length*4-1&&sec.index!==0&&sec.index!==4&&sec.index!==8){add(7,bar,10,1.4,43,.55,{drum:'tomlo'});add(7,bar,12,1.4,45,.58,{drum:'tommid'});add(7,bar,14,1.4,47,.6,{drum:'tomhi'});}
 }
 evs.sort((a,b)=>a.t-b.t||a.i-b.i||a.midi-b.midi);
 const metrics={notes:evs.length,tonalNotes:evs.filter(e=>e.i!==7).length,drumHits:evs.filter(e=>e.i===7).length,average:evs.length/body,maxPerSecond:0};
 let j=0;for(let i=0;i<evs.length;i++){while(evs[i].t-evs[j].t>=1)j++;metrics.maxPerSecond=Math.max(metrics.maxPerSecond,i-j+1);}
 return {evs,arpRegions,blocks,sections:form,body,duration:body+3,step,metrics};
}
export function explain(p){const s=compose(p);return `${p.title}\n${STYLES[p.style].name} / ${p.bpm} BPM / ${NOTES[p.key%12]} minor / ${p.bars}小節\n種 ${p.seed} / 版 ${p.variation+1}\n\n`+
 s.blocks.map(b=>`${b.bar}–${b.bar+3}小節 ${b.section}: ${b.chords.join(' → ')}\n  キック（0始まり16分位置） ${b.kick.map(a=>a.join(',')||'休み').join(' | ')} / アルペジオ型${b.arpPattern+1} / フィルター開き${b.filter}${b.glitch?' / 最後の拍に短いゲート':''}`).join('\n')+
 '\n\n音色\n'+p.tracks.map((t,i)=>`${ROLES[i]}: ${PRESETS[ROLE_KEYS[i]].find(v=>v[0]===t.preset)[1]}`).join('\n')+
 `\n\n${s.metrics.notes}イベント（音符${s.metrics.tonalNotes}、打音${s.metrics.drumHits}）。\n蟻の向きとコラッツの出力を音程の選択に使います。和音・形式・リズム・音色はこのスタジオの編曲です。アルペジオは長い2音から展開し、MIDIには展開後の音符を書きます。\n音源はブラウザー内の合成プリセットです。SuperColliderやAudiotool自体をブラウザーで動かしたり、そのプリセット・サンプルを転載したものではありません。\n`;}

export function midi(p){
 const s=compose(p),enc=new TextEncoder(),str=t=>[...enc.encode(t)],u32=n=>[n>>>24&255,n>>>16&255,n>>>8&255,n&255],vlq=n=>{const a=[n&127];while(n>>=7)a.unshift((n&127)|128);return a;},chunk=(tag,a)=>[...str(tag),...u32(a.length),...a];
 const text=(type,t)=>{const b=str(t);return [255,type,...vlq(b.length),...b];},us=Math.round(60000000/p.bpm);
 const conductor=[{tick:0,data:[255,81,3,us>>>16&255,us>>>8&255,us&255]},{tick:0,data:[255,88,4,4,2,24,8]},...s.blocks.map(b=>({tick:(b.bar-1)*1920,data:text(6,`${b.section}: ${b.chords.join(' ')}`)}))];
 const track=events=>{events.sort((a,b)=>a.tick-b.tick||(a.off?0:1)-(b.off?0:1));let at=0,bytes=[];for(const e of events){bytes.push(...vlq(e.tick-at),...e.data);at=e.tick;}bytes.push(...vlq(Math.max(0,p.bars*1920-at)),255,47,0);return chunk('MTrk',bytes);};
 const tracks=[track(conductor),...p.tracks.map((t,i)=>{const channel=i===7?9:i,events=[{tick:0,data:text(3,ROLES[i])},{tick:0,data:[192|channel,[80,16,38,38,10,4,89,0][i]]}];
  s.evs.filter(e=>e.i===i).forEach(e=>{const tick=Math.round(e.k*120),duration=Math.max(1,Math.round(e.dur/s.step*120)),velocity=Math.max(1,Math.min(127,Math.round(e.amp*t.vol*127)));events.push({tick,data:[144|channel,e.midi,velocity]},{tick:tick+duration,data:[128|channel,e.midi,0],off:true});});return track(events);})];
 return new Blob([new Uint8Array([...chunk('MThd',[0,1,0,9,1,224]),...tracks.flat()])],{type:'audio/midi'});
}

import {ROLES,ROLE_KEYS,PRESETS,STYLES,defaults,validate,generate,compose,explain,midi} from './composition.js';
import {graph,automate,sound,render,encodeWav} from './audio.js';
const $=id=>document.getElementById(id),STORE='hyuman-song-studio-v3',labels=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
let project=defaults(),song,selected=0,offset=0,ctx,run=null,starting=false,busy=false,urls=[];
const message=s=>{$('status').textContent=s;},clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const encode=p=>btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(p)))),decode=s=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0))));
function oldProject(raw){return raw&&[1,2].includes(raw.version);}
function openLegacy(raw){location.assign('./v2/#p='+encode(raw));}
if(!location.hash&&['bpm','ant'].some(k=>new URLSearchParams(location.search).has(k)))location.replace('./v2/'+location.search);
try{let raw;if(location.hash.startsWith('#p=')){if(location.hash.length>24000)throw Error('リンクが長すぎます。');raw=decode(location.hash.slice(3));}else raw=JSON.parse(localStorage.getItem(STORE)||'null');if(raw){if(oldProject(raw))openLegacy(raw);else project=validate(raw);}}catch{message('保存データを開けませんでした。新しい曲から始めます。');}
for(let n=48;n<60;n++){const o=document.createElement('option');o.value=n;o.textContent=labels[n%12]+' minor';$('key').append(o);}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(project));$('saveState').textContent='この端末に保存しました';}catch{$('saveState').textContent='制作途中をファイル保存してください';}}
function stop(keep=true){
 if(!run)return;const r=run;offset=keep?Math.min(song.duration,Math.max(0,ctx.currentTime-r.start)):0;run=null;clearInterval(r.timer);cancelAnimationFrame(r.raf);
 r.g.master.gain.cancelScheduledValues(ctx.currentTime);r.g.master.gain.setTargetAtTime(0,ctx.currentTime,.01);
 setTimeout(()=>{for(const v of r.g.voices)for(const source of v.sources){try{source.stop();}catch{}}r.g.nodes.forEach(n=>n.disconnect());},80);
 $('play').textContent='▶ 聴いてみる';$('meterFill').style.width='0';position();
}
function position(t=offset){
 $('time').textContent=`${clock(t)} / ${clock(song.duration)}`;$('seek').value=Math.min(1000,t/song.duration*1000);
 const bar=Math.min(project.bars-1,Math.max(0,Math.floor(t/(16*song.step)))),block=song.blocks[Math.floor(bar/4)],sec=song.sections.find(s=>bar>=s.start&&bar<s.start+s.length);
 $('currentChord').textContent=block.chords[bar%4];$('chordSequence').textContent=block.chords.join(' → ');$('nowSection').textContent=t>=song.body?'余韻':sec.name;
 document.querySelectorAll('#journey button').forEach((el,i)=>el.classList.toggle('active',sec.index===i));
}
async function play(){
 if(run){stop();return;}if(starting)return;starting=true;$('play').disabled=true;
 try{
  ctx??=new(window.AudioContext||window.webkitAudioContext)();await ctx.resume();if(offset>=song.duration-.1)offset=0;
  const g=graph(ctx,project),r={g,start:ctx.currentTime+.08-offset,index:song.evs.findIndex(e=>e.t>=offset),timer:0,raf:0};if(r.index<0)r.index=song.evs.length;run=r;automate(ctx,g,song,r.start,offset);
  const schedule=()=>{if(run!==r)return;const end=ctx.currentTime+.25;while(r.index<song.evs.length&&r.start+song.evs[r.index].t<end){const e=song.evs[r.index++],at=r.start+e.t;if(at>=ctx.currentTime-.03)sound(ctx,g,e,Math.max(at,ctx.currentTime));}};
  const meter=new Float32Array(g.analyser?.fftSize||256);let lastUI=0;
  const frame=stamp=>{if(run!==r)return;const t=Math.max(0,ctx.currentTime-r.start);if(stamp-lastUI>80){position(t);if(g.analyser){g.analyser.getFloatTimeDomainData(meter);const peak=Math.max(...meter.map(Math.abs));$('meterFill').style.width=Math.min(100,peak*120)+'%';}lastUI=stamp;}if(t>=song.duration){stop(false);return;}r.raf=requestAnimationFrame(frame);};
  schedule();r.timer=setInterval(schedule,40);r.raf=requestAnimationFrame(frame);$('play').textContent='Ⅱ 一時停止';
 }catch{stop();message('音声を開始できませんでした。ブラウザーの音声設定を確認してください。');}finally{starting=false;$('play').disabled=false;}
}
function draw(cv,events,start,duration,color='#65382f'){
 cv.width=200;cv.height=70;const c=cv.getContext('2d');c.fillStyle=color;for(const e of events){const x=(e.t-start)/duration*200,y=e.i===7?58:58-(e.midi-24)/72*50;c.globalAlpha=e.i===7?.4:.65;c.fillRect(x,Math.max(4,y),Math.max(2,e.dur/duration*200),3);}
}
function journey(){
 $('journey').replaceChildren();song.sections.forEach(sec=>{const b=document.createElement('button');b.style.flexGrow=sec.length;b.setAttribute('aria-label',`${sec.name} ${sec.start+1}〜${sec.start+sec.length}小節から再生`);const cv=document.createElement('canvas'),label=document.createElement('span');label.textContent=sec.name;b.append(cv,label);b.onclick=()=>{stop(false);offset=sec.start*16*song.step;position();play();};$('journey').append(b);draw(cv,song.evs.filter(e=>e.section===sec.index),sec.start*16*song.step,sec.length*16*song.step);});
}
function timeline(){
 const el=$('timeline');el.replaceChildren();el.style.setProperty('--blocks',song.blocks.length);const ruler=document.createElement('div');ruler.className='row ruler';ruler.append(document.createElement('span'));song.blocks.forEach(b=>{const x=document.createElement('span');x.textContent=b.bar;ruler.append(x);});el.append(ruler);
 project.tracks.forEach((tr,i)=>{const row=document.createElement('div');row.className='row';const name=document.createElement('button');name.className='role'+(selected===i?' selected':'');name.textContent=ROLES[i];name.setAttribute('aria-label',ROLES[i]+'の音色を選ぶ');name.onclick=()=>{selected=i;timeline();inspector();};row.append(name);
  tr.blocks.forEach((v,j)=>{const b=document.createElement('button');b.className='block';b.dataset.amount=v;b.setAttribute('aria-label',`${ROLES[i]} ${j*4+1}〜${j*4+4}小節 ${v===0?'休み':v<1?'薄く':'全部'}`);const cv=document.createElement('canvas');b.append(cv);b.onclick=()=>{tr.blocks[j]=v===1?.45:v===.45?0:1;rebuild();message(`${ROLES[i]}の${j*4+1}〜${j*4+4}小節を変えました。`);};row.append(b);draw(cv,song.evs.filter(e=>e.i===i&&e.block===j),j*64*song.step,64*song.step);});el.append(row);
 });
}
function inspector(){const tr=project.tracks[selected];$('presetLabel').textContent=ROLES[selected]+'の音色';$('preset').replaceChildren();for(const [id,label]of PRESETS[ROLE_KEYS[selected]]){const o=document.createElement('option');o.value=id;o.textContent=label;$('preset').append(o);}$('preset').value=tr.preset;$('roleInfo').textContent=song.evs.filter(e=>e.i===selected).length+' 音';}
function mixer(){
 $('channels').replaceChildren();project.tracks.forEach((tr,i)=>{const box=document.createElement('div');box.className='channel';const name=document.createElement('h3');name.textContent=ROLES[i];box.append(name);
  for(const [field,label,min,max]of [['vol','音量',0,100],['pan','左右',-100,100]]){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.value=tr[field]*100;input.setAttribute('aria-label',ROLES[i]+' '+label);input.disabled=field==='pan'&&[2,3].includes(i);input.oninput=()=>{tr[field]=+input.value/100;if(run){const param=field==='vol'?run.g.tracks[i].mixGain.gain:run.g.pans[i].pan;param.setTargetAtTime(tr[field],ctx.currentTime,.02);}persist();};input.onchange=()=>{rebuild();};l.append(input);box.append(l);}
  for(const [key,label]of [['mute','MUTE'],['solo','SOLO']]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label',ROLES[i]+' '+label);b.setAttribute('aria-pressed',tr[key]);b.onclick=()=>{tr[key]=!tr[key];rebuild();mixer();};box.append(b);}$('channels').append(box);
 });
}
function controls(){
 for(const k of ['title','prompt','bpm','key','progression'])$(k).value=project[k];$('length').value=project.bars;document.querySelector(`input[name=style][value="${project.style}"]`).checked=true;
 for(const k of ['lift','swing','space','pump','glitch'])$(k).value=project[k]*100;mixer();
}
function rebuild(){stop();song=compose(project);offset=Math.min(offset,song.duration);journey();timeline();inspector();position();persist();$('songMeta').textContent=`${STYLES[project.style].tag} / ${project.bpm} BPM / ${labels[project.key%12]} minor / ${project.bars} BARS`;$('metrics').textContent=`${song.blocks.length}区間・音符 ${song.metrics.tonalNotes} / 打音 ${song.metrics.drumHits}。再生とWAVは同じ楽譜を使います。`;}
function apply(p){stop(false);offset=0;project=validate(p);controls();rebuild();}
function offer(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');urls.push(url);a.href=url;a.download=name;a.textContent='↓ '+name;$('downloads').prepend(a);a.click();while(urls.length>8){URL.revokeObjectURL(urls.shift());$('downloads').lastElementChild?.remove();}}
const filename=()=>project.title.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim().slice(0,60)||'ならす';
$('play').onclick=play;$('rewind').onclick=()=>{stop(false);offset=0;position();};$('seek').onchange=()=>{const next=+$('seek').value/1000*song.duration,resume=!!run;stop();offset=next;position();if(resume)play();};
for(const k of ['lift','swing','space','pump','glitch'])$(k).onchange=()=>{project[k]=+$(k).value/100;rebuild();};
for(const k of ['bpm','key'])$(k).onchange=()=>{project[k]=+$(k).value;project=validate(project);controls();rebuild();};
$('progression').onchange=()=>{project.progression=$('progression').value;rebuild();};$('preset').onchange=()=>{project.tracks[selected].preset=$('preset').value;rebuild();};
$('title').oninput=()=>{project.title=$('title').value;persist();};
// Prompt, style and length are a draft until the user chooses to generate a song.
function create(another=false){const next=structuredClone(project);next.prompt=$('prompt').value;next.style=document.querySelector('input[name=style]:checked').value;next.bars=+$('length').value;next.variation=another?project.variation+1:0;apply(generate(next));message('一曲できました。イントロから最後のサビまで、聴いてみてください。');}
$('create').onclick=()=>create();$('another').onclick=()=>create(true);
$('save').onclick=()=>offer(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),filename()+'.json');
$('recipe').onclick=()=>offer(new Blob([explain(project)],{type:'text/plain;charset=utf-8'}),filename()+'_作り方.txt');
$('midi').onclick=()=>{offer(midi(project),filename()+'.mid');message('MIDIを書き出しました。8パートと、区間・コードの目印が入っています。');};
$('load').onclick=()=>$('file').click();$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;try{if(f.size>100000)throw Error('ファイルが大きすぎます。');const raw=JSON.parse(await f.text());if(oldProject(raw)){openLegacy(raw);return;}apply(raw);message('制作途中を開きました。');}catch(e){message(e.message||'開けませんでした。');}finally{$('file').value='';}};
$('share').onclick=async()=>{const link=location.origin+location.pathname+'#p='+encode(project);history.replaceState(null,'',link);try{await navigator.clipboard.writeText(link);message('曲名・言葉・設定を含むリンクをコピーしました。');}catch{message('アドレス欄のURLをコピーしてください。曲名・言葉・設定も含まれます。');}};
$('wav').onclick=async()=>{if(busy)return;busy=true;stop();$('wav').disabled=true;const p=structuredClone(project),name=filename();message('WAVを書き出しています…');try{const {buffer,scale,metrics}=await render(p,{onProgress:message});offer(encodeWav(buffer,scale),name+'.wav');message(`WAVを書き出しました。44.1 kHz / 24 bit / stereo${scale<1?'。歪み防止のため全体の音量を下げました。':''}`);}catch(e){message('WAVを書き出せませんでした。36小節で再度お試しください。');}finally{busy=false;$('wav').disabled=false;}};
window.addEventListener('pagehide',()=>{stop();urls.forEach(u=>URL.revokeObjectURL(u));});
controls();rebuild();

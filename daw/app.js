import {NAMES,SECTIONS,STYLES,defaults,validate,fromWords,compose,graph,sound,wav,midi,clamp} from './studio.js';
const $=id=>document.getElementById(id),STORE='hyuman-rule-studio-v1';
let project=defaults(),song,selected=0,offset=0,ac=null,run=null,busy=false,urls=[];
const message=s=>{$('status').textContent=s;};
const clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const encode=p=>btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(p))));
const decode=s=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0))));
try{
 const q=new URLSearchParams(location.search),saved=localStorage.getItem(STORE);
 if(location.hash.startsWith('#p=')){if(location.hash.length>24000)throw Error('リンクが長すぎます。');project=validate(decode(location.hash.slice(3)));}
 else if(q.has('bpm')||q.has('ant')){
  project.bpm=clamp(q.get('bpm')||112,55,170,112);
  ['ant','life','col','burn'].forEach((key,i)=>{if(q.has(key))project.tracks[i].seed=+q.get(key);project.tracks[i].mute=(q.get('on')||'1111')[i]==='0';const vol=(q.get('v')||'').split(',')[i];if(vol!==undefined&&vol!=='')project.tracks[i].vol=+vol;});project=validate(project);message('以前のリンクの種・速さ・音量を引き継ぎました。');
 }else if(saved){project=validate(JSON.parse(saved));message('前回の制作途中を開きました。');}
}catch(e){message('保存された曲を開けませんでした。初期状態で始めます。');}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(project));$('saveState').textContent='この端末に保存しました';}catch(e){$('saveState').textContent='自動保存できません。プロジェクト保存を。';}}
function stop(keep=true){
 if(!run)return;const r=run;offset=keep?Math.min(song.duration,Math.max(0,ac.currentTime-r.start)):0;run=null;
 clearInterval(r.timer);cancelAnimationFrame(r.raf);r.g.master.gain.cancelScheduledValues(ac.currentTime);r.g.master.gain.setValueAtTime(r.g.master.gain.value,ac.currentTime);r.g.master.gain.linearRampToValueAtTime(0,ac.currentTime+.035);
 setTimeout(()=>{for(const v of r.g.voices)for(const o of v.sources){try{o.stop();}catch{}}r.g.nodes.forEach(n=>n.disconnect());},70);
 $('play').textContent='▶ 再生';position();
}
function position(t=offset){$('time').textContent=`${clock(t)} / ${clock(song.duration)}`;$('seek').value=Math.min(1000,t/song.duration*1000);const sec=t<song.body?Math.floor(t/song.body*8):-1;document.querySelectorAll('.clip').forEach(el=>el.classList.toggle('now',run!==null&&+el.dataset.section===sec));}
async function play(){
 if(run){stop();return;}
 try{
  ac??=new(window.AudioContext||window.webkitAudioContext)();await ac.resume();if(run)return;if(offset>=song.duration-.1)offset=0;
  const g=graph(ac,project),r={g,start:ac.currentTime+.07-offset,idx:song.evs.findIndex(e=>e.t>=offset),timer:null,raf:null};if(r.idx<0)r.idx=song.evs.length;run=r;
  g.master.gain.setValueAtTime(0,ac.currentTime);g.master.gain.linearRampToValueAtTime(.65,ac.currentTime+.09);
  if(r.start+song.body>ac.currentTime)g.master.gain.setValueAtTime(.65,r.start+song.body);
  g.master.gain.linearRampToValueAtTime(0,r.start+song.duration-.1);
  const schedule=()=>{if(run!==r)return;const limit=ac.currentTime+1.2;while(r.idx<song.evs.length&&r.start+song.evs[r.idx].t<limit){const e=song.evs[r.idx++],t=r.start+e.t;if(t>=ac.currentTime-.02)sound(ac,g,e,Math.max(t,ac.currentTime));}};
  const frame=()=>{if(run!==r)return;const t=Math.max(0,ac.currentTime-r.start);position(t);if(t>=song.duration){stop(false);return;}r.raf=requestAnimationFrame(frame);};
  schedule();r.timer=setInterval(schedule,50);r.raf=requestAnimationFrame(frame);$('play').textContent='Ⅱ 一時停止';
 }catch(e){stop();message('再生を開始できませんでした。ブラウザの音声設定を確認してください。');}
}
function rebuild(){stop();song=compose(project);offset=Math.min(offset,song.duration);timeline();inspector();position();persist();}
function clipDraw(cv,events,section){const cx=cv.getContext('2d'),w=cv.width=150,h=cv.height=55,span=song.body/8;cx.clearRect(0,0,w,h);cx.fillStyle='#805567';for(const e of events){const x=(e.t-section*span)/span*w;const y=e.midi===undefined?30:45-(e.midi-30)/60*35;cx.fillRect(x,Math.max(5,y),Math.max(2,e.dur/span*w),3);}}
function timeline(){
 const el=$('timeline');el.replaceChildren();const ruler=document.createElement('div');ruler.className='trow ruler';const lead=document.createElement('span');lead.textContent='TRACK / 小節';ruler.append(lead);
 SECTIONS.forEach((s,i)=>{const t=document.createElement('span');t.textContent=`${1+i*project.bars/8}  ${s}`;ruler.append(t);});el.append(ruler);
 NAMES.forEach((name,i)=>{const row=document.createElement('div');row.className='trow';const nameBtn=document.createElement('button');nameBtn.className='tname'+(selected===i?' selected':'');nameBtn.textContent=`0${i+1}  ${name}`;nameBtn.setAttribute('aria-label',`${name}を編集`);nameBtn.onclick=()=>{selected=i;timeline();inspector();};row.append(nameBtn);
  project.tracks[i].sections.forEach((amount,j)=>{const b=document.createElement('button');b.className='clip'+(amount===0?' empty':amount<.7?' soft':'');b.dataset.section=j;b.setAttribute('aria-label',`${name} ${SECTIONS[j]} ${amount===0?'休み':amount<.7?'薄く':'全部'}`);const cv=document.createElement('canvas');b.append(cv);b.onclick=()=>{project.tracks[i].sections[j]=amount===0?1:amount<.7?0:.45;rebuild();message(`${name}・${SECTIONS[j]}の音数を変えました。再生で確かめられます。`);};row.append(b);clipDraw(cv,song.evs.filter(e=>e.i===i&&Math.floor(e.t/song.body*8)===j),j);});el.append(row);});
}
const descriptions=['白なら右、黒なら左。蟻の向きから旋律を取り出します。','生まれたセルの行から音を取り出します。消えた声は補いません。','3n+1とn/2。数の軌跡から低音を取り出します。','一斉射撃の規則。境界が生まれ、そろった瞬間が打音になります。','16分音符の16個の位置に、種の数だけ打点を均等に散らします。'];
function inspector(){
 const tr=project.tracks[selected];$('trackTitle').textContent=`${NAMES[selected]} / TRACK 0${selected+1}`;$('seed').value=tr.seed;$('seed').min=[0,0,1,2,1][selected];$('seed').max=[400,99999,9999999,60,15][selected];$('tone').value=tr.tone;$('tone').disabled=selected>=3;$('density').value=tr.density*100;$('ruleText').textContent=descriptions[selected];
 const events=song.evs.filter(e=>e.i===selected);$('eventCount').textContent=`${events.length} notes`;
 const cv=$('piano'),cx=cv.getContext('2d');cx.clearRect(0,0,1000,150);cx.strokeStyle='#ddd9d0';cx.lineWidth=1;
 for(let j=0;j<8;j++){cx.beginPath();cx.moveTo(j*125,0);cx.lineTo(j*125,150);cx.stroke();}for(let y=0;y<150;y+=15){cx.beginPath();cx.moveTo(0,y);cx.lineTo(1000,y);cx.stroke();}
 cx.fillStyle='#b2617c';for(const e of events){const x=e.t/song.body*1000,y=e.midi===undefined?70:135-(e.midi-30)/60*120;cx.fillRect(x,Math.max(3,Math.min(140,y)),Math.max(2,e.dur/song.body*1000),5);}
}
function mixer(){
 $('channels').replaceChildren();project.tracks.forEach((tr,i)=>{const box=document.createElement('div');box.className='channel';const h=document.createElement('h3');h.textContent=NAMES[i];box.append(h);
  for(const [field,label,min,max]of [['vol','音量',0,100],['pan','左右',-100,100]]){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.value=tr[field]*100;input.setAttribute('aria-label',`${NAMES[i]} ${label}`);input.oninput=()=>{tr[field]=+input.value/100;if(run){const param=field==='vol'?run.g.tracks[i].gain:run.g.pans[i].pan;param.setTargetAtTime(tr[field],ac.currentTime,.03);}persist();};l.append(input);box.append(l);}
  const controls=document.createElement('div');controls.className='channel-buttons';for(const [field,label]of [['mute','MUTE'],['solo','SOLO']]){const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-pressed',String(tr[field]));b.setAttribute('aria-label',`${NAMES[i]} ${label}`);b.onclick=()=>{tr[field]=!tr[field];b.setAttribute('aria-pressed',String(tr[field]));rebuild();};controls.append(b);}box.append(controls);$('channels').append(box);});
}
function controls(){for(const key of ['title','prompt','style','bpm','bars','key'])$(key).value=project[key];$('space').value=project.space*100;mixer();}
function apply(p){const checked=validate(p);stop(false);offset=0;project=checked;controls();rebuild();}
function offer(blob,name){const url=URL.createObjectURL(blob);urls.push(url);const a=document.createElement('a');a.href=url;a.download=name;a.textContent=`↓ ${name}`;$('downloads').prepend(a);a.click();while(urls.length>8){URL.revokeObjectURL(urls.shift());$('downloads').lastElementChild?.remove();}}
const filename=()=>project.title.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim().slice(0,60)||'hyuman';
$('play').onclick=play;$('rewind').onclick=()=>{stop(false);offset=0;position();};
// Capture the desired seek value before stop updates the slider.
$('seek').onchange=()=>{const target=+$('seek').value/1000*song.duration,resume=!!run;stop();offset=target;position();if(resume)play();};
for(const key of ['bpm','bars','key'])$(key).onchange=()=>{project[key]=+$(key).value;project=validate(project);controls();rebuild();};
$('space').onchange=()=>{project.space=+$('space').value/100;rebuild();};
$('title').oninput=()=>{project.title=$('title').value;persist();};$('prompt').oninput=()=>{project.prompt=$('prompt').value;persist();};$('style').onchange=()=>{project.style=$('style').value;project.space=STYLES[project.style].space;$('space').value=project.space*100;rebuild();};
$('seed').onchange=()=>{project.tracks[selected].seed=+$('seed').value;project=validate(project);mixer();rebuild();};$('tone').onchange=()=>{project.tracks[selected].tone=$('tone').value;rebuild();};$('density').onchange=()=>{project.tracks[selected].density=+$('density').value/100;rebuild();};
$('create').onclick=()=>{project.prompt=$('prompt').value;project.style=$('style').value;project.variation=0;apply(fromWords(project));message('曲ができました。再生して、好きなところを残してください。');};
$('another').onclick=()=>{project.variation++;apply(fromWords(project));message(`同じ景色から、種 ${project.variation+1}。前の曲を残すときは、先にプロジェクト保存を。`);};
$('save').onclick=()=>offer(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),filename()+'.json');
$('load').onclick=()=>$('file').click();$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;try{if(f.size>100000)throw Error('ファイルが大きすぎます。');apply(JSON.parse(await f.text()));message('プロジェクトを開きました。');}catch(e){message(e.message||'ファイルを開けませんでした。');}finally{$('file').value='';}};
$('share').onclick=async()=>{try{const link=location.origin+location.pathname+'#p='+encode(project);history.replaceState(null,'',link);await navigator.clipboard.writeText(link);message('曲のリンクをコピーしました。編集内容も入っています。');}catch{message('アドレス欄のURLをコピーしてください。');}};
$('midi').onclick=()=>{try{offer(midi(project),filename()+'.mid');message('MIDIを書き出しました。音色は読み込む音源によって変わります。');}catch(e){message('MIDIの書き出しに失敗しました。');}};
$('wav').onclick=async()=>{if(busy)return;busy=true;const p=structuredClone(project),name=filename();$('wav').disabled=true;message('WAVを書き出しています…');try{const result=await wav(p);offer(result.blob,name+'.wav');message(result.peak>1?'WAVを書き出しました。音量が大きい箇所があります。ミキサーを下げると余裕ができます。':'WAVを書き出しました。44.1 kHz / 16 bit / stereo');}catch(e){message('WAVを書き出せませんでした。曲を短くして、もう一度お試しください。');}finally{busy=false;$('wav').disabled=false;}};
window.addEventListener('pagehide',()=>{stop();urls.forEach(u=>URL.revokeObjectURL(u));});
controls();rebuild();

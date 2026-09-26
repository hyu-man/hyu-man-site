(()=>{'use strict';
const $=id=>document.getElementById(id),video=$('video'),canvas=$('fx'),ctx=canvas.getContext('2d'),stage=$('stage');
let mode='heart',amount=.55,objectURL=null,ac=null,analyser=null,source=null,audioData=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let enabled=!reduced.matches;
let particles=[],width=640,height=400,last=0,spawnClock=0,elapsed=0,average=.015,envelope=0,lastHit=-1,loaded=false,seed=7;
const colors=['#ff719d','#f599b7','#e6b36f','#aa899f'];
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function status(s){$('status').textContent=s}
function resize(){const r=stage.getBoundingClientRect();width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0)}new ResizeObserver(resize).observe(stage);
function clear(){particles=[];envelope=0;average=.015;spawnClock=0;ctx.clearRect(0,0,width,height);$('meter').style.width='0%'}
function motionUI(){$('motion').textContent='エフェクト：'+(enabled?'オン':'オフ');$('motion').setAttribute('aria-pressed',String(enabled));if(!enabled)clear()}motionUI();$('motion').onclick=()=>{enabled=!enabled;motionUI()};reduced.addEventListener('change',e=>{enabled=!e.matches;motionUI()});
function resetControls(){loaded=false;$('play').disabled=true;$('back').disabled=true;$('seek').disabled=true;$('play').textContent='▶ 再生';$('seek').value=0;$('time').textContent='0:00 / 0:00'}
function load(src,name){video.pause();resetControls();clear();$('empty').hidden=true;$('filename').textContent=name;status('動画をひらいています…');video.src=src;video.load()}
function localFile(file){if(!file)return;if(file.type&&!file.type.startsWith('video/')&&!/\.(mp4|webm|mov|m4v)$/i.test(file.name)){status('動画ファイルを選んでね。MP4・WebMなどに対応。');return}const old=objectURL;objectURL=URL.createObjectURL(file);load(objectURL,file.name);if(old)URL.revokeObjectURL(old)}
$('choose').onclick=()=>{$('file').value='';$('file').click()};$('file').onchange=()=>localFile($('file').files[0]);
$('sample').onclick=()=>{const old=objectURL;objectURL=null;load('/over/its-over-v2.mp4',"ひゅーまん — It's Over! / サンプル");if(old)URL.revokeObjectURL(old)};
for(const ev of ['dragenter','dragover'])stage.addEventListener(ev,e=>{e.preventDefault();stage.classList.add('dragging')});stage.addEventListener('dragleave',()=>stage.classList.remove('dragging'));stage.addEventListener('drop',e=>{e.preventDefault();stage.classList.remove('dragging');localFile(e.dataTransfer.files[0])});
video.addEventListener('loadedmetadata',()=>{if(!Number.isFinite(video.duration)||video.duration<=0){status('この動画の長さを読み取れませんでした。別の動画を試してね。');return}loaded=true;$('play').disabled=false;$('back').disabled=false;$('seek').disabled=false;updateTime();status('準備できたよ。再生して、音でかざろう。')});
video.addEventListener('error',()=>{resetControls();$('empty').hidden=false;status('この動画を再生できませんでした。MP4（H.264）やWebMで試してね。')});
async function audio(){if(!ac){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('unsupported');ac=new AC()}if(!source){source=ac.createMediaElementSource(video);analyser=ac.createAnalyser();analyser.fftSize=1024;source.connect(analyser);analyser.connect(ac.destination);audioData=new Float32Array(analyser.fftSize)}if(ac.state==='suspended')await ac.resume()}
async function play(){if(!loaded)return;let analyzing=true;try{await audio()}catch(e){analyzing=false}try{await video.play();status(analyzing?'音を聴いて、かざっています。':'このブラウザでは音の分析が使えません。動画の再生はできます。')}catch(e){status('再生できませんでした。もう一度「再生」を押してね。')}}
$('play').onclick=()=>{if(video.paused)play();else video.pause()};$('back').onclick=()=>{if(!loaded)return;video.currentTime=0;clear();play()};video.addEventListener('play',()=>{$('play').textContent='Ⅱ 一時停止'});video.addEventListener('pause',()=>{$('play').textContent='▶ 再生'});video.addEventListener('ended',()=>{$('play').textContent='▶ もう一度';status('もう一度、ちがう気分で？')});
const clock=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');function updateTime(){const d=Number.isFinite(video.duration)?video.duration:0;$('time').textContent=clock(video.currentTime)+' / '+clock(d);if(d)$('seek').value=Math.round(video.currentTime/d*1000)}video.addEventListener('timeupdate',updateTime);$('seek').oninput=()=>{if(loaded){video.currentTime=Number($('seek').value)/1000*video.duration;clear()}};video.addEventListener('seeking',clear);
video.volume=.8;$('volume').oninput=()=>video.volume=Number($('volume').value)/100;
$('amount').oninput=()=>{amount=Number($('amount').value)/100;if(amount===0)clear()};
for(const button of document.querySelectorAll('[data-mode]'))button.onclick=()=>{mode=button.dataset.mode;for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b===button));clear()};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(stage.requestFullscreen)await stage.requestFullscreen();else status('このブラウザはエフェクト付き全画面に対応していません。横向きでも楽しめるよ。')}catch(e){status('全画面にできませんでした。このまま再生できます。')}};
function emit(count,burst=false){for(let i=0;i<count;i++){const a=random()*Math.PI*2;const speed=burst?45+random()*130:8+random()*22;particles.push({x:burst?width/2:random()*width,y:burst?height*.52:height+16,vx:burst?Math.cos(a)*speed:(random()-.5)*15,vy:burst?Math.sin(a)*speed:-speed,age:0,life:mode==='sleep'?6+random()*4:2+random()*3,size:(1+random()*2.7)*Math.min(width/600,1.7),color:colors[Math.floor(random()*colors.length)],spin:random()*Math.PI,kind:mode})}if(particles.length>180)particles.splice(0,particles.length-180)}
const shape=['0110110','1111111','1111111','0111110','0011100','0001000'];
function draw(p){const alpha=Math.min(1,p.age*3)*Math.max(0,1-p.age/p.life);ctx.globalAlpha=alpha*(p.kind==='sleep'?.45:.8);ctx.fillStyle=p.color;
if(p.kind==='heart'){shape.forEach((r,j)=>[...r].forEach((v,i)=>{if(v==='1')ctx.fillRect(Math.round(p.x+(i-3)*p.size),Math.round(p.y+(j-2)*p.size),Math.ceil(p.size),Math.ceil(p.size))}))}
else if(p.kind==='star'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.spin+p.age*.3);ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4;const r=p.size*(i%2?1.2:5);i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.restore()}
else{ctx.beginPath();ctx.arc(p.x,p.y,p.size*3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff7f1';ctx.beginPath();ctx.arc(p.x+p.size*1.2,p.y-p.size,p.size*2.5,0,Math.PI*2);ctx.fill()}}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;ctx.clearRect(0,0,width,height);const playing=loaded&&!video.paused&&!video.ended&&!document.hidden;
if(playing){elapsed+=dt;let rms=0;if(analyser&&audioData){analyser.getFloatTimeDomainData(audioData);for(const x of audioData)rms+=x*x;rms=Math.sqrt(rms/audioData.length)}average=average*.97+rms*.03;envelope=envelope*.7+Math.min(1,rms*4)*.3;$('meter').style.width=Math.round(envelope*100)+'%';
if(enabled&&amount>0){spawnClock+=dt;const rate=mode==='sleep'?(1+envelope*5):(2+envelope*30);if(rms>.002&&spawnClock>1/(rate*amount)){spawnClock=0;emit(1+Math.floor(amount*2))}if(mode!=='sleep'&&rms>.035&&rms>average*1.32&&elapsed-lastHit>.28){lastHit=elapsed;emit(Math.round(7+amount*30),true)}}}
if(enabled&&!document.hidden){for(const p of particles){if(playing){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.x+=Math.sin(p.age*1.4+p.spin)*dt*4}draw(p)}particles=particles.filter(p=>p.age<p.life)}ctx.globalAlpha=1;requestAnimationFrame(tick)}requestAnimationFrame(tick);
addEventListener('pagehide',e=>{video.pause();if(!e.persisted&&objectURL)URL.revokeObjectURL(objectURL)});
})();

import {World,fern} from './world.js';
const $=id=>document.getElementById(id),world=new World(),plant=fern();
const cv=$('world'),g=cv.getContext('2d');
const C={bg:'#f2ede3',ink:'#653d35',pink:'#ec8198',line:'#ded3c5',sub:'#a58b7c',white:'#fff9ef'};
const chapters=[
  {title:'光と、やみ。',label:'第一の日 · 1:3–5',corner:'ONE → TWO',mu:.65,caption:'ひとつの谷が、ふたつになる。',en:'Let there be light.',rule:'息が0.30を越えると、対称な井戸の底がふたつに分かれます。そこへゆっくりした傾きが加わり、玉は谷を渡ります。「ゆらす」で玉を押して、戻る様子を見てください。',eq:'V(x) = −a x²/2 + x⁴/4 − b(t)x\na = μ − 0.30\nẋ = ax − x³ + b(t)\nb(t) = 0.32 sin[0.045 t (0.5 + μ)] √max(a, 0)',lyrics:'In the beginning:\none symmetric solution.\nA trivial fixed point.\n\nThen—\nthe forcing term wakes.\nLet there be light.\n\nPitchfork bifurcation.\nOne well becomes two.\nLight.\nDark.\n\nTwo basins.\nOne separatrix.\nAnd God saw\nthat it was good.\n\nPerturb it.\nIt returns.\nLyapunov exponent:\nnegative.\nEvening.\nMorning.\n\nValley to valley—\na heteroclinic cycle.\nThe first day.'},
  {title:'分けた先を、また分ける。',label:'第二の日 · 1:6–8',corner:'1 → 2 → 4 → …',mu:.8,caption:'ふたつになっても、終わりじゃない。',en:'Divide again.',rule:'ひとつの値に、同じ写像を繰り返しかけます。横軸は係数r、縦軸は落ち着き先のx。「息」で、分岐図の右側を開いていきます。ピンクの線が今の係数です。',eq:'xₙ₊₁ = r xₙ (1 − xₙ)\nr = 2.8 + 1.2 μ\nx₀ = 0.37',lyrics:'Divide again.\nAbove.\nBelow.\nWater.\nLand.\nIterate.'},
  {title:'種の中にも、同じかたち。',label:'第三の日 · 1:9–13',corner:'A SEED INSIDE A SEED',mu:.85,caption:'ちいさな中に、また、わたし。',en:'Self-similar.',rule:'四つのアフィン写像を、固定した数列で選びながら繰り返します。息の量だけ点を見せると、シダの形が現れます。つまみを戻しても同じ点が戻ります。',eq:'(x, y) →\n(0, 0.16y)                         1%\n(0.85x + 0.04y, −0.04x + 0.85y + 1.6)  85%\n(0.20x − 0.26y, 0.23x + 0.22y + 1.6)    7%\n(−0.15x + 0.28y, 0.26x + 0.24y + 0.44)  7%\n表示する点 = floor(6000 μ)',lyrics:'Self-similar.\nThe second.\nThe third.\nDay.\nNight.'},
  {title:'止まっていた点が、回りだす。',label:'第四の日 · 1:14–19',corner:'A POINT → A CIRCLE',mu:.85,caption:'昼。夜。もう一度、昼。',en:'The fixed point begins to turn.',rule:'息が0.50を越えると、中心へ戻っていた点が、回りつづける輪へ向かいます。ホップ分岐。ゆらしても、また輪へ。朝と夜を刻む小さな時計です。',eq:'ẋ = mx − y − x(x² + y²)\nẏ = x + my − y(x² + y²)\nm = μ − 0.50\n極座標では ṙ = r(m − r²), θ̇ = 1',lyrics:'The fixed point\nbegins to turn.\nHopf bifurcation.\nA limit cycle.\nThe fourth day.'},
  {title:'となりへ。となりの、となりへ。',label:'第五・六の日 · 1:20–28',corner:'BE FRUITFUL. MULTIPLY.',mu:1,caption:'この世界を見る、あなたもいる。',en:'An observer inside the system.',rule:'ひとつの種から、増殖と拡散で濃度が広がります。端と端はつながっています。マスの明るさが濃度、顔は育ったマスに添えた表情です。世界を見ているあなたが、この日の観測者。',eq:'uₙ₊₁ = uₙ + g uₙ(1 − uₙ) + 0.12 Δuₙ\ng = 0.9 max(μ − 0.15, 0)\n90 × 20 マス・周期境界',lyrics:'Be fruitful.\nMultiply.\nPositive feedback.\nThen—\nan observer\ninside the system.\nThe fifth.\nThe sixth.'},
  {title:'手を、はなす。',label:'第七の日',corner:'THE HAND LET GO.',mu:1,caption:'手が離れた。それでも、つづく。',en:'The flow continued.',rule:'つまみを今の値に固定して、操作する手を離します。息をゼロにする操作ではありません。流れを保ったまま、これまでの系が動きつづけます。「手を戻す」で、また触れられます。',eq:'μ = 手を離したときの値\n五つの系の更新は、そのままつづく。',lyrics:'The hand let go.\nThe flow continued.\nA dissipative structure\nstanding in the flow.\nThe seventh day.\nWho wrote\nthe vector field?'}
];
let active=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,rested=false,auto=false,last=0,acc=0,paintedMu=-1,bif=null;
const buttons=[...document.querySelectorAll('[data-day]')];
function syncPause(){ $('pause').textContent=paused?'動かす':'ひと休み';$('pause').setAttribute('aria-pressed',String(paused)); }
function sync(){
  const ch=chapters[active];
  $('mu').value=Math.round(world.mu*1000);$('muV').value=world.mu.toFixed(2);$('mu').disabled=rested;
  $('shake').disabled=rested||![0,3,4].includes(active);
  $('prev').disabled=active===0;
  $('next').textContent=active===5?'手を戻す ↩':active===0&&world.mu<=.3?'息を入れる →':active===4?'手を、はなす →':'次の日 →';
  $('sceneTitle').textContent=active===0&&world.mu<=.3?'まだ、ひとつ。':ch.title;
  $('chapterLabel').textContent=ch.label;$('corner').textContent=ch.corner;
  $('caption').textContent=active===0&&world.mu<=.3?'はじめに、ひとつの谷があった。':ch.caption;
  $('english').textContent=active===0&&world.mu<=.3?'In the beginning: one symmetric solution.':ch.en;
  $('hint').textContent=rested?'息はそのまま。操作する手だけを離しています。':active===0?'息が0.30を越えると、谷がふたつに。「ゆらす」で、そっと押せます。':active===1?'息を右へ。ひとつ、ふたつ、よっつ。どこまで分かれる？':active===2?'息を戻して、もう一度。同じ種から、同じ葉が戻ります。':active===3?'息が0.50を越えると、輪へ。小さいときは、育つまで少し待って。':'ゆらすと、少し減る。それでも、また増えていく。';
  $('ruleText').textContent=ch.rule;$('equation').textContent=ch.eq;$('dayLyrics').textContent=ch.lyrics;
  cv.setAttribute('aria-label',ch.caption+' '+ch.rule);
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===active)));
  syncPause();draw();
}
function select(i,preserve=false){auto=false;active=i;rested=i===5;if(!rested&&!preserve)world.mu=chapters[i].mu;sync();if($("sceneTitle").getBoundingClientRect().top<0)$("sceneTitle").scrollIntoView({block:"start"});}
buttons.forEach((b,i)=>b.onclick=()=>select(i));
$('mu').oninput=e=>{auto=false;world.mu=Number(e.target.value)/1000;sync();};
$('shake').onclick=()=>{world.shake=2;if(paused){world.tick(active===5?null:active);world.tick(active===5?null:active);}draw();};
$('pause').onclick=()=>{paused=!paused;last=0;acc=0;syncPause();};
$('reset').onclick=()=>{world.reset();active=0;rested=false;auto=false;sync();};
$('prev').onclick=()=>select(Math.max(0,active-1));
$('next').onclick=()=>{
  if(active===5){select(4,true);return;}
  if(active===0&&world.mu<=.3){if(paused){world.mu=.65;for(let i=0;i<90;i++)world.tick(active===5?null:active);sync();}else auto=true;return;}
  select(active+1);
};
function face(x,y,size=3,pink=false,sleep=false){
  x=Math.round(x);y=Math.round(y);g.fillStyle=pink?C.pink:C.ink;
  g.fillRect(x-4*size,y-4*size,8*size,8*size);g.fillRect(x-5*size,y-2*size,10*size,5*size);
  g.fillStyle=pink?C.ink:C.white;g.fillRect(x-3*size,y-size,size,sleep?1:size);g.fillRect(x+2*size,y-size,size,sleep?1:size);
  g.fillStyle=pink?C.white:C.pink;g.fillRect(x-4*size,y+size,2*size,size);g.fillRect(x+2*size,y+size,2*size,size);
}
function label(text,x,y,color=C.sub){g.fillStyle=color;g.font='9px DotGothic16, monospace';g.textAlign='center';g.fillText(text,x,y);}
function well(w,h){
  const a=world.mu-.3,V=x=>-a*x*x/2+x**4/4-world.bias*x;
  const left=28,right=w-28,top=55,bottom=h-35,extent=a>0?Math.max(.85,1.45*Math.sqrt(a)):1.3;
  let min=Infinity,max=-Infinity;for(let i=0;i<=w;i++){const v=V((i/w-.5)*2*extent);min=Math.min(v,min);max=Math.max(v,max);}
  const Y=x=>bottom-(V(x)-min)/Math.max(.05,max-min)*(bottom-top);
  g.fillStyle=C.line;for(let i=left;i<right;i++){const x=((i-left)/(right-left)-.5)*2*extent,y=Math.round(Y(x));g.fillRect(i,y,1,bottom-y+1);}
  if(a>0){g.fillStyle=C.pink;for(let y=55;y<bottom;y+=5)g.fillRect(w/2,y,1,2);label('やみ',w*.32,h-16);label('光',w*.68,h-16);}
  face(left+(world.x/(2*extent)+.5)*(right-left),Y(world.x)-12,2,true,paused);
}
function branches(w,h){
  if(!bif||bif.width!==w||bif.height!==h){
    bif=document.createElement('canvas');bif.width=w;bif.height=h;const c=bif.getContext('2d');c.fillStyle=C.ink;
    for(let i=0;i<w-48;i++){const r=2.8+1.2*i/(w-48);let x=.37;for(let k=0;k<120;k++)x=r*x*(1-x);for(let k=0;k<40;k++){x=r*x*(1-x);c.fillRect(i+24,Math.round(h-30-x*(h-75)),1,1);}}
  }
  const end=Math.round(24+(w-48)*world.mu);g.save();g.beginPath();g.rect(0,0,end,h);g.clip();g.drawImage(bif,0,0);g.restore();g.fillStyle=C.pink;g.fillRect(end,42,1,h-69);
  label('2.8',24,h-12);label('r = '+(2.8+1.2*world.mu).toFixed(2),w/2,h-12);label('4.0',w-24,h-12);
}
function leaf(w,h){
  const n=Math.floor(world.mu*6000),scale=(h-55)/10.2;
  for(let i=0;i<n;i++){const [x,y]=plant[i];g.fillStyle=i%17===0?C.pink:C.ink;g.fillRect(Math.round(w/2+x*scale),Math.round(h-15-y*scale),1,1);}
  label(n+' / 6000',w-56,h-16);
}
function orbit(w,h){
  const x=w/2,y=h/2+10,scale=Math.min(w,h)*.38;
  g.strokeStyle=C.line;g.beginPath();g.moveTo(x-85,y);g.lineTo(x+85,y);g.moveTo(x,y-70);g.lineTo(x,y+70);g.stroke();
  world.trail.forEach(([a,b],i)=>{g.fillStyle=i>145?C.pink:i>100?C.ink:C.line;g.fillRect(Math.round(x+a*scale),Math.round(y-b*scale),2,2);});
  face(x+world.hx*scale,y-world.hy*scale,2,true,paused);
  label(world.mu>.5?'昼 → 夜 → 昼':'輪は、まだ。',w/2,h-13);
}
function growth(w,h){
  const cw=(w-32)/90,ch=Math.min((h-90)/20,cw*1.8),oy=(h-ch*20)/2+10;
  for(let y=0;y<20;y++)for(let x=0;x<90;x++){
    const u=world.u[y*90+x];if(u<.05)continue;
    g.fillStyle=u>.6?(x+y)%9<3?C.pink:C.ink:u>.3?C.sub:C.line;
    g.fillRect(Math.round(16+x*cw),Math.round(oy+y*ch),Math.max(1,Math.ceil(cw)-1),Math.max(1,Math.ceil(ch)-1));
  }
  // Faces annotate occupied cells; they neither seed nor modify the simulation.
  for(const [x,y] of [[25,6],[45,10],[66,14]])if(world.u[y*90+x]>.6)face(16+x*cw,oy+y*ch,2,(x===45),paused);
  label('地に満ちる '+Math.round(world.fill*100)+'%',w/2,h-15);
}
function seventh(w,h){
  // Five live windows, each a view of the same systems shown on prior days.
  const miniW=144,miniH=112,gap=8,cols=w<400?2:3;
  const scale=Math.min((w-24)/(cols*miniW+(cols-1)*gap),(h-36)/(Math.ceil(5/cols)*miniH+(Math.ceil(5/cols)-1)*gap));
  const total=cols*miniW+(cols-1)*gap,ox=(w-total*scale)/2;
  painters.slice(0,5).forEach((paint,i)=>{g.save();g.translate(ox+(i%cols)*(miniW+gap)*scale,26+Math.floor(i/cols)*(miniH+gap)*scale);g.scale(scale,scale);g.beginPath();g.rect(0,0,miniW,miniH);g.clip();paint(miniW,miniH);g.restore();});
}
const painters=[well,branches,leaf,orbit,growth,seventh];
function draw(){
  const mobile=matchMedia('(max-width:720px)').matches,w=mobile?360:480,h=mobile?260:224;
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  g.fillStyle=C.bg;g.fillRect(0,0,w,h);painters[active](w,h);
  if(world.t%15===0||paused){
    $('measurement').textContent=active===0?'現在の局所の収縮率 a − 3x² = '+(world.mu-.3-3*world.x**2).toFixed(3)+'。これは瞬間の値で、長時間平均のリアプノフ指数ではありません。歌詞のヘテロクリニック・サイクルそのものを、この傾く井戸で再現しているわけではありません。':active===3?'連続式の輪の半径 √m = '+Math.sqrt(Math.max(0,world.mu-.5)).toFixed(3)+'。周期 2π。画面は元の部屋と同じ刻み幅で数値積分しています。':active===5?'息 μ = '+world.mu.toFixed(2)+'。手を離すことと、流れを止めることを分けています。':'';
  }
}
function frame(now){
  if(!document.hidden&&!paused){
    if(last)acc+=Math.min(100,now-last);
    while(acc>=1000/60){
      if(auto){world.mu=Math.min(.65,world.mu+.003);if(world.mu===.65)auto=false;}
      world.tick(active===5?null:active);acc-=1000/60;
    }
    if(paintedMu!==world.mu){paintedMu=world.mu;sync();}else draw();
  }
  last=now;requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{last=0;acc=0;});
window.addEventListener('resize',draw);
sync();requestAnimationFrame(frame);


(() => {
  "use strict";
  const ROWS = 40, COLS = 64, S = 6, WATER = 28, PERIOD = 2 * COLS;
  const W = COLS * S, H = ROWS * S, N = ROWS * COLS;

  const TOAD_A = [[0,1],[0,2],[0,3],[1,0],[1,1],[1,2]];
  const TOAD_B = [[-1,2],[0,0],[0,3],[1,0],[1,3],[2,1]];
  const BLOCK  = [[0,0],[0,1],[1,0],[1,1]];
  const BLINK  = [[0,0],[0,1],[0,2]];
  const LWSS   = [[0,0],[0,3],[1,4],[2,0],[2,4],[3,1],[3,2],[3,3],[3,4]];
  const GLIDER = [[0,1],[1,2],[2,0],[2,1],[2,2]];

  const TOAD_AT  = [[21,6],[22,18],[21,30],[22,42],[21,54]];
  const BLOCK_AT = [[18,12],[18,36],[25,24],[18,48]];
  const BLINK_AT = [[31,10],[34,26],[32,44],[36,57]];
  const LWSS_AT  = [[2,4],[9,34]];
  const LILY     = [[33,16,3.0],[30,38,2.4],[35,50,2.8],[37,8,2.2]];

  const cv  = document.getElementById('cv');
  const ctx = cv.getContext('2d', { alpha:false });
  const img = ctx.createImageData(W, H), px = img.data;
  for (let p = 3; p < px.length; p += 4) px[p] = 255;

  let PAPER, WATERC, LILYC, INK, CHEEK;
  const hex = s => { s = s.trim();
    if (s.length === 4) s = "#"+s[1]+s[1]+s[2]+s[2]+s[3]+s[3];
    return [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)]; };
  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    PAPER = hex(cs.getPropertyValue('--paper')); WATERC = hex(cs.getPropertyValue('--water'));
    LILYC = hex(cs.getPropertyValue('--lily'));  INK    = hex(cs.getPropertyValue('--ink'));
    CHEEK = hex(cs.getPropertyValue('--cheek'));
  }
  readTheme();

  let grid = new Uint8Array(N), next = new Uint8Array(N);
  let gen = 0, running = true, timer = null, selected = 0, touched = false, showGrid = false, petTime = 0;
  const names=['もも','みんと','すみれ','そら','きなこ'];
  const bodies=['#e78aa7','#79b5a6','#b29bcf','#87b4d5','#d3b579'].map(hex);
  const portrait=document.getElementById('portrait'), pc=portrait.getContext('2d');pc.imageSmoothingEnabled=false;
  const face = TOAD_AT.map(() => ({ alive:true, blink:0, wide:0, bang:0, yawn:0 }));

  const idx = (r,c) => ((r%ROWS+ROWS)%ROWS)*COLS + ((c%COLS+COLS)%COLS);
  const put = (pat,r,c) => { for (const p of pat) grid[idx(r+p[0], c+p[1])] = 1; };

  const say = (t, poked) => {
    const el = document.getElementById('status');
    el.textContent = t; el.classList.toggle('poked', !!poked);
  };

  function build() {
    grid.fill(0); next.fill(0);
    for (const a of TOAD_AT)  put(TOAD_A, a[0], a[1]);
    for (const a of BLOCK_AT) put(BLOCK,  a[0], a[1]);
    for (const a of BLINK_AT) put(BLINK,  a[0], a[1]);
    for (const a of LWSS_AT)  put(LWSS,   a[0], a[1]);
    gen = 0; touched = false;
    face.forEach(f => { f.alive = true; f.blink = f.wide = f.bang = f.yawn = 0; });
    say('ふくらんで、しぼんで。みんな、ここにいる。', false);
  }

  function step() {
    for (let r = 0; r < ROWS; r++) {
      const up = ((r+ROWS-1)%ROWS)*COLS, mi = r*COLS, dn = ((r+1)%ROWS)*COLS;
      for (let c = 0; c < COLS; c++) {
        const l = (c+COLS-1)%COLS, x = (c+1)%COLS;
        const n = grid[up+l]+grid[up+c]+grid[up+x]
                + grid[mi+l]          +grid[mi+x]
                + grid[dn+l]+grid[dn+c]+grid[dn+x];
        next[mi+c] = (n===3 || (n===2 && grid[mi+c])) ? 1 : 0;
      }
    }
    const t = grid; grid = next; next = t;
    gen++;
    if(!touched && gen%PERIOD===0)say("おかえり。池が、最初のかたちに戻ったよ。",false);
    // トードがトードのままか確かめる。崩れたら顔も消える
    TOAD_AT.forEach((a,i) => {
      const ok = p => {for(let r=-2;r<=3;r++)for(let c=-1;c<=4;c++){const wanted=p.some(o=>o[0]===r&&o[1]===c);if(Boolean(grid[idx(a[0]+r,a[1]+c)])!==wanted)return false}return true};
      face[i].alive = ok(TOAD_A) || ok(TOAD_B);
    });
  }

  // ---- 描画（1セル = S x S サブピクセル） ----
  function fill(x, y, w, h, col) {
    const x0 = Math.max(0,x|0), y0 = Math.max(0,y|0);
    const x1 = Math.min(W,(x+w)|0), y1 = Math.min(H,(y+h)|0);
    for (let yy = y0; yy < y1; yy++) {
      let p = (yy*W + x0)*4;
      for (let xx = x0; xx < x1; xx++, p += 4) {
        px[p] = col[0]; px[p+1] = col[1]; px[p+2] = col[2];
      }
    }
  }
  function disc(cy, cx, rr, col) {
    const R = rr*S, r2 = R*R, ccy = cy*S, ccx = cx*S;
    const y0 = Math.max(0, (ccy-R)|0), y1 = Math.min(H, (ccy+R+1)|0);
    const x0 = Math.max(0, (ccx-R)|0), x1 = Math.min(W, (ccx+R+1)|0);
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
      const dy = yy-ccy, dx = xx-ccx;
      if (dy*dy + dx*dx <= r2) { const p = (yy*W+xx)*4;
        px[p] = col[0]; px[p+1] = col[1]; px[p+2] = col[2]; }
    }
  }

  function drawFace(r, c, f) {
    const ox = c*S, oy = r*S;
    fill(ox+1,  oy+1, 4, 2, CHEEK);            // ほお（色はここだけ）
    fill(ox+19, oy+1, 4, 2, CHEEK);
    for (const ex of [ox+4, ox+15]) {
      if (f.yawn > 0 || f.blink > 0 || (face.indexOf(f)===selected && Date.now()<petTime)) {          // とじてる
        fill(ex, oy-5, 5, 5, INK);
        fill(ex, oy-3, 5, 1, PAPER);
      } else if (f.wide > 0) {                  // びっくり
        fill(ex-1, oy-6, 7, 7, INK);
        fill(ex+1, oy-4, 3, 3, PAPER);
      } else {                                  // ぶっちょうづら
        fill(ex, oy-5, 5, 5, INK);
        fill(ex+1, oy-2, 3, 2, PAPER);
      }
    }
    if (f.bang > 0) {                            // ！
      fill(ox+10, oy-17, 2, 6, CHEEK);
      fill(ox+10, oy-9,  2, 2, CHEEK);
    }
  }

  function paint() {
    fill(0, 0, W, WATER*S, PAPER);
    fill(0, WATER*S, W, H - WATER*S, WATERC);
    for(let i=0;i<7;i++){const x=12+i*55;fill(x,109,2,12,hex('#c6dbc5'));fill(x-3,114,7,2,hex('#c6dbc5'));disc(18,x/S,0.65,hex(i%2?'#f4d6a5':'#f0bdcc'))}
    for(let i=0;i<3;i++){const x=38+i*134;disc(13,x/S,1.5,hex('#fffdf8'));fill(x-8,75,29,8,hex('#fffdf8'))}
    for(let i=0;i<10;i++){const x=(i*47+gen%8)%W;fill(x,184+(i%4)*14,12,1,hex('#d2e7e2'))}
    for (const l of LILY) disc(l[0], l[1], l[2], LILYC);
    let pop = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r*COLS+c]) {const frog=TOAD_AT.findIndex(a=>r>=a[0]-1&&r<=a[0]+2&&c>=a[1]&&c<=a[1]+3);fill(c*S,r*S,S,S,frog>=0?bodies[frog]:INK);pop++;}
    }
    TOAD_AT.forEach((a,i) => { if (face[i].alive) drawFace(a[0], a[1], face[i]); });
    ctx.putImageData(img, 0, 0);
    if(showGrid){ctx.strokeStyle='#853e3a18';ctx.lineWidth=.5;for(let x=0;x<W;x+=S){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=S){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}}
    const a=TOAD_AT[selected];
    pc.fillStyle='#fff7f0';pc.fillRect(0,0,240,200);pc.drawImage(cv,a[1]*S-6,a[0]*S-21,36,42,48,16,144,168);
    ctx.strokeStyle='#ae7997';ctx.lineWidth=1;ctx.setLineDash([2,3]);ctx.strokeRect(a[1]*S-4,a[0]*S-15,32,35);ctx.setLineDash([]);
    document.getElementById('friendName').textContent=names[selected];
    document.getElementById('friendState').textContent=face[selected].alive?'ぷく。ぱく。きょうも、ここに。':'かたちが変わった。どこへ行くかな。';
    document.getElementById('phase').textContent=touched?'その先へ':(gen%2?'ぱく':'ぷく');
    if(Date.now()<petTime){pc.fillStyle='#ff91b0';pc.font='24px sans-serif';pc.fillText('♡',182,46)}
                     // 転送は1フレームに1回
    document.getElementById('gen').textContent = gen;
    document.getElementById('pop').textContent = pop;
  }

  function animate() {
    if (running) {
      step();
      face.forEach(f => {
        if (f.blink > 0) f.blink--;
        if (f.wide  > 0) f.wide--;
        if (f.bang  > 0) f.bang--;
        if (f.yawn  > 0) f.yawn--;
        else if (f.blink === 0 && f.wide === 0 && (gen+face.indexOf(f)*19)%67===0) f.blink = 2;
      });
      if (gen > 0 && gen % (PERIOD * 3) === 0) {   // 3周ごとに、だれかがあくび
        const live = face.filter(f => f.alive);
        if (live.length) { live[Math.floor(gen/PERIOD)%live.length].yawn = 12; say('あくびした。', false); }
      }
    }
    paint();
  }

  function setSpeed() {
    if (timer) clearInterval(timer);
    timer = setInterval(animate, 1000 / +document.getElementById('speed').value);
  }

  document.getElementById('play').onclick = e => {
    running = !running; e.target.textContent = running ? 'とめる' : 'うごかす';
  };
  document.getElementById('stepb').onclick = () => {running=false;document.getElementById('play').textContent='うごかす';step();paint();};
  document.getElementById('reset').onclick = () => { build(); paint(); };
  document.getElementById('speed').oninput = setSpeed;

  document.getElementById('poke').onclick = () => {
    const live = TOAD_AT.map((a,i) => i).filter(i => face[i].alive);
    if (!live.length) { say('もう、だれもいない。', true); return; }
    const i=live.includes(selected)?selected:live[0], a=TOAD_AT[i]; touched=true;
    put(GLIDER, a[0]-12, a[1]-12);
    face[i].wide = 40; face[i].bang = 26;
    say('小さな旅人を放した。ここからは、違うつづき。', true);
    paint();
  };

  const atCell = ev => {
    const b = cv.getBoundingClientRect();
    return [ Math.floor((ev.clientY - b.top )/b.height * ROWS),
             Math.floor((ev.clientX - b.left)/b.width  * COLS) ];
  };
  cv.style.cursor = 'crosshair';
  cv.addEventListener('click', ev => {
    const [r,c] = atCell(ev);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    grid[idx(r,c)] ^= 1; touched=true;
    say('ひとマス変えた。次は、どうなる？', true);
    paint();
  });

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const oc = () => { readTheme(); paint(); };
    mq.addEventListener ? mq.addEventListener('change', oc) : mq.addListener(oc);
  }

  document.querySelectorAll('[data-friend]').forEach(btn=>btn.onclick=()=>{selected=Number(btn.dataset.friend);document.querySelectorAll('[data-friend]').forEach(q=>q.setAttribute('aria-pressed',String(q===btn)));paint()});
  document.getElementById('pet').onclick=()=>{if(!face[selected].alive){say('新しいかたちを、そっと見守ろう。',false);return}face[selected].blink=8;petTime=Date.now()+1800;say(names[selected]+'、よしよし。',false);paint();setTimeout(paint,1850)};
  document.getElementById('grid').onclick=e=>{showGrid=!showGrid;e.target.setAttribute('aria-pressed',String(showGrid));paint()};
  document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;document.getElementById('play').textContent='うごかす'}});
  build(); paint();
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    running = false;
    document.getElementById('play').textContent = 'うごかす';
  }
  setSpeed();
})();

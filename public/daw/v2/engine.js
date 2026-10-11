  function h32(i) {
    i = Math.imul(i, 0x9E3779B1) >>> 0; i ^= i >>> 15;
    i = Math.imul(i, 0x2C1B3C6D) >>> 0; i ^= i >>> 12;
    i = Math.imul(i, 0x297A2D39) >>> 0;
    return (i ^ (i >>> 15)) >>> 0;
  }
  const u01 = i => h32(i) / 4294967296;

  function Ant(seed) {
    const N = 32, DX = [0,1,0,-1], DY = [-1,0,1,0], SEMI = [0,3,7,10];
    const g = new Uint8Array(N * N);
    for (let k = 0; k < seed; k++) g[h32(k * 7919 + 1) % (N * N)] = 1;     // 種のぶんだけ黒を置く
    let x = N >> 1, y = N >> 1, d = 0, steps = 0;
    return {
      name:"蟻", en:"/ant/", div:1, N, g,
      get pos() { return [x, y]; },
      status() { return steps + " ほ"; },
      advance() {
        const i = y * N + x, c = g[i];
        d = c ? (d + 3) & 3 : (d + 1) & 3;
        g[i] ^= 1;
        x = (x + DX[d] + N) % N; y = (y + DY[d] + N) % N; steps++;
        const hz = 220 * Math.pow(2, SEMI[d] / 12) * (c ? 1 : 2);
        return [{ hz, dur:0.14, vol:c ? 0.07 : 0.04, type:"triangle" }];
      },
      draw(cx, INK, BG, CHEEK) {
        const im = cx.createImageData(N, N), p = im.data;
        for (let i = 0; i < N * N; i++) { const col = g[i] ? INK : BG; p[i*4] = col[0]; p[i*4+1] = col[1]; p[i*4+2] = col[2]; p[i*4+3] = 255; }
        const i = y * N + x; p[i*4] = CHEEK[0]; p[i*4+1] = CHEEK[1]; p[i*4+2] = CHEEK[2];
        cx.putImageData(im, 0, 0);
      }
    };
  }

  // ライフ ── 隣が2か3ならいきる。ちょうど3でうまれる。うまれたマスが、行の高さで鳴る
  function Life(seed) {
    const N = 24, PIT = [147.0, 165.0, 196.0, 220.0, 262.0];         // D E G A C
    let g = new Uint8Array(N * N), born = new Uint8Array(N * N), gen = 0, pop = 0;
    for (let i = 0; i < N * N; i++) g[i] = u01(seed * 1000003 + i) < 0.35 ? 1 : 0;
    for (let i = 0; i < N * N; i++) pop += g[i];
    return {
      name:"ライフ", en:"/life/", div:4, N,
      status() { return pop ? gen + " せだい　" + pop : "きえた"; },
      advance() {
        const ng = new Uint8Array(N * N), hits = [];
        born.fill(0);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (dx || dy) n += g[((y + dy + N) % N) * N + (x + dx + N) % N];
          }
          const i = y * N + x, a = g[i] ? (n === 2 || n === 3) : n === 3;
          ng[i] = a ? 1 : 0;
          if (a && !g[i]) { born[i] = 1; if (hits.length < 2) hits.push(Math.min(4, Math.floor(y / N * 5))); }
        }
        g = ng; gen++; pop = 0; for (let i = 0; i < N * N; i++) pop += g[i];
        return hits.map(k => ({ hz:PIT[k], dur:0.6, vol:0.09, type:"sine" }));
      },
      draw(cx, INK, BG, CHEEK) {
        const im = cx.createImageData(N, N), p = im.data;
        for (let i = 0; i < N * N; i++) { const col = born[i] ? CHEEK : g[i] ? INK : BG; p[i*4] = col[0]; p[i*4+1] = col[1]; p[i*4+2] = col[2]; p[i*4+3] = 255; }
        cx.putImageData(im, 0, 0);
      }
    };
  }

  // コラッツ ── 奇数なら3倍して1。偶数なら半分。数の大きさが音の高さ。1に着いたら休む
  function Collatz(seed) {
    const ROOT = 110;
    const pitchOf = v => ROOT * Math.pow(2, (((Math.log2(v) * 12) % 36) + 36) % 36 / 12);
    let cur = seed, step = 0, rest = 0, home = false, trail = [];
    return {
      name:"コラッツ", en:"/collatz/", div:2,
      status() { return home ? "1 にかえった" : cur.toLocaleString("ja-JP"); },
      advance() {
        if (rest > 0) { rest--; if (rest === 0) { cur = seed; step = 0; home = false; trail = []; } return []; }
        if (cur === 1) { home = true; rest = 8; return [{ hz:ROOT, dur:1.8, vol:0.10, type:"sine" }]; }
        cur = (cur % 2) ? 3 * cur + 1 : cur / 2; step++;
        trail.push(Math.log2(cur)); if (trail.length > 24) trail.shift();
        return [{ hz:pitchOf(cur), dur:0.26, vol:cur % 2 ? 0.075 : 0.055, type:"triangle" }];
      },
      draw(cx, INK, BG, CHEEK) {
        const W = cx.canvas.width, H = cx.canvas.height;
        cx.fillStyle = "rgb(" + BG.join(",") + ")"; cx.fillRect(0, 0, W, H);
        const mx = Math.max(4, ...trail, Math.log2(seed) + 1);
        trail.forEach((v, i) => {
          const h = Math.max(1, Math.round(v / mx * (H - 4)));
          cx.fillStyle = "rgb(" + ((i === trail.length - 1) ? CHEEK : INK).join(",") + ")";
          cx.fillRect(i * 4, H - h, 3, h);
        });
      }
    };
  }

  // そろう ── 一斉射撃。何人いるか、だれも知らない。となりとしか話せない（/burn/ の規則そのまま）
  function Burn(n) {
    const SPH = 1;
    const blank = () => ({ w:0, GR:0, GL:0, R:0, L:0, sR:-1, sL:-1, F:0 });
    const isWall = x => x === null || x.w === 1;
    const meets  = x => !x.w && ((x.sR >= 0 && x.L) || (x.sL >= 0 && x.R));
    function init(n) { const c = []; for (let i = 0; i < n; i++) c.push(blank()); c[0].w = 1; c[0].GR = 1; c[n-1].w = 1; return c; }
    function step(cells) {
      const n = cells.length, out = new Array(n);
      for (let i = 0; i < n; i++) {
        const c = cells[i], a = i > 0 ? cells[i-1] : null, b = i < n - 1 ? cells[i+1] : null, o = blank();
        if (c.F) { o.F = 1; o.w = 1; out[i] = o; continue; }
        o.w = c.w;
        if (c.w && isWall(a) && isWall(b)) { o.F = 1; out[i] = o; continue; }
        let center = 0, eL = 0, eR = 0;
        if (!c.w) {
          const aw = a && !a.w, bw = b && !b.w;
          if      (c.sR >= 0 && c.L)          { center=1; eL=1; eR=1; }
          else if (c.sL >= 0 && c.R)          { center=1; eL=1; eR=1; }
          else if (c.sR >= 0 && bw && b.L)    { center=1; eL=1; }
          else if (c.L    && aw && a.sR >= 0) { center=1; eR=1; }
          else if (c.R    && bw && b.sL >= 0) { center=1; eL=1; }
          else if (c.sL >= 0 && aw && a.R)    { center=1; eR=1; }
        }
        if (center) { o.w = 1; o.GL = eL; o.GR = eR; out[i] = o; continue; }
        if (a && ((a.R && !a.w && !meets(a)) || a.GR)) o.R = 1;
        if (b && ((b.L && !b.w && !meets(b)) || b.GL)) o.L = 1;
        if (b && b.w && b.R) o.L = 1;
        if (a && a.w && a.L) o.R = 1;
        if (c.sR >= 0 && c.sR < 2) o.sR = c.sR + 1;
        if (c.sL >= 0 && c.sL < 2) o.sL = c.sL + 1;
        if (a && a.sR === 2 && !c.w && !meets(a)) o.sR = 0;
        if (b && b.sL === 2 && !c.w && !meets(b)) o.sL = 0;
        if (c.GR) o.sR = SPH;
        if (c.GL) o.sL = SPH;
        out[i] = o;
      }
      return out;
    }
    function history(n) {
      if (n === 1) { const a = init(1); a[0].F = 1; return [init(1), a]; }
      let c = init(n); const h = [c];
      for (let t = 0; t < 12 * n + 80; t++) { c = step(c); h.push(c); if (c.every(x => x.F)) break; }
      return h;
    }
    const hist = history(n);
    const walls = row => row.reduce((s, c) => s + c.w, 0);
    let t = 0, hold = 0;
    return {
      name:"そろう", en:"/burn/", div:1,
      status() { return hist[t][0].F ? "そろった！" : t + " ほ　" + walls(hist[t]) + "/" + n; },
      advance() {
        if (hold > 0) { hold--; if (hold === 0) t = 0; return []; }
        if (t >= hist.length - 1) { hold = 32; return []; }
        const before = walls(hist[t]); t++;
        if (hist[t][0].F) { hold = 32; return [{ drum:"shot" }]; }
        return walls(hist[t]) > before ? [{ drum:"tick" }] : [];
      },
      draw(cx, INK, BG, CHEEK, SUB) {
        const W = cx.canvas.width, H = cx.canvas.height;
        cx.fillStyle = "rgb(" + BG.join(",") + ")"; cx.fillRect(0, 0, W, H);
        const T = hist.length, ch = Math.max(1, Math.floor(H / T)), cw = W / n;
        for (let k = 0; k <= t && k < T; k++) {
          const row = hist[k];
          for (let i = 0; i < n; i++) {
            cx.fillStyle = "rgb(" + (row[i].F ? CHEEK : row[i].w ? INK : (row[i].R || row[i].L || row[i].sR >= 0 || row[i].sL >= 0) ? SUB : BG).join(",") + ")";
            cx.fillRect(Math.floor(i * cw), k * ch, Math.ceil(cw), ch);
          }
        }
      }
    };
  }


export const RULES = [Ant, Life, Collatz, Burn];

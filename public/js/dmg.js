/* dmg.js — ゲームボーイ（DMG）の音源をブラウザで鳴らす
 *
 *   CH1 / CH2   矩形波。デューティ 12.5 / 25 / 50 / 75%
 *   CH3         波形メモリ。32段・4bit の任意波形
 *   CH4         ノイズ。15bit / 7bit の LFSR
 *
 * 本物の制約をそのまま入れてあります。
 *   ・フィルタなし
 *   ・音量は 4bit（16段）の階段。なめらかに減衰しない
 *   ・和音が出せないので、速い分散和音（アルペジオ）でごまかす
 *   ・同時に4音まで。あとから鳴った音が前の音を切る
 *
 * キックは CH3 を使うので、鳴るたびにベースが切れます。
 * サイドチェインを別に作る必要がありません。実機がそうなっている。
 */
(function (root) {
  "use strict";

  var DMG = {};
  var ac = null, out = null;
  var pw = {};                      // PeriodicWave のキャッシュ
  var nz = {};                      // ノイズのバッファ
  var busy = { p1:null, p2:null, wv:null, nz:null };

  // ---- 波形 -------------------------------------------------------------
  function dft(s, harm) {
    var N = s.length, re = new Float32Array(harm+1), im = new Float32Array(harm+1), k, n, a, b, th;
    for (k = 1; k <= harm; k++) {
      a = 0; b = 0;
      for (n = 0; n < N; n++) { th = 2*Math.PI*k*n/N; a += s[n]*Math.cos(th); b -= s[n]*Math.sin(th); }
      re[k] = 2*a/N; im[k] = 2*b/N;
    }
    return ac.createPeriodicWave(re, im, { disableNormalization:false });
  }
  function pulseWave(duty) {
    var key = "p" + duty;
    if (!pw[key]) {
      var N = 128, s = new Float32Array(N), i;
      for (i = 0; i < N; i++) s[i] = (i/N < duty) ? 1 : -1;
      pw[key] = dft(s, 28);
    }
    return pw[key];
  }
  // 32段・4bit の波形メモリ。0〜15 の配列を渡す
  DMG.WAVE_TABLES = {
    saw:  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    tri:  [0,2,4,6,8,10,12,14,15,14,12,10,8,6,4,2,0,2,4,6,8,10,12,14,15,14,12,10,8,6,4,2],
    sine: [8,9,11,12,13,14,15,15,15,14,13,12,11,9,8,6,4,3,2,1,0,0,0,1,2,3,4,6,7,8,8,8],
    bass: [15,15,15,15,12,12,10,10,8,8,6,6,4,4,2,2,0,0,2,2,4,4,6,6,8,8,10,10,12,12,14,14]
  };
  function tableWave(name) {
    var key = "w" + name;
    if (!pw[key]) {
      var t = DMG.WAVE_TABLES[name] || DMG.WAVE_TABLES.tri;
      var s = new Float32Array(t.length), i;
      for (i = 0; i < t.length; i++) s[i] = (t[i] - 7.5) / 7.5;
      pw[key] = dft(s, 16);
    }
    return pw[key];
  }
  // 実機のノイズ。LFSR をそのまま回す
  function noiseBuf(short) {
    var key = short ? "n7" : "n15";
    if (!nz[key]) {
      var rate = 32768;                        // LFSR を回す速さ
      var len = Math.floor(ac.sampleRate * 1.0);
      var b = ac.createBuffer(1, len, ac.sampleRate);
      var d = b.getChannelData(0);
      var r = 0x7FFF, acc = 0, inc = rate / ac.sampleRate, v = 1, i, bit;
      for (i = 0; i < len; i++) {
        acc += inc;
        while (acc >= 1) {
          acc -= 1;
          bit = (r & 1) ^ ((r >> 1) & 1);
          r >>= 1; r |= bit << 14;
          if (short) { r &= ~(1 << 6); r |= bit << 6; }
          v = (~r & 1) ? 1 : -1;
        }
        d[i] = v;
      }
      nz[key] = b;
    }
    return nz[key];
  }

  // ---- 音量は 4bit の階段 ------------------------------------------------
  function envelope(g, t, dur, vol, decay) {
    var lv = Math.max(1, Math.min(15, Math.round(vol * 15)));
    var stepT = decay > 0 ? decay : dur;       // 1段さがるのにかかる時間
    var time = t, i;
    g.gain.setValueAtTime(lv / 15, time);
    if (decay > 0) {
      for (i = lv - 1; i >= 0; i--) {
        time += stepT;
        if (time > t + dur) break;
        g.gain.setValueAtTime(i / 15, time);   // 階段。ランプにしない
      }
    }
    g.gain.setValueAtTime(0, t + dur);
  }

  // ---- チャンネルを取る。前の音は切られる -------------------------------
  function take(ch, t, node) {
    var prev = busy[ch];
    if (prev && prev.until > t) {
      try { prev.g.gain.cancelScheduledValues(t); prev.g.gain.setValueAtTime(0, t); } catch (e) {}
    }
    busy[ch] = node;
  }

  // ---- 発音 --------------------------------------------------------------
  // o.hz  o.t  o.dur  o.vol(0-1)  o.duty  o.decay  o.sweep(終端Hz)  o.arp([半音,...])
  DMG.pulse = function (ch, o) {
    if (!ac) return;
    var t = o.t, dur = o.dur || 0.1;
    var osc = ac.createOscillator();
    osc.setPeriodicWave(pulseWave(o.duty === undefined ? 0.5 : o.duty));
    osc.frequency.setValueAtTime(o.hz, t);
    if (o.sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.sweep), t + dur*0.8);
    if (o.arp && o.arp.length > 1) {           // 和音のかわりに速く切り替える
      var stepA = 1/60, k = 0, tt = t;         // 実機の1フレーム
      while (tt < t + dur) {
        osc.frequency.setValueAtTime(o.hz * Math.pow(2, o.arp[k % o.arp.length]/12), tt);
        tt += stepA; k++;
      }
    }
    var g = ac.createGain();
    envelope(g, t, dur, o.vol === undefined ? 0.5 : o.vol, o.decay || 0);
    osc.connect(g).connect(out);
    take(ch, t, { g:g, until:t + dur });
    osc.start(t); osc.stop(t + dur + 0.01);
  };
  DMG.wave = function (o) {
    if (!ac) return;
    var t = o.t, dur = o.dur || 0.1;
    var osc = ac.createOscillator();
    osc.setPeriodicWave(tableWave(o.table || "tri"));
    osc.frequency.setValueAtTime(o.hz, t);
    if (o.sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.sweep), t + (o.sweepT || dur*0.5));
    var g = ac.createGain();
    envelope(g, t, dur, o.vol === undefined ? 0.6 : o.vol, o.decay || 0);
    osc.connect(g).connect(out);
    take("wv", t, { g:g, until:t + dur });
    osc.start(t); osc.stop(t + dur + 0.01);
  };
  DMG.noise = function (o) {
    if (!ac) return;
    var t = o.t, dur = o.dur || 0.05;
    var s = ac.createBufferSource();
    s.buffer = noiseBuf(!!o.short);
    s.playbackRate.value = o.rate || 1;
    var g = ac.createGain();
    envelope(g, t, dur, o.vol === undefined ? 0.5 : o.vol, o.decay || 0);
    s.connect(g).connect(out);
    take("nz", t, { g:g, until:t + dur });
    s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.01);
  };

  // ---- ドラム。実機の作り方に合わせる -------------------------------------
  // キックは CH3 を急降下させる。だからベースが切れる
  DMG.kick  = function (t) { DMG.wave({ t:t, hz:150, sweep:38, sweepT:0.05, dur:0.14,
                                        vol:0.95, decay:0.012, table:"bass" }); };
  DMG.snare = function (t) { DMG.noise({ t:t, dur:0.13, vol:0.55, decay:0.010, rate:0.75 }); };
  DMG.hat   = function (t, acc) { DMG.noise({ t:t, dur:acc?0.045:0.028,
                                              vol:acc?0.30:0.16, decay:0.004,
                                              rate:2.2, short:true }); };

  // ---- 起動 --------------------------------------------------------------
  DMG.init = function (ctx, node) {
    ac = ctx;
    out = ac.createGain();
    out.gain.value = 0.42;
    out.connect(node || ac.destination);
    return out;
  };
  DMG.master = function () { return out; };
  DMG.ctx = function () { return ac; };

  root.DMG = DMG;
})(typeof window !== "undefined" ? window : this);
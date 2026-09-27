(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const video = $('highway'), audio = $('uchira');
  const media = {highway: video, uchira: audio};
  const lengths = {highway: 65.9, uchira: 170.326145};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 'highway', frozen = reduced.matches, frozenAt = 0, colorful = false;
  let seaData, seaMeta, pulse = [], loading, touch = null, lastDraw = -1;
  let filmReady = false, filmLoading = null, lastFilm = -1;
  const filmCanvas = $('film'), filmCtx = filmCanvas ? filmCanvas.getContext('2d') : null;
  const filmNarrow = matchMedia('(max-width:600px)');
  let filmLand = !filmNarrow.matches;
  function setFilmShape() {
    filmLand = !filmNarrow.matches;
    if (!filmCanvas) return;
    filmCanvas.width = filmLand ? 960 : 540; filmCanvas.height = filmLand ? 540 : 960;
    filmCanvas.classList.toggle('landscape', filmLand);
    filmCanvas.classList.toggle('portrait', !filmLand);
    drawFilm(true);
  }
  setFilmShape();
  filmNarrow.addEventListener('change', setFilmShape);
  const canvas = $('sea'), ctx = canvas.getContext('2d');
  const field = document.createElement('canvas');
  const fctx = field.getContext('2d');
  let pixels;
  const current = () => media[selected];
  const clock = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const spoken = t => `${Math.floor(t / 60)}分${Math.floor(t % 60)}秒`;
  const status = text => { $('status').textContent = text; };
  if (matchMedia('(max-width:600px)').matches) {
    video.poster = './highway-poster-portrait.png';
    video.querySelector('source').src = './highway-portrait.mp4';
    $('stage').classList.add('portrait');
    video.load();
  }
  function controls() {
    const m = current(), d = Number.isFinite(m.duration) ? m.duration : lengths[selected];
    $('play').innerHTML = m.paused ? '▶ <span>聴く</span>' : 'Ⅱ <span>とめる</span>';
    $('play').setAttribute('aria-label', m.paused ? '再生' : '一時停止');
    $('seek').max = String(d); $('seek').value = String(m.currentTime);
    $('seek').setAttribute('aria-valuetext', `${spoken(m.currentTime)} / ${spoken(d)}`);
    $('elapsed').textContent = clock(m.currentTime); $('duration').textContent = clock(d);
    $('mute').textContent = m.muted ? '消音中' : '音あり';
    $('mute').setAttribute('aria-label', m.muted ? '音を出す' : '音を消す');
    $('mute').setAttribute('aria-pressed', String(m.muted));
  }
  function select(name) {
    Object.values(media).forEach(m => m.pause());
    selected = name;
    for (const key of Object.keys(media)) {
      $(`${key}-panel`).hidden = key !== name;
      $(`chapter-${key}`).setAttribute('aria-pressed', String(key === name));
    }
    $('words').hidden = name !== 'uchira'; $('after').hidden = true;
    $('chapter-copy').innerHTML = name === 'highway' ? '白なら右。黒なら左。<br>踏んだ色を裏返して、一歩。' : '形は、まだ途中。<br>海に触れると、少し色がひらきます。';
    $('chapter-sign').textContent = name === 'highway' ? '01 — Highway' : '02 — ウチら';
    status('再生すると、音が出ます。'); controls();
    if (name === 'uchira') { if (audio.preload === 'none') { audio.preload = 'metadata'; audio.load(); } resize(); ensureSea(); ensureFilm(); }
  }
  async function play() {
    const m = current();
    if (m.ended) m.currentTime = 0;
    $('after').hidden = true;
    try { await m.play(); } catch (error) {
      if (selected === (m === video ? 'highway' : 'uchira')) status('再生できませんでした。もう一度「聴く」を押すか、下の音源リンクから開いてください。');
    }
  }
  for (const name of Object.keys(media)) {
    const m = media[name];
    $(`chapter-${name}`).addEventListener('click', () => select(name));
    for (const event of ['loadedmetadata', 'timeupdate', 'seeked', 'volumechange', 'pause', 'play']) m.addEventListener(event, () => {
      if (name !== selected) return;
      controls();
      if (event === 'play') { Object.values(media).filter(other => other !== m).forEach(other => other.pause()); status(name === 'highway' ? '一歩。一歩。' : 'ウチら。'); }
      if (event === 'pause' && !m.ended) status('ここで、ひとやすみ。');
      if (event === 'seeked') { $('after').hidden = true; if (frozen) frozenAt = m.currentTime; drawSea(); drawFilm(true); }
    });
    m.addEventListener('waiting', () => { if (name === selected) status('続きを読み込んでいます。'); });
    m.addEventListener('playing', () => { if (name === selected) status(name === 'highway' ? '一歩。一歩。' : 'ウチら。'); });
    m.addEventListener('error', () => { if (name === selected) status('音源を読み込めませんでした。下の音源リンクからも開けます。'); });
    m.addEventListener('ended', () => {
      if (name !== selected) return;
      controls(); $('after').hidden = false;
      $('after-copy').textContent = name === 'highway' ? '圏外の、その先へ。' : 'ここに、置いておく。';
      $('continue').textContent = name === 'highway' ? 'ウチらを聴く →' : 'もう一度、ウチら。';
      status(name === 'highway' ? '次の曲へは、下のボタンから。' : '聴いてくれて、ありがとう。');
    });
  }
  $('play').addEventListener('click', () => current().paused ? play() : current().pause());
  $('seek').addEventListener('input', () => {
    const m = current();
    if (m.readyState < 1) { status('音源を読み込んでから、再生位置を変えられます。'); controls(); return; }
    m.currentTime = Number($('seek').value);
    $('after').hidden = true;
    if (frozen) frozenAt = m.currentTime;
    controls(); drawSea(); drawFilm(true);
  });
  $('mute').addEventListener('click', () => { const muted = !current().muted; Object.values(media).forEach(m => { m.muted = muted; }); controls(); });
  $('continue').addEventListener('click', () => {
    if (selected === 'highway') select('uchira');
    audio.currentTime = 0; frozenAt = 0; play();
  });
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ($('player').requestFullscreen) await $('player').requestFullscreen();
      else if (selected === 'highway' && video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      else status('このブラウザでは全画面表示を使えません。');
    } catch { status('このブラウザでは全画面表示を使えません。'); }
  });
  async function ensureSea() {
    if (seaData) { drawSea(); return; }
    if (loading) return loading;
    loading = (async () => {
      try {
        const responses = await Promise.all(['sea.json', 'sea.bin', 'pulse.json'].map(p => fetch(`./${p}`)));
        if (responses.some(r => !r.ok)) throw new Error('Sea asset unavailable');
        const [meta, buffer, energy] = await Promise.all([responses[0].json(), responses[1].arrayBuffer(), responses[2].json()]);
        if (buffer.byteLength !== meta.width * meta.height * meta.frames) throw new Error('Sea asset incomplete');
        seaMeta = meta; seaData = new Uint8Array(buffer); pulse = energy;
        field.width = meta.width; field.height = meta.height; pixels = fctx.createImageData(meta.width, meta.height);
        canvas.hidden = false; $('sea-poster').hidden = true; document.querySelector('.sea-tools').hidden = false;
        resize(); drawSea();
      } catch { if (selected === 'uchira') status('海を読み込めませんでした。音楽はそのまま聴けます。'); }
      finally { loading = null; }
    })();
    return loading;
  }
  function resize() {
    const rect = $('uchira-panel').getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scale = Math.min(devicePixelRatio || 1, 2, 1440 / rect.width);
    canvas.width = Math.round(rect.width * scale); canvas.height = Math.round(rect.height * scale); drawSea();
  }
  new ResizeObserver(resize).observe($('uchira-panel'));
  function setMotion(value) {
    frozen = value; frozenAt = audio.currentTime;
    $('motion').textContent = frozen ? '海をうごかす' : '海をとめる';
    $('motion').setAttribute('aria-pressed', String(frozen)); drawSea();
  }
  $('motion').addEventListener('click', () => setMotion(!frozen));
  reduced.addEventListener('change', e => setMotion(e.matches));
  $('color').addEventListener('click', () => {
    colorful = !colorful; $('color').textContent = colorful ? '淡くもどす' : '色をひらく';
    $('color').setAttribute('aria-pressed', String(colorful)); drawSea();
  });
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect(); touch = {x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, time: audio.currentTime}; drawSea();
  });
  function drawSea() {
    if (selected !== 'uchira' || !seaData || !canvas.width) return;
    const t = frozen ? frozenAt : audio.currentTime, w = canvas.width, h = canvas.height;
    const frame = Math.min(seaMeta.frames - 1, Math.max(0, Math.floor(t * seaMeta.fps)));
    const count = seaMeta.width * seaMeta.height, offset = frame * count;
    const beat = frozen ? 0 : (pulse[Math.min(pulse.length - 1, Math.floor(t * 4))] || 0);
    ctx.fillStyle = '#fbf6e8'; ctx.fillRect(0, 0, w, h);
    const side = Math.min(w * .87, h * .83), left = (w - side) / 2, top = (h - side) / 2;
    for (let i = 0; i < count; i++) {
      const x = i % seaMeta.width, y = Math.floor(i / seaMeta.width), v = seaData[offset + i] / 255;
      const mix = (Math.sin(x * .09 + y * .055 + t * .012) + 1) / 2;
      let a = Math.min(1, Math.max(0, (v - .12) * 1.85)) * (colorful ? .98 : .67 + beat * .1);
      if (touch) {
        const dx = (left + x / seaMeta.width * side) / w - touch.x, dy = (top + y / seaMeta.height * side) / h - touch.y;
        const life = frozen ? 1 : Math.max(0, 1 - Math.abs(t - touch.time) / 9);
        a = Math.min(1, a * (1 + Math.exp(-(dx * dx + dy * dy) * 45) * life * 1.7));
      }
      const p = i * 4;
      pixels.data[p] = 251 * (1 - a) + (144 + 87 * mix) * a;
      pixels.data[p + 1] = 246 * (1 - a) + (192 - 46 * mix) * a;
      pixels.data[p + 2] = 232 * (1 - a) + (179 + 13 * mix) * a;
      pixels.data[p + 3] = 255;
    }
    fctx.putImageData(pixels, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(field, left, top, side, side);
    for (let j = 0; j < 18; j++) {
      const x = (.06 + ((j * 37) % 89) / 100) * w;
      const y = (.09 + ((j * 23) % 80) / 100 + Math.sin(t * .16 + j) * .012) * h;
      const s = Math.max(2, Math.min(w, h) * .004);
      ctx.globalAlpha = .25; ctx.fillStyle = j % 2 ? '#b8a0c5' : '#8ebba7'; ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }
  async function ensureFilm() {
    if (!filmCanvas || !window.UchiraFilm) return;
    if (filmReady) { drawFilm(true); return; }
    if (filmLoading) return filmLoading;
    filmLoading = (async () => {
      try {
        await UchiraFilm.load();
        filmReady = true; filmCanvas.hidden = false;
        drawFilm(true);
      } catch { if (selected === 'uchira') status('映像を読み込めませんでした。音楽はそのまま聴けます。'); }
      finally { filmLoading = null; }
    })();
    return filmLoading;
  }
  function drawFilm(force) {
    if (!filmReady || selected !== 'uchira' || !filmCtx) return;
    const t = audio.currentTime - UchiraFilm.offset;
    if (!force && Math.abs(t - lastFilm) < 1 / 60) return;
    lastFilm = t;
    UchiraFilm.draw(filmCtx, t, filmLand);
  }
  function loop(now) {
    if (selected === 'uchira' && !document.hidden && !audio.paused) {
      if (!frozen && now - lastDraw > 50) { drawSea(); lastDraw = now; }
      const gap = reduced.matches ? 500 : 33;
      if (!loop.f || now - loop.f > gap) { drawFilm(false); loop.f = now; }
    }
    requestAnimationFrame(loop);
  }
  video.controls = false; audio.controls = false;
  document.querySelector('.controls').hidden = false;
  setMotion(frozen); controls(); requestAnimationFrame(loop);
})();

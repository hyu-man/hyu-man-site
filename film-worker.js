// Byte-range responses for the self-hosted films. Other routes use static assets.
// /notitle/notitle.mp4 (187MB) is stored as 20MiB chunks in /notitle/chunks/NN.bin
// and streamed back as one file, because Workers assets cap single files at 25MiB.
const SMALL_FILMS = ['/pcboy/song.m4a','/over/its-over-v2.mp4','/over/song.m4a','/uchira/highway.mp4','/uchira/highway-portrait.mp4','/uchira/uchira.m4a','/uchira/uchira-mv.mp4'];
const NOTITLE = { path: '/notitle/notitle.mp4', size: 186772689, chunk: 20*1024*1024, count: 9, etag: '"notitle-native-4k-v1"' };

function parseRange(range, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(range || '');
  if (!m || (!m[1] && !m[2])) return null;
  const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
  const end = m[1] ? (m[2] ? Math.min(Number(m[2]), size - 1) : size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) return null;
  return [start, end];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === NOTITLE.path) return serveChunked(request, env, url);
    if (url.pathname === '/august/august-v2.mp4') return serveChunked(request, env, url, {path:'/august/august-v2.mp4',size:49651552,chunk:20*1024*1024,count:3,etag:'"august-tree-v2"'});
    if (!SMALL_FILMS.includes(url.pathname)) return env.ASSETS.fetch(request);
    const headers = new Headers(request.headers);
    headers.delete('Range'); headers.delete('If-Range');
    const response = await env.ASSETS.fetch(new Request(request.url, {method:'GET',headers}));
    if (!response.ok) return response;
    const bytes = await response.arrayBuffer();
    const size = bytes.byteLength;
    const out = new Headers(response.headers);
    out.set('Accept-Ranges','bytes'); out.set('Content-Type',url.pathname.endsWith('.m4a')?'audio/mp4':'video/mp4');
    out.set('Cache-Control','public, max-age=86400');
    out.delete('Content-Encoding');
    const range = request.headers.get('Range');
    if (range && request.method === 'GET') {
      const r = parseRange(range, size);
      if (!r) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
      const [start, end] = r;
      out.set('Content-Range',`bytes ${start}-${end}/${size}`);
      out.set('Content-Length',String(end-start+1));
      return new Response(bytes.slice(start,end+1),{status:206,headers:out});
    }
    out.set('Content-Length',String(size));
    return new Response(request.method==='HEAD'?null:bytes,{headers:out});
  }
};

async function serveChunked(request, env, url, film = NOTITLE) {
  const { path, size, chunk, count, etag } = film;
  const out = new Headers();
  out.set('Accept-Ranges','bytes');
  out.set('Content-Type','video/mp4');
  out.set('Cache-Control','public, max-age=86400');
  out.set('ETag', etag);
  const range = request.headers.get('Range');
  let start = 0, end = size - 1, status = 200;
  if (range && request.method === 'GET') {
    const r = parseRange(range, size);
    if (!r) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
    [start, end] = r; status = 206;
    out.set('Content-Range',`bytes ${start}-${end}/${size}`);
  }
  out.set('Content-Length', String(end - start + 1));
  if (request.method === 'HEAD') return new Response(null,{status,headers:out});
  const first = Math.floor(start / chunk), last = Math.floor(end / chunk);
  const origin = url.origin;
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = first; i <= last && i < count; i++) {
          const res = await env.ASSETS.fetch(new Request(`${origin}${path.slice(0,path.lastIndexOf('/'))}/chunks/${String(i).padStart(2,'0')}.bin`));
          if (!res.ok) throw new Error('chunk '+i+' missing');
          let buf = new Uint8Array(await res.arrayBuffer());
          const cStart = i * chunk;
          const from = i === first ? start - cStart : 0;
          const to = i === last ? end - cStart + 1 : buf.byteLength;
          controller.enqueue(buf.subarray(from, to));
        }
        controller.close();
      } catch (e) { controller.error(e); }
    }
  });
  return new Response(stream, {status, headers:out});
}


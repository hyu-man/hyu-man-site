// Byte-range responses for the self-hosted film. Other routes use static assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!['/over/its-over-v2.mp4','/over/song.m4a'].includes(url.pathname)) return env.ASSETS.fetch(request);
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
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!m || (!m[1] && !m[2])) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
      const start = m[1] ? Number(m[1]) : Math.max(0,size-Number(m[2]));
      const end = m[1] ? (m[2] ? Math.min(Number(m[2]),size-1) : size-1) : size-1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start> end || start>=size) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
      out.set('Content-Range',`bytes ${start}-${end}/${size}`);
      out.set('Content-Length',String(end-start+1));
      return new Response(bytes.slice(start,end+1),{status:206,headers:out});
    }
    out.set('Content-Length',String(size));
    return new Response(request.method==='HEAD'?null:bytes,{headers:out});
  }
};

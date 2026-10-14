// Byte-range responses for the self-hosted film. Other routes use static assets.
import notitle from './notitle/video-meta.json' with { type: 'json' };
async function notitleVideo(request, env) {
  const size=notitle.size, chunkSize=notitle.chunkSize;
  let start=0,end=size-1,status=200;
  const range=request.headers.get('Range');
  if(range && request.method==='GET') {
    const m=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!m || (!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
    start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));
    end=m[1]?(m[2]?Math.min(Number(m[2]),size-1):size-1):size-1;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
    status=206;
  }
  const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':String(end-start+1),'Cache-Control':'public, max-age=86400','ETag':'"notitle-native-4k-v1"'};
  if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  if(request.method==='HEAD')return new Response(null,{headers});
  let cursor=start;
  const body=new ReadableStream({
    async pull(controller) {
      if(cursor>end){controller.close();return;}
      try {
        const part=Math.floor(cursor/chunkSize),url=new URL(request.url);
        url.pathname=`/notitle/parts/${String(part).padStart(3,'0')}.bin`;url.search='';
        const response=await env.ASSETS.fetch(new Request(url));
        if(!response.ok)throw new Error('Video part unavailable');
        const data=new Uint8Array(await response.arrayBuffer());
        const from=cursor-part*chunkSize,to=Math.min(data.length,end-part*chunkSize+1);
        if(to<=from)throw new Error('Invalid video part');
        controller.enqueue(data.subarray(from,to));cursor=part*chunkSize+to;
      } catch(error){controller.error(error);}
    }
  });
  return new Response(body,{status,headers});
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if(url.pathname==='/notitle/notitle.mp4')return notitleVideo(request,env);
    if (!['/over/its-over-v2.mp4','/over/song.m4a','/uchira/highway.mp4','/uchira/highway-portrait.mp4','/uchira/uchira.m4a','/uchira/uchira-mv.mp4','/mogura/mogura.mp4','/louder/louder.mp4','/louder/song.m4a','/notitle/song.m4a','/notitle/notitle.mp4'].includes(url.pathname)) return env.ASSETS.fetch(request);
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

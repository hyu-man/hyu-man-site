import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../film-worker.js';
const bytes=await readFile('public/pcboy/song.m4a');
const env={ASSETS:{fetch:async()=>new Response(bytes,{headers:{'Content-Type':'audio/mp4'}})}};
for(const range of ['bytes=0-1023',`bytes=${bytes.length-100}-`,'bytes=-128']){
 const res=await worker.fetch(new Request('https://hyu-man.com/pcboy/song.m4a',{headers:{Range:range}}),env);
 assert.equal(res.status,206);assert.equal(res.headers.get('Content-Type'),'audio/mp4');
 const from=range==='bytes=-128'?bytes.length-128:range==='bytes=0-1023'?0:bytes.length-100;
 const end=range==='bytes=0-1023'?1024:bytes.length;
 assert.deepEqual(Buffer.from(await res.arrayBuffer()),bytes.subarray(from,end));
}
console.log('PCboy audio: start, end and suffix seek ranges match the original AAC file.');

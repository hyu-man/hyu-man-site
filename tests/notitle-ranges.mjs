import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../film-worker.js';
const meta=JSON.parse(await readFile('notitle/video-meta.json','utf8'));
const env={ASSETS:{fetch:async request=>new Response(await readFile('public'+new URL(request.url).pathname))}};
const reference=Buffer.concat(await Promise.all(Array.from({length:meta.parts},(_,i)=>readFile('public/notitle/parts/'+String(i).padStart(3,'0')+'.bin'))));
for(const [a,z] of [[0,1023],[meta.chunkSize-100,meta.chunkSize+100],[meta.size-100,meta.size-1]]){
 const res=await worker.fetch(new Request('https://hyu-man.com/notitle/notitle.mp4',{headers:{Range:`bytes=${a}-${z}`}}),env);
 assert.equal(res.status,206);assert.equal(res.headers.get('Content-Range'),`bytes ${a}-${z}/${meta.size}`);
 assert.deepEqual(Buffer.from(await res.arrayBuffer()),reference.subarray(a,z+1));
}
const head=await worker.fetch(new Request('https://hyu-man.com/notitle/notitle.mp4',{method:'HEAD'}),env);
assert.equal(head.headers.get('Content-Length'),String(meta.size));
console.log('Native 4K byte ranges match original, including part boundary and final bytes.');


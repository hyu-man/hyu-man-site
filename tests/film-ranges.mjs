import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../film-worker.js';

// Browser seeking requires byte ranges on both films and audio, including Safari suffix requests.
const bytes = new Uint8Array(128).map((_, i) => i);
const env = {ASSETS: {fetch: async request => {
  if (new URL(request.url).pathname === '/uta/') return new Response('static page');
  assert.equal(request.headers.get('Range'), null);
  return new Response(bytes, {headers: {'Content-Type': 'application/octet-stream'}});
}}};
const config = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
for (const path of ['/over/its-over-v2.mp4', '/over/song.m4a', '/uchira/highway.mp4', '/uchira/highway-portrait.mp4', '/uchira/uchira.m4a']) {
  assert.ok(config.includes(`"${path}"`), `${path} must invoke the range worker`);
  const get = (headers = {}, method = 'GET') => worker.fetch(new Request(`https://hyu-man.com${path}`, {headers, method}), env);
  let r = await get({'Range': 'bytes=12-31'});
  assert.equal(r.status, 206); assert.equal(r.headers.get('Content-Range'), 'bytes 12-31/128');
  assert.deepEqual(new Uint8Array(await r.arrayBuffer()), bytes.slice(12, 32));
  r = await get({'Range': 'bytes=-8'}); assert.deepEqual(new Uint8Array(await r.arrayBuffer()), bytes.slice(-8));
  r = await get({'Range': 'bytes=120-999'}); assert.equal(r.headers.get('Content-Range'), 'bytes 120-127/128');
  r = await get({'Range': 'bytes=128-'}); assert.equal(r.status, 416); assert.equal(r.headers.get('Content-Range'), 'bytes */128');
  r = await get({}, 'HEAD'); assert.equal((await r.arrayBuffer()).byteLength, 0); assert.equal(r.headers.get('Content-Length'), '128');
  r = await get(); assert.equal(r.status, 200); assert.equal(r.headers.get('Content-Type'), path.endsWith('.m4a') ? 'audio/mp4' : 'video/mp4');
  assert.deepEqual(new Uint8Array(await r.arrayBuffer()), bytes);
}
assert.equal(await (await worker.fetch(new Request('https://hyu-man.com/uta/'), env)).text(), 'static page');
console.log('Film/audio seek ranges, suffix ranges, HEAD, invalid ranges and static fallback: passed.');

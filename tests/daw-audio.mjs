import assert from 'node:assert/strict';
import {encodeWav} from '../public/daw/audio.js';
const data=[new Float32Array([0,.5,-1]),new Float32Array([1,-.5,0])];
const b=new Uint8Array(await encodeWav({length:3,sampleRate:44100,getChannelData:c=>data[c]}).arrayBuffer()),v=new DataView(b.buffer);
assert.equal(b.length,62);assert.equal(v.getUint32(4,true),54);assert.equal(v.getUint16(22,true),2);assert.equal(v.getUint32(24,true),44100);assert.equal(v.getUint16(34,true),24);
function sample(i){const p=44+i*3;let x=b[p]|b[p+1]<<8|b[p+2]<<16;return x&0x800000?x-0x1000000:x;}
assert.deepEqual(Array.from({length:6},(_,i)=>sample(i)),[0,8388607,4194304,-4194303,-8388607,0]);
console.log('Stereo 24-bit PCM WAV header, interleaving and signed samples passed.');

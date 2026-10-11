import assert from 'node:assert/strict';
import {defaults,generate,compose,validate,midi,STYLES} from '../public/daw/composition.js';

for(const style of Object.keys(STYLES))for(const bars of [36,64,80]){
 const p=generate({...defaults(),style,bars}),s=compose(p);
 assert.equal(s.sections.length,9);assert.equal(s.sections.reduce((n,x)=>n+x.length,0),bars);
 assert.equal(s.blocks.length,bars/4);assert.deepEqual(compose(p),s);
 assert.deepEqual(validate(JSON.parse(JSON.stringify(p))),p);
 assert.ok(s.evs.every(e=>Number.isFinite(e.t)&&e.t>=0&&e.t+e.dur<=s.body+1e-9&&e.midi>=0&&e.midi<128));
 assert.ok(s.blocks.every(b=>new Set(b.chords).size>=3));
 assert.ok(s.blocks.every(b=>b.kick.every(k=>JSON.stringify(k)!=='[0,4,8,12]')));
 assert.ok(s.evs.some(e=>e.section===7&&e.i===0));
 const low=compose({...p,lift:0}).evs.filter(e=>e.section===7&&e.i===0);
 const high=s.evs.filter(e=>e.section===7&&e.i===0);
 high.forEach((e,i)=>assert.equal(e.midi-low[i].midi,12));
 const muted=structuredClone(p);muted.tracks.forEach(t=>t.mute=true);assert.equal(compose(muted).evs.length,0);
 const solo=structuredClone(p);solo.tracks[2].solo=true;assert.ok(compose(solo).evs.every(e=>e.i===2));
 const block=structuredClone(p);block.tracks.forEach(t=>t.blocks[3]=0);assert.ok(compose(block).evs.every(e=>e.block!==3));
 // Parse the exported SMF, independently checking timing and the drum channel.
 const bytes=new Uint8Array(await midi(p).arrayBuffer()),view=new DataView(bytes.buffer);
 assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'MThd');assert.equal(view.getUint16(10),9);assert.equal(view.getUint16(12),480);
 let pos=14,notes=0;
 for(let tr=0;tr<9;tr++){
  assert.equal(new TextDecoder().decode(bytes.slice(pos,pos+4)),'MTrk');const end=pos+8+view.getUint32(pos+4);pos+=8;let tick=0;
  const vlq=()=>{let v=0,b;do{b=bytes[pos++];v=v*128+(b&127);}while(b&128);return v;};
  while(pos<end){tick+=vlq();const status=bytes[pos++];if(status===255){pos++;const len=vlq();pos+=len;}else if((status&240)===192){pos++;}else{assert.ok([128,144].includes(status&240));if((status&240)===144){notes++;assert.equal(status&15,tr===8?9:tr-1);}pos+=2;}}
  assert.equal(pos,end);assert.equal(tick,bars*1920);
 }
 assert.equal(notes,s.evs.length);assert.equal(pos,bytes.length);
 console.log(`${style}/${bars}: ${s.evs.length} events, ${s.metrics.average.toFixed(1)}/s; MIDI valid`);
}
assert.throws(()=>validate({version:3,tracks:[]}));
const bad=defaults();bad.bpm=NaN;bad.key=Infinity;bad.tracks[0]={};assert.ok(Number.isFinite(compose(validate(bad)).duration));
const a=generate(defaults()),b=generate({...defaults(),variation:1});assert.notDeepEqual(compose(a).evs,compose(b).evs);
console.log('Composition, arrangement, project validation, mute/solo and MIDI checks passed.');

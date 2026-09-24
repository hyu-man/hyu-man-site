import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {defaults,validate,fromWords,compose,midi,vowelFor} from '../public/daw/studio.js';
import {RULES} from '../public/daw/engine.js';
const old=fs.readFileSync(new URL('../public/daw/classic/index.html',import.meta.url),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(old.slice(old.indexOf('  function h32(i)'),old.indexOf('  // ══ 音の材料'))+old.slice(old.indexOf('  function Ant(seed)'),old.indexOf('  const MAKE ='))+';this.rules=[Ant,Life,Collatz,Burn];',ctx);
for(let i=0;i<4;i++){const a=RULES[i]([0,93,27,15][i]),b=ctx.rules[i]([0,93,27,15][i]);for(let k=0;k<256;k++)assert.equal(JSON.stringify(a.advance()),JSON.stringify(b.advance()));}
const p=defaults();assert.deepEqual(validate(JSON.parse(JSON.stringify(p))),p);const a=compose(p);assert.deepEqual(a,compose(p));assert(a.evs.length>100);assert(a.evs.every(e=>Number.isFinite(e.amp)&&e.amp>=0&&e.t<a.body&&e.dur>0));
let off=defaults();off.tracks.forEach(t=>t.mute=true);assert.equal(compose(off).evs.length,0);
let solo=defaults();solo.tracks[2].solo=true;assert(compose(solo).evs.every(e=>e.i===2));
let section=defaults();section.tracks.forEach(t=>t.sections[3]=0);assert(compose(section).evs.every(e=>Math.floor(e.t/a.body*8)!==3));
for(const style of ['night','glass','dance']){const q=defaults();q.style=style;q.bars=64;q.bpm=55;const s=compose(q);assert(s.evs.length<20000);assert(s.evs.every(e=>e.midi===undefined||(e.midi>=0&&e.midi<=127)));}
const n=defaults();n.prompt='静かな夜';assert.equal(fromWords(n).style,'night');assert.deepEqual(fromWords(n),fromWords(n));
const bytes=Buffer.from(await midi(p).arrayBuffer());assert.equal(bytes.toString('ascii',0,4),'MThd');assert.equal(bytes.readUInt16BE(10),7);let pos=14,count=0;while(pos<bytes.length){assert.equal(bytes.toString('ascii',pos,pos+4),'MTrk');pos+=8+bytes.readUInt32BE(pos+4);count++;}assert.equal(count,7);assert.equal(pos,bytes.length);
console.log(JSON.stringify({rule_steps_compared:1024,events:a.evs.length,duration:a.duration,deterministic:true,mute_solo_sections:'passed',project_roundtrip:'passed',midi_tracks:count,styles:'passed'}));
const legacy=defaults();legacy.version=1;legacy.tracks.pop();delete legacy.voiceText;delete legacy.voiceKind;
const migrated=validate(legacy);assert.equal(migrated.tracks[5].mute,true);assert.deepEqual(migrated.tracks.slice(0,5),legacy.tracks);
const voice=defaults();voice.tracks[5].solo=true;assert(compose(voice).evs.length>0);assert(compose(voice).evs.every(e=>e.i===5&&e.kind==='voice'));
for(const text of ['', ' 。、!?… ']){voice.voiceText=text;assert.equal(compose(voice).evs.length,0);}
for(const [c,v] of [['ア',0],['き',1],['u',2],['め',3],['コ',4]])assert.equal(vowelFor(c),v);
voice.voiceText='アイウエオ';voice.voiceKind='robot';assert.deepEqual(validate(JSON.parse(JSON.stringify(voice))),voice);
console.log('voice: deterministic composition, vowel selection, silence, solo and legacy migration passed');
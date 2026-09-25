import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import {Machine,MACHINES} from '../halt/machine.mjs';
const definitions=JSON.parse(readFileSync(new URL('./fixtures/halt-original.json',import.meta.url),'utf8'));
for(let i=0;i<5;i++)assert.deepEqual(MACHINES[i].rules,definitions[i].t);
const results=[];
for(let i=0;i<4;i++){
 const m=new Machine(i);const tape=new Set();let pos=0,state='A',steps=0;
 while(state!=='H'){const [w,d,n]=definitions[i].t[state][tape.has(pos)?1:0];if(w)tape.add(pos);else tape.delete(pos);pos+=d;state=n;steps++;assert.ok(steps<=definitions[i].halt);}
 m.advance(steps+100);assert.equal(m.steps,steps);assert.equal(m.pos,pos);assert.equal(m.ones,tape.size);assert.equal(m.halted,true);
 for(let p=m.low;p<=m.high;p++)assert.equal(m.tape[m.origin+p],Number(tape.has(p)));
 assert.equal(m.rows.at(-1).step,steps);results.push({id:m.definition.id,steps,ones:m.ones,pos,peak:m.peak,span:m.high-m.low+1});
 m.reset();assert.equal(m.steps,0);assert.equal(m.ones,0);assert.equal(m.rows.length,0);assert.equal(m.halted,false);
}
const loop=new Machine(4);loop.advance(10);const a=[loop.pos,loop.state,Array.from(loop.tape)];loop.advance(2);assert.deepEqual([loop.pos,loop.state,Array.from(loop.tape)],a);assert.equal(loop.halted,false);
console.log(JSON.stringify({tablesIdentical:true,referenceAgreement:true,loopPeriod:2,results},null,2));


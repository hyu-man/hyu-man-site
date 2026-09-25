import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {World,fern} from '../public/wakeru/world.js';
// Compare against the actual pre-redesign implementation, not a rewritten oracle.
const old=execFileSync('git',['show','06cef89:wakeru/index.html'],{encoding:'utf8'});
const stub=()=>({width:360,height:80,fillRect(){},classList:{toggle(){}},appendChild(){},getContext(){return this;},querySelector(){return stub();}});
const ctx={document:{documentElement:{},getElementById:stub,createElement:stub},getComputedStyle:()=>({getPropertyValue:()=>''}),requestAnimationFrame(){},window:{}};
vm.createContext(ctx);
let script=old.split('<script>')[1].split('</script>')[0];
script=script.replace('  requestAnimationFrame(frame);\n})();','  globalThis.advance=frame; globalThis.setMu=v=>mu=v; globalThis.snapshot=()=>({x:x1,hx,hy,bias,u:Array.from(U)});\n})();');
vm.runInContext(script,ctx);
const model=new World();
for(const mu of [0,.2,.65,1,.4]){
  model.mu=mu;ctx.setMu(mu);
  for(let t=0;t<120;t++){model.tick();ctx.advance();}
  const state=ctx.snapshot();
  for(const key of ['x','hx','hy','bias'])assert.equal(model[key],state[key],key);
  assert.deepEqual(Array.from(model.u),Array.from(state.u));
}
const a=new World(),b=new World();a.mu=b.mu=.9;
for(let t=0;t<900;t++){if(t===100||t===300)a.shake=b.shake=2;a.tick();b.tick();}
assert.deepEqual(a,b);assert(a.u.every(x=>Number.isFinite(x)&&x>=0&&x<=1.01));
a.reset();assert.deepEqual(a,new World());assert.deepEqual(fern(),fern());assert.equal(fern().length,6000);
console.log('600 ticks match original well, Hopf and growth states; deterministic perturbation, reset and fern passed.');

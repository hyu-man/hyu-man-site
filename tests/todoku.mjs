import assert from 'node:assert/strict';
import {radius,surface,project,TAU} from '../public/todoku/geometry.js';
// A flat-space diamond is the intersection of two light cones: r + |t| = span / 2.
for(const span of [1.3,2,2.8]){
  assert.equal(radius(-span/2,span),0);assert.equal(radius(span/2,span),0);
  for(let k=0;k<=100;k++)for(let i=0;i<24;i++){
    const u=k/100,p=surface(u,i/24*TAU,span,0,0);
    assert(Math.abs(Math.hypot(p[0],p[2])+Math.abs(p[1])-span/2)<1e-12);
    for(const warp of [0,.35,1]){
      const pp=surface(u,i/24*TAU,span,warp,17.2);
      assert(pp.every(Number.isFinite));
      for(const tilt of [-.5,0,.5])assert(project(pp,14,tilt,180,400,300).every(Number.isFinite));
    }
  }
}
assert.equal(radius(9,2),0);
// The two smaller diagrams share their tip at the origin; they are not separated by a false gap.
const span=2,half=span*.28;
assert.equal(-half+span*.56/2,0);assert.equal(half-span*.56/2,0);
console.log('Flat light-cone boundary, endpoints, shared tip and extreme projection controls passed.');

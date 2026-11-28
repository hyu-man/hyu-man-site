// A flat 2+1-dimensional spacetime diagram, c=1. The third spatial axis is suppressed.
// Deformed modes are art, not solutions of the null constraints or quantum gravity.
export const TAU=Math.PI*2;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function radius(time,span=2){return Math.max(0,span/2-Math.abs(time));}
export function surface(u,a,span=2,warp=0,phase=0){
  const y=(u-.5)*span,r=radius(y,span);
  const wave=warp*Math.sin(Math.PI*u)**2;
  const angle=a+wave*.24*Math.sin(phase+u*5);
  const squeeze=wave*.25*Math.sin(u*7-phase);
  const crest=1+wave*.09*Math.cos(a*3+phase*1.3+u*11);
  return [r*Math.cos(angle)*Math.exp(squeeze)*crest,y,r*Math.sin(angle)*Math.exp(-squeeze)*crest];
}
export function project(point,yaw,pitch,scale,cx,cy){
  const [x,y,z]=point;const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
  const yy=y*Math.cos(pitch)-zz*Math.sin(pitch),depth=y*Math.sin(pitch)+zz*Math.cos(pitch);
  const perspective=4.8/(4.8-depth);
  return [cx+xx*scale*perspective,cy-yy*scale*perspective,perspective,depth];
}

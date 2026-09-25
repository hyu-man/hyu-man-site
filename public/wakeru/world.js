// The five systems of the original room. One tick = one original update.
export function hash(i) {
  i=Math.imul(i,0x9E3779B1)>>>0;i^=i>>>15;
  i=Math.imul(i,0x2C1B3C6D)>>>0;i^=i>>>12;i=Math.imul(i,0x297A2D39)>>>0;
  return ((i^(i>>>15))>>>0)/4294967296;
}
export function fern(count=6000) {
  const points=[];let x=0,y=0;
  for(let i=1;i<=count;i++) {
    const p=hash(i);let nx,ny;
    if(p<.01){nx=0;ny=.16*y;}
    else if(p<.86){nx=.85*x+.04*y;ny=-.04*x+.85*y+1.6;}
    else if(p<.93){nx=.2*x-.26*y;ny=.23*x+.22*y+1.6;}
    else{nx=-.15*x+.28*y;ny=.26*x+.24*y+.44;}
    x=nx;y=ny;points.push([x,y]);
  }
  return points;
}
export class World {
  constructor(){this.reset();}
  reset(){this.mu=0;this.t=0;this.x=.02;this.bias=0;this.hx=.02;this.hy=0;this.trail=[];this.seed=1;this.shake=0;this.u=new Float32Array(1800);this.u[945]=.6;this.fill=.6/1800;}
  random(){return hash(this.seed++);}
  tick(active=null){
    this.t++;
    if(active===null||active===0){
    const a=this.mu-.3;
    this.bias=a>0?.32*Math.sin(this.t*.045*(.5+this.mu))*Math.sqrt(a):0;
    for(let s=0;s<4;s++)this.x-=.06*(-a*this.x+this.x**3-this.bias);
    if(this.shake>0)this.x+=(this.random()-.5)*.9;
    this.x=Math.max(-1.5,Math.min(1.5,this.x));
    }
    if(active===null||active===3){
    for(let s=0;s<3;s++){
      const r2=this.hx**2+this.hy**2,m=this.mu-.5;
      const dx=m*this.hx-this.hy-this.hx*r2,dy=this.hx+m*this.hy-this.hy*r2;
      this.hx+=.05*dx;this.hy+=.05*dy;
      if(this.shake>0){this.hx+=(this.random()-.5)*.4;this.hy+=(this.random()-.5)*.4;}
    }
    this.trail.push([this.hx,this.hy]);if(this.trail.length>160)this.trail.shift();
    }
    if(active===null||active===4){
    const next=new Float32Array(1800),r=Math.max(0,this.mu-.15)*.9;let total=0;
    for(let y=0;y<20;y++)for(let x=0;x<90;x++){
      const i=y*90+x,u=this.u[i],lap=this.u[y*90+(x+89)%90]+this.u[y*90+(x+1)%90]+this.u[((y+19)%20)*90+x]+this.u[((y+1)%20)*90+x]-4*u;
      next[i]=(u+r*u*(1-u)+.12*lap)*(this.shake>0?.7:1);total+=next[i];
    }
    this.u=next;this.fill=total/1800;
    }
    if(this.shake>0)this.shake--;
  }
}

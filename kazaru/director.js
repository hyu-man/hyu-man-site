/* Local, streaming audio heuristics. No model, network, or persistent storage. */
(function(root){
  class LocalDirector {
    constructor(){this.reset()}
    reset(){this.time=0;this.fast=0;this.slow=0;this.previous=0;this.silence=0;this.lastBurst=-10;this.state='listen';this.candidate='listen';this.hold=0}
    step(rms,dt,mood='cute'){
      dt=Math.min(.1,Math.max(0,dt));if(this.time===0){this.fast=rms;this.slow=rms}this.time+=dt;
      this.fast+=(rms-this.fast)*(1-Math.exp(-dt/.25));
      this.slow+=(rms-this.slow)*(1-Math.exp(-dt/3));
      this.silence=rms<.003?this.silence+dt:0;
      const ratio=this.fast/Math.max(.008,this.slow);
      const attack=rms>Math.max(.025,this.previous*1.5)&&rms>this.slow*1.25;
      this.previous=rms;
      let next=this.time<1.2?'listen':this.silence>.5?'quiet':ratio>1.23?'rise':ratio<.7||this.fast<.012?'quiet':'flow';
      if(next!==this.candidate){this.candidate=next;this.hold=0}else this.hold+=dt;
      if(this.hold>.45)this.state=next;
      const burst=this.time>1.2&&this.silence===0&&attack&&this.time-this.lastBurst>(mood==='party'?.55:1.3);
      if(burst)this.lastBurst=this.time;
      const quiet=this.state==='quiet';
      const kind=mood==='soft'?(quiet?'sleep':'heart'):mood==='party'?(quiet?'heart':'star'):(this.state==='rise'?'star':'heart');
      return {state:this.state,kind,burst,scale:quiet?.18:mood==='party'?1.25:mood==='soft'?.4:.8};
    }
  }
  if(typeof module!=='undefined')module.exports=LocalDirector;else root.LocalDirector=LocalDirector;
})(typeof window==='undefined'?globalThis:window);

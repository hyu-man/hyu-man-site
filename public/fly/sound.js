"use strict";
// A gentle sonification of real circuit events. Cooldowns only select audible
// events; they never alter the neural simulation or move events onto a beat grid.
class LittleFlySound {
  constructor(context){
    this.context=context;
    this.last={dPR1:-Infinity,vMS12:-Infinity,dMS9:-Infinity,vPR6:-Infinity};
    this.count={dPR1:0,vMS12:0,dMS9:0,vPR6:0};
    this.cooldown={dPR1:.18,vMS12:.32,dMS9:.46,vPR6:.6};
    this.voices=new Map();
    this.bus=context.createGain();
    const filter=context.createBiquadFilter();filter.type="lowpass";filter.frequency.value=3200;filter.Q.value=.45;
    const compressor=context.createDynamicsCompressor();
    compressor.threshold.value=-18;compressor.knee.value=16;compressor.ratio.value=2.5;compressor.attack.value=.012;compressor.release.value=.2;
    this.master=context.createGain();this.master.gain.value=0;
    this.bus.connect(filter);filter.connect(compressor);compressor.connect(this.master);this.master.connect(context.destination);
    // Two quiet, filtered reflections give the toy instruments a small room.
    for(const [seconds,level] of [[.097,.09],[.163,.055]]){
      const delay=context.createDelay(.3),wet=context.createGain();delay.delayTime.value=seconds;wet.gain.value=level;
      filter.connect(delay);delay.connect(wet);wet.connect(compressor);
    }
    this.padGain=context.createGain();this.padGain.gain.value=0;this.padGain.connect(this.bus);
    for(const [frequency,level] of [[261.63,.55],[392,.45]]){
      const oscillator=context.createOscillator(),gain=context.createGain();
      oscillator.type="sine";oscillator.frequency.value=frequency;gain.gain.value=level;
      oscillator.connect(gain);gain.connect(this.padGain);oscillator.start();
    }
  }
  level(value,when=this.context.currentTime){
    const gain=Math.max(0,Math.min(1,value))*.9;
    this.master.gain.cancelScheduledValues(when);
    this.master.gain.setTargetAtTime(gain,when,.025);
  }
  activity(value,when=this.context.currentTime){
    const amount=Math.min(1,Math.max(0,value/6));
    this.padGain.gain.setTargetAtTime(.035*Math.pow(amount,1.5),when,.12);
  }
  pause(){
    const now=this.context.currentTime;
    this.level(0,now);this.padGain.gain.cancelScheduledValues(now);this.padGain.gain.setTargetAtTime(0,now,.035);
    // Let the master fade before discarding tails so a quick resume cannot bring
    // old notes back. Every oscillator has an onended cleanup below.
    for(const [oscillator,envelope] of this.voices){
      if(envelope.gain.cancelAndHoldAtTime)envelope.gain.cancelAndHoldAtTime(now);
      else{envelope.gain.cancelScheduledValues(now);envelope.gain.setValueAtTime(.00001,now);}
      envelope.gain.linearRampToValueAtTime(.00001,now+.015);
      try{oscillator.stop(now+.02);}catch{}
    }
  }
  spike(type,side,index,simTime,when=this.context.currentTime+.025){
    if(!(type in this.last)||simTime-this.last[type]<this.cooldown[type])return false;
    this.last[type]=simTime;
    const n=this.count[type]++;
    // Small alternating stereo positions avoid favoring whichever side appears
    // first in a simultaneous group of spikes.
    const pan=(n%2?1:-1)*.14;
    if(type==="dPR1"){
      const notes=[392,523.25,659.25,523.25,440,587.33,523.25,440];
      this.note(notes[n%notes.length],.24,.21,pan,when,[[1,1],[2,.13],[3,.035]],.008);
    }else if(type==="vMS12"){
      const notes=[783.99,880,1046.5,880,659.25,783.99,1046.5,880];
      this.note(notes[n%notes.length],.55,.105,-pan,when,[[1,1],[2,.1],[3,.025]],.012);
    }else if(type==="dMS9"){
      this.note(n%4===3?196:130.81,.34,.24,0,when,[[1,1],[2,.13]],.012,1.1);
    }else if(type==="vPR6"){
      this.note([1046.5,1318.51,1174.66][n%3],.23,.045,pan,when,[[1,1]],.014);
    }
    return true;
  }
  note(frequency,duration,level,pan,when,partials,attack,glide=1){
    const context=this.context,panner=context.createStereoPanner();panner.pan.value=pan;panner.connect(this.bus);
    let remaining=partials.length;
    for(const [ratio,weight] of partials){
      const oscillator=context.createOscillator(),envelope=context.createGain();
      const partialDuration=duration/(1+(ratio-1)*.45);
      oscillator.type="sine";oscillator.frequency.setValueAtTime(frequency*ratio*glide,when);
      if(glide!==1)oscillator.frequency.exponentialRampToValueAtTime(frequency*ratio,when+.075);
      envelope.gain.setValueAtTime(.00001,when);
      envelope.gain.exponentialRampToValueAtTime(level*weight,when+attack);
      envelope.gain.exponentialRampToValueAtTime(.00001,when+partialDuration);
      oscillator.connect(envelope);envelope.connect(panner);
      this.voices.set(oscillator,envelope);
      oscillator.onended=()=>{this.voices.delete(oscillator);oscillator.disconnect();envelope.disconnect();if(--remaining===0)panner.disconnect();};
      oscillator.start(when);oscillator.stop(when+partialDuration+.02);
    }
  }
}
window.LittleFlySound=LittleFlySound;

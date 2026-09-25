// The original five transition tables. H is an instruction, never a step limit.
export const MACHINES = [
 {id:'two', name:'2じょうたい', expected:6, rules:{A:[[1,1,'B'],[1,-1,'B']],B:[[1,-1,'A'],[1,1,'H']]}},
 {id:'three',name:'3じょうたい',expected:14,rules:{A:[[1,1,'B'],[1,1,'H']],B:[[0,1,'C'],[1,1,'B']],C:[[1,-1,'C'],[1,-1,'A']]}},
 {id:'four',name:'4じょうたい',expected:107,rules:{A:[[1,1,'B'],[1,-1,'B']],B:[[1,-1,'A'],[0,-1,'C']],C:[[1,1,'H'],[1,-1,'D']],D:[[1,1,'D'],[0,1,'A']]}},
 {id:'five',name:'5じょうたい',expected:47176870,rules:{A:[[1,1,'B'],[1,-1,'C']],B:[[1,1,'C'],[1,1,'B']],C:[[1,1,'D'],[0,-1,'E']],D:[[1,-1,'A'],[1,-1,'D']],E:[[1,1,'H'],[0,-1,'A']]}},
 {id:'loop',name:'とまらない子',expected:null,rules:{A:[[1,1,'B'],[1,-1,'B']],B:[[1,-1,'A'],[1,1,'A']]}}
];
export class Machine {
 constructor(index){this.definition=MACHINES[index];this.labels=Object.keys(this.definition.rules);this.write=[];this.move=[];this.next=[];
  for(const name of this.labels)for(const [w,d,s] of this.definition.rules[name]){this.write.push(w);this.move.push(d);this.next.push(s==='H'?-1:this.labels.indexOf(s));}this.reset();}
 reset(){this.tape=new Uint8Array(65536);this.origin=32768;this.pos=0;this.state=0;this.steps=0;this.ones=0;this.halted=false;this.low=0;this.high=0;this.peak=0;this.peakAt=0;this.rows=[];this.binLow=0;this.binHigh=0;this.period=this.definition.id==='five'?157257:1;this.last=null;}
 grow(){const next=new Uint8Array(this.tape.length*2);next.set(this.tape,this.tape.length/2);this.origin+=this.tape.length/2;this.tape=next;}
 advance(count){
  for(let i=0;i<count&&!this.halted;i++){
   if(this.origin+this.pos<1||this.origin+this.pos>=this.tape.length-1)this.grow();
   const bit=this.tape[this.origin+this.pos],rule=this.state*2+bit,w=this.write[rule],dir=this.move[rule],next=this.next[rule];
   this.last={state:this.labels[this.state],read:bit,write:w,move:dir,next:next<0?'H':this.labels[next]};
   this.tape[this.origin+this.pos]=w;this.ones+=w-bit;this.pos+=dir;this.steps++;
   this.low=Math.min(this.low,this.pos);this.high=Math.max(this.high,this.pos);this.binLow=Math.min(this.binLow,this.pos);this.binHigh=Math.max(this.binHigh,this.pos);
   if(this.ones>this.peak){this.peak=this.ones;this.peakAt=this.steps;}
   if(next<0){this.halted=true;this.state=-1;}else this.state=next;
   if(this.steps%this.period===0||this.halted){this.rows.push({step:this.steps,lo:this.binLow,hi:this.binHigh,ones:this.ones});if(this.rows.length>720)this.rows.shift();this.binLow=this.pos;this.binHigh=this.pos;}
  }
 }
 snapshot(){const view=[];for(let i=-24;i<=24;i++)view.push(this.tape[this.origin+this.pos+i]||0);
  const overview=new Float32Array(360),span=this.high-this.low+1;
  for(let i=0;i<360;i++){const a=this.low+Math.floor(i*span/360),b=Math.max(a+1,this.low+Math.floor((i+1)*span/360));let n=0;for(let j=a;j<b;j++)n+=this.tape[this.origin+j]||0;overview[i]=n/(b-a);}
  return {id:this.definition.id,name:this.definition.name,steps:this.steps,ones:this.ones,halted:this.halted,pos:this.pos,state:this.state<0?'H':this.labels[this.state],low:this.low,high:this.high,peak:this.peak,peakAt:this.peakAt,last:this.last,view,overview:Array.from(overview),rows:this.rows.slice()};
 }
}

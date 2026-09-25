import { Machine } from './machine.mjs';
const machines=Array.from({length:5},(_,i)=>new Machine(i));
self.onmessage=({data})=>{
 try{const m=machines[data.index];if(!m)throw new Error('Unknown machine');
  if(data.type==='reset')m.reset();
  else if(data.type==='advance')m.advance(Math.min(40000,Math.max(0,Math.floor(data.count))));
  self.postMessage({index:data.index,request:data.request,snapshot:m.snapshot()});
 }catch(error){self.postMessage({error:String(error.message)});}
};

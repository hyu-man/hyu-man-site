import {readFileSync,statSync} from 'node:fs';
const app=readFileSync('public/tataku/app.js','utf8');
const paths=[...app.matchAll(/['"](\/v\/[^'" ]+\.mp3)['"]/g)].map(m=>'public'+m[1]);
for(const path of paths){try{if(statSync(path).size<1000)throw Error('empty');}catch{throw Error(`Required audio missing: ${path}. Restore the audio before deploying.`);}}
console.log(`Audio assets verified: ${paths.length}`);

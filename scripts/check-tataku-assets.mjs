import {readFileSync,statSync} from 'node:fs';
const app=readFileSync('public/tataku/app.js','utf8');
const paths=[...app.matchAll(/['"](\/v\/[^'" ]+\.mp3)['"]/g)].map(m=>'public'+m[1]);
paths.push('public/notitle/song.m4a','public/louder/song.m4a','public/notitle/live.js','public/louder/live.js','public/uchira/uchira.m4a','public/uchira/highway.mp4','public/uchira/highway-portrait.mp4','public/uchira/uchira-mv.mp4','public/mogura/mogura.mp4','public/louder/louder.mp4','public/louder/poster.jpg','public/notitle/parts/000.bin','public/notitle/parts/008.bin','public/notitle/poster.jpg');
for(const path of paths){try{if(statSync(path).size<1000)throw Error('empty');}catch{throw Error(`Required audio missing: ${path}. Restore the audio before deploying.`);}}
console.log(`Audio assets verified: ${paths.length}`);

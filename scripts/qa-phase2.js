// TIB Academy Phase 2: static regression checks (no network or narration API calls).
// Run: node scripts/build-static.js && node scripts/qa-phase2.js
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'public');
const errors=[],warnings=[];
const check=(condition,message)=>{if(!condition)errors.push(message)};
const targeted=[1,4,7,13,14,16,17,19,37,42,44];
for(let n=1;n<=46;n++){
 const id=String(n).padStart(2,'0');
 const file=path.join(out,'lab'+id+'-interactive.html');
 check(fs.existsSync(file),'Missing interactive lab '+id);
 if(!fs.existsSync(file))continue;
 const html=fs.readFileSync(file,'utf8');
 check(html.includes('localStorage'),'Lab '+id+': local notes persistence marker missing');
 check(/quiz/i.test(html),'Lab '+id+': assessment marker missing');
 check(/download/i.test(html),'Lab '+id+': export/download marker missing');
 if(targeted.includes(n))check(html.includes('TIB PHASE 2 ADDITIVE ENHANCEMENT'),'Lab '+id+': Phase 2 exercise missing');
 if(n<=2){check(html.includes('tib-phase2-tts-fallback'),'Lab '+id+': browser narration fallback missing');check(!html.includes("$('audio').src='/lab0"+n+"-section-'"),'Lab '+id+': broken MP3 reference remains');}
}
for(let n=3;n<=46;n++){
 const id=String(n).padStart(2,'0');
 for(let k=1;k<=5;k++){
  const file='lab'+id+'-section-'+k+'.mp3';
  check(fs.existsSync(path.join(out,'audio',file)),'Missing /audio/'+file);
  check(fs.existsSync(path.join(out,file)),'Missing root audio alias '+file);
 }
}
check(fs.existsSync(path.join(out,'index.html')),'Missing index.html');
console.log(JSON.stringify({phase:'2',labs:46,targetedEnhancements:targeted.length,expectedRecordedAssets:220,errors,warnings},null,2));
if(errors.length)process.exitCode=1;

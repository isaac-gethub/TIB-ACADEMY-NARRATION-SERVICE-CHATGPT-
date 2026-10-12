/* TIB Google Cloud Neural2 narration pilot.
   Run locally or in an authorized CI job, NOT as part of every Vercel deployment.
   Requires GOOGLE_TTS_API_KEY with Cloud Text-to-Speech API enabled.
   Usage: node scripts/google-neural2-pilot.js [lab number, default 3]
*/
const fs=require('fs'),path=require('path');
const lab=Number(process.argv[2]||3);
if(!Number.isInteger(lab)||lab<3||lab>46)throw Error('Choose a lab number from 3 to 46');
const apiKey=process.env.GOOGLE_TTS_API_KEY;
if(!apiKey)throw Error('GOOGLE_TTS_API_KEY is required. Do not put the key in GitHub or browser code.');
const id=String(lab).padStart(2,'0');
const source=fs.readFileSync(path.join(__dirname,'..','lab'+id+'.html'),'utf8');
const decode=s=>s.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').trim();
const sections=[...source.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/gi)].map((m,i)=>{
 const h=m[1].match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i),p=m[1].match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
 if(!h||!p)throw Error('Missing heading or script for section '+(i+1));
 return {title:decode(h[1]),text:decode(p[1]),file:'lab'+id+'-section-'+(i+1)+'-google-neural2.mp3'};
});
if(sections.length!==5)throw Error('Expected five sections; found '+sections.length);
async function main(){
 const output=path.join(__dirname,'..','google-narration-pilot');fs.mkdirSync(output,{recursive:true});
 console.log('Pilot: Lab '+lab+', '+sections.reduce((n,s)=>n+s.text.length,0)+' characters, voice '+(process.env.GOOGLE_TTS_VOICE||'en-US-Neural2-D'));
 for(let i=0;i<sections.length;i++){
  const s=sections[i],dest=path.join(output,s.file);
  if(fs.existsSync(dest)&&fs.statSync(dest).size>1000){console.log('Reusing '+s.file);continue}
  const r=await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key='+encodeURIComponent(apiKey),{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({input:{text:s.text},voice:{languageCode:'en-US',name:process.env.GOOGLE_TTS_VOICE||'en-US-Neural2-D'},audioConfig:{audioEncoding:'MP3',speakingRate:0.94}})});
  if(!r.ok)throw Error('Google Cloud TTS section '+(i+1)+' HTTP '+r.status+': '+(await r.text()).slice(0,500));
  const data=await r.json(),audio=Buffer.from(data.audioContent||'','base64');
  if(audio.length<1000)throw Error('Empty audio for section '+(i+1));
  fs.writeFileSync(dest,audio);console.log('Saved '+s.file+' ('+audio.length+' bytes)');
 }
 fs.writeFileSync(path.join(output,'lab'+id+'-manifest.json'),JSON.stringify({provider:'Google Cloud Text-to-Speech',voice:process.env.GOOGLE_TTS_VOICE||'en-US-Neural2-D',sections},null,2));
 console.log('Pilot ready. Review the MP3s before switching course playback.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});

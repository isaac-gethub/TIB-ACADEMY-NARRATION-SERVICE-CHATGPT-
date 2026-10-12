const fs=require('fs');
const voice=process.env.ELEVENLABS_VOICE_ID||'JBFqnCBsd6RMkjVDRZzb';
const key=process.env.ELEVENLABS_API_KEY;
const base=process.env.NARRATION_CACHE_URL||'https://tibacademynarrationservice.vercel.app';
const decode=s=>s.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').trim();
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function audio(text,file){
  try{const cached=await fetch(base+'/'+file,{signal:AbortSignal.timeout(12000)});if(cached.ok&&String(cached.headers.get('content-type')).includes('audio')){const b=Buffer.from(await cached.arrayBuffer());if(b.length>1000)return b}}catch{}
  for(let attempt=0;attempt<4;attempt++){
    const r=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+voice+'?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json','Accept':'audio/mpeg'},body:JSON.stringify({text,model_id:'eleven_multilingual_v2'}),signal:AbortSignal.timeout(120000)});
    if(r.ok){const b=Buffer.from(await r.arrayBuffer());if(b.length<1000)throw Error('Empty MP3 '+file);return b}
    const err=(await r.text()).slice(0,300);
    if(![429,500,502,503,504].includes(r.status)||attempt===3)throw Error(file+' ElevenLabs HTTP '+r.status+': '+err);
    await delay(2000*Math.pow(2,attempt));
  }
}
async function main(){
  if(!key)throw Error('ELEVENLABS_API_KEY missing: cannot produce prerecorded narration');
  const jobs=[];
  for(let n=3;n<=46;n++){
    const id=String(n).padStart(2,'0'),source=fs.readFileSync('lab'+id+'.html','utf8');
    const sections=[...source.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/gi)].map((m,i)=>{
      const h=m[1].match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
      const p=m[1].match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
      if(!h||!p)throw Error('Missing heading or script in lab '+n+' section '+(i+1));
      return {title:decode(h[1]),text:decode(p[1]),file:'lab'+id+'-section-'+(i+1)+'.mp3'};
    });
    if(sections.length!==5)throw Error('Expected five narration sections in Lab '+n+', got '+sections.length);
    jobs.push({id,n,sections});
  }
  const tasks=jobs.flatMap(j=>j.sections.map(s=>({j,s})));
  let cursor=0;
  async function worker(){while(cursor<tasks.length){const {j,s}=tasks[cursor++];const b=await audio(s.text,s.file);fs.writeFileSync('public/'+s.file,b);console.log('ElevenLabs MP3 ready: '+s.file+' ('+b.length+' bytes)')}}
  await Promise.all(Array.from({length:5},worker));
  for(const j of jobs){
    const items=j.sections.map(s=>'<section><h2>'+escape(s.title)+'</h2><audio controls preload="none" src="/'+s.file+'"></audio><p><a download href="/'+s.file+'">Download MP3</a></p><details><summary>Read narration script</summary><p>'+escape(s.text)+'</p></details></section>').join('');
    const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lab '+j.n+' Recorded Narration</title><style>body{font:17px/1.6 system-ui;background:#edf2f8;color:#173257;margin:0}main{max-width:900px;margin:35px auto;background:white;padding:30px;border-radius:14px}section{padding:20px 0;border-top:1px solid #d5dfeb}audio{width:100%}</style><main><h1>Lab '+j.n+' — ElevenLabs Recorded Lesson</h1><p>Five prerecorded sections. <a href="/lab'+j.id+'-interactive.html">Open interactive lab</a> · <a href="/">Course home</a></p>'+items+'</main></html>';
    fs.writeFileSync('public/lab'+j.id+'.html',html);
    fs.writeFileSync('public/lab'+j.id+'-manifest.json',JSON.stringify(j.sections,null,2));
  }
  console.log('All 220 ElevenLabs MP3s and 44 recorded lesson pages ready');
}
module.exports=main;

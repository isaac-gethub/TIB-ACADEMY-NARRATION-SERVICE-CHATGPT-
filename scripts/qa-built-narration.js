// Verify ACTUAL private build output and its server handler, with fixture Supabase responses.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http'),crypto=require('node:crypto');
const dir=path.resolve('.vercel/output/functions/course.func'),assets=path.join(dir,'assets'),config=require(path.join(dir,'course-config.json')),native=global.fetch;
global.fetch=async(url,opt)=>{if(!String(url).startsWith('https://blfgwysgekfqhcafofhe.supabase.co'))return native(url,opt);assert.equal(opt.headers.Authorization,'Bearer fixture');return Response.json(String(url).includes('/auth/v1/user')?{id:'fixture-user'}:[{course:config.course,is_active:true,start_date:null,expiry_date:null}])};
const handler=require(path.join(dir,'index.js')),server=http.createServer(handler);
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
try{
 if(config.course==='TIB-FULL-SWEEP'){
  for(const p of ['lab01.html','lab02.html','lab03.html','lab1','lab2','lab3','lab01-interactive.html','lab02-interactive.html','lab03-interactive.html']){
   const response=await native(base+'/?resource='+encodeURIComponent(p),{headers:{Cookie:'__Host-tib_course=fixture'}});assert.equal(response.status,200,p);assert.match(response.headers.get('content-type'),/text\/html/);assert.ok((await response.text()).includes('Lab '));console.log('PASS built lesson route: '+p)
  }
  for(const lab of [1,2]){const html=fs.readFileSync(path.join(assets,'lab0'+lab+'.html'),'utf8');assert.ok(html.includes('speechSynthesis'),'Browser narration missing')}
  const audio=fs.readdirSync('audio').filter(n=>n.endsWith('.mp3'));assert.equal(audio.length,220);
  const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  for(const file of audio){assert.equal(hash(path.join('audio',file)),hash(path.join(assets,'audio',file)),file);assert.equal(hash(path.join('audio',file)),hash(path.join(assets,file)),file+' root copy')}
  for(const p of ['audio/lab03-section-1.mp3','lab03-section-1.mp3','audio/lab3-section-1.mp3']){
   const response=await native(base+'/?resource='+encodeURIComponent(p),{headers:{Cookie:'__Host-tib_course=fixture',Range:'bytes=0-31'}});assert.equal(response.status,206,p);assert.match(response.headers.get('content-type'),/audio\/mpeg/);assert.equal((await response.arrayBuffer()).byteLength,32);console.log('PASS built recorded-audio route: '+p)
  }
  for(const p of ['lab1','lab2','lab3']){const response=await native(base+'/?resource='+p,{redirect:'manual'});assert.equal(response.status,303,'Anonymous alias must require login')}
  console.log('PASS: built Labs 1–3 narration pages/routes and all 220 MP3 hashes preserved');
 }else{
  const html=fs.readFileSync(path.join(assets,'index.html'),'utf8');assert.ok(!html.includes('https://tibacademynarrationservice.vercel.app/lab01.html'),'GRC companion points to missing production Lab 1');console.log('PASS: GRC companion narration link avoids missing production page');
 }
}finally{server.close();global.fetch=native}})().catch(e=>{console.error(e);process.exitCode=1});

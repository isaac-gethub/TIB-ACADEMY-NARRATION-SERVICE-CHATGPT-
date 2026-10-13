const fs=require('node:fs'),path=require('node:path'),{pipeline}=require('node:stream/promises');
const config=require('./course-config.json'),base=path.join(__dirname,'assets');
const sb='https://blfgwysgekfqhcafofhe.supabase.co',key='sb_publishable_ThLetpd4hj49fjce-kXoFA_v4ghwIqV';
const types={'.html':'text/html; charset=utf-8','.pdf':'application/pdf','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg'};
const cookie='__Host-tib_course';
const assessment=config.assessmentEnabled?require('./assessment'):null;
function send(res,status,text){res.statusCode=status;res.setHeader('Content-Type','text/plain; charset=utf-8');res.end(text)}
function getToken(req){const part=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookie+'='));return part?part.slice(cookie.length+1):''}
function trustedOrigin(req){
 const origins=new Set([...(config.origins||[]),process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL,process.env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean).map(host=>host.startsWith('https://')?host:'https://'+host));
 if(!process.env.VERCEL&&!origins.size)origins.add('https://'+req.headers.host);
 return typeof req.headers.origin==='string'&&req.headers.origin!=='null'&&origins.has(req.headers.origin);
}
async function authorize(token){
 if(!token||token.length>8192||!/^[A-Za-z0-9._-]+$/.test(token))return 401;
 const headers={apikey:key,Authorization:'Bearer '+token};
 const userResponse=await fetch(sb+'/auth/v1/user',{headers,signal:AbortSignal.timeout(10000)});
 if(userResponse.status===401||userResponse.status===403)return 401;if(!userResponse.ok)return 503;
 const user=await userResponse.json();if(typeof user.id!=='string')return 401;
 const q=new URLSearchParams({select:'course,is_active,start_date,expiry_date',user_id:'eq.'+user.id,course:'eq.'+config.course});
 const enrollmentResponse=await fetch(sb+'/rest/v1/enrollments?'+q,{headers,signal:AbortSignal.timeout(10000)});
 if(!enrollmentResponse.ok)return 503;
 const rows=await enrollmentResponse.json(),today=new Date().toISOString().slice(0,10);
 return Array.isArray(rows)&&rows.some(r=>r.course===config.course&&r.is_active===true&&(!r.start_date||r.start_date<=today)&&(!r.expiry_date||r.expiry_date>=today))?200:403;
}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Vercel-CDN-Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 try{
  const u=new URL(req.url,'https://'+req.headers.host);let resource=u.searchParams.get('resource');
  if(resource===null)resource=u.pathname.replace(/^\//,'');
  if(resource==='api/session'){
   if(req.method==='GET'||req.method==='HEAD'){res.statusCode=303;res.setHeader('Location','/login.html');return res.end()}if(req.method!=='POST')return send(res,405,'POST required');if(!trustedOrigin(req))return send(res,403,'Untrusted sign-in origin');
   let body=req.body;if(typeof body==='string')body=String(req.headers['content-type']||'').includes('application/json')?JSON.parse(body):Object.fromEntries(new URLSearchParams(body));
   if(!body){let s='';for await(const chunk of req){s+=chunk;if(s.length>10000)return send(res,413,'Request too large')}body=String(req.headers['content-type']||'').includes('application/json')?JSON.parse(s):Object.fromEntries(new URLSearchParams(s))}
   const token=typeof body.access_token==='string'?body.access_token:'';const status=await authorize(token);if(status!==200)return send(res,status,status===403?'No active enrollment for this course.':'Could not verify course access.');
   res.setHeader('Set-Cookie',cookie+'='+token+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600');res.statusCode=303;res.setHeader('Location','/index.html');return res.end();
  }
  if(resource==='api/signout'){
   if(req.method!=='POST')return send(res,405,'POST required');if(!trustedOrigin(req))return send(res,403,'Untrusted sign-out origin');
   res.setHeader('Set-Cookie',cookie+'=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0');res.statusCode=303;res.setHeader('Location','/login.html');return res.end();
  }
  if(resource==='api/assessment'){
   if(!config.assessmentEnabled)return send(res,503,'Assessment persistence is not enabled for this deployment.');
   if(!['GET','POST'].includes(req.method))return send(res,405,'Method not allowed');
   if(req.method==='POST'&&!trustedOrigin(req))return send(res,403,'Untrusted assessment origin');
   const status=await authorize(getToken(req));if(status!==200)return send(res,status,'Active course sign-in required.');
   let body;if(req.method==='POST'){let s='';for await(const chunk of req){s+=chunk;if(s.length>40000)return send(res,413,'Request too large')}try{body=req.body||JSON.parse(s);if(typeof body==='string')body=JSON.parse(body)}catch{return send(res,400,'Invalid JSON')}}
   return await assessment.handle(req,res,getToken(req),body);
  }
  if(!['GET','HEAD'].includes(req.method))return send(res,405,'Method not allowed');
  if(resource==='interactive-lab1')resource='lab01-interactive.html';if(!resource)resource='index.html';
  const labRoute=/^lab(\d{1,2})(-interactive)?(?:\.html)?\/?$/.exec(resource);
  if(labRoute)resource='lab'+labRoute[1].padStart(2,'0')+(labRoute[2]||'')+'.html';
  const audioRoute=/^(audio\/)?lab(\d{1,2})-section-([1-5])\.mp3$/.exec(resource);
  if(audioRoute)resource=(audioRoute[1]||'')+'lab'+audioRoute[2].padStart(2,'0')+'-section-'+audioRoute[3]+'.mp3';
  if(resource.includes('..')||resource.includes('\\')||resource.includes('\0')||resource.startsWith('/')||!types[path.extname(resource).toLowerCase()])return send(res,404,'Not found');
  const file=path.resolve(base,resource);if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,404,'Not found');
  if(!['login.html','trainee-skills-career-report.html'].includes(resource)){
   const status=await authorize(getToken(req));
   if(status!==200){if(status===401&&path.extname(resource)==='.html'){res.statusCode=303;res.setHeader('Location','/login.html');return res.end()}return send(res,status,status===403?'No active enrollment for this course.':status===503?'Course verification temporarily unavailable.':'Sign in required.')}
  }
  const chapter=assessment?assessment.chapterOf(resource):0;
  if(config.assessmentEnabled&&chapter){const state=await assessment.rpc(getToken(req),'state');if(!assessment.unlocked(state,chapter)){res.statusCode=303;res.setHeader('Location','/assessment.html?chapter='+chapter);return res.end()}}
  const stat=fs.statSync(file);res.setHeader('Content-Type',types[path.extname(file).toLowerCase()]);res.setHeader('Accept-Ranges','bytes');
  if(file.endsWith('.html')){
   let html=fs.readFileSync(file,'utf8');if(!['login.html','trainee-skills-career-report.html'].includes(resource)){const signout='<form action="/api/signout" method="post" style="margin:20px"><button type="submit">Sign out of this course</button></form>';html=/<\/body>/i.test(html)?html.replace(/<\/body>/i,(chapter?'<p style="margin:20px"><a href="/assessment.html?chapter='+chapter+'">Lab interview practice and knowledge check</a></p>':'')+signout+'</body>'):html+signout;}
   res.setHeader('Content-Length',Buffer.byteLength(html));res.statusCode=200;return res.end(req.method==='HEAD'?undefined:html);
  }
  let start=0,end=stat.size-1;
  if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m||(!m[1]&&!m[2])){res.setHeader('Content-Range','bytes */'+stat.size);return send(res,416,'Invalid range')}if(!m[1])start=Math.max(0,stat.size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]))}if(start>end||start>=stat.size){res.setHeader('Content-Range','bytes */'+stat.size);return send(res,416,'Invalid range')}res.statusCode=206;res.setHeader('Content-Range','bytes '+start+'-'+end+'/'+stat.size)}else res.statusCode=200;
  res.setHeader('Content-Length',end-start+1);if(req.method==='HEAD')return res.end();await pipeline(fs.createReadStream(file,{start,end}),res);
 }catch(e){console.error('Course authorization/serving failed:',e.name);if(!res.headersSent)send(res,503,'Course verification temporarily unavailable.');else res.end()}
};


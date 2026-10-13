const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'tib-course-auth-'));fs.mkdirSync(path.join(tmp,'assets'));
fs.copyFileSync(path.join(__dirname,'../server/course-handler.js'),path.join(tmp,'index.js'));
fs.writeFileSync(path.join(tmp,'course-config.json'),JSON.stringify({course:'TIB-SECURITY',origins:['course-preview.vercel.app']}));
for(const [name,content] of Object.entries({'index.html':'<body>PRIVATE LESSON</body>','login.html':'LOGIN','guide.pdf':'PRIVATE PDF','clip.mp3':'0123456789','trainee-skills-career-report.html':'PUBLIC REPORT'}))fs.writeFileSync(path.join(tmp,'assets',name),content);
const native=global.fetch;
global.fetch=async(url,options)=>{
 if(!String(url).startsWith('https://blfgwysgekfqhcafofhe.supabase.co'))return native(url,options);
 const token=options.headers.Authorization.slice(7);if(token==='outage')throw Error('Fixture outage');
 if(String(url).includes('/auth/v1/user'))return Response.json(token==='invalid'?{}:{id:'fixture-user'},{status:token==='invalid'?401:200});
 const q=new URL(url).searchParams;assert.equal(q.get('user_id'),'eq.fixture-user');assert.equal(q.get('course'),'eq.TIB-SECURITY');
 const row={course:'TIB-SECURITY',is_active:true,start_date:null,expiry_date:null};
 if(token==='none')return Response.json([]);if(token==='wrong')row.course='TIB-FULL-SWEEP';if(token==='inactive')row.is_active=false;if(token==='expired')row.expiry_date='2000-01-01';if(token==='future')row.start_date='2999-01-01';
 return Response.json([row]);
};
const handler=require(path.join(tmp,'index.js')),server=http.createServer(handler);
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const req=(resource,options={})=>native(base+'/?resource='+encodeURIComponent(resource),{redirect:'manual',...options});
try{
 for(const file of ['index.html','guide.pdf','clip.mp3']){const r=await req(file);assert.equal(r.status,file.endsWith('.html')?303:401);assert.ok(!(await r.text()).includes('PRIVATE'))}
 for(const token of ['none','wrong','inactive','expired','future']){const r=await req('guide.pdf',{headers:{cookie:'__Host-tib_course='+token}});assert.equal(r.status,403,token)}
 assert.equal((await req('guide.pdf',{headers:{cookie:'__Host-tib_course=invalid'}})).status,401);
 assert.equal((await req('guide.pdf',{headers:{cookie:'__Host-tib_course=outage'}})).status,503);
 const allowed=await req('guide.pdf',{headers:{cookie:'__Host-tib_course=active'}});assert.equal(allowed.status,200);assert.equal(await allowed.text(),'PRIVATE PDF');assert.match(allowed.headers.get('cache-control'),/no-store/);
 const audio=await req('clip.mp3',{headers:{cookie:'__Host-tib_course=active',range:'bytes=2-5'}});assert.equal(audio.status,206);assert.equal(await audio.text(),'2345');
 assert.equal((await req('../index.js',{headers:{cookie:'__Host-tib_course=active'}})).status,404);
 assert.equal((await req('trainee-skills-career-report.html')).status,200);
 const recovery=await req('api/session');assert.equal(recovery.status,303);assert.equal(recovery.headers.get('location'),'/login.html');
 const badOrigin=await req('api/session',{method:'POST',headers:{origin:'https://attacker.example','content-type':'application/x-www-form-urlencoded'},body:'access_token=active'});assert.equal(badOrigin.status,403);
 const session=await req('api/session',{method:'POST',headers:{origin:'https://course-preview.vercel.app','content-type':'application/x-www-form-urlencoded'},body:'access_token=active'});assert.equal(session.status,303);const cookie=session.headers.get('set-cookie');for(const attr of ['Secure','HttpOnly','SameSite=Lax','Path=/'])assert.ok(cookie.includes(attr));
 const nullOrigin=await req('api/session',{method:'POST',headers:{origin:'null','content-type':'application/json'},body:JSON.stringify({access_token:'active'})});assert.equal(nullOrigin.status,403);
 const jsonSession=await req('api/session',{method:'POST',headers:{origin:'https://course-preview.vercel.app','content-type':'application/json'},body:JSON.stringify({access_token:'active'})});assert.equal(jsonSession.status,303);
 const logout=await req('api/signout',{method:'POST',headers:{origin:'https://course-preview.vercel.app'}});assert.equal(logout.status,303);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
 console.log('PASS: server handler denies anonymous/invalid/wrong-course/inactive/expired/future access, fails closed on outage, protects downloads/audio, supports ranges and secure session/sign-out. Fixture auth only.');
}finally{server.close();global.fetch=native;fs.rmSync(tmp,{recursive:true,force:true})}})().catch(e=>{console.error(e);process.exitCode=1});

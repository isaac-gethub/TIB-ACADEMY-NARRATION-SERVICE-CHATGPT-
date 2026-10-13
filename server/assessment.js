const bank=require('./assessment-bank.json');
function chapterOf(resource){const m=/^(?:audio\/)?lab(\d{2})(?:-interactive\.html|\.html|-section-[1-5]\.mp3)$/.exec(resource);return m&&Number(m[1])>=1&&Number(m[1])<=47?Number(m[1]):0}
function unlocked(state,chapter){return state.mode==='self-study'||Array.from({length:Math.max(0,chapter-1)},(_,i)=>i+1).every(c=>state.passed.includes(c))}
async function rpc(token,action,chapter=0,payload={}){
 const r=await fetch('https://blfgwysgekfqhcafofhe.supabase.co/rest/v1/rpc/tib_sweep_assessment',{method:'POST',headers:{apikey:'sb_publishable_ThLetpd4hj49fjce-kXoFA_v4ghwIqV',Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action,chapter,payload}),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new Error('Assessment persistence unavailable');return r.json();
}
function publicChapter(chapter){const item=bank[chapter-1];return {chapter,title:item.title,questions:item.questions.map(({id,prompt,options})=>({id,prompt,options:options.map((label,index)=>({value:index,label})).sort(()=>0.5-Math.random())}))}}
async function handle(req,res,token,body){
 const u=new URL(req.url,'https://'+req.headers.host),chapter=Number(u.searchParams.get('chapter')||body?.chapter||0);
 if(chapter&&!Number.isInteger(chapter)||chapter<0||chapter>47){res.statusCode=400;return res.end('Invalid chapter')}
 let state=await rpc(token,'state');
 if(req.method==='GET'){const data=chapter?{state,assessment:publicChapter(chapter),locked:!unlocked(state,chapter)}:{state};res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(data))}
 if(!body||!['mode','submit','practice'].includes(body.action)){res.statusCode=400;return res.end('Invalid assessment action')}
 if(body.action!=='mode'&&(!chapter||!unlocked(state,chapter))){res.statusCode=403;return res.end('Pass earlier labs or choose Self-Study mode.')}
 const data=await rpc(token,body.action,chapter,body.action==='mode'?{mode:body.mode}:body.action==='practice'?{responses:body.responses}:{answers:body.answers});
 res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(data));
}
module.exports={chapterOf,unlocked,publicChapter,handle,rpc};

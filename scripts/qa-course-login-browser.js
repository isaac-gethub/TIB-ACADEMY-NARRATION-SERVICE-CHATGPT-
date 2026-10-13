// Actual course login page, fixture auth and HTTPS browser-origin transport. No live credentials.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const origin='https://course-preview.vercel.app',login=fs.readFileSync('server/course-login.html','utf8');
(async()=>{const browser=await chromium.launch();try{
 for(const status of [303,403]){
  const ctx=await browser.newContext(),page=await ctx.newPage();let submitted=null;
  await page.route(origin+'/login.html',r=>r.fulfill({status:200,headers:{'content-type':'text/html','referrer-policy':'strict-origin-when-cross-origin'},body:login}));
  await page.route('https://esm.sh/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:"export function createClient(){return {auth:{signInWithPassword:async()=>({data:{session:{access_token:'fixture-token'}},error:null})}}}"}));
  await page.route(origin+'/api/session',r=>{const q=r.request();submitted={method:q.method(),headers:q.headers(),body:JSON.parse(q.postData())};return r.fulfill({status,headers:status===303?{location:'/index.html','set-cookie':'__Host-tib_course=fixture-token; Path=/; Secure; HttpOnly; SameSite=Lax'}:{'content-type':'text/plain'},body:status===303?'':'Untrusted sign-in origin'})});
  await page.route(origin+'/index.html',r=>r.fulfill({status:200,contentType:'text/html',body:'<h1>Protected course fixture</h1>'}));
  await page.goto(origin+'/login.html');await page.locator('#email').fill('fixture@example.test');await page.locator('#pw').fill('fixture-only');await page.locator('#signin').click();
  if(status===303){await page.getByRole('heading',{name:'Protected course fixture'}).waitFor();const cookie=(await ctx.cookies()).find(c=>c.name==='__Host-tib_course');assert.ok(cookie&&cookie.secure&&cookie.httpOnly);console.log('PASS: actual login sends same-origin JSON POST and receives secure HttpOnly cookie');}
  else{await page.getByText('Course sign-in could not be completed. Please reload this page and try again.').waitFor();assert.equal(page.url(),origin+'/login.html');assert.ok(await page.locator('#signin').isEnabled());console.log('PASS: rejected session stays on usable login page instead of raw error endpoint');}
  assert.equal(submitted.method,'POST');assert.equal(submitted.headers.origin,origin);assert.equal(submitted.body.access_token,'fixture-token');assert.equal(submitted.headers['content-type'],'application/json');await ctx.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

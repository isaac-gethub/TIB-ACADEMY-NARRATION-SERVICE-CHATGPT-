const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
const sweep=fs.existsSync('lab47-interactive.html'),root=sweep?'public':'.',port=sweep?8781:8780,base='http://127.0.0.1:'+port;
const route=sweep?'lab47-interactive.html':'Chapter_8/TIB_Chapter8_Advanced_Practical_Interactive.html';
(async()=>{const server=spawn('python3',['-m','http.server',String(port),'--directory',root],{stdio:'ignore'});let browser;
try{
 for(let t=0;t<30;t++){try{if((await fetch(base+'/index.html')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch();const ctx=await browser.newContext({acceptDownloads:true}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(const home of sweep?['index.html']:['index.html','START_HERE.html']){
  await page.goto(base+'/'+home);const link=page.locator('main #advanced-practical a');
  assert.equal(await link.count(),1);await link.click();assert.equal(new URL(page.url()).pathname,'/'+route);
  await page.getByRole('link',{name:'Course home',exact:true}).click();assert.equal(new URL(page.url()).pathname,'/index.html');
 }
 await page.goto(base+'/'+route);const stages=sweep?7:6;
 for(let n=0;n<stages;n++){
  await page.locator('#notes').fill('Phase 4 evidence note '+n);
  await page.locator('input[type=radio]').last().check();assert.match(await page.locator('#feedback').innerText(),/review|reconsider/i);
  await page.locator('input[type=radio]').first().check();assert.match(await page.locator('#feedback').innerText(),/correct/i);
  if(n<stages-1)await page.locator('#next').click();
 }
 await page.reload();
 for(let n=0;n<stages;n++){
  assert.equal(await page.locator('#notes').inputValue(),'Phase 4 evidence note '+n);
  assert.equal(await page.locator('input[type=radio]').first().isChecked(),true);
  if(n<stages-1)await page.locator('#next').click();
 }
 const pending=page.waitForEvent('download');await page.locator('#export').click();const dl=await pending;
 assert.equal(dl.suggestedFilename(),sweep?'TIB_Lab47_Workpaper.txt':'TIB_GRC_Chapter08_Workpaper.txt');
 const text=fs.readFileSync(await dl.path(),'utf8');
 for(let n=0;n<stages;n++)assert.ok(text.includes('Phase 4 evidence note '+n));
 assert.equal((text.match(/Knowledge check: Correct/g)||[]).length,stages);
 if(sweep){
  await page.addInitScript(()=>{window.__tts=[];Object.defineProperty(window,'speechSynthesis',{value:{cancel(){window.__tts.push('cancel')},speak(u){window.__tts.push(u.text)}}})});
  await page.reload();await page.locator('#listen').click();await page.locator('#stop').click();
  assert.match((await page.evaluate(()=>window.__tts)).join(' '),/Engagement scoping/);
  const silent=await browser.newContext();await silent.addInitScript(()=>{delete window.speechSynthesis});
  const p=await silent.newPage();await p.goto(base+'/'+route);await p.locator('#next').click();assert.match(await p.locator('#progress').innerText(),/2/);await silent.close();
 }
 assert.deepEqual(errors,[]);await ctx.close();
 console.log('PASS: '+(sweep?'Full Sweep':'GRC')+' Phase 4 directory navigation, all stages, persisted answers/notes, export content'+(sweep?', TTS commands and navigation without speech synthesis':''));
}catch(e){console.error(e);process.exitCode=1}finally{if(browser)await browser.close();server.kill()}})();

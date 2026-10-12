// Browser regression: interactive lab navigation, workpapers, quizzes, downloads and audio URLs.
const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const server=spawn('python3',['-m','http.server','8765','--directory','public'],{stdio:'ignore'});let browser;const results=[];try{
 await new Promise(r=>setTimeout(r,1500));browser=await chromium.launch({headless:true});
 for(const n of [1,2,13,14,16,17,19,37,42,44]){
  const id=String(n).padStart(2,'0'),context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/lab'+id+'-interactive.html');
  if(response.status()!==200)throw Error('Lab '+id+' returned '+response.status());
  await page.locator('#notes').fill('TIB phase 2 browser regression '+id);
  await page.locator('#done').check();
  await page.locator('#next').click();
  await page.reload();
  await page.locator('[data-step="0"]').click();
  const note=await page.locator('#notes').inputValue();if(!note.includes('browser regression'))throw Error('Lab '+id+' notes did not persist');
  const download=page.waitForEvent('download');await page.locator('#export').click();const file=await download;const suggested=file.suggestedFilename();if(!suggested.includes('Lab'+id))throw Error('Lab '+id+' export mislabeled: '+suggested);
  await page.locator('[name=answer]').first().check();if(!(await page.locator('#feedback').innerText()))throw Error('Lab '+id+' quiz did not respond');
  if(n>=3){const src=await page.locator('#audio').getAttribute('src');const audio=await page.request.get('http://127.0.0.1:8765'+src);if(audio.status()!==200)throw Error('Lab '+id+' audio returned '+audio.status());}
  else if(!(await page.getByText('Listen to current step').count()))throw Error('Lab '+id+' TTS fallback missing');
  if(errors.length)throw Error('Lab '+id+' JS errors: '+errors.join('; '));
  results.push({lab:n,status:'pass',export:suggested});await context.close();
 }
 console.log(JSON.stringify({result:'PASS',browserTests:results},null,2));
 }catch(e){console.error(JSON.stringify({result:'FAIL',completed:results,error:String(e)},null,2));process.exitCode=1}finally{if(browser)await browser.close();server.kill();}})();

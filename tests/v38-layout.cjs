const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const route=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 const file=path.resolve(root,'.'+(route==='/'?'/index.html':route));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)});
});
(async()=>{
 const executable=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(executable,'Chrome/Chromium needed');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/?intro=0';
 const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['narrow',320,720]]){
  console.log('START '+name);
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
  const page=await context.newPage();page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('#overview.active .v38-workspace').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.MediaDashboardV38?.version),'3.8.0');
  assert.equal(await page.locator('#overview .v38-tasks-panel').count(),1,'one task panel');
  assert.equal(await page.locator('#overview .v38-week-panel').count(),1,'one 7-day preview');
  assert.equal(await page.locator('#overview .v38-person').count()>0,true,'team preview');
  assert.equal(await page.locator('#overview .v38-account').count(),4,'three brands and all accounts');
  assert.equal(await page.locator('#overview .v38-date').count(),7,'one compact week');
  assert.equal(await page.locator('.v35-quickfind').count(),0,'no duplicate search');
  assert.equal(await page.locator('#search').count(),1,'single header search');
  const bg=await page.locator('.sidebar').evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.equal(bg,'rgb(255, 255, 255)','reference-style light sidebar');
  const colors=await page.evaluate(()=>{
    const s=getComputedStyle(document.documentElement);
    return ['--palette-yellow','--palette-orange','--palette-blue','--palette-navy','--palette-neutral'].map(k=>s.getPropertyValue(k).trim());
  });
  assert.deepEqual(colors,['#FFD23F','#FF8A2A','#1F6FEB','#0B1F3B','#F2F4F7'],'palette preserved');
  assert.equal(await page.locator('#overview .v38-summaryhead').count(),1,'one reporting overview heading');
  const expected=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot().tasks.length);
  assert.equal(Number((await page.locator('#overview .stats .stat strong').first().textContent()).trim()),expected,'existing filtered KPIs preserved');
  await page.screenshot({path:'test-results/v38-'+name+'-overview.png'});
  await page.locator('.v38-group-toggle').first().click();
  assert.equal(await page.locator('.v38-group-toggle').first().getAttribute('aria-expanded'),'false');
  assert(await page.locator('#v38-list-attention').evaluate(el=>el.hidden),'group collapsed');
  await page.locator('.v38-group-toggle').first().click();
  const task=page.locator('#overview .v38-task').first();
  await task.click();
  await page.locator('#overlay.open [role="dialog"]').waitFor();
  const modal=await page.locator('#overlay.open [role="dialog"]').boundingBox();
  assert(modal&&Math.abs(modal.x+modal.width/2-width/2)<5,name+' centered task preview');
  await page.locator('#closedrawer').click();
  await page.locator('#overview .v38-account[data-v38-account="MIH"]').click();
  await page.waitForFunction(()=>document.querySelector('#overview .v38-workspace')?.dataset.scope.startsWith('MIH|'));
  assert.equal(await page.locator('#account').inputValue(),'MIH','account shortcut uses existing account filter');
  const countMIH=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot().tasks.length);
  assert.equal(Number((await page.locator('#overview .stats .stat strong').first().textContent()).trim()),countMIH);
  await page.locator('#overview .v38-account[data-v38-account="All"]').click();
  await page.waitForFunction(()=>document.querySelector('#overview .v38-workspace')?.dataset.scope.startsWith('All|'));
  const person=page.locator('#overview .v38-person').first();
  await person.click();
  await page.locator('#overlay.open [role="dialog"]').waitFor();
  assert((await page.locator('#drawertitle').textContent()).trim().length>0,'team person popup');
  await page.locator('#closedrawer').click();
  const day=await page.locator('#overview .v38-date').nth(2).getAttribute('data-v38-date');
  await page.locator('#overview .v38-date').nth(2).click();
  await page.locator('#calendar.active .calendargrid .monthcard').first().waitFor();
  const selected=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot().calendar.selectedDay);
  assert.equal(selected,day,'selected weekly day linked to 3 month calendar');
  if(width<=1020)await page.locator('#menubtn').click();
  for(const route of ['overview','content','performance','ads','website','strategy','calendar']){
   await page.locator('#nav [data-open="'+route+'"]').click();
   await page.locator('#'+route+'.active').waitFor();
   const excess=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(excess<=3,name+' overflow on '+route+': '+excess);
   if(width<=1020&&route!=='calendar')await page.locator('#menubtn').click();
  }
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('.md-settings-entry').click();
  await page.locator('#settings.active').waitFor();
  assert.equal(await page.locator('.md-settings-dev-mark').count(),0,'credit remains text-only');
  assert(await page.locator('.md-settings-dev-text').textContent().then(x=>x.includes('NemDev')));
  assert.deepEqual(errors,[],name+' JS exceptions');
  await context.close();
  console.log('PASS '+name+' reference layout, palette, interactions, navigation, mobile');
 }
 const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await reduced.goto(base,{waitUntil:'domcontentloaded'});
 await reduced.locator('#overview .v38-workspace').waitFor();
 assert(await reduced.locator('html').evaluate(el=>el.classList.contains('motion-paused')));
 assert.equal(await reduced.locator('#overview').evaluate(el=>getComputedStyle(el).animationName),'none','reduced-motion must disable page reveal');
 await reduced.close();
 await browser.close();
 console.log('PASS V3.8 all viewport and accessibility tests');
})().catch(e=>{console.error(e);server.close();process.exit(1)}).finally(()=>server.close());
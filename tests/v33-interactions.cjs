const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve('.');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const requested=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!requested.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(requested,(err,b)=>{
  if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':types[path.extname(requested)]||'text/plain'});
  res.end(b);
 });
});
(async()=>{
 const exe=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(exe,'Chrome needed for testing');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/?intro=0';
 const browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox']});
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['smallmobile',320,720]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#overview .v38-panel-tasks').waitFor({state:'visible',timeout:6000});
  await page.locator('.v33-studio-pulse').waitFor({state:'attached',timeout:6000});
  assert.equal(await page.locator('.v33-studio-pulse').isVisible(),false,'obsolete animated stage strip is intentionally hidden');
  assert.equal(await page.locator('.v33-pulse-item').count(),4,name+' production stages');
  const deps=await page.evaluate(()=>window.MediaStudioInteractions);
  assert.equal(deps.version,'3.3.0');
  assert(deps.decorated>0,name+' lacked decorated elements');
  const metric=page.locator('#overview .stat').first();
  await metric.focus();
  assert.equal(await metric.getAttribute('role'),'button','KPI must remain keyboard-accessible');
  await metric.press('Enter');
  await page.locator('#overlay.open [role="dialog"]').waitFor({state:'visible'});
  await page.locator('#closedrawer').click();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=3,name+' overview overflow '+overflow);
  await page.screenshot({path:'test-results/v33-'+name+'-overview.png'});
  await page.locator('#overview .v38-panel-tasks [data-v38-route="content"]').click();
  assert(await page.locator('#content').evaluate(el=>el.classList.contains('active')),name+' flow link not routing to content');
  await page.locator('.ticket-thumb').first().waitFor({timeout:3000});
  const ticket=page.locator('.ticket[data-task]').first();
  if(await ticket.count()){
    await ticket.click();
    const modal=page.locator('#overlay.open [role="dialog"]');
    await modal.waitFor({state:'visible'});
    await modal.evaluate(el=>Promise.all(el.getAnimations({subtree:false}).map(a=>a.finished.catch(()=>{}))));
    const bounds=await modal.boundingBox();
    assert(bounds&&Math.abs(bounds.x+bounds.width/2-width/2)<4&&Math.abs(bounds.y+bounds.height/2-height/2)<4,name+' modal must remain centered');
    await page.locator('#closedrawer').click();
  }
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="calendar"]').click();
  await page.locator('[data-cal-tab="workload"]').click();
  assert(await page.locator('.personcard').count()>0,'team cards must exist');
  const lastOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(lastOverflow<=3,name+' workload horizontal overflow '+lastOverflow);
  assert.deepEqual(errors,[],name+' JS errors');
  await page.close();
  console.log('PASS '+name+' animation layer and dashboard interactions');
 }
 const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await reduced.goto(url,{waitUntil:'domcontentloaded'});
 await reduced.locator('.v33-studio-pulse').waitFor({state:'attached'});
 assert(await reduced.locator('html').evaluate(el=>el.classList.contains('motion-paused')));
 assert.equal(await reduced.locator('.v33-pulse-item').first().evaluate(el=>getComputedStyle(el).animationName),'none');
 await reduced.close();
 const manual=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 await manual.goto(url,{waitUntil:'domcontentloaded'});
 await manual.locator('#motionToggle').waitFor();
 await manual.locator('#motionToggle').click();
 assert(await manual.locator('html').evaluate(el=>el.classList.contains('motion-paused')),'pause button');
 await manual.close();
 await browser.close();
 console.log('PASS motion pause / system reduced-motion behavior');
})().catch(e=>{console.error(e);server.close();process.exit(1)}).finally(()=>server.close());
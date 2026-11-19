const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+(decodeURIComponent(url.pathname)==='/'?'/index.html':decodeURIComponent(url.pathname)));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,data)=>{
  if(err){res.writeHead(404);res.end('Missing');return}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
  res.end(data);
 });
});
(async()=>{
 const exe=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(exe,'Chrome or Chromium required');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/?intro=0';
 const browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox']});
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,w,h] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['narrow',320,720]]){
  console.log('START v35 '+name); const context=await browser.newContext({viewport:{width:w,height:h},reducedMotion:'no-preference'});
  const page=await context.newPage();page.setDefaultTimeout(9500);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('.v35-ribbon').waitFor({state:'visible'});
  assert.equal(await page.locator('.v35-ribbon').count(),1);
  assert.equal(await page.locator('#introSplash').isVisible(),false,'?intro=0 must bypass splash');
  assert.equal(await page.evaluate(()=>window.MediaDashboardV35?.version),'3.5.0');
  assert(await page.locator('#overview .v35-insight').count(),'overview decision summary');
  assert((await page.locator('#overview .v35-stat').count())>=3,'overview KPI drilldowns');
  await page.screenshot({path:'test-results/v35-'+name+'-overview.png'});
  await page.locator('#overview .v35-stat').first().click();
  assert(await page.locator('#overlay').evaluate(el=>el.classList.contains('open')),'KPI details modal opens');
  assert((await page.locator('#drawertitle').textContent()).length>1);
  assert(await page.locator('#drawerbody').textContent().then(x=>x.includes('source')));
  await page.locator('#closedrawer').click();
  console.log('KPI PASS '+name); await page.locator('.v35-quickfind').click();
  await page.locator('#v35Search').fill('Holiday video teaser');
  assert.equal(await page.locator('#v35SearchResults [data-v35-task]').count(),1,'quick-find work match');
  await page.locator('#v35SearchResults [data-v35-task]').first().click();
  assert(await page.locator('#overlay').evaluate(el=>el.classList.contains('open')),'work detail opens from quick find');
  assert(await page.locator('#drawertitle').textContent().then(x=>x.includes('Holiday video teaser')));
  await page.locator('#closedrawer').click();
  console.log('PASS '+name+' KPI and search drilldowns');
  // 7 operational sections, no access or data changes
  console.log('SEARCH PASS '+name); const sections=['content','performance','ads','website','strategy','calendar','overview'];
  for(const id of sections){
   if(w<=1020)await page.locator('#menubtn').click();
   await page.locator('#nav [data-open="'+id+'"]').click();
   await page.locator('#'+id+'.active .v35-insight').waitFor();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(overflow<=3,name+' horizontal overflow in '+id+': '+overflow);
  }
  if(w<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="content"]').click();
  console.log('NAV PASS '+name); await page.locator('[data-v35-gallery]').click();
  await page.locator('.v35-gallery-card').first().waitFor({state:'visible',timeout:7000});
  assert(await page.locator('.v35-gallery-card').count()>0,'gallery shows fictional work');
  await page.screenshot({path:'test-results/v35-'+name+'-gallery.png'});
  await page.locator('.v35-gallery-card').first().click();
  assert(await page.locator('#overlay').evaluate(el=>el.classList.contains('open')),'gallery card detail opens');
  await page.locator('#closedrawer').click();
  await page.locator('[data-content-view="table"]').click();
  assert.equal(await page.locator('.v35-gallery').count(),0,'table view removes gallery');
  if(w<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="ads"]').click();
  console.log('GALLERY PASS '+name); const bars=page.locator('#ads [data-v35-campaign]');
  assert(await bars.count()>0,'ads chart annotated');
  await bars.first().click();
  assert(await page.locator('#overlay').evaluate(el=>el.classList.contains('open')),'campaign chart opens detail');
  await page.locator('#closedrawer').click();
  if(w<=1020)await page.locator('#menubtn').click();
  console.log('ADS PASS '+name); await page.locator('.md-settings-entry').click();
  assert(await page.locator('#settings').evaluate(el=>el.classList.contains('active')),'Settings route');
  assert.equal(await page.locator('.md-settings-credit').count(),1,'Developer credit in settings');
  assert(await page.locator('.md-settings-dev-text').textContent().then(x=>x.includes('NemDev')));
  assert.equal(await page.locator('.v35-ribbon:visible').count(),0,'hide global ribbon in Settings');
  await page.screenshot({path:'test-results/v35-'+name+'-settings.png'});
  if(w<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="overview"]').click();
  assert.equal(await page.locator('.md-settings-credit:visible').count(),0,'Developer credit not shown outside settings');
  assert.deepEqual(errors,[],name+' JavaScript page errors');
  await context.close();
  console.log('PASS '+name+' V3.5 navigation, gallery, charts, settings and responsive layout');
 }
 const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await reduced.goto(base,{waitUntil:'domcontentloaded'});
 await reduced.locator('.v35-insight').first().waitFor();
 assert.equal(await reduced.locator('.v35-insight').first().evaluate(el=>getComputedStyle(el).animationName),'none');
 assert(await reduced.locator('html').evaluate(el=>el.classList.contains('motion-paused')));
 await reduced.close();
 await browser.close();
 console.log('PASS V3.5 all responsive checks, reduced motion and developer credit placement');
})().catch(e=>{console.error(e);server.close();process.exit(1)}).finally(()=>server.close());
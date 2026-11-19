const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const part=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(part==='/'?'/index.html':part));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(buf)});
});
(async()=>{
 const exe=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(exe,'Chromium must be available for UI verification');
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const url='http://127.0.0.1:'+server.address().port+'/?intro=0';
 const browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox']});
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['narrow',320,720]]){
  console.log('START '+name);
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
  const page=await ctx.newPage();page.setDefaultTimeout(11000);
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#reportPeriod').waitFor({state:'visible'});
  const logo=page.locator('.brandmark img');
  assert.equal(await logo.getAttribute('src'),'./assets/madhouse-mark.svg');
  const tokens=await page.evaluate(()=>{
    const root=getComputedStyle(document.documentElement),body=getComputedStyle(document.body);
    return {
      blue:root.getPropertyValue('--palette-blue').trim(),
      yellow:root.getPropertyValue('--palette-yellow').trim(),
      orange:root.getPropertyValue('--palette-orange').trim(),
      navy:root.getPropertyValue('--palette-navy').trim(),
      neutral:root.getPropertyValue('--palette-neutral').trim(),
      body:body.backgroundColor,
      sidebar:getComputedStyle(document.querySelector('.sidebar')).backgroundColor
    };
  });
  assert.deepEqual([tokens.yellow,tokens.orange,tokens.blue,tokens.navy,tokens.neutral],
    ['#FFD23F','#FF8A2A','#1F6FEB','#0B1F3B','#F2F4F7'],name+' palette tokens must match reference');
  assert.equal(tokens.body,'rgb(242, 244, 247)','neutral background');
  assert.equal(tokens.sidebar,'rgb(255, 255, 255)','V3.8 reference-style white sidebar');
  assert(await logo.evaluate(el=>el.complete && el.naturalWidth>0),name+' logo asset did not load');
  assert.equal((await page.locator('.v37-brand-title').textContent()).trim(),'Media Dashboard');
  assert((await page.locator('.topdate').textContent()).includes('DEMO AS OF'));
  assert.equal(await page.evaluate(()=>window.MediaDashboardV37?.version),'3.7.0');
  assert.equal(await page.locator('.v35-quickfind').count(),0,'duplicate Quick Find must stay removed');
  const count=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot().tasks.length);
  assert.equal(Number((await page.locator('#overview .stat strong').first().textContent()).trim()),count);
  assert(await page.locator('#overview').textContent().then(x=>x.includes('Production goals')),'filtered status breakdown remains visible under simplified heading');
  assert.equal(await page.locator('#overview').textContent().then(x=>x.includes('Performance at a glance')),false,'old made-up trend removed');
  await page.screenshot({path:'test-results/v37-'+name+'-overview.png'});
  await page.locator('[data-v36-account="MIH"]').click();
  await page.locator('[data-v36-platform="Facebook"]').click();
  await page.locator('#reportPeriod').selectOption('2026-12');
  assert.equal(await page.locator('#reportPeriod').inputValue(),'2026-12');
  assert.equal(new URL(page.url()).searchParams.get('period'),'2026-12');
  const sample=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot());
  assert(sample.tasks.every(t=>t.date.startsWith('2026-12')&&t.account==='MIH'&&t.platform==='Facebook'));
  assert.equal(Number((await page.locator('#overview .stat strong').first().textContent()).trim()),sample.tasks.length,name+' date-filtered KPI mismatch');
  await page.screenshot({path:'test-results/v37-'+name+'-filtered.png'});
  assert(await page.locator('#v36Clear').isVisible(),'clear filters when only period is changed');
  // Keep account/platform filter active to validate post sample calculations.
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="performance"]').click();
  await page.locator('body.v37-undated').waitFor({state:'attached'});
  assert.equal(await page.locator('#reportPeriod').isVisible(),false,'undated performance source must hide period');
  await page.locator('#performance .stats .stat').first().waitFor();
  const organic=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot().organic.length);
  const organicStat=await page.locator('#performance .stats .stat strong').first().textContent();
  assert.equal(Number(organicStat.trim()),organic,'post KPI must match account/platform filter');
  assert.equal((await page.locator('#performance .stats .stat strong').nth(3).textContent()).trim(),'413','reported source total stays unfiltered');
  await page.locator('[data-performance-tab="social"]').click();
  await page.locator('#performance .stats .stat').first().waitFor();
  assert.equal((await page.locator('#performance .stats .stat strong').first().textContent()).trim(),'1','MIH/Facebook demo sample combo');
  assert.equal((await page.locator('#performance .stats .stat strong').nth(1).textContent()).trim(),'7.8 / 10','social score should match selected filtered sample');
  await page.screenshot({path:'test-results/v37-'+name+'-performance.png'});
  // Verify that the single account/platform selection can be reset and propagates to Ads.
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="ads"]').click();
  await page.locator('[data-v36-account="All"]').click();
  await page.locator('[data-v36-platform="All"]').click();
  await page.locator('#ads .chartbars .barcol').first().waitFor();
  const pair=await page.locator('#ads .chartbars .barcol').first().locator('.bar').evaluateAll(nodes=>nodes.map(n=>Number.parseFloat(n.style.height)));
  const campaigns=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot().campaigns);
  const max=Math.max(...campaigns.flatMap(c=>[c.spend,c.sales]));
  assert(Math.abs(pair[0]-Math.round(campaigns[0].spend/max*100))<.1,'spend must share sales scale');
  assert(Math.abs(pair[1]-Math.round(campaigns[0].sales/max*100))<.1,'sales must share spend scale');
  assert((await page.locator('#ads').textContent()).includes('CPM, CPC and CPR require'));
  assert((await page.locator('#ads').textContent()).includes('unavailable'));
  // Third-party chart effect remains optional; data values must display without it.
  await page.screenshot({path:'test-results/v37-'+name+'-ads.png'});
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="website"]').click();
  await page.locator('body.v37-unscoped').waitFor({state:'attached'});
  assert.equal(await page.locator('#v36Scope').isVisible(),false,'unscoped website must hide irrelevant filters');
  assert((await page.locator('#page-desc').textContent()).includes('Unscoped fictional website'));
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="strategy"]').click();
  assert.equal(await page.locator('#v36Scope').isVisible(),false,'unscoped strategy must hide irrelevant filters');
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="calendar"]').click();
  await page.locator('body:not(.v37-undated)').waitFor({state:'attached'});
  assert(await page.locator('#reportPeriod').isVisible(),'dated planner enables period filter');
  assert.equal(await page.locator('.monthcard').count(),3,'three-month calendar preserved');
  await page.locator('[data-cal-tab="workload"]').click();
  assert(await page.locator('.personcard').count()>0);
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('.md-settings-entry').click();
  await page.locator('.md-settings').waitFor();
  assert.equal(await page.locator('.md-settings-dev-mark').count(),0,'developer logo stays removed');
  assert(await page.locator('.md-settings-dev-text').textContent().then(x=>x.includes('NemDev')));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=3,name+' horizontal overflow '+overflow);
  assert.deepEqual(errors,[],name+' JavaScript runtime errors');
  await ctx.close();
  console.log('PASS '+name+' branding, period, KPIs, demo labels, charts, navigation and accessibility');
 }
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 const page=await ctx.newPage();
 await page.goto(url+'&account=Madhouse&platform=Instagram&period=2026-11',{waitUntil:'domcontentloaded'});
 await page.locator('#reportPeriod').waitFor();
 assert.equal(await page.locator('#reportPeriod').inputValue(),'2026-11','URL period restored');
 assert.equal(await page.locator('#account').inputValue(),'Madhouse');
 assert.equal(await page.locator('#platform').inputValue(),'Instagram');
 await page.locator('#v36Clear').click();
 assert.equal(await page.locator('#reportPeriod').inputValue(),'All','clears period');
 assert.equal(await page.locator('#account').inputValue(),'All','clears account');
 await ctx.close();
 const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await reduced.goto(url,{waitUntil:'domcontentloaded'});
 await reduced.locator('#reportPeriod').waitFor();
 assert(await reduced.locator('html').evaluate(el=>el.classList.contains('motion-paused')));
 await reduced.close();
 await browser.close();
 console.log('PASS V3.7 URL preservation, filter reset and reduced-motion preferences');
})().catch(e=>{console.error(e);server.close();process.exit(1)}).finally(()=>server.close());
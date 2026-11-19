/* V3.9 visual consistency + accessible dashboard interactions.
 * All data stays fictional and read-only; test against live DOM render.
 */
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve('.');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 const part=decodeURIComponent(url.pathname);
 const file=path.resolve(root,'.'+(part==='/'?'/index.html':part));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
 fs.readFile(file,(err,body)=>{
  if(err){res.writeHead(404);return res.end('Missing')}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
 });
});
const routes=[
 ['overview','#1F6FEB'],['content','#F57C24'],['performance','#7659C9'],
 ['ads','#D39300'],['website','#008C90'],['strategy','#B75586'],
 ['calendar','#147CAA']
];
function hexToRgb(hex){
 const n=parseInt(hex.slice(1),16);
 return 'rgb('+[(n>>16)&255,(n>>8)&255,n&255].join(', ')+')';
}
(async()=>{
 const exe=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(exe,'Chrome browser required');
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const base='http://127.0.0.1:'+server.address().port+'/?intro=0';
 const browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox']});
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['narrow',320,720]]){
  console.log('START '+name);
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
  const page=await context.newPage();page.setDefaultTimeout(11000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MediaDashboardV39?.currentScreen==='overview');
  assert.equal(await page.locator('body').getAttribute('data-studio-screen'),'overview');
  assert.equal(await page.locator('.v38-version').textContent(),'V3.9');
  assert.equal(await page.locator('#search').count(),1,'one canonical search');
  assert.equal(await page.locator('.v35-quickfind').count(),0,'no redundant Quick Find');
  assert.equal(await page.locator('#nav .navbtn').count(),7,'seven core dashboards');
  assert.equal(await page.locator('.v38-nav-group').count(),0,'no unnecessary nav divisions');
  assert.equal(await page.locator('.sidebar').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(11, 31, 59)','preserve navy sidebar');
  const activeColor=await page.locator('#nav .navbtn.active').evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.equal(activeColor,'rgb(31, 111, 235)','preserve blue selected navigation');
  const coreColors=await page.evaluate(()=>{
   const st=getComputedStyle(document.documentElement);
   return ['--palette-yellow','--palette-orange','--palette-blue','--palette-navy','--palette-neutral'].map(k=>st.getPropertyValue(k).trim());
  });
  assert.deepEqual(coreColors,['#FFD23F','#FF8A2A','#1F6FEB','#0B1F3B','#F2F4F7']);
  for(const [id,accent] of routes){
   if(id!=='overview'){
    if(width<=1020)await page.locator('#menubtn').click();
    await page.locator('#nav [data-open="'+id+'"]').click();
   }
   await page.waitForFunction(id=>window.MediaDashboardV39?.currentScreen===id,id);
   await page.locator('#'+id+'.active').waitFor({state:'visible'});
   const current=await page.evaluate(()=>({
    screen:document.body.dataset.studioScreen,
    accent:getComputedStyle(document.body).getPropertyValue('--screen-accent').trim(),
    eyebrow:getComputedStyle(document.getElementById('page-eyebrow')).color,
    heading:getComputedStyle(document.getElementById('page-title')).fontFamily,
    panels:[...document.querySelectorAll('.page.active .panel')].slice(0,3).map(el=>({
     radius:getComputedStyle(el).borderRadius,
     heading:el.querySelector('.panel-header h3')?.textContent?.trim()
    })),
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
   }));
   assert.equal(current.screen,id);
   assert.equal(current.accent,accent,id+' accent token');
   assert(current.eyebrow!=='rgb(255, 255, 255)',id+' readable heading');
   assert(current.overflow<=3,name+'/'+id+' page overflow '+current.overflow);
   const stats=page.locator('#'+id+' .stats .stat');
   if(await stats.count()){
    const kpi=await stats.first().evaluate(el=>({
      stripe:getComputedStyle(el,'::before').backgroundColor,
      display:getComputedStyle(el).display,
      value:el.querySelector('strong')?.textContent?.trim(),
      iconBackground:el.querySelector('.stat-head svg')?
       getComputedStyle(el.querySelector('.stat-head svg')).backgroundColor:null
    }));
    assert.equal(kpi.stripe,hexToRgb(accent),name+'/'+id+' KPI stripe');
    assert(kpi.value && kpi.value.length>0,id+' no empty KPI');
    assert(kpi.iconBackground && kpi.iconBackground!=='rgba(0, 0, 0, 0)',id+' KPI icon contrast');
   }
   const headers=page.locator('#'+id+' .panel-header h3');
   if(await headers.count()){
    const marker=await headers.first().evaluate(el=>getComputedStyle(el,'::before').backgroundColor);
    if(id==='overview')assert([hexToRgb(accent),hexToRgb('#FF8A2A'),hexToRgb('#7659C9'),hexToRgb('#008C90')].includes(marker),'Overview panel uses one of four intentional categories: '+marker);
    else assert.equal(marker,hexToRgb(accent),id+' panel title accent');
   }
   await page.screenshot({path:'test-results/v39-'+name+'-'+id+'.png'});
  }
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('.md-settings-entry').click();
  await page.waitForFunction(()=>window.MediaDashboardV39?.currentScreen==='settings');
  assert.equal(await page.locator('#settings.active').count(),1,'settings page present');
  assert.equal(await page.locator('.md-settings-dev-mark').count(),0,'Settings-only text developer credit');
  assert(await page.locator('.md-settings-dev-text').textContent().then(x=>x.includes('NemDev')));
  await page.screenshot({path:'test-results/v39-'+name+'-settings.png'});
  const overflow2=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow2<=3,name+' settings overflow '+overflow2);
  assert.deepEqual(errors,[],name+' page errors');
  await context.close();
  console.log('PASS '+name+' seven dashboards, colors, Settings and responsive consistency');
 }
 // Explicit keyboard tests: content tickets, accessible tabs and native table rows.
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
 const page=await context.newPage();page.setDefaultTimeout(10000);
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.locator('#nav [data-open="content"]').click();
 await page.waitForFunction(()=>window.MediaDashboardV39?.currentScreen==='content');
 const ticket=page.locator('#content .ticket[data-task]').first();
 await ticket.waitFor({state:'visible'});
 await page.waitForFunction(()=>document.querySelector('#content .ticket[data-task]')?.dataset.v39Keyboard==='true');
 assert.equal(await ticket.getAttribute('role'),'button');
 await ticket.focus();await page.keyboard.press('Enter');
 await page.locator('#overlay.open [role="dialog"]').waitFor({state:'visible'});
 assert((await page.locator('#drawertitle').textContent()).trim().length>0,'task title shown');
 await page.locator('#closedrawer').click();
 await page.locator('#content [data-content-view="table"]').click();
 await page.waitForFunction(()=>document.querySelector('#content tr.clickrow')?.dataset.v39Keyboard==='true');
 const tableRow=page.locator('#content tr.clickrow').first();
 assert.equal(await tableRow.getAttribute('tabindex'),'0');
 await tableRow.focus();await page.keyboard.press('Enter');
 await page.locator('#overlay.open [role="dialog"]').waitFor();
 await page.locator('#closedrawer').click();
 // Existing account switcher remains the only scope filter.
 await page.locator('[data-v36-account="MIH"]').click();
 assert.equal(await page.locator('#account').inputValue(),'MIH');
 await page.locator('#nav [data-open="performance"]').click();
 await page.waitForFunction(()=>window.MediaDashboardV39?.currentScreen==='performance');
 assert.equal(await page.locator('#performance [data-performance-tab="organic"]').getAttribute('aria-pressed'),'true');
 await page.locator('#performance [data-performance-tab="social"]').click();
 await page.waitForFunction(()=>document.querySelector('#performance [data-performance-tab="social"]')?.getAttribute('aria-pressed')==='true');
 await context.close();
 // Preferences must still override the design layer.
 const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await reduced.goto(base,{waitUntil:'domcontentloaded'});
 await reduced.waitForFunction(()=>window.MediaDashboardV39?.currentScreen==='overview');
 assert(await reduced.locator('html').evaluate(el=>el.classList.contains('motion-paused')));
 const transition=await reduced.locator('#overview .stat').first().evaluate(el=>getComputedStyle(el).transitionDuration);
 assert(transition==='0s'||transition==='0s, 0s, 0s', 'reduced motion disables decorative effects: '+transition);
 await reduced.close();
 await browser.close();
 console.log('PASS V3.9 keyboard, data scope and reduced motion');
})().catch(e=>{console.error(e);server.close();process.exit(1)}).finally(()=>server.close());

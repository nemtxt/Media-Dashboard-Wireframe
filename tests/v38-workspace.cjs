const { chromium }=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve('.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1');
 const pathPart=decodeURIComponent(u.pathname);
 const file=path.resolve(root,'.'+(pathPart==='/'?'/index.html':pathPart));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,body)=>{
  if(err){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
 });
});
(async()=>{
 const exe=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(exe,'Browser binary unavailable');
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const url='http://127.0.0.1:'+server.address().port+'/?intro=0';
 const browser=await chromium.launch({executablePath:exe,headless:true,args:['--no-sandbox']});
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,950],['mid',1120,900],['tablet',834,1000],['mobile',390,844],['narrow',320,720]]){
  console.log('START',name);
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
  const page=await ctx.newPage();page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#overview .v38-panel-tasks').waitFor({state:'visible'});
  await page.locator('#overview .v38-panel-projects').waitFor({state:'visible'});
  await page.locator('#overview .v38-panel-goals').waitFor({state:'visible'});
  await page.locator('#overview .v38-panel-calendar').waitFor({state:'visible'});
  assert((await page.locator('#overview .hero h2').textContent()).includes('Your creative workspace'));
  assert((await page.locator('#overview .hero h2').textContent()).includes('One clear view'));
  assert.equal(await page.locator('.v38-account-card').count(),3);
  assert(await page.locator('.v38-task-row').count()>0,'grouped tasks');
  assert((await page.locator('.v38-task-row').count())<=5,'overview must stay concise; full tasks live in Content Pipeline');
  assert.equal(await page.locator('.v38-week-day').count(),7,'compact calendar');
  assert((await page.locator('.v38-person-row').count())>=2,'team people');
  assert.equal(await page.locator('#search').count(),1,'only one header search');
  assert.equal(await page.locator('.v35-quickfind').count(),0,'no extra quick find');
  assert.equal(await page.locator('#nav .navbtn').count(),7,'seven core screens');
  assert.equal(await page.locator('.v38-nav-group').count(),1,'reporting grouping only once');
  const titlePosition=await page.evaluate(()=>{
    const a=document.getElementById('page-eyebrow'),b=document.getElementById('page-title');
    const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect(),style=getComputedStyle(b);
    return {labelBottom:ar.bottom,titleTop:br.top,animation:style.animationName,opacity:Number(style.opacity)};
  });
  assert(titlePosition.titleTop>=titlePosition.labelBottom-1,
    name+' title must never overlap its section label '+JSON.stringify(titlePosition));
  assert(!/fadeInDown/.test(titlePosition.animation),
    name+' page title must not slide through section label');
  assert(titlePosition.opacity>.95,name+' heading must be readable on first paint');
  const bg=await page.locator('.sidebar').evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.equal(bg,'rgb(255, 255, 255)','white workspace sidebar');
  assert(await page.evaluate(()=>document.body.classList.contains('v38-workspace')));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if(overflow>3){
   const culprits=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')].filter(el=>{
      const c=getComputedStyle(el);if(c.display==='none'||c.visibility==='hidden')return false;
      const r=el.getBoundingClientRect();return r.right>width+3&&r.width>0;
    }).slice(0,16).map(el=>({tag:el.tagName,cls:el.className?.baseVal||el.className,
      x:Math.round(el.getBoundingClientRect().x),right:Math.round(el.getBoundingClientRect().right),
      w:Math.round(el.getBoundingClientRect().width)}));
   });
   console.log('HORIZONTAL OVERFLOW '+name,overflow,JSON.stringify(culprits));
  }
  assert(overflow<=3,name+' horizontal scroll '+overflow);
  const board=await page.locator('#overview').evaluate(el=>getComputedStyle(el).gridTemplateColumns);
  if(width>=1250)assert(board.split(' ').length>=2,'desktop overview two columns');
  await page.screenshot({path:'test-results/v38-'+name+'-overview.png',fullPage:false});
  // Sidebar navigation and task previews retain the centered landscape dialog.
  await page.locator('.v38-task-row').first().click();
  await page.locator('#overlay.open [role="dialog"]').waitFor({state:'visible'});
  await page.locator('#drawerbody .v36-detail-layout').waitFor();
  await page.locator('#closedrawer').click();
  // Account tiles use the single existing account filter instead of creating a new filter system.
  await page.locator('.v38-account-card[data-v38-account="MIH"]').click();
  await page.waitForFunction(()=>document.querySelector('#account')?.value==='MIH');
  await page.locator('#overview .v38-panel-projects').waitFor({state:'visible'});
  assert.equal(await page.locator('.v38-account-card').count(),1,'account scope reflected in project cards');
  const visible=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot().tasks);
  assert(visible.every(t=>t.account==='MIH'),'account click must filter original records');
  await page.locator('[data-v36-account="All"]').click();
  await page.locator('.v38-week-day').first().click();
  assert(await page.locator('#calendar').evaluate(el=>el.classList.contains('active')),'calendar interaction navigates to planner');
  assert.equal(await page.locator('.monthcard').count(),3,'existing three-month planner retained');
  // Verify the seven original monitoring areas still route without overflow.
  const pages=['overview','content','performance','ads','website','strategy','calendar'];
  for(const id of pages){
   if(width<=1020)await page.locator('#menubtn').click();
   await page.locator('#nav [data-open="'+id+'"]').click();
   await page.locator('#'+id+'.active').waitFor();
   const extra=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(extra<=3,name+' '+id+' horizontal scroll '+extra);
  }
  // Settings remains read-only with minimal developer credit.
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('.md-settings-entry').click();
  await page.locator('.md-settings-credit').waitFor({state:'visible'});
  assert((await page.locator('.md-settings-dev-text').textContent()).includes('NemDev'));
  assert.equal(await page.locator('.md-settings-dev-mark').count(),0);
  assert.deepEqual(errors,[],name+' runtime JavaScript errors');
  await ctx.close();
  console.log('PASS',name,'responsive, sidebar, project filtering, tasks, calendar and routes');
 }
 const reduce=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await reduce.goto(url,{waitUntil:'domcontentloaded'});
 await reduce.locator('#overview .v38-panel-tasks').waitFor();
 assert.equal(await reduce.locator('#overview').evaluate(el=>getComputedStyle(el).animationName),'none','reduced motion screen');
 assert(await reduce.locator('html').evaluate(el=>el.classList.contains('motion-paused')),'motion disabled by OS');
 await reduce.close();
 await browser.close();
 console.log('PASS V3.8 reduced-motion and full reference-layout regression');
})().catch(err=>{console.error(err);server.close();process.exit(1)}).finally(()=>server.close());
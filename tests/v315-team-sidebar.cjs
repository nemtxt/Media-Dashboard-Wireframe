/* V3.15 — sample-style black sidebar, header icon and exact 5-member media team. */
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const f=path.resolve(root,'.'+(p==='/'?'/index.html':p));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(f,(err,body)=>{if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});res.end(body);
 });
});
(async()=>{
 const exe=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(exe,'Chrome required');
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox']});
 try{
  for(const width of [1440,834,390,320]){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await ctx.newPage();page.setDefaultTimeout(16000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?intro=0');
   await page.locator('#overview.active').waitFor();
   const team=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot().people.map(x=>({name:x.name,role:x.role})));
   assert.deepEqual(team,[
    {name:'Justine',role:'Media Head'},{name:'Lemuel',role:'Media Team'},
    {name:'Miggy',role:'Media Team'},{name:'Domz',role:'Media Team'},
    {name:'Ian',role:'Media Team'}
   ],'Media team name and leadership records');
   const state=await page.evaluate(()=>window.MediaDashboardV35Bridge.snapshot());
   assert.equal(state.tasks.length,24,'All original fictional work items retained');
   assert(state.tasks.every(t=>team.some(x=>x.name===t.ownerName)),'Every task has a named team owner');
   const links=await page.locator('#nav [data-open]').evaluateAll(list=>list.map(el=>el.getAttribute('data-open')));
   assert.deepEqual(links,['overview','content','performance','ads','website','strategy','calendar']);
   assert.equal(await page.locator('.sidebar').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(8, 8, 8)');
   assert.equal(await page.locator('#nav .navbtn.active').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
   assert.equal(await page.locator('#nav .navbtn.active').evaluate(e=>getComputedStyle(e).color),'rgb(16, 16, 16)');
   assert.equal(await page.locator('#sidebar #collapseNav').count(),0,'No sidebar circular arrow');
   assert.equal(await page.locator('.topbar #collapseNav').count(),1,'Header panel icon retained');
   if(width>1020){
    assert(await page.locator('.topbar #collapseNav').isVisible());
    await page.locator('#collapseNav').click();
    await page.waitForFunction(()=>document.body.classList.contains('nav-collapsed'));
    await page.locator('#nav [data-open="content"]').hover();
    await page.locator('#v313RailHint').waitFor({state:'visible'});
    await page.locator('#collapseNav').click();
    await page.waitForFunction(()=>!document.body.classList.contains('nav-collapsed'));
   } else {
    assert.equal(await page.locator('#collapseNav').isVisible(),false,'Mobile uses hamburger drawer');
    await page.locator('#menubtn').click();
   }
   await page.locator('#nav [data-open="calendar"]').click();
   await page.locator('#calendar.active').waitFor();
   if(width<=1020)await page.locator('#menubtn').click();
   await page.locator('.md-settings-entry').click();
   await page.locator('#settings.active').waitFor();
   await page.locator('#themeToggle').click();
   assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'dark');
   assert.equal(await page.locator('.sidebar').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(8, 8, 8)');
   assert.equal(await page.locator('.main').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
   assert.deepEqual(errors,[]);
   const excess=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(excess<=3,'Horizontal overflow '+width+': '+excess);
   await ctx.close();
   console.log('PASS V3.15 media team, black sidebar, topbar toggle and themes '+width);
  }
 }finally{await browser.close();await new Promise(done=>server.close(done))}
})().catch(e=>{console.error(e);process.exitCode=1});

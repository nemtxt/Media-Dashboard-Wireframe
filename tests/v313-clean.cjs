/* V3.13 — clean monochrome reporting surfaces, reference-style navigation. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const dir=path.resolve('.');
const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(dir,'.'+(p==='/'?'/index.html':p));
 if(!file.startsWith(dir+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{'content-type':type[path.extname(file)]||'application/octet-stream'});res.end(buf);
 });
});
const style=async(page,sel)=>page.locator(sel).evaluate(el=>{
 const c=getComputedStyle(el);
 return {bg:c.backgroundColor,image:c.backgroundImage,border:c.borderColor,radius:c.borderRadius,weight:c.fontWeight,display:c.display};
});
(async()=>{
 const exe=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(exe,'Chromium required for regression testing');
 await new Promise(res=>server.listen(0,'127.0.0.1',res));
 const browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox']});
 const origin='http://127.0.0.1:'+server.address().port+'/?intro=0';
 const expected=['Overview','Content Pipeline','Performance','Paid Ads','Website & SEO','Strategy & Ops','Calendar & Team'];
 try {
  for(const viewport of [{width:1440,height:900},{width:834,height:1112},{width:390,height:844},{width:320,height:720}]){
   const ctx=await browser.newContext({viewport,reducedMotion:'reduce'});
   const page=await ctx.newPage();page.setDefaultTimeout(14000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin);
   await page.locator('#overview .stats>.stat').first().waitFor({state:'visible'});
   assert.deepEqual(await page.locator('#nav .navbtn span').allTextContents(),expected);
   assert.equal(await page.locator('#sidebar #collapseNav').count(),0,'No floating sidebar control');
   assert.equal(await page.locator('.topbar #collapseNav.v315-top-toggle').count(),1,'Panel icon is in top bar');
   assert.equal(await page.locator('#overview .stats>.stat').count(),4);
   assert.equal((await style(page,'.sidebar')).bg,'rgb(8, 8, 8)','Stable brand navy');
   assert.equal((await style(page,'.sidebar .navbtn.active')).bg,'rgb(255, 255, 255)','Unchanged active blue');
   assert.equal((await style(page,'#overview .stats>.stat:nth-child(1)')).bg,'rgb(255, 255, 255)','white KPI');
   assert.equal((await style(page,'#overview .stats>.stat:nth-child(2)')).image,'none','no pastel gradient in KPI');
   assert.equal((await style(page,'#overview .v38-panel-projects')).bg,'rgb(255, 255, 255)','white project card');
   assert.equal((await style(page,'#overview .v38-panel-projects')).image,'none','project card no gradients');
   assert.equal((await style(page,'#overview .v38-panel-tasks')).image,'none','assignment card no gradients');
   assert(Number((await style(page,'#overview .stats>.stat:first-child > strong')).weight)>=800,'bold summary numbers');

   if(viewport.width>1020){
     await page.locator('#collapseNav').click();
     await page.waitForFunction(()=>document.body.classList.contains('nav-collapsed'));
     await page.locator('#nav [data-open="content"]').hover();
     await page.locator('#v313RailHint').waitFor({state:'visible'});
     assert.equal((await page.locator('#v313RailHint').textContent()).trim(),'Content Pipeline');
     assert.equal(await page.locator('#collapseNav').getAttribute('aria-expanded'),'false');
     await page.locator('#collapseNav').click();
     await page.waitForFunction(()=>!document.body.classList.contains('nav-collapsed'));
   }else{
     assert.equal(await page.locator('#collapseNav').isVisible(),false,'Mobile uses existing drawer menu');
     await page.locator('#menubtn').click();
   }
   await page.locator('#nav [data-open="performance"]').click();
   await page.locator('#performance.active').waitFor();
   assert.equal(await page.locator('#overview').isVisible(),false,'No leaked Overview cards');
   assert.equal((await style(page,'#performance .stats>.stat:nth-child(1)')).image,'none','Monochrome other dashboard KPI');
   if(viewport.width<=1020)await page.locator('#menubtn').click();
   await page.locator('.md-settings-entry').click();
   await page.locator('#settings.active .md-settings').waitFor();
   assert.equal(await page.locator('#overview').isVisible(),false,'Settings does not render Overview');
   assert.equal(await page.locator('.md-settings-nav [role="tab"]').count(),4);
   await page.locator('#themeToggle').click();
   assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'dark');
   assert.equal((await style(page,'.sidebar')).bg,'rgb(8, 8, 8)','Navigation stays navy in dark mode');
   assert.equal((await style(page,'.main')).bg,'rgb(0, 0, 0)');
   await page.evaluate(()=>window.MediaDashboardV35Bridge.navigate('overview'));
   assert.equal((await style(page,'#overview .stats>.stat:nth-child(1)')).bg,'rgb(0, 0, 0)');
   assert.equal((await style(page,'#overview .stats>.stat:nth-child(1)')).image,'none');
   await page.locator('#themeToggle').click();
   assert.equal((await style(page,'.main')).bg,'rgb(255, 255, 255)');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(overflow<=3,'horizontal overflow '+viewport.width+' '+overflow);
   assert.deepEqual(errors,[],'Uncaught errors '+viewport.width);
   console.log('PASS V3.13 '+viewport.width+'px: monochrome surfaces and original navigation');
   await ctx.close();
  }
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(err=>{console.error(err);process.exitCode=1});

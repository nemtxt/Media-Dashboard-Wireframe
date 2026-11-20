/* V3.12: pastel dashboard hierarchy and no Overview bleed into Settings. */
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const assert=require('node:assert/strict');
const baseDir=path.resolve('.');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(baseDir,'.'+(p==='/'?'/index.html':p));
 if(!file.startsWith(baseDir+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return}
   res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
 });
});
const read=async(page,sel)=>page.locator(sel).evaluate(el=>{
 const css=getComputedStyle(el);
 return {bg:css.backgroundColor,image:css.backgroundImage,borderTop:css.borderTopColor,display:css.display};
});
(async()=>{
 const browserBinary=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(browserBinary,'Browser unavailable');
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const browser=await chromium.launch({headless:true,executablePath:browserBinary,args:['--no-sandbox']});
 const site='http://127.0.0.1:'+server.address().port+'/?intro=0';
 try{
  for(const [name,width,height] of [['desktop',1440,900],['tablet',834,1112],['phone',390,844],['narrow',320,720]]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(12000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(site);
   await page.locator('#overview .stats>.stat').first().waitFor({state:'visible'});
   assert.equal((await read(page,'body')).bg,'rgb(255, 255, 255)',name+' canvas stays white');
   const first=await read(page,'#overview .stats>.stat:nth-child(1)');
   const second=await read(page,'#overview .stats>.stat:nth-child(2)');
   console.log('PASTEL DEBUG',name,JSON.stringify({first,second,workspace:await page.evaluate(()=>document.body.className),theme:await page.locator('html').getAttribute('data-studio-theme'),cssLinks:await page.locator('link[rel="stylesheet"]').evaluateAll(els=>els.slice(-4).map(x=>({href:x.getAttribute('href'),sheet:!!x.sheet})))}));
   assert(first.image.includes('linear-gradient'),'primary blue KPI should have pastel gradient');
   assert(second.image.includes('linear-gradient'),'yellow KPI should have pastel gradient');
   assert.notEqual(first.image,second.image,'KPI colors should be intentionally distinct');
   assert.equal(first.bg,'rgb(255, 255, 255)','Light color remains backed by white');
   const cards=await page.locator('#overview .panel').count();
   assert(cards>=4,name+' report cards retained');
   assert((await read(page,'#overview .v38-panel-projects')).image.includes('linear-gradient'),'Project panel is pastel yellow');
   // The old unconditional #overview grid incorrectly displayed on other routes.
   await page.evaluate(()=>window.MediaDashboardV35Bridge.navigate('settings'));
   await page.locator('#settings.active .md-settings').waitFor({state:'visible'});
   assert.equal(await page.locator('#overview').isVisible(),false,name+' no Overview KPI/cards bleed into Settings & Data');
   assert.equal(await page.locator('#settings').isVisible(),true);
   assert.equal(await page.locator('.md-settings-nav [role="tab"]').count(),4,'Keep Appearance, Accessibility, Airtable Architecture, Source Quality');
   await page.locator('[data-md-tab="architecture"]').click();
   assert.equal(await page.locator('.md-settings-mini').count(),4,'Airtable metrics remain in Architecture');
   assert.equal(await page.locator('.md-settings-area').count(),7,'Source areas retained');
   await page.evaluate(()=>window.MediaDashboardV35Bridge.navigate('performance'));
   assert.equal(await page.locator('#overview').isVisible(),false,'Overview must remain hidden on Performance');
   const darkBefore=await read(page,'.sidebar');
   await page.locator('#themeToggle').click();
   assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'dark');
   assert.equal((await read(page,'.main')).bg,'rgb(0, 0, 0)');
   await page.evaluate(()=>window.MediaDashboardV35Bridge.navigate('overview'));
   assert.equal(await page.locator('#overview').isVisible(),true,'Overview renders again on return');
   const darkStat=await read(page,'#overview .stats>.stat:nth-child(1)');
   assert.equal(darkStat.bg,'rgb(0, 0, 0)','Black mode stat surface remains black');
   assert.equal(darkStat.image,'none','No pastel gradient in black mode');
   assert.equal((await read(page,'.sidebar')).bg,darkBefore.bg,'Sidebar navy unaffected by theme');
   await page.evaluate(()=>window.MediaDashboardV35Bridge.navigate('settings'));
   assert.equal(await page.locator('#overview').isVisible(),false,'Overview stays hidden in dark Settings');
   await page.locator('#themeToggle').click();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(overflow<=3,name+' no horizontal overflow '+overflow);
   assert.deepEqual(errors,[],name+' runtime errors');
   await context.close();
   console.log('PASS',name,'cards, route isolation, settings and both themes');
  }
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

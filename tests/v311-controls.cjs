/* V3.11: theme button, true black/white, fixed navy navigation, filters. */
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve('.');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const uri=new URL(req.url,'http://127.0.0.1');
 const file=path.resolve(root,'.'+(uri.pathname==='/'?'/index.html':decodeURIComponent(uri.pathname)));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(error,body)=>{
  if(error){res.writeHead(404);res.end();return}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
 });
});
async function signature(page){
 return page.evaluate(()=>{
  const read=(q)=>{const e=document.querySelector(q);return e&&getComputedStyle(e).backgroundColor};
  const selected=document.querySelector('.sidebar .navbtn.active');
  return {
   sidebar:read('.sidebar'),selected:selected&&getComputedStyle(selected).backgroundColor,
   dot:selected&&getComputedStyle(selected,'::after').backgroundColor,
   brand:read('.sidebar .brandmark'),source:read('.sidebar .sourcebox')
  }
 });
}
(async()=>{
 const executable=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(executable,'Chrome required');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:1440,height:900},{width:834,height:960},{width:390,height:844},{width:320,height:720}]){
   const context=await browser.newContext({viewport});
   const page=await context.newPage();
   page.setDefaultTimeout(15000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/?intro=0&utm_source=test');
   await page.locator('#v311FilterToggle').waitFor({state:'visible'});
   assert.equal(await page.locator('.top-actions .avatar').count(),0,'remove MD avatar');
   assert.equal(await page.locator('#themeToggle').count(),1);
   assert.equal(await page.locator('.v36-scopegroup').count(),3,'reuse all three original filter groups');
   assert.equal(await page.locator('#v311FilterPanel').isVisible(),false,'filters default compact');
   const baseline=await signature(page);
   assert.equal(baseline.sidebar,'rgb(11, 31, 59)','navy sidebar');
   assert.equal(baseline.selected,'rgb(31, 111, 235)','blue active state');
   await page.locator('#themeToggle').click();
   assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'dark');
   assert.equal(await page.locator('.main').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)');
   assert.equal(await page.locator('.topbar').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)');
   assert.equal(await page.locator('#themeToggle').getAttribute('aria-pressed'),'true');
   assert.deepEqual(await signature(page),baseline,'nav must remain unchanged by theme');
   await page.locator('#v311FilterToggle').click();
   assert.equal(await page.locator('#v311FilterPanel').isVisible(),true);
   assert.equal(await page.locator('#v311FilterPanel').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)');
   await page.locator('[data-v36-account="MIH"]').click();
   await page.waitForFunction(()=>document.querySelector('#account').value==='MIH');
   assert.equal(await page.locator('.v311-chip').count(),1,'active selection becomes chip');
   assert.match(page.url(),/account=MIH/);
   await page.locator('[data-v36-platform="TikTok"]').click();
   await page.waitForFunction(()=>document.querySelector('#platform').value==='TikTok');
   assert.equal(await page.locator('.v311-chip').count(),2);
   await page.locator('[data-v311-remove="account"]').click();
   assert.equal(await page.locator('#account').inputValue(),'All');
   assert.equal(await page.locator('#platform').inputValue(),'TikTok');
   await page.locator('#v311FilterToggle').click();
   assert.equal(await page.locator('#v311FilterPanel').isVisible(),false);
   await page.locator('.v311-reset-all').click();
   assert.equal(await page.locator('#platform').inputValue(),'All');
   assert.equal(await page.locator('.v311-chip').count(),0);
   await page.locator('#themeToggle').click();
   assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'light');
   assert.equal(await page.locator('.main').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
   assert.deepEqual(await signature(page),baseline,'light also retains unchanged navy nav');
   // Theme preferences must persist across refreshes and be reflected by Settings.
   await page.reload();
   assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'light');
   if(viewport.width<=1020)await page.locator('#menubtn').click();
   await page.locator('.md-settings-entry').click();
   await page.locator('#settings.active').waitFor();
   assert.equal(await page.locator('.md-settings-nav [data-md-tab]').count(),4);
   assert.equal(await page.locator('[data-md-pref="theme"]').inputValue(),'light');
   assert.equal(await page.locator('#themeToggle').count(),1);
   await page.locator('#themeToggle').click();
   assert.equal(await page.locator('[data-md-pref="theme"]').inputValue(),'dark');
   assert.deepEqual(await signature(page),{
     ...baseline,selected:'rgb(31, 111, 235)'
   },'Settings navigation remains navy, blue and yellow');
   await page.reload();
   assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'dark','prepaint saved theme persisted');
   assert.equal(await page.locator('#themeToggle').getAttribute('aria-pressed'),'true');
   assert.deepEqual(errors,[],'No browser errors');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(overflow<=3,'No horizontal scroll '+viewport.width+' '+overflow);
   await context.close();
  }
  console.log('V3.11 filters, theme, persistence, navigation: PASS');
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

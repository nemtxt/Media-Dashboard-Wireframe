/* V3.14: cross-page text contrast and theme consistency. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve('.');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(err,buf)=>{if(err){res.writeHead(404);res.end();return}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(buf);
 });
});
const primary={light:'rgb(18, 36, 58)',dark:'rgb(247, 249, 252)'};
const secondary={light:'rgb(82, 98, 118)',dark:'rgb(206, 212, 222)'};
const link={light:'rgb(21, 88, 166)',dark:'rgb(158, 198, 255)'};
const black='rgb(0, 0, 0)',white='rgb(255, 255, 255)';
function luminance(color){
 const nums=color.match(/\d+/g)?.slice(0,3)?.map(Number);assert(nums?.length===3,color);
 const linear=nums.map(n=>{const a=n/255;return a<=.04045?a/12.92:((a+.055)/1.055)**2.4});
 return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
}
function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
async function check(page,selector,expected,theme,context){
 const el=page.locator(selector).first();
 assert(await el.isVisible(),selector+' not visible in '+context);
 const c=await el.evaluate(x=>getComputedStyle(x).color);
 assert.equal(c,expected[theme],context+' '+selector+' unexpected text color');
 const surface=theme==='dark'?black:white;
 assert(ratio(c,surface)>=4.5,context+' '+selector+' contrast ratio '+ratio(c,surface));
}
(async()=>{
 const exe=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(exe,'Chrome required');
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox']});
 const base='http://127.0.0.1:'+server.address().port+'/?intro=0';
 const routes=['overview','content','performance','ads','website','strategy','calendar','settings'];
 try {
  for(const width of [1440,390,320]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await context.newPage();page.setDefaultTimeout(13000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base);
   await page.locator('#overview .stats>.stat').first().waitFor({state:'visible'});
   for(const theme of ['light','dark']){
    if(theme==='dark')await page.locator('#themeToggle').click();
    assert.equal(await page.locator('html').getAttribute('data-studio-theme'),theme);
    assert.equal(await page.locator('.main').evaluate(e=>getComputedStyle(e).backgroundColor),theme==='dark'?black:white);
    assert.equal(await page.locator('.sidebar').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(11, 31, 59)','Sidebar color must never change');
    for(const route of routes){
     await page.evaluate(id=>window.MediaDashboardV35Bridge.navigate(id),route);
     await page.locator('#'+route+'.active').waitFor();
     const mark=width+'/'+theme+'/'+route;
     await check(page,'.pageheading h1',primary,theme,mark);
     await check(page,'.pageheading p',secondary,theme,mark);
     if(await page.locator('.topdate').isVisible()) await check(page,'.topdate',secondary,theme,mark);
     if(route==='settings'){
      await check(page,'#settings .md-settings-intro h2',primary,theme,mark);
      await check(page,'#settings .md-settings-intro p',secondary,theme,mark);
      await check(page,'#settings .md-settings-nav button:not([aria-selected="true"])',secondary,theme,mark);
      await check(page,'#settings .md-settings-nav button[aria-selected="true"]',link,theme,mark);
      await page.locator('#settings [data-md-tab="architecture"]').click();
      await check(page,'#settings .md-settings-mini strong',primary,theme,mark);
      await check(page,'#settings .md-settings-area p',secondary,theme,mark);
      await page.locator('#settings [data-md-tab="health"]').click();
      await check(page,'#settings .md-settings-issue strong',primary,theme,mark);
      await check(page,'#settings .md-settings-issue p',secondary,theme,mark);
      await page.locator('#settings [data-md-tab="appearance"]').click();
      await check(page,'#settings .md-settings-row-text b',primary,theme,mark);
      await check(page,'#settings .md-settings-row-text p',secondary,theme,mark);
     }else{
      if(await page.locator('#'+route+' .stat strong').count())await check(page,'#'+route+' .stat strong',primary,theme,mark);
      if(await page.locator('#'+route+' .stat-head').count())await check(page,'#'+route+' .stat-head',secondary,theme,mark);
      if(await page.locator('#'+route+' .panel-header h3').count())await check(page,'#'+route+' .panel-header h3',primary,theme,mark);
      if(await page.locator('#'+route+' .panel-header p').count())await check(page,'#'+route+' .panel-header p',secondary,theme,mark);
      if(await page.locator('#'+route+' .table-scroller tbody td').count())await check(page,'#'+route+' .table-scroller tbody td',secondary,theme,mark);
     }
    }
   }
   assert.deepEqual(errors,[],'Browser errors at '+width+'px');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   assert(overflow<=3,'Horizontal overflow '+width+': '+overflow);
   await context.close();
   console.log('PASS typography color consistency at '+width+'px');
  }
 }finally {await browser.close();await new Promise(done=>server.close(done))}
})().catch(e=>{console.error(e);process.exitCode=1});

/* V3.10: history routing, mobile navigation and keyboard search. */
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve('.');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,content)=>{
    if(error){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(content);
  });
});
(async()=>{
  const executable=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
  assert(executable,'Chromium is required');
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});
  try{
    for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:720}]){
      const context=await browser.newContext({viewport});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',err=>errors.push(err.message));
      await page.goto(origin+'/?intro=0&utm_source=test#/ads');
      await page.locator('#ads.active').waitFor();
      assert.equal(await page.title(),'Paid Ads · Media Dashboard V3.12');
      assert.equal(await page.locator('#nav .navbtn').count(),7);
      assert.equal(await page.locator('.md-settings-entry').count(),1);
      assert.equal(await page.locator('.sidebar').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(11, 31, 59)');
      if(viewport.width<=1020){
        assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),true,'closed menu must not expose tab stops');
        await page.locator('#menubtn').click();
        await page.waitForFunction(()=>document.getElementById('menubtn').getAttribute('aria-expanded')==='true');
        assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),false);
      }
      await page.locator('#nav [data-open="content"]').click();
      await page.locator('#content.active').waitFor();
      assert.match(page.url(),/#\/content$/);
      assert.match(page.url(),/utm_source=test/,'query parameters survive navigation');
      await page.goBack();
      await page.locator('#ads.active').waitFor();
      assert.match(page.url(),/#\/ads$/,'Back restores the prior dashboard');
      await page.goForward();
      await page.locator('#content.active').waitFor();
      assert.match(page.url(),/#\/content$/,'Forward restores the next dashboard');
      if(viewport.width<=1020){
        await page.locator('#menubtn').click();
        await page.waitForFunction(()=>document.getElementById('menubtn').getAttribute('aria-expanded')==='true');
        await page.keyboard.press('Escape');
        await page.waitForFunction(()=>document.getElementById('menubtn').getAttribute('aria-expanded')==='false');
        assert.equal(await page.locator('#sidebar').evaluate(el=>el.inert),true);
        assert.equal(await page.evaluate(()=>document.activeElement.id),'menubtn','Escape restores menu focus');
      }
      await page.keyboard.press('/');
      const id=await page.evaluate(()=>document.activeElement.id);
      assert.equal(id,viewport.width<=700?'mobileSearch':'search');
      await page.keyboard.type('creative');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#search').inputValue(),'','Escape resets search text');
      assert.equal(await page.locator('#mobileSearch').inputValue(),'','search fields stay synchronized');
      assert.deepEqual(errors,[],'uncaught runtime errors');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      assert(overflow<=3,'no horizontal overflow at '+viewport.width+': '+overflow);
      await context.close();
    }
    console.log('V3.10 history, mobile menu, keyboard search and appearance smoke: PASS');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});

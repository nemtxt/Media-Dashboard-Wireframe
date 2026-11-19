const { chromium } = require('playwright');
const { existsSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browserPath = ['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(existsSync);
  assert(browserPath,'Chromium or Chrome must be available on the runner');
  const browser=await chromium.launch({headless:true,executablePath:browserPath,args:['--no-sandbox']});
  const source='file://' + path.resolve('index.html');
  mkdirSync('test-results',{recursive:true});
  for(const [name,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['narrow',320,720]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(source);
    const splash=page.locator('#introSplash');
    await splash.waitFor({state:'visible'});
    assert.equal(await splash.getAttribute('aria-modal'),'true',name+' dialog semantics');
    assert.equal(await page.locator('.app').evaluate(el=>el.inert),true,name+' dashboard must be inert during splash');
    assert(await page.locator('#introSkip').isVisible(),name+' skip visible');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert(overflow<=3,name+' intro horizontal overflow '+overflow);
    await page.screenshot({path:'test-results/v32-'+name+'-splash.png'});
    await page.locator('#introSkip').click();
    await splash.waitFor({state:'hidden',timeout:1500});
    assert.equal(await page.locator('.app').evaluate(el=>el.inert),false,'dashboard should unlock');
    assert(!await page.locator('html').evaluate(el=>el.classList.contains('intro-active')),'scroll-lock class must be gone');
    await page.locator('#introReplay').click();
    await splash.waitFor({state:'visible'});
    assert(await page.locator('#introSkip')evaluate(el=>document.activeElement===el),name+' skip should receive keyboard focus');
    await page.keyboard.press('Escape');
    await splash.waitFor({state:'hidden'});
    assert(await page.locator('#introReplay')evaluate(el=>document.activeElement===el),name+' replay should regain focus');
    await page.locator('#introReplay').click();
    await splash.waitFor({state:'visible'});
    await splash.waitFor({state:'hidden',timeout:6500}); // cinematic sequence + exit
    assert.equal(await page.locator('.app').evaluate(el=>el.inert),false);
    assert(await page.locator('#introReplay')evaluate(el=>document.activeElement===el),name+' auto exit restores replay focus');
    await page.goto(source); // repeat page view in same tab suppresses the splash
    await page.locator('#introReplay').waitFor();
    assert.equal(await splash.isVisible(),false,name+' same-tab repeat visit should not block dashboard');
    assert.equal(await page.locator('#introReplay').isDisabled(),false);
    assert.deepEqual(errors,[],name+' javascript runtime errors');
    await context.close();
    console.log('PASS '+name+' splash, skip, escape, replay, auto entry and session repeat');
  }
  const reducedContext=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const reduced=await reducedContext.newPage();
  await reduced.goto(source+'?intro=1');
  await reduced.locator('#introReplay').waitFor();
  assert.equal(await reduced.locator('#introSplash').isVisible(),false,'OS reduce motion must bypass intro');
  assert(await reduced.locator('#introReplay').isDisabled(),'OS reduce motion must disable replay');
  assert.equal(await reduced.locator('.app').evaluate(el=>el.inert),false);
  await reducedContext.close();
  const noJsContext=await browser.newContext({viewport:{width:1440,height:900},javaScriptEnabled:false});
  const noJs=await noJsContext.newPage();
  await noJs.goto(source);
  assert.equal(await noJs.locator('#introSplash').isVisible(),false,'No-JS users must not be stuck at splash');
  assert(await noJs.locator('.app').isVisible());
  await noJsContext.close();
  await browser.close();
  console.log('PASS Reduced-motion and JavaScript-disabled splash fallbacks');
})().catch(e=>{console.error(e);process.exit(1)});
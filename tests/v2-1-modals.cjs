const {chromium}=require('playwright');
const path=require('node:path');
const assert=require('node:assert/strict');
const {existsSync,mkdirSync}=require('node:fs');
(async()=>{
 const exe=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(existsSync);
 assert(exe,'Chrome is required on the runner');
 const browser=await chromium.launch({headless:true,executablePath:exe,args:['--no-sandbox']});
 mkdirSync('test-results',{recursive:true});
 for(const [label,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['smallmobile',320,720]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'));
  async function go(section){
    if(width<=1020)await page.locator('#menubtn').click();
    await page.locator('#nav [data-open="'+section+'"]').click();
  }
  async function verify(labelPart){
    const modal=page.locator('#overlay.open [role="dialog"]');
    await modal.waitFor({state:'visible'});
    assert.equal(await modal.getAttribute('aria-modal'),'true','aria modal');
    assert.equal(await modal.getAttribute('aria-describedby'),'drawer-subtitle','modal description');
    const rect=await modal.boundingBox();
    assert(rect, labelPart+' modal bounds');
    assert(Math.abs(rect.x+rect.width/2-width/2)<=3, label+' '+labelPart+' is not horizontally centered '+JSON.stringify(rect));
    assert(Math.abs(rect.y+rect.height/2-height/2)<=3, label+' '+labelPart+' is not vertically centered '+JSON.stringify(rect));
    assert(rect.width<=width-14 && rect.height<=height-14,label+' '+labelPart+' viewport clipping');
    assert.equal(await page.locator('body').evaluate(x=>x.style.overflow),'hidden','background scroll lock');
    assert.equal(await page.locator('.drawer-body').evaluate(x=>getComputedStyle(x).overflowY),'auto','modal body internal scroll');
  }
  async function closeByEsc(){
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.querySelector('#overlay').classList.contains('open'));
   await page.waitForFunction(()=>document.body.style.overflow==='');
  }
  await go('calendar');
  await page.locator('[data-cal-tab="workload"]').click();
  await page.locator('.personcard').first().click();
  await verify('person');
  await page.screenshot({path:'test-results/'+label+'-centered-person-modal.png'});
  const nested=page.locator('#drawerbody [data-task]');
  if(await nested.count()){
    await nested.first().click();
    await verify('nested task');
    assert.match(await page.locator('#drawer-kicker').innerText(),/WORK DETAIL/);
  }
  await closeByEsc();
  await page.waitForFunction(()=>document.activeElement?.classList.contains('personcard'),{timeout:1500});
  const focused=await page.evaluate(()=>document.activeElement?.classList.contains('personcard'));
  assert(focused,label+' must restore focus to opener');
  await page.locator('[data-cal-tab="deadlines"]').click();
  await page.locator('#calendar tbody tr[data-task]').first().click();
  await verify('task');
  await page.mouse.click(2,2);
  await page.waitForFunction(()=>!document.querySelector('#overlay').classList.contains('open'));
  await go('performance');
  await page.locator('[data-post]').first().click();
  await verify('organic post');
  await page.locator('#closedrawer').click();
  await page.waitForFunction(()=>!document.querySelector('#overlay').classList.contains('open'));
  await go('ads');
  await page.locator('[data-campaign]').first().click();
  await verify('campaign');
  await page.screenshot({path:'test-results/'+label+'-centered-campaign-modal.png'});
  await page.locator('#closedrawer').click();
  assert.deepEqual(errors,[],label+' browser page errors');
  await page.close();
  console.log('PASS '+label+' centered popup consistency and dismissal');
 }
 await browser.close();
 console.log('PASS All responsive centered modal regression checks');
})().catch(e=>{console.error(e);process.exit(1)});
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {existsSync,mkdirSync}=require('node:fs');
(async()=>{
 const executable=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(existsSync);
 if(!executable)throw Error('Browser not found');
 const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});
 mkdirSync('test-results',{recursive:true});
 for(const [device,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['small-mobile',320,720]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'));
  await page.locator('#overview .hero').waitFor();
  const design=await page.evaluate(()=>{
   const root=getComputedStyle(document.documentElement);
   const style=(selector,property)=>getComputedStyle(document.querySelector(selector)).getPropertyValue(property).trim();
   return {blue:root.getPropertyValue('--blue').trim(),orange:root.getPropertyValue('--orange').trim(),yellow:root.getPropertyValue('--yellow').trim(),navy:root.getPropertyValue('--navy').trim(),bg:root.getPropertyValue('--bg').trim(),sidebar:style('.sidebar','background-color'),hero:style('.hero','background-image'),cards:document.querySelectorAll('#overview .stat').length,scriptErrors:[]};
  });
  assert.equal(design.blue,'#1F6FEB');assert.equal(design.orange,'#FF8A2A');assert.equal(design.yellow,'#FFD23F');assert.equal(design.navy,'#0B1F3B');assert.equal(design.bg,'#F2F4F7');
  assert.equal(design.sidebar,'rgb(11, 31, 59)');assert(design.cards>=4);
  assert.match(design.hero,/linear-gradient/,'Reference-inspired hero requires a deliberate geometric treatment');
  async function noOverflow(section){
    const dims=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,overflowing:[...document.querySelectorAll('*')].filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+4 && getComputedStyle(el).display!=='none'}).slice(0,8).map(el=>({tag:el.tagName,cls:el.className?.baseVal||el.className,id:el.id,right:Math.round(el.getBoundingClientRect().right)}))}));
    assert(dims.scroll-dims.width<=3,device+' '+section+' horizontal overflow '+JSON.stringify(dims));
  }
  await noOverflow('overview');
  await page.screenshot({path:'test-results/v3-'+device+'-overview.png',fullPage:true});
  async function navigate(id){
    if(width<=1020) await page.locator('#menubtn').click();
    await page.locator('#nav [data-open="'+id+'"]').click();
    await page.locator('#'+id+'.active').waitFor();
  }
  for(const section of ['content','performance','ads','website','strategy','calendar']){
    await navigate(section);
    await noOverflow(section);
    if(section==='content'||section==='calendar'){
      await page.screenshot({path:'test-results/v3-'+device+'-'+section+'.png',fullPage:true});
    }
  }
  await page.locator('[data-cal-tab="workload"]').click();
  await page.locator('.personcard').first().click();
  await page.locator('.detail-overlay.open').waitFor();
  const modal=await page.locator('.detail-overlay.open [role="dialog"]').boundingBox();
  assert(modal,'Modal must exist');
  assert(Math.abs(modal.x+modal.width/2-width/2)<=3,device+' centered modal x');
  assert(Math.abs(modal.y+modal.height/2-height/2)<=3,device+' centered modal y');
  await page.locator('#closedrawer').click();
  await page.waitForFunction(()=>!document.querySelector('#overlay').classList.contains('open'));
  assert.deepEqual(errors,[],device+' JS errors');
  console.log('PASS '+device+' editorial tokens, 7 views, overflow, centered dialog');
  await page.close();
 }
 await browser.close();
 console.log('PASS V3 visual-reference regression');
})().catch(e=>{console.error(e);process.exit(1)});
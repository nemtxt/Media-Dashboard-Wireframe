const {chromium}=require('playwright');
const {existsSync,mkdirSync}=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const executable=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(existsSync);
 assert(executable,'Chrome/Chromium executable required');
 const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});
 mkdirSync('test-results',{recursive:true});
 const errors=[];
 for(const [label,w,h] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['smallmobile',320,720]]){
  const page=await browser.newPage({viewport:{width:w,height:h},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(label+': '+e.message));
  await page.goto('file://'+path.resolve('index.html')+'?intro=0');
  await page.waitForSelector('#overview .stat');
  await page.evaluate(()=>document.fonts.ready);
  const theme=await page.evaluate(()=>{
   const c=s=>getComputedStyle(document.querySelector(s));
   return {blue:c('body').getPropertyValue('--blue').trim(),yellow:c('body').getPropertyValue('--yellow').trim(),
    orange:c('body').getPropertyValue('--orange').trim(),navy:c('body').getPropertyValue('--navy').trim(),
    bg:c('body').getPropertyValue('--bg').trim(),font:c('body').fontFamily,
    sidebar:c('#sidebar').backgroundColor,hero:c('.hero').backgroundImage,
    padding:c('.content').paddingLeft,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  assert.equal(theme.blue,'#1F6FEB');assert.equal(theme.yellow,'#FFD23F');
  assert.equal(theme.orange,'#FF8A2A');assert.equal(theme.navy,'#0B1F3B');
  assert.equal(theme.bg,'#FFFFFF');assert.match(theme.font,/Manrope/);
  assert.match(theme.sidebar,/11,\s*31,\s*59/,'restored screenshot navigation uses navy sidebar');
  assert(theme.overflow<=3,label+' main layout horizontal overflow '+theme.overflow);
  await page.screenshot({path:'test-results/v3-'+label+'-overview.png'});
  if(w<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="calendar"]').click();
  await page.locator('[data-cal-tab="workload"]').click();
  await page.locator('.personcard').first().click();
  const modal=page.locator('#overlay.open [role=dialog]');
  const rect=await modal.boundingBox();
  assert(rect,'Centered modal must be visible');
  assert(Math.abs(rect.x+rect.width/2-w/2)<4,label+' popup not centered horizontally');
  assert(Math.abs(rect.y+rect.height/2-h/2)<4,label+' popup not centered vertically');
  await page.locator('#closedrawer').click();
  await page.screenshot({path:'test-results/v3-'+label+'-workload.png'});
  if(w<=700){
    await page.locator('[data-cal-tab="months"]').click();
    assert.equal(await page.locator('.monthcard:visible').count(),1,'Single mobile month');
  }
  await page.close();
  console.log('PASS V3 visual theme and centered dialog at '+label+' '+w+'px');
 }
 assert.deepEqual(errors,[]);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
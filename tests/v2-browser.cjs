const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {mkdirSync,existsSync}=require('node:fs');
(async()=>{
mkdirSync('test-results',{recursive:true});
const executable=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(existsSync);if(!executable)throw Error('Chrome/Chromium not available on runner');const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});
const errors=[];
for(const [name,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['smallmobile',320,720]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(name+': '+e.message));
 await page.goto('file://'+path.resolve('index.html')+'?intro=0');
 await page.waitForSelector('#overview .stat');
 const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
 assert(overflow.scroll-overflow.client<=3,name+' document horizontal overflow '+JSON.stringify(overflow));
 await page.screenshot({path:'test-results/'+name+'-overview.png',fullPage:true});
 if(width<=1020){
  await page.click('#menubtn');
  assert(await page.locator('#sidebar').evaluate(x=>x.classList.contains('show')),name+' mobile menu failed to open');
 }
 await page.locator('[data-open="calendar"]').first().click();
 await page.waitForSelector('#calendar .monthcard');
 const months=await page.locator('#calendar .monthcard:visible').count();
 assert.equal(months,width<=700?1:3,name+' calendar visibility');
 await page.screenshot({path:'test-results/'+name+'-calendar.png',fullPage:true});
 if(width<=700){
  await page.click('#nextMonths');
  const monthText=await page.locator('#calendar .monthhead').first().innerText();
  assert.match(monthText,/December 2026/,name+' next-month navigation');
 }
 await page.close();
}
assert.deepEqual(errors,[]);
await browser.close();
console.log('PASS Desktop, tablet, and mobile browser layout + calendar checks');
})().catch(e=>{console.error(e);process.exit(1)});
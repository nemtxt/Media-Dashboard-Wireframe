const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const executable=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(executable,'Chrome/Chromium browser unavailable');
 const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['small-mobile',320,720]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html')+'?intro=0');
  await page.locator('#overview .stat').first().waitFor({state:'visible',timeout:10000});
  await page.waitForFunction(()=>document.body.classList.contains('v38-workspace'));
  const nav=page.locator('#sidebar');
  const layout=await nav.evaluate(el=>{
   const style=getComputedStyle(el);
   const active=el.querySelector('.navbtn.active');
   const selectedStyle=active?getComputedStyle(active):null;
   const icon=active?.querySelector('.ico');
   const label=el.querySelector('.side-label');
   const src=el.querySelector('.sourcebox');
   const brand=el.querySelector('.brand .v37-brand-title');
   const mark=el.querySelector('.brandmark img');
   return {
    sidebar:style.backgroundColor,
    active:selectedStyle?.backgroundColor,
    activeForeground:selectedStyle?.color,
    dot:active?getComputedStyle(active,'::after').backgroundColor:null,
    activeMarker:active?getComputedStyle(active,'::before').backgroundColor:null,
    title:brand?.textContent?.trim(),
    titleColor:brand?getComputedStyle(brand).color:null,
    version:el.querySelector('.v38-version')?.textContent,
    label:label?.textContent?.trim(),
    source:src?getComputedStyle(src).backgroundColor:null,
    logoLoaded:mark?.complete && mark?.naturalWidth>0,
    reportingDivider:el.querySelectorAll('.v38-nav-group').length,
    sectionButtons:el.querySelectorAll('#nav .navbtn').length,
    stylesLoaded:[...document.styleSheets].some(sheet=>sheet.href?.includes('sidebar-restore-v38.css'))
   };
  });
  assert.equal(layout.sidebar,'rgb(8, 8, 8)',name+' black sidebar');
  assert.equal(layout.active,'rgb(255, 255, 255)',name+' selected white navigation');
  assert.equal(layout.activeForeground,'rgb(16, 16, 16)',name+' active text black');
  assert.equal(layout.dot,'rgb(17, 17, 17)',name+' black dot indicator');
  assert.equal(layout.activeMarker,'rgba(0, 0, 0, 0)',name+' no left marker');
  assert.equal(layout.title,'Media Dashboard');
  assert.equal(layout.titleColor,'rgb(255, 255, 255)');
  assert.equal(layout.version,undefined,'No version badge should appear in sidebar');
  assert.equal(layout.label,'MAIN WORKSPACE');
  assert.equal(layout.source,'rgb(21, 21, 21)');
  assert.equal(layout.reportingDivider,0,'no unnecessary reporting section');
  assert.equal(layout.sectionButtons,7,'seven original navigation buttons');
  assert.equal(layout.stylesLoaded,true,'restored styles loaded last');
  assert(layout.logoLoaded,'sidebar Madhouse icon loaded');
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="content"]').click();
  await page.locator('#content.active').waitFor();
  assert.equal(await page.locator('#nav .navbtn.active').count(),1,'one active navigation item');
  assert.equal(await page.locator('#nav .navbtn.active').getAttribute('data-open'),'content');
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="overview"]').click();
  await page.locator('#overview.active').waitFor();
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('.md-settings-entry').click();
  await page.locator('#settings.active').waitFor();
  assert.equal(await page.locator('.md-settings-entry.active').count(),1,'settings remains accessible');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert(overflow<=3,name+' unexpected page overflow: '+overflow);
  assert.deepEqual(errors,[],name+' browser runtime errors');
  await page.screenshot({path:'test-results/restored-sidebar-'+name+'.png'});
  console.log('PASS restored navy sidebar at '+width+'px');
  await page.close();
 }
 await browser.close();
 console.log('PASS all sidebar restoration screen sizes');
})().catch(err=>{console.error(err);process.exit(1)});
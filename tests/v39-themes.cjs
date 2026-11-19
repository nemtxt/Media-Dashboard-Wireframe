const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 const filepath=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!filepath.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(filepath,(err,body)=>{if(err){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':types[path.extname(filepath)]||'application/octet-stream'});res.end(body)});
});
const screens=['overview','content','performance','ads','website','strategy','calendar'];
const hex=(css)=>css.trim().replaceAll(' ','');
async function navSignature(page){
 return page.evaluate(()=>{
  const style=(el,pseudo)=>el?getComputedStyle(el,pseudo):null;
  const sidebar=document.querySelector('.sidebar');
  const active=sidebar?.querySelector('.navbtn.active, .md-settings-entry.active');
  const inactive=sidebar?.querySelector('.navbtn:not(.active)');
  const brand=sidebar?.querySelector('.brandmark');
  const label=sidebar?.querySelector('.v37-brand-title');
  const source=sidebar?.querySelector('.sourcebox');
  return {
   bg:style(sidebar)?.backgroundColor,
   activeBg:style(active)?.backgroundColor,
   activeText:style(active)?.color,
   activeIcon:style(active?.querySelector('.ico'))?.color,
   activeDot:style(active,'::after')?.backgroundColor,
   activeMarker:style(active,'::before')?.backgroundColor,
   inactiveBg:style(inactive)?.backgroundColor,
   inactiveText:style(inactive)?.color,
   logoBg:style(brand)?.backgroundColor,
   brandText:style(label)?.color,
   sourceBg:style(source)?.backgroundColor,
   sourceBorder:style(source)?.borderColor
  };
 });
}
async function assertTheme(page,theme,screen,viewport){
 const expected=theme==='dark'?'rgb(0, 0, 0)':'rgb(255, 255, 255)';
 const result=await page.evaluate(()=>{
  const take=selector=>{const el=document.querySelector(selector);return el?getComputedStyle(el).backgroundColor:null};
  const active=document.querySelector('.page.active');
  return {
   document:document.documentElement.dataset.studioTheme,
   body:take('body'),main:take('.main'),content:take('.content'),topbar:take('.topbar'),
   sidebar:take('.sidebar'),panel:take('.page.active .panel'),stat:take('.page.active .stat'),
   navActive:take('.sidebar .navbtn.active'),
   navInactive:take('.sidebar .navbtn:not(.active)'),
   navHoverText:(()=>{const el=document.querySelector('.sidebar .navbtn:not(.active)');return el?getComputedStyle(el).color:null})(),
   navActiveDot:(()=>{const el=document.querySelector('.sidebar .navbtn.active');return el?getComputedStyle(el,'::after').backgroundColor:null})(),
   navActiveMarker:(()=>{const el=document.querySelector('.sidebar .navbtn.active');return el?getComputedStyle(el,'::before').backgroundColor:null})(),
   navBrandmark:take('.sidebar .brandmark'),
   navSourcebox:take('.sidebar .sourcebox'),
   navSourceBorder:(()=>{const el=document.querySelector('.sidebar .sourcebox');return el?getComputedStyle(el).borderColor:null})(),
   navVersion:take('.sidebar .v38-version'),
   month:take('.page.active .monthcard'),ticket:take('.page.active .ticket'),
   intro:document.querySelector('#introSplash')?.classList.contains('active'),
   screen:active?.id,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   title:document.querySelector('#page-title')?getComputedStyle(document.querySelector('#page-title')).color:null
  };
 });
 assert.equal(result.document,theme,viewport+' '+screen+' saved theme');
 for(const key of ['body','main','content','topbar']){
  assert.equal(result[key],expected,viewport+' '+screen+' '+key+' must be literal '+theme);
 }
 for(const key of ['panel','stat','month','ticket'])if(result[key]!==null)
   assert.equal(result[key],expected,viewport+' '+screen+' '+key+' must be literal '+theme);
 // Navigation appearance must never change with the workspace theme.
 const navColors={
  sidebar:'rgb(11, 31, 59)',
  navActive:'rgb(31, 111, 235)',
  navActiveDot:'rgb(255, 210, 63)',
  navActiveMarker:'rgb(255, 210, 63)',
  navBrandmark:'rgb(25, 53, 87)',
  navSourcebox:'rgb(20, 46, 79)'
 };
 for(const [key,value] of Object.entries(navColors)){
   assert.equal(result[key],value,viewport+' '+screen+' '+key+' navigation must not change with theme');
 }
 if(theme==='dark'){
   assert.equal(result.title,'rgb(255, 255, 255)',viewport+' '+screen+' white heading');
 }
 assert(result.overflow<=3,viewport+'/'+screen+' horizontal overflow '+result.overflow);
}
(async()=>{
 const executable=['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/chromium'].find(fs.existsSync);
 assert(executable,'Chrome unavailable');
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/?intro=0';
 const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox']});
 fs.mkdirSync('test-results',{recursive:true});
 for(const [name,width,height] of [['desktop',1440,900],['tablet',834,1112],['mobile',390,844],['narrow',320,720]]){
  console.log('START',name);
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
  const page=await context.newPage();page.setDefaultTimeout(14000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#overview .stat').first().waitFor({state:'visible'});
  await assertTheme(page,'light','overview',name);
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('.md-settings-entry').click();
  await page.locator('#settings.active .md-settings').waitFor();
  assert.equal(await page.locator('[data-md-pref="theme"]').inputValue(),'light');
  await page.waitForTimeout(250); // settle pre-existing nav hover transitions before comparing.
  const originalNav=await navSignature(page);
  await page.locator('[data-md-pref="theme"]').selectOption('dark');
  assert.deepEqual(await navSignature(page),originalNav,name+' nav appearance must stay identical after switching to Dark');
  assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'dark');
  assert.equal(await page.locator('#settings.active').evaluate(el=>getComputedStyle(el.querySelector('.md-settings-intro')).backgroundColor),'rgb(0, 0, 0)','Settings intro is black');
  assert.equal(await page.locator('#settings.active .md-settings-section').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)','Settings panel is black');
  await page.screenshot({path:'test-results/v39-'+name+'-dark-settings.png'});
  if(width<=1020)await page.locator('#menubtn').click();
  for(const screen of screens){
   await page.locator('#nav [data-open="'+screen+'"]').click();
   await page.locator('#'+screen+'.active').waitFor({state:'visible'});
   await assertTheme(page,'dark',screen,name);
   await page.screenshot({path:'test-results/v39-'+name+'-dark-'+screen+'.png'});
   if(width<=1020 && screen!=='screens-end')await page.locator('#menubtn').click();
  }
  // On calendar, last navigation toggle already expanded mobile sidebar.
  await page.locator('#nav [data-open="content"]').click();
  await page.locator('#content.active .ticket[data-task]').first().click();
  const modal=page.locator('#overlay.open [role="dialog"]');
  await modal.waitFor({state:'visible'});
  assert.equal(await modal.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)','dark modal is true black');
  assert.equal(await page.locator('#drawerbody').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(0, 0, 0)','dark modal content');
  await page.screenshot({path:'test-results/v39-'+name+'-dark-popup.png'});
  await page.locator('#closedrawer').click();
  // The theme should be restored from localStorage on navigation/reload.
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'dark','theme saved before paint');
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('.md-settings-entry').click();
  await page.locator('#settings.active .md-settings').waitFor();
  assert.equal(await page.locator('[data-md-pref="theme"]').inputValue(),'dark');
  await page.locator('[data-md-pref="theme"]').selectOption('light');
  assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'light');
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('#nav [data-open="overview"]').click();
  await assertTheme(page,'light','overview',name);
  await page.screenshot({path:'test-results/v39-'+name+'-light-overview.png'});
  if(width<=1020)await page.locator('#menubtn').click();
  await page.locator('.md-settings-entry').click();
  await page.locator('#settings.active .md-settings').waitFor();
  await page.locator('[data-md-pref="theme"]').selectOption('dark');
  await page.locator('[data-md-reset]').click();
  assert.equal(await page.locator('html').getAttribute('data-studio-theme'),'light','reset should return to pure white');
  assert.equal(await page.locator('[data-md-pref="theme"]').inputValue(),'light');
  assert.deepEqual(errors,[],name+' script errors');
  await context.close();
  console.log('PASS',name,'pure white and pure black across pages, persistence, centered modals');
 }
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();await page.goto(url,{waitUntil:'domcontentloaded'});
 assert(await page.locator('html').evaluate(el=>el.classList.contains('motion-paused')),'reduced-motion unchanged');
 await context.close();await browser.close();
 console.log('PASS all theme regressions');
})().catch(e=>{console.error(e);server.close();process.exit(1)}).finally(()=>server.close());
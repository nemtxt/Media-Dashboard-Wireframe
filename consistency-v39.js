/* Media Dashboard V3.9 — consistent page semantics and keyboard support.
 * This is a progressive visual layer, not another dashboard or dataset.
 * No dependencies, record writes, extra search controls or Airtable calls.
 */
(()=>{
 'use strict';
 const ids=['overview','content','performance','ads','website','strategy','calendar','sources','settings'];
 const pages=ids.map(id=>document.getElementById(id)).filter(Boolean);
 if(!pages.length)return;
 const body=document.body;
 let pending=false;
 const controls=new WeakSet();
 function friendlyLabel(el){
  const td=el.querySelector?.('td');
  return (td?.textContent||el.querySelector?.('b,strong,h4')?.textContent||el.textContent||'Record')
   .trim().replace(/\s+/g,' ').slice(0,105);
 }
 function applyKeyboard(target){
  if(controls.has(target))return;
  if(target.matches('button,a,input,select,textarea'))return;
  if(target.querySelector?.('button,a,input,select,textarea'))return;
  if(!target.hasAttribute('tabindex'))target.tabIndex=0;
  if(!target.matches('tr'))target.setAttribute('role','button');
  if(!target.hasAttribute('aria-label'))
   target.setAttribute('aria-label','Open '+friendlyLabel(target)+' details');
  target.dataset.v39Keyboard='true';
  controls.add(target);
 }
 function augment(page){
  page.querySelectorAll('.ticket[data-task], .alert[data-task], tr.clickrow, .event-item[data-task], .drawer-task[data-task]')
   .forEach(applyKeyboard);
  // Existing tab click logic remains the only route state. Expose the
  // selected state consistently to keyboard and screen-reader users.
  page.querySelectorAll('.tabs .tab').forEach(tab=>{
   const selected=tab.classList.contains('active');
   if(tab.getAttribute('aria-pressed')!==String(selected))
    tab.setAttribute('aria-pressed',String(selected));
  });
 }
 function refresh(){
  pending=false;
  const active=pages.find(el=>el.classList.contains('active'));
  if(!active)return;
  if(body.dataset.studioScreen!==active.id)body.dataset.studioScreen=active.id;
  if(!body.classList.contains('v39-consistency'))body.classList.add('v39-consistency');
  pages.forEach(p=>{
   if(p===active)augment(p);
  });
  document.querySelectorAll('#nav [data-open], .md-settings-entry').forEach(button=>{
   const isCurrent=button.dataset.open===active.id;
   if(isCurrent)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
  });
  const current=document.querySelector('#nav .navbtn.active, .md-settings-entry.active');
  if(current && !current.getAttribute('aria-current'))current.setAttribute('aria-current','page');
  window.MediaDashboardV39.currentScreen=active.id;
 }
 function queue(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(refresh);
 }
 pages.forEach(p=>{
  const observer=new MutationObserver(records=>{
   if(records.some(r=>r.type==='childList'||(r.type==='attributes'&&r.attributeName==='class')))queue();
  });
  observer.observe(p,{childList:true,attributes:true,attributeFilter:['class']});
 });
 const nav=document.getElementById('nav');
 if(nav)new MutationObserver(queue).observe(nav,{childList:true});
 document.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  const target=event.target;
  if(!(target instanceof HTMLElement)||target.dataset.v39Keyboard!=='true')return;
  if(event.ctrlKey||event.altKey||event.metaKey)return;
  event.preventDefault();
  target.click();
 });
 window.MediaDashboardV39={
  version:'3.9.0',
  layer:'visual consistency, dashboard color identity and keyboard accessibility',
  isReadOnly:true,
  currentScreen:'overview'
 };
 queue();
})();
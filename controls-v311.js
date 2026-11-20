/* V3.11 — Compact filter disclosure + global theme toggle.
 * Existing V3.6 / V3.7 selectors remain the single source of truth.
 * This layer performs only presentation and settings actions; no network access.
 */
(() => {
 'use strict';
 const themeButton=document.getElementById('themeToggle');
 const settings=window.MediaDashboardSettings;
 const account=document.getElementById('account');
 const platform=document.getElementById('platform');
 const period=document.getElementById('reportPeriod');
 const search=document.getElementById('search');
 const mobileSearch=document.getElementById('mobileSearch');
 const scope=document.getElementById('v36Scope');
 if(!themeButton||!settings||!account||!platform||!scope)return;

 function theme() {return document.documentElement.dataset.studioTheme==='dark'?'dark':'light'}
 function syncTheme(){
   const dark=theme()==='dark';
   const label='Switch to '+(dark?'light':'dark')+' mode';
   themeButton.setAttribute('aria-label',label);
   themeButton.setAttribute('title',label);
   themeButton.setAttribute('aria-pressed',String(dark));
 }
 themeButton.addEventListener('click',()=>{
   settings.setTheme(theme()==='dark'?'light':'dark');
   syncTheme();
 });
 new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-studio-theme']});
 syncTheme();

 // The original scope controls are relocated, not cloned. This preserves
 // delegation, keyboard arrow navigation, URL syncing and period filtering.
 const panel=document.createElement('div');
 panel.className='v311-filter-panel';
 panel.id='v311FilterPanel';
 panel.hidden=true;
 panel.setAttribute('role','region');
 panel.setAttribute('aria-label','Dashboard filters');
 while(scope.firstChild)panel.appendChild(scope.firstChild);

 const toolbar=document.createElement('div');
 toolbar.className='v311-filter-toolbar';
 const toggle=document.createElement('button');
 toggle.type='button';toggle.className='v311-filter-toggle';
 toggle.id='v311FilterToggle';
 toggle.setAttribute('aria-expanded','false');
 toggle.setAttribute('aria-controls',panel.id);
 toggle.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M4 7h16M7 12h10M10 17h4"/><circle cx="7" cy="7" r="2" fill="currentColor" stroke="none"/></svg><span>Filters</span><span class="v311-filter-count" hidden></span><svg class="v311-caret" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg>';
 const summary=document.createElement('span');
 summary.className='v311-filter-summary';
 summary.textContent='All accounts and platforms';
 const chips=document.createElement('div');
 chips.className='v311-filter-chips';
 chips.setAttribute('aria-label','Active filters');
 const resetAll=document.createElement('button');
 resetAll.type='button';resetAll.className='v311-reset-all';
 resetAll.textContent='Clear all';resetAll.hidden=true;
 toolbar.append(toggle,summary,chips,resetAll);
 scope.append(toolbar,panel);
 document.body.classList.add('v311-ready');

 function openPanel(value,focusControl=false){
   const open=Boolean(value);
   panel.hidden=!open;
   toggle.setAttribute('aria-expanded',String(open));
   scope.classList.toggle('v311-open',open);
   if(open&&focusControl){
     const first=panel.querySelector('button.v36-scope-option:not([disabled]),select:not([disabled])');
     first?.focus({preventScroll:true});
   }
 }
 toggle.addEventListener('click',()=>openPanel(panel.hidden,true));

 function makeChip(kind,value,label){
   const chip=document.createElement('button');
   chip.type='button';
   chip.className='v311-chip';
   chip.dataset.v311Remove=kind;
   chip.setAttribute('aria-label','Remove '+label+' filter');
   chip.title='Remove '+label+' filter';
   const tag=document.createElement('span');
   tag.textContent=label;
   const x=document.createElement('span');
   x.className='v311-chip-x';x.textContent='×';x.setAttribute('aria-hidden','true');
   chip.append(tag,x);
   return chip;
 }
 function sync(){
   const selected=[];
   if(account.value!=='All')selected.push(['account',account.value,'Account: '+account.value]);
   if(platform.value!=='All')selected.push(['platform',platform.value,'Platform: '+platform.value]);
   const periodApplicable=!document.body.classList.contains('v37-undated');
   if(period&&period.value!=='All'&&periodApplicable){
     selected.push(['period',period.value,'Period: '+(period.selectedOptions[0]?.textContent||period.value)]);
   }
   const query=(search?.value||'').trim();
   if(query)selected.push(['search',query,'Search: '+query]);
   chips.replaceChildren(...selected.map(([k,v,label])=>makeChip(k,v,label)));
   const count=toggle.querySelector('.v311-filter-count');
   count.hidden=!selected.length;
   count.textContent=String(selected.length);
   resetAll.hidden=selected.length===0;
   summary.textContent=selected.length ? selected.length+' active '+(selected.length===1?'filter':'filters') : 'All accounts and platforms';
   toggle.setAttribute('aria-label',selected.length?'Filters, '+selected.length+' active':'Filters, none active');
 }
 function clearOne(kind){
   if(kind==='account'||kind==='platform'){
     const node=kind==='account'?account:platform;
     node.value='All';
     node.dispatchEvent(new Event('change',{bubbles:true}));
   }else if(kind==='period'&&period){
     period.value='All';
     period.dispatchEvent(new Event('change',{bubbles:true}));
   }else if(kind==='search'&&search){
     search.value='';
     search.dispatchEvent(new Event('input',{bubbles:true}));
     if(mobileSearch)mobileSearch.value='';
   }
   sync();
 }
 toolbar.addEventListener('click',event=>{
   const chip=event.target.closest('[data-v311-remove]');
   if(chip) {clearOne(chip.dataset.v311Remove);return;}
   if(event.target.closest('.v311-reset-all')){
     document.getElementById('resetfilters')?.click(); // Existing period reset handler included.
     if(period&&period.value!=='All'){
       period.value='All';period.dispatchEvent(new Event('change',{bubbles:true}));
     }
     sync();
   }
 });
 for(const control of [account,platform,period,search,mobileSearch]){
   control?.addEventListener(control===search||control===mobileSearch?'input':'change',sync);
 }
 window.addEventListener('popstate',()=>requestAnimationFrame(sync));
 // Some old renderers update the period control after a layout change.
 const pageElements=[...document.querySelectorAll('.content .page')];
 const pageObserver=new MutationObserver(()=>requestAnimationFrame(()=>{
   // A filter popup must not obscure controls after navigating to a different dashboard.
   if(!panel.hidden)openPanel(false);
   sync();
 }));
 pageElements.forEach(el=>pageObserver.observe(el,{attributes:true,attributeFilter:['class']}));

 document.addEventListener('pointerdown',event=>{
   if(!panel.hidden&&!scope.contains(event.target))openPanel(false);
 });
 document.addEventListener('keydown',event=>{
   if(event.key!=='Escape'||panel.hidden)return;
   const within=scope.contains(document.activeElement);
   openPanel(false);
   if(within){event.preventDefault();event.stopPropagation();toggle.focus({preventScroll:true});}
 },true);

 sync();
 window.MediaDashboardV311=Object.freeze({version:'3.11.0',readOnly:true,filterStyle:'compact-disclosure'});
})();
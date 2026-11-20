/* V3.13: sidebar styling/behavior only; all original routes and data unchanged. */
(() => {
 'use strict';
 const sidebar=document.getElementById('sidebar');
 const nav=document.getElementById('nav');
 const toggle=document.getElementById('collapseNav');
 if(!sidebar||!nav||!toggle) return;
 // Move the existing, already-wired collapse button to the sidebar edge.
 sidebar.appendChild(toggle);
 toggle.classList.add('v313-edge-toggle');
 toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg>';
 const narrow=window.matchMedia('(max-width:1020px)');
 const hint=document.createElement('div');
 hint.id='v313RailHint';
 hint.className='v313-rail-hint';
 hint.hidden=true;
 hint.setAttribute('role','tooltip');
 document.body.appendChild(hint);

 function annotate(){
   // The original renderNav() replaces nav children on route changes.
   sidebar.querySelectorAll('.navbtn').forEach(btn=>{
     const label=btn.querySelector('span')?.textContent?.trim();
     if(!label)return;
     btn.dataset.v313Label=label;
     btn.setAttribute('aria-label',label);
   });
 }
 new MutationObserver(annotate).observe(nav,{childList:true});
 annotate();

 function compact(){return document.body.classList.contains('nav-collapsed')&&!narrow.matches}
 function hide(){hint.hidden=true}
 function show(button){
   if(!compact()||!button)return hide();
   const label=button.dataset.v313Label;
   if(!label)return hide();
   hint.textContent=label;
   hint.hidden=false;
   const r=button.getBoundingClientRect();
   const x=sidebar.getBoundingClientRect().right+12;
   const available=window.innerWidth-hint.offsetWidth-10;
   hint.style.left=Math.max(8,Math.min(x,available))+'px';
   hint.style.top=Math.max(8,Math.min(r.top+(r.height-hint.offsetHeight)/2,window.innerHeight-hint.offsetHeight-8))+'px';
 }
 function relabelToggle(){
   const collapsed=compact();
   const text=collapsed?'Expand navigation':'Collapse navigation';
   toggle.setAttribute('aria-label',text);
   toggle.title=text;
   toggle.setAttribute('aria-expanded',String(!collapsed));
   if(!collapsed)hide();
 }
 toggle.addEventListener('click',()=>queueMicrotask(relabelToggle));
 new MutationObserver(relabelToggle).observe(document.body,{attributes:true,attributeFilter:['class']});
 narrow.addEventListener?.('change',relabelToggle);
 relabelToggle();

 sidebar.addEventListener('pointerover',event=>{
   const btn=event.target.closest?.('.navbtn');
   if(btn&&sidebar.contains(btn))show(btn);
 });
 sidebar.addEventListener('pointerout',event=>{
   const btn=event.target.closest?.('.navbtn');
   if(btn&&!btn.contains(event.relatedTarget))hide();
 });
 sidebar.addEventListener('focusin',event=>{
   const btn=event.target.closest?.('.navbtn');
   if(btn)show(btn);
 });
 sidebar.addEventListener('focusout',event=>{
   if(event.target.closest?.('.navbtn'))hide();
 });
 sidebar.addEventListener('click',event=>{
   if(event.target.closest('.navbtn'))hide();
 });
 window.addEventListener('resize',hide,{passive:true});
 window.addEventListener('scroll',hide,{capture:true,passive:true});
 window.MediaDashboardV313=Object.freeze({
   version:'3.13.0',readOnly:true,sidebarStyle:'compact-rail'
 });
})();

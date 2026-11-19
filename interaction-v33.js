/* Media Dashboard V3.3: Anime.js, Motion and Animate.css progressive enhancement.
   Pinned, free library imports; read-only data; native CSS fallback. */
(()=>{
'use strict';
const root=document.documentElement,host=document.querySelector('.content'),modal=document.querySelector('#overlay');
if(!host)return;
const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const on=()=>!root.classList.contains('motion-paused')&&!reduced?.matches;
const state={version:'3.3.0',libraries:{anime:false,motion:false,animateCSS:false},decorated:0};
window.MediaStudioInteractions=state;
state.libraries.animateCSS=!!document.querySelector('link[href*="animate.css"]');
let anime=null,motion=null,queued=false,oldTitle='',oldDialog='';
const FLOW=[
'<section class="v33-studio-pulse" aria-label="Creative production workflow">',
'<div class="v33-pulse-header"><div class="v33-pulse-eyebrow"><i aria-hidden="true"></i> STUDIO FLOW / WORK IN MOTION</div><span class="v33-pulse-tag">A clear path from idea to publishing</span></div>',
'<div class="v33-pulse-grid">',
'<button type="button" class="v33-pulse-item" data-open="content" style="--stage-color:#1F6FEB;--stage-bg:#E8F2FF"><span class="v33-pulse-top"><span class="v33-pulse-index">01 / DISCOVER</span><span class="v33-pulse-sigil" aria-hidden="true">✳</span></span><span class="v33-pulse-title">Plan the idea</span><span class="v33-pulse-desc">Creative briefs & priorities</span><span class="v33-pulse-trace"><i></i></span></button>',
'<button type="button" class="v33-pulse-item" data-open="content" style="--stage-color:#FF8A2A;--stage-bg:#FFF0E1"><span class="v33-pulse-top"><span class="v33-pulse-index">02 / MAKE</span><span class="v33-pulse-sigil" aria-hidden="true">▶</span></span><span class="v33-pulse-title">Create the work</span><span class="v33-pulse-desc">Assets, video & production</span><span class="v33-pulse-trace"><i></i></span></button>',
'<button type="button" class="v33-pulse-item" data-open="content" style="--stage-color:#D99F00;--stage-bg:#FFF6D2"><span class="v33-pulse-top"><span class="v33-pulse-index">03 / REFINE</span><span class="v33-pulse-sigil" aria-hidden="true">◇</span></span><span class="v33-pulse-title">Review & approve</span><span class="v33-pulse-desc">Feedback & next actions</span><span class="v33-pulse-trace"><i></i></span></button>',
'<button type="button" class="v33-pulse-item" data-open="content" style="--stage-color:#16996F;--stage-bg:#E5F8F0"><span class="v33-pulse-top"><span class="v33-pulse-index">04 / LAUNCH</span><span class="v33-pulse-sigil" aria-hidden="true">↗</span></span><span class="v33-pulse-title">Publish & measure</span><span class="v33-pulse-desc">Release, learn & improve</span><span class="v33-pulse-trace"><i></i></span></button>',
'</div><div class="v33-pulse-footer"><span>Concept workflow illustration · Select a stage to open Content Pipeline</span><button type="button" data-open="content" class="v33-pulse-link">Open production board <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16m-7-7 7 7-7 7"/></svg></button></div></section>'
].join('');
function animateClass(el,cl){
 if(!el||!on()||!state.libraries.animateCSS)return;
 const className='animate__'+cl;
 el.classList.remove('animate__animated',className);
 void el.offsetWidth;
 el.style.setProperty('--animate-duration','580ms');
 el.classList.add('animate__animated',className);
 window.setTimeout(()=>{if(el.isConnected)el.classList.remove('animate__animated',className)},640);
 state.animateCSSUsed=true;
}
function animeFlow(flow){
 if(!on()||!anime||flow.dataset.animeApplied)return;
 flow.dataset.animeApplied='1';
 try{
  anime.animate(Array.from(flow.querySelectorAll('.v33-pulse-sigil')),{
   scale:[.6,1],rotate:['-22deg','0deg'],opacity:[.4,1],
   duration:700,delay:anime.stagger(100),ease:'out(3)'
  });
  state.animeUsed=true;
 }catch(_){state.animeUsed=false}
}
function motionFlow(flow){
 if(!on()||!motion||flow.dataset.motionApplied)return;
 flow.dataset.motionApplied='1';
 try{
  motion.inView(flow.querySelector('.v33-pulse-footer'),el=>{
   if(!on())return;
   motion.animate(el,{opacity:[.65,1]},{duration:.55});
   state.motionUsed=true;
  },{amount:.25});
 }catch(_){state.motionUsed=false}
}
function scan(){
 const page=host.querySelector('.page.active');if(!page)return;
 if(page.id==='overview'){
  const hero=page.querySelector('.hero');
  if(hero&&!page.querySelector('.v33-studio-pulse'))hero.insertAdjacentHTML('afterend',FLOW);
  const flow=page.querySelector('.v33-studio-pulse');
  if(flow){animeFlow(flow);motionFlow(flow)}
 }
 page.querySelectorAll('.stat,.panel,.personcard,.ticket,.monthcard,.source-card,.event-item,.clickrow,.day,.pill').forEach(el=>{
  if(el.dataset&&!el.dataset.v33Ready){el.dataset.v33Ready='1';state.decorated++}
 });
 page.querySelectorAll('tr.clickrow[data-task],tr.clickrow[data-post],tr.clickrow[data-campaign]').forEach(row=>{
  if(!row.hasAttribute('tabindex'))row.tabIndex=0;
  row.setAttribute('role','button');
  if(!row.hasAttribute('aria-label'))row.setAttribute('aria-label','View '+(row.querySelector('td')?.textContent||'record').trim().slice(0,85));
 });
 const title=document.getElementById('page-title'),name=title?.textContent?.trim()||'';
 if(name&&name!==oldTitle){oldTitle=name;animateClass(title,'fadeInDown')}
 const detail=document.getElementById('drawertitle'),dname=detail?.textContent?.trim()||'';
 if(modal?.classList.contains('open')&&dname&&dname!==oldDialog){oldDialog=dname;animateClass(detail,'fadeInUp')}
 if(!modal?.classList.contains('open'))oldDialog='';
}
function schedule(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;scan()});
}
const anims=new WeakMap();
function cardFor(node){return node?.closest?.('.stat,.personcard,.ticket,.v33-pulse-item')}
function spring(card,enter){
 if(!on()||!motion||!card?.isConnected)return;
 const symbol=card.querySelector('.v33-pulse-sigil,.stat-head svg,.face,.ticket-thumb .studio-preview-mark');
 if(!symbol)return;
 try{
  anims.get(card)?.stop?.();
  anims.set(card,motion.animate(symbol,{rotate:enter?5:0,scale:enter?1.11:1},{type:'spring',stiffness:420,damping:26}));
  state.springUsed=true;
 }catch(_){}
}
host.addEventListener('pointerover',e=>{
 if(e.pointerType==='touch')return;
 const card=cardFor(e.target);if(card&&!card.contains(e.relatedTarget))spring(card,true);
},{passive:true});
host.addEventListener('pointerout',e=>{
 if(e.pointerType==='touch')return;
 const card=cardFor(e.target);if(card&&!card.contains(e.relatedTarget))spring(card,false);
},{passive:true});
host.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'||!on())return;
 const card=e.target.closest?.('.stat,.panel');if(!card)return;
 const box=card.getBoundingClientRect();
 card.style.setProperty('--v33-x',((e.clientX-box.left)/box.width*100).toFixed(1)+'%');
 card.style.setProperty('--v33-y',((e.clientY-box.top)/box.height*100).toFixed(1)+'%');
},{passive:true});
host.addEventListener('keydown',e=>{
 if((e.key==='Enter'||e.key===' ')&&!e.defaultPrevented&&e.target?.matches?.('tr.clickrow[tabindex]')){
  e.preventDefault();e.target.click();
 }
});
const observer=new MutationObserver(changes=>{
 if(changes.some(r=>(r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1))||
 (r.type==='attributes'&&r.target===modal)))schedule();
});
observer.observe(host,{subtree:true,childList:true});
if(modal)observer.observe(modal,{attributes:true,attributeFilter:['class']});
document.getElementById('motionToggle')?.addEventListener('click',schedule);
reduced?.addEventListener?.('change',schedule);
schedule();
const load=async(key,url)=>{
 try{
  const api=await import(url);
  if(typeof api.animate!=='function')return;
  state.libraries[key]=true;
  if(key==='anime')anime=api;
  if(key==='motion')motion=api;
 }catch(_){(state.errors??=[]).push(key+' CDN unavailable');}
};
Promise.all([
 load('anime','https://cdn.jsdelivr.net/npm/animejs@4.0.0/+esm'),
 load('motion','https://cdn.jsdelivr.net/npm/motion@11.13.5/+esm')
]).then(schedule);
})();
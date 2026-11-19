/* Media Dashboard v3.7 — reporting scope and provenance cues.
 * Read-only UI. Keeps the original in-app search, account/platform filters,
 * and 19 Nov 2026 fixed demo reference date. */
(() => {
  'use strict';
  const bar=document.getElementById('v36Scope');
  const account=document.getElementById('account');
  const reset=document.getElementById('resetfilters');
  const heading=document.getElementById('page-desc');
  if(!bar||!account||!reset||!heading)return;
  const periodChoices=[
    ['All','All sample dates'],
    ['2026-11','Nov 2026'],
    ['2026-12','Dec 2026'],
    ['2027-01','Jan 2027']
  ];
  const datePages=new Set(['overview','content','calendar']);
  const scopedPages=new Set(['overview','content','calendar','performance','ads']);
  const guidance={
    overview:'Filtered fictional work and workload summaries. Demo reference date: November 19, 2026.',
    content:'Creative assignments follow account, platform and selected demo period.',
    performance:'Illustrative post and score values follow account/platform filters; reported Airtable table totals do not.',
    ads:'Fictional campaign spend and ROAS follow account/platform filters. No campaign dates or verified attribution.',
    website:'Unscoped fictional website metrics and unfiltered reported SEO table totals; no live analytics.',
    strategy:'Reported KRA, KPI and action-plan totals with separate fictional progress examples; filters do not apply.',
    calendar:'Three-month demo planner. Dated tasks follow account, platform and selected period; reference date: November 19, 2026.',
    sources:'Read-only architecture reference from the supplied report, not independently verified against Airtable.'
  };
  const group=document.createElement('div');
  group.className='v36-scopegroup v37-period-group';
  group.innerHTML='<label class="v36-scope-label" for="reportPeriod">PERIOD</label>'+
    '<select class="v37-period-select" id="reportPeriod" aria-label="Reporting period for fictional dated tasks" title="Applies only to dated fictional assignments">'+
    periodChoices.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+
    '</select>';
  const suffix=bar.querySelector('.v36-scope-suffix');
  if(!suffix)return;
  suffix.before(group);
  const select=group.querySelector('#reportPeriod');
  const clear=document.getElementById('v36Clear');
  const status=document.getElementById('v36ScopeStatus');
  const baseStatus=()=>(
    (account.value==='All'?'All accounts':account.value)+' · '+
    (document.getElementById('platform')?.value==='All'?'All platforms':document.getElementById('platform')?.value)
  );
  function activePage(){
    return document.querySelector('.content .page.active')?.id||'overview';
  }
  function savePeriod(){
    try{
      const url=new URL(location.href);
      if(select.value==='All')url.searchParams.delete('period');
      else url.searchParams.set('period',select.value);
      history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    }catch(_){}
  }
  function setInfo(){
    const id=activePage(),dated=datePages.has(id),scoped=scopedPages.has(id);
    document.body.classList.toggle('v37-unscoped',!scoped);
    document.body.classList.toggle('v37-undated',!dated);
    if(guidance[id]&&heading.textContent!==guidance[id])heading.textContent=guidance[id];
    const kicker=document.querySelector('#overview .hero-kicker');
    if(kicker&&kicker.textContent!=='MEDIA WORKSPACE / FICTIONAL DATA')
      kicker.textContent='MEDIA WORKSPACE / FICTIONAL DATA';
    if(status&&dated){
      const chosen=periodChoices.find(x=>x[0]===select.value);
      const next=baseStatus()+(select.value==='All'?'':' · '+chosen[1]);
      if(status.textContent!==next)status.textContent=next;
    }
    if(clear&&select.value!=='All'&&dated)clear.hidden=false;
    window.MediaDashboardV37.lastPage=id;
  }
  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;setInfo()});
  }
  function renderForPeriod(){
    // The original account change handler rerenders all existing dashboards;
    // this also refreshes their shared period-aware visible(tasks) function.
    account.dispatchEvent(new Event('change',{bubbles:true}));
    savePeriod();
    schedule();
  }
  select.addEventListener('change',renderForPeriod);
  reset.addEventListener('click',()=>{
    if(select.value==='All'){schedule();return}
    select.value='All';
    // Original reset action clears account/platform/query synchronously.
    queueMicrotask(renderForPeriod);
  });
  for(const id of ['account','platform','search']){
    document.getElementById(id)?.addEventListener('change',schedule);
    document.getElementById(id)?.addEventListener('input',schedule);
  }
  const pages=[...document.querySelectorAll('.content .page')];
  const watcher=new MutationObserver(records=>{
    if(records.some(r=>r.type==='attributes'&&r.attributeName==='class'))schedule();
  });
  pages.forEach(el=>watcher.observe(el,{attributes:true,attributeFilter:['class']}));
  const breadcrumb=document.getElementById('crumb');
  if(breadcrumb){
    const crumbWatcher=new MutationObserver(schedule);
    crumbWatcher.observe(breadcrumb,{childList:true,characterData:true});
  }
  function readPeriod(){
    try{
      const p=new URLSearchParams(location.search).get('period')||'All';
      const valid=periodChoices.some(([value])=>value===p)?p:'All';
      if(select.value!==valid){
        select.value=valid;
        account.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }catch(_){}
    schedule();
  }
  window.addEventListener('popstate',readPeriod);
  window.MediaDashboardV37={
    version:'3.7.0',mode:'read-only-fictional',
    getScope:()=>({account:account.value,platform:document.getElementById('platform')?.value,period:select.value}),
    lastPage:activePage(),
    reportCountsAreUnfiltered:true
  };
  readPeriod();
  schedule();
})();
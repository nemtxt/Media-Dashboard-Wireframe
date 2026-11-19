/* Media Dashboard V3.5 — UX refinement, using existing read-only prototype records.
   No Airtable requests, data edits, new pages or dependencies. */
(()=>{
'use strict';
const bridge=window.MediaDashboardV35Bridge;
const host=document.querySelector('.content');
if(!bridge||!host)return;
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=n=>Number(n||0).toLocaleString('en-PH');
const peso=n=>'₱'+format(n);
const shortDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const info={
 overview:['TODAY’S PRIORITIES','Review open deadlines and production ownership.','calendar','deadlines'],
 content:['CREATIVE OUTPUT','Follow work from production to publishing.','content',''],
 performance:['PERFORMANCE CHECK','Compare the illustrative organic and social results.','performance','organic'],
 ads:['CAMPAIGN EFFICIENCY','Review the sample campaign ROAS and spend mix.','ads',''],
 website:['SEARCH VISIBILITY','Review acquisition channels and keyword summaries.','website',''],
 strategy:['STRATEGY ALIGNMENT','Trace goals into execution and action plans.','strategy',''],
 calendar:['TEAM CAPACITY','Review deadlines and assigned people in a three-month planner.','calendar','deadlines']
};
const definitions={
 'Assigned work':'Number of fictional assignments matching the selected filters.',
 'In the pipeline':'Fictional work items that are not completed or posted.',
 'Overdue deadlines':'Fictional assignments before the sample reference date of November 19, 2026 that are still open.',
 'Upcoming work':'Open fictional items with an upcoming due date.',
 'Creative work':'Content, production and creative-assistance assignments in the demo.',
 'In production':'Fictional content tasks currently marked In progress.',
 'For review':'Fictional tasks awaiting review.',
 'Organic records':'Reported count in the source architecture, not the number of demo posts.',
 '24H reports':'Reported count of 24-hour metrics submissions; no live sync.',
 '7-day reports':'Reported count of seven-day metrics submissions; no live sync.',
 'Sample grade':'Illustrative post grade, not a verified Airtable formula result.',
 'Ad spend':'Sum of spend from the filtered fictional campaigns.',
 'Attributed sales':'Sum of illustrated campaign sales; attribution is not verified.',
 'Aggregate ROAS':'Attributed campaign sales divided by ad spend.',
 'Campaigns shown':'Number of fictional campaign records matching filters.',
 'Website sessions':'Illustrative website sessions; MH Website Metrics is not connected.',
 'Bounce rate':'Illustrative website bounce rate; not a live analytic measure.',
 'Tracked SEO keywords':'Reported number of Airtable SEO monitoring records.',
 'KRAs tracked':'Reported count of KRA source rows.',
 'KPIs monitored':'Reported count of KPI source rows.',
 'Action plans':'Reported count of action plans, including rows with blank names.',
 'Chief initiatives':'Reported number of leadership media initiatives.',
 'Airtable tables':'Reported table count from the supplied architecture.',
 'Approx. records':'Approximate record total from the supplied Claude architecture report.',
 'Interfaces':'Reported Airtable interface count.',
 'Dashboard pages':'Reported number of dashboard pages among 31 reported interface pages.'
};
const sourceMap={
 overview:'Creatives Content Tracker, Organic Performance Tracker, Monthly Marketing Metrics',
 content:'Creatives Content Tracker, MadSerye Productions, Multimedia artist assistance',
 performance:'Organic Performance Tracker, 24H Performance Tracker, 7Days Performance Tracker, Soc Med Page Performance',
 ads:'Ad Campaigns, Ad Campaigns Results',
 website:'MH Website Metrics, Page and Screen, Traffic Acquisition, SEO Keywords Monitoring',
 strategy:'KRA, KPI, Action Plan, Chiefs’ Initiatives',
 calendar:'Deadline and assignee fields across reported workstreams',
 sources:'Reported Airtable architecture summary'
};
const pages=[['overview','Overview'],['content','Content Pipeline'],['performance','Performance'],['ads','Paid Ads'],
 ['website','Website & SEO'],['strategy','Strategy & Operations'],['calendar','Calendar & Team'],['settings','Settings & Data']];
let gallery=false,scheduled=false,modalFocused=null;
const state={version:'3.5.0',readOnly:true,searchEnabled:true,refinement:true};
window.MediaDashboardV35=state;
function snapshot(){return bridge.snapshot()}
function page(){return host.querySelector('.page.active')}
function dialog(kicker,title,description,body){
 modalFocused=document.activeElement;
 bridge.modal(kicker,title,description,body);
}
function explainMetric(card){
 const s=snapshot(),name=card.dataset.v35Metric||'Metric',value=card.querySelector('strong')?.textContent?.trim()||'—';
 const note=card.querySelector('.stat-foot')?.textContent?.trim()||'';
 const definition=definitions[name]||('This summary belongs to the fictional demonstration dataset. '+note);
 const source=sourceMap[s.active]||'Reported architecture reference';
 const reported=/source table|reported|source count|provided architecture|record count/i.test(note) ||
 /Airtable tables|Approx. records|Interfaces|Dashboard pages|Organic records|24H reports|7-day reports|Tracked SEO keywords|KRAs tracked|KPIs monitored|Action plans|Chief initiatives|Social page reports|Monthly metrics/i.test(name);
 dialog('METRIC CONTEXT',name,'Explanation · source and calculation',
  '<div class="v35-metric-details"><div class="v35-definition"><strong>'+html(value)+'</strong><br>'+html(definition)+'</div>'+
  '<table class="v35-mini-table"><tbody><tr><td>Displayed value</td><td>'+html(value)+'</td></tr>'+
  '<tr><td>Classification</td><td>'+ (reported?'Reported source summary':'Fictional demonstration')+'</td></tr>'+
  '<tr><td>Account filter</td><td>'+html(s.filters.account)+'</td></tr>'+
  '<tr><td>Platform filter</td><td>'+html(s.filters.platform)+'</td></tr></tbody></table>'+
  '<div class="v35-sourcebox"><b>Relevant source area</b><br>'+html(source)+
  '<p>This prototype does not read or update Airtable data. Some grading formulas in the reported source require validation.</p></div></div>');
}
const infoTable=rows=>'<table class="v35-mini-table"><tbody>'+rows.map(([l,r])=>
 '<tr><td>'+html(l)+'</td><td>'+html(r)+'</td></tr>').join('')+'</tbody></table>';
function summaryData(id,s){
 const t=s.tasks,live=t.filter(x=>!x.done),late=live.filter(x=>x.late),up=live.filter(x=>x.date>=s.today).sort((a,b)=>a.date.localeCompare(b.date));
 const creative=t.filter(x=>['Content','Production','Request'].includes(x.kind));
 const review=creative.filter(x=>x.status==='For review');
 const posts=s.organic.slice().sort((a,b)=>b.views-a.views);
 const campaigns=s.campaigns,totalSpend=campaigns.reduce((n,c)=>n+c.spend,0),totalSales=campaigns.reduce((n,c)=>n+c.sales,0);
 const result={
 overview:{title:late.length+' overdue · '+up.length+' upcoming',sub:'Prioritize deadlines and ownership before opening detailed reports.',
  values:[late.length,review.length,live.length,up.length],rows:up.slice(0,6).map(x=>[x.title,shortDate(x.date)+' · '+x.ownerName])},
 content:{title:creative.length+' creative items · '+review.length+' awaiting review',
  sub:'Open creative assignments and compare their production stages.',
  values:[creative.length,review.length,creative.filter(x=>x.status==='In progress').length,creative.filter(x=>x.done).length],
  rows:creative.slice(0,7).map(x=>[x.title,x.displayStatus+' · '+x.progress+'%'])},
 performance:{title:posts.length?posts[0].title+' leads demo views':'No posts match these filters',
  sub:'Post rankings use fictional values and grades, not validated source formulas.',
  values:posts.slice(0,6).map(x=>x.grade7),rows:posts.map(x=>[x.title,format(x.views)+' views · '+x.grade7+'/10'])},
 ads:{title:totalSpend?('Sample return '+(totalSales/totalSpend).toFixed(2)+'× ROAS'):'No matching campaigns',
  sub:'Fictional spend efficiency; use the comparison chart for campaign detail.',
  values:campaigns.map(x=>x.roas),rows:campaigns.map(x=>[x.name,peso(x.spend)+' · '+x.roas.toFixed(2)+'× ROAS'])},
 website:{title:'Five illustrative acquisition channels',sub:'Traffic is illustrative; SEO dropdown fields require normalization.',
  values:[79,55,44,26,19],rows:s.keywords.map(x=>[x.name,format(x.clicks)+' clicks · '+x.ctr+'% CTR'])},
 strategy:{title:'4 KRAs → 12 KPIs → 15 action plans',sub:'Reported hierarchy sizes. Completion examples remain fictional.',
  values:[82,66,73,91],rows:[['Key result areas','4 reported'],['KPIs','12 reported'],['Action plans','15 reported'],['Chiefs’ initiatives','3 reported']]},
 calendar:{title:late.length+' overdue · '+up.length+' upcoming assignments',
  sub:'See upcoming deadlines and individual workload without switching workspaces.',
  values:s.people.map(p=>t.filter(x=>x.owner===p.id&&!x.done).length),rows:up.slice(0,7).map(x=>[x.title,shortDate(x.date)+' · '+x.ownerName])}
 };
 return result[id];
}
function insight(id,s,p){
 if(p.querySelector('.v35-insight'))return;
 const stats=p.querySelector('.stats');if(!stats||!info[id])return;
 const data=summaryData(id,s),numbers=data.values.filter(Number.isFinite),max=Math.max(1,...numbers);
 const bars=numbers.slice(0,8).map(x=>'<i style="height:'+Math.max(14,Math.round(x/max*100))+'%"></i>').join('');
 const el=document.createElement('section');el.className='v35-insight';
 el.setAttribute('aria-label','Decision summary');
 el.innerHTML='<div class="v35-insight-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 19h18M5 15l5-5 4 3 6-8"/></svg></div>'+
  '<div class="v35-insight-main"><div class="v35-insight-eyebrow">'+html(info[id][0])+'</div><strong>'+html(data.title)+'</strong>'+
  '<p>'+html(data.sub)+'</p></div><span class="v35-insight-spark" aria-hidden="true">'+bars+'</span>'+
  '<button type="button" class="v35-insight-action" data-v35-summary="'+html(id)+'">View details →</button>';
 stats.insertAdjacentElement('afterend',el);
}
function statCards(p){
 p.querySelectorAll('.stat').forEach(el=>{
  if(el.classList.contains('v35-stat'))return;
  const label=el.querySelector('.stat-head span')?.textContent?.trim()||'Summary';
  el.classList.add('v35-stat');el.tabIndex=0;el.setAttribute('role','button');
  el.setAttribute('aria-label','Explain '+label);el.dataset.v35Metric=label;
  el.insertAdjacentHTML('beforeend','<span class="v35-stat-affordance" aria-hidden="true">Details ↗</span>');
 });
}
function chartEnhancement(id,s,p){
 if(id!=='ads')return;
 p.querySelectorAll('.chartbars .barcol').forEach((el,i)=>{
  const c=s.campaigns[i];if(!c||el.dataset.v35Campaign)return;
  el.dataset.v35Campaign=String(c.index);el.tabIndex=0;el.setAttribute('role','button');
  el.setAttribute('aria-label',c.name+': '+peso(c.spend)+' spend, '+peso(c.sales)+' sales, '+c.roas.toFixed(2)+' ROAS. View campaign.');
  const tip=document.createElement('span');tip.className='v35-chart-tip';
  tip.setAttribute('aria-hidden','true');tip.innerHTML='<strong>'+html(c.name)+'</strong>'+
   'Spend: '+peso(c.spend)+'<br>Sales: '+peso(c.sales)+'<br>ROAS: '+c.roas.toFixed(2)+'×';
  el.append(tip);
 });
}
function galleryView(id,s,p){
 if(id!=='content')return;
 const tabs=p.querySelector('.section-intro .tabs');if(!tabs)return;
 let toggle=tabs.querySelector('[data-v35-gallery]');
 if(!toggle){toggle=document.createElement('button');toggle.type='button';toggle.className='tab';
  toggle.dataset.v35Gallery='1';toggle.textContent='Gallery';tabs.append(toggle);}
 toggle.classList.toggle('active',gallery);toggle.setAttribute('aria-pressed',String(gallery));
 if(!gallery)return;
 tabs.querySelectorAll('.tab:not([data-v35-gallery])').forEach(el=>{el.classList.remove('active');el.setAttribute('aria-pressed','false')});
 const board=p.querySelector('.kanban');if(board)board.hidden=true;
 const existing=p.querySelector('.v35-gallery-wrap');if(existing)return;
 const work=s.tasks.filter(x=>['Content','Production','Request'].includes(x.kind));
 const wrap=document.createElement('section');wrap.className='v35-gallery-wrap';
 wrap.innerHTML='<p class="v35-view-label">'+work.length+' fictional creative assignments · Choose an item for details</p>'+
  '<div class="v35-gallery">'+(work.length?work.map(t=>'<button type="button" class="v35-gallery-card" data-v35-task="'+t.id+'">'+
  '<span class="v35-gallery-art"><span class="v35-gallery-format">'+html(t.kind.toUpperCase())+'</span>'+
  '<span class="v35-gallery-symbol" aria-hidden="true">'+(t.kind==='Production'?'▶':t.kind==='Request'?'◇':'✳')+'</span></span>'+
  '<span class="v35-gallery-details"><strong>'+html(t.title)+'</strong>'+
  '<small>'+html(t.account)+' · '+html(t.platform)+' · '+shortDate(t.date)+'</small>'+
  '<span class="v35-gallery-foot"><span>'+html(t.ownerName)+'</span><span>'+html(t.displayStatus)+'</span></span>'+
  '<span class="progress-mini" role="meter" aria-valuenow="'+t.progress+'" aria-valuemin="0" aria-valuemax="100" aria-label="Work progress"><i style="width:'+t.progress+'%"></i></span>'+
  '</span></button>').join(''):'<div class="v35-empty">No creative assignments match the selected filters.</div>')+'</div>';
 tabs.closest('.section-intro')?.insertAdjacentElement('afterend',wrap);
}
function enhance(){
 const s=snapshot(),id=s.active,p=page();if(!p)return;
 document.body.classList.toggle('v35-dashboard',!document.body.classList.contains('md-settings-active'));
 if(!info[id])return;
 insight(id,s,p);statCards(p);chartEnhancement(id,s,p);galleryView(id,s,p);
}
function summaryDetails(id){
 const s=snapshot(),d=summaryData(id,s),reference=sourceMap[id]||'Source architecture';
 dialog('WORKSPACE INSIGHTS',d.title,info[id][0],
  '<div class="v35-definition">'+html(d.sub)+'</div>'+
  '<div class="v35-sourcebox"><b>Relevant reported source area</b><br>'+html(reference)+
  '<br>All assignment details are fictional. Reported source-table counts are not live.</div>'+
  (d.rows.length?infoTable(d.rows):'<div class="v35-empty">Nothing matches the selected filters.</div>')+
  '<div class="v35-modal-buttons"><button type="button" class="v35-button primary" data-v35-route="'+id+'">Return to '+html(info[id][0])+'</button></div>');
}
function routeFromResult(id,sub){
 const overlay=document.getElementById('overlay');overlay?.classList.remove('open');
 bridge.navigate(id,sub||undefined);
}
function useResult(type,ref){
 const overlay=document.getElementById('overlay');overlay?.classList.remove('open');
 if(type==='task'){bridge.task(ref);return}
 if(type==='person'){bridge.navigate('calendar','workload');bridge.person(ref);return}
 if(type==='campaign'){bridge.navigate('ads');document.querySelector('[data-campaign="'+ref+'"]')?.click();return}
 if(type==='post'){bridge.navigate('performance','organic');document.querySelector('[data-post="'+ref+'"]')?.click();return}
}
function keyActivate(e){
 const el=e.target.closest?.('.v35-stat,[data-v35-campaign]');
 if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();el.click();}
}
document.addEventListener('keydown',keyActivate,true);
document.addEventListener('click',e=>{
 if(e.target.closest('[data-content-view]'))gallery=false;
 const get=attr=>e.target.closest('['+attr+']');
 const galleryButton=get('data-v35-gallery');
 if(galleryButton){e.preventDefault();gallery=true;bridge.contentView('kanban');return}
 const metric=get('data-v35-metric');if(metric){e.preventDefault();explainMetric(metric);return}
 const sum=get('data-v35-summary');if(sum){e.preventDefault();summaryDetails(sum.dataset.v35Summary);return}
 const task=get('data-v35-task');if(task){e.preventDefault();useResult('task',task.dataset.v35Task);return}
 const person=get('data-v35-person');if(person){e.preventDefault();useResult('person',person.dataset.v35Person);return}
 const campaign=get('data-v35-campaign');if(campaign){e.preventDefault();useResult('campaign',campaign.dataset.v35Campaign);return}
 const post=get('data-v35-post');if(post){e.preventDefault();useResult('post',post.dataset.v35Post);return}
 const route=get('data-v35-route');if(route){e.preventDefault();routeFromResult(route.dataset.v35Route,route.dataset.v35Subtab);return}
},true);
const observer=new MutationObserver(mutations=>{
 if(mutations.some(r=>r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(x=>x.nodeType===1)))queue();
});
observer.observe(host,{childList:true,subtree:true});
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance()})}
queue();
})();
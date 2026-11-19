/* Media Dashboard V3.8 — Refined workspace layout based on selected screenshots.
 * Read-only presentation layer. No new search, authentication, editing,
 * fake tasks, AI chat, or connections. Existing modal and filters are reused.
 */
(()=>{
'use strict';
const bridge=window.MediaDashboardV35Bridge;
const overview=document.getElementById('overview');
const nav=document.getElementById('nav');
if(!bridge||!overview||!nav)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const tDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
const statusColors={'Overdue':'overdue','Blocked':'overdue','For review':'review','Completed':'done','Posted':'done','In progress':'progress','Scheduled':'scheduled','Not started':'neutral'};
let pending=false;
function buildNavigation(){
 if(nav.querySelector('.v38-nav-group'))return;
 const reports=nav.querySelector('[data-open="performance"]');
 if(!reports)return;
 const label=document.createElement('div');
 label.className='v38-nav-group';label.textContent='REPORTING';label.setAttribute('aria-hidden','true');
 nav.insertBefore(label,reports);
 const brand= document.querySelector('.sidebar .brand');
 brand?.setAttribute('title','Madhouse Design Studio · Media Dashboard');
}
function taskMarkup(t){
 const state=statusColors[t.displayStatus]||'neutral';
 return '<button type="button" class="v38-task-row" data-task="'+esc(t.id)+'" aria-label="View '+esc(t.title)+' assignment">'+
  '<span class="v38-task-dot '+state+'" aria-hidden="true"></span>'+
  '<span class="v38-task-main"><strong>'+esc(t.title)+'</strong><small>'+esc(t.ownerName)+' · '+esc(t.account)+'</small></span>'+
  '<span class="v38-task-priority '+(t.priority==='High'?'high':t.priority==='Medium'?'medium':'normal')+'">'+esc(t.priority||'Normal')+'</span>'+
  '<time class="v38-task-due">'+tDate(t.date)+'</time>'+
  '</button>';
}
function grouping(tasks){
 const groups=[
  ['Overdue',tasks.filter(t=>t.late&&!t.done)],
  ['In progress',tasks.filter(t=>!t.late&&!t.done&&(t.displayStatus==='In progress'||t.displayStatus==='Blocked'))],
  ['For review',tasks.filter(t=>!t.late&&t.displayStatus==='For review')],
  ['Upcoming',tasks.filter(t=>!t.done&&!t.late&&!['In progress','Blocked','For review'].includes(t.displayStatus))],
  ['Completed',tasks.filter(t=>t.done)]
 ];
 let n=0;
 const body=groups.map(([label,arr])=>{
  if(!arr.length)return '';
  const sorted=[...arr].sort((a,b)=>a.date.localeCompare(b.date));
  const max=label==='In progress'?3:label==='Upcoming'?2:label==='Completed'?1:2;
  n+=Math.min(sorted.length,max);
  return '<div class="v38-task-group"><div class="v38-task-group-heading">'+
    '<span class="v38-task-group-label '+(label==='Overdue'?'overdue':label==='In progress'?'in-progress':label==='For review'?'review':label==='Upcoming'?'upcoming':'complete')+'">'+esc(label)+'</span>'+
    '<small>'+arr.length+' '+(arr.length===1?'assignment':'assignments')+'</small></div>'+
    sorted.slice(0,max).map(taskMarkup).join('')+'</div>';
 }).join('');
 return '<section class="v38-task-sections" aria-label="Grouped creative work">'+
  '<div class="v38-task-legend" aria-hidden="true"><span>ASSIGNMENT</span><span>PRIORITY</span><span>DUE</span></div>'+
  (body||'<div class="empty">No fictional assignments match this selection.</div>')+
  '<div class="v38-widget-footer"><span>'+tasks.length+' matching fictional assignments · '+n+' shown</span>'+
  '<button type="button" data-v38-route="content">View content pipeline <span aria-hidden="true">↗</span></button></div></section>';
}
function projectsMarkup(tasks,filters){
 const names=['Madhouse','MIH','BTB'].filter(name=>filters.account==='All'||name===filters.account);
 const icons=['◆','◈','✦'];
 return '<div class="v38-account-grid">'+names.map(name=>{
  const all=tasks.filter(t=>t.account===name);
  const avg=all.length?Math.round(all.reduce((sum,t)=>sum+t.progress,0)/all.length):0;
  const active=all.filter(t=>!t.done).length;
  const i=['Madhouse','MIH','BTB'].indexOf(name);
  return '<button type="button" class="v38-account-card" data-v38-account="'+name+'" aria-label="Filter dashboard to '+name+'">'+
   '<span class="v38-account-symbol s'+i+'" aria-hidden="true">'+icons[i]+'</span>'+
   '<span class="v38-account-info"><strong>'+name+'</strong><small>'+all.length+' assignments · '+active+' active</small></span>'+
   '<span class="v38-account-score">'+(all.length?avg+'%':'—')+'</span>'+
   '<span class="v38-account-meter" aria-hidden="true"><i style="width:'+avg+'%"></i></span>'+
   '</button>';
 }).join('')+'</div>'+
 '<div class="v38-widget-footer"><span>Average assignment progress · fictional</span>'+
 '<button type="button" data-v38-route="performance">Performance <span aria-hidden="true">↗</span></button></div>';
}
function dateStrip(date,tasks){
 const end=new Date(date+'T12:00:00');
 const start=new Date(end);
 // For scoped months use the first Monday-like week so upcoming assignments remain visible.
 const list=Array.from({length:7},(_,i)=>{
   const day=new Date(start);day.setDate(start.getDate()+i);
   const iso=day.getFullYear()+'-'+String(day.getMonth()+1).padStart(2,'0')+'-'+String(day.getDate()).padStart(2,'0');
   const count=tasks.filter(t=>t.date===iso).length;
   return {iso,count,weekday:day.toLocaleDateString('en-US',{weekday:'short'}),day:day.getDate()};
 });
 return '<div class="v38-week-strip" role="group" aria-label="Seven-day demo assignment calendar">'+
 list.map((d,i)=>'<button type="button" class="v38-week-day '+(i===0?'selected':'')+'" data-v38-date="'+d.iso+'" aria-label="'+d.weekday+' '+d.day+', '+d.count+' assignments">'+
 '<span>'+d.weekday+'</span><strong>'+d.day+'</strong><i class="'+(d.count?'has-events':'')+'" aria-hidden="true"></i></button>').join('')+'</div>';
}
function teamCalendarMarkup(tasks,people,filters,calendar){
 const base=filters.period&&filters.period!=='All'?filters.period+'-01':calendar.selectedDay||'2026-11-19';
 const top=people.map(p=>({person:p,work:tasks.filter(t=>t.owner===p.id&&!t.done)}))
    .sort((a,b)=>b.work.length-a.work.length).slice(0,3);
 const relevant=tasks.filter(t=>!t.done&&t.date>=base).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,2);
 return '<div class="v38-calendar-head"><span>DEMO WEEK · '+tDate(base)+'</span>'+
  '<button type="button" data-v38-route="calendar">Full planner <span aria-hidden="true">↗</span></button></div>'+
  dateStrip(base,tasks)+
  '<div class="v38-team-heading"><b>Team workload</b><span>'+people.length+' fictional members</span></div>'+
  '<div class="v38-team-list">'+top.map(({person:p,work})=>
  '<button type="button" class="v38-person-row" data-person="'+esc(p.id)+'" aria-label="View '+esc(p.name)+' workload">'+
    '<span class="v38-person-avatar">'+esc(p.initials||p.name.slice(0,2))+'</span>'+
    '<span class="v38-person-meta"><strong>'+esc(p.name)+'</strong><small>'+esc(p.role)+'</small></span>'+
    '<span class="v38-person-count">'+work.length+' active</span></button>').join('')+
  '</div>'+
  (relevant.length?'<div class="v38-next-due"><span>UPCOMING</span>'+relevant.map(t=>
  '<button data-task="'+esc(t.id)+'" type="button"><strong>'+esc(t.title)+'</strong><small>'+tDate(t.date)+'</small></button>').join('')+'</div>':'')+
  '<div class="v38-widget-footer"><span>Fictional planning data</span><button type="button" data-v38-route="calendar" data-v38-tab="workload">All people ↗</button></div>';
}
function sectionByTitle(root,name){
 return [...root.querySelectorAll(':scope > .dashboardgrid > .panel')].find(p=>p.querySelector('.panel-header h3')?.textContent.trim()===name);
}
function rebuildOverview(){
 const hero=overview.querySelector(':scope > .hero');
 if(!hero||hero.dataset.v38Styled)return;
 hero.dataset.v38Styled='1';
 const snap=bridge.snapshot();
 const title=hero.querySelector('h2'),sub=hero.querySelector('p'),kicker=hero.querySelector('.hero-kicker');
 if(kicker)kicker.textContent='MEDIA STUDIO · FICTIONAL DATA';
 if(title)title.innerHTML='Your creative workspace.<span class="v38-highlight"> One clear view.</span>';
 if(sub)sub.textContent='Priorities, account activity, progress and deadlines—organized in one place.';
 const panelTask=sectionByTitle(overview,'Deadlines & priorities');
 const panelProjects=sectionByTitle(overview,'Work progress by account');
 const panelGoals=sectionByTitle(overview,'Work status distribution');
 const panelCalendar=sectionByTitle(overview,'People at a glance');
 if(panelTask){
   panelTask.classList.add('v38-panel-tasks');
   panelTask.querySelector('.panel-header h3').textContent='Creative assignments';
   panelTask.querySelector('.panel-header p').textContent='A focused look at work that needs attention';
   panelTask.querySelector('.panel-body').innerHTML=grouping(snap.tasks);
 }
 if(panelProjects){
  panelProjects.classList.add('v38-panel-projects');
  panelProjects.querySelector('.panel-header h3').textContent='Accounts & projects';
  panelProjects.querySelector('.panel-header p').textContent='Assignments and activity by brand';
  panelProjects.querySelector('.panel-body').innerHTML=projectsMarkup(snap.tasks,snap.filters);
 }
 if(panelGoals){
  panelGoals.classList.add('v38-panel-goals');
  panelGoals.querySelector('.panel-header h3').textContent='Production goals';
  panelGoals.querySelector('.panel-header p').textContent='Status distribution for the selected work';
 }
 if(panelCalendar){
  panelCalendar.classList.add('v38-panel-calendar');
  panelCalendar.querySelector('.panel-header h3').textContent='Calendar & team';
  panelCalendar.querySelector('.panel-header p').textContent='Upcoming work and individual ownership';
  panelCalendar.querySelector('.panel-body').innerHTML=teamCalendarMarkup(snap.tasks,snap.people,snap.filters,snap.calendar);
 }
}
function scan(){
 pending=false;
 buildNavigation();
 const active=overview.classList.contains('active');
 if(active)rebuildOverview();
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(scan)}
const pObserver=new MutationObserver(records=>{
 if(records.some(r=>r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1)))schedule();
});
pObserver.observe(overview,{subtree:true,childList:true});
const nObserver=new MutationObserver(records=>{
 if(records.some(r=>r.type==='childList'))schedule();
});
nObserver.observe(nav,{childList:true});
document.addEventListener('click',e=>{
 const route=e.target.closest('[data-v38-route]');
 if(route){
  e.preventDefault();
  bridge.navigate(route.dataset.v38Route,route.dataset.v38Tab||undefined);
  return;
 }
 const acct=e.target.closest('[data-v38-account]');
 if(acct){
  e.preventDefault();
  document.querySelector('[data-v36-account="'+acct.dataset.v38Account+'"]')?.click();
  return;
 }
 const day=e.target.closest('[data-v38-date]');
 if(day){
  e.preventDefault();
  bridge.navigate('calendar');
  bridge.selectDate(day.dataset.v38Date);
 }
});
document.body.classList.add('v38-workspace');
schedule();
})();
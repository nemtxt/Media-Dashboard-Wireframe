/* Media Dashboard V3.8 — clean, read-only workspace composition.
   This progressive view is generated exclusively from the existing fictional
   tasks and people already used by all seven dashboard screens.
   It does not create tasks, connect Airtable, or duplicate navigation/search. */
(()=>{
 'use strict';
 const bridge=window.MediaDashboardV35Bridge,root=document.getElementById('overview');
 if(!bridge||!root)return;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shortDate=iso=>new Date(iso+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
 const weekday=iso=>new Date(iso+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'});
 const isoDate=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 const addDays=(iso,delta)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+delta);return isoDate(d)};
 const icons={
  tasks:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6"/></svg>',
  accounts:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="8" height="13" rx="2"/><rect x="13" y="3" width="8" height="16" rx="2"/><path d="M6 10h2M16 8h2M16 12h2"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>',
  people:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 7a3 3 0 0 1 0 6M17 16a5 5 0 0 1 4 4"/></svg>'
 };
 let scheduled=false;
 const closed=new Set();
 function currentSnapshot(){return bridge.snapshot()}
 function taskRow(t){
  return '<button type="button" class="v38-task" data-task="'+escape(t.id)+'" aria-label="Preview '+escape(t.title)+', '+escape(t.displayStatus)+', due '+escape(shortDate(t.date))+'">'+
   '<span class="v38-taskdetails"><span class="v38-tasktitle">'+escape(t.title)+'</span>'+
   '<span class="v38-taskmeta">'+escape(t.kind)+' · '+escape(t.account)+' · '+escape(t.platform)+'</span></span>'+
   '<span class="v38-taskowner">'+escape(t.ownerName)+'</span>'+
   '<span class="v38-taskdate '+(t.late?'overdue':'')+'">'+escape(shortDate(t.date))+'</span></button>';
 }
 function taskGroup(id,title,category,list,limit=4){
  const collapsed=closed.has(id),count=list.length;
  return '<section class="v38-group" aria-label="'+escape(title)+' tasks">'+
   '<button type="button" class="v38-group-toggle" data-v38-group="'+id+'" aria-controls="v38-list-'+id+'" aria-expanded="'+!collapsed+'">'+
   '<span class="v38-group-label"><span class="v38-chevron" aria-hidden="true">⌄</span>'+
   '<i class="v38-statusdot '+category+'" aria-hidden="true"></i>'+escape(title)+
   ' <span class="v38-groupcount">'+count+' '+(count===1?'item':'items')+'</span></span></button>'+
   '<div id="v38-list-'+id+'" class="v38-groupbody" '+(collapsed?'hidden':'')+'>'+
   (count?list.slice(0,limit).map(taskRow).join(''):'<div class="v38-empty">No matching items</div>')+
   (count>limit?'<button type="button" class="v38-panelaction" data-open="calendar" data-subtab="deadlines">View '+(count-limit)+' more in deadlines</button>':'')+
   '</div></section>';
 }
 function createTaskPanel(tasks){
  const attention=tasks.filter(t=>!t.done&&(t.late||t.displayStatus==='Blocked'||t.displayStatus==='For review')).sort((a,b)=>a.date.localeCompare(b.date));
  const active=tasks.filter(t=>!t.done&&!attention.includes(t)&&t.displayStatus==='In progress').sort((a,b)=>a.date.localeCompare(b.date));
  const upcoming=tasks.filter(t=>!t.done&&!attention.includes(t)&&!active.includes(t)).sort((a,b)=>a.date.localeCompare(b.date));
  const complete=tasks.filter(t=>t.done).sort((a,b)=>b.date.localeCompare(a.date));
  return '<section class="v38-panel v38-tasks-panel" aria-labelledby="v38-task-title">'+
   '<div class="v38-panelhead"><div class="v38-paneltitle">'+icons.tasks+'<h3 id="v38-task-title">My team’s work</h3></div>'+
   '<button class="v38-panelaction" type="button" data-open="calendar" data-subtab="deadlines">All deadlines →</button></div>'+
   '<p class="v38-panelsub">Read-only tasks and assignments · '+tasks.length+' matching fictional records</p>'+
   '<div class="v38-tasktablehead"><span>Assignment</span><span>Owner</span><span>Due</span></div>'+
   taskGroup('attention','Needs attention','review',attention,5)+
   taskGroup('active','In progress','',active,5)+
   taskGroup('upcoming','Upcoming','upcoming',upcoming,5)+
   taskGroup('completed','Completed','completed',complete,3)+
   '</section>';
 }
 function createAccounts(tasks,s){
  const all=['Madhouse','MIH','BTB'];
  const names={Madhouse:'MH',MIH:'MI',BTB:'BT'};
  return '<section class="v38-panel" aria-labelledby="v38-accounts-title">'+
   '<div class="v38-panelhead"><div class="v38-paneltitle">'+icons.accounts+'<h3 id="v38-accounts-title">Accounts</h3></div>'+
   '<button type="button" class="v38-panelaction" data-open="content">Content →</button></div>'+
   '<div class="v38-accounts">'+all.map(name=>{
    const selected=s.filters.account==='All'||s.filters.account===name;
    const count=tasks.filter(t=>t.account===name).length;
    return '<button type="button" class="v38-account" data-v38-account="'+name+'" aria-label="View '+name+' account">'+
      '<span class="v38-accountmark">'+names[name]+'</span><span><strong>'+name+'</strong>'+
      '<small>'+(selected?count+' matching assignments':'Select to view assignments')+'</small></span></button>';
   }).join('')+
   '<button type="button" class="v38-account" data-v38-account="All" aria-label="View all accounts">'+
   '<span class="v38-accountmark">ALL</span><span><strong>All accounts</strong><small>Combined workspace</small></span></button></div></section>';
 }
 function createWeek(tasks,s){
  const anchor=(s.filters.period&&s.filters.period!=='All')?s.filters.period+'-01':s.today;
  const days=Array.from({length:7},(_,i)=>addDays(anchor,i));
  const upcoming=tasks.filter(t=>!t.done&&t.date>=anchor).sort((a,b)=>a.date.localeCompare(b.date));
  const next=upcoming[0];
  return '<section class="v38-panel v38-week-panel" aria-labelledby="v38-week-title">'+
   '<div class="v38-panelhead"><div class="v38-paneltitle">'+icons.calendar+'<h3 id="v38-week-title">Schedule</h3></div>'+
   '<button type="button" class="v38-panelaction" data-open="calendar">3-month planner →</button></div>'+
   '<p class="v38-panelsub">7-day preview from '+escape(shortDate(anchor))+' · fictional dates</p>'+
   '<div class="v38-calendarweek">'+days.map(day=>{
    const total=tasks.filter(t=>t.date===day).length;
    return '<button type="button" class="v38-date '+(day===anchor?'today ':'')+(total?'haswork':'')+'" data-v38-date="'+day+'" '+
     'aria-label="'+escape(shortDate(day))+(total?' '+total+' assignments':' no assignments')+'. Open calendar">'+
     '<small>'+escape(weekday(day))+'</small><b>'+escape(day.slice(8))+'</b></button>';
   }).join('')+'</div>'+
   '<div class="v38-weekfooter"><div><strong>'+escape(next?next.title:'No upcoming items')+'</strong>'+
   '<small>'+escape(next?shortDate(next.date)+' · '+next.ownerName:'Nothing due in the selected demo scope')+'</small></div>'+
   '<button class="v38-cta" type="button" data-open="calendar" data-subtab="deadlines">View</button></div></section>';
 }
 function createPeople(tasks,s){
  const list=s.people.map(p=>({id:p.id,name:p.name,initials:p.initials,role:p.role,
   assigned:tasks.filter(t=>t.owner===p.id&&!t.done).length}))
   .filter(p=>p.assigned>0).sort((a,b)=>b.assigned-a.assigned).slice(0,4);
  return '<section class="v38-panel" aria-labelledby="v38-people-title">'+
   '<div class="v38-panelhead"><div class="v38-paneltitle">'+icons.people+'<h3 id="v38-people-title">Team workload</h3></div>'+
   '<button type="button" class="v38-panelaction" data-open="calendar" data-subtab="workload">All people →</button></div>'+
   (list.length?'<div class="v38-people">'+list.map(p=>
    '<button type="button" class="v38-person" data-v38-person="'+escape(p.id)+'" aria-label="'+escape(p.name)+', '+p.assigned+' active tasks. View details">'+
    '<span class="v38-personface">'+escape(p.initials)+'</span><span><strong>'+escape(p.name)+'</strong>'+
    '<small>'+escape(p.role)+'</small></span><span class="v38-personcount">'+p.assigned+' open</span></button>').join('')+
    '</div>':'<div class="v38-empty">No active assignments match these filters.</div>')+
   '</section>';
 }
 function enhance(){
  if(!root.classList.contains('active'))return;
  const s=currentSnapshot(),hero=root.querySelector(':scope > .hero');
  if(!hero)return;
  document.body.classList.add('v38-ready');
  const expected=s.filters.account+'|'+s.filters.platform+'|'+s.filters.period+'|'+s.filters.query;
  const current=root.querySelector(':scope > .v38-workspace');
  if(current?.dataset.scope===expected)return;
  const title=hero.querySelector('h2');
  if(title)title.innerHTML='Your creative workspace.<br><span class="v38-accent">One clear view.</span>';
  const kicker=hero.querySelector('.hero-kicker');
  if(kicker)kicker.textContent='MEDIA DASHBOARD · DEMONSTRATION DATA';
  const sub=hero.querySelector('p');
  if(sub)sub.textContent='Track assignments, content, people and deadlines in one focused workspace.';
  if(current)current.remove();
  root.querySelector(':scope > .v38-summaryhead')?.remove();
  const board=document.createElement('div');
  board.className='v38-workspace';
  board.dataset.scope=expected;
  board.innerHTML='<div class="v38-maincol">'+createTaskPanel(s.tasks)+'</div>'+
   '<div class="v38-sidecol">'+createAccounts(s.tasks,s)+createWeek(s.tasks,s)+createPeople(s.tasks,s)+'</div>';
  hero.after(board);
  const stats=root.querySelector(':scope > .stats');
  if(stats){
    const heading=document.createElement('div');
    heading.className='v38-summaryhead';
    heading.innerHTML='<h2>Reporting overview</h2><small>Calculated from the selected fictional records</small>';
    stats.before(heading);
  }
 }
 function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance()})}
 root.addEventListener('click',e=>{
  const toggle=e.target.closest('[data-v38-group]');
  if(toggle){
   e.preventDefault();
   const name=toggle.dataset.v38Group;
   const collapsed=toggle.getAttribute('aria-expanded')==='true';
   toggle.setAttribute('aria-expanded',String(!collapsed));
   const body=document.getElementById('v38-list-'+name);
   if(body)body.hidden=collapsed;
   if(collapsed)closed.add(name);else closed.delete(name);
   return;
  }
  const a=e.target.closest('[data-v38-account]');
  if(a){e.preventDefault();document.querySelector('[data-v36-account="'+a.dataset.v38Account+'"]')?.click();return}
  const d=e.target.closest('[data-v38-date]');
  if(d){
   e.preventDefault();
   bridge.selectDate(d.dataset.v38Date);
   bridge.navigate('calendar');
   return;
  }
  const p=e.target.closest('[data-v38-person]');
  if(p){e.preventDefault();bridge.person(p.dataset.v38Person);return}
 },true);
 const observer=new MutationObserver(records=>{
  if(records.some(r=>r.type==='childList'&&[...r.addedNodes,...r.removedNodes]
    .some(n=>n.nodeType===1&&(n.classList?.contains('hero')||n.classList?.contains('stats')))))queue();
 });
 observer.observe(root,{childList:true});
 // Renderers for filters can also update a subtree without changing identity;
 // listen for original control changes once, rather than creating new filters.
 ['account','platform','reportPeriod','search'].forEach(id=>
  document.getElementById(id)?.addEventListener(id==='search'?'input':'change',queue));
 window.MediaDashboardV38=Object.freeze({version:'3.8.0',mode:'fictional-read-only',palette:'unchanged'});
 queue();
})();
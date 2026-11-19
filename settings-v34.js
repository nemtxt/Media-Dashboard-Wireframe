/* Media Dashboard v3.4 — client-side settings and reported Airtable architecture.
   No Airtable access or credentials. Persistent state is local display preferences only. */
(()=>{
'use strict';
const root=document.getElementById('settings');
if(!root)return;
const PREF_KEY='media-dashboard-v34-prefs';
const defaults={density:'comfortable',text:'standard',contrast:false,calm:false,largeTargets:false,links:false};
const AREAS=[
 ['Content Production','Content scheduling, multimedia requests and episodic production'],
 ['Organic Post Performance','Post-level metrics, 24-hour and seven-day results'],
 ['Social Page Performance','Platform growth, monthly consolidation and benchmarks'],
 ['Paid Ads','Campaign results and attribution measures'],
 ['Website & SEO','Traffic, channels, pages and keyword visibility'],
 ['Strategy & Operations','Objective tree, initiatives, operations and tasks'],
 ['Reference','Guides and attached documentation']
];
const TABLES=[
 ['Creatives Content Tracker','Content Production',596,'Content pieces, status, format, platform, assignee, posting date and account'],
 ['MadSerye Productions','Content Production',24,'Episodes and production tasks'],
 ['Multimedia artist assistance','Content Production',12,'Internal creative assistance requests'],
 ['Organic Performance Tracker','Organic Post Performance',413,'Posted content with 24-hour and seven-day grades'],
 ['24H Performance Tracker','Organic Post Performance',246,'24-hour post metrics submissions'],
 ['7Days Performance Tracker','Organic Post Performance',69,'Seven-day post metrics submissions'],
 ['📱 Soc Med Page Performance','Social Page Performance',263,'Weekly platform/account performance entries'],
 ['Monthly Marketing Metrics','Social Page Performance',24,'Central monthly rollup and consolidated scores'],
 ['Scoring BenchMark','Social Page Performance',12,'2026 monthly scoring targets'],
 ['Ad Campaigns','Paid Ads',11,'Campaign spend, sales, ROAS, CPM, CPC and CPR'],
 ['Ad Campaigns Results','Paid Ads',27,'Individual advertising results'],
 ['📈 Campaign Results','Paid Ads',8,'Legacy or template records'],
 ['Organic Campaigns Results','Paid Ads',5,'Legacy or template records'],
 ['MH Website Metrics','Website & SEO',39,'Weekly website sessions, visitors and bounce rate'],
 ['Page and Screen','Website & SEO',7,'Website page/screen performance'],
 ['Traffic Acquisition','Website & SEO',7,'Traffic acquisition channels'],
 ['SEO Keywords Monitoring','Website & SEO',69,'Keywords, clicks, CTR and location/select values'],
 ['KRA','Strategy & Operations',4,'Key result areas'],
 ['KPI','Strategy & Operations',12,'Performance indicators linked to KRAs'],
 ['Action Plan','Strategy & Operations',15,'Execution tasks and objective completion'],
 ["Chiefs' Initiatives",'Strategy & Operations',3,'Leadership media initiatives'],
 ['Projects','Strategy & Operations',0,'Currently empty project register'],
 ['Sub-Tasks','Strategy & Operations',0,'Currently empty subtask register'],
 ['Media Team SOE','Strategy & Operations',4,'Standard operating procedures'],
 ['User guide','Reference',3,'Reference guides and attachments']
].map(([name,area,records,description])=>({
 name,area,records,description,
 status:records===0?'empty':['📈 Campaign Results','Organic Campaigns Results'].includes(name)?'legacy':area==='Reference'?'reference':'reported'
}));
const ISSUES=[
 {title:'Grading formula thresholds',risk:'Accuracy',description:'Several supplied examples check thresholds in the wrong order. Some 7-day and engagement grades may be unreachable or compressed.',action:'Display original grades as reported; defer any corrected score until full formulas and benchmarks are validated.'},
 {title:'SEO keyword field types',risk:'Normalization',description:'Clicks, CTR and Location were reported as mixed single-select values, including numbers, percentages and text.',action:'Parse numeric values carefully in a future read-only adapter; preserve original values for audit.'},
 {title:'Missing record names',risk:'Completeness',description:'Ad Campaigns Results, Action Plan and some 24H entries reportedly have blank titles.',action:'Use a clearly marked “Untitled record” with source record ID once available. Do not fabricate names.'},
 {title:'Incomplete report dates',risk:'Timeliness',description:'Blank dates can produce labels like “1st Week” or “January” without a real reporting period.',action:'Show “Date unavailable” or “Unscheduled”; never infer a missing calendar date.'},
 {title:'Old campaign templates',risk:'Relevance',description:'Some campaign tables include legacy template entries reportedly created in 2016.',action:'Keep them documented and excluded from current-period KPIs until source provenance is verified.'},
 {title:'Duplicate or copied fields',risk:'Schema complexity',description:'The supplied summary notes leftover copy fields alongside core metrics.',action:'Document canonical fields when the field dictionary becomes available. Leave Airtable unchanged.'}
];
const prefs=(()=>{
 try{
  const p=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');
  return {...defaults,...Object.fromEntries(Object.entries(p).filter(([k])=>Object.hasOwn(defaults,k)))};
 }catch(_){return {...defaults}}
})();
let tab='appearance',catalogOpen=false,query='',areaFilter='all';
const escapeText=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function persist(){try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs))}catch(_){}}
function applyPrefs(){
 const body=document.body;
 body.classList.toggle('md-density-compact',prefs.density==='compact');
 body.classList.toggle('md-text-large',prefs.text==='large');
 body.classList.toggle('md-high-contrast',!!prefs.contrast);
 body.classList.toggle('md-calm',!!prefs.calm);
 body.classList.toggle('md-large-targets',!!prefs.largeTargets);
 body.classList.toggle('md-links',!!prefs.links);
 persist();
}
applyPrefs();
const rows=(title,description,control)=>'<div class="md-settings-row"><div class="md-settings-row-text"><b>'+title+'</b><p>'+description+'</p></div>'+control+'</div>';
const selector=(key,items)=>'<select class="md-settings-select" data-md-pref="'+key+'" aria-label="'+(key==='density'?'Display density':'Text size')+'">'+items.map(([v,label])=>'<option value="'+v+'"'+(prefs[key]===v?' selected':'')+'>'+label+'</option>').join('')+'</select>';
const switcher=(key,aria,checked,disabled=false)=>'<button type="button" role="switch" class="md-settings-switch" aria-label="'+aria+'" aria-checked="'+!!checked+'"'+(disabled?' disabled aria-disabled="true"':'')+' data-md-toggle="'+key+'"></button>';
const sectionHead=(title,description)=>'<div class="md-settings-heading"><div><h3>'+title+'</h3><p>'+description+'</p></div></div>';
const note=(body,warn=false)=>'<div class="md-settings-note'+(warn?' warning':'')+'">'+body+'</div>';
function appearance(){
 const motionToggle=document.getElementById('motionToggle');
 const enabled=motionToggle?.getAttribute('aria-pressed')==='true';
 return sectionHead('Appearance & motion','Customize only how this prototype is presented. All monitoring data stays visible and unchanged.')+
 rows('Information density','Choose comfortable spacing for presentation or compact spacing for frequent monitoring.',selector('density',[['comfortable','Comfortable'],['compact','Compact']]))+
 rows('Calm workspace','Reduce decorative backgrounds and ambient elements while preserving charts and records.',switcher('calm','Calm workspace',prefs.calm))+
 rows('Motion effects','Play or pause optional motion graphics throughout the dashboard; linked to the existing header control.',
   switcher('motion','Enable decorative motion',enabled,!!motionToggle?.disabled))+
 note('Your display preferences are stored in this browser only. They do not update Airtable, change shared data, or affect other users.')+
 '<div class="md-settings-actions"><button class="md-settings-btn" type="button" data-md-reset>Reset display preferences</button></div>';
}
function accessibility(){
 const motionBlocked=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 return sectionHead('Accessibility preferences','Readable, keyboard-friendly controls designed for both technical and non-technical viewers.')+
 rows('Text size','Increase labels, table text, and supporting descriptions.',selector('text',[['standard','Standard'],['large','Larger text']]))+
 rows('Higher contrast','Strengthen panel borders and secondary text for easier distinction.',switcher('contrast','Use higher contrast',prefs.contrast))+
 rows('Larger controls','Increase minimum button and selection targets where possible.',switcher('largeTargets','Use larger controls',prefs.largeTargets))+
 rows('Emphasize text actions','Underline navigation-style links to make actions easier to identify.',switcher('links','Underline text actions',prefs.links))+
 note(motionBlocked?'Your device currently requests reduced motion. Optional animation is disabled regardless of the dashboard Motion control.':'The dashboard supports visible focus indicators, keyboard navigation, centered detail dialogs and a manual Motion on/off control.')+
 note('Accessibility improvements are designed toward WCAG 2.2 AA principles, but have not been certified through a full screen-reader and physical-device audit.',true);
}
function mini(label,value){return '<div class="md-settings-mini"><strong>'+value+'</strong><span>'+label+'</span></div>'}
function arch(){
 const total=TABLES.reduce((a,t)=>a+t.records,0);
 return sectionHead('Airtable source architecture','Reported Media base inventory, organized by function. This is a read-only reference from the supplied architecture summary, not a live Airtable connection.')+
 '<div class="md-settings-mini-grid">'+mini('Reported tables','25')+mini('Reported interfaces','11')+mini('Interface pages / dashboards','31 / 13')+mini('Approximate total records','~1,900')+'</div>'+
 note('Reported dimensions: <b>Madhouse, MIH, BTB</b> accounts; primarily Facebook, Instagram and TikTok, with some LinkedIn and YouTube; weekly, monthly and yearly periods.')+
 '<div class="md-settings-area-grid">'+AREAS.map(([name,description])=>{
  const items=TABLES.filter(t=>t.area===name);
  return '<div class="md-settings-area"><h4>'+escapeText(name)+' <small>'+items.length+' tables</small></h4><p>'+escapeText(description)+'</p></div>';
 }).join('')+'</div>'+
 '<div class="md-settings-actions"><button type="button" class="md-settings-btn primary" data-md-catalog aria-expanded="'+catalogOpen+'">'+(catalogOpen?'Hide table directory':'Browse all 25 tables')+'</button><button type="button" class="md-settings-btn" data-open="sources">Open relationship map</button></div>'+
 '<div id="md-catalog-holder">'+(catalogOpen?catalog():'')+'</div>'+
 '<div class="md-settings-divider"></div><div class="md-settings-heading"><div><h3>How source areas relate</h3><p>High-level link structure from the supplied readout. Exact field-to-field joins require the source field dictionary.</p></div></div>'+
 '<div class="md-settings-linkgraph">'+
 '<div class="md-settings-chain"><b>Creative production</b> → Organic Performance → 24H / 7Days trackers</div>'+
 '<div class="md-settings-chain"><b>Monthly Marketing Metrics</b> consolidates social page and website reporting with account/platform summaries.</div>'+
 '<div class="md-settings-chain"><b>Campaigns</b> → Campaign Results. <b>KRA</b> → KPI → Action Plan.</div>'+
 '</div>'+
 note('The reported Airtable interface link points to the “Content Type” list page in “Creatives Calendar” and reads Creatives Content Tracker. No schema synchronization is configured in this prototype.')+
 '<p class="md-settings-foot">Individual record counts come from the shared readout; totals may differ because the report describes approximately 1,900 records. No actual field dictionary or source records were fetched for this settings update.</p>';
}
function catalog(){
 return '<div class="md-settings-divider"></div>'+
 '<div class="md-settings-catalog-toolbar"><div class="md-settings-field"><label for="md-catalog-search">Find table or metric</label><input id="md-catalog-search" type="search" placeholder="Search 25 reported tables" autocomplete="off" value="'+escapeText(query)+'"></div>'+
 '<div class="md-settings-field"><label for="md-catalog-area">Workstream</label><select id="md-catalog-area"><option value="all">All workstreams</option>'+
 AREAS.map(([a])=>'<option value="'+escapeText(a)+'"'+(areaFilter===a?' selected':'')+'>'+escapeText(a)+'</option>').join('')+'</select></div></div>'+
 '<div aria-live="polite" id="md-catalog-count" class="md-settings-catalog-count"></div>'+
 '<div class="md-settings-table-wrap"><table class="md-settings-table"><thead><tr><th>Source table</th><th>Area</th><th>Rows*</th><th>Role</th><th>Condition</th></tr></thead><tbody id="md-catalog-rows"></tbody></table></div>'+
 '<p class="md-settings-foot">*Reported record counts; not fresh or verified against Airtable. Legacy and empty tables remain documented without being mixed into active KPI summaries.</p>';
}
function filtered(){
 const q=query.toLowerCase().trim();
 return TABLES.filter(t=>(areaFilter==='all'||t.area===areaFilter)&&(!q||(t.name+' '+t.description+' '+t.area).toLowerCase().includes(q)));
}
function fillCatalog(){
 const body=document.getElementById('md-catalog-rows');if(!body)return;
 const list=filtered();
 body.innerHTML=list.map(t=>'<tr><td><b>'+escapeText(t.name)+'</b></td><td>'+escapeText(t.area)+'</td><td>'+t.records.toLocaleString('en-US')+'</td><td>'+escapeText(t.description)+'</td><td><span class="md-settings-tag '+t.status+'">'+({reported:'Reported',legacy:'Legacy',empty:'Empty',reference:'Reference'}[t.status])+'</span></td></tr>').join('')||
 '<tr><td colspan="5" class="md-settings-empty">No tables match this search. Clear the filters to browse the reported inventory.</td></tr>';
 const count=document.getElementById('md-catalog-count');
 if(count)count.textContent=list.length+' of 25 tables shown';
}
function health(){
 return sectionHead('Data quality & reporting safeguards','Known issues from the reported Airtable architecture. No source data is changed or silently corrected.')+
 '<div class="md-settings-quality">'+ISSUES.map(i=>'<div class="md-settings-issue"><div><strong>'+escapeText(i.risk)+'</strong></div><div><strong>'+escapeText(i.title)+'</strong><p>'+escapeText(i.description)+'</p><small>Display policy: '+escapeText(i.action)+'</small></div></div>').join('')+'</div>'+
 '<div class="md-settings-divider"></div>'+
 sectionHead('Technical diagnostics','A clear distinction between this GitHub Pages wireframe and a production reporting integration.')+
 '<div class="md-settings-tech">'+[
 ['Delivery','Static GitHub Pages · HTML, CSS and JavaScript'],
 ['Data mode','Fictional demonstration · no live Airtable connection'],
 ['Source authority','User-provided Claude architecture summary'],
 ['Field dictionary','Not included in this repository / not independently inspected'],
 ['Sync status','No refresh, polling or write-back configured'],
 ['Preferences','Browser-local only · no account or database changes'],
 ['Animations','CSS + version-pinned Anime.js, Motion and Animate.css'],
 ['Access controls','No sign-in or permission configuration in this prototype']
 ].map(([key,value])=>'<div class="md-settings-tech-item"><small>'+escapeText(key)+'</small><strong>'+escapeText(value)+'</strong></div>').join('')+'</div>'+
 note('For real deployment, route Airtable reads through a secured service or authorized connector. Never embed private Airtable API tokens in public GitHub Pages source code.',true)+
 '<div class="md-settings-actions"><button type="button" class="md-settings-btn" data-md-copy>Copy architecture summary</button><a class="md-settings-btn" href="https://github.com/nemtxt/Media-Dashboard-Wireframe" target="_blank" rel="noopener noreferrer">View repository</a></div>';
}
const tabs=[
 ['appearance','Appearance','Visual'],
 ['accessibility','Accessibility','Reading'],
 ['architecture','Airtable Architecture','25 tables'],
 ['health','Data & System Health','Read-only']
];
function render(){
 root.innerHTML='<div class="md-settings">'+
 '<div class="md-settings-intro"><div><div class="md-settings-kicker">WORKSPACE / PREFERENCES</div><h2>Make the dashboard work for you.</h2><p>Control your viewing experience and inspect the Media base architecture without crowding the operational dashboards.</p></div>'+
 '<div class="md-settings-status"><b><i class="md-settings-dot"></i> Demonstration mode</b><small>No Airtable sync or edits</small></div></div>'+
 '<div class="md-settings-shell"><nav class="md-settings-nav" role="tablist" aria-label="Settings categories">'+
 tabs.map(([key,label,hint])=>'<button type="button" role="tab" data-md-tab="'+key+'" aria-selected="'+(tab===key)+'" aria-controls="md-settings-panel" id="md-settings-tab-'+key+'"><span>'+label+'</span><span class="md-settings-tab-count">'+hint+'</span></button>').join('')+
 '</nav><section class="md-settings-section" id="md-settings-panel" role="tabpanel" aria-labelledby="md-settings-tab-'+tab+'">'+
 (tab==='appearance'?appearance():tab==='accessibility'?accessibility():tab==='architecture'?arch():health())+
 '</section></div>'+
 '<div class="md-settings-credit" aria-label="Development credit">'+
 '<span class="md-settings-dev-text"><small>DEVELOPED BY</small><strong>NemDev</strong></span>'+
 '</div></div>';
 if(catalogOpen&&tab==='architecture')fillCatalog();
}
root.addEventListener('click',e=>{
 const t=e.target.closest('[data-md-tab]');if(t){
  tab=t.dataset.mdTab;
  if(!tabs.some(x=>x[0]===tab))tab='appearance';
  render();
  document.getElementById('md-settings-tab-'+tab)?.focus();
  return;
 }
 const toggle=e.target.closest('[data-md-toggle]');if(toggle){
  const key=toggle.dataset.mdToggle;
  if(key==='motion'){
   const btn=document.getElementById('motionToggle');if(!btn||btn.disabled)return;
   btn.click();render();document.querySelector('[data-md-toggle="motion"]')?.focus();return;
  }
  if(!['calm','contrast','largeTargets','links'].includes(key))return;
  prefs[key]=!prefs[key];applyPrefs();render();
  document.querySelector('[data-md-toggle="'+key+'"]')?.focus();return;
 }
 if(e.target.closest('[data-md-reset]')){
  Object.assign(prefs,defaults);applyPrefs();
  const on=document.getElementById('motionToggle');
  if(on&&!on.disabled&&on.getAttribute('aria-pressed')==='false')on.click();
  render();document.querySelector('[data-md-reset]')?.focus();return;
 }
 const catalog=e.target.closest('[data-md-catalog]');
 if(catalog){
  catalogOpen=!catalogOpen;render();
  document.querySelector('[data-md-catalog]')?.focus();return;
 }
 if(e.target.closest('[data-md-copy]')){
  const text=['Media Dashboard Airtable architecture (reported summary)','25 tables, approximately 1,900 records; 11 interfaces; 31 pages (13 dashboards).',
   'Static read-only wireframe; Airtable not connected.','',
   ...AREAS.flatMap(([a])=>[a,...TABLES.filter(t=>t.area===a).map(t=>' - '+t.name+' ('+t.records+' reported rows)')])].join('\n');
  const btn=e.target.closest('[data-md-copy]');
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>{
   btn.textContent='Copied summary';setTimeout(()=>{if(btn.isConnected)btn.textContent='Copy architecture summary'},1600)
  }).catch(()=>{btn.textContent='Copy unavailable'});
  else btn.textContent='Copy unavailable';
 }
});
root.addEventListener('keydown',e=>{
 const current=e.target.closest('[data-md-tab]');
 if(!current || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
 e.preventDefault();
 const all=tabs.map(x=>x[0]),at=all.indexOf(current.dataset.mdTab);
 const next=e.key==='Home'?0:e.key==='End'?all.length-1:
  (at+((e.key==='ArrowRight'||e.key==='ArrowDown')?1:-1)+all.length)%all.length;
 tab=all[next];render();
 document.getElementById('md-settings-tab-'+tab)?.focus();
});
root.addEventListener('change',e=>{
 const inp=e.target.closest('[data-md-pref]');if(inp){
  const key=inp.dataset.mdPref;
  if(key==='density'&&['comfortable','compact'].includes(inp.value))prefs.density=inp.value;
  if(key==='text'&&['standard','large'].includes(inp.value))prefs.text=inp.value;
  applyPrefs();
  return;
 }
 if(e.target.id==='md-catalog-area'){areaFilter=e.target.value;fillCatalog()}
});
root.addEventListener('input',e=>{
 if(e.target.id==='md-catalog-search'){query=e.target.value;fillCatalog()}
});
window.MediaDashboardSettings={render,tableCount:TABLES.length,readOnly:true,getPreferences:()=>({...prefs})};
})();

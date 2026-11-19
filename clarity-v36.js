/* Media Dashboard V3.6 — scope switcher and overview clarity.
 * Keeps legacy select values and change events as the single source of
 * truth so all seven existing dashboard views use identical filtering.
 * No Airtable access, data mutation, or external dependencies. */
(() => {
  'use strict';
  const account = document.getElementById('account');
  const platform = document.getElementById('platform');
  const reset = document.getElementById('resetfilters');
  const search = document.getElementById('search');
  const heading = document.querySelector('.content > .pageheading');
  const content = document.querySelector('.content');
  if (!account || !platform || !reset || !heading || !content) return;

  const accounts = [
    ['All','All accounts'],
    ['Madhouse','Madhouse'],
    ['MIH','MIH'],
    ['BTB','BTB']
  ];
  const platforms = [
    ['All','All platforms'],
    ['Facebook','Facebook'],
    ['Instagram','Instagram'],
    ['TikTok','TikTok']
  ];
  const escapeHTML = v => String(v).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const makeOptions = (kind, values) => values.map(([value,label]) =>
    '<button type="button" class="v36-scope-option" data-v36-'+kind+'="'+escapeHTML(value)+'" '+
    'aria-label="'+escapeHTML(kind === 'account' ? 'View '+label : 'Filter by '+label)+'" '+
    'aria-pressed="false">'+escapeHTML(label)+'</button>'
  ).join('');

  const bar = document.createElement('section');
  bar.id = 'v36Scope';
  bar.className = 'v36-scopebar';
  bar.setAttribute('aria-label','Dashboard viewing scope');
  bar.innerHTML =
    '<div class="v36-scopegroup" role="group" aria-label="Select account">'+
      '<span class="v36-scope-label">ACCOUNT</span>'+
      '<div class="v36-scope-options">'+makeOptions('account',accounts)+'</div>'+
    '</div>'+
    '<span class="v36-scope-separator" aria-hidden="true"></span>'+
    '<div class="v36-scopegroup" role="group" aria-label="Select platform">'+
      '<span class="v36-scope-label">PLATFORM</span>'+
      '<div class="v36-scope-options">'+makeOptions('platform',platforms)+'</div>'+
    '</div>'+
    '<div class="v36-scope-suffix">'+
      '<span class="v36-scope-status" id="v36ScopeStatus" aria-live="polite">All accounts · All platforms</span>'+
      '<button type="button" class="v36-clear" id="v36Clear" hidden>Clear filters</button>'+
    '</div>';

  // Build before hiding the standard selects: they are a no-JS fallback and
  // remain the working filter state for all existing page renderers.
  heading.insertAdjacentElement('afterend',bar);
  document.body.classList.add('v36-ready');
  window.MediaDashboardV36 = Object.freeze({
    version:'3.6.0',
    readOnly:true,
    scope:() => ({account:account.value,platform:platform.value,query:search?.value||''})
  });

  function hasOption(select,value) {
    return [...select.options].some(o => o.value === value);
  }

  function currentState() {
    return {
      account:account.value,
      platform:platform.value,
      query:(search?.value||'').trim()
    };
  }

  function syncButtons() {
    const state = currentState();
    bar.querySelectorAll('[data-v36-account]').forEach(button => {
      const selected = button.dataset.v36Account === state.account;
      button.setAttribute('aria-pressed',String(selected));
      button.setAttribute('data-selected',String(selected));
    });
    bar.querySelectorAll('[data-v36-platform]').forEach(button => {
      const selected = button.dataset.v36Platform === state.platform;
      button.setAttribute('aria-pressed',String(selected));
      button.setAttribute('data-selected',String(selected));
    });
    const a = state.account === 'All' ? 'All accounts' : state.account;
    const p = state.platform === 'All' ? 'All platforms' : state.platform;
    bar.querySelector('#v36ScopeStatus').textContent = a+' · '+p;
    bar.querySelector('#v36Clear').hidden =
      state.account === 'All' && state.platform === 'All' && !state.query;
  }

  function writeURL() {
    try {
      const url = new URL(location.href);
      for(const [key,value] of [['account',account.value],['platform',platform.value]]) {
        if(value === 'All') url.searchParams.delete(key);
        else url.searchParams.set(key,value);
      }
      history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    } catch (_) { /* file-based previews may not allow history mutation */ }
  }

  function changeScope(kind,value) {
    const select = kind === 'account' ? account : platform;
    if (!hasOption(select,value)) return;
    if (select.value === value) return;
    select.value = value;
    select.dispatchEvent(new Event('change',{bubbles:true}));
    syncButtons();
    writeURL();
  }

  bar.addEventListener('click',e => {
    const a = e.target.closest('[data-v36-account]');
    if(a) { changeScope('account',a.dataset.v36Account);return; }
    const p = e.target.closest('[data-v36-platform]');
    if(p) { changeScope('platform',p.dataset.v36Platform);return; }
    if(e.target.closest('#v36Clear')) {
      reset.click();
      syncButtons();
      writeURL();
    }
  });

  bar.addEventListener('keydown',e => {
    const current = e.target.closest('.v36-scope-option');
    if(!current || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    const options = [...current.parentElement.querySelectorAll('.v36-scope-option')];
    const i = options.indexOf(current);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? options.length-1 :
      (i + (e.key === 'ArrowRight'?1:-1) + options.length) % options.length;
    e.preventDefault();
    options[next].focus();
    options[next].click();
  });

  for(const control of [account,platform]) {
    control.addEventListener('change',()=> {
      syncButtons();
      writeURL();
    });
  }
  search?.addEventListener('input',syncButtons);
  reset.addEventListener('click',()=>{syncButtons();writeURL()});

  // Shareable links: ?account=MIH&platform=TikTok. Preserve the existing
  // ?intro=0 / ?intro=1 behavior used by the cinematic splash screen.
  function readURL() {
    try {
      const p = new URLSearchParams(location.search);
      let updated=false;
      for (const [key,control] of [['account',account],['platform',platform]]) {
        const value = p.get(key);
        const next = value && hasOption(control,value) ? value : 'All';
        if(control.value !== next) { control.value=next;updated=true; }
      }
      if(updated)account.dispatchEvent(new Event('change',{bubbles:true}));
    } catch (_) {}
    syncButtons();
  }

  // Only refine copy and visual hierarchy. Keep existing summary counts and
  // all interactive data on the page, including the seven workspaces.
  function simplifyOverview() {
    const hero = document.querySelector('#overview .hero');
    if(hero && !hero.dataset.v36Copy) {
      hero.dataset.v36Copy='true';
      const kicker = hero.querySelector('.hero-kicker');
      const title = hero.querySelector('h2');
      const sub = hero.querySelector('p');
      if(kicker) kicker.textContent='MEDIA WORKSPACE / NOVEMBER 2026';
      if(title) title.innerHTML='Creative work.<br>One clear view.';
      if(sub) sub.textContent='Track content, people, performance and deadlines without the clutter.';
    }
    const ribbon = document.querySelector('.v35-ribbon');
    if(ribbon && !ribbon.dataset.v36Copy) {
      ribbon.dataset.v36Copy='true';
      const label = ribbon.querySelector('.v35-ribbon-label');
      if(label)label.textContent='QUICK ACTIONS';
    }
  }

  // refinement-v35.js may insert its contextual ribbon on the next frame.
  // Keep the viewing scope directly under the current page title.
  let pending=false;
  function flush() {
    pending=false;
    if(heading.nextElementSibling !== bar) heading.after(bar);
    simplifyOverview();
    syncButtons();
  }
  function queue() {
    if(pending)return;
    pending=true;
    requestAnimationFrame(flush);
  }
  const observer = new MutationObserver(records => {
    if(records.some(r => r.type === 'childList' &&
      [...r.addedNodes,...r.removedNodes].some(n => n.nodeType === 1))) queue();
  });
  observer.observe(content,{childList:true,subtree:false});
  observer.observe(document.getElementById('overview'),{childList:true});
  readURL();
  queue();
  window.addEventListener('popstate',readURL);

  // Reshape the original vertical task preview into a landscape arrangement.
  // Move existing DOM elements rather than generating new record values:
  // the same buttons, source fields and read-only data remain intact.
  const modalBody = document.getElementById('drawerbody');
  const modalOverlay = document.getElementById('overlay');
  function compactWorkPreview() {
    if(!modalBody || !modalOverlay?.classList.contains('open'))return;
    if(document.getElementById('drawer-kicker')?.textContent.trim()!=='WORK DETAIL')return;
    if(modalBody.querySelector('.v36-detail-layout'))return;
    const hero=modalBody.querySelector(':scope > .drawer-hero');
    const focus=modalBody.querySelector(':scope > .modal-focus');
    const fields=[...modalBody.querySelectorAll(':scope > .kv')];
    const progress=[...modalBody.children].find(el=>el.querySelector?.('.progressrow'));
    const relatedTitle=[...modalBody.children].find(el=>el.tagName==='H3');
    const related=modalBody.querySelector(':scope > .drawer-tasks');
    if(!hero||!focus||!fields.length||!progress)return;

    const layout=document.createElement('div');
    layout.className='v36-detail-layout';
    const main=document.createElement('section');
    main.className='v36-detail-main';
    main.setAttribute('aria-label','Assignment details');
    const summary=document.createElement('div');
    summary.className='v36-detail-summary';
    hero.classList.add('v36-detail-thumb');
    focus.classList.add('v36-detail-status');
    focus.style.margin='0';
    summary.append(hero,focus);
    const fieldGrid=document.createElement('div');
    fieldGrid.className='v36-detail-meta';
    fields.forEach(field=>fieldGrid.append(field));
    main.append(summary,fieldGrid);

    const side=document.createElement('aside');
    side.className='v36-detail-side';
    side.setAttribute('aria-label','Work progress and related assignments');
    progress.classList.add('v36-detail-progress');
    progress.style.marginTop='0';
    side.append(progress);
    if(relatedTitle||related){
      const relatedPanel=document.createElement('section');
      relatedPanel.className='v36-detail-related';
      if(relatedTitle){
        relatedTitle.style.margin='0 0 10px';
        relatedPanel.append(relatedTitle);
      }
      if(related)relatedPanel.append(related);
      side.append(relatedPanel);
    }
    layout.append(main,side);
    modalBody.prepend(layout);
    const footer=modalBody.querySelector(':scope > .footnote');
    if(footer)footer.classList.add('v36-detail-footer');
  }

  if(modalBody&&modalOverlay){
    let previewPending=false;
    const schedulePreview=()=>{
      if(previewPending)return;
      previewPending=true;
      queueMicrotask(()=>{
        previewPending=false;
        compactWorkPreview();
      });
    };
    const previewObserver=new MutationObserver(records=>{
      if(records.some(record=>record.type==='childList'||
        (record.type==='attributes'&&record.attributeName==='class'))schedulePreview();
    });
    previewObserver.observe(modalBody,{childList:true});
    previewObserver.observe(modalOverlay,{attributes:true,attributeFilter:['class']});
  }
})();

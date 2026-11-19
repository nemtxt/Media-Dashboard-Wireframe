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
})();
